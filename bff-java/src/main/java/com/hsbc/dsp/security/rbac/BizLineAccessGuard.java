package com.hsbc.dsp.security.rbac;

import com.hsbc.dsp.security.ad.AdGroupResolver.BizLine;
import com.hsbc.dsp.security.ad.AdGroupResolver.UcpRole;
import com.hsbc.dsp.security.ad.AdGroupResolver.UcpUserContext;
import com.hsbc.dsp.security.audit.ImmutableAuditLogger;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * Enforces biz line content isolation at the service layer.
 *
 * Rules (enforced at API level, not just UI):
 *  - AUTHOR can write only to their own biz line content
 *  - APPROVER can approve only their own biz line content
 *  - APPROVER cannot approve content they authored (Maker-Checker)
 *  - AUDITOR is read-only across all biz lines
 *  - ADMIN can write/approve all biz lines but must supply justification
 *  - Any other biz line's AUTHOR/APPROVER has read-only access to foreign content
 */
@Component
public class BizLineAccessGuard {

    private final ImmutableAuditLogger auditLogger;

    public BizLineAccessGuard(ImmutableAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    public enum ContentAction {
        READ, CREATE, EDIT, DELETE, SUBMIT, APPROVE, PUBLISH, UNPUBLISH, RESTORE
    }

    /**
     * Assert that the caller is allowed to perform the given action on content
     * belonging to the specified biz line.
     *
     * Throws 403 ResponseStatusException if access is denied.
     * Logs ACCESS_DENIED event to immutable audit log on any denial.
     */
    public void assertAccess(UcpUserContext caller, BizLine contentBizLine,
                              ContentAction action, String resourceId) {
        assertAccess(caller, contentBizLine, action, resourceId, null, null);
    }

    public void assertAccess(UcpUserContext caller, BizLine contentBizLine,
                              ContentAction action, String resourceId,
                              String contentAuthorId,  // for Maker-Checker check
                              String adminJustification) {

        // AUDITOR: read-only
        if (caller.isAuditor()) {
            if (action != ContentAction.READ) {
                deny(caller, contentBizLine, action, resourceId,
                    "Auditors have read-only access");
            }
            return;
        }

        // ADMIN: full access but must provide justification for cross-biz-line write
        if (caller.isAdmin()) {
            if (action != ContentAction.READ
                    && !caller.allAccessibleBizLines().contains(contentBizLine)) {
                // Admin acting outside their own biz lines — require justification
                if (adminJustification == null || adminJustification.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Admin override requires a justification for cross-biz-line action.");
                }
                auditLogger.logAdminOverride(caller, contentBizLine, action, resourceId,
                    adminJustification);
            }
            return;
        }

        // READ: all authenticated UCP users may read
        if (action == ContentAction.READ) return;

        // WRITE actions: caller must be AUTHOR in this biz line
        if (action == ContentAction.CREATE || action == ContentAction.EDIT
                || action == ContentAction.DELETE || action == ContentAction.SUBMIT
                || action == ContentAction.RESTORE) {
            if (!caller.canWriteForBizLine(contentBizLine)) {
                deny(caller, contentBizLine, action, resourceId,
                    String.format("Your biz lines %s have no write access to %s content",
                        caller.authorBizLines(), contentBizLine));
            }
            return;
        }

        // APPROVE / PUBLISH / UNPUBLISH: caller must be APPROVER in this biz line
        if (action == ContentAction.APPROVE || action == ContentAction.PUBLISH
                || action == ContentAction.UNPUBLISH) {
            if (!caller.canApproveForBizLine(contentBizLine)) {
                deny(caller, contentBizLine, action, resourceId,
                    String.format("Your biz lines %s have no approval access to %s content",
                        caller.approverBizLines(), contentBizLine));
            }
            // Maker-Checker: approver cannot approve their own content
            if (contentAuthorId != null && contentAuthorId.equals(caller.userId())) {
                deny(caller, contentBizLine, action, resourceId,
                    "Maker-Checker violation: you cannot approve content you authored");
            }
            return;
        }

        deny(caller, contentBizLine, action, resourceId, "Unknown action");
    }

    /**
     * Returns the effective access level for UI rendering decisions.
     * Used to set "accessLevel": "READ_ONLY" | "WRITE" | "APPROVE" in API responses.
     */
    public String effectiveAccessLevel(UcpUserContext caller, BizLine contentBizLine) {
        if (caller.isAdmin()) return "FULL";
        if (caller.isAuditor()) return "AUDIT";
        if (caller.canApproveForBizLine(contentBizLine)) return "APPROVE";
        if (caller.canWriteForBizLine(contentBizLine))  return "WRITE";
        return "READ_ONLY";
    }

    private void deny(UcpUserContext caller, BizLine contentBizLine,
                      ContentAction action, String resourceId, String reason) {
        auditLogger.logAccessDenied(caller, contentBizLine, action, resourceId, reason);
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            String.format("ACCESS_DENIED: %s", reason));
    }
}
