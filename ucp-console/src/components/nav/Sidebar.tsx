import React from 'react';
import { useUCP } from '../../store/UCPStore';
import { MOCK_USERS } from '../../store/mockData';
import { NavView } from '../../types/ucp';

// ─── Nav item definitions ─────────────────────────────────────────────────────

interface NavItem {
  view: NavView;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'AUTHOR',
    items: [
      { view: 'pages',      label: 'Pages',      icon: '📄' },
      { view: 'content',    label: 'Content',    icon: '📝' },
      { view: 'components', label: 'Components', icon: '🧩' },
    ],
  },
  {
    label: 'REVIEW',
    items: [
      { view: 'pending', label: 'Pending',  icon: '🕐' },
      { view: 'history', label: 'History',  icon: '📋' },
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
      { view: 'admin-markets',  label: 'Markets',       icon: '🌏', adminOnly: true },
      { view: 'admin-bizlines', label: 'Biz Lines',     icon: '🏢', adminOnly: true },
      { view: 'audit',          label: 'Audit Log',     icon: '🔒', adminOnly: true },
    ],
  },
];

// ─── Role badge colour helper ─────────────────────────────────────────────────

function roleBadgeStyle(role: string): React.CSSProperties {
  if (role === 'ADMIN')    return { background: 'rgba(219,0,17,0.2)', color: '#FF6677' };
  if (role === 'AUDITOR')  return { background: 'rgba(200,169,81,0.2)', color: '#C8A951' };
  if (role.endsWith('-APPROVER')) return { background: 'rgba(5,150,105,0.2)', color: '#34D399' };
  return { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' };
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { state, dispatch } = useUCP();
  const { currentUser, navView } = state;

  const isAdmin   = currentUser.role === 'ADMIN' || !!currentUser.isGlobalAdmin;
  const isAuditor = currentUser.role === 'AUDITOR';
  const showAdmin = isAdmin || isAuditor;

  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      background: 'var(--surface-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>

      {/* ── Logo block ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 14px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--hsbc-red)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: -1,
            flexShrink: 0,
          }}>H</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: '#fff', fontWeight: 700, fontSize: 12,
              lineHeight: 1, letterSpacing: '0.01em',
            }}>UCP Console</div>
            <div style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 9,
              marginTop: 3, lineHeight: 1.3,
            }}>HSBC Unified Content Platform</div>
          </div>
        </div>
      </div>

      {/* ── Nav sections ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(item =>
            !item.adminOnly || showAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} style={{ marginBottom: 4 }}>
              {/* Section label */}
              <div style={{
                padding: '10px 14px 4px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase',
              }}>
                {section.label}
              </div>

              {/* Items */}
              {visibleItems.map(item => {
                const isActive = navView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => dispatch({ type: 'SET_NAV_VIEW', view: item.view })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      width: '100%',
                      padding: '7px 14px',
                      background: isActive ? 'rgba(219,0,17,0.12)' : 'transparent',
                      borderLeft: isActive
                        ? '3px solid var(--hsbc-red)'
                        : '3px solid transparent',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                      letterSpacing: '0.01em',
                    }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── User info + role switcher ───────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '12px 14px',
        flexShrink: 0,
      }}>
        {/* Name */}
        <div style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {currentUser.name}
        </div>

        {/* Role + Market badges */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 6px',
            ...roleBadgeStyle(currentUser.role),
          }}>
            {currentUser.role}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            background: 'rgba(219,0,17,0.15)',
            color: '#FF6677',
            borderRadius: 4, padding: '2px 6px',
          }}>
            {currentUser.marketId}
          </span>
        </div>

        {/* Role switcher */}
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
          SWITCH USER (DEMO)
        </div>
        <select
          value={currentUser.id}
          onChange={e => {
            const u = MOCK_USERS.find(u => u.id === e.target.value);
            if (u) dispatch({ type: 'SET_USER', user: u });
          }}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            padding: '5px 8px',
            fontSize: 10,
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
          }}
        >
          {MOCK_USERS.map(u => (
            <option key={u.id} value={u.id} style={{ background: '#1E2235', color: '#fff' }}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
