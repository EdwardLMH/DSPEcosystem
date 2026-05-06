import { useOCDP } from '../../store/OCDPStore';
import { calculateAEOScore } from '../../utils/aeoCalculator';

const GRADE_COLOR: Record<string, string> = { A: '#059669', B: '#059669', C: '#D97706', D: '#DC2626', F: '#DC2626' };

function PendingPanel() {
  const { state, dispatch } = useOCDP();
  const { currentUser, aeoScores } = state;
  const pending = state.pages.filter(p => p.authoringStatus === 'PENDING_APPROVAL');
  const pendingJourneys = state.journeys.filter(j => j.status === 'PENDING_APPROVAL');
  const isApprover = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';
  const isAuthor   = currentUser.role.endsWith('-AUTHOR')   || currentUser.role === 'ADMIN';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Pending Approvals</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Pages and journeys awaiting review across all markets</p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {pending.length === 0 && pendingJourneys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>All clear — no pending approvals</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Pending pages */}
            {pending.map(page => {
              const isWebStd = page.channel === 'WEB_STANDARD';
              const score = isWebStd
                ? aeoScores.find(s => s.pageId === page.pageId) ?? calculateAEOScore(page, page.releaseMarketIds?.[0] ?? 'GLOBAL')
                : null;
              const isSDUI = page.channel === 'SDUI';

              return (
                <div key={page.pageId} style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{page.thumbnail}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{page.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{page.bizLineId} · {page.marketId} · {page.channel}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#FEF3C7', color: '#D97706' }}>PENDING APPROVAL</span>
                  </div>

                  {/* AEO Score for Web Standard */}
                  {score && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 10, border: '1px solid #E5E7EB' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: GRADE_COLOR[score.grade] ?? '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {score.grade}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>AEO/SEO Score: {score.score}/100</div>
                      </div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {score.breakdown.filter(b => !b.pass).map((b, i) => (
                          <span key={i} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>✗ {b.label}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QR Code for SDUI */}
                  {isSDUI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFF7F0', borderRadius: 8, marginBottom: 10, border: '1px solid #FDDCB5' }}>
                      <span style={{ fontSize: 16 }}>📱</span>
                      <div style={{ fontSize: 11, color: '#92400E', flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>Native test:</span> dsp://preview/{page.pageId}
                      </div>
                      {page.nativeTargets?.map(t => (
                        <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E' }}>{t}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {isApprover && (
                      <>
                        <button onClick={() => dispatch({ type: 'APPROVE_PAGE', pageId: page.pageId, targetId: page.marketId, comment: 'Approved via OCDP review panel' })} style={{ flex: 1, padding: '8px', background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => dispatch({ type: 'REJECT_PAGE', pageId: page.pageId, targetId: page.marketId, comment: 'Rejected — needs revision' })} style={{ flex: 1, padding: '8px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                      </>
                    )}
                    {isAuthor && (
                      <button onClick={() => dispatch({ type: 'WITHDRAW_PAGE', pageId: page.pageId })} style={{ flex: 1, padding: '8px', background: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↩ Withdraw</button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pending journeys */}
            {pendingJourneys.map(journey => (
              <div key={journey.journeyId} style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🗺️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{journey.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{journey.bizLineId} · {journey.marketId} · {journey.channel} · Journey</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#FEF3C7', color: '#D97706' }}>PENDING APPROVAL</span>
                </div>

                {/* QR Code for SDUI journeys */}
                {journey.channel === 'SDUI' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFF7F0', borderRadius: 8, marginBottom: 10, border: '1px solid #FDDCB5' }}>
                    <span style={{ fontSize: 16 }}>📱</span>
                    <div style={{ fontSize: 11, color: '#92400E', flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>Native test:</span> dsp://journey/{journey.journeyId}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {isApprover && (
                    <>
                      <button onClick={() => dispatch({ type: 'APPROVE_JOURNEY', journeyId: journey.journeyId, comment: 'Approved via review panel' })} style={{ flex: 1, padding: '8px', background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => dispatch({ type: 'REJECT_JOURNEY', journeyId: journey.journeyId, comment: 'Rejected — needs revision' })} style={{ flex: 1, padding: '8px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                    </>
                  )}
                  {isAuthor && (
                    <button onClick={() => dispatch({ type: 'WITHDRAW_JOURNEY', journeyId: journey.journeyId })} style={{ flex: 1, padding: '8px', background: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↩ Withdraw</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { PendingPanel };
