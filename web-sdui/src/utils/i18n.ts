// ─── i18n / Locale Utilities (mirrors OCDP/UCP i18n.ts) ──────────────────────

export interface LocaleInfo {
  code: string;
  label: string;
  dir: 'ltr' | 'rtl';
  lang: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en',    label: 'English',   dir: 'ltr', lang: 'en'      },
  { code: 'zh-TW', label: '繁體中文',  dir: 'ltr', lang: 'zh-Hant' },
  { code: 'zh-CN', label: '简体中文',  dir: 'ltr', lang: 'zh-Hans' },
  { code: 'ar',    label: 'العربية',  dir: 'rtl', lang: 'ar'      },
  { code: 'es',    label: 'Español',   dir: 'ltr', lang: 'es'      },
];

export function getLocaleInfo(code: string): LocaleInfo {
  return SUPPORTED_LOCALES.find(l => l.code === code) ?? SUPPORTED_LOCALES[0];
}

export function toLangCode(bcp47: string): string {
  if (!bcp47) return 'en';
  const lower = bcp47.toLowerCase();
  if (lower.startsWith('zh-hant') || lower === 'zh-hk' || lower === 'zh-tw') return 'zh-TW';
  if (lower.startsWith('zh-hans') || lower === 'zh-cn' || lower === 'zh-sg') return 'zh-CN';
  if (lower.startsWith('zh')) return 'zh-TW';
  if (lower.startsWith('ar'))  return 'ar';
  if (lower.startsWith('es'))  return 'es';
  return 'en';
}

/** Resolve locale from browser — navigator.language → authoring code */
export function browserLocale(): string {
  const lang = navigator.language || 'en';
  return toLangCode(lang);
}

// ─── Accessibility helpers ─────────────────────────────────────────────────────

export interface A11yFlags {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
}

export function detectA11yFlags(): A11yFlags {
  return {
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(forced-colors: active)').matches,
    screenReader: false, // web can't detect SR directly; flag via query param
  };
}

export function a11yFlagsHeader(flags: A11yFlags): string {
  const active: string[] = [];
  if (flags.reduceMotion) active.push('reduceMotion');
  if (flags.highContrast) active.push('highContrast');
  if (flags.screenReader) active.push('screenReader');
  return active.join(',');
}

// ─── BFF Config types ─────────────────────────────────────────────────────────

export interface BFFConfig {
  locale: string;
  textDir: 'ltr' | 'rtl';
  supportedLocales: string[];
  channel: string;
  platform: string;
  a11y: A11yFlags & { largeText?: boolean; voiceOver?: boolean; talkBack?: boolean };
  featureFlags: Record<string, boolean>;
  sdui: { schemaVersion: string; ttlSeconds: number; cacheStrategy: string };
  wcag: { level: string; version: string };
}
