import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { AdGroup, BizLineId } from '../../types/ocdp';

export function AdGroupAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { adGroups, approvalFlows, markets, bizLines } = state;
  const [activeTab, setActiveTab] = useState<'groups' | 'flows'>('groups');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState<Partial<AdGroup>>({});

  function saveGroup() {
    if (!groupForm.groupId || !groupForm.groupName) return;
    const group: AdGroup = { groupId: groupForm.groupId!, groupName: groupForm.groupName!, marketId: groupForm.marketId ?? 'HK', bizLineId: groupForm.bizLineId as BizLineId ?? 'WEALTH', groupType: groupForm.groupType ?? 'AD_GROUP' };
    dispatch({ type: 'ADD_AD_GROUP', group });
    setShowGroupForm(false);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 0', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AD Groups & Approval Flows</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Manage entitlement groups and delivery approval chains</p>
          </div>
          {activeTab === 'groups' && <button onClick={() => { setGroupForm({}); setShowGroupForm(true); }} style={{ padding: '8px 18px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Group</button>}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['groups', 'flows'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? 'var(--hsbc-red)' : 'var(--text-muted)', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--hsbc-red)' : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {activeTab === 'groups' && (
          <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {adGroups.map((g, i) => (
              <div key={g.groupId} style={{ padding: '14px 20px', borderBottom: i < adGroups.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{g.groupName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{g.groupId}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{g.marketId}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--surface-active)', color: 'var(--text-secondary)' }}>{g.bizLineId}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: g.groupType === 'ADMIN_GROUP' ? '#FEF3C7' : '#DBEAFE', color: g.groupType === 'ADMIN_GROUP' ? '#D97706' : '#2563EB' }}>{g.groupType}</span>
                <button onClick={() => dispatch({ type: 'DELETE_AD_GROUP', groupId: g.groupId })} style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'flows' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {approvalFlows.map(flow => (
              <div key={flow.flowId} style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{flow.flowName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {flow.marketId} · Min approvers: {flow.minApprovers} {flow.samePersionRestriction && '· Same person restriction'}
                </div>
                {flow.steps.map(step => (
                  <div key={step.stepOrder} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--hsbc-red)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.stepOrder}</div>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{step.approverGroupName}</span>
                  </div>
                ))}
                <button onClick={() => dispatch({ type: 'DELETE_APPROVAL_FLOW', flowId: flow.flowId })} style={{ marginTop: 8, padding: '6px 12px', fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showGroupForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowGroupForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Add AD Group</h2>
            {(['groupId', 'groupName'] as const).map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{field}</label>
                <input value={groupForm[field] ?? ''} onChange={e => setGroupForm(f => ({ ...f, [field]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Market</label>
              <select value={groupForm.marketId ?? 'HK'} onChange={e => setGroupForm(f => ({ ...f, marketId: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', background: '#fff' }}>
                {markets.map(m => <option key={m.marketId} value={m.marketId}>{m.marketName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Group Type</label>
              <select value={groupForm.groupType ?? 'AD_GROUP'} onChange={e => setGroupForm(f => ({ ...f, groupType: e.target.value as AdGroup['groupType'] }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', background: '#fff' }}>
                <option value="AD_GROUP">AD_GROUP</option>
                <option value="ADMIN_GROUP">ADMIN_GROUP</option>
                <option value="AUDIT_GROUP">AUDIT_GROUP</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGroupForm(false)} style={{ padding: '9px 20px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={saveGroup} style={{ padding: '9px 20px', background: 'var(--hsbc-red)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
