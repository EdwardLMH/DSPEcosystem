# CMS Maker-Checker Workflow — Design Document

**Document Version:** 1.2  
**Date:** 2026-05-11  
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
│  Language: [🇬🇧 English ▼]  [🇨🇳 繁中] [🇨🇳 简中] [🇸🇦 AR] [🇪🇸 ES]          │
│  (locale pill bar — active locale governs which prop translations show)   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Title *  [en]                                                    │   │
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
│  │  ┌── Content Source ───────┐   ┌──────────────────────────┐      │   │
│  │  │ ◉ UCP  ○ AEM            │   │ Discover Jade Benefits    │      │   │
│  │  │ [Browse UCP Library...] │   └──────────────────────────┘      │   │
│  │  │  — or —                 │                                      │   │
│  │  │ [Browse AEM Assets...]  │   CTA Destination *                  │   │
│  │  │ ┌────────────────────┐  │   ┌──────────────────────────┐      │   │
│  │  │ │   [image preview]  │  │   │ JadeUpgradeJourney        │      │   │
│  │  │ └────────────────────┘  │   └──────────────────────────┘      │   │
│  │  └─────────────────────────┘                                      │   │
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
│  Supported Locales: en · zh-HK · zh-CN · ar · es                        │
│  [Manage Translations →]  (opens per-locale translation editor)          │
│                                                                           │
│  ⓘ Accessibility: all form fields have visible labels; keyboard          │
│    navigable; screen-reader announcements on save/submit.                │
│                                                                           │
│  [Save Draft]                                          [Submit for Review→]│
│  Submitting will notify the Checker team for approval.                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Content Source Picker (Hero Image / Media fields):**

The left-hand content source picker in each media field lets the Maker choose between:
- **UCP** — browse the UCP content library (component registry, asset library) for internally managed assets
- **AEM** — browse HSBC AEM content fragments and assets via the AEM Content Delivery API

Selected content is stored as `contentRef: { source: "UCP" | "AEM", id: "..." }` on the slice. The BFF fetches from the appropriate provider at composition time.

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

---

## 8. Multi-Language Authoring (i18n)

Content in the OCDP and UCP editors is authored in a **primary locale** (typically English) and can be translated into additional supported locales without duplicating the content entry:

| Supported Locale | Language | Notes |
|-----------------|----------|-------|
| `en` | English | Primary authoring locale |
| `zh-HK` | Traditional Chinese | HK, TW markets |
| `zh-CN` | Simplified Chinese | Mainland China market |
| `ar` | Arabic | RTL layout auto-applied |
| `es` | Spanish | LATAM markets |

**Translation model:**
- Base props (`title`, `subtitle`, `ctaText`, `altText`, `description`, `body`) live in `slice.props` for the primary locale
- Locale-specific overrides stored in `page.translations[locale][instanceId][propKey]`
- `getSliceProps(slice, locale, translations)` merges them at render time; falls back to primary locale if translation is missing
- The locale pill bar in the page editor canvas switches between locales; only translatable props are editable when a non-primary locale is active

**Workflow note:** Translation completeness is shown per locale in the Submit modal. Incomplete translations generate a non-blocking warning — Maker can submit and complete translations in a follow-up draft.

---

## 9. Accessibility (WCAG 2.1 AA)

Both OCDP and UCP consoles implement WCAG 2.1 Level AA across all editor and review views:

| Control | Implementation |
|---------|---------------|
| Skip link | `Skip to main content` rendered at page top; `id="main-content"` on main area |
| Keyboard navigation | All panels fully keyboard-navigable; Tab order follows visual reading order |
| Focus rings | `:focus-visible` CSS rules ensure visible focus indicators on all interactive elements |
| Screen reader | Toast alerts use `role="status"` + `aria-live="polite"`; modal dialogs trap focus; `aria-modal="true"` on overlays |
| Form labels | Every input has an associated `<label>` element; required fields marked with `aria-required="true"` |
| Icon-only buttons | `aria-label` on all icon buttons (Save, Delete, Edit, Approve, Reject) |
| Colour contrast | HIVE token palette meets ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components |
| Error messages | Validation errors linked to inputs via `aria-describedby`; errors not communicated by colour alone |
| RTL support | `dir="rtl"` applied to canvas and form when Arabic locale is active; layout mirrors via CSS logical properties |

Maker-Checker status badges (DRAFT / PENDING / APPROVED / PUBLISHED / REJECTED) use both colour and text label — never colour alone — satisfying WCAG 1.4.1 (Use of Colour).
