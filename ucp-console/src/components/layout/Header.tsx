import React from 'react';
import { useUCP } from '../../store/UCPStore';
import { MOCK_USERS } from '../../store/mockData';
import { StatusBadge } from '../shared/StatusBadge';
import { Button } from '../shared/Button';
import { WorkflowStatus } from '../../types/ucp';

export function Header() {
  const { state, dispatch } = useUCP();
  const { currentUser, layout, isDirty, workflow } = state;

  const currentWf = workflow.find(w => w.pageId === layout.pageId);
  const wfStatus: WorkflowStatus = currentWf?.status ?? 'DRAFT';

  const isAuthor   = currentUser.role.endsWith('-AUTHOR') || currentUser.role === 'ADMIN';
  const isApprover = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';

  return (
    <header style={{
      background: 'var(--surface-header)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '0 20px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
      zIndex: 'var(--z-panel)' as any,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, background: 'var(--hsbc-red)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -1,
        }}>H</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>UCP Console</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>HSBC Unified Content Platform</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

      {/* Page name + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexGrow: 1, minWidth: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Page:</span>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {layout.name}
        </span>
        <StatusBadge status={wfStatus} size="sm" />
        {isDirty && (
          <span style={{ fontSize: 10, color: 'var(--hsbc-gold)', fontWeight: 600, background: 'rgba(200,169,81,0.15)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>
            ● Unsaved
          </span>
        )}
      </div>

      {/* Role switcher (demo) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Demo role:</span>
        <select
          value={currentUser.id}
          onChange={e => {
            const u = MOCK_USERS.find(u => u.id === e.target.value);
            if (u) dispatch({ type: 'SET_USER', user: u });
          }}
          style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
            padding: '4px 10px', fontSize: 12, cursor: 'pointer',
          }}
        >
          {MOCK_USERS.map(u => (
            <option key={u.id} value={u.id} style={{ background: '#1E2235', color: '#fff' }}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <Button
          size="sm"
          variant="ghost"
          icon="📱"
          onClick={() => dispatch({ type: 'TOGGLE_SIMULATOR' })}
          style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          Preview
        </Button>

        {isAuthor && wfStatus === 'DRAFT' && (
          <Button
            size="sm"
            variant="secondary"
            icon="📤"
            onClick={() => dispatch({ type: 'SUBMIT_FOR_APPROVAL' })}
          >
            Submit for Approval
          </Button>
        )}

        {isApprover && wfStatus === 'PENDING_APPROVAL' && (
          <Button
            size="sm"
            variant="success"
            icon="✅"
            onClick={() => dispatch({ type: 'TOGGLE_WORKFLOW' })}
          >
            Review
          </Button>
        )}

        {(isAuthor || isApprover) && wfStatus === 'APPROVED' && (
          <Button
            size="sm"
            variant="primary"
            icon="🚀"
            onClick={() => dispatch({ type: 'PUBLISH' })}
          >
            Publish
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          icon="⚙️"
          onClick={() => dispatch({ type: 'TOGGLE_WORKFLOW' })}
          style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          Workflow
        </Button>
      </div>
    </header>
  );
}
