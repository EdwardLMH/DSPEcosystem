package com.hsbc.dsp.security.audit;

import com.hsbc.dsp.security.ad.AdGroupResolver;
import com.hsbc.dsp.security.ad.AdGroupResolver.UcpUserContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Audit Log REST API — accessible to AUDITOR and ADMIN roles only.
 *
 * All access to this endpoint is itself logged in the audit log
 * (AUDIT_LOG_EXPORTED event).
 *
 * Results are READ-ONLY. No mutation endpoints exist for audit log data.
 */
@RestController
@RequestMapping("/api/v1/audit-log")
public class AuditLogController {

    private final AuditLogQueryService queryService;
    private final ImmutableAuditLogger auditLogger;
    private final AdGroupResolver groupResolver;

    public AuditLogController(AuditLogQueryService queryService,
                               ImmutableAuditLogger auditLogger,
                               AdGroupResolver groupResolver) {
        this.queryService  = queryService;
        this.auditLogger   = auditLogger;
        this.groupResolver = groupResolver;
    }

    /**
     * Query the audit log with filters.
     * Only AUDITOR and ADMIN may call this endpoint.
     */
    @GetMapping
    public ResponseEntity<AuditLogResponse> query(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String bizLine,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal Jwt jwt) {

        UcpUserContext caller = groupResolver.resolve(jwt);

        // Role check — only AUDITOR or ADMIN
        if (!caller.isAuditor() && !caller.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        var filters = new AuditLogFilter(actorId, bizLine, action, resourceId, fromDate, toDate);
        var results = queryService.query(filters, page, size);

        // Log this query itself
        auditLogger.logAuditExport(caller, Map.of(
            "actorId", actorId != null ? actorId : "*",
            "bizLine", bizLine != null ? bizLine : "*",
            "action",  action  != null ? action  : "*",
            "fromDate", fromDate != null ? fromDate : "*",
            "toDate",   toDate   != null ? toDate   : "*"
        ));

        return ResponseEntity.ok(results);
    }

    /**
     * Verify chain integrity across all log entries.
     * Recomputes each row's hash and checks prev_log_hash linkage.
     * AUDITOR and ADMIN only.
     */
    @GetMapping("/chain-integrity")
    public ResponseEntity<ChainIntegrityResult> verifyChain(
            @AuthenticationPrincipal Jwt jwt) {
        UcpUserContext caller = groupResolver.resolve(jwt);
        if (!caller.isAuditor() && !caller.isAdmin()) {
            return ResponseEntity.status(403).build();
        }
        auditLogger.log(caller, "CHAIN_INTEGRITY_VERIFIED", "SYSTEM",
            null, null, Map.of(), null, null, null);
        return ResponseEntity.ok(queryService.verifyChainIntegrity());
    }

    /**
     * Export audit log as CSV.
     * AUDITOR and ADMIN only. Export event logged.
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String bizLine,
            @AuthenticationPrincipal Jwt jwt) {
        UcpUserContext caller = groupResolver.resolve(jwt);
        if (!caller.isAuditor() && !caller.isAdmin()) {
            return ResponseEntity.status(403).build();
        }
        byte[] csv = queryService.exportCsv(fromDate, toDate, bizLine);
        auditLogger.log(caller, "AUDIT_LOG_EXPORTED", "SYSTEM", null, null,
            Map.of("format", "CSV", "fromDate", fromDate != null ? fromDate : "*",
                   "toDate", toDate != null ? toDate : "*"), null, null, null);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition",
                "attachment; filename=ucp-audit-log-" + fromDate + "-" + toDate + ".csv")
            .body(csv);
    }

    // DTOs
    public record AuditLogFilter(String actorId, String bizLine, String action,
                                  String resourceId, String fromDate, String toDate) {}
    public record AuditLogResponse(List<AuditLogEntry> entries, long total,
                                    int page, int size) {}
    public record AuditLogEntry(String logId, long sequenceNum, String occurredAt,
                                 String actorId, String actorRole, String[] actorBizLines,
                                 String action, String resourceType, String resourceId,
                                 String contentBizLine, Object detail, String ipAddress,
                                 String contentHash, String prevLogHash, String rowHash) {}
    public record ChainIntegrityResult(boolean intact, long rowsVerified,
                                        List<String> brokenAtSequenceNums,
                                        String verifiedAt) {}
}
