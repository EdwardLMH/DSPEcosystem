# OCDP Console — HSBC Digital Sales Promotion Platform

**Omni-Channel Content Delivery Platform** — the staff-facing authoring console for creating, reviewing, and publishing SDUI pages and journeys across iOS, Android, HarmonyOS NEXT, Web, and WeChat channels.

---

## What This Is

The OCDP Console is a React 18 + TypeScript + Vite single-page application that lets content editors and approvers:

- **Author** SDUI pages with a visual slice canvas (drag-and-drop slice ordering, per-slice prop configuration)
- **Configure channels** — select SDUI targets (iOS/Android/HarmonyNext/Web) or Web Standard (SEO) or WeChat
- **Manage journeys** — assemble multi-step user flows from authored pages
- **Run Maker-Checker approval** — AUTHOR submits → APPROVER approves/rejects per market instance
- **Assess AEO/SEO quality** — automatic 100-point scoring modal on submit for Web Standard pages
- **Monitor analytics** — AEO panel (citation share, grade), statistics dashboard (usage, CPS bands)

---

## Quick Start

```bash
# From repo root: start dependencies first
cd mock-bff && npm install && node server.js &   # Port 4000
cd ucp-console && npm install && npm run dev &   # Port 3001

# Then start OCDP Console
cd ocdp-console
npm install
npm run dev   # Port 3002
```

Open [http://localhost:3002](http://localhost:3002).

**Proxy chain:**
```
OCDP (:3002) → /ucp-api → UCP Console (:3001) → /api → mock-BFF (:4000)
OCDP (:3002) → /media   → UCP Console (:3001) → /media → mock-BFF static files
```

---

## Key Features

### Page Editor (`/deliver` → Pages tab)

- Slice canvas: add/reorder/remove slices from the UCP component registry
- Per-slice prop editing (text, URLs, deep links, tab configs)
- Channel selector: SDUI (iOS / Android / HarmonyNext / Web), WEB_STANDARD, WEB_WECHAT
- AEO metadata fields for Web Standard (title, description, slug)
- Submit for Approval → triggers AEO Assessment modal for Web Standard pages

### AEO Assessment (Auto-triggered on Submit)

Applies to Web Standard channel only. Scores the page out of 100:

| Category | Weight |
|----------|--------|
| SEO Metadata (title, description, slug) | 40 pts |
| Content Structure (FAQ, FinancialProduct, structured nav) | 30 pts |
| Content Quality (freshness, author credentials) | 20 pts |
| Technical SEO (direct answers, rich media) | 10 pts |

**Grades:** A (90–100) · B (80–89) · C (70–79) · D (60–69) · F (0–59)

The modal is non-blocking — editors can submit even with a low score (warning shown for D/F).

### Journey Builder (`/deliver` → Journeys tab)

Assembles sequences of pages into multi-step user flows. Submit triggers AEO assessment if any page in the journey is Web Standard channel.

### Maker-Checker Queue (`/deliver` → Approve tab)

Lists all pages/journeys in `PENDING_APPROVAL` state. APPROVERs can approve or reject with a comment. Same-person restriction enforced.

### Statistics & AEO Panel (`/analyse`)

- AEO/SEO Scores panel: per-page grade history
- Statistics dashboard: slice usage counts, CPS band distribution

---

## Source Layout

```
ocdp-console/src/
  components/
    deliver/
      PageLibraryPanel.tsx        ← Pages tab: list, detail drawer, AEO modal integration
      PageEditorView.tsx          ← Visual slice canvas editor
      JourneyBuilderPanel.tsx     ← Journeys tab: builder + AEO modal integration
      ApprovalQueuePanel.tsx      ← Maker-Checker approval queue
      AEOAssessmentModal.tsx      ← 100-point AEO assessment modal
    analyse/
      AEOPanel.tsx                ← AEO citation share + grade history
      StatisticsPanel.tsx         ← Usage metrics dashboard
  store/
    OCDPStore.tsx                 ← useReducer store: pages, journeys, approvals, AEO scores
    mockData.ts                   ← Canonical page/slice definitions (source of truth for SDUI)
  utils/
    aeoCalculator.ts              ← AEO/SEO scoring engine
  App.tsx                         ← Top-level routing: /deliver, /analyse, /admin
```

---

## Canonical SDUI Design — Home Hub (HK)

The file `src/store/mockData.ts` contains the authoritative slice design for `PAGE_HOME_WEALTH` (`home-wealth-hk`). All four SDUI platform implementations (iOS, Android, HarmonyOS NEXT, Web) must match this canonical 9-slice layout:

| # | Slice Type |
|---|-----------|
| 1 | `HOME_SEARCH_HEADER` |
| 2 | `COMBO_QUICK_ACCESS` |
| 3 | `CARD_ACTIVATION_BANNER` |
| 4 | `QUEST_BANNER` |
| 5 | `FEATURE_PRODUCT` |
| 6 | `WEALTH_STUDIO_CAROUSEL` |
| 7 | `GUIDES_INSIGHTS` |
| 8 | `FX_WATCHLIST` |
| 9 | `DISCOVER_MORE` |

---

## Role-Based Access (mock mode)

In local development, pass `x-mock-staff-role` header to simulate staff roles:

| Role header value | Permissions |
|------------------|-------------|
| `WEALTH-AUTHOR` | Create/edit wealth pages and journeys |
| `WEALTH-APPROVER` | Approve/reject wealth content |
| `CARDS-AUTHOR` | Cards business line authoring |
| `CARDS-APPROVER` | Cards business line approvals |
| `AUDITOR` | Read-only audit log access |
| `ADMIN` | Full access |

In production this is enforced by Spring Security + Azure AD JWT (HSBC OAuth 2.0).

---

## Technology

- **Runtime:** React 18, TypeScript 5, Vite
- **State:** `useReducer` + `useContext` (no external state library)
- **API:** Proxied to UCP Console (:3001) and mock-BFF (:4000)
- **Build:** `npm run build` → `dist/` (served by CDN in production)

---

## Licence

Internal — Confidential  
© 2026 The Hongkong and Shanghai Banking Corporation Limited
