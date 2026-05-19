# DSP Ecosystem — Implementation Summary

**Last Updated:** 2026-05-20  
**Classification:** Internal — Confidential

---

## Overview

This document summarises the current implemented state of the HSBC Digital Sales Promotion (DSP) Ecosystem across all platform layers. It is a snapshot of what exists in this repository today, not a design aspiration.

---

## 1. Home Hub (HK) — 9-Slice SDUI Layout

The canonical "Home Hub (HK)" page (`pageId: home-hub-hk`) is defined in the OCDP console (`ocdp-console/src/store/mockData.ts`) and implemented identically across all four SDUI platforms. The technical page ID and API path remain `home-hub-hk` for compatibility, while the human-facing page name is consistently "Home Hub (HK)". All platforms support both a **live SDUI path** (served from the BFF JSON) and a **static fallback** (hardcoded component defaults for offline / pre-publish use).

### Slice Order & Types

| # | Slice Type | Description |
|---|-----------|-------------|
| 1 | `HOME_SEARCH_HEADER` | HSBC-red header with AI search bar, notifications, QR scanner |
| 2 | `COMBO_QUICK_ACCESS` | Scrollable tab strip (My pick / Invest / Global / HK Daily) + 2×5 icon quick-access grid |
| 3 | `CARD_ACTIVATION_BANNER` | Notification banner prompting card activation |
| 4 | `QUEST_BANNER` | Getting-started quest progress card with HSBC hexagon icon |
| 5 | `FEATURE_PRODUCT` | Tabbed fund list (Top-Performing / Thematic / All) showing 1Y returns |
| 6 | `WEALTH_STUDIO_CAROUSEL` | Premier Elite Wealth Studio horizontal video episode carousel |
| 7 | `GUIDES_INSIGHTS_CAROUSEL` | Article card carousel — investment guides and market insights |
| 8 | `FX_WATCHLIST` | Currency pair watchlist with Gold Forex Club tier badge (amber theme) |
| 9 | `DISCOVER_MORE_CAROUSEL` | Horizontal campaign card carousel — promotions and lifestyle offers |

### Platform Implementations

| Platform | File | SDUI Path | Static Fallback |
|----------|------|-----------|-----------------|
| iOS (SwiftUI Xcode project) | `ios-sdui/HSBCSDUI.xcodeproj`, `ios-sdui/HSBCSDUI/HSBCSduiApp.swift`, `ios-sdui/HSBCSDUI/HomePageView.swift` | `@main` SwiftUI `App` → `HomeSDUIViewModel` async fetch → `SDUISliceView` dispatcher | 9 `WH*` default components |
| Android (Compose) | `android-sdui/…/home/HomePageScreen.kt` | `HomeLoadState.Done` → `SDUISliceView` dispatcher | 9 `WH*` composables |
| HarmonyOS NEXT (ArkTS) | `harmonynext-sdui/…/home/HomePage.ets` | `LOAD_DONE` → `SDUISliceView.renderSlice()` if/else chain | 9 `SDUI*` components |
| Web (React/TS) | `web-sdui/src/pages/home/HomePage.tsx` | Fetch → `renderSlice()` switch | 9 inline React components |

The iOS app is a Swift/SwiftUI project, not a storyboard app. The active project is `ios-sdui/HSBCSDUI.xcodeproj`; `HSBCSduiApp.swift` provides the SwiftUI `@main` entry point, and all major screens are SwiftUI views with limited UIKit bridges only where native media playback or accessibility context requires it.

---

## 2. Analytics — New Event Helpers Added (All Platforms)

Three new analytics helpers were added to all four platform analytics clients during the Home Hub implementation:

| Event | Trigger | Platforms |
|-------|---------|-----------|
| `wealthStudioTapped(title, instanceId)` | User taps a Wealth Studio episode card | iOS (Tealium), Android (Tealium), HarmonyNext (SensorData), Web (Tealium) |
| `guidesTapped(title, instanceId)` | User taps a Guides & Insights article card | All four |
| `discoverMoreTapped(title, tag)` | User taps a Discover More campaign card | All four |

### Analytics Client Files

| Platform | File |
|----------|------|
| iOS | `ios-sdui/HSBCSDUI/Analytics/TealiumClient.swift` |
| Android | `android-sdui/…/analytics/TealiumClient.kt` |
| HarmonyOS NEXT | `harmonynext-sdui/…/network/SensorDataClient.ets` |
| Web | `web-sdui/src/analytics/TealiumClient.ts` |

HarmonyOS NEXT routes all analytics to SensorData (神策数据) rather than Tealium to satisfy China data residency requirements (PIPL).

---

## 3. AI Search — Governed Semantic Search Sample

OCDP now seeds a detailed `HK HarmonyNext App Semantic Search` sample so the AI Search admin tab is not empty on first launch.

| Area | Implemented state |
|------|-------------------|
| Configuration sources | Quick-access entry-point JSON, OCDP pages, AEM content URLs |
| Governed URL sources | Video, image and file URLs, including parent-folder based sources |
| Targeting model | Customer segment, account type and location visibility rules |
| Admin actions | Review, edit, add and delete configuration/content/URL sources |
| Runtime filtering | mock-BFF filters entry points, content and governed assets by audience before ranking |
| Client support | Web, iOS and Android send audience context and preserve `assetUrl` / `assetType`; HarmonyNext has tracing and search analytics hooks |

Key files:

| File | Role |
|------|------|
| `ocdp-console/src/store/mockData.ts` | Seeded HK HarmonyNext AI Search config |
| `ocdp-console/src/components/admin/AISearchAdminPanel.tsx` | AI Search admin cards and edit drawer |
| `mock-bff/server.js` | Corpus rebuild, audience filtering and semantic search endpoint |
| `mock-bff/sdui-v2.js` | A2UI result mapping for app clients |
| `web-sdui/src/components/AISearchBar.tsx` | Web search UI with governed asset result handling |
| `ios-sdui/HSBCSDUI/Home/AISearchView.swift` | iOS SwiftUI search UI with governed asset result handling |
| `android-sdui/app/src/main/java/com/hsbc/sdui/home/AISearchScreen.kt` | Android Compose search UI with governed asset result handling |

---

## 4. AEO/SEO Assessment Tool (OCDP Console)

Integrated into the OCDP submission workflow for Web Standard channel pages and journeys.

### Files

| File | Role |
|------|------|
| `ocdp-console/src/utils/aeoCalculator.ts` | 100-point scoring engine (SEO Metadata 40pt, Content Structure 30pt, Content Quality 20pt, Technical SEO 10pt) |
| `ocdp-console/src/components/deliver/AEOAssessmentModal.tsx` | A–F grade modal with expandable recommendations and submit/improve/cancel actions |
| `ocdp-console/src/components/deliver/PageLibraryPanel.tsx` | Modified: intercepts "Submit for Approval" for Web Standard pages |
| `ocdp-console/src/components/deliver/JourneyBuilderPanel.tsx` | Modified: same interception for journeys containing Web Standard pages |
| `ocdp-console/src/store/OCDPStore.tsx` | Modified: `SAVE_AEO_SCORE` action added |

### Grading Scale

| Grade | Score |
|-------|-------|
| A | 90–100 |
| B | 80–89 |
| C | 70–79 |
| D | 60–69 |
| F | 0–59 |

SDUI and WeChat channel pages bypass the assessment (no SEO relevance).

---

## 5. CI/CD and Deployment Automation

The repository now includes a root Jenkins pipeline and deployment helpers for both overseas AWS and mainland China.

| Area | Implemented state |
|------|-------------------|
| Jenkins | Root `Jenkinsfile` with `TARGET_PLATFORM=aws|mainland-china` |
| AWS | Terraform plan/apply, image build/push hook, EKS rollout/restart, S3/CloudFront static deploy, Route 53 site switch |
| Mainland China | `scripts/china-deploy.sh` integration for IKP runtime apply and Tencent COS/CDN static publish |
| Environments | AWS testing/prod regions plus `testing-cn` and `prod-cn` |
| Runbook | `docs/18_jenkins_cicd_cookbook.md` |

Mainland China authoring remains private in Alicloud, public runtime runs through IKP/Tencent edge, and telemetry/log/event handling must stay China-resident except for approved aggregate SLOs.

---

## 6. Observability — End-to-End Trace and Startup Timing

OpenTelemetry is the common monitoring standard in the design, with lightweight client bridges implemented in the prototypes.

| Platform | File | Implemented observability hooks |
|----------|------|---------------------------------|
| Web | `web-sdui/src/analytics/ObservabilityClient.ts` | `traceparent`, Home startup steps, Home fetch timing, AI Search timing |
| iOS | `ios-sdui/HSBCSDUI/Analytics/ObservabilityClient.swift` | `traceparent`, cold/warm app lifecycle, Home startup steps, Home fetch timing, AI Search timing |
| Android | `android-sdui/…/analytics/ObservabilityClient.kt` | `traceparent`, cold/warm activity lifecycle, Home startup steps, Home fetch timing, AI Search timing |
| HarmonyOS NEXT | `harmonynext-sdui/…/network/ObservabilityClient.ets` | SensorData operational events, `traceparent`, Home startup steps, network timing |

Operational events use low-cardinality names such as `operational_startup_step` and `operational_network_step`. The monitoring matrix, dashboards, SLOs, synthetic checks and China deployment boundaries are documented in `docs/19_observability_monitoring.md`.

---

## 7. Bug Fixes Applied

### iOS — Wealth Studio Carousel: video opened as a separate panel (HomePageView.swift)

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Tapping a carousel card opened the video as a new UI block above the section header, appearing as a separate screen/panel | `WHInlineVideoPlayer` was inserted at the top of the `VStack` — before the header. Activating it added a 210 pt block above all other content, causing the layout to shift downward visually | Moved the player into an `if/else` branch that **replaces** the `TabView` in the same position. The header always renders first. The 160 pt frame of the `TabView` is reused by the player when active. Pagination dots are hidden during playback (inside the `else` branch). Height corrected from 210 pt to 160 pt to match carousel card height |

**Layout after fix (`WHWealthStudioCarousel.body`):**
```
VStack {
  HStack { sectionTitle | moreLabel }      ← always visible
  if playingVideoUrl != nil {
    WHInlineVideoPlayer(...)               ← replaces carousel, same 160 pt height
    Spacer(14 pt)
  } else {
    TabView { carousel cards }             ← shown when not playing
    pagination dots
  }
}
```

### iOS — AVPlayerViewController full-screen expansion (FXViewpointView.swift)

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Video expanded full-screen on tap | `UIViewControllerRepresentable` + `AVPlayerViewController` always expands to fill the window (Apple framework design) | Replaced with `UIViewRepresentable` + custom `UIView` subclass (`WHPlayerView` / `FXPlayerView`) using `AVPlayerLayer` added as a `CALayer` sublayer. Player is now confined to the parent `.frame()`. |

### HarmonyOS NEXT — FX Watchlist blank data (HomePage.ets)

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| `SDUIFXWatchlist` showed no FX pair data | Component read `base`, `quote`, `rate`, `change` but BFF sends `pair`, `sellRate`, `buyRate`, `sellLabel`, `buyLabel` | Rewrote all field accessors to match BFF schema. Logic extracted into private helper methods (`pairLabel`, `pairSellRate`, `pairBuyRate`, `pairId`) |

### HarmonyOS NEXT — ArkTS Compiler Error 10905209 (HomePage.ets)

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `10905209` "Only UI component syntax can be written here" | `const r = raw as Record<string, string>` inside a `ForEach` builder lambda | Moved all record-cast logic into private methods called from the builder body. No `const`/`let` remains inside any builder block |

### HarmonyOS NEXT — ArkTS Type Errors (HomePage.ets)

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `arkts-no-any-unknown` (line 316) | `as ESObject[]` cast in `SDUIComboQuickAccess.tabs()` | Changed to `const raw: Array<string> = this.props['tabs'] as Array<string>` |
| `arkts-no-any-unknown` (line 496) | Same pattern in `SDUIFeatureProduct.tabs()` | Same fix applied |
| `arkts-no-any-unknown` (line 546) | `const tagsRaw = ... as ESObject[]` inside `Row{}` builder | Extracted to `fundTags(fund: ESObject): Array<string>` helper method |

### Android — Conflicting Declarations (HomePageScreen.kt)

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `Conflicting declarations: val HsbcRed`, `White`, `N50`, `N100`, `N400`, `N500`, `N700`, `N900` | `HomePageScreen.kt` declared `private val` colour tokens at package level; `WealthTokens.kt` in the same package already declared identical `internal val` tokens | Removed the duplicate 10-line colour block from `HomePageScreen.kt`; all colour references now resolve from `WealthTokens.kt` |

---

## 8. Key Platform Constraints Documented

| Platform | Constraint |
|----------|-----------|
| ArkTS | `switch` statements forbidden inside `build()` / `@Builder`; use `if/else if` chains |
| ArkTS | Variable declarations (`const`, `let`) forbidden inside UI builder blocks; extract to `private` helper methods |
| ArkTS | `as ESObject[]` treated as `any[]` by compiler; use `as Array<T>` with explicit element type |
| Kotlin | `private val` at file top-level and `internal val` in same package both become package-level declarations and conflict |
| Tealium (iOS/Android/Web) | Overseas markets; `userId` SHA-256 hashed before event send |
| SensorData (HarmonyNext) | China-resident endpoints; required for PIPL compliance on HarmonyOS NEXT |
| iOS project | Use `ios-sdui/HSBCSDUI.xcodeproj`; it is a SwiftUI app with `@main` in `HSBCSduiApp.swift` |
