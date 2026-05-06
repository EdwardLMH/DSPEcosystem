# Open Banking KYC — SDUI Architecture Design

**Document Version:** 2.0
**Date:** 2026-05-05
**Scope:** KYC JSON orchestration, platform-adaptive SDUI, branching question flows, mobile vs web step splitting, Redux state management

---

## 1. Overview and Problem Statement

### 1.1 The KYC Challenge

Open Banking KYC (Know Your Customer) journeys are uniquely complex for SDUI:

1. **Long, branching JSON from KYC system** — a single KYC session payload can contain 50–200 questions across multiple categories (identity, source of funds, risk profile, tax residency, PEP checks). The full payload arrives as one large JSON from the KYC backend.

2. **Conditional branching** — the answer to Question 3 determines whether Questions 4A or 4B appear. The answer to Question 7 may skip an entire section. This logic is embedded in the KYC JSON and must be evaluated server-side, not client-side.

3. **Platform disparity** — a mobile screen at 390px wide can comfortably show 2–3 questions per step. A web browser at 1440px wide can show a full section (8–10 questions) on one page. Serving the same JSON to both degrades one experience.

4. **UCP controls the UI** — HSBC's UCP (Stripes CMS) owns the visual components (how a dropdown looks, how a document upload widget behaves). The KYC system owns the data model and validation rules. These two concerns must stay separated.

5. **Regulatory auditability** — every question shown, every answer given, and every step navigated must be logged with a tamper-evident audit trail.

### 1.2 Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      KYC SDUI Architecture                                   │
│                                                                               │
│  KYC Backend          KYC Orchestration BFF         Client (Mobile / Web)   │
│  ┌──────────────┐    ┌──────────────────────────┐   ┌─────────────────────┐ │
│  │ KYC System   │    │                          │   │                     │ │
│  │              │    │  1. KYC JSON Fetcher      │   │  SDUI Renderer      │ │
│  │ Returns full │───►│  2. Section Analyser      │   │  + KYC Component    │ │
│  │ KYC payload  │    │  3. Platform Splitter     │──►│    Registry         │ │
│  │ (50-200 Qs)  │    │  4. Branch Evaluator      │   │                     │ │
│  │              │    │  5. Step Router            │   │  Renders only the   │ │
│  │ Validates    │◄───│  6. Answer Processor       │◄──│  current step's     │ │
│  │ answers +    │    │  7. SDUI JSON Composer     │   │  components         │ │
│  │ triggers     │    │                          │   │                     │ │
│  │ next section │    └──────────────────────────┘   │  Mobile: 2-3 Qs    │ │
│  └──────────────┘                                    │  Web: full section  │ │
│                         UCP (Stripes CMS)            └─────────────────────┘ │
│                    ┌──────────────────────────┐                               │
│                    │ Owns KYC UI components:  │                               │
│                    │ KYCTextInput, KYCSelect, │                               │
│                    │ KYCDocUpload, KYCAddress,│                               │
│                    │ KYCDeclaration, etc.     │                               │
│                    └──────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. KYC JSON Structure (Raw — from KYC Backend)

The KYC system returns a single large JSON with all questions, validation rules, branching logic, and section metadata.

```json
{
  "kycSessionId": "kyc-sess-8f3a2b1c",
  "applicantId": "usr-hashed-9f2a",
  "journeyType": "PERSONAL_ACCOUNT_OPENING",
  "market": "HK",
  "regulatoryStandard": "HKMA_CDD",
  "totalQuestions": 47,
  "completedQuestions": 0,
  "sections": [
    {
      "sectionId": "personal_details",
      "sectionTitle": "Personal Information",
      "order": 1,
      "questions": [
        {
          "questionId": "q_first_name",
          "order": 1,
          "type": "TEXT_INPUT",
          "label": "First name (as on ID)",
          "validation": { "required": true, "minLength": 1, "maxLength": 50 },
          "answerValue": null,
          "answeredAt": null
        },
        {
          "questionId": "q_nationality",
          "order": 3,
          "type": "SINGLE_SELECT",
          "label": "Nationality",
          "options": [
            { "value": "HK", "label": "Hong Kong SAR" },
            { "value": "CN", "label": "Mainland China" }
          ],
          "branchingRules": [
            {
              "ifValue": "HK",
              "thenShowQuestions": ["q_hkid_number", "q_hkid_expiry"]
            },
            {
              "ifValue": "CN",
              "thenShowQuestions": ["q_mainland_id"]
            },
            {
              "ifValue": "OTHER",
              "thenShowQuestions": ["q_passport_number", "q_passport_expiry"]
            }
          ],
          "answerValue": null,
          "answeredAt": null
        }
      ]
    }
  ]
}
```

---

## 3. KYC Journey — 11 Mobile Steps / 6 Web Steps

The BFF splits the raw KYC JSON into platform-appropriate steps. Mobile groups related questions together (max ~3 per step) while web shows full sections.

### 3.1 Mobile Step Plan (11 steps — OCDP canonical journey)

| Step | Primary Question ID | Composable / Component | Questions in Step |
|------|--------------------|-----------------------|-------------------|
| step-001 | `q_first_name` | `KYCNameDobStep` | q_first_name, q_middle_name, q_last_name, q_date_of_birth |
| step-002 | `q_nationality` | `KYCNationalityStep` / `KYCDobNationalityStep` | q_nationality |
| step-003 | `q_hkid_number` OR `q_mainland_id` OR `q_passport_number` | `KYCIdentifierStep` / `KYCHKIDStep` / `KYCMainlandIDStep` / `KYCPassportStep` | Nationality-conditional: HK→q_hkid_number+q_hkid_expiry; CN→q_mainland_id; other→q_passport_number+q_passport_expiry |
| step-004 | `q_hkid_front` | `KYCDocumentStep` | q_hkid_front (+ q_hkid_back for HKID) |
| step-005 | `q_email` | `KYCContactStep` | q_email, q_phone |
| step-006 | `q_addr_line1` | `KYCAddressStep` | q_addr_line1, q_addr_line2, q_addr_district |
| step-007 | `q_employment_status` | `KYCEmploymentIncomeStep` | q_employment_status, q_annual_income |
| step-008 | `q_source_of_funds` | `KYCFundsStep` / `KYCSourceOfFundsStep` | q_source_of_funds, q_account_purpose |
| step-009 | `q_liveness` | `KYCLivenessStep` | q_liveness |
| step-010 | `q_ob_consent` | `KYCOpenBankingStep` | q_ob_consent |
| step-011 | `q_pep_status` | `KYCDeclarationStep` | q_pep_status, decl_truthful, decl_fatca |

**Routing contract (all 3 mobile platforms):** The client routes on the **primary question ID** — the first `questionId` found in `payload.layout.children[0]`. Step IDs (`step-001`, `step-002`, …) carry no semantic meaning and are never used for routing.

### 3.2 Web Step Plan (6 steps)

| Step | Section | Questions |
|------|---------|-----------|
| web-step-001 | Personal Details | Name, DOB, nationality (all in 2-col grid) |
| web-step-002 | Identity | Nationality-conditional: HKID / Mainland ID / Passport |
| web-step-003 | Document Upload | Document photo upload |
| web-step-004 | Contact & Address | Email, phone, full address block |
| web-step-005 | Employment & Funds | Employment status, income, source of funds, account purpose |
| web-step-006 | Declarations | Liveness simulation, Open Banking consent, PEP status, declarations |

---

## 4. Redux State Architecture — All Three Mobile Platforms

All native mobile platforms implement a **Redux-style unidirectional data flow**: a single store/ViewModel owns all state. Views dispatch actions; the store applies pure state mutations and async effects; UI reactively re-renders.

### 4.1 Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              Redux / Unidirectional Data Flow — All Native Platforms             │
│                                                                                   │
│  ┌────────────────┐   dispatch(action)   ┌───────────────────────────────────┐  │
│  │  View / Step   │ ─────────────────►   │         Store / ViewModel         │  │
│  │  Component     │                      │                                   │  │
│  │                │ ◄─────────────────   │  1. reduce(action)                │  │
│  │  Reads state   │  reactive re-render  │     pure synchronous state change │  │
│  │  Calls dispatch│                      │                                   │  │
│  └────────────────┘                      │  2. handleEffect(action)          │  │
│                                          │     async network calls           │  │
│                                          │     dispatches result actions     │  │
│                                          └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 iOS — AppStore (Swift @Observable)

```swift
// Actions — typed enum with associated values
enum KYCAction {
    case startSession
    case sessionStarted(sessionId: String, totalSteps: Int)
    case stepLoaded(SDUIScreenPayload)
    case setAnswer(questionId: String, value: AnyCodable)
    case submitStep
    case stepSubmitSuccess(nextStepId: String?, totalSteps: Int)
    case journeyComplete
    case setLoading(Bool)
    case setSubmitting(Bool)
    case setError(String?)
    case setValidationErrors([ValidationError])
    case clearValidationError(String)
}

// Store — flat @Observable, instruments every property
@Observable final class AppStore {
    var sessionId:        String?              = nil
    var currentStepId:    String?              = nil
    var currentStepIndex: Int                  = 0
    var totalSteps:       Int                  = 0
    var sectionTitle:     String               = ""
    var screenPayload:    SDUIScreenPayload?   = nil
    var answers:          [String: AnyCodable] = [:]
    var isLoading:        Bool                 = false
    var isSubmitting:     Bool                 = false
    var isComplete:       Bool                 = false
    var errorMessage:     String?              = nil
    var validationErrors: [ValidationError]    = []

    @MainActor func dispatch(_ action: KYCAction) {
        reduce(action)                          // 1. pure state mutation
        Task { @MainActor in await handleEffect(action) }  // 2. async effects
    }
}

// Views inject and call:
@Environment(AppStore.self) private var store
store.dispatch(.startSession)
store.dispatch(.setAnswer(questionId: "q_first_name", value: AnyCodable(v)))
store.dispatch(.submitStep)
```

### 4.3 Android — KYCViewModel (Kotlin StateFlow)

```kotlin
// UI State — immutable data class, copied on every update
data class KYCUiState(
    val sessionId: String? = null,
    val currentStepId: String? = null,
    val currentStepIndex: Int = 0,
    val totalSteps: Int = 0,
    val sectionTitle: String = "",
    val screenPayload: SDUIScreenPayload? = null,
    val answers: Map<String, Any> = emptyMap(),
    val validationErrors: Map<String, String> = emptyMap(),
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val isComplete: Boolean = false,
    val errorMessage: String? = null
)

// ViewModel — owns state + coroutine effects
class KYCViewModel : ViewModel() {
    private val _state = MutableStateFlow(KYCUiState())
    val state: StateFlow<KYCUiState> = _state.asStateFlow()

    fun startSession()                              // async → _state.update { it.copy(...) }
    fun setAnswer(questionId: String, value: Any)   // sync  → _state.update { ... }
    fun submitStep()                                // async → _state.update { ... }
}

// Composables collect and call:
val state by viewModel.state.collectAsStateWithLifecycle()
viewModel.startSession()
viewModel.setAnswer("q_first_name", v)
viewModel.submitStep()
```

### 4.4 HarmonyNext — KYCStore + KYCState (ArkTS @Observed)

```typescript
// Actions — interface with typed optional fields (mirrors iOS KYCAction enum cases)
interface KYCAction {
  type: string             // 'START_SESSION' | 'SESSION_STARTED' | 'STEP_LOADED' |
                           // 'SET_ANSWER' | 'SUBMIT_STEP' | 'STEP_SUBMIT_SUCCESS' |
                           // 'JOURNEY_COMPLETE' | 'SET_ERROR' | 'SET_VALIDATION_ERRORS' |
                           // 'CLEAR_VALIDATION_ERROR'
  questionId?: string      // SET_ANSWER, CLEAR_VALIDATION_ERROR
  answerValue?: ESObject   // SET_ANSWER
  sessionId?: string       // SESSION_STARTED
  totalSteps?: number      // SESSION_STARTED, STEP_SUBMIT_SUCCESS
  payload?: SDUIScreenPayload  // STEP_LOADED
  errorMessage?: string    // SET_ERROR
  validationErrors?: ValidationErrorDto[]  // SET_VALIDATION_ERRORS
}

// KYCState — @Observed reactive state + synchronous reducer
@Observed class KYCState {
  sessionId: string = ''; currentStepId: string = ''; currentStepIndex: number = 0
  totalSteps: number = 0; sectionTitle: string = ''; screenPayload: SDUIScreenPayload | null = null
  answers: Record<string, ESObject> = {}; validationErrors: Record<string, string> = {}
  isLoading: boolean = false; isSubmitting: boolean = false
  isComplete: boolean = false; errorMessage: string = ''

  setAnswer(questionId: string, value: ESObject): void  // encapsulated answer mutation
  dispatch(action: KYCAction): void                     // synchronous reducer only
}

// KYCStore — @Observed, owns state + async effects
@Observed class KYCStore {
  state: KYCState = new KYCState()

  dispatch(action: KYCAction): void {
    this.state.dispatch(action)   // 1. pure state mutation
    this.handleEffect(action)     // 2. async network effects
  }
  handleEffect(action: KYCAction): void  // network calls → dispatch result actions
}

// Shell components hold @ObjectLink store: KYCStore and call:
this.store.dispatch({ type: 'START_SESSION' })
this.store.dispatch({ type: 'SUBMIT_STEP' })

// Step components hold @ObjectLink state: KYCState (= store.state) and call:
this.state.setAnswer('q_first_name', v as ESObject)
```

### 4.5 Action → State Mapping (Cross-Platform)

| Action | iOS | Android | HarmonyNext | State Change |
|--------|-----|---------|-------------|--------------|
| Start session | `.startSession` | `startSession()` | `{ type: 'START_SESSION' }` | `isLoading = true` |
| Session started | `.sessionStarted(id, total)` | `_state.update { it.copy(sessionId=...) }` | `{ type: 'SESSION_STARTED', sessionId, totalSteps }` | sessionId, totalSteps set |
| Step loaded | `.stepLoaded(payload)` | `applyPayload(payload)` | `{ type: 'STEP_LOADED', payload }` | All step display state set |
| Set answer | `.setAnswer(qId, value)` | `setAnswer(qId, value)` | `state.setAnswer(qId, value)` | `answers[qId] = value` |
| Submit step | `.submitStep` | `submitStep()` | `{ type: 'SUBMIT_STEP' }` | `isSubmitting = true` |
| Journey complete | `.journeyComplete` | `isComplete = true` | `{ type: 'JOURNEY_COMPLETE' }` | `isComplete = true` |
| Error | `.setError(msg)` | `errorMessage = err.message` | `{ type: 'SET_ERROR', errorMessage }` | `errorMessage` set, loading cleared |

---

## 5. Data Models

### 5.1 SDUI Screen Payload (BFF → Client)

```json
{
  "schemaVersion": "2.3",
  "screen": "kyc_step",
  "ttl": 0,
  "metadata": {
    "sessionId": "kyc-sess-8f3a2b1c",
    "stepId": "step-001",
    "stepIndex": 1,
    "totalSteps": 11,
    "sectionTitle": "Personal Information",
    "platform": "mobile"
  },
  "layout": {
    "type": "KYCScrollContainer",
    "id": "kyc-step-001",
    "props": { "platform": "mobile" },
    "children": [
      {
        "type": "KYCTextInput",
        "id": "q_first_name",
        "props": {
          "questionId": "q_first_name",
          "label": "First name",
          "validation": { "required": true, "minLength": 1, "maxLength": 50 }
        }
      }
    ]
  }
}
```

**Routing key:** `payload.layout.children[0].id` = `"q_first_name"` — this is the primary question ID used for routing. The BFF sets `node.id = questionId` in `buildComponent()`.

### 5.2 Platform-Specific Models

**iOS (`SDUIModels.swift`)**:
- `SDUIScreenPayload` — `Codable` struct
- `ScreenMetadata`, `SDUINode`, `SDUIAnalytics` — `Codable` structs
- `AnyCodable` — type-erased JSON value with `stringValue`, `boolValue`, `intValue`, `optionsValue`
- `AnswerEntry`, `SubmitRequest`, `SubmitResponse` — network DTOs

**Android (`KYCModels.kt`)**:
- `SDUIScreenPayload`, `KYCStepMetadata`, `KYCSDUINode` — Gson `data class` with `@SerializedName`
- `KYCUiState` — immutable `data class`, updated via `_state.update { it.copy(...) }`
- `AnswerEntry`, `SubmitRequest`, `SubmitResponse`, `ValidationErrorDto` — network DTOs

**HarmonyNext (`SDUIModels.ets`)**:
- `SDUIScreenPayload`, `ScreenMetadata`, `SDUINode` — ArkTS `interface`
- `KYCAction` — typed action interface with optional payload fields
- `KYCState` — `@Observed class` with `setAnswer()` + `dispatch()` (synchronous reducer)
- `AnswerEntry`, `SubmitRequest`, `SubmitResponse`, `ValidationErrorDto` — network DTOs

### 5.3 Answer Collection

All platforms collect answers as a map keyed by `questionId`, submitted as a list to the BFF:

```json
POST /api/v1/kyc/sessions/{sessionId}/steps/{stepId}/submit
{
  "answers": [
    { "questionId": "q_first_name",   "value": "TAI MAN" },
    { "questionId": "q_last_name",    "value": "CHAN" },
    { "questionId": "q_date_of_birth","value": "1990-01-15" }
  ]
}
```

BFF response:
```json
{ "status": "NEXT_STEP", "nextStepId": "step-002", "totalSteps": 11 }
// or: { "status": "COMPLETE" }
// or: { "status": "INVALID", "validationErrors": [{ "questionId": "q_first_name", "message": "Required" }] }
```

---

## 6. Branching Question Flow

### 6.1 Nationality → Identity Document Branch

step-003 is the key branching step. The BFF evaluates the nationality answer from step-002 and returns only the relevant identity question(s):

```
nationality = "HK"   → step-003 delivers: [q_hkid_number, q_hkid_expiry]
nationality = "CN"   → step-003 delivers: [q_mainland_id]
nationality = other  → step-003 delivers: [q_passport_number, q_passport_expiry]
```

All three platforms route on the **primary question ID** (first child of payload):
- `q_hkid_number` → HKID step composable
- `q_mainland_id` → Mainland ID step composable
- `q_passport_number` → Passport step composable

### 6.2 Dynamic Step Count

When the BFF inserts or removes steps due to branching (e.g., FATCA section for US nationals), `totalSteps` in the response changes. All three stores handle this:
- iOS: `dispatch(.stepSubmitSuccess(nextStepId:, totalSteps:))` → `totalSteps = total`
- Android: `_state.update { s -> s.copy(totalSteps = result.totalSteps ?: s.totalSteps) }`
- HarmonyNext: `dispatch({ type: 'STEP_SUBMIT_SUCCESS', totalSteps: res.totalSteps })`

---

## 7. KYC Component Library (SDUI)

| Component Type | Mobile Behaviour | Web Behaviour |
|----------------|-----------------|---------------|
| `KYCTextInput` | Full-width, large tap target, native keyboard type | Up to half-width in 2-col grid |
| `KYCDatePicker` | Native OS date picker (iOS DatePicker, Android DatePickerDialog, HarmonyNext DatePicker) | Calendar popover widget |
| `KYCSingleSelect` | Native bottom sheet picker | Styled HTML `<select>` or combobox |
| `KYCMultiSelect` | Checkbox list in bottom sheet | Checkbox grid (2–3 columns) |
| `KYCAddressBlock` | All 3 sub-fields in one step (line1, line2, district) | All address fields inline, 2-col |
| `KYCDocUpload` | Camera capture or gallery; one step alone | Drag-and-drop zone + file picker |
| `KYCDeclaration` | Full-screen scrollable text + checkbox at bottom | Scrollable box + checkbox inline |
| `KYCProgressBar` | Linear bar + "Step X of Y" + section name | Hidden (use KYCWebProgressStepper) |
| `KYCWebProgressStepper` | Not used | Horizontal step indicator with section labels |
| `KYCNavigationBar` | Sticky bottom: Back / Save & Exit / Continue | Sticky footer: Back / Save & Exit / Save & Continue |

---

## 8. Mobile vs Web — Platform Comparison

```
MOBILE (390px wide)                  WEB (1440px wide)
─────────────────────                ───────────────────────────────────────

Step count:   11 steps               Step count:   6 steps
Questions/step: 1-4                  Questions/step: up to 10 (full section)

Progress UI:                         Progress UI:
  Linear bar top of screen             Horizontal stepper with section labels
  "Step 3 of 11 · Personal Info"       Sections visible at all times

Address:                             Address:
  All 3 fields together (1 step)       All address fields inline, 2-col grid
  line1 + line2 + district together

Employment:                          Employment:
  Status + annual income together      All employment fields inline
  (1 step, 2 selects)

Source of Funds:                     Source of Funds:
  Source + account purpose together    All fund fields inline
  (1 step, 2 selects)
```

---

## 9. Session State and Resume

```
KYC sessions can span multiple sittings (customer closes app, comes back).

Session persistence:
  Redis:      Active session step plan + current answers (TTL: 72h)
  PostgreSQL: Durable answer store (survives Redis flush)
  S3:         Full session snapshot on each submit (for audit)

Resume flow:
  Customer opens app day 2:
  GET /api/v1/kyc/sessions/kyc-sess-8f3a2b1c/resume
    → BFF loads step plan from Redis (or rebuilds from PostgreSQL if Redis miss)
    → Evaluates completed steps (all answered questions pre-filled)
    → Returns current incomplete step's SDUI JSON
    → Client navigates directly to that step
    → Already-answered questions shown as pre-filled (read-only or editable)
```

---

## 10. Security and Compliance

| Control | Implementation |
|---------|---------------|
| Session binding | JWT scoped to `kycSessionId` + `userId`; cannot access another session |
| Answer encryption | All KYC answers encrypted at rest (AES-256) in PostgreSQL + S3 |
| PII in transit | TLS 1.3 minimum; no PII in URL params (only in request body) |
| Audit log | Every question viewed, every answer submitted logged with timestamp + IP |
| HKMA CDD compliance | Question set driven by KYC backend (not BFF); BFF has no business logic for eligibility |
| Document storage | Uploaded documents stored in S3 with separate encryption key; presigned URL pattern |
| Re-authentication | For high-risk steps (source of funds declaration, signature), step-up auth required |
| Timeout | Session idle > 15 min → require re-auth; answers preserved |
| Data residency | HK KYC data in `ap-east-1`; CN in China-resident; SG in `ap-southeast-1` |
