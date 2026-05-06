import { useOCDP } from '../../store/OCDPStore';

export function AuditLogPanel() {
  const { state } = useOCDP();
  const { audit } = state;
  const sorted = [...audit].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const ACTION_ICON: Record<string, string> = {
    PAGE_RELEASED: '🚀', PAGE_SUBMITTED: '📤', APPROVED: '✅', REJECTED: '❌',
    WECHAT_MSG_SENT: '💬', PUBLISHED: '🌐', DEFAULT: '📋',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Log</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Full trail of all OCDP platform actions</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          {sorted.map((entry, i) => (
            <div key={entry.id} style={{ padding: '14px 20px', borderBottom: i < sorted.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{ACTION_ICON[entry.action] ?? ACTION_ICON.DEFAULT}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{entry.action.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {entry.actorId}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 3, background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>{entry.actorRole}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{entry.pageName}</div>
                {entry.details && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{entry.details}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {entry.marketId && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{entry.marketId}</span>}
                  {entry.releaseTargetId && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'var(--surface-active)', color: 'var(--text-secondary)' }}>{entry.releaseTargetId}</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
