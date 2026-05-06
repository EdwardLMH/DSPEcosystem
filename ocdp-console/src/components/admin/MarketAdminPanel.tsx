import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { Market } from '../../types/ocdp';

function MarketRow({ market, onEdit, onDelete }: { market: Market; onEdit: (m: Market) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{market.marketName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{market.timezone} · {market.tzLabel}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: market.active ? '#D1FAE5' : '#F3F4F6', color: market.active ? '#059669' : '#9CA3AF' }}>
        {market.active ? 'Active' : 'Inactive'}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{market.marketId}</span>
      <button onClick={() => onEdit(market)} style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Edit</button>
      <button onClick={() => onDelete(market.marketId)} style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Delete</button>
    </div>
  );
}

export function MarketAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { markets } = state;
  const [editing, setEditing] = useState<Market | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Partial<Market>>({});

  function openNew() { setForm({ marketId: '', marketName: '', active: true, timezone: 'UTC', tzLabel: 'UTC (UTC+0)' }); setEditing(null); setShowNew(true); }
  function openEdit(m: Market) { setForm({ ...m }); setEditing(m); setShowNew(true); }
  function save() {
    if (!form.marketId || !form.marketName) return;
    const market = { marketId: form.marketId!, marketName: form.marketName!, active: !!form.active, timezone: form.timezone ?? 'UTC', tzLabel: form.tzLabel ?? 'UTC (UTC+0)' };
    if (editing) dispatch({ type: 'EDIT_MARKET', oldMarketId: editing.marketId, market });
    else dispatch({ type: 'ADD_MARKET', market });
    setShowNew(false);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Market Administration</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Configure delivery markets and release targets</p>
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Market</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface-panel)', margin: 24, borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', background: 'var(--surface-active)', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 12 }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', width: 50 }}>ID</span>
          <span style={{ width: 120 }} />
        </div>
        {markets.map(m => <MarketRow key={m.marketId} market={m} onEdit={openEdit} onDelete={id => dispatch({ type: 'DELETE_MARKET', marketId: id })} />)}
      </div>

      {/* Edit / New Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNew(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{editing ? 'Edit Market' : 'Add Market'}</h2>
            {(['marketId', 'marketName', 'timezone', 'tzLabel'] as const).map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{field}</label>
                <input value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              <span style={{ fontSize: 13 }}>Active</span>
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNew(false)} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={save} style={{ padding: '9px 20px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
