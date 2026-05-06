import { useOCDP } from '../../store/OCDPStore';
import type { AEOScore } from '../../types/ocdp';

const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  A: { bg: 'var(--aeo-a-bg)', color: 'var(--aeo-a)' },
  B: { bg: 'var(--aeo-b-bg)', color: 'var(--aeo-b)' },
  C: { bg: 'var(--aeo-c-bg)', color: 'var(--aeo-c)' },
  D: { bg: 'var(--aeo-d-bg)', color: 'var(--aeo-d)' },
  F: { bg: 'var(--aeo-f-bg)', color: 'var(--aeo-f)' },
};

function ScoreCard({ score }: { score: AEOScore }) {
  const g = GRADE_STYLE[score.grade] ?? GRADE_STYLE.F;
  return (
    <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 26, background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: g.color, flexShrink: 0 }}>{score.grade}</div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: g.color, lineHeight: 1 }}>{score.score}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Market: {score.targetId}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>Last checked</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(score.checkedAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score.score}%`, background: g.color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {score.breakdown.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{item.pass ? '✅' : '❌'}</span>
            <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: item.pass ? 'var(--aeo-a)' : 'var(--aeo-d)' }}>{item.score}/{item.maxScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AEOPanel() {
  const { state } = useOCDP();
  const { aeoScores, pages } = state;

  function getPageName(pageId: string) { return pages.find(p => p.pageId === pageId)?.name ?? pageId; }

  const byPage = aeoScores.reduce<Record<string, AEOScore[]>>((acc, s) => {
    if (!acc[s.pageId]) acc[s.pageId] = [];
    acc[s.pageId].push(s);
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AEO / SEO Scores</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Answer Engine Optimisation scores per market (Web Standard only)</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {Object.entries(byPage).map(([pageId, scores]) => (
          <div key={pageId} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>{getPageName(pageId)}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {scores.map(s => <ScoreCard key={`${s.pageId}-${s.targetId}`} score={s} />)}
            </div>
          </div>
        ))}
        {Object.keys(byPage).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>No AEO scores available yet</div>
        )}
      </div>
    </div>
  );
}
