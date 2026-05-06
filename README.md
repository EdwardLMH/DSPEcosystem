# HSBC Digital Sales Promotion Platform (DSP Ecosystem)

**Publish in seconds, not sprints. Personalise at scale. Optimise with intelligence.**

A unified content orchestration platform that enables marketing and product teams to publish, personalise, and optimise promotional experiences across all HSBC digital channels — without app releases or engineering sprints.

---

## Overview

The DSP Ecosystem brings together content management, server-driven UI, analytics intelligence, and AI-powered optimisation into a single platform serving iOS, Android, HarmonyOS NEXT, Web, and WeChat channels.

**Key Capabilities:**
- 🚀 **Instant Publishing** — Content goes live across all platforms in under 60 seconds, no App Store dependency
- 🎯 **AI-Powered Personalisation** — Every screen tailored by customer segment with built-in A/B testing
- 🔍 **Answer Engine Optimisation (AEO)** — Daily monitoring of HSBC citations in ChatGPT, Perplexity, and other LLMs
- 📊 **Closed-Loop Analytics** — Performance scores flow back to editors as actionable recommendations
- 🔐 **Governance by Design** �� Maker-Checker workflows, business-line access control, immutable audit logs
- ��� **Author Once, Deliver Everywhere** — Single console publishes to five native platforms with appropriate rendering

---

## Architecture

### Three-Layer Design

```
┌���──��──���────��──���──────��──���──��──���─────��──���───��──���─────��──���──────��──┐
│  PRESENTATION LAYER                                              │
│  iOS (SwiftUI) · Android (Compose) · HarmonyOS (ArkUI)          │
��  Web (React) · WeChat Mini Programme                            │
│  Pure SDUI renderers — no business logic                        │
└─��───��──���─────��──���─────��───��┬──��──���────��──��──���──��──���────��───��──���─┘
                             │ SDUI JSON over HTTPS
���────��────��──���──────��──���──��──���──��───��────��──���───��──���────��──��──��───┐
│  PLATFORM LAYER                                                  ���
│  ┌───��──���────��──���  ┌���────��──���───��─┐  ┌─���──��──���───��──────��─┐    ���
│  ��� Java BFF     │  │ UCP Console  │  │ OCDP Console       │    ���
│  │ Composition  │  │ Content Mgmt │  │ Page Authoring     │    ���
│  │ Personalise  │  │ 14 Slices    │  �� Maker-Checker      │    │
��  │ A/B Testing  │  │ Workflow     │  │ AEO Assessment     ���    │
│  └──��────��────��─┘  └───��──���─────��─┘  └─���───��──���────��────��─┘    │
└─��──���─────��───��──���────��──��──���───��──���──────��──���────��───��──���──��──���─┘
                             │ Events & Signals
���───��────��──���────��──��──���─────��──���────��─────��──���───────��───��──���──��─┐
│  INTELLIGENCE LAYER                                              ��
│  Digital Analytics Platform (DAP)                                │
│  Behavioral · Surveys · App Store · AEO Monitoring              │
│  Content Performance Scoring · Feedback Loop                    │
└────��──���─────��──��──���─────��────��──��──���─────��──���────��───��──���───��───┘
```

### Omni-Channel Delivery

The platform delivers content through **three distinct channels**, each optimised for its distribution model:

| Channel | Platforms | Rendering | Optimisation |
|---------|-----------|-----------|--------------|
| **SDUI** | iOS, Android, HarmonyOS NEXT, Web | Native UI from JSON | Personalisation, A/B testing |
| **WEB_STANDARD** | Browser (desktop/mobile) | Server-rendered HTML + JSON-LD | Full SEO/AEO, Schema.org |
| **WEB_WECHAT** | WeChat Built-in Browser | H5 SPA | WeChat Service Account distribution |

---

## Core Components

### 1. Content Management System

**UCP Console** — Content asset library and component registry
- 14 canonical slice types (PROMO_BANNER, QUICK_ACCESS, AI_SEARCH_BAR, etc.)
- Content approval workflow with business-line isolation
- Component registry shared across all platforms

**OCDP Console** — Page authoring and publishing
- Visual page editor with slice-level composition
- Journey builder for multi-step flows
- Maker-Checker approval queue with per-market instances
- AEO assessment panel (100-point scoring rubric)
- Statistics dashboard with usage metrics
- WeChat Service Account composer

**mock-BFF** — Local development simulator
- Node.js/Express single-file implementation
- In-memory state for rapid iteration
- Simulates both BFF and CMS APIs
- Port 4000

### 2. Backend for Frontend (BFF)

**Java Spring Boot 3 / WebFlux** — Production composition engine
- SDUI JSON composition with slot-based templating
- KYC orchestration with branching logic
- Personalisation engine (segment-aware content selection)
- A/B test allocation (Optimizely integration)
- Redis cache layer (85%+ hit rate target)
- RBAC with business-line access guards
- Immutable audit logging (PostgreSQL hash-chain)

### 3. SDUI Renderers

**Web** — React 18 + TypeScript
- 24-component registry
- Tealium analytics auto-instrumentation
- Vite build system

**iOS** �� Swift 5.9 + SwiftUI
- Component registry with ViewBuilders
- Combine for reactive data flow
- HIVE design tokens

**Android** — Kotlin + Jetpack Compose
- Composable-based component registry
- Coroutines for async operations
- Material Design 3 with HIVE tokens

**HarmonyOS NEXT** — ArkTS + ArkUI
- Native HarmonyOS component system
- SensorData analytics (China data residency)
- hvigor build system

### 4. Digital Analytics Platform (DAP)

**Dual-Stack Architecture** for data residency compliance:

**Overseas Stack** (GCP)
- BigQuery data lake (partitioned by date, clustered by userId)
- Pub/Sub + Dataflow for real-time streaming
- Looker dashboards (journey funnels, content leaderboard)
- Vertex AI for propensity models and recommendations

**China Stack** (SensorData 神策��据)
- Real-time event pipeline with in-China endpoints
- Built-in BI and attribution dashboards
- MaxCompute for batch analytics
- Alibaba OSS for data lake storage

**Signal Sources:**
- Behavioral events (clicks, impressions, conversions)
- App store reviews (harvested + NLP sentiment analysis)
- Customer surveys (NPS, CSAT via Qualtrics + in-app)
- AEO monitoring (daily LLM citation probes)

**Content Performance Score (CPS):**
```
CPS = (
    cta_click_rate        × 0.20 +
    conversion_rate       �� 0.30 +
    journey_completion    × 0.15 +
    nps_delta             × 0.15 +
    aeo_citation_share    × 0.10 +
    app_store_sentiment   × 0.05 +
    scroll_depth_pct      × 0.05
) × 100
```

**Bands:** STAR (80-100) · GOOD (60-79) · REVIEW (40-59) · URGENT (0-39)

### 5. Answer Engine Optimisation (AEO)

**Why AEO Matters:**
Customers increasingly bypass traditional search engines and receive direct answers from LLMs (ChatGPT, Perplexity, Google AI). If HSBC content isn't cited, the customer never reaches HSBC.com — the competitor whose content is cited wins the consideration moment.

**AEO Pipeline:**

1. **Authoring** (OCDP Console)
   - Mandatory structured fields: product name, rates, FAQ (min 3 Q&A)
   - Author credentials (CFP/CFA/Licensed Banker)
   - Last reviewed date (blocks publish if > 90 days)
   - Regulatory references (HKMA/SFC/FCA)

2. **Schema Auto-Generation**
   - FinancialProduct, FAQPage, HowTo, BankOrCreditUnion
   - JSON-LD emitted into page `<head>` automatically
   - llms.txt machine-readable product index

3. **LLM Visibility Monitoring**
   - Daily probe job (03:00 HKT)
   - Queries ChatGPT (gpt-4o) + Perplexity (sonar-pro)
   - Tracks: HSBC cited? URL? Position? Competitor gap?
   - Results → BigQuery `dap.aeo_probe_results`

4. **Feedback Loop**
   - Citation share trends in OCDP AEO panel
   - Alerts when citation share drops > 10% WoW
   - Content gap tasks created for editors

**AEO Scoring Rubric (100 points):**
- FAQPage schema present: 20 pts
- FinancialProduct/HowTo schema: 20 pts
- Last reviewed < 30 days: 15 pts
- Author credentials declared: 10 pts
- Regulatory reference linked: 10 pts
- Rate/fee in structured field: 10 pts
- Direct answer in first 60 words: 10 pts
- Cited by LLM in last 30 days: 5 pts

**Grade:** A (85-100) · B (70-84) · C (50-69) · D (30-49) · F (0-29)

### 6. Mobile Intelligence Platform (miPaaS)

**Business Intelligence Operations:**
- Unified visibility into mobile app performance (MAU/DAU, journey conversion)
- Customer feedback aggregation and sentiment analysis
- Real-time monitoring dashboards for business stakeholders

**IT Governance Operations:**
- Plugin lifecycle management (register, approve, deploy, deprecate)
- Journey orchestration controls (enable/disable, version management)
- Full governance over PlatformHub mobile apps without app store releases
- System registry integration with ServiceNow CMDB

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite |
| **iOS** | Swift 5.9, SwiftUI, Combine |
| **Android** | Kotlin, Jetpack Compose, Coroutines |
| **HarmonyOS** | ArkTS, ArkUI, hvigor |
| **BFF** | Java 17, Spring Boot 3, WebFlux |
| **Cache** | Redis 7.x (AWS ElastiCache / China-resident) |
| **Analytics (Overseas)** | GCP BigQuery, Pub/Sub, Dataflow, Looker, Vertex AI |
| **Analytics (China)** | SensorData 神策��据, MaxCompute, Alibaba OSS |
| **A/B Testing** | Optimizely Feature Experimentation |
| **Feature Flags** | LaunchDarkly |
| **Design System** | HIVE Design Language v2.1.0 (W3C tokens) |
| **CDN** | AWS CloudFront (overseas), Tencent CDN (China) |
| **Observability** | OpenTelemetry, Datadog, GCP Cloud Logging |
| **CI/CD** | GitHub Actions, ArgoCD (GitOps) |
| **IaC** | Terraform |
| **Orchestration** | AWS EKS (overseas), Alibaba ACK (China) |

---

## Repository Structure

```
DSPEcosystem/
���── docs/                        # Architecture & design documents
│   ├── 01_system_overview.md    # Full ecosystem architecture
│   ├─��� 02_sdui_architecture.md  # Server Driven UI deep design
│   ├─��� 03_dap_architecture.md   # Digital Analytics Platform
│   ├── 04_aeo_seo_strategy.md   # AEO / LLM visibility + SEO
│   ├─��� 09_openbanking_kyc_sdui.md   # KYC SDUI orchestration
│   ├─�� 11_ad_rbac_design.md     # AD group RBAC & authorization
│   └─�� 14_mipaaS_architecture.md    # Mobile Intelligence PaaS
│
├─�� mock-bff/                    # Node.js local dev BFF simulator
��   └─��� server.js                # Port 4000
│
���── ucp-console/                 # React — Content Platform Console
│   └─��� src/                     # Port 3001
│
├─�� ocdp-console/                # React �� Page Authoring Console
│   ���── src/                     # Port 3002
│
├── bff-java/                    # Java Spring Boot — Production BFF
│   └─��� src/main/java/com/hsbc/dsp/
│
├── web-sdui/                    # React — Web SDUI Renderer
│   └── src/
│
��── ios-sdui/                    # Swift/SwiftUI — iOS SDUI Renderer
│   └── HSBCKyc/
│
├─��� android-sdui/                # Kotlin/Compose — Android Renderer
│   └─�� app/src/main/java/com/hsbc/sdui/
│
├── harmonynext-sdui/            # ArkTS/ArkUI — HarmonyOS Renderer
���   └── entry/src/main/ets/
│
├── hive-tokens/                 # HIVE Design Language v2.1.0
│   ├��─ json/hive-tokens.json    # Source of truth
│   ├��─ css/hive-tokens.css      # Web
│   ���── swift/HiveTokens.swift   # iOS
│   └─�� kotlin/HiveTokens.kt     # Android
│
��── dap-python/                  # Digital Analytics Platform Workers
    ���── aeo_probe/               # LLM citation monitoring
    ├── content_scoring/         # CPS engine (every 6h)
    ├─�� feedback_loop/           # CMS notification service
    ├─��� app_store/               # Review harvesting + NLP
    └─�� surveys/                 # Survey ingestion + mapping
```

---

## Quick Start

### Local Development

1. **Start mock-BFF** (simulates both BFF and CMS APIs):
   ```bash
   cd mock-bff
   npm install
   npm start  # Port 4000
   ```

2. **Start UCP Console** (content management):
   ```bash
   cd ucp-console
   npm install
   npm run dev  # Port 3001
   ```

3. **Start OCDP Console** (page authoring):
   ```bash
   cd ocdp-console
   npm install
   npm run dev  # Port 3002
   ```

4. **Run native apps** (iOS/Android/HarmonyOS):
   - iOS Simulator: BFF at `127.0.0.1:4000`
   - Android/HarmonyOS emulator: BFF at `10.0.2.2:4000`

See [docs/12_local_dev_environment.md](docs/12_local_dev_environment.md) for detailed setup instructions.

---

## Key Features

### Server-Driven UI (SDUI)

**Traditional mobile apps:**
- Every change requires full development sprint
- QA cycle + app store submission (1-3 days)
- Time-sensitive promotions miss market windows

**With SDUI:**
- Server owns the layout
- App ships component library + rendering engine
- Backend composes screens as JSON at runtime
- CMS publish → live in < 60 seconds

**Versioning Contract:**
- Client declares supported schema version in headers
- Server negotiates compatible response
- Graceful degradation for older clients
- Unknown components render fallback or skip

### Personalisation & A/B Testing

**Segment-Aware Content:**
- User segmentation (premier, jade, mass_retail)
- Eligibility rules per content piece
- ML-driven product recommendations
- Dynamic slot resolution at request time

**Built-in A/B Testing:**
- Sticky user-to-variant allocation (Optimizely)
- Variant metadata injected into analytics
- Statistical significance detection (p < 0.05, min 7 days)
- Automatic winner promotion recommendations

### Governance & Compliance

**Maker-Checker Workflow:**
- Separate AUTHOR and APPROVER roles
- Per-market approval instances (independent approval per market)
- Multi-step approval flows configurable by market admin
- Same-person restriction enforcement

**Business-Line Isolation:**
- Content scoped to business lines (PAYMENT, WEALTH, LENDING, etc.)
- AD group-based access control
- Cross-business-line content requires explicit grants

**Immutable Audit Log:**
- PostgreSQL hash-chain design
- UPDATE/DELETE revoked at database level
- `verify_ucp_audit_chain()` integrity function
- Full compliance with HKMA, GDPR, PIPL

### Data Residency

**Overseas Markets** (HK, UK, SG, US):
- AWS EKS for microservices
- GCP BigQuery for analytics
- CloudFront CDN
- Tealium analytics

**Mainland China:**
- Alibaba ACK for microservices
- SensorData 神策��据 for analytics
- Tencent CDN
- All user data China-resident (PIPL compliant)

**Unified Aggregation Layer:**
- Anonymised/aggregated cross-region sync
- No PII crosses borders
- Separate compliance boundaries

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| BFF SDUI response p50 | < 80ms | > 100ms |
| BFF SDUI response p95 | < 150ms | > 200ms |
| Client time-to-first-component | < 200ms | > 300ms |
| Redis cache hit rate | > 85% | < 75% |
| CDN cache hit rate | > 90% | < 80% |
| DAP event throughput | > 50,000/s | < 30,000/s |
| BFF uptime SLA | 99.95% | — |

---

## Security & Compliance

| Domain | Implementation |
|--------|----------------|
| **Authentication** | HSBC OAuth 2.0 with PKCE (mobile); client_credentials (service-to-service) |
| **Authorization** | Role-based (AUTHOR/APPROVER/AUDITOR/ADMIN) with business-line scoping |
| **Data in Transit** | TLS 1.3; HSTS; no HTTP fallback |
| **Data at Rest** | AWS KMS (overseas); AES-256 via China cloud KMS |
| **PII Handling** | SHA-256 hashed + per-user salt before leaving device |
| **HKMA** | Full audit trail, approval workflow, quarterly review |
| **GDPR** | Data minimisation, erasure API, DPA with processors |
| **China PIPL** | All CN user data resident in China; explicit consent; no cross-border PII |
| **PCI-DSS** | No card data in SDUI or DAP pipelines |

---

## Documentation

- [System Overview](docs/01_system_overview.md) — Full ecosystem architecture
- [SDUI Architecture](docs/02_sdui_architecture.md) — Server-driven UI deep dive
- [DAP Architecture](docs/03_dap_architecture.md) — Analytics platform design
- [AEO/SEO Strategy](docs/04_aeo_seo_strategy.md) — LLM visibility & search optimization
- [User Stories](docs/05_user_stories.md) �� Epic & user story backlog
- [Maker-Checker Workflow](docs/06_cms_maker_checker.md) — CMS approval process
- [SDUI Preview](docs/07_sdui_preview_workflow.md) — On-device approval workflow
- [Content Repository](docs/08_content_repository.md) — Versioning & legal hold
- [KYC SDUI](docs/09_openbanking_kyc_sdui.md) — KYC orchestration design
- [HIVE Design Tokens](docs/10_hive_design_tokens.md) — Design system specification
- [RBAC Design](docs/11_ad_rbac_design.md) — AD group authorization
- [Local Dev Environment](docs/12_local_dev_environment.md) ��� Setup guide
- [miPaaS Architecture](docs/14_mipaaS_architecture.md) — Mobile Intelligence Platform

---

## License

Internal ��� Confidential  
© 2026 The Hongkong and Shanghai Banking Corporation Limited

---

## Contact

**Platform Architecture Team**  
HSBC Digital Platforms Mobile and Web Enabler  

For technical questions, see [docs/00_README.md](docs/00_README.md)
