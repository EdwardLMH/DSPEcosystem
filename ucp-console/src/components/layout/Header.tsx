import React from 'react';
import { useUCP } from '../../store/UCPStore';
import { WorkflowStatus } from '../../types/ucp';
import { StatusBadge } from '../shared/StatusBadge';
import { ChannelBadge } from '../shared/ChannelBadge';
import { MarketBadge } from '../shared/MarketBadge';
import { Button } from '../shared/Button';

export function Header() {
  const { state, dispatch } = useUCP();
  const { currentUser, layout, isDirty, workflow, activePageId, showEditLiveWarning } = state;

  const currentWf  = workflow.find(w => w.pageId === activePageId);
  const wfStatus: WorkflowStatus = currentWf?.status ?? 'DRAFT';
  const isLive     = wfStatus === 'LIVE';
  const isAuthor   = currentUser.role.endsWith('-AUTHOR') || currentUser.role === 'ADMIN';
  const isApprover = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';
  const isWebStandard = layout.channel === 'WEB_STANDARD';
  const isWeChat      = layout.channel === 'WEB_WECHAT';

  return (
    <>
      <header style={{
        background: 'var(--surface-header)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 16px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        zIndex: 'var(--z-panel)' as any,
      }}>

        {/* Active page name + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexGrow: 1, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, flexShrink: 0 }}>Editing:</span>
          <span style={{
            color: '#fff', fontWeight: 600, fontSize: 13,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
          }}>
            {layout.name}
          </span>
          <ChannelBadge channel={layout.channel} size="sm" />
          <MarketBadge marketId={layout.marketId} scope={layout.scope} size="sm" />
          <StatusBadge status={wfStatus} size="sm" />

          {isLive && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#fff',
              background: 'var(--hsbc-red)', padding: '2px 8px',
              borderRadius: 'var(--radius-full)', flexShrink: 0,
            }}>
              LIVE
            </span>
          )}
          {isDirty && !isLive && (
            <span style={{
              fontSize: 10, color: 'var(--hsbc-gold)', fontWeight: 600,
              background: 'rgba(200,169,81,0.15)', padding: '2px 7px',
              borderRadius: 'var(--radius-full)', flexShrink: 0,
            }}>
              Unsaved
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>

          {/* Preview / Simulator */}
          <Button size="sm" variant="ghost" icon="📱"
            onClick={() => dispatch({ type: 'TOGGLE_SIMULATOR' })}
            style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
            Preview
          </Button>

          {/* Edit live page */}
          {isAuthor && isLive && (
            <Button size="sm" variant="ghost" icon="✏️"
              onClick={() => dispatch({ type: 'EDIT_LIVE_PAGE' })}
              style={{ color: '#FCD34D', borderColor: 'rgba(252,211,77,0.4)' }}>
              Edit Live
            </Button>
          )}

          {/* Submit */}
          {isAuthor && (wfStatus === 'DRAFT' || wfStatus === 'REJECTED') && (
            <Button size="sm" variant="secondary" icon="📤"
              onClick={() => dispatch({ type: 'TOGGLE_SUBMIT_DIALOG' })}>
              {wfStatus === 'REJECTED' ? 'Resubmit' : 'Submit'}
            </Button>
          )}

          {/* Review (approver) */}
          {isApprover && wfStatus === 'PENDING_APPROVAL' && (
            <Button size="sm" variant="success" icon="✅"
              onClick={() => dispatch({ type: 'TOGGLE_WORKFLOW' })}>
              Review
            </Button>
          )}

          {/* Publish */}
          {(isAuthor || isApprover) && wfStatus === 'APPROVED' && (
            <Button size="sm" variant="primary" icon="🚀"
              onClick={() => dispatch({ type: 'PUBLISH' })}>
              Publish
            </Button>
          )}

          {/* Workflow panel */}
          <Button size="sm" variant="ghost" icon="⚙️"
            onClick={() => dispatch({ type: 'TOGGLE_WORKFLOW' })}
            style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
            Workflow
          </Button>

          {/* AEO Score — WEB_STANDARD only */}
          {isWebStandard && (
            <Button size="sm" variant="ghost" icon="🔍"
              onClick={() => dispatch({ type: 'TOGGLE_AEO_PANEL' })}
              style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
              AEO Score
            </Button>
          )}

          {/* WeChat Compose — WEB_WECHAT only */}
          {isWeChat && (
            <Button size="sm" variant="ghost" icon="💬"
              onClick={() => dispatch({ type: 'TOGGLE_WECHAT_COMPOSER' })}
              style={{
                color: 'var(--channel-wechat)',
                borderColor: 'rgba(7,193,96,0.4)',
              }}>
              Compose
            </Button>
          )}
        </div>
      </header>

      {/* Edit-live warning banner */}
      {showEditLiveWarning && (
        <EditLiveWarning
          pageName={layout.name}
          onConfirm={() => dispatch({ type: 'EDIT_LIVE_PAGE' })}
          onDismiss={() => dispatch({ type: 'DISMISS_EDIT_LIVE_WARNING' })}
        />
      )}
    </>
  );
}

// ─── Edit-Live Warning Modal ──────────────────────────────────────────────────

function EditLiveWarning({ pageName, onConfirm, onDismiss }: {
  pageName: string; onConfirm: () => void; onDismiss: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 440,
        width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1A1A1A', textAlign: 'center' }}>
          Editing a Live Page
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 1.5 }}>
          <strong>"{pageName}"</strong> is currently live in production.
          Editing will create a new draft — your changes won't go live until you
          submit for approval and publish again.
        </p>
        <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#92400E', lineHeight: 1.8 }}>
            <li>A new draft version will be created from the current live page</li>
            <li>The live page remains unchanged until you publish again</li>
            <li>All changes must go through the approval workflow</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDismiss} style={{
            flex: 1, padding: '10px 0', border: '1px solid #E5E7EB',
            borderRadius: 8, background: '#fff', cursor: 'pointer',
            fontSize: 13, color: '#374151', fontWeight: 500,
          }}>
            Cancel — View Only
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 0', border: 'none',
            borderRadius: 8, background: '#DB0011', cursor: 'pointer',
            fontSize: 13, color: '#fff', fontWeight: 700,
          }}>
            ✏️ Create New Draft
          </button>
        </div>
      </div>
    </div>
  );
}
