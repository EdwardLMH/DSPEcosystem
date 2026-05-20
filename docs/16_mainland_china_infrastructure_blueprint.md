# Mainland China Infrastructure Blueprint — UCP, OCDP, SDUI and DAP

**Document Version:** 1.0  
**Date:** 2026-05-19  
**Scope:** Mainland China deployment for UCP, OCDP, public SDUI runtime, Web SDUI, WeChat delivery and China-resident analytics  
**Runtime Sites:** IKP on GKE in ZHJ and NHC  
**Private Authoring Sites:** Alicloud on-prem private cloud, two private Availability Zones  
**Public Edge:** Tencent CDN, Tencent COS and Kong external API gateway  
**Market Coverage:** Mainland China only. Overseas ASP markets use the AWS blueprint in `docs/15_aws_infrastructure_blueprint.md`.

---

## 1. Deployment Goals

Mainland China uses a split architecture because the public SDUI runtime must be internet-facing, while UCP and OCDP should stay in the Alicloud on-prem private cloud.

| Platform | Mainland China deployment purpose |
|----------|-----------------------------------|
| UCP | Private content asset library, component registry, legal/compliance workflow |
| OCDP | Private page/journey authoring, approval, preview, AI Search admin and publish workflow |
| SDUI API | Public SDUI JSON delivery, AI Search, personalisation, A/B routing and event facade |
| Static SDUI | Approved JSON, HTML, JS, media and manifest files served from Tencent COS through Tencent CDN |
| Kong | External API protection for public SDUI APIs; internal API protection inside private authoring plane where required |
| DAP China | SensorData-based behaviour tracking, DAU/MAU, conversion rate and click-rate reporting inside mainland China |

The recommended path is:

1. Keep UCP and OCDP private in Alicloud on-prem private cloud across two private AZs.
2. Publish only approved, immutable SDUI artifacts from OCDP to Tencent COS and the SDUI API runtime.
3. Run public SDUI API pods in IKP on GKE in ZHJ and NHC.
4. Put Kong external in front of all public APIs before requests reach SDUI API services.
5. Serve static JSON, HTML, JS and media through Tencent CDN backed by Tencent COS.
6. Keep SensorData as the only behaviour analytics path for mainland China user behaviour.
7. Move only aggregated, anonymised operational metrics outside China if compliance approval allows it.

---

## 2. High-Level Mainland China Diagram

```
                    ┌────────────────────────────────────────────┐
                    │ China public FQDNs                         │
                    │ sdui-cn.example.cn                         │
                    │ web-cn.example.cn                          │
                    │ api-cn.example.cn                          │
                    └──────────────────────┬─────────────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │ Tencent CDN + WAF/DDoS  │
                              │ TLS, cache, ICP domain   │
                              └────────────┬────────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 │                                                   │
                 ▼                                                   ▼
        ┌─────────────────┐                                ┌──────────────────┐
        │ Tencent COS      │                                │ Kong external     │
        │ SDUI JSON/media  │                                │ public API policy │
        │ HTML/JS/manifest │                                └────────┬─────────┘
        └─────────────────┘                                         │
                                                                    ▼
                                      ┌────────────────────────────────────────┐
                                      │ IKP runtime plane on GKE               │
                                      │                                        │
                                      │ ┌──────────────┐  ┌──────────────┐     │
                                      │ │ ZHJ runtime  │  │ NHC runtime  │     │
                                      │ │ cell         │  │ cell         │     │
                                      │ │ - SDUI API   │  │ - SDUI API   │     │
                                      │ │ - AI Search  │  │ - AI Search  │     │
                                      │ │ - Kong DP    │  │ - Kong DP    │     │
                                      │ │ - Redis      │  │ - Redis      │     │
                                      │ └──────┬───────┘  └──────┬───────┘     │
                                      └────────┼─────────────────┼────────────┘
                                               │                 │
                                               │ publish/runtime │
                                               │ sync            │
                                               ▼                 ▼
        ┌─────────────────────────────────────────────────────────────────────┐
        │ Alicloud on-prem private cloud                                      │
        │                                                                     │
        │ ┌──────────────────────┐        ┌──────────────────────┐            │
        │ │ Private AZ1          │        │ Private AZ2          │            │
        │ │ - OCDP console       │        │ - OCDP warm/active   │            │
        │ │ - UCP console        │        │ - UCP warm/active    │            │
        │ │ - CMS API            │        │ - CMS API            │            │
        │ │ - Kong internal      │        │ - Kong internal      │            │
        │ │ - authoring DB       │◄──────►│ - authoring DB DR    │            │
        │ └──────────┬───────────┘ async  └──────────┬───────────┘            │
        │            │ publish/export job             │                        │
        └────────────┼────────────────────────────────┼────────────────────────┘
                     │                                │
                     ▼                                ▼
          Tencent COS object publish          SensorData China endpoint
          CDN purge / manifest update         DAU, MAU, clicks, conversion
```

This keeps the external-facing surface small: Tencent CDN/COS for static delivery and Kong external plus IKP for APIs. UCP/OCDP remain private and are not internet-facing.

---

## 3. Cell Model and Availability Modes

### 3.1 Public SDUI Runtime

| Runtime cell | Location | Default role | Internet-facing? |
|--------------|----------|--------------|------------------|
| CN Runtime 1 | ZHJ IKP on GKE | Primary SDUI API runtime | Yes, through Tencent CDN/Kong |
| CN Runtime 2 | NHC IKP on GKE | Backup or active peer SDUI API runtime | Yes, through Tencent CDN/Kong |

| Mode | ZHJ | NHC | Use case |
|------|-----|-----|----------|
| `single-site` | active | disabled | low-cost testing |
| `hot-warm` | active | warm standby | production launch with controlled failover |
| `hot-hot` | active | active | high-availability public runtime |

### 3.2 Private UCP/OCDP Authoring Plane

| Private cell | Location | Default role | Internet-facing? |
|--------------|----------|--------------|------------------|
| Private AZ1 | Alicloud on-prem private cloud | Primary UCP/OCDP authoring | No |
| Private AZ2 | Alicloud on-prem private cloud | Warm standby or active peer | No |

| Mode | Private AZ1 | Private AZ2 | Use case |
|------|-------------|-------------|----------|
| `single-site` | active | disabled | testing or early pilot |
| `hot-warm` | active | warm standby | preferred production baseline |
| `hot-hot` | active | active | higher staff-plane resilience |

Staff sessions can be region/AZ sticky. UCP/OCDP do not need real-time bidirectional sync for draft pages, component metadata or audit search views. Approved publish artifacts are the critical path and should be exported to Tencent COS and runtime caches with stricter monitoring.

---

## 4. Public Delivery Flow

### 4.1 Static SDUI JSON, Web and WeChat Assets

```
iOS / Android / Harmony / Web / WeChat
        │
        ▼
Tencent CDN
        │
        ▼
Tencent COS
        │
        ▼
manifest.json / screen JSON / HTML / JS / media
```

Recommended static paths:

| Asset type | COS path |
|------------|----------|
| SDUI manifest | `/sdui/{market}/{environment}/manifest.json` |
| SDUI screen JSON | `/sdui/{market}/{environment}/screens/{pageId}/{version}.json` |
| Web SDUI build | `/web-sdui/{environment}/assets/*` |
| Web Standard HTML | `/web-standard/{environment}/{pageSlug}.html` |
| Media | `/media/{assetId}/{filename}` |

Static delivery should be the first choice for approved anonymous pages because it lowers latency and reduces the public API blast radius.

### 4.2 Dynamic SDUI API

```
iOS / Android / Harmony / Web / WeChat
        │
        ▼
Tencent CDN / WAF / Anti-DDoS
        │
        ▼
Kong external gateway
        │
        ▼
IKP service mesh / Kubernetes service
        │
        ▼
SDUI API / BFF / AI Search
```

Kong external should enforce:

| Control | Purpose |
|---------|---------|
| JWT/OIDC or signed client token validation | client/app/API identity |
| mTLS where channel supports it | service identity and transport hardening |
| rate limiting and quota | bot and abuse control |
| IP and geo policy | China-only or channel-specific routes |
| request size/header limits | API hardening |
| CORS allowlist | Web SDUI protection |
| route allowlist | reduce accidental exposure |
| API access logs | SensorData/DAP and security operations correlation |

Static COS files do not need to flow through Kong. Dynamic API calls must flow through Kong.

---

## 5. Private Authoring and Publish Flow

```
Staff network / intranet / VPN
        │
        ▼
Private ingress / internal gateway
        │
        ▼
Kong internal
        │
        ▼
OCDP / UCP / CMS API in Alicloud private cloud
        │
        ▼
Approval workflow and maker-checker
        │
        ▼
Publish/export worker
        ├── writes approved SDUI JSON/HTML/JS/media to Tencent COS
        ├── invalidates Tencent CDN paths
        ├── updates runtime manifest and API cache
        └── emits China-resident audit events and SensorData behaviour-tagging events
```

The private publish job is the only controlled bridge from the private authoring plane to the public runtime plane. It should use short-lived credentials, route allowlists and signed artifact manifests.

Recommended publish guarantees:

| Artifact | Publish target | Availability target |
|----------|----------------|---------------------|
| `manifest.json` | Tencent COS + CDN | highest priority |
| Approved page JSON | Tencent COS + CDN + runtime cache | highest priority |
| Web HTML/JS | Tencent COS + CDN | high priority |
| Media | Tencent COS + CDN | high priority |
| Draft content | private DB only | no public publish |
| Audit records | private DB and China data lake | eventually searchable |

---

## 6. IKP Runtime Kubernetes Layout

| Namespace | Workload | Exposure | Notes |
|-----------|----------|----------|-------|
| `gateway-public` | `kong-external` | public ingress behind Tencent CDN | protects SDUI API, AI Search and event facade |
| `sdui-public` | `sdui-api` / `bff-java` | private Kubernetes service behind Kong | serves dynamic SDUI JSON and AI Search |
| `sdui-public` | `ai-search` | private service behind Kong | optional separate search runtime |
| `dap` | `sensordata-event-facade` | private service behind Kong | forwards China behaviour events to SensorData when needed |
| `platform` | observability, external-secrets, ingress controllers | private | cluster operations |

Use the same image names as AWS where possible. The registry may be Tencent TCR, an internal IKP registry, or another approved China-resident registry.

---

## 7. Alicloud Private Cloud Layout

| Private zone | Workloads | Notes |
|--------------|-----------|-------|
| Private AZ1 | UCP console, OCDP console, CMS API, Kong internal, authoring DB primary, Redis | primary staff authoring cell |
| Private AZ2 | UCP/OCDP warm or active peer, CMS API, Kong internal, authoring DB standby/replica, Redis | private DR/peer cell |

Recommended private services:

| Layer | Service |
|-------|---------|
| Compute | Alicloud private Kubernetes or ECS-compatible runtime |
| Database | China-resident PostgreSQL-compatible database with private AZ replication |
| Cache | China-resident Redis |
| Object staging | private object store or artifact staging bucket before Tencent COS publish |
| Secrets | China cloud KMS / secrets manager |
| Logs | China-resident log service, immutable audit archive |

The private authoring DB does not need synchronous replication to IKP. Public runtime should consume approved artifacts, not draft authoring tables.

---

## 8. DAP and SensorData

Mainland China behaviour tracking should use SensorData only.

| Metric | Source |
|--------|--------|
| DAU / MAU | SensorData app/web identity events |
| Page view | SDUI page impression event |
| `DEPOSIT_OPEN_CTA` click rate | SensorData CTA click event |
| Conversion rate | deep link open, app install/download redirect and successful deposit journey callback where available |
| API health | Kong logs, IKP metrics and SDUI API health checks |
| Static delivery health | Tencent CDN and COS logs |

Do not export user-level identifiers or raw behavioural events outside mainland China. Any overseas dashboard should receive only approved aggregated/anonymised metrics.

Operational observability should also stay China-resident. Use OpenTelemetry-compatible collectors on IKP and in the Alicloud private environment, bridge HarmonyNext/mobile/web operational spans into SensorData or the approved local APM backend, and keep only aggregate SLO/status signals available to overseas dashboards. The detailed monitoring matrix, dashboard design, synthetics and mobile startup trace model are defined in `docs/19_observability_monitoring.md`.

---

## 9. Security Controls

| Layer | Control |
|-------|---------|
| Edge | Tencent CDN, WAF/Anti-DDoS, ICP-compliant domain and TLS |
| API | Kong external for public APIs, Kong internal for private staff/admin APIs |
| Runtime | IKP network policy, pod security, private service-to-service traffic |
| Authoring | private ingress only; no direct internet exposure for UCP/OCDP |
| Secrets | China-resident KMS/secrets manager; no secrets in JSON artifacts |
| Data | PIPL-aligned data residency; SensorData inside China |
| Audit | immutable approval/publish logs inside private cloud |
| Publish bridge | route allowlist, signed manifests, least-privilege COS/CDN credentials |

---

## 10. Deployment Environments

| Environment | Runtime site mode | Authoring mode | Purpose |
|-------------|-------------------|----------------|---------|
| `testing-cn` | `single-site` in ZHJ by default | `single-site` in private AZ1 | low-cost validation |
| `prod-cn` | `hot-warm` or `hot-hot` across ZHJ/NHC | `hot-warm` or `hot-hot` across private AZ1/AZ2 | production |

Recommended FQDNs:

| FQDN | Route |
|------|-------|
| `sdui-cn.example.cn` | Tencent CDN → COS static SDUI |
| `api-cn.example.cn` | Tencent CDN/WAF → Kong external → IKP SDUI API |
| `web-cn.example.cn` | Tencent CDN → COS Web SDUI / Web Standard |
| `ocdp-cn.internal.example.cn` | private network → Kong internal → OCDP |
| `ucp-cn.internal.example.cn` | private network → Kong internal → UCP |

---

## 11. Deployment Automation

The repository scaffold provides:

| File | Purpose |
|------|---------|
| `infra/china/README.md` | China deployment usage |
| `infra/china/envs/testing-cn/mainland.env.example` | testing variables |
| `infra/china/envs/prod-cn/mainland.env.example` | production variables |
| `infra/china/k8s/runtime/base` | IKP Kubernetes manifests for Kong external and SDUI API |
| `infra/china/kong/kong-external.yaml` | declarative Kong public API routes/plugins |
| `scripts/china-deploy.sh` | validate, plan, apply and publish helper |

The script is intentionally provider-light because IKP and Alicloud private cloud access will be enterprise-specific. It standardises the deployment contract without assuming a public-cloud control plane for UCP/OCDP.

---

## 12. Minimum Testing Checklist

| Step | Expected result |
|------|-----------------|
| 1. Validate `testing-cn` env | required variables are present |
| 2. Apply IKP runtime manifests | `gateway-public` and `sdui-public` namespaces exist |
| 3. Configure Kong external | `/api/v1/screen/*`, `/api/v1/search` and `/api/v1/events` route to SDUI API |
| 4. Publish static artifacts to COS | `manifest.json` and page JSON are visible through Tencent CDN |
| 5. Purge CDN | changed JSON/HTML is visible within target SLA |
| 6. Verify SensorData tagging | page view and `DEPOSIT_OPEN_CTA` click events appear in SensorData |
| 7. Fail over runtime | NHC can serve SDUI API if ZHJ is unhealthy |
| 8. Verify UCP/OCDP privacy | staff consoles are not reachable from the public internet |

---

## 13. Open Implementation Decisions

| Decision | Recommended default |
|----------|---------------------|
| IKP registry | China-resident internal registry or Tencent TCR |
| Kong mode | DB-less/declarative for initial rollout; control-plane backed later if enterprise standard requires it |
| Runtime failover | DNS/GSLB or Tencent CDN origin failover with Kong and SDUI health checks |
| COS bucket split | separate buckets for testing and production |
| Private publish bridge | controlled job from Alicloud private cloud to Tencent COS/CDN with least privilege |
| Cross-border metrics | aggregate/anonymise only after compliance approval |
