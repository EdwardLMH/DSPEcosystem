package com.hsbc.dsp.security.ad;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Resolves HSBC AD group memberships from the Azure AD JWT token
 * into a UcpUserContext — the single security principal used throughout UCP.
 *
 * Azure AD must be configured to include group memberships in the token
 * under the "groups" claim (App Registration → Token configuration → Add groups claim).
 *
 * Group naming convention: UCP-{BIZLINE}-{ROLE} or UCP-{ROLE} (for cross-biz roles)
 */
@Component
public class AdGroupResolver {

    private static final String GROUP_PREFIX    = "UCP-";
    private static final String ADMIN_GROUP     = "UCP-ADMIN";
    private static final String AUDITOR_GROUP   = "UCP-AUDITOR";
    private static final String AUTHOR_SUFFIX   = "-AUTHOR";
    private static final String APPROVER_SUFFIX = "-APPROVER";

    /** Supported biz line codes — must match AD group naming. */
    public enum BizLine {
        CARDS, MORTGAGE, WEALTH, SAVINGS, INSURANCE, TRANSACT, GLOBAL;

        public static Optional<BizLine> fromCode(String code) {
            try { return Optional.of(valueOf(code)); }
            catch (IllegalArgumentException e) { return Optional.empty(); }
        }
    }

    public enum UcpRole {
        AUTHOR,     // can create, edit, delete own biz line drafts; submit for review
        APPROVER,   // can approve/reject/publish own biz line content
        AUDITOR,    // read-only access to all content + full audit log
        ADMIN       // full access to all biz lines + audit log
    }

    /**
     * Resolved security context for the authenticated user.
     * Injected into every controller via @AuthenticationPrincipal or SecurityContextHolder.
     */
    public record UcpUserContext(
        String userId,             // email / UPN
        String displayName,
        UcpRole highestRole,       // highest role across all groups
        Set<UcpRole> allRoles,
        Set<BizLine> authorBizLines,   // biz lines where user is AUTHOR
        Set<BizLine> approverBizLines, // biz lines where user is APPROVER
        boolean isAdmin,
        boolean isAuditor
    ) {
        /** True if user has write access (create/edit/delete) for this biz line. */
        public boolean canWriteForBizLine(BizLine bizLine) {
            if (isAdmin) return true;
            return authorBizLines.contains(bizLine);
        }

        /** True if user can approve/publish content for this biz line. */
        public boolean canApproveForBizLine(BizLine bizLine) {
            if (isAdmin) return true;
            return approverBizLines.contains(bizLine);
        }

        /** True if user has any access to this biz line's content (read at minimum). */
        public boolean canReadAny() {
            return true; // all authenticated UCP users can read all content
        }

        public Set<BizLine> allAccessibleBizLines() {
            var combined = new HashSet<>(authorBizLines);
            combined.addAll(approverBizLines);
            return combined;
        }
    }

    /**
     * Resolve UcpUserContext from the Azure AD JWT.
     * Called once per request by UcpSecurityFilter.
     */
    public UcpUserContext resolve(Jwt jwt) {
        String userId      = jwt.getSubject();
        String displayName = jwt.getClaimAsString("name");

        // Extract group memberships — Azure AD puts them in "groups" claim
        // Groups can be returned as display names or object IDs depending on config.
        // UCP uses display names (requires "groupMembershipClaims": "SecurityGroup" in manifest).
        List<String> groups = extractGroups(jwt);

        var authorBizLines   = new HashSet<BizLine>();
        var approverBizLines = new HashSet<BizLine>();
        boolean isAdmin   = false;
        boolean isAuditor = false;

        for (String group : groups) {
            if (!group.startsWith(GROUP_PREFIX)) continue;

            if (group.equals(ADMIN_GROUP))   { isAdmin   = true; continue; }
            if (group.equals(AUDITOR_GROUP)) { isAuditor = true; continue; }

            // Parse UCP-{BIZLINE}-{ROLE}
            String body = group.substring(GROUP_PREFIX.length()); // e.g. "CARDS-AUTHOR"
            if (body.endsWith(AUTHOR_SUFFIX)) {
                String blCode = body.substring(0, body.length() - AUTHOR_SUFFIX.length());
                BizLine.fromCode(blCode).ifPresent(authorBizLines::add);
            } else if (body.endsWith(APPROVER_SUFFIX)) {
                String blCode = body.substring(0, body.length() - APPROVER_SUFFIX.length());
                BizLine.fromCode(blCode).ifPresent(approverBizLines::add);
            }
        }

        // Derive highest role
        UcpRole highestRole;
        Set<UcpRole> allRoles = new HashSet<>();
        if (isAdmin)   { highestRole = UcpRole.ADMIN;    allRoles.add(UcpRole.ADMIN); }
        else if (isAuditor) { highestRole = UcpRole.AUDITOR; allRoles.add(UcpRole.AUDITOR); }
        else if (!approverBizLines.isEmpty()) { highestRole = UcpRole.APPROVER; }
        else { highestRole = UcpRole.AUTHOR; }

        if (!authorBizLines.isEmpty())   allRoles.add(UcpRole.AUTHOR);
        if (!approverBizLines.isEmpty()) allRoles.add(UcpRole.APPROVER);

        return new UcpUserContext(
            userId, displayName, highestRole, allRoles,
            Collections.unmodifiableSet(authorBizLines),
            Collections.unmodifiableSet(approverBizLines),
            isAdmin, isAuditor
        );
    }

    @SuppressWarnings("unchecked")
    private List<String> extractGroups(Jwt jwt) {
        Object raw = jwt.getClaims().get("groups");
        if (raw instanceof List<?> list) {
            return list.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .collect(Collectors.toList());
        }
        return List.of();
    }
}
