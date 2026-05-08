import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { PageUsageStat, JourneyUsageStat } from '../../types/ocdp';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }
function dur(sec: number) {
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: '18px 20px' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? 'var(--text-primary)', marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color = '#DB0011' }: { value: number; max: number; color?: string }) {
  return (
    <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
    </div>
  );
}

function RateChip({ value, good, label }: { value: number; good: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
      background: good ? '#D1FAE5' : '#FEE2E2',
      color: good ? '#059669' : '#DC2626',
    }} title={label}>{pct(value)}</span>
  );
}

function SectionHeader({ title, sub, count }: { title: string; sub: string; count?: number }) {
  return (
    <div style={{ padding: '16px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
        {count !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(219,0,17,0.08)', color: '#DB0011' }}>{count} live</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{sub}</p>
    </div>
  );
}

// ─── Pages tab ────────────────────────────────────────────────────────────────

function PagesStats({ stats, pages, targets }: {
  stats: PageUsageStat[];
  pages: { pageId: string; name: string; channel: string; thumbnail: string }[];
  targets: { targetId: string; displayName: string }[];
}) {
  const sorted = [...stats].sort((a, b) => b.mau - a.mau);
  const totalMAU = stats.reduce((s, x) => s + x.mau, 0);
  const totalDAU = stats.reduce((s, x) => s + x.dau, 0);
  const totalWAU = stats.reduce((s, x) => s + x.wau, 0);
  const avgConv  = stats.length ? stats.reduce((s, x) => s + x.conversionRate, 0) / stats.length : 0;
  const avgBounce= stats.length ? stats.reduce((s, x) => s + x.bounceRate, 0) / stats.length : 0;
  const maxMAU   = Math.max(...stats.map(s => s.mau), 1);

  const CHANNEL_ICON: Record<string, string> = { SDUI: '📱', WEB_STANDARD: '🌐', WEB_WECHAT: '💬' };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* KPI summary row */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard icon="👥" label="Total MAU" value={fmt(totalMAU)} sub="Monthly Active Users" />
          <KpiCard icon="📅" label="Total DAU" value={fmt(totalDAU)} sub="Daily Active Users" />
          <KpiCard icon="📆" label="Total WAU" value={fmt(totalWAU)} sub="Weekly Active Users" />
          <KpiCard icon="🎯" label="Avg Conversion" value={pct(avgConv)} sub="Primary CTA goal" color={avgConv >= 0.05 ? '#059669' : '#DC2626'} />
          <KpiCard icon="↩️" label="Avg Bounce Rate" value={pct(avgBounce)} sub="Single-page sessions" color={avgBounce <= 0.3 ? '#059669' : avgBounce <= 0.45 ? '#D97706' : '#DC2626'} />
        </div>
      </div>

      {/* Per-page table */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 13 }}>
            Page Breakdown
          </div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 90px 90px 90px 90px 90px', padding: '8px 20px', background: 'var(--surface-active)', gap: 8 }}>
            {['Page', 'Channel', 'MAU', 'DAU', 'Conv %', 'CTR', 'Bounce', 'Avg Session'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {sorted.map((stat, i) => {
            const page = pages.find(p => p.pageId === stat.pageId);
            const target = targets.find(t => t.targetId === stat.targetId);
            return (
              <div key={`${stat.pageId}-${stat.targetId}`} style={{
                display: 'grid', gridTemplateColumns: '2fr 100px 90px 90px 90px 90px 90px 90px',
                padding: '14px 20px', borderBottom: i < sorted.length - 1 ? '1px solid var(--border-light)' : 'none',
                alignItems: 'center', gap: 8,
              }}>
                {/* Page name + target */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {page?.thumbnail} {page?.name ?? stat.pageId}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(219,0,17,0.07)', color: '#DB0011' }}>{target?.displayName ?? stat.targetId}</span>
                    <span>{stat.newUsers.toLocaleString()} new · {fmt(stat.returningUsers)} returning</span>
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <Bar value={stat.mau} max={maxMAU} />
                  </div>
                </div>
                {/* Channel */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {CHANNEL_ICON[page?.channel ?? ''] ?? '?'} {page?.channel?.replace('_', ' ') ?? '—'}
                </div>
                {/* MAU */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(stat.mau)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>↑{fmt(stat.wau)}/wk</div>
                </div>
                {/* DAU */}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(stat.dau)}</div>
                {/* Conversion */}
                <div><RateChip value={stat.conversionRate} good={stat.conversionRate >= 0.05} label="Conversion Rate" /></div>
                {/* CTR */}
                <div><RateChip value={stat.ctr} good={stat.ctr >= 0.2} label="Click-through Rate" /></div>
                {/* Bounce */}
                <div><RateChip value={stat.bounceRate} good={stat.bounceRate <= 0.35} label="Bounce Rate" /></div>
                {/* Session */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{dur(stat.avgSessionSec)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{stat.avgPageDepth.toFixed(1)} pages/session</div>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No page statistics available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Journeys tab ─────────────────────────────────────────────────────────────

function JourneysStats({ stats, journeys, targets }: {
  stats: JourneyUsageStat[];
  journeys: { journeyId: string; name: string; channel: string; steps: unknown[] }[];
  targets: { targetId: string; displayName: string }[];
}) {
  const sorted = [...stats].sort((a, b) => b.mau - a.mau);
  const totalMAU      = stats.reduce((s, x) => s + x.mau, 0);
  const totalDAU      = stats.reduce((s, x) => s + x.dau, 0);
  const avgCompletion = stats.length ? stats.reduce((s, x) => s + x.completionRate, 0) / stats.length : 0;
  const avgConv       = stats.length ? stats.reduce((s, x) => s + x.conversionRate, 0) / stats.length : 0;
  const maxMAU        = Math.max(...stats.map(s => s.mau), 1);

  const CHANNEL_ICON: Record<string, string> = { SDUI: '📱', WEB_STANDARD: '🌐', WEB_WECHAT: '💬' };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* KPI summary */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard icon="🗺️" label="Total MAU" value={fmt(totalMAU)} sub="Journey Monthly Active Users" />
          <KpiCard icon="📅" label="Total DAU" value={fmt(totalDAU)} sub="Daily starters" />
          <KpiCard icon="✅" label="Avg Completion" value={pct(avgCompletion)} sub="Finished all steps" color={avgCompletion >= 0.6 ? '#059669' : avgCompletion >= 0.4 ? '#D97706' : '#DC2626'} />
          <KpiCard icon="🎯" label="Avg Conversion" value={pct(avgConv)} sub="End-goal achieved" color={avgConv >= 0.5 ? '#059669' : '#D97706'} />
          <KpiCard icon="📋" label="Live Journeys" value={String(stats.length)} sub="with usage data" />
        </div>
      </div>

      {/* Per-journey table */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 13 }}>
            Journey Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 80px 80px 90px 90px 100px 90px', padding: '8px 20px', background: 'var(--surface-active)', gap: 8 }}>
            {['Journey', 'Channel', 'MAU', 'DAU', 'Start Rate', 'Completion', 'Avg Time', 'Conversion'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {sorted.map((stat, i) => {
            const journey = journeys.find(j => j.journeyId === stat.journeyId);
            const target  = targets.find(t => t.targetId === stat.targetId);
            const stepCount = journey?.steps?.length ?? 0;
            return (
              <div key={`${stat.journeyId}-${stat.targetId}`} style={{
                display: 'grid', gridTemplateColumns: '2fr 90px 80px 80px 90px 90px 100px 90px',
                padding: '14px 20px', borderBottom: i < sorted.length - 1 ? '1px solid var(--border-light)' : 'none',
                alignItems: 'center', gap: 8,
              }}>
                {/* Journey name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    🗺️ {journey?.name ?? stat.journeyId}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(219,0,17,0.07)', color: '#DB0011' }}>{target?.displayName ?? stat.targetId}</span>
                    <span>{stepCount} steps · drop-off at step {stat.dropOffStep}</span>
                  </div>
                  <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bar value={stat.mau} max={maxMAU} color="#6366F1" />
                  </div>
                </div>
                {/* Channel */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {CHANNEL_ICON[journey?.channel ?? ''] ?? '?'} {journey?.channel?.replace('_', ' ') ?? '—'}
                </div>
                {/* MAU */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(stat.mau)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>↑{fmt(stat.wau)}/wk</div>
                </div>
                {/* DAU */}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(stat.dau)}</div>
                {/* Start rate */}
                <div><RateChip value={stat.journeyStartRate} good={stat.journeyStartRate >= 0.6} label="Journey Start Rate" /></div>
                {/* Completion */}
                <div>
                  <RateChip value={stat.completionRate} good={stat.completionRate >= 0.5} label="Journey Completion Rate" />
                  {/* Mini funnel bar */}
                  <div style={{ marginTop: 4, height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden', width: 64 }}>
                    <div style={{ height: '100%', width: `${stat.completionRate * 100}%`, background: stat.completionRate >= 0.5 ? '#059669' : '#D97706', borderRadius: 2 }} />
                  </div>
                </div>
                {/* Avg time */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{dur(stat.avgCompletionSec)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>to complete</div>
                </div>
                {/* Conversion */}
                <div><RateChip value={stat.conversionRate} good={stat.conversionRate >= 0.5} label="Goal Conversion Rate" /></div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No journey statistics available.</div>
          )}
        </div>

        {/* Funnel legend */}
        {sorted.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface-panel)', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Metric definitions</strong>
            <span style={{ margin: '0 12px' }}>·</span>
            <strong>Start Rate</strong> — % of MAU who initiated the journey
            <span style={{ margin: '0 12px' }}>·</span>
            <strong>Completion</strong> — % of starters who finished all steps
            <span style={{ margin: '0 12px' }}>·</span>
            <strong>Conversion</strong> — % who achieved the end goal (e.g. account opened, card applied)
            <span style={{ margin: '0 12px' }}>·</span>
            <strong>Drop-off step</strong> — step index with the highest abandonment rate
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function StatisticsPanel() {
  const { state } = useOCDP();
  const { usageStats, journeyStats, pages, releaseTargets, journeys } = state;
  const [tab, setTab] = useState<'pages' | 'journeys'>('pages');

  const TAB_META = [
    { key: 'pages'    as const, label: 'Pages',    icon: '📄', count: usageStats.length },
    { key: 'journeys' as const, label: 'Journeys', icon: '🗺️', count: journeyStats.length },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      {/* Top header */}
      <div style={{ padding: '20px 24px 0', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Delivery Statistics</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
          Usage analytics for published pages and journeys — DAU, WAU, MAU, conversion, bounce and funnel metrics
        </p>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TAB_META.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 20px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#DB0011' : 'var(--text-muted)',
              background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid #DB0011' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.icon} {t.label}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: tab === t.key ? 'rgba(219,0,17,0.1)' : '#F3F4F6', color: tab === t.key ? '#DB0011' : '#9CA3AF' }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'pages' ? (
          <>
            <SectionHeader
              title="Page Analytics"
              sub="Live published pages — traffic, engagement and conversion metrics"
              count={usageStats.length}
            />
            <PagesStats stats={usageStats} pages={pages} targets={releaseTargets} />
          </>
        ) : (
          <>
            <SectionHeader
              title="Journey Analytics"
              sub="Live published journeys — funnel, completion and conversion metrics"
              count={journeyStats.length}
            />
            <JourneysStats stats={journeyStats} journeys={journeys} targets={releaseTargets} />
          </>
        )}
      </div>
    </div>
  );
}
