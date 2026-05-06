import { useState, useEffect, useCallback } from 'react';
import { useOCDPDB } from '../../db/OCDPDBProvider';
import { queryMetadata, queryActivity } from '../../db/ocdpDB';
import type { OcdpMetadataRow, OcdpActivityRow } from '../../db/ocdpDB';

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  pill: (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    color, background: bg, whiteSpace: 'nowrap' as const,
  }),
  th: {
    padding: '8px 12px', fontSize: 11, fontWeight: 700,
    color: '#6B7280', textAlign: 'left' as const,
    borderBottom: '1px solid #E5E7EB', background: '#F9FAFB',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  td: {
    padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #F3F4F6',
    verticalAlign: 'top' as const, color: '#374151',
  } as React.CSSProperties,
};

function statusPill(status: string) {
  const map: Record<string, [string, string]> = {
    DRAFT:            ['#6B7280', '#F3F4F6'],
    PENDING_APPROVAL: ['#D97706', '#FEF3C7'],
    APPROVED:         ['#059669', '#D1FAE5'],
    REJECTED:         ['#DC2626', '#FEE2E2'],
    LIVE:             ['#2563EB', '#EFF6FF'],
  };
  const [c, bg] = map[status] ?? ['#6B7280', '#F3F4F6'];
  return <span style={S.pill(c, bg)}>{status.replace('_', ' ')}</span>;
}

function kindPill(kind: string) {
  const map: Record<string, [string, string]> = {
    PAGE:    ['#DB0011', '#FFF1F2'],
    JOURNEY: ['#7C3AED', '#F5F3FF'],
  };
  const [c, bg] = map[kind] ?? ['#6B7280', '#F3F4F6'];
  return <span style={S.pill(c, bg)}>{kind}</span>;
}

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

// ─── Metadata Tab ─────────────────────────────────────────────────────────────

function MetadataTab({ db }: { db: NonNullable<ReturnType<typeof useOCDPDB>['db']> }) {
  const [rows, setRows] = useState<OcdpMetadataRow[]>([]);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await queryMetadata(db, {
      kind: kindFilter || undefined,
      marketId: marketFilter || undefined,
      search: search || undefined,
    });
    setRows(result);
    setLoading(false);
  }, [db, search, kindFilter, marketFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 10, flexShrink: 0, background: '#fff', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, width: 200, fontFamily: 'var(--font-family)' }}
        />
        <select
          value={kindFilter}
          onChange={e => setKindFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-family)' }}
        >
          <option value="">All types</option>
          <option value="PAGE">Pages</option>
          <option value="JOURNEY">Journeys</option>
        </select>
        <input
          value={marketFilter}
          onChange={e => setMarketFilter(e.target.value)}
          placeholder="Market ID…"
          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, width: 120, fontFamily: 'var(--font-family)' }}
        />
        <button
          onClick={load}
          style={{ padding: '6px 14px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}
        >
          Refresh
        </button>
        <span style={{ fontSize: 11, color: '#9CA3AF', alignSelf: 'center', marginLeft: 'auto' }}>
          {loading ? 'Loading…' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading from database…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No records found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={S.th}>Type</th>
                <th style={S.th}>Name</th>
                <th style={S.th}>Channel</th>
                <th style={S.th}>Market</th>
                <th style={S.th}>Biz Line</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Updated</th>
                <th style={S.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ background: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <td style={S.td}>{kindPill(row.kind)}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{row.name}</td>
                  <td style={{ ...S.td, color: '#6B7280' }}>{row.channel ?? '—'}</td>
                  <td style={{ ...S.td, color: '#6B7280' }}>{row.market_id}</td>
                  <td style={{ ...S.td, color: '#6B7280' }}>{row.biz_line_id}</td>
                  <td style={S.td}>{statusPill(row.status)}</td>
                  <td style={{ ...S.td, color: '#9CA3AF' }}>{fmt(row.updated_at)}</td>
                  <td style={{ ...S.td, color: '#9CA3AF' }}>{fmt(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ db }: { db: NonNullable<ReturnType<typeof useOCDPDB>['db']> }) {
  const [rows, setRows] = useState<OcdpActivityRow[]>([]);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await queryActivity(db, { entityKind: kindFilter || undefined, search: search || undefined });
    setRows(result);
    setLoading(false);
  }, [db, search, kindFilter]);

  useEffect(() => { load(); }, [load]);

  function actionColor(action: string): string {
    if (action.includes('CREAT')) return '#059669';
    if (action.includes('DELET')) return '#DC2626';
    if (action.includes('PUBLISH')) return '#2563EB';
    if (action.includes('APPROV')) return '#059669';
    if (action.includes('REJECT')) return '#DC2626';
    if (action.includes('SUBMIT')) return '#D97706';
    return '#6B7280';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 10, flexShrink: 0, background: '#fff', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search entity, action, actor…"
          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, width: 220, fontFamily: 'var(--font-family)' }}
        />
        <select
          value={kindFilter}
          onChange={e => setKindFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-family)' }}
        >
          <option value="">All entity types</option>
          <option value="PAGE">Pages</option>
          <option value="JOURNEY">Journeys</option>
        </select>
        <button
          onClick={load}
          style={{ padding: '6px 14px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}
        >
          Refresh
        </button>
        <span style={{ fontSize: 11, color: '#9CA3AF', alignSelf: 'center', marginLeft: 'auto' }}>
          {loading ? 'Loading…' : `${rows.length} event${rows.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading from database…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No activity recorded yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={S.th}>Timestamp</th>
                <th style={S.th}>Actor</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Action</th>
                <th style={S.th}>Entity</th>
                <th style={S.th}>Name</th>
                <th style={S.th}>Market</th>
                <th style={S.th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ background: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <td style={{ ...S.td, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmt(row.ts)}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{row.actor_id}</td>
                  <td style={{ ...S.td, color: '#6B7280' }}>{row.actor_role}</td>
                  <td style={S.td}>
                    <span style={{ fontWeight: 700, color: actionColor(row.action) }}>{row.action}</span>
                  </td>
                  <td style={S.td}>{kindPill(row.entity_kind)}</td>
                  <td style={{ ...S.td, color: '#111827' }}>{row.entity_name}</td>
                  <td style={{ ...S.td, color: '#6B7280' }}>{row.market_id ?? '—'}</td>
                  <td style={{ ...S.td, color: '#9CA3AF' }}>{row.details ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── OCDPHistoryPanel ─────────────────────────────────────────────────────────

export function OCDPHistoryPanel() {
  const { db, ready } = useOCDPDB();
  const [tab, setTab] = useState<'metadata' | 'activity'>('metadata');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? '#DB0011' : '#6B7280',
    background: 'transparent', border: 'none',
    borderBottom: active ? '2px solid #DB0011' : '2px solid transparent',
    cursor: 'pointer', fontFamily: 'var(--font-family)',
  });

  if (!ready || !db) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
        Initialising database…
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 0', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Database History</h1>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>ocdp-db (IndexedDB / PGlite)</span>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          <button style={tabStyle(tab === 'metadata')} onClick={() => setTab('metadata')}>Metadata</button>
          <button style={tabStyle(tab === 'activity')} onClick={() => setTab('activity')}>Activity Log</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'metadata' ? <MetadataTab db={db} /> : <ActivityTab db={db} />}
      </div>
    </div>
  );
}
