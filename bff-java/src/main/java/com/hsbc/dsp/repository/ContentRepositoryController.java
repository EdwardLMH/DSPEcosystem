package com.hsbc.dsp.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/content-repository")
public class ContentRepositoryController {

    private final ContentRepositoryService repositoryService;
    private final ContentVersionService versionService;
    private final AuditLogService auditLogService;

    public ContentRepositoryController(ContentRepositoryService repositoryService,
                                        ContentVersionService versionService,
                                        AuditLogService auditLogService) {
        this.repositoryService = repositoryService;
        this.versionService = versionService;
        this.auditLogService = auditLogService;
    }

    /** List content — filtered by scope, market, type */
    @GetMapping
    public ResponseEntity<List<ContentSummary>> list(
            @RequestParam(required = false) String scope,     // global | market
            @RequestParam(required = false) String market,    // HK | CN | SG
            @RequestParam(required = false) String contentType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(repositoryService.list(scope, market, contentType, page, size));
    }

    /** Get current published version of a content entry */
    @GetMapping("/{contentId}")
    public ResponseEntity<ContentVersion> getCurrent(@PathVariable String contentId) {
        return ResponseEntity.ok(versionService.getCurrentPublished(contentId));
    }

    /** Get a specific version */
    @GetMapping("/{contentId}/versions/{versionNumber}")
    public ResponseEntity<ContentVersion> getVersion(
            @PathVariable String contentId,
            @PathVariable int versionNumber) {
        return ResponseEntity.ok(versionService.getVersion(contentId, versionNumber));
    }

    /** List all versions of a content entry */
    @GetMapping("/{contentId}/versions")
    public ResponseEntity<List<ContentVersionSummary>> listVersions(
            @PathVariable String contentId) {
        return ResponseEntity.ok(versionService.listVersions(contentId));
    }

    /** Diff two versions */
    @GetMapping("/{contentId}/diff")
    public ResponseEntity<VersionDiff> diff(
            @PathVariable String contentId,
            @RequestParam int fromVersion,
            @RequestParam int toVersion) {
        return ResponseEntity.ok(versionService.diff(contentId, fromVersion, toVersion));
    }

    /** Restore a previous version as a new draft */
    @PostMapping("/{contentId}/versions/{versionNumber}/restore")
    public ResponseEntity<ContentVersion> restore(
            @PathVariable String contentId,
            @PathVariable int versionNumber,
            @AuthenticationPrincipal Jwt maker) {
        var restored = versionService.restoreAsDraft(contentId, versionNumber, maker.getSubject());
        auditLogService.log(contentId, restored.versionId(), maker.getSubject(),
                "MAKER", "RESTORED_FROM_V" + versionNumber, null, null);
        return ResponseEntity.ok(restored);
    }

    /** Get full audit log for a content entry */
    @GetMapping("/{contentId}/audit-log")
    public ResponseEntity<List<AuditLogEntry>> getAuditLog(
            @PathVariable String contentId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        return ResponseEntity.ok(auditLogService.getLog(contentId, fromDate, toDate));
    }

    /** Set legal hold on a content entry (Admin only) */
    @PostMapping("/{contentId}/legal-hold")
    public ResponseEntity<Void> setLegalHold(
            @PathVariable String contentId,
            @RequestBody LegalHoldRequest req,
            @AuthenticationPrincipal Jwt admin) {
        repositoryService.setLegalHold(contentId, req.hold(), admin.getSubject(), req.reason());
        return ResponseEntity.ok().build();
    }

    /** Download full version snapshot as JSON (for auditors) */
    @GetMapping("/{contentId}/versions/{versionNumber}/download")
    public ResponseEntity<byte[]> downloadSnapshot(
            @PathVariable String contentId,
            @PathVariable int versionNumber,
            @AuthenticationPrincipal Jwt requester) {
        var snapshot = versionService.downloadSnapshot(contentId, versionNumber);
        auditLogService.log(contentId, null, requester.getSubject(),
                "AUDITOR", "DOWNLOADED_SNAPSHOT_V" + versionNumber, null, null);
        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .header("Content-Disposition",
                        "attachment; filename=" + contentId + "_v" + versionNumber + ".json")
                .body(snapshot);
    }

    public record LegalHoldRequest(boolean hold, String reason) {}
}
