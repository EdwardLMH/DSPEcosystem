import React, { useState, useCallback, useEffect } from 'react';
import { hive } from '../../tokens/hiveTokens';
import {
  KYCFullNameField, KYCDateOfBirth, KYCNationalitySelect,
  KYCUniqueIdentifier, KYCPhoneField, KYCAddressBlock,
  KYCDocumentCapture, KYCLivenessCapture,
  KYCSourceOfWealth, KYCOpenBankingConsent,
  KYCDeclarationBlock,
} from '../../components/kyc/KYCComponents';

const font = hive.typography.fontFamily.primary;

// ─── Step definitions ─────────────────────────────────────────────────────────

interface KYCStep {
  id: string;
  section: 'CIP' | 'BIOMETRIC' | 'CDD' | 'OPENBANKING' | 'DECLARATION';
  sectionLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  webOnly?: boolean;   // combines with next step on web
  mobileOnly?: boolean;
}

const STEPS: KYCStep[] = [
  // ── CIP ───────────────────────────────────────────────────────────────────
  { id:'name',       section:'CIP', sectionLabel:'Personal Details',
    title:'Full Legal Name', subtitle:'Enter your name exactly as it appears on your official ID', icon:'👤' },
  { id:'dob',        section:'CIP', sectionLabel:'Personal Details',
    title:'Date of Birth & Nationality', subtitle:'Your date of birth and citizenship details', icon:'🎂' },
  { id:'contact',    section:'CIP', sectionLabel:'Personal Details',
    title:'Contact Details', subtitle:'We will use these to communicate with you about your application', icon:'📱' },
  { id:'identifier', section:'CIP', sectionLabel:'Personal Details',
    title:'Government ID Number', subtitle:'Your national identity document number', icon:'🪪' },
  { id:'address',    section:'CIP', sectionLabel:'Personal Details',
    title:'Residential Address', subtitle:'Your current home address — must match your utility bill or eID', icon:'🏠' },

  // ── BIOMETRIC ─────────────────────────────────────────────────────────────
  { id:'document',   section:'BIOMETRIC', sectionLabel:'Identity Verification',
    title:'Upload Identity Document', subtitle:'Take a clear photo of your government-issued ID', icon:'📄' },
  { id:'liveness',   section:'BIOMETRIC', sectionLabel:'Identity Verification',
    title:'Selfie & Liveness Check', subtitle:'Verify you are a real person and match your ID', icon:'😊' },

  // ── CDD ───────────────────────────────────────────────────────────────────
  { id:'wealth',     section:'CDD', sectionLabel:'Due Diligence',
    title:'Employment & Source of Funds', subtitle:'Required by HKMA regulations for account opening', icon:'💼' },

  // ── OPEN BANKING ──────────────────────────────────────────────────────────
  { id:'openbanking',section:'OPENBANKING', sectionLabel:'Open Banking',
    title:'Connect Your Bank Account', subtitle:'Verify account ownership and income via Open Banking', icon:'🏦' },

  // ── DECLARATION ───────────────────────────────────────────────────────────
  { id:'declaration',section:'DECLARATION', sectionLabel:'Declarations',
    title:'Legal Declarations', subtitle:'Please read and confirm the following statements', icon:'✍️' },
];

const SECTIONS = ['CIP','BIOMETRIC','CDD','OPENBANKING','DECLARATION'] as const;
const SECTION_LABELS: Record<string,string> = {
  CIP:'Personal Details', BIOMETRIC:'Identity Verification',
  CDD:'Due Diligence', OPENBANKING:'Open Banking', DECLARATION:'Declarations',
};

// ─── Main KYC Demo Page ───────────────────────────────────────────────────────

export function KYCDemoPage() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [stepIdx, setStepIdx]   = useState(0);
  const [answers, setAnswers]   = useState<Record<string, any>>({});
  const [complete, setComplete] = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const step = STEPS[stepIdx];
  const progress = Math.round(((stepIdx + 1) / STEPS.length) * 100);
  const isFirst  = stepIdx === 0;
  const isLast   = stepIdx === STEPS.length - 1;
  const currentSectionSteps = STEPS.filter(s => s.section === step.section);
  const stepInSection = currentSectionSteps.findIndex(s => s.id === step.id) + 1;

  const onAnswer = useCallback((id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleNext = async () => {
    if (isLast) {
      setSaving(true);
      await new Promise(r => setTimeout(r, 1200)); // simulate submit
      setComplete(true);
    } else {
      setStepIdx(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) { setStepIdx(i => i - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  if (complete) return <CompletionScreen isMobile={isMobile} />;

  return (
    <div style={{ minHeight:'100vh', backgroundColor: hive.color.neutral[50],
      display:'flex', flexDirection:'column', fontFamily: font }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ backgroundColor: hive.color.brand.white, borderBottom:`1px solid ${hive.color.neutral[200]}`,
        boxShadow: hive.shadow.sm, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth: isMobile ? '100%' : '760px', margin:'0 auto',
          padding:`${hive.spacing[3]} ${hive.spacing[4]}`,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <HsbcLogo size={isMobile ? 'sm' : 'md'} />
          {!isMobile && (
            <span style={{ fontSize: hive.typography.fontSize.sm, color: hive.color.neutral[500] }}>
              Open Banking Account Opening
            </span>
          )}
          <button onClick={() => {}} style={{ border:'none', background:'none',
            color: hive.color.neutral[500], cursor:'pointer',
            fontSize: hive.typography.fontSize.sm, fontFamily: font }}>
            Save & Exit
          </button>
        </div>
      </header>

      {/* ── Progress ───────────────────────────────────────────────────── */}
      {isMobile
        ? <MobileProgress step={step} stepInSection={stepInSection}
            totalInSection={currentSectionSteps.length} progress={progress} />
        : <WebStepper steps={STEPS} currentIdx={stepIdx} isMobile={false} />
      }

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main style={{ flex:1, maxWidth: isMobile ? '100%' : '760px',
        margin:'0 auto', width:'100%',
        padding: isMobile
          ? `${hive.spacing[5]} ${hive.spacing[4]} 120px`
          : `${hive.spacing[8]} ${hive.spacing[6]} 120px` }}>

        {/* Step header */}
        <div style={{ marginBottom: hive.spacing[6] }}>
          {isMobile && (
            <SectionBadge label={SECTION_LABELS[step.section]} />
          )}
          <h1 style={{ margin:`${hive.spacing[2]} 0 0`,
            fontSize: isMobile ? hive.typography.fontSize.xl : hive.typography.fontSize['2xl'],
            fontWeight: hive.typography.fontWeight.bold,
            color: hive.color.neutral[900], lineHeight: hive.typography.lineHeight.tight }}>
            {step.icon} {step.title}
          </h1>
          <p style={{ margin:`${hive.spacing[2]} 0 0`,
            fontSize: isMobile ? hive.typography.fontSize.sm : hive.typography.fontSize.base,
            color: hive.color.neutral[500], lineHeight: hive.typography.lineHeight.normal }}>
            {step.subtitle}
          </p>
        </div>

        {/* Step content */}
        <div style={{ backgroundColor: hive.color.brand.white,
          borderRadius: hive.borderRadius.lg, padding: isMobile ? hive.spacing[4] : hive.spacing[8],
          boxShadow: hive.shadow.base, border:`1px solid ${hive.color.neutral[200]}` }}>
          <StepContent stepId={step.id} onAnswer={onAnswer}
            isMobile={isMobile} answers={answers} />
        </div>

        {/* Regulatory badge */}
        <RegulatoryBadge isMobile={isMobile} section={step.section} />
      </main>

      {/* ── Navigation bar ─────────────────────────────────────────────── */}
      <NavBar isMobile={isMobile} isFirst={isFirst} isLast={isLast}
        saving={saving} onBack={handleBack} onNext={handleNext}
        nextLabel={isLast ? 'Submit Application' : 'Continue'} />
    </div>
  );
}

// ─── Step content router ──────────────────────────────────────────────────────

function StepContent({ stepId, onAnswer, isMobile, answers }: {
  stepId: string; onAnswer:(id:string,v:any)=>void; isMobile:boolean; answers:Record<string,any> }) {
  switch (stepId) {
    case 'name':
      return <KYCFullNameField onAnswer={onAnswer} isMobile={isMobile}
        saved={{ firstName: answers.q_first_name, lastName: answers.q_last_name }} />;
    case 'dob':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[6] }}>
          <KYCDateOfBirth onAnswer={onAnswer} saved={answers.q_dob} />
          <KYCNationalitySelect onAnswer={onAnswer} isMobile={isMobile} saved={answers.q_nationality} />
        </div>
      );
    case 'contact':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[5] }}>
          <KYCPhoneField onAnswer={onAnswer} isMobile={isMobile} saved={answers.q_phone} />
          <div>
            <EmailField onAnswer={onAnswer} saved={answers.q_email} />
          </div>
        </div>
      );
    case 'identifier':
      return <KYCUniqueIdentifier onAnswer={onAnswer} isMobile={isMobile} />;
    case 'address':
      return <KYCAddressBlock onAnswer={onAnswer} isMobile={isMobile}
        savedCountry={answers.q_nationality ?? 'HK'} />;
    case 'document':
      return <KYCDocumentCapture onAnswer={onAnswer} isMobile={isMobile} nationality={answers.q_nationality ?? 'HK'} />;
    case 'liveness':
      return <KYCLivenessCapture onAnswer={onAnswer} isMobile={isMobile} />;
    case 'wealth':
      return <KYCSourceOfWealth onAnswer={onAnswer} isMobile={isMobile} />;
    case 'openbanking':
      return <KYCOpenBankingConsent onAnswer={onAnswer} isMobile={isMobile} />;
    case 'declaration':
      return <KYCDeclarationBlock onAnswer={onAnswer} isMobile={isMobile} />;
    default:
      return <div>Unknown step</div>;
  }
}

// ─── Email field (standalone for contact step) ────────────────────────────────

function EmailField({ onAnswer, saved }: { onAnswer:(id:string,v:string)=>void; saved?:string }) {
  const [val, setVal]   = useState(saved ?? '');
  const [err, setErr]   = useState<string|null>(null);
  const [focused, setFocused] = useState(false);

  const validate = (v: string) => {
    if (!v) return 'Email address is required';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(v)) return 'Please enter a valid email address';
    return null;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    height: hive.component.input.height,
    padding: `0 ${hive.spacing[4]}`,
    fontSize: hive.typography.fontSize.base, fontFamily: font,
    border: `1px solid ${err ? hive.component.input.borderColorError
      : focused ? hive.component.input.borderColorFocus : hive.component.input.borderColor}`,
    borderRadius: hive.borderRadius.base,
    backgroundColor: hive.component.input.bgColor,
    outline: 'none',
    boxShadow: focused ? `0 0 0 3px ${hive.color.brand.primaryLight}` : 'none',
  };

  return (
    <div>
      <span style={{ display:'block', fontSize: hive.typography.fontSize.sm,
        fontWeight: hive.typography.fontWeight.semibold,
        color: hive.color.neutral[700], marginBottom: hive.spacing[1] }}>
        Email Address <span style={{ color: hive.color.semantic.error }}>*</span>
      </span>
      <input type="email" value={val} placeholder="name@example.com"
        onChange={e => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const e = validate(val);
          setErr(e);
          if (!e) onAnswer('q_email', val);
        }}
        style={inputStyle} />
      {err && <span style={{ display:'block', fontSize: hive.typography.fontSize.xs,
        color: hive.color.semantic.error, marginTop: hive.spacing[1] }}>{err}</span>}
      <span style={{ display:'block', fontSize: hive.typography.fontSize.xs,
        color: hive.color.neutral[500], marginTop:'2px' }}>
        We'll send your application confirmation and any updates to this address
      </span>
    </div>
  );
}

// ─── Mobile progress bar ──────────────────────────────────────────────────────

function MobileProgress({ step, stepInSection, totalInSection, progress }: {
  step: KYCStep; stepInSection: number; totalInSection: number; progress: number }) {
  return (
    <div style={{ backgroundColor: hive.color.brand.white,
      borderBottom:`1px solid ${hive.color.neutral[200]}`,
      padding:`${hive.spacing[3]} ${hive.spacing[4]}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom: hive.spacing[2] }}>
        <SectionBadge label={SECTION_LABELS[step.section]} />
        <span style={{ fontSize: hive.typography.fontSize.xs, color: hive.color.neutral[500] }}>
          {stepInSection} of {totalInSection}
        </span>
      </div>
      <div style={{ height:'4px', backgroundColor: hive.color.neutral[200],
        borderRadius: hive.borderRadius.full, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${progress}%`,
          backgroundColor: hive.color.brand.primary,
          borderRadius: hive.borderRadius.full,
          transition:`width ${hive.motion.duration.slow} ${hive.motion.easing.standard}` }} />
      </div>
      <div style={{ marginTop:'4px', fontSize: hive.typography.fontSize.xs,
        color: hive.color.neutral[400], textAlign:'right' }}>
        {progress}% complete
      </div>
    </div>
  );
}

// ─── Web section stepper ──────────────────────────────────────────────────────

function WebStepper({ steps, currentIdx, isMobile }: {
  steps: KYCStep[]; currentIdx: number; isMobile: boolean }) {
  // Group by section for the stepper labels
  const sectionOrder = Array.from(new Set(steps.map(s => s.section)));
  const currentSection = steps[currentIdx].section;
  const currentSectionIdx = sectionOrder.indexOf(currentSection);

  return (
    <div style={{ backgroundColor: hive.color.brand.white,
      borderBottom:`1px solid ${hive.color.neutral[200]}` }}>
      <div style={{ maxWidth:'760px', margin:'0 auto',
        padding:`${hive.spacing[4]} ${hive.spacing[6]}`,
        display:'flex', alignItems:'center', gap:0 }}>
        {sectionOrder.map((section, i) => {
          const status = i < currentSectionIdx ? 'done' : i === currentSectionIdx ? 'active' : 'future';
          const isLast = i === sectionOrder.length - 1;
          return (
            <React.Fragment key={section}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:'100px' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: hive.typography.fontSize.xs, fontWeight: hive.typography.fontWeight.bold,
                  backgroundColor:
                    status==='done'   ? hive.color.semantic.success :
                    status==='active' ? hive.color.brand.primary    : hive.color.neutral[200],
                  color: status==='future' ? hive.color.neutral[500] : '#fff',
                  transition:`background-color ${hive.motion.duration.base} ${hive.motion.easing.standard}` }}>
                  {status==='done' ? '✓' : i+1}
                </div>
                <span style={{ marginTop:'4px', fontSize: hive.typography.fontSize.xs,
                  fontFamily: font, textAlign:'center', lineHeight:1.2,
                  color: status==='future' ? hive.color.neutral[400] : hive.color.neutral[700],
                  fontWeight: status==='active' ? hive.typography.fontWeight.semibold : hive.typography.fontWeight.regular }}>
                  {SECTION_LABELS[section]}
                </span>
              </div>
              {!isLast && (
                <div style={{ flex:1, height:'2px', marginBottom:'20px',
                  backgroundColor: status==='done' ? hive.color.semantic.success : hive.color.neutral[200],
                  transition:`background-color ${hive.motion.duration.slow} ${hive.motion.easing.standard}` }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nav bar ──────────────────────────────────────────────────────────────────

function NavBar({ isMobile, isFirst, isLast, saving, onBack, onNext, nextLabel }: {
  isMobile:boolean; isFirst:boolean; isLast:boolean; saving:boolean;
  onBack:()=>void; onNext:()=>void; nextLabel:string; }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0,
      backgroundColor: hive.color.brand.white,
      borderTop:`1px solid ${hive.color.neutral[200]}`,
      boxShadow: hive.shadow.navBar, zIndex:50,
      padding: isMobile ? hive.spacing[4] : `${hive.spacing[4]} ${hive.spacing[8]}` }}>
      <div style={{ maxWidth:'760px', margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap: hive.spacing[3] }}>
        <div style={{ display:'flex', gap: hive.spacing[3] }}>
          {!isFirst && (
            <button onClick={onBack} style={{ height: hive.component.button.heightSm,
              padding:`0 ${hive.component.button.paddingHSm}`,
              border:`1px solid ${hive.color.neutral[300]}`,
              borderRadius: hive.borderRadius.base, background:'none', cursor:'pointer',
              fontSize: hive.typography.fontSize.base, fontFamily: font,
              color: hive.color.neutral[700] }}>
              ← Back
            </button>
          )}
          {!isMobile && (
            <button style={{ border:'none', background:'none', cursor:'pointer',
              color: hive.color.brand.primary, fontFamily: font,
              fontSize: hive.typography.fontSize.sm, textDecoration:'underline' }}>
              Save & Exit
            </button>
          )}
        </div>
        <button onClick={onNext} disabled={saving}
          style={{ height: hive.component.button.height,
            padding:`0 ${isMobile ? hive.spacing[6] : hive.component.button.paddingH}`,
            backgroundColor: saving ? hive.color.neutral[300] : hive.color.brand.primary,
            color: hive.color.brand.white, border:'none',
            borderRadius: hive.component.button.borderRadius,
            fontSize: hive.typography.fontSize.base,
            fontWeight: hive.typography.fontWeight.semibold, fontFamily: font,
            cursor: saving ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap: hive.spacing[2],
            transition:`background-color ${hive.motion.duration.fast} ${hive.motion.easing.standard}` }}>
          {saving && <span style={{ width:'16px', height:'16px', borderRadius:'50%',
            border:`2px solid ${hive.color.neutral[400]}`,
            borderTop:`2px solid #fff`, animation:'spin 0.8s linear infinite', display:'inline-block' }} />}
          {saving ? 'Submitting…' : nextLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ minHeight:'100vh', backgroundColor: hive.color.neutral[50],
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding: hive.spacing[4], fontFamily: font }}>
      <div style={{ maxWidth:'480px', width:'100%', textAlign:'center',
        backgroundColor: hive.color.brand.white,
        borderRadius: hive.borderRadius.xl, padding: hive.spacing[8],
        boxShadow: hive.shadow.lg }}>
        <HsbcLogo size="md" centered />
        <div style={{ fontSize:'64px', margin:`${hive.spacing[6]} 0 ${hive.spacing[4]}` }}>✅</div>
        <h1 style={{ fontSize: hive.typography.fontSize['2xl'],
          fontWeight: hive.typography.fontWeight.bold,
          color: hive.color.semantic.success, margin:`0 0 ${hive.spacing[3]}` }}>
          Application Submitted
        </h1>
        <p style={{ color: hive.color.neutral[600], lineHeight: hive.typography.lineHeight.normal,
          fontSize: hive.typography.fontSize.base, margin:`0 0 ${hive.spacing[2]}` }}>
          Your KYC application has been received. Our team will review your information
          and you will receive a decision within <strong>3 working days</strong>.
        </p>
        <div style={{ backgroundColor: hive.color.neutral[50], borderRadius: hive.borderRadius.md,
          padding: hive.spacing[4], margin:`${hive.spacing[5]} 0`,
          border:`1px solid ${hive.color.neutral[200]}` }}>
          {[
            ['📧', 'Confirmation email sent to your registered address'],
            ['📱', 'SMS notification will confirm your application reference'],
            ['⏱', 'Decision within 3 working days (complex cases up to 5)'],
            ['🔒', 'Your data is encrypted and stored securely per PDPO Cap. 486'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display:'flex', gap: hive.spacing[3], alignItems:'flex-start',
              marginBottom: hive.spacing[3], textAlign:'left' }}>
              <span style={{ fontSize:'18px', flexShrink:0 }}>{icon}</span>
              <span style={{ fontSize: hive.typography.fontSize.sm, color: hive.color.neutral[700] }}>{text}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: hive.typography.fontSize.xs, color: hive.color.neutral[400],
          margin:`0 0 ${hive.spacing[5]}` }}>
          Reference: OBKYC-{Date.now().toString(36).toUpperCase()}
        </p>
        <button onClick={() => window.location.href='/kyc/demo'}
          style={{ width:'100%', height: hive.component.button.height,
            backgroundColor: hive.color.brand.primary, color: hive.color.brand.white,
            border:'none', borderRadius: hive.component.button.borderRadius,
            fontSize: hive.typography.fontSize.base, fontWeight: hive.typography.fontWeight.semibold,
            fontFamily: font, cursor:'pointer' }}>
          Start New Demo Session
        </button>
      </div>
    </div>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
  return (
    <span style={{ display:'inline-block', fontSize: hive.typography.fontSize.xs,
      fontWeight: hive.typography.fontWeight.semibold, fontFamily: font,
      color: hive.color.brand.primary,
      backgroundColor: hive.color.brand.primaryLight,
      borderRadius: hive.borderRadius.full,
      padding:`2px ${hive.spacing[3]}` }}>
      {label}
    </span>
  );
}

function RegulatoryBadge({ isMobile, section }: { isMobile: boolean; section: string }) {
  const labels: Record<string,string> = {
    CIP:         'Required by HKMA Customer Due Diligence Guidelines',
    BIOMETRIC:   'Biometric data processed under PDPO Cap. 486',
    CDD:         'Required under AMLO (Cap. 615) and FATF Recommendation 10',
    OPENBANKING: 'Open Banking regulated by HKMA Open API Framework',
    DECLARATION: 'Your declarations are legally binding under Hong Kong law',
  };
  return (
    <div style={{ marginTop: hive.spacing[4], display:'flex', alignItems:'center',
      gap: hive.spacing[2], justifyContent: isMobile ? 'center' : 'flex-start' }}>
      <span style={{ fontSize:'12px' }}>🔒</span>
      <span style={{ fontSize: hive.typography.fontSize.xs, color: hive.color.neutral[400], fontFamily: font }}>
        {labels[section]}
      </span>
    </div>
  );
}

function HsbcLogo({ size, centered }: { size: 'sm'|'md'; centered?: boolean }) {
  const s = size === 'sm' ? 20 : 28;
  return (
    <div style={{ display:'flex', alignItems:'center', gap: hive.spacing[2],
      justifyContent: centered ? 'center' : 'flex-start' }}>
      <svg width={s*3} height={s} viewBox="0 0 60 20">
        <rect x="0"  y="0"  width="10" height="10" fill="#DB0011"/>
        <rect x="10" y="0"  width="10" height="10" fill="#FFFFFF"/>
        <rect x="0"  y="10" width="10" height="10" fill="#FFFFFF"/>
        <rect x="10" y="10" width="10" height="10" fill="#DB0011"/>
        <text x="26" y="15" fontFamily="Arial" fontWeight="bold"
          fontSize={size==='sm'?'13':'16'} fill="#000000">HSBC</text>
      </svg>
    </div>
  );
}
