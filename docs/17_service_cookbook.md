# Service Cookbook — Run the DSPE Local Stack

**Date:** 2026-05-20  
**Scope:** mock-BFF, UCP Console, OCDP Console, Web SDUI, Android SDUI, iOS SDUI and HarmonyNext SDUI

---

## 1. Prerequisites

Install the local toolchain:

| Area | Tool |
|------|------|
| Node services | Node.js 20+ and npm |
| Android | Android Studio, JDK 17, Android emulator |
| iOS | Xcode 15+ |
| HarmonyNext | DevEco Studio with the local Harmony SDK |

Native clients call the mock-BFF:

| Client | BFF base URL |
|--------|--------------|
| Web | same origin proxy or `http://localhost:4000` |
| iOS simulator | `http://127.0.0.1:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| Physical device | `http://{your-machine-lan-ip}:4000` |

---

## 2. Install Dependencies

Run once per checkout:

```bash
cd mock-bff && npm install
cd ../ucp-console && npm install
cd ../ocdp-console && npm install
cd ../web-sdui && npm install
```

Android uses Gradle wrapper dependencies. iOS currently uses the Xcode project directly.

---

## 3. Start Core Services

Use separate terminals.

```bash
cd mock-bff
npm start
```

```bash
cd ucp-console
npm run dev
```

```bash
cd ocdp-console
npm run dev
```

```bash
cd web-sdui
npm run dev
```

Default URLs:

| Service | URL |
|---------|-----|
| mock-BFF | `http://localhost:4000` |
| UCP Console | `http://localhost:3001` |
| OCDP Console | `http://localhost:5173` |
| Web SDUI | `http://localhost:3000` |

---

## 4. Seed and Test AI Search

OCDP seeds `HK HarmonyNext App Semantic Search` automatically when the local AI Search config table is empty.

1. Open `http://localhost:5173`.
2. Go to `AI Search`.
3. Open `HK HarmonyNext App Semantic Search`.
4. Review quick-access config, OCDP/AEM content sources, and governed video/image/file URLs.
5. Click `Rebuild Corpus`.

Smoke test from a terminal:

```bash
curl -sS -X POST http://localhost:4000/api/v1/search/config/ai-search-hk-harmonynext-sample/rebuild \
  -H 'Content-Type: application/json'
```

```bash
curl -sS -X POST http://localhost:4000/api/v1/search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "wealth studio video",
    "appId": "harmonynext",
    "responseMode": "a2ui",
    "customerSegment": "premier",
    "accountType": "wealth_account",
    "customerLocation": "HK",
    "limit": 5
  }'
```

Audience fields can also be sent as headers: `x-segment`, `x-account-type`, and `x-location`.

---

## 5. Run Web SDUI

Open:

```text
http://localhost:3000/?screen=home-hub-hk
```

Use the search bar in the Home Hub header. The web renderer sends:

```json
{
  "appId": "web",
  "responseMode": "a2ui",
  "customerSegment": "premier",
  "accountType": "wealth_account",
  "customerLocation": "HK"
}
```

Governed media/file results display their asset type and navigate to the governed URL.

---

## 6. Run Android SDUI

Compile:

```bash
cd android-sdui
./gradlew :app:compileDebugKotlin
```

Run from Android Studio:

1. Open `android-sdui`.
2. Select an emulator.
3. Run the `app` configuration.
4. Open Home Hub and tap the search bar.

The emulator resolves the mock-BFF through `http://10.0.2.2:4000`. The Android AI Search screen sends audience context and can open governed `assetUrl` results with `Intent.ACTION_VIEW`.

---

## 7. Run iOS SDUI

Open:

```bash
open ios-sdui/HSBCSDUI.xcodeproj
```

Then:

1. Select an iOS simulator.
2. Run the `HSBCSDUI` scheme.
3. Open Home Hub and tap the search bar.

The simulator calls `http://127.0.0.1:4000`. The iOS AI Search screen sends audience context and opens governed `assetUrl` results through `UIApplication.shared.open`.

---

## 8. Run HarmonyNext SDUI

Use DevEco Studio for the app shell:

1. Open `harmonynext-sdui`.
2. Ensure DevEco SDK paths match your local installation.
3. Build/run the `entry` module.

CLI build, if DevEco is installed in the default location:

```bash
cd harmonynext-sdui
DEVECO_SDK_HOME=/Applications/DevEco-Studio.app/Contents/sdk/default \
node /Applications/DevEco-Studio.app/Contents/tools/hvigor/hvigor/bin/hvigor.js \
  --mode module -p module=entry@default -p product=default assembleHap
```

---

## 9. Troubleshooting

| Symptom | Check |
|---------|-------|
| AI Search tab is empty | Refresh OCDP. The seeded config is retained when IndexedDB has no AI Search rows. |
| Rebuild says config not found | Open the config and click `Rebuild Corpus`; the console sends the full config body to mock-BFF. |
| Android cannot reach BFF | Use emulator URL `http://10.0.2.2:4000`; for a physical device use the LAN IP. |
| iOS cannot reach BFF | Use simulator URL `http://127.0.0.1:4000` and confirm mock-BFF is running. |
| Governed results do not appear | Confirm query audience matches the rule, e.g. `premier`, `wealth_account`, `HK`. |
| Port already in use | Stop the existing service or run the new process with another port where supported. |

