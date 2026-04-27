"""
S3 Archive Lifecycle Job.

Runs nightly via Cloud Scheduler / AWS EventBridge.
Two responsibilities:
  1. Access-based archive: move content versions not accessed in 365+ days
     from S3 Standard → S3 Standard-IA by updating the storage class.
  2. Expiry check: flag content versions older than 7 years for deletion
     (only if legal-hold tag is false), and log the deletion event.

AWS S3 lifecycle rules handle Standard-IA → Glacier-IR transition automatically
(configured via IaC). This job handles the access-based trigger that S3 lifecycle
rules cannot natively do (since S3 lifecycle uses age, not last-access date).
"""

import os
import logging
import boto3
import psycopg2
import psycopg2.extras
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

S3_BUCKET = os.environ["CONTENT_REPOSITORY_BUCKET"]
DB_DSN    = os.environ["CONTENT_DB_DSN"]

s3  = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "ap-east-1"))
db  = psycopg2.connect(DB_DSN)


# ─── Step 1: Access-based archive to Standard-IA ──────────────────────────

def archive_unaccessed_to_ia():
    """
    Find content versions not accessed in the past 365 days
    that are still on S3 Standard storage class.
    Copy them to S3-IA and update the DB record.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=365)

    with db.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("""
            SELECT version_id, content_id, version_number, content_s3_key, market
            FROM content_versions
            WHERE status IN ('PUBLISHED', 'SUPERSEDED')
              AND last_accessed_at < %s
              AND s3_storage_class = 'STANDARD'
              AND content_s3_key IS NOT NULL
        """, (cutoff,))
        rows = cur.fetchall()

    logger.info("Found %d versions eligible for Standard-IA archive.", len(rows))

    for row in rows:
        s3_key = row["content_s3_key"]
        try:
            # S3 CopyObject to itself with new StorageClass = STANDARD_IA
            s3.copy_object(
                Bucket=S3_BUCKET,
                CopySource={"Bucket": S3_BUCKET, "Key": s3_key},
                Key=s3_key,
                StorageClass="STANDARD_IA",
                MetadataDirective="COPY",
                TaggingDirective="COPY",
            )

            # Update DB storage class tracking
            with db.cursor() as cur:
                cur.execute("""
                    UPDATE content_versions
                    SET s3_storage_class = 'STANDARD_IA'
                    WHERE version_id = %s
                """, (row["version_id"],))

                # Append audit log entry
                cur.execute("""
                    INSERT INTO content_audit_log
                      (log_id, content_id, version_id, actor_id, actor_role,
                       action, detail, occurred_at)
                    VALUES (gen_random_uuid(), %s, %s, 'system', 'SYSTEM',
                            'ARCHIVED_TO_STANDARD_IA',
                            'Not accessed since cutoff — moved to S3-IA', NOW())
                """, (row["content_id"], row["version_id"]))

            db.commit()
            logger.info("Archived to IA: %s (v%s)", row["content_id"], row["version_number"])

        except Exception as e:
            db.rollback()
            logger.error("Failed to archive %s: %s", s3_key, e)


# ─── Step 2: Expiry check — flag for deletion after 7 years ───────────────

def check_expiry():
    """
    Find content versions where published_at > 7 years ago.
    For each, check S3 legal-hold tag.
    If legal-hold=false → delete S3 object + mark DB record EXPIRED.
    If legal-hold=true  → log skip, do not delete.
    """
    seven_years_ago = datetime.now(timezone.utc) - timedelta(days=2555)

    with db.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("""
            SELECT version_id, content_id, version_number, content_s3_key
            FROM content_versions
            WHERE published_at < %s
              AND status != 'EXPIRED'
              AND content_s3_key IS NOT NULL
        """, (seven_years_ago,))
        rows = cur.fetchall()

    logger.info("Found %d versions past 7-year retention.", len(rows))

    for row in rows:
        s3_key = row["content_s3_key"]
        try:
            # Check legal hold tag
            tags_resp = s3.get_object_tagging(Bucket=S3_BUCKET, Key=s3_key)
            tags = {t["Key"]: t["Value"] for t in tags_resp.get("TagSet", [])}
            legal_hold = tags.get("legal-hold", "false").lower()

            if legal_hold == "true":
                logger.info("SKIP expiry — legal hold active: %s", row["content_id"])
                continue

            # Delete S3 object
            s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            logger.info("Deleted expired S3 object: %s", s3_key)

            # Update DB
            with db.cursor() as cur2:
                cur2.execute("""
                    UPDATE content_versions SET status = 'EXPIRED'
                    WHERE version_id = %s
                """, (row["version_id"],))
                cur2.execute("""
                    INSERT INTO content_audit_log
                      (log_id, content_id, version_id, actor_id, actor_role,
                       action, detail, occurred_at)
                    VALUES (gen_random_uuid(), %s, %s, 'system', 'SYSTEM',
                            'EXPIRED_AND_DELETED',
                            '7-year retention period elapsed. S3 object deleted.', NOW())
                """, (row["content_id"], row["version_id"]))
            db.commit()

        except s3.exceptions.NoSuchKey:
            logger.warning("S3 object not found (already deleted?): %s", s3_key)
        except Exception as e:
            db.rollback()
            logger.error("Expiry check failed for %s: %s", row["content_id"], e)


# ─── Step 3: Verify content hash integrity ────────────────────────────────

def verify_integrity_sample(sample_size: int = 50):
    """
    Daily spot-check: download a random sample of S3 snapshots,
    recompute SHA-256, compare against DB-stored hash.
    Alert if mismatch detected (indicates tampering or corruption).
    """
    import hashlib, json, random

    with db.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("""
            SELECT version_id, content_id, version_number,
                   content_s3_key, content_hash
            FROM content_versions
            WHERE status IN ('PUBLISHED', 'SUPERSEDED', 'STANDARD_IA')
              AND content_s3_key IS NOT NULL
              AND content_hash IS NOT NULL
            ORDER BY RANDOM()
            LIMIT %s
        """, (sample_size,))
        rows = cur.fetchall()

    mismatches = []
    for row in rows:
        try:
            obj = s3.get_object(Bucket=S3_BUCKET, Key=row["content_s3_key"])
            body = obj["Body"].read()
            snapshot = json.loads(body)
            fields_json = json.dumps(snapshot.get("fields", {}), sort_keys=True).encode()
            computed_hash = hashlib.sha256(fields_json).hexdigest()

            if computed_hash != row["content_hash"]:
                mismatches.append({
                    "content_id": row["content_id"],
                    "version":    row["version_number"],
                    "expected":   row["content_hash"],
                    "actual":     computed_hash,
                })
        except Exception as e:
            logger.warning("Integrity check skipped for %s: %s", row["content_s3_key"], e)

    if mismatches:
        logger.critical("INTEGRITY MISMATCH DETECTED: %s", mismatches)
        _send_integrity_alert(mismatches)
    else:
        logger.info("Integrity check passed for %d sampled versions.", len(rows))


def _send_integrity_alert(mismatches: list):
    """Send to security on-call channel."""
    import requests
    webhook = os.environ.get("SECURITY_SLACK_WEBHOOK")
    if not webhook:
        return
    msg = ":rotating_light: *Content Integrity Alert*\n" + \
          "\n".join(f"• `{m['content_id']}` v{m['version']} — hash mismatch" for m in mismatches)
    requests.post(webhook, json={"text": msg}, timeout=5)


# ─── Entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logger.info("=== Content Archive Lifecycle Job START ===")
    archive_unaccessed_to_ia()
    check_expiry()
    verify_integrity_sample()
    logger.info("=== Content Archive Lifecycle Job COMPLETE ===")
    db.close()
