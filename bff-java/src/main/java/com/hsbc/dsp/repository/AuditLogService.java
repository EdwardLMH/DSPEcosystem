package com.hsbc.dsp.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Append-only audit log service.
 * Records every actor action on every content version.
 * Records are NEVER deleted — only archived to S3 after retention period.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final JdbcTemplate jdbc;

    public AuditLogService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void log(String contentId, String versionId, String actorId,
                    String actorRole, String action, String detail, String contentHash) {
        var logId = UUID.randomUUID().toString();
        jdbc.update("""
            INSERT INTO content_audit_log
              (log_id, content_id, version_id, actor_id, actor_role,
               action, detail, content_hash, occurred_at)
            VALUES (?,?,?::uuid,?,?,?,?,?,NOW())
            """,
            logId, contentId, versionId, actorId, actorRole,
            action, detail, contentHash
        );
        log.info("AUDIT content={} actor={} role={} action={}", contentId, actorId, actorRole, action);
    }

    public List<AuditLogEntry> getLog(String contentId, String fromDate, String toDate) {
        var sql = new StringBuilder("""
            SELECT log_id, content_id, version_id, actor_id, actor_role,
                   action, detail, content_hash, occurred_at
            FROM content_audit_log
            WHERE content_id = ?
            """);
        var params = new java.util.ArrayList<Object>();
        params.add(contentId);

        if (fromDate != null) { sql.append(" AND occurred_at >= ?::timestamptz"); params.add(fromDate); }
        if (toDate   != null) { sql.append(" AND occurred_at <= ?::timestamptz"); params.add(toDate); }
        sql.append(" ORDER BY occurred_at DESC");

        return jdbc.query(sql.toString(), (rs, i) -> new AuditLogEntry(
            rs.getString("log_id"),
            rs.getString("content_id"),
            rs.getString("version_id"),
            rs.getString("actor_id"),
            rs.getString("actor_role"),
            rs.getString("action"),
            rs.getString("detail"),
            rs.getString("content_hash"),
            rs.getTimestamp("occurred_at").toInstant()
        ), params.toArray());
    }

    public record AuditLogEntry(String logId, String contentId, String versionId,
                                 String actorId, String actorRole, String action,
                                 String detail, String contentHash, Instant occurredAt) {}
}
