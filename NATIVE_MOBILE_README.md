# HSBC DSP SDUI — Native Mobile Implementation

## Architecture

The SDUI ecosystem spans three mobile platforms plus the mock BFF:

```
mock-bff/          ← Node.js mock server (port 4000) — shared by all platforms
ios-sdui/          ← SwiftUI + iOS (Xcode / iPhone Simulator)
android-sdui/      ← Jetpack Compose + Kotlin (Android Studio / Emulator)
harmonynext-sdui/  ← ArkTS / ArkUI (DevEco Studio / HarmonyOS Emulator)
```

Both journeys are supported on all platforms:
- **OBKYC Journey** — 11-step Open Banking KYC with branching identity questions
- **Wealth Page** — Portfolio overview, holdings, recommendations, market data

---

## Redux / Unidirectional Data Flow

All three platforms implement Redux-style state management. A single store owns all state; views dispatch actions; the store applies pure state mutations then executes async effects.

```
View ──dispatch(action)──► Store ──reduce(action)──► new State ──► View re-renders
                                └──handleEffect(action)──► network call ──► dispatch(result)
```

| Concept | iOS | Android | HarmonyNext |
|---------|-----|---------|-------------|
| Store | `AppStore` (`@Observable` class) | `KYCViewModel` (ViewModel + StateFlow) | `KYCStore` (`@Observed` class) |
| State | Flat properties on `AppStore` | `KYCUiState` (immutable `data class`) | `KYCState` (`@Observed` class) |
| Actions | `KYCAction` enum (typed cases) | Named methods (`startSession`, `setAnswer`, `submitStep`) | `KYCAction` interface (string `type` + optional fields) |
| Reducer | `reduce(_ action: KYCAction)` | `_state.update { it.copy(...) }` | `KYCState.dispatch(action)` |
| Effects | `handleEffect(_ action)` async | `viewModelScope.launch { ... }` | `KYCStore.handleEffect(action)` |
| Reactivity | `@Observable` / `@Environment` | `collectAsStateWithLifecycle()` | `@Observed` / `@ObjectLink` |

### Dispatch examples

```swift
// iOS — dispatch enum action
store.dispatch(.startSession)
store.dispatch(.setAnswer(questionId: "q_first_name", value: AnyCodable(v)))
store.dispatch(.submitStep)
```

```kotlin
// Android — named ViewModel methods (equivalent to dispatch)
viewModel.startSession()
viewModel.setAnswer("q_first_name", v)
viewModel.submitStep()
```

```typescript
// HarmonyNext — dispatch action object (shell components use KYCStore)
store.dispatch({ type: 'START_SESSION' })
store.dispatch({ type: 'SUBMIT_STEP' })
// Step components use KYCState directly for answer capture
state.setAnswer('q_first_name', v as ESObject)
```

---

## 1. Start the Mock BFF (required by all platforms)

```bash
cd mock-bff
npm install
node server.js
# Listening on http://localhost:4000
```

Keep this running in a terminal tab.

---

## 2. iOS — Run in Simulator

### Prerequisites
- macOS with Xcode 16+
- iPhone Simulator (any model, iOS 17+)

### Steps

1. Open the Xcode project:
   ```bash
   open ios-sdui/HSBCSDUI.xcodeproj
   ```

2. Select the `HSBCSDUI` scheme and an iPhone simulator target (e.g. **iPhone 15 Pro**).

3. Press **⌘R** (Run).

4. The app launches with two tabs:
   - **OBKYC** tab → tap "Begin Application" to start the 11-step KYC journey
   - **Wealth** tab → immediately shows portfolio overview, holdings, recommendations, and market data

### BFF connection (simulator uses `127.0.0.1:4000`)
```swift
// KYCNetworkService.swift
#if targetEnvironment(simulator)
private let BASE_URL = "http://127.0.0.1:4000/api/v1"
```

For a **real device**, replace the IP with your Mac's LAN address.

---

## 3. Android — Run in Emulator

### Prerequisites
- Android Studio Ladybug (2024.2+) or newer
- Android Virtual Device (AVD): Pixel 7 / API 35+

### Steps

1. Open **android-sdui/** as an Android Studio project.

2. Let Gradle sync complete.

3. Start a **Pixel 7 / API 35** emulator and click **Run ▶**.

4. The app launches showing:
   - **OBKYC** bottom nav tab → tap "Begin Application"
   - **Wealth** bottom nav tab → full wealth dashboard

### BFF connection (emulator uses `10.0.2.2:4000`)
```kotlin
// KYCNetworkService.kt
private const val BASE_URL = "http://10.0.2.2:4000/api/v1/"
```

---

## 4. HarmonyNext — Run in Emulator

### Prerequisites
- **DevEco Studio** 5.0.3+ (Huawei developer portal download)
- HarmonyOS SDK API 12 (HarmonyOS 5.0.3)
- A HarmonyOS Phone emulator (Phone 6.0-inch model)

### Steps

1. Open DevEco Studio → **File → Open** → select `harmonynext-sdui/`.

2. Let ohpm resolve dependencies.

3. Start a **Phone** emulator and click **Run ▶**.

4. The app loads with bottom tab bar:
   - **🪪 OBKYC** tab → KYC journey
   - **📈 Wealth** tab → Wealth page

### BFF connection (emulator uses `10.0.2.2:4000`)
```typescript
// KYCNetworkService.ets
const BASE_URL = 'http://10.0.2.2:4000/api/v1'
```

---

## 5. KYC Journey — 11 Mobile Steps (All Platforms)

Routing is done on the **primary question ID** (`payload.layout.children[0].id`), not the step ID.

| # | Primary Question ID | Step Content |
|---|--------------------|-|
| 1 | `q_first_name` | First / Middle / Last name + Date of Birth |
| 2 | `q_nationality` | Nationality (country picker) |
| 3 | `q_hkid_number` / `q_mainland_id` / `q_passport_number` | ID document — nationality-conditional |
| 4 | `q_hkid_front` | Document photo upload (front + back for HKID) |
| 5 | `q_email` | Email + mobile phone |
| 6 | `q_addr_line1` | HK address — line1 + line2 + district |
| 7 | `q_employment_status` | Employment status + annual income |
| 8 | `q_source_of_funds` | Source of funds + account purpose |
| 9 | `q_liveness` | Selfie + liveness check |
| 10 | `q_ob_consent` | Open Banking — bank picker + consent |
| 11 | `q_pep_status` | PEP status + two legal declarations |

---

## 6. File Map

```
ios-sdui/HSBCSDUI/
  AppStore.swift                ← Redux store: KYCAction enum, dispatch(), reduce(), handleEffect()
  SDUIModels.swift              ← Codable DTOs: SDUIScreenPayload, AnyCodable, KYC reference data
  KYCNetworkService.swift       ← HTTP client (URLSession)
  KYCShellViews.swift           ← Welcome, journey shell, progress bar, nav bar
  KYCStepViews.swift            ← 11 step views (KYCNameStep, KYCAddressStep, etc.)
  KYCSDUIStepRouter.swift       ← primaryQuestionId → SwiftUI view router
  HiveTokens.swift              ← Design tokens (colour, spacing, typography)
  HSBCSduiApp.swift              ← App entry + journey selector
  WealthPageView.swift          ← Wealth page (4 tabs)
  Analytics/TealiumClient.swift ← Analytics client
  FXViewpoint/FXViewpointView.swift
  Wealth/AISearchView.swift

android-sdui/app/src/main/java/com/hsbc/sdui/
  MainActivity.kt               ← Bottom nav (OBKYC + Wealth)
  kyc/
    KYCModels.kt                ← DTOs (SDUIScreenPayload, KYCUiState, AnswerEntry, …)
    KYCViewModel.kt             ← Redux store: startSession(), setAnswer(), submitStep()
    KYCNetworkService.kt        ← Retrofit API client
    KYCShellViews.kt            ← Welcome, journey shell, progress bar, nav bar
    KYCStepViews.kt             ← 11 step composables
    KYCStepRouter.kt            ← primaryQuestionId → Composable router + kycStepTitle()
  wealth/WealthPageScreen.kt    ← Wealth page (4 tabs)
  analytics/TealiumClient.kt    ← Analytics client

harmonynext-sdui/entry/src/main/ets/
  pages/Index.ets               ← Tab entry: @State kycStore: KYCStore
  common/HiveTokens.ets         ← Design tokens namespace
  models/SDUIModels.ets         ← ArkTS interfaces + KYCAction + KYCState (reducer)
  kyc/
    KYCStore.ets                ← Redux store: @Observed KYCStore, dispatch(), handleEffect()
    KYCShellViews.ets           ← Welcome, journey shell, step router (@ObjectLink store: KYCStore)
    KYCStepViews.ets            ← 11 @Component step views (@ObjectLink state: KYCState)
  network/
    KYCNetworkService.ets       ← HTTP via @ohos.net.http
    SensorDataClient.ets        ← Analytics client
  wealth/WealthPage.ets         ← Wealth page (4 tabs)
  fxviewpoint/FXViewpointPage.ets

mock-bff/
  server.js                     ← Express mock BFF (port 4000)
                                   GET /api/v1/kyc/sessions/:id/resume
                                   GET /api/v1/kyc/sessions/:id/steps/:stepId
                                   POST /api/v1/kyc/sessions/:id/steps/:stepId/submit
```

---

## 7. API Contract

All platforms send `x-platform: ios | android | harmonynext` header to trigger platform-specific step splitting.

```
POST /api/v1/kyc/sessions/start
  Header: x-platform: ios
  Body:   { "journeyType": "PERSONAL_ACCOUNT_OPENING", "market": "HK" }
  → { "sessionId": "kyc-sess-xxx", "totalSteps": 11, "platform": "mobile" }

GET  /api/v1/kyc/sessions/:sessionId/resume
  Header: x-platform: ios, x-sdui-version: 2.3
  → SDUIScreenPayload (first incomplete step)

GET  /api/v1/kyc/sessions/:sessionId/steps/:stepId
  Header: x-platform: ios, x-sdui-version: 2.3
  → SDUIScreenPayload

POST /api/v1/kyc/sessions/:sessionId/steps/:stepId/submit
  Body: { "answers": [{ "questionId": "q_first_name", "value": "TAI MAN" }] }
  → { "status": "NEXT_STEP", "nextStepId": "step-002", "totalSteps": 11 }
  → { "status": "COMPLETE" }
  → { "status": "INVALID", "validationErrors": [...] }
```
