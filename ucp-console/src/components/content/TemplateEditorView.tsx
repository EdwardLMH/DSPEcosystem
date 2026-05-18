import { useState, useRef, useEffect } from 'react';
import { useUCP } from '../../store/UCPStore';
import type { PageTemplate, PageTemplateSlice as PageTemplateStarterSlice, TemplateChannel, BizLineId } from '../../types/ucp';
import { PALETTE_ITEMS, SLICE_CATEGORY_COLORS, catForType, iconForType, labelForType, SliceBlockPreview, TemplateDevicePreview } from './SlicePreview';
import { LanguageSelector } from '../shared/LanguageSelector';

const PALETTE_CATS = [
  { id: 'navigation', icon: '🔝', label: 'Nav' },
  { id: 'promotion', icon: '🎪', label: 'Promo' },
  { id: 'function', icon: '⚡', label: 'Func' },
  { id: 'wealth', icon: '💰', label: 'Wealth' },
  { id: 'lifestyle', icon: '🛍️', label: 'Life' },
  { id: 'insight', icon: '📈', label: 'Insight' },
  { id: 'layout', icon: '📐', label: 'Layout' },
];

const CATEGORY_COLORS = SLICE_CATEGORY_COLORS;

// ─── Default props ────────────────────────────────────────────────────────────

function defaultPropsFor(t: string): Record<string, unknown> {
  const m: Record<string, Record<string, unknown>> = {
    HEADER_NAV: { title: 'Page Title', showNotificationBell: true, showQRScanner: false },
    HOME_SEARCH_HEADER: { premierLabel: 'HSBC Premier', premierBg: '#DB0011', eliteLabel: 'HSBC Elite', eliteBg: '#0D5C3A', advanceLabel: 'HSBC One', advanceBg: '#D4580A', massLabel: 'HSBC Personal Banking', massBg: '#4B5563', placeholder: 'Search functions, products & content', enableSemanticSearch: true, enableNotification: true },
    PREMIER_HEADER: { brandLabel: 'HSBC Premier', enableNotification: true },
    ELITE_HEADER: { brandLabel: 'HSBC Elite', enableNotification: true },
    ADVANCE_HEADER: { brandLabel: 'HSBC Advance', enableNotification: true },
    MASS_HEADER: { brandLabel: 'HSBC Personal Banking', enableNotification: true },
    HOME_SEARCH_BAR: { placeholder: 'Search functions, products & content', enableSemanticSearch: true, enableQRScan: true, enableChatbot: true, enableMessageInbox: true },
    CONTENT_TAB_BAR: { tabs: [{ id: 't1', label: 'My pick', active: true }, { id: 't2', label: 'Invest', active: false }], activeTab: 't1' },
    PROMO_BANNER: { title: 'Promotion Title', subtitle: 'Subtitle text', ctaLabel: 'Learn More', ctaDeepLink: '', imageUrl: '', backgroundColor: '#E8F4FD' },
    AD_BANNER: { title: 'Special Offer', subtitle: '', dismissible: true },
    CAMPAIGN_HERO: { headline: 'Campaign Headline', subHeadline: 'Campaign sub-headline copy', badge: 'Limited Time Offer', bgGradient: 'linear-gradient(160deg,#0A1A3D 0%,#0D2B6B 100%)', accentColor: '#C9A84C' },
    CAMPAIGN_BENEFITS: { sectionTitle: 'Key Benefits', items: [{ icon: '✅', title: 'Benefit 1', description: 'Description' }, { icon: '⭐', title: 'Benefit 2', description: 'Description' }] },
    CAMPAIGN_CTA: { ctaLabel: 'Apply Now', ctaSubtext: 'Quick & easy application', offerBadge: 'First Year Fee Waived', ctaUrl: '/apply', secondaryLabel: 'Learn More', secondaryUrl: '/learn' },
    QUICK_ACCESS: { items: [] },
    FUNCTION_GRID: { gridColumns: '4', maxRows: 2, showLabels: true, rows: [] },
    AI_ASSISTANT: { greeting: 'Hi, how can I help you today?' },
    FLASH_LOAN: { productName: 'Flash Loan', maxAmount: '500,000', currency: 'HKD', ctaLabel: 'Apply Now' },
    CARD_ACTIVATION_BANNER: { message: 'Your card needs to be activated', deepLink: 'hsbc://card/activate' },
    QUEST_BANNER: { title: 'Getting Started', description: 'Complete quests to enjoy rewards!', ctaLabel: 'Check quests', ctaDeepLink: 'hsbc://quests', totalQuests: 4 },
    WEALTH_SELECTION: { sectionTitle: 'Wealth Products', products: [], moreDeepLink: '' },
    FEATURED_RANKINGS: { sectionTitle: 'Top Funds', items: [], moreDeepLink: '' },
    FX_WATCHLIST: { sectionTitle: 'FX Watchlist', tierBadge: 'Gold Forex Club', tierDescription: '15% Spread discount applied.', pairs: [], moreLabel: 'View more', moreDeepLink: 'hsbc://fx' },
    FEATURE_PRODUCT: {
      sectionTitle: 'Feature product',
      activeButtonId: 'top-performers',
      buttons: [
        { id: 'top-performers', name: 'Top performers', description: 'Top 3 funds by 1Y return', url: '/api/v1/funds/feature-products?filter=top-performers&limit=3' },
        { id: 'top-dividend', name: 'Top dividend', description: 'Income funds with higher dividend profile', url: '/api/v1/funds/feature-products?filter=top-dividend&limit=3' },
        { id: 'top-selling', name: 'Top selling', description: 'Best selling funds by subscription volume', url: '/api/v1/funds/feature-products?filter=top-selling&limit=3' },
        { id: 'installment', name: 'Installment', description: 'Funds suitable for installment investment plans', url: '/api/v1/funds/feature-products?filter=installment&limit=3' },
      ],
      moreLabel: 'View Best selling fund list (10)',
      moreDeepLink: 'hsbc://funds/best-selling',
      bestSellingUrl: '/api/v1/funds/feature-products?filter=best-selling&limit=10',
      funds: [],
      tabs: [],
    },
    WEALTH_STUDIO_CAROUSEL: { sectionTitle: 'Premier Elite Wealth Studio', items: [], moreLabel: 'View all', moreDeepLink: 'hsbc://wealth-studio' },
    GUIDES_INSIGHTS_CAROUSEL: { sectionTitle: 'Guides and insights', items: [], moreLabel: 'View all', moreDeepLink: 'hsbc://guides' },
    DISCOVER_MORE_CAROUSEL: { sectionTitle: 'Discover more', items: [] },
    LIFE_DEALS: { sectionTitle: 'Life Deals', deals: [], moreDeepLink: '' },
    VIDEO_PLAYER: { ucpAssetId: '', title: '', presenterName: '', presenterTitle: '', autoplay: false, showCaption: true },
    MARKET_BRIEFING_TEXT: { ucpContentId: '', sectionTitle: 'Key takeaways', bulletPoints: [], disclaimer: '' },
    CONTACT_RM_CTA: { label: 'Contact Your RM', subLabel: '', deepLink: 'hsbc://rm/contact', backgroundColor: '#DB0011', textColor: '#FFFFFF', sticky: true },
    DEPOSIT_RATE_TABLE: { sectionTitle: 'Time Deposit Rate:', asAtDate: '', rates: [{ term: '3 Month', rate: '—' }, { term: '6 Month', rate: '—' }, { term: '12 Month', rate: '—' }], footnote: '' },
    DEPOSIT_OPEN_CTA: { label: 'Open a Deposit', deepLink: 'hsbc://deposit/open', backgroundColor: '#C41E3A', textColor: '#FFFFFF' },
    DEPOSIT_FAQ: { sectionTitle: 'Frequently Asked Questions', items: [] },
    DEPOSIT_INSURANCE: { title: 'Deposit Insurance', logoUrl: '/media/deposit-insurance-logo.jpg', altText: 'Deposit Insurance', linkUrl: 'https://www.hsbc.com.cn/content/dam/hsbc/cn/docs/insurance/insurance-prodcut-electronic-notice.pdf' },
    JSON_LD_STRUCTURED_DATA: { schemaType: 'schema.org/WebPage', lastReviewedDate: '2026-05-17', copyrightText: '© 版权所有。汇丰银行（中国）有限公司2026', publicSecurityText: '沪公网安备 31011502400282号', publicSecurityUrl: 'https://beian.mps.gov.cn/#/query/webSearch', icpText: '沪ICP备15029387-3号', icpUrl: 'https://beian.miit.gov.cn/#/Integrated/index', jsonLd: '{}' },
    SPACER: { height: 24 },
    QUICK_ACCESS_GRID: { items: [] },
    COMBO_QUICK_ACCESS: { tabs: [], row1Items: [], row2Items: [] },
  };
  return m[t] ?? {};
}

// ─── Prop field definitions ───────────────────────────────────────────────────

type PF = { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'boolean' | 'color' | 'url' | 'select' | 'date'; placeholder?: string; options?: { value: string; label: string }[] };

const PROP_FIELDS: Record<string, PF[]> = {
  HEADER_NAV: [{ key: 'title', label: 'Title', type: 'text', placeholder: 'Page Title' }, { key: 'showNotificationBell', label: 'Show Notification Bell', type: 'boolean' }, { key: 'showQRScanner', label: 'Show QR Scanner', type: 'boolean' }],
  PREMIER_HEADER: [{ key: 'brandLabel', label: 'Brand Label', type: 'text', placeholder: 'HSBC Premier' }, { key: 'enableNotification', label: 'Show Notification', type: 'boolean' }, { key: 'enableHeadset', label: 'Show Headset', type: 'boolean' }],
  ELITE_HEADER: [{ key: 'brandLabel', label: 'Brand Label', type: 'text', placeholder: 'HSBC Elite' }, { key: 'enableNotification', label: 'Show Notification', type: 'boolean' }, { key: 'enableHeadset', label: 'Show Headset', type: 'boolean' }],
  ADVANCE_HEADER: [{ key: 'brandLabel', label: 'Brand Label', type: 'text', placeholder: 'HSBC Advance' }, { key: 'enableNotification', label: 'Show Notification', type: 'boolean' }, { key: 'enableHeadset', label: 'Show Headset', type: 'boolean' }],
  MASS_HEADER: [{ key: 'brandLabel', label: 'Brand Label', type: 'text', placeholder: 'HSBC Personal Banking' }, { key: 'enableNotification', label: 'Show Notification', type: 'boolean' }, { key: 'enableHeadset', label: 'Show Headset', type: 'boolean' }],
  HOME_SEARCH_BAR: [{ key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Search...' }, { key: 'enableSemanticSearch', label: 'Enable AI Search', type: 'boolean' }, { key: 'enableQRScan', label: 'Enable QR Scan', type: 'boolean' }, { key: 'enableChatbot', label: 'Enable Chatbot', type: 'boolean' }, { key: 'enableMessageInbox', label: 'Enable Inbox', type: 'boolean' }],
  PROMO_BANNER: [{ key: 'title', label: 'Title', type: 'text', placeholder: 'Promotion Title' }, { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Subtitle text' }, { key: 'ctaLabel', label: 'CTA Label', type: 'text', placeholder: 'Learn More' }, { key: 'ctaDeepLink', label: 'CTA Deep Link', type: 'url', placeholder: 'hsbc://...' }, { key: 'imageUrl', label: 'Image URL', type: 'url', placeholder: 'https://...' }, { key: 'backgroundColor', label: 'Background Colour', type: 'color' }],
  AD_BANNER: [{ key: 'title', label: 'Title', type: 'text', placeholder: 'Special Offer' }, { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: '' }, { key: 'dismissible', label: 'Dismissible', type: 'boolean' }],
  CAMPAIGN_HERO: [{ key: 'headline', label: 'Headline', type: 'text', placeholder: 'Campaign Headline' }, { key: 'subHeadline', label: 'Sub-headline', type: 'text', placeholder: 'Supporting copy' }, { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'Limited Time Offer' }, { key: 'accentColor', label: 'Accent Colour', type: 'color' }],
  CAMPAIGN_BENEFITS: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Key Benefits' }],
  CAMPAIGN_CTA: [{ key: 'ctaLabel', label: 'CTA Label', type: 'text', placeholder: 'Apply Now' }, { key: 'ctaSubtext', label: 'Sub-text', type: 'text', placeholder: 'Quick & easy' }, { key: 'offerBadge', label: 'Offer Badge', type: 'text', placeholder: 'First Year Fee Waived' }, { key: 'ctaUrl', label: 'CTA URL', type: 'url', placeholder: '/apply' }, { key: 'secondaryLabel', label: 'Secondary Link', type: 'text', placeholder: 'Learn More' }, { key: 'secondaryUrl', label: 'Secondary URL', type: 'url', placeholder: '/learn' }],
  SPACER: [{ key: 'height', label: 'Height (px)', type: 'number', placeholder: '24' }],
  AI_ASSISTANT: [{ key: 'greeting', label: 'Greeting Text', type: 'textarea', placeholder: 'Hi, how can I help?' }],
  FLASH_LOAN: [{ key: 'productName', label: 'Product Name', type: 'text', placeholder: 'Flash Loan' }, { key: 'maxAmount', label: 'Max Amount', type: 'text', placeholder: '500,000' }, { key: 'currency', label: 'Currency', type: 'select', options: [{ value: 'HKD', label: 'HKD' }, { value: 'SGD', label: 'SGD' }, { value: 'USD', label: 'USD' }] }, { key: 'ctaLabel', label: 'CTA Label', type: 'text', placeholder: 'Apply Now' }],
  CARD_ACTIVATION_BANNER: [{ key: 'message', label: 'Message', type: 'text', placeholder: 'Activate your card' }, { key: 'deepLink', label: 'Deep Link', type: 'url', placeholder: 'hsbc://card/activate' }],
  QUEST_BANNER: [{ key: 'title', label: 'Title', type: 'text', placeholder: 'Getting Started' }, { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Complete quests!' }, { key: 'ctaLabel', label: 'CTA Label', type: 'text', placeholder: 'Check quests' }, { key: 'ctaDeepLink', label: 'CTA Deep Link', type: 'url', placeholder: 'hsbc://quests' }, { key: 'totalQuests', label: 'Total Quests', type: 'number', placeholder: '4' }],
  CONTACT_RM_CTA: [{ key: 'label', label: 'Button Label', type: 'text', placeholder: 'Contact Your RM' }, { key: 'subLabel', label: 'Sub Label', type: 'text', placeholder: '' }, { key: 'deepLink', label: 'Deep Link', type: 'url', placeholder: 'hsbc://rm/contact' }, { key: 'backgroundColor', label: 'Background Colour', type: 'color' }, { key: 'textColor', label: 'Text Colour', type: 'color' }, { key: 'sticky', label: 'Sticky', type: 'boolean' }],
  DEPOSIT_RATE_TABLE: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Time Deposit Rate:' }, { key: 'asAtDate', label: 'As At Date', type: 'text', placeholder: '5/22/2025' }, { key: 'footnote', label: 'Footnote', type: 'textarea', placeholder: 'Minimum balance applies.' }],
  DEPOSIT_OPEN_CTA: [{ key: 'label', label: 'Button Label', type: 'text', placeholder: 'Open a Deposit' }, { key: 'deepLink', label: 'Deep Link', type: 'url', placeholder: 'hsbc://deposit/open' }, { key: 'backgroundColor', label: 'Background Colour', type: 'color' }, { key: 'textColor', label: 'Text Colour', type: 'color' }],
  DEPOSIT_FAQ: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Frequently Asked Questions' }],
  DEPOSIT_INSURANCE: [{ key: 'title', label: 'Title', type: 'text', placeholder: 'Deposit Insurance' }, { key: 'logoUrl', label: 'Logo URL', type: 'url', placeholder: '/media/deposit-insurance-logo.jpg' }, { key: 'altText', label: 'Alt Text', type: 'text', placeholder: 'Deposit Insurance' }, { key: 'linkUrl', label: 'PDF Link URL', type: 'url', placeholder: 'https://...' }],
  JSON_LD_STRUCTURED_DATA: [{ key: 'schemaType', label: 'Schema Type', type: 'text', placeholder: 'schema.org/WebPage' }, { key: 'lastReviewedDate', label: 'Last reviewed date', type: 'date', placeholder: 'YYYY-MM-DD' }, { key: 'copyrightText', label: 'Copyright', type: 'text', placeholder: '© 版权所有。汇丰银行（中国）有限公司2026' }, { key: 'publicSecurityText', label: 'Public Security Filing', type: 'text', placeholder: '沪公网安备 31011502400282号' }, { key: 'publicSecurityUrl', label: 'Public Security URL', type: 'url', placeholder: 'https://beian.mps.gov.cn/#/query/webSearch' }, { key: 'icpText', label: 'ICP Filing', type: 'text', placeholder: '沪ICP备15029387-3号' }, { key: 'icpUrl', label: 'ICP URL', type: 'url', placeholder: 'https://beian.miit.gov.cn/#/Integrated/index' }, { key: 'jsonLd', label: 'JSON-LD', type: 'textarea', placeholder: '{}' }],
  WEALTH_SELECTION: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Wealth Products' }, { key: 'moreDeepLink', label: 'More Deep Link', type: 'url', placeholder: 'hsbc://...' }],
  FEATURED_RANKINGS: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Top Funds' }, { key: 'moreDeepLink', label: 'More Deep Link', type: 'url', placeholder: 'hsbc://...' }],
  FX_WATCHLIST: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'FX Watchlist' }, { key: 'tierBadge', label: 'Tier Badge', type: 'text', placeholder: 'Gold Forex Club' }, { key: 'tierDescription', label: 'Tier Description', type: 'textarea', placeholder: '15% Spread discount.' }, { key: 'moreLabel', label: 'More Label', type: 'text', placeholder: 'View more' }, { key: 'moreDeepLink', label: 'More Deep Link', type: 'url', placeholder: 'hsbc://fx' }],
  FEATURE_PRODUCT: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Feature product' }, { key: 'activeButtonId', label: 'Default Button ID', type: 'text', placeholder: 'top-performers' }, { key: 'moreLabel', label: 'More Label', type: 'text', placeholder: 'View Best selling fund list (10)' }, { key: 'moreDeepLink', label: 'More Deep Link', type: 'url', placeholder: 'hsbc://funds/best-selling' }, { key: 'bestSellingUrl', label: 'Best Selling Data URL', type: 'url', placeholder: '/api/v1/funds/feature-products?filter=best-selling&limit=10' }],
  WEALTH_STUDIO_CAROUSEL: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Wealth Studio' }, { key: 'moreLabel', label: 'More Label', type: 'text', placeholder: 'View all' }, { key: 'moreDeepLink', label: 'More Deep Link', type: 'url', placeholder: 'hsbc://wealth-studio' }],
  GUIDES_INSIGHTS_CAROUSEL: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Guides and insights' }, { key: 'moreLabel', label: 'More Label', type: 'text', placeholder: 'View all' }, { key: 'moreDeepLink', label: 'More Deep Link', type: 'url', placeholder: 'hsbc://guides' }],
  DISCOVER_MORE_CAROUSEL: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Discover more' }],
  VIDEO_PLAYER: [{ key: 'title', label: 'Title', type: 'text', placeholder: 'Video Title' }, { key: 'presenterName', label: 'Presenter Name', type: 'text', placeholder: 'Jane Wong' }, { key: 'presenterTitle', label: 'Presenter Title', type: 'text', placeholder: 'FX Strategist' }, { key: 'autoplay', label: 'Autoplay', type: 'boolean' }, { key: 'showCaption', label: 'Show Caption', type: 'boolean' }],
  MARKET_BRIEFING_TEXT: [{ key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Key takeaways' }, { key: 'disclaimer', label: 'Disclaimer', type: 'textarea', placeholder: 'Past performance is not...' }],
  HOME_SEARCH_HEADER: [{ key: 'premierLabel', label: 'Premier Label', type: 'text', placeholder: 'HSBC Premier' }, { key: 'premierBg', label: 'Premier Color', type: 'color' }, { key: 'eliteLabel', label: 'Elite Label', type: 'text', placeholder: 'HSBC Elite' }, { key: 'eliteBg', label: 'Elite Color', type: 'color' }, { key: 'advanceLabel', label: 'Advance Label', type: 'text', placeholder: 'HSBC One' }, { key: 'advanceBg', label: 'Advance Color', type: 'color' }, { key: 'massLabel', label: 'Mass Label', type: 'text', placeholder: 'HSBC Personal Banking' }, { key: 'massBg', label: 'Mass Color', type: 'color' }, { key: 'enableNotification', label: 'Show Notification', type: 'boolean' }, { key: 'enableHeadset', label: 'Show Headset', type: 'boolean' }, { key: 'placeholder', label: 'Search Placeholder', type: 'text', placeholder: 'Search...' }, { key: 'enableSemanticSearch', label: 'Enable AI Search', type: 'boolean' }],
};

// ─── Prop field input ─────────────────────────────────────────────────────────

function PropInput({ field, value, onChange }: { field: PF; value: unknown; onChange: (v: unknown) => void }) {
  const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' };

  if (field.type === 'boolean') {
    const on = Boolean(value);
    return (
      <button onClick={() => onChange(!on)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${on ? '#059669' : '#E5E7EB'}`, background: on ? '#D1FAE5' : '#F3F4F6', color: on ? '#059669' : '#6B7280', transition: 'all 0.12s' }}>
        {on ? '✓ On' : 'Off'}
      </button>
    );
  }
  if (field.type === 'color') {
    const hex = String(value ?? '#DB0011');
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="color" value={hex} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 28, padding: 2, border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer' }} />
        <input type="text" value={hex} onChange={e => onChange(e.target.value)} style={{ ...inp, flex: 1, fontFamily: 'monospace' }} />
      </div>
    );
  }
  if (field.type === 'textarea') {
    return <textarea value={String(value ?? '')} onChange={e => onChange(e.target.value)} rows={3} placeholder={field.placeholder} style={{ ...inp, resize: 'vertical', fontFamily: 'var(--font-family)' }} />;
  }
  if (field.type === 'number') {
    return <input type="number" value={String(value ?? '')} onChange={e => onChange(Number(e.target.value))} placeholder={field.placeholder} style={inp} />;
  }
  if (field.type === 'date') {
    return <input type="date" value={String(value ?? '')} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={inp} />;
  }
  if (field.type === 'select' && field.options) {
    return (
      <select value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={{ ...inp, background: '#fff', cursor: 'pointer' }}>
        {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={inp} />;
}

type FeatureProductButton = { id: string; name: string; description: string; url: string };

function FeatureProductButtonsEditor({ buttons, onChange }: { buttons: FeatureProductButton[]; onChange: (buttons: FeatureProductButton[]) => void }) {
  const input: React.CSSProperties = { width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 11, fontFamily: 'var(--font-family)', boxSizing: 'border-box' };
  const update = (idx: number, patch: Partial<FeatureProductButton>) => onChange(buttons.map((button, i) => i === idx ? { ...button, ...patch } : button));
  const remove = (idx: number) => onChange(buttons.filter((_, i) => i !== idx));
  const add = () => onChange([...buttons, { id: `button-${buttons.length + 1}`, name: 'New button', description: '', url: '/api/v1/funds/feature-products?filter=new&limit=3' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {buttons.map((button, idx) => (
        <div key={`${button.id}-${idx}`} style={{ padding: 8, border: '1px solid #E5E7EB', borderRadius: 7, background: '#F9FAFB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>Pill button {idx + 1}</div>
            <button onClick={() => remove(idx)} style={{ border: 'none', background: 'transparent', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>Delete</button>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <input value={button.id} onChange={e => update(idx, { id: e.target.value })} placeholder="id" style={input} />
            <input value={button.name} onChange={e => update(idx, { name: e.target.value })} placeholder="Name" style={input} />
            <textarea value={button.description} onChange={e => update(idx, { description: e.target.value })} placeholder="Description" rows={2} style={{ ...input, resize: 'vertical' }} />
            <input value={button.url} onChange={e => update(idx, { url: e.target.value })} placeholder="Filter URL" style={input} />
          </div>
        </div>
      ))}
      <button onClick={add} style={{ padding: '7px 10px', border: '1px dashed #D1D5DB', borderRadius: 7, background: '#fff', color: '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add pill button</button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TemplateEditorView() {
  const { state, dispatch } = useUCP();

  if (!state.editorTemplateId) return null;
  const template = state.pageTemplates.find(t => t.templateId === state.editorTemplateId);
  if (!template) return null;

  return <TemplateEditorInner template={template} />;
}

function TemplateEditorInner({ template }: { template: PageTemplate }) {
  const { dispatch } = useUCP();

  // ── Local state ──
  const [slices, setSlices] = useState<PageTemplateStarterSlice[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'DEPRECATED'>('ACTIVE');
  const [category, setCategory] = useState<PageTemplate['category']>('generic');
  const [seoAeoCompliance, setSeoAeoCompliance] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<'props' | 'preview'>('props');
  const [paletteCat, setPaletteCat] = useState<string>('all');
  const [paletteSearch, setPaletteSearch] = useState('');
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const draggingType = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Multi-language
  const primaryLocale = (template.supportedLocales ?? ['en'])[0];
  const [activeLocale, setActiveLocale] = useState(primaryLocale);

  // Sync from template on mount/templateId change
  useEffect(() => {
    setSlices(template.starterSlices.map(s => ({ ...s, props: { ...s.props } })));
    setName(template.name);
    setIcon(template.icon);
    setDescription(template.description);
    setStatus(template.status);
    setCategory(template.category);
    setSeoAeoCompliance(template.seoAeoCompliance);
    setSelectedIdx(null);
  }, [template.templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Palette filter ──
  const paletteFiltered = PALETTE_ITEMS.filter(p => {
    if (paletteCat !== 'all' && p.category !== paletteCat) return false;
    if (paletteSearch && !p.label.toLowerCase().includes(paletteSearch.toLowerCase())) return false;
    return true;
  });

  // ── Slice mutations ──
  function addSlice(sliceType: string) {
    const newSlice: PageTemplateStarterSlice = { type: sliceType as PageTemplateStarterSlice['type'], props: defaultPropsFor(sliceType), locked: false };
    setSlices(prev => [...prev, newSlice]);
    setSelectedIdx(slices.length);
    setRightTab('props');
  }

  function removeSlice(idx: number) {
    setSlices(prev => prev.filter((_, i) => i !== idx));
    setSelectedIdx(prev => prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev);
  }

  function moveSlice(from: number, to: number) {
    if (to < 0 || to >= slices.length) return;
    const next = [...slices];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSlices(next);
    setSelectedIdx(to);
  }

  function toggleLock(idx: number) {
    setSlices(prev => prev.map((s, i) => i === idx ? { ...s, locked: !s.locked } : s));
  }

  function updateProp(idx: number, key: string, value: unknown) {
    setSlices(prev => prev.map((s, i) => i === idx ? { ...s, props: { ...s.props, [key]: value } } : s));
  }

  // ── SEO/AEO compliance toggle ──
  const SEO_SLICE_TYPES = ['SEO_HERO_HEADER', 'SEO_FAQ', 'SEO_STRUCTURED_DATA'] as const;
  function toggleSeoAeo(enabled: boolean) {
    setSeoAeoCompliance(enabled);
    if (enabled) {
      setSlices(prev => {
        const existing = new Set(prev.map(s => s.type));
        const toAdd: PageTemplateStarterSlice[] = [];
        if (!existing.has('SEO_HERO_HEADER')) toAdd.push({ type: 'SEO_HERO_HEADER', props: { h1Title: 'Page Title — clear & keyword-rich', valueProp: 'One sentence that summarises the page value for users and search engines.', breadcrumb: '' }, locked: true });
        if (!existing.has('SEO_FAQ')) toAdd.push({ type: 'SEO_FAQ', props: { sectionTitle: 'Frequently Asked Questions', items: [{ q: 'Question 1', a: 'Answer 1' }, { q: 'Question 2', a: 'Answer 2' }, { q: 'Question 3', a: 'Answer 3' }] }, locked: true });
        if (!existing.has('SEO_STRUCTURED_DATA')) toAdd.push({ type: 'SEO_STRUCTURED_DATA', props: { schemaType: 'schema.org/WebPage', jsonLd: '{}' }, locked: true });
        // Insert SEO_HERO_HEADER after first nav slice (index 0 or 1), FAQ + structured data at end
        const heroIdx = toAdd.findIndex(s => s.type === 'SEO_HERO_HEADER');
        const rest = toAdd.filter(s => s.type !== 'SEO_HERO_HEADER');
        const insertAt = prev.findIndex(s => s.type === 'HEADER_NAV' || s.type === 'HOME_SEARCH_HEADER') + 1;
        const next = [...prev];
        if (heroIdx >= 0) next.splice(insertAt, 0, toAdd[heroIdx]);
        return [...next, ...rest];
      });
    } else {
      setSlices(prev => prev.filter(s => !(SEO_SLICE_TYPES as readonly string[]).includes(s.type)));
    }
  }

  // ── Save ──
  function handleSave() {
    dispatch({ type: 'UPDATE_TEMPLATE', templateId: template.templateId, updates: { name, icon, description, status, category, seoAeoCompliance, starterSlices: slices } });
    dispatch({ type: 'CLOSE_TEMPLATE_EDITOR' });
    dispatch({ type: 'SHOW_TOAST', message: `Template "${name}" saved`, toastType: 'success' });
  }

  const selectedSlice = selectedIdx !== null ? slices[selectedIdx] : null;
  const fields = selectedSlice ? (PROP_FIELDS[selectedSlice.type] ?? []) : [];

  const inp: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-family)', background: '#F3F4F6' }}>

      {/* ── Toolbar ── */}
      <div style={{ height: 52, background: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => dispatch({ type: 'CLOSE_TEMPLATE_EDITOR' })} aria-label="Exit template editor" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
          ← Back
        </button>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)' }} />
        <span style={{ fontSize: 22, lineHeight: 1 }}>{icon || template.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || template.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Page Template Editor · UCP</div>
        </div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: status === 'ACTIVE' ? 'rgba(5,150,105,0.2)' : 'rgba(156,163,175,0.2)', color: status === 'ACTIVE' ? '#34D399' : '#9CA3AF', fontWeight: 700 }}>
          {status}
        </span>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#D1D5DB', fontWeight: 700 }}>
          {slices.length} slice{slices.length !== 1 ? 's' : ''}
        </span>
        <button onClick={handleSave} style={{ padding: '8px 20px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          Save Changes
        </button>
      </div>

      {/* ── 3-pane body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Slice palette */}
        <div style={{ width: 240, flexShrink: 0, background: 'var(--surface-panel, #fff)', borderRight: '1px solid var(--border-light, #E5E7EB)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--border-light, #E5E7EB)', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Slice Library · From UCP</div>
            <input value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} placeholder="Search components..." style={{ width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <button onClick={() => setPaletteCat('all')} style={{ padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: paletteCat === 'all' ? '#1A1A1A' : '#F3F4F6', color: paletteCat === 'all' ? '#fff' : '#374151', border: paletteCat === 'all' ? '1px solid #1A1A1A' : '1px solid #E5E7EB' }}>All</button>
              {PALETTE_CATS.map(c => (
                <button key={c.id} onClick={() => setPaletteCat(c.id)} title={c.label} style={{ padding: '3px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer', background: paletteCat === c.id ? CATEGORY_COLORS[c.id] : '#F3F4F6', color: paletteCat === c.id ? '#fff' : '#374151', border: paletteCat === c.id ? `1px solid ${CATEGORY_COLORS[c.id]}` : '1px solid #E5E7EB', fontWeight: 600 }}>
                  {c.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Palette list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            {paletteFiltered.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, padding: 16 }}>No components</div>}
            {paletteFiltered.map(comp => {
              const alreadyAdded = !!comp.singleton && slices.some(s => s.type === comp.sliceType);
              const col = CATEGORY_COLORS[comp.category] ?? '#6B7280';
              return (
                <div
                  key={comp.sliceType}
                  draggable={!alreadyAdded}
                  onDragStart={() => { draggingType.current = comp.sliceType; }}
                  onDragEnd={() => { draggingType.current = null; }}
                  onClick={() => { if (!alreadyAdded) addSlice(comp.sliceType); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', marginBottom: 4, borderRadius: 8, border: '1px solid #E5E7EB', background: alreadyAdded ? '#F9FAFB' : '#fff', cursor: alreadyAdded ? 'not-allowed' : 'grab', opacity: alreadyAdded ? 0.45 : 1, transition: 'all 0.1s', borderLeft: `3px solid ${col}` }}
                  onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLDivElement).style.borderColor = col; }}
                  onMouseLeave={e => { if (!alreadyAdded) (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLDivElement).style.borderLeftColor = col; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{comp.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: alreadyAdded ? '#9CA3AF' : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp.label}</div>
                    {comp.singleton && <div style={{ fontSize: 8, color: '#9CA3AF' }}>Singleton</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '7px 10px', borderTop: '1px solid var(--border-light, #E5E7EB)', fontSize: 10, color: '#9CA3AF', textAlign: 'center', flexShrink: 0 }}>
            Click or drag to add · {PALETTE_ITEMS.length} components
          </div>
        </div>

        {/* CENTER: Canvas */}
        <div
          ref={canvasRef}
          style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#E5E7EB' }}
          onDragOver={e => { e.preventDefault(); setDragOverIdx(slices.length); }}
          onDrop={e => {
            e.preventDefault();
            const t = draggingType.current;
            if (t) addSlice(t);
            draggingType.current = null;
            setDragOverIdx(null);
          }}
          onDragLeave={() => setDragOverIdx(null)}
          onClick={() => setSelectedIdx(null)}
        >
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            {/* Canvas header */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{icon || template.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{name || template.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{template.channels.join(' · ')} · {slices.length} starter slice{slices.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {slices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 30px', border: '2px dashed #D1D5DB', borderRadius: 12, background: '#fff', color: '#9CA3AF' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No starter slices yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click or drag components from the left panel to add them</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {slices.map((slice, idx) => {
                  const selected = selectedIdx === idx;
                  const cat = catForType(slice.type);
                  const col = CATEGORY_COLORS[cat] ?? '#6B7280';
                  return (
                    <div
                      key={idx}
                      onClick={e => { e.stopPropagation(); setSelectedIdx(idx); setRightTab('props'); }}
                      style={{ background: '#fff', borderRadius: 10, border: `2px solid ${selected ? '#DB0011' : '#E5E7EB'}`, boxShadow: selected ? '0 0 0 3px rgba(219,0,17,0.1)' : '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.12s', position: 'relative' }}
                    >
                      {/* Left category stripe */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: col }} />

                      {/* Slice visual preview */}
                      <div style={{ marginLeft: 3 }}>
                        <SliceBlockPreview slice={slice} />
                      </div>

                      {/* Controls bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 13px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slice.type}</span>
                        {slice.locked && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E', fontWeight: 700, flexShrink: 0 }}>🔒 LOCKED</span>}
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          {[
                            { icon: '↑', title: 'Move up', action: () => moveSlice(idx, idx - 1), disabled: idx === 0 },
                            { icon: '↓', title: 'Move down', action: () => moveSlice(idx, idx + 1), disabled: idx === slices.length - 1 },
                            { icon: slice.locked ? '🔓' : '🔒', title: slice.locked ? 'Unlock' : 'Lock', action: () => toggleLock(idx), disabled: false },
                            { icon: '🗑', title: 'Remove', action: () => removeSlice(idx), disabled: false },
                          ].map(btn => (
                            <button key={btn.icon} title={btn.title} onClick={btn.action} disabled={btn.disabled} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', cursor: btn.disabled ? 'not-allowed' : 'pointer', fontSize: 11, opacity: btn.disabled ? 0.35 : 1, color: btn.icon === '🗑' ? '#DC2626' : '#374151' }}>
                              {btn.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Drop target at end when dragging */}
            {dragOverIdx !== null && (
              <div style={{ marginTop: 8, height: 40, border: '2px dashed #DB0011', borderRadius: 8, background: 'rgba(219,0,17,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: '#DB0011', fontWeight: 600 }}>Drop here to add</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Metadata + Props/Preview */}
        <div style={{ width: 300, flexShrink: 0, background: 'var(--surface-panel, #fff)', borderLeft: '1px solid var(--border-light, #E5E7EB)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Metadata section */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', flexShrink: 0, background: '#FAFAFA' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Template Settings</div>

            {/* Language selector */}
            <div style={{ marginBottom: 10, padding: '6px 8px', background: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#4338CA', marginBottom: 5 }}>Languages</div>
              <LanguageSelector
                primaryLocale={primaryLocale}
                supportedLocales={template.supportedLocales ?? [primaryLocale]}
                activeLocale={activeLocale}
                onSelectLocale={l => setActiveLocale(l)}
                onAddLocale={locale => {
                  dispatch({ type: 'SET_TEMPLATE_LOCALES', templateId: template.templateId, locales: [...(template.supportedLocales ?? [primaryLocale]), locale] });
                  setActiveLocale(locale);
                }}
                onRemoveLocale={locale => {
                  dispatch({ type: 'SET_TEMPLATE_LOCALES', templateId: template.templateId, locales: (template.supportedLocales ?? [primaryLocale]).filter(l => l !== locale) });
                  if (activeLocale === locale) setActiveLocale(primaryLocale);
                }}
                size="sm"
              />
            </div>

            {activeLocale !== primaryLocale ? (
              // Secondary locale copy editing mode
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, padding: '8px 10px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', flex: 1 }}>🌐 Editing {activeLocale} copy</div>
                  <button
                    onClick={() => dispatch({ type: 'TRANSLATE_TEMPLATE', templateId: template.templateId, locale: activeLocale })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', background: '#DB0011', color: '#fff',
                      border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-family)',
                    }}
                  >
                    🌐 Translate
                  </button>
                </div>
                <div>
                  <label htmlFor="tmpl-trans-name" style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 3 }}>Name</label>
                  <input id="tmpl-trans-name" value={template.translations?.[activeLocale]?.name ?? ''}
                    onChange={e => dispatch({ type: 'SET_TEMPLATE_TRANSLATION', templateId: template.templateId, locale: activeLocale, field: 'name', value: e.target.value })}
                    placeholder={template.name} style={{ ...inp, fontSize: 12 }} />
                </div>
                <div>
                  <label htmlFor="tmpl-trans-desc" style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 3 }}>Description</label>
                  <textarea id="tmpl-trans-desc" value={template.translations?.[activeLocale]?.description ?? ''}
                    onChange={e => dispatch({ type: 'SET_TEMPLATE_TRANSLATION', templateId: template.templateId, locale: activeLocale, field: 'description', value: e.target.value })}
                    placeholder={template.description} rows={2} style={{ ...inp, resize: 'vertical', fontFamily: 'var(--font-family)', fontSize: 11 }} />
                </div>
              </div>
            ) : (
              <>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Icon</div>
                <input value={icon} onChange={e => setIcon(e.target.value)} style={{ width: '100%', padding: '5px 4px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 18, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Name</div>
                <input value={name} onChange={e => setName(e.target.value)} style={{ ...inp, fontSize: 12 }} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Description</div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical', fontFamily: 'var(--font-family)', fontSize: 11 }} />
            </div>
              </>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Category</div>
                <select value={category} onChange={e => setCategory(e.target.value as PageTemplate['category'])} style={{ ...inp, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
                  {(['generic','campaign','product','insight','journey'] as const).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Status</div>
                <select value={status} onChange={e => setStatus(e.target.value as 'ACTIVE'|'DEPRECATED')} style={{ ...inp, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
                  <option value="ACTIVE">Active</option>
                  <option value="DEPRECATED">Deprecated</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => toggleSeoAeo(!seoAeoCompliance)} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${seoAeoCompliance ? '#4F46E5' : '#E5E7EB'}`, background: seoAeoCompliance ? '#EEF2FF' : '#F9FAFB', color: seoAeoCompliance ? '#4F46E5' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{seoAeoCompliance ? '✓' : '○'}</span>
                SEO / AEO Compliant
              </button>
              {seoAeoCompliance && (
                <div style={{ fontSize: 9, color: '#6B7280', background: '#F5F3FF', borderRadius: 5, padding: '5px 7px', lineHeight: 1.5 }}>
                  Adds 3 locked slices: <b>SEO Hero Header</b> (H1 + value prop), <b>SEO/AEO FAQ</b> (schema.org/FAQPage markup), and <b>Structured Data</b> (JSON-LD injected into &lt;head&gt;).
                </div>
              )}
            </div>
          </div>

          {/* Props / Preview tabs */}
          <div role="tablist" aria-label="Template right panel tabs" style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
            {(['props', 'preview'] as const).map(tab => (
              <button key={tab} role="tab" aria-selected={rightTab === tab} onClick={() => setRightTab(tab)} style={{ flex: 1, padding: '8px 4px', border: 'none', background: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: rightTab === tab ? '#DB0011' : '#6B7280', borderBottom: rightTab === tab ? '2px solid #DB0011' : '2px solid transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 14 }} aria-hidden="true">{tab === 'props' ? '⚙️' : '👁'}</span>
                {tab === 'props' ? 'Properties' : 'Preview'}
              </button>
            ))}
          </div>

          {/* Props tab */}
          {rightTab === 'props' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              {selectedSlice === null ? (
                <div style={{ textAlign: 'center', paddingTop: 40, color: '#9CA3AF' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Select a slice to edit</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Click any slice in the canvas to configure its properties</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '8px 10px', background: '#F9FAFB', borderRadius: 7, marginBottom: 12, border: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{labelForType(selectedSlice.type)}</div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#9CA3AF' }}>{selectedSlice.type}</div>
                  </div>
                  {fields.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, padding: '20px 0' }}>No editable properties for this slice type.</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {fields.map(f => (
                      <div key={f.key}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{f.label}</div>
                        <PropInput field={f} value={(selectedSlice.props as Record<string, unknown>)[f.key]} onChange={v => { if (selectedIdx !== null) updateProp(selectedIdx, f.key, v); }} />
                      </div>
                    ))}
                  </div>
                  {selectedSlice.type === 'FEATURE_PRODUCT' && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Pill Buttons</div>
                      <FeatureProductButtonsEditor
                        buttons={Array.isArray((selectedSlice.props as Record<string, unknown>).buttons) ? (selectedSlice.props as Record<string, unknown>).buttons as FeatureProductButton[] : []}
                        onChange={buttons => { if (selectedIdx !== null) updateProp(selectedIdx, 'buttons', buttons); }}
                      />
                    </div>
                  )}
                  {/* Locked toggle */}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Locked</div>
                    <button onClick={() => { if (selectedIdx !== null) toggleLock(selectedIdx); }} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${selectedSlice.locked ? '#D97706' : '#E5E7EB'}`, background: selectedSlice.locked ? '#FEF3C7' : '#F9FAFB', color: selectedSlice.locked ? '#92400E' : '#6B7280' }}>
                      {selectedSlice.locked ? '🔒 Locked — authors cannot remove this slice' : '🔓 Unlocked — authors can remove this slice'}
                    </button>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 5 }}>Locked slices appear in every new page created from this template and cannot be removed by authors.</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Preview tab */}
          {rightTab === 'preview' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', background: '#F3F4F6' }}>
              <TemplateDevicePreview slices={slices} channels={template.channels} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
