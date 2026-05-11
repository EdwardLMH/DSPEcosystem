import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { BizLine, AdGroup, BizLineId } from '../../types/ocdp';
import { v4 } from '../../utils/uuid';

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

// ─── Biz Line modal ───────────────────────────────────────────────────────────

interface BizLineModalProps {
  initial: Partial<BizLine>;
  onSave: (b: BizLine) => void;
  onClose: () => void;
}

function BizLineModal({ initial, onSave, onClose }: BizLineModalProps) {
  const [form, setForm] = useState<Partial<BizLine>>(initial);
  const isNew = !initial.bizLineId;
  const canSave = !!form.bizLineId && !!form.displayName;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{isNew ? 'Add Value Stream' : 'Edit Value Stream'}</h2>

        {(['bizLineId', 'displayName', 'description'] as const).map(field => (
          <div key={field} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {field === 'bizLineId' ? 'Stream ID' : field === 'displayName' ? 'Display Name' : 'Description'}
            </label>
            <input
              value={form[field] ?? ''}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              disabled={!isNew && field === 'bizLineId'}
              style={{ ...inp, background: !isNew && field === 'bizLineId' ? '#F9FAFB' : '#fff', color: !isNew && field === 'bizLineId' ? 'var(--text-muted)' : 'inherit' }}
            />
          </div>
        ))}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#DB0011' }} />
          <span style={{ fontSize: 13 }}>Active</span>
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
          <button
            onClick={() => canSave && onSave({ bizLineId: form.bizLineId!, displayName: form.displayName!, description: form.description ?? '', active: !!form.active })}
            disabled={!canSave}
            style={{ padding: '9px 20px', background: canSave ? 'var(--hsbc-red)' : '#F3F4F6', color: canSave ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AD Group modal ───────────────────────────────────────────────────────────

interface AdGroupModalProps {
  bizLineId: BizLineId;
  markets: { marketId: string; marketName: string }[];
  onSave: (g: AdGroup) => void;
  onClose: () => void;
}

function AdGroupModal({ bizLineId, markets, onSave, onClose }: AdGroupModalProps) {
  const [form, setForm] = useState<Partial<AdGroup>>({ bizLineId, groupType: 'AD_GROUP', marketId: markets[0]?.marketId ?? '' });
  const canSave = !!form.groupName && !!form.marketId;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Add AD Group</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 20px' }}>Linked to value stream: <strong>{bizLineId}</strong></p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Group Name</label>
          <input value={form.groupName ?? ''} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))} style={inp} placeholder="e.g. HK Wealth Approvers" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Market</label>
          <select value={form.marketId} onChange={e => setForm(f => ({ ...f, marketId: e.target.value }))} style={sel}>
            {markets.map(m => <option key={m.marketId} value={m.marketId}>{m.marketName}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Group Type</label>
          <select value={form.groupType ?? 'AD_GROUP'} onChange={e => setForm(f => ({ ...f, groupType: e.target.value as AdGroup['groupType'] }))} style={sel}>
            <option value="AD_GROUP">AD Group (Authors)</option>
            <option value="ADMIN_GROUP">Admin Group (Approvers)</option>
            <option value="AUDIT_GROUP">Audit Group</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
          <button
            onClick={() => canSave && onSave({ groupId: v4().slice(0, 12), groupName: form.groupName!, marketId: form.marketId!, bizLineId: form.bizLineId as BizLineId, groupType: form.groupType ?? 'AD_GROUP' })}
            disabled={!canSave}
            style={{ padding: '9px 20px', background: canSave ? 'var(--hsbc-red)' : '#F3F4F6', color: canSave ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            Add Group
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group type styles ────────────────────────────────────────────────────────

function groupTypeBadge(type: AdGroup['groupType']): React.CSSProperties {
  if (type === 'ADMIN_GROUP') return { background: '#FEF3C7', color: '#D97706' };
  if (type === 'AUDIT_GROUP') return { background: '#EDE9FE', color: '#7C3AED' };
  return { background: '#DBEAFE', color: '#2563EB' };
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ValueStreamAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { bizLines, adGroups, markets } = state;

  const [selectedId, setSelectedId] = useState<string | null>(bizLines[0]?.bizLineId ?? null);
  const [showBizModal, setShowBizModal] = useState(false);
  const [editingBiz, setEditingBiz] = useState<BizLine | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const selected = bizLines.find(b => b.bizLineId === selectedId) ?? null;
  const streamGroups = adGroups.filter(g => g.bizLineId === selectedId);

  // Build a set of groupIds used as market defaults across all markets
  const defaultGroupIds = new Set<string>();
  for (const m of markets) {
    if (m.defaultAuthorGroupId)   defaultGroupIds.add(m.defaultAuthorGroupId);
    if (m.defaultApproverGroupId) defaultGroupIds.add(m.defaultApproverGroupId);
  }

  // Markets that reference a given groupId as their default
  function defaultMarketsFor(groupId: string): string[] {
    return markets
      .filter(m => m.defaultAuthorGroupId === groupId || m.defaultApproverGroupId === groupId)
      .map(m => m.marketId);
  }

  function openNewBiz() { setEditingBiz(null); setShowBizModal(true); }
  function openEditBiz(b: BizLine) { setEditingBiz(b); setShowBizModal(true); }

  function saveBiz(b: BizLine) {
    if (editingBiz) dispatch({ type: 'EDIT_BIZ_LINE', bizLineId: editingBiz.bizLineId, updates: b });
    else { dispatch({ type: 'ADD_BIZ_LINE', bizLine: b }); setSelectedId(b.bizLineId); }
    setShowBizModal(false);
  }

  function deleteBiz(bizLineId: string) {
    dispatch({ type: 'DELETE_BIZ_LINE', bizLineId });
    if (selectedId === bizLineId) setSelectedId(bizLines.find(b => b.bizLineId !== bizLineId)?.bizLineId ?? null);
  }

  function saveGroup(g: AdGroup) {
    dispatch({ type: 'ADD_AD_GROUP', group: g });
    setShowGroupModal(false);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Value Streams &amp; Business Lines</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Manage value streams and their associated AD groups per market</p>
        </div>
        <button onClick={openNewBiz} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Value Stream
        </button>
      </div>

      {/* Body: master-detail */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Left: stream list */}
        <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border-light)', background: 'var(--surface-panel)', overflowY: 'auto' }}>
          {bizLines.length === 0 && (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No value streams yet.</div>
          )}
          {bizLines.map(b => {
            const isActive = b.bizLineId === selectedId;
            const groupCount = adGroups.filter(g => g.bizLineId === b.bizLineId).length;
            return (
              <div
                key={b.bizLineId}
                onClick={() => setSelectedId(b.bizLineId)}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  borderLeft: isActive ? '3px solid var(--hsbc-red)' : '3px solid transparent',
                  background: isActive ? 'rgba(219,0,17,0.04)' : 'transparent',
                  borderBottom: '1px solid var(--border-light)',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'var(--hsbc-red)' : 'var(--text-primary)' }}>{b.displayName}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: b.active ? '#D1FAE5' : '#F3F4F6', color: b.active ? '#059669' : '#9CA3AF' }}>
                    {b.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{b.bizLineId}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{groupCount} group{groupCount !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>

        {/* Right: detail */}
        {selected ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

            {/* Stream details card */}
            <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{selected.displayName}</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{selected.bizLineId}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEditBiz(selected)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteBiz(selected.bizLineId)} style={{ padding: '7px 14px', fontSize: 12, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              {selected.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{selected.description}</p>}
            </div>

            {/* AD Groups for this stream */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AD Groups</h3>
              <button onClick={() => setShowGroupModal(true)} style={{ padding: '7px 14px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + Add Group
              </button>
            </div>

            {streamGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                No AD groups assigned to this value stream yet.
              </div>
            ) : (
              <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                {streamGroups.map((g, i) => (
                  <div key={g.groupId} style={{ padding: '14px 20px', borderBottom: i < streamGroups.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{g.groupName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.groupId}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', flexShrink: 0 }}>
                      {markets.find(m => m.marketId === g.marketId)?.marketName ?? g.marketId}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, flexShrink: 0, ...groupTypeBadge(g.groupType) }}>
                      {g.groupType}
                    </span>
                    {defaultGroupIds.has(g.groupId) && (
                      <span
                        title={`Default for: ${defaultMarketsFor(g.groupId).join(', ')}`}
                        style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', flexShrink: 0, cursor: 'help' }}
                      >
                        DEFAULT ★
                      </span>
                    )}
                    <button
                      onClick={() => dispatch({ type: 'DELETE_AD_GROUP', groupId: g.groupId })}
                      style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Select a value stream to manage its AD groups
          </div>
        )}
      </div>

      {/* Biz Line modal */}
      {showBizModal && (
        <BizLineModal
          initial={editingBiz ?? { active: true }}
          onSave={saveBiz}
          onClose={() => setShowBizModal(false)}
        />
      )}

      {/* AD Group modal */}
      {showGroupModal && selected && (
        <AdGroupModal
          bizLineId={selected.bizLineId as BizLineId}
          markets={markets.filter(m => m.active)}
          onSave={saveGroup}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
}
