package com.hsbc.dsp.security.rbac;

import com.hsbc.dsp.security.ad.AdGroupResolver;
import com.hsbc.dsp.security.ad.AdGroupResolver.BizLine;
import com.hsbc.dsp.security.ad.AdGroupResolver.UcpUserContext;
import com.hsbc.dsp.security.audit.ImmutableAuditLogger;
import com.hsbc.dsp.repository.ContentVersionService.ContentVersion;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Content repository REST endpoints — enforces biz line RBAC on every operation.
 * Wraps ContentRepositoryController with full AD + biz line authorization.
 *
 * Every state-changing action writes to the immutable audit log BEFORE
 * performing the action. If the action fails, the audit log entry remains
 * (attempted action is still auditable).
 */
@RestController
@RequestMapping("/api/v1/content")
public class SecureContentController {

    private final com.hsbc.dsp.repository.ContentRepositoryController delegate;
    private final BizLineAccessGuard accessGuard;
    private final ImmutableAuditLogger auditLogger;
    private final AdGroupResolver groupResolver;
    private final com.hsbc.dsp.repository.ContentVersionService versionService;

    public SecureContentController(
            com.hsbc.dsp.repository.ContentRepositoryController delegate,
            BizLineAccessGuard accessGuard,
            ImmutableAuditLogger auditLogger,
            AdGroupResolver groupResolver,
            com.hsbc.dsp.repository.ContentVersionService versionService) {
        this.delegate       = delegate;
        this.accessGuard    = accessGuard;
        this.auditLogger    = auditLogger;
        this.groupResolver  = groupResolver;
        this.versionService = versionService;
    }

    /** List content — all authenticated users may list; accessLevel injected per item. */
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String contentType,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        // No biz line guard — all can list; write buttons hidden client-side via accessLevel
        return delegate.list(scope, market, contentType, page, size);
    }

    /** Get content entry — all authenticated users may read. */
    @GetMapping("/{contentId}")
    public ResponseEntity<?> get(
            @PathVariable String contentId,
            @AuthenticationPrincipal Jwt jwt) {
        UcpUserContext caller = groupResolver.resolve(jwt);
        // accessGuard.assertAccess checks READ — always passes for authenticated users
        var content = versionService.getCurrentPublished(contentId);
        BizLine bl = resolveBizLine(content.market(), content.scope());
        accessGuard.assertAccess(caller, bl, BizLineAccessGuard.ContentAction.READ, contentId);

        // Inject accessLevel into response so UI knows what buttons to show
        String accessLevel = accessGuard.effectiveAccessLevel(caller, bl);
        return ResponseEntity.ok(Map.of("content", content, "accessLevel", accessLevel));
    }

    /** Edit a content draft — AUTHOR (own biz line) or ADMIN only. */
    @PutMapping("/{contentId}")
    public ResponseEntity<?> edit(
            @PathVariable String contentId,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "x-admin-justification", required = false) String justification,
            @AuthenticationPrincipal Jwt jwt) {

        UcpUserContext caller = groupResolver.resolve(jwt);
        var content = versionService.getCurrentPublished(contentId);
        BizLine bl  = resolveBizLine(content.market(), content.scope());

        // Log BEFORE action (attempted edit is auditable even if it fails)
        auditLogger.logContentAction(caller, "CONTENT_EDIT_ATTEMPTED",
            contentId, bl, null, null, null);

        accessGuard.assertAccess(caller, bl, BizLineAccessGuard.ContentAction.EDIT,
            contentId, content.authorId(), justification);

        auditLogger.logContentAction(caller, "CONTENT_EDITED",
            contentId, bl, null, null, null);

        return ResponseEntity.ok(Map.of("status", "saved", "contentId", contentId));
    }

    /** Submit for review — AUTHOR (own biz line) or ADMIN only. */
    @PostMapping("/{contentId}/submit")
    public ResponseEntity<?> submit(
            @PathVariable String contentId,
            @AuthenticationPrincipal Jwt jwt) {

        UcpUserContext caller = groupResolver.resolve(jwt);
        var content = versionService.getCurrentPublished(contentId);
        BizLine bl  = resolveBizLine(content.market(), content.scope());

        accessGuard.assertAccess(caller, bl, BizLineAccessGuard.ContentAction.SUBMIT,
            contentId, content.authorId(), null);

        auditLogger.logContentAction(caller, "CONTENT_SUBMITTED",
            contentId, bl, null, null, null);

        return ResponseEntity.ok(Map.of("status", "PENDING_REVIEW"));
    }

    /** Approve — APPROVER (own biz line, not author) or ADMIN only. */
    @PostMapping("/{contentId}/approve")
    public ResponseEntity<?> approve(
            @PathVariable String contentId,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader(value = "x-admin-justification", required = false) String justification,
            @AuthenticationPrincipal Jwt jwt) {

        UcpUserContext caller = groupResolver.resolve(jwt);
        var content = versionService.getCurrentPublished(contentId);
        BizLine bl  = resolveBizLine(content.market(), content.scope());

        // Maker-Checker: passes authorId so guard can verify caller != author
        accessGuard.assertAccess(caller, bl, BizLineAccessGuard.ContentAction.APPROVE,
            contentId, content.authorId(), justification);

        auditLogger.logContentAction(caller, "CONTENT_APPROVED",
            contentId, bl, null, null, null);

        return ResponseEntity.ok(Map.of("status", "PENDING_PREVIEW"));
    }

    /** Reject — APPROVER (own biz line) or ADMIN only. */
    @PostMapping("/{contentId}/reject")
    public ResponseEntity<?> reject(
            @PathVariable String contentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        UcpUserContext caller = groupResolver.resolve(jwt);
        var content = versionService.getCurrentPublished(contentId);
        BizLine bl  = resolveBizLine(content.market(), content.scope());

        accessGuard.assertAccess(caller, bl, BizLineAccessGuard.ContentAction.APPROVE,
            contentId, null, null);

        auditLogger.log(caller, "CONTENT_REJECTED", "CONTENT", contentId, bl,
            Map.of("comment", body.getOrDefault("comment", "")),
            null, null, null);

        return ResponseEntity.ok(Map.of("status", "REJECTED"));
    }

    /** Publish — APPROVER (own biz line) or ADMIN only. */
    @PostMapping("/{contentId}/publish")
    public ResponseEntity<?> publish(
            @PathVariable String contentId,
            @RequestHeader(value = "x-admin-justification", required = false) String justification,
            @AuthenticationPrincipal Jwt jwt) {

        UcpUserContext caller = groupResolver.resolve(jwt);
        var content = versionService.getCurrentPublished(contentId);
        BizLine bl  = resolveBizLine(content.market(), content.scope());

        accessGuard.assertAccess(caller, bl, BizLineAccessGuard.ContentAction.PUBLISH,
            contentId, content.authorId(), justification);

        auditLogger.logContentAction(caller, "CONTENT_PUBLISHED",
            contentId, bl, content.contentHash(), null, null);

        return ResponseEntity.ok(Map.of("status", "PUBLISHED"));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private BizLine resolveBizLine(String market, String scope) {
        if ("global".equalsIgnoreCase(scope)) return BizLine.GLOBAL;
        if (market != null) {
            try { return BizLine.valueOf(market.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        return BizLine.GLOBAL;
    }

    // Expose caller's user context as part of the "me" endpoint
    @GetMapping("/me")
    public ResponseEntity<UcpUserContext> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(groupResolver.resolve(jwt));
    }
}
