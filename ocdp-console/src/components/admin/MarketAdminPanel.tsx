import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { Market } from '../../types/ocdp';

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

function MarketRow({ market, onEdit, onDelete, authorGroupName, approverGroupName }: {
  market: Market;
  onEdit: (m: Market) => void;
  onDelete: (id: string) => void;
  authorGroupName?: string;
  approverGroupName?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{market.marketName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{market.timezone} · {market.tzLabel}</div>
        {(authorGroupName || approverGroupName) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {authorGroupName && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#DBEAFE', color: '#1D4ED8' }}>
                Author: {authorGroupName}
              </span>
            )}
            {approverGroupName && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#D1FAE5', color: '#059669' }}>
                Approver: {approverGroupName}
              </span>
            )}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: market.active ? '#D1FAE5' : '#F3F4F6', color: market.active ? '#059669' : '#9CA3AF', flexShrink: 0 }}>
        {market.active ? 'Active' : 'Inactive'}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011', flexShrink: 0 }}>{market.marketId}</span>
      <button onClick={() => onEdit(market)} style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>Edit</button>
      <button onClick={() => onDelete(market.marketId)} style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>Delete</button>
    </div>
  );
}

export function MarketAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { markets, adGroups } = state;
  const [editing, setEditing] = useState<Market | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Market>>({});

  function openNew() {
    setForm({ marketId: '', marketName: '', active: true, timezone: 'UTC', tzLabel: 'UTC (UTC+0)' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(m: Market) {
    setForm({ ...m });
    setEditing(m);
    setShowForm(true);
  }

  function save() {
    if (!form.marketId || !form.marketName) return;
    const market: Market = {
      marketId: form.marketId,
      marketName: form.marketName,
      active: !!form.active,
      timezone: form.timezone ?? 'UTC',
      tzLabel: form.tzLabel ?? 'UTC (UTC+0)',
      defaultAuthorGroupId: form.defaultAuthorGroupId || undefined,
      defaultApproverGroupId: form.defaultApproverGroupId || undefined,
    };
    if (editing) dispatch({ type: 'EDIT_MARKET', oldMarketId: editing.marketId, market });
    else dispatch({ type: 'ADD_MARKET', market });
    setShowForm(false);
  }

  // For the form: global groups are always shown as fallback options
  const globalAuthorGroups   = adGroups.filter(g => g.marketId === 'GLOBAL' && (g.groupType === 'AD_GROUP'));
  const globalApproverGroups = adGroups.filter(g => g.marketId === 'GLOBAL' && (g.groupType === 'ADMIN_GROUP'));

  const formMarketAuthorGroups   = form.marketId
    ? adGroups.filter(g => g.marketId === form.marketId && g.groupType === 'AD_GROUP')
    : [];
  const formMarketApproverGroups = form.marketId
    ? adGroups.filter(g => g.marketId === form.marketId && g.groupType === 'ADMIN_GROUP')
    : [];

  const authorOptions   = [...formMarketAuthorGroups, ...globalAuthorGroups.filter(g => !formMarketAuthorGroups.find(f => f.groupId === g.groupId))];
  const approverOptions = [...formMarketApproverGroups, ...globalApproverGroups.filter(g => !formMarketApproverGroups.find(f => f.groupId === g.groupId))];

  function groupName(id?: string) {
    return adGroups.find(g => g.groupId === id)?.groupName;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Market Administration</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Configure delivery markets and their default AD groups</p>
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Market
        </button>
      </div>

      {/* Info callout */}
      <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 12, color: '#1D4ED8', lineHeight: 1.6, flexShrink: 0 }}>
        <strong>Default AD Group rules:</strong> Each market may nominate a default author AD group and a default approver AD group.
        If not set, the <strong>Global Admin Group</strong> (GLOBAL market) serves as the fallback approver for all markets,
        and the <strong>Global Wealth AD Group</strong> serves as the fallback author group.
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 20px', background: 'var(--surface-active)', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 12 }}>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', width: 60 }}>Status</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', width: 50 }}>ID</span>
            <span style={{ width: 130 }} />
          </div>
          {markets.map(m => (
            <MarketRow
              key={m.marketId}
              market={m}
              onEdit={openEdit}
              onDelete={id => dispatch({ type: 'DELETE_MARKET', marketId: id })}
              authorGroupName={groupName(m.defaultAuthorGroupId)}
              approverGroupName={groupName(m.defaultApproverGroupId)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{editing ? 'Edit Market' : 'Add Market'}</h2>

            {/* Core fields */}
            {(['marketId', 'marketName', 'timezone', 'tzLabel'] as const).map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {field === 'marketId' ? 'Market ID' : field === 'marketName' ? 'Market Name' : field === 'timezone' ? 'Timezone' : 'Timezone Label'}
                </label>
                <input
                  value={form[field] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  disabled={!!editing && field === 'marketId'}
                  style={{ ...inp, background: editing && field === 'marketId' ? '#F9FAFB' : '#fff', color: editing && field === 'marketId' ? 'var(--text-muted)' : 'inherit' }}
                />
              </div>
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#DB0011' }} />
              <span style={{ fontSize: 13 }}>Active</span>
            </label>

            <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0 20px' }} />

            {/* Default AD group selectors */}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
              Set the default AD groups that apply to authors and approvers in this market.
              Global groups are available as fallbacks when a market-specific group is not found.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Default Author AD Group
              </label>
              <select
                value={form.defaultAuthorGroupId ?? ''}
                onChange={e => setForm(f => ({ ...f, defaultAuthorGroupId: e.target.value || undefined }))}
                style={sel}
              >
                <option value="">— Inherit from Global —</option>
                {authorOptions.map(g => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.groupName}{g.marketId === 'GLOBAL' ? ' (Global)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Default Approver AD Group
              </label>
              <select
                value={form.defaultApproverGroupId ?? ''}
                onChange={e => setForm(f => ({ ...f, defaultApproverGroupId: e.target.value || undefined }))}
                style={sel}
              >
                <option value="">— Inherit from Global —</option>
                {approverOptions.map(g => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.groupName}{g.marketId === 'GLOBAL' ? ' (Global)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={save} style={{ padding: '9px 20px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
