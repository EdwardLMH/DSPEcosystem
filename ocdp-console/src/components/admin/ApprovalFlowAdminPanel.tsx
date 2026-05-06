import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { ApprovalFlow, ApprovalFlowStep, BizLineId } from '../../types/ocdp';
import { v4 } from '../../utils/uuid';

type FormState = {
  flowName: string;
  marketId: string;
  bizLineId: BizLineId | '';
  approverCount: 1 | 2;
  step1GroupId: string;
  step2GroupId: string;
  samePersionRestriction: boolean;
};

const EMPTY_FORM: FormState = {
  flowName: '',
  marketId: '',
  bizLineId: '',
  approverCount: 1,
  step1GroupId: '',
  step2GroupId: '',
  samePersionRestriction: false,
};

export function ApprovalFlowAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { approvalFlows, markets, bizLines, adGroups } = state;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApprovalFlow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [filterMarket, setFilterMarket] = useState('');
  const [filterBizLine, setFilterBizLine] = useState('');

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)',
    borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
  };

  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

  // AD groups that are ADMIN_GROUP type and match the selected bizLine
  const eligibleGroups = adGroups.filter(g =>
    g.groupType === 'ADMIN_GROUP' &&
    (form.bizLineId === '' || g.bizLineId === form.bizLineId)
  );

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(flow: ApprovalFlow) {
    const step1 = flow.steps.find(s => s.stepOrder === 1)?.approverGroupId ?? '';
    const step2 = flow.steps.find(s => s.stepOrder === 2)?.approverGroupId ?? '';
    setForm({
      flowName: flow.flowName,
      marketId: flow.marketId,
      bizLineId: (flow.bizLineId ?? '') as BizLineId | '',
      approverCount: flow.steps.length >= 2 ? 2 : 1,
      step1GroupId: step1,
      step2GroupId: step2,
      samePersionRestriction: flow.samePersionRestriction,
    });
    setEditing(flow);
    setShowForm(true);
  }

  function buildSteps(): ApprovalFlowStep[] {
    const g1 = adGroups.find(g => g.groupId === form.step1GroupId);
    const steps: ApprovalFlowStep[] = [];
    if (g1) steps.push({ stepOrder: 1, approverGroupId: g1.groupId, approverGroupName: g1.groupName });
    if (form.approverCount === 2) {
      const g2 = adGroups.find(g => g.groupId === form.step2GroupId);
      if (g2) steps.push({ stepOrder: 2, approverGroupId: g2.groupId, approverGroupName: g2.groupName });
    }
    return steps;
  }

  function save() {
    const steps = buildSteps();
    if (!form.flowName || !form.marketId || steps.length < 1) return;
    if (form.approverCount === 2 && steps.length < 2) return;

    const flow: ApprovalFlow = {
      flowId: editing?.flowId ?? v4(),
      flowName: form.flowName,
      marketId: form.marketId,
      bizLineId: (form.bizLineId || null) as BizLineId | null,
      minApprovers: form.approverCount,
      steps,
      samePersionRestriction: form.samePersionRestriction,
    };

    if (editing) {
      dispatch({ type: 'EDIT_APPROVAL_FLOW', flowId: editing.flowId, flow });
    } else {
      dispatch({ type: 'ADD_APPROVAL_FLOW', flow });
    }
    setShowForm(false);
  }

  const canSave = (() => {
    if (!form.flowName || !form.marketId || !form.step1GroupId) return false;
    if (form.approverCount === 2 && !form.step2GroupId) return false;
    return true;
  })();

  // Filter displayed flows
  const displayed = approvalFlows.filter(f =>
    (!filterMarket || f.marketId === filterMarket) &&
    (!filterBizLine || f.bizLineId === filterBizLine)
  );

  function marketName(id: string) {
    return markets.find(m => m.marketId === id)?.marketName ?? id;
  }
  function bizName(id: string | null) {
    if (!id) return 'All Biz Lines';
    return bizLines.find(b => b.bizLineId === id)?.displayName ?? id;
  }

  const stepBadge: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    background: 'rgba(219,0,17,0.06)', color: '#DB0011', border: '1px solid rgba(219,0,17,0.15)',
    marginBottom: 4,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Approval Flow Administration</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Configure 1 or 2-step approval chains per market and business line</p>
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Flow
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: '12px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 12, flexShrink: 0 }}>
        <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)} style={{ ...sel, width: 200 }}>
          <option value="">All Markets</option>
          {markets.map(m => <option key={m.marketId} value={m.marketId}>{m.marketName}</option>)}
        </select>
        <select value={filterBizLine} onChange={e => setFilterBizLine(e.target.value)} style={{ ...sel, width: 220 }}>
          <option value="">All Business Lines</option>
          {bizLines.map(b => <option key={b.bizLineId} value={b.bizLineId}>{b.displayName}</option>)}
        </select>
        {(filterMarket || filterBizLine) && (
          <button onClick={() => { setFilterMarket(''); setFilterBizLine(''); }} style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            No approval flows found. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {displayed.map(flow => (
              <div key={flow.flowId} style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>{flow.flowName}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: flow.steps.length >= 2 ? 'rgba(139,92,246,0.1)' : 'rgba(5,150,105,0.08)',
                    color: flow.steps.length >= 2 ? '#7C3AED' : '#059669',
                    whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8,
                  }}>
                    {flow.steps.length}-Step
                  </span>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
                    {marketName(flow.marketId)}
                  </span>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011', fontWeight: 600 }}>
                    {bizName(flow.bizLineId)}
                  </span>
                  {flow.samePersionRestriction && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                      Different Approvers Required
                    </span>
                  )}
                </div>

                {/* Steps */}
                <div style={{ marginBottom: 14 }}>
                  {flow.steps.map(s => (
                    <div key={s.stepOrder} style={stepBadge}>
                      <span style={{ fontSize: 10, background: '#DB0011', color: '#fff', borderRadius: 3, padding: '1px 5px' }}>Step {s.stepOrder}</span>
                      {s.approverGroupName}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(flow)} style={{ flex: 1, padding: '7px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => dispatch({ type: 'DELETE_APPROVAL_FLOW', flowId: flow.flowId })} style={{ padding: '7px 12px', fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>{editing ? 'Edit Approval Flow' : 'New Approval Flow'}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 20px' }}>Configure approver groups within the same business line, scoped per market.</p>

            {/* Flow name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Flow Name</label>
              <input value={form.flowName} onChange={e => setForm(f => ({ ...f, flowName: e.target.value }))} placeholder="e.g. HK Wealth Dual Approval" style={inp} />
            </div>

            {/* Market */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Market</label>
              <select value={form.marketId} onChange={e => setForm(f => ({ ...f, marketId: e.target.value }))} style={sel}>
                <option value="">— Select market —</option>
                {markets.filter(m => m.active).map(m => <option key={m.marketId} value={m.marketId}>{m.marketName}</option>)}
              </select>
            </div>

            {/* Biz Line */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Business Line</label>
              <select value={form.bizLineId} onChange={e => setForm(f => ({ ...f, bizLineId: e.target.value as BizLineId | '', step1GroupId: '', step2GroupId: '' }))} style={sel}>
                <option value="">— All business lines —</option>
                {bizLines.filter(b => b.active).map(b => <option key={b.bizLineId} value={b.bizLineId}>{b.displayName}</option>)}
              </select>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Scopes approver group selection to the chosen biz line.</p>
            </div>

            <div style={{ height: 1, background: 'var(--border-light)', margin: '16px 0' }} />

            {/* Approver count toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Approval Steps</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1, 2] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, approverCount: n, step2GroupId: '' }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: form.approverCount === n ? '2px solid #DB0011' : '2px solid var(--border-light)',
                      background: form.approverCount === n ? 'rgba(219,0,17,0.05)' : 'var(--surface-hover)',
                      color: form.approverCount === n ? '#DB0011' : 'var(--text-secondary)',
                    }}
                  >
                    {n === 1 ? '1 Approver' : '2 Approvers'}
                  </button>
                ))}
              </div>
              {form.approverCount === 2 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.samePersionRestriction} onChange={e => setForm(f => ({ ...f, samePersionRestriction: e.target.checked }))} style={{ accentColor: '#DB0011' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Require 2 different approvers (no self-approval in both steps)</span>
                </label>
              )}
            </div>

            {/* Step 1 */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Step 1 — Approver Group
              </label>
              <select value={form.step1GroupId} onChange={e => setForm(f => ({ ...f, step1GroupId: e.target.value }))} style={sel}>
                <option value="">— Select approver group —</option>
                {eligibleGroups.map(g => <option key={g.groupId} value={g.groupId}>{g.groupName} ({g.marketId})</option>)}
              </select>
              {eligibleGroups.length === 0 && (
                <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>No admin groups found for this biz line. Add groups in AD Group admin first.</p>
              )}
            </div>

            {/* Step 2 (conditional) */}
            {form.approverCount === 2 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Step 2 — Approver Group
                </label>
                <select value={form.step2GroupId} onChange={e => setForm(f => ({ ...f, step2GroupId: e.target.value }))} style={sel}>
                  <option value="">— Select approver group —</option>
                  {eligibleGroups.map(g => <option key={g.groupId} value={g.groupId}>{g.groupName} ({g.marketId})</option>)}
                </select>
              </div>
            )}

            <div style={{ height: 1, background: 'var(--border-light)', margin: '16px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={save} disabled={!canSave}
                style={{ padding: '9px 20px', background: canSave ? 'var(--hsbc-red)' : '#F3F4F6', color: canSave ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed' }}>
                Save Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
