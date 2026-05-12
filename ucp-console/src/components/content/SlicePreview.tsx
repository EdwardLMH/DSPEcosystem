import { useState, useEffect } from 'react';
import type { PageTemplateSlice as PageTemplateStarterSlice, TemplateChannel } from '../../types/ucp';

// ─── Palette metadata ─────────────────────────────────────────────────────────

export const PALETTE_ITEMS: { sliceType: string; label: string; icon: string; category: string; singleton?: boolean }[] = [
  { sliceType: 'HEADER_NAV', label: 'Header Navigation', icon: '🔝', category: 'navigation', singleton: true },
  { sliceType: 'HOME_SEARCH_HEADER', label: 'Home Search Header', icon: '🏠🔍', category: 'navigation', singleton: true },
  { sliceType: 'PREMIER_HEADER', label: 'Premier Header', icon: '🔴', category: 'navigation', singleton: true },
  { sliceType: 'ELITE_HEADER', label: 'Elite Header', icon: '💚', category: 'navigation', singleton: true },
  { sliceType: 'ADVANCE_HEADER', label: 'Advance Header', icon: '🟠', category: 'navigation', singleton: true },
  { sliceType: 'MASS_HEADER', label: 'Personal Banking Header', icon: '⚫', category: 'navigation', singleton: true },
  { sliceType: 'HOME_SEARCH_BAR', label: 'Search Bar', icon: '🔍', category: 'navigation', singleton: true },
  { sliceType: 'CONTENT_TAB_BAR', label: 'Content Tab Bar', icon: '🗂️', category: 'navigation', singleton: true },
  { sliceType: 'PROMO_BANNER', label: 'Promo Banner', icon: '🎪', category: 'promotion' },
  { sliceType: 'AD_BANNER', label: 'Ad Banner', icon: '📢', category: 'promotion' },
  { sliceType: 'CAMPAIGN_HERO', label: 'Campaign Hero', icon: '🎯', category: 'promotion', singleton: true },
  { sliceType: 'CAMPAIGN_BENEFITS', label: 'Campaign Benefits', icon: '✅', category: 'promotion' },
  { sliceType: 'CAMPAIGN_CTA', label: 'Campaign CTA', icon: '🚀', category: 'promotion', singleton: true },
  { sliceType: 'DISCOVER_MORE_CAROUSEL', label: 'Discover More', icon: '🔎', category: 'promotion' },
  { sliceType: 'CARD_ACTIVATION_BANNER', label: 'Card Activation', icon: '🔔', category: 'promotion' },
  { sliceType: 'QUEST_BANNER', label: 'Quest Banner', icon: '🎯', category: 'promotion' },
  { sliceType: 'QUICK_ACCESS', label: 'Quick Access Buttons', icon: '⚡', category: 'function', singleton: true },
  { sliceType: 'QUICK_ACCESS_GRID', label: 'Quick Access Grid', icon: '⚡', category: 'function' },
  { sliceType: 'COMBO_QUICK_ACCESS', label: 'Quick Access + Tab Bar', icon: '⚡', category: 'function', singleton: true },
  { sliceType: 'FUNCTION_GRID', label: 'Function Grid', icon: '⊞', category: 'function' },
  { sliceType: 'AI_ASSISTANT', label: 'AI Assistant', icon: '🤖', category: 'function' },
  { sliceType: 'FLASH_LOAN', label: 'Flash Loan', icon: '⚡💳', category: 'function', singleton: true },
  { sliceType: 'DEPOSIT_RATE_TABLE', label: 'Deposit Rate Table', icon: '🏦', category: 'wealth' },
  { sliceType: 'DEPOSIT_OPEN_CTA', label: 'Button CTA', icon: '🏧', category: 'wealth' },
  { sliceType: 'DEPOSIT_FAQ', label: 'General FAQ', icon: '❓', category: 'wealth' },
  { sliceType: 'WEALTH_SELECTION', label: 'Wealth Selection', icon: '💰', category: 'wealth' },
  { sliceType: 'FEATURED_RANKINGS', label: 'Featured Rankings', icon: '🏆', category: 'wealth' },
  { sliceType: 'FX_WATCHLIST', label: 'FX Watchlist', icon: '💱', category: 'wealth' },
  { sliceType: 'FEATURE_PRODUCT', label: 'Feature Product', icon: '📊', category: 'wealth' },
  { sliceType: 'WEALTH_STUDIO_CAROUSEL', label: 'Wealth Studio', icon: '🎬', category: 'wealth' },
  { sliceType: 'LIFE_DEALS', label: 'Life Deals', icon: '🛍️', category: 'lifestyle' },
  { sliceType: 'VIDEO_PLAYER', label: 'Video Player', icon: '🎬', category: 'insight' },
  { sliceType: 'MARKET_BRIEFING_TEXT', label: 'Market Briefing', icon: '📋', category: 'insight' },
  { sliceType: 'GUIDES_INSIGHTS_CAROUSEL', label: 'Guides & Insights', icon: '📰', category: 'insight' },
  { sliceType: 'CONTACT_RM_CTA', label: 'Contact Your RM', icon: '📞', category: 'insight', singleton: true },
  { sliceType: 'SPACER', label: 'Spacer', icon: '↕️', category: 'layout' },
  // SEO / AEO compliance
  { sliceType: 'SEO_HERO_HEADER', label: 'SEO Hero Header', icon: '🔍', category: 'navigation', singleton: true },
  { sliceType: 'SEO_FAQ', label: 'SEO/AEO FAQ', icon: '❓', category: 'insight', singleton: true },
  { sliceType: 'SEO_STRUCTURED_DATA', label: 'Structured Data (JSON-LD)', icon: '🗂️', category: 'layout', singleton: true },
];

export const SLICE_CATEGORY_COLORS: Record<string, string> = {
  navigation: '#DB0011', promotion: '#D97706', function: '#2563EB',
  wealth: '#059669', lifestyle: '#7C3AED', insight: '#0891B2', layout: '#6B7280',
};

export function catForType(t: string): string {
  return PALETTE_ITEMS.find(p => p.sliceType === t)?.category ?? 'layout';
}

export function iconForType(t: string): string {
  return PALETTE_ITEMS.find(p => p.sliceType === t)?.icon ?? '📦';
}

export function labelForType(t: string): string {
  return PALETTE_ITEMS.find(p => p.sliceType === t)?.label ?? t;
}

// ─── Slice block preview ──────────────────────────────────────────────────────

export function SliceBlockPreview({ slice }: { slice: PageTemplateStarterSlice }) {
  const p = slice.props as Record<string, unknown>;
  const t = slice.type;
  const s = (v: unknown, fb = '') => String(v ?? fb);

  if (t === 'HEADER_NAV') return (
    <div style={{ background: '#DB0011', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>HSBC</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', flex: 1, fontSize: 10 }}>{s(p.title, 'Header')}</span>
      {Boolean(p.showNotificationBell) && <span style={{ color: '#fff', fontSize: 11 }}>🔔</span>}
    </div>
  );

  if (t === 'PREMIER_HEADER') return (
    <div style={{ background: '#DB0011', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>HSBC</span>
      <span style={{ color: 'rgba(255,255,255,0.9)', flex: 1, fontSize: 10 }}>{s(p.brandLabel, 'HSBC Premier')}</span>
    </div>
  );

  if (t === 'ELITE_HEADER') return (
    <div style={{ background: '#0D5C3A', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>HSBC</span>
      <span style={{ color: 'rgba(255,255,255,0.9)', flex: 1, fontSize: 10 }}>{s(p.brandLabel, 'HSBC Elite')}</span>
    </div>
  );

  if (t === 'ADVANCE_HEADER') return (
    <div style={{ background: '#D4580A', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>HSBC</span>
      <span style={{ color: 'rgba(255,255,255,0.9)', flex: 1, fontSize: 10 }}>{s(p.brandLabel, 'HSBC Advance')}</span>
    </div>
  );

  if (t === 'MASS_HEADER') return (
    <div style={{ background: '#4B5563', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>HSBC</span>
      <span style={{ color: 'rgba(255,255,255,0.9)', flex: 1, fontSize: 10 }}>{s(p.brandLabel, 'HSBC Personal Banking')}</span>
    </div>
  );

  if (t === 'HOME_SEARCH_HEADER') return (
    <div style={{ background: s(p.premierBg, '#DB0011'), padding: '8px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>HSBC</span>
        <span style={{ color: 'rgba(255,255,255,0.9)', flex: 1, fontSize: 10 }}>{s(p.premierLabel, 'HSBC Premier')}</span>
        {Boolean(p.enableNotification) && <span style={{ color: '#fff', fontSize: 11 }}>🔔</span>}
      </div>
      <div style={{ background: '#fff', borderRadius: 0, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>🔍</span>
        <span style={{ fontSize: 9, color: '#9CA3AF', flex: 1 }}>{s(p.placeholder, 'Search functions, products & content')}</span>
        {Boolean(p.enableSemanticSearch !== false) && <span style={{ fontSize: 8, background: '#DB0011', color: '#fff', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>AI</span>}
      </div>
    </div>
  );

  if (t === 'HOME_SEARCH_BAR') return (
    <div style={{ background: '#fff', padding: '5px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F5F5', borderRadius: 14, padding: '4px 10px' }}>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>🔍</span>
        <span style={{ fontSize: 9, color: '#9CA3AF', flex: 1 }}>{s(p.placeholder, 'Search...')}</span>
        {Boolean(p.enableSemanticSearch !== false) && <span style={{ fontSize: 8, color: '#DB0011', fontWeight: 700 }}>AI</span>}
      </div>
    </div>
  );

  if (t === 'CONTENT_TAB_BAR') {
    const tabs = Array.isArray(p.tabs) ? p.tabs as { id: string; label: string; active: boolean }[] : [];
    return (
      <div style={{ background: '#fff', padding: '0 10px', display: 'flex', borderBottom: '1px solid #F3F4F6' }}>
        {(tabs.length > 0 ? tabs : [{ id: 't1', label: 'My pick', active: true }, { id: 't2', label: 'Invest', active: false }]).map((tab, i) => (
          <div key={i} style={{ padding: '6px 10px', fontSize: 10, fontWeight: tab.active ? 700 : 400, color: tab.active ? '#DB0011' : '#6B7280', borderBottom: tab.active ? '2px solid #DB0011' : '2px solid transparent' }}>
            {tab.label}
          </div>
        ))}
      </div>
    );
  }

  if (t === 'PROMO_BANNER') return (
    <div style={{ background: s(p.backgroundColor, '#E8F4FD'), padding: '10px 12px' }}>
      {Boolean(p.title) && <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{s(p.title)}</div>}
      {Boolean(p.subtitle) && <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>{s(p.subtitle)}</div>}
      {Boolean(p.ctaLabel) && <div style={{ display: 'inline-block', padding: '3px 10px', background: '#DB0011', color: '#fff', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{s(p.ctaLabel)}</div>}
    </div>
  );

  if (t === 'AD_BANNER') return (
    <div style={{ padding: '7px 12px', background: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14 }}>📢</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 11 }}>{s(p.title, 'Ad Banner')}</div>
        {Boolean(p.subtitle) && <div style={{ fontSize: 9, color: '#6B7280' }}>{s(p.subtitle)}</div>}
      </div>
      {Boolean(p.dismissible) && <span style={{ color: '#9CA3AF', fontSize: 12 }}>×</span>}
    </div>
  );

  if (t === 'CAMPAIGN_HERO') return (
    <div style={{ background: s(p.bgGradient, 'linear-gradient(160deg,#0A1A3D,#0D2B6B)'), padding: '16px 14px' }}>
      {Boolean(p.badge) && <div style={{ display: 'inline-block', fontSize: 8, fontWeight: 700, background: s(p.accentColor, '#C9A84C'), color: '#fff', borderRadius: 3, padding: '2px 6px', marginBottom: 6 }}>{s(p.badge)}</div>}
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>{s(p.headline, 'Campaign Headline')}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>{s(p.subHeadline, 'Sub-headline copy')}</div>
    </div>
  );

  if (t === 'CAMPAIGN_BENEFITS') {
    const items = Array.isArray(p.items) ? p.items as { icon: string; title: string }[] : [{ icon: '✅', title: 'Benefit 1' }, { icon: '⭐', title: 'Benefit 2' }];
    return (
      <div style={{ padding: '10px 12px', background: '#fff' }}>
        {Boolean(p.sectionTitle) && <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8 }}>{s(p.sectionTitle)}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {items.slice(0, 4).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '5px 7px', background: '#F9FAFB', borderRadius: 6 }}>
              <span style={{ fontSize: 13 }}>{it.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#111' }}>{it.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (t === 'CAMPAIGN_CTA') return (
    <div style={{ padding: '14px 16px', background: '#fff', textAlign: 'center' }}>
      <div style={{ background: '#DB0011', color: '#fff', fontWeight: 700, fontSize: 12, padding: '10px', borderRadius: 6, marginBottom: 6 }}>
        {s(p.ctaLabel, 'Apply Now')}
      </div>
      {Boolean(p.offerBadge) && <div style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>{s(p.offerBadge)}</div>}
      {Boolean(p.secondaryLabel) && <div style={{ fontSize: 10, color: '#DB0011', marginTop: 4 }}>{s(p.secondaryLabel)}</div>}
    </div>
  );

  if (t === 'AI_ASSISTANT') return (
    <div style={{ padding: '7px 12px', background: 'linear-gradient(90deg,#0F3057,#1A6B8A)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14 }}>🤖</span>
      <span style={{ color: '#fff', fontSize: 10 }}>{s(p.greeting, 'Hi, how can I help?')}</span>
    </div>
  );

  if (t === 'FLASH_LOAN') return (
    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
      <span style={{ fontSize: 18 }}>⚡💳</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 11 }}>{s(p.productName, 'Flash Loan')}</div>
        <div style={{ fontSize: 9, color: '#6B7280' }}>Up to {s(p.currency, 'HKD')} {s(p.maxAmount, '500,000')}</div>
      </div>
      <div style={{ padding: '3px 8px', background: '#DB0011', color: '#fff', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{s(p.ctaLabel, 'Apply')}</div>
    </div>
  );

  if (t === 'CONTACT_RM_CTA') return (
    <div style={{ padding: '10px 14px', background: s(p.backgroundColor, '#DB0011'), display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: s(p.textColor, '#fff') }}>{s(p.label, 'Contact Your RM')}</div>
      {Boolean(p.subLabel) && <div style={{ fontSize: 9, color: `${s(p.textColor, '#fff')}CC`, marginTop: 2 }}>{s(p.subLabel)}</div>}
    </div>
  );

  if (t === 'DEPOSIT_RATE_TABLE') {
    const rates = Array.isArray(p.rates) ? p.rates as { term: string; rate: string }[] : [];
    return (
      <div style={{ padding: '8px 12px', background: '#fff' }}>
        <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{s(p.sectionTitle, 'Time Deposit Rate:')}</div>
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F9FAFB', padding: '3px 8px', borderBottom: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#6B7280' }}>Term</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#6B7280', textAlign: 'right' }}>Rate (% p.a.)</span>
          </div>
          {rates.slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '2px 8px', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
              <span style={{ fontSize: 8, color: '#374151' }}>{r.term}</span>
              <span style={{ fontSize: 8, color: '#374151', textAlign: 'right', fontWeight: 600 }}>{r.rate}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (t === 'DEPOSIT_OPEN_CTA') return (
    <div style={{ padding: '10px 14px', background: s(p.backgroundColor, '#C41E3A'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: s(p.textColor, '#fff') }}>{s(p.label, 'Open a Deposit')}</div>
    </div>
  );

  if (t === 'DEPOSIT_FAQ') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s(p.sectionTitle, 'FAQ')}</div>
      <div style={{ padding: '5px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#374151' }}>Can I withdraw before maturity?</span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>›</span>
      </div>
      <div style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#374151' }}>What is new fund?</span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>›</span>
      </div>
    </div>
  );

  if (t === 'CARD_ACTIVATION_BANNER') return (
    <div style={{ padding: '7px 12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', gap: 8, borderLeft: '3px solid #D97706' }}>
      <span style={{ fontSize: 14 }}>🔔</span>
      <span style={{ fontSize: 10, color: '#92400E', flex: 1 }}>{s(p.message, 'Activate your card')}</span>
    </div>
  );

  if (t === 'QUEST_BANNER') return (
    <div style={{ padding: '8px 12px', background: '#fff', borderLeft: '3px solid #DB0011' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{s(p.title, 'Getting Started')}</div>
      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginBottom: 5 }}>
        <div style={{ width: '30%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 9, color: '#6B7280' }}>{s(p.description, 'Complete quests to enjoy rewards!')}</div>
    </div>
  );

  if (t === 'SPACER') return (
    <div style={{ height: Math.max(14, Number(p.height ?? 24)), background: 'repeating-linear-gradient(45deg,#F9FAFB,#F9FAFB 4px,#F3F4F6 4px,#F3F4F6 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 8, color: '#9CA3AF' }}>Spacer {p.height ? `${p.height}px` : ''}</span>
    </div>
  );

  if (t === 'WEALTH_SELECTION') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s(p.sectionTitle, 'Wealth Products')}</div>
      {[{ n: '7-Day Wealth', y: '3.85%' }, { n: 'Growth Fund', y: '12.4%' }].map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F3F4F6', fontSize: 9 }}>
          <span>{it.n}</span><span style={{ color: '#059669', fontWeight: 700 }}>{it.y}</span>
        </div>
      ))}
    </div>
  );

  if (t === 'FEATURED_RANKINGS') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>🏆 {s(p.sectionTitle, 'Rankings')}</div>
      {['#1 Tech Growth ETF +18.2%', '#2 HK Blue Chip +7.4%'].map((it, i) => (
        <div key={i} style={{ fontSize: 9, padding: '2px 0', color: '#374151' }}>{it}</div>
      ))}
    </div>
  );

  if (t === 'FX_WATCHLIST') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{s(p.sectionTitle, 'FX Watchlist')}</div>
      {Boolean(p.tierBadge) && <div style={{ display: 'inline-block', fontSize: 8, padding: '1px 6px', borderRadius: 8, background: '#FEF3C7', color: '#92400E', fontWeight: 700, marginBottom: 4 }}>{s(p.tierBadge)}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
        <span style={{ color: '#6B7280' }}>USD/HKD</span><span style={{ fontWeight: 700 }}>7.78</span>
      </div>
    </div>
  );

  if (t === 'FEATURE_PRODUCT') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s(p.sectionTitle, 'Feature product')}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {(Array.isArray(p.buttons) && p.buttons.length > 0 ? p.buttons : ['Top performers', 'Top dividend'].map(name => ({ name }))).slice(0, 3).map((button: any, i: number) => (
          <div key={button.id ?? button.name ?? i} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 12, background: i === 0 ? '#fff' : 'transparent', color: i === 0 ? '#111' : '#9CA3AF', fontWeight: i === 0 ? 700 : 500, border: i === 0 ? '1px solid #E5E7EB' : '1px solid transparent', boxShadow: i === 0 ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>{button.name}</div>
        ))}
      </div>
      {[{ n: 'Tech Growth ETF', r: '+18.2%' }, { n: 'HK Blue Chip', r: '+7.4%' }].map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F3F4F6', fontSize: 9 }}>
          <span>{it.n}</span><span style={{ color: '#059669', fontWeight: 700 }}>{it.r}</span>
        </div>
      ))}
    </div>
  );

  if (t === 'WEALTH_STUDIO_CAROUSEL') {
    const wsItems: { id: string; episodeLabel?: string; title?: string; videoUrl?: string; thumbnailUrl?: string }[] =
      Array.isArray(p.items) && p.items.length > 0 ? p.items : [];
    return (
      <div style={{ padding: '8px 12px', background: '#0A1628' }}>
        <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6, color: '#fff' }}>{s(p.sectionTitle, 'Wealth Studio')}</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {wsItems.length === 0
            ? [1, 2].map(i => (
                <div key={i} style={{ width: 80, flexShrink: 0 }}>
                  <div style={{ height: 48, background: '#1A2A4A', borderRadius: 4, marginBottom: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, opacity: 0.6 }}>🎬</span>
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>Episode {i}</div>
                </div>
              ))
            : wsItems.map(item => (
                <div key={item.id} style={{ width: 100, flexShrink: 0 }}>
                  <div style={{ position: 'relative', height: 60, borderRadius: 4, overflow: 'hidden', marginBottom: 4, background: '#1A2A4A' }}>
                    {item.videoUrl
                      ? <video src={item.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted playsInline preload="metadata" controls />
                      : item.thumbnailUrl
                        ? <img src={item.thumbnailUrl} alt={item.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18, opacity: 0.5 }}>🎬</span></div>
                    }
                  </div>
                  {item.episodeLabel && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginBottom: 1 }}>{item.episodeLabel}</div>}
                  <div style={{ fontSize: 9, color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>{item.title ?? ''}</div>
                </div>
              ))
          }
        </div>
      </div>
    );
  }

  if (t === 'GUIDES_INSIGHTS_CAROUSEL') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s(p.sectionTitle, 'Guides and insights')}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ title: 'Market Outlook 2026', cat: 'Funds' }, { title: 'FX Strategy Guide', cat: 'FX' }].map((it, i) => (
          <div key={i} style={{ flex: 1, padding: '6px 7px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 8, color: '#DB0011', fontWeight: 700, marginBottom: 2 }}>{it.cat}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{it.title}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (t === 'DISCOVER_MORE_CAROUSEL') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s(p.sectionTitle, 'Discover more')}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ bg: '#E8F4FD', label: 'Credit Cards' }, { bg: '#FEF3C7', label: 'Investments' }].map((it, i) => (
          <div key={i} style={{ flex: 1, height: 48, background: it.bg, borderRadius: 6, display: 'flex', alignItems: 'flex-end', padding: '4px 6px' }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: '#374151' }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (t === 'LIFE_DEALS') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>🛍️ {s(p.sectionTitle, 'Life Deals')}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Dining', 'Travel', 'Shopping'].map((cat, i) => (
          <div key={i} style={{ flex: 1, padding: '5px 4px', background: '#F9FAFB', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 14 }}>{['🍽️', '✈️', '🛒'][i]}</div>
            <div style={{ fontSize: 8, color: '#374151', fontWeight: 600 }}>{cat}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (t === 'VIDEO_PLAYER') return (
    <div style={{ background: '#0A1628', overflow: 'hidden' }}>
      <div style={{ position: 'relative', paddingTop: '40%', background: '#0F2040' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(219,0,17,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#fff', marginLeft: 2 }}>▶</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '5px 10px 7px' }}>
        {Boolean(p.title) && <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{s(p.title)}</div>}
        {Boolean(p.presenterName) && <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>{s(p.presenterName)}</div>}
      </div>
    </div>
  );

  if (t === 'MARKET_BRIEFING_TEXT') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s(p.sectionTitle, 'Key takeaways')}</div>
      {['ECB expected to maintain policy rate in 2026.', 'USD weakness likely to persist into H2 2026.'].map((bp, i) => (
        <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 3 }}>
          <span style={{ color: '#DB0011', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>{bp}</span>
        </div>
      ))}
    </div>
  );

  if (t === 'FUNCTION_GRID') return (
    <div style={{ padding: '8px 12px', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Number(p.gridColumns ?? 4)}, 1fr)`, gap: 6 }}>
        {Array.from({ length: Math.min(Number(p.gridColumns ?? 4), 8) }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚙️</div>
            <div style={{ fontSize: 7, color: '#374151', textAlign: 'center' }}>Function</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (t === 'COMBO_QUICK_ACCESS') return (
    <div style={{ background: '#fff', padding: '6px 10px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, borderBottom: '1px solid #F3F4F6', paddingBottom: 4 }}>
        {['My pick', 'Invest', 'Global'].map((tab, i) => (
          <div key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: i === 0 ? '#DB0011' : '#F3F4F6', color: i === 0 ? '#fff' : '#6B7280', fontWeight: 600 }}>{tab}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-around' }}>
        {['💳', '💸', '📈', '🏦'].map((icon, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{icon}</div>
            <div style={{ fontSize: 7, color: '#374151' }}>Item {i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (t === 'SEO_HERO_HEADER') return (
    <div style={{ padding: '10px 12px', background: '#fff', borderLeft: '3px solid #4F46E5' }}>
      <div style={{ fontSize: 7, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>🔍 SEO Hero Header · locked</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#111', lineHeight: 1.3, marginBottom: 3 }}>{s(p.h1Title, '[H1] Page Title — clear &amp; keyword-rich')}</div>
      <div style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>{s(p.valueProp, 'One sentence that summarises the page value for users and search engines.')}</div>
      {!!p.breadcrumb && <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>Home › {String(p.breadcrumb)}</div>}
    </div>
  );

  if (t === 'SEO_FAQ') return (
    <div style={{ padding: '8px 12px', background: '#fff', borderLeft: '3px solid #4F46E5' }}>
      <div style={{ fontSize: 7, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>❓ SEO/AEO FAQ · schema.org/FAQPage</div>
      <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 5 }}>{s(p.sectionTitle, 'Frequently Asked Questions')}</div>
      {[
        s((p.items as {q:string}[])?.[0]?.q, 'What is [product name]?'),
        s((p.items as {q:string}[])?.[1]?.q, 'How do I apply?'),
        s((p.items as {q:string}[])?.[2]?.q, 'What are the fees?'),
      ].map((q, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F3F4F6', fontSize: 9 }}>
          <span style={{ color: '#111', fontWeight: 500 }}>Q: {q}</span>
          <span style={{ color: '#9CA3AF', fontSize: 8 }}>▾</span>
        </div>
      ))}
    </div>
  );

  if (t === 'SEO_STRUCTURED_DATA') return (
    <div style={{ padding: '6px 10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', gap: 6, borderLeft: '3px solid #4F46E5' }}>
      <span style={{ fontSize: 14 }}>🗂️</span>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#4F46E5' }}>JSON-LD Structured Data · hidden in output</div>
        <div style={{ fontSize: 8, color: '#6B7280' }}>{s(p.schemaType, 'schema.org/WebPage')} — injected into &lt;head&gt; at render</div>
      </div>
    </div>
  );

  // Generic fallback
  const cat = catForType(t);
  const col = SLICE_CATEGORY_COLORS[cat] ?? '#6B7280';
  return (    <div style={{ padding: '10px 12px', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{iconForType(t)}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{labelForType(t)}</div>
        <div style={{ fontSize: 9, color: col, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</div>
      </div>
    </div>
  );
}

// ─── Device frame preview ─────────────────────────────────────────────────────

export function TemplateDevicePreview({ slices, channels }: { slices: PageTemplateStarterSlice[]; channels: TemplateChannel[] }) {
  const [ch, setCh] = useState<TemplateChannel>(channels[0] ?? 'SDUI');

  // Reset selected channel when the template changes (different channel list)
  useEffect(() => {
    setCh(channels[0] ?? 'SDUI');
  }, [channels.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const sliceNodes = slices.map((s, i) => <SliceBlockPreview key={i} slice={s} />);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      {channels.length > 1 && (
        <div style={{ display: 'flex', gap: 6, alignSelf: 'stretch' }}>
          {channels.map(c => (
            <button key={c} onClick={() => setCh(c)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: ch === c ? '2px solid #DB0011' : '2px solid #E5E7EB', background: ch === c ? 'rgba(219,0,17,0.05)' : '#fff', color: ch === c ? '#DB0011' : '#374151', transition: 'all 0.12s' }}>
              {c === 'SDUI' ? '📱' : c === 'WEB_STANDARD' ? '🌐' : '💬'} {c === 'SDUI' ? 'SDUI' : c === 'WEB_STANDARD' ? 'Web' : 'WeChat'}
            </button>
          ))}
        </div>
      )}

      {ch === 'SDUI' && (
        <div style={{ width: 180, background: '#1A1A1A', borderRadius: 20, padding: '8px 5px', boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }}>
          <div style={{ background: '#000', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ background: '#DB0011', height: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' }}>
              <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)' }}>9:41</span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto', background: '#F3F4F6' }}>
              {slices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 14px', color: '#9CA3AF', fontSize: 9 }}>No slices — open editor to add</div>
              ) : sliceNodes}
            </div>
            <div style={{ background: '#000', height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 26, height: 2, background: '#333', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      )}

      {ch === 'WEB_STANDARD' && (
        <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 8, border: '1px solid #D1D5DB', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          <div style={{ background: '#F3F4F6', padding: '5px 8px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['#FC615D', '#FDBC40', '#34C749'].map(c => <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 3, padding: '2px 6px', fontSize: 8, color: '#6B7280', fontFamily: 'monospace' }}>🔒 www.hsbc.com.hk</div>
          </div>
          <div style={{ background: '#DB0011', height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 10 }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>HSBC</span>
            {['Accounts', 'Wealth', 'Cards', 'Borrowing'].map(it => <span key={it} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8 }}>{it}</span>)}
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', background: '#F9FAFB' }}>
            {slices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#9CA3AF', fontSize: 10 }}>No slices — open editor to add</div>
            ) : sliceNodes}
          </div>
          <div style={{ background: '#1A1A1A', padding: '6px 10px' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>© HSBC Holdings plc · Authorised by the HKMA</div>
          </div>
        </div>
      )}

      {ch === 'WEB_WECHAT' && (
        <div style={{ width: 170, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.25)', border: '1px solid #E5E7EB' }}>
          <div style={{ maxHeight: 320, overflowY: 'auto', background: '#F3F4F6' }}>
            {slices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9CA3AF', fontSize: 9 }}>No slices — open editor to add</div>
            ) : sliceNodes}
          </div>
          <div style={{ background: '#EDEDED', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 12px' }}>
            <span style={{ fontSize: 12, color: '#333' }}>‹</span>
            <span style={{ fontSize: 12, color: '#333' }}>›</span>
            <span style={{ fontSize: 9, color: '#07C160', fontWeight: 700 }}>分享</span>
            <span style={{ fontSize: 11, color: '#333' }}>···</span>
          </div>
        </div>
      )}
    </div>
  );
}
