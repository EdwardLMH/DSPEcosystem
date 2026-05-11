import { useState, useRef, useEffect } from 'react';
import { useOCDP, isAdmin } from '../../store/OCDPStore';
import type { Persona, NavView } from '../../types/ocdp';
import { EntitlementModal } from './EntitlementModal';
import { SUPPORTED_LOCALES, getLocaleInfo } from '../../utils/i18n';

const PERSONAS: Persona[] = ['Personal', 'Business', 'Global Banking and Markets', 'HSBC Private Bank'];

// ─── Nav sections mirroring the sidebar ──────────────────────────────────────

interface NavItem { view: NavView; label: string; adminOnly?: boolean; aiOnly?: boolean }

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'DELIVER',
    items: [
      { view: 'pages',    label: 'Pages'    },
      { view: 'journeys', label: 'Journeys' },
      { view: 'wechat',   label: 'WeChat'   },
    ],
  },
  {
    label: 'REVIEW',
    items: [
      { view: 'pending', label: 'Pending' },
      { view: 'history', label: 'History' },
    ],
  },
  {
    label: 'ANALYSE',
    items: [
      { view: 'stats', label: 'Statistics' },
      { view: 'aeo',   label: 'AEO / SEO'  },
    ],
  },
  {
    label: 'AI',
    items: [
      { view: 'ai-search', label: 'AI Search', aiOnly: true },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { view: 'admin-markets',       label: 'Markets',        adminOnly: true },
      { view: 'admin-value-streams', label: 'Value Streams',  adminOnly: true },
      { view: 'admin-flows',         label: 'Approval Flows', adminOnly: true },
      { view: 'admin-rule-params',   label: 'Rule Params',    adminOnly: true },
      { view: 'audit',               label: 'Audit Log',      adminOnly: true },
    ],
  },
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

// ─── OCDP Header ─────────────────────────────────────────────────────────────

export function OCDPHeader() {
  const { state, dispatch } = useOCDP();
  const { activePersona, showEntitlementModal, currentUser, navView } = state;

  const isAdmin_   = isAdmin(currentUser.role);
  const isAuditor  = currentUser.role === 'AUDITOR';
  const isAIOperator = currentUser.role === 'AI-SEARCH-OPERATOR';
  const showAdmin  = isAdmin_ || isAuditor;
  const [uiLocale, setUiLocale] = useState('en');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const localeInfo = getLocaleInfo(uiLocale);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* ── Top strip: persona tabs + language + log on ────────────────────── */}
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
          {/* Persona tabs */}
          <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
            {PERSONAS.map(p => {
              const isActive = p === activePersona;
              return (
                <button
                  key={p}
                  onClick={() => dispatch({ type: 'SET_PERSONA', persona: p })}
                  style={{
                    padding: '0 14px',
                    height: '100%',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.01em',
                    transition: 'color 0.15s, border-color 0.15s',
                    fontFamily: 'var(--font-family)',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Right side: language + logon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language selector */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                aria-label={`Interface language: ${localeInfo.label}. Click to change.`}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                onClick={() => setLangOpen(o => !o)}
                style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.65)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-family)',
                }}
              >
                {localeInfo.label}
                <span style={{ fontSize: 9 }} aria-hidden="true">▾</span>
              </button>

              {langOpen && (
                <div
                  role="listbox"
                  aria-label="Select interface language"
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    border: '1px solid #E5E7EB', minWidth: 196, zIndex: 300, overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Interface Language
                  </div>
                  {SUPPORTED_LOCALES.map(loc => {
                    const isActive = loc.code === uiLocale;
                    return (
                      <button
                        key={loc.code}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => { setUiLocale(loc.code); setLangOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', background: isActive ? 'rgba(219,0,17,0.05)' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          borderLeft: isActive ? '3px solid #DB0011' : '3px solid transparent',
                          fontFamily: 'var(--font-family)',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(219,0,17,0.05)' : 'transparent'; }}
                      >
                        <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#DB0011' : '#111' }}>{loc.label}</span>
                        {loc.dir === 'rtl' && (
                          <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 'auto' }}>RTL</span>
                        )}
                        {isActive && <span style={{ fontSize: 12, color: '#DB0011', marginLeft: 'auto' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)' }} />

            <button
              onClick={() => dispatch({ type: 'TOGGLE_ENTITLEMENT_MODAL' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 14px',
                background: '#DB0011',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                fontFamily: 'var(--font-family)',
              }}
            >
              {currentUser.name !== 'Guest' ? currentUser.name : 'Log on'}
              <span style={{ fontSize: 9 }}>▾</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Second strip: HSBC logo + horizontal nav ──────────────────────── */}
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

          {/* Nav sections as horizontal groups */}
          <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, overflow: 'hidden' }}>
            {NAV_SECTIONS.map(section => {
              // AI-SEARCH-OPERATOR only sees the AI section
              if (isAIOperator && section.label !== 'AI') return null;
              const visibleItems = section.items.filter(i => {
                if (i.adminOnly) return showAdmin;
                if (i.aiOnly) return isAIOperator || isAdmin_ || showAdmin;
                // Hide non-AI sections from AI operator
                return !isAIOperator;
              });
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.label} style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>
                  {/* Section label above items — shown as a tiny top label */}
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {visibleItems.map(item => {
                      const isActive = navView === item.view;
                      return (
                        <button
                          key={item.view}
                          onClick={() => dispatch({ type: 'SET_NAV_VIEW', view: item.view })}
                          style={{
                            padding: '0 13px',
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
                            {section.label}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#DB0011' : '#1A1A1A', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Section separator */}
                  <div style={{ width: 1, background: '#F3F4F6', margin: '12px 4px', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          {/* OCDP badge (right) */}
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
              OCDP CONSOLE
            </div>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#059669',
              boxShadow: '0 0 0 2px rgba(5,150,105,0.2)',
            }} title="Platform online" />
          </div>
        </div>
      </div>

      {showEntitlementModal && <EntitlementModal />}
    </>
  );
}
