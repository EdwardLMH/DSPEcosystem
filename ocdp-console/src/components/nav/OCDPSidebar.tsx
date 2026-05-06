import React from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { NavView } from '../../types/ocdp';

interface NavItem { view: NavView; label: string; icon: string; adminOnly?: boolean }

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'DELIVER',
    items: [
      { view: 'pages',    label: 'Pages',    icon: '📄' },
      { view: 'journeys', label: 'Journeys', icon: '🗺️' },
      { view: 'preview',  label: 'Preview',  icon: '📱' },
    ],
  },
  {
    label: 'REVIEW',
    items: [
      { view: 'pending', label: 'Pending', icon: '🕐' },
      { view: 'history', label: 'History', icon: '📋' },
    ],
  },
  {
    label: 'ANALYSE',
    items: [
      { view: 'stats', label: 'Statistics', icon: '📊' },
      { view: 'aeo',   label: 'AEO / SEO',  icon: '🔍' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { view: 'admin-markets',  label: 'Markets',         icon: '🌏', adminOnly: true },
      { view: 'admin-bizlines', label: 'Biz Lines',       icon: '🏢', adminOnly: true },
      { view: 'admin-groups',   label: 'AD Groups',       icon: '👥', adminOnly: true },
      { view: 'admin-flows',    label: 'Approval Flows',  icon: '⚙️', adminOnly: true },
      { view: 'audit',          label: 'Audit Log',       icon: '🔒', adminOnly: true },
    ],
  },
  {
    label: 'WECHAT',
    items: [
      { view: 'wechat', label: 'Composer', icon: '💬' },
    ],
  },
];

function roleBadgeStyle(role: string): React.CSSProperties {
  if (role === 'ADMIN')    return { background: 'rgba(219,0,17,0.2)', color: '#FF6677' };
  if (role === 'AUDITOR')  return { background: 'rgba(200,169,81,0.2)', color: '#C8A951' };
  if (role.endsWith('-APPROVER')) return { background: 'rgba(5,150,105,0.2)', color: '#34D399' };
  return { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' };
}

export function OCDPSidebar() {
  const { state, dispatch } = useOCDP();
  const { currentUser, navView } = state;

  const isAdmin   = currentUser.role === 'ADMIN' || !!currentUser.isGlobalAdmin;
  const isAuditor = currentUser.role === 'AUDITOR';
  const showAdmin = isAdmin || isAuditor;

  return (
    <div style={{ width: 200, flexShrink: 0, background: 'var(--surface-sidebar)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo block */}
      <div style={{ padding: '16px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 34, height: 34, background: 'var(--hsbc-red)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: -1, flexShrink: 0 }}>H</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, lineHeight: 1, letterSpacing: '0.01em' }}>OCDP Console</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>OmniChannel Delivery Platform</div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(item => !item.adminOnly || showAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <div style={{ padding: '10px 14px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>
                {section.label}
              </div>
              {visibleItems.map(item => {
                const isActive = navView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => dispatch({ type: 'SET_NAV_VIEW', view: item.view })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '7px 14px',
                      background: isActive ? 'rgba(219,0,17,0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--hsbc-red)' : '3px solid transparent',
                      border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', letterSpacing: '0.01em' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User info */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 14px', flexShrink: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentUser.name}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 6px', ...roleBadgeStyle(currentUser.role) }}>{currentUser.role}</span>
          <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(219,0,17,0.15)', color: '#FF6677', borderRadius: 4, padding: '2px 6px' }}>{currentUser.marketId}</span>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_ENTITLEMENT_MODAL' })}
          style={{ width: '100%', padding: '6px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', letterSpacing: '0.02em' }}
        >
          Log on / Switch User
        </button>
      </div>
    </div>
  );
}
