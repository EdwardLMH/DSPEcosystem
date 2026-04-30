import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { BizLine } from '../../types/ucp';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ActionBtn({ label, danger = false, onClick }: {
  label: string; danger?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
        border: danger ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--surface-border)',
        background: 'transparent', color: danger ? '#ef4444' : 'var(--text-secondary)',
        fontWeight: 500,
      }}
    >{label}</button>
  );
}

function ConfirmDeleteModal({ title, body, onConfirm, onCancel }: {
  title: string; body: string; onConfirm: () => void; onCancel: () => void;
}) {
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

// ─── Biz Line form ─────────────────────────────────────────────────────────────

interface BizLineFormState {
  bizLineId: string;
  displayName: string;
  description: string;
  active: boolean;
}

const EMPTY_FORM: BizLineFormState = { bizLineId: '', displayName: '', description: '', active: true };

function BizLineForm({ initial, isEdit, existingIds, onSave, onCancel }: {
  initial?: BizLineFormState;
  isEdit?: boolean;
  existingIds: string[];
  onSave: (f: BizLineFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BizLineFormState>(initial ?? EMPTY_FORM);

  const idConflict = !isEdit && existingIds.includes(form.bizLineId.trim().toUpperCase());
  const valid = form.bizLineId.trim().length > 0 &&
    form.displayName.trim().length > 0 &&
    !idConflict;

  return (
    <div style={{
      background: 'var(--surface-bg)', border: '1.5px solid var(--surface-border)',
      borderRadius: 8, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        {isEdit ? 'Edit Business Line' : 'New Business Line'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr' : '160px 1fr', gap: 12, marginBottom: 12 }}>
        {!isEdit && (
          <div>
            <label style={labelSt}>Biz Line ID *</label>
            <input
              value={form.bizLineId}
              onChange={e => setForm(p => ({
                ...p,
                bizLineId: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 20),
              }))}
              placeholder="e.g. INSURANCE"
              style={{ ...inputSt, borderColor: idConflict ? '#ef4444' : undefined }}
            />
            {idConflict && (
              <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3 }}>ID already exists</div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
              Uppercase letters, digits, underscores only.
            </div>
          </div>
        )}
        <div>
          <label style={labelSt}>Display Name *</label>
          <input
            value={form.displayName}
            onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
            placeholder="e.g. Insurance & Protection"
            style={inputSt}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelSt}>Description</label>
        <input
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="e.g. Insurance product pages and protection plans"
          style={inputSt}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
          style={{ accentColor: 'var(--hsbc-red)', cursor: 'pointer' }}
        />
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Active — available for page authoring and AD group assignment
        </label>
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
        >{isEdit ? 'Save Changes' : 'Create Biz Line'}</button>
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

export function BizLineAdminPanel() {
  const { state, dispatch } = useUCP();
  const { currentUser, adGroups, bizLines } = state;

  const isAdmin = currentUser.role === 'ADMIN' || !!currentUser.isGlobalAdmin;
  const [showAdd,      setShowAdd]      = useState(false);
  const [editingLine,  setEditingLine]  = useState<BizLine | null>(null);
  const [deletingLine, setDeletingLine] = useState<BizLine | null>(null);

  if (!isAdmin) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, background: 'var(--surface-bg)',
      }}>
        <span style={{ fontSize: 40 }}>🔒</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Access restricted</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin role required to manage business lines.</div>
      </div>
    );
  }

  const existingIds = bizLines.map(b => b.bizLineId);

  function handleAdd(form: BizLineFormState) {
    dispatch({ type: 'ADD_BIZ_LINE', bizLine: {
      bizLineId:   form.bizLineId.trim().toUpperCase(),
      displayName: form.displayName.trim(),
      description: form.description.trim(),
      active:      form.active,
    }});
    setShowAdd(false);
  }

  function handleEdit(form: BizLineFormState) {
    if (!editingLine) return;
    dispatch({ type: 'EDIT_BIZ_LINE', bizLineId: editingLine.bizLineId, updates: {
      displayName: form.displayName.trim(),
      description: form.description.trim(),
      active:      form.active,
    }});
    setEditingLine(null);
  }

  function handleDelete() {
    if (!deletingLine) return;
    dispatch({ type: 'DELETE_BIZ_LINE', bizLineId: deletingLine.bizLineId });
    setDeletingLine(null);
  }

  const activeCount = bizLines.filter(b => b.active).length;

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px', background: 'var(--surface-panel)',
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Business Lines</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {activeCount} active · {bizLines.length} total
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditingLine(null); }}
          style={{
            padding: '7px 16px', borderRadius: 6, border: 'none',
            background: showAdd ? 'var(--surface-border)' : 'var(--hsbc-red)',
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >{showAdd ? 'Cancel' : '+ New Biz Line'}</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {showAdd && (
          <BizLineForm
            existingIds={existingIds}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {bizLines.length === 0 && !showAdd ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '40px 20px', gap: 10,
            color: 'var(--text-muted)', textAlign: 'center',
          }}>
            <span style={{ fontSize: 32 }}>📂</span>
            <div style={{ fontSize: 13 }}>No business lines configured.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                <th style={thSt}>ID</th>
                <th style={thSt}>Display Name</th>
                <th style={thSt}>Description</th>
                <th style={thSt}>AD Groups</th>
                <th style={thSt}>Status</th>
                <th style={{ ...thSt, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bizLines.map(biz => {
                const groupCount = adGroups.filter(g => g.bizLineId === biz.bizLineId).length;
                const isEditing  = editingLine?.bizLineId === biz.bizLineId;
                return (
                  <React.Fragment key={biz.bizLineId}>
                    <tr style={{
                      borderBottom: isEditing ? 'none' : '1px solid var(--surface-border)',
                      background: isEditing ? 'rgba(219,0,17,0.04)' : 'transparent',
                    }}>
                      <td style={tdSt}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: 'rgba(219,0,17,0.08)', color: 'var(--hsbc-red)',
                          fontFamily: 'monospace',
                        }}>{biz.bizLineId}</span>
                      </td>
                      <td style={tdSt}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {biz.displayName}
                        </div>
                      </td>
                      <td style={{ ...tdSt, color: 'var(--text-muted)', fontSize: 12 }}>
                        {biz.description || '—'}
                      </td>
                      <td style={tdSt}>
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: groupCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}>{groupCount}</span>
                      </td>
                      <td style={tdSt}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: biz.active ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.15)',
                          color: biz.active ? '#22c55e' : '#94a3b8',
                        }}>{biz.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ ...tdSt, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <ActionBtn
                            label="Edit"
                            onClick={() => { setEditingLine(biz); setShowAdd(false); }}
                          />
                          <ActionBtn
                            label="Delete"
                            danger
                            onClick={() => setDeletingLine(biz)}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit form */}
                    {isEditing && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0 0 12px 0', background: 'rgba(219,0,17,0.04)' }}>
                          <div style={{ padding: '12px 14px 0' }}>
                            <BizLineForm
                              initial={{
                                bizLineId:   biz.bizLineId,
                                displayName: biz.displayName,
                                description: biz.description,
                                active:      biz.active,
                              }}
                              isEdit
                              existingIds={existingIds}
                              onSave={handleEdit}
                              onCancel={() => setEditingLine(null)}
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

      {/* Delete confirm */}
      {deletingLine && (
        <ConfirmDeleteModal
          title={`Delete "${deletingLine.displayName}"?`}
          body={
            adGroups.filter(g => g.bizLineId === deletingLine.bizLineId).length > 0
              ? `This biz line is referenced by ${adGroups.filter(g => g.bizLineId === deletingLine.bizLineId).length} AD group(s). Those groups will retain their current biz line ID but it will no longer appear in the list. This action cannot be undone.`
              : 'This business line will be permanently removed. This action cannot be undone.'
          }
          onConfirm={handleDelete}
          onCancel={() => setDeletingLine(null)}
        />
      )}
    </div>
  );
}
