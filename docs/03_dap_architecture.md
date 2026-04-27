# Digital Analytics Platform (DAP) — Architecture

**Document Version:** 1.0  
**Date:** 2026-04-19  
**Scope:** DAP Signal Ingestion, Dual-Stack Analytics, Content Scoring, Feedback Loop  

---

## 1. Overview

The Digital Analytics Platform (DAP) is the intelligence layer of the HSBC Digital Sales Promotion Platform. Its purpose is to aggregate all measurable signals about content and journey performance — behavioural click/conversion data, app store reviews, customer survey responses, and LLM citation monitoring — into a single unified **Content Performance Score (CPS)** per piece of content. This score is then fed back into the CMS editor workflow as actionable recommendations, closing the optimisation loop.

DAP operates a **dual-stack architecture** to satisfy data residency requirements: GCP BigQuery + Looker for overseas markets (HK, UK, SG, US), and SensorData (神策数据) for mainland China. A unified aggregation layer bridges both stacks for cross-region reporting.

---

## 2. Full DAP Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DAP — Digital Analytics Platform                          │
│                                                                                   │
│  SIGNAL SOURCES                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Behavioral   │  │ App Store    │  │ Customer    │  │ AEO / LLM Probe      │ │
│  │ Events       │  │ Feedback     │  │ Surveys     │  │ (SEO Monitor)        │ │
│  │              │  │              │  │             │  │                      │ │
│  │ Web/iOS/     │  │ AppFollow /  │  │ Qualtrics   │  │ ChatGPT / Perplexity │ │
│  │ Android SDK  │  │ AppBot API   │  │ In-app NPS  │  │ Google AI / Bing     │ │
│  │ WeChat SDK   │  │ Huawei       │  │ Email CSAT  │  │ (daily probe job)    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘ │
│         │                  │                  │                    │             │
│         └──────────────────┴──────────────────┴────────────────────┘             │
│                                      │                                            │
│                       ┌──────────────▼──────────────┐                            │
│                       │  DAP Event Ingestion Layer   │                            │
│                       │  GCP Pub/Sub (overseas)      │                            │
│                       │  SensorData endpoint (China) │                            │
│                       └──────────────┬──────────────┘                            │
│                                      │                                            │
│           ┌──────────────────────────┼──────────────────────────┐                │
│           │                          │                           │                │
│  ┌────────▼────────┐    ┌────────────▼──────────┐    ┌─────────▼─────────────┐  │
│  │ Overseas Stack  │    │ Unified Aggregation    │    │ China Stack           │  │
│  │                 │    │ Layer                  │    │                       │  │
│  │ GCP BigQuery    │    │ (anonymised/aggregated │    │ SensorData (神策数据) │  │
│  │ Dataflow        │    │  cross-region sync;    │    │ Local Data Lake       │  │
│  │ Looker          │    │  PIPL-compliant)       │    │ SensorData BI         │  │
│  │ Vertex AI       │    └────────────────────────┘    │ MaxCompute            │  │
│  └─────────────────┘                                  └───────────────────────┘  │
│           │                                                       │               │
│           └───────────────────────┬───────────────────────────────┘               │
│                                   │                                               │
│                    ┌──────────────▼──────────────────────┐                       │
│                    │  Content Performance Scoring Engine  │                       │
│                    │  (Python — runs every 6h)            │                       │
│                    │  CPS = weighted composite of:        │                       │
│                    │    CTR + Conversion + NPS + AEO +    │                       │
│                    │    Sentiment + Completion + Scroll    │                       │
│                    └──────────────┬──────────────────────┘                       │
│                                   │                                               │
│           ┌───────────────────────┼──────────────────────┐                       │
│           │                       │                       │                       │
│  ┌────────▼────────┐  ┌───────────▼──────────┐  ┌────────▼──────────────────┐   │
│  │ Looker Content  │  │ Alert Service         │  │ CMS Recommendation        │   │
│  │ Leaderboard     │  │ (Slack + Email)       │  │ Engine                    │   │
│  │ Dashboard       │  │                       │  │ (pushes to Stripes CMS)   │   │
│  └─────────────────┘  └───────────────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dual-Stack Analytics Design

### 3.1 Overseas Stack — GCP

| Component | Role |
|-----------|------|
| GCP Pub/Sub | Real-time event streaming; decouples producers from consumers |
| GCP Dataflow (Apache Beam) | Stream + batch ETL: clean, enrich, stitch customer identity |
| GCP BigQuery | Central data lake and warehouse; partitioned by date, clustered by userId |
| Looker + LookML | Semantic layer; journey funnel, cohort, and content leaderboard dashboards |
| Vertex AI | Propensity models (churn, upgrade, product take-up), recommendation engine |
| GCS | Raw event archive (30-day rolling window for replay) |
| Cloud Composer (Airflow) | Pipeline orchestration: daily batch jobs, scoring runs |
| Cloud DLP | PII detection and masking in streaming pipeline |

### 3.2 China Stack — SensorData (神策数据)

| Component | Role |
|-----------|------|
| SensorData SDK (iOS/Android/Web/Mini) | Client-side event capture; in-China endpoint only |
| SensorData Real-time Pipeline | Event ingestion → real-time segmentation |
| SensorData BI | Built-in funnels, retention, attribution dashboards |
| SensorData ID Mapping | Cross-device identity stitching within China |
| MaxCompute (Alibaba) | Large-scale batch analytics; model training data |
| Alibaba OSS | Raw data lake storage (China-resident) |

### 3.3 Dual-Stack Comparison

| Dimension | Overseas (GCP) | Mainland China (SensorData) |
|-----------|---------------|----------------------------|
| SDK | Firebase + custom DAP SDK | SensorData SDK |
| Real-time | Pub/Sub + Dataflow | SensorData real-time pipeline |
| BI | Looker dashboards | SensorData built-in BI |
| ML | Vertex AI | SensorData + MaxCompute |
| Identity | HSBC UCID + Firebase ID | SensorData ID Mapping |
| Data residency | GCP Regional (asia-east1) | In-China only (PIPL) |
| Cross-region sync | Unified Aggregation Layer | Aggregated / anonymised export |

### 3.4 Customer Identity — ID Graph

```
Event sources per customer:
  Web session (cookie ID)  ─┐
  iOS device ID             ├──► HSBC UCID (Unified Customer ID)
  Android device ID         │    Stitched by Identity Resolution Service
  WeChat OpenID (CN)       ─┘    on authenticated events

Stitching rules:
  1. Authenticated event: device_id + user_token → UCID mapping stored
  2. Unauthenticated: events stored with device_id; joined to UCID on first auth
  3. Cross-device: UCID shared across all devices after one auth event per device
  4. China: SensorData ID Mapping handles CN stitching independently (PIPL)
```

---

## 4. Data Lake Structure (GCS — Overseas)

```
gs://hsbc-dap-{env}/
├── raw/
│   ├── clickstream/
│   │   └── year=2026/month=04/day=19/
│   │       └── events-*.json.gz       ← raw SDUI interaction events
│   ├── conversions/
│   │   └── year=2026/month=04/day=19/
│   │       └── conversions-*.json.gz  ← application / product take-up events
│   ├── surveys/
│   │   └── nps-*.json.gz              ← NPS / CSAT responses
│   ├── app_store/
│   │   └── reviews-*.json.gz          ← harvested + NLP-tagged reviews
│   └── aeo_probes/
│       └── probe-results-*.json.gz    ← LLM citation probe results
│
├── curated/
│   ├── customer_360/
│   │   └── customer_profile.parquet   ← enriched unified customer profile
│   ├── journey_events/
│   │   └── stitched_journey.parquet   ← identity-stitched event sequences
│   ├── content_signals/
│   │   └── content_signal_joined.parquet ← all signals joined on contentId
│   └── segments/
│       └── segment_membership.parquet ← ML-generated segment assignments
│
└── analytics/
    ├── looker_ready/
    │   └── *.view.lkml                ← Looker-optimised BigQuery views
    └── ml_features/
        └── feature_store.parquet      ← Vertex AI feature store input
```

---

## 5. App Store Feedback Harvesting

```
┌──────────────────────────────────────────────────────────────────┐
│               App Store Feedback Pipeline                         │
│                                                                    │
│  Sources:                                                          │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │  App Store │  │ Google Play │  │  Huawei AppGallery (CN) │   │
│  │  (iOS)     │  │ (Android)   │  │                         │   │
│  └─────┬──────┘  └──────┬──────┘  └────────────┬────────────┘   │
│        └───────────────┬┴────────────────────────┘               │
│                        │                                          │
│               AppFollow / AppBot API                              │
│               (polls every 4h; filters: HSBC app IDs)            │
│                        │                                          │
│               ┌─────────▼──────────────┐                         │
│               │  NLP Classifier         │                         │
│               │  Model: fine-tuned BERT │                         │
│               │  Outputs:               │                         │
│               │   sentiment: pos/neg/neu│                         │
│               │   topic_tags: [         │                         │
│               │     "jade_upgrade",     │                         │
│               │     "mortgage_calc",    │                         │
│               │     "login_issue", ...] │                         │
│               │   confidence: 0.0–1.0   │                         │
│               └─────────┬──────────────┘                         │
│                         │                                         │
│               ┌─────────▼──────────────┐                         │
│               │  Content ID Mapper      │                         │
│               │  Maps topic_tags →      │                         │
│               │  contentId via keyword  │                         │
│               │  taxonomy lookup table  │                         │
│               └─────────┬──────────────┘                         │
│                         │                                         │
│               ┌─────────▼──────────────┐                         │
│               │  BigQuery Storage       │                         │
│               │  dap.app_store_feedback │                         │
│               │  {reviewId, platform,   │                         │
│               │   rating, sentiment,    │                         │
│               │   topic_tags, contentId,│                         │
│               │   date}                 │                         │
│               └────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘

Feedback Triggers:
  • Rating drops > 0.3 stars in 7 days       → alert to Content + UX teams
  • Keyword spike (e.g. "confusing") in 48h  → flag content for review in CMS
  • Positive spike after content update      → STAR signal boost to CPS
```

---

## 6. Customer Survey Integration

```
Survey Sources:
┌──────────────────────────────────────────────────────────────────┐
│  In-app NPS     │ SDUI SurveyWidget triggers post-journey        │
│                 │ Condition: daysSinceLastSurvey > 30            │
│                 │ Mapped to: journeyId + contentId               │
├──────────────────────────────────────────────────────────────────┤
│  Email CSAT     │ Triggered 3 days after product application     │
│                 │ Qualtrics XM → webhook to DAP Survey API       │
│                 │ Mapped to: applicationId → journeyId           │
├──────────────────────────────────────────────────────────────────┤
│  Relationship   │ Periodic Qualtrics survey (quarterly)          │
│  NPS            │ Full HSBC relationship score; mapped to segment│
├──────────────────────────────────────────────────────────────────┤
│  Web Exit-intent│ CX intercept pop-up on HSBC.com exit           │
│                 │ Mapped to: pageUrl → contentId via URL mapping │
└──────────────────────────────────────────────────────────────────┘

Survey Ingestion API:
  POST /dap/v1/survey-response
  {
    "sourceType": "in_app_nps" | "email_csat" | "relationship" | "exit_intent",
    "score": 9,
    "responseText": "Great upgrade flow, very smooth",
    "journeyId": "jade-upgrade-journey",
    "contentId": "jade-upgrade-banner-B",
    "segmentId": "premier",
    "userId_hash": "sha256:...",
    "timestamp": "2026-04-19T08:30:00Z"
  }
```

---

## 7. Content Performance Score (CPS) Formula

### 7.1 Formula

```
CPS = (
    cta_click_rate        × 0.20   +
    conversion_rate       × 0.30   +
    journey_completion    × 0.15   +
    nps_delta             × 0.15   +
    aeo_citation_share    × 0.10   +
    app_store_sentiment   × 0.05   +
    scroll_depth_pct      × 0.05
) × 100
```

### 7.2 Signal Definitions

| Signal | How Measured | Normalised Range |
|--------|-------------|-----------------|
| `cta_click_rate` | clicks ÷ impressions for primary CTA | 0.0–1.0 (capped at benchmark max) |
| `conversion_rate` | completed applications ÷ CTA clicks | 0.0–1.0 |
| `journey_completion` | users reaching final step ÷ users starting journey | 0.0–1.0 |
| `nps_delta` | avg NPS score for journey − segment baseline NPS | −1.0 to +1.0 (normalised) |
| `aeo_citation_share` | % of LLM probe queries where HSBC cited | 0.0–1.0 |
| `app_store_sentiment` | % positive reviews with this topic tag (30d) | 0.0–1.0 |
| `scroll_depth_pct` | avg % of content scrolled by users who viewed | 0.0–1.0 |

### 7.3 CPS Bands

| Band | Score | Action |
|------|-------|--------|
| STAR | 80–100 | Promote as template; highlight in editor dashboard |
| GOOD | 60–79 | Minor optimisation suggestions surfaced |
| REVIEW | 40–59 | Content gap alert sent to editor |
| URGENT | 0–39 | Immediate alert; consider rollback or unpublish |

### 7.4 Example Calculation

```
Content: [Jade Upgrade Banner — Variant B]

Signal                  Raw Value    Normalised    Weight    Contribution
──────────────────────────────────────────────────────────────────────────
cta_click_rate          11.2%        0.89          0.20      0.178
conversion_rate          8.1%        0.81          0.30      0.243
journey_completion      78.0%        0.78          0.15      0.117
nps_delta               +1.4 pts     0.84          0.15      0.126
aeo_citation_share      60.0%        0.60          0.10      0.060
app_store_sentiment     82.0%        0.82          0.05      0.041
scroll_depth_pct        71.0%        0.71          0.05      0.036
──────────────────────────────────────────────────────────────────────────
CPS = 0.801 × 100 = 80.1   →   STAR band ✅
```

---

## 8. Real-time vs Batch Processing

| Processing Mode | Technology | Use Case | Latency |
|-----------------|------------|----------|---------|
| Real-time streaming | Pub/Sub + Dataflow | Click/impression events → BigQuery | < 5 seconds |
| Near-real-time | Dataflow windowed aggregation | Anomaly detection (CTR drop) | 1–5 minutes |
| Micro-batch | Dataflow (1-min windows) | Funnel drop-off rates | 5 minutes |
| Batch (6-hourly) | Cloud Composer + BigQuery | CPS computation, feedback loop | 6 hours |
| Daily batch | Cloud Composer | AEO probe scoring, Looker refreshes | 24 hours |
| Weekly batch | Cloud Composer | Cohort analysis, A/B conclusion detection | 7 days |

---

## 9. Looker Dashboard Specifications

| Dashboard | Key Metrics | Audience |
|-----------|-------------|---------|
| Content Leaderboard | CPS score, CTR, conversion, NPS per contentId; ranked table | CMS Editors, Product |
| Journey Funnel | Step-by-step drop-off per journeyId; segment breakdown | Product, UX |
| A/B Test Monitor | Variant comparison: CTR, conversion, statistical significance | Growth, Product |
| AEO Citation Share | Citation % per LLM engine per query; competitor gap | SEO/AEO Team |
| App Store Sentiment | Rating trend, keyword spikes, topic tag distribution | CX, Content |
| Behavioural Cohort | Retention curves per segment and product | Data Science, Marketing |
| Real-time Anomaly | Live CTR vs 7-day baseline; alert status | Platform On-call |

---

## 10. Data Governance

| Requirement | Implementation |
|-------------|----------------|
| PII Masking | userId SHA-256 hashed + salt before device; Cloud DLP masks in streaming pipeline |
| Data Residency (Overseas) | All GCP resources in `asia-east1` (HK); EU data in `europe-west1` |
| Data Residency (China) | All CN user data in SensorData China-resident servers; no cross-border PII |
| Retention | Raw events: 90 days; curated: 2 years; CPS scores: 5 years |
| GDPR Erasure | Erasure API: hashes all userId references in BigQuery on request |
| PIPL Consent | SensorData SDK consent gate; opted-out users excluded from all pipelines |
| Audit Logging | All DAP pipeline runs logged to GCP Cloud Audit Logs |
| Access Control | BigQuery column-level security; Looker access grants by role |
