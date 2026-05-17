# HSBC Digital Sales Promotion Ecosystem — Ecosystem Architecture

## Repository Structure

```
DSPEcosystem/
├── docs/                        # Architecture & design documents
│   ├── 00_README.md             # This file
│   ├── 01_system_overview.md    # Full ecosystem architecture
│   ├── 02_sdui_architecture.md  # Server Driven UI deep design
│   ├── 03_dap_architecture.md   # Digital Analytics Platform design
│   ├── 04_aeo_seo_strategy.md   # AEO / LLM visibility + SEO strategy
│   ├── 05_user_stories.md       # Epic & user story backlog
│   ├── 06_cms_maker_checker.md  # CMS approval workflow & Maker-Checker
│   ├── 07_sdui_preview_workflow.md  # SDUI preview & on-device approval
│   ├── 08_content_repository.md # Content versioning & legal hold
│   ├── 09_openbanking_kyc_sdui.md   # KYC SDUI orchestration design
│   ├── 10_hive_design_tokens.md # HIVE design token system
│   ├── 11_ad_rbac_design.md     # AD group RBAC & biz line authorisation
│   ├── 12_local_dev_environment.md  # Local development with mock-BFF
│   ├── 13_promo_video_script.md # Demo / promo video script
│   └── 14_mipaaS_architecture.md # Mobile Intelligence PaaS architecture
│
├── mock-bff/                    # Node.js/Express — Local Dev BFF Simulator
│   └── server.js                # Single-file mock; replaces bff-java locally
│                                #   Zone 1 (public): KYC, SDUI screens, search, events
│                                #   Zone 2 (internal): UCP CMS CRUD, workflow, audit log
│                                #   Port: 4000
│
├── ocdp-console/                # React + TypeScript — OCDP Staff CMS Console
│   └── src/
│       ├── App.tsx              # Navigation router (pages, journeys, AEO, AI Search, audit…)
│       ├── types/ocdp.ts        # Full type model: SliceType, PageLayout, WorkflowEntry
│       ├── store/OCDPStore.tsx  # Global state
│       └── components/          # PageLibraryPanel, JourneyBuilderPanel, Admin panels…
│                                #   Proxies /ucp-api → :3001/api via Vite dev server
│                                #   Port: 5173 by Vite default
│
├── ucp-console/                 # React + TypeScript — UCP Content Platform Console
│   └── src/
│       ├── App.tsx              # Navigation router (content, components, history…)
│       ├── types/ucp.ts         # SliceType, ContentAsset, UIComponent, WorkflowEntry
│       └── utils/sliceDefinitions.ts  # Canonical 14-slice SLICE_DEFINITIONS registry
│                                #   Port: 3001
│
├── bff-java/                    # Java Spring Boot 3 / WebFlux — Production BFF
│   └── src/main/java/com/hsbc/dsp/
│       ├── sdui/                # SDUI Composition Engine + Controller
│       ├── kyc/                 # KYC Orchestrator, Platform Splitter, Controller
│       ├── personalisation/     # Segment + personalisation engine
│       ├── abtest/              # A/B test allocator (Optimizely)
│       ├── security/            # RBAC BizLineAccessGuard, ImmutableAuditLogger
│       └── analytics/           # Event forwarding
│
├── web-sdui/                    # React + TypeScript — Web SDUI Renderer
│   └── src/
│       ├── engine/              # SDUIRenderer, ComponentRegistry (24 components)
│       ├── components/          # HSBC component implementations
│       ├── pages/               # HomePage, KYCDemoPage, FXViewpointPage
│       ├── types/               # JSON schema TypeScript types
│       ├── hooks/               # SDUI data fetching hooks
│       └── analytics/           # TealiumClient auto-instrumentation
│
├── ios-sdui/                    # Swift 5.9 / SwiftUI — iOS SDUI Renderer
│   └── HSBCSDUI/
│       ├── KYCSDUIStepRouter.swift
│       ├── KYC/                 # KYCShellViews, KYCStepViews (11 KYC steps)
│       ├── Home/              # HomePageView
│       ├── FXViewpoint/         # FXViewpointView
│       ├── HiveTokens.swift
│       └── Analytics/           # TealiumClient.swift
│
├── android-sdui/                # Kotlin / Jetpack Compose — Android SDUI Renderer
│   └── app/src/main/java/com/hsbc/sdui/
│       ├── engine/              # SDUIComponentRegistry, Composable dispatch
│       ├── kyc/                 # KYCStepRouter, KYCShellViews
│       ├── home/                # HomePageScreen
│       └── fxviewpoint/         # FXViewpointScreen
│
├── harmonynext-sdui/            # ArkTS / ArkUI — HarmonyOS NEXT SDUI Renderer
│   └── entry/src/main/ets/
│       ├── pages/Index.ets      # Tab bar entry: Home Hub, FX Viewpoint, OBKYC
│       ├── kyc/                 # KYCShellViews.ets, KYCStepViews.ets
│       ├── home/                # HomePage.ets, AISearchPage.ets
│       ├── fxviewpoint/         # FXViewpointPage.ets
│       ├── network/             # KYCNetworkService.ets, SensorDataClient.ets
│       └── common/              # HiveTokens.ets
│
├── hive-tokens/                 # HIVE Design Language v2.1.0 — Design Token Source
│   ├── json/hive-tokens.json    # W3C design token format (source of truth)
│   ├── css/hive-tokens.css      # CSS custom properties (consumed by web-sdui)
│   ├── swift/HiveTokens.swift   # Consumed by ios-sdui
│   └── kotlin/HiveTokens.kt     # Consumed by android-sdui
│
└── dap-python/                  # Python — Digital Analytics Platform Workers
    ├── aeo_probe/               # LLM citation monitoring (ChatGPT + Perplexity daily)
    ├── content_scoring/         # Content Performance Score engine (every 6h)
    ├── feedback_loop/           # CMS notification + alert service
    ├── app_store/               # App store review harvesting + NLP
    ├── surveys/                 # Survey ingestion + mapping
    └── archive/                 # Data lifecycle / archival job
```

## System Context

| System | Purpose |
|--------|---------|
| mock-BFF | Node.js local dev simulator for bff-java, OCDP/UCP, and AEM APIs; AI Search corpus rebuild endpoint (`POST /api/v1/search/config/{id}/rebuild`); all state in-memory; port 4000 |
| UCP Console | Staff content asset management & component registry UI; multi-locale (i18n) authoring; WCAG 2.1 AA; port 3001 |
| OCDP Console | Staff CMS for authoring, reviewing & publishing SDUI pages; content sidebar browses content from both UCP and HSBC AEM; AI Search Admin panel (per-app corpus config, rebuild trigger); multi-locale (i18n) authoring; WCAG 2.1 AA; port 5173 by Vite default |
| HSBC AEM | Adobe Experience Manager — peer content provider to UCP; OCDP left sidebar queries AEM Content Delivery API alongside UCP; AEM URLs also usable as AI Search corpus content sources |
| Java BFF | Production SDUI JSON composition, personalisation, A/B routing; fetches from UCP or AEM per `contentRef.source`; serves `POST /api/v1/search` semantic search + `GET /api/v1/search/corpus` |
| SDUI Clients | Web / iOS / Android / HarmonyOS NEXT render UI from server JSON with static fallbacks; `AI_SEARCH_BAR` and `HOME_SEARCH_HEADER` slice types call the BFF search endpoint |
| HIVE Tokens | Single design token source-of-truth emitted to CSS / Swift / Kotlin / ArkTS; WCAG 2.1 AA compliant colour palette |
| DAP | Aggregates all feedback signals into content performance scores |
| AEO Monitor | Tracks HSBC citation share in ChatGPT, Perplexity, Google AI |
| Feedback Loop | Pushes actionable recommendations back into CMS editors |

## Implemented Screen Snapshot

| Screen | Route / ID | Implemented slice contract |
|--------|------------|----------------------------|
| Home Hub (HK) | `GET /api/v1/screen/home-hub-hk` | 9 slices: `HOME_SEARCH_HEADER`, `COMBO_QUICK_ACCESS`, `CARD_ACTIVATION_BANNER`, `QUEST_BANNER`, `FEATURE_PRODUCT`, `WEALTH_STUDIO_CAROUSEL`, `GUIDES_INSIGHTS_CAROUSEL`, `FX_WATCHLIST`, `DISCOVER_MORE_CAROUSEL` |
| FX Viewpoint | `GET /api/v1/screen/fx-viewpoint-hk` | `VIDEO_PLAYER`, `MARKET_BRIEFING_TEXT`, `CONTACT_RM_CTA` |
| OBKYC | `/api/v1/kyc/sessions/**` | Platform-split step plan with web compound steps and mobile-native steps |

## Quick Start

For local development see `docs/12_local_dev_environment.md`.
Tech leads: start with `docs/01_system_overview.md`.
