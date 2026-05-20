# Server Driven UI (SDUI) Architecture

**Document Version:** 1.4  
**Date:** 2026-05-12  
**Scope:** UCP / AEM BFF + Web / iOS / Android / HarmonyOS NEXT SDUI Renderers + AI Search  

---

## 1. Overview and Motivation

### Why SDUI for HSBC?

Traditional mobile banking apps embed UI layouts and promotional content inside the app binary. Every change — a new banner, updated CTA copy, revised interest rate — requires a full development sprint, QA cycle, and app store submission (with Apple's review taking 1–3 days). For a bank running time-sensitive promotions (CNY campaigns, rate specials, regulatory notices), this is untenable.

Server Driven UI (SDUI) inverts this model: **the server owns the layout**. The app ships a library of reusable components (a Component Registry) and a rendering engine. The backend composes the entire screen — which components appear, in which order, with which content and styling — and sends it as a JSON payload at runtime. The client renders exactly what the server instructs.

| Capability | Without SDUI | With SDUI |
|-----------|-------------|-----------|
| Update promotion copy | 2-week sprint + app store review | CMS publish → live in < 60s |
| Personalise layout per segment | Hard-coded per segment in app | BFF composes per user at request time |
| A/B test new component layout | New app build per variant | Toggle in BFF A/B config |
| Regulatory copy change | Full release cycle | CMS update → approved → live |
| New market / locale | Code per market | Locale flag in JSON |
| Fix broken image on one platform | Hot fix release | CMS asset replacement → immediate |

### Operating Principles

SDUI is also an operational architecture, not only a rendering pattern:

| Principle | Runtime expectation |
|-----------|---------------------|
| Observable by default | Web, iOS, Android and HarmonyOS NEXT propagate W3C `traceparent` on SDUI, AI Search and journey calls so operators can correlate client startup, gateway, BFF, cache, search and database spans. |
| Performance as product quality | Cold start, warm start, Home fetch, JSON parse, component registry setup, render and Home interactive timings are measured as customer experience SLOs. |
| Highly available delivery | Clients use remote manifest, local cache/storage and bundled baseline fallback; the BFF can serve stale cached SDUI when upstream content providers are unavailable. |
| Release with confidence | Jenkins deploy/restart/site-switch markers are overlaid on observability dashboards so every runtime change can be connected to latency, error rate and synthetic-check outcomes. |

---

## 2. SDUI Lifecycle

```
  ┌─────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌───────────────────┐
  │  CMS Author │    │   BFF Composer   │    │  CDN / Cache │    │  Client Renderer  │
  └──────┬──────┘    └────────┬─────────┘    └──────┬───────┘    └─────────┬─────────┘
         │                    │                      │                      │
         │  1. Author &       │                      │                      │
         │  publish content   │                      │                      │
         │──────────────────► │                      │                      │
         │                    │  2. Webhook:         │                      │
         │                    │  flush cache keys    │                      │
         │                    │─────────────────────►│                      │
         │                    │                      │                      │
         │                    │                      │  3. App opens,       │
         │                    │                      │  GET /screen/home    │
         │                    │                      │◄─────────────────────│
         │                    │                      │                      │
         │                    │  4. Cache miss →     │                      │
         │                    │  forward to BFF      │                      │
         │                    │◄─────────────────────│                      │
         │                    │                      │                      │
         │  5. BFF fetches    │                      │                      │
         │  content from CMS  │                      │                      │
         │◄───────────────────│                      │                      │
         │                    │                      │                      │
         │  6. Enriches with  │                      │                      │
         │  segment + A/B     │                      │                      │
         │  + ML recs         │                      │                      │
         │                    │  7. Returns          │                      │
         │                    │  SDUI JSON           │                      │
         │                    │─────────────────────►│                      │
         │                    │                      │  8. Caches + serves  │
         │                    │                      │─────────────────────►│
         │                    │                      │                      │  9. Validates,
         │                    │                      │                      │  resolves,
         │                    │                      │                      │  renders,
         │                    │                      │                      │  fires analytics
```

---

## 3. BFF SDUI Composition Engine

### 3.1 Internal Architecture

```
  Incoming: GET /api/v1/screen/home
  Headers:  x-user-id, x-sdui-version: 2.3, x-platform: ios,
            x-locale: en-HK, x-segment: premier, x-ab-context: {...}

  ┌────────────────────────────────────────────────────────────────────┐
  │                  SDUI Composition Engine (Java)                     │
  │                                                                      │
  │  ┌─────────────────────────────────────────────────────────────┐   │
  │  │  Step 1: Screen Template Resolver                            │   │
  │  │  - Looks up: screen="home", platform="ios"                  │   │
  │  │  - Returns: template with named slots                        │   │
  │  │    e.g. [hero_slot, carousel_slot, action_slot, survey_slot] │   │
  │  └──────────────────────────────┬──────────────────────────────┘   │
  │                                  │                                   │
  │  ┌──────────────────────────────▼──────────────────────────────┐   │
  │  │  Step 2: Component Slot Resolver                             │   │
  │  │  - For each slot, queries Personalisation Engine:            │   │
  │  │    "Which component + content goes in hero_slot              │   │
  │  │     for segment=premier, locale=en-HK?"                      │   │
  │  │  - Applies eligibility rules from Stripes CMS                │   │
  │  │  - Calls A/B Allocator for slots with active experiments     │   │
  │  │  - Returns: {slot → componentType + contentId + variantId}   │   │
  │  └──────────────────────────────┬──────────────────────────────┘   │
  │                                  │                                   │
  │  ┌──────────────────────────────▼──────────────────────────────┐   │
  │  │  Step 3: Content Fetcher (parallel)                          │   │
  │  │  - Fetches resolved contentIds from content providers:       │   │
  │  │    • UCP (Stripes CMS API) — for UCP-sourced slice refs      │   │
  │  │    • HSBC AEM (Content Delivery API) — for AEM-sourced refs  │   │
  │  │    (or Redis L1 cache — hit rate target: 85%+)               │   │
  │  │  - contentRef.source ("UCP" | "AEM") determines which API    │   │
  │  │  - Fetches ML recommendations for {{dynamic:*}} slots        │   │
  │  │  - Fetches user profile data for personalised props          │   │
  │  └──────────────────────────────┬──────────────────────────────┘   │
  │                                  │                                   │
  │  ┌──────────────────────────────▼──────────────────────────────┐   │
  │  │  Step 4: Props Injector                                      │   │
  │  │  - Merges CMS content fields into component prop schema      │   │
  │  │  - Resolves {{dynamic:userName}}, {{dynamic:recommendations}}│   │
  │  │  - Injects analytics config (componentId, variantId, etc.)   │   │
  │  │  - Applies visibility rules per component                    │   │
  │  └──────────────────────────────┬──────────────────────────────┘   │
  │                                  │                                   │
  │  ┌──────────────────────────────▼──────────────────────────────┐   │
  │  │  Step 5: Version Negotiator                                  │   │
  │  │  - Client declared x-sdui-version: 2.3                       │   │
  │  │  - Server checks capability matrix for this version          │   │
  │  │  - Strips any props/components not supported in 2.3          │   │
  │  │  - Sets response header x-sdui-schema-version: 2.3           │   │
  │  └──────────────────────────────┬──────────────────────────────┘   │
  │                                  │                                   │
  │  ┌──────────────────────────────▼──────────────────────────────┐   │
  │  │  Step 6: JSON Serialiser + Sign                              │   │
  │  │  - Serialises ScreenPayload to JSON                          │   │
  │  │  - Adds integrity HMAC hash                                  │   │
  │  │  - Sets Cache-Control headers                                │   │
  │  │  - Emits trace span, records composition latency             │   │
  │  └─────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────────────────────┘
                                  │
                          SDUI JSON Response
```

### 3.2 Personalisation Engine Integration

```java
// Personalisation Engine interface (called by Slot Resolver)
public interface PersonalisationEngine {
    SlotResolution resolveSlot(SlotContext context);
}

// SlotContext carries user + request context
public record SlotContext(
    String userId,
    String segmentId,        // e.g. "premier", "jade", "mass_retail"
    String locale,
    String platform,
    String screenId,
    String slotId
) {}

// SlotResolution tells the composer what to put in the slot
public record SlotResolution(
    String componentType,    // e.g. "PromoBanner"
    String contentId,        // content ID in the resolved source
    ContentSource source,    // UCP | AEM
    Map<String, Object> additionalProps
) {}

enum ContentSource { UCP, AEM }
```

### 3.3 Dual Content Provider Routing

The BFF Content Fetcher reads `contentRef.source` from each resolved slot to determine which backend to call:

```
contentRef.source == "UCP"
  → GET {UCP_CMS_BASE}/api/content/{contentId}
  → Cached in Redis under key: "ucp:{contentId}:{locale}"

contentRef.source == "AEM"
  → GET {AEM_CD_API_BASE}/api/assets/{aemPath}
      (AEM Content Delivery API — REST/GraphQL, OAuth 2.0 client credentials)
  → Cached in Redis under key: "aem:{aemPath}:{locale}"
  → AEM asset URLs passed through as-is to SDUI JSON (no CDN rewrite)

Both resolve into the same ComponentNode.props shape —
the SDUI renderer is source-agnostic.
```

### 3.4 Locale / i18n Injection

The BFF injects locale-specific copy into each ComponentNode before serialisation:

```
x-locale: "zh-HK"

1. BFF resolves content from UCP or AEM for the default locale.
2. BFF looks up translations[locale][instanceId][propKey] from the
   CMS translation store for all TRANSLATABLE_PROP_KEYS
   (title, subtitle, ctaText, altText, description, body).
3. Translated values overwrite the default-locale props in the
   assembled ComponentNode.
4. If a translation key is missing for this locale, default-locale
   value is used (graceful fallback, no empty strings).
5. `dir: "rtl"` is injected into ContainerNode.props when locale is "ar".
```
```

### 3.5 AI Search — Semantic Search Slice and Corpus Pipeline

The `AI_SEARCH_BAR` and `HOME_SEARCH_HEADER` SDUI slice types deliver in-app semantic search on iOS, Android, HarmonyOS NEXT, and Web. The search corpus is operator-configured in the OCDP Admin console and served by the BFF search endpoint.

#### Agent-to-UI Adapter Path

The target architecture supports agent-generated interfaces without replacing the
governed SDUI renderer contract:

```
Agent / AI Search
  -> A2UI-like schema
  -> BFF validation and allow-list mapping
  -> canonical SDUI v2 JSON
  -> legacy-compatible SDUI JSON when required
  -> iOS / Android / HarmonyNext / Web renderers
```

The agent is allowed to describe intent, content, actions and suggested UI
components. The BFF remains the control point: it validates component types,
normalises actions, injects analytics/governance metadata, strips unsupported
fields and maps only approved components into SDUI.

Current mock BFF support:

| Capability | Endpoint / Switch | Output |
|------------|-------------------|--------|
| SDUI v2 schema contract | `GET /api/v2/sdui/schema` | Canonical v2 schema description |
| Existing screen, old renderer shape | `GET /api/v1/screen/deposit-campaign-cn` | Existing `layout.children` JSON |
| Existing screen, v2 shape | `GET /api/v1/screen/deposit-campaign-cn?schema=v2` or `x-sdui-schema: v2` | Canonical SDUI v2 |
| AI search, existing result list | `POST /api/v1/search` | Existing `{ results: [...] }` |
| AI search, A2UI-like shape | `POST /api/v1/search` with `{ "responseMode": "a2ui" }` | Agent UI proposal |
| AI search, SDUI v2 shape | `POST /api/v1/search` with `{ "responseMode": "sdui-v2" }` | Validated SDUI v2 |

This lets the current native/web apps keep working while new clients can opt in
to v2 screen delivery.

### 3.6 Canonical SDUI v2 Schema

SDUI v2 separates what a component says, does, measures and how it is governed.
This makes the schema easier for CMS, BFF, analytics and AI agents to share.

```json
{
  "schemaVersion": "2.0",
  "contract": "HSBC_SDUI_V2",
  "page": {
    "pageId": "deposit-campaign-cn",
    "pageName": "New Fund Deposit Campaign (CN)",
    "screen": "deposit_campaign",
    "market": "CN",
    "supportedLocales": ["zh-CN", "en"]
  },
  "runtime": {
    "locale": "zh-CN",
    "platform": "ios",
    "channel": "SDUI",
    "ttl": 300,
    "analytics": {
      "provider": "SensorsData",
      "events": [
        "sensorsdata_page_view",
        "sensorsdata_deposit_open_click",
        "sensorsdata_deposit_open_conversion"
      ]
    }
  },
  "layout": {
    "layoutType": "SCROLL",
    "slots": [
      { "slotId": "main", "role": "body", "children": ["dep-open-cta"] }
    ]
  },
  "components": [
    {
      "componentId": "dep-open-cta",
      "componentType": "DEPOSIT_OPEN_CTA",
      "content": { "label": "立即开立存款" },
      "action": {
        "type": "DEEPLINK",
        "url": "hsbc-cn://deposit/open?currency=CNY&campaign=new-fund",
        "fallback": {
          "ios": "https://apps.apple.com/cn/app/hsbc-china/id1467398731",
          "android": "https://www.hsbc.com.cn/mobile-banking/"
        }
      },
      "analytics": {
        "provider": "SensorsData",
        "events": ["deposit_open_click", "deposit_open_conversion"]
      },
      "appearance": {
        "backgroundColor": "#C41E3A",
        "textColor": "#FFFFFF"
      },
      "visibility": {
        "visible": true,
        "hiddenInOutput": false,
        "channels": ["SDUI", "WEB_STANDARD", "WEB_WECHAT"]
      },
      "governance": {
        "locked": false,
        "sourceSchemaVersion": "3.0",
        "sourceInstanceId": "dep-open-cta"
      }
    }
  ]
}
```

Migration rules:

1. Existing CMS pages remain authorable as today.
2. BFF transforms legacy `layout.children[]` or `slices[]` into SDUI v2.
3. Existing renderers receive a backward-compatible `layout.children[]`
   response until they opt in with `x-sdui-schema: v2`.
4. New agent flows map from A2UI-like proposals into SDUI v2 first, then
   downgrade to old JSON only if a renderer still needs it.
5. Production validation should enforce an allow-list of component types,
   action types, URL schemes, analytics providers and visibility channels.

Renderer adoption status in the mock project:

| Surface | A2UI support | SDUI v2 screen support |
|---------|--------------|------------------------|
| iOS SDUI | AI Search requests `responseMode: "a2ui"` and maps `QUICK_ACCESS_ENTRY` components to existing search rows | Existing screen renderer remains legacy-compatible |
| Android SDUI | AI Search requests `responseMode: "a2ui"` and maps `QUICK_ACCESS_ENTRY` components to existing search rows | Existing screen renderer remains legacy-compatible |
| HarmonyNext SDUI | AI Search requests `responseMode: "a2ui"` and maps `QUICK_ACCESS_ENTRY` components to existing search rows | Existing screen renderer remains legacy-compatible |
| Web SDUI | AI Search requests `responseMode: "a2ui"`; screen fetches request `x-sdui-schema: v2` and normalize to existing nodes | Enabled through edge normalizer |
| Web Standard | Uses the same web v2 normalizer, with `x-channel: WEB_STANDARD` | Enabled through edge normalizer and hidden JSON-LD output |
| WeChat Web | Uses the same web v2 normalizer, with `x-channel: WEB_WECHAT` | Enabled through edge normalizer |

This is intentionally an edge-adapter rollout. It gives all channels A2UI/v2
delivery now, while avoiding a risky rewrite of every native component registry
before production.

#### Slice Types

| Slice Type | Description | Key Props |
|------------|-------------|-----------|
| `AI_SEARCH_BAR` | Standalone HSBC-red semantic search bar | `placeholder`, `enableSemanticSearch`, `enableQRScan`, `enableChatbot`, `enableMessageInbox`, `searchApiEndpoint` |
| `HOME_SEARCH_HEADER` | Segment-adaptive home header with integrated search | All `AI_SEARCH_BAR` props plus `premierLabel`, `eliteLabel`, `advanceLabel`, `massLabel`, `enableNotification`, `enableHeadset` |

Both slice types should point their `searchApiEndpoint` prop at `POST /api/v1/search` or a configured override URL. The current seed data still carries `/api/v1/search/semantic` in a few mock props for backward compatibility; implemented console and client search calls use `/api/v1/search`.

#### Corpus Configuration (OCDP AI Search Admin)

OCDP operators create one `AISearchConfig` per app platform. The OCDP store dispatches `ADD_AI_SEARCH_CONFIG`, `EDIT_AI_SEARCH_CONFIG`, and `DELETE_AI_SEARCH_CONFIG` actions. Each config specifies:

```typescript
interface AISearchConfig {
  configId: string;
  appId: 'ios' | 'android' | 'harmonynext' | 'web';
  displayName: string;
  enabled: boolean;
  quickAccessSource: {
    mode: 'url' | 'json';   // remote URL fetch or inline JSON paste
    url?: string;
    json?: string;
  };
  contentSources: Array<{
    type: 'ocdp_page' | 'aem_url';  // AEM is a peer content source
    ref: string;                     // pageId or AEM page URL
    label: string;
    visibilityRules?: VisibilityRule[];
  }>;
  assetSources?: Array<{
    sourceId: string;
    type: 'video' | 'image' | 'file';
    label: string;
    url?: string;                    // exact URL
    parentFolderUrl?: string;         // folder prefix
    description?: string;
    keywords?: string;
    audienceRules: Array<{
      ruleId: string;
      label: string;
      customerSegments?: string[];
      accountTypes?: string[];
      locations?: string[];
      action: 'allow' | 'deny';
    }>;
  }>;
  entryPointRules?: Array<{
    entryPointId: string;             // matches quick-access source item id
    visibilityRules: VisibilityRule[];
    audienceRules?: AISearchConfig['assetSources'][number]['audienceRules'];
  }>;
  refreshSchedule: 'manual' | 'hourly' | 'daily';
  searchEndpointOverride?: string;
  lastRebuiltAt: string | null;
  corpusSize: number;
}
```

#### Sample — HK HarmonyNext App Semantic Search

The seeded OCDP sample config `ai-search-hk-harmonynext-sample` shows how the HK HarmonyNext app can receive entry-point configuration, OCDP/AEM content, and governed media/file URLs in one corpus.

```json
{
  "configId": "ai-search-hk-harmonynext-sample",
  "appId": "harmonynext",
  "displayName": "HK HarmonyNext App Semantic Search",
  "enabled": true,
  "quickAccessSource": {
    "mode": "json",
    "json": "[{\"id\":\"account-overview\",\"title\":\"Account overview\",\"deepLink\":\"hsbc://accounts\"},{\"id\":\"premier-wealth-studio\",\"title\":\"Premier Elite Wealth Studio\",\"deepLink\":\"hsbc://wealth/studio\"}]"
  },
  "contentSources": [
    {
      "type": "ocdp_page",
      "ref": "home-hub-hk",
      "label": "Home Hub (HK)",
      "visibilityRules": [
        {
          "ruleId": "home-hub-hk-visible",
          "label": "HK customers can search Home Hub",
          "conditions": [{ "field": "customerLocation", "operator": "is", "value": "HK" }],
          "conditionLogic": "AND",
          "action": "show"
        }
      ]
    },
    {
      "type": "ocdp_page",
      "ref": "fx-viewpoint-hk",
      "label": "FX Viewpoint — EUR & GBP (HK)",
      "visibilityRules": [
        {
          "ruleId": "fx-viewpoint-wealth-visible",
          "label": "Premier and Elite wealth customers can search FX Viewpoint",
          "conditions": [
            { "field": "customerSegment", "operator": "in", "value": ["premier", "elite"] },
            { "field": "accountType", "operator": "in", "value": ["wealth_account", "time_deposit"] },
            { "field": "customerLocation", "operator": "is", "value": "HK" }
          ],
          "conditionLogic": "AND",
          "action": "show"
        }
      ]
    }
  ],
  "assetSources": [
    {
      "sourceId": "wealth-studio-video-folder",
      "type": "video",
      "label": "Premier Elite Wealth Studio videos",
      "parentFolderUrl": "https://cdn.hsbc.com.hk/mobile/harmonynext/wealth-studio/",
      "audienceRules": [
        {
          "ruleId": "allow-premier-elite-wealth-hk",
          "label": "Premier and Elite HK wealth customers",
          "customerSegments": ["premier", "elite"],
          "accountTypes": ["wealth_account"],
          "locations": ["HK"],
          "action": "allow"
        }
      ]
    }
  ],
  "entryPointRules": [
    {
      "entryPointId": "premier-wealth-studio",
      "visibilityRules": [
        {
          "ruleId": "ep-premier-wealth-studio-visible",
          "label": "Follow OCDP page-editor rule: Premier and Elite wealth customers only",
          "conditions": [
            { "field": "customerSegment", "operator": "in", "value": ["premier", "elite"] },
            { "field": "accountType", "operator": "is", "value": "wealth_account" },
            { "field": "customerLocation", "operator": "is", "value": "HK" }
          ],
          "conditionLogic": "AND",
          "action": "show"
        }
      ]
    }
  ],
  "refreshSchedule": "daily",
  "searchEndpointOverride": "/api/v1/search"
}
```

At rebuild time the BFF indexes only approved source definitions. At search time it applies the same rule model used by the OCDP page editor:

- Entry-point results honour `entryPointRules.visibilityRules`, so Premier/Elite-only app functions are not returned to mass or ineligible account profiles.
- OCDP and AEM content sources can carry `visibilityRules`, preventing content result leakage across segment, account type or location.
- `assetSources` can use either an exact `url` or a `parentFolderUrl`; each video, image or file source is governed by `audienceRules`.
- Runtime calls pass audience context in the body or headers, for example `customerSegment=premier`, `accountType=wealth_account`, `customerLocation=HK`.

#### Corpus Rebuild Pipeline

Triggered by `POST /api/v1/search/config/{configId}/rebuild`:

```
Step 1 — Quick-access source
   mode=url  → BFF fetches JSON from remote URL; parses array of entry-point objects
               (each must have: id, title, icon, deepLink, description, keywords)
   mode=json → BFF parses inline JSON pasted by operator

Step 2 — Content sources and governed assets (in parallel)
   type=ocdp_page → Extracts title / description / keywords from SDUI screen data
                    for the given pageId (live or approved pages only)
   type=aem_url   → Synthesises a corpus entry from the AEM page URL and metadata
                    (AEM is a peer content provider alongside OCDP pages)
   assetSources   → Indexes configured video/image/file URLs or parent folders with
                    their audience access rules

Step 3 — Merge + deduplicate → stored in AI_SEARCH_CORPORA[appId]

Step 4 — Persist metadata
   Updates config.lastRebuiltAt and config.corpusSize for the OCDP AI Search
   Admin panel.

Response: { appId, corpusSize, rebuiltAt }
→ OCDP Admin card updated with corpus size and rebuild timestamp
```

### 3.6 Implemented Screen Contracts

The repository currently includes the following concrete SDUI screen contracts:

| Screen | Endpoint | Slice contract |
|--------|----------|----------------|
| Home Hub (HK) | `GET /api/v1/screen/home-hub-hk` | `HOME_SEARCH_HEADER`, `COMBO_QUICK_ACCESS`, `CARD_ACTIVATION_BANNER`, `QUEST_BANNER`, `FEATURE_PRODUCT`, `WEALTH_STUDIO_CAROUSEL`, `GUIDES_INSIGHTS_CAROUSEL`, `FX_WATCHLIST`, `DISCOVER_MORE_CAROUSEL` |
| FX Viewpoint | `GET /api/v1/screen/fx-viewpoint-hk` | `VIDEO_PLAYER`, `MARKET_BRIEFING_TEXT`, `CONTACT_RM_CTA` |
| KYC | `/api/v1/kyc/sessions/**` | Platform-split KYC steps with web compound components and mobile-native steps |

The Home Hub is implemented across Web, iOS, Android, and HarmonyOS NEXT with static fallbacks for offline and pre-publish use. Current client constraints are captured in [../IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md).

#### Runtime Search Flow

```
Mobile App / Web Client
   │  POST /api/v1/search
   │  { query: "理財", limit: 8, appId: "ios" }
   ▼
BFF Semantic Search Engine
   ├── Corpus selection
   │     AI_SEARCH_CORPORA["ios"] if configured + non-empty
   │     else falls back to default SEARCH_CORPUS
   │
   ├── Tokenise query → TF-IDF term vectors
   │
   ├── Score each corpus entry
   │     keyword-overlap boost + cosine-similarity score
   │
   └── Return top-N results sorted by score
         { id, type, title, description, icon, category, deepLink, score }

Client-side corpus caching (recommended):
   GET /api/v1/search/corpus?appId=ios
   → Full SearchCorpusResponse (cache TTL: 5 min)
   → Enables instant client-side search without round-trip per keystroke
```

**Production note:** The TF-IDF ranking in mock-BFF mirrors the result contract of Vertex AI Matching Engine (vector embeddings). In production the BFF calls Vertex AI; the API shape (`SearchResultItem[]`) is identical — no client changes required.

---

## 4. SDUI JSON Schema Specification

### 4.1 TypeScript Interface Definitions

```typescript
// Root payload returned by BFF for every screen request
interface ScreenPayload {
  schemaVersion: string;          // "2.3"
  pageId: string;                 // stable page ID, e.g. "home-hub-hk"
  screen: string;                 // analytics/rendering screen name, e.g. "home_hub_hk" | "fx_viewpoint" | "kyc-step-{id}"
  ttl: number;                    // seconds client may cache this payload
  integrity: string;              // HMAC-SHA256 of payload body
  layout: LayoutNode;
  metadata: ScreenMetadata;
}

interface ScreenMetadata {
  requestId: string;
  renderedAt: string;             // ISO 8601
  userId: string;                 // hashed
  segmentId: string;
  variantId?: string;             // set if user is in an A/B experiment
  experimentId?: string;
}

// A layout node — either a container or a leaf component
type LayoutNode = ContainerNode | ComponentNode;

interface ContainerNode {
  type: "ScrollContainer" | "SectionGroup" | "GridLayout" |
        "HorizontalCarousel" | "TabContainer" | "ModalSheet";
  id: string;
  props?: ContainerProps;
  children: LayoutNode[];
}

interface ContainerProps {
  padding?: Spacing;
  backgroundColor?: string;      // hex or design token
  scrollable?: boolean;
  columns?: number;               // for GridLayout
}

// A leaf node — maps to a registered UI component
interface ComponentNode {
  type: string;                   // must exist in client ComponentRegistry
  id: string;                     // stable content ID for analytics
  props: Record<string, unknown>; // component-specific props
  visibility?: VisibilityRules;
  analytics?: AnalyticsConfig;
  fallback?: ComponentNode;       // rendered if this component fails
}

interface VisibilityRules {
  segment?: string[];             // show only to these segments
  platform?: ("ios" | "android" | "web" | "harmonynext" | "wechat")[];
  locale?: string[];              // e.g. ["en-HK", "zh-HK"]
  minSdui?: string;              // minimum SDUI schema version required
  condition?: string;             // server-evaluated expression
}

interface AnalyticsConfig {
  impressionEvent: string;        // fired when component enters viewport
  clickEvent?: string;            // fired on primary interaction
  componentId: string;            // stable ID for DAP signal mapping
  variantId?: string;
  experimentId?: string;
  customProperties?: Record<string, string>;
}

interface ActionDefinition {
  type: "NAVIGATE" | "DEEP_LINK" | "API_CALL" | "MODAL" | "TRACK" | "SHARE";
  destination?: string;           // screen name or URL
  params?: Record<string, string>;
  payload?: Record<string, unknown>; // for API_CALL
  confirmationModal?: ComponentNode; // optional confirmation before action
}

interface Spacing {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}
```

### 4.2 Full Home Screen JSON Example

```json
{
  "schemaVersion": "2.3",
  "screen": "home",
  "ttl": 300,
  "integrity": "sha256:a3f9c2...",
  "metadata": {
    "requestId": "req-8f3a2b1c",
    "renderedAt": "2026-04-19T03:00:00Z",
    "userId": "usr-hashed-9f2a",
    "segmentId": "premier",
    "variantId": "variant-B",
    "experimentId": "exp-jade-banner-2026Q2"
  },
  "layout": {
    "type": "ScrollContainer",
    "id": "home-root",
    "props": { "scrollable": true, "backgroundColor": "#FFFFFF" },
    "children": [
      {
        "type": "PersonalisedGreeting",
        "id": "greeting-001",
        "props": {
          "template": "Good morning, {{dynamic:firstName}}",
          "subtext": "Premier Member since 2019"
        },
        "analytics": {
          "impressionEvent": "greeting_viewed",
          "componentId": "greeting-001"
        }
      },
      {
        "type": "PromoBanner",
        "id": "jade-upgrade-banner-B",
        "props": {
          "title": "Elevate to HSBC Jade",
          "subtitle": "Exclusive benefits for Premier customers with HKD 7.8M+ assets",
          "imageUrl": "https://cdn.hsbc.com.hk/promos/jade-upgrade-2026.webp",
          "imageAlt": "HSBC Jade premium banking card on marble surface",
          "backgroundColour": "#1D1D1B",
          "textColour": "#C9A84C",
          "ctaText": "Discover Jade Benefits",
          "ctaAction": {
            "type": "NAVIGATE",
            "destination": "JadeUpgradeJourney",
            "params": { "promoCode": "JADE-PREMIER-Q2", "source": "home_banner" }
          }
        },
        "visibility": {
          "segment": ["premier"],
          "platform": ["ios", "android", "web"],
          "locale": ["en-HK", "zh-HK"]
        },
        "analytics": {
          "impressionEvent": "promo_banner_viewed",
          "clickEvent": "promo_banner_clicked",
          "componentId": "jade-upgrade-banner-B",
          "variantId": "variant-B",
          "experimentId": "exp-jade-banner-2026Q2",
          "customProperties": {
            "promoCode": "JADE-PREMIER-Q2",
            "segment": "premier"
          }
        }
      },
      {
        "type": "QuickActionGrid",
        "id": "quick-actions-home",
        "props": {
          "columns": 4,
          "items": [
            { "label": "Transfer", "icon": "transfer", "action": { "type": "NAVIGATE", "destination": "TransferScreen" } },
            { "label": "Pay Bills", "icon": "bill", "action": { "type": "NAVIGATE", "destination": "PayBillsScreen" } },
            { "label": "FX Rate", "icon": "fx", "action": { "type": "NAVIGATE", "destination": "FXScreen" } },
            { "label": "More", "icon": "grid", "action": { "type": "NAVIGATE", "destination": "ServicesScreen" } }
          ]
        },
        "analytics": {
          "impressionEvent": "quick_actions_viewed",
          "componentId": "quick-actions-home"
        }
      },
      {
        "type": "HorizontalCarousel",
        "id": "recommendations-carousel",
        "props": {
          "title": "Recommended For You",
          "items": "{{dynamic:mlRecommendations}}"
        },
        "analytics": {
          "impressionEvent": "recommendations_carousel_viewed",
          "componentId": "recommendations-carousel"
        }
      },
      {
        "type": "RateComparisonTable",
        "id": "savings-rates-home",
        "props": {
          "title": "Today's Savings Rates",
          "rates": "{{dynamic:savingsRates}}",
          "updatedAt": "2026-04-19",
          "ctaText": "Open Savings Account",
          "ctaAction": { "type": "NAVIGATE", "destination": "SavingsOnboarding" }
        },
        "analytics": {
          "impressionEvent": "rate_table_viewed",
          "componentId": "savings-rates-home"
        }
      },
      {
        "type": "SurveyWidget",
        "id": "nps-survey-home",
        "props": {
          "surveyType": "NPS",
          "question": "How likely are you to recommend HSBC Premier to a friend?",
          "scale": 10,
          "trigger": "post_session",
          "journeyId": "home_session",
          "contentId": "jade-upgrade-banner-B"
        },
        "visibility": {
          "condition": "user.daysSinceLastSurvey > 30"
        },
        "analytics": {
          "impressionEvent": "survey_shown",
          "componentId": "nps-survey-home"
        }
      }
    ]
  }
}
```

---

## 5. Component Taxonomy

### 5.1 UCP Slice Types (SDUI Page Builder)

These are the canonical slice types managed in the UCP Console (`sliceDefinitions.ts`) and served by the BFF as `type` values in the SDUI JSON. They correspond 1:1 to the component registry entries in each client.

#### `home-hub-hk` — Home Hub (HK) Slices

| # | SliceType | Category | Singleton | Description |
|---|-----------|----------|-----------|-------------|
| 1 | `HOME_SEARCH_HEADER` | navigation | yes | HSBC-red adaptive header (Premier/Jade/Advance/Mass) with integrated AI semantic search bar, notifications, and QR scanner |
| 2 | `COMBO_QUICK_ACCESS` | function | yes | Scrollable tab strip (My pick / Invest / Global / HK Daily) + two 5-icon quick-access rows |
| 3 | `CARD_ACTIVATION_BANNER` | promotion | no | Inline notification banner prompting card activation |
| 4 | `QUEST_BANNER` | promotion | no | Getting-started quest progress card with HSBC hexagon icon |
| 5 | `FEATURE_PRODUCT` | wealth | no | Tabbed fund list (Top-Performing / Thematic / All) showing fund name, code, and 1Y return |
| 6 | `WEALTH_STUDIO_CAROUSEL` | wealth | no | Premier Elite Wealth Studio horizontal video episode carousel |
| 7 | `GUIDES_INSIGHTS_CAROUSEL` | insight | no | Article card carousel — investment guides and market insights |
| 8 | `FX_WATCHLIST` | wealth | no | Currency pair watchlist with Gold Forex Club tier badge (amber `#FFFBEB`/`#FDE68A` theme) and live bid/ask rates |
| 9 | `DISCOVER_MORE_CAROUSEL` | promotion | no | Horizontal campaign card carousel — promotions and lifestyle offers |

#### `fx-viewpoint-hk` — FX Viewpoint Slices

| SliceType | Category | Singleton | Description |
|-----------|----------|-----------|-------------|
| `VIDEO_PLAYER` | insight | no | Inline video player linked to a UCP content asset |
| `MARKET_BRIEFING_TEXT` | insight | no | Bullet-point market briefing pulled from UCP content |
| `CONTACT_RM_CTA` | insight | yes | Sticky full-width CTA to Relationship Manager finder |

#### Legacy / Retired UCP Slice Types

The following slice types existed in earlier iterations but are **not used** by the current `home-hub-hk` layout. They remain registered in the UCP component registry for backwards compatibility with older published pages.

| SliceType | Category | Notes |
|-----------|----------|-------|
| `HEADER_NAV` | navigation | Replaced by `HOME_SEARCH_HEADER` |
| `AI_SEARCH_BAR` | navigation | Merged into `HOME_SEARCH_HEADER` |
| `QUICK_ACCESS` | function | Replaced by `COMBO_QUICK_ACCESS` |
| `PROMO_BANNER` | promotion | Replaced by `CARD_ACTIVATION_BANNER` + `QUEST_BANNER` |
| `FUNCTION_GRID` | function | Replaced by `COMBO_QUICK_ACCESS` tab rows |
| `AI_ASSISTANT` | function | Deprecated |
| `AD_BANNER` | promotion | Deprecated |
| `FLASH_LOAN` | wealth | Deprecated |
| `WEALTH_SELECTION` | wealth | Replaced by `FEATURE_PRODUCT` |
| `FEATURED_RANKINGS` | wealth | Deprecated |
| `LIFE_DEALS` | lifestyle | Replaced by `DISCOVER_MORE_CAROUSEL` |
| `SPACER` | layout | Still available for use in custom pages |

### 5.2 Generic Layout & Content Component Types

These types are used inside the SDUI tree as container and content primitives, distinct from the UCP slice types above.

| Category | Component Type | Description |
|----------|---------------|-------------|
| **Layout** | `ScrollContainer` | Root scrollable container for a screen |
| **Layout** | `SectionGroup` | Groups components with optional header and divider |
| **Layout** | `GridLayout` | N-column grid; n configured via props |
| **Layout** | `HorizontalCarousel` | Horizontally scrollable list of cards |
| **Layout** | `TabContainer` | Tabbed sections; selected tab drives child content |
| **Layout** | `ModalSheet` | Bottom sheet or modal dialog |
| **Content** | `HeroBanner` | Full-width hero image with title and optional CTA |
| **Content** | `PromoBanner` | Promotional banner with strong CTA, segment-aware |
| **Content** | `ProductFeatureTile` | Product benefit highlight card |
| **Content** | `InsightArticleCard` | Blog / insight article preview card |
| **Content** | `RateComparisonTable` | Savings / FX / mortgage rate comparison table |
| **Content** | `EligibilityChecklist` | Shows eligibility criteria with tick/cross states |
| **Content** | `TestimonialCard` | Customer quote card |
| **Content** | `ContentRichText` | Markdown / HTML rich text block from CMS |
| **Journey** | `JourneyStepIndicator` | Progress bar / step tracker for multi-step journeys |
| **Journey** | `FormFieldRenderer` | Renders form fields from JSON schema (text, select, date) |
| **Journey** | `KYCDocUploadWidget` | Document capture and upload (ID, proof of address) |
| **Journey** | `EligibilityGate` | Shows/hides content based on eligibility check result |
| **Journey** | `ApplicationSummary` | Summary card shown before application submission |
| **Journey** | `OfferConfirmationCard` | Final offer confirmation with terms |
| **Action** | `PrimaryButton` | Primary CTA button |
| **Action** | `SecondaryButton` | Secondary / ghost button |
| **Action** | `QuickActionGrid` | Grid of icon+label action chips (transfer, pay, etc.) |
| **Action** | `FABButton` | Floating action button |
| **Feedback** | `SurveyWidget` | In-app NPS / CSAT survey, triggered by rules |
| **Feedback** | `StarRatingWidget` | 5-star rating for a specific journey or feature |
| **Feedback** | `FeedbackTextInput` | Open text feedback capture |
| **Personalisation** | `RecommendationCarousel` | ML-driven product recommendation cards |
| **Personalisation** | `NextBestOfferBanner` | Single highest-priority personalised offer |
| **Personalisation** | `PersonalisedGreeting` | User name + segment-aware greeting message |

---

## 6. Client Rendering Engine

### 6.1 Web (React + TypeScript)

```typescript
// Component Registry — maps type string to React component
const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  ScrollContainer:       ScrollContainerComponent,
  SectionGroup:          SectionGroupComponent,
  HorizontalCarousel:    HorizontalCarouselComponent,
  PromoBanner:           PromoBannerComponent,
  ProductFeatureTile:    ProductFeatureTileComponent,
  QuickActionGrid:       QuickActionGridComponent,
  RateComparisonTable:   RateComparisonTableComponent,
  SurveyWidget:          SurveyWidgetComponent,
  PersonalisedGreeting:  PersonalisedGreetingComponent,
  RecommendationCarousel:RecommendationCarouselComponent,
  // ... all 30 components
};

// Core recursive renderer
function SDUIRenderer({ node }: { node: LayoutNode }) {
  const Component = ComponentRegistry[node.type];

  if (!Component) {
    console.warn(`[SDUI] Unknown component type: ${node.type}`);
    return node.fallback ? <SDUIRenderer node={node.fallback} /> : null;
  }

  return (
    <AnalyticsInstrumentation config={node.analytics} componentId={node.id}>
      <Component
        {...resolveProps(node.props)}
        id={node.id}
      >
        {"children" in node
          ? node.children.map(child => <SDUIRenderer key={child.id} node={child} />)
          : null}
      </Component>
    </AnalyticsInstrumentation>
  );
}
```

### 6.2 iOS (SwiftUI)

```swift
// Component Registry as a dictionary of ViewBuilders
struct SDUIComponentRegistry {
    static func resolve(type: String, props: [String: Any], children: [SDUINode]) -> AnyView {
        switch type {
        case "PromoBanner":         return AnyView(PromoBannerView(props: props))
        case "QuickActionGrid":     return AnyView(QuickActionGridView(props: props))
        case "HorizontalCarousel":  return AnyView(HorizontalCarouselView(props: props, children: children))
        case "SurveyWidget":        return AnyView(SurveyWidgetView(props: props))
        case "PersonalisedGreeting":return AnyView(PersonalisedGreetingView(props: props))
        default:
            // Unknown component — render nothing, log to observability
            AnalyticsClient.log(event: "sdui_unknown_component", properties: ["type": type])
            return AnyView(EmptyView())
        }
    }
}

// Recursive renderer
struct SDUINodeRenderer: View {
    let node: SDUINode

    var body: some View {
        SDUIComponentRegistry
            .resolve(type: node.type, props: node.props, children: node.children ?? [])
            .onAppear {
                if let analytics = node.analytics {
                    AnalyticsClient.fire(event: analytics.impressionEvent,
                                        properties: ["componentId": analytics.componentId])
                }
            }
    }
}
```

### 6.3 Android (Jetpack Compose + Kotlin)

```kotlin
// Component Registry
object SDUIComponentRegistry {
    @Composable
    fun Resolve(node: SDUINode, actionHandler: ActionHandler) {
        when (node.type) {
            "PromoBanner"          -> PromoBannerComposable(node.props, actionHandler)
            "QuickActionGrid"      -> QuickActionGridComposable(node.props, actionHandler)
            "HorizontalCarousel"   -> HorizontalCarouselComposable(node.props, node.children, actionHandler)
            "SurveyWidget"         -> SurveyWidgetComposable(node.props)
            "PersonalisedGreeting" -> PersonalisedGreetingComposable(node.props)
            else -> {
                // Unknown component — log and skip gracefully
                AnalyticsClient.log("sdui_unknown_component", mapOf("type" to node.type))
            }
        }
    }
}

// Recursive renderer composable
@Composable
fun SDUIRenderer(node: SDUINode, actionHandler: ActionHandler) {
    LaunchedEffect(node.id) {
        node.analytics?.let { analytics ->
            AnalyticsClient.fire(analytics.impressionEvent,
                mapOf("componentId" to analytics.componentId))
        }
    }
    SDUIComponentRegistry.Resolve(node, actionHandler)
}
```

### 6.4 HarmonyOS NEXT (ArkUI / ArkTS)

```typescript
// Component Registry — ArkTS @Builder dispatch
@Component
struct SDUIRenderer {
  private node: SDUINode = {};

  build() {
    Column() {
      if (this.node.type === 'PROMO_BANNER') {
        PromoBannerComponent({ props: this.node.props })
      } else if (this.node.type === 'QUICK_ACCESS') {
        QuickAccessComponent({ props: this.node.props })
      } else if (this.node.type === 'AI_SEARCH_BAR') {
        AISearchBarComponent({ props: this.node.props })
      } else if (this.node.type === 'VIDEO_PLAYER') {
        VideoPlayerComponent({ props: this.node.props })
      } else if (this.node.type === 'MARKET_BRIEFING_TEXT') {
        MarketBriefingTextComponent({ props: this.node.props })
      } else if (this.node.type === 'CONTACT_RM_CTA') {
        ContactRMCTAComponent({ props: this.node.props })
      } else {
        // Unknown component — log and render nothing
        Text('').visibility(Visibility.None)
      }
    }
    .onAppear(() => {
      if (this.node.analytics) {
        SensorDataClient.logEvent(this.node.analytics.impressionEvent,
          { componentId: this.node.analytics.componentId })
      }
    })
  }
}
```

Analytics on HarmonyOS NEXT is market-specific: HK Home Hub uses **TealiumClient** for customer behaviour tagging, while mainland China pages use **SensorDataClient** (神策数据) to satisfy China data residency requirements (PIPL). Observability/APM is separate and routes through the AppDynamics facade, with `traceparent` propagated on SDUI/API calls.

> **Note:** The code example above shows the old slice dispatcher. The current `HomePage.ets` dispatches the 9 Home Hub slices (`HOME_SEARCH_HEADER`, `COMBO_QUICK_ACCESS`, `CARD_ACTIVATION_BANNER`, `QUEST_BANNER`, `FEATURE_PRODUCT`, `WEALTH_STUDIO_CAROUSEL`, `GUIDES_INSIGHTS_CAROUSEL`, `FX_WATCHLIST`, `DISCOVER_MORE_CAROUSEL`) using the same `if/else if` pattern. `switch` and `const`/`let` declarations are forbidden inside ArkTS `build()` blocks.

### 6.5 Action Handler Registry

All three platforms implement the same action type contract:

| Action Type | Behaviour |
|-------------|-----------|
| `NAVIGATE` | Push named screen onto navigation stack with params |
| `DEEP_LINK` | Open URL (internal deep link or external browser) |
| `API_CALL` | POST to BFF endpoint with payload; show loading state |
| `MODAL` | Present another SDUI-rendered modal sheet |
| `TRACK` | Fire analytics event with custom properties (no navigation) |
| `SHARE` | Trigger native OS share sheet with provided content |

---

## 7. Versioning Contract

```
CLIENT REQUEST HEADERS:
  x-sdui-version: "2.3"         ← highest schema version this client build supports
  x-client-build: "10.4.1"      ← app build version (for capability matrix lookup)
  x-platform: "ios"

SERVER RESPONSE HEADERS:
  x-sdui-schema-version: "2.3"  ← schema version actually used in response
  x-sdui-cache-ttl: "300"       ← recommended client cache duration (seconds)

VERSION CAPABILITY MATRIX:
  Client x-sdui-version  │ Features Available
  ───────────────────────┼──────────────────────────────────────────────────
  1.x                    │ Basic components, simple props, NAVIGATE action
  2.0–2.2                │ + Personalisation props, A/B metadata, API_CALL
  2.3                    │ + Animation props, conditional visibility, MODAL
  3.0                    │ + VIDEO_PLAYER, MARKET_BRIEFING_TEXT, CONTACT_RM_CTA,
                         │   AI_SEARCH_BAR (used by fx-viewpoint-hk screen)

GRACEFUL DEGRADATION RULES:
  Situation                        │ Server Behaviour
  ─────────────────────────────────┼──────────────────────────────────────
  Client version too old for comp  │ Replace with supported fallback component
  Unknown component type on client │ Client renders node.fallback or EmptyView
  Missing required prop            │ Server omits component, logs warning
  Unsupported action type          │ Server replaces with NAVIGATE or omits CTA
  Client version unknown           │ Serve minimum v1 schema (safe baseline)
```

---

## 8. Caching Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Caching Layers                                 │
│                                                                        │
│  L1 — CDN (CloudFront edge)                                            │
│  ────────────────────────────────────────────────────────────────    │
│  Scope:    Anonymous screens only (no user context)                   │
│  Cache key: screen + locale + platform + sdui-version                 │
│  TTL:      60 seconds                                                 │
│  Invalidation: CMS publish webhook → CloudFront invalidation API      │
│  ⚠ NEVER cache personalised or authenticated screens at CDN           │
│                                                                        │
│  L2 — BFF Redis (AWS ElastiCache)                                     │
│  ────────────────────────────────────────────────────────────────    │
│  Scope:    Personalised screens (post-login)                          │
│  Cache key: screen + userId + segmentId + variantId + platform        │
│  TTL:      300 seconds (5 min)                                        │
│  Invalidation: CMS publish webhook, segment change event, A/B update  │
│  Target hit rate: 85%+                                                │
│                                                                        │
│  L3 — Client Device Cache                                             │
│  ────────────────────────────────────────────────────────────────    │
│  Scope:    Last-known-good screen per screenId                        │
│  Storage:  Encrypted local storage / Keychain                         │
│  TTL:      As specified by x-sdui-cache-ttl response header           │
│  Purpose:  Offline / poor network fallback                            │
│  Staleness indicator: shown if > 1h old                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. A/B Testing Integration

```
1. Experiment defined in Optimizely:
   experimentId: exp-jade-banner-2026Q2
   variants: [control (50%), variant-B (50%)]
   audience: segment=premier

2. BFF Slot Resolver calls A/B Allocator:
   input:  userId + experimentId
   output: { variantId: "variant-B", contentId: "jade-banner-variant-B" }
   contract: same userId always gets same variant (sticky allocation)

3. Variant contentId used to fetch from Stripes CMS.

4. variantId + experimentId injected into every analytics config
   in the SDUI JSON response.

5. Client auto-fires impression + click events with variantId.

6. DAP aggregates events per variantId.

7. When statistical significance reached (p < 0.05, min 7 days,
   min 1000 impressions per variant):
   - DAP Content Scoring Job flags winner
   - Feedback Loop notifies CMS editor
   - Editor promotes winner to 100% in Optimizely
```

---

## 10. SDUI Performance Targets (SLOs)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| BFF SDUI response time p50 | < 80ms | > 100ms |
| BFF SDUI response time p95 | < 150ms | > 200ms |
| BFF SDUI response time p99 | < 300ms | > 400ms |
| Redis cache hit rate | > 85% | < 75% |
| CDN cache hit rate (anon screens) | > 90% | < 80% |
| Client time-to-first-component | < 200ms | > 300ms |
| Unknown component fallback rate | < 0.1% | > 1% |
| Schema validation failure rate | < 0.01% | > 0.1% |
| SDUI JSON payload size (p95) | < 80KB | > 150KB |
