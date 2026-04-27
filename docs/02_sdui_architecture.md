# Server Driven UI (SDUI) Architecture

**Document Version:** 1.0  
**Date:** 2026-04-19  
**Scope:** UCP BFF + Web / iOS / Android SDUI Renderers  

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
  │  │  - Fetches resolved contentIds from Stripes CMS API          │   │
  │  │    (or Redis L1 cache — hit rate target: 85%+)               │   │
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
    String contentId,        // Stripes CMS content ID
    Map<String, Object> additionalProps
) {}
```

---

## 4. SDUI JSON Schema Specification

### 4.1 TypeScript Interface Definitions

```typescript
// Root payload returned by BFF for every screen request
interface ScreenPayload {
  schemaVersion: string;          // "2.3"
  screen: string;                 // "home" | "products" | "jade_upgrade" | ...
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
  platform?: ("ios" | "android" | "web" | "wechat")[];
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

### 6.4 Action Handler Registry

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
  2.3+                   │ + Animation props, conditional visibility, MODAL
  3.0+ (future)          │ + AI-generated layout, voice action type

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
│  L1 — CDN (Akamai edge)                                               │
│  ────────────────────────────────────────────────────────────────    │
│  Scope:    Anonymous screens only (no user context)                   │
│  Cache key: screen + locale + platform + sdui-version                 │
│  TTL:      60 seconds                                                 │
│  Invalidation: CMS publish webhook → Akamai Fast Purge API            │
│  ⚠ NEVER cache personalised or authenticated screens at CDN           │
│                                                                        │
│  L2 — BFF Redis (GCP Memorystore)                                     │
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
