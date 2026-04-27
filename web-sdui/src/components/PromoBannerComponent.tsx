import React from 'react';
import { analyticsClient } from '../analytics/AnalyticsClient';

interface PromoBannerProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt: string;
  ctaText: string;
  ctaAction?: { type: string; destination: string; params?: Record<string, string> };
  backgroundColour?: string;
  textColour?: string;
}

export function PromoBannerComponent({
  id, title, subtitle, imageUrl, imageAlt,
  ctaText, ctaAction, backgroundColour = '#003366', textColour = '#FFFFFF',
}: PromoBannerProps) {
  const handleCta = () => {
    analyticsClient.fire('promo_banner_clicked', { componentId: id });
    if (ctaAction?.type === 'NAVIGATE') {
      window.dispatchEvent(new CustomEvent('sdui:navigate', {
        detail: { destination: ctaAction.destination, params: ctaAction.params },
      }));
    }
  };

  return (
    <div style={{ backgroundColor: backgroundColour, color: textColour, borderRadius: 8, overflow: 'hidden' }}>
      <img src={imageUrl} alt={imageAlt} style={{ width: '100%', display: 'block' }} loading="lazy" />
      <div style={{ padding: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
        {subtitle && <p style={{ margin: '8px 0 0' }}>{subtitle}</p>}
        <button
          onClick={handleCta}
          style={{
            marginTop: 16, padding: '10px 20px',
            backgroundColor: '#C9A84C', color: '#000', border: 'none',
            borderRadius: 4, cursor: 'pointer', fontWeight: 600,
          }}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
