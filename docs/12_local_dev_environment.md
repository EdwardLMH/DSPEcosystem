# Local Development Environment

**Document Version:** 1.0  
**Date:** 2026-05-04  
**Scope:** mock-BFF, UCP Console, OCDP Console, SDUI client local setup  

---

## 1. Overview

For local development the ecosystem runs three services that simulate the production architecture without requiring the Java BFF, Redis, PostgreSQL, or any CMS backend. All state is held in-memory inside a single Node.js process (the mock-BFF).

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Local Development Stack                            │
│                                                                        │
│  ┌────────────────────┐                                               │
│  │  mock-BFF           │  Port 4000                                    │
│  │  (Node.js/Express)  │  Zone 1: KYC, SDUI screens, search, events  │
│  │                     │  Zone 2: CMS CRUD, workflow, audit log       │
│  │  All state in-memory│  Simulates: bff-java + UCP/CMS backend      │
│  └──────────┬──────────┘                                               │
│             │                                                          │
│     ┌───────┴──────────────────────┐                                  │
│     │                              │                                  │
│  ┌──▼───────────────┐   ┌─────────▼──────────┐                       │
│  │  UCP Console      │   │  OCDP Console       │                       │
│  │  Port 3001        │   │  Port 3002           │                       │
│  │  (Vite + React)   │   │  (Vite + React)      │                       │
│  │                   │   │                      │                       │
│  │  Proxy: /api →    │   │  Proxy: /ucp-api →   │                       │
│  │    :4000/api      │   │    :3001/api          │                       │
│  │                   │   │  Proxy: /media →      │                       │
│  │  Serves: /media/* │   │    :3001/media        │                       │
│  └───────────────────┘   └──────────────────────┘                       │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  SDUI Clients (web-sdui, ios-sdui, android-sdui, harmony…)    │    │
│  │  Connect to mock-BFF :4000 for Zone 1 APIs                    │    │
│  └───────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Port Assignments

| Service | Port | Purpose |
|---------|------|---------|
| mock-BFF | 4000 | Simulates Java BFF + CMS backend; serves KYC steps, SDUI screens, search, Zone 2 CMS APIs |
| UCP Console | 3001 | Content asset library, component registry, approval workflow; proxies `/api` to `:4000`; serves `/media/*` static files |
| OCDP Console | 3002 | Page authoring, journey builder, approval queue; proxies `/ucp-api` to `:3001/api`; proxies `/media` to `:3001` |
| web-sdui | 5173 | Web SDUI renderer (Vite default); fetches screens from `:4000` |

---

## 3. Proxy Chain

```
OCDP Console (:3002)
  /ucp-api/*  ──rewrite──►  UCP Console (:3001) /api/*  ──proxy──►  mock-BFF (:4000) /api/*
  /media/*    ─────────────► UCP Console (:3001) /media/*

UCP Console (:3001)
  /api/*      ──────────────► mock-BFF (:4000) /api/*
  /media/*    ──────────────► served from ucp-console/public/media/
```

This means the OCDP Console can reference UCP content assets and component definitions via `/ucp-api`, which ultimately reach the mock-BFF.

---

## 4. mock-BFF API Surface

### Zone 1 — Public (no auth)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/kyc/sessions/start` | Start KYC session; `x-platform` header splits step plan (web vs mobile) |
| GET | `/api/v1/kyc/sessions/:sessionId/resume` | Resume to current incomplete step; auto-creates session on refresh |
| GET | `/api/v1/kyc/sessions/:sessionId/steps/:stepId` | Fetch specific step SDUI JSON |
| POST | `/api/v1/kyc/sessions/:sessionId/steps/:stepId/submit` | Submit answers, validate required fields, advance session |
| GET | `/api/v1/screen/home-wealth-hk` | Deliver Home Wealth Hub SDUI JSON (only if page status is LIVE) |
| GET | `/api/v1/screen/fx-viewpoint-hk` | Deliver FX Viewpoint market insight SDUI JSON (schemaVersion 3.0) |
| POST | `/api/v1/search` | Cosine-similarity semantic search over 30-item corpus (TF-IDF, bilingual) |
| GET | `/api/v1/search/corpus` | Return full embedding corpus for client-side caching |
| GET | `/health` | Health check; returns `{status:'ok', sessions: N}` |

### Zone 2 — Internal (requires `x-mock-staff-role` header)

Simulates Azure AD JWT auth. Pass one of: `AUTHOR`, `APPROVER`, `AUDITOR`, `ADMIN` as the `x-mock-staff-role` header. Optionally pass `x-mock-staff-id` and `x-mock-biz-line`.

**Content CMS:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/content` | List all content with per-item accessLevel based on caller's biz line |
| GET | `/api/v1/content/:contentId` | Get single content item |
| PUT | `/api/v1/content/:contentId` | Edit content (AUTHOR of same biz line or ADMIN only) |
| POST | `/api/v1/content/:contentId/approve` | Approve content (APPROVER/ADMIN; Maker-Checker enforced) |
| GET | `/api/v1/audit-log` | KYC/content audit log (AUDITOR + ADMIN only) |

**UCP Page Lifecycle:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/ucp/pages` | List all UCP pages (summary) |
| GET | `/api/v1/ucp/pages/:pageId` | Get full page layout with slices |
| PUT | `/api/v1/ucp/pages/:pageId` | Save draft layout (AUTHOR/ADMIN; blocked if PENDING_APPROVAL) |
| POST | `/api/v1/ucp/pages/:pageId/submit` | Submit page for approval; creates WorkflowEntry |
| GET | `/api/v1/ucp/workflow` | List pending workflow entries |
| POST | `/api/v1/ucp/workflow/:entryId/approve` | Approve workflow entry (APPROVER/ADMIN; Maker-Checker) |
| POST | `/api/v1/ucp/workflow/:entryId/reject` | Reject with mandatory comment |
| POST | `/api/v1/ucp/workflow/:entryId/publish` | Publish approved entry to production |
| GET | `/api/v1/ucp/content-assets` | Content asset library (`?type=VIDEO|IMAGE|DOCUMENT&status=ACTIVE|ARCHIVED&q=`) |
| GET | `/api/v1/ucp/components` | Component registry (`?category=&status=ACTIVE|DEPRECATED`) |
| GET | `/api/v1/ucp/audit-log` | UCP audit trail (AUDITOR + ADMIN only) |
| GET | `/api/v1/ucp/preview/:pageIdOrEntryId` | HTML preview page; `?stage=preview|approval` |

---

## 5. Seed Data

The mock-BFF starts with pre-seeded in-memory data:

| Data | Description |
|------|-------------|
| KYC step plan | 10 steps across 5 categories (CIP, BIOMETRIC, CDD, OPENBANKING, DECLARATION); branching logic on nationality |
| `home-wealth-hk` page | 10 slice sections: HEADER_NAV, QUICK_ACCESS, PROMO_BANNER, FUNCTION_GRID, AI_ASSISTANT, AD_BANNER, FLASH_LOAN, WEALTH_SELECTION, FEATURED_RANKINGS, LIFE_DEALS |
| `fx-viewpoint-hk` page | 3 slices: VIDEO_PLAYER, MARKET_BRIEFING_TEXT, CONTACT_RM_CTA (schema v3.0) |
| Content assets | 8 assets (videos, images, documents) with UCP asset IDs |
| Component registry | 14 slice type definitions with configurable props, versions, maintainer info |
| Search corpus | 30 bilingual (EN/ZH) items with TF-IDF embeddings |

---

## 6. Quick Start

```bash
# Terminal 1 — mock-BFF
cd mock-bff && npm install && node server.js
# → http://localhost:4000

# Terminal 2 — UCP Console
cd ucp-console && npm install && npm run dev
# → http://localhost:3001

# Terminal 3 — OCDP Console
cd ocdp-console && npm install && npm run dev
# → http://localhost:3002

# Terminal 4 — web SDUI client
cd web-sdui && npm install && npm run dev
# → http://localhost:5173
```

---

## 7. Relationship to Production Architecture

| Local (mock) | Production |
|-------------|------------|
| `mock-bff/server.js` | `bff-java` (Spring Boot 3 / WebFlux) + Redis + PostgreSQL |
| `x-mock-staff-role` header | Azure AD OAuth2 JWT with AD group claims |
| In-memory Maps | Redis (SDUI cache) + PostgreSQL (audit, content, workflow) |
| Vite proxy `/api` | API Gateway / EKS Ingress |
| `ucp-console/public/media/*` | CDN (CloudFront / Tencent) + Cloud Storage |
