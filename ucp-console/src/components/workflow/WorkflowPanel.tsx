import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { StatusBadge } from '../shared/StatusBadge';
import { Button } from '../shared/Button';
import { QRCode } from '../shared/QRCode';
import { WorkflowStatus } from '../../types/ucp';

function buildPreviewUrl(stage: 'preview' | 'approval' | 'production', pageId: string, entryId?: string): string {
  const base = window.location.origin.replace(':3001', ':4000');
  if (stage === 'production') return `${base}/api/v1/screen/${pageId}`;
  if (stage === 'approval')   return `${base}/api/v1/ucp/preview/${entryId ?? pageId}?stage=approval`;
  return `${base}/api/v1/ucp/preview/${pageId}?stage=preview`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function CommentBubble({ comment }: { comment: any }) {
  const isApprover = comment.authorRole?.includes('APPROVER') || comment.authorRole === 'ADMIN';
  return (
    <div style={{
      background: isApprover ? '#EFF6FF' : '#F9FAFB',
      border: `1px solid ${isApprover ? '#BFDBFE' : 'var(--border-light)'}`,
      borderRadius: 10,
      padding: '10px 12px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isApprover ? '#1D4ED8' : 'var(--text-primary)' }}>
          {isApprover ? '✅ ' : '✏️ '}{comment.authorId}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {new Date(comment.timestamp).toLocaleString('en-HK', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{comment.text}</div>
    </div>
  );
}

function AuditRow({ entry }: { entry: any }) {
  const actionColor: Record<string, string> = {
    PAGE_CREATED: '#2563EB',
    SLICE_ADDED: '#059669',
    SLICE_REMOVED: '#DC2626',
    SLICE_EDITED: '#D97706',
    SUBMITTED_FOR_APPROVAL: '#7C3AED',
    APPROVED: '#059669',
    REJECTED: '#DC2626',
    PUBLISHED: '#DB0011',
  };
  const color = actionColor[entry.action] ?? '#6B7280';

  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'flex-start' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: '0.02em' }}>{entry.action.replace(/_/g, ' ')}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
            {new Date(entry.timestamp).toLocaleString('en-HK', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>by {entry.actorId} ({entry.actorRole})</div>
        {entry.details && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{entry.details}</div>}
      </div>
    </div>
  );
}

type Tab = 'workflow' | 'qr' | 'audit' | 'json';

export function WorkflowPanel() {
  const { state, dispatch } = useUCP();
  const { layout, workflow, audit, currentUser } = state;
  const [tab, setTab] = useState<Tab>('workflow');
  const [comment, setComment] = useState('');
  const [showJson, setShowJson] = useState(false);

  const currentWf = workflow.find(w => w.pageId === layout.pageId);
  const wfStatus: WorkflowStatus = currentWf?.status ?? 'DRAFT';

  const isAuthor   = currentUser.role.endsWith('-AUTHOR') || currentUser.role === 'ADMIN';
  const isApprover = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';
  const isAuditor  = currentUser.role === 'AUDITOR';

  const pageAudit  = [...audit].filter(a => a.pageId === layout.pageId).reverse();

  function handleApprove() {
    dispatch({ type: 'APPROVE', comment });
    setComment('');
  }
  function handleReject() {
    if (!comment.trim()) {
      dispatch({ type: 'SHOW_TOAST', message: 'Please enter a rejection reason', toastType: 'error' });
      return;
    }
    dispatch({ type: 'REJECT', comment });
    setComment('');
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'workflow', label: 'Workflow',  icon: '🔄' },
    { id: 'qr',      label: 'QR Codes',  icon: '📱' },
    { id: 'audit',   label: 'Audit Log', icon: '📋' },
    { id: 'json',    label: 'SDUI JSON', icon: '{ }' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as any,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_WORKFLOW' }); }}
    >
      <div style={{
        width: 460,
        background: '#fff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        animation: 'slideIn 0.2s ease-out',
        animationDirection: 'reverse',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface-hover)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Maker-Checker Workflow</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{layout.name}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge status={wfStatus} />
              <button onClick={() => dispatch({ type: 'TOGGLE_WORKFLOW' })} style={{ background: 'var(--surface-active)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px', fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                borderBottom: tab === t.id ? '2px solid var(--hsbc-red)' : '2px solid transparent',
                color: tab === t.id ? 'var(--hsbc-red)' : 'var(--text-secondary)',
                background: 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── Workflow tab ── */}
          {tab === 'workflow' && (
            <>
              {/* Status timeline */}
              <Section title="Status Timeline">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LIVE'] as WorkflowStatus[]).map((s, i) => {
                    const done = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LIVE'].indexOf(wfStatus) >= i;
                    const active = wfStatus === s;
                    const rejected = wfStatus === 'REJECTED' && s === 'PENDING_APPROVAL';
                    return (
                      <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                            background: rejected && active ? '#DC2626' : active ? 'var(--hsbc-red)' : done ? '#059669' : 'var(--border-mid)',
                            color: done || active ? '#fff' : 'var(--text-muted)',
                          }}>
                            {rejected && active ? '✕' : done ? '✓' : i + 1}
                          </div>
                          {i < 3 && <div style={{ width: 2, height: 24, background: done ? '#059669' : 'var(--border-light)', margin: '2px 0' }} />}
                        </div>
                        <div style={{ paddingTop: 2, paddingBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--hsbc-red)' : done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {s.replace(/_/g, ' ')}
                            {active && wfStatus === 'REJECTED' && s === 'PENDING_APPROVAL' && ' — Rejected'}
                          </div>
                          {currentWf?.submittedAt && s === 'PENDING_APPROVAL' && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                              Submitted by {currentWf.authorName} · {new Date(currentWf.submittedAt).toLocaleDateString()}
                            </div>
                          )}
                          {currentWf?.reviewedAt && (s === 'APPROVED' || (s === 'PENDING_APPROVAL' && wfStatus === 'REJECTED')) && currentWf.reviewerName && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                              By {currentWf.reviewerName} · {new Date(currentWf.reviewedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Comments thread */}
              {(currentWf?.comments ?? []).length > 0 && (
                <Section title="Review Comments">
                  {currentWf!.comments.map(c => <CommentBubble key={c.id} comment={c} />)}
                </Section>
              )}

              {/* Maker actions */}
              {isAuthor && wfStatus === 'DRAFT' && (
                <Section title="Maker Action">
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                      Review your changes on the canvas, then submit for approval. The approver will receive a notification to review and publish.
                    </div>
                    <textarea
                      placeholder="Optional note to approver…"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: '1.5px solid var(--border-light)', borderRadius: 8, padding: '8px 10px',
                        fontSize: 13, fontFamily: 'var(--font-family)', resize: 'vertical', boxSizing: 'border-box', outline: 'none', marginBottom: 10,
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--hsbc-red)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
                    />
                    <Button variant="primary" icon="📤" fullWidth onClick={() => { dispatch({ type: 'SUBMIT_FOR_APPROVAL' }); setComment(''); }}>
                      Submit for Approval
                    </Button>
                  </div>
                </Section>
              )}

              {/* Approver actions */}
              {isApprover && wfStatus === 'PENDING_APPROVAL' && (
                <Section title="Checker Action">
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                      Review the page in the <strong>Preview</strong> simulator. Leave a comment and approve or reject.
                    </div>
                    <textarea
                      placeholder="Add a review comment (required to reject)…"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: '1.5px solid var(--border-light)', borderRadius: 8, padding: '8px 10px',
                        fontSize: 13, fontFamily: 'var(--font-family)', resize: 'vertical', boxSizing: 'border-box', outline: 'none', marginBottom: 10,
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--hsbc-red)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Button variant="success" icon="✅" fullWidth onClick={handleApprove}>Approve</Button>
                      <Button variant="danger"  icon="❌" fullWidth onClick={handleReject}>Reject</Button>
                    </div>
                  </div>
                </Section>
              )}

              {/* Publish action */}
              {(isAuthor || isApprover) && wfStatus === 'APPROVED' && (
                <Section title="Publish">
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, color: '#065F46', marginBottom: 12 }}>
                      ✅ This page has been approved and is ready to publish to production.
                    </div>
                    <Button variant="primary" icon="🚀" fullWidth onClick={() => dispatch({ type: 'PUBLISH' })}>
                      Publish to Production
                    </Button>
                  </div>
                </Section>
              )}

              {wfStatus === 'LIVE' && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                  <div style={{ fontWeight: 700, color: '#1D4ED8' }}>This page is LIVE</div>
                  <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 4 }}>Published to production</div>
                </div>
              )}
            </>
          )}

          {/* ── QR tab ── */}
          {tab === 'qr' && (() => {
            const STAGE_CONFIGS = [
              {
                id: 'preview'    as const,
                label: '🔍 Draft Preview',
                desc: 'Author review — scan to see current draft layout on your device',
                color: '#6B7280',
                bgColor: '#F3F4F6',
                available: true,
                url: buildPreviewUrl('preview', layout.pageId, currentWf?.entryId),
              },
              {
                id: 'approval'   as const,
                label: '🔄 Approval Preview',
                desc: 'Checker review — scan to verify the submitted layout before approving',
                color: '#D97706',
                bgColor: '#FEF3C7',
                available: wfStatus === 'PENDING_APPROVAL',
                url: buildPreviewUrl('approval', layout.pageId, currentWf?.entryId),
              },
              {
                id: 'production' as const,
                label: '🚀 Production',
                desc: 'Live URL — only available after publish',
                color: '#059669',
                bgColor: '#D1FAE5',
                available: wfStatus === 'LIVE',
                url: buildPreviewUrl('production', layout.pageId, currentWf?.entryId),
              },
            ];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Scan the QR code for your stage with the <strong>HSBC Internal Preview App</strong> to render the live SDUI layout on a real device. Each QR is stage-specific.
                </div>
                {STAGE_CONFIGS.map(cfg => (
                  <div key={cfg.id} style={{
                    border: `1.5px solid ${cfg.available ? cfg.color + '55' : 'var(--border-light)'}`,
                    borderRadius: 14,
                    padding: 16,
                    opacity: cfg.available ? 1 : 0.45,
                    background: cfg.available ? cfg.bgColor + '55' : 'var(--surface-hover)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* QR */}
                      <div style={{ flexShrink: 0 }}>
                        <QRCode
                          value={cfg.url}
                          size={130}
                          fgColor={cfg.available ? '#1A1A2E' : '#9CA3AF'}
                        />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: cfg.available ? cfg.color : 'var(--text-muted)', marginBottom: 4 }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                          {cfg.desc}
                        </div>
                        {!cfg.available && (
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', display: 'inline-block', padding: '2px 8px', borderRadius: 8, marginBottom: 8 }}>
                            Not available in {wfStatus} status
                          </div>
                        )}
                        {/* URL */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <div style={{
                            flex: 1,
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(0,0,0,0.06)',
                            borderRadius: 5,
                            padding: '4px 6px',
                            color: 'var(--text-muted)',
                            wordBreak: 'break-all',
                            lineHeight: 1.4,
                          }}>
                            {cfg.url}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cfg.url);
                              dispatch({ type: 'SHOW_TOAST', message: 'URL copied!', toastType: 'success' });
                            }}
                            title="Copy URL"
                            style={{
                              flexShrink: 0, background: 'var(--surface-active)',
                              border: '1px solid var(--border-light)', borderRadius: 5,
                              width: 26, height: 26, cursor: 'pointer', fontSize: 12,
                            }}
                          >⎘</button>
                          <a
                            href={cfg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flexShrink: 0, background: cfg.available ? cfg.color : 'var(--surface-active)',
                              color: cfg.available ? '#fff' : 'var(--text-muted)',
                              border: 'none', borderRadius: 5,
                              width: 26, height: 26, cursor: 'pointer', fontSize: 11,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              textDecoration: 'none',
                            }}
                            title="Open in browser"
                          >↗</a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Audit tab ── */}
          {tab === 'audit' && (
            <Section title={`Audit Trail (${pageAudit.length} events)`}>
              {pageAudit.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 }}>No audit events yet</div>
              )}
              {pageAudit.map(entry => <AuditRow key={entry.id} entry={entry} />)}
            </Section>
          )}

          {/* ── JSON tab ── */}
          {tab === 'json' && (
            <Section title="SDUI Layout JSON">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                This is the JSON payload that will be served by the BFF to mobile clients. Copy and paste into mock-bff to publish.
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
                    dispatch({ type: 'SHOW_TOAST', message: 'JSON copied to clipboard!', toastType: 'success' });
                  }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-light)',
                    borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                  }}
                >Copy</button>
                <pre style={{
                  background: '#1E2235',
                  color: '#A5D6FF',
                  fontSize: 11,
                  lineHeight: 1.6,
                  padding: '12px 14px',
                  borderRadius: 10,
                  overflowX: 'auto',
                  maxHeight: 480,
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {JSON.stringify(layout, null, 2)}
                </pre>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
