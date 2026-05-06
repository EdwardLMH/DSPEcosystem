import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { BizLine } from '../../types/ocdp';

export function BizLineAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { bizLines } = state;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BizLine | null>(null);
  const [form, setForm] = useState<Partial<BizLine>>({});

  function openNew() { setForm({ bizLineId: '', displayName: '', description: '', active: true }); setEditing(null); setShowForm(true); }
  function openEdit(b: BizLine) { setForm({ ...b }); setEditing(b); setShowForm(true); }
  function save() {
    if (!form.bizLineId || !form.displayName) return;
    const biz = { bizLineId: form.bizLineId!, displayName: form.displayName!, description: form.description ?? '', active: !!form.active };
    if (editing) dispatch({ type: 'EDIT_BIZ_LINE', bizLineId: editing.bizLineId, updates: biz });
    else dispatch({ type: 'ADD_BIZ_LINE', bizLine: biz });
    setShowForm(false);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Business Line Administration</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Manage business dimensions for delivery targeting</p>
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Biz Line</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {bizLines.map(b => (
            <div key={b.bizLineId} style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{b.bizLineId}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: b.active ? '#D1FAE5' : '#F3F4F6', color: b.active ? '#059669' : '#9CA3AF' }}>
                  {b.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{b.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>{b.description}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(b)} style={{ flex: 1, padding: '7px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => dispatch({ type: 'DELETE_BIZ_LINE', bizLineId: b.bizLineId })} style={{ padding: '7px 12px', fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{editing ? 'Edit Business Line' : 'Add Business Line'}</h2>
            {(['bizLineId', 'displayName', 'description'] as const).map(field => (
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
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={save} style={{ padding: '9px 20px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
