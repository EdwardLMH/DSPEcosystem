import { useOCDP } from '../../store/OCDPStore';

export function StatisticsPanel() {
  const { state } = useOCDP();
  const { usageStats, pages, releaseTargets } = state;

  function getPageName(pageId: string) { return pages.find(p => p.pageId === pageId)?.name ?? pageId; }
  function getTargetName(targetId: string) { return releaseTargets.find(t => t.targetId === targetId)?.displayName ?? targetId; }

  const daily   = usageStats.filter(s => s.daily > 0);
  const top     = [...daily].sort((a, b) => b.daily - a.daily);

  const totalDaily   = usageStats.reduce((acc, s) => acc + s.daily, 0);
  const totalWeekly  = usageStats.reduce((acc, s) => acc + s.weekly, 0);
  const totalMonthly = usageStats.reduce((acc, s) => acc + s.monthly, 0);

  function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Delivery Statistics</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Per-market page access metrics</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Daily Accesses',   value: fmt(totalDaily),   icon: '📅' },
            { label: 'Weekly Accesses',  value: fmt(totalWeekly),  icon: '📆' },
            { label: 'Monthly Accesses', value: fmt(totalMonthly), icon: '📊' },
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: '20px 24px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Per-page breakdown */}
        <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Per-Page Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 80px 80px', padding: '10px 20px', background: 'var(--surface-active)' }}>
            {['Page / Market', 'Target', 'Daily', 'Weekly', 'Monthly'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {top.map((stat, i) => (
            <div key={`${stat.pageId}-${stat.targetId}`} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 80px 80px', padding: '14px 20px', borderBottom: i < top.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{getPageName(stat.pageId)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Avg session {stat.avgSessionSec}s · Bounce {Math.round(stat.bounceRate * 100)}%</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'rgba(219,0,17,0.06)', color: '#DB0011', width: 'fit-content' }}>{getTargetName(stat.targetId)}</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(stat.daily)}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(stat.weekly)}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(stat.monthly)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
