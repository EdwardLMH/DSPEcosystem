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
│   └── 05_user_stories.md       # Epic & user story backlog
│
├── bff-java/                    # Java Spring Boot — Backend for Frontend
│   └── src/main/java/com/hsbc/dsp/
│       ├── sdui/                # SDUI Composition Engine
│       ├── cms/                 # Stripes CMS API client
│       ├── personalisation/     # Segment + personalisation engine
│       ├── abtest/              # A/B test allocator
│       └── analytics/           # Event forwarding
│
├── web-sdui/                    # React + TypeScript — Web SDUI Renderer
│   └── src/
│       ├── engine/              # Core renderer + component registry
│       ├── components/          # HSBC component library
│       ├── types/               # JSON schema TypeScript types
│       ├── hooks/               # SDUI data fetching hooks
│       └── analytics/           # Auto-instrumentation
│
├── ios-sdui/                    # Swift — iOS SDUI Renderer
│   └── Sources/HSBC_SDUI/
│       ├── Engine/              # Core renderer, registry, validator
│       ├── Components/          # SwiftUI HSBC components
│       ├── Models/              # Codable schema models
│       └── Analytics/           # Analytics instrumentation
│
├── android-sdui/                # Kotlin — Android SDUI Renderer
│   └── src/main/java/com/hsbc/sdui/
│       ├── engine/              # Core renderer, registry, validator
│       ├── components/          # Composable HSBC components
│       ├── models/              # Data classes (schema models)
│       └── analytics/           # Analytics instrumentation
│
└── dap-python/                  # Python — Digital Analytics Platform
    ├── aeo_probe/               # LLM citation monitoring service
    ├── content_scoring/         # Content Performance Score engine
    ├── feedback_loop/           # CMS notification + alert service
    ├── app_store/               # App store review harvesting + NLP
    └── surveys/                 # Survey ingestion + mapping
```

## System Context

| System | Purpose |
|--------|---------|
| UCP (Stripes CMS) | Content authoring, journey builder, promotion rules |
| Java BFF | SDUI JSON composition, personalisation, A/B routing |
| SDUI Clients | Web/iOS/Android renders UI purely from server JSON |
| DAP | Aggregates all feedback signals into content performance scores |
| AEO Monitor | Tracks HSBC citation share in ChatGPT, Perplexity, Google AI |
| Feedback Loop | Pushes actionable recommendations back into CMS editors |

## Quick Start

See each module's own README for setup instructions.
Tech leads: start with `docs/01_system_overview.md`.
