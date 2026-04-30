import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { AEOGradeBadge } from '../shared/AEOGradeBadge';
import { ChannelBadge } from '../shared/ChannelBadge';
import { PageLayout, StatPeriod } from '../../types/ucp';

// ─── Stat row helper ──────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const PERIODS: StatPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
const PERIOD_LABEL: Record<StatPeriod, string> = {
  DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly',
};

// ─── StatsPanel ───────────────────────────────────────────────────────────────

export function StatsPanel() {
  const { state } = useUCP();
  const { pages, usageStats, aeoScores, releaseTargets, marketStatus } = state;

  const [selectedPageId, setSelectedPageId] = useState<string>(
    pages[0]?.pageId ?? ''
  );

  const selectedPage = pages.find(p => p.pageId === selectedPageId) ?? pages[0];

  const pageStats   = usageStats.filter(s => s.pageId === selectedPageId);
  const pageAEO     = aeoScores.filter(s => s.pageId === selectedPageId);
  const pageMkStatus = marketStatus.filter(s => s.pageId === selectedPageId);

  // Unique release targets that have stats
  const statTargetIds = Array.from(new Set(pageStats.map(s => s.releaseTargetId)));

  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-bg)',
    }}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--surface-panel)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Statistics &amp; AEO
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Usage analytics and Answer Engine Optimisation scores
          </div>
        </div>

        {/* Page selector */}
        <select
          value={selectedPageId}
          onChange={e => setSelectedPageId(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '7px 12px',
            border: '1.5px solid var(--border-mid)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontFamily: 'var(--font-family)',
            background: '#fff',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            minWidth: 240,
          }}
        >
          {pages.map(p => (
            <option key={p.pageId} value={p.pageId}>
              {p.thumbnail} {p.name}
            </option>
          ))}
        </select>

        {selectedPage && <ChannelBadge channel={selectedPage.channel} size="sm" />}
      </div>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Usage stats table ─────────────────────────────────────── */}
          <section>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Traffic Overview
            </div>

            {pageStats.length === 0 ? (
              <EmptyCard message="No usage data available for this page." />
            ) : (
              <div style={{
                background: 'var(--surface-panel)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-hover)' }}>
                      <th style={thStyle}>Period</th>
                      {statTargetIds.map(tid => {
                        const rt = releaseTargets.find(r => r.targetId === tid);
                        return (
                          <React.Fragment key={tid}>
                            <th style={thStyle} colSpan={2}>
                              {rt?.displayName ?? tid}
                            </th>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                    <tr style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-light)' }}>
                      <th style={{ ...thStyle, fontWeight: 400, color: 'var(--text-muted)' }} />
                      {statTargetIds.map(tid => (
                        <React.Fragment key={tid}>
                          <th style={{ ...thStyle, fontWeight: 500, fontSize: 11, color: 'var(--text-muted)' }}>
                            Total Accesses
                          </th>
                          <th style={{ ...thStyle, fontWeight: 500, fontSize: 11, color: 'var(--text-muted)' }}>
                            Unique Users
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period, i) => (
                      <tr
                        key={period}
                        style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface-hover)' }}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {PERIOD_LABEL[period]}
                        </td>
                        {statTargetIds.map(tid => {
                          const stat = pageStats.find(s => s.releaseTargetId === tid && s.period === period);
                          return (
                            <React.Fragment key={tid}>
                              <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 500 }}>
                                {stat ? fmt(stat.totalAccesses) : '—'}
                              </td>
                              <td style={tdStyle}>
                                {stat ? fmt(stat.uniqueUsers) : '—'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── WeChat SA metrics (WEB_WECHAT only) ──────────────────── */}
          {selectedPage?.channel === 'WEB_WECHAT' && (
            <section>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                WeChat Service Account Metrics
              </div>

              {pageStats.filter(s => s.sourceStack === 'WECHAT_SA').length === 0 ? (
                <EmptyCard message="No WeChat SA metrics recorded for this page." />
              ) : (
                <div style={{
                  background: 'var(--surface-panel)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  overflow: 'hidden',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#E6F9EE', borderBottom: '2px solid #A7F3D0' }}>
                        <th style={thStyle}>Period</th>
                        <th style={thStyle}>Delivered</th>
                        <th style={thStyle}>Opened</th>
                        <th style={thStyle}>Clicked</th>
                        <th style={thStyle}>Shared</th>
                        <th style={thStyle}>Open Rate</th>
                        <th style={thStyle}>CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageStats
                        .filter(s => s.templateMsgDelivered !== undefined)
                        .map((s, i) => {
                          const openRate = s.templateMsgDelivered
                            ? ((s.templateMsgOpened ?? 0) / s.templateMsgDelivered * 100).toFixed(1)
                            : '—';
                          const ctr = s.templateMsgDelivered
                            ? ((s.templateMsgClicked ?? 0) / s.templateMsgDelivered * 100).toFixed(1)
                            : '—';
                          return (
                            <tr key={s.statId} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface-hover)' }}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{PERIOD_LABEL[s.period]}</td>
                              <td style={tdStyle}>{fmt(s.templateMsgDelivered ?? 0)}</td>
                              <td style={tdStyle}>{fmt(s.templateMsgOpened ?? 0)}</td>
                              <td style={tdStyle}>{fmt(s.templateMsgClicked ?? 0)}</td>
                              <td style={tdStyle}>{fmt(s.wechatShareCount ?? 0)}</td>
                              <td style={{ ...tdStyle, color: 'var(--status-approved)', fontWeight: 600 }}>{openRate}%</td>
                              <td style={{ ...tdStyle, color: 'var(--status-live)', fontWeight: 600 }}>{ctr}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── AEO / SEO scores (WEB_STANDARD only) ─────────────────── */}
          {selectedPage?.channel === 'WEB_STANDARD' && (
            <section>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                AEO / SEO Scores — Live Markets
              </div>

              {pageAEO.length === 0 ? (
                <EmptyCard message="No AEO scores recorded. Scores are generated on submit and DAP sync." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {pageAEO.map(score => {
                    const rt      = releaseTargets.find(r => r.targetId === score.releaseTargetId);
                    const mStatus = pageMkStatus.find(s => s.releaseTargetId === score.releaseTargetId);
                    const isLive  = mStatus?.productionStatus === 'LIVE';

                    return (
                      <div
                        key={score.scoreId}
                        style={{
                          background: 'var(--surface-panel)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        {/* Target header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {rt?.displayName ?? score.releaseTargetId}
                            </div>
                            {isLive && (
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: 'var(--prod-live)',
                                background: 'var(--prod-live-bg)',
                                padding: '1px 6px', borderRadius: 'var(--radius-full)',
                                marginTop: 3, display: 'inline-block',
                              }}>
                                LIVE
                              </span>
                            )}
                          </div>
                          <AEOGradeBadge grade={score.aeoGrade} score={score.totalScore} size="md" />
                        </div>

                        {/* Score breakdown */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{
                            flex: 1, background: 'var(--surface-hover)',
                            borderRadius: 'var(--radius-md)', padding: '8px 10px', textAlign: 'center',
                          }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                              {score.staticScore}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Static</div>
                          </div>
                          <div style={{
                            flex: 1, background: score.llmCitationPts > 0 ? 'var(--aeo-a-bg)' : 'var(--surface-hover)',
                            borderRadius: 'var(--radius-md)', padding: '8px 10px', textAlign: 'center',
                          }}>
                            <div style={{
                              fontSize: 18, fontWeight: 800,
                              color: score.llmCitationPts > 0 ? 'var(--aeo-a)' : 'var(--text-muted)',
                            }}>
                              +{score.llmCitationPts}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>LLM Citation</div>
                          </div>
                        </div>

                        {/* LLM citation note */}
                        {score.llmCitationNote && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {score.llmCitationNote}
                          </div>
                        )}

                        {/* Score date */}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Scored {new Date(score.scoredAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border-light)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-light)',
};

function EmptyCard({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px 20px',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--text-muted)',
    }}>
      {message}
    </div>
  );
}
