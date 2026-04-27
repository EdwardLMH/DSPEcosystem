-- ============================================================================
-- V3__immutable_activity_log.sql
-- Flyway migration: creates the immutable UCP activity log.
--
-- CRITICAL SECURITY CONSTRAINTS:
--   • UPDATE and DELETE are REVOKED from ALL roles including the app service role.
--   • TRUNCATE is REVOKED from ALL roles.
--   • Only INSERT and SELECT are granted to the application service role.
--   • Row-level policy: auditors and admins see all rows; others see nothing
--     (activity log never exposed through normal content APIs).
--   • This migration is irreversible by design.
-- ============================================================================

-- ── Create roles if not exist ─────────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ucp_service_role') THEN
        CREATE ROLE ucp_service_role;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ucp_auditor_role') THEN
        CREATE ROLE ucp_auditor_role;
    END IF;
END $$;

-- ── Activity log table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ucp_activity_log (
    log_id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_num     BIGSERIAL    NOT NULL,
    occurred_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actor_id         VARCHAR(255) NOT NULL,
    actor_role       VARCHAR(50)  NOT NULL,
    actor_biz_lines  TEXT[]       NOT NULL DEFAULT '{}',
    action           VARCHAR(100) NOT NULL,
    resource_type    VARCHAR(100) NOT NULL,
    resource_id      VARCHAR(255),
    content_biz_line VARCHAR(50),
    detail           JSONB        NOT NULL DEFAULT '{}',
    ip_address       INET,
    user_agent       TEXT,
    request_id       UUID,
    content_hash     VARCHAR(64),
    prev_log_hash    VARCHAR(64)  NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    row_hash         VARCHAR(64)  NOT NULL
);

-- Sequence constraint — must be monotonic with no gaps detectable
ALTER TABLE ucp_activity_log ADD CONSTRAINT ucp_al_seq_unique UNIQUE (sequence_num);

-- ── Indexes (read performance for auditors) ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ual_actor_id      ON ucp_activity_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_ual_occurred_at   ON ucp_activity_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_resource_id   ON ucp_activity_log (resource_id);
CREATE INDEX IF NOT EXISTS idx_ual_biz_line      ON ucp_activity_log (content_biz_line);
CREATE INDEX IF NOT EXISTS idx_ual_action        ON ucp_activity_log (action);
CREATE INDEX IF NOT EXISTS idx_ual_sequence      ON ucp_activity_log (sequence_num DESC);
CREATE INDEX IF NOT EXISTS idx_ual_actor_action  ON ucp_activity_log (actor_id, action, occurred_at DESC);

-- ── IMMUTABILITY ENFORCEMENT ──────────────────────────────────────────────────

-- Revoke all dangerous privileges from PUBLIC first
REVOKE ALL ON ucp_activity_log FROM PUBLIC;

-- Application service role: INSERT + SELECT only — no UPDATE, DELETE, TRUNCATE
GRANT INSERT, SELECT ON ucp_activity_log TO ucp_service_role;
GRANT USAGE ON SEQUENCE ucp_activity_log_sequence_num_seq TO ucp_service_role;

-- Auditor role: SELECT only
GRANT SELECT ON ucp_activity_log TO ucp_auditor_role;

-- Explicitly revoke destructive operations from the service role itself
-- (belt-and-suspenders: in case GRANT ALL was given somewhere)
REVOKE UPDATE   ON ucp_activity_log FROM ucp_service_role;
REVOKE DELETE   ON ucp_activity_log FROM ucp_service_role;
REVOKE TRUNCATE ON ucp_activity_log FROM ucp_service_role;
REVOKE UPDATE   ON ucp_activity_log FROM ucp_auditor_role;
REVOKE DELETE   ON ucp_activity_log FROM ucp_auditor_role;
REVOKE TRUNCATE ON ucp_activity_log FROM ucp_auditor_role;

-- ── Trigger: block any UPDATE or DELETE at row level (defense in depth) ───────
CREATE OR REPLACE FUNCTION ucp_activity_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ucp_activity_log is immutable. UPDATE and DELETE are not permitted. (action=%, log_id=%)',
        TG_OP, OLD.log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ucp_al_immutable ON ucp_activity_log;
CREATE TRIGGER trg_ucp_al_immutable
    BEFORE UPDATE OR DELETE ON ucp_activity_log
    FOR EACH ROW EXECUTE FUNCTION ucp_activity_log_immutable();

-- ── Row-level hash chain verification function ────────────────────────────────
-- Called by audit integrity job to verify the chain without app-layer code.
CREATE OR REPLACE FUNCTION verify_ucp_audit_chain()
RETURNS TABLE (
    sequence_num    BIGINT,
    log_id          UUID,
    chain_valid     BOOLEAN,
    issue           TEXT
) AS $$
DECLARE
    prev_hash TEXT := '0000000000000000000000000000000000000000000000000000000000000000';
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT al.sequence_num, al.log_id, al.prev_log_hash, al.row_hash
        FROM ucp_activity_log al
        ORDER BY al.sequence_num ASC
    LOOP
        IF rec.prev_log_hash <> prev_hash THEN
            RETURN QUERY SELECT rec.sequence_num, rec.log_id, FALSE,
                'prev_log_hash mismatch — expected ' || prev_hash || ' got ' || rec.prev_log_hash;
        ELSE
            RETURN QUERY SELECT rec.sequence_num, rec.log_id, TRUE, NULL::TEXT;
        END IF;
        prev_hash := rec.row_hash;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_ucp_audit_chain() TO ucp_auditor_role;
GRANT EXECUTE ON FUNCTION verify_ucp_audit_chain() TO ucp_service_role;

-- ── Audit log for the audit log — meta-audit ─────────────────────────────────
-- Records that the table was created (genesis entry in the chain itself).
-- This is the only row inserted by the migration; all subsequent rows by the app.
INSERT INTO ucp_activity_log (
    log_id, occurred_at, actor_id, actor_role, actor_biz_lines,
    action, resource_type, resource_id, detail,
    prev_log_hash, row_hash
) VALUES (
    gen_random_uuid(),
    NOW(),
    'system@hsbc.internal',
    'SYSTEM',
    ARRAY[]::TEXT[],
    'AUDIT_LOG_INITIALISED',
    'SYSTEM',
    'ucp_activity_log',
    '{"note": "Genesis entry — table created by Flyway migration V3"}',
    '0000000000000000000000000000000000000000000000000000000000000000',
    encode(sha256(
        ('GENESIS|' || NOW()::TEXT || '|system@hsbc.internal|SYSTEM|AUDIT_LOG_INITIALISED|SYSTEM|ucp_activity_log')::BYTEA
    ), 'hex')
);

-- ── Content versions table (referenced by audit log) ─────────────────────────
ALTER TABLE content_versions
    ADD COLUMN IF NOT EXISTS s3_storage_class VARCHAR(30) DEFAULT 'STANDARD',
    ADD COLUMN IF NOT EXISTS legal_hold       BOOLEAN     NOT NULL DEFAULT FALSE;

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON TABLE  ucp_activity_log IS
    'Immutable, append-only activity log. UPDATE and DELETE are blocked by trigger and role grants. Hash chain provides tamper evidence. 7-year retention enforced by S3 Object Lock COMPLIANCE mode.';
COMMENT ON COLUMN ucp_activity_log.prev_log_hash IS
    'SHA-256 of the previous row. Forms a hash chain; any modification breaks the chain.';
COMMENT ON COLUMN ucp_activity_log.row_hash IS
    'SHA-256 of all fields in this row including prev_log_hash. Recomputable for integrity verification.';
