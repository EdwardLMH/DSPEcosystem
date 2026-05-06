# CMS Maker-Checker Workflow — Design Document

**Document Version:** 1.1  
**Date:** 2026-05-04  
**Scope:** OCDP/UCP Console content governance, approval workflow, audit trail  

---

## 1. Overview

In banking, no customer-facing content — especially promotional material making rate claims,
eligibility statements, or benefit descriptions — can go live without a formal approval gate.
The Maker-Checker pattern is the standard control in financial services:

- **Maker (AUTHOR role):** Creates or edits content within their assigned biz line. Cannot approve their own work.
- **Checker (APPROVER role):** Reviews and approves (or rejects) the Maker's submission within their biz line. Must be a different person.
- **AUDITOR role:** Read-only access across all biz lines and the full audit log.
- **ADMIN role:** Full access across all biz lines; must supply justification for cross-biz-line writes.

This ensures **segregation of duties** — a core HKMA and internal audit requirement. See `docs/11_ad_rbac_design.md` for the full AD group naming convention and permission matrix.

---

## 2. Roles and Permissions

| Role (AD Group Suffix) | Can Do | Cannot Do |
|------------------------|--------|-----------|
| **AUTHOR** (Maker) | Create, edit, delete drafts in own biz line; submit for review; preview on device | Approve own content; access other biz lines' drafts; publish directly |
| **APPROVER** (Checker) | Review submissions in own biz line; approve or reject with mandatory comment; preview on device; trigger publish | Approve content they authored (Maker-Checker); create or edit content |
| **AUDITOR** (Read-only) | View all content and full audit log across all biz lines | Edit, approve, or publish anything |
| **ADMIN** | All of the above across all biz lines; manage users; emergency unpublish | Must supply justification for cross-biz-line writes |

---

## 3. Content State Machine

```
                         ┌───────────────────┐
                         │      DRAFT        │
                         │  (Maker working)  │
                         └────────┬──────────┘
                                  │  Maker clicks "Submit for Review"
                                  │  + mandatory fields validated
                                  │  + AEO score computed
                                  ▼
                    ┌─────────────────────────┐
                    │   PENDING_REVIEW         │
                    │   Checker notified       │
                    │   (email + CMS badge)    │
                    └──────┬──────────┬────────┘
                           │          │
               Checker     │          │  Checker
               Rejects     │          │  Approves
               + comment   │          │
                           ▼          ▼
                    ┌──────────┐  ┌──────────────────────┐
                    │ REJECTED │  │  PENDING_PREVIEW      │
                    │ (Maker   │  │  Preview URL + QR     │
                    │  notified│  │  generated for device │
                    │  with    │  │  testing              │
                    │  comment)│  └──────┬───────┬────────┘
                    └──────────┘         │       │
                         │               │       │
                 Maker   │     Checker   │       │  Checker
                 edits   │     Rejects   │       │  Approves
                 →DRAFT  │     after     │       │  on-device
                         │     preview   │       │
                         ▼               ▼       ▼
                    ┌──────────┐  ┌─────────────────────┐
                    │ REJECTED │  │     APPROVED         │
                    │ _PREVIEW │  │  Ready to publish    │
                    └──────────┘  └──────────┬───────────┘
                                             │  Checker or Admin
                                             │  clicks "Publish"
                                             ▼
                                    ┌─────────────────┐
                                    │    PUBLISHED     │
                                    │  Live on prod    │
                                    │  BFF cache       │
                                    │  invalidated     │
                                    └────────┬─────────┘
                                             │  Maker edits
                                             │  (creates new version)
                                             ▼
                                    ┌─────────────────┐
                                    │  PUBLISHED +     │
                                    │  DRAFT (v2)      │
                                    │  Previous ver    │
                                    │  stays live      │
                                    └─────────────────┘
```

---

## 4. CMS UI Design — Screen by Screen

### 4.1 Content List View (Maker)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HSBC UCP — Content Library                    [+ New Content]  [Filter]│
├──────────────────────────────────────────────────────────────────────────┤
│  Filter: [ All ] [ My Content ] [ Pending My Action ] [ Published ]      │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Title                    │ Type    │ Status          │ Updated      │ │
│  ├───────────────────────────┼─────────┼─────────────────┼─────────────┤ │
│  │  Jade Upgrade Banner Q2   │ Banner  │ 🟡 DRAFT        │ 2h ago      │ │
│  │  CC Visa Platinum Promo   │ Banner  │ 🔵 PENDING_REV  │ 1d ago      │ │
│  │  SmartMortgage Guide      │ Guide   │ 🟣 PENDING_PREV │ 3d ago      │ │
│  │  Savings Rate May 2026    │ Rates   │ 🟢 PUBLISHED    │ 5d ago      │ │
│  │  Premier Welcome Journey  │ Journey │ 🔴 REJECTED     │ 1w ago      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Status Legend:                                                           │
│  🟡 DRAFT  🔵 PENDING_REVIEW  🟣 PENDING_PREVIEW  🟢 PUBLISHED  🔴 REJECTED│
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Content Editor (Maker View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back   Jade Upgrade Banner Q2              [Save Draft]  [Submit →]  │
├──────────────────────────────────────────────────────────────────────────┤
│  CONTENT          SEGMENTS       LOCALISATION    AEO         AUDIT LOG   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Title *                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Elevate to HSBC Jade                                      │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Subtitle                                                         │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Exclusive benefits for Premier customers                  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Hero Image *                  CTA Text *                         │   │
│  │  [Upload / Browse CDN]         ┌──────────────────────────┐      │   │
│  │  ┌────────────┐                │ Discover Jade Benefits    │      │   │
│  │  │ [preview]  │                └──────────────────────────┘      │   │
│  │  └────────────┘                                                   │   │
│  │                                CTA Destination *                  │   │
│  │                                ┌──────────────────────────┐      │   │
│  │                                │ JadeUpgradeJourney        │      │   │
│  │                                └──────────────────────────┘      │   │
│  │                                                                   │   │
│  │  Eligible Segments *           Valid From / To                    │   │
│  │  ☑ Premier   ☑ Jade            2026-04-01  →  2026-06-30         │   │
│  │  ☐ Advance   ☐ Mass Retail                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────── FAQ Block (min 3 required for AEO) ────────────┐  │
│  │  Q1: What are the benefits of HSBC Jade?                           │  │
│  │  A1: HSBC Jade provides...                          [Edit] [Del]   │  │
│  │  Q2: Who qualifies for HSBC Jade?                                  │  │
│  │  A2: Customers with HKD 7.8M+ in...                [Edit] [Del]   │  │
│  │  Q3: How do I apply for Jade upgrade?                              │  │
│  │  A3: Existing Premier customers can...              [Edit] [Del]   │  │
│  │  [+ Add FAQ]                                                        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  AEO Score: 82/100 (Grade A) ✅         Last Reviewed: 2026-04-15       │
│                                                                           │
│  [Save Draft]                                          [Submit for Review→]│
│  Submitting will notify the Checker team for approval.                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Checker Review View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back   REVIEW: Jade Upgrade Banner Q2         Submitted by: J.Chan   │
│           Submitted: 2026-04-19 09:15 HKT         [⚑ Flag Issue]        │
├──────────────────────────────────────────────────────────────────────────┤
│  CONTENT PREVIEW      DIFF (vs current live)     AUDIT LOG              │
│                                                                           │
│  ┌──────────── Content Preview ──────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────┐                              │  │
│  │  │  [Hero Image]                   │ ← Full preview rendered here │  │
│  │  │  Elevate to HSBC Jade           │                              │  │
│  │  │  Exclusive benefits for         │                              │  │
│  │  │  Premier customers              │                              │  │
│  │  │  [Discover Jade Benefits]       │                              │  │
│  │  └─────────────────────────────────┘                              │  │
│  │                                                                     │  │
│  │  AEO Score: 82/100 (A)   Segments: Premier, Jade                  │  │
│  │  Locale: en-HK, zh-HK   Valid: 2026-04-01 – 2026-06-30           │  │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌──────────── Device Preview ───────────────────────────────────────┐  │
│  │  Scan to preview on actual device:                                  │  │
│  │                                                                     │  │
│  │   iOS/Android         WeChat Mini Program                          │  │
│  │   ┌─────────┐         ┌─────────┐                                 │  │
│  │   │ QR CODE │         │ QR CODE │                                  │  │
│  │   │  (iOS/  │         │(WeChat) │                                  │  │
│  │   │Android) │         │         │                                  │  │
│  │   └─────────┘         └─────────┘                                  │  │
│  │   preview.hsbc.com.hk/preview/tok_8f3a2b  (expires 48h)           │  │
│  │                                                                     │  │
│  │  [Send Preview Link via Email]  [Copy Link]                        │  │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌──────────── Checker Decision ─────────────────────────────────────┐  │
│  │  Comments (required for rejection):                                 │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │                                                             │    │  │
│  │  └───────────────────────────────────────────────────────────┘    │  │
│  │                                                                     │  │
│  │  [✗ Reject — Back to Maker]    [✓ Approve & Generate Preview]      │  │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Final Publish (After On-Device Approval)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APPROVED: Jade Upgrade Banner Q2                                         │
│  Approved by: M.Wong (Checker)  2026-04-19 14:30 HKT                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ✅ Content approved after on-device preview                              │
│  ✅ AEO score: 82/100                                                     │
│  ✅ Legal review: Approved by M.Wong                                     │
│  ✅ Schema.org will be auto-generated on publish                          │
│                                                                           │
│  Publish Settings:                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Publish Immediately  ◉   Schedule: ○  2026-05-01  09:00 HKT     │  │
│  │  Channels: ☑ iOS  ☑ Android  ☑ Web  ☑ WeChat Mini Program       │  │
│  │  Locales:  ☑ en-HK  ☑ zh-HK  ☐ en-GB                           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ⚠ Publishing will replace the current live banner for Premier/Jade      │
│    segments and invalidate the BFF cache immediately.                    │
│                                                                           │
│             [Cancel]          [🚀 Publish to Production]                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Audit Log Design

Every action is immutably logged. Auditors and admins can view full history per content item.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AUDIT LOG — Jade Upgrade Banner Q2                                       │
├──────────────────────────────────────────────────────────────────────────┤
│  Timestamp (HKT)     │ User        │ Role    │ Action                    │
├──────────────────────┼─────────────┼─────────┼───────────────────────────┤
│  2026-04-19 14:32    │ M.Wong      │ Checker │ PUBLISHED to production   │
│  2026-04-19 14:28    │ M.Wong      │ Checker │ APPROVED after preview    │
│  2026-04-19 11:00    │ M.Wong      │ Checker │ Preview scanned on device │
│  2026-04-19 10:45    │ M.Wong      │ Checker │ APPROVED → Preview URL    │
│  2026-04-19 09:15    │ J.Chan      │ Maker   │ Submitted for review      │
│  2026-04-19 09:00    │ J.Chan      │ Maker   │ Saved draft (v3)          │
│  2026-04-18 16:30    │ M.Wong      │ Checker │ REJECTED — "update FAQ"   │
│  2026-04-18 14:00    │ J.Chan      │ Maker   │ Submitted for review      │
│  2026-04-18 10:00    │ J.Chan      │ Maker   │ Created draft             │
└─────────────────────────────────────────────────────────────────────────┘
│  Content hash (SHA-256) at publish: a3f9c2d1...   [Export CSV]           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Notification Design

| Event | Maker Notified | Checker Notified |
|-------|---------------|-----------------|
| Draft submitted | — | Email + CMS badge count |
| Checker rejects | Email + CMS alert | — |
| Checker approves → preview | Email + "preview ready" | — |
| Checker approves on-device | Email + "ready to publish" | — |
| Published | Email confirmation | Email confirmation |
| Scheduled publish due | — | Email reminder 24h before |
| Content expires (validThrough) | Email warning 7 days before | — |

---

## 7. Segregation of Duties Rules

- Maker **cannot** approve their own content — enforced at API level (not just UI)
- Checker **cannot** be the same person as Maker on the same content version
- Emergency override (Admin) is logged with mandatory justification text
- All approvals require 2FA authentication (HSBC SSO with hardware token)
- Content hash recorded at each state transition for tamper evidence
