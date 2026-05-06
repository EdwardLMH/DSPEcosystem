# miPaaS — Mobile Intelligence Platform as a Service

**Document Version:** 1.0
**Date:** 2026-05-06
**Scope:** miPaaS Platform Architecture — App Intelligence, Plugin & Journey Governance, Registry & Support Management
**Classification:** Internal — Confidential

---

## Table of Contents

1. [Overview](#1-overview)
2. [Platform Context Diagram](#2-platform-context-diagram)
3. [Capability Domains](#3-capability-domains)
4. [PlatformHub — Mobile Native App Architecture](#4-platformhub--mobile-native-app-architecture)
5. [miPaaS ↔ PlatformHub Integration](#5-mipaaS--platformhub-integration)
6. [miPaaS ↔ DAP Integration](#6-mipaaS--dap-integration)
7. [Data Model](#7-data-model)
8. [API Specification](#8-api-specification)
9. [Persona & Access Model](#9-persona--access-model)
10. [Technology Stack](#10-technology-stack)

---

## 1. Overview

**miPaaS (Mobile Intelligence PaaS)** is the operational intelligence and governance layer for HSBC mobile apps. It provides business and IT users with a unified control surface to monitor app performance, manage the plugin and journey lifecycle within mobile apps, and maintain internal system registration and support member information.

miPaaS is the operational complement to **DAP** (data ingestion and raw analytics) and **UCP/OCDP** (content authoring). Where DAP produces raw signals and where UCP/OCDP manages content, miPaaS surfaces curated operational intelligence and provides governance controls — specifically for the mobile channel.

### Key Differentiators

| Platform | Primary Audience | Primary Concern |
|----------|-----------------|-----------------|
| UCP / OCDP | Content editors, marketing | Authoring and publishing content |
| DAP | Data engineers, analysts | Signal ingestion and performance scoring |
| **miPaaS** | **Business operators, IT / platform engineers** | **Mobile app operations, plugin governance, support management** |

---

## 2. Platform Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        HSBC Digital Sales Promotion Platform (DSPP)                  │
│                                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  UCP / OCDP     │  │   Java BFF       │  │  DAP         │  │  miPaaS          │  │
│  │  Consoles       │◄─►  (SDUI Engine +  │◄─►  Analytics + │◄─►  Mobile          │  │
│  │  (Content CMS)  │  │  Personalisation)│  │  Scoring     │  │  Intelligence    │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │  PaaS            │  │
│                                  │                              └──────────────────┘  │
│                         SDUI JSON screens                               │              │
│                                  │                              Plugin / Journey       │
│                                  ▼                              controls               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                   PlatformHub — Mobile Native Apps                               │ │
│  │                                                                                   │ │
│  │  Redux Store   Data-Driven Design   Plugin Registry   Journey Engine             │ │
│  │                                                                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐   │ │
│  │  │ iOS App  │  │ Android  │  │ HarmonyOS    │  │  Journey: OBKYC / Wealth  │   │ │
│  │  │ SwiftUI  │  │ Compose  │  │ NEXT ArkUI   │  │  Plugins: KYC / FX / ...  │   │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  └───────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                  │                                                     │
│                    DAP events: MAU/DAU, journey funnel,                               │
│                    download stats, app store reviews                                  │
│                                  │                                                     │
│                                  ▼                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐    │
│  │                      DAP — Digital Analytics Platform                         │    │
│  │  Behavioral Events · App Store Feedback · Surveys · AEO Probe                │    │
│  │  GCP BigQuery (Overseas) · SensorData (China) · Content Scoring Engine       │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Capability Domains

miPaaS is structured into three tightly coupled capability domains:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          miPaaS — Three Capability Domains                   │
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │  Domain 1            │  │  Domain 2            │  │  Domain 3        │  │
│  │  App Intelligence    │  │  Plugin & Journey    │  │  Registry &      │  │
│  │                      │  │  Governance          │  │  Support         │  │
│  │  Sourced from DAP:   │  │                      │  │                  │  │
│  │  • MAU / DAU trends  │  │  • Plugin catalog    │  │  • App system    │  │
│  │  • Download stats    │  │  • Plugin enable /   │  │    registration  │  │
│  │  • App store reviews │  │    disable per mkt   │  │  • Internal IT   │  │
│  │  • Customer NPS/CSAT │  │  • Journey config    │  │    system codes  │  │
│  │  • User behaviour    │  │  • Version & rollout │  │  • Support team  │  │
│  │  • Journey funnel:   │  │    control           │  │    membership    │  │
│  │    conversion rate   │  │  • A/B config link   │  │  • On-call       │  │
│  │    # of accesses     │  │  • Market targeting  │  │    rotation      │  │
│  │    step drop-offs    │  │                      │  │  • SLA tiers     │  │
│  │                      │  │  Operates on:        │  │  • Escalation    │  │
│  │  Read-only for       │  │  PlatformHub plugin  │  │    paths         │  │
│  │  business users      │  │  manifest + BFF      │  │                  │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     miPaaS API Gateway (port 4001)                     │  │
│  │  REST + WebSocket  ·  AD/SSO auth  ·  RBAC (Biz / IT / Platform Admin)│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
            │                         │                         │
   ┌────────▼──────┐       ┌──────────▼──────┐      ┌─────────▼──────────┐
   │  DAP APIs      │       │  PlatformHub    │      │  HSBC AD / LDAP    │
   │  BigQuery      │       │  Plugin Manifest│      │  Team membership   │
   │  App Store     │       │  BFF journey    │      │  Auth / RBAC       │
   │  Survey data   │       │  config APIs    │      │                    │
   └───────────────┘       └────────────────┘      └────────────────────┘
```

### 3.1 Domain 1 — App Intelligence

Provides curated, ops-oriented views over DAP signals. Business users get actionable dashboards without access to raw data infrastructure.

| View | Key Metrics | Granularity | Source |
|------|-------------|-------------|--------|
| App Overview | MAU, DAU, DAU/MAU ratio, installs, uninstalls, app store rating | Daily / Weekly / Monthly | DAP BigQuery + AppFollow |
| Download Statistics | New installs by platform, market, version; organic vs paid source | Daily trend | DAP + App Store Connect API |
| User Behaviour | Session length, screens per session, retention D1/D7/D30 | Cohort | DAP clickstream_events |
| Journey Analytics | Per-journey access count, conversion rate, median time-to-complete, step drop-off heatmap | Journey level | DAP journey_events |
| Customer Feedback | App store reviews (sentiment, topic), in-app NPS score trend, CSAT by journey | Rolling 30/90d | DAP app_store_feedback + surveys |
| Anomaly Alerts | Real-time feed: crash rate spike, rating drop, CTR drop, journey abandonment surge | Near real-time | DAP alert service |

### 3.2 Domain 2 — Plugin & Journey Governance

The Plugin Registry is the authoritative record of every functional module (plugin) and SDUI journey deployed within the mobile apps. miPaaS provides lifecycle management for these — complementary to UCP/OCDP which manages content within journeys.

```
Plugin Registry Record
─────────────────────
plugin_id:       "kyc-obkyc-journey"
display_name:    "Open Banking KYC Journey"
plugin_type:     JOURNEY | FEATURE | WIDGET | UTILITY
status:          ENABLED | DISABLED | BETA | DEPRECATED
version:         "2.3.1"
previous_version:"2.2.0"
markets:         [HK, SG, UK]
platforms:       [iOS, Android, HarmonyNext]
min_app_version: "6.0.0"
max_app_version: null   ← null = no upper bound
owner_team:      "KYC Platform"
sdui_journey_id: "obkyc-journey"   ← links to BFF journey config
ab_experiment_id: null             ← links to active A/B experiment if any
feature_flag:    "ff-obkyc-v2"     ← LaunchDarkly flag ID
last_updated:    "2026-05-01T10:00:00Z"
updated_by:      "alice.wong@hsbc.com"
```

**Governance capabilities:**
- Enable / disable a plugin per market without an app store release
- Promote a plugin from BETA → ENABLED across selected markets
- Trigger rollback to previous version (coordinated with BFF feature flag)
- View per-plugin DAP metrics inline (conversion rate, # accesses, drop-off step)
- Link plugin to its A/B experiment for A/B config management
- Audit log of all state transitions (who changed what, when, justification)

### 3.3 Domain 3 — App System Registration & Support

Internal IT governance record and support team management for every mobile app.

```
App Registry Record
───────────────────
app_id:               "hsbc-hk-mobile"
display_name:         "HSBC HK Mobile Banking"
platforms:
  ios:
    bundle_id:        "com.hsbc.hk"
    app_store_id:     "391256479"
    current_version:  "10.4.1"
  android:
    package_name:     "hk.com.hsbc.hsbchkmobilebanking"
    play_store_id:    "hk.com.hsbc..."
    current_version:  "10.4.1"
  harmonynext:
    app_id:           "com.hsbc.hk.harmonynext"
    current_version:  "10.4.1"
markets:              [HK]
business_owner:       "Retail Digital, HK"
business_owner_email: "retail-digital-hk@hsbc.com"
tech_owner_team:      "Mobile Platform Squad"
it_system_code:       "APP-HK-MOB-001"   ← ITSM system registration code
cmdb_ci_id:           "CI-0039221"       ← ServiceNow CMDB CI reference
data_classification:  CONFIDENTIAL
sla_tier:             P1
platformhub_config:   "platformhub/hsbc-hk-mobile/config.json"  ← PlatformHub config path

support_members:
  primary:
    name:    "Edward Chan"
    email:   "edward.chan@hsbc.com"
    role:    PLATFORM_ENGINEER
    oncall:  true   ← current on-call rotation
  secondary:
    name:    "Alice Wong"
    email:   "alice.wong@hsbc.com"
    role:    PLATFORM_ENGINEER
    oncall:  false
  escalation:
    name:    "Mobile Platform Director"
    email:   "mobile-platform-director@hsbc.com"
    role:    DIRECTOR

oncall_rotation:
  schedule:   WEEKLY   ← rotates every Monday 09:00 HKT
  current:    "Edward Chan"
  next:       "Alice Wong"

sla:
  p1_response_minutes:   15
  p2_response_minutes:   60
  p3_response_minutes:   240
  breach_notify:         ["edward.chan@hsbc.com", "mobile-platform-director@hsbc.com"]
```

---

## 4. PlatformHub — Mobile Native App Architecture

The HSBC mobile native apps follow the **PlatformHub** architecture pattern: a Redux-driven, data-first design that standardises how state, plugins, and journeys are managed across iOS (SwiftUI), Android (Compose), and HarmonyOS NEXT (ArkUI).

### 4.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Redux State Management** | All app state flows through a single Redux store. UI components are pure renderers — no business logic, no direct network calls. Actions flow down; state flows up. |
| **Data-Driven Design** | App behaviour is driven by server-delivered configuration (SDUI JSON + plugin manifests). The app binary ships capability; the server ships intent. |
| **Plugin Architecture** | Discrete functional modules (plugins) are registered in the PlatformHub plugin registry at runtime. Each plugin declares its capabilities, routes, and dependencies. |
| **Journey Engine** | Multi-step journeys (KYC, onboarding, product application) are orchestrated by the Journey Engine, which reads journey definitions from the BFF and maintains step state in the Redux store. |
| **Separation of Concerns** | Plugin code is isolated. A plugin cannot access another plugin's state directly — only through Redux-dispatched actions and shared selectors. |

### 4.2 PlatformHub Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     PlatformHub — Mobile App Architecture                        │
│                                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         Redux Store (Single Source of Truth)               │  │
│  │                                                                             │  │
│  │  appState:           { user, session, segment, locale, platform }          │  │
│  │  pluginRegistry:     { pluginId → { status, version, config } }            │  │
│  │  journeyState:       { journeyId → { currentStep, answers, progress } }   │  │
│  │  sdui:               { screenId → { payload, ttl, fetchedAt } }           │  │
│  │  analytics:          { eventQueue, pendingEvents[] }                       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│           ▲  dispatch(Action)                         select(Selector)  ▼        │
│                                                                                   │
│  ┌──────────────────────────────┐   ┌──────────────────────────────────────┐   │
│  │  Plugin Registry             │   │  SDUI Renderer                        │   │
│  │                              │   │                                        │   │
│  │  PlatformHub Plugin Manifest │   │  Receives SDUI JSON from BFF          │   │
│  │  ┌────────────┐              │   │  Dispatches: SDUI_SCREEN_LOADED        │   │
│  │  │ kyc-plugin │ ENABLED      │   │  Components read from Redux store      │   │
│  │  │ fx-plugin  │ ENABLED      │   │  Actions dispatch to Redux             │   │
│  │  │ wealth-plug│ ENABLED      │   │  Analytics events queued in Redux      │   │
│  │  │ mortgage   │ DISABLED     │   │                                        │   │
│  │  └────────────┘              │   └──────────────────────────────────────┘   │
│  │                              │                                                │
│  │  Loaded at app start from    │   ┌──────────────────────────────────────┐   │
│  │  miPaaS Plugin Manifest API  │   │  Journey Engine                       │   │
│  └──────────────────────────────┘   │                                        │   │
│                                     │  Journey definition from BFF           │   │
│  ┌──────────────────────────────┐   │  Steps: 10-step OBKYC / Wealth tabs   │   │
│  │  Data Layer                  │   │  State in Redux journeyState           │   │
│  │                              │   │  Branching: SHOW/HIDE step per answer  │   │
│  │  NetworkService:             │   │  Answer persistence: Redux + Keychain  │   │
│  │   BFF: GET /screen/{id}      │   │  Completion → conversion event → DAP  │   │
│  │   BFF: Journey step APIs     │   └──────────────────────────────────────┘   │
│  │   miPaaS: Plugin manifest    │                                                │
│  │   DAP: POST /events          │   ┌──────────────────────────────────────┐   │
│  │                              │   │  Analytics Middleware (Redux)          │   │
│  │  Dispatches:                 │   │                                        │   │
│  │   FETCH_SCREEN_SUCCESS       │   │  Intercepts every action               │   │
│  │   FETCH_SCREEN_FAILURE       │   │  Maps to DAP event schema              │   │
│  │   PLUGIN_STATE_UPDATED       │   │  Queues events in Redux store          │   │
│  │   JOURNEY_STEP_ANSWERED      │   │  Batches + flushes every 5s           │   │
│  └──────────────────────────────┘   └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Redux Store Shape (TypeScript)

```typescript
interface PlatformHubStore {
  app: {
    user: UserProfile | null;
    session: SessionState;
    segment: Segment;           // PREMIER | JADE | MASS_RETAIL | ADVANCE | BUSINESS
    locale: string;             // "en-HK" | "zh-HK" | ...
    platform: Platform;         // ios | android | harmonynext
    networkStatus: "online" | "offline";
  };
  plugins: {
    manifest: Record<string, PluginConfig>;   // from miPaaS Plugin Manifest API
    status: "loading" | "ready" | "error";
  };
  sdui: {
    screens: Record<string, SDUIScreenCache>; // screenId → { payload, ttl, fetchedAt }
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;
  };
  journeys: {
    active: Record<string, JourneyState>;     // journeyId → step state
  };
  analytics: {
    eventQueue: DAPEvent[];
    flushingInProgress: boolean;
  };
}

interface PluginConfig {
  pluginId: string;
  status: "ENABLED" | "DISABLED" | "BETA";
  version: string;
  config: Record<string, unknown>;   // plugin-specific runtime config from miPaaS
}

interface JourneyState {
  journeyId: string;
  currentStep: string;
  completedSteps: string[];
  answers: Record<string, unknown>;
  startedAt: string;
  lastActiveAt: string;
}
```

### 4.4 Plugin Manifest Bootstrap

At app launch, PlatformHub fetches the Plugin Manifest from the miPaaS API to configure which plugins are active:

```
App Start
   │
   ├── 1. Fetch plugin manifest from miPaaS:
   │        GET /api/v1/apps/{appId}/plugin-manifest
   │        Response: { plugins: [ { pluginId, status, version, config } ] }
   │
   ├── 2. Dispatch PLUGIN_MANIFEST_LOADED → Redux plugins.manifest
   │
   ├── 3. For each ENABLED plugin: initialise plugin in plugin registry
   │        (registers routes, reducers, action handlers)
   │
   ├── 4. For each DISABLED plugin: unregister or skip entirely
   │        (journey routes not mounted; no UI surface)
   │
   └── 5. PlatformHub ready → fetch initial SDUI screens
```

---

## 5. miPaaS ↔ PlatformHub Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    miPaaS ↔ PlatformHub Integration Flows                    │
│                                                                               │
│  miPaaS (IT Operator disables "mortgage-calc" plugin for SG market)          │
│       │                                                                       │
│       │  1. IT Operator updates plugin status via miPaaS console             │
│       │     PATCH /api/v1/plugins/mortgage-calc                              │
│       │     { status: "DISABLED", markets: ["SG"] }                          │
│       │                                                                       │
│       │  2. miPaaS writes to Plugin Registry DB                              │
│       │                                                                       │
│       │  3. miPaaS fires webhook to BFF:                                     │
│       │     POST /internal/plugin/update                                      │
│       │     { pluginId: "mortgage-calc", market: "SG", status: "DISABLED" } │
│       │                                                                       │
│       │  4. BFF updates LaunchDarkly feature flag:                           │
│       │     ff-mortgage-calc → OFF for market=SG                             │
│       │                                                                       │
│       │  5. BFF flushes Redis cache keys for affected screens in SG           │
│       │                                                                       │
│       │  6. Next app launch in SG: plugin manifest returns                   │
│       │     mortgage-calc: DISABLED                                           │
│       │                                                                       │
│       │  7. PlatformHub Redux: PLUGIN_MANIFEST_LOADED                        │
│       │     mortgage-calc route not mounted; feature invisible to user       │
│       │                                                                       │
│  Result: plugin disabled in SG without any app store update                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Integration | Direction | Protocol | Auth |
|-------------|-----------|----------|------|
| Plugin Manifest API | miPaaS → PlatformHub (mobile app) | REST HTTPS `GET /api/v1/apps/{appId}/plugin-manifest` | OAuth 2.0 Bearer (app session token) |
| Plugin State Webhook | miPaaS → BFF | REST HTTPS `POST /internal/plugin/update` | HMAC-SHA256 signed |
| Journey Config | BFF → PlatformHub | Embedded in SDUI JSON response | SDUI schema v2.3+ |
| Plugin Analytics | PlatformHub → DAP → miPaaS | DAP event pipeline → miPaaS reads from DAP BigQuery API | Service account |

---

## 6. miPaaS ↔ DAP Integration

miPaaS does not ingest raw events directly — it consumes curated outputs from the DAP analytics pipeline.

```
DAP (data producer)                          miPaaS (data consumer)
──────────────────                          ──────────────────────
BigQuery: dap.clickstream_events   ─────►  App Intelligence: MAU / DAU
BigQuery: dap.journey_events       ─────►  Journey Analytics: conversion rate,
                                            # accesses, step drop-off
BigQuery: dap.app_store_feedback   ─────►  Customer Feedback: sentiment trend
BigQuery: dap.survey_responses     ─────►  Customer Feedback: NPS / CSAT
DAP Alert Service (Pub/Sub)        ─────►  Anomaly Alerts: real-time feed
App Store Connect API (via DAP)    ─────►  Download Statistics
```

**Consumption pattern:** miPaaS exposes a `/api/v1/intelligence/*` API set backed by a BigQuery read-only service account. Data is materialised into a miPaaS read cache (Redis, 5-minute TTL) for dashboard serving. Raw BigQuery queries are never exposed to the miPaaS frontend directly.

---

## 7. Data Model

### 7.1 Plugin Registry

```sql
CREATE TABLE mipaaS.plugins (
    plugin_id          VARCHAR(128) PRIMARY KEY,
    display_name       VARCHAR(255) NOT NULL,
    plugin_type        VARCHAR(32) NOT NULL,       -- JOURNEY | FEATURE | WIDGET | UTILITY
    current_version    VARCHAR(32) NOT NULL,
    previous_version   VARCHAR(32),
    owner_team         VARCHAR(128) NOT NULL,
    sdui_journey_id    VARCHAR(128),               -- FK to BFF journey registry
    ab_experiment_id   VARCHAR(128),               -- LaunchDarkly / Optimizely ref
    feature_flag_id    VARCHAR(128),               -- LaunchDarkly flag ID
    platformhub_module VARCHAR(128),               -- PlatformHub module identifier
    created_at         TIMESTAMP NOT NULL,
    updated_at         TIMESTAMP NOT NULL,
    updated_by         VARCHAR(255) NOT NULL
);

CREATE TABLE mipaaS.plugin_market_config (
    plugin_id  VARCHAR(128) REFERENCES mipaaS.plugins(plugin_id),
    market     VARCHAR(8) NOT NULL,               -- HK | SG | UK | US | CN
    status     VARCHAR(16) NOT NULL,               -- ENABLED | DISABLED | BETA | DEPRECATED
    platforms  VARCHAR[]  NOT NULL,                -- {ios, android, harmonynext}
    min_app_version VARCHAR(32),
    max_app_version VARCHAR(32),
    updated_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (plugin_id, market)
);

CREATE TABLE mipaaS.plugin_audit_log (
    id           SERIAL PRIMARY KEY,
    plugin_id    VARCHAR(128) NOT NULL,
    market       VARCHAR(8),
    action       VARCHAR(64) NOT NULL,             -- ENABLED | DISABLED | VERSION_UPDATED | ...
    old_value    JSONB,
    new_value    JSONB,
    justification TEXT,
    actor        VARCHAR(255) NOT NULL,
    actor_ip     INET,
    logged_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 7.2 App Registry

```sql
CREATE TABLE mipaaS.apps (
    app_id               VARCHAR(128) PRIMARY KEY,
    display_name         VARCHAR(255) NOT NULL,
    market               VARCHAR(8)   NOT NULL,
    it_system_code       VARCHAR(64)  NOT NULL,     -- ITSM registration code
    cmdb_ci_id           VARCHAR(64),               -- ServiceNow CMDB CI
    business_owner       VARCHAR(255) NOT NULL,
    business_owner_email VARCHAR(255) NOT NULL,
    tech_owner_team      VARCHAR(128) NOT NULL,
    data_classification  VARCHAR(32)  NOT NULL,     -- PUBLIC | INTERNAL | CONFIDENTIAL | SECRET
    sla_tier             VARCHAR(4)   NOT NULL,     -- P1 | P2 | P3
    platformhub_config   VARCHAR(512),              -- path to PlatformHub config
    created_at           TIMESTAMP    NOT NULL,
    updated_at           TIMESTAMP    NOT NULL
);

CREATE TABLE mipaaS.support_members (
    id          SERIAL PRIMARY KEY,
    app_id      VARCHAR(128) REFERENCES mipaaS.apps(app_id),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    ad_group    VARCHAR(255),                        -- HSBC AD group
    role        VARCHAR(32)  NOT NULL,               -- PLATFORM_ENGINEER | DIRECTOR | PRODUCT_OWNER
    is_oncall   BOOLEAN      NOT NULL DEFAULT FALSE,
    oncall_from TIMESTAMP,
    oncall_to   TIMESTAMP,
    skill_tags  VARCHAR[]                            -- {ios, android, harmonynext, backend}
);
```

---

## 8. API Specification

### 8.1 Intelligence APIs

```
GET  /api/v1/intelligence/apps/{appId}/overview
     Returns: MAU, DAU, DAU/MAU ratio, installs, app store rating (30/60/90d)

GET  /api/v1/intelligence/apps/{appId}/journeys
     Returns: per-journey { journeyId, accessCount, conversionRate, medianTimeMs, dropOffStep }

GET  /api/v1/intelligence/apps/{appId}/feedback
     Returns: { npsScore, csatScore, appStoreRating, sentimentBreakdown, topTopics }

GET  /api/v1/intelligence/apps/{appId}/alerts
     Returns: real-time anomaly alerts stream (WebSocket upgrade supported)
```

### 8.2 Plugin Governance APIs

```
GET    /api/v1/plugins                              List all plugins (filterable by market, status)
GET    /api/v1/plugins/{pluginId}                   Get plugin detail + per-market status
PATCH  /api/v1/plugins/{pluginId}                   Update plugin status / version
GET    /api/v1/apps/{appId}/plugin-manifest         PlatformHub bootstrap call
       Returns: { plugins: [ { pluginId, status, version, config } ] }
GET    /api/v1/plugins/{pluginId}/audit-log         Full audit history
GET    /api/v1/plugins/{pluginId}/analytics         DAP metrics for this plugin's journey
```

### 8.3 Registry & Support APIs

```
GET    /api/v1/apps                                 List registered apps
GET    /api/v1/apps/{appId}                         App registry detail
PUT    /api/v1/apps/{appId}                         Update app registration
GET    /api/v1/apps/{appId}/support-members         List support members + on-call status
POST   /api/v1/apps/{appId}/support-members         Add support member
PATCH  /api/v1/apps/{appId}/support-members/{id}    Update role / on-call / skills
DELETE /api/v1/apps/{appId}/support-members/{id}    Remove support member
GET    /api/v1/apps/{appId}/oncall-rotation         Current + upcoming on-call schedule
POST   /api/v1/apps/{appId}/oncall-rotation/swap    Swap on-call rotation slots
```

---

## 9. Persona & Access Model

| Persona | Domain 1 Intelligence | Domain 2 Plugins | Domain 3 Registry |
|---------|----------------------|------------------|-------------------|
| **Business User** | Read-only dashboards | View plugin list only | View app info only |
| **IT Operator** | Read-only dashboards | Enable/disable plugins; view audit log | View + edit support members |
| **App Owner** | Full read access | Enable/disable + version config | Full CRUD for their app(s) |
| **Platform Admin** | Cross-app read | All plugin governance + audit | All registry + SLA config |

Access enforced via HSBC AD group membership mapped to miPaaS roles at the API gateway.

---

## 10. Technology Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| miPaaS API | Node.js / Express (mock: port 4001) | Mirrors mock-BFF pattern; Spring Boot for production |
| miPaaS Console | React 18 + TypeScript 5 + Vite (port 3003) | Same HIVE token design system as UCP / OCDP |
| Plugin Registry DB | PostgreSQL 16 | Immutable audit log per plugin state change |
| App Registry DB | PostgreSQL 16 | Shared DB instance with Plugin Registry |
| Intelligence Cache | Redis 7 (TTL 5 min) | Materialises DAP BigQuery results for dashboard serving |
| DAP Read Access | BigQuery read-only service account | Queries `dap.clickstream_events`, `dap.journey_events`, `dap.app_store_feedback` |
| PlatformHub (iOS) | Swift 5.9, SwiftUI, TCA (The Composable Architecture) / Redux pattern, Combine | Plugin registry + journey engine as TCA reducers |
| PlatformHub (Android) | Kotlin, Jetpack Compose, Redux via MVI (Orbit / MVI Kotlin), Coroutines | Plugin registry + journey engine as MVI reducers |
| PlatformHub (HarmonyNext) | ArkTS, ArkUI, custom Redux-style StateManager | Plugin registry + journey engine in ArkTS state |
| Auth | HSBC OAuth 2.0 / AD SSO | Shared with UCP / OCDP |
| Observability | OpenTelemetry → Datadog | Consistent with platform standard |
