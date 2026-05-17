# DSP Ecosystem — Implementation Summary

**Last Updated:** 2026-05-12  
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
| iOS (SwiftUI) | `ios-sdui/HSBCSDUI/HomePageView.swift` | `HomeSDUIViewModel` async fetch → `SDUISliceView` dispatcher | 9 `WH*` default components |
| Android (Compose) | `android-sdui/…/home/HomePageScreen.kt` | `HomeLoadState.Done` → `SDUISliceView` dispatcher | 9 `WH*` composables |
| HarmonyOS NEXT (ArkTS) | `harmonynext-sdui/…/home/HomePage.ets` | `LOAD_DONE` → `SDUISliceView.renderSlice()` if/else chain | 9 `SDUI*` components |
| Web (React/TS) | `web-sdui/src/pages/home/HomePage.tsx` | Fetch → `renderSlice()` switch | 9 inline React components |

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

## 3. AEO/SEO Assessment Tool (OCDP Console)

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

## 4. Bug Fixes Applied

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

## 5. Key Platform Constraints Documented

| Platform | Constraint |
|----------|-----------|
| ArkTS | `switch` statements forbidden inside `build()` / `@Builder`; use `if/else if` chains |
| ArkTS | Variable declarations (`const`, `let`) forbidden inside UI builder blocks; extract to `private` helper methods |
| ArkTS | `as ESObject[]` treated as `any[]` by compiler; use `as Array<T>` with explicit element type |
| Kotlin | `private val` at file top-level and `internal val` in same package both become package-level declarations and conflict |
| Tealium (iOS/Android/Web) | Overseas markets; `userId` SHA-256 hashed before event send |
| SensorData (HarmonyNext) | China-resident endpoints; required for PIPL compliance on HarmonyOS NEXT |
