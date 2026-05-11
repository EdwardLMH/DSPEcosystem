# HSBC Digital Sales Promotion Platform (DSP Ecosystem)

**Publish in seconds, not sprints. Personalise at scale. Optimise with intelligence.**

The DSP Ecosystem is a content orchestration platform for publishing, personalising, and measuring HSBC promotional experiences across native mobile, web, and WeChat channels without app releases for content changes.

This repository contains runnable prototypes and reference implementations for the staff consoles, local mock BFF, web SDUI renderer, native SDUI renderers, design tokens, analytics workers, and Java BFF modules.

---

## Current Implemented Snapshot

The current repository state is summarised in [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md). Key implemented surfaces include:

- **Home Hub (HK)**: `home-wealth-hk`, a 9-slice SDUI page implemented across Web, iOS, Android, and HarmonyOS NEXT.
- **FX Viewpoint**: `fx-viewpoint-hk`, a market insight SDUI page with inline video and RM contact CTA.
- **OBKYC journey**: KYC orchestration and SDUI step rendering across web and native clients.
- **OCDP Console**: page authoring, journey builder, maker-checker workflow, AEO assessment, AI Search admin, WeChat composer, usage statistics, audit panels.
- **UCP Console**: content asset library, component registry, workflow, media assets, local database sync.
- **mock-BFF**: local Express server for SDUI screens, KYC sessions, semantic search, CMS APIs, preview, workflow, and audit.
- **Java BFF modules**: SDUI composition, KYC routing, personalisation, A/B allocation, preview, workflow, RBAC, audit, and content repository services.
- **DAP workers**: Python services for AEO probes, content scoring, feedback loop, app-store harvesting, surveys, and archive lifecycle.

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

### Backend

**mock-BFF** (`mock-bff`)

- Node.js/Express local development server on port `4000`.
- Serves public Zone 1 APIs for SDUI screens, KYC sessions, analytics events, and semantic search.
- Serves internal Zone 2 APIs for content, workflow, UCP pages, preview, audit, and AI Search corpus rebuilds.
- Uses in-memory state and `x-mock-staff-role` headers instead of production IAM.

**Java BFF** (`bff-java`)

- Spring Boot/WebFlux production reference modules.
- Includes SDUI composition, version negotiation, props injection, KYC orchestration, platform splitting, personalisation, A/B allocation, workflow, preview tokens, RBAC, immutable audit, and analytics forwarding.

### SDUI Renderers

| Platform | Location | Notes |
|----------|----------|-------|
| Web | `web-sdui` | React 18 + TypeScript. Home Hub, FX Viewpoint, deposit campaign, KYC demo, analytics, cache, action handling. Dev port is `3000`. |
| iOS | `ios-sdui/HSBCSDUI` | SwiftUI renderer with Wealth, FX, Deposit, KYC, Tealium, HIVE tokens, and inline video fixes. |
| Android | `android-sdui/app/src/main/java/com/hsbc/sdui` | Jetpack Compose renderer with Wealth, FX, Deposit, KYC, Tealium, HIVE tokens, locale helpers. |
| HarmonyOS NEXT | `harmonynext-sdui` | ArkTS/ArkUI renderer with SensorData analytics and platform-specific SDUI constraints. |

### Intelligence and Design System

- `dap-python`: AEO probe, CPS scoring, feedback, app-store review harvesting, survey ingestion, archive lifecycle.
- `hive-tokens`: W3C design token source emitted to CSS, Swift, and Kotlin.

---

## Implemented Home Hub Slice Contract

The canonical `home-wealth-hk` page uses this 9-slice order:

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

---

## License

Internal - Confidential  
Copyright 2026 The Hongkong and Shanghai Banking Corporation Limited
