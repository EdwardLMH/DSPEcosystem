# AD Group RBAC & Biz Line Authorization — Design Document

**Document Version:** 1.1
**Date:** 2026-04-19
**Scope:** Active Directory integration, role-based access control, business line content isolation, immutable activity log

---

## 1. Two-Zone Access Model

The platform has **two completely separate access zones**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ZONE 1 — PUBLIC (External / Customer-Facing)                               │
│                                                                               │
│  Who:    Any internet user, customer device, partner system                  │
│  Auth:   NONE — no Azure AD, no login required                               │
│  APIs:                                                                        │
│    GET  /api/v1/screen/**           SDUI delivery → web, iOS, Android, WeChat│
│    *    /api/v1/kyc/sessions/**     Open Banking KYC journey                 │
│    POST /api/v1/events/**           DAP analytics event ingestion            │
│                                                                               │
│  These endpoints serve published content to customers.                       │
│  AD groups have zero relevance here.                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ZONE 2 — INTERNAL (Staff / CMS Operations)                                 │
│                                                                               │
│  Who:    HSBC staff only — must hold a valid Azure AD JWT (MFA required)    │
│  Auth:   Azure AD OAuth2 / OIDC — group membership drives permissions       │
│  APIs:                                                                        │
│    *    /api/v1/content/**           Content CRUD, submit, approve, publish  │
│    *    /api/v1/workflow/**          Maker-Checker state transitions         │
│    *    /api/v1/preview/**           Preview token and on-device approval    │
│    *    /api/v1/audit-log/**         Audit log query/export (AUDITOR+ADMIN)  │
│    *    /api/v1/content-repository/**  Version history, legal hold          │
│                                                                               │
│  AD group membership determines WHAT the staff user can do within Zone 2.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

Within **Zone 2**, UCP enforces a further three-layer model:

```
Layer 1 — Authentication:   Who are you?    → HSBC AD (LDAP / Azure AD)
Layer 2 — Role:             What role?      → AD Group → AUTHOR | APPROVER | AUDITOR | ADMIN
Layer 3 — Biz Line:         Which content?  → AD Group → BIZ_LINE determines content ownership
```

Every destructive or state-changing action — create, edit, delete, submit, approve, publish, unpublish — is recorded in an **immutable, append-only activity log** that cannot be modified or deleted by any role including ADMIN.

---

## 2. AD Group Structure

### 2.1 Group Naming Convention

```
UCP-{BIZLINE}-{ROLE}

Examples:
  UCP-CARDS-AUTHOR          ← Cards biz line, content author
  UCP-CARDS-APPROVER        ← Cards biz line, content approver/checker
  UCP-MORTGAGE-AUTHOR       ← Mortgage biz line, author
  UCP-MORTGAGE-APPROVER     ← Mortgage biz line, approver
  UCP-WEALTH-AUTHOR         ← Wealth biz line, author
  UCP-WEALTH-APPROVER       ← Wealth biz line, approver
  UCP-TRANSACT-AUTHOR       ← Transaction Banking, author
  UCP-TRANSACT-APPROVER     ← Transaction Banking, approver
  UCP-AUDITOR               ← Cross-biz-line auditor (read-only, all content)
  UCP-ADMIN                 ← System admin (full power, all biz lines)
```

### 2.2 Group → Role Mapping

| AD Group Pattern | Resolved Role | Biz Line |
|-----------------|--------------|---------|
| `UCP-{BL}-AUTHOR` | `AUTHOR` | `{BL}` |
| `UCP-{BL}-APPROVER` | `APPROVER` | `{BL}` |
| `UCP-AUDITOR` | `AUDITOR` | `*` (all) |
| `UCP-ADMIN` | `ADMIN` | `*` (all) |

### 2.3 Supported Business Lines

| Biz Line Code | Description |
|--------------|-------------|
| `CARDS` | Credit Cards & Debit Cards |
| `MORTGAGE` | Home Loans & Mortgages |
| `WEALTH` | Wealth Management, Jade, Premier |
| `SAVINGS` | Savings & Deposits |
| `INSURANCE` | HSBC Life & General Insurance |
| `TRANSACT` | Transaction Banking, FX, Transfers |
| `GLOBAL` | Group / cross-market global content |

---

## 3. Permission Matrix

```
                      ┌────────────────────────────────────────────────────────────────────┐
                      │                      CONTENT ACTION                                 │
 ROLE / BIZ LINE      │ View  │ Create │ Edit │ Delete │ Submit │ Approve │ Publish │ Audit │
 ─────────────────────┼───────┼────────┼──────┼────────┼────────┼─────────┼─────────┼───────┤
 AUTHOR (own BL)      │  ✅   │  ✅    │  ✅  │  ✅*   │  ✅    │  ❌     │  ❌     │  ❌   │
 AUTHOR (other BL)    │  ✅   │  ❌    │  ❌  │  ❌    │  ❌    │  ❌     │  ❌     │  ❌   │
 APPROVER (own BL)    │  ✅   │  ❌    │  ❌  │  ❌    │  ❌    │  ✅**   │  ✅     │  ❌   │
 APPROVER (other BL)  │  ✅   │  ❌    │  ❌  │  ❌    │  ❌    │  ❌     │  ❌     │  ❌   │
 AUDITOR              │  ✅   │  ❌    │  ❌  │  ❌    │  ❌    │  ❌     │  ❌     │  ✅   │
 ADMIN                │  ✅   │  ✅    │  ✅  │  ✅    │  ✅    │  ✅     │  ✅     │  ✅   │
 ─────────────────────┴───────┴────────┴──────┴────────┴────────┴─────────┴─────────┴───────┘

 * Author can only delete own DRAFT content (not PUBLISHED or content under review)
** Maker-Checker enforced: Approver cannot approve content they authored
   (enforced at API level — not just UI)
```

---

## 4. Authentication Flow (LDAP / Azure AD)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       UCP Authentication Flow                                 │
│                                                                               │
│  User opens UCP                                                               │
│       │                                                                       │
│       ▼                                                                       │
│  Redirect to HSBC SSO (Azure AD / ADFS)                                       │
│  SAML 2.0 or OAuth2 + OIDC flow                                               │
│       │                                                                       │
│       ▼                                                                       │
│  Azure AD authenticates user credentials (MFA required)                       │
│       │                                                                       │
│       ▼ Issues ID token + access token                                        │
│       │                                                                       │
│  BFF validates JWT (Spring Security + azure-spring-boot-starter)              │
│       │                                                                       │
│       ▼                                                                       │
│  AD Group Resolver reads user's group memberships from token claims           │
│  (groups claim in Azure AD JWT — must be enabled in App Registration)         │
│       │                                                                       │
│  Example JWT groups claim:                                                    │
│  {                                                                            │
│    "sub": "j.chan@hsbc.com.hk",                                              │
│    "name": "CHAN, Jack",                                                      │
│    "groups": [                                                                │
│      "UCP-CARDS-AUTHOR",                                                      │
│      "UCP-WEALTH-AUTHOR",      ← user belongs to 2 biz line author groups    │
│      "HSBC-STAFF"                                                             │
│    ]                                                                          │
│  }                                                                            │
│       │                                                                       │
│       ▼                                                                       │
│  UcpUserContext resolved:                                                     │
│  {                                                                            │
│    userId:   "j.chan@hsbc.com.hk",                                           │
│    role:     AUTHOR,                                                          │
│    bizLines: [CARDS, WEALTH],   ← can author in both                         │
│    isAdmin:  false,                                                           │
│    isAuditor: false                                                           │
│  }                                                                            │
│       │                                                                       │
│       ▼                                                                       │
│  Every subsequent request has UcpUserContext injected via Spring Security     │
│  @AuthenticationPrincipal — no further AD lookups needed per request          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Biz Line Content Isolation

### 5.1 Content Ownership Model

Every content entry in UCP has a `bizLine` field set at creation time.

```
Content entry: hk-jade-upgrade-banner-q2
  bizLine:  WEALTH           ← set by the creating author's primary biz line
  authorId: j.chan@hsbc.com.hk
  status:   PUBLISHED
```

### 5.2 Access Decision at API Level

```
Request: PUT /api/v1/content/hk-jade-upgrade-banner-q2
Caller:  m.lee@hsbc.com.hk  (groups: UCP-CARDS-AUTHOR)

BizLineAccessGuard checks:
  content.bizLine = WEALTH
  caller.bizLines = [CARDS]
  CARDS ≠ WEALTH AND caller is not ADMIN
  → 403 Forbidden

  {
    "error": "ACCESS_DENIED",
    "message": "You do not have write access to WEALTH content.",
    "yourBizLines": ["CARDS"],
    "contentBizLine": "WEALTH"
  }
```

### 5.3 Cross-Biz-Line Author (Read-Only)

An author from CARDS viewing WEALTH content:
```
Request: GET /api/v1/content/hk-jade-upgrade-banner-q2
Caller:  m.lee@hsbc.com.hk  (groups: UCP-CARDS-AUTHOR)

→ 200 OK — content returned
→ Response includes: "accessLevel": "READ_ONLY" (UI uses this to disable edit buttons)
```

### 5.4 Global Content

Content with `bizLine: GLOBAL` can only be authored/approved by:
- `UCP-GLOBAL-AUTHOR` / `UCP-GLOBAL-APPROVER` groups
- `UCP-ADMIN` group

---

## 6. Immutable Activity Log — Design

### 6.1 Why It Cannot Be Changed

The activity log is the audit trail required by HKMA, MAS, internal audit, and legal. It must be:

- **Append-only** — no UPDATE or DELETE SQL ever runs on log rows
- **Tamper-evident** — each row hashed; hash chain links rows (like a blockchain)
- **Multi-layer** — stored in both PostgreSQL (queryable) and S3 with Object Lock (WORM)
- **Admin-proof** — even the ADMIN role cannot delete or modify log entries via any UCP API
- **Signed** — each entry signed with BFF service private key; signature verifiable by auditor

### 6.2 Activity Log Schema

```sql
-- IMMUTABLE — no UPDATE, no DELETE ever.
-- Row-level security: SELECT only for AUDITOR + ADMIN.
-- Revoke UPDATE/DELETE from ALL roles including service account.

CREATE TABLE ucp_activity_log (
    log_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_num     BIGSERIAL   NOT NULL UNIQUE,      -- monotonic, never gaps
    occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id         VARCHAR(255) NOT NULL,            -- email/UPN from AD token
    actor_role       VARCHAR(50)  NOT NULL,            -- AUTHOR|APPROVER|AUDITOR|ADMIN
    actor_biz_lines  TEXT[]       NOT NULL,            -- ["CARDS","WEALTH"]
    action           VARCHAR(100) NOT NULL,            -- see Action Catalogue below
    resource_type    VARCHAR(100) NOT NULL,            -- CONTENT|WORKFLOW|USER|SYSTEM
    resource_id      VARCHAR(255),                     -- contentId, sessionId, etc.
    content_biz_line VARCHAR(50),                      -- biz line of affected content
    detail           JSONB        NOT NULL DEFAULT '{}',
    ip_address       INET,
    user_agent       TEXT,
    request_id       UUID,                             -- trace ID for correlation
    content_hash     VARCHAR(64),                      -- SHA-256 of content at action time
    prev_log_hash    VARCHAR(64)  NOT NULL,            -- hash of previous row (chain)
    row_hash         VARCHAR(64)  NOT NULL             -- SHA-256 of this entire row
                                                       -- (computed before insert, verified on read)
);

-- Enforce append-only at DB level
REVOKE UPDATE ON ucp_activity_log FROM PUBLIC;
REVOKE DELETE ON ucp_activity_log FROM PUBLIC;
REVOKE TRUNCATE ON ucp_activity_log FROM PUBLIC;

-- Even the application service role cannot update/delete
REVOKE UPDATE ON ucp_activity_log FROM ucp_service_role;
REVOKE DELETE ON ucp_activity_log FROM ucp_service_role;

-- Grant insert + select only
GRANT INSERT, SELECT ON ucp_activity_log TO ucp_service_role;
GRANT SELECT ON ucp_activity_log TO ucp_auditor_role;

-- Index for common queries
CREATE INDEX idx_ual_actor_id       ON ucp_activity_log (actor_id);
CREATE INDEX idx_ual_occurred_at    ON ucp_activity_log (occurred_at DESC);
CREATE INDEX idx_ual_resource_id    ON ucp_activity_log (resource_id);
CREATE INDEX idx_ual_biz_line       ON ucp_activity_log (content_biz_line);
CREATE INDEX idx_ual_action         ON ucp_activity_log (action);
CREATE INDEX idx_ual_sequence       ON ucp_activity_log (sequence_num DESC);
```

### 6.3 Action Catalogue

| Action | Trigger |
|--------|---------|
| `CONTENT_CREATED` | Author creates a new content entry |
| `CONTENT_EDITED` | Author saves a draft edit |
| `CONTENT_DELETED` | Author deletes a draft |
| `CONTENT_SUBMITTED` | Author submits for review |
| `CONTENT_APPROVED` | Approver approves (first stage) |
| `CONTENT_APPROVED_PREVIEW` | Approver approves after on-device preview |
| `CONTENT_REJECTED` | Approver rejects with comment |
| `CONTENT_PUBLISHED` | Content goes live |
| `CONTENT_UNPUBLISHED` | Content taken offline |
| `CONTENT_RESTORED` | Old version restored as draft |
| `PREVIEW_GENERATED` | Preview token and QR generated |
| `PREVIEW_APPROVED` | Approver taps Approve on device |
| `PREVIEW_REJECTED` | Approver taps Reject on device |
| `ACCESS_DENIED` | Any 403 — attempted unauthorised action |
| `LOGIN` | User authenticated into UCP |
| `LOGOUT` | User session ended |
| `ADMIN_OVERRIDE` | Admin acted on another biz line's content |
| `AUDIT_LOG_EXPORTED` | Auditor exported log data |
| `USER_ROLE_CHANGED` | AD group membership change detected |

### 6.4 Hash Chain (Tamper Evidence)

```
Row N-1:
  log_id: abc123
  sequence_num: 41
  ...all fields...
  row_hash: "e3b0c44298fc..."    ← SHA-256 of all row fields

Row N:
  log_id: def456
  sequence_num: 42
  ...all fields...
  prev_log_hash: "e3b0c44298fc..."   ← = row N-1's row_hash
  row_hash: "a591a6d40..."           ← SHA-256 of all row N fields

Verification:
  For any row N:
    1. Recompute row_hash from fields → must match stored row_hash
    2. Fetch row N-1, check its row_hash == row N's prev_log_hash
    3. Any modification to any historical row breaks the chain
    4. Chain integrity checked nightly by audit job
```

### 6.5 S3 WORM Backup

Every activity log row is also written to S3 with **Object Lock in Compliance mode**:

```
Bucket: hsbc-ucp-activity-log-{env}
Key:    activity-log/{year}/{month}/{day}/{sequence_num}.json
Lock:   Object Lock COMPLIANCE mode, retention 7 years
Effect: No one — not even AWS root — can delete before 7 years
```

---

## 7. Auditor UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  UCP Audit Console                              Role: AUDITOR  [Export] │
├──────────────────────────────────────────────────────────────────────────┤
│  Filters                                                                  │
│  Actor: [all ▼]  BizLine: [all ▼]  Action: [all ▼]                      │
│  Date: [2026-01-01] → [2026-04-19]  Resource: [          ] [Search]     │
├──────────────────────────────────────────────────────────────────────────┤
│  Chain Integrity: ✅ Verified (last checked 2026-04-19 03:00 HKT)        │
├──────────────────────────────────────────────────────────────────────────┤
│  Seq  │ Time (HKT)       │ Actor              │ BizLine │ Action          │
│  ─────┼──────────────────┼────────────────────┼─────────┼─────────────── │
│  1042 │ 2026-04-19 14:32 │ m.wong@hsbc.com.hk │ WEALTH  │ CONTENT_PUBLISHED│
│  1041 │ 2026-04-19 14:28 │ m.wong@hsbc.com.hk │ WEALTH  │ CONTENT_APPROVED_PREVIEW│
│  1040 │ 2026-04-19 11:00 │ m.wong@hsbc.com.hk │ WEALTH  │ PREVIEW_APPROVED│
│  1039 │ 2026-04-19 09:15 │ j.chan@hsbc.com.hk  │ WEALTH  │ CONTENT_SUBMITTED│
│  1038 │ 2026-04-19 08:45 │ a.smith@hsbc.com.hk │ CARDS  │ ACCESS_DENIED   │
│  ...                                                                      │
│                                                                           │
│  Row 1038 detail:                                                         │
│  {                                                                        │
│    "attemptedAction": "EDIT",                                             │
│    "resourceId": "hk-jade-upgrade-banner-q2",                            │
│    "contentBizLine": "WEALTH",                                            │
│    "callerBizLines": ["CARDS"],                                           │
│    "reason": "Caller biz line CARDS has no write access to WEALTH"       │
│  }                                                                        │
│                                                                           │
│  [Export CSV]  [Export PDF]  [Verify Chain Integrity]                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Admin Override Audit

When ADMIN acts on another biz line's content, the log captures this explicitly:

```json
{
  "sequenceNum": 1099,
  "occurredAt": "2026-04-19T06:30:00Z",
  "actorId": "admin.ops@hsbc.com.hk",
  "actorRole": "ADMIN",
  "actorBizLines": ["*"],
  "action": "ADMIN_OVERRIDE",
  "resourceType": "CONTENT",
  "resourceId": "hk-cards-balance-transfer-q2",
  "contentBizLine": "CARDS",
  "detail": {
    "overriddenAction": "CONTENT_PUBLISHED",
    "reason": "Emergency regulatory update — HKMA directive 2026-04-19",
    "justification": "Mandatory justification text provided by admin"
  }
}
```

Admin must provide a mandatory `justification` text field for any cross-biz-line action. This is enforced at the API level — no justification → 400 error.
