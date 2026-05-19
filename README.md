# HSBC Digital Sales Promotion Ecosystem (DSP Ecosystem)

**Publish in seconds, not sprints. Personalise at scale. Optimise with intelligence.**

The DSP Ecosystem is a content orchestration platform for publishing, personalising, and measuring HSBC promotional experiences across native mobile, web, and WeChat channels without app releases for content changes.

Its architecture highlights are rapid SDUI publishing, AI discoverability, governed personalisation, end-to-end observability, app performance monitoring, high availability, and safe CI/CD across overseas AWS and mainland China IKP/Alicloud/Tencent deployment planes.

This repository contains runnable prototypes and reference implementations for the staff consoles, local mock BFF, web SDUI renderer, native SDUI renderers, design tokens, analytics workers, and Java BFF modules.

---

## Current Implemented Snapshot

The current repository state is summarised in [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md). Key implemented surfaces include:

- **Home Hub (HK)**: `home-hub-hk`, a 9-slice SDUI page implemented across Web, iOS, Android, and HarmonyOS NEXT. The display name is "Home Hub (HK)"; `home-hub-hk` remains the stable technical page ID and API path.
- **FX Viewpoint**: `fx-viewpoint-hk`, a market insight SDUI page with inline video and RM contact CTA.
- **OBKYC journey**: KYC orchestration and SDUI step rendering across web and native clients.
- **iOS SwiftUI app**: `ios-sdui/HSBCSDUI.xcodeproj` is the active Swift project; `HSBCSduiApp.swift` is the SwiftUI `@main` entry point.
- **OCDP Console**: page authoring, journey builder, maker-checker workflow, AEO assessment, AI Search admin, WeChat composer, usage statistics, audit panels.
- **AI Search sample**: OCDP now seeds a detailed `HK HarmonyNext App Semantic Search` config with multiple entry-point/content configuration sources, governed video/image/file URL sources, and customer-segment/account/location access rules.
- **UCP Console**: content asset library, component registry, workflow, media assets, local database sync.
- **mock-BFF**: local Express server for SDUI screens, KYC sessions, semantic search, CMS APIs, preview, workflow, and audit.
- **Java BFF modules**: SDUI composition, KYC routing, personalisation, A/B allocation, preview, workflow, RBAC, audit, and content repository services.
- **DAP workers**: Python services for AEO probes, content scoring, feedback loop, app-store harvesting, surveys, and archive lifecycle.
- **Jenkins CI/CD**: root `Jenkinsfile` plus AWS/EKS/S3/Route53 and mainland China IKP/Alicloud/Tencent helper flows for validation, deploy, restart, static publish and site switch.
- **OpenTelemetry observability**: monitoring matrix, dashboards, synthetics and mobile/web startup traces for end-to-end API/cache/DB availability across AWS and mainland China.

### Ecosystem Operational Highlights

| Highlight | Target / proof point |
|-----------|----------------------|
| Home Hub availability | 99.95% monthly API availability |
| AI Search and KYC availability | 99.9% monthly availability |
| Staff authoring availability | 99.5% monthly for OCDP/UCP |
| Static SDUI JSON | 99.99% target through object storage + CDN fallback |
| Publish speed | p95 < 60 seconds for normal SDUI publish |
| Startup performance | iOS cold p95 < 3.0 s; Android/HarmonyNext cold p95 < 3.5 s; warm p95 < 1.2-1.4 s |
| Traceability | W3C `traceparent` from client startup/search/KYC to gateway, BFF, cache, DB/search and analytics ingestion |
| CI/CD safety | Jenkins validation, deployment, restart, site switch, approval gates and dashboard deploy markers |

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Presentation Layer                                                    │
│ Web React SDUI · iOS SwiftUI · Android Compose · HarmonyOS ArkUI      │
│ Pure renderers: component registry, action handling, analytics hooks  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ SDUI JSON / events
┌───────────────────────────────▼──────────────────────────────────────┐
│ Platform Layer                                                        │
│ Java BFF · mock-BFF · UCP Console · OCDP Console                      │
│ Composition, KYC orchestration, preview, workflow, RBAC, search       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ Signals, scores, recommendations
┌───────────────────────────────▼──────────────────────────────────────┐
│ Intelligence Layer                                                    │
│ DAP workers: AEO probes, CPS scoring, feedback, app reviews, surveys  │
└──────────────────────────────────────────────────────────────────────┘
```

### Delivery Channels

| Channel | Platforms | Rendering | Primary optimisation |
|---------|-----------|-----------|----------------------|
| `SDUI` | iOS, Android, HarmonyOS NEXT, Web | Native or React components from JSON | Personalisation, A/B testing, rapid publish |
| `WEB_STANDARD` | Browser | SEO/AEO-ready web pages | Metadata, JSON-LD, crawlability, AEO score |
| `WEB_WECHAT` | WeChat H5 / Mini Programme | China-hosted H5 experience | WeChat distribution, China analytics |

---

## Core Components

### Staff Consoles

**UCP Console** (`ucp-console`)

- React + TypeScript staff UI on port `3001`.
- Content asset library, component registry, workflow, history, and media serving.
- Canonical component registry includes Home Hub, campaign, deposit, FX, AI Search, and KYC slice types.
- Local state is backed by PGlite/IndexedDB for console history and sync.

**OCDP Console** (`ocdp-console`)

- React + TypeScript staff UI on port `5173` by Vite default unless overridden.
- Page editor, journey builder, pending approvals, audit log, statistics, AEO panel, AI Search admin, WeChat composer, and admin panels.
- Web Standard submission runs the implemented AEO calculator and stores scores with `SAVE_AEO_SCORE`.
- The authoring model treats UCP and HSBC AEM as peer content providers through `contentRef` and corpus source configuration.
- AI Search Admin includes the HK HarmonyNext sample by default, so the AI Search tab is not empty on a clean local database. Editors can review, edit and delete content sources, quick-access entry-point configuration, and governed media/file URL sources. Runtime visibility follows the same customer segment, account type and location model as the OCDP page editor.

### Backend

**mock-BFF** (`mock-bff`)

- Node.js/Express local development server on port `4000`.
- Serves public Zone 1 APIs for SDUI screens, KYC sessions, analytics events, and semantic search.
- Serves internal Zone 2 APIs for content, workflow, UCP pages, preview, audit, and AI Search corpus rebuilds.
- Rebuilds per-app AI Search corpora from quick-access JSON/URLs, OCDP pages, AEM URLs, and governed video/image/file URLs. Search requests accept audience context (`customerSegment`, `accountType`, `customerLocation`) and filter results before ranking.
- Uses in-memory state and `x-mock-staff-role` headers instead of production IAM.

**Java BFF** (`bff-java`)

- Spring Boot/WebFlux production reference modules.
- Includes SDUI composition, version negotiation, props injection, KYC orchestration, platform splitting, personalisation, A/B allocation, workflow, preview tokens, RBAC, immutable audit, and analytics forwarding.

### SDUI Renderers

| Platform | Location | Notes |
|----------|----------|-------|
| Web | `web-sdui` | React 18 + TypeScript. Home Hub, FX Viewpoint, deposit campaign, KYC demo, analytics, cache, action handling. Dev port is `3000`. |
| iOS | `ios-sdui/HSBCSDUI.xcodeproj` / `ios-sdui/HSBCSDUI` | SwiftUI renderer with Wealth, FX, Deposit, KYC, Tealium, HIVE tokens, inline video fixes, AI Search governed asset results, and startup/network observability. |
| Android | `android-sdui/app/src/main/java/com/hsbc/sdui` | Jetpack Compose renderer with Wealth, FX, Deposit, KYC, Tealium, HIVE tokens, locale helpers, AI Search governed asset results, and startup/network observability. |
| HarmonyOS NEXT | `harmonynext-sdui` | ArkTS/ArkUI renderer with SensorData analytics, platform-specific SDUI constraints, and startup/network observability. |

### Current AI Search Design

OCDP manages one `AISearchConfig` per platform (`ios`, `android`, `harmonynext`, `web`). The seeded HK HarmonyNext sample demonstrates the production contract:

- `quickAccessSource`: app entry-point configuration, provided by URL or inline JSON.
- `contentSources`: OCDP pages and AEM URLs included in the semantic corpus.
- `assetSources`: exact URLs or parent folders for governed videos, images and files.
- `entryPointRules` and source visibility rules: reuse the page-editor rule model for customer segment, account type and location targeting.

The clients call `POST /api/v1/search` with `responseMode: "a2ui"` and their platform `appId`. iOS, Android and Web now also send audience context and preserve governed `assetUrl` / `assetType` metadata in result rows.

### Current Observability Design

The client prototypes include lightweight observability bridges:

- Web: `web-sdui/src/analytics/ObservabilityClient.ts`
- iOS: `ios-sdui/HSBCSDUI/Analytics/ObservabilityClient.swift`
- Android: `android-sdui/app/src/main/java/com/hsbc/sdui/analytics/ObservabilityClient.kt`
- HarmonyNext: `harmonynext-sdui/entry/src/main/ets/network/ObservabilityClient.ets`

They generate `traceparent`, time Home Hub startup steps, and emit Home/API/Search network timing events through the current analytics path. The production monitoring matrix is in `docs/19_observability_monitoring.md`.

### Intelligence and Design System

- `dap-python`: AEO probe, CPS scoring, feedback, app-store review harvesting, survey ingestion, archive lifecycle.
- `hive-tokens`: W3C design token source emitted to CSS, Swift, and Kotlin.

---

## Implemented Home Hub Slice Contract

The canonical Home Hub (HK) page (`pageId: home-hub-hk`) uses this 9-slice order:

| # | Slice type | Purpose |
|---|------------|---------|
| 1 | `HOME_SEARCH_HEADER` | Segment-aware HSBC header with semantic search controls |
| 2 | `COMBO_QUICK_ACCESS` | Tab strip plus quick-access icon grid |
| 3 | `CARD_ACTIVATION_BANNER` | Card activation prompt |
| 4 | `QUEST_BANNER` | Getting-started progress prompt |
| 5 | `FEATURE_PRODUCT` | Fund tabs and ranked product rows |
| 6 | `WEALTH_STUDIO_CAROUSEL` | Premier Elite Wealth Studio video carousel |
| 7 | `GUIDES_INSIGHTS_CAROUSEL` | Guide and insight article carousel |
| 8 | `FX_WATCHLIST` | Currency pair watchlist and tier badge |
| 9 | `DISCOVER_MORE_CAROUSEL` | Campaign and lifestyle offer carousel |

---

## Quick Start

Install dependencies per package, then run the local stack:

```bash
cd mock-bff && npm install && npm start
```

```bash
cd ucp-console && npm install && npm run dev
```

```bash
cd ocdp-console && npm install && npm run dev
```

```bash
cd web-sdui && npm install && npm run dev
```

Default local endpoints:

| Service | URL |
|---------|-----|
| mock-BFF | `http://localhost:4000` |
| UCP Console | `http://localhost:3001` |
| OCDP Console | `http://localhost:5173` |
| Web SDUI | `http://localhost:3000` |

Native clients should point to the mock-BFF:

- iOS simulator: `http://127.0.0.1:4000`
- Android emulator: `http://10.0.2.2:4000`
- Physical devices: the machine LAN IP on port `4000`

See [docs/12_local_dev_environment.md](docs/12_local_dev_environment.md) for the detailed local setup and API surface.
For a start-to-finish service runbook, see [docs/17_service_cookbook.md](docs/17_service_cookbook.md).
For Jenkins deployment operations, see [docs/18_jenkins_cicd_cookbook.md](docs/18_jenkins_cicd_cookbook.md).
For OpenTelemetry monitoring and synthetic checks, see [docs/19_observability_monitoring.md](docs/19_observability_monitoring.md).

---

## Documentation

- [Documentation Index](docs/00_README.md)
- [System Overview](docs/01_system_overview.md)
- [SDUI Architecture](docs/02_sdui_architecture.md)
- [DAP Architecture](docs/03_dap_architecture.md)
- [AEO/SEO Strategy](docs/04_aeo_seo_strategy.md)
- [User Stories](docs/05_user_stories.md)
- [CMS Maker-Checker](docs/06_cms_maker_checker.md)
- [SDUI Preview Workflow](docs/07_sdui_preview_workflow.md)
- [Content Repository](docs/08_content_repository.md)
- [Open Banking KYC SDUI](docs/09_openbanking_kyc_sdui.md)
- [HIVE Design Tokens](docs/10_hive_design_tokens.md)
- [AD/RBAC Design](docs/11_ad_rbac_design.md)
- [Local Development](docs/12_local_dev_environment.md)
- [miPaaS Architecture](docs/14_mipaaS_architecture.md)
- [Service Cookbook](docs/17_service_cookbook.md)
- [Jenkins CI/CD Cookbook](docs/18_jenkins_cicd_cookbook.md)
- [Observability and Monitoring](docs/19_observability_monitoring.md)

---

## License

Internal - Confidential  
Copyright 2026 The Hongkong and Shanghai Banking Corporation Limited
