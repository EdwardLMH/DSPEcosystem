import React from 'react';
import { useUCP } from '../../store/UCPStore';
import { AEOGradeBadge } from '../shared/AEOGradeBadge';
import { AEOScore } from '../../types/ucp';
import { Button } from '../shared/Button';

// ─── Criteria definitions ─────────────────────────────────────────────────────

interface Criterion {
  key: keyof AEOScore;
  noteKey?: keyof AEOScore;
  label: string;
  maxPts: number;
}

const CRITERIA: Criterion[] = [
  { key: 'faqSchemaPts',      noteKey: 'faqSchemaNote',      label: 'FAQ Schema Markup',          maxPts: 20 },
  { key: 'productSchemaPts',                                   label: 'Product Schema Markup',      maxPts: 20 },
  { key: 'freshnessPts',      noteKey: 'freshnessNote',       label: 'Content Freshness',          maxPts: 15 },
  { key: 'authorCredPts',                                      label: 'Author Credentials',         maxPts: 10 },
  { key: 'regulatoryRefPts',  noteKey: 'regulatoryRefNote',   label: 'Regulatory Reference',       maxPts: 10 },
  { key: 'structuredRatePts', noteKey: 'structuredRateNote',  label: 'Structured Rate Data',       maxPts: 10 },
  { key: 'directAnswerPts',                                    label: 'Direct Answer Text',         maxPts: 10 },
];

// ─── Panel ────────────────────────────────────────────────────────────────────

export function AEOScorePanel() {
  const { state, dispatch } = useUCP();
  const { activePageId, layout, aeoScores, releaseTargets } = state;

  // Only applicable for WEB_STANDARD
  if (layout.channel !== 'WEB_STANDARD') {
    return (
      <PanelShell onClose={() => dispatch({ type: 'TOGGLE_AEO_PANEL' })}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '60%', gap: 12, padding: 24,
        }}>
          <span style={{ fontSize: 40 }}>🔍</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            AEO not applicable
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            AEO / SEO scoring is only available for <strong>Web Standard</strong> pages
            which are indexed by search engines and LLMs.
          </div>
        </div>
      </PanelShell>
    );
  }

  const pageScores = aeoScores.filter(s => s.pageId === activePageId);

  // Tips: criteria scoring 0 across any score
  const improvementTips: { label: string; key: string; gain: number }[] = [];
  if (pageScores.length > 0) {
    CRITERIA.forEach(c => {
      const score = pageScores[0];
      const pts = score[c.key] as number;
      if (pts === 0) {
        improvementTips.push({ label: c.label, key: c.key, gain: c.maxPts });
      }
    });
  }

  return (
    <PanelShell onClose={() => dispatch({ type: 'TOGGLE_AEO_PANEL' })}>
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {pageScores.length === 0 ? (
          <div style={{
            background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)',
            padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
          }}>
            No AEO scores available for this page yet.
            Scores are calculated on submit or can be triggered manually.
          </div>
        ) : (
          pageScores.map(score => {
            const target = releaseTargets.find(rt => rt.targetId === score.releaseTargetId);
            return <ScoreCard key={score.scoreId} score={score} targetName={target?.displayName ?? score.releaseTargetId ?? 'Unknown'} />;
          })
        )}

        {/* Improvement tips */}
        {improvementTips.length > 0 && (
          <div style={{
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: 'var(--radius-md)',
            padding: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>
              Improvement tips — fix these to gain points
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {improvementTips.map(tip => (
                <div key={tip.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 11, color: '#78350F',
                }}>
                  <span>• {tip.label}</span>
                  <span style={{
                    fontWeight: 700, color: '#059669',
                    background: '#D1FAE5', padding: '1px 7px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    +{tip.gain} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div style={{
          fontSize: 10, color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-light)',
          paddingTop: 12, lineHeight: 1.6,
        }}>
          HK / SG live scores: see Statistics view.
          Scores auto-refresh on submit and on DAP sync.
        </div>
      </div>
    </PanelShell>
  );
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ score, targetName }: { score: AEOScore; targetName: string }) {
  return (
    <div style={{
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '12px 14px',
        background: 'var(--surface-hover)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {targetName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Scored {new Date(score.scoredAt).toLocaleDateString()} · Trigger: {score.trigger.replace(/_/g, ' ')}
          </div>
        </div>
        <AEOGradeBadge grade={score.aeoGrade} score={score.totalScore} size="md" />
      </div>

      {/* Criteria rows */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CRITERIA.map(c => {
          const pts      = score[c.key] as number;
          const note     = c.noteKey ? score[c.noteKey] as string | undefined : undefined;
          const isMax    = pts === c.maxPts;
          const isZero   = pts === 0;
          const icon     = isMax ? '✅' : isZero ? '❌' : '⚠️';

          return (
            <div key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 12, flexShrink: 0, lineHeight: '18px' }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: isZero ? 400 : 500,
                    color: isZero ? 'var(--text-muted)' : 'var(--text-primary)',
                  }}>
                    {c.label}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                    color: isMax ? 'var(--status-approved)' : isZero ? 'var(--status-rejected)' : 'var(--status-pending)',
                  }}>
                    {pts}/{c.maxPts}
                  </span>
                </div>
                {note && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {note}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Score breakdown line */}
        <div style={{
          marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', fontSize: 11,
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Static score: <strong style={{ color: 'var(--text-primary)' }}>{score.staticScore}</strong>
          </span>
          <span style={{
            color: score.llmCitationPts > 0 ? 'var(--status-approved)' : 'var(--text-muted)',
          }}>
            LLM citation: <strong>+{score.llmCitationPts}</strong>
            {score.llmCitationNote && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                ({score.llmCitationNote})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function PanelShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 400, maxWidth: '95vw',
      background: 'var(--surface-panel)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: 'var(--z-panel)' as any,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--surface-hover)',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            AEO / SEO Score
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Answer Engine Optimisation
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >×</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }}>
        {children}
      </div>
    </div>
  );
}
