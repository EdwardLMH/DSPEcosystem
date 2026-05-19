# Observability and Monitoring — OpenTelemetry, Dashboards and Synthetic Checks

**Document Version:** 1.0  
**Date:** 2026-05-20  
**Scope:** End-to-end service availability monitoring from mobile/web clients through Kong, BFF/API services, Redis, database, search, object storage/CDN and event ingestion across AWS overseas environments and mainland China IKP/Alicloud/Tencent environments.

---

## 1. Goals

Adopt **OpenTelemetry (OTel)** as the common telemetry standard across DSPE so operators can answer:

1. Can customers open the app/web Home Hub right now?
2. Can customers search, tap a result and reach the right app/content destination?
3. Is the SDUI runtime healthy across CDN, gateway, BFF, cache and database?
4. Are staff functions such as OCDP/UCP authoring, approval and publish available?
5. Which site/cell is failing: client, edge, Kong, API, cache, database, object store or data pipeline?

The monitoring model separates:

| Layer | Purpose |
|-------|---------|
| Real User Monitoring (RUM) | Actual mobile/web availability and latency from customer devices |
| Distributed tracing | Request path correlation across client, Kong, BFF, DB/cache/search and downstream services |
| Metrics | Service-level health, SLOs, saturation and error rates |
| Logs | Detailed failure records with trace IDs |
| Synthetic checks | Controlled probes for critical journeys and regional/site-switch readiness |

---

## 1.1 Ecosystem Highlight and Architecture Principle

End-to-end observability, app performance monitoring, high availability and safe CI/CD are core DSPE architecture principles and customer-facing ecosystem highlights. They should be positioned alongside rapid SDUI publishing, AI discoverability, personalisation and governance because they prove DSPE can operate as a production banking platform, not only as an authoring tool.

| Selling point | Architecture principle | Evidence in DSPE |
|---------------|------------------------|------------------|
| End-to-end observability | Trace customer journeys from mobile/web to backend API, cache, database, search, object storage and analytics ingestion. | `traceparent` propagation, OTel collectors, journey dashboards, service map, synthetic checks and deploy annotations. |
| App performance monitoring | Treat startup and Home Hub interactivity as explicit product SLOs across iOS, Android, HarmonyOS NEXT and Web. | Cold/warm startup spans, Home fetch/parse/render timings and platform startup SLO matrix. |
| High availability | Design public runtime paths for graceful degradation, regional/cell visibility and controlled site switch. | CDN/object fallback, BFF stale-cache behaviour, multi-cell AWS and China runtime probes, error-budget alerts. |
| Good CI/CD | Make every deploy validated, approved, traceable and reversible across overseas AWS and mainland China IKP/Alicloud/Tencent. | Jenkins build/deploy/restart/site-switch actions, China runtime/static publish flows, deploy markers on dashboards. |

### Key SLO Summary

| Capability | SLO / Target |
|------------|--------------|
| Home Hub API availability | 99.95% monthly |
| AI Search availability | 99.9% monthly |
| KYC API availability | 99.9% monthly |
| Event ingestion availability | 99.9% monthly |
| OCDP / UCP staff authoring availability | 99.5% monthly |
| Static SDUI JSON availability | 99.99% target through object storage + CDN fallback |
| Publish completion | p95 < 60 seconds for normal publish and cache/CDN refresh |
| Home Hub API latency | p95 < 500 ms |
| AI Search latency | p95 < 700 ms |
| Event ingestion latency | p95 < 300 ms |

### Cold and Warm Startup Matrix

| Platform | Cold startup p95 | Warm startup p95 | Home interactive p95 |
|----------|------------------|------------------|---------------------|
| iOS SwiftUI | < 3.0 s | < 1.2 s | < 2.5 s |
| Android Compose | < 3.5 s | < 1.4 s | < 2.8 s |
| HarmonyOS NEXT ArkUI | < 3.5 s | < 1.4 s | < 2.8 s |
| Web / WeChat H5 | n/a | n/a | < 2.5 s on 4G baseline |

---

## 2. End-to-End Trace Model

```
Mobile / Web Client
  ├─ OTel client span: home_hub_open / ai_search_query / kyc_step_submit
  ├─ W3C traceparent header
  ▼
Edge CDN / WAF
  ├─ AWS: CloudFront / WAF
  ├─ Mainland China: Tencent CDN / WAF / Anti-DDoS
  ├─ edge logs with trace ID header pass-through where supported
  ▼
Kong External / Internal Gateway
  ├─ gateway span: route, auth, rate-limit, upstream latency
  ▼
BFF / CMS API / Search API
  ├─ API span: controller, validation, personalization, search ranking
  ├─ Redis span: get/set/cache miss
  ├─ database span: SQL statement class, latency, row count
  ├─ search span: index/query latency
  └─ object-store span: manifest/screen/media fetch or publish write
  ▼
DAP / Event Ingestion
  └─ async span/link: event accepted, stream write, S3 landing
```

Mainland China keeps telemetry inside China-resident systems:

```text
HarmonyNext / iOS / Android / Web / WeChat H5
  → Tencent CDN / WAF
  → Kong external on IKP ZHJ or NHC
  → SDUI API / AI Search / Event facade on IKP
  ├→ China Redis / search / runtime artifact store
  └→ SensorData event collection

Staff network
  → Alicloud private Kong internal
  → UCP / OCDP / CMS API / authoring DB
  → publish bridge to Tencent COS/CDN
```

Do not export user-level traces, raw behavioural events or device identifiers outside mainland China. Overseas dashboards may consume only approved aggregate SLOs and anonymised incident signals.

Use W3C Trace Context:

| Header | Rule |
|--------|------|
| `traceparent` | Propagate from web/mobile to gateway to all services |
| `tracestate` | Optional vendor-specific state |
| `x-request-id` | Generated at edge if missing; copied into logs and response headers |
| `x-user-segment` | Low-cardinality only, e.g. `premier`, `elite`, `mass`; no PII |
| `x-platform` | `ios`, `android`, `harmonynext`, `web` |
| `x-market` | `HK`, `SG`, `CN`, etc. |

PII rule: never put customer names, account numbers, card numbers, raw access tokens, free-text queries containing personal data, or UCID in span names or high-cardinality attributes. Hash or bucket where needed.

---

## 3. OpenTelemetry Instrumentation Plan

| Component | Telemetry | Instrumentation |
|-----------|-----------|-----------------|
| Web SDUI | RUM traces, web vitals, search/home/kyc events | OTel JS browser SDK + custom spans around screen fetch, search and action handling |
| iOS SDUI | RUM traces, network spans, app lifecycle | OTel Swift SDK or vendor RUM SDK with W3C header injection |
| Android SDUI | RUM traces, network spans, app lifecycle | OTel Android/Kotlin SDK or vendor RUM SDK with W3C header injection |
| HarmonyNext SDUI | RUM-like custom events, trace IDs, cold/warm startup step timings | Lightweight trace ID generation, `traceparent` header injection and SensorData/OTel bridge until native OTel is available |
| CloudFront/WAF | edge logs, availability, 4xx/5xx, origin latency | CloudFront standard/real-time logs to Kinesis/S3 + trace header allow-list |
| Tencent CDN/WAF | China edge availability, 4xx/5xx, origin latency, purge health | Tencent CDN/COS logs retained in China; trace/request ID pass-through where supported |
| Kong | route spans, upstream latency, auth/rate-limit errors | Kong OpenTelemetry plugin exporting OTLP |
| BFF Java | HTTP/server/client spans, Redis, DB, OpenSearch | OTel Java agent with Spring WebFlux, JDBC/R2DBC, Redis instrumentation |
| mock-BFF | local/dev traces | OTel Node SDK when promoted beyond local mock |
| OCDP/UCP consoles | staff RUM, API traces | OTel JS browser SDK; staff actions include workflow IDs, not PII |
| CMS API | authoring workflow traces | OTel Java/Node instrumentation |
| Redis | cache latency/saturation | AWS ElastiCache or China Redis metrics + client spans |
| Database | DB latency, connection saturation | AWS Aurora or China-resident PostgreSQL-compatible metrics + SQL client spans with sanitized statements |
| Search | search latency/errors | AWS OpenSearch or China-resident search metrics + client spans |
| Object/CDN static | object availability, manifest latency | AWS S3/CloudFront or Tencent COS/CDN metrics + synthetic checks |
| DAP/SensorData ingestion | event acceptance and lag | AWS Kinesis/Firehose span links overseas; SensorData operational events in mainland China |

Recommended collector pattern:

```
App / Kong / Services
  → OTLP gRPC/HTTP
  → OpenTelemetry Collector DaemonSet in EKS or IKP
  → tail sampling + attribute filtering
  → AWS: CloudWatch / X-Ray / Amazon Managed Prometheus / Datadog / OpenSearch
  → Mainland China: China-resident APM/log/metrics backend plus SensorData operational bridge
```

### Mobile and Web Client Enhancements

Yes, the mobile sites and native clients need small observability enhancements to support true end-to-end tracing. Each renderer should generate or continue a trace when the app starts, inject `traceparent` on SDUI/search/KYC/event calls, and record startup spans before Home Hub is interactive.

Required client spans:

| Span | Applies to | Purpose |
|------|------------|---------|
| `app.start.cold` | iOS, Android, HarmonyNext | process launch to first visible frame |
| `app.start.warm` | iOS, Android, HarmonyNext | background resume to first interactive Home state |
| `web.app.load` | Web SDUI, WeChat H5 | navigation start to Home interactive |
| `sdui.bootstrap` | all clients | config load, feature flags, locale and segment context preparation |
| `sdui.manifest.fetch` | all clients | remote manifest fetch or local fallback |
| `sdui.screen.fetch` | all clients | `GET /api/v1/screen/{screenId}` latency and result source |
| `sdui.screen.parse` | all clients | JSON decode and schema validation |
| `sdui.component.render` | all clients | first Home Hub content render and component error count |
| `ai_search.query` | all clients | search request, ranking latency and result count bucket |
| `kyc.step.submit` | all clients | KYC step API latency and next-step render time |

Startup step metrics:

| Step metric | Description |
|-------------|-------------|
| `startup.process_to_first_frame_ms` | native process start to first frame |
| `startup.first_frame_to_home_fetch_ms` | first frame to SDUI Home request start |
| `startup.home_fetch_ms` | Home SDUI API/network latency |
| `startup.home_parse_ms` | JSON parse and validation time |
| `startup.registry_init_ms` | component registry setup time |
| `startup.home_render_ms` | Home component render time |
| `startup.home_interactive_ms` | launch/resume to first tappable Home Hub state |

Recommended startup SLOs:

| Platform | Cold startup p95 | Warm startup p95 | Home interactive p95 |
|----------|------------------|------------------|---------------------|
| iOS | < 3.0 s | < 1.2 s | < 2.5 s |
| Android | < 3.5 s | < 1.4 s | < 2.8 s |
| HarmonyNext | < 3.5 s | < 1.4 s | < 2.8 s |
| Web / WeChat H5 | n/a | n/a | < 2.5 s on 4G baseline |

HarmonyNext should instrument ArkUI lifecycle boundaries such as `Ability.onCreate`, `UIAbility.onWindowStageCreate`, page `aboutToAppear`, SDUI fetch, parse and first content render. Until native OTel support is standardised, emit SensorData operational events with `trace_id`, `span_id`, `parent_span_id`, `duration_ms`, `startup_type` and `screen_id`, then bridge those events into the China-resident observability backend.

---

## 4. Monitoring Matrix

### Customer Runtime

| Journey | Entry point | Success signal | Latency SLO | Availability SLO | Key dependencies |
|---------|-------------|----------------|-------------|------------------|------------------|
| Home Hub open | `/api/v1/screen/home-hub-hk` | 200 + valid SDUI JSON with `HOME_SEARCH_HEADER` | p95 < 500 ms API, p95 < 2.0 s client visible | 99.95% monthly | CloudFront, Kong, BFF, Redis, S3 static fallback |
| AI Search | `POST /api/v1/search` | 200 + `totalMatched`/A2UI results contract | p95 < 700 ms | 99.9% monthly | Kong, BFF, OpenSearch/local index, rules engine |
| AI Search governed asset result | search + result tap | Eligible profile sees asset result; ineligible profile does not | p95 < 900 ms | 99.9% monthly | BFF rules, OpenSearch, asset CDN |
| KYC start | `POST /api/v1/kyc/sessions/start` | session ID returned | p95 < 800 ms | 99.9% monthly | Kong, BFF/KYC service, Aurora |
| KYC resume/step submit | `/api/v1/kyc/sessions/*` | step accepted, next step returned | p95 < 1.0 s | 99.9% monthly | BFF/KYC, Aurora, external KYC integrations |
| FX Viewpoint | `/api/v1/screen/fx-viewpoint-hk` + video URL | page JSON + video first byte | p95 < 600 ms JSON, video TTFB < 1.5 s | 99.9% monthly | BFF, S3/media CDN |
| DAP event ingestion | `POST /api/v1/events` | 202/200 accepted and stream lag normal | p95 < 300 ms | 99.9% monthly | Kong, event API, Kinesis/Firehose, S3 |
| App cold startup | native launch | first Home Hub frame rendered and interactive | p95 per platform table | 99.5% monthly | client startup, manifest, SDUI API, CDN/cache |
| App warm startup | native resume | existing or refreshed Home Hub interactive | p95 per platform table | 99.5% monthly | client cache, manifest, SDUI API |

### Staff Authoring

| Journey | Entry point | Success signal | Latency SLO | Availability SLO | Key dependencies |
|---------|-------------|----------------|-------------|------------------|------------------|
| OCDP console load | staff URL | shell loads and API health check passes | p95 < 3 s | 99.5% monthly | Staff edge/VPN, S3/CloudFront or EKS, CMS API |
| UCP console load | staff URL | shell loads and content list returns | p95 < 3 s | 99.5% monthly | Staff edge/VPN, CMS API, Aurora |
| Page save | CMS API page save | 200 + audit entry | p95 < 1 s | 99.5% monthly | CMS API, Aurora, audit log |
| Maker-checker approve | workflow approve API | status moves to APPROVED | p95 < 1 s | 99.5% monthly | CMS API, Aurora, AD/RBAC |
| Publish SDUI | publish API/job | manifest version updates and BFF cache flushes | p95 < 60 s publish complete | 99.5% monthly | CMS API, S3, CloudFront invalidation, Redis |
| AI Search rebuild | `/api/v1/search/config/{id}/rebuild` | corpus size updated | p95 < 60 s for normal corpus | 99.5% monthly | CMS API/BFF, AEM, OpenSearch/index store |

### Platform Dependencies

| Dependency | Golden signals | Alert threshold |
|------------|----------------|-----------------|
| Kong external | route p95, 5xx, upstream errors, auth rejects | 5xx > 0.1% for 5 min |
| Kong internal | p95, 5xx, staff auth rejects | 5xx > 0.5% for 10 min |
| BFF Java | RPS, p95/p99, 5xx, CPU/memory, pod restarts | p95 > 500 ms or 5xx > 0.1% |
| CMS API | p95/p99, 5xx, DB wait time | p95 > 1 s or DB wait > 200 ms |
| Aurora | CPU, ACU, connections, deadlocks, commit latency | CPU > 75%, connections > 80%, deadlock any sustained |
| Redis | CPU, memory, evictions, get/set latency | memory > 80%, evictions > 0 |
| OpenSearch | search p95, indexing lag, rejected requests | p95 > 500 ms, rejections > 0 |
| S3 SDUI bucket | 4xx/5xx, GET latency, replication lag | 5xx > 0, replication lag > 5 min |
| CloudFront | edge 5xx, origin 5xx, cache hit ratio | origin 5xx > 0.1%, hit ratio drops 20% |
| Kinesis/Firehose | iterator age, delivery failures | iterator age > 120 s, delivery failure any sustained |
| Tencent COS/CDN | object 4xx/5xx, origin latency, purge success, cache hit ratio | 5xx > 0.1%, purge failure any sustained |
| IKP runtime | pod restarts, route p95, node saturation, zone health | route 5xx > 0.1%, pending pods for 5 min |
| Alicloud private authoring | CMS API p95, DB wait, Redis health, staff ingress health | staff API p95 > 1 s or private probe fails |
| SensorData | event acceptance, SDK upload failures, processing lag | upload failure sustained or lag > agreed SLA |

---

## 5. Dashboard Design

### Dashboard 1 — Executive Availability

Audience: senior operators, incident commander.

Tiles:

| Tile | Display |
|------|---------|
| Overall customer availability | weighted SLO for Home Hub, Search, KYC, Events |
| Current active site/cell | AWS HK/SG cells and China ZHJ/NHC cells |
| Error budget burn | 1h, 6h, 30d |
| Top failing journey | Home, Search, KYC, Publish |
| Synthetic status map | HK, SG, overseas probe regions, mainland China ZHJ/NHC/private probes |
| Recent deploy marker | Jenkins release tag and time |

### Dashboard 2 — Customer Journey E2E

Rows:

| Row | Charts |
|-----|--------|
| Home Hub | synthetic pass rate, RUM p75/p95, BFF p95, JSON validation failures |
| AI Search | query latency, result count distribution, zero-result rate, governed result deny/allow count |
| KYC | start success, step submit success, funnel drop-off, DB latency |
| FX/media | page JSON latency, video TTFB, media CDN 4xx/5xx |
| Event ingestion | accepted events, ingestion lag, delivery failure |

### Dashboard 3 — Service Map

Show service dependency graph:

```text
web/ios/android/harmonynext
  → CloudFront/WAF or Tencent CDN/WAF
  → Kong external
  → BFF Java / SDUI API
  ├→ Redis
  ├→ Aurora or China DB
  ├→ OpenSearch or China search
  ├→ S3 or Tencent COS media / SDUI JSON
  └→ DAP/SensorData event facade
```

Every edge should show p95 latency, error rate and throughput.

### Dashboard 4 — Staff Plane

Tiles:

| Tile | Signal |
|------|--------|
| OCDP availability | console synthetic + CMS API health |
| UCP availability | console synthetic + content API health |
| Save/approval latency | CMS API traces |
| Publish success rate | publish worker metrics |
| AI Search rebuild | corpus rebuild latency and failures |
| Audit write health | audit table insert errors and hash-chain failures |

### Dashboard 5 — Infrastructure Saturation

Tiles:

| Tile | Signal |
|------|--------|
| EKS node/pod saturation | CPU, memory, pending pods, restarts |
| EKS/IKP node/pod saturation | CPU, memory, pending pods, restarts, zone health |
| Aurora / China DB | CPU, ACU/connections, query latency |
| Redis | memory, evictions, CPU |
| OpenSearch | search latency, rejections, index health |
| CloudFront/Kong | edge/origin errors, upstream latency |
| CloudFront/Tencent CDN/Kong | edge/origin errors, upstream latency, purge health |
| Kinesis/Firehose/SensorData | lag, delivery failures |

---

## 6. Synthetic Checks

Run synthetics from at least:

| Probe location | Purpose |
|----------------|---------|
| Hong Kong | primary market and primary region path |
| Singapore | regional failover/tertiary cell readiness |
| Tokyo or Seoul | nearby ASP customer experience |
| London or Frankfurt | global customer baseline |
| Mainland China ZHJ | primary China runtime path through Tencent CDN and IKP |
| Mainland China NHC | China runtime failover path |
| Alicloud private probe | UCP/OCDP/CMS private authoring health |

### Synthetic Check Matrix

| Check ID | Frequency | Steps | Expected result | Severity |
|----------|-----------|-------|-----------------|----------|
| `syn-edge-health` | 1 min | `GET /status` or Kong health route | 200 | P1 |
| `syn-bff-health` | 1 min | `GET /health` via public gateway | 200 + version | P1 |
| `syn-home-hub-json` | 1 min | `GET /api/v1/screen/home-hub-hk` | 200 + JSON has `layout.children[0].type=HOME_SEARCH_HEADER` | P1 |
| `syn-search-premier` | 1 min | `POST /api/v1/search` with Premier HK wealth profile | 200 + at least 1 result for `wealth studio video` | P1 |
| `syn-search-ineligible` | 5 min | same query with mass/current/HK profile | 200 + no restricted Premier asset result | P2 |
| `syn-search-corpus` | 5 min | `GET /api/v1/search/corpus?appId=harmonynext` | 200 + corpus size > 0 after rebuild | P2 |
| `syn-kyc-start` | 2 min | `POST /api/v1/kyc/sessions/start` | session ID returned | P1 |
| `syn-fx-viewpoint` | 2 min | `GET /api/v1/screen/fx-viewpoint-hk` | 200 + video component present | P2 |
| `syn-media-video` | 5 min | `HEAD/GET` FX video URL first byte | 200/206 + TTFB < 1.5 s | P2 |
| `syn-event-ingest` | 2 min | `POST /api/v1/events` with synthetic event flag | 200/202 | P1 |
| `syn-ocdp-staff` | 5 min | staff URL load + API health from private probe | 200 | P2 |
| `syn-ucp-staff` | 5 min | staff URL load + content API health from private probe | 200 | P2 |
| `syn-publish-smoke` | on deploy | publish non-customer test page to testing | manifest version updates | P2 |
| `syn-cn-cos-manifest` | 2 min | `GET` Tencent CDN manifest/page JSON | 200 + valid version | P1 |
| `syn-cn-ikp-api` | 1 min | `GET /health` through Tencent CDN/WAF to IKP Kong | 200 + version | P1 |
| `syn-cn-sensordata` | 5 min | send operational synthetic event | accepted by SensorData test project | P2 |

Synthetic events must include:

```json
{
  "synthetic": true,
  "probeId": "syn-search-premier",
  "market": "HK",
  "platform": "web",
  "release": "<jenkins-release-tag>"
}
```

DAP must filter synthetic events from business dashboards but retain them in operational dashboards.

---

## 7. Example Synthetic Payloads

### Home Hub JSON

```bash
curl -sS https://sdui.example.com/api/v1/screen/home-hub-hk \
  -H 'x-platform: web' \
  -H 'x-market: HK' \
  -H 'traceparent: 00-<trace-id>-<span-id>-01'
```

Validate:

```text
status == 200
json.layout.children[0].type == HOME_SEARCH_HEADER
json.metadata.channel == SDUI
```

### AI Search Premier Eligible

```bash
curl -sS -X POST https://sdui.example.com/api/v1/search \
  -H 'Content-Type: application/json' \
  -H 'x-platform: harmonynext' \
  -d '{
    "query": "wealth studio video",
    "appId": "harmonynext",
    "responseMode": "a2ui",
    "customerSegment": "premier",
    "accountType": "wealth_account",
    "customerLocation": "HK",
    "synthetic": true
  }'
```

Validate:

```text
status == 200
json.totalMatched >= 1
one result contains title or category related to wealth/video
```

### AI Search Ineligible

```bash
curl -sS -X POST https://sdui.example.com/api/v1/search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "wealth studio video",
    "appId": "harmonynext",
    "responseMode": "a2ui",
    "customerSegment": "mass",
    "accountType": "current_account",
    "customerLocation": "HK",
    "synthetic": true
  }'
```

Validate:

```text
status == 200
no result has assetType=video for Premier/Elite restricted asset source
```

---

## 8. Alerting Policy

### Page Rules

| Alert | Trigger | Page |
|-------|---------|------|
| Customer runtime down | `syn-home-hub-json` fails 2 of 3 probes | P1 |
| Search unavailable | `syn-search-premier` fails 2 of 3 probes or BFF search 5xx > 0.1% | P1 |
| KYC unavailable | `syn-kyc-start` fails 2 of 3 probes | P1 |
| Event ingestion unavailable | `syn-event-ingest` fails 2 of 3 probes | P1 |
| Staff authoring unavailable | OCDP and UCP private probes fail for 10 min | P2 |
| DB saturation | Aurora CPU > 75% or connections > 80% for 10 min | P2, P1 if customer errors rising |
| Redis evictions | evictions > 0 for 5 min | P2 |
| OpenSearch rejections | rejected requests > 0 for 5 min | P2 |
| Error budget burn | 1h burn rate > 14x or 6h burn rate > 6x | P1/P2 depending service |

### Deploy Annotations

Every Jenkins deployment should emit:

| Field | Value |
|-------|-------|
| `release.tag` | Jenkins `IMAGE_TAG` or Git SHA |
| `deployment.environment` | `testing-ap-east-1`, `prod-ap-east-1`, etc. |
| `deployment.platform` | `aws`, `mainland-china` |
| `deployment.action` | `deploy`, `restart`, `site-switch` |
| `deployment.actor` | Jenkins user/service account |

Dashboards should overlay these markers on latency/error charts.

---

## 9. OTel Semantic Attributes

Use low-cardinality attributes:

| Attribute | Example |
|-----------|---------|
| `service.name` | `bff-java`, `ocdp-console`, `web-sdui` |
| `deployment.environment` | `prod-ap-east-1` |
| `cloud.region` | `ap-east-1` |
| `cloud.provider` | `aws`, `ikp`, `alicloud`, `tencent` |
| `dsp.market` | `HK` |
| `dsp.platform` | `ios`, `android`, `harmonynext`, `web` |
| `dsp.channel` | `SDUI`, `WEB_STANDARD`, `WEB_WECHAT` |
| `dsp.page_id` | `home-hub-hk` |
| `dsp.screen` | `home_hub_hk` |
| `dsp.journey_id` | `obkyc-journey` |
| `dsp.customer_segment` | `premier`, `elite`, `mass` |
| `dsp.account_type` | `wealth_account`, `credit_card` |
| `dsp.location` | `HK`, `SG` |
| `dsp.synthetic` | `true`, `false` |
| `app.startup.type` | `cold`, `warm`, `web_navigation` |
| `app.launch.source` | `icon`, `deeplink`, `push`, `resume` |
| `sdui.resolution_source` | `remote_manifest`, `local_storage`, `bundled_baseline` |
| `sdui.step_index` | low-cardinality journey step number |

Avoid high-cardinality span names. Use:

```text
GET /api/v1/screen/{screenId}
POST /api/v1/search
POST /api/v1/kyc/sessions/{sessionId}/steps/{stepId}/submit
```

not raw URLs with user-specific IDs in the span name.

---

## 10. Rollout Plan

| Phase | Scope | Exit criteria |
|-------|-------|---------------|
| 1 | OTel collector in Testing EKS; Kong + BFF traces | Traces visible from gateway to BFF |
| 2 | Web SDUI RUM + synthetic checks | Home/Search/KYC synthetics stable for 7 days |
| 3 | Aurora/Redis/OpenSearch metrics and DB spans | Service map shows API → DB/cache/search dependencies |
| 4 | iOS/Android/HarmonyNext trace propagation | Mobile traces correlated to backend traces |
| 5 | Production dashboards and alerting | Error-budget and P1/P2 alerts tested |
| 6 | Site-switch monitoring | primary/secondary probes prove switch and rollback |
| 7 | Mainland China IKP/Alicloud/Tencent observability | China probes, SensorData bridge and region-local dashboards prove ZHJ/NHC and private authoring paths |

---

## 11. Synthetic Implementation Options

| Environment | Option | Use |
|-------------|--------|-----|
| AWS | CloudWatch Synthetics canaries | Basic HTTP/API and browser checks; integrates with CloudWatch alarms |
| AWS | Lambda scheduled probes | Custom JSON validation and private endpoint checks through VPC |
| AWS or China | Grafana synthetic monitoring | If adopting Grafana/Tempo in the target region |
| AWS or China | Datadog Synthetics | Only where approved by data residency and network policy |
| Mainland China | IKP CronJob probes | Public runtime and Kong checks from ZHJ/NHC clusters |
| Mainland China | Alicloud private scheduled probes | UCP/OCDP/CMS private health and publish bridge checks |
| Mainland China | Tencent CDN/COS health checks | Static manifest, page JSON, media URL and CDN purge verification |

Recommended first implementation:

1. AWS: CloudWatch Synthetics for public runtime checks.
2. AWS: VPC Lambda probes for staff/private OCDP/UCP checks.
3. Mainland China: IKP CronJob probes for public runtime and Alicloud private probes for staff authoring.
4. Mainland China: Tencent CDN/COS manifest and media checks plus SensorData operational event checks.
5. OTel collectors exporting traces to the approved region-local APM backend.
6. Route alerts to the enterprise incident channel with deploy markers from Jenkins.
