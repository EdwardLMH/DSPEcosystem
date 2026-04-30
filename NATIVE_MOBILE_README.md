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
- **OBKYC Journey** — 10-step Open Banking KYC with branching questions
- **Wealth Page** — Portfolio overview, holdings, recommendations, market data

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
   open ios-sdui/HSBCKyc.xcodeproj
   ```

2. Select the `HSBCKyc` scheme and an iPhone simulator target (e.g. **iPhone 15 Pro**).

3. Press **⌘R** (Run).

4. The app launches with two tabs:
   - **OBKYC** tab → tap "Begin Application" to start the 10-step KYC journey
   - **Wealth** tab → immediately shows portfolio overview, holdings, recommendations, and market data

### BFF connection (simulator uses `127.0.0.1:4000`)
The `KYCNetworkService.swift` already resolves `127.0.0.1` in the simulator build:
```swift
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

1. Open **android-sdui/** as an Android Studio project (File → Open → select the `android-sdui` folder).

2. Let Gradle sync complete.

3. In the AVD Manager, start a **Pixel 7 / API 35** emulator (or use a connected device).

4. Click **Run ▶** (or press **Shift+F10**).

5. The app launches showing:
   - **OBKYC** bottom nav tab → tap "Begin Application"
   - **Wealth** bottom nav tab → full wealth dashboard

### BFF connection (emulator uses `10.0.2.2:4000`)
`KYCNetworkService.kt` is pre-configured to route `10.0.2.2` (Android emulator loopback):
```kotlin
private const val BASE_URL = "http://10.0.2.2:4000/api/v1/"
```

### Ensure network permission in AndroidManifest.xml
The manifest must include:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## 4. HarmonyNext — Run in Emulator

### Prerequisites
- **DevEco Studio** 5.0.3+ (Huawei developer portal download)
- HarmonyOS SDK API 12 (HarmonyOS 5.0.3)
- A HarmonyOS Phone emulator (Phone 6.0-inch model)

### Steps

1. Open DevEco Studio.

2. Choose **File → Open** → select the `harmonynext-sdui/` folder.

3. Let ohpm (package manager) resolve dependencies.

4. In **Device Manager**, create or start a **Phone** emulator.

5. Click **Run ▶** (or press **Shift+F10**).

6. The app loads with a bottom tab bar:
   - **🪪 OBKYC** tab → KYC journey (tap "Begin Application")
   - **📈 Wealth** tab → Wealth page with market data

### BFF connection (emulator uses `10.0.2.2:4000`)
`KYCNetworkService.ets` is pre-configured with `http://10.0.2.2:4000/api/v1`.

HarmonyOS emulators share the Android emulator NAT convention — `10.0.2.2` routes to the host machine.

Ensure `ohos.permission.INTERNET` is declared in `module.json5` (already done).

---

## 5. KYC Journey Steps (all platforms)

| # | Step ID      | Content |
|---|-------------|---------|
| 1 | name        | First / Middle / Last name |
| 2 | dob         | Date of birth + nationality (country picker) |
| 3 | contact     | Mobile phone (+852 dial code) + email |
| 4 | identifier  | ID type picker + ID number |
| 5 | address     | HK address (flat, floor, building, street, district) |
| 6 | document    | Document type + camera/upload (front + back for HKID) |
| 7 | liveness    | Selfie simulation + liveness progress bar |
| 8 | wealth      | Occupation, annual income, source of funds |
| 9 | openbanking | Bank picker + consent → "Connect" simulates OAuth |
|10 | declaration | PEP status + two declarations |

---

## 6. SDUI JSON Schema

All platforms consume the same BFF at `GET /api/v1/kyc/sessions/:id/steps/:stepId` and `POST /api/v1/kyc/sessions/:id/steps/:stepId/submit`.

The `x-platform` header (`ios` / `android` / `harmonynext`) triggers platform-specific step splitting in the BFF:
- **Mobile**: max 3 questions per step → 10 steps for KYC
- **Web**: full sections → 7 steps for KYC

---

## 7. File Map

```
ios-sdui/HSBCKyc/
  App/HSBCKycApp.swift          ← Tab navigator (OBKYC + Wealth)
  DesignSystem/HiveTokens.swift ← Design tokens
  Store/AppStore.swift           ← Redux-like state + effects
  Network/KYCNetworkService.swift← HTTP client
  Network/SDUIModels.swift       ← Codable DTOs
  KYC/Screens/KYCShellViews.swift← Welcome, journey shell, nav bar
  KYC/Screens/KYCStepViews.swift ← 10 step views
  SDUI/Engine/KYCSDUIStepRouter.swift ← stepId → view router
  Wealth/WealthPageView.swift    ← Wealth page (4 tabs)

android-sdui/src/main/java/com/hsbc/sdui/
  MainActivity.kt                ← Bottom nav (OBKYC + Wealth)
  kyc/KYCModels.kt               ← DTOs + UI state
  kyc/KYCNetworkService.kt       ← Retrofit API
  kyc/KYCViewModel.kt            ← State + effects
  kyc/KYCShellViews.kt           ← Welcome, journey shell, nav bar
  kyc/KYCStepViews.kt            ← 10 step composables
  kyc/KYCStepRouter.kt           ← stepId → composable router
  wealth/WealthPageScreen.kt     ← Wealth page (4 tabs)

harmonynext-sdui/entry/src/main/ets/
  pages/Index.ets                ← Tabs entry (OBKYC + Wealth)
  common/HiveTokens.ets          ← Design tokens namespace
  models/SDUIModels.ets          ← ArkTS interfaces + KYCState
  network/KYCNetworkService.ets  ← HTTP via @ohos.net.http
  kyc/KYCStepViews.ets           ← 10 @Component step views
  kyc/KYCShellViews.ets          ← Welcome, journey shell, step router
  wealth/WealthPage.ets          ← Wealth page (4 tabs)
```
