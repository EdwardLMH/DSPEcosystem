package com.hsbc.dsp.security.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hsbc.dsp.security.ad.AdGroupResolver.BizLine;
import com.hsbc.dsp.security.ad.AdGroupResolver.UcpUserContext;
import com.hsbc.dsp.security.rbac.BizLineAccessGuard.ContentAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Immutable, tamper-evident activity logger.
 *
 * Every log entry is:
 *  1. Inserted into PostgreSQL (append-only — UPDATE/DELETE revoked at DB level)
 *  2. Written to S3 with Object Lock COMPLIANCE mode (7-year WORM retention)
 *  3. Hash-chained to the previous entry for tamper detection
 *  4. Never modifiable through any UCP API endpoint — no matter the role
 *
 * This class is the ONLY place that writes to ucp_activity_log.
 * All other services call this class — they never write directly.
 */
@Service
public class ImmutableAuditLogger {

    private static final Logger log = LoggerFactory.getLogger(ImmutableAuditLogger.class);

    private final JdbcTemplate jdbc;
    private final S3Client s3;
    private final ObjectMapper mapper;
    private final AuditProperties props;

    // Genesis hash — seed for the first row in the chain
    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    public ImmutableAuditLogger(JdbcTemplate jdbc, S3Client s3,
                                 ObjectMapper mapper, AuditProperties props) {
        this.jdbc   = jdbc;
        this.s3     = s3;
        this.mapper = mapper;
        this.props  = props;
    }

    // ── Public logging API ────────────────────────────────────────────────────

    public void log(UcpUserContext actor, String action, String resourceType,
                    String resourceId, BizLine contentBizLine,
                    Map<String, Object> detail, String contentHash,
                    String requestId, String ipAddress) {
        insertEntry(actor, action, resourceType, resourceId,
                    contentBizLine, detail, contentHash, requestId, ipAddress);
    }

    public void logAccessDenied(UcpUserContext caller, BizLine contentBizLine,
                                 ContentAction action, String resourceId, String reason) {
        insertEntry(caller, "ACCESS_DENIED", "CONTENT", resourceId, contentBizLine,
            Map.of("attemptedAction", action.name(),
                   "callerBizLines", caller.authorBizLines().toString(),
                   "contentBizLine", contentBizLine != null ? contentBizLine.name() : "UNKNOWN",
                   "reason", reason),
            null, null, null);
    }

    public void logAdminOverride(UcpUserContext admin, BizLine contentBizLine,
                                  ContentAction action, String resourceId, String justification) {
        insertEntry(admin, "ADMIN_OVERRIDE", "CONTENT", resourceId, contentBizLine,
            Map.of("overriddenAction", action.name(), "justification", justification),
            null, null, null);
    }

    public void logContentAction(UcpUserContext actor, String action,
                                  String contentId, BizLine bizLine,
                                  String contentHash, String requestId, String ip) {
        insertEntry(actor, action, "CONTENT", contentId, bizLine,
            Map.of(), contentHash, requestId, ip);
    }

    public void logLogin(UcpUserContext actor, String ip, String userAgent) {
        insertEntry(actor, "LOGIN", "SYSTEM", null, null,
            Map.of("userAgent", userAgent != null ? userAgent : ""),
            null, null, ip);
    }

    public void logAuditExport(UcpUserContext actor, Map<String, Object> filterParams) {
        insertEntry(actor, "AUDIT_LOG_EXPORTED", "SYSTEM", null, null,
            filterParams, null, null, null);
    }

    // ── Core insert logic ─────────────────────────────────────────────────────

    private void insertEntry(UcpUserContext actor, String action, String resourceType,
                              String resourceId, BizLine contentBizLine,
                              Map<String, Object> detail, String contentHash,
                              String requestId, String ipAddress) {
        try {
            var logId      = UUID.randomUUID().toString();
            var occurredAt = Instant.now();
            var prevHash   = fetchLastRowHash();
            var detailJson = mapper.writeValueAsString(detail != null ? detail : Map.of());
            var bizLineStr = contentBizLine != null ? contentBizLine.name() : null;
            var bizLines   = actor != null
                ? actor.allAccessibleBizLines().stream().map(Enum::name).toArray(String[]::new)
                : new String[]{"UNKNOWN"};

            // Compute row hash (all fields → SHA-256)
            var rowData = String.join("|",
                logId, occurredAt.toString(),
                actor != null ? actor.userId() : "SYSTEM",
                actor != null ? actor.highestRole().name() : "SYSTEM",
                action, resourceType,
                resourceId != null ? resourceId : "",
                bizLineStr != null ? bizLineStr : "",
                detailJson,
                contentHash != null ? contentHash : "",
                prevHash
            );
            var rowHash = sha256(rowData);

            // INSERT — no UPDATE/DELETE ever executes on this table
            jdbc.update("""
                INSERT INTO ucp_activity_log (
                  log_id, occurred_at, actor_id, actor_role, actor_biz_lines,
                  action, resource_type, resource_id, content_biz_line,
                  detail, ip_address, request_id, content_hash, prev_log_hash, row_hash
                ) VALUES (
                  ?::uuid, ?, ?, ?, ?,
                  ?, ?, ?, ?,
                  ?::jsonb, ?::inet, ?::uuid, ?, ?, ?
                )
                """,
                logId, occurredAt.toString(),
                actor != null ? actor.userId() : "SYSTEM",
                actor != null ? actor.highestRole().name() : "SYSTEM",
                jdbc.getDataSource() != null
                    ? createSqlArray(bizLines) : String.join(",", bizLines),
                action, resourceType, resourceId, bizLineStr,
                detailJson, ipAddress, requestId, contentHash, prevHash, rowHash
            );

            // Async write to S3 WORM (non-blocking — DB insert is the authoritative record)
            CompletableFuture.runAsync(() -> writeToS3Worm(
                logId, occurredAt, actor, action, resourceType,
                resourceId, bizLineStr, detail, contentHash, prevHash, rowHash
            ));

            log.debug("AUDIT [{}] actor={} action={} resource={}",
                logId, actor != null ? actor.userId() : "SYSTEM", action, resourceId);

        } catch (Exception e) {
            // Log to application log but never swallow — audit failures must be visible
            log.error("AUDIT LOG WRITE FAILURE — action={} actor={}: {}",
                action, actor != null ? actor.userId() : "SYSTEM", e.getMessage(), e);
            throw new AuditLogException("Audit log write failed: " + e.getMessage(), e);
        }
    }

    private String fetchLastRowHash() {
        try {
            var result = jdbc.queryForObject(
                "SELECT row_hash FROM ucp_activity_log ORDER BY sequence_num DESC LIMIT 1",
                String.class);
            return result != null ? result : GENESIS_HASH;
        } catch (Exception e) {
            return GENESIS_HASH;
        }
    }

    private void writeToS3Worm(String logId, Instant occurredAt, UcpUserContext actor,
                                 String action, String resourceType, String resourceId,
                                 String bizLine, Map<String, Object> detail,
                                 String contentHash, String prevHash, String rowHash) {
        try {
            var entry = new java.util.LinkedHashMap<String, Object>();
            entry.put("logId", logId);
            entry.put("occurredAt", occurredAt.toString());
            entry.put("actorId", actor != null ? actor.userId() : "SYSTEM");
            entry.put("actorRole", actor != null ? actor.highestRole().name() : "SYSTEM");
            entry.put("action", action);
            entry.put("resourceType", resourceType);
            entry.put("resourceId", resourceId);
            entry.put("contentBizLine", bizLine);
            entry.put("detail", detail);
            entry.put("contentHash", contentHash);
            entry.put("prevLogHash", prevHash);
            entry.put("rowHash", rowHash);

            var json  = mapper.writeValueAsBytes(entry);
            var date  = occurredAt.toString().substring(0, 10);
            var key   = String.format("activity-log/%s/%s.json",
                date.replace("-", "/"), logId);

            s3.putObject(PutObjectRequest.builder()
                    .bucket(props.wormBucket())
                    .key(key)
                    .contentType("application/json")
                    .serverSideEncryption(ServerSideEncryption.AES256)
                    // Object Lock COMPLIANCE — no one can delete before retention period
                    .objectLockMode(ObjectLockMode.COMPLIANCE)
                    .objectLockRetainUntilDate(occurredAt.plusSeconds(
                        7L * 365 * 24 * 3600)) // 7 years
                    .build(),
                RequestBody.fromBytes(json));

        } catch (Exception e) {
            log.error("S3 WORM write failed for logId={}: {}", logId, e.getMessage());
            // Non-fatal — PostgreSQL is the authoritative store. S3 is the backup WORM.
        }
    }

    private String sha256(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            var bytes  = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 failed", e);
        }
    }

    private Object createSqlArray(String[] values) {
        // PostgreSQL TEXT[] array — handled by JDBC
        return values;
    }

    public static class AuditLogException extends RuntimeException {
        public AuditLogException(String msg, Throwable cause) { super(msg, cause); }
    }

    public record AuditProperties(String wormBucket) {}
}
