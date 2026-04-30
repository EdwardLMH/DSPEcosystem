import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { ChannelBadge } from '../shared/ChannelBadge';
import { MarketBadge } from '../shared/MarketBadge';
import { AEOGradeBadge } from '../shared/AEOGradeBadge';
import { Button } from '../shared/Button';

export function SubmitDialog() {
  const { state, dispatch } = useUCP();
  const {
    layout, markets, marketStatus, aeoScores, approvalFlows,
  } = state;

  const [comment, setComment] = useState('');

  // Markets where this page is already LIVE (read-only strip)
  const liveStatuses = marketStatus.filter(
    ms => ms.pageId === layout.pageId && ms.productionStatus === 'LIVE'
  );
  const liveTargetIds = new Set(liveStatuses.map(ms => ms.releaseTargetId));

  // Available markets (exclude already-live)
  const availableTargets = markets.filter(m => m.active && !liveTargetIds.has(m.marketId));

  // Pre-select markets matching the page's release market IDs
  const [selectedTargets, setSelectedTargets] = useState<string[]>(() => {
    const available = new Set(availableTargets.map(m => m.marketId));
    return (layout.releaseMarketIds ?? []).filter(id => available.has(id));
  });

  function toggleTarget(targetId: string) {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(t => t !== targetId)
        : [...prev, targetId]
    );
  }

  function getFlowForTarget(targetId: string) {
    return approvalFlows.find(f => f.marketId === targetId) ?? approvalFlows[0];
  }

  function getAEOForTarget(targetId: string) {
    return aeoScores.find(s => s.pageId === layout.pageId && s.releaseTargetId === targetId);
  }

  const isWechatOrSDUI = layout.channel === 'WEB_WECHAT' || layout.channel === 'SDUI';

  function handleSubmit() {
    if (selectedTargets.length === 0) return;
    dispatch({
      type: 'SUBMIT_FOR_APPROVAL',
      targets: selectedTargets,
      comment: comment.trim() || undefined,
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 'var(--z-modal)' as any,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        width: 560,
        maxWidth: '95vw',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
      }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 14px',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
                Submit for Approval
              </h2>
              {/* Page info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {layout.name}
                </span>
                <ChannelBadge channel={layout.channel} size="sm" />
                <MarketBadge marketId={layout.marketId} scope={layout.scope} size="sm" />
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SUBMIT_DIALOG' })}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}
            >×</button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Already LIVE strip */}
          {liveStatuses.length > 0 && (
            <div style={{
              background: 'var(--prod-live-bg)',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--prod-live)', marginBottom: 6 }}>
                Already live — not selectable
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {liveStatuses.map(ls => (
                  <span key={ls.statusId} style={{
                    fontSize: 11, fontWeight: 600,
                    background: 'rgba(5,150,105,0.15)',
                    color: 'var(--prod-live)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    {ls.releaseTargetId} ({ls.domainSuffix})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Release target checklist */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              Select release targets
            </div>

            {availableTargets.length === 0 ? (
              <div style={{
                fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic',
                padding: '12px', background: 'var(--surface-hover)',
                borderRadius: 'var(--radius-md)', textAlign: 'center',
              }}>
                No available targets — all markets already live.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableTargets.map(target => {
                  const isChecked = selectedTargets.includes(target.marketId);
                  const flow = getFlowForTarget(target.marketId);
                  const aeo  = getAEOForTarget(target.marketId);

                  return (
                    <div
                      key={target.marketId}
                      onClick={() => toggleTarget(target.marketId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isChecked ? 'var(--hsbc-red)' : 'var(--border-light)'}`,
                        background: isChecked ? '#FEF2F2' : 'var(--surface-hover)',
                        cursor: 'pointer',
                        transition: 'border-color 0.12s, background 0.12s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isChecked ? 'var(--hsbc-red)' : 'var(--border-mid)'}`,
                        background: isChecked ? 'var(--hsbc-red)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isChecked && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                      </div>

                      {/* Target info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {target.marketName}
                        </div>
                        {flow && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {flow.flowName} · {flow.steps.length} step{flow.steps.length !== 1 ? 's' : ''} · {flow.minApprovers} approver{flow.minApprovers !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* AEO score preview */}
                      {isWechatOrSDUI ? (
                        <span style={{
                          fontSize: 10, color: 'var(--text-muted)',
                          fontStyle: 'italic', flexShrink: 0,
                        }}>
                          AEO N/A
                        </span>
                      ) : aeo ? (
                        <AEOGradeBadge grade={aeo.aeoGrade} score={aeo.totalScore} size="sm" />
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                          No score
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comment */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'var(--text-primary)', marginBottom: 6,
            }}>
              Comment for approver (optional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add context or notes for the approval team…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px',
                border: '1.5px solid var(--border-mid)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13, fontFamily: 'var(--font-family)',
                resize: 'vertical', outline: 'none',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: 'var(--surface-hover)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedTargets.length} target{selectedTargets.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => dispatch({ type: 'TOGGLE_SUBMIT_DIALOG' })}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon="📤"
              disabled={selectedTargets.length === 0}
              onClick={handleSubmit}
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
