# SDUI Preview Workflow — On-Device Preview Before Production

**Document Version:** 1.0  
**Date:** 2026-04-19  
**Scope:** Preview URL generation, QR code delivery, device preview protocol, production swap  

---

## 1. The Problem

Standard CMS desktop previews show content in a browser iframe simulation. For a mobile-first
banking app using SDUI, this is insufficient:

- Native gestures, fonts, and spacing look different on real devices
- WeChat Mini Program rendering differs significantly from a browser
- Accessibility (Dynamic Type on iOS, font scaling on Android) only visible on device
- Approval on a simulated preview introduces risk — approver hasn't seen what customers will see

**Solution:** The Preview Service generates a time-limited, signed preview token URL. When
the app or Mini Program loads with this token, the BFF serves the pending SDUI JSON instead
of the live production JSON — on the approver's real device.

---

## 2. Preview Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SDUI Preview System                                      │
│                                                                                   │
│  CMS (Stripes)                                                                    │
│  ┌────────────────────────────────┐                                              │
│  │  Checker clicks                │                                              │
│  │  "Approve & Generate Preview"  │                                              │
│  └───────────────┬────────────────┘                                              │
│                  │  POST /preview/generate                                        │
│                  │  { contentId, screenId, variantId, expiresIn: 48h }           │
│                  ▼                                                                │
│  ┌────────────────────────────────┐                                              │
│  │   Preview Token Service (BFF)  │                                              │
│  │                                │                                              │
│  │  1. Validates Checker role     │                                              │
│  │  2. Generates signed JWT:      │                                              │
│  │     { contentId, screenId,     │                                              │
│  │       variantId, exp: +48h,    │                                              │
│  │       previewId: uuid }        │                                              │
│  │  3. Stores preview config in   │                                              │
│  │     Redis (key: previewId)     │                                              │
│  │  4. Returns:                   │                                              │
│  │     previewUrl, qrCodeIos,     │                                              │
│  │     qrCodeAndroid, qrCodeWx    │                                              │
│  └───────────────┬────────────────┘                                              │
│                  │                                                                │
│         ┌────────┴──────────────────────────────────┐                           │
│         │                                            │                           │
│  ┌──────▼──────────┐                    ┌───────────▼─────────────────────────┐ │
│  │  QR Code shown  │                    │  Preview URL served:                 │ │
│  │  in CMS to      │                    │  https://preview.hsbc.com.hk/        │ │
│  │  Checker        │                    │    ?pt=<signed-jwt>                  │ │
│  │                 │                    │                                       │ │
│  │  iOS/Android QR │                    │  When app/Mini hits BFF with pt=...: │ │
│  │  → deep link    │                    │  BFF validates JWT + serves preview  │ │
│  │    into HSBC app│                    │  SDUI JSON from Redis (not prod)     │ │
│  │                 │                    │                                       │ │
│  │  WeChat QR      │                    │  ⚠ Preview content visible ONLY to   │ │
│  │  → Mini Program │                    │    devices holding valid preview JWT  │ │
│  │    preview path │                    └─────────────────────────────────────┘ │
│  └─────────────────┘                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Preview URL and Deep Link Protocol

### 3.1 Preview URL Format

```
https://preview.hsbc.com.hk/screen/{screenId}?pt={signed-jwt}

Example:
https://preview.hsbc.com.hk/screen/home?pt=eyJhbGciOiJIUzI1NiJ9.eyJwcmV2aWV3...

JWT payload (signed with BFF preview secret):
{
  "previewId": "prev-8f3a2b1c",
  "contentId": "jade-upgrade-banner-q2",
  "screenId": "home",
  "variantId": "variant-B",
  "requestedBy": "m.wong@hsbc.com.hk",
  "iat": 1713571200,
  "exp": 1713744000    ← 48 hours from generation
}
```

### 3.2 iOS / Android Deep Link

```
App Universal Link / App Link:
  hsbc://preview?pt={signed-jwt}&screen={screenId}

Flow:
  1. Checker scans QR code with phone camera
  2. OS resolves universal link → opens HSBC Banking app
  3. App reads pt= param, stores it as "preview mode" flag
  4. App requests: GET /api/v1/screen/home
     Header: x-preview-token: {signed-jwt}
  5. BFF detects x-preview-token → bypasses normal SDUI composition
     → serves preview SDUI JSON from Redis
  6. App renders preview screen with "PREVIEW MODE" banner overlay
```

### 3.3 WeChat Mini Program Preview

```
WeChat Mini Program uses a different delivery mechanism:

Option A — Experience Version (体验版):
  1. BFF calls WeChat Open Platform API to submit Mini Program code with
     preview content baked into the specific page's initial data
  2. WeChat generates "Experience Version" QR code for specific tester WeChatIDs
  3. Checker scans and sees preview in actual WeChat Mini Program environment
  4. This is the most accurate preview for WeChat — uses real WeChat runtime

Option B — Preview Token in Mini Program:
  1. Mini Program reads pt= param from scene value
  2. Calls BFF with x-preview-token header
  3. BFF serves preview SDUI JSON
  4. Mini Program renders with "预览模式" (Preview Mode) banner

Recommended: Option A for visual fidelity; Option B for speed.
```

---

## 4. BFF Preview Resolution Flow

```
Request: GET /api/v1/screen/home
Headers: x-preview-token: eyJ...

┌─────────────────────────────────────────────────────────────┐
│                    BFF Screen Endpoint                       │
│                                                              │
│  1. Detect x-preview-token header present?                  │
│     YES → enter Preview Mode                                 │
│                                                              │
│  2. Validate JWT signature + expiry                          │
│     INVALID/EXPIRED → return 401 with:                       │
│     { "error": "preview_expired",                            │
│       "message": "Preview link expired. Request new link." } │
│                                                              │
│  3. Extract previewId from JWT                               │
│                                                              │
│  4. Fetch preview config from Redis:                         │
│     key: "preview:{previewId}"                               │
│     value: { contentId, screenId, variantId, ... }          │
│                                                              │
│  5. Compose SDUI JSON using preview contentId                │
│     (same composition engine, but content from               │
│      Stripes CMS staging/pending version)                    │
│                                                              │
│  6. Inject preview banner into SDUI JSON:                    │
│     { type: "PreviewModeBanner",                             │
│       props: { message: "PREVIEW — Not live yet",            │
│                approveUrl: "/preview/approve/{previewId}" }} │
│                                                              │
│  7. Return preview SDUI JSON                                 │
│     Header: x-sdui-preview-mode: true                        │
│                                                              │
│  ⚠ Preview responses are NEVER cached at CDN or Redis        │
│    (cache-control: no-store)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Preview Mode UI on Device

### 5.1 Preview Banner (Injected by BFF into SDUI JSON)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔶  PREVIEW MODE — Not live yet                              │
│     Jade Upgrade Banner Q2  |  Expires: 2026-04-21 10:45   │
│     Checker: m.wong@hsbc.com.hk                             │
└─────────────────────────────────────────────────────────────┘

[Normal SDUI screen content renders below as customer would see it]

┌─────────────────────────────────────────────────────────────┐
│ [Hero Image]                                                 │
│ Elevate to HSBC Jade                                         │
│ Exclusive benefits for Premier customers                     │
│ [Discover Jade Benefits]                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✅ Approve this content       ✗ Reject — needs changes     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Approve/Reject Flow on Device

```
Checker taps [✅ Approve this content]:

  App → POST /api/v1/preview/{previewId}/approve
  Headers: Authorization: Bearer {checker-jwt}
           x-preview-token: {preview-jwt}

  BFF:
    1. Validates checker is authorised (not the Maker)
    2. Updates content state: PENDING_PREVIEW → APPROVED
    3. Stores approval record: { approvedBy, deviceInfo, timestamp }
    4. Returns success + "Publish" or "Schedule" options

Checker taps [✗ Reject]:
  App → POST /api/v1/preview/{previewId}/reject
  Body: { comment: "Hero image too dark on OLED screen" }

  BFF:
    1. Updates content state: PENDING_PREVIEW → REJECTED_PREVIEW
    2. Notifies Maker via email with rejection comment
    3. Preview URL invalidated immediately
```

---

## 6. Production Swap — Preview → Live

```
After on-device approval:

┌─────────────────────────────────────────────────────────────────┐
│  In CMS (or on mobile via approval action):                      │
│                                                                   │
│  Checker confirms: "Publish Jade Upgrade Banner Q2 to prod?"     │
│                                                                   │
│  POST /api/v1/preview/{previewId}/publish                        │
│  Body: { publishMode: "immediate" | "scheduled",                 │
│          scheduledAt: "2026-05-01T01:00:00Z",                   │
│          channels: ["ios", "android", "web", "wechat"],          │
│          locales: ["en-HK", "zh-HK"] }                          │
│                                                                   │
│  BFF Preview Service:                                             │
│  1. Updates CMS content state → PUBLISHED                         │
│  2. Invalidates BFF Redis cache for affected screenIds            │
│     (all users on those screens get fresh SDUI JSON on next req) │
│  3. Sends CDN purge signal to CloudFront for anonymous screens     │
│  4. For WeChat: triggers WeChat Open Platform "submit for review" │
│     or "release" API (if using Experience Version flow)          │
│  5. Logs full audit record: published by, device, timestamp      │
│  6. Deletes preview token from Redis (cleanup)                    │
│  7. Notifies Maker: "Your content is now live"                   │
│                                                                   │
│  Result:                                                          │
│  Within seconds, ALL production devices on next SDUI refresh     │
│  see the new content — no app store release needed.              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Preview Token Security

| Security Control | Implementation |
|-----------------|----------------|
| Token signing | HMAC-SHA256 with BFF preview secret (rotated monthly) |
| Expiry | 48 hours from generation; non-renewable |
| Scope | Token bound to specific previewId + screenId; cannot be used for other screens |
| Revocation | Redis key deleted immediately on rejection or publish |
| Access log | Every preview token validation logged with IP + device fingerprint |
| Rate limiting | Max 5 preview token validations per token per hour |
| Role enforcement | Approve endpoint rejects if caller == original Maker (API-level, not just UI) |
| WeChat tester binding | Option A preview bound to specific WeChatID list (max 15 testers) |

---

## 8. Preview Workflow — Full Sequence Diagram

```
Maker        CMS UI         BFF             Redis       Checker App    Prod Devices
  │             │             │               │               │              │
  │──Submit──►  │             │               │               │              │
  │             │──POST────►  │               │               │              │
  │             │  /workflow  │──Store──────► │               │              │
  │             │  /submit    │  PENDING_REV  │               │              │
  │             │             │               │               │              │
  │             │    Checker notified (email) ──────────────► │              │
  │             │             │               │               │              │
  │             │◄── Checker opens CMS ───────────────────────│              │
  │             │    Reviews content                          │              │
  │             │    Clicks "Approve & Generate Preview"       │              │
  │             │──POST────►  │               │               │              │
  │             │  /preview   │──Store──────► │               │              │
  │             │  /generate  │  prev config  │               │              │
  │             │◄──QR codes─ │               │               │              │
  │             │             │               │               │              │
  │             │    Checker scans QR on phone ──────────────►│              │
  │             │             │◄──GET /screen/home ───────────│              │
  │             │             │   x-preview-token: jwt        │              │
  │             │             │──Fetch────►   │               │              │
  │             │             │  prev config  │               │              │
  │             │             │──Compose SDUI (preview)       │              │
  │             │             │──────Preview SDUI JSON───────►│              │
  │             │             │               │   Checker sees│              │
  │             │             │               │   on real     │              │
  │             │             │               │   device ✅   │              │
  │             │             │               │               │              │
  │             │             │◄──POST /preview/approve───────│              │
  │             │             │──Update state─►               │              │
  │             │             │  APPROVED     │               │              │
  │             │             │               │               │              │
  │             │◄─── CMS shows "Approved — Ready to Publish" │              │
  │             │             │               │               │              │
  │    Checker clicks [Publish to Production] │               │              │
  │             │──POST────►  │               │               │              │
  │             │  /preview   │──Update CMS state PUBLISHED   │              │
  │             │  /publish   │──Invalidate BFF cache──────►  │              │
  │             │             │──CDN purge                    │              │
  │             │             │               │               │              │
  │             │             │               │    Next SDUI request        │
  │             │             │◄──────────────────────────────────────────── │
  │             │             │──────Serve new production SDUI JSON─────────►│
  │             │             │               │               │   Sees new   │
  │             │             │               │               │   content ✅ │
```
