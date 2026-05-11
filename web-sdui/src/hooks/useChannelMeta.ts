import { useEffect } from 'react';
import { useSDUIContext } from '../context/SDUIContext';
import { getLocaleInfo } from '../utils/i18n';

interface MetaConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
}

/**
 * Injects SEO meta tags and JSON-LD for WEB_STANDARD channel.
 * For SDUI and WEB_WECHAT channels this is a no-op.
 */
export function useChannelMeta(config: MetaConfig) {
  const { channel, locale } = useSDUIContext();
  const info = getLocaleInfo(locale);

  useEffect(() => {
    if (channel !== 'WEB_STANDARD') return;

    // Title
    if (config.title) document.title = config.title;

    // Meta description
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.name = 'description';
      document.head.appendChild(descEl);
    }
    if (config.description) descEl.content = config.description;

    // og:locale
    let ogLocale = document.querySelector<HTMLMetaElement>('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.content = info.lang;

    // Canonical
    if (config.canonicalUrl) {
      let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = config.canonicalUrl;
    }

    // JSON-LD structured data
    if (config.jsonLd) {
      let ldScript = document.querySelector<HTMLScriptElement>('script[data-sdui-jsonld]');
      if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.type = 'application/ld+json';
        ldScript.setAttribute('data-sdui-jsonld', 'true');
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        'inLanguage': info.lang,
        ...config.jsonLd,
      });
    }
  }, [channel, locale, config.title, config.description, config.canonicalUrl]);
}

/**
 * Injects WeChat mini-program config meta for WEB_WECHAT channel.
 * Emits <meta name="weixin:*"> tags consumed by the WeChat JS bridge.
 */
export function useWeChatChannelMeta(config: {
  title?: string;
  description?: string;
  imageUrl?: string;
}) {
  const { channel, locale } = useSDUIContext();

  useEffect(() => {
    if (channel !== 'WEB_WECHAT') return;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (config.title)       setMeta('weixin:title', config.title);
    if (config.description) setMeta('weixin:description', config.description);
    if (config.imageUrl)    setMeta('weixin:img', config.imageUrl);
    // WeChat locale hint (X5 browser uses this for font selection)
    setMeta('weixin:locale', locale);
  }, [channel, locale, config.title, config.description, config.imageUrl]);
}
