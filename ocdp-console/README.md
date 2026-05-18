# OCDP Console — HSBC Digital Sales Promotion Ecosystem

**Omni-Channel Content Delivery Platform** — the staff-facing authoring console for creating, reviewing, and publishing SDUI pages and journeys across iOS, Android, HarmonyOS NEXT, Web, and WeChat channels.

---

## What This Is

The OCDP Console is a React 18 + TypeScript + Vite single-page application that lets content editors and approvers:

- **Author** SDUI pages with a visual slice canvas (drag-and-drop slice ordering, per-slice prop configuration)
- **Pick content from two peer sources** — the **left-hand content sidebar** lets authors browse and select content from either **UCP** (internal asset library) or **HSBC AEM** (Adobe Experience Manager enterprise CMS); selected content stored as `contentRef: { source: "UCP" | "AEM", id: "..." }` per slice
- **Configure channels** — select SDUI targets (iOS/Android/HarmonyNext/Web) or Web Standard (SEO) or WeChat
- **Manage journeys** — assemble multi-step user flows from authored pages
- **Run Maker-Checker approval** — AUTHOR submits → APPROVER approves/rejects per market instance
- **Assess AEO/SEO quality** — automatic 100-point scoring modal on submit for Web Standard pages
- **Monitor analytics** — AEO panel (citation share, grade), statistics dashboard (usage, CPS bands)
- **Configure AI Search** — Admin panel to manage per-app semantic search corpora; content sources include OCDP pages and AEM URLs (both providers); corpus rebuild triggers `POST /api/v1/search/config/{id}/rebuild` on the BFF
- **Author in multiple languages** — locale pill bar lets authors view and edit translated copy per slice; supports en, zh-HK, zh-CN, ar (RTL), es
- **Accessible to all users** — WCAG 2.1 AA compliant: skip links, keyboard navigation, screen-reader live regions, visible focus rings, colour-plus-text status labels

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
OCDP (:3002) → /aem-api → mock-BFF (:4000) → /aem/** (simulated AEM Content Delivery API)
```

---

## Key Features

### Page Editor (`/deliver` → Pages tab)

- Slice canvas: add/reorder/remove slices from the UCP component registry
- Per-slice prop editing (text, URLs, deep links, tab configs)
- **Left-hand content sidebar** — two tabs:
  - **UCP** tab: browse the UCP content library (assets, components, templates) and drag items onto slices
  - **AEM** tab: browse HSBC AEM content fragments, experience fragments, and assets via the AEM Content Delivery API; drag items onto slices
  - Selected item stored as `contentRef: { source: "UCP" | "AEM", id: "..." }` in the slice definition
- **Locale pill bar** — switch between supported locales (en, zh-HK, zh-CN, ar, es); translatable props (title, subtitle, ctaText, altText, body) become locale-editable; RTL canvas layout activates for Arabic
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

### AI Search Admin (`/admin` → AI Search tab)

Operators configure the semantic search corpus for each HSBC app (`iOS`, `Android`, `HarmonyNext`, `Web`). One config per app platform.

**What operators configure:**

| Field | Description |
|-------|-------------|
| Quick Access Source | Entry-point functions. Provide either a **remote URL** (BFF fetches JSON at rebuild time) or paste **inline JSON** directly |
| Content Sources | Pages to make searchable. Each source is an **OCDP Page** (by pageId — live/approved only) or an **AEM URL** (HSBC AEM as peer content provider) |
| Refresh Schedule | `Manual only` / `Every hour` / `Every day` |
| Search Endpoint Override | Optional — leave blank to use default BFF endpoint |

**Corpus Rebuild:**

Click **"Rebuild Corpus"** → calls `POST /api/v1/search/config/{configId}/rebuild` → BFF ingests quick-access entries + content sources → card updates with corpus size and rebuild timestamp.

**Runtime:** The `AI_SEARCH_BAR` and `HOME_SEARCH_HEADER` SDUI slice types (on all four platforms) send `POST /api/v1/search` with `{ query, appId }` to the BFF, which ranks the per-app corpus and returns results. `GET /api/v1/search/corpus?appId=` is available for client-side caching.

### Multi-Language Authoring (i18n)

The page editor and journey editor both support multi-locale authoring:

| Locale | Language | Notes |
|--------|----------|-------|
| `en` | English | Primary authoring locale |
| `zh-HK` | Traditional Chinese | HK market |
| `zh-CN` | Simplified Chinese | Mainland China |
| `ar` | Arabic | RTL layout auto-applied to canvas |
| `es` | Spanish | LATAM markets |

Translations live in `page.translations[locale][instanceId][propKey]`. The `getSliceProps()` helper in `src/utils/i18n.ts` merges them at render time. The language selector also appears in the console header for a global preview locale.

### Accessibility (WCAG 2.1 AA)

- Skip-to-content link at page top (`id="main-content"` on main area)
- Keyboard-navigable: all panels, modals, and dropdown menus
- `:focus-visible` focus rings on all interactive elements
- Toast alerts: `role="status"` + `aria-live="polite"`
- All form inputs have `<label>` associations; `aria-required` on required fields
- Icon buttons have `aria-label`; status badges use colour + text (not colour alone)
- HIVE token colours meet ≥ 4.5:1 contrast ratio for normal text

---

## Source Layout

```
ocdp-console/src/
  components/
    deliver/
      PageLibraryPanel.tsx        ← Pages tab: list, detail drawer, AEO modal integration
      PageEditorView.tsx          ← Visual slice canvas editor + locale pill bar
      JourneyBuilderPanel.tsx     ← Journeys tab: builder + AEO modal + locale selector
      ApprovalQueuePanel.tsx      ← Maker-Checker approval queue
      AEOAssessmentModal.tsx      ← 100-point AEO assessment modal
      LanguageSelector.tsx        ← Locale pill UI (shared across editor/header)
    admin/
      AISearchAdminPanel.tsx      ← AI Search corpus config per app (ios/android/harmonynext/web)
                                     Content sources: OCDP pages + AEM URLs (peer provider)
                                     Quick-access source: remote URL or inline JSON
                                     Corpus rebuild: POST /api/v1/search/config/{id}/rebuild
    analyse/
      AEOPanel.tsx                ← AEO citation share + grade history
      StatisticsPanel.tsx         ← Usage metrics dashboard
    layout/
      OCDPHeader.tsx              ← Console header with language selector dropdown
    shared/
      Toast.tsx                   ← role="status" aria-live="polite" for screen readers
  store/
    OCDPStore.tsx                 ← useReducer store: pages, journeys, approvals, AEO scores, translations, aiSearchConfigs
    mockData.ts                   ← Canonical page/slice definitions (source of truth for SDUI)
  api/
    semanticSearch.ts             ← BFF search API client: semanticSearch(), fetchSearchCorpus(), rebuildSearchCorpus()
  types/
    ocdp.ts                       ← AISearchConfig, AISearchContentSource, AISearchAppId, AISearchContentSourceType
  utils/
    aeoCalculator.ts              ← AEO/SEO scoring engine
    i18n.ts                       ← SUPPORTED_LOCALES, getSliceProps(), translateSliceProps(), mockTranslate()
  tokens/
    global.css                    ← :focus-visible, skip-link, [dir="rtl"] CSS rules
  App.tsx                         ← Top-level routing: /deliver, /analyse, /admin; skip-link; id="main-content"
```

---

## Canonical SDUI Design — Home Hub (HK)

The file `src/store/mockData.ts` contains the authoritative slice design for `PAGE_HOME_HUB` (`home-hub-hk`). All four SDUI platform implementations (iOS, Android, HarmonyOS NEXT, Web) must match this canonical 9-slice layout:

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
