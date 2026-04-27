"""
App Store Review Harvesting Service.
Polls AppFollow API every 4 hours, runs NLP classification,
and stores results in BigQuery.
"""

import os
import logging
import requests
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from google.cloud import bigquery

logger = logging.getLogger(__name__)

APPFOLLOW_API_KEY = os.environ["APPFOLLOW_API_KEY"]
APPFOLLOW_BASE = "https://api.appfollow.io"
BQ_PROJECT = "hsbc-dap"
RAW_TABLE = f"{BQ_PROJECT}.dap.app_store_reviews_raw"
CLASSIFIED_TABLE = f"{BQ_PROJECT}.dap.app_store_reviews_classified"

# HSBC app IDs per platform
APP_IDS = {
    "ios":     "1068067849",
    "android": "com.htsu.hsbchongkongretailbanking",
    "huawei":  "C100831591",
}

TOPIC_KEYWORDS = {
    "jade_upgrade":   ["jade", "upgrade", "premier to jade", "wealth"],
    "mortgage":       ["mortgage", "home loan", "property", "repayment"],
    "credit_card":    ["credit card", "cashback", "miles", "rewards"],
    "savings":        ["savings", "interest rate", "time deposit", "fd"],
    "login":          ["login", "sign in", "password", "biometric", "face id"],
    "navigation":     ["can't find", "confusing", "hard to navigate", "ux"],
    "promotion":      ["promotion", "offer", "deal", "discount", "campaign"],
}


@dataclass
class Review:
    review_id: str
    platform: str
    rating: int
    review_text: str
    review_date: str
    app_version: str


@dataclass
class ClassifiedReview:
    review_id: str
    platform: str
    rating: int
    review_text: str
    review_date: str
    sentiment: str
    topic_tags: list
    content_id: str | None
    classified_at: str


class AppStoreHarvester:
    def __init__(self):
        self.bq = bigquery.Client(project=BQ_PROJECT)

    def run(self):
        since = (datetime.utcnow() - timedelta(hours=4)).isoformat()
        all_reviews = []
        for platform, app_id in APP_IDS.items():
            reviews = self._fetch_reviews(platform, app_id, since)
            all_reviews.extend(reviews)
            logger.info("Fetched %d reviews from %s", len(reviews), platform)

        new_reviews = self._deduplicate(all_reviews)
        self._store_raw(new_reviews)

        classified = [self._classify(r) for r in new_reviews]
        self._store_classified(classified)
        logger.info("Harvested and classified %d new reviews.", len(classified))

    def _fetch_reviews(self, platform: str, app_id: str, since: str) -> list[Review]:
        try:
            resp = requests.get(
                f"{APPFOLLOW_BASE}/reviews",
                params={"app_id": app_id, "from": since, "size": 200},
                headers={"X-API-Key": APPFOLLOW_API_KEY},
                timeout=15,
            )
            resp.raise_for_status()
            return [
                Review(
                    review_id=r["id"],
                    platform=platform,
                    rating=r["rating"],
                    review_text=r["body"],
                    review_date=r["date"],
                    app_version=r.get("version", ""),
                )
                for r in resp.json().get("reviews", [])
            ]
        except Exception as e:
            logger.error("AppFollow fetch failed for %s: %s", platform, e)
            return []

    def _deduplicate(self, reviews: list[Review]) -> list[Review]:
        existing = {
            row["review_id"]
            for row in self.bq.query(
                f"SELECT review_id FROM `{RAW_TABLE}` WHERE review_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)"
            ).result()
        }
        return [r for r in reviews if r.review_id not in existing]

    def _classify(self, review: Review) -> ClassifiedReview:
        text_lower = review.review_text.lower()

        # Simple keyword-based sentiment (replace with BERT model in production)
        positive_words = ["great", "excellent", "love", "easy", "smooth", "helpful", "fast"]
        negative_words = ["terrible", "awful", "crash", "broken", "slow", "confusing", "error"]
        pos = sum(1 for w in positive_words if w in text_lower)
        neg = sum(1 for w in negative_words if w in text_lower)
        if review.rating >= 4:
            sentiment = "positive"
        elif review.rating <= 2:
            sentiment = "negative"
        elif pos > neg:
            sentiment = "positive"
        elif neg > pos:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        topic_tags = [
            topic for topic, keywords in TOPIC_KEYWORDS.items()
            if any(kw in text_lower for kw in keywords)
        ]

        # Map primary topic to a contentId (simplified lookup)
        content_id = topic_tags[0] if topic_tags else None

        return ClassifiedReview(
            review_id=review.review_id,
            platform=review.platform,
            rating=review.rating,
            review_text=review.review_text,
            review_date=review.review_date,
            sentiment=sentiment,
            topic_tags=topic_tags,
            content_id=content_id,
            classified_at=datetime.utcnow().isoformat(),
        )

    def _store_raw(self, reviews: list[Review]):
        if not reviews:
            return
        errors = self.bq.insert_rows_json(RAW_TABLE, [asdict(r) for r in reviews])
        if errors:
            logger.error("Raw storage errors: %s", errors)

    def _store_classified(self, reviews: list[ClassifiedReview]):
        if not reviews:
            return
        errors = self.bq.insert_rows_json(CLASSIFIED_TABLE, [asdict(r) for r in reviews])
        if errors:
            logger.error("Classified storage errors: %s", errors)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    AppStoreHarvester().run()
