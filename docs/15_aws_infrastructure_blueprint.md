# AWS Infrastructure Blueprint — OCDP, UCP, DAP and SDUI Server

**Document Version:** 1.3  
**Date:** 2026-05-19  
**Scope:** Testing and Production AWS deployment for OCDP, UCP, DAP, BFF and SDUI static delivery, with separate staff-plane and SDUI runtime availability modes  
**Target AWS Regions:** Asia Pacific (Hong Kong) `ap-east-1`, Asia Pacific (Singapore) `ap-southeast-1`  
**Primary Service Region:** Asia Pacific (Hong Kong) `ap-east-1`  
**Availability-Zone Assumption:** Hong Kong has two usable AWS Availability Zones for this platform; Singapore has one usable AWS Availability Zone for this platform.  
**Market Coverage:** ASP HSBC markets excluding mainland China. Mainland China uses the Tencent CDN/COS, IKP and Alicloud on-prem private-cloud design in `docs/16_mainland_china_infrastructure_blueprint.md`.

---

## 1. Deployment Goals

This blueprint turns the local SDUI ecosystem into an AWS deployable architecture:

| Platform | AWS deployment purpose |
|----------|------------------------|
| OCDP | Staff page/journey authoring, approval, preview, AI Search admin, publish workflow |
| UCP | Content asset library, component registry, content approval workflow |
| SDUI BFF | Public SDUI JSON delivery, AI Search, personalisation, A/B routing, publish/export jobs |
| Web SDUI / Web Standard | Public web renderers and static SDUI fallback delivery |
| DAP | Behaviour event ingestion, content performance scoring, reporting, feedback to OCDP/UCP |

The recommended path is:

1. Build a low-cost Testing environment first.
2. Promote the same Terraform modules and container images to Production.
3. Use Hong Kong `ap-east-1` as the primary service region when it is available.
4. Run UCP and OCDP primarily inside Hong Kong, using the two Hong Kong Availability Zones for single-site, hot-warm, or hot-hot staff-plane resilience.
5. Run critical SDUI runtime delivery across three cells: HK AZ1 first, HK AZ2 second, and SG AZ1 as the last-choice regional failover cell.
6. Allow the SDUI runtime plane to run as single-site, hot-warm-warm, or hot-hot-hot depending on cost, resilience and launch needs.
7. Keep mainland China outside this AWS deployment; use the separate Tencent CDN/COS, IKP and Alicloud on-prem private-cloud stack for China-resident services and data.

---

## 2. Recommended AWS Account Structure

Use AWS Organizations instead of placing Testing and Production in one account.

```
AWS Organization
├── Security account
│   ├── GuardDuty administrator
│   ├── Security Hub administrator
│   ├── IAM Access Analyzer
│   └── AWS Config aggregator
│
├── Log Archive account
│   ├── Central CloudTrail S3 bucket
│   ├── VPC Flow Logs bucket
│   └── ALB / CloudFront / WAF logs bucket
│
├── Shared Services account
│   ├── Route 53 public hosted zones
│   ├── CI/CD runners, ECR replication, artifact buckets
│   ├── Transit Gateway / Direct Connect / VPN
│   └── Shared observability tooling
│
├── Testing account
│   ├── ap-east-1 testing stack
│   └── optional ap-southeast-1 testing stack
│
├── Production HK account
│   └── ap-east-1 production stack
│
└── Production SG account
    └── optional ap-southeast-1 production stack
```

For a first Testing setup, you can start with a single Testing account plus Shared Services, then split out Production accounts before go-live.

---

## 3. High-Level Production Diagram

```
                         ┌────────────────────────────────────────┐
                         │ Shared service FQDNs                   │
                         │ sdui.example.com                       │
                         │ ocdp.example.com                       │
                         │ ucp.example.com                        │
                         │ Route 53 latency / weighted routing    │
                         └───────────────────┬────────────────────┘
                                             │
                                 ┌──────────▼──────────┐
                                  │ CloudFront + WAF     │
                                  │ Shield, TLS, cache   │
                                  └──────────┬──────────┘
                                             │
                                  ┌──────────▼──────────┐
                                  │ Kong Gateway         │
                                  │ external + internal  │
                                  │ API policy layer     │
                                  └──────────┬──────────┘
                                             │
            ┌────────────────────────────────┴────────────────────────────────┐
            │                                                                 │
            ▼                                                                 ▼
┌───────────────────────────────┐                             ┌───────────────────────────────┐
│ Production HK — ap-east-1      │                             │ Production SG — ap-southeast-1 │
│ two usable AZ cells            │                             │ one usable AZ cell             │
│                                │                             │                                │
│ ┌──────────────┐ ┌───────────┐ │                             │ ┌──────────────┐ ┌───────────┐ │
│ │ HK AZ1 cell  │ │ HK AZ2    │ │◄──── CRR / publish sync ───►│ │ SG AZ1 cell  │ │ S3 SDUI   │ │
│ │ primary      │ │ backup    │ │                             │ │ last choice  │ │ JSON/CDN  │ │
│ │ SDUI + staff │ │ SDUI +    │ │                             │ │ SDUI only by │ │           │ │
│ │ workloads    │ │ staff DR  │ │                             │ │ default      │ │           │ │
│ └──────┬───────┘ └─────┬─────┘ │                             │ └──────┬───────┘ └───────────┘ │
│        │               │       │                             │        │                       │
│ ┌──────▼───────────────▼─────┐ │                             │ ┌──────▼─────────────────────┐ │
│ │ EKS private subnets         │ │                             │ │ EKS private subnets         │ │
│ │ - Kong external gateway     │ │                             │ │ - Kong external gateway     │ │
│ │ - Kong internal gateway     │ │                             │ │ - Kong internal gateway     │ │
│ │ - SDUI BFF                  │ │                             │ │ - SDUI BFF                  │ │
│ │ - AI Search service         │ │                             │ │ - AI Search service         │ │
│ │ - publish/export workers    │ │                             │ │ - publish/export workers    │ │
│ │ - OCDP / UCP staff apps     │ │                             │ │ - optional runtime support   │ │
│ └──────┬─────────────────────┘ │                             │ └──────┬─────────────────────┘ │
│        │                       │                             │        │                       │
│ ┌──────▼──────┐ ┌────────────┐ │                             │ ┌──────▼──────┐ ┌────────────┐ │
│ │ Aurora PG   │ │ ElastiCache│ │◄── async staff-data sync ───►│ │ Aurora PG   │ │ ElastiCache│ │
│ │ Multi-AZ HK │ │ Redis      │ │   SDUI files sync urgently   │ │ runtime copy │ │ Redis      │ │
│ └─────────────┘ └────────────┘ │                             │ └─────────────┘ └────────────┘ │
│                                │                             │                                │
│ ┌────────────────────────────┐ │                             │ ┌────────────────────────────┐ │
│ │ Staff internal ALB          │ │                             │ │ Staff internal ALB          │ │
│ │ OCDP / UCP consoles         │ │                             │ │ normally disabled for staff │ │
│ └────────────────────────────┘ │                             │ └────────────────────────────┘ │
└────────────────────────────────┘                             └────────────────────────────────┘
            │                                                                 │
            └──────────────────────┬──────────────────────────────────────────┘
                                   ▼
                  ┌──────────────────────────────────────┐
                  │ DAP AWS data plane                   │
                  │ Kinesis / Firehose → S3 → Glue       │
                  │ Athena / Redshift / QuickSight       │
                  │ MWAA / Lambda / ECS scoring jobs     │
                  └──────────────────────────────────────┘
```

The diagram uses a cell model, not a simple two-region active/active model:

| Cell | Location | Default role |
|------|----------|--------------|
| Cell 1 | Hong Kong `ap-east-1`, first usable AZ | Primary cell for SDUI, UCP and OCDP |
| Cell 2 | Hong Kong `ap-east-1`, second usable AZ | Backup or active peer cell for SDUI, UCP and OCDP |
| Cell 3 | Singapore `ap-southeast-1`, one usable AZ | Last-choice SDUI runtime failover cell; staff apps are not normally active here |

---

## 4. VPC Layout Per Region

Create the same subnet tiers in `ap-east-1` and `ap-southeast-1`, but size the Availability Zone count to the platform's usable capacity: two AZs in Hong Kong and one AZ in Singapore.

```
VPC 10.20.0.0/16, example HK
├── Public subnets, 2 HK AZs
│   ├── ALB ingress
│   ├── NAT Gateway per AZ
│   └── optional bastion-free SSM endpoints only
│
├── Private app subnets, 2 HK AZs
│   ├── EKS managed node groups / Fargate profiles
│   ├── BFF pods
│   ├── OCDP pods
│   ├── UCP pods
│   ├── DAP API pods
│   └── background workers
│
├── Private data subnets, 2 HK AZs
│   ├── Aurora PostgreSQL
│   ├── ElastiCache Redis
│   ├── OpenSearch Serverless / managed collection
│   └── VPC endpoints
│
└── VPC endpoints
    ├── S3 Gateway endpoint
    ├── ECR API / ECR Docker
    ├── CloudWatch Logs
    ├── Secrets Manager
    ├── KMS
    ├── STS
    └── SSM
```

Singapore uses the same public/app/data subnet tiers, with one subnet per tier in the single usable SG AZ. Treat it as a regional runtime failover cell, not as the normal staff authoring site.

Recommended CIDRs:

| Environment | Region | Usable AZs | VPC CIDR |
|-------------|--------|------------|----------|
| Testing HK | `ap-east-1` | 2 | `10.20.0.0/16` |
| Testing SG | `ap-southeast-1` | 1 | `10.21.0.0/16` |
| Production HK | `ap-east-1` | 2 | `10.30.0.0/16` |
| Production SG | `ap-southeast-1` | 1 | `10.31.0.0/16` |

---

## 5. Runtime Architecture

### 5.1 EKS Workloads

Use Amazon EKS for workloads that already map to the repository services.

| Kubernetes namespace | Workload | Exposure | Notes |
|----------------------|----------|----------|-------|
| `gateway-public` | `kong-external` | public ALB behind CloudFront/WAF | External API gateway for SDUI, AI Search, DAP ingestion and public web APIs |
| `gateway-internal` | `kong-internal` | internal ALB / private load balancer | Internal API gateway for OCDP, UCP, CMS API, preview and admin APIs |
| `sdui-public` | `bff-java` | private service behind Kong external | SDUI JSON, AI Search, event collector facade |
| `sdui-public` | `web-sdui` | CloudFront + S3 or EKS | Prefer S3/CloudFront for static build |
| `cms-staff` | `ocdp-console` | internal ALB / staff edge; APIs through Kong internal | Staff network, VPN, or AWS Verified Access |
| `cms-staff` | `ucp-console` | internal ALB / staff edge; APIs through Kong internal | Staff network, VPN, or AWS Verified Access |
| `cms-staff` | `cms-api` | private service behind Kong internal | UCP/OCDP CRUD, workflow, approval |
| `dap` | `dap-event-api` | private service behind Kong external or internal | Receives web/mobile tracking events |
| `dap` | `scoring-workers` | private only | Batch CPS scoring, recommendation jobs |
| `platform` | `external-secrets`, `aws-load-balancer-controller`, `cluster-autoscaler` | private | Cluster operations |

Use separate node groups:

| Node group | Instance shape | Purpose |
|------------|----------------|---------|
| `system` | small general purpose | controllers, ingress, metrics |
| `gateway` | general purpose autoscaling | Kong external and internal gateway pods |
| `public-api` | general purpose autoscaling | BFF, search API behind Kong |
| `staff-cms` | general purpose | OCDP/UCP |
| `worker` | compute optimized or spot in Testing | DAP scoring, export jobs |

### 5.2 Container Images

```
ECR
├── kong-gateway-config
├── bff-java
├── ocdp-console
├── ucp-console
├── web-sdui
├── dap-python
└── migration-runner
```

Enable ECR cross-region replication from Hong Kong to Singapore for production.

---

## 6. Public Delivery Flow

### 6.1 SDUI Dynamic API

```
iOS / Android / Harmony / Web
        │
        ▼
CloudFront + AWS WAF
        │
        ▼
Public ALB / AWS Load Balancer Controller
        │
        ▼
Kong external gateway
        │
        ├── OAuth2/OIDC or mTLS where required
        ├── JWT validation / API key validation for partner APIs
        ├── rate limiting, quota, IP allow/deny and bot-aware controls
        ├── request/response size limits and header normalization
        └── route allowlist for SDUI, AI Search and DAP APIs
        │
        ▼
EKS bff-java pods
        │
        ├── ElastiCache Redis: screen JSON cache
        ├── Aurora PostgreSQL: content, workflow, audit, config
        ├── OpenSearch: AI Search index
        ├── S3: static SDUI JSON export
        └── EventBridge / SQS: publish and async jobs
```

Kong is the API policy enforcement point. AWS WAF and Shield handle edge threat filtering; Kong handles API identity, routing, throttling, schema/header policy, service-to-service controls and plugin-based observability.

Recommended public endpoints:

| Endpoint | Service | Cache policy |
|----------|---------|--------------|
| `/api/v1/screen/*` | BFF | short cache, user/locale/channel headers in key only if personalized |
| `/api/v1/search` | BFF / AI Search | no CDN cache |
| `/api/v1/search/corpus` | BFF / AI Search | cache by appId + version |
| `/sdui/{region}/{appId}/{platform}/manifest.json` | S3 static | short cache, revalidated |
| `/sdui/{region}/{appId}/{platform}/{screenId}/{version}.json` | S3 static | immutable long cache |
| `/media/*` | S3 asset bucket | long cache with content hash |

### 6.2 Static SDUI Fallback

```
OCDP approve + publish
        │
        ▼
BFF publish worker
        │
        ├── compose per platform: iOS / Android / Harmony / Web / Web Standard / WeChat
        ├── validate SDUI schema
        ├── write versioned JSON to S3
        ├── update manifest.json
        ├── invalidate CloudFront manifest path
        └── flush Redis keys
```

S3 object structure:

```
s3://hsbc-sdui-prod-hk/
└── hk/
    └── mobile-hk/
        ├── ios/
        │   ├── manifest.json
        │   └── home-hub-hk/2026-05-19T120000Z.json
        ├── android/
        ├── harmonynext/
        ├── web/
        ├── web-standard/
        └── wechat/
```

---

## 7. Staff Authoring Flow

OCDP and UCP should be treated as staff-only applications. They do not need the same real-time cross-region consistency requirement as the SDUI runtime plane. Staff sessions can be region-sticky, and staff can re-logon to the other region if their current regional stack has an issue.

```
HSBC staff laptop
        │
        ▼
Corporate VPN / ZTNA / AWS Verified Access
        │
        ▼
Shared FQDN, Route 53 / CloudFront / ALB session affinity
        │
        ├── sticky to HK region while healthy
        └── sticky to SG region while healthy
        │
        ▼
Regional internal ALB
        │
        ▼
Kong internal gateway
        │
        ├── staff SSO token validation
        ├── RBAC-aware API routing
        ├── maker-checker API policy enforcement
        ├── service-to-service mTLS where required
        └── admin API audit logging
        │
        ├── ocdp-console
        ├── ucp-console
        └── cms-api
              │
              ├── Aurora PostgreSQL: pages, slices, workflow, audit
              ├── S3 media bucket: images, videos, documents
              ├── EventBridge: approval / publish events
              ├── SQS: publish queue
              └── BFF composition API: preview and live validation
```

Staff-plane consistency model:

| Area | Consistency requirement | Recommended approach |
|------|-------------------------|----------------------|
| Staff login/session | Sticky, not globally synchronized | ALB cookie stickiness, CloudFront signed/session cookie, or application session cookie scoped to selected region |
| Draft pages and journeys | Eventual consistency acceptable | Regional writer with async replication or scheduled sync jobs |
| UI component registry | Eventual consistency acceptable | Versioned registry records replicated asynchronously |
| Content assets and metadata | Eventual consistency acceptable | S3 cross-region replication for binaries; async metadata replication |
| Workflow and maker-checker state | Short delay acceptable | Append workflow events to regional outbox, replicate to peer region, resolve by immutable version and approval state |
| Audit logs | Delay acceptable, no data loss | Append-only local audit log plus S3 Object Lock export; replicate asynchronously for read/search |
| Preview composition | Local region first | Compose from local regional DB/cache; allow stale peer-region copy until sync completes |

Kong internal gateway should not store the staff session as the source of truth. It should validate the staff identity token, apply route-level policy and forward the region-scoped session/application cookie to OCDP, UCP or CMS API. This keeps the staff session sticky while preserving a clean API control plane.

If the staff session's selected region fails, the staff user may re-logon through the same OCDP/UCP FQDN and be routed to the healthy region. Unsaved local form edits may be lost, but approved/published artifacts remain available through the runtime plane.

Authentication and authorisation:

| Control | AWS implementation |
|---------|--------------------|
| Staff SSO | IAM Identity Center federation, Cognito federation, or corporate OIDC through ALB auth |
| RBAC | Application roles: AUTHOR, APPROVER, AUDITOR, ADMIN |
| Maker-checker | Enforced in `cms-api`, backed by immutable audit records |
| Secrets | AWS Secrets Manager mounted via External Secrets Operator |
| Audit | Aurora append-only audit table + CloudTrail + CloudWatch Logs |

### 7.1 Runtime Plane Is Different

The SDUI runtime plane has a stricter availability requirement than staff authoring:

| Runtime artifact | Availability requirement | Design |
|------------------|--------------------------|--------|
| SDUI static JSON files | Always available in the enabled runtime cells | Publish to S3, replicate from HK AZ1 to HK AZ2 and SG, validate all enabled manifests, serve via CloudFront |
| SDUI JSON API | Always available in the enabled runtime cells | BFF runs in HK AZ1/HK AZ2 and optionally SG, reads local Redis/S3/Aurora copy, serves stale-safe JSON if CMS DB is delayed |
| Web Standard HTML/JS | Always available in the enabled runtime cells | Static S3/CloudFront distribution with replicated build artifacts |
| Mobile/Web/WeChat clients | Same SDUI FQDN | Route first to HK AZ1, then HK AZ2, then SG if required; clients keep device/browser fallback cache |

Once a page or journey is approved, the publish worker should generate immutable SDUI JSON files, optional HTML/JS artifacts, and manifests. Those published artifacts are the critical runtime contract for mobile, web and WeChat. They should not depend on real-time staff DB replication.

### 7.2 Kong Gateway Control Plane

Use Kong for both external and internal API protection. Keep the gateway configuration declarative and versioned so that Testing and Production can be promoted with the same route/plugin definitions.

| Gateway | Placement | Protects | Main controls |
|---------|-----------|----------|---------------|
| Kong external | `gateway-public` namespace behind public ALB, CloudFront and AWS WAF | SDUI BFF, AI Search, DAP event API, public web APIs | OIDC/JWT validation, API key where needed, rate limiting, quotas, IP allow/deny, request size limits, CORS, route allowlist, API analytics |
| Kong internal | `gateway-internal` namespace behind internal ALB or private load balancer | CMS API, OCDP/UCP admin APIs, preview/compose APIs, internal BFF admin APIs | Staff token validation, mTLS/service identity, route-level RBAC policy, audit headers, admin API rate limiting, internal allowlist |

Recommended Kong operating model:

| Area | Recommendation |
|------|----------------|
| Deployment mode | Run Kong data plane pods in every enabled cell. Keep the control plane/config source in Git/CI, and apply declarative config per environment. |
| Configuration | Store routes, services, plugins and consumer groups as versioned YAML or Terraform-managed resources. |
| Secrets | Store Kong plugin secrets in AWS Secrets Manager and mount through External Secrets Operator. |
| Observability | Emit Kong access logs, latency, upstream errors, rate-limit rejects and auth failures to CloudWatch/OpenTelemetry. |
| Failover | Health checks should test Kong plus upstream BFF/CMS health, not only ALB health. |
| Static SDUI JSON | Serve static JSON and media directly from CloudFront/S3 when possible; route only dynamic API calls through Kong. |

---

## 8. DAP AWS-Native Architecture

If the DAP is hosted inside your AWS account, use this AWS-native stack. If you keep the existing overseas GCP DAP, this section becomes the AWS ingestion and export bridge.

```
Web / iOS / Android / Harmony / WeChat
        │
        ▼
Kong external gateway
        │
        ▼
DAP Event API on EKS, or private API Gateway + Lambda behind Kong routing
        │
        ▼
Kinesis Data Streams
        │
        ├── Firehose → S3 raw data lake
        ├── Lambda enrichers
        └── Managed Service for Apache Flink, optional real-time metrics
        │
        ▼
S3 Data Lake
        │
        ├── raw/clickstream/
        ├── raw/conversions/
        ├── raw/search/
        ├── raw/surveys/
        └── curated/content_signals/
        │
        ▼
Glue Data Catalog + Glue ETL / MWAA
        │
        ├── Athena ad hoc analysis
        ├── Redshift Serverless dashboards
        ├── QuickSight business dashboards
        └── SageMaker / ECS scoring jobs
                 │
                 ▼
        CMS Recommendation API → OCDP editor panel
```

Core event tables:

| Table | Key fields |
|-------|------------|
| `dap_clickstream` | `eventId`, `eventTime`, `appId`, `platform`, `pageId`, `componentId`, `action`, `locale`, `anonymousUserId` |
| `dap_conversion` | `eventId`, `campaignId`, `ctaId`, `conversionType`, `deepLinkTarget`, `status` |
| `dap_search` | `query`, `resultCount`, `clickedResultId`, `rank`, `appId`, `locale` |
| `dap_content_score` | `contentId`, `pageId`, `ctr`, `conversionRate`, `mau`, `dau`, `score`, `band`, `recommendation` |

For mainland China pages, keep SensorData as the local analytics platform and only export aggregated, anonymised metrics into the overseas dashboard if compliance approval allows it.

---

## 9. Data Stores

| Data | Testing | Production |
|------|---------|------------|
| CMS content + workflow | Aurora PostgreSQL Serverless v2 or RDS PostgreSQL single writer | Aurora PostgreSQL Multi-AZ, Global Database if cross-region RTO requires it |
| Immutable audit log | Aurora table with hash chain + S3 Object Lock export | Aurora + S3 Object Lock compliance mode |
| SDUI cache | ElastiCache Redis single shard | ElastiCache Redis Multi-AZ with automatic failover |
| AI Search index | OpenSearch single-AZ or local BFF search | OpenSearch Serverless or managed OpenSearch Multi-AZ |
| Media assets | S3 standard | S3 with versioning, replication, lifecycle, malware scan |
| SDUI static JSON | S3 standard | S3 versioning + CloudFront + cross-region replication |
| Event lake | S3 testing bucket | S3 data lake with Lake Formation permissions |

---

## 10. Testing Environment

Testing should be production-shaped but smaller.

```
Testing account, ap-east-1
├── One VPC, 2 HK AZs
├── One EKS cluster
│   ├── bff-java
│   ├── ocdp-console
│   ├── ucp-console
│   ├── web-sdui
│   └── dap-python workers
├── Aurora PostgreSQL Serverless v2, min capacity
├── ElastiCache Redis, small node
├── S3 buckets for media, SDUI JSON, logs, DAP raw events
├── CloudFront + WAF for public test endpoints
├── Kong external gateway for public APIs
├── Kong internal gateway for staff and internal APIs
├── Internal ALB for staff consoles and Kong internal
└── Route 53 records under test domain
```

Testing domains:

| Domain | Target |
|--------|--------|
| `api-test.example.com` | CloudFront → WAF → public ALB → Kong external → BFF |
| `sdui-test.example.com` | CloudFront → S3 SDUI JSON / web-sdui |
| `ocdp-test.example.com` | staff edge / VPN / ZTNA → Kong internal → OCDP/CMS APIs |
| `ucp-test.example.com` | staff edge / VPN / ZTNA → Kong internal → UCP/CMS APIs |
| `dap-test.example.com` | CloudFront/WAF or private edge → Kong external/internal → DAP event API |

Cost controls:

| Area | Testing setting |
|------|-----------------|
| EKS nodes | small managed node group, scale down outside office hours if acceptable |
| NAT | one NAT gateway for early testing, upgrade to per-AZ for resilience testing |
| Aurora | Serverless v2 low min capacity |
| OpenSearch | postpone until AI Search requires production-like vector/search testing |
| Logs | 14 to 30 day retention |

---

## 11. Deployment Modes

Both Testing and Production can be configured with separate modes for staff authoring and SDUI runtime. Use the same Terraform modules and change only environment variables, DNS weights, origin failover rules and scaling values.

UCP and OCDP are staff functions. They should be single-site, hot-warm, or hot-hot inside the Hong Kong region only, across the two usable HK Availability Zones. Singapore is not the normal staff authoring site.

| Staff mode | HK AZ1 | HK AZ2 | SG AZ1 | Recommended use |
|------------|--------|--------|--------|-----------------|
| `single-site` | Active primary | Disabled or minimal platform capacity | No staff workloads | Early testing and lowest cost |
| `hot-warm` | Active primary | Warm standby | No staff workloads | Production launch with simpler staff operations |
| `hot-hot` | Active primary | Active peer | No staff workloads by default | Mature staff-plane resilience inside HK |

SDUI is the critical runtime plane. It can run across three runtime cells: HK AZ1, HK AZ2 and SG AZ1. HK AZ1 is the preferred primary cell, HK AZ2 is the first backup, and SG AZ1 is the last-choice failover cell.

| SDUI runtime mode | HK AZ1 | HK AZ2 | SG AZ1 | FQDN routing | Recommended use |
|-------------------|--------|--------|--------|--------------|-----------------|
| `single-site` | Active primary | Disabled or minimal standby | Disabled | Shared SDUI FQDN points to HK AZ1 | Low-cost testing |
| `hot-warm-warm` | Active primary | Warm backup | Warm last-choice backup | Shared SDUI FQDN sends traffic to HK AZ1, then HK AZ2, then SG | Production launch with lower cost |
| `hot-hot-hot` | Active primary | Active peer | Active tertiary peer | Shared SDUI FQDN routes to all healthy cells, weighted HK AZ1 > HK AZ2 > SG | Highest runtime availability |

The same environment can move between modes over time:

1. Start Testing as `single-site` in Hong Kong.
2. Add HK AZ2 as `hot-warm` for UCP/OCDP staff-plane rehearsal.
3. Add SG AZ1 as SDUI `hot-warm-warm` for runtime failover rehearsal.
4. Move Production SDUI to `hot-hot-hot` after monitoring, publish replication and support runbooks are proven.

### 11.1 Shared FQDN Model

When more than one region is enabled, the regional stacks are treated as the same logical service and are exposed through the same service FQDNs:

| Service | Shared FQDN pattern | Regional targets |
|---------|---------------------|------------------|
| SDUI public API and static JSON | `sdui.example.com` | HK AZ1 runtime cell, HK AZ2 runtime cell, and SG AZ1 last-choice runtime cell |
| OCDP staff console | `ocdp.example.com` | HK staff edge across HK AZ1 and HK AZ2 |
| UCP staff console | `ucp.example.com` | HK staff edge across HK AZ1 and HK AZ2 |
| DAP event API | `dap.example.com` | HK DAP ingestion and SG DAP ingestion |

Mobile, Web and WeChat clients always call the same SDUI FQDN. They do not need to know whether the request is served by HK AZ1, HK AZ2, or SG AZ1. In `single-site`, the same FQDN points to HK AZ1; in `hot-warm-warm`, it normally points to HK AZ1 and fails over to HK AZ2, then SG; in `hot-hot-hot`, it routes to all healthy runtime cells with HK preferred.

| Cell | Role | Reason |
|------|------|--------|
| HK AZ1 | Primary active | Primary service cell for ASP AWS deployment |
| HK AZ2 | Backup or active peer | Same-region resilience for UCP, OCDP and SDUI |
| SG AZ1 | Last-choice SDUI cell | Regional isolation partner for the SDUI runtime plane |

Route 53, CloudFront origin groups and ALB target-group health checks should enforce the preferred runtime order: HK AZ1 first, HK AZ2 second, SG AZ1 last. For staff consoles, use the same FQDN with HK-only corporate access control and session stickiness across the two HK AZs. Staff authoring is allowed to be eventually consistent between HK AZ cells; staff can re-logon after an HK AZ issue.

Kong gateway health should be part of every API failover decision. A cell is healthy only when the edge, Kong gateway and upstream service health checks all pass.

### 11.2 Mode-Specific Patterns

| Capability | Staff `single-site` | Staff `hot-warm` | Staff `hot-hot` |
|------------|---------------------|------------------|-----------------|
| OCDP/UCP placement | HK AZ1 only | HK AZ1 active, HK AZ2 warm | HK AZ1 and HK AZ2 active |
| Staff DNS / FQDN | FQDN targets HK AZ1 staff edge | FQDN targets HK AZ1, fails over to HK AZ2 | FQDN targets both HK AZs with sticky sessions |
| Staff EKS capacity | HK AZ1 node capacity | HK AZ1 normal, HK AZ2 minimal warm | HK AZ1 and HK AZ2 both scaled |
| Aurora / staff DB | HK primary DB | HK Multi-AZ or async standby | HK Multi-AZ, application session stickiness avoids global active-write complexity |
| Redis session cache | One HK cache | HK cache with standby | HK cache with automatic failover |
| Staff data sync | None beyond normal backups | Async between HK AZ cells | Eventual consistency between HK AZ cells |

| Capability | SDUI `single-site` | SDUI `hot-warm-warm` | SDUI `hot-hot-hot` |
|------------|--------------------|----------------------|-----------------|
| Runtime placement | HK AZ1 only | HK AZ1 active, HK AZ2 warm, SG AZ1 warm | HK AZ1, HK AZ2 and SG AZ1 active |
| DNS / FQDN | `sdui.example.com` targets HK AZ1 | Ordered failover: HK AZ1 → HK AZ2 → SG AZ1 | Weighted routing: HK AZ1 highest, HK AZ2 second, SG lowest |
| CloudFront / origins | HK origin only | HK primary origin group plus SG tertiary origin | All healthy origins can serve; cache policy still prefers HK |
| Kong external | HK AZ1 gateway | HK AZ1 active, HK AZ2 warm, SG warm | Gateway pods active in all runtime cells |
| EKS / BFF | HK AZ1 BFF behind Kong | HK AZ1 normal, HK AZ2 warm, SG warm | BFF scaled behind Kong in all runtime cells |
| S3 SDUI JSON | HK bucket | Publish to HK, replicate to HK backup and SG | Publish immutable JSON/HTML/JS to all cells and validate all manifests |
| Redis runtime cache | HK cache | Warm cells can rebuild from S3/Aurora copy | Regional/cell-local cache per active cell |
| OpenSearch / AI Search | HK index | Warm indexes rebuilt from replicated corpus | Indexes rebuilt from the same corpus in all cells |
| DAP events | HK stream | HK stream active, SG stream ready for failover | Regional streams with curated merge |
| Approval and publish | Publish to HK runtime | Publish to HK first, then replicate to HK backup and SG | Publish to all runtime cells with higher priority than draft DB records |

### 11.3 Runtime Criticality by Mode

| Runtime artifact | `single-site` | `hot-warm-warm` | `hot-hot-hot` |
|------------------|---------------|------------------|---------------|
| SDUI static JSON | Available in HK AZ1 | Available in HK AZ1, replicated to HK AZ2 and SG AZ1 | Available and validated in all three runtime cells |
| SDUI JSON API | HK AZ1 BFF | HK AZ1 BFF active; HK AZ2 and SG BFF ready | All three BFF cells serve traffic |
| Web/WeChat static assets | HK CDN/origin | HK primary CDN/origin with SG tertiary failover | All cells can serve assets |
| Client fallback | Required | Required | Required |

### 11.4 Mainland China Exclusion

This AWS deployment supports ASP HSBC markets excluding mainland China. Mainland China must use the separate design in `docs/16_mainland_china_infrastructure_blueprint.md`:

| Area | ASP AWS deployment | Mainland China |
|------|--------------------|----------------|
| Runtime regions | HK AZ1, HK AZ2 and optional SG AZ1 AWS runtime cells | IKP on GKE in ZHJ and NHC for public SDUI API runtime |
| Public SDUI FQDN | Shared ASP SDUI FQDN | China-specific SDUI FQDN / ICP domain through Tencent CDN |
| Static SDUI storage | S3 + CloudFront | Tencent COS + Tencent CDN |
| API protection | CloudFront/WAF → Kong external → EKS services | Tencent CDN/WAF → Kong external → IKP SDUI API |
| UCP/OCDP | AWS HK staff plane | Alicloud on-prem private cloud, two private AZs, no public exposure |
| Analytics | DAP AWS-native or overseas analytics stack | SensorData and China-resident data lake |
| Data residency | ASP controls | China-resident, PIPL compliant |
| Cross-border flow | Aggregated/anonymised metrics only where approved | No raw PII export |

Recommended initial SLOs:

| Service | Availability target | Notes |
|---------|---------------------|-------|
| SDUI BFF | 99.95% | public mobile/web dependency |
| Static SDUI JSON | 99.99% | CloudFront + S3 should be fallback path |
| OCDP/UCP | 99.5% | staff-only, business-hours priority acceptable |
| DAP ingestion | 99.9% | buffer client events and use Kinesis retry |
| DAP reporting | 99.0% | batch reporting can tolerate delay |

---

## 12. Security Architecture

```
Internet
  │
  ▼
CloudFront
  ├── AWS WAF managed rules
  ├── rate limiting
  ├── geo / bot controls where approved
  └── TLS via ACM certificate in us-east-1 for CloudFront
  │
  ▼
Public ALB
  ├── TLS via ACM regional certificate
  ├── security group allows CloudFront origin-facing traffic
  └── forwards API traffic to Kong external gateway
  │
  ▼
Kong external gateway
  ├── API authentication and authorization policy
  ├── rate limiting, quota and request policy
  ├── CORS and header normalization
  └── upstream service routing to BFF / DAP
```

Internal API path:

```
Staff network / VPN / Verified Access
  │
  ▼
Internal ALB or private load balancer
  │
  ▼
Kong internal gateway
  ├── staff token validation
  ├── route-level RBAC and service allowlist
  ├── service-to-service mTLS where required
  └── forwards to OCDP / UCP / CMS API / preview APIs
```

Controls:

| Layer | Control |
|-------|---------|
| Edge | AWS WAF, Shield Standard or Shield Advanced for production |
| API gateway | Kong external and internal gateways for auth, route policy, rate limiting, quota, mTLS, CORS, request limits and API observability |
| Identity | OIDC SSO for staff, service account IAM Roles for Service Accounts |
| Network | private subnets for all workloads, no SSH, SSM Session Manager only |
| Secrets | Secrets Manager + KMS, no secrets in Kubernetes manifests |
| Data | KMS encryption for S3, Aurora, Redis, OpenSearch, EBS |
| Audit | CloudTrail organization trail, CloudWatch Logs, S3 Object Lock for audit exports |
| Supply chain | ECR image scanning, signed images where possible, IaC scanning |
| SDUI safety | server-side schema validation, action allowlist, URL allowlist, JSON-LD output only on web channels |

---

## 13. CI/CD and IaC

```
Developer pull request
        │
        ▼
GitHub Actions / CodePipeline
        │
        ├── lint + unit tests
        ├── build container images
        ├── scan images and dependencies
        ├── push to ECR testing
        ├── terraform plan
        └── deploy to Testing via ArgoCD
                │
                ▼
        integration tests + approval
                │
                ▼
        promote same image digest to Production HK / SG
```

Repository to AWS mapping:

| Repo folder | Artifact | Deployment target |
|-------------|----------|-------------------|
| `infra/kong` or `gateway-config` | Kong declarative config / plugins | Kong external and internal gateway |
| `bff-java` | container image | EKS `sdui-public` namespace |
| `ocdp-console` | static build or container | S3/CloudFront or EKS internal ALB |
| `ucp-console` | static build or container | S3/CloudFront internal or EKS internal ALB |
| `web-sdui` | static build | S3 + CloudFront |
| `dap-python` | container image / Lambda package | EKS workers, ECS, Lambda, MWAA |
| `hive-tokens` | package artifact | build pipeline input |
| `study-json` | generated artifacts | S3 SDUI seed/baseline path |

---

## 14. Terraform Module Plan

Create reusable modules in this order:

```
infra/
├── modules/
│   ├── account-baseline/
│   ├── vpc/
│   ├── eks/
│   ├── rds-aurora-postgres/
│   ├── elasticache-redis/
│   ├── s3-sdui-bucket/
│   ├── cloudfront-waf/
│   ├── opensearch/
│   ├── dap-data-lake/
│   ├── observability/
│   └── route53/
│
└── envs/
    ├── testing-ap-east-1/
    ├── testing-ap-southeast-1/
    ├── prod-ap-east-1/
    └── prod-ap-southeast-1/
```

Build order:

1. Account baseline: IAM, CloudTrail, Config, GuardDuty, budgets.
2. VPC and endpoints.
3. EKS and controllers.
4. Kong external/internal gateway namespaces, ingress and baseline policies.
5. S3 media and SDUI buckets.
6. Aurora and Redis.
7. BFF, OCDP, UCP, Web SDUI deployments.
8. CloudFront, WAF, Route 53.
9. DAP ingestion and data lake.
10. Cross-region replication and DR runbooks.

---

## 15. Environment Variables and Secrets

| Secret / config | Storage | Consumers |
|-----------------|---------|-----------|
| `DATABASE_URL` | Secrets Manager | BFF, CMS API, migration runner |
| `REDIS_URL` | Secrets Manager | BFF |
| `JWT_ISSUER` / `JWKS_URL` | ConfigMap + Secrets Manager | BFF, CMS API |
| `KONG_ADMIN_TOKEN` | Secrets Manager | Kong admin/config deployment job |
| `KONG_PLUGIN_SECRETS` | Secrets Manager | Kong external/internal plugins |
| `AEM_CLIENT_ID` / `AEM_CLIENT_SECRET` | Secrets Manager | OCDP/UCP content provider integration |
| `TEALIUM_OR_SENSORS_ENDPOINT` | ConfigMap | clients / BFF event facade |
| `OPENSEARCH_ENDPOINT` | Secrets Manager | AI Search service |
| `S3_MEDIA_BUCKET` | ConfigMap | UCP, BFF |
| `S3_SDUI_BUCKET` | ConfigMap | publish worker |
| `KINESIS_STREAM_NAME` | ConfigMap | DAP event API |

Use IAM Roles for Service Accounts so pods do not need long-lived AWS keys.

---

## 16. Observability

| Signal | AWS service |
|--------|-------------|
| Application logs | CloudWatch Logs, optionally shipped to Datadog/OpenSearch |
| Metrics | CloudWatch Container Insights, Amazon Managed Prometheus |
| Traces | AWS X-Ray or OpenTelemetry collector to Datadog |
| Synthetic checks | CloudWatch Synthetics for Kong `/status`, BFF `/health`, `/api/v1/screen/home-hub-hk`, `manifest.json` |
| Alarms | CloudWatch Alarms + SNS / PagerDuty |
| Audit | CloudTrail, Aurora audit table, application maker-checker log |

Critical alarms:

| Alarm | Threshold |
|-------|-----------|
| Kong 5xx / upstream unavailable | > 0.1% for 5 minutes |
| Kong auth/rate-limit rejects | sudden anomaly or sustained business-impacting rate |
| BFF 5xx rate | > 0.1% for 5 minutes |
| BFF p95 latency | > 200 ms for 10 minutes |
| Redis CPU/memory | > 80% |
| Aurora writer CPU | > 75% |
| SDUI manifest CDN 4xx/5xx | > 0.1% |
| DAP ingestion lag | Kinesis iterator age > 2 minutes |
| Publish job failure | any failed publish event |

---

## 17. Minimum Testing Setup Checklist

Use this to get the first working AWS Testing stack.

| Step | Output |
|------|--------|
| 1. Create Testing account | isolated billing and permissions |
| 2. Create `ap-east-1` VPC | public, private app, private data subnets |
| 3. Create EKS cluster | workloads can run in private subnets |
| 4. Create ECR repos | images pushed from CI |
| 5. Deploy Kong external/internal | public and internal API routes enforce gateway policy |
| 6. Create Aurora PostgreSQL | CMS and BFF state |
| 7. Create ElastiCache Redis | SDUI cache |
| 8. Create S3 buckets | media, static SDUI JSON, logs |
| 9. Deploy BFF | `/health` and `/api/v1/screen/home-hub-hk` reachable through Kong external |
| 10. Deploy UCP/OCDP | staff-only URL reachable through VPN/ZTNA and APIs reachable through Kong internal |
| 11. Deploy CloudFront + WAF | public API and static SDUI path reachable |
| 12. Deploy DAP event path | event accepted through Kong and lands in S3 |
| 13. Run publish test | OCDP publish writes S3 JSON and invalidates manifest |

---

## 18. AWS Reference Notes

This design follows current AWS service basics and regional facts:

| Topic | Reference |
|-------|-----------|
| Region codes and AZ count | AWS Regions documentation lists `ap-east-1` as Asia Pacific (Hong Kong) and `ap-southeast-1` as Asia Pacific (Singapore). This blueprint intentionally models two usable HK AZs and one usable SG AZ for this platform. |
| EKS networking | AWS EKS best-practice guidance recommends planning VPC/subnets carefully and using Multi-AZ deployment for reliability. |
| Edge failover | AWS CloudFront and Route 53 can be combined for origin failover and regional failover patterns. |

Links:

- https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html
- https://docs.aws.amazon.com/eks/latest/best-practices/subnets.html
- https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html
- https://aws.amazon.com/blogs/networking-and-content-delivery/improve-web-application-availability-with-cloudfront-and-route53-hybrid-origin-failover/
