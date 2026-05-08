import React, { useState, useEffect, useRef } from 'react';
import { tealium } from '../../analytics/TealiumClient';

// ─── SDUI types ───────────────────────────────────────────────────────────────

interface WealthSlice {
  instanceId: string;
  type: string;
  visible?: boolean;
  props?: Record<string, any>;
}

type LoadState = 'loading' | 'sdui' | 'fallback';

const BFF_BASE = 'http://localhost:4000';

function useWealthSDUI() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [slices, setSlices] = useState<WealthSlice[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BFF_BASE}/api/v1/screen/home-wealth-hk`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const visible: WealthSlice[] = (data.layout?.children ?? []).filter(
          (s: WealthSlice) => s.visible !== false,
        );
        if (cancelled) return;
        if (visible.length === 0) { setLoadState('fallback'); return; }
        setSlices(visible);
        setLoadState('sdui');
      } catch {
        if (!cancelled) setLoadState('fallback');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { loadState, slices };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOME_SEARCH_HEADER_DATA = {
  premierBg: '#DB0011',
  label: 'HSBC Premier',
  placeholder: 'Search functions, products & content',
};

const ICON_MAP: Record<string, string> = {
  account:  '👤',
  transfer: '🌐',
  fx:       '💱',
  stock:    '📈',
  deposit:  '⏰',
  holding:  '📊',
  safe:     '💰',
  fps:      '↔️',
  scan:     '📷',
  all:      '⊞',
};

const COMBO_QA_TABS = [
  { id: 'my-pick',  label: 'My pick' },
  { id: 'invest',   label: 'Invest' },
  { id: 'global',   label: 'Global' },
  { id: 'hk-daily', label: 'HK Daily' },
];

const COMBO_QA_ROW1 = [
  { id: 'qa-1', icon: 'account',  label: 'Account overview',  deepLink: 'hsbc://accounts' },
  { id: 'qa-2', icon: 'transfer', label: 'Transfer Globally', deepLink: 'hsbc://transfer/global' },
  { id: 'qa-3', icon: 'fx',       label: 'Foreign exchange',  deepLink: 'hsbc://fx' },
  { id: 'qa-4', icon: 'stock',    label: 'Trade stock',       deepLink: 'hsbc://trade/stock' },
  { id: 'qa-5', icon: 'deposit',  label: 'Time deposit',      deepLink: 'hsbc://deposit' },
];

const COMBO_QA_ROW2 = [
  { id: 'qa-6',  icon: 'holding', label: 'My holding details',    deepLink: 'hsbc://holdings' },
  { id: 'qa-7',  icon: 'safe',    label: 'Money safe',             deepLink: 'hsbc://money-safe' },
  { id: 'qa-8',  icon: 'fps',     label: 'Local transfer/FPS',     deepLink: 'hsbc://transfer/fps' },
  { id: 'qa-9',  icon: 'scan',    label: 'Scan to pay',            deepLink: 'hsbc://scan-pay' },
  { id: 'qa-10', icon: 'all',     label: 'All product & services', deepLink: 'hsbc://all-services' },
];

const CARD_ACTIVATION_DATA = {
  message: 'Your card needs to be activated',
  deepLink: 'hsbc://card/activate',
};

const QUEST_BANNER_DATA = {
  title: 'Getting started',
  description: 'Open investment account and complete the following quests to enjoy reward!',
  ctaLabel: 'Check out all 4 quests',
  ctaDeepLink: 'hsbc://quests',
};

const FEATURE_PRODUCT_DATA = {
  sectionTitle: 'Feature product',
  tabs: ['Top performers', 'Top dividend', 'Top selling', 'Instalment'],
  funds: [
    {
      id: 'fp-1',
      name: 'AB SICAV I - LOW VOLATILITY EQUITY PORTFOLIO CLASS AD S...',
      code: 'U43120',
      returnLabel: '1Y return',
      returnValue: '+54.79%',
      returnPositive: true,
      tags: [] as string[],
    },
    {
      id: 'fp-2',
      name: 'HANG SENG INDEX FUND CLASS A (HKD)',
      code: 'U42272',
      returnLabel: '1Y return',
      returnValue: '+18.10%',
      returnPositive: true,
      tags: ['ESG'],
    },
    {
      id: 'fp-3',
      name: 'ALLIANZ INCOME AND GROWTH CLASS AM DIS (HKD MONTHLY...',
      code: 'U40032',
      returnLabel: '1Y return',
      returnValue: '+11.45%',
      returnPositive: true,
      tags: ['New fund'],
    },
  ],
  moreLabel: 'View Best selling fund list (10)',
  moreDeepLink: 'hsbc://funds/best-selling',
};

const WEALTH_STUDIO_DATA = {
  sectionTitle: 'Premier Elite Wealth Studio',
  moreLabel: 'View all',
  moreDeepLink: 'hsbc://wealth-studio',
  items: [
    {
      id: 'ws-1',
      episodeLabel: 'Episode 13',
      liveBadge: 'To-be-live on 1 Feb 15:30',
      title: 'How AI experts think about AI?',
      ctaLabel: 'Register for live stream',
      imageColor: '#1A1A2E',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: 'ws-2',
      episodeLabel: 'Episode 12',
      liveBadge: 'Aired 25 Jan 15:30',
      title: 'Global markets outlook 2024',
      ctaLabel: 'Watch now',
      imageColor: '#0F2040',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: 'ws-3',
      episodeLabel: 'Episode 11',
      liveBadge: 'Aired 18 Jan 10:00',
      title: 'Navigating interest rate cycles in 2024',
      ctaLabel: 'Watch now',
      imageColor: '#1B2A4A',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      id: 'ws-4',
      episodeLabel: 'Episode 10',
      liveBadge: 'Aired 11 Jan 15:30',
      title: 'Sustainable investing: ESG opportunities ahead',
      ctaLabel: 'Watch now',
      imageColor: '#0D2B1E',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
    {
      id: 'ws-5',
      episodeLabel: 'Episode 9',
      liveBadge: 'Aired 4 Jan 15:30',
      title: 'Private banking essentials for Premier Elite',
      ctaLabel: 'Watch now',
      imageColor: '#2D1B4E',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    },
  ],
};

const GUIDES_INSIGHTS_CAROUSEL_DATA = {
  sectionTitle: 'Guides and insights',
  moreLabel: 'View all',
  moreDeepLink: 'hsbc://guides',
  items: [
    {
      id: 'gi-1',
      title: 'Investment 101 - An investment in knowledge pays the best interest',
      date: '8 Apr 2024',
      imageColor: '#2D3748',
      deepLink: 'hsbc://guides/investment-101',
    },
    {
      id: 'gi-2',
      title: 'Market outlook Q2 2024',
      date: '2 Apr 2024',
      imageColor: '#1A365D',
      deepLink: 'hsbc://guides/market-outlook',
    },
    {
      id: 'gi-3',
      title: 'Top 5 ETFs to watch this quarter',
      date: '28 Mar 2024',
      imageColor: '#1C3A2A',
      deepLink: 'hsbc://guides/etf-watch',
    },
    {
      id: 'gi-4',
      title: 'Understanding bond yields in a rising rate environment',
      date: '20 Mar 2024',
      imageColor: '#3B2A1A',
      deepLink: 'hsbc://guides/bond-yields',
    },
    {
      id: 'gi-5',
      title: 'ESG investing: aligning returns with values',
      date: '14 Mar 2024',
      imageColor: '#1A2E1A',
      deepLink: 'hsbc://guides/esg-investing',
    },
  ],
};

const FX_WATCHLIST_DATA = {
  sectionTitle: 'FX watchlist',
  tierBadge: 'Gold Forex Club tier',
  tierDescription: '15% Spread discount has been applied to your rate.',
  pairs: [
    { id: 'fx-1', pair: 'USD/JPY', sellLabel: 'Sell USD', sellRate: '148.44', buyLabel: 'Buy USD', buyRate: '148.12' },
    { id: 'fx-2', pair: 'HKD/CHF', sellLabel: 'Sell HKD', sellRate: '0.1042', buyLabel: 'Buy HKD', buyRate: '0.1038' },
    { id: 'fx-3', pair: 'HKD/THB', sellLabel: 'Sell HKD', sellRate: '4.1055', buyLabel: 'Buy HKD', buyRate: '4.1132' },
  ],
  moreLabel: 'View more in FX',
  moreDeepLink: 'hsbc://fx/watchlist',
};

const DISCOVER_MORE_CAROUSEL_DATA = {
  sectionTitle: 'Discover more',
  items: [
    {
      id: 'dm-1',
      tag: 'Time Deposit',
      tagColor: '#DB0011',
      title: 'Up to 15.5% p.a. FX Deposit Rate',
      subtitle: 'Earn up to 15.5% p.a. on FX & Time Deposits! T&Cs apply.',
      imageColor: '#1A2E4A',
      deepLink: 'hsbc://deposit/fx',
    },
    {
      id: 'dm-2',
      tag: 'Well+',
      tagColor: '#6B46C1',
      title: 'PURE Sign up 10-day free trial',
      subtitle: 'Enjoy 10 days free access to PURE fitness with Well+.',
      imageColor: '#2D3748',
      deepLink: 'hsbc://wellplus',
    },
    {
      id: 'dm-3',
      tag: 'Premier Credit Card',
      tagColor: '#B7791F',
      title: 'Up to 10x reward points on dining',
      subtitle: 'Dine and earn more with your HSBC Premier card.',
      imageColor: '#2D1B00',
      deepLink: 'hsbc://credit-card/rewards',
    },
    {
      id: 'dm-4',
      tag: 'Investment',
      tagColor: '#2B6CB0',
      title: 'Zero brokerage on first 3 trades',
      subtitle: 'Start investing with zero commission for new investors.',
      imageColor: '#1A2E4A',
      deepLink: 'hsbc://invest/promo',
    },
    {
      id: 'dm-5',
      tag: 'Insurance',
      tagColor: '#276749',
      title: 'Protect what matters most',
      subtitle: 'Comprehensive life coverage starting from HKD 180/month.',
      imageColor: '#1C2E1C',
      deepLink: 'hsbc://insurance/life',
    },
  ],
};

// ─── Impression hook ──────────────────────────────────────────────────────────

function useImpressionOnce(fn: () => void) {
  const fired = useRef(false);
  useEffect(() => { if (!fired.current) { fired.current = true; fn(); } }, []);
}

// ─── Root page ────────────────────────────────────────────────────────────────

export function WealthHubPage() {
  const { loadState, slices } = useWealthSDUI();
  useImpressionOnce(() => tealium.wealthHubViewed());

  const s: React.CSSProperties = { fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif" };
  const wrap = { ...s, maxWidth: 480, margin: '0 auto', background: '#F5F5F5', minHeight: '100vh' };

  if (loadState === 'loading') {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#9CA3AF', fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  if (loadState === 'sdui') {
    return (
      <div style={wrap}>
        {slices.map(slice => (
          <SDUISliceView key={slice.instanceId} slice={slice} />
        ))}
        <div style={{ height: 40 }} />
      </div>
    );
  }

  // fallback — static data
  return (
    <div style={wrap}>
      <WHHomeSearchHeader />
      <WHComboQuickAccess />
      <WHCardActivationBanner />
      <WHQuestBanner />
      <WHFeatureProduct />
      <WHWealthStudioCarousel />
      <WHGuidesInsights />
      <WHFXWatchlist />
      <WHDiscoverMore />
      <div style={{ height: 40 }} />
    </div>
  );
}

// ─── SDUI slice dispatcher ────────────────────────────────────────────────────

function SDUISliceView({ slice }: { slice: WealthSlice }) {
  const p = slice.props ?? {};
  switch (slice.type) {
    case 'HOME_SEARCH_HEADER':     return <WHHomeSearchHeader p={p} />;
    case 'COMBO_QUICK_ACCESS':     return <WHComboQuickAccess p={p} />;
    case 'CARD_ACTIVATION_BANNER': return <WHCardActivationBanner p={p} />;
    case 'QUEST_BANNER':           return <WHQuestBanner p={p} />;
    case 'FEATURE_PRODUCT':        return <WHFeatureProduct p={p} />;
    case 'WEALTH_STUDIO_CAROUSEL': return <WHWealthStudioCarousel p={p} />;
    case 'GUIDES_INSIGHTS_CAROUSEL': return <WHGuidesInsights p={p} />;
    case 'FX_WATCHLIST':           return <WHFXWatchlist p={p} />;
    case 'DISCOVER_MORE_CAROUSEL': return <WHDiscoverMore p={p} />;
    default:                       return null;
  }
}

// ─── 1. Home Search Header ────────────────────────────────────────────────────

function WHHomeSearchHeader({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('HOME_SEARCH_HEADER', 'slice-home-search-header', 0));
  const bg          = p?.premierBg   ?? HOME_SEARCH_HEADER_DATA.premierBg;
  const label       = p?.premierLabel ?? HOME_SEARCH_HEADER_DATA.label;
  const placeholder = p?.placeholder  ?? HOME_SEARCH_HEADER_DATA.placeholder;
  return (
    <div style={{ background: bg, padding: '10px 14px 12px' }}>
      {/* Top row: label + icons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 0.2 }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span
            style={{ fontSize: 20, cursor: 'pointer', color: '#fff' }}
            onClick={() => tealium.track({
              tealium_event: 'notification_tap', event_category: 'Wealth',
              event_action: 'notification_tapped', screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
            })}
          >🔔</span>
          <span
            style={{ fontSize: 20, cursor: 'pointer', color: '#fff' }}
            onClick={() => tealium.track({
              tealium_event: 'headset_tap', event_category: 'Wealth',
              event_action: 'headset_tapped', screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
            })}
          >🎧</span>
        </div>
      </div>
      {/* Search bar */}
      <div
        style={{
          background: '#fff', borderRadius: 20, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}
        onClick={() => tealium.track({
          tealium_event: 'search_tap', event_category: 'Wealth',
          event_action: 'search_tapped', screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
        })}
      >
        <span style={{ fontSize: 14, color: '#9CA3AF' }}>🔍</span>
        <span style={{ flex: 1, fontSize: 13, color: '#9CA3AF' }}>
          {placeholder}
        </span>
        <span style={{
          background: '#DB0011', color: '#fff', fontSize: 9, fontWeight: 700,
          padding: '2px 6px', borderRadius: 8, letterSpacing: 0.4,
        }}>AI</span>
      </div>
    </div>
  );
}

// ─── 2. Combo Quick Access ────────────────────────────────────────────────────

function WHComboQuickAccess({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('COMBO_QUICK_ACCESS', 'slice-combo-quick-access', 1));
  const [activeTab, setActiveTab] = useState('my-pick');

  const tabs    = p?.tabs     ?? COMBO_QA_TABS;
  const row1    = p?.row1Items ?? COMBO_QA_ROW1;
  const row2    = p?.row2Items ?? COMBO_QA_ROW2;

  const iconRow = (items: typeof COMBO_QA_ROW1) => (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      {items.map(item => (
        <div
          key={item.id}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, cursor: 'pointer' }}
          onClick={() => tealium.quickAccessTapped(item.label, item.deepLink)}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 14, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 20,
            background: '#F3F4F6',
          }}>
            {ICON_MAP[item.icon] ?? item.icon}
          </div>
          <span style={{ fontSize: 9, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#fff', paddingBottom: 12 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 0,
        borderBottom: '1px solid #F3F4F6',
        scrollbarWidth: 'none',
      }}>
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            style={{
              flex: '0 0 auto', padding: '10px 18px', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? '#DB0011' : '#6B7280',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #DB0011' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Icon rows */}
      <div style={{ padding: '10px 8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {iconRow(row1)}
        {iconRow(row2)}
      </div>
    </div>
  );
}

// ─── 3. Card Activation Banner ────────────────────────────────────────────────

function WHCardActivationBanner({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('CARD_ACTIVATION_BANNER', 'slice-card-activation', 2));
  const message  = p?.message  ?? CARD_ACTIVATION_DATA.message;
  const deepLink = p?.deepLink ?? CARD_ACTIVATION_DATA.deepLink;
  return (
    <div
      style={{
        background: '#FFF7ED', borderLeft: '3px solid #F59E0B',
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', cursor: 'pointer', marginTop: 4,
      }}
      onClick={() => tealium.sliceTapped(
        'CARD_ACTIVATION_BANNER', 'slice-card-activation',
        message, deepLink,
      )}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>💳</span>
        <span style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
          {message}
        </span>
      </div>
      <span style={{ fontSize: 16, color: '#92400E' }}>›</span>
    </div>
  );
}

// ─── 4. Quest Banner ──────────────────────────────────────────────────────────

function WHQuestBanner({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('QUEST_BANNER', 'slice-getting-started', 3));
  const title       = p?.title       ?? QUEST_BANNER_DATA.title;
  const description = p?.description ?? QUEST_BANNER_DATA.description;
  const ctaLabel    = p?.ctaLabel    ?? QUEST_BANNER_DATA.ctaLabel;
  const ctaDeepLink = p?.ctaDeepLink ?? QUEST_BANNER_DATA.ctaDeepLink;
  return (
    <div style={{
      background: '#fff', margin: '8px 0', padding: '14px 16px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      {/* Hexagon icon placeholder */}
      <div style={{
        width: 44, height: 44, background: '#DB0011', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>⬡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4, marginBottom: 8 }}>
          {description}
        </div>
        <span
          style={{ fontSize: 12, color: '#DB0011', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => tealium.sliceTapped(
            'QUEST_BANNER', 'slice-getting-started',
            ctaLabel, ctaDeepLink,
          )}
        >
          {ctaLabel} ›
        </span>
      </div>
    </div>
  );
}

// ─── 5. Feature Product ───────────────────────────────────────────────────────

function WHFeatureProduct({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('FEATURE_PRODUCT', 'slice-feature-product', 4));
  const sectionTitle = p?.sectionTitle ?? FEATURE_PRODUCT_DATA.sectionTitle;
  const tabs         = p?.tabs         ?? FEATURE_PRODUCT_DATA.tabs;
  const funds        = p?.funds        ?? FEATURE_PRODUCT_DATA.funds;
  const moreLabel    = p?.moreLabel    ?? FEATURE_PRODUCT_DATA.moreLabel;
  const moreDeepLink = p?.moreDeepLink ?? FEATURE_PRODUCT_DATA.moreDeepLink;
  const [activeTab, setActiveTab] = useState(p?.activeTab ?? 'Top performers');

  return (
    <div style={{ background: '#fff', marginTop: 8, padding: '14px 0' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
          {sectionTitle}
        </span>
      </div>
      {/* Tab strip */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 0,
        borderBottom: '1px solid #F3F4F6', paddingLeft: 16,
        scrollbarWidth: 'none',
      }}>
        {tabs.map((tab: any) => (
          <button
            key={tab}
            style={{
              flex: '0 0 auto', padding: '7px 14px', fontSize: 12,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#DB0011' : '#6B7280',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #DB0011' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Fund list */}
      <div style={{ padding: '0 16px' }}>
        {funds.map((fund: any, i: number) => (
          <div key={fund.id}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', cursor: 'pointer',
              }}
              onClick={() => tealium.wealthProductTapped(fund.name, fund.id)}
            >
              {/* Left: rank + fund info */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: '#DB0011',
                  flexShrink: 0, minWidth: 16,
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#1A1A2E',
                    marginBottom: 4, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {fund.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>{fund.code}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {fund.tags.map((tag: string) => (
                      <span key={tag} style={{
                        fontSize: 9, background: '#F3F4F6', color: '#6B7280',
                        padding: '1px 6px', borderRadius: 8,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right: return */}
              <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 10 }}>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>{fund.returnLabel}</div>
                <div style={{
                  fontSize: 16, fontWeight: 800,
                  color: fund.returnPositive ? '#059669' : '#DC2626',
                }}>
                  {fund.returnValue}
                </div>
              </div>
            </div>
            {i < funds.length - 1 && (
              <div style={{ height: 1, background: '#F3F4F6' }} />
            )}
          </div>
        ))}
        {/* More link */}
        <div
          style={{
            marginTop: 10, padding: '10px 0', textAlign: 'center',
            fontSize: 12, color: '#DB0011', fontWeight: 600, cursor: 'pointer',
            borderTop: '1px solid #F3F4F6',
          }}
          onClick={() => tealium.sliceTapped(
            'FEATURE_PRODUCT', 'slice-feature-product',
            moreLabel, moreDeepLink,
          )}
        >
          {moreLabel} ›
        </div>
      </div>
    </div>
  );
}

// ─── 6. Wealth Studio Carousel ────────────────────────────────────────────────

function WHWealthStudioCarousel({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('WEALTH_STUDIO_CAROUSEL', 'slice-wealth-studio', 5));
  const sectionTitle = p?.sectionTitle ?? WEALTH_STUDIO_DATA.sectionTitle;
  const moreLabel    = p?.moreLabel    ?? WEALTH_STUDIO_DATA.moreLabel;
  const moreDeepLink = p?.moreDeepLink ?? WEALTH_STUDIO_DATA.moreDeepLink;
  const items        = p?.items        ?? WEALTH_STUDIO_DATA.items;
  const [activeIdx, setActiveIdx] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CARD_W = 220;
  const GAP = 10;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / (CARD_W + GAP));
    setActiveIdx(Math.max(0, Math.min(idx, items.length - 1)));
  };

  const scrollTo = (idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * (CARD_W + GAP), behavior: 'smooth' });
    setActiveIdx(idx);
  };

  return (
    <>
      {playingId && (() => {
        const item = items.find((v: any) => v.id === playingId)!;
        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
              zIndex: 1000, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setPlayingId(null)}
          >
            <div
              style={{ width: '92%', maxWidth: 460, borderRadius: 12, overflow: 'hidden', background: '#000' }}
              onClick={e => e.stopPropagation()}
            >
              <video
                src={item.videoUrl}
                controls
                autoPlay
                style={{ width: '100%', display: 'block', maxHeight: '60vh', background: '#000' }}
              />
              <div style={{ background: '#fff', padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.episodeLabel}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', lineHeight: 1.4 }}>{item.title}</div>
              </div>
            </div>
            <button
              style={{
                marginTop: 16, background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: 13, padding: '8px 24px', borderRadius: 20, cursor: 'pointer',
              }}
              onClick={() => setPlayingId(null)}
            >✕ Close</button>
          </div>
        );
      })()}
      <div style={{ background: '#fff', marginTop: 8, padding: '14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
            {sectionTitle}
          </span>
          <span
            style={{ fontSize: 12, color: '#DB0011', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => tealium.sliceTapped('WEALTH_STUDIO_CAROUSEL', 'slice-wealth-studio', moreLabel, moreDeepLink)}
          >
            {moreLabel} ›
          </span>
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex', overflowX: 'auto', gap: GAP,
            paddingLeft: 16, paddingRight: 16,
            scrollbarWidth: 'none', scrollSnapType: 'x mandatory',
            alignItems: 'flex-start',
          }}
        >
          {items.map((item: any) => (
            <div
              key={item.id}
              style={{
                flex: `0 0 ${CARD_W}px`, borderRadius: 12, overflow: 'hidden',
                background: item.imageColor, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                scrollSnapAlign: 'start',
                display: 'flex', flexDirection: 'column',
                height: 200,
              }}
              onClick={() => tealium.wealthStudioTapped(item.episodeLabel, item.title, item.ctaLabel)}
            >
              {/* Image area — fixed height so all cards align */}
              <div style={{ height: 120, background: item.imageColor, position: 'relative', padding: 10 }}>
                <span style={{
                  display: 'inline-block', background: 'rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                }}>{item.episodeLabel}</span>
                {/* Play button centred */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}
                    onClick={e => { e.stopPropagation(); setPlayingId(item.id); }}
                  >▶</div>
                </div>
                <div style={{
                  position: 'absolute', bottom: 8, left: 10, right: 10,
                  background: 'rgba(219,0,17,0.85)', borderRadius: 6, padding: '3px 8px',
                }}>
                  <span style={{ fontSize: 9, color: '#fff', fontWeight: 500 }}>🔴 {item.liveBadge}</span>
                </div>
              </div>
              {/* Text area — fixed height so CTA button always aligns */}
              <div style={{ background: '#fff', padding: '10px 12px', height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#1A1A2E',
                  lineHeight: 1.3, marginBottom: 8,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                } as React.CSSProperties}>{item.title}</div>
                <button
                  style={{
                    background: '#DB0011', color: '#fff', fontSize: 10,
                    fontWeight: 700, padding: '5px 12px', borderRadius: 14,
                    border: 'none', cursor: 'pointer', width: '100%',
                  }}
                  onClick={e => { e.stopPropagation(); setPlayingId(item.id); }}
                >{item.ctaLabel}</button>
              </div>
            </div>
          ))}
        </div>
        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
          {items.map((_: any, i: number) => (
            <div
              key={i}
              onClick={() => scrollTo(i)}
              style={{
                width: activeIdx === i ? 16 : 6, height: 6, borderRadius: 3,
                background: activeIdx === i ? '#DB0011' : '#D1D5DB',
                cursor: 'pointer', transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── 7. Guides and Insights ───────────────────────────────────────────────────

function WHGuidesInsights({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('GUIDES_INSIGHTS_CAROUSEL', 'slice-guides-insights', 6));
  const sectionTitle = p?.sectionTitle ?? GUIDES_INSIGHTS_CAROUSEL_DATA.sectionTitle;
  const moreLabel    = p?.moreLabel    ?? GUIDES_INSIGHTS_CAROUSEL_DATA.moreLabel;
  const moreDeepLink = p?.moreDeepLink ?? GUIDES_INSIGHTS_CAROUSEL_DATA.moreDeepLink;
  const items        = p?.items        ?? GUIDES_INSIGHTS_CAROUSEL_DATA.items;
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CARD_W = 190;
  const GAP = 10;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / (CARD_W + GAP));
    setActiveIdx(Math.max(0, Math.min(idx, items.length - 1)));
  };

  const scrollTo = (idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * (CARD_W + GAP), behavior: 'smooth' });
    setActiveIdx(idx);
  };

  return (
    <div style={{ background: '#fff', marginTop: 8, padding: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
          {sectionTitle}
        </span>
        <span
          style={{ fontSize: 12, color: '#DB0011', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => tealium.sliceTapped('GUIDES_INSIGHTS_CAROUSEL', 'slice-guides-insights', moreLabel, moreDeepLink)}
        >
          {moreLabel} ›
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex', overflowX: 'auto', gap: GAP,
          paddingLeft: 16, paddingRight: 16,
          scrollbarWidth: 'none', scrollSnapType: 'x mandatory',
          alignItems: 'flex-start',
        }}
      >
        {items.map((item: any) => (
          <div
            key={item.id}
            style={{
              flex: `0 0 ${CARD_W}px`, borderRadius: 12, overflow: 'hidden',
              background: '#fff', cursor: 'pointer',
              border: '1px solid #F3F4F6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              scrollSnapAlign: 'start',
              display: 'flex', flexDirection: 'column',
              height: 172,
            }}
            onClick={() => tealium.guidesTapped(item.title, item.id, item.deepLink)}
          >
            {/* Fixed-height image area so icon is always centred at the same position */}
            <div style={{
              height: 100, background: item.imageColor, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 28, opacity: 0.6 }}>📖</span>
            </div>
            {/* Text area fills remaining card height */}
            <div style={{ padding: '10px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#1A1A2E',
                lineHeight: 1.4, marginBottom: 6,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              } as React.CSSProperties}>{item.title}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>{item.date}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
        {items.map((_: any, i: number) => (
          <div
            key={i}
            onClick={() => scrollTo(i)}
            style={{
              width: activeIdx === i ? 16 : 6, height: 6, borderRadius: 3,
              background: activeIdx === i ? '#DB0011' : '#D1D5DB',
              cursor: 'pointer', transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 8. FX Watchlist ──────────────────────────────────────────────────────────

function WHFXWatchlist({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('FX_WATCHLIST', 'slice-fx-watchlist', 7));
  const sectionTitle   = p?.sectionTitle   ?? FX_WATCHLIST_DATA.sectionTitle;
  const tierBadge      = p?.tierBadge      ?? FX_WATCHLIST_DATA.tierBadge;
  const tierDescription= p?.tierDescription ?? FX_WATCHLIST_DATA.tierDescription;
  const pairs          = p?.pairs          ?? FX_WATCHLIST_DATA.pairs;
  const moreLabel      = p?.moreLabel      ?? FX_WATCHLIST_DATA.moreLabel;
  const moreDeepLink   = p?.moreDeepLink   ?? FX_WATCHLIST_DATA.moreDeepLink;
  return (
    <div style={{ background: '#fff', marginTop: 8, padding: '14px 16px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
          {sectionTitle}
        </span>
        <span
          style={{ fontSize: 12, color: '#DB0011', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => tealium.sliceTapped(
            'FX_WATCHLIST', 'slice-fx-watchlist',
            moreLabel, moreDeepLink,
          )}
        >
          {moreLabel} ›
        </span>
      </div>
      {/* Tier badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: 8, padding: '4px 10px', marginBottom: 12,
      }}>
        <span style={{ fontSize: 12 }}>🏅</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#92400E' }}>
          {tierBadge}
        </span>
      </div>
      <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 12, marginTop: -8 }}>
        {tierDescription}
      </div>
      {/* Currency pairs */}
      {pairs.map((pair: any, i: number) => (
        <div key={pair.id}>
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', cursor: 'pointer',
            }}
            onClick={() => tealium.track({
              tealium_event: 'fx_pair_tap', event_category: 'Wealth',
              event_action: 'fx_pair_tapped', event_label: pair.pair,
              screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
              fx_pair: pair.pair,
            })}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', minWidth: 72 }}>
              {pair.pair}
            </span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>{pair.sellLabel}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{pair.sellRate}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>{pair.buyLabel}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{pair.buyRate}</div>
              </div>
            </div>
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>›</span>
          </div>
          {i < pairs.length - 1 && (
            <div style={{ height: 1, background: '#F3F4F6' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 9. Discover More ─────────────────────────────────────────────────────────

function WHDiscoverMore({ p }: { p?: Record<string, any> } = {}) {
  useImpressionOnce(() => tealium.sliceImpression('DISCOVER_MORE_CAROUSEL', 'slice-discover-more', 8));
  const sectionTitle = p?.sectionTitle ?? DISCOVER_MORE_CAROUSEL_DATA.sectionTitle;
  const items        = p?.items        ?? DISCOVER_MORE_CAROUSEL_DATA.items;
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CARD_W = 200;
  const GAP = 10;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / (CARD_W + GAP));
    setActiveIdx(Math.max(0, Math.min(idx, items.length - 1)));
  };

  const scrollTo = (idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * (CARD_W + GAP), behavior: 'smooth' });
    setActiveIdx(idx);
  };

  return (
    <div style={{ background: '#fff', marginTop: 8, padding: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
          {sectionTitle}
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex', overflowX: 'auto', gap: GAP,
          paddingLeft: 16, paddingRight: 16,
          scrollbarWidth: 'none', scrollSnapType: 'x mandatory',
          alignItems: 'flex-start',
        }}
      >
        {items.map((item: any) => (
          <div
            key={item.id}
            style={{
              flex: `0 0 ${CARD_W}px`, borderRadius: 12, overflow: 'hidden',
              background: '#fff', cursor: 'pointer',
              border: '1px solid #F3F4F6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              scrollSnapAlign: 'start',
              display: 'flex', flexDirection: 'column',
              height: 178,
            }}
            onClick={() => tealium.discoverMoreTapped(item.tag, item.title, item.deepLink)}
          >
            {/* Fixed-height image area so tag badge is always at same size/position */}
            <div style={{
              height: 110, background: item.imageColor, flexShrink: 0,
              position: 'relative', padding: 10,
              display: 'flex', alignItems: 'flex-start',
            }}>
              <span style={{
                display: 'inline-block',
                background: item.tagColor, color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              }}>{item.tag}</span>
            </div>
            {/* Text area fills remaining card height */}
            <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#1A1A2E',
                lineHeight: 1.3, marginBottom: 4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              } as React.CSSProperties}>{item.title}</div>
              {item.subtitle ? (
                <div style={{
                  fontSize: 10, color: '#6B7280', lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                } as React.CSSProperties}>{item.subtitle}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
        {items.map((_: any, i: number) => (
          <div
            key={i}
            onClick={() => scrollTo(i)}
            style={{
              width: activeIdx === i ? 16 : 6, height: 6, borderRadius: 3,
              background: activeIdx === i ? '#DB0011' : '#D1D5DB',
              cursor: 'pointer', transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
