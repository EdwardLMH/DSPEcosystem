# HSBC Digital Sales Promotion Platform — System Overview

**Document Version:** 1.0  
**Classification:** Internal — Confidential  
**Last Updated:** 2026-04-19  
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

The HSBC Digital Sales Promotion Platform (DSPP) is a cloud-native, multi-region content orchestration system designed to deliver personalised promotional content to HSBC retail and wealth customers across digital touchpoints including mobile banking applications, internet banking portals, and WeChat Mini Programme. The platform unifies content authoring, audience segmentation, real-time personalisation, and closed-loop analytics into a single coherent architecture, enabling marketing and product teams to launch, iterate, and measure promotional campaigns without engineering intervention.

The platform is architected around three primary concerns: **content lifecycle management** (handled by the Stripes CMS / UCP and DAP layers), **intelligent distribution** (handled by the Java BFF and personalisation engine), and **customer experience delivery** (handled by the SDUI rendering clients on web/iOS/Android). The Server-Driven UI (SDUI) pattern is central to the platform's agility story — by moving layout and component configuration to the server, the platform can update customer-facing screens without app store releases. A promotion copy change that previously required a 2-week sprint becomes a CMS publish action that goes live in under 60 seconds.

A key differentiator is the **Digital Analytics Platform (DAP)**, which aggregates signals from behavioural data (GCP Looker for overseas, SensorData for mainland China), app store reviews, customer NPS surveys, and LLM citation monitoring into a unified Content Performance Score. This score feeds directly back into the CMS editor interface, closing the optimisation loop and giving editors actionable, prioritised recommendations rather than raw dashboards. The **AEO (Answer Engine Optimisation)** module extends this further by monitoring whether HSBC products are cited by ChatGPT, Perplexity, and Google AI Overviews — a capability that is increasingly critical as customers shift to LLM-based research for financial products.

---

## 2. System Context Diagram

```
 ╔══════════════════════════════════════════════════════════════════════════╗
 ║              HSBC Digital Sales Promotion Platform (DSPP)                ║
 ║                                                                          ║
 ║  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────────┐  ║
 ║  │ Stripes CMS  │   │   Java BFF       │   │  DAP (Analytics)       │  ║
 ║  │   (UCP)      │◄──►  (SDUI Engine +  │◄──►  Behavioral / Survey / │  ║
 ║  │              │   │  Personalisation)│   │  App Store / AEO       │  ║
 ║  └──────────────┘   └──────────────────┘   └────────────────────────┘  ║
 ╚══════════════════════════════════════════════════════════════════════════╝
        ▲                      ▲  ▼                        ▲  ▼
        │ author               │  SDUI JSON                │  scores +
        │ content              │  screens                  │  alerts
        │                      │                           │
 ┌──────┴──────┐   ┌───────────┴──────────────┐   ┌───────┴──────────┐
 │  Marketing  │   │  Customers               │   │  CMS Editors     │
 │  & Product  │   │  iOS / Android / Web /   │   │  (receive        │
 │  Teams      │   │  WeChat Mini Programme   │   │  feedback loop)  │
 └─────────────┘   └──────────────────────────┘   └──────────────────┘
                                ▲  ▼
                   ┌────────────┴──────────────┐
                   │  External Systems         │
                   │  • Core Banking (eligibility, KYC)
                   │  • Identity / OAuth2 (IAM)
                   │  • CDN (Akamai / Alibaba)
                   │  • App Stores (iOS/Android/Huawei)
                   │  • LLM Engines (ChatGPT, Perplexity)
                   │  • Qualtrics (surveys)
                   │  • Optimizely (A/B tests)
                   └───────────────────────────┘
```

---

## 3. Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — PRESENTATION (Channel / Client)                                       │
│  All clients are pure SDUI renderers — NO business logic lives here.            │
│                                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌────────────────────────┐   │
│  │  Web App   │  │  iOS App   │  │ Android App │  │ WeChat Mini Programme  │   │
│  │  React/TS  │  │  SwiftUI   │  │  Compose    │  │  H5 + React Native     │   │
│  │            │  │            │  │             │  │                        │   │
│  │ Component  │  │ Component  │  │ Component   │  │ Component              │   │
│  │ Registry   │  │ Registry   │  │ Registry    │  │ Registry               │   │
│  │ + Renderer │  │ + Renderer │  │ + Renderer  │  │ + Renderer             │   │
│  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  └───────────┬────────────┘   │
│        └───────────────┴─────────────────┴────────────────────┘                 │
│                                  SDUI JSON (HTTPS)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — PLATFORM (UCP + BFF)                                                  │
│                                                                                   │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐    │
│  │  Java BFF (Spring Boot)          │   │  Stripes CMS (UCP)               │    │
│  │                                  │◄──►                                  │    │
│  │  • SDUI Composition Engine       │   │  • Content Authoring UI          │    │
│  │  • Personalisation Engine        │   │  • Journey Builder               │    │
│  │  • A/B Test Allocator            │   │  • Promotion Rule Engine         │    │
│  │  • GraphQL / REST API Gateway    │   │  • Segment-aware Content         │    │
│  │  • Redis Cache Layer             │   │  • Multi-locale (EN/ZH/HK)      │    │
│  │  • Analytics Event Forwarder     │   │  • Legal Approval Workflow       │    │
│  │  • CMS Webhook Handler           │   │  • AEO Schema Auto-generator     │    │
│  └──────────────────────────────────┘   └──────────────────────────────────┘    │
│                                                                                   │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐    │
│  │  Redis (GCP Memorystore)         │   │  Optimizely / LaunchDarkly       │    │
│  │  SDUI JSON cache (TTL-based)     │   │  A/B test allocation + flags     │    │
│  └──────────────────────────────────┘   └──────────────────────────────────┘    │
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
| Stripes CMS (UCP) | Platform | Content authoring, journey builder, promotion rules, approval workflow, AEO schema generation, multi-locale | Content Engineering |
| Java BFF | Platform | SDUI JSON composition, personalisation, A/B routing, CMS API aggregation, Redis cache, event forwarding | Platform Engineering |
| SDUI Composition Engine | Platform | Resolves screen template, fills slots, injects props, negotiates client schema version | Platform Engineering |
| Personalisation Engine | Platform | Segments user, selects eligible content per segment, calls ML recommender | Data & Personalisation |
| A/B Test Allocator | Platform | Sticky user-to-variant allocation via Optimizely; injects variantId into SDUI response | Growth Engineering |
| Redis Cache | Platform | Caches SDUI JSON per screen+user+variant, TTL invalidation on CMS publish | Platform Engineering |
| Web SDUI Renderer | Presentation | Parses JSON, resolves React components, binds props, handles actions, fires analytics | Web Engineering |
| iOS SDUI Renderer | Presentation | Parses JSON, resolves SwiftUI views, handles actions, fires analytics | iOS Engineering |
| Android SDUI Renderer | Presentation | Parses JSON, resolves Compose composables, handles actions, fires analytics | Android Engineering |
| GCP BigQuery + Looker | Intelligence | Data lake + BI for overseas; journey funnels, cohort, content leaderboard dashboards | Data Engineering |
| SensorData (神策) | Intelligence | Behavioural analytics SDK + BI for mainland China; real-time event pipeline | China Data Engineering |
| App Store Harvester | Intelligence | Polls AppFollow/AppBot for reviews, NLP sentiment + topic tagging, maps to contentId | DAP Engineering |
| Survey Engine | Intelligence | Ingests NPS/CSAT from Qualtrics and in-app SurveyWidget, maps to journeyId + contentId | CX Engineering |
| AEO Probe Service | Intelligence | Daily LLM citation probes, citation share tracking, competitor gap alerts | SEO/AEO Team |
| Content Scoring Engine | Intelligence | Computes unified CPS across all signals per contentId every 6h | DAP Engineering |
| Feedback Loop Service | Intelligence | Pushes CPS scores + recommendations to CMS dashboard; fires Slack + email alerts | DAP Engineering |

---

## 5. Integration Points

### 5.1 BFF ↔ Stripes CMS

| Attribute | Detail |
|-----------|--------|
| Protocol | REST over HTTPS |
| Auth | OAuth 2.0 client credentials (service-to-service) |
| Format | JSON — Stripes CMS Content Delivery API |
| Pattern | BFF calls CMS per screen request; Redis cache reduces CMS load |
| Invalidation | CMS publish webhook → BFF flushes Redis keys for affected screens |
| SLA | CMS API p95 < 50ms (served from GKE; horizontally scaled) |

### 5.2 BFF ↔ SDUI Clients

| Attribute | Detail |
|-----------|--------|
| Protocol | HTTPS REST: `GET /api/v1/screen/{screenId}` |
| Auth | HSBC OAuth 2.0 Bearer token (user-authenticated) |
| Format | SDUI JSON schema (versioned) |
| Key Headers | `x-sdui-version`, `x-platform`, `x-locale`, `x-segment` |
| Cache | `Cache-Control: max-age=60` for anonymous; `no-store` for personalised |
| Compression | Brotli / gzip; target payload < 80KB |

### 5.3 Clients ↔ DAP Event Ingestion

| Attribute | Detail |
|-----------|--------|
| Protocol | HTTPS POST to DAP Event Ingestion API |
| Batching | Events batched every 5 seconds or 20 events, whichever first |
| Format | `{eventType, componentId, screenId, userId_hash, timestamp, properties}` |
| Overseas | → GCP Pub/Sub → Dataflow → BigQuery |
| China | → SensorData SDK endpoint (China-resident servers) |
| PII | userId hashed (SHA-256 + per-user salt) before leaving device |

### 5.4 DAP ↔ CMS Feedback Loop

| Attribute | Detail |
|-----------|--------|
| Protocol | REST POST to Stripes CMS Management API |
| Trigger | Scoring job every 6h; anomaly alerts near-real-time |
| Payload | `{contentId, cpsScore, band, recommendations[], alertType}` |
| Notifications | Slack webhook + email digest; in-CMS score badge |

### 5.5 AEO Probe ↔ LLM APIs

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
| Scalability | BFF pod scaling | Auto 2–50 pods (GKE) | — |
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
  ┌─────────────┐       ┌─────────────────────────────────────────────┐
  │  Akamai CDN │       │  GCP (asia-east1 primary / europe-west1 DR) │
  │  WAF + Edge │──────►│                                             │
  │  Cache      │       │  ┌──────────────┐   ┌───────────────────┐  │
  └─────────────┘       │  │  GKE Autopilot│  │  Stripes CMS      │  │
                        │  │  ┌──────────┐ │  │  (GKE cluster)    │  │
                        │  │  │BFF Pods  │ │  └───────────────────┘  │
                        │  │  │(2-50)    │ │                          │
                        │  │  └──────────┘ │  ┌───────────────────┐  │
                        │  │  ┌──────────┐ │  │  GCP Data Stack   │  │
                        │  │  │  Redis   │ │  │  BigQuery/Pub/Sub  │  │
                        │  │  │Memorystore│ │  │  Dataflow/Looker  │  │
                        │  │  └──────────┘ │  │  Vertex AI         │  │
                        │  └──────────────┘  └───────────────────┘  │
                        └─────────────────────────────────────────────┘
```

### 8.2 Mainland China

```
  Customers (CN)
        │
        ▼
  ┌──────────────┐      ┌────────────────────────────────────────────┐
  │  Alibaba CDN │      │  China Cloud (Alibaba Cloud / Tencent)     │
  │  (Aliyun)    │─────►│                                            │
  └──────────────┘      │  ┌─────────────────┐  ┌────────────────┐  │
                        │  │  BFF (CN deploy) │  │ Stripes CMS CN │  │
                        │  └─────────────────┘  └────────────────┘  │
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
| Authorisation | CMS role-based: Author / Reviewer / Publisher / Admin |
| mTLS | All internal service-to-service calls use mutual TLS |
| Data in Transit | TLS 1.3; HSTS; no HTTP fallback |
| Data at Rest | GCP CMEK (overseas); AES-256 via China cloud KMS |
| PII Handling | userId SHA-256 hashed + per-user salt before leaving device; no raw PII in events |
| HKMA | Content approval workflow with full audit log; quarterly review |
| GDPR | Data minimisation; erasure API; DPA with all processors |
| China PIPL | All CN user data resident in China; explicit consent gate; no cross-border PII |
| PCI-DSS | No card data in SDUI or DAP pipelines; scope strictly isolated |
| WAF | Akamai WAF (overseas); Alibaba Anti-DDoS (China) |
| Rate Limiting | Per-user + per-IP at API Gateway; burst limits on SDUI endpoint |
| Secrets | GCP Secret Manager (overseas); China cloud KMS; zero secrets in code or config files |
| SDUI Content Security | Action types server-whitelisted; no arbitrary JS execution from JSON |

---

## 10. Technology Stack

| Layer | Component | Technology |
|-------|-----------|------------|
| CMS | Unified Content Platform | Stripes CMS (headless, API-first) |
| BFF | Backend for Frontend | Java 17, Spring Boot 3.x |
| BFF | API Layer | Spring Cloud Gateway + GraphQL (Federation) |
| BFF | Cache | Redis 7.x (GCP Memorystore) |
| BFF | A/B Testing | Optimizely Feature Experimentation |
| BFF | Feature Flags | LaunchDarkly |
| Web | SDUI Renderer | React 18, TypeScript 5, Vite |
| iOS | SDUI Renderer | Swift 5.9, SwiftUI, Combine |
| Android | SDUI Renderer | Kotlin, Jetpack Compose, Coroutines |
| Analytics (Overseas) | Data Lake | GCP BigQuery (partitioned + clustered) |
| Analytics (Overseas) | Streaming | GCP Pub/Sub + Dataflow (Apache Beam) |
| Analytics (Overseas) | BI | Looker + LookML |
| Analytics (Overseas) | ML | Vertex AI (propensity, recommendations) |
| Analytics (China) | Platform | SensorData 神策数据 SDK + BI |
| Analytics (China) | Storage | Alibaba OSS + MaxCompute |
| App Store Feedback | Harvesting | AppFollow API + Python NLP (spaCy / BERT) |
| Surveys | Platform | Qualtrics XM + in-app SDUI SurveyWidget |
| AEO Monitor | LLM Probing | Python + OpenAI API + Perplexity API |
| AEO Monitor | Schema | Schema.org JSON-LD (auto-generated by CMS) |
| CDN (Overseas) | Edge | Akamai (WAF + cache) |
| CDN (China) | Edge | Alibaba CDN (Aliyun) |
| Observability | Tracing | OpenTelemetry → Datadog |
| Observability | Logging | GCP Cloud Logging + ELK |
| CI/CD | Pipeline | GitHub Actions + ArgoCD (GitOps) |
| Infrastructure | IaC | Terraform |
| Containers | Orchestration | GKE Autopilot (overseas); ACK (China) |
