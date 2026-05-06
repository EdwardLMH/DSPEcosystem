import { useState } from 'react';
import React from 'react';
import { useOCDP } from '../../store/OCDPStore';
import { NewJourneyModal } from './NewJourneyModal';
import { DevicePreview } from '../shared/DevicePreview';
import { AEOAssessmentModal } from './AEOAssessmentModal';
import { calculateAEOScore, shouldShowAEOAssessment } from '../../utils/aeoCalculator';
import type { Journey } from '../../store/mockData';
import type { CanvasSlice, NativeTarget, AEOScore } from '../../types/ocdp';

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

function AddStepPageForm({ journeyId, stepIndex, onCancel }: { journeyId: string; stepIndex: number; onCancel: () => void }) {
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
        platform: 'all',
        locale: 'en-HK',
        thumbnail: icon,
        tags: [],
        channel: 'SDUI',
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

function MiniKYCPreview({ slices }: { slices: CanvasSlice[] }) {
  const kycSlice = slices.find(s => s.type.startsWith('KYC_') && s.visible);
  if (!kycSlice) return null;

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

function StepCard({
  stepPage, index, total, journeyId, journeyStatus, stepDescription, onRemove,
}: {
  stepPage: { pageId: string; name: string; thumbnail: string; authoringStatus: string; slices: CanvasSlice[] } | null;
  index: number; total: number; journeyId: string; journeyStatus: string;
  stepDescription?: string;
  onRemove?: () => void;
}) {
  const { dispatch } = useOCDP();
  const isLast = index === total - 1;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
      {/* Step indicator + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 15,
          background: 'var(--hsbc-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>{index + 1}</div>
        {!isLast && <div style={{ width: 2, flex: 1, background: '#E5E7EB', marginTop: 4, minHeight: 20 }} />}
      </div>

      {/* Card */}
      <div style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 0 : 14 }}>
        {stepPage ? (
          <div style={{ background: 'var(--surface-panel)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Mini phone preview */}
              <MiniKYCPreview slices={stepPage.slices} />

              {/* Text info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stepPage.name}</div>
                    {stepDescription && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{stepDescription}</div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      <StatusBadge status={stepPage.authoringStatus} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
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

  // Meta editing state
  const [editName, setEditName]   = useState(journey.name);
  const [editDesc, setEditDesc]   = useState(journey.description ?? '');
  const [editNativeTargets, setEditNativeTargets] = useState<NativeTarget[]>(journey.nativeTargets ?? []);
  const [metaDirty, setMetaDirty] = useState(false);

  const isApprover = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';
  const isAuthor   = currentUser.role.endsWith('-AUTHOR')   || currentUser.role === 'ADMIN';
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

  // Handle submission with AEO assessment for Web Standard journeys
  function handleSubmit() {
    if (selectedTargets.length === 0) return;

    // Check if any journey page is Web Standard
    const hasWebStandardPage = myPages.some(jp => shouldShowAEOAssessment(jp.page));

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
      // Direct submission for non-Web Standard journeys
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
            <StatusBadge status={status} />
          </div>
        </div>
        <WorkflowTimeline status={status} />
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 14, borderBottom: '1px solid var(--border-light)' }}>
          {(['steps', 'meta', 'approval', 'preview'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
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
            {/* Info callout */}
            <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 11, color: '#1E40AF', marginBottom: 18, lineHeight: 1.5 }}>
              Each step is a full page. Click <strong>Edit</strong> to open the page editor for that step.
              Pages in a journey are not shown in the Pages panel.
            </div>

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
              />
            ))}

            {addingStep ? (
              <AddStepPageForm
                journeyId={journey.journeyId}
                stepIndex={myPages.length}
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
            {/* Journey info fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Journey Information</div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Journey Name</label>
                <input value={editName} onChange={e => { setEditName(e.target.value); setMetaDirty(true); }} style={inp}
                  disabled={status !== 'DRAFT' && status !== 'REJECTED'} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Description</label>
                <textarea value={editDesc} onChange={e => { setEditDesc(e.target.value); setMetaDirty(true); }} rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                  disabled={status !== 'DRAFT' && status !== 'REJECTED'} />
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
                <StatusBadge status={j.status} />
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
