import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import {
  AdGroup, ApprovalFlow,
  BizLineId, GroupType, WeChatServiceAccount, Market,
} from '../../types/ucp';
import { v4 } from '../../utils/uuid';

type AdminTab = 'ad-groups' | 'approval-flows' | 'wechat';

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '7px 10px',
  border: '1px solid var(--surface-border)', borderRadius: 6,
  fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none',
  color: 'var(--text-primary)', background: 'var(--surface-bg)',
};

const labelSt: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 5,
};

const thSt: React.CSSProperties = {
  padding: '8px 14px', textAlign: 'left', fontSize: 11,
  fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
};

const tdSt: React.CSSProperties = {
  padding: '10px 14px', fontSize: 13,
  color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)',
};

const BIZ_LINE_IDS: BizLineId[] = ['PAYMENT', 'WEB_ENABLER', 'LENDING', 'COLLECTION', 'WEALTH', 'MARKETING'];
const GROUP_TYPES: GroupType[] = ['AD_GROUP', 'AUDIT_GROUP', 'ADMIN_GROUP'];

function EmptyState({ icon = '📭', message }: { icon?: string; message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', gap: 10,
      color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}

function ActionBtn({
  label, color = 'var(--text-secondary)', danger = false, onClick,
}: { label: string; color?: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
        border: danger ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--surface-border)',
        background: 'transparent', color: danger ? '#ef4444' : color,
        fontWeight: 500,
      }}
    >{label}</button>
  );
}

// ─── AD Group form ─────────────────────────────────────────────────────────────

interface GroupFormState {
  groupName: string;
  bizLineId: BizLineId;
  groupType: GroupType;
}

const EMPTY_GROUP: GroupFormState = { groupName: '', bizLineId: 'WEALTH', groupType: 'AD_GROUP' };

function ADGroupForm({
  initial, marketId, onSave, onCancel,
}: {
  initial?: GroupFormState;
  marketId: string;
  onSave: (f: GroupFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<GroupFormState>(initial ?? EMPTY_GROUP);
  const valid = form.groupName.trim().length > 0;

  return (
    <div style={{
      background: 'var(--surface-bg)', border: '1.5px solid var(--surface-border)',
      borderRadius: 8, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        {initial ? 'Edit AD Group' : 'New AD Group'} — {marketId}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelSt}>Group Name *</label>
          <input
            value={form.groupName}
            onChange={e => setForm(p => ({ ...p, groupName: e.target.value }))}
            placeholder="e.g. HK Wealth AD Group"
            style={inputSt}
          />
        </div>
        <div>
          <label style={labelSt}>Business Line</label>
          <select value={form.bizLineId} onChange={e => setForm(p => ({ ...p, bizLineId: e.target.value as BizLineId }))} style={inputSt}>
            {BIZ_LINE_IDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Group Type</label>
          <select value={form.groupType} onChange={e => setForm(p => ({ ...p, groupType: e.target.value as GroupType }))} style={inputSt}>
            {GROUP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            background: valid ? 'var(--hsbc-red)' : 'var(--surface-border)',
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: valid ? 'pointer' : 'default',
          }}
        >{initial ? 'Save Changes' : 'Create Group'}</button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 18px', borderRadius: 6,
            border: '1px solid var(--surface-border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Approval flow form ────────────────────────────────────────────────────────

interface FlowFormState {
  flowName: string;
  adGroupId: string;   // the single AD group this flow belongs to
  minApprovers: number;
  samePerson: boolean;
  steps: { approverGroupId: string; approverGroupName: string }[];
}

const EMPTY_FLOW: FlowFormState = {
  flowName: '', adGroupId: '', minApprovers: 1, samePerson: false,
  steps: [{ approverGroupId: '', approverGroupName: '' }],
};

function FlowForm({
  initial, marketGroups, existingFlows, editingFlowId, onSave, onCancel,
}: {
  initial?: FlowFormState;
  marketGroups: AdGroup[];
  existingFlows: ApprovalFlow[];
  editingFlowId?: string;
  onSave: (f: FlowFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FlowFormState>(initial ?? EMPTY_FLOW);

  // Groups that already have a flow assigned (excluding the one being edited)
  const usedGroupIds = new Set<string>(
    existingFlows
      .filter(f => f.flowId !== editingFlowId)
      .map(f => (f.bizLineId as string) ?? '__none__')
  );

  // For this panel, we interpret flow-to-group linkage via a dedicated adGroupId field
  // (bizLineId on ApprovalFlow repurposed as the group constraint key for this UI)
  const availableGroups = marketGroups.filter(g =>
    g.groupType === 'AD_GROUP' &&
    (!usedGroupIds.has(g.groupId) || g.groupId === form.adGroupId)
  );

  function setStep(idx: number, groupId: string) {
    const g = marketGroups.find(x => x.groupId === groupId);
    setForm(p => {
      const steps = [...p.steps];
      steps[idx] = { approverGroupId: groupId, approverGroupName: g?.groupName ?? '' };
      return { ...p, steps };
    });
  }

  function addStep() {
    setForm(p => ({ ...p, steps: [...p.steps, { approverGroupId: '', approverGroupName: '' }] }));
  }

  function removeStep(idx: number) {
    setForm(p => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }));
  }

  const valid = form.flowName.trim().length > 0 &&
    form.adGroupId.length > 0 &&
    form.steps.every(s => s.approverGroupId.length > 0);

  return (
    <div style={{
      background: 'var(--surface-bg)', border: '1.5px solid var(--surface-border)',
      borderRadius: 8, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        {initial ? 'Edit Approval Flow' : 'New Approval Flow'}
      </div>

      {/* Flow name & AD Group */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelSt}>Flow Name *</label>
          <input
            value={form.flowName}
            onChange={e => setForm(p => ({ ...p, flowName: e.target.value }))}
            placeholder="e.g. HK Dual Approval"
            style={inputSt}
          />
        </div>
        <div>
          <label style={labelSt}>Linked AD Group * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(one flow per group)</span></label>
          <select
            value={form.adGroupId}
            onChange={e => setForm(p => ({ ...p, adGroupId: e.target.value }))}
            style={inputSt}
          >
            <option value="">— select AD group —</option>
            {availableGroups.map(g => (
              <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
            ))}
            {/* If editing, also show the currently assigned group even if "used" */}
            {form.adGroupId && !availableGroups.find(g => g.groupId === form.adGroupId) && (
              <option value={form.adGroupId}>
                {marketGroups.find(g => g.groupId === form.adGroupId)?.groupName ?? form.adGroupId}
              </option>
            )}
          </select>
          {availableGroups.length === 0 && !form.adGroupId && (
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>
              All AD groups already have a flow assigned. Delete one to reassign.
            </div>
          )}
        </div>
      </div>

      {/* Min approvers + same-person */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelSt}>Min Approvers</label>
          <input
            type="number" min={1} max={5}
            value={form.minApprovers}
            onChange={e => setForm(p => ({ ...p, minApprovers: Math.max(1, Number(e.target.value)) }))}
            style={inputSt}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <input
            type="checkbox"
            checked={form.samePerson}
            onChange={e => setForm(p => ({ ...p, samePerson: e.target.checked }))}
            style={{ accentColor: 'var(--hsbc-red)', cursor: 'pointer' }}
          />
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Same-person restriction (author cannot approve their own submission)
          </label>
        </div>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Approval Steps
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {form.steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--hsbc-navy)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{idx + 1}</span>
              <select
                value={step.approverGroupId}
                onChange={e => setStep(idx, e.target.value)}
                style={{ ...inputSt, flex: 1 }}
              >
                <option value="">— select approver group —</option>
                {marketGroups.map(g => (
                  <option key={g.groupId} value={g.groupId}>{g.groupName} ({g.groupType.replace(/_/g, ' ')})</option>
                ))}
              </select>
              {form.steps.length > 1 && (
                <button
                  onClick={() => removeStep(idx)}
                  style={{
                    padding: '4px 8px', borderRadius: 4, fontSize: 11,
                    border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                    color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                  }}
                >✕</button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addStep}
          style={{
            marginTop: 8, padding: '5px 12px', borderRadius: 6,
            border: '1px dashed var(--surface-border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
          }}
        >+ Add Step</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            background: valid ? 'var(--hsbc-red)' : 'var(--surface-border)',
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: valid ? 'pointer' : 'default',
          }}
        >{initial ? 'Save Changes' : 'Create Flow'}</button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 18px', borderRadius: 6,
            border: '1px solid var(--surface-border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────

function ConfirmDeleteModal({
  title, body, onConfirm, onCancel,
}: { title: string; body: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>{body}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid var(--surface-border)',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Timezone suggestion map ──────────────────────────────────────────────────

// Maps common market name keywords → IANA timezone + display label
const TZ_SUGGESTIONS: { keywords: string[]; timezone: string; tzLabel: string }[] = [
  { keywords: ['hong kong', 'hk'],            timezone: 'Asia/Hong_Kong',   tzLabel: 'HKT (UTC+8)' },
  { keywords: ['singapore', 'sg'],            timezone: 'Asia/Singapore',   tzLabel: 'SGT (UTC+8)' },
  { keywords: ['china', 'mainland', 'cn', 'beijing', 'shanghai'],
                                              timezone: 'Asia/Shanghai',    tzLabel: 'CST (UTC+8)' },
  { keywords: ['uk', 'united kingdom', 'london', 'britain', 'england'],
                                              timezone: 'Europe/London',    tzLabel: 'BST/GMT (UTC+0/+1)' },
  { keywords: ['india', 'in', 'mumbai', 'delhi'],
                                              timezone: 'Asia/Kolkata',     tzLabel: 'IST (UTC+5:30)' },
  { keywords: ['usa', 'us', 'new york', 'eastern'],
                                              timezone: 'America/New_York', tzLabel: 'ET (UTC-5/-4)' },
  { keywords: ['los angeles', 'pacific', 'california'],
                                              timezone: 'America/Los_Angeles', tzLabel: 'PT (UTC-8/-7)' },
  { keywords: ['japan', 'jp', 'tokyo'],       timezone: 'Asia/Tokyo',       tzLabel: 'JST (UTC+9)' },
  { keywords: ['australia', 'sydney'],        timezone: 'Australia/Sydney', tzLabel: 'AEDT/AEST (UTC+10/+11)' },
  { keywords: ['uae', 'dubai', 'emirates'],   timezone: 'Asia/Dubai',       tzLabel: 'GST (UTC+4)' },
  { keywords: ['germany', 'europe', 'paris', 'france', 'berlin'],
                                              timezone: 'Europe/Berlin',    tzLabel: 'CET/CEST (UTC+1/+2)' },
  { keywords: ['utc', 'global', 'gmt'],       timezone: 'UTC',              tzLabel: 'UTC (UTC+0)' },
];

function suggestTimezone(name: string): { timezone: string; tzLabel: string } | null {
  const lower = name.toLowerCase();
  for (const s of TZ_SUGGESTIONS) {
    if (s.keywords.some(k => lower.includes(k))) return { timezone: s.timezone, tzLabel: s.tzLabel };
  }
  return null;
}

// ─── Market form ──────────────────────────────────────────────────────────────

interface MarketFormState {
  marketId: string;
  marketName: string;
  timezone: string;
  tzLabel: string;
  active: boolean;
}

const EMPTY_MARKET: MarketFormState = { marketId: '', marketName: '', timezone: '', tzLabel: '', active: true };

function MarketForm({
  initial, isEdit, onSave, onCancel,
}: {
  initial?: MarketFormState;
  isEdit?: boolean;
  onSave: (f: MarketFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MarketFormState>(initial ?? EMPTY_MARKET);
  const [tzSuggestion, setTzSuggestion] = useState<string | null>(null);

  function handleNameChange(name: string) {
    const suggestion = suggestTimezone(name);
    if (suggestion && !form.timezone) {
      setForm(p => ({ ...p, marketName: name, timezone: suggestion.timezone, tzLabel: suggestion.tzLabel }));
      setTzSuggestion(`Auto-suggested from market name`);
    } else {
      setForm(p => ({ ...p, marketName: name }));
    }
  }

  const valid = form.marketName.trim().length > 0 &&
    form.marketId.trim().length > 0 &&
    form.timezone.trim().length > 0;

  return (
    <div style={{
      background: 'var(--surface-bg)', border: '1.5px solid var(--surface-border)',
      borderRadius: 8, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        {isEdit ? 'Edit Market' : 'New Market'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelSt}>Short Name *</label>
          <input
            value={form.marketId}
            onChange={e => setForm(p => ({ ...p, marketId: e.target.value.toUpperCase().slice(0, 6) }))}
            placeholder="e.g. MY"
            style={inputSt}
          />
        </div>
        <div>
          <label style={labelSt}>Market Name *</label>
          <input
            value={form.marketName}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Malaysia (hsbc.com.my)"
            style={inputSt}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelSt}>
            IANA Timezone *
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>e.g. Asia/Kuala_Lumpur</span>
          </label>
          <input
            value={form.timezone}
            onChange={e => { setForm(p => ({ ...p, timezone: e.target.value })); setTzSuggestion(null); }}
            placeholder="Asia/Hong_Kong"
            style={inputSt}
          />
          {tzSuggestion && (
            <div style={{ fontSize: 10, color: '#059669', marginTop: 3 }}>✓ {tzSuggestion}</div>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
            IANA tz database name. Try typing the market name above to auto-suggest.
          </div>
        </div>
        <div>
          <label style={labelSt}>
            Timezone Label
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>e.g. MYT (UTC+8)</span>
          </label>
          <input
            value={form.tzLabel}
            onChange={e => setForm(p => ({ ...p, tzLabel: e.target.value }))}
            placeholder="MYT (UTC+8)"
            style={inputSt}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
            Display label shown to authors and approvers.
          </div>
        </div>
      </div>

      {/* Quick timezone presets */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
          Common timezones:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {TZ_SUGGESTIONS.slice(0, 8).map(s => (
            <button
              key={s.timezone}
              onClick={() => setForm(p => ({ ...p, timezone: s.timezone, tzLabel: s.tzLabel }))}
              style={{
                padding: '3px 8px', borderRadius: 10, fontSize: 10, cursor: 'pointer',
                border: `1px solid ${form.timezone === s.timezone ? 'var(--hsbc-red)' : 'var(--surface-border)'}`,
                background: form.timezone === s.timezone ? 'rgba(219,0,17,0.08)' : 'transparent',
                color: form.timezone === s.timezone ? 'var(--hsbc-red)' : 'var(--text-muted)',
              }}
            >
              {s.tzLabel}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
          style={{ accentColor: 'var(--hsbc-red)', cursor: 'pointer' }}
        />
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Active — visible in release market selection and approvals
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            background: valid ? 'var(--hsbc-red)' : 'var(--surface-border)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: valid ? 'pointer' : 'default',
          }}
        >{isEdit ? 'Save Market' : 'Create Market'}</button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 18px', borderRadius: 6,
            border: '1px solid var(--surface-border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function MarketAdminPanel() {
  const { state, dispatch } = useUCP();
  const { currentUser, wechatAccounts, markets, adGroups, approvalFlows } = state;

  const isAdmin = currentUser.role === 'ADMIN' || !!currentUser.isGlobalAdmin;

  const [selectedMarketId, setSelectedMarketId] = useState<string>(state.markets[0]?.marketId ?? '');
  const [activeTab,        setActiveTab]         = useState<AdminTab>('ad-groups');

  // Market UI state
  const [showAddMarket,   setShowAddMarket]   = useState(false);
  const [editingMarket,   setEditingMarket]   = useState<Market | null>(null);
  const [deletingMarket,  setDeletingMarket]  = useState<Market | null>(null);

  // AD Group UI state
  const [showAddGroup,  setShowAddGroup]  = useState(false);
  const [editingGroup,  setEditingGroup]  = useState<AdGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<AdGroup | null>(null);

  // Approval Flow UI state
  const [showAddFlow,  setShowAddFlow]  = useState(false);
  const [editingFlow,  setEditingFlow]  = useState<ApprovalFlow | null>(null);
  const [deletingFlow, setDeletingFlow] = useState<ApprovalFlow | null>(null);

  // WeChat UI state
  const [showAddWechat, setShowAddWechat] = useState(false);

  if (!isAdmin) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, background: 'var(--surface-bg)',
      }}>
        <span style={{ fontSize: 40 }}>🔒</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Access restricted</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin role required to manage markets.</div>
      </div>
    );
  }

  const selectedMarket  = markets.find(m => m.marketId === selectedMarketId);
  const marketGroups    = adGroups.filter(g => g.marketId === selectedMarketId);
  const marketFlows     = approvalFlows.filter(f => f.marketId === selectedMarketId);
  const marketAccounts  = wechatAccounts.filter(a =>
    a.assignedMarkets.some(m => m.marketId === selectedMarketId)
  );

  // ── Market handlers ────────────────────────────────────────────────────────

  function handleAddMarket(form: MarketFormState) {
    const id = form.marketId.trim().toUpperCase();
    if (markets.find(m => m.marketId === id)) return;
    dispatch({ type: 'ADD_MARKET', market: {
      marketId: id, marketName: form.marketName.trim(),
      timezone: form.timezone.trim(), tzLabel: form.tzLabel.trim() || form.timezone,
      active: form.active,
    }});
    setShowAddMarket(false);
    setSelectedMarketId(id);
  }

  function handleEditMarket(form: MarketFormState) {
    const newId = form.marketId.trim().toUpperCase();
    dispatch({ type: 'EDIT_MARKET', oldMarketId: selectedMarketId, market: {
      marketId: newId, marketName: form.marketName.trim(),
      timezone: form.timezone.trim(), tzLabel: form.tzLabel.trim() || form.timezone,
      active: form.active,
    }});
    if (newId !== selectedMarketId) setSelectedMarketId(newId);
    setEditingMarket(null);
  }

  function handleDeleteMarket() {
    if (!deletingMarket) return;
    dispatch({ type: 'DELETE_MARKET', marketId: deletingMarket.marketId });
    const remaining = markets.filter(m => m.marketId !== deletingMarket.marketId);
    setSelectedMarketId(remaining[0]?.marketId ?? '');
    setDeletingMarket(null);
  }

  // ── AD Group handlers ──────────────────────────────────────────────────────

  function handleAddGroup(form: GroupFormState) {
    const group: AdGroup = {
      groupId:   `${selectedMarketId}-${form.bizLineId}-${Date.now()}`,
      groupName: form.groupName.trim(),
      marketId:  selectedMarketId,
      bizLineId: form.bizLineId,
      groupType: form.groupType,
    };
    dispatch({ type: 'ADD_AD_GROUP', group });
    setShowAddGroup(false);
  }

  function handleEditGroup(form: GroupFormState) {
    if (!editingGroup) return;
    dispatch({ type: 'EDIT_AD_GROUP', groupId: editingGroup.groupId, updates: {
      groupName: form.groupName.trim(), bizLineId: form.bizLineId, groupType: form.groupType,
    }});
    setEditingGroup(null);
  }

  function handleDeleteGroup() {
    if (!deletingGroup) return;
    dispatch({ type: 'DELETE_AD_GROUP', groupId: deletingGroup.groupId });
    setDeletingGroup(null);
  }

  // ── Approval Flow handlers ─────────────────────────────────────────────────

  // We store the linked-group constraint in bizLineId field (repurposed as groupId key)
  // so that we can enforce 1 flow per AD group.

  function flowFormFromFlow(flow: ApprovalFlow): FlowFormState {
    return {
      flowName:      flow.flowName,
      adGroupId:     (flow.bizLineId as string) ?? '',
      minApprovers:  flow.minApprovers,
      samePerson:    flow.samePersionRestriction,
      steps:         flow.steps.map(s => ({ approverGroupId: s.approverGroupId, approverGroupName: s.approverGroupName })),
    };
  }

  function handleAddFlow(form: FlowFormState) {
    const flow: ApprovalFlow = {
      flowId:                 `flow-${selectedMarketId.toLowerCase()}-${Date.now()}`,
      flowName:               form.flowName.trim(),
      marketId:               selectedMarketId,
      bizLineId:              form.adGroupId as any,
      minApprovers:           form.minApprovers,
      samePersionRestriction: form.samePerson,
      steps:                  form.steps.map((s, i) => ({
        stepOrder: i + 1, approverGroupId: s.approverGroupId, approverGroupName: s.approverGroupName,
      })),
    };
    dispatch({ type: 'ADD_APPROVAL_FLOW', flow });
    setShowAddFlow(false);
  }

  function handleEditFlow(form: FlowFormState) {
    if (!editingFlow) return;
    dispatch({ type: 'EDIT_APPROVAL_FLOW', flowId: editingFlow.flowId, flow: {
      ...editingFlow,
      flowName:               form.flowName.trim(),
      bizLineId:              form.adGroupId as any,
      minApprovers:           form.minApprovers,
      samePersionRestriction: form.samePerson,
      steps:                  form.steps.map((s, i) => ({
        stepOrder: i + 1, approverGroupId: s.approverGroupId, approverGroupName: s.approverGroupName,
      })),
    }});
    setEditingFlow(null);
  }

  function handleDeleteFlow() {
    if (!deletingFlow) return;
    dispatch({ type: 'DELETE_APPROVAL_FLOW', flowId: deletingFlow.flowId });
    setDeletingFlow(null);
  }

  // Flow for a given group (1-to-1 constraint lookup)
  function flowForGroup(groupId: string) {
    return marketFlows.find(f => (f.bizLineId as string) === groupId);
  }

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'ad-groups',      label: 'AD Groups',       icon: '👥' },
    { id: 'approval-flows', label: 'Approval Flows',  icon: '⚙️' },
    { id: 'wechat',         label: 'WeChat Accounts', icon: '💬' },
  ];

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: 'var(--surface-bg)' }}>

      {/* ── Market list sidebar ────────────────────────────────────────── */}
      <div style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface-panel)',
        borderRight: '1px solid var(--surface-border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Sidebar header + add button */}
        <div style={{
          padding: '12px 14px', borderBottom: '1px solid var(--surface-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Markets</div>
          <button
            onClick={() => { setShowAddMarket(v => !v); setEditingMarket(null); }}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              border: 'none', background: 'var(--hsbc-red)', color: '#fff', fontWeight: 600,
            }}
          >{showAddMarket ? 'Cancel' : '+ Add'}</button>
        </div>

        {/* Add market inline form */}
        {showAddMarket && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--surface-border)', overflowY: 'auto' }}>
            <MarketForm
              onSave={handleAddMarket}
              onCancel={() => setShowAddMarket(false)}
            />
          </div>
        )}

        {/* Market list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {markets.map(market => {
            const isSelected = market.marketId === selectedMarketId;
            return (
              <div key={market.marketId} style={{ position: 'relative' }}>
                <div
                  onClick={() => {
                    setSelectedMarketId(market.marketId);
                    setShowAddMarket(false); setEditingMarket(null);
                    setShowAddGroup(false); setEditingGroup(null);
                    setShowAddFlow(false);  setEditingFlow(null);
                    setShowAddWechat(false);
                  }}
                  style={{
                    padding: '10px 14px 10px 18px', cursor: 'pointer',
                    borderLeft: isSelected ? '3px solid var(--hsbc-red)' : '3px solid transparent',
                    background: isSelected ? 'rgba(219,0,17,0.05)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--hsbc-red)' : 'var(--text-primary)',
                    }}>{market.marketId} — {market.marketName.split('(')[0].trim()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{market.tzLabel}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: market.active ? '#22c55e' : '#94a3b8',
                    }} />
                    {/* Edit button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedMarketId(market.marketId);
                        setEditingMarket(market);
                        setShowAddMarket(false);
                      }}
                      title="Edit market"
                      style={{
                        padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                        border: '1px solid var(--surface-border)', background: 'transparent',
                        color: 'var(--text-muted)',
                      }}
                    >✎</button>
                    {/* Delete button — disabled for GLOBAL */}
                    {market.marketId !== 'GLOBAL' && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingMarket(market); }}
                        title="Delete market"
                        style={{
                          padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                          border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                          color: '#ef4444',
                        }}
                      >✕</button>
                    )}
                  </div>
                </div>
                {/* Inline edit form */}
                {editingMarket?.marketId === market.marketId && (
                  <div style={{ padding: '0 10px 10px', background: 'rgba(219,0,17,0.03)', borderBottom: '1px solid var(--surface-border)' }}>
                    <MarketForm
                      initial={{ marketId: market.marketId, marketName: market.marketName, timezone: market.timezone, tzLabel: market.tzLabel, active: market.active }}
                      isEdit
                      onSave={handleEditMarket}
                      onCancel={() => setEditingMarket(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Market detail header ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Market header */}
        <div style={{
          padding: '14px 24px', background: 'var(--surface-panel)',
          borderBottom: '1px solid var(--surface-border)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedMarket?.marketName ?? selectedMarketId}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              ID: {selectedMarketId}
              {selectedMarket?.tzLabel && <> · {selectedMarket.tzLabel}</>}
              &nbsp;·&nbsp;
              {selectedMarket?.active
                ? <span style={{ color: '#22c55e' }}>● Active</span>
                : <span style={{ color: 'var(--text-muted)' }}>● Inactive</span>
              }
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{marketGroups.length} groups</span>
            <span>·</span>
            <span>{marketFlows.length} flows</span>
            <span>·</span>
            <span>{marketAccounts.length} WeChat accounts</span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--surface-border)',
          background: 'var(--surface-panel)', padding: '0 24px', flexShrink: 0,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowAddGroup(false); setEditingGroup(null);
                setShowAddFlow(false);  setEditingFlow(null);
                setShowAddWechat(false);
              }}
              style={{
                padding: '10px 16px', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--hsbc-red)' : '2px solid transparent',
                background: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? 'var(--hsbc-red)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.12s',
              }}
            >{tab.icon} {tab.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── AD GROUPS TAB ──────────────────────────────────────────── */}
          {activeTab === 'ad-groups' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  AD Groups — {selectedMarketId}
                </div>
                <button
                  onClick={() => { setShowAddGroup(true); setEditingGroup(null); }}
                  style={{
                    padding: '7px 14px', borderRadius: 6, border: 'none',
                    background: 'var(--hsbc-red)', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >+ New Group</button>
              </div>

              {/* Inline add form */}
              {showAddGroup && !editingGroup && (
                <ADGroupForm
                  marketId={selectedMarketId}
                  onSave={handleAddGroup}
                  onCancel={() => setShowAddGroup(false)}
                />
              )}

              {marketGroups.length === 0 && !showAddGroup ? (
                <EmptyState icon="👥" message="No AD groups configured for this market." />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                      <th style={thSt}>Group Name</th>
                      <th style={thSt}>Biz Line</th>
                      <th style={thSt}>Type</th>
                      <th style={thSt}>Approval Flow</th>
                      <th style={{ ...thSt, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketGroups.map(g => {
                      const linkedFlow = flowForGroup(g.groupId);
                      return (
                        <React.Fragment key={g.groupId}>
                          <tr
                            style={{
                              borderBottom: editingGroup?.groupId === g.groupId
                                ? 'none' : '1px solid var(--surface-border)',
                              background: editingGroup?.groupId === g.groupId
                                ? 'rgba(219,0,17,0.04)' : 'transparent',
                            }}
                          >
                            <td style={tdSt}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{g.groupName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{g.groupId}</div>
                            </td>
                            <td style={tdSt}>
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                background: 'rgba(219,0,17,0.08)', color: 'var(--hsbc-red)',
                              }}>{g.bizLineId}</span>
                            </td>
                            <td style={tdSt}>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                                background: 'var(--surface-bg)', color: 'var(--text-secondary)',
                                border: '1px solid var(--surface-border)',
                              }}>{g.groupType.replace(/_/g, ' ')}</span>
                            </td>
                            <td style={tdSt}>
                              {linkedFlow ? (
                                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>
                                  ✓ {linkedFlow.flowName}
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  No flow assigned
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdSt, textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <ActionBtn
                                  label="Edit"
                                  onClick={() => { setEditingGroup(g); setShowAddGroup(false); }}
                                />
                                <ActionBtn
                                  label="Delete"
                                  danger
                                  onClick={() => setDeletingGroup(g)}
                                />
                              </div>
                            </td>
                          </tr>
                          {/* Inline edit form below the row */}
                          {editingGroup?.groupId === g.groupId && (
                            <tr>
                              <td colSpan={5} style={{ padding: '0 0 12px 0', background: 'rgba(219,0,17,0.04)' }}>
                                <div style={{ padding: '0 14px' }}>
                                  <ADGroupForm
                                    initial={{
                                      groupName: g.groupName,
                                      bizLineId: g.bizLineId,
                                      groupType: g.groupType,
                                    }}
                                    marketId={selectedMarketId}
                                    onSave={handleEditGroup}
                                    onCancel={() => setEditingGroup(null)}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── APPROVAL FLOWS TAB ─────────────────────────────────────── */}
          {activeTab === 'approval-flows' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Approval Flows — {selectedMarketId}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Each AD group may have at most one approval flow.
                  </div>
                </div>
                <button
                  onClick={() => { setShowAddFlow(true); setEditingFlow(null); }}
                  disabled={showAddFlow}
                  style={{
                    padding: '7px 14px', borderRadius: 6, border: 'none',
                    background: showAddFlow ? 'var(--surface-border)' : 'var(--hsbc-red)',
                    color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: showAddFlow ? 'default' : 'pointer',
                  }}
                >+ New Flow</button>
              </div>

              {/* Inline add form */}
              {showAddFlow && !editingFlow && (
                <div style={{ marginTop: 14 }}>
                  <FlowForm
                    marketGroups={marketGroups}
                    existingFlows={marketFlows}
                    onSave={handleAddFlow}
                    onCancel={() => setShowAddFlow(false)}
                  />
                </div>
              )}

              {marketFlows.length === 0 && !showAddFlow ? (
                <EmptyState icon="⚙️" message="No approval flows configured for this market." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {marketFlows.map(flow => {
                    const linkedGroupId = (flow.bizLineId as string) ?? '';
                    const linkedGroup   = adGroups.find(g => g.groupId === linkedGroupId);
                    const isEditing     = editingFlow?.flowId === flow.flowId;

                    return (
                      <div key={flow.flowId}>
                        {isEditing ? (
                          <FlowForm
                            initial={flowFormFromFlow(flow)}
                            editingFlowId={flow.flowId}
                            marketGroups={marketGroups}
                            existingFlows={marketFlows}
                            onSave={handleEditFlow}
                            onCancel={() => setEditingFlow(null)}
                          />
                        ) : (
                          <div style={{
                            background: 'var(--surface-panel)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 8, padding: '14px 18px',
                          }}>
                            {/* Flow header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                  {flow.flowName}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                                  <span>{flow.steps.length} step{flow.steps.length !== 1 ? 's' : ''}</span>
                                  <span>·</span>
                                  <span>Min {flow.minApprovers} approver{flow.minApprovers !== 1 ? 's' : ''}</span>
                                  {flow.samePersionRestriction && (
                                    <>
                                      <span>·</span>
                                      <span style={{ color: '#d97706' }}>Same-person restriction</span>
                                    </>
                                  )}
                                  {linkedGroup && (
                                    <>
                                      <span>·</span>
                                      <span>
                                        Linked to <strong style={{ color: 'var(--text-primary)' }}>{linkedGroup.groupName}</strong>
                                      </span>
                                    </>
                                  )}
                                  {!linkedGroup && linkedGroupId && (
                                    <>
                                      <span>·</span>
                                      <span style={{ color: '#ef4444' }}>Linked group not found</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <ActionBtn label="Edit" onClick={() => { setEditingFlow(flow); setShowAddFlow(false); }} />
                                <ActionBtn label="Delete" danger onClick={() => setDeletingFlow(flow)} />
                              </div>
                            </div>

                            {/* Step list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {flow.steps.map(step => (
                                <div key={step.stepOrder} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: 'var(--hsbc-navy)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                                  }}>{step.stepOrder}</span>
                                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {step.approverGroupName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── WECHAT ACCOUNTS TAB ────────────────────────────────────── */}
          {activeTab === 'wechat' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  WeChat Service Accounts — {selectedMarketId}
                </div>
                <button
                  onClick={() => setShowAddWechat(v => !v)}
                  style={{
                    padding: '7px 14px', borderRadius: 6, border: 'none',
                    background: 'var(--hsbc-red)', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >{showAddWechat ? 'Cancel' : '+ Add Account'}</button>
              </div>

              {showAddWechat && <AddWeChatForm marketId={selectedMarketId} onDone={() => setShowAddWechat(false)} />}

              {marketAccounts.length === 0 && !showAddWechat ? (
                <EmptyState icon="💬" message="No WeChat Service Accounts assigned to this market." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {marketAccounts.map(account => {
                    const mktEntry = account.assignedMarkets.find(m => m.marketId === selectedMarketId);
                    const isDefault = mktEntry?.isDefault ?? false;
                    return (
                      <div key={account.accountId} style={{
                        background: 'var(--surface-panel)', border: '1px solid var(--surface-border)',
                        borderRadius: 8, padding: '14px 18px',
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                          background: '#07C160', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 18,
                        }}>💬</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{account.displayName}</span>
                            {isDefault && (
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                background: 'rgba(200,169,81,0.2)', color: '#92671A',
                                padding: '1px 6px', borderRadius: 4,
                              }}>★ Default</span>
                            )}
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                              background: account.active ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.15)',
                              color: account.active ? '#22c55e' : '#94a3b8',
                            }}>{account.active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {account.wechatName} · {account.appid} · {account.accountType.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {(account.followerCount / 1000).toFixed(0)}K followers · Scope: {account.scope}
                            {account.verified && ' · ✓ Verified'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {!isDefault && (
                            <ActionBtn label="Set Default" onClick={() => alert('[DEMO] Set as default')} />
                          )}
                          <ActionBtn label="Deactivate" danger onClick={() => alert('[DEMO] Deactivate')} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm delete modals ──────────────────────────────────────── */}
      {deletingMarket && (
        <ConfirmDeleteModal
          title={`Delete market "${deletingMarket.marketId}"?`}
          body={
            (adGroups.filter(g => g.marketId === deletingMarket.marketId).length > 0 ||
             approvalFlows.filter(f => f.marketId === deletingMarket.marketId).length > 0)
              ? `This market has ${adGroups.filter(g => g.marketId === deletingMarket.marketId).length} AD group(s) and ${approvalFlows.filter(f => f.marketId === deletingMarket.marketId).length} approval flow(s). All will be permanently deleted. This action cannot be undone.`
              : `"${deletingMarket.marketName}" will be permanently removed from the platform. This action cannot be undone.`
          }
          onConfirm={handleDeleteMarket}
          onCancel={() => setDeletingMarket(null)}
        />
      )}

      {deletingGroup && (
        <ConfirmDeleteModal
          title={`Delete "${deletingGroup.groupName}"?`}
          body={
            flowForGroup(deletingGroup.groupId)
              ? `This group has an approval flow ("${flowForGroup(deletingGroup.groupId)!.flowName}") linked to it. Deleting the group will also delete that flow. This action cannot be undone.`
              : 'This will permanently remove the AD group from this market. This action cannot be undone.'
          }
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeletingGroup(null)}
        />
      )}

      {deletingFlow && (
        <ConfirmDeleteModal
          title={`Delete flow "${deletingFlow.flowName}"?`}
          body="This approval flow will be permanently removed. Pages currently using this flow will fall back to the market default. This action cannot be undone."
          onConfirm={handleDeleteFlow}
          onCancel={() => setDeletingFlow(null)}
        />
      )}
    </div>
  );
}

// ─── Add WeChat account inline form ───────────────────────────────────────────

function AddWeChatForm({ marketId, onDone }: { marketId: string; onDone: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [wechatName,  setWechatName]  = useState('');
  const [appid,       setAppid]       = useState('');
  const [accountType, setAccountType] = useState<WeChatServiceAccount['accountType']>('SERVICE_ACCOUNT');
  const [scope,       setScope]       = useState<'MARKET' | 'GLOBAL'>('MARKET');

  return (
    <div style={{
      background: 'var(--surface-bg)', border: '1.5px solid var(--surface-border)',
      borderRadius: 8, padding: '16px 18px', marginBottom: 14,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        Add WeChat Service Account — {marketId}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Display Name', value: displayName, set: setDisplayName, placeholder: 'HSBC HK Wealth SA' },
          { label: 'WeChat Name',  value: wechatName,  set: setWechatName,  placeholder: '汇丰財富' },
          { label: 'App ID',       value: appid,       set: setAppid,       placeholder: 'wx_...' },
        ].map(f => (
          <div key={f.label}>
            <label style={labelSt}>{f.label}</label>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputSt} />
          </div>
        ))}
        <div>
          <label style={labelSt}>Account Type</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value as any)} style={inputSt}>
            <option value="SERVICE_ACCOUNT">Service Account</option>
            <option value="SUBSCRIPTION_ACCOUNT">Subscription Account</option>
          </select>
        </div>
        <div>
          <label style={labelSt}>Scope</label>
          <select value={scope} onChange={e => setScope(e.target.value as any)} style={inputSt}>
            <option value="MARKET">Market</option>
            <option value="GLOBAL">Global</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { alert(`[DEMO] Account "${displayName}" would be created`); onDone(); }}
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            background: 'var(--hsbc-red)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >Save Account</button>
        <button
          onClick={onDone}
          style={{
            padding: '7px 18px', borderRadius: 6,
            border: '1px solid var(--surface-border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}
