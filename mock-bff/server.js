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
app.use('/media', express.static(require('path').join(__dirname, 'public/media')));

// ─── Media URL helper ─────────────────────────────────────────────────────────
// Returns an absolute media URL derived from the *incoming* request host.
// This ensures iOS Simulator (::1), iOS/Android/HarmonyNext physical devices
// (LAN IP), and Android/HarmonyNext emulators (10.0.2.2) all receive a URL
// they can reach — the host in the URL mirrors the host the client used to
// call the BFF, so it is always reachable from that client.
function mediaUrl(req, path) {
  const host = req.hostname;           // e.g. localhost, ::1, 10.81.103.103, 10.0.2.2
  const proto = req.protocol || 'http';
  return `${proto}://${host}:${PORT}${path}`;
}

// Resolves all relative /media/ URLs in a slice's props, including inside
// nested items[] arrays (e.g. WEALTH_STUDIO_CAROUSEL, GUIDES_INSIGHTS_CAROUSEL).
function resolveSliceMediaUrls(req, slice) {
  if (!slice.props) return slice;
  const MEDIA_FIELDS = ['imageUrl', 'videoUrl', 'thumbnailUrl', 'posterUrl'];
  MEDIA_FIELDS.forEach(field => {
    if (slice.props[field] && slice.props[field].startsWith('/media/')) {
      slice.props[field] = mediaUrl(req, slice.props[field]);
    }
  });
  if (Array.isArray(slice.props.items)) {
    slice.props.items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      MEDIA_FIELDS.forEach(field => {
        if (item[field] && item[field].startsWith('/media/')) {
          item[field] = mediaUrl(req, item[field]);
        }
      });
    });
  }
  return slice;
}

// ─── i18n / Locale resolution ─────────────────────────────────────────────────
// Priority: x-locale header → Accept-Language → default 'en-HK'
// Maps country+language BCP-47 tags to the 5 supported authoring locales.
const SUPPORTED_LOCALES = ['en', 'zh-TW', 'zh-CN', 'ar', 'es'];
const RTL_LOCALES        = new Set(['ar']);

const LOCALE_DICT = {
  'zh-TW': {
    'First name': '名字', 'Last name': '姓氏', 'Date of birth': '出生日期',
    'Nationality': '國籍', 'Phone number': '電話號碼', 'Email address': '電子郵件',
    'Residential address': '住宅地址', 'HKID number': '香港身份證號碼',
    'Passport number': '護照號碼', 'Full legal name': '全名（與身份證相同）',
    'Employment & Source of Funds': '職業及資金來源',
    'Personal Information': '個人資料', 'Identity Document': '身份證明文件',
    'Contact Details': '聯繫方式', 'Residential Address': '住宅地址',
    'Source of Wealth': '財富來源', 'KYC step': '開戶步驟',
  },
  'zh-CN': {
    'First name': '名字', 'Last name': '姓氏', 'Date of birth': '出生日期',
    'Nationality': '国籍', 'Phone number': '电话号码', 'Email address': '电子邮件',
    'Residential address': '住宅地址', 'HKID number': '香港身份证号码',
    'Passport number': '护照号码', 'Full legal name': '全名（与身份证相同）',
    'Employment & Source of Funds': '职业及资金来源',
    'Personal Information': '个人资料', 'Identity Document': '身份证明文件',
    'Contact Details': '联系方式', 'Residential Address': '住宅地址',
    'Source of Wealth': '财富来源', 'KYC step': '开户步骤',
  },
  'ar': {
    'First name': 'الاسم الأول', 'Last name': 'اسم العائلة',
    'Date of birth': 'تاريخ الميلاد', 'Nationality': 'الجنسية',
    'Phone number': 'رقم الهاتف', 'Email address': 'البريد الإلكتروني',
    'HKID number': 'رقم هوية هونغ كونغ', 'Passport number': 'رقم جواز السفر',
    'Personal Information': 'المعلومات الشخصية',
    'Identity Document': 'وثيقة الهوية', 'KYC step': 'خطوة التحقق',
  },
  'es': {
    'First name': 'Nombre', 'Last name': 'Apellido',
    'Date of birth': 'Fecha de nacimiento', 'Nationality': 'Nacionalidad',
    'Phone number': 'Número de teléfono', 'Email address': 'Correo electrónico',
    'HKID number': 'Número de HKID', 'Passport number': 'Número de pasaporte',
    'Personal Information': 'Información personal',
    'Identity Document': 'Documento de identidad', 'KYC step': 'Paso KYC',
  },
};

function resolveLocale(req) {
  const raw = req.headers['x-locale'] || req.headers['accept-language'] || 'en-HK';
  const tag  = raw.split(',')[0].trim().split(';')[0].trim();
  const lower = tag.toLowerCase();
  if (lower.startsWith('zh-hant') || lower === 'zh-hk' || lower === 'zh-tw') return 'zh-TW';
  if (lower.startsWith('zh-hans') || lower === 'zh-cn' || lower === 'zh-sg') return 'zh-CN';
  if (lower.startsWith('zh')) return 'zh-TW';
  if (lower.startsWith('ar'))  return 'ar';
  if (lower.startsWith('es'))  return 'es';
  return 'en';
}

function t(locale, key) {
  return (LOCALE_DICT[locale] && LOCALE_DICT[locale][key]) || key;
}

function resolveTextDir(locale) {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

// ─── Accessibility flag resolution ────────────────────────────────────────────
// Clients send x-a11y-flags: "reduceMotion,highContrast,largeText" (comma-sep)
// BFF echoes these in metadata so every client layer can conditionally adapt.
function resolveA11yFlags(req) {
  const raw = req.headers['x-a11y-flags'] || '';
  const flags = raw.split(',').map(f => f.trim().toLowerCase()).filter(Boolean);
  return {
    reduceMotion:  flags.includes('reducemotion'),
    highContrast:  flags.includes('highcontrast'),
    largeText:     flags.includes('largetext'),
    voiceOver:     flags.includes('voiceover'),    // iOS VoiceOver
    talkBack:      flags.includes('talkback'),     // Android TalkBack
    screenReader:  flags.includes('screenreader'), // Web / HarmonyNext
  };
}

// ─── Channel resolution ────────────────────────────────────────────────────────
// x-channel: SDUI | WEB_STANDARD | WEB_WECHAT (default: SDUI)
function resolveChannel(req) {
  const ch = (req.headers['x-channel'] || 'SDUI').toUpperCase();
  return ['SDUI', 'WEB_STANDARD', 'WEB_WECHAT'].includes(ch) ? ch : 'SDUI';
}

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

  const push = (sectionId, sectionTitle, questions, layout) => {
    stepNum++;
    steps.push({
      stepId: `step-${String(stepNum).padStart(3,'0')}`,
      stepIndex: stepNum,
      sectionId,
      sectionTitle,
      questions,
      layout,
    });
  };

  if (platform === 'web') {
    // Web: 6 consolidated steps matching 'OBKYC Account Opening - Web' journey in OCDP.
    // Mobile steps 1+2+3 → web-step-001  (identity)
    // Mobile steps 4+5   → web-step-002  (doc upload + contact)
    // Mobile steps 6+7+8 → web-step-003  (address + employment + funds)
    // Mobile step  9     → web-step-004  (liveness)
    // Mobile step  10    → web-step-005  (open banking)
    // Mobile step  11    → web-step-006  (declarations)
    const byId = {};
    for (const section of KYC_QUESTIONS)
      for (const q of section.questions) byId[q.questionId] = { ...q, sectionId: section.sectionId, sectionTitle: section.sectionTitle };
    const q = id => byId[id];

    push('personal_details',    'Your Identity',
      [q('q_first_name'), q('q_last_name'), q('q_date_of_birth'), q('q_nationality'),
       q('q_hkid_number'), q('q_hkid_expiry'), q('q_mainland_id'), q('q_passport_number'), q('q_passport_expiry')],
      'two_column_grid');

    push('identity_upload',     'Document & Contact',
      [q('q_hkid_front'), q('q_email'), q('q_phone')], 'two_column_grid');

    push('residential_address', 'Background',
      [q('q_addr_line1'), q('q_addr_line2'), q('q_addr_district'),
       q('q_employment_status'), q('q_annual_income'), q('q_source_of_funds'), q('q_account_purpose')],
      'two_column_grid');

    push('liveness_check',      'Selfie & Liveness', [q('q_liveness')], 'single_column');
    push('open_banking',        'Connect Your Bank',  [q('q_ob_consent')], 'single_column');
    push('declarations',        'Legal Declarations',
      [q('q_pep_status'), q('decl_truthful'), q('decl_fatca')], 'two_column_grid');

    return steps;
  }

  // Mobile: fixed 11-step layout matching the 'OBKYC Account Opening' journey in OCDP.
  // All three platforms (iOS, Android, HarmonyNext) share this step contract.
  //
  // step-001  Personal Info + DOB   q_first_name + q_last_name + q_date_of_birth
  // step-002  Nationality            q_nationality
  // step-003  Identity Document      q_hkid_number/q_hkid_expiry | q_mainland_id | q_passport_number/q_passport_expiry
  // step-004  Upload Document        q_hkid_front
  // step-005  Contact Details        q_email + q_phone
  // step-006  Residential Address    q_addr_line1 + q_addr_line2 + q_addr_district
  // step-007  Employment & Income    q_employment_status + q_annual_income
  // step-008  Source of Funds        q_source_of_funds + q_account_purpose
  // step-009  Selfie & Liveness      q_liveness
  // step-010  Connect Your Bank      q_ob_consent
  // step-011  Legal Declarations     q_pep_status + decl_truthful + decl_fatca

  const byId = {};
  for (const section of KYC_QUESTIONS) {
    for (const q of section.questions) byId[q.questionId] = { ...q, sectionId: section.sectionId, sectionTitle: section.sectionTitle };
  }
  const q = id => byId[id];

  // step-001: Personal Info + Date of Birth
  push('personal_details', 'Personal Information',
    [q('q_first_name'), q('q_last_name'), q('q_date_of_birth')], 'single_column');

  // step-002: Nationality
  push('personal_details', 'Personal Information',
    [q('q_nationality')], 'single_column');

  // step-003: Identity Document (all variants — nationality-filtered at render)
  push('identity_document', 'Identity Document',
    [q('q_hkid_number'), q('q_hkid_expiry'), q('q_mainland_id'), q('q_passport_number'), q('q_passport_expiry')],
    'single_column');

  // step-004: Upload Identity Document
  push('identity_upload', 'Upload Identity Document', [q('q_hkid_front')], 'document_upload');

  // step-005: Contact Details
  push('contact_details', 'Contact Details', [q('q_email'), q('q_phone')], 'single_column');

  // step-006: Residential Address (all address fields together)
  push('residential_address', 'Residential Address',
    [q('q_addr_line1'), q('q_addr_line2'), q('q_addr_district')], 'single_column');

  // step-007: Employment & Income
  push('employment', 'Employment & Income',
    [q('q_employment_status'), q('q_annual_income')], 'single_column');

  // step-008: Source of Funds & Account Purpose
  push('source_of_funds', 'Source of Funds',
    [q('q_source_of_funds'), q('q_account_purpose')], 'single_column');

  // step-009: Selfie & Liveness
  push('liveness_check', 'Selfie & Liveness Check', [q('q_liveness')], 'single_column');

  // step-010: Connect Your Bank
  push('open_banking', 'Connect Your Bank', [q('q_ob_consent')], 'single_column');

  // step-011: Legal Declarations
  push('declarations', 'Legal Declarations',
    [q('q_pep_status'), q('decl_truthful'), q('decl_fatca')], 'single_column');

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

function buildSDUIPayload(step, sessionId, allSteps, platform, savedAnswers, locale, a11y, channel) {
  const loc = locale || 'en';
  const dir = resolveTextDir(loc);
  // Filter identity questions by nationality stored in session answers
  const nationality = savedAnswers['q_nationality'] || 'HK';
  const questions = step.sectionId === 'identity_document'
    ? filterIdQuestionsByNationality(step.questions, nationality)
    : step.questions;
  const children = questions.map(q => buildComponent(q, savedAnswers, step, platform, loc, a11y));

  const containerType = platform === 'web' ? 'KYCWebContainer' : 'KYCScrollContainer';
  const layout = step.layout === 'two_column_grid' && platform === 'web'
    ? { type: 'KYCTwoColumnGrid', id: 'grid-' + step.stepId, props: { dir }, children }
    : { type: containerType, id: 'root-' + step.stepId, props: { platform, dir }, children };

  return {
    schemaVersion: '2.3',
    screen: 'kyc_step',
    ttl: 0,
    metadata: {
      sessionId,
      stepId: step.stepId,
      stepIndex: step.stepIndex,
      totalSteps: allSteps.length,
      sectionTitle: t(loc, step.sectionTitle),
      platform,
      locale: loc,
      textDir: dir,
      channel: channel || 'SDUI',
      a11y: a11y || {},
    },
    layout,
  };
}

function buildComponent(q, savedAnswers, step, platform, locale, a11y) {
  const loc = locale || 'en';
  return {
    type: q.type,
    id: q.questionId,
    props: {
      questionId: q.questionId,
      label: t(loc, q.label),
      placeholder: q.placeholder,
      helpText: q.helpText,
      inputType: q.inputType,
      options: q.options,
      validation: q.validation,
      savedValue: savedAnswers[q.questionId] ?? null,
      colSpan: step.layout === 'two_column_grid' && q.type === 'KYCTextInput' ? 1 : undefined,
      // Accessibility hints consumed by all SDUI renderers
      a11yLabel: t(loc, q.label),
      a11yHint: q.helpText || undefined,
      a11yLargeText: a11y?.largeText ?? false,
      a11yHighContrast: a11y?.highContrast ?? false,
    },
    analytics: {
      impressionEvent: 'kyc_question_viewed',
      componentId: q.questionId,
      customProperties: { section: step.sectionId, questionType: q.type, locale: loc },
    },
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// ─── GET /api/v1/config — client bootstrap configuration (Zone 1) ──────────────
// Returns locale, a11y flags, channel config, and feature flags resolved from
// the request headers. Clients call this once on app launch to configure themselves.
app.get('/api/v1/config', (req, res) => {
  const locale  = resolveLocale(req);
  const a11y    = resolveA11yFlags(req);
  const channel = resolveChannel(req);
  const platform = req.headers['x-platform'] || 'web';
  res.json({
    locale,
    textDir: resolveTextDir(locale),
    supportedLocales: SUPPORTED_LOCALES,
    channel,
    platform,
    a11y,
    featureFlags: {
      enableSemanticSearch: true,
      enableAIAssistant:    true,
      enableOpenBanking:    true,
      enableWealthStudio:   true,
    },
    sdui: {
      schemaVersion: '2.3',
      ttlSeconds: 300,
      cacheStrategy: channel === 'WEB_STANDARD' ? 'stale-while-revalidate' : 'network-first',
    },
    wcag: {
      level: 'AA',
      version: '2.1',
    },
  });
});

// Start a new KYC session
app.post('/api/v1/kyc/sessions/start', (req, res) => {
  const platform = req.headers['x-platform'] ?? 'web';
  const locale   = resolveLocale(req);
  const a11y     = resolveA11yFlags(req);
  const channel  = resolveChannel(req);
  const sessionId = 'kyc-' + uuidv4().split('-')[0];
  const steps = splitIntoSteps(platform);

  sessions.set(sessionId, {
    platform,
    locale,
    a11y,
    channel,
    steps,
    currentStepIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
  });

  console.log(`[BFF] Started session ${sessionId} platform=${platform} locale=${locale} channel=${channel} steps=${steps.length}`);
  res.json({ sessionId, totalSteps: steps.length, platform, locale, channel });
});

// Resume — return current step
app.get('/api/v1/kyc/sessions/:sessionId/resume', (req, res) => {
  const { sessionId } = req.params;
  const platform = req.headers['x-platform'] ?? 'web';
  const locale   = resolveLocale(req);
  const a11y     = resolveA11yFlags(req);
  const channel  = resolveChannel(req);
  let session = sessions.get(sessionId);

  if (!session) {
    // Auto-create if session not found (page refresh case)
    const steps = splitIntoSteps(platform);
    session = { platform, locale, a11y, channel, steps, currentStepIndex: 0, answers: {}, startedAt: new Date().toISOString() };
    sessions.set(sessionId, session);
  }

  const step = session.steps[session.currentStepIndex];
  console.log(`[BFF] Resume ${sessionId} → step ${step.stepId} locale=${locale}`);
  res.json(buildSDUIPayload(step, sessionId, session.steps, session.platform, session.answers, locale, a11y, channel));
});

// Get a specific step
app.get('/api/v1/kyc/sessions/:sessionId/steps/:stepId', (req, res) => {
  const { sessionId, stepId } = req.params;
  const locale  = resolveLocale(req);
  const a11y    = resolveA11yFlags(req);
  const channel = resolveChannel(req);
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const step = session.steps.find(s => s.stepId === stepId);
  if (!step) return res.status(404).json({ error: 'Step not found' });

  console.log(`[BFF] Get step ${stepId} for session ${sessionId} locale=${locale}`);
  res.json(buildSDUIPayload(step, sessionId, session.steps, session.platform, session.answers, locale, a11y, channel));
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

// Seed the Home Hub (HK) page — LIVE with full canonical slice layout
ucpPages.set('home-wealth-hk', {
  pageId: 'home-wealth-hk',
  name: 'Home Hub (HK)',
  platform: 'all',
  locale: 'zh-HK',
  status: 'LIVE',
  version: 3,
  publishedAt: new Date(Date.now() - 86400000 * 56).toISOString(), // ~8 weeks ago
  slices: [
    {
      instanceId: 'slice-home-search-header',
      type: 'HOME_SEARCH_HEADER',
      visible: true,
      locked: true,
      props: {
        premierLabel: 'HSBC Premier',  premierBg: '#DB0011',
        eliteLabel:   'HSBC Elite',    eliteBg:   '#0D5C3A',
        advanceLabel: 'HSBC One',      advanceBg: '#D4580A',
        massLabel:    'HSBC Personal Banking', massBg: '#4B5563',
        enableNotification: true,
        enableHeadset: true,
        placeholder: 'Search functions, products & content',
        enableSemanticSearch: true,
        searchApiEndpoint: '/api/v1/search/semantic',
      },
    },
    {
      instanceId: 'slice-combo-quick-access',
      type: 'COMBO_QUICK_ACCESS',
      visible: true,
      locked: false,
      props: {
        tabs: [
          { id: 'my-pick',  label: 'My pick',  active: true },
          { id: 'invest',   label: 'Invest',   active: false },
          { id: 'global',   label: 'Global',   active: false },
          { id: 'hk-daily', label: 'HK Daily', active: false },
        ],
        row1Items: [
          { id: 'qa-1', icon: 'account',  label: 'Account overview',  deepLink: 'hsbc://accounts' },
          { id: 'qa-2', icon: 'transfer', label: 'Transfer Globally', deepLink: 'hsbc://transfer/global' },
          { id: 'qa-3', icon: 'fx',       label: 'Foreign exchange',  deepLink: 'hsbc://fx' },
          { id: 'qa-4', icon: 'stock',    label: 'Trade stock',       deepLink: 'hsbc://trade/stock' },
          { id: 'qa-5', icon: 'deposit',  label: 'Time deposit',      deepLink: 'hsbc://deposit' },
        ],
        row2Items: [
          { id: 'qa-6',  icon: 'holding', label: 'My holding details',    deepLink: 'hsbc://holdings' },
          { id: 'qa-7',  icon: 'safe',    label: 'Money safe',             deepLink: 'hsbc://money-safe' },
          { id: 'qa-8',  icon: 'fps',     label: 'Local transfer/FPS',     deepLink: 'hsbc://transfer/fps' },
          { id: 'qa-9',  icon: 'scan',    label: 'Scan to pay',            deepLink: 'hsbc://scan-pay' },
          { id: 'qa-10', icon: 'all',     label: 'All product & services', deepLink: 'hsbc://all-services' },
        ],
      },
    },
    {
      instanceId: 'slice-card-activation',
      type: 'CARD_ACTIVATION_BANNER',
      visible: true,
      locked: false,
      props: {
        message: 'Your card needs to be activated',
        deepLink: 'hsbc://card/activate',
      },
    },
    {
      instanceId: 'slice-getting-started',
      type: 'QUEST_BANNER',
      visible: true,
      locked: false,
      props: {
        title: 'Getting started',
        description: 'Open investment account and complete the following quests to enjoy reward!',
        ctaLabel: 'Check out all 4 quests',
        ctaDeepLink: 'hsbc://quests',
        totalQuests: 4,
      },
    },
    {
      instanceId: 'slice-feature-product',
      type: 'FEATURE_PRODUCT',
      visible: true,
      locked: false,
      props: {
        sectionTitle: 'Feature product',
        tabs: ['Top performers', 'Top dividend', 'Top selling', 'Instalment'],
        activeTab: 'Top performers',
        funds: [
          {
            id: 'fp-1',
            name: 'AB SICAV I - LOW VOLATILITY EQUITY PORTFOLIO CLASS AD S...',
            code: 'U43120',
            returnLabel: '1Y return',
            returnValue: '+54.79%',
            returnPositive: true,
            tags: [],
          },
          {
            id: 'fp-2',
            name: 'HANG SENG INDEX FUND CLASS A (HKD)',
            code: 'U42272',
            returnLabel: '1Y return',
            returnValue: '+18.10%',
            returnPositive: true,
            tags: ['ESG'],
          },
          {
            id: 'fp-3',
            name: 'ALLIANZ INCOME AND GROWTH CLASS AM DIS (HKD MONTHLY...',
            code: 'U40032',
            returnLabel: '1Y return',
            returnValue: '+11.45%',
            returnPositive: true,
            tags: ['New fund'],
          },
        ],
        moreLabel: 'View Best selling fund list (10)',
        moreDeepLink: 'hsbc://funds/best-selling',
      },
    },
    {
      instanceId: 'slice-wealth-studio',
      type: 'WEALTH_STUDIO_CAROUSEL',
      visible: true,
      locked: false,
      props: {
        sectionTitle: 'Premier Elite Wealth Studio',
        moreLabel: 'View all',
        moreDeepLink: 'hsbc://wealth-studio',
        items: [
          {
            id: 'ws-1',
            episodeLabel: 'Episode 14',
            liveBadge: 'To-be-live on 1 Feb 15:30',
            title: 'Navigating Markets in 2026',
            ctaLabel: 'Register for live stream',
            imageColor: '#1A1A2E',
            videoUrl: '/media/Wealth1.mov',
          },
          {
            id: 'ws-2',
            episodeLabel: 'Episode 15',
            title: 'Gold & Alternative Assets',
            ctaLabel: 'Watch now',
            imageColor: '#0F2040',
            videoUrl: '/media/Wealth2.mov',
          },
        ],
      },
    },
    {
      instanceId: 'slice-guides-insights',
      type: 'GUIDES_INSIGHTS_CAROUSEL',
      visible: true,
      locked: false,
      props: {
        sectionTitle: 'Guides and insights',
        moreLabel: 'View all',
        moreDeepLink: 'hsbc://guides',
        items: [
          {
            id: 'gi-1',
            title: 'Investment 101 - An investment in knowledge pays the best interest - Benjamin Franklin',
            date: '8 Apr 2024',
            imageColor: '#2D3748',
            deepLink: 'hsbc://guides/investment-101',
          },
          {
            id: 'gi-2',
            title: 'Market outlook Q2 2024',
            date: '2 Apr 2024',
            imageColor: '#1A365D',
            deepLink: 'hsbc://guides/market-outlook',
          },
        ],
      },
    },
    {
      instanceId: 'slice-fx-watchlist',
      type: 'FX_WATCHLIST',
      visible: true,
      locked: false,
      props: {
        sectionTitle: 'FX watchlist',
        tierBadge: 'Gold Forex Club tier',
        tierDescription: '15% Spread discount has been applied to your rate.',
        pairs: [
          { id: 'fx-1', pair: 'USD/JPY', sellLabel: 'Sell USD', sellRate: '148.44', buyLabel: 'Buy USD', buyRate: '148.12' },
          { id: 'fx-2', pair: 'HKD/CHF', sellLabel: 'Sell HKD', sellRate: '0.1042', buyLabel: 'Buy HKD', buyRate: '0.1038' },
          { id: 'fx-3', pair: 'HKD/THB', sellLabel: 'Sell HKD', sellRate: '4.1055', buyLabel: 'Buy HKD', buyRate: '4.1132' },
        ],
        moreLabel: 'View more in FX',
        moreDeepLink: 'hsbc://fx/watchlist',
      },
    },
    {
      instanceId: 'slice-discover-more',
      type: 'DISCOVER_MORE_CAROUSEL',
      visible: true,
      locked: false,
      props: {
        sectionTitle: 'Discover more',
        items: [
          {
            id: 'dm-1',
            tag: 'Time Deposit',
            tagColor: '#DB0011',
            title: 'Up to 15.5% p.a. FX Deposit Rate',
            subtitle: 'Earn up to 15.5% p.a. on FX & Time Deposits! T&Cs apply.',
            imageColor: '#1A2E4A',
            deepLink: 'hsbc://deposit/fx',
          },
          {
            id: 'dm-2',
            tag: 'Well+',
            tagColor: '#6B46C1',
            title: 'PURE Sign up 10-day free trial',
            subtitle: 'Enjoy 10 days free access to PURE fitness with Well+.',
            imageColor: '#2D3748',
            deepLink: 'hsbc://wellplus',
          },
          {
            id: 'dm-3',
            tag: 'Premier Credit Card',
            tagColor: '#B7791F',
            title: 'Up to 10x reward points on dining',
            subtitle: 'Dine and earn more with your HSBC Premier card.',
            imageColor: '#2D1B00',
            deepLink: 'hsbc://credit-card/rewards',
          },
          {
            id: 'dm-4',
            tag: 'Investment',
            tagColor: '#2B6CB0',
            title: 'Zero brokerage on first 3 trades',
            subtitle: 'Start investing with zero commission for new investors.',
            imageColor: '#1A2E4A',
            deepLink: 'hsbc://invest/promo',
          },
          {
            id: 'dm-5',
            tag: 'Insurance',
            tagColor: '#276749',
            title: 'Protect what matters most',
            subtitle: 'Comprehensive life coverage starting from HKD 180/month.',
            imageColor: '#1C2E1C',
            deepLink: 'hsbc://insurance/life',
          },
        ],
      },
    },
  ],
});

// Seed the Market Insight page — FX Viewpoint (LIVE)
ucpPages.set('fx-viewpoint-hk', {
  pageId: 'fx-viewpoint-hk',
  name: 'FX Viewpoint — EUR & GBP (HK)',
  platform: 'all',
  locale: 'en-HK',
  status: 'LIVE',
  version: 1,
  publishedAt: new Date(Date.now() - 86400000).toISOString(),
  slices: [
    { instanceId: 'mi-header', type: 'HEADER_NAV', visible: true, locked: true,
      props: { title: 'FX Viewpoint', showNotificationBell: false, showQRScanner: false, showBackButton: true } },
    { instanceId: 'mi-content-header', type: 'VIDEO_PLAYER', visible: true, locked: false,
      props: {
        ucpAssetId: 'asset-008',
        title: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
        thumbnailUrl: 'https://placehold.co/1280x720/003366/ffffff?text=FX+Viewpoint+EUR+%26+GBP',
        videoUrl: '/media/fx-viewpoint.mov',
        presenterName: 'Jackie Wong',
        presenterTitle: 'FX Strategist, HSBC Global Research',
        autoplay: false,
        showCaption: true,
      } },
    { instanceId: 'mi-briefing', type: 'MARKET_BRIEFING_TEXT', visible: true, locked: false,
      props: {
        ucpContentId: 'ucp-content-fx-viewpoint-001',
        sectionTitle: 'Key takeaways',
        bulletPoints: [
          'A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.',
          'With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.',
          'BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.',
          'GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.',
          'Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.',
        ],
        disclaimer: 'This material is issued by HSBC and is for information purposes only. It does not constitute investment advice or a recommendation to buy or sell any financial instrument.',
      } },
    { instanceId: 'mi-contact-rm', type: 'CONTACT_RM_CTA', visible: true, locked: false,
      props: {
        label: 'Contact Your RM',
        subLabel: 'Speak to your Relationship Manager about FX opportunities',
        deepLink: 'hsbc://rm/contact?context=fx-viewpoint',
        backgroundColor: '#DB0011',
        textColor: '#FFFFFF',
        sticky: true,
      } },
  ],
});

// Seed the Deposit Campaign page (LIVE)
ucpPages.set('deposit-campaign-hk', {
  pageId: 'deposit-campaign-hk',
  name: 'New Fund Deposit Campaign (CN)',
  platform: 'all',
  locale: 'en-CN',
  status: 'LIVE',
  version: 1,
  publishedAt: new Date(Date.now() - 86400000).toISOString(),
  slices: [
    { instanceId: 'dep-header', type: 'HEADER_NAV', visible: true, locked: true,
      props: { title: 'Renminbi Savings Offers', showNotificationBell: false, showQRScanner: false, showBackButton: true } },
    { instanceId: 'dep-image-banner', type: 'PROMO_BANNER', visible: true, locked: false,
      props: { imageUrl: '/media/deposit-campaign-banner.jpg', ucpAssetId: 'asset-009', backgroundColor: '#FFFFFF' } },
    { instanceId: 'dep-cd-rate-banner', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        title: '🌟 Up to 1.15% p.a. Annual Equivalent Rate',
        subtitle: '3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don\'t miss this limited-time rate. Start earning more today.',
        badgeText: '🔥 New Funds Only',
        backgroundColor: '#FFF7ED',
        textColor: '#92400E',
      } },
    { instanceId: 'dep-rate-table', type: 'DEPOSIT_RATE_TABLE', visible: true, locked: false,
      props: {
        sectionTitle: 'Time Deposit Rate:',
        asAtDate: '5/22/2025',
        rates: [
          { term: '3 Month Time Deposit',  rate: '0.65' },
          { term: '6 Month Time Deposit',  rate: '0.85' },
          { term: '12 Month Time Deposit', rate: '0.95' },
          { term: '24 Month Time Deposit', rate: '1.05' },
          { term: '36 Month Time Deposit', rate: '1.25' },
          { term: '60 Month Time Deposit', rate: '1.30' },
        ],
        footnote: 'Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.',
      } },
    { instanceId: 'dep-open-cta', type: 'DEPOSIT_OPEN_CTA', visible: true, locked: false,
      props: { label: 'Open a Deposit', deepLink: 'hsbc://deposit/open?currency=CNY&campaign=new-fund', backgroundColor: '#C41E3A', textColor: '#FFFFFF' } },
    { instanceId: 'dep-spacer', type: 'SPACER', visible: true, locked: false, props: { height: 16 } },
    { instanceId: 'dep-faq', type: 'DEPOSIT_FAQ', visible: true, locked: false,
      props: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          { id: 'faq-1', question: 'Can I withdraw my time deposit before it matures?', answer: 'Yes, you can. But you\'ll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch.' },
          { id: 'faq-2', question: 'What happens if I don\'t withdraw my money after maturity?', answer: 'If you don\'t take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity.' },
          { id: 'faq-3', question: 'How long can I keep a time deposit?', answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates. The most popular choices are 6-month or 12-month plans.' },
          { id: 'faq-4', question: 'Why is the interest rate higher for time deposits than regular savings accounts?', answer: 'Banks can offer better rates because they know you\'ll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest.' },
        ],
      } },
  ],
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

  // Deep-clone and resolve relative media URLs (top-level and nested items[])
  const resolved = JSON.parse(JSON.stringify(page));
  if (resolved.slices) {
    resolved.slices = resolved.slices.map(slice => resolveSliceMediaUrls(req, slice));
  }

  res.json({ page: resolved });
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

// ─── GET /api/v1/ucp/content-assets  — content asset library (Zone 2) ─────────
// Returns the full list of UCP content assets (images, videos, documents).
// OCDP's page editor sidebar fetches this to populate the "Content" tab.
// Supports ?type=VIDEO|IMAGE|DOCUMENT&status=ACTIVE|ARCHIVED&q=<search> filters.
app.get('/api/v1/ucp/content-assets', requireInternalAuth, (req, res) => {
  const { type, status = 'ACTIVE', q } = req.query;

  const UCP_CONTENT_ASSETS = [
    {
      assetId: 'asset-001',
      name: 'Jade Banner Hero',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 248320,
      url: 'https://placehold.co/1200x400/1a1a2e/c9a96e?text=Jade+Hero',
      thumbnailUrl: 'https://placehold.co/240x80/1a1a2e/c9a96e?text=Jade+Hero',
      altText: 'HSBC Jade Premier Banking hero banner',
      tags: ['jade', 'hero', 'banner'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-002',
      name: 'VISA Infinite Card Art',
      assetType: 'IMAGE',
      mimeType: 'image/png',
      sizeBytes: 184210,
      url: 'https://placehold.co/800x500/DB0011/ffffff?text=VISA+Infinite',
      thumbnailUrl: 'https://placehold.co/160x100/DB0011/ffffff?text=VISA+Infinite',
      altText: 'HSBC VISA Infinite credit card product image',
      tags: ['visa', 'credit-card', 'product'],
      marketId: 'GLOBAL', bizLineId: 'PAYMENT',
      uploadedBy: 'k.lee@hsbc.com.hk', uploadedByName: 'Karen Lee',
      uploadedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-003',
      name: 'KYC Walkthrough Video',
      assetType: 'VIDEO',
      mimeType: 'video/mp4',
      sizeBytes: 18874368,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://placehold.co/256x144/003366/ffffff?text=KYC+Video',
      altText: 'KYC onboarding walkthrough tutorial',
      tags: ['kyc', 'onboarding', 'tutorial'],
      marketId: 'HK', bizLineId: 'WEB_ENABLER',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'ACTIVE',
      durationSeconds: 90,
      presenter: 'HSBC Digital Team',
      presenterTitle: 'Customer Onboarding',
    },
    {
      assetId: 'asset-004',
      name: 'HSBC Premier T&C PDF',
      assetType: 'DOCUMENT',
      mimeType: 'application/pdf',
      sizeBytes: 3145728,
      url: 'https://placehold.co/1x1/ffffff/ffffff?text=PDF',
      tags: ['terms', 'legal', 'premier'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-006',
      name: 'WeChat Campaign Banner',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 102400,
      url: 'https://placehold.co/900x500/07C160/ffffff?text=WeChat+Campaign',
      thumbnailUrl: 'https://placehold.co/180x100/07C160/ffffff?text=WeChat+Campaign',
      altText: 'WeChat Jade upgrade campaign banner',
      tags: ['wechat', 'campaign', 'jade'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-008',
      name: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
      assetType: 'VIDEO',
      mimeType: 'video/mp4',
      sizeBytes: 52428800,
      url: mediaUrl(req, '/media/fx-viewpoint.mov'),
      thumbnailUrl: 'https://placehold.co/1280x720/003366/ffffff?text=FX+Viewpoint+EUR+%26+GBP',
      altText: 'HSBC FX Viewpoint: EUR and GBP — ECB on hold and BoE cut rates. Presented by Jackie Wong.',
      tags: ['fx', 'viewpoint', 'eur', 'gbp', 'market-insight', 'wealth'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'ACTIVE',
      durationSeconds: 120,
      presenter: 'Jackie Wong',
      presenterTitle: 'FX Strategist, HSBC Global Research',
    },
    {
      assetId: 'asset-007',
      name: 'Old Promo Banner 2025',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 196608,
      url: 'https://placehold.co/1200x400/888888/ffffff?text=Old+Banner',
      thumbnailUrl: 'https://placehold.co/240x80/888888/ffffff?text=Old+Banner',
      altText: 'Archived 2025 promo banner',
      tags: ['archived', 'promo'],
      marketId: 'HK', bizLineId: 'MARKETING',
      uploadedBy: 'k.lee@hsbc.com.hk', uploadedByName: 'Karen Lee',
      uploadedAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      status: 'ARCHIVED',
    },
    {
      assetId: 'asset-009',
      name: 'Deposit Campaign Hero Banner',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 312000,
      url: mediaUrl(req, '/media/deposit-campaign-banner.jpg'),
      thumbnailUrl: mediaUrl(req, '/media/deposit-campaign-banner.jpg'),
      altText: 'Father and child looking out over mountains and lake — Renminbi Savings new fund deposit campaign',
      tags: ['deposit', 'campaign', 'savings', 'renminbi', 'banner'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now()).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-010',
      name: 'Home Hub — Feature Product Background',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 128000,
      url: 'https://placehold.co/800x200/1A2E4A/ffffff?text=Feature+Product',
      thumbnailUrl: 'https://placehold.co/160x40/1A2E4A/ffffff?text=Feature+Product',
      altText: 'Background image for feature product fund list section',
      tags: ['home', 'hub', 'funds', 'wealth'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now()).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-011',
      name: 'Premier Elite Wealth Studio — Episode 13 Thumbnail',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 192000,
      url: 'https://placehold.co/800x450/1A1A2E/ffffff?text=Wealth+Studio+Ep13',
      thumbnailUrl: 'https://placehold.co/160x90/1A1A2E/ffffff?text=Ep13',
      altText: 'How AI experts think about AI — Wealth Studio Episode 13',
      tags: ['wealth-studio', 'premier', 'elite', 'video', 'ai'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now()).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-012',
      name: 'Investment 101 — Guides & Insights Article Cover',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 156000,
      url: 'https://placehold.co/800x450/2D3748/ffffff?text=Investment+101',
      thumbnailUrl: 'https://placehold.co/160x90/2D3748/ffffff?text=Invest+101',
      altText: 'Investment 101 — An investment in knowledge pays the best interest',
      tags: ['guides', 'insights', 'investment', 'education'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: 'ACTIVE',
    },
    {
      assetId: 'asset-013',
      name: 'Time Deposit — Up to 15.5% p.a. Discover More Card',
      assetType: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 144000,
      url: 'https://placehold.co/600x400/1A2E4A/ffffff?text=FX+Deposit+15.5%25',
      thumbnailUrl: 'https://placehold.co/120x80/1A2E4A/ffffff?text=FX+Deposit',
      altText: 'Up to 15.5% p.a. FX Deposit Rate campaign card',
      tags: ['deposit', 'fx', 'campaign', 'discover'],
      marketId: 'HK', bizLineId: 'WEALTH',
      uploadedBy: 'j.chan@hsbc.com.hk', uploadedByName: 'Janet Chan',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'ACTIVE',
    },
  ];

  let assets = UCP_CONTENT_ASSETS;
  if (status) assets = assets.filter(a => a.status === status.toUpperCase());
  if (type)   assets = assets.filter(a => a.assetType === String(type).toUpperCase());
  if (q)      assets = assets.filter(a =>
    a.name.toLowerCase().includes(String(q).toLowerCase()) ||
    (a.tags ?? []).some(t => t.toLowerCase().includes(String(q).toLowerCase()))
  );

  res.json({ assets, total: assets.length });
});

// ─── GET /api/v1/ucp/components  — UI component registry (Zone 2) ─────────────
// Returns the UCP component registry so OCDP's editor sidebar "Components" tab
// can show live component definitions (version, category, configurable fields).
// Supports ?category=<cat>&status=ACTIVE|DEPRECATED filters.
app.get('/api/v1/ucp/components', requireInternalAuth, (req, res) => {
  const { category, status = 'ACTIVE' } = req.query;

  const UCP_COMPONENTS = [
    { componentId: 'comp-HOME_SEARCH_HEADER',     sliceType: 'HOME_SEARCH_HEADER',     label: 'Home Search Header (All Segments)', icon: '🏠🔍', category: 'navigation', description: 'Segment-adaptive header (red/jade/orange/silver) with integrated AI semantic search bar', configurable: ['premierLabel','eliteLabel','advanceLabel','massLabel','enableNotification','enableHeadset','placeholder','enableSemanticSearch','enableQRScan','enableChatbot','enableMessageInbox','searchApiEndpoint'], minHeight: 104, singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-PREMIER_HEADER',         sliceType: 'PREMIER_HEADER',         label: 'Premier Header',                 icon: '🏆',    category: 'navigation', description: 'HSBC Premier branded header (red) — shown to Premier segment',                         configurable: ['brandLabel','enableNotification','enableHeadset'],                                                               minHeight: 48,  singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-ELITE_HEADER',           sliceType: 'ELITE_HEADER',           label: 'Elite Header',                   icon: '💎',    category: 'navigation', description: 'HSBC Elite branded header (jade green) — shown to Elite segment',                      configurable: ['brandLabel','enableNotification','enableHeadset'],                                                               minHeight: 48,  singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-ADVANCE_HEADER',         sliceType: 'ADVANCE_HEADER',         label: 'Advance Header',                 icon: '🔶',    category: 'navigation', description: 'HSBC Advance branded header (orange) — shown to Advance segment',                     configurable: ['brandLabel','enableNotification','enableHeadset'],                                                               minHeight: 48,  singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-MASS_HEADER',            sliceType: 'MASS_HEADER',            label: 'Personal Banking Header',        icon: '🔘',    category: 'navigation', description: 'HSBC Personal Banking header (silver) — shown to Mass segment',                      configurable: ['brandLabel','enableNotification','enableHeadset'],                                                               minHeight: 48,  singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-HOME_SEARCH_BAR',        sliceType: 'HOME_SEARCH_BAR',        label: 'Home Search Bar',                icon: '🔍',    category: 'navigation', description: 'White pill search bar below the home header',                                          configurable: ['placeholder'],                                                                                                   minHeight: 44,  singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-COMBO_QUICK_ACCESS',     sliceType: 'COMBO_QUICK_ACCESS',     label: 'Quick Access + Tab Bar (Combo)', icon: '⚡',    category: 'navigation', description: 'Combined: tab bar (My pick/Invest/Global/HK Daily) + two 5-icon quick-access rows',  configurable: ['tabs','row1Items','row2Items'],                                                                                   minHeight: 130, singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-HEADER_NAV',             sliceType: 'HEADER_NAV',             label: 'Header Navigation',              icon: '🔝',    category: 'navigation', description: 'Top bar with search, notification bell, QR scanner',                                   configurable: ['title','searchPlaceholder','showNotificationBell','showQRScanner'],                                              minHeight: 60,  singleton: true,  version: '2.3.1', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-AI_SEARCH_BAR',          sliceType: 'AI_SEARCH_BAR',          label: 'AI Search Bar',                  icon: '🔍',    category: 'navigation', description: 'HSBC red semantic search bar with QR scan, chatbot and message entry',               configurable: ['placeholder','enableSemanticSearch','enableQRScan','enableChatbot','enableMessageInbox','searchApiEndpoint'],     minHeight: 44,  singleton: true,  version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-CARD_ACTIVATION_BANNER', sliceType: 'CARD_ACTIVATION_BANNER', label: 'Card Activation Banner',         icon: '🔔',    category: 'promotion',  description: 'Notification prompting the customer to activate their card',                           configurable: ['message','deepLink'],                                                                                            minHeight: 44,  singleton: false, version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-QUEST_BANNER',           sliceType: 'QUEST_BANNER',           label: 'Quest / Getting Started Banner', icon: '🎯',    category: 'promotion',  description: 'Getting-started quest progress card with HSBC hexagon icon',                          configurable: ['title','description','ctaLabel','ctaDeepLink','totalQuests'],                                                     minHeight: 80,  singleton: false, version: '1.0.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-FEATURE_PRODUCT',        sliceType: 'FEATURE_PRODUCT',        label: 'Feature Product (Fund List)',    icon: '📊',    category: 'wealth',     description: 'Tabbed fund list showing 1Y returns',                                                  configurable: ['sectionTitle','tabs','activeTab','funds','moreLabel','moreDeepLink'],                                             minHeight: 200, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-WEALTH_STUDIO_CAROUSEL', sliceType: 'WEALTH_STUDIO_CAROUSEL', label: 'Wealth Studio Carousel',         icon: '🎬',    category: 'wealth',     description: 'Premier Elite Wealth Studio horizontal video episode carousel',                        configurable: ['sectionTitle','items','moreLabel','moreDeepLink'],                                                               minHeight: 160, singleton: false, version: '1.0.0', maintainedBy: 'Premier & Jade Team',        status: 'ACTIVE' },
    { componentId: 'comp-GUIDES_INSIGHTS_CAROUSEL',        sliceType: 'GUIDES_INSIGHTS_CAROUSEL',        label: 'Guides & Insights',              icon: '📰',    category: 'insight',    description: 'Article card carousel — investment guides and market insights',                        configurable: ['sectionTitle','items','moreLabel','moreDeepLink'],                                                               minHeight: 160, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Content Team',        status: 'ACTIVE' },
    { componentId: 'comp-FX_WATCHLIST',           sliceType: 'FX_WATCHLIST',           label: 'FX Watchlist',                   icon: '💱',    category: 'wealth',     description: 'Currency pair watchlist with Gold Forex Club tier badge and live rates',              configurable: ['sectionTitle','tierBadge','tierDescription','pairs','moreLabel','moreDeepLink'],                                   minHeight: 200, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-DISCOVER_MORE_CAROUSEL',          sliceType: 'DISCOVER_MORE_CAROUSEL',          label: 'Discover More',                  icon: '🔎',    category: 'promotion',  description: 'Horizontal campaign card carousel — promotions and lifestyle offers',                  configurable: ['sectionTitle','items'],                                                                                          minHeight: 160, singleton: false, version: '1.0.0', maintainedBy: 'Marketing Enablement Team',  status: 'ACTIVE' },
    { componentId: 'comp-QUICK_ACCESS',           sliceType: 'QUICK_ACCESS',           label: 'Quick Access Buttons',           icon: '⚡',    category: 'function',   description: 'Row of primary product shortcuts',                                                      configurable: ['items'],                                                                                                         minHeight: 80,  singleton: true,  version: '1.8.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-PROMO_BANNER',           sliceType: 'PROMO_BANNER',           label: 'Promo Banner',                   icon: '🎪',    category: 'promotion',  description: 'Full-width campaign banner with image, title, CTA',                                    configurable: ['title','subtitle','ctaLabel','ctaDeepLink','imageUrl','backgroundColor','badgeText'],                             minHeight: 120, singleton: false, version: '3.1.0', maintainedBy: 'Marketing Enablement Team',  status: 'ACTIVE' },
    { componentId: 'comp-FUNCTION_GRID',          sliceType: 'FUNCTION_GRID',          label: 'Function Grid',                  icon: '🔲',    category: 'function',   description: 'Icon grid of banking functions',                                                        configurable: ['rows'],                                                                                                          minHeight: 140, singleton: true,  version: '2.0.4', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-AI_ASSISTANT',           sliceType: 'AI_ASSISTANT',           label: 'AI Assistant Entry',             icon: '🤖',    category: 'function',   description: 'Intelligent wealth assistant greeting bar',                                             configurable: ['greeting'],                                                                                                      minHeight: 44,  singleton: false, version: '1.2.0', maintainedBy: 'AI Team',                    status: 'ACTIVE' },
    { componentId: 'comp-AD_BANNER',              sliceType: 'AD_BANNER',              label: 'Advertisement Banner',           icon: '📢',    category: 'promotion',  description: 'Dismissible promotional banner with image swap support',                              configurable: ['title','subtitle','ctaLabel','ctaDeepLink','imageUrl','dismissible','validUntil'],                                 minHeight: 90,  singleton: false, version: '1.5.2', maintainedBy: 'Marketing Enablement Team',  status: 'ACTIVE' },
    { componentId: 'comp-FLASH_LOAN',             sliceType: 'FLASH_LOAN',             label: 'Flash Loan Card',                icon: '⚡',    category: 'wealth',     description: 'Instant loan product card with maximum amount display',                                 configurable: ['productName','tagline','maxAmount','currency','ctaLabel','ctaDeepLink'],                                          minHeight: 80,  singleton: false, version: '1.0.3', maintainedBy: 'Lending Product Team',       status: 'ACTIVE' },
    { componentId: 'comp-WEALTH_SELECTION',       sliceType: 'WEALTH_SELECTION',       label: 'Wealth Selection',               icon: '💰',    category: 'wealth',     description: 'Featured wealth products (7-day yield, risk level)',                                    configurable: ['sectionTitle','products','moreDeepLink'],                                                                        minHeight: 280, singleton: false, version: '2.2.1', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-FEATURED_RANKINGS',      sliceType: 'FEATURED_RANKINGS',      label: 'Featured Rankings',              icon: '🏆',    category: 'wealth',     description: 'Top-performing funds and product rankings',                                             configurable: ['sectionTitle','items','moreDeepLink'],                                                                           minHeight: 180, singleton: false, version: '1.4.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-LIFE_DEALS',             sliceType: 'LIFE_DEALS',             label: 'Life Deals',                     icon: '🛍️',   category: 'lifestyle',  description: 'Lifestyle merchant offers',                                                              configurable: ['sectionTitle','deals','moreDeepLink','bottomLinks'],                                                              minHeight: 200, singleton: false, version: '1.1.0', maintainedBy: 'Lifestyle Partnerships Team', status: 'ACTIVE' },
    { componentId: 'comp-SPACER',                 sliceType: 'SPACER',                 label: 'Spacer',                         icon: '↕️',    category: 'layout',     description: 'Vertical spacing element',                                                               configurable: ['height'],                                                                                                        minHeight: 16,  singleton: false, version: '1.0.0', maintainedBy: 'HIVE Platform Team',         status: 'ACTIVE' },
    { componentId: 'comp-MARKET_BRIEFING_TEXT',   sliceType: 'MARKET_BRIEFING_TEXT',   label: 'Market Briefing Text',           icon: '📋',    category: 'insight',    description: 'Bullet-point market briefing sourced from a UCP content entry',                        configurable: ['ucpContentId','sectionTitle','bulletPoints','disclaimer'],                                                        minHeight: 200, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Content Team',        status: 'ACTIVE' },
    { componentId: 'comp-VIDEO_PLAYER',           sliceType: 'VIDEO_PLAYER',           label: 'Video Player',                   icon: '🎬',    category: 'insight',    description: 'Inline video player linked to a UCP content asset',                                     configurable: ['ucpAssetId','title','presenterName','presenterTitle','autoplay','showCaption'],                                    minHeight: 180, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Content Team',        status: 'ACTIVE' },
    { componentId: 'comp-CONTACT_RM_CTA',         sliceType: 'CONTACT_RM_CTA',         label: 'Contact Your RM',                icon: '📞',    category: 'insight',    description: 'Sticky full-width CTA routing the customer to Relationship Manager finder',           configurable: ['label','subLabel','deepLink','backgroundColor','textColor','sticky'],                                             minHeight: 56,  singleton: true,  version: '1.0.0', maintainedBy: 'Premier & Jade Team',        status: 'ACTIVE' },
    { componentId: 'comp-DEPOSIT_RATE_TABLE',     sliceType: 'DEPOSIT_RATE_TABLE',     label: 'Deposit Rate Table',             icon: '🏦',    category: 'wealth',     description: 'Time deposit interest rate table — term and rate columns only',                        configurable: ['sectionTitle','asAtDate','rates','footnote'],                                                                     minHeight: 220, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-DEPOSIT_OPEN_CTA',       sliceType: 'DEPOSIT_OPEN_CTA',       label: 'Button CTA',                     icon: '🏧',    category: 'wealth',     description: 'Full-width "Open a Deposit" CTA button for deposit campaigns',                        configurable: ['label','deepLink','backgroundColor','textColor'],                                                                 minHeight: 56,  singleton: false, version: '1.0.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
    { componentId: 'comp-DEPOSIT_FAQ',            sliceType: 'DEPOSIT_FAQ',            label: 'General FAQ',                    icon: '❓',    category: 'wealth',     description: 'Collapsible FAQ accordion for deposit products',                                        configurable: ['sectionTitle','items'],                                                                                          minHeight: 200, singleton: false, version: '1.0.0', maintainedBy: 'Wealth Product Team',        status: 'ACTIVE' },
  ];

  let comps = UCP_COMPONENTS;
  if (status)   comps = comps.filter(c => c.status === String(status).toUpperCase());
  if (category) comps = comps.filter(c => c.category === String(category).toLowerCase());

  res.json({ components: comps, total: comps.length });
});
// Zone 1 public endpoint — returns published layout as SDUI JSON
app.get('/api/v1/screen/home-wealth-hk', (req, res) => {
  const page    = ucpPages.get('home-wealth-hk');
  const locale  = resolveLocale(req);
  const a11y    = resolveA11yFlags(req);
  const channel = resolveChannel(req);
  if (!page || page.status !== 'LIVE') {
    return res.status(404).json({ error: 'NO_LIVE_PAGE', message: 'No live home page published yet' });
  }
  res.json({
    schemaVersion: '3.0',
    pageId: page.pageId,
    screen: 'home_wealth_hub',
    ttl: 300,
    metadata: {
      pageId: page.pageId, locale, textDir: resolveTextDir(locale),
      platform: page.platform, channel,
      version: page.version, publishedAt: page.publishedAt,
      generatedAt: new Date().toISOString(),
      a11y,
    },
    layout: { type: 'SCROLL', children: page.slices.map(s => resolveSliceMediaUrls(req, JSON.parse(JSON.stringify(s)))) },
  });
});

// ─── GET /api/v1/screen/fx-viewpoint-hk  — Market Insight SDUI delivery ──────
// Zone 1 public endpoint — delivers the FX Viewpoint market insight page as SDUI JSON.
// The page contains a content header, MARKET_BRIEFING_TEXT and CONTACT_RM_CTA slices.
// The FX Viewpoint video was replaced by the rich UCP content entry "FX Viewpoint — EUR & GBP Market Insights (May 2026)".
app.get('/api/v1/screen/fx-viewpoint-hk', (req, res) => {
  const publishedAt = new Date(Date.now() - 86400000).toISOString();
  const locale  = resolveLocale(req);
  const a11y    = resolveA11yFlags(req);
  const channel = resolveChannel(req);
  res.json({
    schemaVersion: '3.0',
    pageId: 'fx-viewpoint-hk',
    screen: 'fx_viewpoint',
    ttl: 300,
    metadata: {
      pageId: 'fx-viewpoint-hk',
      locale,
      textDir: resolveTextDir(locale),
      platform: req.headers['x-platform'] || 'all',
      channel,
      version: 1,
      publishedAt,
      generatedAt: new Date().toISOString(),
      a11y,
    },
    layout: {
      type: 'SCROLL',
      children: [
        {
          instanceId: 'mi-header',
          type: 'HEADER_NAV',
          visible: true,
          locked: true,
          props: {
            title: 'FX Viewpoint',
            showNotificationBell: false,
            showQRScanner: false,
            showBackButton: true,
          },
        },
        {
          instanceId: 'mi-content-header',
          type: 'VIDEO_PLAYER',
          visible: true,
          locked: false,
          props: {
            ucpAssetId: 'asset-008',
            title: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
            thumbnailUrl: 'https://placehold.co/1280x720/003366/ffffff?text=FX+Viewpoint+EUR+%26+GBP',
            videoUrl: mediaUrl(req, '/media/fx-viewpoint.mov'),
            presenterName: 'Jackie Wong',
            presenterTitle: 'FX Strategist, HSBC Global Research',
            autoplay: false,
            showCaption: true,
          },
        },
        {
          instanceId: 'mi-briefing',
          type: 'MARKET_BRIEFING_TEXT',
          visible: true,
          locked: false,
          props: {
            ucpContentId: 'ucp-content-fx-viewpoint-001',
            sectionTitle: 'Key takeaways',
            bulletPoints: [
              'A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.',
              'With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.',
              'BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.',
              'GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.',
              'Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.',
            ],
            disclaimer: 'This material is issued by HSBC and is for information purposes only. It does not constitute investment advice or a recommendation to buy or sell any financial instrument.',
          },
        },
        {
          instanceId: 'mi-contact-rm',
          type: 'CONTACT_RM_CTA',
          visible: true,
          locked: false,
          props: {
            label: 'Contact Your RM',
            subLabel: 'Speak to your Relationship Manager about FX opportunities',
            deepLink: 'hsbc://rm/contact?context=fx-viewpoint',
            backgroundColor: '#DB0011',
            textColor: '#FFFFFF',
            sticky: true,
          },
        },
      ],
    },
  });
});

// ─── GET /api/v1/screen/deposit-campaign-hk  — Deposit Campaign SDUI delivery ─
// Zone 1 public endpoint — delivers the New Fund Deposit Campaign (CN) page as SDUI JSON.
// Contains HEADER_NAV, PROMO_BANNER (deposit-campaign-banner.jpg), PROMO_BANNER (CD rate callout),
// DEPOSIT_RATE_TABLE (rates only), DEPOSIT_OPEN_CTA, SPACER and DEPOSIT_FAQ.
app.get('/api/v1/screen/deposit-campaign-hk', (req, res) => {
  const publishedAt = new Date(Date.now() - 86400000).toISOString();
  const locale  = resolveLocale(req);
  const a11y    = resolveA11yFlags(req);
  const channel = resolveChannel(req);
  res.json({
    schemaVersion: '3.0',
    pageId: 'deposit-campaign-hk',
    screen: 'deposit_campaign',
    ttl: 300,
    metadata: {
      pageId: 'deposit-campaign-hk',
      locale,
      textDir: resolveTextDir(locale),
      platform: req.headers['x-platform'] || 'all',
      channel,
      version: 1,
      publishedAt,
      generatedAt: new Date().toISOString(),
      a11y,
    },
    layout: {
      type: 'SCROLL',
      children: [
        {
          instanceId: 'dep-header',
          type: 'HEADER_NAV',
          visible: true,
          locked: true,
          props: {
            title: 'Renminbi Savings Offers',
            showNotificationBell: false,
            showQRScanner: false,
            showBackButton: true,
          },
        },
        {
          instanceId: 'dep-image-banner',
          type: 'PROMO_BANNER',
          visible: true,
          locked: false,
          props: {
            imageUrl: mediaUrl(req, '/media/deposit-campaign-banner.jpg'),
            ucpAssetId: 'asset-009',
            backgroundColor: '#FFFFFF',
          },
        },
        {
          instanceId: 'dep-cd-rate-banner',
          type: 'PROMO_BANNER',
          visible: true,
          locked: false,
          props: {
            title: '🌟 Up to 1.15% p.a. Annual Equivalent Rate',
            subtitle: '3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don\'t miss this limited-time rate. Start earning more today.',
            badgeText: '🔥 New Funds Only',
            backgroundColor: '#FFF7ED',
            textColor: '#92400E',
          },
        },
        {
          instanceId: 'dep-rate-table',
          type: 'DEPOSIT_RATE_TABLE',
          visible: true,
          locked: false,
          props: {
            sectionTitle: 'Time Deposit Rate:',
            asAtDate: '5/22/2025',
            rates: [
              { term: '3 Month Time Deposit',  rate: '0.65' },
              { term: '6 Month Time Deposit',  rate: '0.85' },
              { term: '12 Month Time Deposit', rate: '0.95' },
              { term: '24 Month Time Deposit', rate: '1.05' },
              { term: '36 Month Time Deposit', rate: '1.25' },
              { term: '60 Month Time Deposit', rate: '1.30' },
            ],
            footnote: 'Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.',
          },
        },
        {
          instanceId: 'dep-open-cta',
          type: 'DEPOSIT_OPEN_CTA',
          visible: true,
          locked: false,
          props: {
            label: 'Open a Deposit',
            deepLink: 'hsbc://deposit/open?currency=CNY&campaign=new-fund',
            backgroundColor: '#C41E3A',
            textColor: '#FFFFFF',
          },
        },
        {
          instanceId: 'dep-spacer',
          type: 'SPACER',
          visible: true,
          locked: false,
          props: { height: 16 },
        },
        {
          instanceId: 'dep-faq',
          type: 'DEPOSIT_FAQ',
          visible: true,
          locked: false,
          props: {
            sectionTitle: 'Frequently Asked Questions',
            items: [
              {
                id: 'faq-1',
                question: 'Can I withdraw my time deposit before it matures?',
                answer: 'Yes, you can. But you\'ll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch.',
              },
              {
                id: 'faq-2',
                question: 'What happens if I don\'t withdraw my money after maturity?',
                answer: 'If you don\'t take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity.',
              },
              {
                id: 'faq-3',
                question: 'How long can I keep a time deposit?',
                answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates. The most popular choices are 6-month or 12-month plans.',
              },
              {
                id: 'faq-4',
                question: 'Why is the interest rate higher for time deposits than regular savings accounts?',
                answer: 'Banks can offer better rates because they know you\'ll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest.',
              },
            ],
          },
        },
      ],
    },
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
  const { query = '', limit = 8, types, appId } = req.body;
  const q = String(query).trim();

  if (!q) {
    return res.status(400).json({ error: 'EMPTY_QUERY', message: 'query must not be empty' });
  }
  if (q.length > 200) {
    return res.status(400).json({ error: 'QUERY_TOO_LONG', message: 'query must be ≤ 200 characters' });
  }

  const queryTokens = tokenise(q);
  const queryFreq   = buildTermFreq(queryTokens);

  // Prefer per-app corpus if appId provided and corpus exists; fall back to global
  let corpus = (appId && AI_SEARCH_CORPORA[appId] && AI_SEARCH_CORPORA[appId].length > 0)
    ? AI_SEARCH_CORPORA[appId]
    : SEARCH_CORPUS;

  if (Array.isArray(types) && types.length > 0) {
    corpus = corpus.filter(e => types.includes(e.type));
  }

  const scored = corpus
    .map(entry => ({ ...entry, score: scoreEntry(entry, queryTokens, queryFreq) }))
    .filter(e => e.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Number(limit) || 8, 20));

  console.log(`[SEARCH] query="${q}" appId=${appId ?? 'global'} → ${scored.length} result(s)`);

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
  const { appId } = req.query;
  const corpus = (appId && AI_SEARCH_CORPORA[appId] && AI_SEARCH_CORPORA[appId].length > 0)
    ? AI_SEARCH_CORPORA[appId]
    : SEARCH_CORPUS;

  res.json({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    appId: appId ?? 'global',
    count: corpus.length,
    corpus: corpus.map(e => ({
      id: e.id, type: e.type, title: e.title,
      description: e.description, keywords: e.keywords,
      icon: e.icon, category: e.category, deepLink: e.deepLink,
    })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI SEARCH CONFIG  (Zone 2 — OCDP operator console)
//
// Stores one AISearchConfig per appId (ios | android | harmonynext | web).
// Rebuilding the corpus:
//   1. If quickAccessSource.mode === 'url' → fetch + parse JSON from the URL
//   2. If quickAccessSource.mode === 'json' → parse inline JSON
//   3. Walk contentSources:
//      - ocdp_page: look up the pageId in the SDUI screen mock data and
//        extract title/description from its slices
//      - aem_url:   synthesize a corpus entry from the URL (mock: parse hostname/path)
//   4. Merge quick-access entries + content entries → store in AI_SEARCH_CORPORA[appId]
// ═══════════════════════════════════════════════════════════════════════════════

/** In-memory store: configId → AISearchConfig payload */
const AI_SEARCH_CONFIGS = {};

/**
 * Per-app search corpus.
 * Keys: 'ios' | 'android' | 'harmonynext' | 'web'
 * Values: array of corpus entries (same shape as SEARCH_CORPUS items).
 * Empty until first rebuild.
 */
const AI_SEARCH_CORPORA = {};

// ─── GET /api/v1/search/config/:configId ─────────────────────────────────────
app.get('/api/v1/search/config/:configId', (req, res) => {
  const cfg = AI_SEARCH_CONFIGS[req.params.configId];
  if (!cfg) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(cfg);
});

// ─── POST /api/v1/search/config/:configId — save/upsert ──────────────────────
app.post('/api/v1/search/config/:configId', (req, res) => {
  const { configId } = req.params;
  const payload = req.body;
  if (!payload || !payload.appId) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'appId is required' });
  }
  AI_SEARCH_CONFIGS[configId] = { ...payload, configId, updatedAt: new Date().toISOString() };
  console.log(`[AI-SEARCH] Config saved: ${configId} (${payload.appId})`);
  res.json(AI_SEARCH_CONFIGS[configId]);
});

// ─── POST /api/v1/search/config/:configId/rebuild — trigger corpus build ──────
app.post('/api/v1/search/config/:configId/rebuild', async (req, res) => {
  // Accept config from request body (OCDP console sends current config) OR
  // fall back to stored config.
  const bodyConfig = req.body && Object.keys(req.body).length > 0 ? req.body : null;
  const storedConfig = AI_SEARCH_CONFIGS[req.params.configId];
  const cfg = bodyConfig ?? storedConfig;

  if (!cfg) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'No config found. POST /api/v1/search/config/:id first.' });
  }

  const { appId, quickAccessSource, contentSources = [] } = cfg;
  const corpusItems = [];

  // ── 1. Quick-access source ────────────────────────────────────────────────
  if (quickAccessSource) {
    let rawItems = [];

    if (quickAccessSource.mode === 'url' && quickAccessSource.url) {
      try {
        const http  = require('http');
        const https = require('https');
        const fetchText = (url) => new Promise((resolve, reject) => {
          const lib = url.startsWith('https') ? https : http;
          lib.get(url, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => resolve(data));
          }).on('error', reject);
        });
        const text = await fetchText(quickAccessSource.url);
        rawItems = JSON.parse(text);
        console.log(`[AI-SEARCH] Fetched ${rawItems.length} quick-access items from ${quickAccessSource.url}`);
      } catch (err) {
        console.warn('[AI-SEARCH] Failed to fetch quick-access URL:', err.message);
      }
    } else if (quickAccessSource.mode === 'json' && quickAccessSource.json) {
      try {
        rawItems = JSON.parse(quickAccessSource.json);
        console.log(`[AI-SEARCH] Parsed ${rawItems.length} quick-access items from inline JSON`);
      } catch (err) {
        console.warn('[AI-SEARCH] Failed to parse inline JSON:', err.message);
      }
    }

    for (const item of rawItems) {
      if (!item.id || !item.title) continue;
      corpusItems.push({
        id:          `qa-${appId}-${item.id}`,
        type:        item.type ?? 'function',
        title:       item.title,
        description: item.description ?? item.title,
        keywords:    item.keywords ?? '',
        icon:        item.icon ?? '⚡',
        category:    item.category ?? 'Quick Access',
        deepLink:    item.deepLink ?? '',
      });
    }
  }

  // ── 2. Content sources ────────────────────────────────────────────────────
  // Mock SDUI screens available as content sources
  const MOCK_SCREEN_CONTENT = {
    'home-wealth-hk': {
      title: 'Wealth Hub HK',
      description: 'HSBC Hong Kong Wealth Hub — investments, funds, structured products, rankings, morning treasure daily savings, bond funds, guaranteed returns',
      keywords: 'wealth,investment,fund,bond,guaranteed,HK,Hong Kong,理財',
      category: 'Product Page',
    },
    'fx-viewpoint-hk': {
      title: 'FX Viewpoint HK',
      description: 'Foreign exchange viewpoint Hong Kong — currency rate analysis, forex commentary, FX deals',
      keywords: 'FX,foreign exchange,forex,currency,rate,HKD,USD,EUR',
      category: 'Market Insight',
    },
    'deposit-campaign-hk': {
      title: 'Deposit Campaign HK',
      description: 'Hong Kong deposit promotion — time deposit, high interest savings, fixed deposit campaign',
      keywords: 'deposit,time deposit,fixed,interest,promotion,campaign,savings',
      category: 'Campaign',
    },
  };

  for (const src of contentSources) {
    if (src.type === 'ocdp_page') {
      const screenData = MOCK_SCREEN_CONTENT[src.ref] ?? {
        title:       src.label || src.ref,
        description: `Content page: ${src.label || src.ref}`,
        keywords:    '',
        category:    'Content Page',
      };
      corpusItems.push({
        id:          `page-${appId}-${src.ref}`,
        type:        'product',
        title:       screenData.title,
        description: screenData.description,
        keywords:    screenData.keywords,
        icon:        '📄',
        category:    screenData.category,
        deepLink:    `hsbc://page/${src.ref}`,
      });
    } else if (src.type === 'aem_url') {
      // Derive a synthetic corpus entry from the AEM URL
      let urlTitle = src.label || src.ref;
      try {
        const u    = new URL(src.ref);
        const slug = u.pathname.split('/').filter(Boolean).pop() ?? 'page';
        urlTitle   = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } catch { /* keep label */ }
      corpusItems.push({
        id:          `aem-${appId}-${Buffer.from(src.ref).toString('hex').slice(0, 12)}`,
        type:        'product',
        title:       urlTitle,
        description: `AEM page: ${src.label || src.ref}`,
        keywords:    urlTitle.toLowerCase(),
        icon:        '🌐',
        category:    'AEM Content',
        deepLink:    src.ref,
      });
    }
  }

  // Deduplicate by id (quick-access wins over content if same id)
  const seen = new Set();
  const deduped = [];
  for (const item of corpusItems) {
    if (!seen.has(item.id)) { seen.add(item.id); deduped.push(item); }
  }

  AI_SEARCH_CORPORA[appId] = deduped;

  // Persist corpus size back to stored config
  if (AI_SEARCH_CONFIGS[req.params.configId]) {
    AI_SEARCH_CONFIGS[req.params.configId].lastRebuiltAt = new Date().toISOString();
    AI_SEARCH_CONFIGS[req.params.configId].corpusSize    = deduped.length;
  }

  const rebuiltAt = new Date().toISOString();
  console.log(`[AI-SEARCH] Corpus rebuilt for ${appId}: ${deduped.length} items`);
  res.json({ appId, corpusSize: deduped.length, rebuiltAt });
});

// ─── Start server ─────────────────────────────────────────────────────────────
// Bind to '::' (IPv6 wildcard) with ipv6Only:false — this accepts BOTH
// IPv4-mapped (0.0.0.0) and native IPv6 (::1) connections on the same socket.
// This fixes iOS Simulator, which resolves 'localhost' to ::1 (IPv6 loopback)
// and gets ECONNREFUSED when the server only listens on 0.0.0.0 (IPv4).

const server = require('http').createServer(app);
server.listen(PORT, '::', { ipv6Only: false }, () => {
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
  console.log('  ║    GET  /api/v1/config                             ║');
  console.log('  ║    GET  /api/v1/screen/home-wealth-hk              ║');
  console.log('  ║    GET  /api/v1/screen/fx-viewpoint-hk             ║');
  console.log('  ║    GET  /api/v1/screen/deposit-campaign-hk         ║');
  console.log('  ║                                                    ║');
  console.log('  ║  Request headers consumed by all endpoints:        ║');
  console.log('  ║    x-locale      — BCP-47 locale override          ║');
  console.log('  ║    x-a11y-flags  — reduceMotion,largeText,…        ║');
  console.log('  ║    x-channel     — SDUI|WEB_STANDARD|WEB_WECHAT   ║');
  console.log('  ╚════════════════════════════════════════════════════╝');
  console.log('');
});
