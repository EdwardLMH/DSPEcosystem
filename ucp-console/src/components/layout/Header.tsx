import { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { MOCK_USERS } from '../../store/mockData';
import type { NavView } from '../../types/ucp';

// ─── UCP nav items for the second strip ───────────────────────────────────────

interface NavItem { view: NavView; label: string; section: string; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { view: 'content',         label: 'Content',       section: 'AUTHOR'  },
  { view: 'components',      label: 'Components',    section: 'AUTHOR'  },
  { view: 'history',         label: 'History',       section: 'ADMIN',  adminOnly: true },
  { view: 'admin-bizlines',  label: 'Biz Lines',     section: 'ADMIN',  adminOnly: true },
  { view: 'audit',           label: 'Audit Log',     section: 'ADMIN',  adminOnly: true },
];

// ─── HSBC Diamond SVG Logo ────────────────────────────────────────────────────

function HSBCLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="42" height="42" fill="#DB0011" />
      <polygon points="21,6 36,21 21,21" fill="rgba(255,255,255,0.85)" />
      <polygon points="6,21 21,21 21,36" fill="rgba(255,255,255,0.85)" />
      <polygon points="21,21 36,21 21,36" fill="rgba(255,255,255,0.45)" />
      <polygon points="21,6 21,21 6,21" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

// ─── UCP Header ───────────────────────────────────────────────────────────────

export function Header() {
  const { state, dispatch } = useUCP();
  const { navView, currentUser } = state;
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN' || !!currentUser.isGlobalAdmin;
  const visibleItems = NAV_ITEMS.filter(i => !i.adminOnly || isAdmin);

  return (
    <>
      {/* ── Top strip: platform identity + user ───────────────────────────── */}
      <div style={{
        background: '#1A1A1A',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 24px',
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Platform label */}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', fontFamily: 'var(--font-family)' }}>
            Unified Content Platform
          </div>

          {/* Right: language + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{
              fontSize: 12, color: 'rgba(255,255,255,0.65)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-family)',
            }}>
              English
              <span style={{ fontSize: 9 }}>▾</span>
            </button>

            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)' }} />

            {/* User switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  letterSpacing: '0.01em',
                  fontFamily: 'var(--font-family)',
                  cursor: 'pointer',
                }}
              >
                {currentUser.name}
                <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>({currentUser.role})</span>
                <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 4 }}>▾</span>
              </button>
              {showUserMenu && (
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    border: '1px solid #E5E7EB', minWidth: 240, zIndex: 200, overflow: 'hidden',
                  }}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Switch Profile
                  </div>
                  {MOCK_USERS.map(u => {
                    const isActive = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => { dispatch({ type: 'SET_USER', user: u }); setShowUserMenu(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', background: isActive ? 'rgba(219,0,17,0.05)' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          borderLeft: isActive ? '3px solid #DB0011' : '3px solid transparent',
                          fontFamily: 'var(--font-family)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#DB0011' : '#111' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>{u.role} · {u.marketId}</div>
                        </div>
                        {isActive && <span style={{ fontSize: 12, color: '#DB0011' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Second strip: HSBC logo + UCP nav ────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'stretch',
          height: 52,
        }}>
          {/* HSBC logo + wordmark */}
          <div style={{ marginRight: 24, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <HSBCLogo />
            <span style={{ fontSize: 17, fontWeight: 800, color: '#DB0011', letterSpacing: '-0.03em', fontFamily: 'var(--font-family)' }}>HSBC</span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: '#E5E7EB', margin: '10px 20px 10px 0', flexShrink: 0 }} />

          {/* Nav items */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {visibleItems.map(item => {
              const isActive = navView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => dispatch({ type: 'SET_NAV_VIEW', view: item.view })}
                  style={{
                    padding: '0 16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #DB0011' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.12s',
                    fontFamily: 'var(--font-family)',
                    gap: 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase', lineHeight: 1 }}>
                    {item.section}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#DB0011' : '#1A1A1A', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* UCP badge (right) */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              padding: '4px 10px',
              background: 'rgba(219,0,17,0.06)',
              border: '1px solid rgba(219,0,17,0.2)',
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 700,
              color: '#DB0011',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              UCP CONSOLE
            </div>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#059669',
              boxShadow: '0 0 0 2px rgba(5,150,105,0.2)',
            }} title="Platform online" />
          </div>
        </div>
      </div>
    </>
  );
}
