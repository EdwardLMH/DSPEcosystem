# Content Repository, Versioning & Archive Design

**Document Version:** 1.0  
**Date:** 2026-04-19  
**Scope:** Global/Market content reuse, version history, 7-year audit retention, S3 archive lifecycle  

---

## 1. Overview

The Content Repository provides three capabilities beyond basic CMS authoring:

1. **Reusable Content Library** — Global content (shared across all markets) and Market content (HK, CN, SG) that can be composed into any SDUI screen without re-authoring
2. **Immutable Version History** — Every published state of every content piece is recorded permanently, with the full audit trail (who created, who approved, what changed), accessible to editors, approvers, and auditors
3. **7-Year Retention with S3 Tiered Archive** — All published content versions are stored in S3 with automatic lifecycle tiering: Standard → Infrequent Access → Glacier after defined access thresholds, meeting HKMA/MAS/GDPR retention mandates

---

## 2. Global vs Market Content Model

### 2.1 Content Scope Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GLOBAL CONTENT LIBRARY                            │
│  (Authored once, reusable across ALL markets and SDUI screens)           │
│                                                                           │
│  Examples:                                                                │
│  • HSBC brand header / footer components                                 │
│  • Global product descriptions (HSBC Jade, Premier — core benefits)     │
│  • Legal disclaimer blocks (reusable across all jurisdictions)           │
│  • Brand imagery and icon library                                         │
│  • Global FAQ blocks (general banking education)                          │
│  • HSBC tone-of-voice content templates                                  │
│                                                                           │
│  Rules:                                                                   │
│  • Owned by Global Brand / Group Marketing team                          │
│  • Changes require Global Checker approval                               │
│  • Any market can REFERENCE but not MODIFY global content               │
│  • Versioned independently; market screens reflect latest published ver  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │  Referenced by
          ┌────────────────────────┼────────────────────────┐
          │                        │                         │
          ▼                        ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   HK MARKET     │    │  MAINLAND CHINA      │    │  SINGAPORE MARKET   │
│   CONTENT       │    │  MARKET CONTENT      │    │  CONTENT            │
│                 │    │                      │    │                     │
│ Locale: en-HK   │    │ Locale: zh-CN        │    │ Locale: en-SG       │
│         zh-HK   │    │         zh-HK(cross) │    │         zh-SG       │
│                 │    │                      │    │                     │
│ Regulator:HKMA  │    │ Regulator: PBOC/CBIRC│    │ Regulator: MAS      │
│                 │    │                      │    │                     │
│ Examples:       │    │ Examples:            │    │ Examples:           │
│ • HK rate promos│    │ • CNY campaigns      │    │ • SG CPF mortgage   │
│ • MPF content   │    │ • WeChat-only content│    │ • SG Premier promos │
│ • HKMA notices  │    │ • PBOC disclosures   │    │ • MAS disclaimers   │
│ • HKD products  │    │ • CNY product rates  │    │ • SGD products      │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘

Content Inheritance Rules:
  Market content CAN:
    • Reference global content by contentId (slot reference)
    • Override global content display text for locale
    • Add market-specific FAQ blocks on top of global FAQ
  Market content CANNOT:
    • Modify global content directly (creates a fork — separate entry)
    • Publish content that contradicts global brand guidelines
```

### 2.2 Content Reuse Mechanics in SDUI

```
SDUI Slot Resolution — Reuse Priority Order:

  BFF Slot Resolver checks in order:
  1. Market-specific content for this segment + locale    → use if found
  2. Global content tagged for this segment + locale      → use if found
  3. Market-specific content for any locale               → use with translation
  4. Global content (any locale)                          → use with translation
  5. Default fallback editorial content                   → always present

SDUI JSON — content reference example:
{
  "type": "PromoBanner",
  "id": "jade-banner-slot",
  "props": {
    "contentRef": {
      "scope": "market",
      "market": "HK",
      "contentId": "hk-jade-upgrade-banner-q2",
      "fallbackContentId": "global-jade-benefit-banner"  ← global fallback
    }
  }
}
```

### 2.3 Content Entry Schema — Scope Fields

```json
{
  "contentId": "hk-jade-upgrade-banner-q2",
  "scope": "market",
  "market": "HK",
  "contentType": "PromoBanner",
  "globalReferences": [
    "global-jade-benefit-copy-block",
    "global-hsbc-disclaimer-investment"
  ],
  "locale": ["en-HK", "zh-HK"],
  "eligibleSegments": ["premier", "jade"],
  "channels": ["ios", "android", "web"],
  "validFrom": "2026-04-01",
  "validThrough": "2026-06-30",
  "fields": { ... },
  "faqBlock": [ ... ],
  "authorId": "j.chan@hsbc.com.hk",
  "checkerId": "m.wong@hsbc.com.hk",
  "status": "PUBLISHED",
  "currentVersion": "3",
  "createdAt": "2026-04-15T09:00:00Z",
  "publishedAt": "2026-04-19T14:32:00Z"
}
```

---

## 3. Version History Design

### 3.1 Versioning Model

Every content entry maintains a **linear version chain**. Each published version is an
immutable snapshot. Edits create a new draft version; the live version is never mutated.

```
Content Entry: hk-jade-upgrade-banner-q2
│
├── v1 (PUBLISHED 2026-04-01) ← snapshot in S3 + DB
│   Author: j.chan  Approver: m.wong  Hash: a3f9c2...
│
├── v2 (PUBLISHED 2026-04-10) ← snapshot in S3 + DB
│   Author: j.chan  Approver: m.wong  Hash: b7d2e1...
│   Change: Updated hero image, CTR improved
│
├── v3 (PUBLISHED 2026-04-19) ← CURRENT LIVE
│   Author: j.chan  Approver: m.wong  Hash: c8f3a4...
│   Change: Added zh-HK translation, updated CTA copy
│
└── v4 (DRAFT) ← work in progress, not live
    Author: l.lee  Not yet submitted
```

### 3.2 Version Record Schema

```sql
-- PostgreSQL schema (primary version store)

CREATE TABLE content_versions (
    version_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id        VARCHAR(255) NOT NULL,
    version_number    INTEGER NOT NULL,
    scope             VARCHAR(20) NOT NULL,     -- global | market
    market            VARCHAR(10),              -- HK | CN | SG | null for global
    content_type      VARCHAR(100) NOT NULL,
    status            VARCHAR(30) NOT NULL,     -- DRAFT | PUBLISHED | ARCHIVED
    content_hash      VARCHAR(64) NOT NULL,     -- SHA-256 of full content JSON
    content_s3_key    VARCHAR(512) NOT NULL,    -- pointer to S3 object
    fields_snapshot   JSONB NOT NULL,           -- full content fields at this version
    author_id         VARCHAR(255) NOT NULL,
    checker_id        VARCHAR(255),
    submitted_at      TIMESTAMPTZ,
    approved_at       TIMESTAMPTZ,
    published_at      TIMESTAMPTZ,
    unpublished_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at  TIMESTAMPTZ,             -- updated on each BFF fetch
    UNIQUE(content_id, version_number)
);

CREATE INDEX idx_cv_content_id    ON content_versions(content_id);
CREATE INDEX idx_cv_status        ON content_versions(status);
CREATE INDEX idx_cv_market        ON content_versions(market);
CREATE INDEX idx_cv_published_at  ON content_versions(published_at);
CREATE INDEX idx_cv_last_accessed ON content_versions(last_accessed_at);

-- Audit log — immutable append-only
CREATE TABLE content_audit_log (
    log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id    VARCHAR(255) NOT NULL,
    version_id    UUID NOT NULL REFERENCES content_versions(version_id),
    actor_id      VARCHAR(255) NOT NULL,
    actor_role    VARCHAR(50) NOT NULL,   -- MAKER | CHECKER | ADMIN | SYSTEM
    action        VARCHAR(100) NOT NULL,
    detail        TEXT,
    content_hash  VARCHAR(64),           -- hash at time of action
    ip_address    INET,
    device_info   TEXT,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Retention: DO NOT DELETE. Archive flag only.
CREATE INDEX idx_cal_content_id  ON content_audit_log(content_id);
CREATE INDEX idx_cal_occurred_at ON content_audit_log(occurred_at);
CREATE INDEX idx_cal_actor_id    ON content_audit_log(actor_id);
```

---

## 4. Version History UI

### 4.1 Version History Panel (CMS)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VERSION HISTORY — Jade Upgrade Banner Q2                [Export CSV]   │
│  Content ID: hk-jade-upgrade-banner-q2   Market: HK   Type: PromoBanner│
├──────────────────────────────────────────────────────────────────────────┤
│  Filter: [ All Versions ] [ Published Only ] [ My Versions ]             │
│                                                                           │
│  Ver │ Status       │ Author     │ Approver   │ Published      │ Action  │
│  ────┼──────────────┼────────────┼────────────┼────────────────┼──────── │
│  v4  │ 🟡 DRAFT     │ L.Lee      │ —          │ —              │ [Edit]  │
│  v3  │ 🟢 PUBLISHED │ J.Chan     │ M.Wong     │ 2026-04-19     │ [View]  │
│  v2  │ ⚫ SUPERSEDED│ J.Chan     │ M.Wong     │ 2026-04-10     │ [View]  │
│  v1  │ ⚫ SUPERSEDED│ J.Chan     │ M.Wong     │ 2026-04-01     │ [View]  │
│                                                                           │
│  [Compare v3 vs v2]    [Restore v2 as new Draft]                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Version Detail View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VERSION DETAIL — v3 (PUBLISHED)                                         │
│  Content ID: hk-jade-upgrade-banner-q2                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  Content Hash (SHA-256):  c8f3a4d2e1b9...                               │
│  S3 Location: s3://hsbc-content-archive/HK/2026/04/hk-jade.../v3.json  │
│                                                                           │
│  AUDIT TRAIL                                                              │
│  ──────────────────────────────────────────────────────────────────────  │
│  2026-04-19 14:32 HKT  M.Wong (CHECKER)   PUBLISHED to production       │
│  2026-04-19 14:28 HKT  M.Wong (CHECKER)   APPROVED after device preview │
│  2026-04-19 11:00 HKT  M.Wong (CHECKER)   Scanned preview on iPhone 15  │
│  2026-04-19 10:45 HKT  M.Wong (CHECKER)   APPROVED → Preview generated  │
│  2026-04-19 09:15 HKT  J.Chan (MAKER)     Submitted for review          │
│  2026-04-19 09:00 HKT  J.Chan (MAKER)     Saved draft v3               │
│  2026-04-18 16:30 HKT  M.Wong (CHECKER)   REJECTED: "add zh-HK FAQ"    │
│                                                                           │
│  CONTENT SNAPSHOT (read-only)                                             │
│  ──────────────────────────────────────────────────────────────────────  │
│  Title:    Elevate to HSBC Jade                                          │
│  Subtitle: Exclusive benefits for Premier customers with HKD 7.8M+      │
│  CTA:      Discover Jade Benefits → JadeUpgradeJourney                  │
│  Segments: premier, jade                                                 │
│  Locales:  en-HK, zh-HK                                                 │
│  FAQ:      3 Q&A pairs [Expand]                                          │
│                                                                           │
│  [Download JSON Snapshot]   [View in S3]   [Restore as Draft]           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Diff View (Compare Versions)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DIFF: v3 vs v2 — Jade Upgrade Banner Q2                                │
├──────────────────────────────────────────────────────────────────────────┤
│  Field              │ v2 (2026-04-10)           │ v3 (2026-04-19)       │
│  ───────────────────┼───────────────────────────┼──────────────────────│
│  Title              │ Elevate to HSBC Jade       │ Elevate to HSBC Jade │
│  Subtitle           │ Exclusive benefits         │ Exclusive benefits...│
│                     │ (en-HK only)              │ + zh-HK translation  │
│  CTA Text           │ Learn More                 │ Discover Jade Benefit│ ← changed
│  FAQ Count          │ 2 pairs                    │ 3 pairs              │ ← added
│  Hero Image         │ jade-hero-v1.webp          │ jade-hero-v2.webp    │ ← changed
│  Locales            │ en-HK                      │ en-HK, zh-HK         │ ← added
│                                                                           │
│  Change Summary: CTA copy updated, zh-HK added, FAQ expanded, new image │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. S3 Storage Architecture

### 5.1 Bucket Structure

```
S3 Bucket: hsbc-content-repository-{env}
│
├── global/                          ← Global content
│   ├── 2026/04/
│   │   ├── global-jade-benefit-copy/
│   │   │   ├── v1.json              ← Full content snapshot
│   │   │   ├── v1.audit.json        ← Audit log snapshot
│   │   │   ├── v2.json
│   │   │   └── v2.audit.json
│   │   └── global-hsbc-disclaimer/
│   │       ├── v1.json
│   │       └── v1.audit.json
│
├── markets/
│   ├── HK/
│   │   ├── 2026/04/
│   │   │   ├── hk-jade-upgrade-banner-q2/
│   │   │   │   ├── v1.json
│   │   │   │   ├── v1.audit.json
│   │   │   │   ├── v2.json
│   │   │   │   ├── v2.audit.json
│   │   │   │   ├── v3.json          ← current published
│   │   │   │   └── v3.audit.json
│   │   │   └── hk-mortgage-rate-may2026/
│   ├── CN/
│   │   └── 2026/04/
│   │       └── cn-cny-promo-wechat/
│   └── SG/
│       └── 2026/04/
│           └── sg-premier-promo-q2/
│
└── sdui-payloads/                   ← Full SDUI JSON snapshots per publish
    ├── HK/
    │   ├── 2026/04/19/
    │   │   ├── screen-home-segment-premier-v3.json
    │   │   └── screen-home-segment-jade-v3.json
    ├── CN/
    └── SG/
```

### 5.2 Storage Tiers and Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        S3 Lifecycle Policy                               │
│                                                                           │
│  TIER 1 — S3 Standard                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Age: 0 – 12 months                                              │   │
│  │  Access pattern: Active / frequent                               │   │
│  │  Use: Recent content, active audits, BFF fallback reads          │   │
│  │  Cost: ~$0.023/GB/month                                          │   │
│  │  Transition trigger: Object not accessed for 365 days            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           │ Auto-transition (S3 Lifecycle Rule)          │
│                           ▼                                               │
│  TIER 2 — S3 Standard-Infrequent Access (S3-IA)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Age: 12 months – 3 years                                        │   │
│  │  Access pattern: Occasional audit / compliance review            │   │
│  │  Use: Auditor access, regulatory inquiry, legal hold             │   │
│  │  Cost: ~$0.0125/GB/month (45% cheaper than Standard)            │   │
│  │  Retrieval: Immediate (milliseconds)                             │   │
│  │  Transition trigger: Age > 3 years AND not accessed in 90 days  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           │ Auto-transition                               │
│                           ▼                                               │
│  TIER 3 — S3 Glacier Instant Retrieval                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Age: 3 – 7 years                                                │   │
│  │  Access pattern: Rare — regulatory demand only                   │   │
│  │  Use: Long-term compliance archive, regulatory subpoena          │   │
│  │  Cost: ~$0.004/GB/month (83% cheaper than Standard)             │   │
│  │  Retrieval: Milliseconds (Instant), minutes (Flexible)          │   │
│  │  Minimum retention: 7 years from publish date (HKMA mandate)    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           │ Expiry                                        │
│                           ▼                                               │
│  TIER 4 — Permanent Delete (after 7 years + legal hold check)            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Automatic deletion 7 years after publish date                   │   │
│  │  BLOCKED if legal hold flag set on content record               │   │
│  │  Deletion logged to immutable compliance log (CloudTrail)        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 S3 Lifecycle Configuration (IaC — CloudFormation / Terraform)

```yaml
# S3 Lifecycle Rules for hsbc-content-repository

LifecycleConfiguration:
  Rules:
    - Id: "StandardToIA-After365Days"
      Status: Enabled
      Filter:
        Prefix: ""                    # applies to all objects
      Transitions:
        - TransitionInDays: 365
          StorageClass: STANDARD_IA
      NoncurrentVersionTransitions:
        - NoncurrentDays: 90
          StorageClass: STANDARD_IA

    - Id: "IAToGlacier-After1095Days"
      Status: Enabled
      Filter:
        Prefix: ""
      Transitions:
        - TransitionInDays: 1095      # 3 years
          StorageClass: GLACIER_IR
      NoncurrentVersionTransitions:
        - NoncurrentDays: 365
          StorageClass: GLACIER_IR

    - Id: "DeleteAfter7Years"
      Status: Enabled
      Filter:
        Prefix: ""
        Tags:
          - Key: legal-hold
            Value: "false"            # only delete if NOT on legal hold
      Expiration:
        Days: 2555                    # 7 years
      NoncurrentVersionExpiration:
        NoncurrentDays: 2555

# Object tagging strategy (set at upload time):
# Tag: market=HK|CN|SG|GLOBAL
# Tag: content-type=PromoBanner|Guide|FAQ|Journey
# Tag: publish-date=2026-04-19
# Tag: legal-hold=false  (set to true if under regulatory/legal hold)
# Tag: retention-class=standard|extended  (extended = >7 years)
```

### 5.4 Archive Trigger Logic (Access-Based)

```
Last Access Date Tracking:

  Every time BFF fetches content by contentId+version:
    → UPDATE content_versions SET last_accessed_at = NOW()
       WHERE content_id = ? AND version_number = ?

  Nightly Archive Eligibility Job (Python):
    Query: SELECT * FROM content_versions
           WHERE status = 'PUBLISHED'
             AND last_accessed_at < NOW() - INTERVAL '1 year'
             AND s3_storage_class = 'STANDARD'

    For each eligible record:
      → Call S3 CopyObject with STANDARD_IA storage class
      → Update content_versions.s3_storage_class = 'STANDARD_IA'
      → Log to content_audit_log: action='ARCHIVED_TO_IA', actor_role='SYSTEM'
```

---

## 6. Auditor Access View

### 6.1 Auditor-Specific Dashboard (Read-Only Role)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HSBC UCP — Audit Console                              Role: AUDITOR     │
├──────────────────────────────────────────────────────────────────────────┤
│  Search & Filter                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Content ID / Title: [jade upgrade banner          ] [Search]    │  │
│  │  Market: [ All ▼]   Date Range: [2026-01-01] to [2026-04-19]    │  │
│  │  Actor: [all users ▼]  Action: [all actions ▼]  Status: [All ▼] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Results: 247 records matching                        [Export CSV] [PDF] │
│                                                                           │
│  DateTime (HKT)       │ Content ID               │ Actor   │ Action      │
│  ─────────────────────┼──────────────────────────┼─────────┼─────────── │
│  2026-04-19 14:32     │ hk-jade-upgrade-banner-q2│ m.wong  │ PUBLISHED   │
│  2026-04-19 14:28     │ hk-jade-upgrade-banner-q2│ m.wong  │ APPROVED    │
│  2026-04-19 09:15     │ hk-jade-upgrade-banner-q2│ j.chan  │ SUBMITTED   │
│  2026-04-10 11:00     │ hk-jade-upgrade-banner-q2│ m.wong  │ PUBLISHED   │
│  ...                                                                      │
│                                                                           │
│  [View Full Audit Detail]  [Download Version Snapshot]  [View in S3]    │
│                                                                           │
│  ⚠ All audit records are read-only. Auditors cannot modify content.      │
│    Records retained for 7 years per HKMA TM-G-2 guidelines.             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 7-Year Retention Policy Summary

| Requirement | Implementation |
|-------------|----------------|
| Minimum retention period | 7 years from publish date (HKMA, MAS, GDPR Article 17(3)) |
| Content snapshot | Full JSON of every published version stored in S3 on publish |
| Audit log retention | Append-only PostgreSQL table + S3 copy; 7-year minimum |
| SDUI payload snapshots | Full SDUI JSON per screen per publish event stored in S3 |
| Deletion control | S3 Object Lock (Compliance mode) on audit objects — cannot be deleted even by admin |
| Legal hold | `legal-hold=true` S3 tag blocks lifecycle expiry indefinitely |
| Access logging | S3 Server Access Logging + CloudTrail for all S3 API calls |
| Tamper evidence | Content hash (SHA-256) stored in DB + S3 object metadata; mismatch = integrity alert |
| Regulatory export | Auditor can export any version + full audit trail as PDF/CSV on demand |
| Data residency | HK content in `ap-east-1` (Hong Kong); CN content in CN-resident storage; SG in `ap-southeast-1` |
