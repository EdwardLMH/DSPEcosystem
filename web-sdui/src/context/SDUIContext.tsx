import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  BFFConfig, A11yFlags,
  browserLocale, detectA11yFlags, a11yFlagsHeader, getLocaleInfo,
} from '../utils/i18n';

export interface SDUIContextValue {
  locale: string;
  textDir: 'ltr' | 'rtl';
  channel: 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';
  a11y: A11yFlags;
  config: BFFConfig | null;
  featureFlags: Record<string, boolean>;
  // Headers to attach to every BFF fetch
  bffHeaders: Record<string, string>;
}

const DEFAULT_CTX: SDUIContextValue = {
  locale: 'en',
  textDir: 'ltr',
  channel: 'SDUI',
  a11y: { reduceMotion: false, highContrast: false, screenReader: false },
  config: null,
  featureFlags: {},
  bffHeaders: { 'x-platform': 'web', 'x-locale': 'en', 'x-a11y-flags': '', 'x-channel': 'SDUI', 'x-sdui-schema': 'v2' },
};

export const SDUIContext = createContext<SDUIContextValue>(DEFAULT_CTX);

export function useSDUIContext(): SDUIContextValue {
  return useContext(SDUIContext);
}

interface Props {
  channel?: 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';
  children: React.ReactNode;
}

export function SDUIProvider({ channel = 'SDUI', children }: Props) {
  const [ctx, setCtx] = useState<SDUIContextValue>(() => {
    const locale = browserLocale();
    const a11y   = detectA11yFlags();
    const info   = getLocaleInfo(locale);
    return {
      locale,
      textDir: info.dir,
      channel,
      a11y,
      config: null,
      featureFlags: {},
      bffHeaders: {
        'x-platform': 'web',
        'x-locale': locale,
        'x-a11y-flags': a11yFlagsHeader(a11y),
        'x-channel': channel,
        'x-sdui-schema': 'v2',
        'Accept-Language': info.lang,
      },
    };
  });

  useEffect(() => {
    const a11y   = detectA11yFlags();
    const locale = browserLocale();
    const headers = {
      'x-platform': 'web',
      'x-locale': locale,
      'x-a11y-flags': a11yFlagsHeader(a11y),
      'x-channel': channel,
      'x-sdui-schema': 'v2',
    };
    fetch('/api/v1/config', { headers })
      .then(r => r.ok ? r.json() as Promise<BFFConfig> : Promise.reject())
      .then(cfg => {
        const info = getLocaleInfo(cfg.locale);
        setCtx({
          locale: cfg.locale,
          textDir: cfg.textDir as 'ltr' | 'rtl',
          channel: cfg.channel as SDUIContextValue['channel'],
          a11y: { ...a11y, ...cfg.a11y },
          config: cfg,
          featureFlags: cfg.featureFlags ?? {},
          bffHeaders: {
            'x-platform': 'web',
            'x-locale': cfg.locale,
            'x-a11y-flags': a11yFlagsHeader(a11y),
            'x-channel': cfg.channel,
            'x-sdui-schema': 'v2',
            'Accept-Language': info.lang,
          },
        });
        // Apply lang + dir on <html> element for WCAG + SEO
        document.documentElement.setAttribute('lang', info.lang);
        document.documentElement.setAttribute('dir', cfg.textDir);
      })
      .catch(() => {
        // Non-fatal — browser-detected defaults remain
        const info = getLocaleInfo(locale);
        document.documentElement.setAttribute('lang', info.lang);
        document.documentElement.setAttribute('dir', info.dir);
      });
  }, [channel]);

  return (
    <SDUIContext.Provider value={ctx}>
      {children}
    </SDUIContext.Provider>
  );
}
