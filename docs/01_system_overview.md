# HSBC Digital Sales Promotion Ecosystem — System Overview

**Document Version:** 1.4  
**Classification:** Internal — Confidential  
**Last Updated:** 2026-05-11  
**Author:** Platform Architecture Team  
**Status:** Approved  
**Review Cycle:** Quarterly  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Context Diagram](#2-system-context-diagram)
   - [Omni-Channel Delivery Model](#2b-omni-channel-delivery-model)
   - [Announcement Overlay Page Model](#2c-announcement-overlay-page-model)
3. [Three-Layer Architecture](#3-three-layer-architecture)
4. [Component Responsibilities](#4-component-responsibilities)
5. [Integration Points](#5-integration-points)
6. [End-to-End Data Flow](#6-end-to-end-data-flow)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Security and Compliance](#9-security-and-compliance)
10. [Technology Stack](#10-technology-stack)

---

## 1. Executive Summary

**HSBC Digital Sales Promotion Ecosystem (DSPE)** is a content orchestration ecosystem that lets marketing and product teams publish, personalise, and optimise promotional experiences across all HSBC digital channels — without app releases or engineering sprints.

- **Publish in Seconds, Not Sprints** — Content goes from draft to live across iOS, Android, HarmonyOS NEXT, Web, and WeChat in under 60 seconds, with no App Store dependency.

- **Discoverable by AI Search Engines** — Every public page is scored for Answer Engine Optimisation (AEO) before publish, with daily monitoring of whether HSBC is cited by ChatGPT, Perplexity, DeepSeek, and Doubao — ensuring brand visibility wherever customers research financial products.

- **Personalise and Measure in One Loop** — Every screen is tailored by customer segment with built-in A/B testing. Analytics scores flow back to editors as actionable recommendations, not raw dashboards.

- **Govern by Design** — Maker-Checker workflows, business-line access control, and an immutable audit log satisfy HKMA, GDPR, and PIPL requirements without slowing editors down.

- **Author Once, Deliver Everywhere** — One console publishes to five native platforms, server-rendered SEO pages, and WeChat — each with the right rendering, analytics, and data residency.

- **Unified Platform** — Brings together UCP (content management), OCDP (page authoring and approvals), DAP (analytics and AEO monitoring), native mobile and web SDUI renderers, WeChat channel, and content from **both UCP and Adobe AEM** — through a single BFF composition engine. OCDP treats UCP and HSBC AEM as peer content providers: the page-editor left-hand panel lets authors browse and select content from either source to compose pages.

- **Multi-Language & Accessibility by Design** — All staff consoles (OCDP and UCP) implement WCAG 2.1 AA accessibility and support multi-locale authoring across English, Traditional Chinese, Simplified Chinese, Arabic (RTL), and Spanish. Locale-aware content lives in a structured `translations` map keyed by locale and slice instance; RTL layout is applied automatically when Arabic is active.

- **Mobile Intelligence Operations** — miPaaS (Mobile Intelligence PaaS) provides business and IT operators with unified visibility into mobile app performance (MAU/DAU, journey conversion, customer feedback) and full governance over the plugin and journey lifecycle within the PlatformHub mobile apps — without requiring app store releases.

---

## 2. System Context Diagram

```
 ╔══════════════════════════════════════════════════════════════════════════════════════╗
 ║                    HSBC Digital Sales Promotion Ecosystem (DSPE)                      ║
 ║                                                                                      ║
 ║  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────────┐               ║
 ║  │ OCDP/UCP     │   │   Java BFF       │   │  DAP (Analytics)       │               ║
 ║  │ Consoles     │◄──►  (SDUI Engine +  │◄──►  Behavioral / Survey / │               ║
 ║  │ (mock-BFF)   │   │  Personalisation)│   │  App Store / AEO       │               ║
 ║  └──────────────┘   └──────────────────┘   └────────────────────────┘               ║
 ║                              │  ▲                       │  ▲                         ║
 ║                   SDUI JSON  │  │ analytics events      │  │ CPS scores + alerts     ║
 ║                   screens    │  │                       │  │                         ║
 ║                              │  │              ┌────────▼──┴───────────────────┐    ║
 ║                              │  │              │  miPaaS (Mobile Intelligence  │    ║
 ║                              │  │              │  PaaS)                        │    ║
 ║                              │  │              │  App Intelligence · Plugin &  │    ║
 ║                              │  │              │  Journey Governance · Registry│    ║
 ║                              │  │              └────────┬──────────────────────┘    ║
 ║                              │  │              plugin manifest + controls │          ║
 ╚══════════════════════════════╪══╪══════════════════════════════════╪═════════════════╝
                                ▼  │                                  ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │  PlatformHub — Mobile Native Apps                                                  │
 │  Redux / Data-Driven Design · Plugin Registry · Journey Engine                    │
 │                                                                                    │
 │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
 │  │ iOS App  │  │ Android  │  │ HarmonyOS NEXT   │  │ Journeys: OBKYC / Wealth │  │
 │  │ SwiftUI  │  │ Compose  │  │ ArkUI / ArkTS    │  │ Plugins: KYC / FX / ...  │  │
 │  └──────────┘  └──────────┘  └──────────────────┘  └──────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────────────┘
                                ▲  ▼
              ┌─────────────────┴─────────────────────────┐
              │  Customers                                  │
              │  iOS / Android / HarmonyOS NEXT / Web /    │
              │  WeChat Mini Programme                      │
              └────────────────────────────────────────────┘
                                ▲  ▼
              ┌─────────────────┴──────────────────────────┐
              │  External Systems                           │
              │  • Core Banking (eligibility, KYC)          │
              │  • Identity / OAuth2 (IAM)                  │
              │  • CDN (CloudFront / Tencent)               │
              │  • App Stores (iOS/Android/Huawei AppGallery)│
              │  • LLM Engines (ChatGPT, Perplexity)        │
              │  • Qualtrics (surveys)                      │
              │  • Optimizely / LaunchDarkly (A/B, flags)   │
              │  • HSBC AD / LDAP (auth, teams)             │
              │  • ServiceNow CMDB (app system registry)    │
              └────────────────────────────────────────────┘
```

---

## 2b. Omni-Channel Delivery Model

The OCDP Console delivers content through **three distinct channels**, each with different rendering, distribution, and optimisation characteristics:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OCDP — Omni-Channel Delivery Architecture                     │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  OCDP Console (Authoring)                                                    │ │
│  │                                                                               │ │
│  │  Page / Journey → select Channel:                                            │ │
│  │    ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │ │
│  │    │  📱 SDUI          │  │  🌐 WEB_STANDARD   │  │  💬 WEB_WECHAT        │   │ │
│  │    │                  │  │                   │  │                       │   │ │
│  │    │ Select native    │  │ SEO metadata:     │  │ WeChat share title    │   │ │
│  │    │ targets:         │  │  • webMetaTitle   │  │ WeChat share desc     │   │ │
│  │    │  ☑ iOS           │  │  • webMetaDesc    │  │ WeChat page URL       │   │ │
│  │    │  ☑ Android       │  │  • webSlug        │  │                       │   │ │
│  │    │  ☑ HarmonyNext   │  │  • layoutTemplate │  │ Rendered in WeChat    │   │ │
│  │    │  ☑ Web           │  │                   │  │ Mini Programme H5     │   │ │
│  │    └──────┬───────────┘  │ AEO Assessment:   │  └───────────┬───────────┘   │ │
│  │           │              │  ✅ Gate on submit │              │               │ │
│  │           │              │  Score A-F (100pt) │              │               │ │
│  │           │              └─────────┬─────────┘              │               │ │
│  └───────────┼────────────────────────┼────────────────────────┼───────────────┘ │
│              │                        │                        │                   │
│              ▼                        ▼                        ▼                   │
│  ┌───────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐    │
│  │  Java BFF          │  │  Web Standard Server   │  │ WeChat H5 / Mini Prog │    │
│  │  SDUI Composition  │  │  SSR / static pages    │  │                        │    │
│  │  Engine             │  │  JSON-LD structured    │  │ China-hosted endpoint  │    │
│  │  + Personalisation │  │  data in <head>        │  │                        │    │
│  │  + A/B Allocation  │  │  Crawlable by LLMs     │  │                        │    │
│  └──────┬─────────────┘  │  + search engines      │  └──────────┬─────────────┘    │
│         │                └──────┬────────────────┘             │                   │
│         │                       │                              │                   │
│         ▼                       ▼                              ▼                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                      Presentation / Client Layer                            │   │
│  │                                                                              │   │
│  │  SDUI Channel                    Web Standard            WeChat Channel      │   │
│  │  ┌───────┐ ┌───────┐            ┌──────────┐           ┌──────────────┐     │   │
│  │  │ iOS   │ │Android│            │ HSBC.com │           │ WeChat Mini  │     │   │
│  │  │SwiftUI│ │Compose│            │ product  │           │ Programme    │     │   │
│  │  └───────┘ └───────┘            │ pages    │           │ (H5 WebView) │     │   │
│  │  ┌──────────┐ ┌──────┐         │ Server-  │           └──────────────┘     │   │
│  │  │HarmonyOS │ │ Web  │         │ rendered │                                │   │
│  │  │  NEXT    │ │React │         │ HTML     │                                │   │
│  │  │  ArkUI   │ │SDUI  │         └──────────┘                                │   │
│  │  └──────────┘ └──────┘                                                      │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│              │                       │                              │               │
│              ▼                       ▼                              ▼               │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                     DAP — Digital Analytics Platform                        │   │
│  │                                                                              │   │
│  │  SDUI channels:              Web Standard:              WeChat:              │   │
│  │  Tealium (overseas)         AEO Probe Service           SensorData (神策)    │   │
│  │  SensorData (China)         (daily LLM citation         WeChat Analytics     │   │
│  │  Behavioural events         monitoring via              Mini Programme       │   │
│  │  Impression tracking        ChatGPT + Perplexity)       data pipeline        │   │
│  │                              │                                               │   │
│  │                              ▼                                               │   │
│  │  ┌──────────────────────────────────────────────────────┐                   │   │
│  │  │  Content Performance Scoring Engine (every 6h)        │                   │   │
│  │  │  CPS = CTR + Conversion + NPS + AEO + Sentiment       │                   │   │
│  │  │                                                        │                   │   │
│  │  │  AEO signals (Web Standard only):                      │                   │   │
│  │  │    • OCDP AEO Score (A-F grade at authoring time)     │                   │   │
│  │  │    • DAP AEO Probe (daily LLM citation share)         │                   │   │
│  │  │    • Schema.org validation (FAQPage, FinancialProduct)│                   │   │
│  │  │                                                        │                   │   │
│  │  │  Feedback Loop → OCDP AEO Panel + Slack alerts         │                   │   │
│  │  └──────────────────────────────────────────────────────┘                   │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Channel Comparison

| Aspect | SDUI | WEB_STANDARD | WEB_WECHAT |
|--------|------|-------------|------------|
| **Rendering** | Native UI from JSON (SwiftUI / Compose / ArkUI / React) | Server-rendered HTML with JSON-LD structured data | H5 WebView inside WeChat Mini Programme |
| **Native targets** | iOS, Android, HarmonyOS NEXT, Web | N/A (browser only) | N/A (WeChat only) |
| **SEO / AEO** | Not crawlable; no SEO relevance | Full SEO: meta tags, slugs, Schema.org, `llms.txt` | Limited; WeChat internal search only |
| **AEO Assessment** | Not applicable | Mandatory gate on submit (100-point score, A-F grade) | Not applicable |
| **DAP AEO Probe** | Not monitored | Daily LLM citation monitoring (ChatGPT, Perplexity) | Not monitored |
| **Personalisation** | BFF-driven (segment, A/B, ML) | Limited (segment-aware content selection) | Campaign-based |
| **Analytics** | Tealium (overseas) / SensorData (China) | Google Analytics + Schema.org signals | SensorData (China) + WeChat Analytics |
| **Update cycle** | CMS publish → live in < 60s (no app release) | CMS publish → CDN invalidation | CMS publish → WeChat review |
| **Data residency** | Per-region (AWS overseas, China cloud) | Global (CloudFront CDN) | China-only (PIPL) |

### AEO Assessment Flow (Web Standard only)

```
OCDP Console                                  DAP
    │                                           │
    │  1. Author creates page                   │
    │     channel = WEB_STANDARD                │
    │     fills webMetaTitle, webSlug,           │
    │     webMetaDescription, FAQ content        │
    │                                           │
    │  2. Author clicks "Submit for Approval"   │
    │     │                                     │
    │     ▼                                     │
    │  AEO Calculator runs (client-side):       │
    │    SEO Metadata    (40 pts)               │
    │    Content Structure (30 pts)              │
    │    Content Quality   (20 pts)              │
    │    Technical SEO     (10 pts)              │
    │    ─────────────────────────               │
    │    Total → Grade A/B/C/D/F                │
    │     │                                     │
    │     ▼                                     │
    │  AEO Assessment Modal shown:              │
    │    Grade < C → warnings + recommendations │
    │    Grade ≥ C → proceed to approval        │
    │                                           │
    │  3. Page published (Web Standard)         │
    │     JSON-LD emitted into <head>           │
    │     (FAQPage, FinancialProduct schemas)    │
    │                                           │
    │                                           │  4. AEO Probe Service (daily 03:00 HKT)
    │                                           │     Queries ChatGPT (gpt-4o) +
    │                                           │     Perplexity (sonar-pro) with
    │                                           │     banking queries
    │                                           │     │
    │                                           │     ▼
    │                                           │  Records: HSBC cited? URL? Position?
    │                                           │  → BigQuery dap.aeo_probe_results
    │                                           │     │
    │                                           │     ▼
    │                                           │  5. Content Scoring Engine (every 6h)
    │                                           │     Joins AEO probe + clickstream +
    │                                           │     surveys + app store → CPS score
    │                                           │     │
    │  ◄────────────────────────────────────────┘     │
    │  6. OCDP AEO Panel shows:                       │
    │     • Per-page AEO grade (from step 2)          │
    │     • LLM citation share (from step 4)          │
    │     • CPS band: STAR/GOOD/REVIEW/URGENT         │
    │     • Recommendations to editors                 │
    │                                                  │
```

---

## 2c. Announcement Overlay Page Model

OCDP defines one reusable **Announcement Overlay** SDUI page template for urgent and time-sensitive in-app messages. The template supports the four visual styles shown in `specialannoucement.jpg` through a single shell component plus selectable UCP content and artwork.

This page is not a normal destination page. It is an overlay experience that the BFF can inject above an existing screen or at a journey entry point based on priority, validity window, customer segment, app version and scenario rules.

### Supported Scenarios

| Scenario | OCDP trigger | Customer experience | Required action model |
|----------|--------------|---------------------|-----------------------|
| Maintenance notice | App launch, home refresh or affected service entry | Dimmed full-screen overlay with notice card, maintenance illustration, optional "Don't show again" checkbox, Close and HSBC Website buttons | Dismissible unless configured as service-blocking |
| Special Announcement | App launch, targeted segment or market incident rule | Branded envelope-style card with announcement copy, hotline list and optional direct-call links | Close plus optional website / call hotline actions |
| Journey-level force update | Customer taps a specific journey entry point and the journey requires a minimum app version | Inline modal above the journey/home context explaining the feature requires an app update | Primary `Update now` action is mandatory; dismiss can be disabled |
| Seasonal Greetings | Scheduled campaign window such as Christmas, Chinese New Year or Eid | Festive visual card with minimal copy and close action | Dismissible; typically low priority and frequency-capped |

### OCDP Page Template

| Field | Value |
|-------|-------|
| Template ID | `tpl-announcement-overlay` |
| Page type | `ANNOUNCEMENT` |
| Channel | `SDUI` |
| Native targets | `ios`, `android`, `harmonynext`, `web` |
| Biz lines | `WEB_ENABLER`, `MARKETING` |
| Starter slice | `ANNOUNCEMENT_OVERLAY` |
| Timer | Same pattern as Campaign pages: immediate after release or scheduled `startAt` / `endAt` effective window |
| Timezone | Resolved from the selected market timezone, for example HK uses `Asia/Hong_Kong` / HKT |
| Authoring owner | Mobile Experience Platform Team |
| Approval | Standard Maker-Checker; urgent incidents may use the HK dual-approval flow when configured |

The OCDP page editor exposes the template in **New Page → Generic → Announcement Overlay**. The page author chooses a scenario and style variant, binds UCP content and assets from the left sidebar, then either enables the announcement immediately after approval/release or sets a market-local start and end time.

### UCP Component Registry

| UCP component | Slice type | Purpose | Key configurable fields |
|---------------|------------|---------|-------------------------|
| Announcement Overlay | `ANNOUNCEMENT_OVERLAY` | Complete modal shell and scenario controller | `scenario`, `styleVariant`, `contentRef`, `visual`, `title`, `body`, `hotlines`, `dontShowAgain`, `actions`, `expiry`, `priority`, `blockInteraction` |
| Announcement Visual | `ANNOUNCEMENT_VISUAL` | Illustration / brand visual block for the top or background of the card | `assetId`, `imageUrl`, `altText`, `placement`, `backgroundColor`, `safeAreaTop` |
| Announcement Body | `ANNOUNCEMENT_BODY` | Structured content block reusable across overlays | `headline`, `paragraphs`, `bulletItems`, `hotlines`, `dontShowAgainLabel`, `legalEntityText` |
| Announcement Actions | `ANNOUNCEMENT_ACTIONS` | Button row for dismiss, website, hotline and app-update flows | `primaryAction`, `secondaryAction`, `tertiaryAction`, `layout`, `forcePrimary` |

### Style Variants

| Style variant | Used by | Visual rules | Default actions |
|---------------|---------|--------------|-----------------|
| `NOTICE_CARD` | Maintenance notice | HSBC logo at top, neutral grey scrim, white card, floating maintenance illustration, checkbox above actions | Close, HSBC Website |
| `ENVELOPE_CARD` | Special Announcement | HSBC logo/envelope illustration, announcement icon above title, hotline lines rendered as tappable phone links | Close, HSBC Website, Call hotline |
| `INLINE_FORCE_UPDATE` | Journey-level force update | Existing journey/home screen remains visible behind the scrim; compact modal uses campaign artwork and one dominant red CTA | Update now |
| `FESTIVE_CARD` | Seasonal Greetings | Large seasonal artwork with brand-safe festive colours, reduced text density, card can use custom background image | Close |

### UCP Content Types

UCP stores the reusable content as structured entries so page authors can select content rather than retype copy in OCDP:

```json
{
  "contentId": "ucp-ann-maintenance-001",
  "contentType": "AnnouncementContent",
  "scenario": "MAINTENANCE_NOTICE",
  "styleVariant": "NOTICE_CARD",
  "market": "HK",
  "supportedLocales": ["en", "zh-HK", "zh-CN"],
  "fields": {
    "title": "Our maintenance schedule",
    "paragraphs": [
      "To improve our service, selected banking services will be unavailable during scheduled maintenance.",
      "We apologise for any inconvenience."
    ],
    "hotlines": [],
    "dontShowAgainLabel": "Don't show this message again",
    "legalEntityText": "The Hongkong and Shanghai Banking Corporation Limited"
  },
  "assets": {
    "primaryVisualAssetId": "asset-ann-maintenance"
  },
  "actions": [
    { "id": "close", "label": "Close", "type": "dismiss", "style": "primary" },
    { "id": "website", "label": "HSBC Website", "type": "openUrl", "url": "https://www.hsbc.com.hk/" }
  ],
  "schedule": {
    "mode": "scheduled",
    "timezone": "Asia/Hong_Kong",
    "startAt": "2026-05-16T00:00:00+08:00",
    "endAt": "2026-05-17T03:00:00+08:00"
  }
}
```

For a Journey-level force update, the content entry also carries:

```json
{
  "scenario": "JOURNEY_FORCE_UPDATE",
  "styleVariant": "INLINE_FORCE_UPDATE",
  "minAppVersion": {
    "ios": "6.18.0",
    "android": "6.18.0",
    "harmonynext": "6.18.0"
  },
  "journeyIds": ["elaisee"],
  "actions": [
    { "id": "update-now", "label": "Update now", "type": "appUpdate", "style": "primary" }
  ],
  "blockInteraction": true
}
```

### Runtime Resolution

```
Customer opens app or taps journey entry
   │
   ▼
BFF evaluates Announcement Overlay rules
   ├── immediate mode or active market-time schedule?
   ├── market / locale / segment eligible?
   ├── journeyId matched? app version below minimum?
   ├── dismissed / don't-show-again state?
   └── highest priority announcement selected
   │
   ▼
BFF composes SDUI page:
  ANNOUNCEMENT_OVERLAY + resolved UCP content + UCP/AEM asset URLs
   │
   ▼
Client renderer shows overlay above current screen
   ├── dismiss → records preference and fires analytics
   ├── callPhone → native phone dialer with approved hotline number
   ├── openUrl/deepLink → HSBC web or journey route
   └── appUpdate → platform app store / AppGallery update URL
```

### Governance and Analytics

- Maker-Checker approval applies to both the UCP content entry and the OCDP announcement page.
- Hotline numbers and outbound URLs must be allow-listed before publish.
- `blockInteraction=true` is restricted to operational incidents and force-update rules.
- Dismissed state is keyed by `contentId + version + userId_hash`; expiry resets the display rule.
- Analytics events: `announcement_impression`, `announcement_dismiss`, `announcement_action_click`, `announcement_suppressed`, `announcement_force_update_required`.

---

## 3. Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — PRESENTATION (Channel / Client)                                       │
│  All clients are pure SDUI renderers — NO business logic lives here.            │
│                                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  ┌───────────┐ │
│  │ Web App  │  │ iOS App  │  │ Android  │  │ HarmonyOS NEXT  │  │  WeChat   │ │
│  │ React/TS │  │ SwiftUI  │  │ Compose  │  │  ArkUI/ArkTS    │  │Mini Prog. │ │
│  │          │  │          │  │          │  │                 │  │           │ │
│  │Component │  │Component │  │Component │  │  Component      │  │ Component │ │
│  │Registry  │  │Registry  │  │Registry  │  │  Registry       │  │ Registry  │ │
│  │+Renderer │  │+Renderer │  │+Renderer │  │  + Renderer     │  │+Renderer  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬─────────┘  └─────┬─────┘ │
│       └─────────────┴─────────────┴────────────────┴───────────────────┘        │
│                                  SDUI JSON (HTTPS)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — PLATFORM (UCP + OCDP + BFF)                                           │
│                                                                                   │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐    │
│  │  Java BFF (Spring Boot/WebFlux)  │   │  OCDP Console (Staff CMS)        │    │
│  │                                  │◄──►                                  │    │
│  │  • SDUI Composition Engine       │   │  • Page/Journey Authoring UI     │    │
│  │  • KYC Orchestrator              │   │  • Slice canvas + LEFT SIDEBAR   │    │
│  │  • Personalisation Engine        │   │    (content picker: UCP + AEM)   │    │
│  │  • A/B Test Allocator (Optimizely│   │  • Maker-Checker approval queue  │    │
│  │  • Redis Cache Layer             │   │  • AEO / Statistics panels       │    │
│  │  • RBAC BizLineAccessGuard       │   │  • WeChatComposer, Admin panels  │    │
│  │  • Immutable Audit Logger        │   │  • Multi-locale authoring (i18n) │    │
│  │  • Analytics Event Forwarder     │   │  • WCAG 2.1 AA accessibility     │    │
│  └──────────────────────────────────┘   └──────────────────────────────────┘    │
│                         ▲  calls both ▼                                           │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐    │
│  │  UCP Console (Content Platform)  │   │  HSBC AEM (Adobe Experience Mgr) │    │
│  │                                  │   │                                  │    │
│  │  • Content Asset Library         │   │  • Enterprise CMS for HSBC.com   │    │
│  │  • Component Registry (SDUI      │   │  • Peer content provider to UCP  │    │
│  │    slices incl. announcements)   │   │  • OCDP left sidebar browses AEM │    │
│  │  • Content approval workflow     │   │    fragments, images & pages     │    │
│  │  • BizLine admin                 │   │  • AEM Content Delivery API      │    │
│  │  • Multi-locale i18n authoring   │   │    (REST/GraphQL) called by OCDP │    │
│  │  • WCAG 2.1 AA accessibility     │   │  • Assets served via AEM CDN     │    │
│  └──────────────────────────────────┘   └──────────────────────────────────┘    │
│                    ▲  OCDP left sidebar fetches from both ▲                       │
│                                                                                   │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐    │
│  │  mock-BFF (Node.js — local dev)  │   │  Optimizely / LaunchDarkly       │    │
│  │  In-memory simulation of BFF +   │   │  A/B test allocation + flags     │    │
│  │  OCDP/UCP/AEM APIs. Port 4000.   │   └──────────────────────────────────┘    │
│  └──────────────────────────────────┘                                            │
│  ┌──────────────────────────────────┐                                            │
│  │  Redis (AWS ElastiCache)         │                                            │
│  │  SDUI JSON cache (TTL-based)     │                                            │
│  └──────────────────────────────────┘                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — INTELLIGENCE (DAP + Data Lake)                                        │
│                                                                                   │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Behavioral       │  │ App Store      │  │ Customer     │  │ SEO / AEO    │  │
│  │ Analytics        │  │ Feedback       │  │ Surveys      │  │ Monitor      │  │
│  │                  │  │                │  │              │  │              │  │
│  │ Overseas:        │  │ AppFollow API  │  │ Qualtrics    │  │ LLM Probe    │  │
│  │ GCP BigQuery     │  │ + NLP (BERT)   │  │ In-app NPS   │  │ Daily job    │  │
│  │ + Looker         │  │ Maps to        │  │ Email CSAT   │  │ ChatGPT /    │  │
│  │                  │  │ contentId      │  │ Maps to      │  │ Perplexity / │  │
│  │ China:           │  │                │  │ journeyId    │  │ Google AI    │  │
│  │ SensorData       │  │                │  │ + contentId  │  │              │  │
│  │ (神策数据)        │  │                │  │              │  │              │  │
│  └────────┬─────────┘  └───────┬────────┘  └──────┬───────┘  └──────┬───────┘  │
│           └───────────────────┬┴───────────────────┘                 │          │
│                               └─────────────────────────────────────┘          │
│                    ┌──────────────────────────────────────────────┐            │
│                    │  Content Performance Scoring Engine (Python)  │            │
│                    │  CPS = f(CTR, conversion, NPS, AEO, sentiment)│            │
│                    └──────────────────────┬───────────────────────┘            │
│                                           │                                      │
│                    ┌──────────────────────▼───────────────────────┐            │
│                    │  Feedback Loop → CMS Editor Dashboard         │            │
│                    │  Alerts / Recommendations / A/B Winner        │            │
│                    └──────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Responsibilities

| Component | Layer | Responsibility | Owner |
|-----------|-------|---------------|-------|
| OCDP Console | Platform | Staff-facing CMS for authoring, reviewing, and publishing SDUI pages; page editor with a **left-hand content sidebar** that browses and selects content from both UCP and HSBC AEM as peer providers; journey builder, Maker-Checker approval queue, AEO/stats panels; **AI Search Admin** panel for configuring per-app semantic search corpora (content sources: OCDP pages + AEM URLs; corpus rebuild API); multi-locale (i18n) authoring with locale-aware slice props; WCAG 2.1 AA compliant UI | Content Engineering |
| UCP Console | Platform | Content asset library, component registry including announcement overlay components, approval workflow, biz-line admin; multi-locale authoring support; WCAG 2.1 AA compliant UI | Content Engineering |
| HSBC AEM | Platform | Adobe Experience Manager — enterprise CMS for HSBC.com. Acts as a **peer content provider** to UCP: the OCDP page-editor left sidebar queries both UCP and AEM so authors can drag AEM fragments, images, and pages directly into slices. AEM Content Delivery API (REST/GraphQL) is called by OCDP at authoring time; assets are served to end-users via HSBC's existing AEM CDN, independent of the UCP/BFF pipeline | Digital Channels |
| mock-BFF | Platform | Node.js local dev simulator of bff-java + OCDP/UCP/AEM APIs; all state in-memory; port 4000 | Platform Engineering |
| Java BFF | Platform | SDUI JSON composition, KYC orchestration, personalisation, A/B routing, Redis cache, RBAC, immutable audit log, event forwarding | Platform Engineering |
| SDUI Composition Engine | Platform | Resolves screen template, fills slots, injects props, negotiates client schema version; can inject high-priority `ANNOUNCEMENT_OVERLAY` above app or journey screens | Platform Engineering |
| KYC Orchestrator | Platform | KYC step plan stored in Redis (72h TTL), branching logic (SHOW/HIDE), answer persistence, audit logging | Platform Engineering |
| Personalisation Engine | Platform | Segments user, selects eligible content per segment, calls ML recommender | Data & Personalisation |
| A/B Test Allocator | Platform | Sticky user-to-variant allocation via Optimizely; injects variantId into SDUI response | Growth Engineering |
| RBAC BizLineAccessGuard | Platform | Enforces AUTHOR/APPROVER/AUDITOR/ADMIN roles + biz-line content isolation + Maker-Checker constraint | Security Engineering |
| Immutable Audit Logger | Platform | PostgreSQL hash-chain audit log; UPDATE/DELETE revoked at DB level; `verify_ucp_audit_chain()` integrity function | Security Engineering |
| Redis Cache | Platform | Caches SDUI JSON per screen+user+variant, TTL invalidation on CMS publish | Platform Engineering |
| i18n / Translation Engine | Platform | Locale-aware slice prop merging via `translations[locale][instanceId][propKey]`; `getSliceProps()` helper; supported locales: `en`, `zh-HK`, `zh-CN`, `ar` (RTL), `es`; RTL dir attribute applied automatically | Content Engineering |
| SDUI Static Distribution Manager | Platform | On OCDP publish: uploads canonical SDUI JSON per screen+platform to S3/OSS and regenerates `manifest.json`; invalidates CloudFront/Tencent CDN; runs in parallel with existing BFF Redis flush webhook | Platform Engineering |
| AI Search Engine | Platform | Semantic search for HSBC mobile apps and web; per-app corpus configured in OCDP Admin (content sources: OCDP pages + AEM URLs; quick-access entry points via remote URL or inline JSON); corpus rebuilt on demand or scheduled (hourly/daily); BFF endpoint `POST /api/v1/search` ranks results via TF-IDF + keyword-overlap scoring; `GET /api/v1/search/corpus` for client-side corpus caching; `AI_SEARCH_BAR` / `HOME_SEARCH_HEADER` SDUI slice types deliver search to iOS, Android, HarmonyOS NEXT, and Web | Platform Engineering |
| Web SDUI Renderer | Presentation | Parses JSON, resolves 24 React components, binds props, handles actions, fires Tealium analytics; implements 3-tier resolution chain (CDN manifest → local storage → bundled baseline); merges self-pick preferences for `SELF_PICK_ENTRY_POINTS` slices; honours `selfPickForceUpdate` flag | Web Engineering |
| iOS SDUI Renderer | Presentation | Parses JSON, resolves SwiftUI views (11 KYC steps + Wealth + FXViewpoint), handles actions, fires analytics; implements 3-tier resolution chain; persists screens to `Caches/SDUI/`; merges self-pick from `UserDefaults`; honours `selfPickForceUpdate` | iOS Engineering |
| Android SDUI Renderer | Presentation | Parses JSON, resolves Compose composables, handles actions, fires analytics; implements 3-tier resolution chain; persists screens via `DataStore` + file cache; merges self-pick preferences; honours `selfPickForceUpdate` | Android Engineering |
| HarmonyOS NEXT Renderer | Presentation | Parses JSON, resolves ArkUI components (KYC + Wealth + FXViewpoint + AI Search), fires SensorData events; implements 3-tier resolution chain; persists screens via `preferences` + `fileio`; merges self-pick preferences; honours `selfPickForceUpdate` | HarmonyNext Engineering |
| HIVE Design Tokens | Cross-cutting | Single design token source-of-truth (JSON/CSS/Swift/Kotlin/ArkTS); HIVE Design Language v2.1.0; token names used in WCAG 2.1 AA colour-contrast compliance | Design Systems |
| GCP BigQuery + Looker | Intelligence | Data lake + BI for overseas; journey funnels, cohort, content leaderboard dashboards | Data Engineering |
| SensorData (神策) | Intelligence | Behavioural analytics SDK + BI for mainland China; real-time event pipeline | China Data Engineering |
| App Store Harvester | Intelligence | Polls AppFollow/AppBot for reviews, NLP sentiment + topic tagging, maps to contentId | DAP Engineering |
| Survey Engine | Intelligence | Ingests NPS/CSAT from Qualtrics and in-app SurveyWidget, maps to journeyId + contentId | CX Engineering |
| AEO Probe Service | Intelligence | Daily LLM citation probes (ChatGPT gpt-4o + Perplexity sonar-pro), citation share tracking, competitor gap alerts | SEO/AEO Team |
| Content Scoring Engine | Intelligence | Computes unified CPS across all signals per contentId every 6h; bands: STAR/GOOD/REVIEW/URGENT | DAP Engineering |
| Feedback Loop Service | Intelligence | Pushes CPS scores + recommendations to CMS dashboard; fires Slack + email alerts | DAP Engineering |

---

## 5. Integration Points

### 5.1 BFF ↔ UCP / OCDP

| Attribute | Detail |
|-----------|--------|
| Protocol | REST over HTTPS |
| Auth | OAuth 2.0 client credentials (service-to-service) |
| Format | JSON — Stripes CMS Content Delivery API |
| Pattern | BFF calls CMS per screen request; Redis cache reduces CMS load |
| Invalidation | CMS publish webhook → BFF flushes Redis keys for affected screens |
| SLA | CMS API p95 < 50ms (served from EKS; horizontally scaled) |

### 5.2 BFF ↔ SDUI Clients

| Attribute | Detail |
|-----------|--------|
| Protocol | HTTPS REST: `GET /api/v1/screen/{screenId}` |
| Auth | HSBC OAuth 2.0 Bearer token (user-authenticated) |
| Format | SDUI JSON schema (versioned) |
| Key Headers | `x-sdui-version`, `x-platform`, `x-locale`, `x-segment` |
| Cache | `Cache-Control: max-age=60` for anonymous; `no-store` for personalised |
| Compression | Brotli / gzip; target payload < 80KB |

### 5.3 OCDP ↔ HSBC AEM (Content Provider)

| Attribute | Detail |
|-----------|--------|
| Relationship | AEM is a **peer content provider** alongside UCP. The OCDP page-editor left-hand sidebar queries both UCP and AEM so authors choose content from either source when composing a slice. |
| OCDP → AEM (authoring time) | OCDP calls AEM Content Delivery API (REST/GraphQL, OAuth 2.0 client credentials) to list and search AEM content fragments, assets, and experience fragments for the left sidebar |
| Content selection model | Author opens left sidebar in page editor → switches between **UCP** tab and **AEM** tab → searches/browses → drags item onto slice canvas; selected item recorded as `contentRef: { source: "UCP" \| "AEM", id: "..." }` per slice |
| BFF at runtime | BFF composition engine reads `contentRef.source`; for `AEM` refs it passes the AEM-resolved URL through to the SDUI JSON as-is — no content transformation; AEM assets are served to end-users via HSBC's AEM CDN independent of BFF |
| Content URL pattern | UCP assets: `/media/*` (via CloudFront / Tencent CDN); AEM assets: `https://www.hsbc.com.hk/content/...` (via AEM CDN) |
| Auth (OCDP → AEM) | OAuth 2.0 client credentials; AEM instance on HSBC intranet; mTLS for internal network call |
| Caching | AEM content fragments are cached in BFF Redis alongside UCP content; same TTL and invalidation webhook model applies |
| Fallback | If AEM API unavailable at authoring time, OCDP sidebar shows cached fragment list with staleness indicator; at BFF composition time, stale AEM content is served from Redis until TTL expires |

### 5.4 OCDP / UCP — Multi-Language Authoring (i18n)

| Attribute | Detail |
|-----------|--------|
| Translation model | Primary-language copy lives in `slice.props`; translations for all other locales stored in `page.translations[locale][instanceId][propKey]` |
| Supported locales | `en` (English), `zh-HK` (Traditional Chinese), `zh-CN` (Simplified Chinese), `ar` (Arabic — RTL), `es` (Spanish) |
| Helper | `getSliceProps(slice, locale, translations)` in `src/utils/i18n.ts` merges locale-specific overrides onto the base props at render time |
| RTL support | When `ar` locale is active, `dir="rtl"` is set on the slice canvas; CSS `[dir="rtl"]` rules in `global.css` flip layout automatically |
| Locale selector | Language selector dropdown in both OCDP and UCP console headers; locale pill bar inside the page editor canvas; per-slice prop editor becomes locale-aware when a non-primary locale is selected |
| BFF delivery | Locale passed via `x-locale` request header; BFF selects the translated copy for the resolved locale before composing SDUI JSON |

### 5.5 Accessibility (WCAG 2.1 AA)

| Attribute | Detail |
|-----------|--------|
| Standard | WCAG 2.1 Level AA across all staff consoles (OCDP and UCP) |
| Skip links | `Skip to main content` skip-link rendered at top of each console page; main content area has `id="main-content"` |
| Focus management | `:focus-visible` CSS rules in `global.css` ensure keyboard focus rings are visible on all interactive elements |
| Live regions | Toast / alert components use `role="status"` + `aria-live="polite"` so screen readers announce state changes |
| Colour contrast | HIVE Design Tokens v2.1.0 mapped to WCAG AA contrast ratios (≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components) |
| Keyboard navigation | All console panels navigable by keyboard; modal sheets trap focus; escape key closes overlays |
| ARIA labelling | Icon-only buttons have `aria-label`; data tables have `scope` on headers; form fields have associated `<label>` elements |

### 5.6 Clients ↔ DAP Event Ingestion

| Attribute | Detail |
|-----------|--------|
| Protocol | HTTPS POST to DAP Event Ingestion API |
| Batching | Events batched every 5 seconds or 20 events, whichever first |
| Format | `{eventType, componentId, screenId, userId_hash, timestamp, properties}` |
| Overseas | → GCP Pub/Sub → Dataflow → BigQuery |
| China | → SensorData SDK endpoint (China-resident servers) |
| PII | userId hashed (SHA-256 + per-user salt) before leaving device |

### 5.7 DAP ↔ CMS Feedback Loop

| Attribute | Detail |
|-----------|--------|
| Protocol | REST POST to Stripes CMS Management API |
| Trigger | Scoring job every 6h; anomaly alerts near-real-time |
| Payload | `{contentId, cpsScore, band, recommendations[], alertType}` |
| Notifications | Slack webhook + email digest; in-CMS score badge |

### 5.8 AEO Probe ↔ LLM APIs

| Attribute | Detail |
|-----------|--------|
| ChatGPT | OpenAI API `gpt-4o`, `POST /v1/chat/completions` |
| Perplexity | Perplexity API, `sonar-pro` model (web-grounded) |
| Google AI | Google Search Console API + weekly manual spot-check pipeline |
| Bing Copilot | Bing Web Search API for AI-generated answer sampling |
| Schedule | Daily cron 03:00 HKT (off-peak); results to BigQuery `dap.aeo_probe_results` |

### 5.9 AI Search — Semantic Search API

HSBC mobile apps and the website surface an AI-powered search experience via the `AI_SEARCH_BAR` and `HOME_SEARCH_HEADER` SDUI slice types. The search corpus is configured and managed through the OCDP Admin console.

**Corpus Configuration (OCDP AI Search Admin Panel)**

OCDP operators create one `AISearchConfig` per app platform (`ios | android | harmonynext | web`). Each config specifies:

| Field | Description |
|-------|-------------|
| `quickAccessSource` | Entry-point functions (quick-access buttons). Provided either as a remote URL (BFF fetches + parses JSON at rebuild time) or as inline JSON pasted by the operator |
| `contentSources` | List of content pages to include in the search corpus. Each source is either an `ocdp_page` (references a live OCDP page by `pageId`) or an `aem_url` (references an AEM page URL) |
| `refreshSchedule` | `manual` / `hourly` / `daily` — controls automatic corpus rebuild frequency |
| `searchEndpointOverride` | Optional custom BFF search URL; defaults to `POST /api/v1/search` |

**Corpus Rebuild Pipeline**

```
OCDP Admin triggers "Rebuild Corpus"
   │
   ▼
POST /api/v1/search/config/{configId}/rebuild
   │
   ├── 1. Quick-access source
   │      mode=url  → BFF fetches JSON from remote URL, parses items
   │      mode=json → BFF parses inline JSON
   │
   ├── 2. Content sources (parallel)
   │      type=ocdp_page → extract title/description/keywords from SDUI screen data
   │      type=aem_url   → synthesise corpus entry from AEM page URL + metadata
   │
   ├── 3. Merge + deduplicate → AI_SEARCH_CORPORA[appId]
   │
   └── Response: { appId, corpusSize, rebuiltAt }
       → OCDP console updates config card with corpus size + timestamp
```

**Runtime Search Flow**

```
Mobile App / Web
   │  search query typed by user
   ▼
POST /api/v1/search
  { query, limit, types?, appId }
   │
   ▼
BFF Semantic Search Engine
   ├── Selects corpus: AI_SEARCH_CORPORA[appId] (if configured + non-empty)
   │   else falls back to default SEARCH_CORPUS
   ├── Tokenises query → TF-IDF term vectors
   ├── Scores each corpus entry: keyword overlap + cosine-similarity
   ├── Returns top-N results ranked by score
   │
   └── Response: { query, totalMatched, results: SearchResultItem[] }
       Each result: { id, type, title, description, icon, category, deepLink, score }
```

**Client-Side Corpus Caching**

```
GET /api/v1/search/corpus?appId={appId}
   → Returns full corpus (SearchCorpusResponse)
   → Clients cache with short TTL (recommended 5 min)
   → Enables client-side instant search without round-trip per keystroke
```

| Attribute | Detail |
|-----------|--------|
| Slice types | `AI_SEARCH_BAR` (standalone search bar) and `HOME_SEARCH_HEADER` (segment-adaptive header with integrated search) |
| Platforms | iOS, Android, HarmonyOS NEXT, Web — all call the same BFF endpoint |
| Configurable props | `placeholder`, `enableSemanticSearch`, `enableQRScan`, `enableChatbot`, `enableMessageInbox`, `searchApiEndpoint` |
| Content source types | `ocdp_page` (live OCDP-authored pages) and `aem_url` (AEM pages — peer provider) |
| Production ranking | In production the TF-IDF mock is replaced by Vertex AI Matching Engine (vector embeddings); API contract and result shape are identical |
| Corpus per app | Each `appId` has an independent corpus; prevents cross-app result leakage |

### 5.10 SDUI Static Distribution — S3/CDN Delivery, Offline Fallback & Self-Pick Customisation

OCDP publishes approved SDUI screen JSON to a static object store (S3 overseas, OSS in China) in addition to the live BFF path. Each native client (iOS, Android, HarmonyOS NEXT, Web) then manages a three-tier resolution chain: **remote manifest check → local storage → bundled baseline**.

#### 5.10.1 Publish Pipeline

```
OCDP Approval (Maker-Checker passes)
   │
   ▼
BFF composes canonical SDUI JSON for each screen + platform combination
   │
   ├── Uploads to S3 / OSS:
   │     s3://hsbc-sdui/{region}/{appId}/{platform}/{screenId}/{version}.json
   │     s3://hsbc-sdui/{region}/{appId}/{platform}/manifest.json   ← version index
   │
   ├── Invalidates CloudFront / Tencent CDN edge cache for affected paths
   │
   └── Publishes existing BFF Redis webhook (unchanged)

manifest.json shape:
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-05-11T03:00:00Z",
  "screens": {
    "home":   { "version": "a3f9c1", "etag": "\"abc123\"", "sizeBytes": 41230 },
    "wealth": { "version": "b7d2e4", "etag": "\"def456\"", "sizeBytes": 38910 }
  },
  "selfPickForceUpdate": false      ← global flag; see §5.10.4
}
```

#### 5.10.2 Client Resolution Chain

All four clients follow the same logic on app open / screen request:

```
App requests screen "home"
   │
   ├─ 1. FETCH manifest.json from CDN
   │       success → compare remote screens["home"].version vs locally stored version
   │       failure (no network / CDN error) → go to step 3
   │
   ├─ 2a. Version unchanged → serve from local storage (no download)
   │
   ├─ 2b. Version changed (or no local file exists)
   │       → download new {screenId}/{version}.json from CDN
   │       → validate JSON (schema version check)
   │       → persist to local storage, evicting old version
   │       → render new JSON
   │
   └─ 3. Local storage present → serve local storage copy
          Local storage absent → serve bundled baseline (shipped with app binary)
```

Failure modes handled:

| Condition | Resolution |
|-----------|-----------|
| No network on first launch | Bundled baseline (shipped inside the app) |
| Manifest fetch fails but local copy exists | Serve local copy (stale-ok) |
| CDN returns corrupted / invalid JSON | Discard, keep existing local copy; alert DAP |
| Remote file missing (accidental S3 delete) | Same as corrupted: fall back to local |
| Local storage full | Evict LRU screens; keep current + home |

#### 5.10.3 Self-Pick Customisation

Customers may personalise certain **entry-point slots** (e.g. quick-access shortcuts, pinned features on the home tab bar) — collectively called **self-pick entry points**. These slots are rendered via a dedicated slice type `SELF_PICK_ENTRY_POINTS` inside the SDUI JSON.

**Authoring:** When OCDP authors compose a screen, they mark specific component slots as `selfPickable: true`. The BFF emits a `SELF_PICK_ENTRY_POINTS` slice containing the full catalogue of available entry-points and the default ordering.

**Client behaviour:**

```
Render screen "home"
   │
   ├─ For all slices where selfPickable == false:
   │     render exactly as received from remote / local JSON  (no override)
   │
   └─ For the SELF_PICK_ENTRY_POINTS slice:
         read customer's saved preferences from device storage
         (key: "selfPick_{userId}_{screenId}")
         │
         ├─ Preferences exist AND selfPickForceUpdate == false in manifest
         │     → merge: customer ordering / selection overrides the remote defaults
         │     → render merged result
         │
         └─ No preferences OR selfPickForceUpdate == true in manifest
               → render remote defaults as-is
               → if selfPickForceUpdate: clear saved preferences after render
                  (customer sees the new defaults; can re-customise afterwards)
```

Self-pick data is stored only on-device — it is never uploaded to the BFF or analytics pipeline. PII impact: none (preferences are UI state, not identity data).

#### 5.10.4 Force-Update Flag (`selfPickForceUpdate`)

The `selfPickForceUpdate` boolean in `manifest.json` lets the platform team push a breaking layout change that must override all saved customer preferences (e.g. a regulatory restructuring of the home screen, removal of a deprecated entry-point type).

| `selfPickForceUpdate` | Customer has preferences | Behaviour |
|-----------------------|--------------------------|-----------|
| `false` (default) | Yes | Customer preferences preserved; remote defaults ignored for self-pick slots |
| `false` | No | Remote defaults rendered |
| `true` | Yes | Remote defaults rendered; saved preferences **cleared** |
| `true` | No | Remote defaults rendered (no change) |

The flag is set to `true` only for the single publish cycle that requires the reset; OCDP authors revert it to `false` in the next publish after clients have received the update, preventing perpetual preference clearing.

#### 5.10.5 Integration Points Summary

| Attribute | Detail |
|-----------|--------|
| Storage (overseas) | AWS S3 `hsbc-sdui-{region}` bucket; served via CloudFront CDN |
| Storage (China) | Alibaba OSS; served via Tencent CDN |
| Manifest URL | `https://cdn.hsbc.com/sdui/{appId}/{platform}/manifest.json` |
| Screen JSON URL | `https://cdn.hsbc.com/sdui/{appId}/{platform}/{screenId}/{version}.json` |
| Client local storage | iOS: `UserDefaults` + file cache under `Caches/SDUI/`; Android: `DataStore` + file cache; HarmonyOS: `preferences` + `fileio`; Web: `localStorage` + `Cache API` |
| Bundled baseline | Shipped in app binary; updated only on app release; used only as last-resort fallback |
| Self-pick storage key | `selfPick_{userId}_{screenId}` — device-local only |
| Manifest polling | On every cold app launch + periodic background refresh every 30 min (WiFi) / 60 min (cellular) |
| Integrity check | Each downloaded JSON is SHA-256 verified against `etag` in manifest before persisting |
| Publish trigger | Same OCDP approval webhook that flushes BFF Redis; S3 upload added as parallel step |
| OCDP author control | `selfPickable` toggle per slice in page editor; `selfPickForceUpdate` checkbox on publish confirmation dialog |

---

## 6. End-to-End Data Flow

### Flow A — Promotion Publish to Customer Screen

```
1. CMS Editor creates promo in Stripes CMS
   └── fills structured fields: title, image, CTA, eligibility rules
   └── adds FAQ block (AEO gate — mandatory for product pages)
   └── submits for Legal / Compliance approval
   └── approved → Published event emitted

2. Stripes CMS sends publish webhook to BFF
   └── BFF flushes Redis cache keys for affected screens
   └── Schema Generator emits JSON-LD for content page

3. Customer opens HSBC iOS App
   └── App requests GET /api/v1/screen/home
       headers: x-user-id, x-sdui-version:2.3, x-platform:ios, x-segment:premier

4. BFF Composition Engine runs (target < 120ms p95)
   └── Screen Template Resolver: "home" + "ios" → template with slots
   └── Personalisation Engine: segment=premier → eligible for Jade promo
   └── A/B Allocator: → user assigned Variant B (new banner layout)
   └── Content Fetcher: loads from Redis (hit) or Stripes CMS (miss)
   └── ML Recommender: fetches personalised product recommendations
   └── Props Injector: merges all data into component props
   └── Version Negotiator: confirms schema v2.3 compatible
   └── Returns SDUI JSON (~40KB, Brotli compressed)

5. iOS SDUI Renderer receives JSON
   └── Validates schema version
   └── Resolves 8 components from ComponentRegistry
   └── Binds props, registers action handlers
   └── Renders screen in < 200ms
   └── Auto-fires impression events for each visible component
   └── Customer sees personalised Jade upgrade banner
```

### Flow B — Customer Interacts → DAP → Feedback to Editor

```
6. Customer taps "Discover Jade Benefits" CTA
   └── Action Handler: NAVIGATE → JadeUpgradeJourney
   └── Analytics auto-fire: promo_banner_clicked {componentId, variantId, segmentId}

7. Customer completes journey (or drops off at a step)
   └── Conversion event fired on completion
   └── Funnel drop-off step recorded per journeyId

8. Post-journey NPS survey (SurveyWidget fires if eligible)
   └── Customer rates 9/10
   └── Survey response → DAP Survey Engine → mapped to contentId + journeyId

9. App store review posted (next day)
   └── AppFollow harvests review mentioning "Jade upgrade"
   └── NLP classifier: sentiment=positive, topic=wealth_upgrade
   └── Mapped to contentId: jade-upgrade-banner-B

10. DAP Content Scoring Job (every 6h)
    └── Joins: clicks + conversions + NPS + AEO probe + app store sentiment
    └── Computes CPS for [jade-upgrade-banner-B] = 87/100 → STAR band
    └── A/B: Variant B CTR = 11.2% vs Control 7.8% → confidence 97%

11. Feedback Loop Service pushes to CMS
    └── Editor dashboard: STAR badge on Jade banner
    └── Recommendation: "Variant B is winner — promote to 100%"
    └── Slack alert: "@content-team Jade banner A/B test concluded — B wins"
    └── Editor clicks [Promote Variant B] → Optimizely updated
```

---

## 7. Non-Functional Requirements

| Category | Requirement | Target | Alert Threshold |
|----------|-------------|--------|-----------------|
| Performance | BFF SDUI response p50 | < 80ms | > 100ms |
| Performance | BFF SDUI response p95 | < 150ms | > 200ms |
| Performance | BFF SDUI response p99 | < 300ms | > 400ms |
| Performance | Client time-to-first-component | < 200ms | > 300ms |
| Performance | DAP event ingestion throughput | > 50,000 events/s | < 30,000 |
| Availability | BFF uptime SLA | 99.95% | — |
| Availability | Stripes CMS uptime SLA | 99.9% | — |
| Availability | DAP pipeline uptime | 99.9% | — |
| Scalability | BFF pod scaling | Auto 2–50 pods (EKS) | — |
| Scalability | Peak load (CNY campaign) | 10× baseline, no degradation | — |
| Security | Data in transit | TLS 1.3 minimum | — |
| Security | PII in analytics | Hashed before device leaves | — |
| Security | CMS API auth | OAuth 2.0, tokens expire in 1h | — |
| Compliance | HKMA | Full audit trail, approval workflow | — |
| Compliance | GDPR | Data minimisation, right to erasure, DPA | — |
| Compliance | China PIPL | Data in China, explicit consent, no cross-border PII | — |
| Compliance | PCI-DSS | No card data in SDUI or DAP pipelines | — |
| Resilience | BFF → Redis miss → CMS unavailable | Serve stale cache; degrade gracefully | — |
| Resilience | SDUI client: BFF unavailable | Serve device-cached last-known-good screen |
| Resilience | SDUI client: CDN manifest fetch fails | Serve device local storage copy; fall back to bundled baseline if no local copy |
| Resilience | SDUI client: corrupted/missing CDN screen file | Discard download; keep existing local copy; alert DAP | — |
| Observability | Distributed tracing | OpenTelemetry → Datadog | — |
| Observability | Error budget | < 0.05% error rate on SDUI endpoint | > 0.1% |

---

## 8. Deployment Architecture

### 8.1 Overseas (HK, UK, SG, US)

```
  Customers (overseas)
        │
        ▼
  ┌─────────────┐       ┌───────────────────────────────────────────────────┐
  │ CloudFront  │       │  AWS (ap-east-1 primary / eu-west-1 DR)           │
  │ CDN + WAF   │──────►│                                                   │
  │             │       │  ┌──────────────┐   ┌───────────────────┐        │
  └─────────────┘       │  │  EKS          │  │  OCDP/UCP         │        │
                        │  │  ┌──────────┐ │  │  (EKS cluster)    │        │
                        │  │  │BFF Pods  │ │  └───────────────────┘        │
                        │  │  │(2-50)    │ │                                │
                        │  │  └──────────┘ │  ┌───────────────────┐        │
                        │  │  ┌──────────┐ │  │  GCP Data Stack   │        │
                        │  │  │  Redis   │ │  │  BigQuery/Pub/Sub  │        │
                        │  │  │ElastiCache│ │  │  Dataflow/Looker  │        │
                        │  │  └──────────┘ │  │  Vertex AI         │        │
                        │  └──────────────┘  └───────────────────┘        │
                        └───────────────────────────────────────────────────┘
```

> **Note:** Microservices (BFF, CMS) run on AWS EKS. Data analytics (BigQuery, Looker, Vertex AI) remains on GCP for BI tooling and ML pipeline continuity. Cross-cloud connectivity via AWS PrivateLink + GCP Private Service Connect.

### 8.2 Mainland China

```
  Customers (CN)
        │
        ▼
  ┌──────────────┐      ┌────────────────────────────────────────────┐
  │  Tencent CDN │      │  China Cloud (Tencent CDN + Alibaba K8S)   │
  │              │─────►│                                            │
  └──────────────┘      │  ┌─────────────────┐  ┌────────────────┐  │
                        │  │  BFF (CN deploy) │  │ OCDP/UCP CN    │  │
                        │  │  (Alibaba ACK)   │  │ (Alibaba ACK)  │  │
                        │  └─────────────────┘  └────────────────┘  │
                        │  ┌──────────────────┐                      │
                        │  │  Redis Cache      │                      │
                        │  │  (China-resident) │                      │
                        │  └──────────────────┘                      │
                        │  ┌──────────────────────────────────────┐  │
                        │  │  SensorData (神策数据)                │  │
                        │  │  Analytics SDK + BI + Local Data Lake│  │
                        │  └──────────────────────────────────────┘  │
                        └────────────────────────────────────────────┘
```

### 8.3 Unified DAP Aggregation Layer

```
  GCP DAP (Overseas BigQuery)  ──┐
                                  ├──► Unified DAP Aggregation
  China DAP (SensorData export) ─┘    (anonymised/aggregated only;
                                        PIPL-compliant; no PII cross-border)
```

---

## 9. Security and Compliance

| Domain | Control |
|--------|---------|
| Authentication | HSBC OAuth 2.0 with PKCE (mobile); client_credentials (service-to-service) |
| Authorisation | CMS role-based: AUTHOR / APPROVER / AUDITOR / ADMIN (biz-line scoped); Maker-Checker enforced |
| mTLS | All internal service-to-service calls use mutual TLS |
| Data in Transit | TLS 1.3; HSTS; no HTTP fallback |
| Data at Rest | AWS KMS (overseas); AES-256 via China cloud KMS |
| PII Handling | userId SHA-256 hashed + per-user salt before leaving device; no raw PII in events |
| HKMA | Content approval workflow with full audit log; quarterly review |
| GDPR | Data minimisation; erasure API; DPA with all processors |
| China PIPL | All CN user data resident in China; explicit consent gate; no cross-border PII |
| PCI-DSS | No card data in SDUI or DAP pipelines; scope strictly isolated |
| WAF | AWS WAF + CloudFront (overseas); Tencent Anti-DDoS (China) |
| Rate Limiting | Per-user + per-IP at API Gateway; burst limits on SDUI endpoint |
| Secrets | AWS Secrets Manager (overseas); China cloud KMS; zero secrets in code or config files |
| SDUI Content Security | Action types server-whitelisted; no arbitrary JS execution from JSON |

---

## 10. Technology Stack

| Layer | Component | Technology |
|-------|-----------|------------|
| CMS (Authoring) | OCDP Console | React 18, TypeScript 5, Vite; IndexedDB local state; multi-locale i18n authoring; WCAG 2.1 AA; AI Search Admin panel; `selfPickable` slice toggle; `selfPickForceUpdate` publish flag; port 5173 by Vite default |
| CMS (Content) | UCP Console | React 18, TypeScript 5, Vite; 14-slice registry; multi-locale i18n authoring; WCAG 2.1 AA; port 3001 |
| CMS (Content — External) | HSBC AEM | Adobe Experience Manager; peer content provider to UCP; queried via AEM Content Delivery API (REST/GraphQL); OCDP left sidebar browses both UCP and AEM |
| CMS (Local Dev) | mock-BFF | Node.js / Express; single-file in-memory simulator; port 4000 |
| BFF | Backend for Frontend | Java 17, Spring Boot 3.x, WebFlux (reactive) |
| BFF | API Layer | Spring Cloud Gateway + REST |
| BFF | Cache (Overseas) | Redis 7.x (AWS ElastiCache) |
| BFF | Cache (China) | Redis Cache (China-resident) |
| BFF | A/B Testing | Optimizely Feature Experimentation |
| BFF | Feature Flags | LaunchDarkly |
| BFF | Audit Log | PostgreSQL + Flyway (V3 hash-chain immutable log) |
| BFF / Search | AI Search Engine | TF-IDF + keyword-overlap ranking (mock); Vertex AI Matching Engine (production vector search); per-app corpus keyed by `appId`; `POST /api/v1/search`, `GET /api/v1/search/corpus` |
| Web | SDUI Renderer | React 18, TypeScript 5, Vite; 24-component registry |
| iOS | SDUI Renderer | Swift 5.9, SwiftUI, Combine |
| Android | SDUI Renderer | Kotlin, Jetpack Compose, Coroutines |
| HarmonyOS NEXT | SDUI Renderer | ArkTS, ArkUI, hvigor build system |
| Design System | HIVE Tokens | W3C Design Token JSON → CSS / Swift / Kotlin / ArkTS |
| Analytics (Overseas) | Data Lake | GCP BigQuery (partitioned + clustered) |
| Analytics (Overseas) | Streaming | GCP Pub/Sub + Dataflow (Apache Beam) |
| Analytics (Overseas) | BI | Looker + LookML |
| Analytics (Overseas) | ML | Vertex AI (propensity, recommendations) |
| Analytics (China) | Platform | SensorData 神策数据 SDK + BI |
| Analytics (China) | Storage | Alibaba OSS + MaxCompute |
| App Store Feedback | Harvesting | AppFollow API + Python NLP (spaCy / BERT) |
| Surveys | Platform | Qualtrics XM + in-app SDUI SurveyWidget |
| AEO Monitor | LLM Probing | Python + OpenAI API (gpt-4o) + Perplexity API (sonar-pro) |
| AEO Monitor | Schema | Schema.org JSON-LD (auto-generated by CMS) |
| CDN (Overseas) | Edge | AWS CloudFront (WAF + cache); also serves SDUI static JSON from S3 `hsbc-sdui-{region}` bucket |
| CDN (China) | Edge | Tencent CDN; also serves SDUI static JSON from Alibaba OSS |
| SDUI Static Store (Overseas) | Object Storage | AWS S3 `hsbc-sdui-{region}`; `manifest.json` + per-screen versioned JSON; uploaded on every OCDP publish |
| SDUI Static Store (China) | Object Storage | Alibaba OSS; same structure; PIPL-compliant China-resident storage |
| SDUI Client Cache (iOS) | Device | `UserDefaults` (self-pick) + file cache under `Caches/SDUI/` (screen JSON) + bundled baseline in app binary |
| SDUI Client Cache (Android) | Device | `DataStore` (self-pick) + file cache (screen JSON) + bundled baseline in app binary |
| SDUI Client Cache (HarmonyOS NEXT) | Device | `preferences` API (self-pick) + `fileio` (screen JSON) + bundled baseline |
| SDUI Client Cache (Web) | Browser | `localStorage` (self-pick) + Cache API (screen JSON) + bundled fallback |
| Observability | Tracing | OpenTelemetry → Datadog |
| Observability | Logging | GCP Cloud Logging + ELK |
| CI/CD | Pipeline | GitHub Actions + ArgoCD (GitOps) |
| Infrastructure | IaC | Terraform |
| Containers | Orchestration | AWS EKS (overseas); Alibaba ACK (China) |
