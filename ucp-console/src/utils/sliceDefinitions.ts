import { SliceDefinition, SliceType } from '../types/ucp';

export const SLICE_DEFINITIONS: Partial<Record<SliceType, SliceDefinition>> = {
  // ── Home Hub combined header ─────────────────────────────────────────────────
  HOME_SEARCH_HEADER: {
    type: 'HOME_SEARCH_HEADER', label: 'Home Search Header (All Segments)', category: 'navigation', icon: '🏠🔍',
    description: 'Segment-adaptive header (red/jade/orange/silver) with integrated AI semantic search bar',
    configurable: ['premierLabel', 'eliteLabel', 'advanceLabel', 'massLabel', 'enableNotification', 'enableHeadset', 'placeholder', 'enableSemanticSearch', 'enableQRScan', 'enableChatbot', 'enableMessageInbox', 'searchApiEndpoint'],
    minHeight: 104, singleton: true,
  },
  COMBO_QUICK_ACCESS: {
    type: 'COMBO_QUICK_ACCESS', label: 'Quick Access + Tab Bar (Combo)', category: 'navigation', icon: '⚡',
    description: 'Combined single card: tab bar (My pick/Invest/Global/HK Daily) + function entry point rows with group assignment and reordering',
    configurable: ['tabs', 'row1Items', 'row2Items'], minHeight: 130, singleton: true,
  },
  // ── Standard components ─────────────────────────────────────────────────────
  HEADER_NAV: {
    type: 'HEADER_NAV', label: 'Header Navigation', category: 'navigation', icon: '🔝',
    description: 'Top bar with search, notification bell, QR scanner',
    configurable: ['title', 'searchPlaceholder', 'showNotificationBell', 'showQRScanner'], minHeight: 60, singleton: true,
  },
  QUICK_ACCESS: {
    type: 'QUICK_ACCESS', label: 'Quick Access Buttons', category: 'function', icon: '⚡',
    description: 'Row of primary product shortcuts (e.g. 朝朝宝, 借钱, 转账)',
    configurable: ['items'], minHeight: 80, singleton: true,
  },
  FUNCTION_GRID: {
    type: 'FUNCTION_GRID', label: 'Function Grid', category: 'function', icon: '⊞',
    description: 'Grid of function entry points with configurable columns, rows and labels',
    configurable: ['gridColumns', 'maxRows', 'showLabels', 'rows'], minHeight: 80,
  },
  PROMO_BANNER: {
    type: 'PROMO_BANNER', label: 'Promo Banner', category: 'promotion', icon: '🎪',
    description: 'Full-width campaign banner with image, title, CTA',
    configurable: ['title', 'subtitle', 'ctaLabel', 'ctaDeepLink', 'imageUrl', 'backgroundColor', 'badgeText'], minHeight: 120,
  },
  AI_ASSISTANT: {
    type: 'AI_ASSISTANT', label: 'AI Assistant Entry', category: 'function', icon: '🤖',
    description: 'Intelligent wealth assistant greeting bar',
    configurable: ['greeting'], minHeight: 44,
  },
  CARD_ACTIVATION_BANNER: {
    type: 'CARD_ACTIVATION_BANNER', label: 'Card Activation Banner', category: 'promotion', icon: '🔔',
    description: 'Notification prompting the customer to activate their card',
    configurable: ['message', 'deepLink'], minHeight: 44,
  },
  QUEST_BANNER: {
    type: 'QUEST_BANNER', label: 'Quest / Getting Started Banner', category: 'promotion', icon: '🎯',
    description: 'Getting-started quest progress card with HSBC hexagon icon',
    configurable: ['title', 'description', 'ctaLabel', 'ctaDeepLink', 'totalQuests'], minHeight: 80,
  },
  FEATURE_PRODUCT: {
    type: 'FEATURE_PRODUCT', label: 'Feature Product (Fund List)', category: 'wealth', icon: '📊',
    description: 'Tabbed fund list showing 1Y returns — Top performers / Top dividend…',
    configurable: ['sectionTitle', 'tabs', 'activeTab', 'funds', 'moreLabel', 'moreDeepLink'], minHeight: 200,
  },
  WEALTH_STUDIO_CAROUSEL: {
    type: 'WEALTH_STUDIO_CAROUSEL', label: 'Wealth Studio Carousel', category: 'wealth', icon: '🎬',
    description: 'Premier Elite Wealth Studio horizontal video episode carousel',
    configurable: ['sectionTitle', 'items', 'moreLabel', 'moreDeepLink'], minHeight: 160,
  },
  GUIDES_INSIGHTS_CAROUSEL: {
    type: 'GUIDES_INSIGHTS_CAROUSEL', label: 'Guides & Insights', category: 'insight', icon: '📰',
    description: 'Article card carousel — investment guides and market insights',
    configurable: ['sectionTitle', 'items', 'moreLabel', 'moreDeepLink'], minHeight: 160,
  },
  FX_WATCHLIST: {
    type: 'FX_WATCHLIST', label: 'FX Watchlist', category: 'wealth', icon: '💱',
    description: 'Currency pair watchlist with Gold Forex Club tier badge and live rates',
    configurable: ['sectionTitle', 'tierBadge', 'tierDescription', 'pairs', 'moreLabel', 'moreDeepLink'], minHeight: 200,
  },
  DISCOVER_MORE_CAROUSEL: {
    type: 'DISCOVER_MORE_CAROUSEL', label: 'Discover More', category: 'promotion', icon: '🔎',
    description: 'Horizontal campaign card carousel — product promotions and lifestyle offers',
    configurable: ['sectionTitle', 'items'], minHeight: 160,
  },
  WEALTH_SELECTION: {
    type: 'WEALTH_SELECTION', label: 'Wealth Selection', category: 'wealth', icon: '💰',
    description: 'Featured wealth products (7-day yield, risk level)',
    configurable: ['sectionTitle', 'products', 'moreDeepLink'], minHeight: 280,
  },
  SPACER: {
    type: 'SPACER', label: 'Spacer', category: 'layout', icon: '↕️',
    description: 'Vertical spacing element',
    configurable: ['height'], minHeight: 16,
  },
  MARKET_BRIEFING_TEXT: {
    type: 'MARKET_BRIEFING_TEXT', label: 'Market Briefing Text', category: 'insight', icon: '📋',
    description: 'Bullet-point market briefing sourced from a UCP content entry',
    configurable: ['ucpContentId', 'sectionTitle', 'bulletPoints', 'disclaimer'], minHeight: 200,
  },
  VIDEO_PLAYER: {
    type: 'VIDEO_PLAYER', label: 'Video Player', category: 'insight', icon: '🎬',
    description: 'Inline video player linked to a UCP content asset (video)',
    configurable: ['ucpAssetId', 'title', 'presenterName', 'presenterTitle', 'autoplay', 'showCaption'], minHeight: 180,
  },
  CONTACT_RM_CTA: {
    type: 'CONTACT_RM_CTA', label: 'Contact Your RM', category: 'insight', icon: '📞',
    description: 'Sticky CTA routing customer to Relationship Manager finder',
    configurable: ['label', 'subLabel', 'deepLink', 'backgroundColor', 'textColor', 'sticky'], minHeight: 56, singleton: true,
  },
  DEPOSIT_RATE_TABLE: {
    type: 'DEPOSIT_RATE_TABLE', label: 'Deposit Rate Table', category: 'wealth', icon: '🏦',
    description: 'Time deposit interest rate table — term and rate columns only',
    configurable: ['sectionTitle', 'asAtDate', 'rates', 'footnote'], minHeight: 220,
  },
  DEPOSIT_OPEN_CTA: {
    type: 'DEPOSIT_OPEN_CTA', label: 'Button CTA', category: 'wealth', icon: '🏧',
    description: 'Full-width "Open a Deposit" CTA button for deposit campaigns',
    configurable: ['label', 'deepLink', 'backgroundColor', 'textColor'], minHeight: 56,
  },
  DEPOSIT_FAQ: {
    type: 'DEPOSIT_FAQ', label: 'General FAQ', category: 'wealth', icon: '❓',
    description: 'Collapsible FAQ accordion for deposit products — question/answer pairs',
    configurable: ['sectionTitle', 'items'], minHeight: 200,
  },
  // ── SEO / AEO compliance slices (auto-injected, locked) ──────────────────────
  SEO_HERO_HEADER: {
    type: 'SEO_HERO_HEADER', label: 'SEO Hero Header', category: 'navigation', icon: '🔍',
    description: 'H1 headline + one-sentence value proposition required for SEO/AEO compliance. Must appear near the top of every compliant page.',
    configurable: ['h1Title', 'valueProp', 'breadcrumb'], minHeight: 80, singleton: true,
  },
  SEO_FAQ: {
    type: 'SEO_FAQ', label: 'SEO/AEO FAQ', category: 'insight', icon: '❓',
    description: 'Structured FAQ section that renders as schema.org FAQPage markup, satisfying AEO (AI/answer engine) discovery requirements.',
    configurable: ['sectionTitle', 'items'], minHeight: 200, singleton: true,
  },
  SEO_STRUCTURED_DATA: {
    type: 'SEO_STRUCTURED_DATA', label: 'Structured Data (JSON-LD)', category: 'layout', icon: '🗂️',
    description: 'Invisible schema.org JSON-LD block injected into <head>. Required for rich results and AEO eligibility. Rendered as a hidden marker in the canvas.',
    configurable: ['schemaType', 'jsonLd'], minHeight: 32, singleton: true,
  },
};

export const SLICE_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'navigation', label: 'Navigation',  icon: '🔝' },
  { id: 'promotion',  label: 'Promotions',  icon: '🎪' },
  { id: 'function',   label: 'Functions',   icon: '⚡' },
  { id: 'wealth',     label: 'Wealth',      icon: '💰' },
  { id: 'lifestyle',  label: 'Lifestyle',   icon: '🛍️' },
  { id: 'layout',     label: 'Layout',      icon: '📐' },
  { id: 'insight',    label: 'Insight',     icon: '📈' },
  { id: 'grid',       label: 'Grid',        icon: '⊞' },
];
