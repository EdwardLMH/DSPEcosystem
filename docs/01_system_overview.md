# HSBC Digital Sales Promotion Platform — System Overview

**Document Version:** 1.2  
**Classification:** Internal — Confidential  
**Last Updated:** 2026-05-06  
**Author:** Platform Architecture Team  
**Status:** Approved  
**Review Cycle:** Quarterly  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Context Diagram](#2-system-context-diagram)
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

**HSBC Digital Sales Promotion Platform (DSPP)** is a content orchestration ecosystem that lets marketing and product teams publish, personalise, and optimise promotional experiences across all HSBC digital channels — without app releases or engineering sprints.

- **Publish in Seconds, Not Sprints** — Content goes from draft to live across iOS, Android, HarmonyOS NEXT, Web, and WeChat in under 60 seconds, with no App Store dependency.

- **Discoverable by AI Search Engines** — Every public page is scored for Answer Engine Optimisation (AEO) before publish, with daily monitoring of whether HSBC is cited by ChatGPT, Perplexity, DeepSeek, and Doubao — ensuring brand visibility wherever customers research financial products.

- **Personalise and Measure in One Loop** — Every screen is tailored by customer segment with built-in A/B testing. Analytics scores flow back to editors as actionable recommendations, not raw dashboards.

- **Govern by Design** — Maker-Checker workflows, business-line access control, and an immutable audit log satisfy HKMA, GDPR, and PIPL requirements without slowing editors down.

- **Author Once, Deliver Everywhere** — One console publishes to five native platforms, server-rendered SEO pages, and WeChat — each with the right rendering, analytics, and data residency.

- **Unified Platform** — Brings together UCP (content management), OCDP (page authoring and approvals), DAP (analytics and AEO monitoring), native mobile and web SDUI renderers, WeChat channel, and content from HSBC AEM — through a single BFF composition engine.

- **Mobile Intelligence Operations** — miPaaS (Mobile Intelligence PaaS) provides business and IT operators with unified visibility into mobile app performance (MAU/DAU, journey conversion, customer feedback) and full governance over the plugin and journey lifecycle within the PlatformHub mobile apps — without requiring app store releases.

---

## 2. System Context Diagram

```
 ╔══════════════════════════════════════════════════════════════════════════════════════╗
 ║                    HSBC Digital Sales Promotion Platform (DSPP)                      ║
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
│  │  • KYC Orchestrator              │   │  • Slice canvas editor           │    │
│  │  • Personalisation Engine        │   │  • Maker-Checker approval queue  │    │
│  │  • A/B Test Allocator (Optimizely│   │  • AEO / Statistics panels       │    │
│  │  • Redis Cache Layer             │   │  • WeChatComposer, Admin panels  │    │
│  │  • RBAC BizLineAccessGuard       │   └──────────────────────────────────┘    │
│  │  • Immutable Audit Logger        │   ┌──────────────────────────────────┐    │
│  │  • Analytics Event Forwarder     │   │  UCP Console (Content Platform)  │    │
│  └──────────────────────────────────┘   │                                  │    │
│                                         │  • Content Asset Library         │    │
│  ┌──────────────────────────────────┐   │  • Component Registry (14 slice  │    │
│  │  mock-BFF (Node.js — local dev)  │   │    types)                        │    │
│  │  In-memory simulation of BFF +   │   │  • Content approval workflow     │    │
│  │  OCDP/UCP. Port 4000.            │   │  • BizLine admin                 │    │
│  └──────────────────────────────────┘   └──────────────────────────────────┘    │
│                                                                                   │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐    │
│  │  HSBC AEM (Adobe Experience Mgr) │   │  Optimizely / LaunchDarkly       │    │
│  │  Existing HSBC content source;   │   │  A/B test allocation + flags     │    │
│  │  OCDP slices can reference AEM   │   └──────────────────────────────────┘    │
│  │  URLs alongside UCP content      │                                          │
│  └──────────────────────────────────┘                                          │
│  ┌──────────────────────────────────┐                                          │
│  │  Redis (AWS ElastiCache)         │                                          │
│  │  SDUI JSON cache (TTL-based)     │                                          │
│  └──────────────────────────────────┘                                          │
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
| OCDP Console | Platform | Staff-facing CMS for authoring, reviewing, and publishing SDUI pages; page editor canvas with slice-level content source configuration (UCP or HSBC AEM URLs), journey builder, Maker-Checker approval queue, AEO/stats panels | Content Engineering |
| UCP Console | Platform | Content asset library, component registry (14 slice types), approval workflow, biz-line admin | Content Engineering |
| HSBC AEM | Platform | Existing Adobe Experience Manager instance; OCDP page editor can reference AEM-hosted content (images, pages, assets) alongside UCP content via configurable URLs per slice | Digital Channels |
| mock-BFF | Platform | Node.js local dev simulator of bff-java + OCDP/UCP APIs; all state in-memory; port 4000 | Platform Engineering |
| Java BFF | Platform | SDUI JSON composition, KYC orchestration, personalisation, A/B routing, Redis cache, RBAC, immutable audit log, event forwarding | Platform Engineering |
| SDUI Composition Engine | Platform | Resolves screen template, fills slots, injects props, negotiates client schema version | Platform Engineering |
| KYC Orchestrator | Platform | KYC step plan stored in Redis (72h TTL), branching logic (SHOW/HIDE), answer persistence, audit logging | Platform Engineering |
| Personalisation Engine | Platform | Segments user, selects eligible content per segment, calls ML recommender | Data & Personalisation |
| A/B Test Allocator | Platform | Sticky user-to-variant allocation via Optimizely; injects variantId into SDUI response | Growth Engineering |
| RBAC BizLineAccessGuard | Platform | Enforces AUTHOR/APPROVER/AUDITOR/ADMIN roles + biz-line content isolation + Maker-Checker constraint | Security Engineering |
| Immutable Audit Logger | Platform | PostgreSQL hash-chain audit log; UPDATE/DELETE revoked at DB level; `verify_ucp_audit_chain()` integrity function | Security Engineering |
| Redis Cache | Platform | Caches SDUI JSON per screen+user+variant, TTL invalidation on CMS publish | Platform Engineering |
| Web SDUI Renderer | Presentation | Parses JSON, resolves 24 React components, binds props, handles actions, fires Tealium analytics | Web Engineering |
| iOS SDUI Renderer | Presentation | Parses JSON, resolves SwiftUI views (11 KYC steps + Wealth + FXViewpoint), handles actions, fires analytics | iOS Engineering |
| Android SDUI Renderer | Presentation | Parses JSON, resolves Compose composables, handles actions, fires analytics | Android Engineering |
| HarmonyOS NEXT Renderer | Presentation | Parses JSON, resolves ArkUI components (KYC + Wealth + FXViewpoint + AI Search), fires SensorData events | HarmonyNext Engineering |
| HIVE Design Tokens | Cross-cutting | Single design token source-of-truth (JSON/CSS/Swift/Kotlin/ArkTS); HIVE Design Language v2.1.0 | Design Systems |
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

### 5.3 OCDP / BFF ↔ HSBC AEM

| Attribute | Detail |
|-----------|--------|
| Integration | OCDP page editor allows each slice's content URLs (images, videos, deep links) to reference either UCP-hosted assets or existing HSBC AEM content |
| Pattern | Editor configures `imageUrl`, `videoUrl`, or `ctaDeepLink` per slice — URL can point to UCP (`/media/*`) or AEM (`https://www.hsbc.com.hk/...`) |
| BFF behaviour | Composition engine resolves content URLs as-is; no transformation needed — both UCP and AEM URLs are passed through to the SDUI JSON payload |
| CDN | UCP assets served via CloudFront / Tencent CDN; AEM assets served via HSBC's existing AEM CDN infrastructure |

### 5.4 Clients ↔ DAP Event Ingestion

| Attribute | Detail |
|-----------|--------|
| Protocol | HTTPS POST to DAP Event Ingestion API |
| Batching | Events batched every 5 seconds or 20 events, whichever first |
| Format | `{eventType, componentId, screenId, userId_hash, timestamp, properties}` |
| Overseas | → GCP Pub/Sub → Dataflow → BigQuery |
| China | → SensorData SDK endpoint (China-resident servers) |
| PII | userId hashed (SHA-256 + per-user salt) before leaving device |

### 5.5 DAP ↔ CMS Feedback Loop

| Attribute | Detail |
|-----------|--------|
| Protocol | REST POST to Stripes CMS Management API |
| Trigger | Scoring job every 6h; anomaly alerts near-real-time |
| Payload | `{contentId, cpsScore, band, recommendations[], alertType}` |
| Notifications | Slack webhook + email digest; in-CMS score badge |

### 5.6 AEO Probe ↔ LLM APIs

| Attribute | Detail |
|-----------|--------|
| ChatGPT | OpenAI API `gpt-4o`, `POST /v1/chat/completions` |
| Perplexity | Perplexity API, `sonar-pro` model (web-grounded) |
| Google AI | Google Search Console API + weekly manual spot-check pipeline |
| Bing Copilot | Bing Web Search API for AI-generated answer sampling |
| Schedule | Daily cron 03:00 HKT (off-peak); results to BigQuery `dap.aeo_probe_results` |

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
| Resilience | SDUI client: BFF unavailable | Serve device-cached last-known-good screen | — |
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
| CMS (Authoring) | OCDP Console | React 18, TypeScript 5, Vite; IndexedDB local state; port 3002 |
| CMS (Content) | UCP Console | React 18, TypeScript 5, Vite; 14-slice registry; port 3001 |
| CMS (Local Dev) | mock-BFF | Node.js / Express; single-file in-memory simulator; port 4000 |
| BFF | Backend for Frontend | Java 17, Spring Boot 3.x, WebFlux (reactive) |
| BFF | API Layer | Spring Cloud Gateway + REST |
| BFF | Cache (Overseas) | Redis 7.x (AWS ElastiCache) |
| BFF | Cache (China) | Redis Cache (China-resident) |
| BFF | A/B Testing | Optimizely Feature Experimentation |
| BFF | Feature Flags | LaunchDarkly |
| BFF | Audit Log | PostgreSQL + Flyway (V3 hash-chain immutable log) |
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
| CDN (Overseas) | Edge | AWS CloudFront (WAF + cache) |
| CDN (China) | Edge | Tencent CDN |
| Observability | Tracing | OpenTelemetry → Datadog |
| Observability | Logging | GCP Cloud Logging + ELK |
| CI/CD | Pipeline | GitHub Actions + ArgoCD (GitOps) |
| Infrastructure | IaC | Terraform |
| Containers | Orchestration | AWS EKS (overseas); Alibaba ACK (China) |
