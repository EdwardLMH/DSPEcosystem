"""
Feedback Loop Service.
Reads latest CPS scores from BigQuery and pushes score badges,
recommendations, and alerts to the Stripes CMS and Slack.
"""

import os
import logging
import requests
from dataclasses import dataclass
from google.cloud import bigquery

logger = logging.getLogger(__name__)

CMS_API_BASE = os.environ.get("STRIPES_CMS_URL", "https://cms.hsbc.internal")
CMS_API_KEY = os.environ["STRIPES_API_KEY"]
SLACK_WEBHOOK = os.environ.get("SLACK_WEBHOOK_URL", "")
BQ_PROJECT = "hsbc-dap"


@dataclass
class Recommendation:
    content_id: str
    recommendation_type: str
    message: str
    action_url: str


RECOMMENDATION_RULES = [
    {
        "condition": lambda r: r["cta_click_rate"] < 0.03,
        "type": "low_ctr",
        "message": "CTR is below 3% — consider changing CTA copy from 'Learn More' to a benefit-led phrase like 'See Your Benefits'.",
        "action_url": "/cms/content/{content_id}/edit",
    },
    {
        "condition": lambda r: r["aeo_citation_share"] < 0.1,
        "type": "aeo_gap",
        "message": "This page is not being cited by LLM engines. Add a FAQPage schema block and ensure rates are in structured fields.",
        "action_url": "/cms/content/{content_id}/aeo",
    },
    {
        "condition": lambda r: r["journey_completion"] < 0.4,
        "type": "journey_drop",
        "message": "Journey completion is below 40%. Review the step where most users drop off in the Funnel dashboard.",
        "action_url": "/looker/dashboards/journey-funnel?content_id={content_id}",
    },
    {
        "condition": lambda r: r["app_store_sentiment"] < 0.4,
        "type": "negative_sentiment",
        "message": "App store reviews mentioning this content are predominantly negative. Review recent reviews for specific pain points.",
        "action_url": "/looker/dashboards/app-store-sentiment?content_id={content_id}",
    },
]


class FeedbackLoopService:
    def __init__(self):
        self.bq = bigquery.Client(project=BQ_PROJECT)

    def run(self):
        scores = self._fetch_latest_scores()
        for score in scores:
            recs = self._generate_recommendations(score)
            self._push_to_cms(score, recs)
            if score["band"] == "URGENT":
                self._send_slack_alert(score, recs)
        logger.info("Feedback loop complete. %d content pieces updated.", len(scores))

    def _fetch_latest_scores(self) -> list[dict]:
        query = """
        SELECT *
        FROM `hsbc-dap.dap.content_performance_scores`
        WHERE computed_at = (SELECT MAX(computed_at) FROM `hsbc-dap.dap.content_performance_scores`)
        """
        return [dict(row) for row in self.bq.query(query).result()]

    def _generate_recommendations(self, score: dict) -> list[Recommendation]:
        recs = []
        for rule in RECOMMENDATION_RULES:
            if rule["condition"](score):
                recs.append(Recommendation(
                    content_id=score["content_id"],
                    recommendation_type=rule["type"],
                    message=rule["message"],
                    action_url=rule["action_url"].format(content_id=score["content_id"]),
                ))
        return recs[:3]  # max 3 recommendations per content piece

    def _push_to_cms(self, score: dict, recs: list[Recommendation]):
        payload = {
            "contentId": score["content_id"],
            "cpsScore": score["cps_score"],
            "band": score["band"],
            "trend": score["trend"],
            "recommendations": [
                {"type": r.recommendation_type, "message": r.message, "actionUrl": r.action_url}
                for r in recs
            ],
        }
        try:
            resp = requests.post(
                f"{CMS_API_BASE}/api/management/content-scores",
                json=payload,
                headers={"Authorization": f"Bearer {CMS_API_KEY}"},
                timeout=10,
            )
            resp.raise_for_status()
        except Exception as e:
            logger.error("Failed to push score to CMS for %s: %s", score["content_id"], e)

    def _send_slack_alert(self, score: dict, recs: list[Recommendation]):
        if not SLACK_WEBHOOK:
            return
        rec_text = "\n".join(f"• {r.message}" for r in recs) or "No specific recommendations."
        message = {
            "text": (
                f":red_circle: *URGENT Content Alert*\n"
                f"*Content:* `{score['content_id']}`\n"
                f"*CPS Score:* {score['cps_score']}/100 ({score['band']})\n"
                f"*Trend:* {score['trend']}\n"
                f"*Recommendations:*\n{rec_text}\n"
                f"<{CMS_API_BASE}/cms/content/{score['content_id']}|Open in CMS>"
            )
        }
        try:
            requests.post(SLACK_WEBHOOK, json=message, timeout=5)
        except Exception as e:
            logger.error("Slack alert failed: %s", e)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    FeedbackLoopService().run()
