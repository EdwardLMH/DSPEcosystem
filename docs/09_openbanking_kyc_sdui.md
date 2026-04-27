# Open Banking KYC — SDUI Architecture Design

**Document Version:** 1.0
**Date:** 2026-04-19
**Scope:** KYC JSON orchestration, platform-adaptive SDUI, branching question flows, mobile vs web step splitting

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
          "questionId": "q_full_name",
          "order": 1,
          "type": "TEXT_INPUT",
          "label": "Full legal name (as on HKID)",
          "placeholder": "e.g. CHAN Tai Man",
          "validation": {
            "required": true,
            "minLength": 2,
            "maxLength": 100,
            "pattern": "^[A-Za-z ]+$"
          },
          "helpText": "Enter your name exactly as it appears on your HKID card",
          "answerValue": null,
          "answeredAt": null
        },
        {
          "questionId": "q_date_of_birth",
          "order": 2,
          "type": "DATE_PICKER",
          "label": "Date of birth",
          "validation": {
            "required": true,
            "minAge": 18,
            "maxAge": 120
          },
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
            { "value": "CN", "label": "Mainland China" },
            { "value": "GB", "label": "United Kingdom" }
          ],
          "validation": { "required": true },
          "branchingRules": [
            {
              "ifValue": "US",
              "thenShowQuestions": ["q_fatca_tin", "q_fatca_declaration"],
              "thenShowSection": "fatca_compliance"
            },
            {
              "ifValue": "CN",
              "thenShowQuestions": ["q_mainland_id_number"],
              "thenHideQuestions": ["q_overseas_tax_id"]
            }
          ],
          "answerValue": null,
          "answeredAt": null
        }
      ]
    },
    {
      "sectionId": "source_of_funds",
      "sectionTitle": "Source of Funds",
      "order": 2,
      "showCondition": {
        "ifQuestionId": "q_employment_status",
        "ifValue": ["EMPLOYED", "SELF_EMPLOYED", "BUSINESS_OWNER"]
      },
      "questions": [ ... ]
    },
    {
      "sectionId": "fatca_compliance",
      "sectionTitle": "US Tax Compliance",
      "order": 5,
      "showCondition": {
        "ifQuestionId": "q_nationality",
        "ifValue": ["US"]
      },
      "questions": [ ... ]
    }
  ]
}
```

---

## 3. KYC JSON Splitter — Core Design

The Splitter sits between the KYC backend and the SDUI client. It takes the full KYC JSON and produces a sequence of **step payloads** — each containing only the questions the client should render right now.

### 3.1 Splitting Strategy

```
Full KYC JSON (47 questions, 6 sections)
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│                  Platform Splitter                          │
│                                                            │
│  Input: full KYC JSON + platform (mobile|web) + session   │
│                                                            │
│  Mobile splitting rules:                                   │
│    • Max 3 questions per step                              │
│    • Split on: document upload, declaration, new section   │
│    • Address block = 1 step (multiple fields, 1 concept)   │
│    • Date picker always alone (keyboard UX on mobile)      │
│    • Heavy validation questions (regex) alone              │
│                                                            │
│  Web splitting rules:                                      │
│    • Full section per page (up to 10 questions)            │
│    • Split only on: document upload, legal declaration     │
│    • Address block inline with surrounding questions       │
│    • Multiple selects on same row (2-column grid layout)   │
│                                                            │
│  Shared rules (both platforms):                            │
│    • Branch evaluator hides questions that don't apply     │
│    • Completed questions pre-filled with saved answers     │
│    • Progress calculated across all visible questions      │
└────────────────────────────────────────────────────────────┘
             │
             ▼
  Step sequence stored in Redis (keyed by sessionId)

  Mobile: 18 steps   │   Web: 7 steps
  Step 1: 3 Qs       │   Step 1: 8 Qs (full personal details section)
  Step 2: 2 Qs       │   Step 2: 6 Qs (employment)
  Step 3: 1 Q (doc)  │   Step 3: 1 Q (document upload)
  Step 4: 3 Qs       │   Step 4: 5 Qs (source of funds)
  ...                │   ...
```

### 3.2 Step Plan Data Model

```json
{
  "sessionId": "kyc-sess-8f3a2b1c",
  "platform": "mobile",
  "totalSteps": 18,
  "steps": [
    {
      "stepId": "step-001",
      "stepIndex": 1,
      "sectionId": "personal_details",
      "sectionTitle": "Personal Information",
      "questionIds": ["q_full_name", "q_date_of_birth", "q_nationality"],
      "isComplete": false,
      "layout": "single_column"
    },
    {
      "stepId": "step-002",
      "stepIndex": 2,
      "sectionId": "personal_details",
      "sectionTitle": "Personal Information",
      "questionIds": ["q_hkid_number", "q_hkid_expiry"],
      "isComplete": false,
      "layout": "single_column"
    },
    {
      "stepId": "step-003",
      "stepIndex": 3,
      "sectionId": "identity_documents",
      "sectionTitle": "Identity Documents",
      "questionIds": ["q_hkid_front_upload"],
      "isComplete": false,
      "layout": "document_upload",
      "isDocumentStep": true
    }
  ]
}
```

---

## 4. SDUI JSON Per Step — Platform-Adaptive

### 4.1 Mobile Step Response (compact, single-column)

```json
{
  "schemaVersion": "2.3",
  "screen": "kyc_step",
  "ttl": 0,
  "metadata": {
    "sessionId": "kyc-sess-8f3a2b1c",
    "stepId": "step-001",
    "stepIndex": 1,
    "totalSteps": 18,
    "sectionTitle": "Personal Information",
    "platform": "mobile"
  },
  "layout": {
    "type": "KYCScrollContainer",
    "id": "kyc-step-001",
    "props": { "platform": "mobile" },
    "children": [
      {
        "type": "KYCProgressBar",
        "id": "kyc-progress",
        "props": {
          "currentStep": 1,
          "totalSteps": 18,
          "sectionTitle": "Personal Information",
          "sectionProgress": "Step 1 of 5 in this section"
        }
      },
      {
        "type": "KYCTextInput",
        "id": "q_full_name",
        "props": {
          "questionId": "q_full_name",
          "label": "Full legal name",
          "helpText": "As it appears on your HKID",
          "placeholder": "e.g. CHAN Tai Man",
          "inputType": "text",
          "autoCapitalize": "words",
          "validation": {
            "required": true,
            "minLength": 2,
            "maxLength": 100,
            "pattern": "^[A-Za-z ]+$",
            "errorMessage": "Please enter your full legal name in English"
          },
          "savedValue": null
        },
        "analytics": {
          "impressionEvent": "kyc_question_viewed",
          "componentId": "q_full_name",
          "customProperties": { "questionType": "TEXT_INPUT", "section": "personal_details" }
        }
      },
      {
        "type": "KYCDatePicker",
        "id": "q_date_of_birth",
        "props": {
          "questionId": "q_date_of_birth",
          "label": "Date of birth",
          "validation": { "required": true, "minAge": 18 },
          "savedValue": null,
          "displayFormat": "DD / MM / YYYY"
        }
      },
      {
        "type": "KYCNavigationBar",
        "id": "kyc-nav",
        "props": {
          "showBack": false,
          "showSaveExit": true,
          "nextLabel": "Continue",
          "nextAction": {
            "type": "API_CALL",
            "destination": "/api/v1/kyc/sessions/kyc-sess-8f3a2b1c/steps/step-001/submit",
            "payload": "{{collect:formAnswers}}"
          }
        }
      }
    ]
  }
}
```

### 4.2 Web Step Response (wider layout, full section)

```json
{
  "schemaVersion": "2.3",
  "screen": "kyc_step",
  "ttl": 0,
  "metadata": {
    "sessionId": "kyc-sess-8f3a2b1c",
    "stepId": "web-step-001",
    "stepIndex": 1,
    "totalSteps": 7,
    "sectionTitle": "Personal Information",
    "platform": "web"
  },
  "layout": {
    "type": "KYCWebContainer",
    "id": "kyc-web-step-001",
    "props": { "maxWidth": 720, "layout": "two_column_capable" },
    "children": [
      {
        "type": "KYCWebProgressStepper",
        "id": "kyc-progress-web",
        "props": {
          "steps": [
            { "label": "Personal Details", "status": "current" },
            { "label": "Employment",        "status": "upcoming" },
            { "label": "Documents",         "status": "upcoming" },
            { "label": "Source of Funds",   "status": "upcoming" },
            { "label": "Risk Profile",      "status": "upcoming" },
            { "label": "Declarations",      "status": "upcoming" },
            { "label": "Review & Submit",   "status": "upcoming" }
          ]
        }
      },
      {
        "type": "KYCTwoColumnGrid",
        "id": "personal-grid",
        "props": { "columns": 2 },
        "children": [
          {
            "type": "KYCTextInput",
            "id": "q_full_name",
            "props": {
              "questionId": "q_full_name",
              "label": "Full legal name (as on HKID)",
              "placeholder": "e.g. CHAN Tai Man",
              "colSpan": 2,
              "validation": { "required": true, "minLength": 2, "maxLength": 100 },
              "savedValue": null
            }
          },
          {
            "type": "KYCDatePicker",
            "id": "q_date_of_birth",
            "props": {
              "questionId": "q_date_of_birth",
              "label": "Date of birth",
              "colSpan": 1,
              "validation": { "required": true, "minAge": 18 },
              "savedValue": null
            }
          },
          {
            "type": "KYCSingleSelect",
            "id": "q_nationality",
            "props": {
              "questionId": "q_nationality",
              "label": "Nationality",
              "colSpan": 1,
              "options": [
                { "value": "HK", "label": "Hong Kong SAR" },
                { "value": "CN", "label": "Mainland China" },
                { "value": "US", "label": "United States" }
              ],
              "branchingEnabled": true,
              "savedValue": null
            }
          },
          {
            "type": "KYCTextInput",
            "id": "q_hkid_number",
            "props": {
              "questionId": "q_hkid_number",
              "label": "HKID number",
              "colSpan": 1,
              "inputType": "hkid",
              "placeholder": "A123456(7)",
              "validation": { "required": true, "pattern": "^[A-Z]{1,2}[0-9]{6}\\([0-9A]\\)$" },
              "savedValue": null
            }
          },
          {
            "type": "KYCDatePicker",
            "id": "q_hkid_expiry",
            "props": {
              "questionId": "q_hkid_expiry",
              "label": "HKID expiry date",
              "colSpan": 1,
              "helpText": "Enter N/A if your HKID has no expiry",
              "validation": { "required": false },
              "savedValue": null
            }
          }
        ]
      },
      {
        "type": "KYCNavigationBar",
        "id": "kyc-nav-web",
        "props": {
          "showBack": false,
          "showSaveExit": true,
          "nextLabel": "Save & Continue",
          "nextAction": {
            "type": "API_CALL",
            "destination": "/api/v1/kyc/sessions/kyc-sess-8f3a2b1c/steps/web-step-001/submit",
            "payload": "{{collect:formAnswers}}"
          }
        }
      }
    ]
  }
}
```

---

## 5. Branching Question Flow

### 5.1 Branch Evaluation Flow

```
Customer answers q_nationality = "US"
         │
         ▼ POST /kyc/sessions/{id}/steps/{stepId}/submit
         │  { answers: [{ questionId: "q_nationality", value: "US" }] }
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│              KYC Answer Processor (BFF)                        │
│                                                                 │
│  1. Validate answer against KYC validation rules               │
│  2. Forward answer to KYC backend for server-side validation   │
│  3. KYC backend returns: { valid: true, triggeredBranches: [   │
│       { action: "SHOW_SECTION", sectionId: "fatca_compliance"},│
│       { action: "SHOW_QUESTIONS",                              │
│         questionIds: ["q_fatca_tin", "q_fatca_declaration"] }  │
│     ]}                                                          │
│                                                                 │
│  4. Branch Evaluator updates session step plan:                 │
│     - Insert FATCA section steps after current position        │
│     - Re-number all subsequent steps                           │
│     - Store updated step plan in Redis                         │
│                                                                 │
│  5. Respond to client:                                          │
│     { nextStepId: "step-002", totalSteps: 22 }  ← updated     │
│     (was 18 steps; FATCA added 4 more)                         │
└────────────────────────────────────────────────────────────────┘
         │
         ▼
Client navigates to step-002 → GET /kyc/sessions/{id}/steps/step-002
BFF composes SDUI JSON for step-002 including newly triggered questions
```

### 5.2 Branching State in Redis

```
Redis key: kyc:session:{sessionId}:stepplan

{
  "sessionId": "kyc-sess-8f3a2b1c",
  "platform": "mobile",
  "totalSteps": 22,             ← updated dynamically as branches trigger
  "answeredQuestionIds": ["q_full_name", "q_date_of_birth", "q_nationality"],
  "hiddenQuestionIds":  ["q_overseas_tax_id"],
  "shownQuestionIds":   ["q_fatca_tin", "q_fatca_declaration"],
  "currentStepIndex": 2,
  "steps": [
    { "stepId": "step-001", "questionIds": [...], "isComplete": true },
    { "stepId": "step-002", "questionIds": [...], "isComplete": false },
    { "stepId": "step-fatca-1", "questionIds": ["q_fatca_tin"], "isComplete": false,
      "insertedByBranch": "q_nationality=US" },
    ...
  ]
}
```

---

## 6. KYC Component Library (SDUI)

| Component Type | Mobile Behaviour | Web Behaviour |
|----------------|-----------------|---------------|
| `KYCTextInput` | Full-width, large tap target, native keyboard type | Up to half-width in 2-col grid |
| `KYCDatePicker` | Native OS date picker (iOS DatePicker, Android DatePickerDialog) | Calendar popover widget |
| `KYCSingleSelect` | Native bottom sheet picker (ActionSheet iOS / ModalBottomSheet Android) | Styled HTML `<select>` or combobox |
| `KYCMultiSelect` | Checkbox list in bottom sheet | Checkbox grid (2–3 columns) |
| `KYCAddressBlock` | 1 step per block: line1+line2 / city+postcode / country | All address fields inline, 2-col |
| `KYCDocUpload` | Camera capture or gallery + file upload; one step alone | Drag-and-drop zone + file picker |
| `KYCDocPreview` | Thumbnail with retake option | Larger preview panel |
| `KYCDeclaration` | Full-screen scrollable text + checkbox at bottom | Scrollable box + checkbox inline |
| `KYCProgressBar` | Linear bar + "Step X of Y" + section name | Hidden (use KYCWebProgressStepper) |
| `KYCWebProgressStepper` | Not used | Horizontal step indicator with section labels |
| `KYCTwoColumnGrid` | Ignored (renders as single column) | 2-column question layout |
| `KYCNavigationBar` | Sticky bottom: Back / Save & Exit / Continue | Sticky footer: Back / Save & Exit / Save & Continue |
| `KYCConditionalQuestion` | Shown/hidden based on branch state | Same, with smooth CSS transition |
| `KYCSummaryReview` | Scrollable read-only list of all answers | Two-column summary table |
| `KYCSignaturePad` | Finger/stylus draw on canvas | Mouse/trackpad draw on canvas |

---

## 7. Mobile vs Web — Platform Comparison

```
MOBILE (390px wide)                  WEB (1440px wide)
─────────────────────                ───────────────────────────────────────

Step count:   18 steps               Step count:   7 steps
Questions/step: max 3                Questions/step: up to 10 (full section)

Progress UI:                         Progress UI:
  Linear bar top of screen             Horizontal stepper with section labels
  "Step 3 of 18 · Personal Info"       Sections visible at all times

Layout:                              Layout:
  Single column always                 Two-column grid for short questions
  Full-width inputs                    Side-by-side (name + nationality)
  Large tap targets (44pt min)         Standard desktop input sizing

Selects:                             Selects:
  Native OS bottom sheet               Styled combobox / dropdown
  Full-screen option list              Inline dropdown

Date Picker:                         Date Picker:
  Native iOS/Android date wheel        Calendar popover widget
  Takes entire screen                  Inline calendar (no screen takeover)

Document Upload:                     Document Upload:
  Camera first, gallery second         Drag-and-drop zone primary
  One step alone (no other Qs)         Can appear alongside other questions

Keyboard:                            Keyboard:
  Each text input scrolls to top       No scroll-to-focus needed
  Next/Done keyboard navigation        Tab navigation between fields

Save & Exit:                         Save & Exit:
  Prominent button in nav bar          Text link in page header
  Session saved to resume later        Session saved to resume later

Address Input:                       Address Input:
  3 sub-steps (street / city / country)  Single address block, inline
```

---

## 8. Session State and Resume

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

## 9. Security and Compliance

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
