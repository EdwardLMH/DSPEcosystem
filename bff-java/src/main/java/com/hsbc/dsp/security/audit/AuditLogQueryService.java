package com.hsbc.dsp.security.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.util.*;

/**
 * Query service for audit log — read-only.
 * Also responsible for nightly chain integrity verification.
 */
@Service
public class AuditLogQueryService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogQueryService.class);
    private final JdbcTemplate jdbc;

    public AuditLogQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AuditLogController.AuditLogResponse query(
            AuditLogController.AuditLogFilter filter, int page, int size) {

        var where = new ArrayList<String>();
        var params = new ArrayList<Object>();

        if (filter.actorId()   != null) { where.add("actor_id = ?");         params.add(filter.actorId()); }
        if (filter.bizLine()   != null) { where.add("content_biz_line = ?"); params.add(filter.bizLine()); }
        if (filter.action()    != null) { where.add("action = ?");            params.add(filter.action()); }
        if (filter.resourceId()!= null) { where.add("resource_id = ?");      params.add(filter.resourceId()); }
        if (filter.fromDate()  != null) { where.add("occurred_at >= ?::timestamptz"); params.add(filter.fromDate()); }
        if (filter.toDate()    != null) { where.add("occurred_at <= ?::timestamptz"); params.add(filter.toDate()); }

        var whereClause = where.isEmpty() ? "" : "WHERE " + String.join(" AND ", where);

        var countParams = new ArrayList<>(params);
        long total = jdbc.queryForObject(
            "SELECT COUNT(*) FROM ucp_activity_log " + whereClause,
            Long.class, countParams.toArray());

        var queryParams = new ArrayList<>(params);
        queryParams.add(size);
        queryParams.add((long) page * size);

        var entries = jdbc.query(
            "SELECT * FROM ucp_activity_log " + whereClause +
            " ORDER BY sequence_num DESC LIMIT ? OFFSET ?",
            (rs, i) -> new AuditLogController.AuditLogEntry(
                rs.getString("log_id"),
                rs.getLong("sequence_num"),
                rs.getTimestamp("occurred_at").toInstant().toString(),
                rs.getString("actor_id"),
                rs.getString("actor_role"),
                (String[]) rs.getArray("actor_biz_lines").getArray(),
                rs.getString("action"),
                rs.getString("resource_type"),
                rs.getString("resource_id"),
                rs.getString("content_biz_line"),
                rs.getObject("detail"),
                rs.getString("ip_address"),
                rs.getString("content_hash"),
                rs.getString("prev_log_hash"),
                rs.getString("row_hash")
            ),
            queryParams.toArray()
        );

        return new AuditLogController.AuditLogResponse(entries, total, page, size);
    }

    /**
     * Verifies the hash chain integrity of the entire audit log.
     * Re-computes each row's hash and checks prev_log_hash linkage.
     * Called nightly by scheduled job. Also callable on demand by auditors.
     */
    public AuditLogController.ChainIntegrityResult verifyChainIntegrity() {
        var brokenAt = new ArrayList<String>();
        long count = 0;
        String prevHash = ImmutableAuditLogger.GENESIS_HASH_VALUE;

        var rows = jdbc.queryForList(
            "SELECT sequence_num, log_id, occurred_at, actor_id, actor_role, " +
            "action, resource_type, resource_id, content_biz_line, detail, " +
            "content_hash, prev_log_hash, row_hash " +
            "FROM ucp_activity_log ORDER BY sequence_num ASC"
        );

        for (var row : rows) {
            count++;
            String storedPrevHash  = (String) row.get("prev_log_hash");
            String storedRowHash   = (String) row.get("row_hash");
            long   seqNum          = ((Number) row.get("sequence_num")).longValue();

            // Check prev_log_hash linkage
            if (!prevHash.equals(storedPrevHash)) {
                brokenAt.add("seq=" + seqNum + " prev_hash_mismatch");
            }

            // Recompute row hash
            String recomputed = recomputeRowHash(row, storedPrevHash);
            if (!recomputed.equals(storedRowHash)) {
                brokenAt.add("seq=" + seqNum + " row_hash_mismatch");
            }

            prevHash = storedRowHash;
        }

        boolean intact = brokenAt.isEmpty();
        if (!intact) {
            log.error("AUDIT CHAIN INTEGRITY VIOLATION — broken at: {}", brokenAt);
        }

        return new AuditLogController.ChainIntegrityResult(
            intact, count, brokenAt, java.time.Instant.now().toString()
        );
    }

    public byte[] exportCsv(String fromDate, String toDate, String bizLine) {
        var result = query(
            new AuditLogController.AuditLogFilter(null, bizLine, null, null, fromDate, toDate),
            0, Integer.MAX_VALUE
        );
        var sb = new StringBuilder();
        sb.append("sequence_num,occurred_at,actor_id,actor_role,action,resource_type,resource_id,content_biz_line,ip_address\n");
        for (var e : result.entries()) {
            sb.append(String.join(",",
                String.valueOf(e.sequenceNum()), e.occurredAt(), e.actorId(),
                e.actorRole(), e.action(), e.resourceType(),
                e.resourceId() != null ? e.resourceId() : "",
                e.contentBizLine() != null ? e.contentBizLine() : "",
                e.ipAddress() != null ? e.ipAddress() : ""
            )).append("\n");
        }
        return sb.toString().getBytes();
    }

    private String recomputeRowHash(Map<String, Object> row, String prevHash) {
        try {
            var rowData = String.join("|",
                str(row, "log_id"), str(row, "occurred_at"),
                str(row, "actor_id"), str(row, "actor_role"),
                str(row, "action"), str(row, "resource_type"),
                str(row, "resource_id"), str(row, "content_biz_line"),
                str(row, "detail"), str(row, "content_hash"),
                prevHash
            );
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                digest.digest(rowData.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return "";
        }
    }

    private String str(Map<String, Object> row, String key) {
        Object val = row.get(key);
        return val != null ? val.toString() : "";
    }
}
