"""
Content Performance Scoring Engine.
Runs every 6 hours via Cloud Composer. Joins all DAP signals on contentId
and computes a unified Content Performance Score (CPS) per content piece.
"""

import logging
from dataclasses import dataclass
from google.cloud import bigquery

logger = logging.getLogger(__name__)

BQ_PROJECT = "hsbc-dap"
OUTPUT_TABLE = f"{BQ_PROJECT}.dap.content_performance_scores"

# CPS signal weights — must sum to 1.0
WEIGHTS = {
    "cta_click_rate":      0.20,
    "conversion_rate":     0.30,
    "journey_completion":  0.15,
    "nps_delta":           0.15,
    "aeo_citation_share":  0.10,
    "app_store_sentiment": 0.05,
    "scroll_depth_pct":    0.05,
}

SCORE_BANDS = [
    (80, "STAR"),
    (60, "GOOD"),
    (40, "REVIEW"),
    (0,  "URGENT"),
]


@dataclass
class ContentScore:
    content_id: str
    cps_score: float
    band: str
    cta_click_rate: float
    conversion_rate: float
    journey_completion: float
    nps_delta: float
    aeo_citation_share: float
    app_store_sentiment: float
    scroll_depth_pct: float
    computed_at: str
    trend: str  # UP / DOWN / STABLE


class ContentScoringEngine:
    def __init__(self):
        self.bq = bigquery.Client(project=BQ_PROJECT)

    def run(self):
        signals = self._fetch_signals()
        previous = self._fetch_previous_scores()
        scores = [self._compute(row, previous) for row in signals]
        self._store(scores)
        logger.info("Scoring complete. %d content pieces scored.", len(scores))
        return scores

    def _fetch_signals(self) -> list[dict]:
        query = """
        WITH clicks AS (
            SELECT content_id,
                   SAFE_DIVIDE(COUNTIF(event_type = 'cta_clicked'), COUNTIF(event_type = 'impression')) AS cta_click_rate,
                   SAFE_DIVIDE(COUNTIF(event_type = 'conversion'), COUNTIF(event_type = 'cta_clicked')) AS conversion_rate,
                   AVG(IF(event_type = 'scroll', CAST(properties.scroll_depth AS FLOAT64), NULL)) AS scroll_depth_pct
            FROM `hsbc-dap.dap.clickstream_events`
            WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            GROUP BY content_id
        ),
        journeys AS (
            SELECT content_id,
                   SAFE_DIVIDE(COUNTIF(completed), COUNT(*)) AS journey_completion
            FROM `hsbc-dap.dap.journey_events`
            WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            GROUP BY content_id
        ),
        surveys AS (
            SELECT content_id,
                   AVG(score) - 7.0 AS nps_delta  -- 7.0 = segment baseline NPS
            FROM `hsbc-dap.dap.survey_responses`
            WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
            GROUP BY content_id
        ),
        aeo AS (
            SELECT url_cited AS content_id,
                   SAFE_DIVIDE(COUNTIF(hsbc_cited), COUNT(*)) AS aeo_citation_share
            FROM `hsbc-dap.dap.aeo_probe_results`
            WHERE probe_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
            GROUP BY url_cited
        ),
        sentiment AS (
            SELECT content_id,
                   SAFE_DIVIDE(COUNTIF(sentiment = 'positive'), COUNT(*)) AS app_store_sentiment
            FROM `hsbc-dap.dap.app_store_reviews_classified`
            WHERE review_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
            GROUP BY content_id
        )
        SELECT
            c.content_id,
            COALESCE(c.cta_click_rate, 0)      AS cta_click_rate,
            COALESCE(c.conversion_rate, 0)     AS conversion_rate,
            COALESCE(j.journey_completion, 0)  AS journey_completion,
            COALESCE(SAFE_DIVIDE(s.nps_delta + 10, 20), 0.5) AS nps_delta,
            COALESCE(a.aeo_citation_share, 0)  AS aeo_citation_share,
            COALESCE(se.app_store_sentiment, 0.5) AS app_store_sentiment,
            COALESCE(c.scroll_depth_pct, 0)    AS scroll_depth_pct
        FROM clicks c
        LEFT JOIN journeys j USING (content_id)
        LEFT JOIN surveys s USING (content_id)
        LEFT JOIN aeo a USING (content_id)
        LEFT JOIN sentiment se USING (content_id)
        """
        return [dict(row) for row in self.bq.query(query).result()]

    def _fetch_previous_scores(self) -> dict[str, float]:
        query = f"""
        SELECT content_id, cps_score
        FROM `{OUTPUT_TABLE}`
        WHERE computed_at = (SELECT MAX(computed_at) FROM `{OUTPUT_TABLE}`)
        """
        return {row["content_id"]: row["cps_score"]
                for row in self.bq.query(query).result()}

    def _compute(self, row: dict, previous: dict[str, float]) -> ContentScore:
        raw = sum(row[signal] * weight for signal, weight in WEIGHTS.items())
        score = round(min(max(raw * 100, 0), 100), 1)
        band = next(b for threshold, b in SCORE_BANDS if score >= threshold)

        prev = previous.get(row["content_id"])
        if prev is None:
            trend = "NEW"
        elif score > prev + 2:
            trend = "UP"
        elif score < prev - 2:
            trend = "DOWN"
        else:
            trend = "STABLE"

        from datetime import datetime
        return ContentScore(
            content_id=row["content_id"],
            cps_score=score,
            band=band,
            cta_click_rate=row["cta_click_rate"],
            conversion_rate=row["conversion_rate"],
            journey_completion=row["journey_completion"],
            nps_delta=row["nps_delta"],
            aeo_citation_share=row["aeo_citation_share"],
            app_store_sentiment=row["app_store_sentiment"],
            scroll_depth_pct=row["scroll_depth_pct"],
            computed_at=datetime.utcnow().isoformat(),
            trend=trend,
        )

    def _store(self, scores: list[ContentScore]):
        from dataclasses import asdict
        rows = [asdict(s) for s in scores]
        errors = self.bq.insert_rows_json(OUTPUT_TABLE, rows)
        if errors:
            logger.error("BigQuery insert errors: %s", errors)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    ContentScoringEngine().run()
