import { useOCDP } from '../../store/OCDPStore';
import { MOCK_USERS } from '../../store/mockData';

export function EntitlementModal() {
  const { state, dispatch } = useOCDP();
  const { currentUser } = state;

  function roleBadgeColor(role: string) {
    if (role === 'ADMIN')    return { bg: 'rgba(219,0,17,0.1)', color: '#DB0011' };
    if (role === 'AUDITOR')  return { bg: 'rgba(200,169,81,0.15)', color: '#92703B' };
    if (role.endsWith('-APPROVER')) return { bg: 'rgba(5,150,105,0.1)', color: '#059669' };
    return { bg: 'rgba(37,99,235,0.1)', color: '#2563EB' };
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as never, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: 108, paddingRight: 24 }}
      onClick={() => dispatch({ type: 'TOGGLE_ENTITLEMENT_MODAL' })}
    >
      <div
        style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-xl)', width: 320, overflow: 'hidden', border: '1px solid var(--border-light)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: 'var(--hsbc-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{currentUser.email}</div>
          </div>
        </div>

        {/* Current entitlements */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Current Entitlement</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(() => { const c = roleBadgeColor(currentUser.role); return (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color }}>{currentUser.role}</span>
            );})()}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{currentUser.marketId}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'var(--surface-active)', color: 'var(--text-secondary)' }}>{currentUser.bizLineId}</span>
          </div>
        </div>

        {/* User switcher */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Switch Identity (Demo)</div>
          {MOCK_USERS.map(u => {
            const isActive = u.id === currentUser.id;
            const c = roleBadgeColor(u.role);
            return (
              <button
                key={u.id}
                onClick={() => { dispatch({ type: 'SET_USER', user: u }); dispatch({ type: 'TOGGLE_ENTITLEMENT_MODAL' }); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                  background: isActive ? 'rgba(219,0,17,0.05)' : 'transparent',
                  border: isActive ? '1px solid rgba(219,0,17,0.15)' : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 16, background: isActive ? 'var(--hsbc-red)' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#fff' : '#6B7280', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: c.bg, color: c.color }}>{u.role}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>{u.marketId}</span>
                  </div>
                </div>
                {isActive && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#DB0011', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 20px' }}>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_ENTITLEMENT_MODAL' })}
            style={{ width: '100%', padding: '8px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
