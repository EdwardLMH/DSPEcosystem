import { useState, useEffect, useCallback } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import { NewPageModal } from './NewPageModal';
import { DevicePreview } from '../shared/DevicePreview';
import { AEOAssessmentModal } from './AEOAssessmentModal';
import { calculateAEOScore, shouldShowAEOAssessment } from '../../utils/aeoCalculator';
import type { Channel, PageLayout, CampaignSchedule, SliceType, NativeTarget, AEOScore } from '../../types/ocdp';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_META: Record<Channel, { label: string; icon: string; color: string }> = {
  SDUI:         { label: 'SDUI',         icon: '📱', color: '#0F3057' },
  WEB_STANDARD: { label: 'Web Standard', icon: '🌐', color: '#1A1A2E' },
  WEB_WECHAT:   { label: 'WeChat H5',    icon: '💬', color: '#07C160' },
};

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:            { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  PENDING_APPROVAL: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  APPROVED:         { bg: '#D1FAE5', color: '#059669', label: 'Approved' },
  REJECTED:         { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  LIVE:             { bg: '#DBEAFE', color: '#1D4ED8', label: 'Live' },
};

const SLICE_TYPES: SliceType[] = [
  'HEADER_NAV', 'QUICK_ACCESS', 'PROMO_BANNER', 'FUNCTION_GRID',
  'AI_ASSISTANT', 'AD_BANNER', 'FLASH_LOAN', 'WEALTH_SELECTION',
  'FEATURED_RANKINGS', 'LIFE_DEALS', 'SPACER',
  'VIDEO_PLAYER', 'MARKET_BRIEFING_TEXT', 'CONTACT_RM_CTA',
];

// ─── Reusable atoms ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Channel }) {
  const m = CHANNEL_META[channel];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>
      {m.icon} {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.DRAFT;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: m.bg, color: m.color }}>{m.label}</span>;
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#111', textAlign: 'right', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function actionBtn(bg: string, disabled = false): React.CSSProperties {
  return {
    width: '100%', padding: '10px', background: disabled ? '#F3F4F6' : bg,
    color: disabled ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  };
}

// ─── Workflow timeline ────────────────────────────────────────────────────────

function WorkflowTimeline({ status }: { status: string }) {
  const steps = [
    { key: 'DRAFT',            label: 'Draft',            icon: '✏️' },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval', icon: '🕐' },
    { key: 'APPROVED',         label: 'Approved',         icon: '✓'  },
    { key: 'LIVE',             label: 'Live',             icon: '🚀' },
  ];
  const ORDER = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LIVE'];
  const currentIdx = ORDER.indexOf(status === 'REJECTED' ? 'PENDING_APPROVAL' : status);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const isRej  = status === 'REJECTED' && s.key === 'PENDING_APPROVAL';
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                background: isRej ? '#FEE2E2' : done ? '#D1FAE5' : active ? '#DB0011' : '#F3F4F6',
                color: isRej ? '#DC2626' : done ? '#059669' : active ? '#fff' : '#9CA3AF',
                fontWeight: 700, border: active ? '2px solid #DB0011' : '2px solid transparent',
              }}>
                {isRej ? '✗' : done ? '✓' : s.icon}
              </div>
              {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 16, background: done ? '#D1FAE5' : '#F3F4F6', margin: '2px 0' }} />}
            </div>
            <div style={{ paddingBottom: 12, paddingTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: active || done ? 600 : 400, color: isRej ? '#DC2626' : active ? '#DB0011' : done ? '#059669' : '#9CA3AF' }}>
                {isRej ? 'Rejected' : s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Campaign Timer ───────────────────────────────────────────────────────────

function useCountdown(target: string | undefined) {
  const calc = useCallback(() => {
    if (!target) return null;
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    const s = Math.floor(diff / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, expired: false };
  }, [target]);

  const [tick, setTick] = useState(calc);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, [target, calc]);
  return tick;
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#1A1A1A', background: '#F3F4F6', borderRadius: 8, padding: '4px 8px', lineHeight: 1.2 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 3, letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function CampaignTimerPanel({ page }: { page: PageLayout }) {
  const { dispatch } = useOCDP();
  const sched = page.campaignSchedule;
  const publishCountdown  = useCountdown(sched?.publishAt);
  const takedownCountdown = useCountdown(sched?.takedownAt);

  const [publishAt,  setPublishAt]  = useState(sched?.publishAt  ? sched.publishAt.slice(0, 16)  : '');
  const [takedownAt, setTakedownAt] = useState(sched?.takedownAt ? sched.takedownAt.slice(0, 16) : '');
  const [editing, setEditing] = useState(!sched);

  function saveSchedule() {
    if (!publishAt || !takedownAt) return;
    const schedule: CampaignSchedule = {
      publishAt:  new Date(publishAt).toISOString(),
      takedownAt: new Date(takedownAt).toISOString(),
    };
    dispatch({ type: 'SET_CAMPAIGN_SCHEDULE', pageId: page.pageId, schedule });
    setEditing(false);
  }

  function clearSchedule() {
    dispatch({ type: 'SET_CAMPAIGN_SCHEDULE', pageId: page.pageId, schedule: undefined });
    setPublishAt(''); setTakedownAt('');
    setEditing(true);
  }

  // Auto-publish when countdown expires (simulated: dispatch PUBLISH_PAGE)
  useEffect(() => {
    if (publishCountdown?.expired && page.authoringStatus === 'APPROVED' && sched && !sched.timerStopped) {
      const hasTarget = page.releaseMarketIds?.[0];
      if (hasTarget) {
        dispatch({ type: 'PUBLISH_PAGE', pageId: page.pageId, targetId: hasTarget });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishCountdown?.expired]);

  const isApproved = page.authoringStatus === 'APPROVED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 2 }}>⏱ Campaign Schedule</div>
        <div style={{ fontSize: 11, color: '#9A3412' }}>
          {isApproved
            ? 'This campaign is approved. Set a publish time — when the timer expires the page auto-releases to production.'
            : 'Campaign pages require approval before scheduling. Submit for review first.'}
        </div>
      </div>

      {sched && !editing ? (
        <>
          {/* Publish countdown */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {publishCountdown?.expired ? '🚀 Published' : '⏳ Publishes in'}
            </div>
            {publishCountdown?.expired ? (
              <div style={{ padding: '10px 14px', background: '#D1FAE5', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#059669' }}>
                Campaign went live — auto-published to {page.releaseMarketIds?.join(', ')}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '12px 0' }}>
                <CountdownDigit value={publishCountdown?.d ?? 0}  label="days" />
                <div style={{ fontSize: 24, fontWeight: 800, color: '#9CA3AF', alignSelf: 'center', marginBottom: 14 }}>:</div>
                <CountdownDigit value={publishCountdown?.h ?? 0}  label="hrs" />
                <div style={{ fontSize: 24, fontWeight: 800, color: '#9CA3AF', alignSelf: 'center', marginBottom: 14 }}>:</div>
                <CountdownDigit value={publishCountdown?.m ?? 0}  label="min" />
                <div style={{ fontSize: 24, fontWeight: 800, color: '#9CA3AF', alignSelf: 'center', marginBottom: 14 }}>:</div>
                <CountdownDigit value={publishCountdown?.s ?? 0}  label="sec" />
              </div>
            )}
          </div>

          {/* Schedule summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InfoRow label="Publish at"   value={new Date(sched.publishAt).toLocaleString()} />
            <InfoRow label="Takedown at"  value={new Date(sched.takedownAt).toLocaleString()} />
            {!publishCountdown?.expired && (
              <InfoRow label="Takedown in" value={
                takedownCountdown
                  ? `${takedownCountdown.d}d ${takedownCountdown.h}h ${takedownCountdown.m}m`
                  : '—'
              } />
            )}
          </div>

          {isApproved && !publishCountdown?.expired && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(true)}
                style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer' }}>
                Edit Schedule
              </button>
              <button onClick={clearSchedule}
                style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, background: 'rgba(220,38,38,0.05)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, cursor: 'pointer' }}>
                Clear Schedule
              </button>
            </div>
          )}
        </>
      ) : (
        /* Schedule editor */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Publish Date & Time</label>
            <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Takedown Date & Time</label>
            <input type="datetime-local" value={takedownAt} onChange={e => setTakedownAt(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', boxSizing: 'border-box' }} />
          </div>
          <button onClick={saveSchedule} disabled={!publishAt || !takedownAt || !isApproved}
            style={actionBtn('#D97706', !publishAt || !takedownAt || !isApproved)}>
            ⏱ Set Campaign Timer
          </button>
          {sched && (
            <button onClick={() => setEditing(false)}
              style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
          {!isApproved && (
            <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>Requires APPROVED status to set timer</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditPageForm({ page, onDone }: { page: PageLayout; onDone: () => void }) {
  const { dispatch } = useOCDP();
  const [name,        setName]        = useState(page.name);
  const [description, setDescription] = useState(page.description ?? '');
  const [nativeTargets, setNativeTargets] = useState<NativeTarget[]>(page.nativeTargets ?? []);
  const [webSlug,     setWebSlug]     = useState(page.webSlug ?? '');
  const [webTitle,    setWebTitle]    = useState(page.webMetaTitle ?? '');
  const [webDesc,     setWebDesc]     = useState(page.webMetaDescription ?? '');
  const [wechatUrl,   setWechatUrl]   = useState(page.wechatPageUrl ?? '');
  const [wechatTitle, setWechatTitle] = useState(page.wechatShareTitle ?? '');
  const [wechatDesc,  setWechatDesc]  = useState(page.wechatShareDesc ?? '');
  const [addSliceType, setAddSliceType] = useState<SliceType>('PROMO_BANNER');

  const EDIT_NATIVE_TARGETS: { value: NativeTarget; label: string; icon: string }[] = [
    { value: 'ios',         label: 'iOS',        icon: '🍎' },
    { value: 'android',     label: 'Android',    icon: '🤖' },
    { value: 'harmonynext', label: 'HarmonyNext', icon: '🌸' },
    { value: 'web',         label: 'Web',        icon: '🌐' },
  ];

  function toggleNative(t: NativeTarget) {
    setNativeTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function save() {
    const updates: Partial<PageLayout> = { name, description };
    if (page.channel === 'SDUI')         Object.assign(updates, { nativeTargets });
    if (page.channel === 'WEB_STANDARD') Object.assign(updates, { webSlug, webMetaTitle: webTitle, webMetaDescription: webDesc });
    if (page.channel === 'WEB_WECHAT')   Object.assign(updates, { wechatPageUrl: wechatUrl, wechatShareTitle: wechatTitle, wechatShareDesc: wechatDesc });
    dispatch({ type: 'EDIT_PAGE', pageId: page.pageId, updates });
    onDone();
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: 8, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
        ✏️ Editing — saving will reset status to Draft
      </div>

      {/* Core fields */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Page Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inp} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          style={{ ...inp, resize: 'vertical' }} />
      </div>

      {/* Channel-specific */}
      {page.channel === 'SDUI' && (
        <div style={{ padding: 12, background: '#FFF7F0', border: '1px solid #FDDCB5', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Native Client Targets
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {EDIT_NATIVE_TARGETS.map(t => {
              const on = nativeTargets.includes(t.value);
              return (
                <button key={t.value} onClick={() => toggleNative(t.value)} style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
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
      {page.channel === 'WEB_STANDARD' && (
        <>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>URL Slug</label>
            <input value={webSlug} onChange={e => setWebSlug(e.target.value)} style={inp} placeholder="/path/to/page" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Meta Title</label>
            <input value={webTitle} onChange={e => setWebTitle(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Meta Description</label>
            <textarea value={webDesc} onChange={e => setWebDesc(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
        </>
      )}
      {page.channel === 'WEB_WECHAT' && (
        <>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>WeChat Page URL</label>
            <input value={wechatUrl} onChange={e => setWechatUrl(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Share Title</label>
            <input value={wechatTitle} onChange={e => setWechatTitle(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Share Description</label>
            <input value={wechatDesc} onChange={e => setWechatDesc(e.target.value)} style={inp} />
          </div>
        </>
      )}

      {/* Slices */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Slices ({page.slices.length})
        </div>
        {page.slices.map(s => (
          <div key={s.instanceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F9FAFB', borderRadius: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.type}</span>
            <button onClick={() => dispatch({ type: 'REMOVE_SLICE', pageId: page.pageId, instanceId: s.instanceId })}
              style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
              Remove
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <select value={addSliceType} onChange={e => setAddSliceType(e.target.value as SliceType)}
            style={{ flex: 1, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-family)' }}>
            {SLICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => dispatch({ type: 'ADD_SLICE', pageId: page.pageId, slice: { type: addSliceType, props: {}, visible: true, locked: false } })}
            style={{ padding: '6px 14px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button onClick={onDone}
          style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={save}
          style={{ flex: 2, padding: '9px', fontSize: 13, fontWeight: 700, background: '#DB0011', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function PageDetailDrawer({ page }: { page: PageLayout }) {
  const { state, dispatch } = useOCDP();
  const { releaseTargets, marketStatus, currentUser } = state;
  const [comment,   setComment]   = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'approval' | 'campaign' | 'preview'>('overview');
  const [showAEOModal, setShowAEOModal] = useState(false);
  const [aeoScore, setAeoScore] = useState<AEOScore | null>(null);

  const status      = page.authoringStatus;
  const isCampaign  = page.pageType === 'CAMPAIGN';
  const isApprover  = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';
  const isAuthor    = currentUser.role.endsWith('-AUTHOR')   || currentUser.role === 'ADMIN';
  const liveTargets = marketStatus.filter(ms => ms.pageId === page.pageId && ms.productionStatus === 'LIVE');
  const pageTargets = page.releaseMarketIds ?? [];
  const isLive      = liveTargets.length > 0;
  const isWebStd    = page.channel === 'WEB_STANDARD';
  const isSDUI      = page.channel === 'SDUI';
  const hasCampaignTimer = isCampaign && !!page.campaignSchedule;

  // AEO score for this page (if exists)
  const existingAEOScore = isWebStd ? state.aeoScores.find(s => s.pageId === page.pageId) : null;

  // Handle submission with AEO assessment for Web Standard pages
  function handleSubmit() {
    if (shouldShowAEOAssessment(page)) {
      // Calculate AEO score and show modal
      const targetId = pageTargets[0] ?? 'GLOBAL';
      const score = calculateAEOScore(page, targetId);
      setAeoScore(score);
      setShowAEOModal(true);
    } else {
      // Direct submission for non-Web Standard pages
      dispatch({ type: 'SUBMIT_PAGE', pageId: page.pageId, targetIds: pageTargets, comment });
    }
  }

  function handleAEOProceed() {
    setShowAEOModal(false);
    // Save the AEO score to store
    if (aeoScore) {
      dispatch({ type: 'SAVE_AEO_SCORE', score: aeoScore });
    }
    // Proceed with submission
    dispatch({ type: 'SUBMIT_PAGE', pageId: page.pageId, targetIds: pageTargets, comment });
  }

  function handleAEOCancel() {
    setShowAEOModal(false);
    setAeoScore(null);
  }

  // Tabs shown depend on page type
  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'edit',      label: 'Edit'      },
    { key: 'approval',  label: 'Approval'  },
    ...(isCampaign ? [{ key: 'campaign' as const, label: '⏱ Timer' }] : []),
    { key: 'preview',   label: 'Preview'   },
  ];

  return (
    <div style={{ width: 460, flexShrink: 0, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
              {page.thumbnail} {page.name}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <ChannelBadge channel={page.channel} />
              <StatusBadge  status={status} />
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#F3F4F6', color: '#6B7280' }}>{page.bizLineId}</span>
              {isCampaign && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>CAMPAIGN</span>}
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'CLOSE_DETAIL' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', flexShrink: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '7px 12px', fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#DB0011' : '#6B7280',
              background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #DB0011' : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InfoRow label="Page ID"    value={page.pageId} mono />
            <InfoRow label="Type"       value={page.pageType} />
            <InfoRow label="Platform"   value={page.platform} />
            <InfoRow label="Locale"     value={page.locale} />
            <InfoRow label="Market"     value={page.marketId} />
            <InfoRow label="Scope"      value={page.scope} />
            <InfoRow label="AD Group"   value={page.groupId} />
            {page.description        && <InfoRow label="Description"  value={page.description} />}
            {page.webSlug            && <InfoRow label="URL Slug"     value={page.webSlug} mono />}
            {page.webMetaTitle       && <InfoRow label="Meta Title"   value={page.webMetaTitle} />}
            {page.wechatPageUrl      && <InfoRow label="WeChat URL"   value={page.wechatPageUrl} mono />}
            {page.wechatShareTitle   && <InfoRow label="Share Title"  value={page.wechatShareTitle} />}

            {/* Campaign schedule summary */}
            {isCampaign && page.campaignSchedule && (
              <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', marginBottom: 4 }}>⏱ Campaign Schedule</div>
                <div style={{ fontSize: 12, color: '#92400E' }}>Publish: {new Date(page.campaignSchedule.publishAt).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#92400E' }}>Takedown: {new Date(page.campaignSchedule.takedownAt).toLocaleString()}</div>
              </div>
            )}

            {/* Release targets */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Release Targets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pageTargets.map(tid => {
                  const live = liveTargets.find(lt => lt.targetId === tid);
                  return (
                    <div key={tid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{tid}</span>
                        {live && <span style={{ fontSize: 10, color: '#059669', marginLeft: 8 }}>Live since {live.lastPublishedAt}</span>}
                      </div>
                      {live
                        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#D1FAE5', color: '#059669' }}>LIVE</span>
                        : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#F3F4F6', color: '#9CA3AF' }}>NOT RELEASED</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Slices summary */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Slices ({page.slices.length})
              </div>
              {page.slices.length === 0
                ? <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No slices — use Edit tab to add</div>
                : page.slices.map(s => (
                    <div key={s.instanceId} style={{ fontSize: 12, padding: '5px 10px', background: '#F9FAFB', borderRadius: 6, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{s.type}</span>
                      <span style={{ color: s.visible ? '#059669' : '#9CA3AF' }}>{s.visible ? 'visible' : 'hidden'}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── Edit ── */}
        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: 8, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
              ✏️ Use the full page editor to drag & drop components, reorder slices, and update page meta.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
              <InfoRow label="Name"        value={page.name} />
              <InfoRow label="Channel"     value={page.channel} />
              <InfoRow label="Slices"      value={`${page.slices.length} component${page.slices.length !== 1 ? 's' : ''}`} />
              <InfoRow label="Status"      value={page.authoringStatus} />
            </div>
            <button
              onClick={() => dispatch({ type: 'OPEN_PAGE_EDITOR', pageId: page.pageId, returnView: 'pages' })}
              style={{ padding: '12px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              🖊 Open Page Editor
            </button>
            <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
              The editor opens full-screen. Click "Exit Editor" to return here.
            </div>
          </div>
        )}

        {/* ── Approval ── */}
        {activeTab === 'approval' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Approval Flow</div>
              <WorkflowTimeline status={status} />
            </div>

            {/* AEO/SEO Score for Web Standard — visible to approvers */}
            {isWebStd && existingAEOScore && (status === 'PENDING_APPROVAL' || status === 'APPROVED') && (
              <div style={{ padding: '14px 16px', background: existingAEOScore.grade === 'A' || existingAEOScore.grade === 'B' ? '#F0FDF4' : existingAEOScore.grade === 'C' ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${existingAEOScore.grade === 'A' || existingAEOScore.grade === 'B' ? '#BBF7D0' : existingAEOScore.grade === 'C' ? '#FDE68A' : '#FECACA'}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: existingAEOScore.grade === 'A' || existingAEOScore.grade === 'B' ? '#059669' : existingAEOScore.grade === 'C' ? '#D97706' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                    {existingAEOScore.grade}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>AEO/SEO Score: {existingAEOScore.score}/100</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Checked: {new Date(existingAEOScore.checkedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ height: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${existingAEOScore.score}%`, background: existingAEOScore.grade === 'A' || existingAEOScore.grade === 'B' ? '#059669' : existingAEOScore.grade === 'C' ? '#D97706' : '#DC2626', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {existingAEOScore.breakdown.map((item, idx) => (
                    <span key={idx} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: item.pass ? '#D1FAE5' : '#FEE2E2', color: item.pass ? '#059669' : '#DC2626', fontWeight: 600 }}>
                      {item.pass ? '✓' : '✗'} {item.label} {item.score}/{item.maxScore}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code for SDUI testing */}
            {isSDUI && (status === 'PENDING_APPROVAL' || status === 'APPROVED') && (
              <div style={{ padding: '14px 16px', background: '#FFF7F0', border: '1px solid #FDDCB5', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>📱 Native App Testing</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 100, height: 100, background: '#fff', borderRadius: 8,
                    border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Simulated QR code pattern */}
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
                      Scan with the HSBC testing app to preview this page on your device.
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6B7280', background: '#F3F4F6', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>
                      dsp://preview/{page.pageId}
                    </div>
                    {page.nativeTargets && page.nativeTargets.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {page.nativeTargets.map(t => (
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
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                placeholder="Add a note for the reviewer..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Author: Submit for approval (DRAFT / REJECTED) */}
              {(status === 'DRAFT' || status === 'REJECTED') && isAuthor && (
                <button onClick={handleSubmit}
                  style={actionBtn('#DB0011')}>
                  📤 {status === 'REJECTED' ? 'Resubmit' : 'Submit'} for Approval
                </button>
              )}

              {/* Author: Withdraw from approval */}
              {status === 'PENDING_APPROVAL' && isAuthor && (
                <button onClick={() => dispatch({ type: 'WITHDRAW_PAGE', pageId: page.pageId })}
                  style={actionBtn('#6B7280')}>
                  ↩ Withdraw to Draft
                </button>
              )}

              {/* Approver: Approve / Reject (PENDING_APPROVAL) */}
              {status === 'PENDING_APPROVAL' && isApprover && (
                <>
                  <button onClick={() => dispatch({ type: 'APPROVE_PAGE', pageId: page.pageId, targetId: pageTargets[0] ?? '', comment })}
                    style={actionBtn('#059669')}>
                    ✓ Approve {isCampaign ? '(then set timer)' : ''}
                  </button>
                  <button onClick={() => dispatch({ type: 'REJECT_PAGE', pageId: page.pageId, targetId: pageTargets[0] ?? '', comment })}
                    style={actionBtn('#DC2626')}>
                    ✗ Reject
                  </button>
                </>
              )}

              {/* Publish to market (APPROVED, non-campaign) — available to approver and author */}
              {status === 'APPROVED' && (isApprover || isAuthor) && !isCampaign && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Publish to market</div>
                  {pageTargets.map(tid => {
                    const tidLive = liveTargets.some(lt => lt.targetId === tid);
                    return (
                      <button key={tid} disabled={tidLive}
                        onClick={() => dispatch({ type: 'PUBLISH_PAGE', pageId: page.pageId, targetId: tid })}
                        style={actionBtn(tidLive ? '#9CA3AF' : '#1D4ED8', tidLive)}>
                        {tidLive ? `✓ ${tid} — Already LIVE` : `🚀 Publish to ${tid}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Campaign approved → timer hint + direct publish */}
              {status === 'APPROVED' && isCampaign && !hasCampaignTimer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                    ⏱ Campaign approved — go to the Timer tab to schedule the auto-release or press Publish to Live
                  </div>
                  {pageTargets.map(tid => {
                    const tidLive = liveTargets.some(lt => lt.targetId === tid);
                    return (
                      <button key={tid} disabled={tidLive}
                        onClick={() => dispatch({ type: 'PUBLISH_PAGE', pageId: page.pageId, targetId: tid })}
                        style={actionBtn(tidLive ? '#9CA3AF' : '#1D4ED8', tidLive)}>
                        {tidLive ? `✓ ${tid} — Already LIVE` : `🚀 Publish to ${tid}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Approver: Cancel timer & publish immediately (campaign with active timer) */}
              {status === 'APPROVED' && isCampaign && hasCampaignTimer && isApprover && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                    ⏱ Timer active — scheduled for {new Date(page.campaignSchedule!.publishAt).toLocaleString()}
                  </div>
                  <button onClick={() => { if (window.confirm('Cancel the timer and publish immediately?')) dispatch({ type: 'CANCEL_TIMER_AND_PUBLISH', pageId: page.pageId }); }}
                    style={actionBtn('#1D4ED8')}>
                    ⚡ Cancel Timer & Publish Now
                  </button>
                </div>
              )}

              {/* Author controls for LIVE pages */}
              {isLive && isAuthor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Page Actions</div>
                  <button onClick={() => { if (window.confirm(`Take down "${page.name}" from live and revert to Draft?`)) dispatch({ type: 'TAKEDOWN_PAGE', pageId: page.pageId }); }}
                    style={actionBtn('#DC2626')}>
                    ⬇ Take Down & Send to Draft
                  </button>
                  <button onClick={() => dispatch({ type: 'DRAFT_NEW_VERSION', pageId: page.pageId })}
                    style={actionBtn('#2563EB')}>
                    📝 Draft A New Version
                  </button>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                    "Draft A New Version" keeps the current page live. The new draft replaces it once approved and published.
                  </div>
                </div>
              )}

              {/* Approver: Cancel timer & publish for LIVE pages with timer still active */}
              {isLive && hasCampaignTimer && isApprover && (
                <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 4 }}>⏱ Takedown Scheduled</div>
                  <div style={{ fontSize: 11, color: '#92400E' }}>Takedown: {new Date(page.campaignSchedule!.takedownAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Campaign Timer ── */}
        {activeTab === 'campaign' && isCampaign && (
          <CampaignTimerPanel page={page} />
        )}

        {/* ── Preview ── */}
        {activeTab === 'preview' && (
          <DevicePreview
            channel={page.channel}
            slices={page.slices}
            pageName={page.name}
            description={page.description}
            webSlug={page.webSlug}
          />
        )}
      </div>

      {/* Footer: delete */}
      {(status === 'DRAFT' || status === 'REJECTED') && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', flexShrink: 0 }}>
          <button
            onClick={() => { if (window.confirm(`Delete "${page.name}"?`)) dispatch({ type: 'DELETE_PAGE', pageId: page.pageId }); }}
            style={{ width: '100%', padding: '7px', fontSize: 12, fontWeight: 600, color: '#DC2626', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, cursor: 'pointer' }}>
            Delete Page
          </button>
        </div>
      )}

      {/* AEO Assessment Modal */}
      {showAEOModal && aeoScore && (
        <AEOAssessmentModal
          score={aeoScore}
          pageName={page.name}
          onProceed={handleAEOProceed}
          onCancel={handleAEOCancel}
        />
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function PageLibraryPanel() {
  const { state, dispatch } = useOCDP();
  const { pages, marketStatus, showNewPageModal, detailPageId } = state;
  const [search,        setSearch]        = useState('');
  const [filterChannel, setFilterChannel] = useState<Channel | 'ALL'>('ALL');
  const [filterStatus,  setFilterStatus]  = useState('ALL');

  const filtered = pages.filter(p => {
    const matchSearch  = p.name.toLowerCase().includes(search.toLowerCase()) || p.bizLineId.toLowerCase().includes(search.toLowerCase());
    const matchChannel = filterChannel === 'ALL' || p.channel === filterChannel;
    const matchStatus  = filterStatus  === 'ALL' || p.authoringStatus === filterStatus;
    return matchSearch && matchChannel && matchStatus;
  });

  const detailPage = detailPageId ? pages.find(p => p.pageId === detailPageId) : null;

  function getLiveTargets(pageId: string) {
    return marketStatus.filter(ms => ms.pageId === pageId && ms.productionStatus === 'LIVE').map(ms => ms.targetId);
  }

  return (
    <div style={{ flex: 1, display: 'flex', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      {/* Main list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 14px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pages</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                {filtered.length} of {pages.length} pages · SDUI, Web Standard &amp; WeChat
              </p>
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_NEW_PAGE_MODAL' })}
              style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + New Page
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..."
              style={{ flex: 1, padding: '7px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none' }} />
            <select value={filterChannel} onChange={e => setFilterChannel(e.target.value as Channel | 'ALL')}
              style={{ padding: '7px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', background: '#fff', cursor: 'pointer' }}>
              <option value="ALL">All Channels</option>
              <option value="SDUI">SDUI</option>
              <option value="WEB_STANDARD">Web Standard</option>
              <option value="WEB_WECHAT">WeChat H5</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', background: '#fff', cursor: 'pointer' }}>
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No pages match your filters</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {filtered.map(page => {
                const liveTargets = getLiveTargets(page.pageId);
                const isActive    = page.pageId === detailPageId;
                const hasSched    = page.pageType === 'CAMPAIGN' && !!page.campaignSchedule;
                return (
                  <div key={page.pageId}
                    onClick={() => dispatch({ type: 'OPEN_PAGE', pageId: page.pageId })}
                    style={{
                      background: 'var(--surface-panel)', borderRadius: 12, padding: 18, cursor: 'pointer',
                      border: `2px solid ${isActive ? '#DB0011' : 'var(--border-light)'}`,
                      boxShadow: isActive ? '0 0 0 3px rgba(219,0,17,0.08)' : 'var(--shadow-sm)',
                      transition: 'box-shadow 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 26, flexShrink: 0 }}>{page.thumbnail}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {page.name}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <ChannelBadge channel={page.channel} />
                          <StatusBadge  status={page.authoringStatus} />
                          {hasSched && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>⏱ Scheduled</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: liveTargets.length ? 10 : 0 }}>
                      {page.bizLineId} · {page.marketId} · {page.locale}
                    </div>
                    {liveTargets.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>LIVE:</span>
                        {liveTargets.map(t => (
                          <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#D1FAE5', color: '#059669' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {detailPage && <PageDetailDrawer page={detailPage} />}

      {showNewPageModal && <NewPageModal />}
    </div>
  );
}
