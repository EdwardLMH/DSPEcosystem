import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LOCALES } from '../../utils/i18n';
import type { LocaleInfo } from '../../utils/i18n';

interface LanguageSelectorProps {
  primaryLocale: string;
  supportedLocales: string[];
  activeLocale: string;
  onSelectLocale: (locale: string) => void;
  onAddLocale: (locale: string) => void;
  onRemoveLocale: (locale: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function LanguageSelector({
  primaryLocale, supportedLocales, activeLocale,
  onSelectLocale, onAddLocale, onRemoveLocale,
  disabled = false, size = 'md',
}: LanguageSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const available = SUPPORTED_LOCALES.filter(l => !supportedLocales.includes(l.code));
  const supported = SUPPORTED_LOCALES.filter(l => supportedLocales.includes(l.code));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDownDropdown(e: React.KeyboardEvent, locale: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAddLocale(locale);
      setDropdownOpen(false);
      addBtnRef.current?.focus();
    }
    if (e.key === 'Escape') {
      setDropdownOpen(false);
      addBtnRef.current?.focus();
    }
  }

  const pillH = size === 'sm' ? 24 : 28;
  const fs = size === 'sm' ? 10 : 11;

  function pillStyle(isActive: boolean, isPrimary: boolean): React.CSSProperties {
    return {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: pillH, padding: '0 8px',
      borderRadius: pillH / 2,
      border: isActive ? '2px solid #DB0011' : '1.5px solid #D1D5DB',
      background: isActive ? '#FEF2F2' : isPrimary ? '#F9FAFB' : '#fff',
      color: isActive ? '#DB0011' : '#374151',
      fontSize: fs, fontWeight: isActive ? 700 : 500,
      cursor: disabled ? 'default' : 'pointer',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.1s',
      outline: 'none',
    };
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}
      role="group"
      aria-label="Language selection"
    >
      {/* Locale pills for supported languages */}
      {supported.map((loc: LocaleInfo) => {
        const isActive = loc.code === activeLocale;
        const isPrimary = loc.code === primaryLocale;
        return (
          <div key={loc.code} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              role="radio"
              aria-checked={isActive}
              aria-label={`Switch to ${loc.label}${isPrimary ? ' (primary)' : ''}`}
              onClick={() => !disabled && onSelectLocale(loc.code)}
              style={pillStyle(isActive, isPrimary)}
              disabled={disabled}
            >
              <span>{loc.label}</span>
              {isPrimary && (
                <span style={{ fontSize: fs - 1, color: isActive ? '#DB0011' : '#9CA3AF', opacity: 0.8 }}>
                  ·P
                </span>
              )}
            </button>
            {/* Remove button (not shown for primary locale) */}
            {!isPrimary && !disabled && (
              <button
                aria-label={`Remove ${loc.label} language`}
                onClick={() => {
                  if (isActive) onSelectLocale(primaryLocale);
                  onRemoveLocale(loc.code);
                }}
                style={{
                  marginLeft: -2, width: 16, height: 16, borderRadius: '50%',
                  border: '1px solid #D1D5DB', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#6B7280', cursor: 'pointer',
                  padding: 0, outline: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      {/* Add language button */}
      {!disabled && available.length > 0 && (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            ref={addBtnRef}
            aria-label="Add language"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              height: pillH, padding: '0 8px',
              borderRadius: pillH / 2,
              border: '1.5px dashed #9CA3AF',
              background: '#fff', color: '#6B7280',
              fontSize: fs, cursor: 'pointer',
              outline: 'none', whiteSpace: 'nowrap',
            }}
          >
            + Language
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Available languages"
              style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4,
                zIndex: 1000, minWidth: 180,
              }}
            >
              {available.map((loc: LocaleInfo) => (
                <div
                  key={loc.code}
                  role="option"
                  aria-selected="false"
                  tabIndex={0}
                  onClick={() => { onAddLocale(loc.code); setDropdownOpen(false); }}
                  onKeyDown={e => handleKeyDownDropdown(e, loc.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                    fontSize: 12, color: '#374151',
                    outline: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onFocus={e => (e.currentTarget.style.background = '#EEF2FF')}
                  onBlur={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{loc.label}</span>
                  {loc.dir === 'rtl' && (
                    <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 'auto' }}>RTL</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
