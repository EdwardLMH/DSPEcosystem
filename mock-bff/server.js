/**
 * HSBC DSP Mock BFF Server
 * Simulates the Java Spring Boot BFF for local KYC SDUI development.
 * Runs on port 4000. No Redis, no CMS — all data in-memory.
 *
 * ACCESS ZONE MODEL:
 *
 *   ZONE 1 — PUBLIC (no auth) — customer-facing:
 *     POST /api/v1/kyc/sessions/start
 *     GET  /api/v1/kyc/sessions/:id/resume
 *     GET  /api/v1/kyc/sessions/:id/steps/:stepId
 *     POST /api/v1/kyc/sessions/:id/steps/:stepId/submit
 *     GET  /api/v1/screen/:screenId          (SDUI delivery)
 *     POST /api/v1/events                    (analytics)
 *
 *   ZONE 2 — INTERNAL (Azure AD JWT required in production) — staff/CMS:
 *     /api/v1/content/**
 *     /api/v1/workflow/**
 *     /api/v1/audit-log/**
 *     /api/v1/preview/**
 *
 *   In this mock server, Zone 2 auth is simulated via a simple
 *   x-mock-staff-role header (replace with real Azure AD JWT in production).
 */

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// ─── Zone 2 guard (mock) ─────────────────────────────────────────────────────
// In production this is replaced by Spring Security + Azure AD JWT validation.
// In this mock, internal routes require x-mock-staff-role header.
// Valid values: CARDS-AUTHOR, CARDS-APPROVER, WEALTH-AUTHOR, WEALTH-APPROVER,
//               AUDITOR, ADMIN
function requireInternalAuth(req, res, next) {
  const role = req.headers['x-mock-staff-role'];
  if (!role) {
    return res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Internal CMS endpoints require Azure AD authentication (x-mock-staff-role header in mock mode)',
      zone: 'INTERNAL',
    });
  }
  req.staffRole = role;
  // x-mock-actor-id lets the console pass the logged-in user's email
  req.actorId = req.headers['x-mock-actor-id'] || role;
  next();
}

// ─── In-memory session store ──────────────────────────────────────────────────

const sessions = new Map(); // sessionId → { platform, currentStepIndex, answers }

// ─── KYC Question Bank ────────────────────────────────────────────────────────

const KYC_QUESTIONS = [
  // Section 1: Personal Details
  {
    sectionId: 'personal_details', sectionTitle: 'Personal Information',
    questions: [
      // iOS sends q_first_name + q_last_name; web sends q_full_name
      // BFF accepts both — validates whichever is present
      { questionId: 'q_first_name', type: 'KYCTextInput', label: 'First name',
        placeholder: 'e.g. Tai Man',
        validation: { required: true, minLength: 1, errorMessage: 'First name is required' } },
      { questionId: 'q_last_name', type: 'KYCTextInput', label: 'Last name',
        placeholder: 'e.g. CHAN',
        validation: { required: true, minLength: 1, errorMessage: 'Last name is required' } },
      { questionId: 'q_date_of_birth', type: 'KYCTextInput', label: 'Date of birth',
        placeholder: 'YYYY-MM-DD', inputType: 'date',
        validation: { required: true, errorMessage: 'Date of birth is required' } },
      { questionId: 'q_nationality',  type: 'KYCSingleSelect', label: 'Nationality',
        options: [
          { value: 'HK', label: 'Hong Kong SAR' },
          { value: 'CN', label: 'Mainland China' },
          { value: 'GB', label: 'United Kingdom' },
          { value: 'US', label: 'United States' },
          { value: 'SG', label: 'Singapore' },
          { value: 'OTHER', label: 'Other' },
        ],
        validation: { required: true } },
    ],
  },
  // Section 2: Identity Document — questions vary by nationality (resolved at compose time)
  {
    sectionId: 'identity_document', sectionTitle: 'Identity Document',
    questions: [
      // q_id_nationality_ref is a reference token — BFF uses session nationality to pick ID questions
      { questionId: 'q_hkid_number',       type: 'KYCTextInput', label: 'HKID number',
        placeholder: 'A123456(7)', helpText: 'Include check digit in brackets',
        validation: { required: true, errorMessage: 'HKID number is required' } },
      { questionId: 'q_hkid_expiry',       type: 'KYCTextInput', label: 'HKID expiry date',
        placeholder: 'DD/MM/YYYY or N/A',
        validation: { required: false } },
      { questionId: 'q_mainland_id',        type: 'KYCTextInput', label: 'Mainland China ID (居民身份証)',
        placeholder: '110101199001011234', helpText: '18-digit resident ID number',
        validation: { required: false, errorMessage: 'ID number is required' } },
      { questionId: 'q_passport_number',    type: 'KYCTextInput', label: 'Passport number',
        placeholder: 'e.g. X12345678',
        validation: { required: false, errorMessage: 'Passport number is required' } },
      { questionId: 'q_passport_expiry',    type: 'KYCTextInput', label: 'Passport expiry date',
        placeholder: 'DD/MM/YYYY',
        validation: { required: false } },
    ],
  },
  // Section 3: Document Upload
  {
    sectionId: 'identity_upload', sectionTitle: 'Upload Identity Document',
    questions: [
      { questionId: 'q_hkid_front', type: 'KYCDocUpload', label: 'HKID — Front side',
        helpText: 'Take a clear photo or upload a scan. File must be under 10MB.' },
    ],
  },
  // Section 4: Contact Details
  {
    sectionId: 'contact_details', sectionTitle: 'Contact Details',
    questions: [
      { questionId: 'q_email', type: 'KYCTextInput', label: 'Email address',
        placeholder: 'name@example.com', inputType: 'email',
        validation: { required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$',
                      errorMessage: 'Please enter a valid email address' } },
      { questionId: 'q_phone', type: 'KYCTextInput', label: 'Mobile number (Hong Kong)',
        placeholder: '91234567', inputType: 'tel',
        helpText: 'We will send a verification code to this number',
        validation: { required: true, pattern: '^[4-9][0-9]{7}$',
                      errorMessage: 'Please enter a valid 8-digit HK mobile number' } },
    ],
  },
  // Section 5: Address
  {
    sectionId: 'residential_address', sectionTitle: 'Residential Address',
    questions: [
      { questionId: 'q_addr_line1', type: 'KYCTextInput', label: 'Address line 1',
        placeholder: 'Flat / Floor / Block', validation: { required: true } },
      { questionId: 'q_addr_line2', type: 'KYCTextInput', label: 'Address line 2',
        placeholder: 'Building name / Estate', validation: { required: false } },
      { questionId: 'q_addr_district', type: 'KYCSingleSelect', label: 'District',
        options: [
          { value: 'central_western', label: 'Central & Western' },
          { value: 'eastern',         label: 'Eastern' },
          { value: 'southern',        label: 'Southern' },
          { value: 'wan_chai',        label: 'Wan Chai' },
          { value: 'kowloon_city',    label: 'Kowloon City' },
          { value: 'kwun_tong',       label: 'Kwun Tong' },
          { value: 'wong_tai_sin',    label: 'Wong Tai Sin' },
          { value: 'yau_tsim_mong',   label: 'Yau Tsim Mong' },
          { value: 'sham_shui_po',    label: 'Sham Shui Po' },
          { value: 'sha_tin',         label: 'Sha Tin' },
          { value: 'tai_po',          label: 'Tai Po' },
          { value: 'north',           label: 'North' },
          { value: 'islands',         label: 'Islands' },
        ],
        validation: { required: true } },
    ],
  },
  // Section 6: Employment
  {
    sectionId: 'employment', sectionTitle: 'Employment & Income',
    questions: [
      { questionId: 'q_employment_status', type: 'KYCSingleSelect', label: 'Employment status',
        options: [
          { value: 'EMPLOYED',       label: 'Employed (full-time or part-time)' },
          { value: 'SELF_EMPLOYED',  label: 'Self-employed' },
          { value: 'BUSINESS_OWNER', label: 'Business owner' },
          { value: 'RETIRED',        label: 'Retired' },
          { value: 'STUDENT',        label: 'Student' },
          { value: 'HOMEMAKER',      label: 'Homemaker' },
          { value: 'UNEMPLOYED',     label: 'Unemployed' },
        ],
        validation: { required: true } },
      { questionId: 'q_annual_income', type: 'KYCSingleSelect', label: 'Annual income (HKD)',
        options: [
          { value: 'below_100k',    label: 'Below HKD 100,000' },
          { value: '100k_300k',     label: 'HKD 100,000 – 300,000' },
          { value: '300k_600k',     label: 'HKD 300,000 – 600,000' },
          { value: '600k_1m',       label: 'HKD 600,000 – 1,000,000' },
          { value: 'above_1m',      label: 'Above HKD 1,000,000' },
          { value: 'prefer_not',    label: 'Prefer not to say' },
        ],
        validation: { required: true } },
    ],
  },
  // Section 7: Source of Funds (CDD)
  {
    sectionId: 'source_of_funds', sectionTitle: 'Source of Funds',
    questions: [
      { questionId: 'q_source_of_funds', type: 'KYCSingleSelect', label: 'Primary source of funds',
        options: [
          { value: 'EMPLOYMENT',  label: 'Employment / Salary' },
          { value: 'BUSINESS',    label: 'Business Income' },
          { value: 'INVESTMENT',  label: 'Investment Returns' },
          { value: 'INHERITANCE', label: 'Inheritance / Gift' },
          { value: 'PROPERTY',    label: 'Property Sale' },
          { value: 'PENSION',     label: 'Pension / Retirement Fund' },
          { value: 'SAVINGS',     label: 'Accumulated Savings' },
          { value: 'OTHER',       label: 'Other' },
        ],
        validation: { required: true } },
      { questionId: 'q_account_purpose', type: 'KYCSingleSelect', label: 'Purpose of account',
        options: [
          { value: 'EVERYDAY_BANKING',       label: 'Everyday banking & payments' },
          { value: 'SAVINGS',                label: 'Savings & deposits' },
          { value: 'INVESTMENT',             label: 'Investment & wealth management' },
          { value: 'SALARY_RECEIPT',         label: 'Salary / income receipt' },
          { value: 'INTERNATIONAL_TRANSFER', label: 'International money transfers' },
          { value: 'MORTGAGE',               label: 'Mortgage repayments' },
        ],
        validation: { required: true } },
    ],
  },
  // Section 8: Liveness / Biometric
  {
    sectionId: 'liveness_check', sectionTitle: 'Selfie & Liveness Check',
    questions: [
      { questionId: 'q_liveness', type: 'KYCLiveness', label: 'Liveness verification',
        helpText: 'Verify you are a real person and match your ID document' },
    ],
  },
  // Section 9: Open Banking
  {
    sectionId: 'open_banking', sectionTitle: 'Connect Your Bank',
    questions: [
      { questionId: 'q_ob_consent', type: 'KYCOpenBanking', label: 'Open Banking consent',
        helpText: 'Connect your bank to verify account ownership via Open Banking' },
    ],
  },
  // Section 10: Declarations
  {
    sectionId: 'declarations', sectionTitle: 'Legal Declarations',
    questions: [
      { questionId: 'q_pep_status',    type: 'KYCDeclaration', label: 'PEP Status', validation: { required: true } },
      { questionId: 'decl_truthful',   type: 'KYCDeclaration', label: 'Truthfulness declaration' },
      { questionId: 'decl_fatca',      type: 'KYCDeclaration', label: 'FATCA declaration' },
    ],
  },
];

// ─── Platform splitter (mirrors KYCPlatformSplitter.java logic) ───────────────

function splitIntoSteps(platform) {
  const steps = [];
  let stepNum = 0;

  for (const section of KYC_QUESTIONS) {
    if (platform === 'web') {
      // Web: group non-upload questions into one step per section
      const normal  = section.questions.filter(q => q.type !== 'KYCDocUpload');
      const uploads = section.questions.filter(q => q.type === 'KYCDocUpload');
      if (normal.length > 0) {
        stepNum++;
        steps.push({
          stepId: `step-${String(stepNum).padStart(3,'0')}`,
          stepIndex: stepNum,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          questions: normal,
          layout: 'two_column_grid',
        });
      }
      for (const q of uploads) {
        stepNum++;
        steps.push({
          stepId: `step-${String(stepNum).padStart(3,'0')}`,
          stepIndex: stepNum,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          questions: [q],
          layout: 'document_upload',
        });
      }
    } else {
      // Mobile: max 3 questions per step; uploads/selects alone
      // Special case: identity_document section stays as one step (nationality filtering
      // happens at render time — we don't know which questions apply until nationality is answered)
      if (section.sectionId === 'identity_document') {
        stepNum++;
        steps.push({
          stepId: `step-${String(stepNum).padStart(3,'0')}`,
          stepIndex: stepNum,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          questions: section.questions, // all possible ID questions — filtered at render
          layout: 'single_column',
        });
      } else {
        let buffer = [];
        const flush = () => {
          if (buffer.length === 0) return;
          stepNum++;
          steps.push({
            stepId: `step-${String(stepNum).padStart(3,'0')}`,
            stepIndex: stepNum,
            sectionId: section.sectionId,
            sectionTitle: section.sectionTitle,
            questions: [...buffer],
            layout: 'single_column',
          });
          buffer = [];
        };
        for (const q of section.questions) {
          if (q.type === 'KYCDocUpload' || q.type === 'KYCSingleSelect') {
            flush();
            stepNum++;
            steps.push({
              stepId: `step-${String(stepNum).padStart(3,'0')}`,
              stepIndex: stepNum,
              sectionId: section.sectionId,
              sectionTitle: section.sectionTitle,
              questions: [q],
              layout: q.type === 'KYCDocUpload' ? 'document_upload' : 'single_column',
            });
          } else {
            buffer.push(q);
            if (buffer.length >= 3) flush();
          }
        }
        flush();
      }
    }
  }
  return steps;
}

// ─── Build SDUI JSON for a step ───────────────────────────────────────────────


// Returns only the ID questions relevant for the given nationality
function filterIdQuestionsByNationality(questions, nationality) {
  switch (nationality) {
    case 'HK':
      return questions.filter(q => ['q_hkid_number','q_hkid_expiry'].includes(q.questionId));
    case 'CN':
      return questions.filter(q => ['q_mainland_id'].includes(q.questionId));
    case 'SG':
      return questions.filter(q => ['q_passport_number','q_passport_expiry'].includes(q.questionId));
    default:
      // All other nationalities: passport
      return questions.filter(q => ['q_passport_number','q_passport_expiry'].includes(q.questionId));
  }
}

function buildSDUIPayload(step, sessionId, allSteps, platform, savedAnswers) {
  // Filter identity questions by nationality stored in session answers
  const nationality = savedAnswers['q_nationality'] || 'HK';
  const questions = step.sectionId === 'identity_document'
    ? filterIdQuestionsByNationality(step.questions, nationality)
    : step.questions;
  const children = questions.map(q => buildComponent(q, savedAnswers, step, platform));

  const containerType = platform === 'web' ? 'KYCWebContainer' : 'KYCScrollContainer';
  const layout = step.layout === 'two_column_grid' && platform === 'web'
    ? { type: 'KYCTwoColumnGrid', id: 'grid-' + step.stepId, props: {}, children }
    : { type: containerType, id: 'root-' + step.stepId, props: { platform }, children };

  return {
    schemaVersion: '2.3',
    screen: 'kyc_step',
    ttl: 0,
    metadata: {
      sessionId,
      stepId: step.stepId,
      stepIndex: step.stepIndex,
      totalSteps: allSteps.length,
      sectionTitle: step.sectionTitle,
      platform,
    },
    layout,
  };
}

function buildComponent(q, savedAnswers, step, platform) {
  return {
    type: q.type,
    id: q.questionId,
    props: {
      questionId: q.questionId,
      label: q.label,
      placeholder: q.placeholder,
      helpText: q.helpText,
      inputType: q.inputType,
      options: q.options,
      validation: q.validation,
      savedValue: savedAnswers[q.questionId] ?? null,
      colSpan: step.layout === 'two_column_grid' && q.type === 'KYCTextInput' ? 1 : undefined,
    },
    analytics: {
      impressionEvent: 'kyc_question_viewed',
      componentId: q.questionId,
      customProperties: { section: step.sectionId, questionType: q.type },
    },
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Start a new KYC session
app.post('/api/v1/kyc/sessions/start', (req, res) => {
  const platform = req.headers['x-platform'] ?? 'web';
  const sessionId = 'kyc-' + uuidv4().split('-')[0];
  const steps = splitIntoSteps(platform);

  sessions.set(sessionId, {
    platform,
    steps,
    currentStepIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
  });

  console.log(`[BFF] Started session ${sessionId} platform=${platform} steps=${steps.length}`);
  res.json({ sessionId, totalSteps: steps.length, platform });
});

// Resume — return current step
app.get('/api/v1/kyc/sessions/:sessionId/resume', (req, res) => {
  const { sessionId } = req.params;
  const platform = req.headers['x-platform'] ?? 'web';
  let session = sessions.get(sessionId);

  if (!session) {
    // Auto-create if session not found (page refresh case)
    const steps = splitIntoSteps(platform);
    session = { platform, steps, currentStepIndex: 0, answers: {}, startedAt: new Date().toISOString() };
    sessions.set(sessionId, session);
  }

  const step = session.steps[session.currentStepIndex];
  console.log(`[BFF] Resume ${sessionId} → step ${step.stepId}`);
  res.json(buildSDUIPayload(step, sessionId, session.steps, session.platform, session.answers));
});

// Get a specific step
app.get('/api/v1/kyc/sessions/:sessionId/steps/:stepId', (req, res) => {
  const { sessionId, stepId } = req.params;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const step = session.steps.find(s => s.stepId === stepId);
  if (!step) return res.status(404).json({ error: 'Step not found' });

  console.log(`[BFF] Get step ${stepId} for session ${sessionId}`);
  res.json(buildSDUIPayload(step, sessionId, session.steps, session.platform, session.answers));
});

// Submit answers for a step
app.post('/api/v1/kyc/sessions/:sessionId/steps/:stepId/submit', (req, res) => {
  const { sessionId, stepId } = req.params;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { answers = [] } = req.body;

  // Persist answers
  for (const { questionId, value } of answers) {
    session.answers[questionId] = value;
  }

  // Basic validation — check required fields are present in submitted answers
  const step = session.steps.find(s => s.stepId === stepId);
  const validationErrors = [];
  for (const q of (step?.questions ?? [])) {
    if (!q.validation?.required) continue;
    const val = session.answers[q.questionId];
    // Consider empty string, null, undefined as missing
    if (val === undefined || val === null || val === '') {
      validationErrors.push({ questionId: q.questionId, message: q.validation.errorMessage || `${q.label} is required` });
    }
  }
  if (validationErrors.length > 0) {
    return res.status(422).json({ status: 'INVALID', validationErrors });
  }

  // Advance to next step
  const currentIdx = session.steps.findIndex(s => s.stepId === stepId);
  const nextIdx = currentIdx + 1;
  session.currentStepIndex = nextIdx;

  console.log(`[BFF] Submitted ${stepId} for ${sessionId}. Answers: ${Object.keys(session.answers).length}`);

  if (nextIdx >= session.steps.length) {
    return res.json({ status: 'COMPLETE', sessionId });
  }

  const nextStep = session.steps[nextIdx];
  res.json({ status: 'NEXT_STEP', nextStepId: nextStep.stepId, totalSteps: session.steps.length });
});

// Health check (public)
app.get('/health', (req, res) => res.json({ status: 'ok', sessions: sessions.size }));

// ─── ZONE 2: Internal CMS endpoints (require Azure AD auth) ──────────────────
// In mock mode: pass x-mock-staff-role header to simulate AD group membership.
// In production: replaced by Spring Security + real Azure AD JWT.

const mockContentStore = [
  { contentId: 'hk-jade-banner-q2', bizLine: 'WEALTH', status: 'PUBLISHED',
    title: 'Jade Upgrade Banner Q2', authorId: 'j.chan@hsbc.com.hk' },
  { contentId: 'hk-cc-visa-promo',  bizLine: 'CARDS',  status: 'DRAFT',
    title: 'Visa Platinum Promo',    authorId: 'm.lee@hsbc.com.hk' },
  { contentId: 'hk-mortgage-calc',  bizLine: 'MORTGAGE', status: 'PUBLISHED',
    title: 'SmartMortgage Calculator', authorId: 'k.wong@hsbc.com.hk' },
];

function getBizLinesFromRole(role) {
  if (role === 'ADMIN')   return ['CARDS','MORTGAGE','WEALTH','SAVINGS','GLOBAL'];
  if (role === 'AUDITOR') return ['*'];
  const parts = role.split('-');
  return parts.length >= 2 ? [parts[0]] : [];
}

function getRoleType(role) {
  if (role === 'ADMIN')   return 'ADMIN';
  if (role === 'AUDITOR') return 'AUDITOR';
  return role.split('-')[1] ?? 'AUTHOR'; // CARDS-AUTHOR → AUTHOR
}

// List all content (all Zone 2 staff may read; accessLevel injected per item)
app.get('/api/v1/content', requireInternalAuth, (req, res) => {
  const role     = req.staffRole;
  const roleType = getRoleType(role);
  const bizLines = getBizLinesFromRole(role);

  const enriched = mockContentStore.map(c => ({
    ...c,
    accessLevel: bizLines.includes('*') || bizLines.includes(c.bizLine)
      ? (roleType === 'APPROVER' || roleType === 'ADMIN' ? 'APPROVE' : 'WRITE')
      : 'READ_ONLY',
  }));
  res.json({ content: enriched, total: enriched.length });
});

// Get single content item (all Zone 2 staff may read)
app.get('/api/v1/content/:contentId', requireInternalAuth, (req, res) => {
  const item = mockContentStore.find(c => c.contentId === req.params.contentId);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const role     = req.staffRole;
  const bizLines = getBizLinesFromRole(role);
  const accessLevel = bizLines.includes('*') || bizLines.includes(item.bizLine)
    ? 'WRITE' : 'READ_ONLY';
  res.json({ content: item, accessLevel });
});

// Edit content (AUTHOR of same biz line or ADMIN only)
app.put('/api/v1/content/:contentId', requireInternalAuth, (req, res) => {
  const item = mockContentStore.find(c => c.contentId === req.params.contentId);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const role     = req.staffRole;
  const roleType = getRoleType(role);
  const bizLines = getBizLinesFromRole(role);

  if (roleType === 'AUDITOR') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Auditors are read-only' });
  }
  if (roleType === 'APPROVER') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Approvers cannot edit content' });
  }
  if (!bizLines.includes('*') && !bizLines.includes(item.bizLine)) {
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: `Your biz lines [${bizLines}] have no write access to ${item.bizLine} content`,
      yourBizLines: bizLines, contentBizLine: item.bizLine,
    });
  }
  console.log(`[INTERNAL] EDIT ${item.contentId} by ${role}`);
  res.json({ status: 'saved', contentId: item.contentId });
});

// Approve content (APPROVER of same biz line or ADMIN; cannot approve own content)
app.post('/api/v1/content/:contentId/approve', requireInternalAuth, (req, res) => {
  const item = mockContentStore.find(c => c.contentId === req.params.contentId);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const role     = req.staffRole;
  const roleType = getRoleType(role);
  const bizLines = getBizLinesFromRole(role);

  if (roleType !== 'APPROVER' && roleType !== 'ADMIN') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Only APPROVERs or ADMIN can approve' });
  }
  if (!bizLines.includes('*') && !bizLines.includes(item.bizLine)) {
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: `Your biz lines [${bizLines}] have no approval access to ${item.bizLine} content`,
    });
  }
  console.log(`[INTERNAL] APPROVED ${item.contentId} by ${role}`);
  res.json({ status: 'APPROVED', contentId: item.contentId });
});

// Audit log stub (AUDITOR + ADMIN only)
app.get('/api/v1/audit-log', requireInternalAuth, (req, res) => {
  const roleType = getRoleType(req.staffRole);
  if (roleType !== 'AUDITOR' && roleType !== 'ADMIN') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Audit log requires AUDITOR or ADMIN role' });
  }
  res.json({
    entries: [
      { sequenceNum: 1, occurredAt: new Date().toISOString(), actorId: 'j.chan@hsbc.com.hk',
        actorRole: 'AUTHOR', action: 'CONTENT_SUBMITTED', resourceId: 'hk-jade-banner-q2',
        contentBizLine: 'WEALTH' },
      { sequenceNum: 2, occurredAt: new Date().toISOString(), actorId: 'm.wong@hsbc.com.hk',
        actorRole: 'APPROVER', action: 'CONTENT_PUBLISHED', resourceId: 'hk-jade-banner-q2',
        contentBizLine: 'WEALTH' },
    ],
    total: 2, chainIntact: true,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UCP CONSOLE — Home Page Layout + Workflow APIs
// Zone 2 (internal staff only) — auth via x-mock-staff-role header
// ═══════════════════════════════════════════════════════════════════════════════

// ─── In-memory stores ─────────────────────────────────────────────────────────

const ucpPages    = new Map(); // pageId → { layout, status, version, history[] }
const ucpWorkflow = new Map(); // entryId → WorkflowEntry
const ucpAudit    = [];        // append-only audit log

// Seed one page so there is always something to GET
ucpPages.set('home-wealth-hk', {
  pageId: 'home-wealth-hk',
  name: 'Home – Wealth Hub (HK)',
  platform: 'ios',
  locale: 'zh-HK',
  slices: [],
  status: 'DRAFT',
  version: 0,
  publishedAt: null,
});

function ucpAuditEntry(actorId, actorRole, action, pageId, pageName, details) {
  const e = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actorId, actorRole, action, pageId, pageName, details: details || null,
  };
  ucpAudit.push(e);
  console.log(`[UCP AUDIT] ${action} — page:${pageId} actor:${actorId}`);
  return e;
}

// ─── GET  /api/v1/ucp/pages  — list all pages (Zone 2) ───────────────────────
app.get('/api/v1/ucp/pages', requireInternalAuth, (req, res) => {
  const pages = Array.from(ucpPages.values()).map(p => ({
    pageId: p.pageId, name: p.name, platform: p.platform, locale: p.locale,
    status: p.status, version: p.version, publishedAt: p.publishedAt,
  }));
  res.json({ pages, total: pages.length });
});

// ─── GET  /api/v1/ucp/pages/:pageId  — get full layout ───────────────────────
app.get('/api/v1/ucp/pages/:pageId', requireInternalAuth, (req, res) => {
  const page = ucpPages.get(req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json({ page });
});

// ─── PUT  /api/v1/ucp/pages/:pageId  — save draft layout (AUTHOR/ADMIN only) ─
app.put('/api/v1/ucp/pages/:pageId', requireInternalAuth, (req, res) => {
  const { actorId, staffRole } = req;
  const roleType = getRoleType(staffRole);
  if (roleType === 'APPROVER' || roleType === 'AUDITOR') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Only AUTHORS or ADMIN can save draft layouts' });
  }

  const page = ucpPages.get(req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  if (page.status === 'PENDING_APPROVAL') {
    return res.status(409).json({ error: 'LOCKED', message: 'Page is pending approval — retract before editing' });
  }

  const { layout } = req.body;
  if (!layout || !Array.isArray(layout.slices)) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'layout.slices must be an array' });
  }

  Object.assign(page, { ...layout, pageId: page.pageId, status: 'DRAFT', version: page.version });
  ucpAuditEntry(actorId, staffRole, 'DRAFT_SAVED', page.pageId, page.name);
  res.json({ status: 'SAVED', pageId: page.pageId });
});

// ─── POST /api/v1/ucp/pages/:pageId/submit  — submit for approval ─────────────
app.post('/api/v1/ucp/pages/:pageId/submit', requireInternalAuth, (req, res) => {
  const { actorId, staffRole } = req;
  const roleType = getRoleType(staffRole);
  if (roleType === 'APPROVER' || roleType === 'AUDITOR') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Only AUTHORS or ADMIN can submit' });
  }

  const page = ucpPages.get(req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });

  const entryId = uuidv4();
  const entry = {
    entryId, pageId: page.pageId, pageName: page.name,
    status: 'PENDING_APPROVAL',
    authorId: actorId, authorName: actorId,
    submittedAt: new Date().toISOString(),
    reviewerId: null, reviewerName: null, reviewedAt: null,
    comments: req.body.comment ? [{ id: uuidv4(), authorId: actorId, authorRole: staffRole, text: req.body.comment, timestamp: new Date().toISOString() }] : [],
    layout: { ...page },
    version: page.version + 1,
  };
  ucpWorkflow.set(entryId, entry);
  page.status = 'PENDING_APPROVAL';
  ucpAuditEntry(actorId, staffRole, 'SUBMITTED_FOR_APPROVAL', page.pageId, page.name);
  res.json({ status: 'SUBMITTED', entryId });
});

// ─── GET /api/v1/ucp/workflow  — list pending workflow entries ─────────────────
app.get('/api/v1/ucp/workflow', requireInternalAuth, (req, res) => {
  const entries = Array.from(ucpWorkflow.values()).map(e => ({
    entryId: e.entryId, pageId: e.pageId, pageName: e.pageName,
    status: e.status, authorId: e.authorId, submittedAt: e.submittedAt,
    version: e.version,
  }));
  res.json({ entries, total: entries.length });
});

// ─── POST /api/v1/ucp/workflow/:entryId/approve  — approve (APPROVER/ADMIN) ──
app.post('/api/v1/ucp/workflow/:entryId/approve', requireInternalAuth, (req, res) => {
  const { actorId, staffRole } = req;
  const roleType = getRoleType(staffRole);
  if (roleType !== 'APPROVER' && roleType !== 'ADMIN') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Only APPROVERs or ADMIN can approve' });
  }

  const entry = ucpWorkflow.get(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'Workflow entry not found' });
  if (entry.status !== 'PENDING_APPROVAL') {
    return res.status(409).json({ error: 'INVALID_STATE', message: `Entry is ${entry.status}, not PENDING_APPROVAL` });
  }
  if (entry.authorId === actorId) {
    return res.status(403).json({ error: 'SELF_APPROVE', message: 'Maker cannot approve their own submission' });
  }

  Object.assign(entry, {
    status: 'APPROVED',
    reviewerId: actorId, reviewerName: actorId, reviewedAt: new Date().toISOString(),
  });
  if (req.body.comment) {
    entry.comments.push({ id: uuidv4(), authorId: actorId, authorRole: staffRole, text: req.body.comment, timestamp: new Date().toISOString() });
  }

  const page = ucpPages.get(entry.pageId);
  if (page) page.status = 'APPROVED';

  ucpAuditEntry(actorId, staffRole, 'APPROVED', entry.pageId, entry.pageName, req.body.comment);
  res.json({ status: 'APPROVED', entryId: entry.entryId });
});

// ─── POST /api/v1/ucp/workflow/:entryId/reject  — reject (APPROVER/ADMIN) ────
app.post('/api/v1/ucp/workflow/:entryId/reject', requireInternalAuth, (req, res) => {
  const { actorId, staffRole } = req;
  const roleType = getRoleType(staffRole);
  if (roleType !== 'APPROVER' && roleType !== 'ADMIN') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Only APPROVERs or ADMIN can reject' });
  }

  const entry = ucpWorkflow.get(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'Workflow entry not found' });
  if (entry.status !== 'PENDING_APPROVAL') {
    return res.status(409).json({ error: 'INVALID_STATE', message: `Entry is ${entry.status}` });
  }

  const reason = req.body.comment;
  if (!reason?.trim()) return res.status(400).json({ error: 'COMMENT_REQUIRED', message: 'Rejection reason is required' });

  Object.assign(entry, {
    status: 'REJECTED',
    reviewerId: actorId, reviewerName: actorId, reviewedAt: new Date().toISOString(),
  });
  entry.comments.push({ id: uuidv4(), authorId: actorId, authorRole: staffRole, text: reason, timestamp: new Date().toISOString() });

  const page = ucpPages.get(entry.pageId);
  if (page) page.status = 'DRAFT';

  ucpAuditEntry(actorId, staffRole, 'REJECTED', entry.pageId, entry.pageName, reason);
  res.json({ status: 'REJECTED', entryId: entry.entryId });
});

// ─── POST /api/v1/ucp/workflow/:entryId/publish  — publish to production ──────
app.post('/api/v1/ucp/workflow/:entryId/publish', requireInternalAuth, (req, res) => {
  const { actorId, staffRole } = req;
  const roleType = getRoleType(staffRole);
  if (roleType === 'AUDITOR') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Auditors cannot publish' });
  }

  const entry = ucpWorkflow.get(req.params.entryId);
  if (!entry) return res.status(404).json({ error: 'Workflow entry not found' });
  if (entry.status !== 'APPROVED') {
    return res.status(409).json({ error: 'NOT_APPROVED', message: 'Entry must be APPROVED before publishing' });
  }

  Object.assign(entry, { status: 'LIVE' });

  const page = ucpPages.get(entry.pageId);
  if (page) {
    Object.assign(page, { ...entry.layout, status: 'LIVE', version: entry.version, publishedAt: new Date().toISOString() });
  }

  ucpAuditEntry(actorId, staffRole, 'PUBLISHED', entry.pageId, entry.pageName, `v${entry.version} published to production`);
  res.json({ status: 'PUBLISHED', pageId: entry.pageId, version: entry.version });
});

// ─── GET /api/v1/screen/home-wealth-hk  — SDUI delivery to mobile clients ────
// Zone 1 public endpoint — returns published layout as SDUI JSON
app.get('/api/v1/screen/home-wealth-hk', (req, res) => {
  const page = ucpPages.get('home-wealth-hk');
  if (!page || page.status !== 'LIVE') {
    return res.status(404).json({ error: 'NO_LIVE_PAGE', message: 'No live home page published yet' });
  }
  res.json({
    schemaVersion: '3.0',
    screen: 'home_wealth_hub',
    ttl: 300,
    metadata: {
      pageId: page.pageId, locale: page.locale, platform: page.platform,
      version: page.version, publishedAt: page.publishedAt,
      generatedAt: new Date().toISOString(),
    },
    layout: { type: 'SCROLL', children: page.slices },
  });
});

// ─── GET /api/v1/ucp/audit-log  — full audit trail (AUDITOR + ADMIN only) ─────
app.get('/api/v1/ucp/audit-log', requireInternalAuth, (req, res) => {
  const roleType = getRoleType(req.staffRole);
  if (roleType !== 'AUDITOR' && roleType !== 'ADMIN') {
    return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Audit log requires AUDITOR or ADMIN role' });
  }
  const entries = [...ucpAudit].reverse();
  res.json({ entries, total: entries.length, chainIntact: true });
});

// ─── GET /api/v1/ucp/preview/:pageId  — draft/approval preview (Zone 2) ──────
// stage query param: 'preview' (draft), 'approval' (pending)
// Returns an HTML page that embeds the SDUI JSON so the mobile preview app can render it.
// In a real setup this would be gated by short-lived JWT tokens.
app.get('/api/v1/ucp/preview/:pageIdOrEntryId', (req, res) => {
  const { pageIdOrEntryId } = req.params;
  const stage = req.query.stage || 'preview';
  const role  = req.headers['x-mock-staff-role'];

  // Require internal auth for preview/approval stages
  if (stage !== 'screen' && !role) {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Preview requires staff authentication' });
  }

  let layout = null;
  let stageName = 'Preview';

  if (stage === 'approval') {
    // Look up by workflow entryId first, then pageId
    const entry = ucpWorkflow.get(pageIdOrEntryId)
      ?? Array.from(ucpWorkflow.values()).find(e => e.pageId === pageIdOrEntryId && e.status === 'PENDING_APPROVAL');
    if (entry) { layout = entry.layout; stageName = 'Approval Preview'; }
  } else {
    // Draft preview — serve current page data
    const page = ucpPages.get(pageIdOrEntryId);
    if (page) { layout = page; stageName = 'Draft Preview'; }
  }

  if (!layout) {
    return res.status(404).send(`
      <html><body style="font-family:sans-serif;padding:32px;background:#1A1A2E;color:#fff;text-align:center">
        <h2>⚠️ Preview Not Available</h2>
        <p>Stage: <strong>${stage}</strong> — no layout found for <code>${pageIdOrEntryId}</code></p>
        <p style="color:#9CA3AF;font-size:12px">Submit for approval first, or check the page ID.</p>
      </body></html>
    `);
  }

  const sliceCount = layout.slices?.length ?? 0;

  // Return a mobile-friendly HTML preview page
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
  <title>HSBC UCP — ${stageName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F0F2F5; }
    .stage-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 999;
      background: ${ stage === 'approval' ? '#D97706' : stage === 'production' ? '#059669' : '#6B7280' };
      color: #fff; text-align: center; padding: 6px 16px;
      font-size: 12px; font-weight: 700; letter-spacing: 0.05em;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .content { padding-top: 34px; }
    .json-viewer {
      background: #1E2235; color: #A5D6FF; font-size: 11px; font-family: monospace;
      padding: 16px; margin: 16px; border-radius: 12px; overflow: auto;
      max-height: 60vh; white-space: pre-wrap; word-break: break-all;
    }
    .meta { padding: 12px 16px; font-size: 12px; color: #6B7280; line-height: 1.6; }
    .meta strong { color: #1A1A2E; }
    .slice-pill {
      display: inline-block; background: #EEF2FF; color: #4338CA;
      font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin: 2px;
    }
  </style>
</head>
<body>
  <div class="stage-bar">
    ${ stage === 'approval' ? '🔄 APPROVAL PREVIEW' : stage === 'production' ? '🚀 PRODUCTION' : '🔍 DRAFT PREVIEW' }
    &nbsp;·&nbsp; ${layout.name ?? pageIdOrEntryId}
    &nbsp;·&nbsp; ${sliceCount} component${sliceCount !== 1 ? 's' : ''}
  </div>
  <div class="content">
    <div class="meta">
      <div><strong>Page:</strong> ${layout.name ?? '—'}</div>
      <div><strong>Stage:</strong> ${stageName}</div>
      <div><strong>Platform:</strong> ${layout.platform ?? '—'} / ${layout.locale ?? '—'}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
      <div style="margin-top:8px"><strong>Slices:</strong><br/>
        ${(layout.slices ?? []).map(s => `<span class="slice-pill">${s.type}${s.visible === false ? ' 🙈' : ''}</span>`).join('')}
      </div>
    </div>
    <div class="json-viewer">${JSON.stringify(layout, null, 2).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
  </div>
  <script>
    // Placeholder: real mobile preview app would parse window.__SDUI_LAYOUT and render native components
    window.__SDUI_LAYOUT = ${JSON.stringify(layout)};
    window.__SDUI_STAGE  = '${stage}';
    console.log('[HSBC UCP Preview] Layout loaded. Stage:', window.__SDUI_STAGE, '— Slices:', window.__SDUI_LAYOUT?.slices?.length);
  </script>
</body>
</html>`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI SEMANTIC SEARCH — Zone 1 (public)
// POST /api/v1/search
//
// Approach: cosine-similarity over TF-IDF-style keyword vectors built from the
// canonical embedding corpus below. No external ML dependency required — the
// mock simulates what a real vector-search backend (e.g. Vertex AI Matching
// Engine) would return, with identical result shapes.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Embedding corpus ─────────────────────────────────────────────────────────
// Each entry represents one searchable item: a mobile function entry-point OR
// a product / offer that is displayed on the Wealth Hub HK page.
// Fields:
//   id          — stable unique key
//   type        — 'function' | 'product' | 'ranking' | 'deal' | 'campaign'
//   title       — primary display label (Traditional Chinese + English keyword)
//   description — longer text used for semantic matching
//   keywords    — comma-separated aliases / synonyms for ranking boosts
//   deepLink    — deep link URI the mobile client should navigate to on tap
//   icon        — emoji for display in search results
//   category    — grouping label shown in results UI

const SEARCH_CORPUS = [
  // ── Quick Access functions ──────────────────────────────────────────────────
  { id:'fn-morning-treasure', type:'function',
    title:'朝朝寶', description:'朝朝寶每日活期存款高息理財產品 morning treasure daily wealth',
    keywords:'朝朝寶,daily interest,活期,高息,morning,treasure,每日收益',
    deepLink:'hsbc://wealth/morning-treasure', icon:'🌙', category:'快捷功能' },

  { id:'fn-loan', type:'function',
    title:'借錢 / 貸款', description:'個人貸款申請 閃電貸 極速放款 loan apply borrow cash',
    keywords:'借錢,貸款,loan,borrow,申請,cash,分期,repayment',
    deepLink:'hsbc://loan/apply', icon:'💵', category:'快捷功能' },

  { id:'fn-transfer', type:'function',
    title:'轉帳', description:'本地轉帳 跨行轉賬 即時支付 transfer money bank FPS PayNow',
    keywords:'轉帳,transfer,匯款,FPS,即時,跨行,他行',
    deepLink:'hsbc://transfer', icon:'↔️', category:'快捷功能' },

  { id:'fn-accounts', type:'function',
    title:'帳戶總覽', description:'所有帳戶餘額查詢 收支明細 account overview balance statement',
    keywords:'帳戶,accounts,餘額,balance,總覽,overview,明細',
    deepLink:'hsbc://accounts', icon:'📊', category:'快捷功能' },

  // ── Function Grid entry points ──────────────────────────────────────────────
  { id:'fn-credit-card', type:'function',
    title:'信用卡', description:'信用卡管理 賬單 還款 積分 credit card bill repayment reward points',
    keywords:'信用卡,credit card,Visa,Mastercard,賬單,積分,還款,cashback',
    deepLink:'hsbc://cards', icon:'💳', category:'功能入口' },

  { id:'fn-statements', type:'function',
    title:'收支明細', description:'交易記錄 月結單 收入支出分析 transaction history statement analysis',
    keywords:'收支明細,statement,交易,transaction,記錄,history,分析',
    deepLink:'hsbc://statements', icon:'📄', category:'功能入口' },

  { id:'fn-external-transfer', type:'function',
    title:'他行卡轉入', description:'從其他銀行轉入資金 外部轉賬 external bank transfer fund in',
    keywords:'他行,external,轉入,fund in,其他銀行,跨行',
    deepLink:'hsbc://transfer/external', icon:'🔄', category:'功能入口' },

  { id:'fn-city-services', type:'function',
    title:'城市服務', description:'繳費 水電煤 交通罰款 政府繳費 city services bill payment utilities',
    keywords:'城市服務,utilities,繳費,水電,罰款,government,bill payment',
    deepLink:'hsbc://city-services', icon:'🏙️', category:'功能入口' },

  { id:'fn-events', type:'function',
    title:'熱門活動', description:'最新優惠活動 推廣 限時優惠 promotions hot events offers',
    keywords:'熱門活動,events,優惠,promotions,活動,限時,campaigns',
    deepLink:'hsbc://events', icon:'🔥', category:'功能入口' },

  { id:'fn-wealth', type:'function',
    title:'理財', description:'理財產品 投資 基金 債券 wealth management investment products',
    keywords:'理財,wealth,investment,投資,管理,products,fund',
    deepLink:'hsbc://wealth', icon:'📈', category:'功能入口' },

  { id:'fn-membership', type:'function',
    title:'M+會員', description:'HSBC M+會員計劃 積分 特權 HSBC membership programme rewards privileges',
    keywords:'M+,會員,membership,積分,特權,rewards,privileges,premier',
    deepLink:'hsbc://membership', icon:'Ⓜ️', category:'功能入口' },

  { id:'fn-movies', type:'function',
    title:'影票優惠', description:'電影票優惠 折扣 cinema movie ticket discount',
    keywords:'影票,movie,cinema,電影,discount,ticket,折扣',
    deepLink:'hsbc://movies', icon:'🎬', category:'功能入口' },

  { id:'fn-funds', type:'function',
    title:'基金', description:'基金投資 互惠基金 ETF fund investment mutual fund',
    keywords:'基金,fund,ETF,互惠基金,investment,unit trust,NAV',
    deepLink:'hsbc://funds', icon:'💹', category:'功能入口' },

  { id:'fn-all-services', type:'function',
    title:'全部功能', description:'所有銀行服務功能列表 all banking services full menu',
    keywords:'全部,all,services,功能,more,menu,more services',
    deepLink:'hsbc://all-services', icon:'⋯', category:'功能入口' },

  // ── Wealth products ─────────────────────────────────────────────────────────
  { id:'prod-daily-positive', type:'product',
    title:'活錢理財｜歷史天天正收益', description:'R1低風險理財產品 7日年化2.80% 贖回T+1到帳 daily positive return low risk',
    keywords:'活錢理財,天天正,daily positive,低風險,R1,2.80%,贖回,T+1,活期理財',
    deepLink:'hsbc://wealth/daily-positive', icon:'💰', category:'財富精選' },

  { id:'prod-bond-fund', type:'product',
    title:'主投債券基金', description:'7日年化3.04% 歷史周周正收益 債券投資 bond fund weekly positive',
    keywords:'債券,bond,3.04%,周周正,weekly,fixed income,固定收益',
    deepLink:'hsbc://wealth/bond-fund', icon:'📋', category:'財富精選' },

  { id:'prod-guaranteed', type:'product',
    title:'保本理財 / 年均收益率', description:'保証領取 穩健低波 2.31% guaranteed return stable low volatility',
    keywords:'保証,guaranteed,年均,2.31%,穩健,低波,stable,capital protected',
    deepLink:'hsbc://wealth/guaranteed', icon:'🔐', category:'財富精選' },

  // ── Rankings ────────────────────────────────────────────────────────────────
  { id:'rank-top-funds', type:'ranking',
    title:'3322選基 — 優中選優', description:'精選基金榜單 近1年漲跌幅高達318.19% best performing funds selection methodology',
    keywords:'3322,選基,top funds,榜單,ranking,優中選優,318%,performance',
    deepLink:'hsbc://rankings/top-funds', icon:'🥇', category:'特色榜單' },

  { id:'rank-fixed-income', type:'ranking',
    title:'穩健省心好選擇 — 固收優選', description:'固定收益優選 歷史持有3月盈利概率高達98.23% fixed income conservative ranking',
    keywords:'固收,穩健,省心,fixed income,98%,盈利,conservative,bond ranking',
    deepLink:'hsbc://rankings/fixed-income', icon:'🔒', category:'特色榜單' },

  { id:'rank-all-time-high', type:'ranking',
    title:'屢創新高榜', description:'淨值屢創新高 近3年净值創新高次數達152 all-time high fund performance',
    keywords:'新高,all-time high,152次,净值,創新高,performance record',
    deepLink:'hsbc://rankings/all-time-high', icon:'📈', category:'特色榜單' },

  // ── Life deals ──────────────────────────────────────────────────────────────
  { id:'deal-kfc', type:'deal',
    title:'KFC 單品優惠', description:'肯德基單品優惠 信用卡折扣 fast food dining discount KFC',
    keywords:'KFC,肯德基,fast food,單品,優惠,dining,discount,食',
    deepLink:'hsbc://deals/kfc', icon:'🍗', category:'生活特惠' },

  { id:'deal-luckin', type:'deal',
    title:'瑞幸咖啡 5折優惠', description:'Luckin Coffee瑞幸5折 咖啡優惠 coffee deal half price',
    keywords:'瑞幸,Luckin,咖啡,coffee,5折,half price,飲品,drink',
    deepLink:'hsbc://deals/luckin', icon:'☕', category:'生活特惠' },

  { id:'deal-dq', type:'deal',
    title:'DQ 冰雪皇后 5折起', description:'Dairy Queen冰淇淋5折起 甜點優惠 ice cream dessert deal',
    keywords:'DQ,Dairy Queen,冰淇淋,5折,ice cream,dessert,甜點',
    deepLink:'hsbc://deals/dq', icon:'🍦', category:'生活特惠' },

  // ── Campaigns ───────────────────────────────────────────────────────────────
  { id:'camp-finance-day', type:'campaign',
    title:'10分招財日', description:'每月10日開啓 查帳單 學投資 優配置 monthly finance day campaign',
    keywords:'招財日,10日,finance day,每月,投資,學習,campaign',
    deepLink:'hsbc://campaign/finance-day', icon:'🎯', category:'推廣活動' },

  { id:'camp-flash-loan', type:'function',
    title:'閃電貸 — 極速放款', description:'閃電貸最高可借HKD300,000 極速放款 flash loan instant approval',
    keywords:'閃電貸,flash loan,極速,instant,300000,HKD,放款,approval',
    deepLink:'hsbc://loan/flash', icon:'⚡', category:'快捷功能' },

  { id:'camp-spring', type:'campaign',
    title:'春季播種黃金期', description:'春季投資配置 抽體驗禮 spring investment campaign lucky draw',
    keywords:'春季,spring,投資,配置,抽獎,lucky draw,體驗禮,gift',
    deepLink:'hsbc://campaign/spring-investment', icon:'🌱', category:'推廣活動' },

  { id:'camp-health', type:'campaign',
    title:'達標抽好禮 — 豐潤守護', description:'健康隨行保障計劃 達標抽獎 health protection campaign reward',
    keywords:'健康,health,保障,protection,抽獎,reward,豐潤,守護',
    deepLink:'hsbc://campaign/health', icon:'🎁', category:'推廣活動' },

  { id:'camp-anniversary', type:'campaign',
    title:'行慶招財日 — 特惠禮遇', description:'銀行週年慶典 特惠禮遇 bank anniversary special privileges',
    keywords:'行慶,anniversary,特惠,禮遇,週年,celebration,privileges,special offer',
    deepLink:'hsbc://campaign/anniversary', icon:'🏦', category:'推廣活動' },

  // ── AI assistant ────────────────────────────────────────────────────────────
  { id:'fn-ai-assistant', type:'function',
    title:'智能財富助理', description:'AI智能財富助理 投資建議 產品推薦 AI wealth advisor recommendation',
    keywords:'AI,智能,助理,advisor,wealth,建議,recommendation,chatbot,聊天',
    deepLink:'hsbc://ai-assistant', icon:'✉️', category:'快捷功能' },

  // ── Account / settings ──────────────────────────────────────────────────────
  { id:'fn-notifications', type:'function',
    title:'通知 / 訊息', description:'銀行通知 賬戶提醒 交易提示 notifications alerts messages',
    keywords:'通知,notification,提醒,alert,訊息,message,inbox',
    deepLink:'hsbc://notifications', icon:'🔔', category:'功能入口' },

  { id:'fn-qr-scan', type:'function',
    title:'QR碼掃描 / 付款', description:'二維碼掃碼付款 收款 QR code scan pay receive',
    keywords:'QR,二維碼,掃碼,scan,pay,收款,付款,payment',
    deepLink:'hsbc://qr-scan', icon:'⬛', category:'功能入口' },
];

// ─── Tokeniser & similarity ────────────────────────────────────────────────────

function tokenise(text) {
  return text
    .toLowerCase()
    .replace(/[｜\|,，。、！？「」『』【】〔〕《》〈〉～·\-_\/\\]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

function buildTermFreq(tokens) {
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  return freq;
}

// Lightweight cosine-similarity between two term-frequency maps
function cosineSim(freqA, freqB) {
  let dot = 0, normA = 0, normB = 0;
  for (const [t, w] of Object.entries(freqA)) {
    normA += w * w;
    if (freqB[t]) dot += w * freqB[t];
  }
  for (const w of Object.values(freqB)) normB += w * w;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Score a single corpus entry against a query
function scoreEntry(entry, queryTokens, queryFreq) {
  const entryText = [entry.title, entry.description, entry.keywords].join(' ');
  const entryTokens = tokenise(entryText);
  const entryFreq   = buildTermFreq(entryTokens);

  // Cosine similarity on full text
  let score = cosineSim(queryFreq, entryFreq);

  // Boost: any query token that appears directly in the title (strong signal)
  const titleTokens = new Set(tokenise(entry.title));
  for (const qt of queryTokens) {
    if (titleTokens.has(qt)) score += 0.35;
  }

  // Boost: any query token that appears in the keywords field
  const kwTokens = new Set(tokenise(entry.keywords));
  for (const qt of queryTokens) {
    if (kwTokens.has(qt)) score += 0.20;
  }

  return score;
}

// ─── POST /api/v1/search — semantic search (Zone 1 public) ────────────────────
app.post('/api/v1/search', (req, res) => {
  const { query = '', limit = 8, types } = req.body;
  const q = String(query).trim();

  if (!q) {
    return res.status(400).json({ error: 'EMPTY_QUERY', message: 'query must not be empty' });
  }
  if (q.length > 200) {
    return res.status(400).json({ error: 'QUERY_TOO_LONG', message: 'query must be ≤ 200 characters' });
  }

  const queryTokens = tokenise(q);
  const queryFreq   = buildTermFreq(queryTokens);

  let corpus = SEARCH_CORPUS;
  if (Array.isArray(types) && types.length > 0) {
    corpus = corpus.filter(e => types.includes(e.type));
  }

  const scored = corpus
    .map(entry => ({ ...entry, score: scoreEntry(entry, queryTokens, queryFreq) }))
    .filter(e => e.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Number(limit) || 8, 20));

  console.log(`[SEARCH] query="${q}" → ${scored.length} result(s)`);

  res.json({
    query: q,
    totalMatched: scored.length,
    results: scored.map(e => ({
      id:          e.id,
      type:        e.type,
      title:       e.title,
      description: e.description,
      icon:        e.icon,
      category:    e.category,
      deepLink:    e.deepLink,
      score:       parseFloat(e.score.toFixed(4)),
    })),
  });
});

// ─── GET /api/v1/search/corpus — return full embedding corpus (for client-side caching) ─
app.get('/api/v1/search/corpus', (req, res) => {
  res.json({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    count: SEARCH_CORPUS.length,
    corpus: SEARCH_CORPUS.map(e => ({
      id: e.id, type: e.type, title: e.title,
      description: e.description, keywords: e.keywords,
      icon: e.icon, category: e.category, deepLink: e.deepLink,
    })),
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════════════╗');
  console.log('  ║     HSBC DSP Mock BFF — Running                    ║');
  console.log(`  ║     http://localhost:${PORT}                          ║`);
  console.log('  ║                                                    ║');
  console.log('  ║  KYC Endpoints (Zone 1 — public):                  ║');
  console.log(`  ║    POST /api/v1/kyc/sessions/start                 ║`);
  console.log(`  ║    GET  /api/v1/kyc/sessions/:id/resume            ║`);
  console.log(`  ║    POST /api/v1/kyc/sessions/:id/steps/:s/submit   ║`);
  console.log('  ║                                                    ║');
  console.log('  ║  UCP Console Endpoints (Zone 2 — internal staff):  ║');
  console.log('  ║    GET  /api/v1/ucp/pages                          ║');
  console.log('  ║    GET  /api/v1/ucp/pages/:pageId                  ║');
  console.log('  ║    PUT  /api/v1/ucp/pages/:pageId  (save draft)    ║');
  console.log('  ║    POST /api/v1/ucp/pages/:pageId/submit           ║');
  console.log('  ║    GET  /api/v1/ucp/workflow                       ║');
  console.log('  ║    POST /api/v1/ucp/workflow/:id/approve           ║');
  console.log('  ║    POST /api/v1/ucp/workflow/:id/reject            ║');
  console.log('  ║    POST /api/v1/ucp/workflow/:id/publish           ║');
  console.log('  ║    GET  /api/v1/ucp/audit-log                      ║');
  console.log('  ║                                                    ║');
  console.log('  ║  SDUI Delivery (Zone 1 — mobile clients):          ║');
  console.log('  ║    GET  /api/v1/screen/home-wealth-hk              ║');
  console.log('  ╚════════════════════════════════════════════════════╝');
  console.log('');
});
