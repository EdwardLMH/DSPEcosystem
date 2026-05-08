import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { AEOScore } from '../../types/ocdp';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADE_STYLE: Record<string, { bg: string; color: string; bar: string }> = {
  A: { bg: '#D1FAE5', color: '#059669', bar: '#059669' },
  B: { bg: '#DBEAFE', color: '#1D4ED8', bar: '#3B82F6' },
  C: { bg: '#FEF3C7', color: '#D97706', bar: '#F59E0B' },
  D: { bg: '#FEE2E2', color: '#DC2626', bar: '#EF4444' },
  F: { bg: '#F3F4F6', color: '#6B7280', bar: '#9CA3AF' },
};

function gradeColor(score: number): string {
  if (score >= 85) return '#059669';
  if (score >= 70) return '#1D4ED8';
  if (score >= 55) return '#D97706';
  if (score >= 40) return '#DC2626';
  return '#6B7280';
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ score }: { score: AEOScore }) {
  const [expanded, setExpanded] = useState(false);
  const g = GRADE_STYLE[score.grade] ?? GRADE_STYLE.F;
  const passing = score.breakdown.filter(b => b.pass).length;
  const total   = score.breakdown.length;

  return (
    <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: g.color, flexShrink: 0 }}>
            {score.grade}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: g.color, lineHeight: 1 }}>
              {score.score}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Market</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{score.targetId}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(score.checkedAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{ height: 5, background: '#E5E7EB', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score.score}%`, background: g.bar, borderRadius: 3, transition: 'width 0.4s' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: passing === total ? '#059669' : passing >= total * 0.7 ? '#D97706' : '#DC2626' }}>{passing}/{total}</span> checks passed
          </span>
          <button onClick={() => setExpanded(v => !v)} style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'none',
            border: '1px solid var(--border-light)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
          }}>
            {expanded ? 'Hide ▲' : 'Details ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {score.breakdown.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{item.pass ? '✅' : '❌'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 48, height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(item.score / item.maxScore) * 100}%`, background: item.pass ? '#059669' : '#F59E0B', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: item.pass ? '#059669' : '#D97706', minWidth: 28, textAlign: 'right' }}>{item.score}/{item.maxScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AEOPanel() {
  const { state } = useOCDP();
  const { aeoScores, pages, journeyPages } = state;

  // Exclude any score whose pageId belongs to a journey step page
  const journeyPageIds = new Set(journeyPages.map(jp => jp.page.pageId));
  const pageOnlyScores = aeoScores.filter(s => !journeyPageIds.has(s.pageId));

  const byPage = pageOnlyScores.reduce<Record<string, AEOScore[]>>((acc, s) => {
    (acc[s.pageId] ??= []).push(s);
    return acc;
  }, {});

  const avgOverall = pageOnlyScores.length
    ? Math.round(pageOnlyScores.reduce((s, x) => s + x.score, 0) / pageOnlyScores.length) : 0;
  const gradeCount = pageOnlyScores.reduce<Record<string, number>>((acc, s) => {
    acc[s.grade] = (acc[s.grade] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>AEO / SEO Scores</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Answer Engine Optimisation scores for public Web Standard pages
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Summary strip */}
        {aeoScores.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
            <div style={{ background: 'var(--surface-panel)', borderRadius: 10, border: '1px solid var(--border-light)', padding: '14px 16px', gridColumn: '1 / 3' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Overall Avg Score</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: gradeColor(avgOverall) }}>
                {avgOverall}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ marginTop: 6, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgOverall}%`, background: gradeColor(avgOverall), borderRadius: 2 }} />
              </div>
            </div>
            {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => {
              const g = GRADE_STYLE[grade];
              return (
                <div key={grade} style={{ background: g.bg, borderRadius: 10, border: `1px solid ${g.bar}33`, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: g.color }}>{gradeCount[grade] ?? 0}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: g.color, marginTop: 2 }}>Grade {grade}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Per-page groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(byPage).map(([pageId, scores]) => {
            const page = pages.find(p => p.pageId === pageId);
            const best = scores.reduce((b, s) => {
              const order = ['A','B','C','D','F'];
              return order.indexOf(s.grade) < order.indexOf(b) ? s.grade : b;
            }, 'F');
            const avg = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
            const g = GRADE_STYLE[best] ?? GRADE_STYLE.F;
            return (
              <div key={pageId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {page?.thumbnail && <span style={{ fontSize: 20 }}>{page.thumbnail}</span>}
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 }}>
                    {page?.name ?? pageId}
                  </h2>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: g.bg, color: g.color }}>
                    Best {best} · Avg {avg}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scores.length} market{scores.length > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, alignItems: 'start' }}>
                  {scores.map(s => <ScoreCard key={`${s.pageId}-${s.targetId}`} score={s} />)}
                </div>
              </div>
            );
          })}
          {Object.keys(byPage).length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No AEO scores available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
