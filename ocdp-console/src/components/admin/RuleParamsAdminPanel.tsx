import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { CustomerSegmentDef, AccountTypeDef, LocationDef } from '../../types/ocdp';

type Tab = 'segments' | 'account-types' | 'locations';

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};

// ─── Generic CRUD table ───────────────────────────────────────────────────────

interface RowDef {
  id: string;
  displayName: string;
  description: string;
  active: boolean;
}

interface CrudTableProps {
  rows: RowDef[];
  idLabel: string;
  onAdd: (r: RowDef) => void;
  onEdit: (id: string, updates: Partial<RowDef>) => void;
  onDelete: (id: string) => void;
}

function CrudTable({ rows, idLabel, onAdd, onEdit, onDelete }: CrudTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RowDef | null>(null);
  const [form, setForm] = useState<Partial<RowDef>>({});

  function openNew() { setForm({ active: true }); setEditing(null); setShowForm(true); }
  function openEdit(r: RowDef) { setForm({ ...r }); setEditing(r); setShowForm(true); }

  function save() {
    if (!form.id || !form.displayName) return;
    const row: RowDef = { id: form.id, displayName: form.displayName, description: form.description ?? '', active: !!form.active };
    if (editing) onEdit(editing.id, row);
    else onAdd(row);
    setShowForm(false);
  }

  const canSave = !!form.id && !!form.displayName;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={openNew} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Entry
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14, background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          No entries yet. Add one to get started.
        </div>
      ) : (
        <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <div
              key={r.id}
              style={{ padding: '14px 20px', borderBottom: i < rows.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}
            >
              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.active ? '#059669' : '#D1D5DB', flexShrink: 0 }} title={r.active ? 'Active' : 'Inactive'} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{r.displayName}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{r.id}</span>
                </div>
                {r.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: r.active ? '#D1FAE5' : '#F3F4F6', color: r.active ? '#059669' : '#9CA3AF', flexShrink: 0 }}>
                {r.active ? 'Active' : 'Inactive'}
              </span>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(r)} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => onDelete(r.id)} style={{ padding: '6px 12px', fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForm(false)}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{editing ? 'Edit Entry' : 'Add Entry'}</h2>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{idLabel}</label>
              <input
                value={form.id ?? ''}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                disabled={!!editing}
                placeholder="e.g. premier"
                style={{ ...inp, background: editing ? '#F9FAFB' : '#fff', color: editing ? 'var(--text-muted)' : 'inherit' }}
              />
              {!editing && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Unique identifier used in rule conditions. Cannot be changed after creation.</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Display Name</label>
              <input value={form.displayName ?? ''} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} style={inp} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</label>
              <input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#DB0011' }} />
              <span style={{ fontSize: 13 }}>Active (available in rule conditions)</span>
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button
                onClick={save} disabled={!canSave}
                style={{ padding: '9px 20px', background: canSave ? 'var(--hsbc-red)' : '#F3F4F6', color: canSave ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function RuleParamsAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { customerSegmentDefs, accountTypeDefs, locationDefs } = state;
  const [tab, setTab] = useState<Tab>('segments');

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'segments',      label: 'Customer Segments', count: customerSegmentDefs.length },
    { id: 'account-types', label: 'Account Types',     count: accountTypeDefs.length },
    { id: 'locations',     label: 'Locations',         count: locationDefs.length },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Header + tabs */}
      <div style={{ background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <div style={{ padding: '20px 24px 0' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 3px' }}>Rule Parameters</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Manage the catalogue values used in visibility rule conditions — segments, account types, and locations
          </p>
        </div>
        <div style={{ display: 'flex', padding: '0 24px', gap: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none',
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? 'var(--hsbc-red)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--hsbc-red)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-family)',
              }}
            >
              {t.label}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: tab === t.id ? 'rgba(219,0,17,0.1)' : '#F3F4F6', color: tab === t.id ? '#DB0011' : '#6B7280' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {tab === 'segments' && (
          <CrudTable
            idLabel="Segment ID"
            rows={customerSegmentDefs.map(d => ({ id: d.segmentId, displayName: d.displayName, description: d.description, active: d.active }))}
            onAdd={r => dispatch({ type: 'ADD_CUSTOMER_SEGMENT', def: { segmentId: r.id, displayName: r.displayName, description: r.description, active: r.active } })}
            onEdit={(id, u) => dispatch({ type: 'EDIT_CUSTOMER_SEGMENT', segmentId: id, updates: { displayName: u.displayName, description: u.description, active: u.active } })}
            onDelete={id => dispatch({ type: 'DELETE_CUSTOMER_SEGMENT', segmentId: id })}
          />
        )}

        {tab === 'account-types' && (
          <CrudTable
            idLabel="Type ID"
            rows={accountTypeDefs.map(d => ({ id: d.typeId, displayName: d.displayName, description: d.description, active: d.active }))}
            onAdd={r => dispatch({ type: 'ADD_ACCOUNT_TYPE', def: { typeId: r.id, displayName: r.displayName, description: r.description, active: r.active } })}
            onEdit={(id, u) => dispatch({ type: 'EDIT_ACCOUNT_TYPE', typeId: id, updates: { displayName: u.displayName, description: u.description, active: u.active } })}
            onDelete={id => dispatch({ type: 'DELETE_ACCOUNT_TYPE', typeId: id })}
          />
        )}

        {tab === 'locations' && (
          <CrudTable
            idLabel="Location ID"
            rows={locationDefs.map(d => ({ id: d.locationId, displayName: d.displayName, description: d.description, active: d.active }))}
            onAdd={r => dispatch({ type: 'ADD_LOCATION', def: { locationId: r.id, displayName: r.displayName, description: r.description, active: r.active } })}
            onEdit={(id, u) => dispatch({ type: 'EDIT_LOCATION', locationId: id, updates: { displayName: u.displayName, description: u.description, active: u.active } })}
            onDelete={id => dispatch({ type: 'DELETE_LOCATION', locationId: id })}
          />
        )}
      </div>
    </div>
  );
}
