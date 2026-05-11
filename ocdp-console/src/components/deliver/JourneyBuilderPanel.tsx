import { useState } from 'react';
import React from 'react';
import { useOCDP, isAdmin } from '../../store/OCDPStore';
import { NewJourneyModal } from './NewJourneyModal';
import { DevicePreview } from '../shared/DevicePreview';
import { AEOAssessmentModal } from './AEOAssessmentModal';
import { calculateAEOScore, shouldShowAEOAssessment } from '../../utils/aeoCalculator';
import { evaluateSliceVisible } from './PageEditorView';
import { LanguageSelector } from './LanguageSelector';
import type { Journey, JourneyStep } from '../../store/mockData';
import type { CanvasSlice, NativeTarget, AEOScore, VisibilityRule, PreviewContext, RuleCondition, RuleOperator, CustomFieldCondition, CustomerSegment, AccountType, CustomerLocation } from '../../types/ocdp';

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:            { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  PENDING_APPROVAL: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  APPROVED:         { bg: '#D1FAE5', color: '#059669', label: 'Approved' },
  REJECTED:         { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  LIVE:             { bg: '#DBEAFE', color: '#1D4ED8', label: 'Live' },
};

const PAGE_TYPES = ['WEALTH_HUB', 'KYC_JOURNEY', 'PRODUCT', 'CAMPAIGN', 'CUSTOM'] as const;
const PAGE_ICONS = ['📄', '🔐', '💰', '📊', '🎯', '📞', '🪪', '🏠', '✅', '⭐', '🌐', '🤳', '💳', '🏦'];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.DRAFT;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: m.bg, color: m.color }}>{m.label}</span>;
}

function actionBtn(bg: string, disabled = false): React.CSSProperties {
  return {
    width: '100%', padding: '10px', background: disabled ? '#F3F4F6' : bg,
    color: disabled ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

// ─── Workflow Timeline ────────────────────────────────────────────────────────

function WorkflowTimeline({ status }: { status: string }) {
  const steps = [
    { key: 'DRAFT',            label: 'Draft',    icon: '✏️' },
    { key: 'PENDING_APPROVAL', label: 'Pending',  icon: '🕐' },
    { key: 'APPROVED',         label: 'Approved', icon: '✓'  },
    { key: 'LIVE',             label: 'Live',     icon: '🚀' },
  ];
  const ORDER = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LIVE'];
  const currentIdx = ORDER.indexOf(status === 'REJECTED' ? 'PENDING_APPROVAL' : status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const isRej  = status === 'REJECTED' && s.key === 'PENDING_APPROVAL';
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                background: isRej ? '#FEE2E2' : done ? '#D1FAE5' : active ? '#DB0011' : '#F3F4F6',
                color: isRej ? '#DC2626' : done ? '#059669' : active ? '#fff' : '#9CA3AF',
                border: active ? '2px solid #DB0011' : '2px solid transparent',
              }}>{isRej ? '✗' : done ? '✓' : s.icon}</div>
              <div style={{ fontSize: 10, fontWeight: active || done ? 700 : 400, color: isRej ? '#DC2626' : active ? '#DB0011' : done ? '#059669' : '#9CA3AF', whiteSpace: 'nowrap' }}>
                {isRej ? 'Rejected' : s.label}
              </div>
            </div>
            {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: done ? '#D1FAE5' : '#F3F4F6', margin: '0 4px', marginBottom: 16 }} />}
          </div>
        );
      })};
    </div>
  );
}

// ─── Add Step Page Form ───────────────────────────────────────────────────────

function AddStepPageForm({ journeyId, stepIndex, journeyChannel, journeyNativeTargets, onCancel }: {
  journeyId: string; stepIndex: number;
  journeyChannel: string; journeyNativeTargets: string[];
  onCancel: () => void;
}) {
  const { dispatch } = useOCDP();
  const [name, setName] = useState('');
  const [pageType, setPageType] = useState<typeof PAGE_TYPES[number]>('CUSTOM');
  const [icon, setIcon] = useState('📄');
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box', background: '#fff' };

  function handleCreate() {
    if (!name.trim()) return;
    dispatch({
      type: 'ADD_JOURNEY_PAGE',
      journeyId,
      stepIndex,
      page: {
        name: name.trim(),
        pageType,
        description: `Step ${stepIndex + 1} page`,
        nativeTargets: journeyNativeTargets as import('../../types/ocdp').NativeTarget[],
        locale: 'en',
        supportedLocales: ['en'],
        translations: {},
        thumbnail: icon,
        tags: [],
        channel: journeyChannel as import('../../types/ocdp').Channel,
        scope: 'MARKET',
        marketId: 'HK',
        releaseMarketIds: ['HK'],
        bizLineId: 'WEALTH',
        groupId: 'HK-WEALTH-AD',
      },
    });
    onCancel();
  }

  return (
    <div style={{ padding: 14, background: '#FFF7F7', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Step Page</div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Page Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Name Input Screen" style={inp} autoFocus />
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Page Type</label>
        <select value={pageType} onChange={e => setPageType(e.target.value as typeof pageType)} style={{ ...inp, cursor: 'pointer' }}>
          {PAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Icon</label>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {PAGE_ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)}
              style={{ width: 30, height: 30, borderRadius: 6, fontSize: 15, border: icon === ic ? '2px solid #DB0011' : '1px solid #E5E7EB', background: icon === ic ? 'rgba(219,0,17,0.06)' : '#fff', cursor: 'pointer' }}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
        <button onClick={handleCreate} disabled={!name.trim()}
          style={{ padding: '6px 14px', background: name.trim() ? '#DB0011' : '#F3F4F6', color: name.trim() ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
          Create & Edit
        </button>
      </div>
    </div>
  );
}

// ─── Journey flow step card ───────────────────────────────────────────────────

function MiniKYCPreview({ slices, thumbnail }: { slices: CanvasSlice[]; thumbnail?: string }) {
  const kycSlice = slices.find(s => s.type.startsWith('KYC_') && s.visible);

  const SCREEN_LABELS: Record<string, { icon: string; color: string; lines: string[] }> = {
    KYC_NAME_DOB:        { icon: '👤', color: '#3B82F6', lines: ['First Name', 'Last Name', 'Date of Birth'] },
    KYC_SINGLE_SELECT:   { icon: '🌍', color: '#8B5CF6', lines: ['Hong Kong (SAR)', 'Mainland China', 'Other countries'] },
    KYC_ID_CAPTURE:      { icon: '🪪', color: '#0F766E', lines: ['HKID Number', 'Expiry Date'] },
    KYC_DOC_UPLOAD:      { icon: '📷', color: '#D97706', lines: ['📄 Front of HKID', '🔄 Back of HKID'] },
    KYC_CONTACT:         { icon: '📞', color: '#059669', lines: ['Email Address', 'Mobile (+852)'] },
    KYC_ADDRESS:         { icon: '🏠', color: '#DC2626', lines: ['Flat / Floor / Block', 'District'] },
    KYC_EMPLOYMENT:      { icon: '💼', color: '#7C3AED', lines: ['Employment Status', 'Annual Income'] },
    KYC_SOURCE_OF_FUNDS: { icon: '🏦', color: '#1D4ED8', lines: ['Source of Funds', 'Account Purpose'] },
    KYC_LIVENESS:        { icon: '😊', color: '#0369A1', lines: ['📷 Face scan in progress…'] },
    KYC_OPEN_BANKING:    { icon: '🔗', color: '#047857', lines: ['HSBC HK', 'Hang Seng', 'Bank of China'] },
    KYC_DECLARATION:     { icon: '✍️', color: '#92400E', lines: ['PEP Status ✓', 'Truthfulness ✓', 'FATCA / CRS'] },
  };

  // Generic phone preview for non-KYC pages
  if (!kycSlice) {
    return (
      <div style={{
        width: 100, flexShrink: 0, background: '#1A1A1A', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)', border: '2px solid #2A2A2A',
      }}>
        <div style={{ background: '#000', height: 8, display: 'flex', alignItems: 'center', padding: '0 6px', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 5, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>9:41</span>
          <span style={{ fontSize: 5, color: 'rgba(255,255,255,0.4)' }}>●● 5G</span>
        </div>
        <div style={{ background: '#DB0011', height: 14, display: 'flex', alignItems: 'center', padding: '0 5px', gap: 3 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, lineHeight: 1 }}>‹</span>
          <span style={{ color: '#fff', fontSize: 6, fontWeight: 800 }}>HSBC</span>
        </div>
        <div style={{ background: '#fff', padding: '10px 8px', minHeight: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontSize: 22 }}>{thumbnail ?? '📄'}</span>
          <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2, width: '70%' }} />
          <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2, width: '50%' }} />
          <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2, width: '60%' }} />
          <div style={{ background: '#DB0011', borderRadius: 4, height: 10, width: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 5, color: '#fff', fontWeight: 700 }}>Continue →</span>
          </div>
        </div>
      </div>
    );
  }

  const cfg = SCREEN_LABELS[kycSlice.type] ?? { icon: '📄', color: '#6B7280', lines: [kycSlice.type] };

  return (
    <div style={{
      width: 100, flexShrink: 0, background: '#1A1A1A', borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)', border: '2px solid #2A2A2A',
    }}>
      {/* Mini status bar */}
      <div style={{ background: '#000', height: 8, display: 'flex', alignItems: 'center', padding: '0 6px', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 5, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>9:41</span>
        <span style={{ fontSize: 5, color: 'rgba(255,255,255,0.4)' }}>●● 5G</span>
      </div>
      {/* App header */}
      <div style={{ background: '#DB0011', height: 14, display: 'flex', alignItems: 'center', padding: '0 5px', gap: 3 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, lineHeight: 1 }}>‹</span>
        <span style={{ color: '#fff', fontSize: 6, fontWeight: 800 }}>HSBC</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 5, marginLeft: 1 }}>KYC</span>
      </div>
      {/* Progress bar */}
      <div style={{ background: '#F3F4F6', height: 2 }}>
        <div style={{ width: '40%', height: '100%', background: '#DB0011' }} />
      </div>
      {/* Screen content */}
      <div style={{ background: '#fff', padding: '6px 6px 8px', minHeight: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <span style={{ fontSize: 12 }}>{cfg.icon}</span>
          <div style={{ flex: 1, height: 4, background: '#1A1A1A', borderRadius: 2, opacity: 0.8 }} />
        </div>
        {cfg.lines.map((line, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <div style={{ height: 3, background: '#E5E7EB', borderRadius: 1, width: '60%', marginBottom: 2 }} />
            <div style={{ height: 8, border: `1px solid ${i === 0 ? cfg.color : '#E5E7EB'}`, borderRadius: 3, background: i === 0 ? `${cfg.color}08` : '#fff', display: 'flex', alignItems: 'center', paddingLeft: 3 }}>
              <span style={{ fontSize: 5, color: i === 0 ? cfg.color : '#9CA3AF' }}>{line}</span>
            </div>
          </div>
        ))}
        {/* CTA button */}
        <div style={{ background: '#DB0011', borderRadius: 4, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 5, color: '#fff', fontWeight: 700 }}>Continue →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step Rule Engine helpers ─────────────────────────────────────────────────

// Evaluate step visibility from a rule the same way slices are evaluated.
// Re-uses evaluateSliceVisible by wrapping the step in a dummy CanvasSlice shape.
function evaluateStepVisible(step: JourneyStep, ctx: PreviewContext | null): boolean {
  if (!step.visibilityRule || !ctx) return true;
  const dummySlice = { instanceId: step.stepId, type: 'KYC_NAME_DOB' as const, props: {}, visible: true, locked: false, visibilityRule: step.visibilityRule };
  return evaluateSliceVisible(dummySlice, ctx);
}

// Metadata for the field picker — mirrors PageEditorView but inline here
const STEP_SEGMENTS: CustomerSegment[] = ['premier', 'jade', 'advance', 'mass'];
const STEP_ACCT_TYPES: AccountType[] = ['wealth_account', 'credit_card', 'current_account', 'savings_account', 'mortgage', 'time_deposit'];
const STEP_LOCATIONS: CustomerLocation[] = ['HK', 'mainland_china', 'macau', 'singapore', 'uk', 'other'];

const STEP_SEG_LABELS: Record<CustomerSegment, string> = { premier: '🏆 Premier', jade: '🟢 Jade', advance: '🔵 Advance', mass: '👤 Mass' };
const STEP_ACCT_LABELS: Record<AccountType, string> = {
  wealth_account: '💰 Wealth', credit_card: '💳 Credit Card', current_account: '🏦 Current',
  savings_account: '🪙 Savings', mortgage: '🏠 Mortgage', time_deposit: '⏳ Time Deposit',
};
const STEP_LOC_LABELS: Record<CustomerLocation, string> = {
  HK: '🇭🇰 HK', mainland_china: '🇨🇳 Mainland', macau: '🇲🇴 Macau',
  singapore: '🇸🇬 SG', uk: '🇬🇧 UK', other: '🌍 Other',
};

const STEP_FIELD_META = {
  customerSegment:  { label: 'Customer Segment',  icon: '👥' },
  accountType:      { label: 'Account Type',      icon: '💳' },
  customerLocation: { label: 'Customer Location', icon: '🌍' },
  custom:           { label: 'Custom Field',      icon: '✏️' },
} as const;
type StepCondField = keyof typeof STEP_FIELD_META;

function stepDefaultValue(field: StepCondField): string {
  if (field === 'customerSegment') return 'premier';
  if (field === 'accountType')     return 'wealth_account';
  if (field === 'customerLocation') return 'HK';
  return '';
}

function stepFieldValueLabel(field: StepCondField, val: string): string {
  if (field === 'customerSegment') return STEP_SEG_LABELS[val as CustomerSegment] ?? val;
  if (field === 'accountType')     return STEP_ACCT_LABELS[val as AccountType] ?? val;
  if (field === 'customerLocation') return STEP_LOC_LABELS[val as CustomerLocation] ?? val;
  return val;
}

// ─── Step Rule Panel ──────────────────────────────────────────────────────────

function StepRulePanel({
  step,
  readOnly,
  onRuleChange,
  previewContext,
}: {
  step: JourneyStep;
  readOnly: boolean;
  onRuleChange: (rule: VisibilityRule | undefined) => void;
  previewContext: PreviewContext | null;
}) {
  const rule = step.visibilityRule;
  const hasRule = !!rule;
  const [condLabel, setCondLabel] = useState(rule?.label ?? '');

  const inp: React.CSSProperties = {
    width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB',
    borderRadius: 6, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };
  const sel: React.CSSProperties = {
    ...inp, appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7280'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 24,
  };
  const secHead: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 };

  function addRule() {
    const r: VisibilityRule = {
      ruleId: `step-rule-${Date.now()}`,
      label: `Show step ${step.label}`,
      conditions: [{ field: 'customerSegment', operator: 'is', value: 'premier' }],
      conditionLogic: 'AND',
      action: 'show',
    };
    setCondLabel(r.label);
    onRuleChange(r);
  }

  function patchRule(patch: Partial<VisibilityRule>) {
    if (!rule) return;
    onRuleChange({ ...rule, ...patch });
  }

  function patchCondition(idx: number, patch: Partial<RuleCondition>) {
    if (!rule) return;
    const conditions = rule.conditions.map((c, i) => i === idx ? { ...c, ...patch } as RuleCondition : c);
    patchRule({ conditions });
  }

  function changeCondField(idx: number, field: StepCondField) {
    if (!rule) return;
    let newCond: RuleCondition;
    if (field === 'custom') {
      newCond = { field: 'custom', customFieldName: '', operator: 'is', value: '' } as CustomFieldCondition;
    } else {
      newCond = { field, operator: 'is', value: stepDefaultValue(field) } as RuleCondition;
    }
    patchRule({ conditions: rule.conditions.map((c, i) => i === idx ? newCond : c) });
  }

  function addCondition() {
    if (!rule) return;
    patchRule({ conditions: [...rule.conditions, { field: 'customerSegment', operator: 'is', value: 'premier' }] });
  }

  function removeCondition(idx: number) {
    if (!rule || rule.conditions.length <= 1) return;
    patchRule({ conditions: rule.conditions.filter((_, i) => i !== idx) });
  }

  // Live preview result
  const previewVisible = previewContext ? evaluateStepVisible(step, previewContext) : null;

  return (
    <div style={{ marginTop: 10, padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>🎯 Step Visibility Rule</div>

      {/* Preview result badge */}
      {previewContext && (
        <div style={{
          marginBottom: 8, padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: previewVisible ? '#D1FAE5' : '#FEE2E2',
          color: previewVisible ? '#059669' : '#DC2626',
          border: `1px solid ${previewVisible ? '#A7F3D0' : '#FECACA'}`,
        }}>
          {previewVisible ? '👁 Visible in preview' : '🚫 Hidden in preview'}
        </div>
      )}

      {!hasRule ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 8 }}>No rule — step always shown</div>
          {!readOnly && (
            <button onClick={addRule} style={{ padding: '6px 14px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              + Add Rule
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Rule label */}
          <div>
            <div style={secHead}>Rule Name</div>
            {readOnly
              ? <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{rule.label}</div>
              : <input value={condLabel} onChange={e => { setCondLabel(e.target.value); patchRule({ label: e.target.value }); }} style={inp} placeholder="Rule description..." />
            }
          </div>

          {/* Action */}
          <div>
            <div style={secHead}>Action</div>
            {readOnly ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: rule.action === 'show' ? '#059669' : '#DC2626' }}>
                {rule.action === 'show' ? '👁 Show' : '🚫 Hide'} this step when conditions are met
              </span>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                {(['show', 'hide'] as const).map(a => (
                  <button key={a} onClick={() => patchRule({ action: a })} style={{
                    flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 11,
                    border: `2px solid ${rule.action === a ? (a === 'show' ? '#059669' : '#DC2626') : '#E5E7EB'}`,
                    background: rule.action === a ? (a === 'show' ? '#D1FAE5' : '#FEE2E2') : '#fff',
                    color: rule.action === a ? (a === 'show' ? '#059669' : '#DC2626') : '#6B7280',
                  }}>
                    {a === 'show' ? '👁 Show' : '🚫 Hide'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div>
            <div style={secHead}>Conditions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {rule.conditions.map((cond, idx) => {
                const fieldKey = cond.field as StepCondField;
                return (
                  <div key={idx}>
                    {idx > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                        {readOnly ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', padding: '1px 8px', background: '#F3F4F6', borderRadius: 4 }}>{rule.conditionLogic}</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 2 }}>
                            {(['AND', 'OR'] as const).map(logic => (
                              <button key={logic} onClick={() => patchRule({ conditionLogic: logic })} style={{
                                padding: '1px 8px', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
                                border: `1px solid ${rule.conditionLogic === logic ? '#6366F1' : '#E5E7EB'}`,
                                background: rule.conditionLogic === logic ? '#EEF2FF' : '#fff',
                                color: rule.conditionLogic === logic ? '#4338CA' : '#9CA3AF',
                              }}>{logic}</button>
                            ))}
                          </div>
                        )}
                        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                      </div>
                    )}

                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, padding: '7px 9px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>{idx === 0 ? 'IF' : rule.conditionLogic}</span>
                        {!readOnly && rule.conditions.length > 1 && (
                          <button onClick={() => removeCondition(idx)} style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
                        )}
                      </div>

                      {readOnly ? (
                        <div style={{ fontSize: 11, color: '#374151' }}>
                          {fieldKey === 'custom' ? (
                            <><span style={{ fontWeight: 600 }}>✏️ {(cond as CustomFieldCondition).customFieldName}</span>{' '}{(cond as CustomFieldCondition).operator === 'is' ? '=' : (cond as CustomFieldCondition).operator === 'is_not' ? '≠' : (cond as CustomFieldCondition).operator}{' '}<strong>"{(cond as CustomFieldCondition).value}"</strong></>
                          ) : (
                            <><span style={{ fontWeight: 600 }}>{STEP_FIELD_META[fieldKey].icon} {STEP_FIELD_META[fieldKey].label}</span>{' '}{cond.operator === 'is' ? 'is' : 'is not'}{' '}<strong>{stepFieldValueLabel(fieldKey, String((cond as { value: unknown }).value))}</strong></>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {/* Field picker */}
                          <select value={fieldKey} onChange={e => changeCondField(idx, e.target.value as StepCondField)} style={sel}>
                            {(Object.keys(STEP_FIELD_META) as StepCondField[]).map(f => (
                              <option key={f} value={f}>{STEP_FIELD_META[f].icon} {STEP_FIELD_META[f].label}</option>
                            ))}
                          </select>

                          {fieldKey === 'custom' ? (
                            <>
                              <input value={(cond as CustomFieldCondition).customFieldName} onChange={e => patchCondition(idx, { customFieldName: e.target.value } as Partial<CustomFieldCondition>)} placeholder="Field name (e.g. request.body.flag)" style={{ ...inp, fontFamily: 'monospace', fontSize: 10 }} />
                              <select value={(cond as CustomFieldCondition).operator} onChange={e => patchCondition(idx, { operator: e.target.value as RuleOperator } as Partial<CustomFieldCondition>)} style={sel}>
                                <option value="is">is</option>
                                <option value="is_not">is not</option>
                                <option value="in">in (comma-separated)</option>
                                <option value="not_in">not in (comma-separated)</option>
                              </select>
                              <input value={(cond as CustomFieldCondition).value} onChange={e => patchCondition(idx, { value: e.target.value } as Partial<CustomFieldCondition>)} placeholder="Value to compare" style={inp} />
                            </>
                          ) : (
                            <>
                              <select value={cond.operator} onChange={e => patchCondition(idx, { operator: e.target.value as RuleOperator })} style={sel}>
                                <option value="is">is</option>
                                <option value="is_not">is not</option>
                              </select>
                              <select value={String((cond as { value: unknown }).value)} onChange={e => patchCondition(idx, { value: e.target.value } as Partial<RuleCondition>)} style={sel}>
                                {(fieldKey === 'customerSegment' ? STEP_SEGMENTS : fieldKey === 'accountType' ? STEP_ACCT_TYPES : STEP_LOCATIONS).map(v => (
                                  <option key={v} value={v}>{stepFieldValueLabel(fieldKey, v)}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <button onClick={addCondition} style={{ marginTop: 5, fontSize: 10, color: '#6B7280', background: 'none', border: '1px dashed #D1D5DB', borderRadius: 6, cursor: 'pointer', padding: '3px 10px', width: '100%' }}>
                + Add condition
              </button>
            )}
          </div>

          {/* Remove rule */}
          {!readOnly && (
            <button onClick={() => onRuleChange(undefined)} style={{ padding: '6px', background: '#FFF', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              🗑 Remove Rule
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StepCard({
  stepPage, index, total, journeyId, journeyStatus, stepDescription, onRemove, step, previewContext, onStepRuleChange,
}: {
  stepPage: { pageId: string; name: string; thumbnail: string; authoringStatus: string; slices: CanvasSlice[] } | null;
  index: number; total: number; journeyId: string; journeyStatus: string;
  stepDescription?: string;
  onRemove?: () => void;
  step?: JourneyStep;
  previewContext?: PreviewContext | null;
  onStepRuleChange?: (rule: VisibilityRule | undefined) => void;
}) {
  const { dispatch } = useOCDP();
  const isLast = index === total - 1;
  const [showRulePanel, setShowRulePanel] = useState(false);

  const stepHidden = step && previewContext ? !evaluateStepVisible(step, previewContext) : false;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, opacity: stepHidden ? 0.35 : 1, transition: 'opacity 0.15s' }}>
      {/* Step indicator + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 15,
          background: stepHidden ? '#9CA3AF' : 'var(--hsbc-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>{index + 1}</div>
        {!isLast && <div style={{ width: 2, flex: 1, background: '#E5E7EB', marginTop: 4, minHeight: 20 }} />}
      </div>

      {/* Card */}
      <div style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 0 : 14 }}>
        {stepPage ? (
          <div style={{ background: 'var(--surface-panel)', border: `1px solid ${stepHidden ? '#FECACA' : 'var(--border-light)'}`, borderRadius: 10, padding: '10px 14px' }}>
            {stepHidden && (
              <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>🚫 Hidden by rule in current preview</div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Mini phone preview */}
              <MiniKYCPreview slices={stepPage.slices} thumbnail={stepPage.thumbnail} />

              {/* Text info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stepPage.name}</div>
                    {stepDescription && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{stepDescription}</div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusBadge status={stepPage.authoringStatus} />
                      {step?.visibilityRule && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 4, padding: '1px 6px' }}>
                          🎯 {step.visibilityRule.action === 'show' ? 'Show' : 'Hide'} rule
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                    {/* Rule toggle */}
                    {step && onStepRuleChange && (
                      <button
                        onClick={() => setShowRulePanel(v => !v)}
                        style={{ padding: '4px 8px', background: showRulePanel ? '#EEF2FF' : '#F9FAFB', color: showRulePanel ? '#4338CA' : '#6B7280', border: `1px solid ${showRulePanel ? '#C7D2FE' : '#E5E7EB'}`, borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🎯 Rules
                      </button>
                    )}
                    {journeyStatus === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => dispatch({ type: 'OPEN_PAGE_EDITOR', pageId: stepPage.pageId, returnView: 'journeys', journeyId })}
                          style={{ padding: '4px 10px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        {onRemove && (
                          <button onClick={onRemove} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #FECACA', borderRadius: 5, fontSize: 11, color: '#DC2626', cursor: 'pointer' }}>×</button>
                        )}
                      </>
                    )}
                    {journeyStatus !== 'DRAFT' && (
                      <button
                        onClick={() => dispatch({ type: 'OPEN_PAGE_EDITOR', pageId: stepPage.pageId, returnView: 'journeys', journeyId, readOnly: true })}
                        style={{ padding: '4px 10px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        👁 View
                      </button>
                    )}
                  </div>
                </div>

                {/* Step rule panel */}
                {step && onStepRuleChange && showRulePanel && (
                  <StepRulePanel
                    step={step}
                    readOnly={journeyStatus !== 'DRAFT'}
                    onRuleChange={onStepRuleChange}
                    previewContext={previewContext ?? null}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-panel)', border: '2px dashed var(--border-mid)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <span>Step {index + 1} (no page linked)</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Journey Detail ───────────────────────────────────────────────────────────

function JourneyDetail({ journey }: { journey: Journey }) {
  const { state, dispatch } = useOCDP();
  const { currentUser, releaseTargets, journeyPages } = state;
  const [comment, setComment]       = useState('');
  const [activeTab, setActiveTab]   = useState<'steps' | 'meta' | 'approval' | 'preview'>('steps');
  const [addingStep, setAddingStep] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [showAEOModal, setShowAEOModal] = useState(false);
  const [aeoScore, setAeoScore] = useState<AEOScore | null>(null);

  // Step rule preview context (journey-level, independent of page editor context)
  const [stepPreviewCtx, setStepPreviewCtx] = useState<PreviewContext | null>(null);
  const [stepPreviewOpen, setStepPreviewOpen] = useState(false);

  // Multi-language
  const primaryLocale = (journey.supportedLocales ?? ['en'])[0];
  const [activeJourneyLocale, setActiveJourneyLocale] = useState(primaryLocale);

  // Meta editing state
  const [editName, setEditName]   = useState(journey.name);
  const [editDesc, setEditDesc]   = useState(journey.description ?? '');
  const [editNativeTargets, setEditNativeTargets] = useState<NativeTarget[]>(journey.nativeTargets ?? []);
  const [metaDirty, setMetaDirty] = useState(false);

  const isApprover = currentUser.role.endsWith('-APPROVER') || isAdmin(currentUser.role);
  const isAuthor   = currentUser.role.endsWith('-AUTHOR')   || isAdmin(currentUser.role);
  const status     = journey.status;

  // Journey-owned pages sorted by stepIndex
  const myPages = journeyPages
    .filter(jp => jp.journeyId === journey.journeyId)
    .sort((a, b) => a.stepIndex - b.stepIndex);

  // Journey preview: which step page is currently shown
  const [previewStep, setPreviewStep] = useState(0);
  const previewPage = myPages[previewStep]?.page;

  function toggleTarget(id: string) {
    setSelectedTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Handle submission with AEO assessment for Web Standard public journeys
  function handleSubmit() {
    if (selectedTargets.length === 0) return;

    // AEO applies to: Web Standard public journeys, or SDUI journeys with web target + public
    const journeyIsPublicWeb =
      (journey.channel === 'WEB_STANDARD' && journey.isPublic !== false) ||
      (journey.channel === 'SDUI' && journey.nativeTargets.includes('web') && journey.isPublic === true);
    const hasWebStandardPage = journeyIsPublicWeb && myPages.some(jp => shouldShowAEOAssessment(jp.page));

    if (hasWebStandardPage) {
      // Calculate AEO score for the first Web Standard page
      const webPage = myPages.find(jp => shouldShowAEOAssessment(jp.page))?.page;
      if (webPage) {
        const targetId = selectedTargets[0];
        const score = calculateAEOScore(webPage, targetId);
        setAeoScore(score);
        setShowAEOModal(true);
      }
    } else {
      // Direct submission for non-Web Standard or private journeys
      dispatch({ type: 'SUBMIT_JOURNEY', journeyId: journey.journeyId, targetIds: selectedTargets, comment });
    }
  }

  function handleAEOProceed() {
    setShowAEOModal(false);
    // Save the AEO score to store
    if (aeoScore) {
      dispatch({ type: 'SAVE_AEO_SCORE', score: aeoScore });
    }
    // Proceed with submission
    dispatch({ type: 'SUBMIT_JOURNEY', journeyId: journey.journeyId, targetIds: selectedTargets, comment });
  }

  function handleAEOCancel() {
    setShowAEOModal(false);
    setAeoScore(null);
  }

  function saveMeta() {
    const updates: { name: string; description: string; nativeTargets?: NativeTarget[] } = {
      name: editName.trim() || journey.name,
      description: editDesc,
    };
    if (journey.channel === 'SDUI') updates.nativeTargets = editNativeTargets;
    dispatch({ type: 'EDIT_JOURNEY', journeyId: journey.journeyId, updates });
    setMetaDirty(false);
  }

  function toggleEditNative(t: NativeTarget) {
    setEditNativeTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setMetaDirty(true);
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{journey.name}</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{journey.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: journey.channel === 'WEB_STANDARD' ? 'rgba(29,78,216,0.1)' : journey.channel === 'WEB_WECHAT' ? 'rgba(7,193,96,0.1)' : 'rgba(15,48,87,0.1)',
              color:      journey.channel === 'WEB_STANDARD' ? '#1D4ED8'             : journey.channel === 'WEB_WECHAT' ? '#07C160'             : '#0F3057',
            }}>
              {journey.channel === 'WEB_STANDARD' ? '🌐 Web Standard' : journey.channel === 'WEB_WECHAT' ? '💬 WeChat' : '📱 SDUI'}
            </span>
            {(journey.channel === 'WEB_STANDARD' || (journey.channel === 'SDUI' && journey.nativeTargets.includes('web'))) && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
                background: journey.isPublic === true ? '#D1FAE5' : '#F3F4F6',
                color:      journey.isPublic === true ? '#059669' : '#6B7280',
                border:     `1px solid ${journey.isPublic === true ? '#A7F3D0' : '#D1D5DB'}`,
              }}>
                {journey.isPublic === true ? '🌐 Public' : '🔒 Private'}
              </span>
            )}
            <StatusBadge status={status} />
          </div>
        </div>
        <WorkflowTimeline status={status} />
        {/* Tabs */}
        <div role="tablist" aria-label="Journey detail tabs" style={{ display: 'flex', gap: 0, marginTop: 14, borderBottom: '1px solid var(--border-light)' }}>
          {(['steps', 'meta', 'approval', 'preview'] as const).map(tab => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 16px', fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#DB0011' : 'var(--text-muted)',
              background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #DB0011' : '2px solid transparent',
              cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {tab === 'steps'    ? `Pages (${myPages.length})` :
               tab === 'meta'     ? 'Info & Edit' :
               tab === 'approval' ? 'Approval' :
               'Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {activeTab === 'steps' && (
          <div style={{ maxWidth: 620 }}>
            {/* Info callout + step preview context toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
              <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 11, color: '#1E40AF', lineHeight: 1.5, flex: 1 }}>
                Each step is a full page. Click <strong>Edit</strong> to open the page editor for that step. Click <strong>🎯 Rules</strong> on a step to set step-level visibility rules.
              </div>
              {/* Step-level preview context mini picker */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setStepPreviewOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    border: stepPreviewCtx ? '2px solid #6366F1' : '1px solid #D1D5DB',
                    background: stepPreviewCtx ? '#EEF2FF' : '#fff',
                    color: stepPreviewCtx ? '#4338CA' : '#6B7280',
                  }}
                >
                  👤 {stepPreviewCtx ? 'Preview On ●' : 'Step Preview ○'}
                </button>
                {stepPreviewOpen && (
                  <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 200, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', padding: 14, width: 240 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 10 }}>🎯 Simulate for Step Rules</div>
                    {/* Segment */}
                    <div style={{ marginBottom: 7 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>👥 Customer Segment</label>
                      <select
                        value={stepPreviewCtx?.customerSegment ?? 'premier'}
                        onChange={e => setStepPreviewCtx(c => ({ ...(c ?? { customerSegment: 'premier', accountType: 'wealth_account', customerLocation: 'HK', customFields: {} }), customerSegment: e.target.value as CustomerSegment }))}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 11, outline: 'none' }}
                      >
                        {STEP_SEGMENTS.map(s => <option key={s} value={s}>{STEP_SEG_LABELS[s]}</option>)}
                      </select>
                    </div>
                    {/* Account type */}
                    <div style={{ marginBottom: 7 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>💳 Account Type</label>
                      <select
                        value={stepPreviewCtx?.accountType ?? 'wealth_account'}
                        onChange={e => setStepPreviewCtx(c => ({ ...(c ?? { customerSegment: 'premier', accountType: 'wealth_account', customerLocation: 'HK', customFields: {} }), accountType: e.target.value as AccountType }))}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 11, outline: 'none' }}
                      >
                        {STEP_ACCT_TYPES.map(a => <option key={a} value={a}>{STEP_ACCT_LABELS[a]}</option>)}
                      </select>
                    </div>
                    {/* Location */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>🌍 Location</label>
                      <select
                        value={stepPreviewCtx?.customerLocation ?? 'HK'}
                        onChange={e => setStepPreviewCtx(c => ({ ...(c ?? { customerSegment: 'premier', accountType: 'wealth_account', customerLocation: 'HK', customFields: {} }), customerLocation: e.target.value as CustomerLocation }))}
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 11, outline: 'none' }}
                      >
                        {STEP_LOCATIONS.map(l => <option key={l} value={l}>{STEP_LOC_LABELS[l]}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!stepPreviewCtx ? (
                        <button onClick={() => { setStepPreviewCtx({ customerSegment: 'premier', accountType: 'wealth_account', customerLocation: 'HK', customFields: {} }); setStepPreviewOpen(false); }}
                          style={{ flex: 1, padding: '6px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Apply
                        </button>
                      ) : (
                        <button onClick={() => { setStepPreviewCtx(null); setStepPreviewOpen(false); }}
                          style={{ flex: 1, padding: '6px', background: '#FFF', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Clear Preview
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step visibility summary when preview is active */}
            {stepPreviewCtx && journey.steps.some(s => s.visibilityRule) && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, fontSize: 10, color: '#5B21B6' }}>
                {journey.steps.filter(s => !evaluateStepVisible(s, stepPreviewCtx)).length} step(s) hidden · {journey.steps.filter(s => evaluateStepVisible(s, stepPreviewCtx)).length} visible
              </div>
            )}

            {myPages.length === 0 && !addingStep && (
              <div style={{ textAlign: 'center', padding: 32, background: 'var(--surface-panel)', borderRadius: 12, color: 'var(--text-muted)', marginBottom: 16, border: '2px dashed var(--border-mid)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No steps yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Add pages to define the journey flow</div>
              </div>
            )}

            {myPages.map((jp, i) => (
              <StepCard
                key={jp.page.pageId}
                stepPage={{ pageId: jp.page.pageId, name: jp.page.name, thumbnail: jp.page.thumbnail ?? '📄', authoringStatus: jp.page.authoringStatus, slices: jp.page.slices }}
                index={i}
                total={myPages.length}
                journeyId={journey.journeyId}
                journeyStatus={status}
                stepDescription={journey.steps[i]?.description}
                onRemove={status === 'DRAFT' ? () => dispatch({ type: 'REMOVE_JOURNEY_PAGE', pageId: jp.page.pageId }) : undefined}
                step={journey.steps[i]}
                previewContext={stepPreviewCtx}
                onStepRuleChange={journey.steps[i] ? (rule) => dispatch({ type: 'SET_STEP_RULE', journeyId: journey.journeyId, stepId: journey.steps[i].stepId, rule }) : undefined}
              />
            ))}

            {addingStep ? (
              <AddStepPageForm
                journeyId={journey.journeyId}
                stepIndex={myPages.length}
                journeyChannel={journey.channel}
                journeyNativeTargets={journey.nativeTargets}
                onCancel={() => setAddingStep(false)}
              />
            ) : status === 'DRAFT' ? (
              <button onClick={() => setAddingStep(true)} style={{ marginTop: 12, padding: '10px 20px', background: 'transparent', color: 'var(--text-muted)', border: '2px dashed var(--border-mid)', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                + Add Step
              </button>
            ) : null}
          </div>
        )}

        {activeTab === 'meta' && (
          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Language management */}
            <div style={{ padding: 16, background: '#F0F4FF', borderRadius: 12, border: '1px solid #C7D2FE', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Languages</div>
              <LanguageSelector
                primaryLocale={primaryLocale}
                supportedLocales={journey.supportedLocales ?? [primaryLocale]}
                activeLocale={activeJourneyLocale}
                onSelectLocale={l => setActiveJourneyLocale(l)}
                onAddLocale={locale => {
                  const current = journey.supportedLocales ?? [primaryLocale];
                  dispatch({ type: 'SET_JOURNEY_LOCALES', journeyId: journey.journeyId, locales: [...current, locale] });
                  setActiveJourneyLocale(locale);
                }}
                onRemoveLocale={locale => {
                  const current = journey.supportedLocales ?? [primaryLocale];
                  dispatch({ type: 'SET_JOURNEY_LOCALES', journeyId: journey.journeyId, locales: current.filter(l => l !== locale) });
                  if (activeJourneyLocale === locale) setActiveJourneyLocale(primaryLocale);
                }}
                disabled={status !== 'DRAFT' && status !== 'REJECTED'}
              />
              {activeJourneyLocale !== primaryLocale && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#6366F1', flex: 1 }}>Editing {activeJourneyLocale} — changes are saved as translations</p>
                  {(status === 'DRAFT' || status === 'REJECTED') && (
                    <button
                      onClick={() => dispatch({ type: 'TRANSLATE_JOURNEY', journeyId: journey.journeyId, locale: activeJourneyLocale })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', background: '#DB0011', color: '#fff',
                        border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-family)',
                      }}
                    >
                      🌐 Translate
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Journey info fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Journey Information</div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }} htmlFor="journey-name-input">Journey Name</label>
                <input
                  id="journey-name-input"
                  value={activeJourneyLocale !== primaryLocale
                    ? (journey.translations?.[activeJourneyLocale]?.name ?? editName)
                    : editName}
                  onChange={e => {
                    if (activeJourneyLocale !== primaryLocale) {
                      dispatch({ type: 'SET_JOURNEY_TRANSLATION', journeyId: journey.journeyId, locale: activeJourneyLocale, field: 'name', value: e.target.value });
                    } else {
                      setEditName(e.target.value); setMetaDirty(true);
                    }
                  }}
                  style={inp}
                  disabled={status !== 'DRAFT' && status !== 'REJECTED'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }} htmlFor="journey-desc-input">Description</label>
                <textarea
                  id="journey-desc-input"
                  value={activeJourneyLocale !== primaryLocale
                    ? (journey.translations?.[activeJourneyLocale]?.description ?? editDesc)
                    : editDesc}
                  onChange={e => {
                    if (activeJourneyLocale !== primaryLocale) {
                      dispatch({ type: 'SET_JOURNEY_TRANSLATION', journeyId: journey.journeyId, locale: activeJourneyLocale, field: 'description', value: e.target.value });
                    } else {
                      setEditDesc(e.target.value); setMetaDirty(true);
                    }
                  }}
                  rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                  disabled={status !== 'DRAFT' && status !== 'REJECTED'}
                />
              </div>

              {journey.channel === 'SDUI' && (
                <div style={{ padding: 12, background: '#FFF7F0', border: '1px solid #FDDCB5', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Native Client Targets
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([
                      { value: 'ios' as NativeTarget,         label: 'iOS',        icon: '🍎' },
                      { value: 'android' as NativeTarget,     label: 'Android',    icon: '🤖' },
                      { value: 'harmonynext' as NativeTarget, label: 'HarmonyNext', icon: '🌸' },
                      { value: 'web' as NativeTarget,         label: 'Web',        icon: '🌐' },
                    ]).map(t => {
                      const on = editNativeTargets.includes(t.value);
                      const canEdit = status === 'DRAFT' || status === 'REJECTED';
                      return (
                        <button key={t.value} onClick={() => canEdit && toggleEditNative(t.value)} style={{
                          flex: 1, padding: '8px 6px', borderRadius: 8, cursor: canEdit ? 'pointer' : 'not-allowed',
                          textAlign: 'center', opacity: canEdit ? 1 : 0.7,
                          border: on ? '2px solid #D97706' : '2px solid #E5E7EB',
                          background: on ? '#FEF3C7' : '#fff', transition: 'all 0.12s',
                        }}>
                          <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: on ? '#92400E' : '#6B7280' }}>{t.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {metaDirty && (status === 'DRAFT' || status === 'REJECTED') && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditName(journey.name); setEditDesc(journey.description ?? ''); setEditNativeTargets(journey.nativeTargets ?? []); setMetaDirty(false); }}
                    style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>
                    Discard
                  </button>
                  <button onClick={saveMeta}
                    style={{ flex: 2, padding: '8px', fontSize: 12, fontWeight: 700, background: '#DB0011', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Read-only metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Metadata</div>
              {[
                { label: 'Journey ID', value: journey.journeyId, mono: true },
                { label: 'Market', value: journey.marketId },
                { label: 'Business Line', value: journey.bizLineId },
                { label: 'Status', value: status },
                { label: 'Steps', value: `${myPages.length} page${myPages.length !== 1 ? 's' : ''}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111', textAlign: 'right', fontFamily: row.mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Open page editor for first step */}
            {myPages.length > 0 && (
              <div style={{ padding: '12px 14px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 11, color: '#92400E' }}>
                ✏️ To edit page content, go to the <strong>Pages</strong> tab and click <strong>Edit</strong> on a step.
              </div>
            )}

            {/* Revert to Draft — only shown when journey is not DRAFT */}
            {status !== 'DRAFT' && isAuthor && (
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Danger Zone</div>
                <button
                  onClick={() => {
                    if (window.confirm(`Revert "${journey.name}" to Draft? This will allow editing but clear the current approval status.`)) {
                      dispatch({ type: 'REVERT_JOURNEY_TO_DRAFT', journeyId: journey.journeyId });
                    }
                  }}
                  style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 700, background: 'rgba(220,38,38,0.06)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, cursor: 'pointer' }}
                >
                  ↩ Revert to Draft
                </button>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
                  Current status: <strong>{status}</strong> — reverting will reset to Draft
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'approval' && (
          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {status === 'DRAFT' || status === 'REJECTED' ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'block' }}>Release Targets</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: '#F9FAFB', borderRadius: 10 }}>
                  {releaseTargets.map(rt => (
                    <label key={rt.targetId} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={selectedTargets.includes(rt.targetId)} onChange={() => toggleTarget(rt.targetId)}
                        style={{ width: 14, height: 14, accentColor: '#DB0011', cursor: 'pointer' }} />
                      <span style={{ fontWeight: 600, color: '#111' }}>{rt.targetId}</span>
                      <span style={{ color: '#6B7280', fontSize: 12 }}>{rt.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {/* QR Code for SDUI journeys during approval/approved */}
            {journey.channel === 'SDUI' && (status === 'PENDING_APPROVAL' || status === 'APPROVED') && (
              <div style={{ padding: '14px 16px', background: '#FFF7F0', border: '1px solid #FDDCB5', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>📱 Native App Testing</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 100, height: 100, background: '#fff', borderRadius: 8,
                    border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                        const isCorner = (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3);
                        const fill = isCorner || ((r + c) % 3 === 0) ? '#1A1A1A' : '#fff';
                        return <rect key={`${r}-${c}`} x={c * 14 + 2} y={r * 14 + 2} width={12} height={12} rx={1} fill={fill} />;
                      }))}
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5, marginBottom: 6 }}>
                      Scan with the HSBC testing app to preview this journey on your device.
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6B7280', background: '#F3F4F6', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>
                      dsp://journey/{journey.journeyId}
                    </div>
                    {journey.nativeTargets && journey.nativeTargets.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {journey.nativeTargets.map(t => (
                          <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E' }}>
                            {t === 'ios' ? '🍎' : t === 'android' ? '🤖' : t === 'harmonynext' ? '🌸' : '🌐'} {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Comment</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Add a note..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Author: Submit (DRAFT / REJECTED) */}
              {(status === 'DRAFT' || status === 'REJECTED') && isAuthor && (
                <button onClick={handleSubmit}
                  style={actionBtn('#DB0011', selectedTargets.length === 0)}>
                  {selectedTargets.length === 0 ? '📤 Select targets to submit' : `📤 Submit for Approval (${selectedTargets.join(', ')})`}
                </button>
              )}

              {/* Author: Withdraw from approval */}
              {status === 'PENDING_APPROVAL' && isAuthor && (
                <button onClick={() => dispatch({ type: 'WITHDRAW_JOURNEY', journeyId: journey.journeyId })}
                  style={actionBtn('#6B7280')}>
                  ↩ Withdraw to Draft
                </button>
              )}

              {/* Approver: Approve / Reject */}
              {status === 'PENDING_APPROVAL' && isApprover && (
                <>
                  <button onClick={() => dispatch({ type: 'APPROVE_JOURNEY', journeyId: journey.journeyId, comment })} style={actionBtn('#059669')}>✓ Approve Journey</button>
                  <button onClick={() => dispatch({ type: 'REJECT_JOURNEY',  journeyId: journey.journeyId, comment })} style={actionBtn('#DC2626')}>✗ Reject Journey</button>
                </>
              )}

              {/* Publish — available to approver and author */}
              {status === 'APPROVED' && (isApprover || isAuthor) && (
                <button onClick={() => dispatch({ type: 'PUBLISH_JOURNEY', journeyId: journey.journeyId })} style={actionBtn('#1D4ED8')}>🚀 Publish Journey to LIVE</button>
              )}

              {/* Author controls for LIVE journeys */}
              {status === 'LIVE' && isAuthor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Journey Actions</div>
                  <button onClick={() => { if (window.confirm(`Take down "${journey.name}" from live and revert to Draft?`)) dispatch({ type: 'TAKEDOWN_JOURNEY', journeyId: journey.journeyId }); }}
                    style={actionBtn('#DC2626')}>
                    ⬇ Take Down & Send to Draft
                  </button>
                  <button onClick={() => dispatch({ type: 'DRAFT_NEW_JOURNEY_VERSION', journeyId: journey.journeyId })}
                    style={actionBtn('#2563EB')}>
                    📝 Draft A New Version
                  </button>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                    "Draft A New Version" keeps the current journey live. The new draft replaces it once approved and published.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myPages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No steps to preview</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Add step pages in the Pages tab</div>
              </div>
            ) : (
              <>
                {/* Step selector */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Step</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {myPages.map((jp, i) => (
                      <button key={jp.page.pageId} onClick={() => setPreviewStep(i)} style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: previewStep === i ? '#DB0011' : '#F3F4F6',
                        color: previewStep === i ? '#fff' : '#374151',
                        border: previewStep === i ? '1px solid #DB0011' : '1px solid #E5E7EB',
                      }}>
                        Step {i + 1} — {jp.page.name.length > 16 ? jp.page.name.substring(0, 16) + '…' : jp.page.name}
                      </button>
                    ))}
                  </div>
                </div>

                {previewPage && (
                  <DevicePreview
                    channel={previewPage.channel}
                    slices={previewPage.slices}
                    pageName={previewPage.name}
                    description={previewPage.description}
                    webSlug={previewPage.webSlug}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* AEO Assessment Modal */}
      {showAEOModal && aeoScore && (
        <AEOAssessmentModal
          score={aeoScore}
          pageName={journey.name}
          onProceed={handleAEOProceed}
          onCancel={handleAEOCancel}
        />
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function JourneyBuilderPanel() {
  const { state, dispatch } = useOCDP();
  const { journeys, showNewJourneyModal, detailJourneyId } = state;
  const [search, setSearch] = useState('');

  const filtered = journeys.filter(j =>
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.bizLineId.toLowerCase().includes(search.toLowerCase())
  );
  const activeJourney = detailJourneyId ? journeys.find(j => j.journeyId === detailJourneyId) : null;

  return (
    <div style={{ flex: 1, display: 'flex', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      {/* Left: journey list */}
      <div style={{ width: 260, flexShrink: 0, background: 'var(--surface-panel)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Journeys</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>{filtered.length} journey{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_NEW_JOURNEY_MODAL' })}
              style={{ padding: '5px 10px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              + New
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search journeys..."
            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border-light)', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(j => {
            const isActive = j.journeyId === detailJourneyId;
            const stepCount = state.journeyPages.filter(jp => jp.journeyId === j.journeyId).length;
            return (
              <button key={j.journeyId} onClick={() => dispatch({ type: 'OPEN_JOURNEY', journeyId: j.journeyId })}
                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: isActive ? 'rgba(219,0,17,0.05)' : 'transparent', borderLeft: isActive ? '3px solid var(--hsbc-red)' : '3px solid transparent', border: 'none', cursor: 'pointer', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{stepCount} pages · {j.marketId} · {j.bizLineId}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge status={j.status} />
                  {j.isPublic === true && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}>🌐 Public</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: detail or empty state */}
      {activeJourney ? (
        <JourneyDetail key={activeJourney.journeyId} journey={activeJourney} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Select a Journey</div>
          <div style={{ fontSize: 13 }}>Choose from the list or create a new one</div>
          <button onClick={() => dispatch({ type: 'TOGGLE_NEW_JOURNEY_MODAL' })}
            style={{ marginTop: 8, padding: '9px 20px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + New Journey
          </button>
        </div>
      )}

      {showNewJourneyModal && <NewJourneyModal />}
    </div>
  );
}
