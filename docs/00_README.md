# HSBC Digital Sales Promotion Platform — Ecosystem Architecture

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
│   └── 12_local_dev_environment.md  # Local development with mock-BFF
│
├── mock-bff/                    # Node.js/Express — Local Dev BFF Simulator
│   └── server.js                # Single-file mock; replaces bff-java locally
│                                #   Zone 1 (public): KYC, SDUI screens, search, events
│                                #   Zone 2 (internal): UCP CMS CRUD, workflow, audit log
│                                #   Port: 4000
│
├── ocdp-console/                # React + TypeScript — OCDP Staff CMS Console
│   └── src/
│       ├── App.tsx              # Navigation router (pages, journeys, pending, audit…)
│       ├── types/ocdp.ts        # Full type model: SliceType, PageLayout, WorkflowEntry
│       ├── store/OCDPStore.tsx  # Global state
│       └── panels/              # PageLibraryPanel, JourneyBuilderPanel, PendingPanel…
│                                #   Proxies /ucp-api → :3001/api via Vite dev server
│                                #   Port: 3002
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
│       ├── pages/               # WealthHubPage, KYCDemoPage, FXViewpointPage
│       ├── types/               # JSON schema TypeScript types
│       ├── hooks/               # SDUI data fetching hooks
│       └── analytics/           # TealiumClient auto-instrumentation
│
├── ios-sdui/                    # Swift 5.9 / SwiftUI — iOS SDUI Renderer
│   └── HSBCKyc/
│       ├── SDUI/Engine/         # KYCSDUIStepRouter, ComponentRegistry
│       ├── KYC/                 # KYCShellViews, KYCStepViews (11 KYC steps)
│       ├── Wealth/              # WealthPageView
│       ├── FXViewpoint/         # FXViewpointView
│       ├── DesignSystem/        # HiveTokens.swift
│       └── Analytics/           # TealiumClient.swift
│
├── android-sdui/                # Kotlin / Jetpack Compose — Android SDUI Renderer
│   └── app/src/main/java/com/hsbc/sdui/
│       ├── engine/              # SDUIComponentRegistry, Composable dispatch
│       ├── kyc/                 # KYCStepRouter, KYCShellViews
│       ├── wealth/              # WealthPageScreen
│       └── fxviewpoint/         # FXViewpointScreen
│
├── harmonynext-sdui/            # ArkTS / ArkUI — HarmonyOS NEXT SDUI Renderer
│   └── entry/src/main/ets/
│       ├── pages/Index.ets      # Tab bar entry: Home Hub, FX Viewpoint, OBKYC
│       ├── kyc/                 # KYCShellViews.ets, KYCStepViews.ets
│       ├── wealth/              # WealthPage.ets, AISearchPage.ets
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
| mock-BFF | Node.js local dev simulator for bff-java; all state in-memory; port 4000 |
| UCP Console | Staff content asset management & component registry UI; port 3001 |
| OCDP Console | Staff CMS for authoring, reviewing & publishing SDUI pages; port 3002 |
| Java BFF | Production SDUI JSON composition, personalisation, A/B routing |
| SDUI Clients | Web / iOS / Android / HarmonyOS NEXT render UI purely from server JSON |
| HIVE Tokens | Single design token source-of-truth emitted to CSS / Swift / Kotlin / ArkTS |
| DAP | Aggregates all feedback signals into content performance scores |
| AEO Monitor | Tracks HSBC citation share in ChatGPT, Perplexity, Google AI |
| Feedback Loop | Pushes actionable recommendations back into CMS editors |

## Quick Start

For local development see `docs/12_local_dev_environment.md`.
Tech leads: start with `docs/01_system_overview.md`.
