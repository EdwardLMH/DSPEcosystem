"""
Survey Ingestion Service.
Receives survey responses from Qualtrics webhooks and in-app SDUI SurveyWidget,
stores them in BigQuery mapped to journeyId and contentId.
"""

import os
import logging
from dataclasses import dataclass, asdict
from datetime import datetime
from flask import Flask, request, jsonify, abort
from google.cloud import bigquery
import hmac, hashlib

logger = logging.getLogger(__name__)

BQ_PROJECT = "hsbc-dap"
SURVEY_TABLE = f"{BQ_PROJECT}.dap.survey_responses"
QUALTRICS_SECRET = os.environ.get("QUALTRICS_WEBHOOK_SECRET", "")

app = Flask(__name__)
bq = bigquery.Client(project=BQ_PROJECT)


@dataclass
class SurveyResponse:
    response_id: str
    source_type: str   # in_app_nps | email_csat | relationship | exit_intent
    score: int
    response_text: str | None
    journey_id: str | None
    content_id: str | None
    segment_id: str | None
    user_id_hash: str | None
    locale: str | None
    created_at: str


@app.route("/dap/v1/survey-response", methods=["POST"])
def ingest_survey():
    data = request.get_json(force=True)
    if not data:
        abort(400, "Missing JSON body")

    # Idempotency: skip if response_id already stored
    response_id = data.get("responseId") or data.get("response_id", "")
    if _already_exists(response_id):
        return jsonify({"status": "duplicate", "responseId": response_id}), 200

    response = SurveyResponse(
        response_id=response_id,
        source_type=data.get("sourceType", "unknown"),
        score=int(data.get("score", 0)),
        response_text=data.get("responseText"),
        journey_id=data.get("journeyId"),
        content_id=data.get("contentId"),
        segment_id=data.get("segmentId"),
        user_id_hash=data.get("userId_hash"),
        locale=data.get("locale"),
        created_at=datetime.utcnow().isoformat(),
    )

    errors = bq.insert_rows_json(SURVEY_TABLE, [asdict(response)])
    if errors:
        logger.error("BigQuery insert error: %s", errors)
        abort(500, "Storage error")

    return jsonify({"status": "ok", "responseId": response_id}), 201


@app.route("/dap/v1/qualtrics-webhook", methods=["POST"])
def qualtrics_webhook():
    # Verify Qualtrics HMAC-SHA256 signature
    signature = request.headers.get("X-Qualtrics-Signature", "")
    body = request.get_data()
    expected = hmac.new(QUALTRICS_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        abort(401, "Invalid signature")

    data = request.get_json(force=True)
    response_id = data.get("responseId", "")

    # Map Qualtrics response to internal schema
    response = SurveyResponse(
        response_id=response_id,
        source_type="email_csat",
        score=int(data.get("values", {}).get("QID1", 0)),
        response_text=data.get("values", {}).get("QID2"),
        journey_id=data.get("embeddedData", {}).get("journeyId"),
        content_id=data.get("embeddedData", {}).get("contentId"),
        segment_id=data.get("embeddedData", {}).get("segmentId"),
        user_id_hash=None,  # no PII from Qualtrics
        locale=data.get("embeddedData", {}).get("locale"),
        created_at=datetime.utcnow().isoformat(),
    )

    bq.insert_rows_json(SURVEY_TABLE, [asdict(response)])
    return jsonify({"status": "ok"}), 200


def _already_exists(response_id: str) -> bool:
    if not response_id:
        return False
    query = f"""
    SELECT COUNT(*) AS cnt
    FROM `{SURVEY_TABLE}`
    WHERE response_id = '{response_id}'
    """
    result = list(bq.query(query).result())
    return result[0]["cnt"] > 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(host="0.0.0.0", port=8080)
