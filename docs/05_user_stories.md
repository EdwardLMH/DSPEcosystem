# HSBC Digital Sales Promotion Platform — Agile User Story Backlog

> **Project:** DSP Ecosystem  
> **Last Updated:** 2026-04-18  
> **Format:** ID · Title · User Story · Acceptance Criteria · Story Points · Dependencies · Technical Notes

---

## EPIC 1: UCP Content Management (Epic ID: UCP)

### UCP-001: Create Promotion with Structured Fields

**User Story:** As a CMS editor, I want to create a promotion with structured fields so that AEO schema is auto-generated on publish.

**Acceptance Criteria:**
- Content model includes title, hero image, CTA label/URL, FAQ block (min 1 Q&A pair), author, and reviewed-date fields
- Publish action is blocked with a validation error if the FAQ block is empty
- JSON-LD (FinancialProduct + FAQPage) is emitted into the page `<head>` on every publish
- A legal approval gate step is present in the publish workflow before content goes live
- An immutable audit log entry (editor, timestamp, action, diff) is created on every state transition

**Story Points:** 5  
**Dependencies:** None  
**Technical Notes:** Schema Generator service (AEO-002) consumes CMS publish webhook. JSON-LD must pass schema.org validator before publish completes. Stripes CMS content model version must be bumped. Audit log stored in `cms.audit_events` table.

---

### UCP-002: Mandatory Legal Approval Workflow

**User Story:** As a compliance officer, I want a mandatory legal approval workflow so that no promotion goes live without sign-off.

**Acceptance Criteria:**
- Editor submits content for review; assigned reviewer receives email + in-app notification
- Reviewer can approve or reject with a mandatory comment field
- Rejected content returns to Draft state; editor sees rejection reason inline
- Approved content transitions to Scheduled or Live state and triggers the publish pipeline
- Full audit trail of approvals, rejections, and comments is queryable in the CMS admin panel

**Story Points:** 3  
**Dependencies:** UCP-001  
**Technical Notes:** Workflow state machine implemented in Stripes CMS workflow engine. Reviewer role mapped to IAM group `cms-legal-reviewer`. Notification via SendGrid transactional email + CMS notification centre.

---

### UCP-003: SDUI Preview Before Publishing

**User Story:** As a CMS editor, I want to preview how a promotion renders in SDUI on iOS, Android, and Web before publishing.

**Acceptance Criteria:**
- Preview panel renders the SDUI JSON payload in an embedded simulator for all three platforms
- Simulator reflects the current segment and locale selected in the preview toolbar
- Preview mode does not fire any analytics events or increment impression counters
- Preview is available from Draft, In Review, and Approved states
- Preview accurately reflects the current unsaved draft (not the last published version)

**Story Points:** 5  
**Dependencies:** UCP-001, BFF-001  
**Technical Notes:** Preview calls BFF `/screen/{id}?preview=true&segment={seg}&locale={loc}` with a short-lived signed preview token. BFF bypasses Redis cache for preview requests. Simulator is an iframe (web) and a React Native WebView mock (mobile).

---

### UCP-004: Segment Eligibility Rule Builder

**User Story:** As a product manager, I want to configure segment eligibility rules per promotion so that only eligible customers see the content.

**Acceptance Criteria:**
- Rule builder UI supports conditions on: customer segment, locale, platform (iOS/Android/Web), and date range
- Rules are stored as structured JSON in the CMS content model alongside the promotion
- BFF enforces eligibility rules at composition time before including a component in the SDUI payload
- Rules can be associated with an A/B experiment to enable segment-level testing
- Invalid rule combinations (e.g. conflicting date ranges) are flagged with a validation error

**Story Points:** 5  
**Dependencies:** None  
**Technical Notes:** Rule evaluation engine in BFF uses a simple predicate tree. Rules stored in `promotion.eligibility_rules` CMS field as JSON Schema. BFF resolves segment from IAM JWT claims (`x-hsbc-segment` header).

---

### UCP-005: AEO Health Score in CMS

**User Story:** As a CMS editor, I want to receive an AEO health score on each product page so that I know what to fix to improve LLM citation.

**Acceptance Criteria:**
- Score 0–100 displayed as a badge in the CMS content detail view
- Score broken down by criterion (schema completeness, FAQ depth, author signal, freshness, citation density)
- Traffic-light colour coding: green ≥80, amber 50–79, red <50
- Clicking a criterion opens an inline fix-guidance panel with specific instructions
- Score is recalculated automatically on every save (debounced 3 s)

**Story Points:** 3  
**Dependencies:** AEO-001  
**Technical Notes:** AEO scoring microservice exposes `POST /score` accepting CMS content JSON. CMS calls this endpoint via async webhook on save. Score stored in `cms.aeo_scores` and surfaced via CMS extension API.

---

## EPIC 2: SDUI BFF & Composition Engine (Epic ID: BFF)

### BFF-001: Single Composed Screen Endpoint

**User Story:** As a mobile client, I want a single `GET /screen/{id}` endpoint that returns a fully composed SDUI JSON payload so I never need multiple calls to build a screen.

**Acceptance Criteria:**
- Single endpoint returns all component data needed to render the screen without further client calls
- p95 response latency is <150 ms under normal load (measured in k6 load test)
- Payload includes schema version, component tree, analytics config, and TTL hint
- Schema version is negotiated via `x-sdui-version` request header
- Payload is personalised per authenticated user; anonymous users receive the default segment payload
- Response is served from Redis cache on cache hit; cache miss triggers full composition

**Story Points:** 8  
**Dependencies:** None  
**Technical Notes:** Spring Boot BFF service. Redis cache key: `sdui:{screenId}:{segmentId}:{schemaVersion}`. Cache TTL driven by CMS content TTL field. Composition pipeline: resolveTemplate → resolveSlots → fetchContent → injectProps → negotiateVersion.

---

### BFF-002: Segment-Driven Slot Composition

**User Story:** As the platform, I want the BFF to compose different component slots for different user segments so that premier customers see wealth promotions and mass retail customers see entry products.

**Acceptance Criteria:**
- Customer segment is resolved from the IAM JWT token claims on every request
- Slot assignments differ by segment as defined in the CMS slot configuration
- Integration tests cover at least 5 segment types using mock `x-hsbc-segment` headers
- A QA segment override header (`x-sdui-segment-override`) is supported for testing
- Segment resolution failure falls back to the `MASS_RETAIL` default segment

**Story Points:** 5  
**Dependencies:** BFF-001  
**Technical Notes:** Segment values: `PREMIER`, `JADE`, `MASS_RETAIL`, `ADVANCE`, `BUSINESS`. Slot config stored in CMS as `screen.slotConfig[segmentId]`. Override header only accepted when `X-QA-Token` is also present.

---

### BFF-003: Sticky A/B Variant Allocation

**User Story:** As the platform, I want A/B variant allocation to be sticky per user so that a user always sees the same variant throughout an experiment.

**Acceptance Criteria:**
- Variant allocation is deterministic: `hash(userId + experimentId) % bucketCount` determines the variant
- Allocated variant is persisted in Redis with a 30-day TTL
- Variant is consistent across sessions and devices for the same authenticated userId
- Variant ID and experiment ID are injected into the SDUI JSON `analyticsConfig` of every component
- Variant can be force-set via `x-sdui-variant-override` header for QA purposes

**Story Points:** 5  
**Dependencies:** BFF-001  
**Technical Notes:** Uses MurmurHash3 for deterministic bucketing. Redis key: `ab:alloc:{userId}:{experimentId}`. Optimizely SDK used for experiment config retrieval; allocation logic is local to avoid latency.

---

### BFF-004: Schema Version Downgrade for Older Clients

**User Story:** As an older app version, I want the BFF to serve a downgraded SDUI schema that only uses components I support so I don't crash.

**Acceptance Criteria:**
- Client sends `x-sdui-version` header (e.g. `2.1`); BFF reads a capability matrix to determine supported component types
- Unsupported component types are replaced with a `FallbackBanner` component carrying a safe default message
- Response header `x-sdui-schema-version-used` confirms the schema version actually served
- Capability matrix is maintained as a YAML config file and hot-reloadable without restart
- Unit tests cover downgrade paths for versions 1.0, 1.5, 2.0, and 2.1

**Story Points:** 5  
**Dependencies:** BFF-001  
**Technical Notes:** Capability matrix: `config/sdui-capability-matrix.yml`. Version negotiation runs as the final step in the composition pipeline. Minimum supported version: `1.0`; requests below minimum receive HTTP 400.

---

### BFF-005: Cache Invalidation on CMS Publish

**User Story:** As the platform, I want Redis cache to be invalidated when CMS publishes new content so clients get fresh content within 60 seconds.

**Acceptance Criteria:**
- CMS publish event fires a webhook `POST /internal/cache/invalidate` to the BFF
- BFF flushes all Redis keys matching the affected `screenId` and `contentId` patterns
- A cache miss after invalidation triggers a fresh CMS content fetch and re-caches the result
- CDN purge API (CloudFront) is called for screens accessible to anonymous users
- End-to-end latency from CMS publish to client receiving fresh content is <60 s (measured in integration test)

**Story Points:** 3  
**Dependencies:** BFF-001  
**Technical Notes:** Webhook secured with HMAC-SHA256 signature. Redis `SCAN` + `DEL` pattern: `sdui:{screenId}:*`. CDN purge via CloudFront invalidation API. Invalidation events logged to `bff.cache_invalidation_log`.

---

### BFF-006: Forward SDUI Events to DAP

**User Story:** As the platform, I want the BFF to forward all SDUI interaction events to DAP so that analytics are captured without client-specific integrations.

**Acceptance Criteria:**
- Events received via `POST /events` (single) and `POST /events/batch` (array, max 500)
- Payload schema validated against the DAP event schema before forwarding
- Overseas events forwarded to GCP Pub/Sub topic `dap-sdui-events`; China events forwarded to SensorData HTTP endpoint
- `userId` field is SHA-256 hashed before forwarding to comply with data privacy policy
- Failed forwards are written to a dead-letter queue (GCP Pub/Sub `dap-sdui-events-dlq`) for retry

**Story Points:** 5  
**Dependencies:** None  
**Technical Notes:** Region routing determined by `x-hsbc-region` header (`HK`, `CN`, `UK`, etc.). GCP Pub/Sub client uses Workload Identity. SensorData endpoint URL configured in `application.yml`. Batch endpoint returns per-event success/failure array.

---

---

## EPIC 3: SDUI Client — Web

### WEB-001: Component Registry and Core Renderer

**User Story:** As a web engineer, I want a central ComponentRegistry that maps SDUI type strings to React components so that adding new components requires no changes to the rendering engine.

**Acceptance Criteria:**
- `ComponentRegistry` maps `string → React.ComponentType`
- Unknown type renders `UnknownComponentFallback` and logs a warning (no crash)
- Recursive `SDUIRenderer` traverses the node tree depth-first
- Children of container nodes rendered recursively
- Unit tests cover: known component, unknown component, deeply nested tree

**Story Points:** 5 | **Dependencies:** None

---

### WEB-002: Analytics Auto-Instrumentation

**User Story:** As a data analyst, I want every SDUI component to automatically fire impression and click events so that DAP receives consistent analytics without per-component code.

**Acceptance Criteria:**
- `AnalyticsInstrumentation` wrapper fires `impressionEvent` when component enters viewport (IntersectionObserver)
- CTA click fires `clickEvent` with `componentId`, `variantId`, `screenId`, `segmentId`
- Events batched and sent to DAP every 5 seconds or 20 events, whichever first
- userId hashed (SHA-256) before leaving browser
- Events queued offline; retried on reconnect

**Story Points:** 8 | **Dependencies:** WEB-001

---

### WEB-003: Offline / Stale Cache Fallback

**User Story:** As a customer on poor connectivity, I want the app to show the last-known screen if BFF is unreachable so I can still browse without a blank page.

**Acceptance Criteria:**
- Last successful SDUI JSON per screenId stored in `localStorage` (encrypted)
- On BFF error or timeout (> 3s), cached screen rendered with staleness indicator
- Staleness indicator shown if payload > 1 hour old
- Cache evicted after 24 hours
- Error sent to observability

**Story Points:** 5 | **Dependencies:** WEB-001

---

## EPIC 4: SDUI Client — Mobile

### MOB-001: iOS SwiftUI Component Registry and Renderer

**User Story:** As an iOS engineer, I want a SwiftUI-based SDUI renderer with a component registry so the app renders any layout the BFF sends without a new release.

**Acceptance Criteria:**
- `SDUIComponentRegistry` maps type string to `AnyView`
- Unknown type renders `EmptyView` and logs via `AnalyticsClient`
- `SDUINodeRenderer` fires `impressionEvent` in `.onAppear`
- `SDUIScreenViewModel` fetches from BFF with 3-attempt exponential backoff
- Loads Keychain-cached screen if BFF unreachable

**Story Points:** 8 | **Dependencies:** None

---

### MOB-002: Android Jetpack Compose Component Registry and Renderer

**User Story:** As an Android engineer, I want a Compose-based SDUI renderer with a component registry so the app renders any layout the BFF sends without a new release.

**Acceptance Criteria:**
- `SDUIComponentRegistry` resolves type string to `@Composable`
- Unknown type: no-op with analytics log
- `LaunchedEffect` fires impression event on composition
- `SDUIViewModel` fetches via Retrofit + Coroutines
- Encrypted `SharedPreferences` caches last-known-good screen

**Story Points:** 8 | **Dependencies:** None

---

## EPIC 5: DAP — Analytics & Scoring

### DAP-001: GCP Event Ingestion Pipeline

**User Story:** As a data engineer, I want SDUI interaction events to flow into GCP BigQuery via Pub/Sub and Dataflow so overseas customer behaviour is available for content scoring.

**Acceptance Criteria:**
- `POST /dap/v1/events` accepts event batch; publishes to `dap-events-raw` Pub/Sub topic
- Dataflow enriches (adds sessionId, resolves UCID) and writes to `dap.clickstream_events`
- Table partitioned by `event_date`, clustered by `userId_hash`
- End-to-end latency < 30 seconds p95
- Cloud DLP masks any accidental PII in stream

**Story Points:** 13 | **Dependencies:** None

---

### DAP-002: Content Performance Score Job

**User Story:** As a DAP engineer, I want a scheduled job computing CPS for every content piece every 6 hours so editors always have a fresh performance score.

**Acceptance Criteria:**
- Cloud Composer job runs every 6 hours
- Joins: clickstream, conversions, NPS surveys, AEO probe results, app store sentiment on `contentId`
- Writes to `dap.content_performance_scores` with score, band, trend vs previous run
- Job completes < 30 minutes for full catalogue
- Anomaly: flags content where CPS drops > 20 pts between runs

**Story Points:** 13 | **Dependencies:** DAP-001

---

## EPIC 6: AEO Monitoring

### AEO-001: Daily LLM Citation Probe Job

**User Story:** As an SEO analyst, I want a daily automated job querying ChatGPT and Perplexity with banking queries so I know HSBC's LLM citation share without manual testing.

**Acceptance Criteria:**
- Queries OpenAI gpt-4o + Perplexity sonar-pro daily at 03:00 HKT
- Response parser extracts: hsbc_mentioned, hsbc_cited, citation_url, competitor_cited, position
- Results stored in `dap.aeo_probe_results`
- Probe bank managed via BigQuery table (no code change to add queries)
- Citation share drop > 10% WoW → Slack alert

**Story Points:** 8 | **Dependencies:** DAP-001

---

### AEO-002: AEO Health Score per Content Page

**User Story:** As a content editor, I want an AEO Health Score (0–100) shown in the CMS for each product page so I know which pages need AEO improvement.

**Acceptance Criteria:**
- Score computed on save/preview
- Criteria: FAQPage schema (+20), FinancialProduct schema (+20), reviewed date < 30d (+15), author credentials (+10), regulatory reference (+10), structured rate field (+10), answer in first 60 words (+10), cited by LLM (+5)
- Displayed as badge: A/B/C/D/F
- Clicking badge opens per-criterion breakdown
- Written to CMS metadata for Feedback Loop

**Story Points:** 8 | **Dependencies:** UCP-005, AEO-001

---

## EPIC 7: Closed Feedback Loop

### LOOP-001: CPS Score Badge in CMS

**User Story:** As a content editor, I want a performance band badge next to every CMS content entry so I can instantly spot underperforming content.

**Acceptance Criteria:**
- List view shows: 🟢 STAR / 🟡 GOOD / 🟠 REVIEW / 🔴 URGENT per entry
- Badge sourced from `dap.content_performance_scores` via Feedback Loop API
- Refreshed every 6 hours
- Clicking badge opens score detail with signal breakdown and trend
- "Show URGENT only" filter available

**Story Points:** 8 | **Dependencies:** DAP-002

---

### LOOP-002: Actionable Recommendations per Content Piece

**User Story:** As a content editor, I want to see specific actionable recommendations for underperforming content so I know exactly what to fix.

**Acceptance Criteria:**
- REVIEW/URGENT entries show up to 3 plain-English recommendations
- Recommendation types: low CTR (suggest CTA copy), missing FAQ schema (link to guide), competitor cited (suggest schema uplift)
- Editor can mark "Done" or "Won't Fix" (14-day snooze)
- Recommendations not re-shown while snoozed

**Story Points:** 8 | **Dependencies:** LOOP-001, AEO-002

---

### LOOP-003: Slack and Email Alerts

**User Story:** As a content editor, I want Slack alerts when my content drops to URGENT so I can act quickly without checking the CMS constantly.

**Acceptance Criteria:**
- Slack webhook fires within 15 minutes of anomaly
- Alert includes: content title, CPS, trigger reason, direct CMS link
- Weekly Monday 09:00 HKT email digest: leaderboard + URGENT items
- Alerts scoped to content owned by editor
- Editor can opt out of Slack (not email digest)

**Story Points:** 5 | **Dependencies:** LOOP-001

---

### LOOP-004: A/B Test Winner Notification

**User Story:** As a growth manager, I want an in-CMS notification when an A/B test reaches a winner so I can promote it immediately.

**Acceptance Criteria:**
- Notification appears when: 95% confidence + 7-day run + 1,000 impressions per variant
- Shows: winning variant, CTR lift %, confidence, sample sizes
- [Promote Winner] updates Optimizely to 100% + archives experiment
- [Extend Test] resets significance clock
- Actions logged with editor name and timestamp

**Story Points:** 8 | **Dependencies:** DAP-002

