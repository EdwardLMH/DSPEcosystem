import type {
  Market, ReleaseTarget, BizLine, AdGroup, ApprovalFlow,
  WeChatServiceAccount, WeChatMessageTemplate,
  PageLayout, WorkflowEntry, AuditEntry, StaffUser,
  PageMarketStatus, AEOScore, PageUsageStat, JourneyUsageStat, VisibilityRule,
  PageTemplate, CustomerSegmentDef, AccountTypeDef, LocationDef,
} from '../types/ocdp';

// ─── Reference data ───────────────────────────────────────────────────────────

export const MARKETS: Market[] = [
  { marketId: 'GLOBAL', marketName: 'Global (.com)',           active: true,  timezone: 'UTC',            tzLabel: 'UTC (UTC+0)',        defaultAuthorGroupId: 'GLOBAL-WEALTH-AD',  defaultApproverGroupId: 'GLOBAL-ADMIN-GRP' },
  { marketId: 'HK',     marketName: 'Hong Kong (.com.hk)',     active: true,  timezone: 'Asia/Hong_Kong', tzLabel: 'HKT (UTC+8)',        defaultAuthorGroupId: 'HK-WEALTH-AD',      defaultApproverGroupId: 'HK-ADMIN-GRP' },
  { marketId: 'SG',     marketName: 'Singapore (.com.sg)',     active: true,  timezone: 'Asia/Singapore', tzLabel: 'SGT (UTC+8)',        defaultAuthorGroupId: 'SG-WEALTH-AD',      defaultApproverGroupId: undefined },
  { marketId: 'UK',     marketName: 'United Kingdom (.co.uk)', active: true,  timezone: 'Europe/London',  tzLabel: 'BST/GMT (UTC+0/+1)', defaultAuthorGroupId: undefined,           defaultApproverGroupId: undefined },
  { marketId: 'IN',     marketName: 'India (bank.in)',         active: true,  timezone: 'Asia/Kolkata',   tzLabel: 'IST (UTC+5:30)',     defaultAuthorGroupId: undefined,           defaultApproverGroupId: undefined },
  { marketId: 'CN',     marketName: 'China (WeChat)',          active: true,  timezone: 'Asia/Shanghai',  tzLabel: 'CST (UTC+8)',        defaultAuthorGroupId: undefined,           defaultApproverGroupId: undefined },
];

export const RELEASE_TARGETS: ReleaseTarget[] = [
  { targetId: 'GLOBAL', displayName: 'Global (.com)',           domainSuffix: '.com',    isGlobal: true,  active: true },
  { targetId: 'HK',     displayName: 'Hong Kong (.com.hk)',     domainSuffix: '.com.hk', isGlobal: false, active: true },
  { targetId: 'SG',     displayName: 'Singapore (.com.sg)',     domainSuffix: '.com.sg', isGlobal: false, active: true },
  { targetId: 'UK',     displayName: 'United Kingdom (.co.uk)', domainSuffix: '.co.uk',  isGlobal: false, active: true },
  { targetId: 'IN',     displayName: 'India (bank.in)',         domainSuffix: 'bank.in', isGlobal: false, active: true },
];

export const BIZ_LINES: BizLine[] = [
  { bizLineId: 'PAYMENT',     displayName: 'Payment & Cards',       description: 'Credit card, transaction pages',         active: true },
  { bizLineId: 'WEB_ENABLER', displayName: 'Web Enablement',        description: 'Core web infrastructure, navigation',    active: true },
  { bizLineId: 'LENDING',     displayName: 'Lending & Mortgage',    description: 'Loan, mortgage, overdraft pages',         active: true },
  { bizLineId: 'COLLECTION',  displayName: 'Collections',           description: 'Debt management, repayment pages',        active: true },
  { bizLineId: 'WEALTH',      displayName: 'Wealth & Investments',  description: 'Premier, Jade, investment pages',         active: true },
  { bizLineId: 'MARKETING',   displayName: 'Marketing & Campaigns', description: 'Campaign pages, promotional banners',     active: true },
];

export const AD_GROUPS: AdGroup[] = [
  { groupId: 'HK-WEALTH-AD',        groupName: 'HK Wealth AD Group',          marketId: 'HK',     bizLineId: 'WEALTH',   groupType: 'AD_GROUP' },
  { groupId: 'HK-PAYMENT-AD',       groupName: 'HK Payment AD Group',         marketId: 'HK',     bizLineId: 'PAYMENT',  groupType: 'AD_GROUP' },
  { groupId: 'HK-MARKETING-AD',     groupName: 'HK Marketing AD Group',       marketId: 'HK',     bizLineId: 'MARKETING', groupType: 'AD_GROUP' },
  { groupId: 'SG-WEALTH-AD',        groupName: 'SG Wealth AD Group',          marketId: 'SG',     bizLineId: 'WEALTH',   groupType: 'AD_GROUP' },
  { groupId: 'GLOBAL-WEALTH-AD',    groupName: 'Global Wealth AD Group',      marketId: 'GLOBAL', bizLineId: 'WEALTH',   groupType: 'AD_GROUP' },
  { groupId: 'HK-ADMIN-GRP',        groupName: 'HK Admin Group',              marketId: 'HK',     bizLineId: 'WEALTH',   groupType: 'ADMIN_GROUP' },
  { groupId: 'GLOBAL-ADMIN-GRP',    groupName: 'Global Admin Group',          marketId: 'GLOBAL', bizLineId: 'WEALTH',   groupType: 'ADMIN_GROUP' },
  { groupId: 'HK-AUDIT-GRP',        groupName: 'HK Audit Group',              marketId: 'HK',     bizLineId: 'WEALTH',   groupType: 'AUDIT_GROUP' },
  { groupId: 'GLOBAL-AUDIT-GRP',    groupName: 'Global Audit Group',          marketId: 'GLOBAL', bizLineId: 'WEALTH',   groupType: 'AUDIT_GROUP' },
  { groupId: 'MOBILE-WEB-ENABLER-AD', groupName: 'Mobile & Web Enabler',      marketId: 'GLOBAL', bizLineId: 'WEB_ENABLER', groupType: 'AD_GROUP' },
];

export const APPROVAL_FLOWS: ApprovalFlow[] = [
  {
    flowId: 'flow-hk-1step',  flowName: 'HK Standard 1-Step', marketId: 'HK', bizLineId: null,
    minApprovers: 1, samePersionRestriction: false,
    steps: [{ stepOrder: 1, approverGroupId: 'HK-WEALTH-AD', approverGroupName: 'HK Wealth AD Group' }],
  },
  {
    flowId: 'flow-hk-2step',  flowName: 'HK Dual Approval',   marketId: 'HK', bizLineId: null,
    minApprovers: 2, samePersionRestriction: true,
    steps: [
      { stepOrder: 1, approverGroupId: 'HK-WEALTH-AD', approverGroupName: 'HK Wealth AD Group' },
      { stepOrder: 2, approverGroupId: 'HK-WEALTH-AD', approverGroupName: 'HK Wealth AD Group' },
    ],
  },
  {
    flowId: 'flow-sg-1step',  flowName: 'SG Standard',        marketId: 'SG', bizLineId: null,
    minApprovers: 1, samePersionRestriction: false,
    steps: [{ stepOrder: 1, approverGroupId: 'SG-WEALTH-AD', approverGroupName: 'SG Wealth AD Group' }],
  },
  {
    flowId: 'flow-global',    flowName: 'Global Standard',    marketId: 'GLOBAL', bizLineId: null,
    minApprovers: 1, samePersionRestriction: false,
    steps: [{ stepOrder: 1, approverGroupId: 'GLOBAL-WEALTH-AD', approverGroupName: 'Global Wealth AD Group' }],
  },
];

export const WECHAT_ACCOUNTS: WeChatServiceAccount[] = [
  {
    accountId: 'wxa-hk-wealth', displayName: 'HSBC HK Wealth SA', wechatName: '汇丰財富',
    appid: 'wx_hk_wealth_001', accountType: 'SERVICE_ACCOUNT', verified: true,
    followerCount: 320000, primaryMarketId: 'HK', scope: 'MARKET', active: true,
    assignedMarkets: [{ marketId: 'HK', marketName: 'Hong Kong', isDefault: true }],
  },
  {
    accountId: 'wxa-hk-retail', displayName: 'HSBC HK Retail SA', wechatName: '汇丰銀行HK',
    appid: 'wx_hk_retail_002', accountType: 'SERVICE_ACCOUNT', verified: true,
    followerCount: 920000, primaryMarketId: 'HK', scope: 'MARKET', active: true,
    assignedMarkets: [{ marketId: 'HK', marketName: 'Hong Kong', isDefault: false }],
  },
];

export const WECHAT_TEMPLATES: WeChatMessageTemplate[] = [
  {
    templateId: 'tpl-promo-invite', accountId: 'wxa-hk-wealth',
    wechatTemplateId: 'T_0000001234', templateName: 'HSBC Promo Invitation v2',
    fields: [
      { key: 'title',  label: '標題',    type: 'text' },
      { key: 'amount', label: '申請資格', type: 'text' },
      { key: 'date',   label: '截止日期', type: 'date' },
      { key: 'remark', label: '備註',    type: 'text' },
    ],
    bizLineScope: ['WEALTH'], active: true,
  },
];

// ─── Mock pages (sourced from UCP) ───────────────────────────────────────────

export const PAGE_HOME_WEALTH: PageLayout = {
  pageId: 'home-wealth-hk', name: 'Home Hub (HK)',
  pageType: 'WEALTH_HUB', description: 'Main wealth hub home page for HK market',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'zh-TW', thumbnail: '💰', tags: ['wealth', 'home', 'hk'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
  supportedLocales: ['zh-TW', 'en'],
  translations: {},
  slices: [
    {
      instanceId: 'slice-header', type: 'HOME_SEARCH_HEADER', visible: true, locked: true,
      props: {
        // Per-segment brand config
        premierLabel:  'HSBC Premier',  premierBg: '#DB0011',
        eliteLabel:    'HSBC Elite',    eliteBg:   '#0D5C3A',
        advanceLabel:  'HSBC One',      advanceBg: '#D4580A',
        massLabel:     'HSBC Personal Banking', massBg: '#4B5563',
        enableNotification: true,
        enableHeadset: true,
        // AI search bar
        placeholder: 'Search functions, products & content',
        enableSemanticSearch: true,
        searchApiEndpoint: '/api/v1/search/semantic',
      },
    },
    {
      instanceId: 'slice-combo-quick-access', type: 'COMBO_QUICK_ACCESS', visible: true, locked: false,
      props: {
        tabs: [
          { id: 'my-pick',  label: 'My pick',  active: true },
          { id: 'invest',   label: 'Invest',   active: false },
          { id: 'global',   label: 'Global',   active: false },
          { id: 'hk-daily', label: 'HK Daily', active: false },
        ],
        row1Items: [
          { id: 'qa-1', icon: 'account',  label: 'Account overview',  deepLink: 'hsbc://accounts' },
          { id: 'qa-2', icon: 'transfer', label: 'Transfer Globally', deepLink: 'hsbc://transfer/global' },
          { id: 'qa-3', icon: 'fx',       label: 'Foreign exchange',  deepLink: 'hsbc://fx' },
          { id: 'qa-4', icon: 'stock',    label: 'Trade stock',       deepLink: 'hsbc://trade/stock' },
          { id: 'qa-5', icon: 'deposit',  label: 'Time deposit',      deepLink: 'hsbc://deposit' },
        ],
        row2Items: [
          { id: 'qa-6',  icon: 'holding', label: 'My holding details',    deepLink: 'hsbc://holdings' },
          { id: 'qa-7',  icon: 'safe',    label: 'Money safe',             deepLink: 'hsbc://money-safe' },
          { id: 'qa-8',  icon: 'fps',     label: 'Local transfer/FPS',     deepLink: 'hsbc://transfer/fps' },
          { id: 'qa-9',  icon: 'scan',    label: 'Scan to pay',            deepLink: 'hsbc://scan-pay' },
          { id: 'qa-10', icon: 'all',     label: 'All product & services', deepLink: 'hsbc://all-services' },
        ],
      },
    },
    {
      instanceId: 'slice-card-activation', type: 'CARD_ACTIVATION_BANNER', visible: true, locked: false,
      props: {
        message: 'Your card needs to be activated',
        deepLink: 'hsbc://card/activate',
      },
    },
    {
      instanceId: 'slice-getting-started', type: 'QUEST_BANNER', visible: true, locked: false,
      props: {
        title: 'Getting started',
        description: 'Open investment account and complete the following quests to enjoy reward!',
        ctaLabel: 'Check out all 4 quests',
        ctaDeepLink: 'hsbc://quests',
        totalQuests: 4,
      },
    },
    {
      instanceId: 'slice-feature-product', type: 'FEATURE_PRODUCT', visible: true, locked: false,
      props: {
        sectionTitle: 'Feature product',
        tabs: ['Top performers', 'Top dividend', 'Top selling', 'Instalment'],
        activeTab: 'Top performers',
        funds: [
          {
            id: 'fp-1',
            name: 'AB SICAV I - LOW VOLATILITY EQUITY PORTFOLIO CLASS AD S...',
            code: 'U43120',
            returnLabel: '1Y return',
            returnValue: '+54.79%',
            returnPositive: true,
            tags: [],
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
      },
    },
    {
      instanceId: 'slice-wealth-studio', type: 'WEALTH_STUDIO_CAROUSEL', visible: true, locked: false,
      visibilityRule: {
        ruleId: 'rule-wealth-studio-wealth-account',
        label: 'Show Wealth Studio Carousel for Wealth Account holders only',
        conditions: [{ field: 'accountType', operator: 'is', value: 'wealth_account' }],
        conditionLogic: 'AND',
        action: 'show',
      },
      props: {
        sectionTitle: 'Premier Elite Wealth Studio',
        numColumns: 2,
        moreLabel: 'View all',
        moreDeepLink: 'hsbc://wealth-studio',
        items: [
          {
            id: 'ws-ep14',
            episodeLabel: 'Episode 14',
            liveBadge: '',
            title: 'Navigating Markets in 2026',
            ctaLabel: 'Watch now',
            imageColor: '#0A1628',
            presenter: 'Emily Cheung',
            presenterTitle: 'Senior Wealth Strategist, HSBC Premier',
            durationSeconds: 90,
            ucpAssetId: 'asset-014',
            videoUrl: 'http://localhost:3001/media/Wealth1.mov',
            thumbnailUrl: 'https://placehold.co/1280x720/0A1628/ffffff?text=Wealth+Studio+Ep14',
          },
          {
            id: 'ws-ep15',
            episodeLabel: 'Episode 15',
            liveBadge: '',
            title: 'Gold & Alternative Assets',
            ctaLabel: 'Watch now',
            imageColor: '#0A1628',
            presenter: 'Derek Lam',
            presenterTitle: 'Head of Alternative Investments, HSBC Jade',
            durationSeconds: 145,
            ucpAssetId: 'asset-015',
            videoUrl: 'http://localhost:3001/media/Wealth2.mov',
            thumbnailUrl: 'https://placehold.co/1280x720/0A1628/c9a96e?text=Wealth+Studio+Ep15',
          },
        ],
      },
    },
    {
      instanceId: 'slice-guides-insights', type: 'GUIDES_INSIGHTS_CAROUSEL', visible: true, locked: false,
      props: {
        sectionTitle: 'Guides and insights',
        numColumns: 2,
        moreLabel: 'View all',
        moreDeepLink: 'hsbc://guides',
        items: [
          {
            id: 'gi-1',
            title: 'Investment 101 - An investment in knowledge pays the best interest - Benjamin Franklin',
            description: 'A foundational guide to building your first investment portfolio.',
            date: '8 Apr 2024',
            imageColor: '#2D3748',
            deepLink: 'hsbc://guides/investment-101',
          },
          {
            id: 'gi-2',
            title: 'Market outlook Q2 2024',
            description: 'Key themes and asset allocation ideas for the second quarter.',
            date: '2 Apr 2024',
            imageColor: '#1A365D',
            deepLink: 'hsbc://guides/market-outlook',
          },
        ],
      },
    },
    {
      instanceId: 'slice-fx-watchlist', type: 'FX_WATCHLIST', visible: true, locked: false,
      props: {
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
      },
    },
    {
      instanceId: 'slice-discover-more', type: 'DISCOVER_MORE_CAROUSEL', visible: true, locked: false,
      props: {
        sectionTitle: 'Discover more',
        numColumns: 2,
        items: [
          {
            id: 'dm-1',
            tag: 'Time Deposit',
            tagColor: '#DB0011',
            title: 'Up to 15.5% p.a. FX Deposit Rate',
            description: 'Earn up to 15.5% p.a. on FX & Time Deposits! T&Cs apply.',
            subtitle: 'Earn up to 15.5% p.a. on FX & Time Deposits! T&Cs apply.',
            imageColor: '#1A2E4A',
            deepLink: 'hsbc://deposit/fx',
          },
          {
            id: 'dm-2',
            tag: 'Well+',
            tagColor: '#6B46C1',
            title: 'PURE Sign up 10-day...',
            description: '',
            subtitle: '',
            imageColor: '#2D3748',
            deepLink: 'hsbc://wellplus',
          },
        ],
      },
    },
  ],
};

export const PAGE_JADE_CAMPAIGN: PageLayout = {
  pageId: 'jade-upgrade-hk', name: 'Jade Upgrade Campaign (HK)',
  pageType: 'CAMPAIGN', pageTemplateId: 'tpl-segment-upgrade-campaign',
  description: 'Jade upgrade invitation page for Premier customers',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'zh-TW', thumbnail: '🟡', tags: ['jade', 'wealth', 'campaign'],
  channel: 'WEB_WECHAT', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
  supportedLocales: ['zh-TW', 'en'],
  translations: {},
  wechatPageUrl: 'https://wechat.hsbc.com.hk/pages/jade-upgrade',
  wechatShareTitle: '您的HSBC Jade升級邀請', wechatShareDesc: '立即了解專屬優惠，限時申請',
  campaignSchedule: {
    publishAt:   new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    takedownAt:  new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  slices: [
    { instanceId: 'jade-hero', type: 'PROMO_BANNER', props: { title: 'HSBC Jade 升級邀請', subtitle: '專為Premier客戶而設的尊貴服務', ctaLabel: '立即申請', ctaDeepLink: 'hsbc://jade/apply', imageUrl: '', backgroundColor: '#1D1D1B' }, visible: true, locked: false },
  ],
};

export const PAGE_VISA_CAMPAIGN: PageLayout = {
  pageId: 'visa-platinum-campaign', name: 'Visa Platinum Q3 Campaign',
  pageType: 'CAMPAIGN', pageTemplateId: 'tpl-credit-card-acquisition',
  description: 'Visa Platinum no-FX campaign for Q3 2026',
  nativeTargets: [], locale: 'en', thumbnail: '💳', tags: ['cards', 'campaign', 'visa'],
  channel: 'WEB_STANDARD', scope: 'GLOBAL', marketId: 'GLOBAL',
  releaseMarketIds: ['GLOBAL', 'HK', 'SG'], bizLineId: 'PAYMENT', groupId: 'GLOBAL-WEALTH-AD',
  authoringStatus: 'DRAFT',
  supportedLocales: ['en', 'zh-TW', 'zh-CN'],
  translations: {},
  isPublic: true,
  webSlug: '/credit-cards/visa-platinum-q3',
  webMetaTitle: 'HSBC Visa Platinum – No FX Fee | HSBC',
  webMetaDescription: 'Apply for HSBC Visa Platinum with no foreign transaction fee. Earn rewards globally.',
  slices: [
    {
      instanceId: 'visa-hero',
      type: 'CAMPAIGN_HERO',
      props: {
        headline: 'HSBC Visa Platinum Credit Card',
        subHeadline: 'Your World, No Limits — 0% Foreign Transaction Fee',
        badge: 'Limited Time Offer · Q3 2026',
        bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        accentColor: '#C9A84C',
        cardImageAlt: 'HSBC Visa Platinum Card',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'visa-benefits',
      type: 'CAMPAIGN_BENEFITS',
      props: {
        sectionTitle: 'Why Choose Visa Platinum?',
        benefits: [
          { icon: '🌍', title: '0% Foreign Transaction Fee', desc: 'Spend anywhere globally with no hidden charges on overseas purchases.' },
          { icon: '✈️', title: '2x Miles on Travel & Dining', desc: 'Earn double Asia Miles on flights, hotels and restaurant spending.' },
          { icon: '🛡️', title: 'Complimentary Travel Insurance', desc: 'Up to HK$1.5M coverage including trip cancellation and medical expenses.' },
          { icon: '🎭', title: 'Lifestyle Privileges', desc: 'Exclusive access to airport lounges, hotel upgrades and dining discounts.' },
          { icon: '💎', title: 'Visa Signature Benefits', desc: 'Concierge service, luxury hotel collection and fine wine programme.' },
          { icon: '📱', title: 'Apple Pay & Google Pay', desc: 'Contactless payments and instant spend notifications via HSBC HK app.' },
        ],
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'visa-cta',
      type: 'CAMPAIGN_CTA',
      props: {
        ctaLabel: 'Apply for Visa Platinum',
        ctaSubtext: 'Takes 5 minutes · Approval in 60 seconds',
        offerBadge: 'First Year Annual Fee Waived',
        ctaUrl: '/apply/visa-platinum',
        secondaryLabel: 'Compare Cards',
        secondaryUrl: '/credit-cards/compare',
      },
      visible: true,
      locked: false,
    },
  ],
};

export const PAGE_OBKYC: PageLayout = {
  pageId: 'obkyc-journey', name: 'OBKYC – Account Opening Journey',
  pageType: 'KYC_JOURNEY', description: 'Open Banking KYC journey — 11-step mobile flow',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'en', thumbnail: '🪪', tags: ['kyc', 'onboarding'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEB_ENABLER', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'DRAFT',
  supportedLocales: ['en'],
  translations: {},
  slices: [
    { instanceId: 'kyc-header', type: 'HEADER_NAV', props: { title: 'Account Opening', searchPlaceholder: 'Search', showNotificationBell: false, showQRScanner: false }, visible: true, locked: true },
  ],
};

export const PAGE_FX_VIEWPOINT: PageLayout = {
  pageId: 'fx-viewpoint-hk', name: 'FX Viewpoint — EUR & GBP (HK)',
  pageType: 'MARKET_INSIGHT', description: 'Market insight page: EUR and GBP analysis — ECB on hold and BoE rate cut. Includes video, briefing text and RM contact CTA.',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'en', thumbnail: '📈', tags: ['fx', 'market-insight', 'eur', 'gbp', 'wealth'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
  supportedLocales: ['en', 'zh-TW'],
  translations: {},
  slices: [
    {
      instanceId: 'mi-header', type: 'HEADER_NAV', visible: true, locked: true,
      props: { title: 'FX Viewpoint', showNotificationBell: false, showQRScanner: false, showBackButton: true },
    },
    {
      instanceId: 'mi-content-header', type: 'VIDEO_PLAYER', visible: true, locked: false,
      props: {
        ucpAssetId: 'asset-008',
        title: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
        thumbnailUrl: 'https://placehold.co/1280x720/003366/ffffff?text=FX+Viewpoint+EUR+%26+GBP',
        videoUrl: 'http://localhost:3001/media/fx-viewpoint.mov',
        presenterName: 'Jackie Wong',
        presenterTitle: 'FX Strategist, HSBC Global Research',
        autoplay: false,
        showCaption: true,
      },
    },
    {
      instanceId: 'mi-briefing', type: 'MARKET_BRIEFING_TEXT', visible: true, locked: false,
      props: {
        ucpContentId: 'ucp-content-fx-viewpoint-001',
        sectionTitle: 'Key takeaways',
        bulletPoints: [
          'A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.',
          'With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.',
          'BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.',
          'GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.',
          'Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.',
        ],
        disclaimer: 'This material is issued by HSBC and is for information purposes only. It does not constitute investment advice or a recommendation to buy or sell any financial instrument.',
      },
    },
    {
      instanceId: 'mi-contact-rm', type: 'CONTACT_RM_CTA', visible: true, locked: false,
      props: {
        label: 'Contact Your RM',
        subLabel: 'Speak to your Relationship Manager about FX opportunities',
        deepLink: 'hsbc://rm/contact?context=fx-viewpoint',
        backgroundColor: '#DB0011',
        textColor: '#FFFFFF',
        sticky: true,
      },
    },
  ],
};

export const PAGE_DEPOSIT_CAMPAIGN: PageLayout = {
  pageId: 'deposit-campaign-hk', name: 'New Fund Deposit Campaign (CN)',
  pageType: 'CAMPAIGN', pageTemplateId: 'tpl-deposit-campaign',
  description: 'Renminbi Savings new fund deposit campaign — elevated time deposit rates with rate table and FAQ.',
  nativeTargets: ['ios', 'android', 'harmonynext', 'web'], locale: 'en-CN', thumbnail: '🏦', tags: ['deposit', 'savings', 'campaign', 'renminbi', 'time-deposit'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'CN',
  releaseMarketIds: ['CN'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  isPublic: true,
  webSlug: '/cn/wealth/savings/new-fund-deposit-campaign',
  webMetaTitle: 'New Fund Time Deposit Campaign | HSBC Bank Wealth',
  webMetaDescription: 'Open an HSBC Renminbi time deposit today and earn up to 1.15% p.a. AER on new funds. Explore competitive rates for 3–60 month terms. Start growing your savings with HSBC Wealth now.',
  authorCredentials: 'HSBC Wealth Management — Product Team',
  authoringStatus: 'APPROVED',
  supportedLocales: ['en', 'zh-TW', 'zh-CN'],
  translations: {},
  campaignSchedule: {
    publishAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    takedownAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
  slices: [
    {
      instanceId: 'dep-header', type: 'HEADER_NAV', visible: true, locked: true,
      props: { title: 'Renminbi Savings Offers', showNotificationBell: false, showQRScanner: false, showBackButton: true },
    },
    {
      instanceId: 'dep-image-banner', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        imageUrl: '/media/deposit-campaign-banner.jpg',
        ucpAssetId: 'asset-009',
        backgroundColor: '#FFFFFF',
      },
    },
    {
      instanceId: 'dep-cd-rate-banner', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        title: '🌟 Up to 1.15% p.a. Annual Equivalent Rate',
        subtitle: '3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don\'t miss this limited-time rate. Start earning more today.',
        badgeText: '🔥 New Funds Only',
        backgroundColor: '#FFF7ED',
        textColor: '#92400E',
      },
    },
    {
      instanceId: 'dep-rate-table', type: 'DEPOSIT_RATE_TABLE', visible: true, locked: false,
      props: {
        sectionTitle: 'Time Deposit Rate:',
        asAtDate: '5/22/2025',
        rates: [
          { term: '3 Month Time Deposit',  rate: '0.65' },
          { term: '6 Month Time Deposit',  rate: '0.85' },
          { term: '12 Month Time Deposit', rate: '0.95' },
          { term: '24 Month Time Deposit', rate: '1.05' },
          { term: '36 Month Time Deposit', rate: '1.25' },
          { term: '60 Month Time Deposit', rate: '1.30' },
        ],
        footnote: 'Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.',
      },
    },
    {
      instanceId: 'dep-open-cta', type: 'DEPOSIT_OPEN_CTA', visible: true, locked: false,
      props: {
        label: 'Open a Deposit',
        deepLink: 'hsbc://deposit/open?currency=CNY&campaign=new-fund',
        backgroundColor: '#C41E3A',
        textColor: '#FFFFFF',
      },
    },
    {
      instanceId: 'dep-spacer', type: 'SPACER', visible: true, locked: false,
      props: { height: 16 },
    },
    {
      instanceId: 'dep-faq', type: 'DEPOSIT_FAQ', visible: true, locked: false,
      props: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          {
            id: 'faq-1',
            question: 'Can I withdraw my time deposit before it matures?',
            answer: 'Yes, you can. But you\'ll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch.',
          },
          {
            id: 'faq-2',
            question: 'What happens if I don\'t withdraw my money after maturity?',
            answer: 'If you don\'t take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity.',
          },
          {
            id: 'faq-3',
            question: 'How long can I keep a time deposit?',
            answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates. The most popular choices are 6-month or 12-month plans.',
          },
          {
            id: 'faq-4',
            question: 'Why is the interest rate higher for time deposits than regular savings accounts?',
            answer: 'Banks can offer better rates because they know you\'ll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest.',
          },
        ],
      },
    },
  ],
};

export const ALL_PAGES: PageLayout[] = [PAGE_HOME_WEALTH, PAGE_JADE_CAMPAIGN, PAGE_VISA_CAMPAIGN, PAGE_OBKYC, PAGE_FX_VIEWPOINT, PAGE_DEPOSIT_CAMPAIGN];

// ─── SDUI Journeys ────────────────────────────────────────────────────────────

export interface JourneyStep {
  stepId: string;
  label: string;
  description: string;
  screenType: string;
  icon: string;
  visibilityRule?: VisibilityRule;
}

export interface Journey {
  journeyId: string;
  name: string;
  description: string;
  channel: 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';
  nativeTargets: ('ios' | 'android' | 'harmonynext' | 'web')[];
  marketId: string;
  bizLineId: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LIVE';
  steps: JourneyStep[];
  // WEB_STANDARD only: whether the journey is publicly accessible (SEO/AEO assessed)
  isPublic?: boolean;
  // Multi-language support
  supportedLocales: string[];  // locales this journey is authored in; first = primary
  translations: Record<string, Record<string, string>>;  // locale → field key → value
}

export const MOCK_JOURNEYS: Journey[] = [
  {
    journeyId: 'journey-obkyc',
    name: 'OBKYC Account Opening',
    description: '11-step open banking KYC flow regulated by HKMA',
    channel: 'SDUI', nativeTargets: ['ios', 'android', 'harmonynext', 'web'], marketId: 'HK', bizLineId: 'WEB_ENABLER', status: 'LIVE',
    isPublic: true,
    supportedLocales: ['en', 'zh-TW'],
    translations: {
      'zh-TW': {
        name: '開放銀行KYC開戶',
        description: '香港金融管理局監管的11步開放銀行KYC流程',
        step001Label: '個人資料',        step001Desc: '法定全名及出生日期',
        step002Label: '國籍',            step002Desc: '國籍國家',
        step003Label: '身份證明文件',    step003Desc: 'HKID / 內地身份證 / 護照（有條件）',
        step004Label: '上傳文件',        step004Desc: '身份文件正背面照片',
        step005Label: '聯絡資料',        step005Desc: '電郵地址及手機號碼',
        step006Label: '住宅地址',        step006Desc: '香港地址 — 單位、樓層、座數、區份',
        step007Label: '就業及收入',      step007Desc: '就業狀況及年收入範圍',
        step008Label: '資金來源',        step008Desc: '主要資金來源及帳戶用途',
        step009Label: '自拍及活體檢測', step009Desc: '面部活體檢測及身份照片比對',
        step010Label: '連結您的銀行',    step010Desc: '開放銀行帳戶連結以即時驗證',
        step011Label: '法律聲明',        step011Desc: 'PEP狀態、真實性及FATCA聲明',
      },
    },
    steps: [
      { stepId: 'step-001', label: 'Personal Info',     description: 'Full legal name & date of birth',          screenType: 'TEXT_INPUT',   icon: '👤' },
      { stepId: 'step-002', label: 'Nationality',        description: 'Country of nationality',                   screenType: 'SINGLE_SELECT', icon: '🌍' },
      { stepId: 'step-003', label: 'Identity Document',  description: 'HKID / mainland ID / passport (conditional)', screenType: 'ID_CAPTURE',  icon: '🪪' },
      { stepId: 'step-004', label: 'Upload Document',    description: 'Front & back photo of identity document',  screenType: 'DOC_UPLOAD',   icon: '📄' },
      { stepId: 'step-005', label: 'Contact Details',    description: 'Email address & mobile phone number',      screenType: 'TEXT_INPUT',   icon: '📞' },
      { stepId: 'step-006', label: 'Residential Address', description: 'HK address — flat, floor, block, district', screenType: 'ADDRESS_FORM', icon: '🏠' },
      { stepId: 'step-007', label: 'Employment & Income', description: 'Employment status & annual income band',  screenType: 'SINGLE_SELECT', icon: '💼' },
      { stepId: 'step-008', label: 'Source of Funds',    description: 'Primary source of funds & account purpose', screenType: 'SINGLE_SELECT', icon: '🏦' },
      { stepId: 'step-009', label: 'Selfie & Liveness',  description: 'Face liveness check & ID photo match',    screenType: 'LIVENESS',     icon: '😊' },
      { stepId: 'step-010', label: 'Connect Your Bank',  description: 'Open Banking account link for instant verification', screenType: 'OPEN_BANKING', icon: '🔗' },
      { stepId: 'step-011', label: 'Legal Declarations', description: 'PEP status, truthfulness & FATCA declaration', screenType: 'DECLARATION', icon: '✍️' },
    ],
  },
  {
    journeyId: 'journey-obkyc-web',
    name: 'OBKYC Account Opening - Web',
    description: '6-step open banking KYC flow for web browsers — consolidated from 11 mobile steps',
    channel: 'WEB_STANDARD', nativeTargets: [], marketId: 'HK', bizLineId: 'WEB_ENABLER', status: 'DRAFT',
    isPublic: false,
    supportedLocales: ['en'],
    translations: {},
    steps: [
      { stepId: 'web-step-001', label: 'Your Identity',       description: 'Personal info, nationality & ID document — all on one page',  screenType: 'TEXT_INPUT',    icon: '🪪' },
      { stepId: 'web-step-002', label: 'Document & Contact',  description: 'Upload your ID and provide contact details',                   screenType: 'DOC_UPLOAD',    icon: '📋' },
      { stepId: 'web-step-003', label: 'Background',          description: 'Address, employment & source of funds',                        screenType: 'SINGLE_SELECT', icon: '📝' },
      { stepId: 'web-step-004', label: 'Selfie & Liveness',   description: 'Face liveness check & ID photo match',                        screenType: 'LIVENESS',      icon: '😊' },
      { stepId: 'web-step-005', label: 'Connect Your Bank',   description: 'Open Banking account link for instant verification',           screenType: 'OPEN_BANKING',  icon: '🔗' },
      { stepId: 'web-step-006', label: 'Legal Declarations',  description: 'PEP status, truthfulness & FATCA declaration — review & sign', screenType: 'DECLARATION',   icon: '✍️' },
    ],
  },
  {
    journeyId: 'journey-wealth',
    name: 'Wealth Discovery Journey',
    description: 'Guided wealth product selection flow',
    channel: 'SDUI', nativeTargets: ['ios', 'android', 'harmonynext', 'web'], marketId: 'HK', bizLineId: 'WEALTH', status: 'DRAFT',
    supportedLocales: ['en', 'zh-TW'],
    translations: {
      'zh-TW': {
        name: '財富探索旅程',
        description: '引導式財富產品選擇流程',
        w1Label: '風險評估', w1Desc: '投資者風險評估',
        w2Label: '目標設定', w2Desc: '投資目標設定',
        w3Label: '產品推薦', w3Desc: 'AI產品建議',
      },
    },
    steps: [
      { stepId: 'w1', label: 'Risk Profile',    description: 'Investor risk assessment',  screenType: 'QUESTIONNAIRE', icon: '📊' },
      { stepId: 'w2', label: 'Goals',           description: 'Investment goal setting',   screenType: 'GOAL_PICKER',   icon: '🎯' },
      { stepId: 'w3', label: 'Recommendations', description: 'AI product suggestions',    screenType: 'PRODUCT_LIST',  icon: '✨' },
    ],
  },
];

// ─── Pre-seeded journey pages for OBKYC (one PageLayout per step) ─────────────
// These populate state.journeyPages on startup so the Journey Builder shows all
// 11 steps immediately without requiring the user to click "+ Add Step".

export interface JourneyPage {
  journeyId: string;
  stepIndex: number;
  page: PageLayout;
}

const obkycBase: Omit<PageLayout, 'pageId' | 'name' | 'description' | 'thumbnail' | 'slices'> = {
  pageType:   'KYC_JOURNEY',
  nativeTargets: ['ios', 'android', 'harmonynext'],
  locale:     'en',
  channel:    'SDUI',
  scope:      'MARKET',
  marketId:   'HK',
  releaseMarketIds: ['HK'],
  bizLineId:  'WEB_ENABLER',
  groupId:    'HK-WEALTH-AD',
  authoringStatus: 'DRAFT',
  supportedLocales: ['en'],
  translations: {},
  tags:       ['kyc', 'onboarding'],
};

export const MOCK_JOURNEY_PAGES: JourneyPage[] = [
  {
    journeyId: 'journey-obkyc', stepIndex: 0,
    page: { ...obkycBase, pageId: 'obkyc-step-001', name: 'Step 1 — Personal Info',
      description: 'Full legal name (first, last) and date of birth', thumbnail: '👤',
      slices: [{ instanceId: 'kyc-name-dob', type: 'KYC_NAME_DOB',
        props: { questions: ['q_first_name', 'q_last_name', 'q_date_of_birth'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 1,
    page: { ...obkycBase, pageId: 'obkyc-step-002', name: 'Step 2 — Nationality',
      description: 'Country of nationality selector', thumbnail: '🌍',
      slices: [{ instanceId: 'kyc-nationality', type: 'KYC_SINGLE_SELECT',
        props: { questionId: 'q_nationality' }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 2,
    page: { ...obkycBase, pageId: 'obkyc-step-003', name: 'Step 3 — Identity Document',
      description: 'HKID (if HK nationality) or mainland ID / passport for others', thumbnail: '🪪',
      slices: [{ instanceId: 'kyc-id-doc', type: 'KYC_ID_CAPTURE',
        props: { conditionalOn: 'q_nationality', variants: { HK: ['q_hkid_number', 'q_hkid_expiry'], CN: ['q_mainland_id'], default: ['q_passport_number', 'q_passport_expiry'] } }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 3,
    page: { ...obkycBase, pageId: 'obkyc-step-004', name: 'Step 4 — Upload Identity Document',
      description: 'Clear photo or scan of identity card (front & back)', thumbnail: '📄',
      slices: [{ instanceId: 'kyc-doc-upload', type: 'KYC_DOC_UPLOAD',
        props: { sides: ['front', 'back'], questionId: 'q_hkid_front', maxSizeMb: 10, acceptedFormats: ['jpg', 'png', 'pdf'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 4,
    page: { ...obkycBase, pageId: 'obkyc-step-005', name: 'Step 5 — Contact Details',
      description: 'Email address and HK mobile phone number', thumbnail: '📞',
      slices: [{ instanceId: 'kyc-contact', type: 'KYC_CONTACT',
        props: { questions: ['q_email', 'q_phone'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 5,
    page: { ...obkycBase, pageId: 'obkyc-step-006', name: 'Step 6 — Residential Address',
      description: 'Hong Kong address — flat, floor, block, district', thumbnail: '🏠',
      slices: [{ instanceId: 'kyc-address', type: 'KYC_ADDRESS',
        props: { format: 'HK', questions: ['q_addr_line1', 'q_addr_line2', 'q_addr_district'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 6,
    page: { ...obkycBase, pageId: 'obkyc-step-007', name: 'Step 7 — Employment & Income',
      description: 'Employment status and annual income band', thumbnail: '💼',
      slices: [{ instanceId: 'kyc-employment', type: 'KYC_EMPLOYMENT',
        props: { questions: ['q_employment_status', 'q_annual_income'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 7,
    page: { ...obkycBase, pageId: 'obkyc-step-008', name: 'Step 8 — Source of Funds',
      description: 'Primary source of funds and purpose of account', thumbnail: '🏦',
      slices: [{ instanceId: 'kyc-funds', type: 'KYC_SOURCE_OF_FUNDS',
        props: { questions: ['q_source_of_funds', 'q_account_purpose'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 8,
    page: { ...obkycBase, pageId: 'obkyc-step-009', name: 'Step 9 — Selfie & Liveness',
      description: 'Face liveness check — verify you match your ID document', thumbnail: '😊',
      slices: [{ instanceId: 'kyc-liveness', type: 'KYC_LIVENESS',
        props: { questionId: 'q_liveness' }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 9,
    page: { ...obkycBase, pageId: 'obkyc-step-010', name: 'Step 10 — Connect Your Bank',
      description: 'Open Banking consent and bank account connection', thumbnail: '🔗',
      slices: [{ instanceId: 'kyc-open-banking', type: 'KYC_OPEN_BANKING',
        props: { questionId: 'q_ob_consent', regulation: 'FCA/HKMA' }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc', stepIndex: 10,
    page: { ...obkycBase, pageId: 'obkyc-step-011', name: 'Step 11 — Legal Declarations',
      description: 'PEP status, truthfulness declaration and FATCA confirmation', thumbnail: '✍️',
      slices: [{ instanceId: 'kyc-declarations', type: 'KYC_DECLARATION',
        props: { questions: ['q_pep_status', 'decl_truthful', 'decl_fatca'] }, visible: true, locked: false }] },
  },
];

// ─── Pre-seeded journey pages for OBKYC Web (6 consolidated steps) ────────────
// Web viewport is wider so related mobile steps are merged into compound pages.
//   Mobile step grouping:
//     Web step 1 = mobile steps 1+2+3  (personal info, nationality, ID doc)
//     Web step 2 = mobile steps 4+5    (doc upload, contact details)
//     Web step 3 = mobile steps 6+7+8  (address, employment, source of funds)
//     Web step 4 = mobile step 9       (liveness — same, but wider layout)
//     Web step 5 = mobile step 10      (open banking — wider bank card grid)
//     Web step 6 = mobile step 11      (declarations — two-column review + sign)

const obkycWebBase: Omit<PageLayout, 'pageId' | 'name' | 'description' | 'thumbnail' | 'slices'> = {
  pageType:   'KYC_JOURNEY',
  nativeTargets: [],
  locale:     'en',
  channel:    'WEB_STANDARD',
  scope:      'MARKET',
  marketId:   'HK',
  releaseMarketIds: ['HK'],
  bizLineId:  'WEB_ENABLER',
  groupId:    'HK-WEALTH-AD',
  authoringStatus: 'DRAFT',
  supportedLocales: ['en'],
  translations: {},
  tags:       ['kyc', 'onboarding', 'web'],
  webSlug:    '/account-opening',
  webMetaTitle: 'Open an HSBC Account | HSBC Hong Kong',
  webMetaDescription: 'Open your HSBC account online in minutes. Fast, secure and HKMA regulated.',
};

export const MOCK_JOURNEY_PAGES_WEB: JourneyPage[] = [
  {
    journeyId: 'journey-obkyc-web', stepIndex: 0,
    page: { ...obkycWebBase, pageId: 'obkyc-web-step-001', name: 'Step 1 — Your Identity',
      description: 'Personal info, nationality and identity document — combined on one wide page',
      thumbnail: '🪪',
      slices: [{ instanceId: 'kyc-web-identity', type: 'KYC_WEB_IDENTITY',
        props: { questions: ['q_first_name', 'q_last_name', 'q_date_of_birth', 'q_nationality', 'q_hkid_number', 'q_hkid_expiry', 'q_mainland_id', 'q_passport_number', 'q_passport_expiry'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc-web', stepIndex: 1,
    page: { ...obkycWebBase, pageId: 'obkyc-web-step-002', name: 'Step 2 — Document & Contact',
      description: 'Upload identity document and provide contact details',
      thumbnail: '📋',
      slices: [{ instanceId: 'kyc-web-upload-contact', type: 'KYC_WEB_UPLOAD_CONTACT',
        props: { questions: ['q_hkid_front', 'q_email', 'q_phone'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc-web', stepIndex: 2,
    page: { ...obkycWebBase, pageId: 'obkyc-web-step-003', name: 'Step 3 — Background',
      description: 'Residential address, employment status and source of funds',
      thumbnail: '📝',
      slices: [{ instanceId: 'kyc-web-background', type: 'KYC_WEB_BACKGROUND',
        props: { questions: ['q_addr_line1', 'q_addr_line2', 'q_addr_district', 'q_employment_status', 'q_annual_income', 'q_source_of_funds', 'q_account_purpose'] }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc-web', stepIndex: 3,
    page: { ...obkycWebBase, pageId: 'obkyc-web-step-004', name: 'Step 4 — Selfie & Liveness',
      description: 'Face liveness check — uses webcam in browser',
      thumbnail: '😊',
      slices: [{ instanceId: 'kyc-web-liveness', type: 'KYC_WEB_LIVENESS',
        props: { questionId: 'q_liveness' }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc-web', stepIndex: 4,
    page: { ...obkycWebBase, pageId: 'obkyc-web-step-005', name: 'Step 5 — Connect Your Bank',
      description: 'Open Banking consent — wide bank card grid layout',
      thumbnail: '🔗',
      slices: [{ instanceId: 'kyc-web-open-banking', type: 'KYC_WEB_OPEN_BANKING',
        props: { questionId: 'q_ob_consent', regulation: 'HKMA' }, visible: true, locked: false }] },
  },
  {
    journeyId: 'journey-obkyc-web', stepIndex: 5,
    page: { ...obkycWebBase, pageId: 'obkyc-web-step-006', name: 'Step 6 — Legal Declarations',
      description: 'PEP status, truthfulness & FATCA — two-column review and sign',
      thumbnail: '✍️',
      slices: [{ instanceId: 'kyc-web-declaration', type: 'KYC_WEB_DECLARATION',
        props: { questions: ['q_pep_status', 'decl_truthful', 'decl_fatca'] }, visible: true, locked: false }] },
  },
];

export const MOCK_WORKFLOW: WorkflowEntry[] = [
  { entryId: 'wf-001', pageId: 'home-wealth-hk',        pageName: 'Home Hub (HK)',                 status: 'LIVE',  authorId: 'j.chan@hsbc.com.hk', authorName: 'Janet Chan', comments: [], layout: PAGE_HOME_WEALTH,    version: 3 },
  { entryId: 'wf-002', pageId: 'jade-upgrade-hk',       pageName: 'Jade Upgrade Campaign (HK)',    status: 'LIVE',  authorId: 'j.chan@hsbc.com.hk', authorName: 'Janet Chan', comments: [], layout: PAGE_JADE_CAMPAIGN,  version: 2 },
  { entryId: 'wf-003', pageId: 'visa-platinum-campaign', pageName: 'Visa Platinum Q3 Campaign',    status: 'DRAFT', authorId: 'j.chan@hsbc.com.hk', authorName: 'Janet Chan', comments: [], layout: PAGE_VISA_CAMPAIGN,  version: 1 },
  { entryId: 'wf-004', pageId: 'obkyc-journey',          pageName: 'OBKYC – Account Opening Journey', status: 'DRAFT', authorId: 'k.lee@hsbc.com.hk', authorName: 'Karen Lee', comments: [], layout: PAGE_OBKYC, version: 1 },
  { entryId: 'wf-005', pageId: 'fx-viewpoint-hk',        pageName: 'FX Viewpoint — EUR & GBP (HK)', status: 'LIVE', authorId: 'j.chan@hsbc.com.hk', authorName: 'Janet Chan', comments: [], layout: PAGE_FX_VIEWPOINT, version: 1 },
  { entryId: 'wf-006', pageId: 'deposit-campaign-hk',    pageName: 'New Fund Deposit Campaign (CN)', status: 'LIVE', authorId: 'j.chan@hsbc.com.hk', authorName: 'Janet Chan', comments: [], layout: PAGE_DEPOSIT_CAMPAIGN, version: 1 },
];

// ─── Market production status ─────────────────────────────────────────────────

export const MOCK_MARKET_STATUS: PageMarketStatus[] = [
  { pageId: 'home-wealth-hk',         targetId: 'HK',     productionStatus: 'LIVE',           liveVersion: 3, lastPublishedAt: '2026-03-12' },
  { pageId: 'jade-upgrade-hk',        targetId: 'HK',     productionStatus: 'LIVE',           liveVersion: 2, lastPublishedAt: '2026-03-15' },
  { pageId: 'visa-platinum-campaign', targetId: 'GLOBAL',  productionStatus: 'LIVE',           liveVersion: 2, lastPublishedAt: '2026-03-10' },
  { pageId: 'visa-platinum-campaign', targetId: 'HK',     productionStatus: 'LIVE',           liveVersion: 2, lastPublishedAt: '2026-03-12' },
  { pageId: 'visa-platinum-campaign', targetId: 'SG',     productionStatus: 'NEVER_RELEASED' },
  { pageId: 'fx-viewpoint-hk',        targetId: 'HK',     productionStatus: 'LIVE',           liveVersion: 1, lastPublishedAt: '2026-05-02' },
];

// ─── AEO Scores ───────────────────────────────────────────────────────────────

export const MOCK_AEO_SCORES: AEOScore[] = [
  // ─ Visa Platinum Campaign (WEB_STANDARD, public) ───────────────────────────
  {
    pageId: 'visa-platinum-campaign', targetId: 'GLOBAL',
    score: 88, grade: 'A', checkedAt: new Date(Date.now() - 86400000).toISOString(),
    breakdown: [
      { label: 'FAQ Schema',         score: 20, maxScore: 20, pass: true },
      { label: 'Product Schema',     score: 20, maxScore: 20, pass: true },
      { label: 'Freshness',          score: 15, maxScore: 15, pass: true },
      { label: 'Author Credentials', score: 10, maxScore: 10, pass: true },
      { label: 'Regulatory Ref',     score: 10, maxScore: 10, pass: true },
      { label: 'Structured Rate',    score: 10, maxScore: 10, pass: true },
      { label: 'Direct Answer',      score: 8,  maxScore: 10, pass: false },
      { label: 'LLM Citation',       score: 5,  maxScore: 5,  pass: true },
    ],
  },
  {
    pageId: 'visa-platinum-campaign', targetId: 'HK',
    score: 74, grade: 'B', checkedAt: new Date(Date.now() - 86400000).toISOString(),
    breakdown: [
      { label: 'FAQ Schema',         score: 20, maxScore: 20, pass: true },
      { label: 'Product Schema',     score: 20, maxScore: 20, pass: true },
      { label: 'Freshness',          score: 0,  maxScore: 15, pass: false },
      { label: 'Author Credentials', score: 10, maxScore: 10, pass: true },
      { label: 'Regulatory Ref',     score: 10, maxScore: 10, pass: true },
      { label: 'Structured Rate',    score: 0,  maxScore: 10, pass: false },
      { label: 'Direct Answer',      score: 10, maxScore: 10, pass: true },
      { label: 'LLM Citation',       score: 5,  maxScore: 5,  pass: true },
    ],
  },

  // ─ FX Viewpoint (WEB_STANDARD, public, LIVE) ───────────────────────────────
  {
    pageId: 'fx-viewpoint-hk', targetId: 'HK',
    score: 91, grade: 'A', checkedAt: new Date(Date.now() - 172800000).toISOString(),
    breakdown: [
      { label: 'FAQ Schema',         score: 20, maxScore: 20, pass: true },
      { label: 'Product Schema',     score: 20, maxScore: 20, pass: true },
      { label: 'Freshness',          score: 15, maxScore: 15, pass: true },
      { label: 'Author Credentials', score: 10, maxScore: 10, pass: true },
      { label: 'Regulatory Ref',     score: 10, maxScore: 10, pass: true },
      { label: 'Structured Rate',    score: 8,  maxScore: 10, pass: false },
      { label: 'Direct Answer',      score: 8,  maxScore: 10, pass: false },
      { label: 'LLM Citation',       score: 5,  maxScore: 5,  pass: true },
    ],
  },
];

// ─── Usage Stats ──────────────────────────────────────────────────────────────

export const MOCK_USAGE_STATS: PageUsageStat[] = [
  // Home Hub (HK) — SDUI wealth hub, high-traffic flagship page
  { pageId: 'home-wealth-hk',  targetId: 'HK',
    dau: 42800, wau: 189400, mau: 612000,
    newUsers: 38200, returningUsers: 573800,
    avgSessionSec: 187, avgPageDepth: 3.4, bounceRate: 0.18,
    conversionRate: 0.062, ctr: 0.21, errorRate: 0.004 },

  // Jade Upgrade Campaign (HK) — SDUI campaign, targeted Premier→Jade upsell
  { pageId: 'jade-upgrade-hk', targetId: 'HK',
    dau: 9340,  wau: 51200,  mau: 174600,
    newUsers: 12400, returningUsers: 162200,
    avgSessionSec: 210, avgPageDepth: 2.1, bounceRate: 0.22,
    conversionRate: 0.094, ctr: 0.31, errorRate: 0.007 },

  // Visa Platinum Campaign — Web Standard, multi-market
  { pageId: 'visa-platinum-campaign', targetId: 'GLOBAL',
    dau: 8412,  wau: 47230,  mau: 183440,
    newUsers: 97600, returningUsers: 85840,
    avgSessionSec: 142, avgPageDepth: 1.8, bounceRate: 0.34,
    conversionRate: 0.038, ctr: 0.27, errorRate: 0.011 },

  { pageId: 'visa-platinum-campaign', targetId: 'HK',
    dau: 3210,  wau: 18200,  mau: 67300,
    newUsers: 41800, returningUsers: 25500,
    avgSessionSec: 128, avgPageDepth: 1.6, bounceRate: 0.41,
    conversionRate: 0.042, ctr: 0.29, errorRate: 0.009 },

  // FX Viewpoint — Web Standard, market insight / RM tool
  { pageId: 'fx-viewpoint-hk', targetId: 'HK',
    dau: 5680,  wau: 29400,  mau: 98700,
    newUsers: 8200, returningUsers: 90500,
    avgSessionSec: 264, avgPageDepth: 2.8, bounceRate: 0.14,
    conversionRate: 0.071, ctr: 0.18, errorRate: 0.003 },

  // Deposit Campaign (CN / WeChat) — WeChat channel
  { pageId: 'deposit-campaign-hk', targetId: 'HK',
    dau: 4120,  wau: 22100,  mau: 79800,
    newUsers: 31200, returningUsers: 48600,
    avgSessionSec: 97,  avgPageDepth: 1.4, bounceRate: 0.52,
    conversionRate: 0.019, ctr: 0.14, errorRate: 0.015 },
];

export const MOCK_JOURNEY_STATS: JourneyUsageStat[] = [
  // OBKYC Account Opening — SDUI, 11-step, LIVE in HK
  { journeyId: 'journey-obkyc', targetId: 'HK',
    dau: 3240, wau: 17800, mau: 58600,
    newUsers: 54200, returningUsers: 4400,
    journeyStartRate: 0.74, completionRate: 0.61,
    dropOffStep: 4,         // highest drop-off at Selfie & Liveness (step 4)
    avgCompletionSec: 742,  // ~12 mins for full 11-step flow
    conversionRate: 0.58,   // % who opened an account after completing
    errorRate: 0.021 },
];

// ─── Audit log ────────────────────────────────────────────────────────────────

export const MOCK_AUDIT: AuditEntry[] = [
  { id: 'a-001', timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), actorId: 'j.chan@hsbc.com.hk', actorRole: 'WEALTH-AUTHOR', action: 'PAGE_RELEASED',  pageId: 'home-wealth-hk',         pageName: 'Home Hub (HK)',                 details: 'Released to HK v3',                    marketId: 'HK', releaseTargetId: 'HK' },
  { id: 'a-002', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),  actorId: 'j.chan@hsbc.com.hk', actorRole: 'WEALTH-AUTHOR', action: 'PAGE_SUBMITTED', pageId: 'visa-platinum-campaign',  pageName: 'Visa Platinum Q3 Campaign',     details: 'Submitted for India (bank.in)',         marketId: 'GLOBAL', releaseTargetId: 'IN' },
  { id: 'a-003', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),  actorId: 'j.chan@hsbc.com.hk', actorRole: 'WEALTH-AUTHOR', action: 'WECHAT_MSG_SENT', pageId: 'jade-upgrade-hk',        pageName: 'Jade Upgrade Campaign (HK)',    details: 'Template msg sent to 48,200 followers', marketId: 'HK' },
  { id: 'a-004', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),  actorId: 'm.wong@hsbc.com.hk', actorRole: 'WEALTH-APPROVER', action: 'APPROVED',    pageId: 'jade-upgrade-hk',        pageName: 'Jade Upgrade Campaign (HK)',    details: 'Approved for HK production',            marketId: 'HK', releaseTargetId: 'HK' },
  { id: 'a-005', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),  actorId: 'j.chan@hsbc.com.hk', actorRole: 'WEALTH-AUTHOR',   action: 'PAGE_RELEASED', pageId: 'fx-viewpoint-hk',         pageName: 'FX Viewpoint — EUR & GBP (HK)',  details: 'Released to HK v1 — SDUI channel',      marketId: 'HK', releaseTargetId: 'HK' },
];

// ─── Staff users ──────────────────────────────────────────────────────────────

export const MOCK_USERS: StaffUser[] = [
  { id: 'j.chan@hsbc.com.hk',   name: 'Janet Chan',   email: 'j.chan@hsbc.com.hk',   role: 'WEALTH-AUTHOR',      marketId: 'HK',     bizLineId: 'WEALTH',      groupId: 'HK-WEALTH-AD' },
  { id: 'm.wong@hsbc.com.hk',   name: 'Michael Wong', email: 'm.wong@hsbc.com.hk',   role: 'WEALTH-APPROVER',    marketId: 'HK',     bizLineId: 'WEALTH',      groupId: 'HK-WEALTH-AD' },
  { id: 'k.lee@hsbc.com.hk',    name: 'Karen Lee',    email: 'k.lee@hsbc.com.hk',    role: 'PAYMENT-AUTHOR',     marketId: 'HK',     bizLineId: 'PAYMENT',     groupId: 'HK-PAYMENT-AD' },
  { id: 'b.lam@hsbc.com.hk',    name: 'Brian Lam',    email: 'b.lam@hsbc.com.hk',    role: 'ADMIN',              marketId: 'HK',     bizLineId: 'WEALTH',      groupId: 'HK-ADMIN-GRP' },
  { id: 's.ng@hsbc.com.hk',     name: 'Sarah Ng',     email: 's.ng@hsbc.com.hk',     role: 'AUDITOR',            marketId: 'HK',     bizLineId: 'WEALTH',      groupId: 'HK-AUDIT-GRP' },
  { id: 'r.iron@hsbc.com',      name: 'Robert Iron',  email: 'r.iron@hsbc.com',      role: 'GLOBAL_ADMIN',       marketId: 'GLOBAL', bizLineId: 'WEALTH',      groupId: 'GLOBAL-ADMIN-GRP' },
  { id: 'w.chen@hsbc.com',      name: 'Walter Chen',  email: 'w.chen@hsbc.com',      role: 'AI-SEARCH-OPERATOR', marketId: 'GLOBAL', bizLineId: 'WEB_ENABLER', groupId: 'MOBILE-WEB-ENABLER-AD' },
];

// ─── Page Templates (mirrored from UCP) ───────────────────────────────────────

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    templateId: 'tpl-generic',
    name: 'Generic Page',
    description: 'A blank page with only a standard HSBC header navigation bar. Use as a starting point for any custom page layout.',
    icon: '📄',
    channels: ['SDUI', 'WEB_STANDARD', 'WEB_WECHAT'],
    bizLineIds: ['PAYMENT', 'WEB_ENABLER', 'LENDING', 'COLLECTION', 'WEALTH', 'MARKETING'],
    category: 'generic',
    seoRequired: false,
    aeoRequired: false,
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    maintainedBy: 'Platform Team',
    usageCount: 42,
    starterSlices: [
      { type: 'HEADER_NAV', props: { title: '', showNotificationBell: true, showQRScanner: false, showBackButton: false }, locked: false },
    ],
  },
  {
    templateId: 'tpl-web-standard',
    name: 'Web Standard Page',
    description: 'A fully SEO/AEO-optimised web page for HSBC.com. Includes the global nav header, breadcrumb, structured content area and compliant footer. Mandatory for all public Web Standard pages.',
    icon: '🌐',
    channels: ['WEB_STANDARD'],
    bizLineIds: ['PAYMENT', 'WEB_ENABLER', 'LENDING', 'COLLECTION', 'WEALTH', 'MARKETING'],
    category: 'generic',
    seoRequired: true,
    aeoRequired: true,
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    maintainedBy: 'Web Enablement Team',
    usageCount: 28,
    starterSlices: [
      { type: 'HEADER_NAV', props: { title: '', showNotificationBell: true, showQRScanner: false, showBackButton: false }, locked: true },
      { type: 'PROMO_BANNER', props: { title: 'Page Headline', subtitle: 'Supporting copy goes here', backgroundColor: '#F9FAFB' }, locked: false },
    ],
  },
  {
    templateId: 'tpl-segment-upgrade-campaign',
    name: 'Segment Upgrade Campaign',
    description: 'WeChat H5 campaign page for HSBC segment upgrade journeys (Premier→Jade, Advance→Premier). Follows WeChat H5 common requirements: single-screen scroll, share card metadata, WeChat-native CTA styling.',
    icon: '🏆',
    channels: ['WEB_WECHAT'],
    bizLineIds: ['WEALTH', 'MARKETING'],
    category: 'campaign',
    seoRequired: false,
    aeoRequired: false,
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    maintainedBy: 'Wealth Marketing Team',
    usageCount: 3,
    starterSlices: [
      {
        type: 'CAMPAIGN_HERO',
        props: { headline: 'Upgrade Your Banking Experience', subHeadline: 'Exclusive invitation for valued HSBC customers. Discover premium benefits designed for you.', badge: 'By Invitation Only', bgGradient: 'linear-gradient(160deg,#1D1D1B 0%,#2C2C2A 100%)', accentColor: '#C9A84C' },
        locked: false,
      },
      {
        type: 'CAMPAIGN_BENEFITS',
        props: {
          sectionTitle: 'Exclusive Privileges',
          items: [
            { icon: '💎', title: 'Premium Service', description: 'Dedicated Relationship Manager available 24/7' },
            { icon: '✈️', title: 'Travel Benefits', description: 'Global airport lounge access for you and guests' },
            { icon: '💰', title: 'Preferential Rates', description: 'Privileged FX rates and higher savings yields' },
            { icon: '🎯', title: 'Wealth Solutions', description: 'Access to exclusive investment products' },
          ],
        },
        locked: false,
      },
      { type: 'SPACER', props: { height: 16 }, locked: false },
      {
        type: 'CAMPAIGN_CTA',
        props: { primaryLabel: 'Apply Now', primaryUrl: 'hsbc://upgrade/apply', subNote: 'No annual fee in the first year', secondaryLabel: 'Learn More', secondaryUrl: 'hsbc://upgrade/learn' },
        locked: false,
      },
    ],
  },
  {
    templateId: 'tpl-credit-card-acquisition',
    name: 'Credit Card Acquisition',
    description: 'SEO/AEO-optimised Web Standard campaign page for credit card acquisition. Follows HSBC.com web standards with structured hero, feature benefits grid and compliant CTA with fee disclosure.',
    icon: '💳',
    channels: ['WEB_STANDARD'],
    bizLineIds: ['PAYMENT', 'MARKETING'],
    category: 'campaign',
    seoRequired: true,
    aeoRequired: true,
    status: 'ACTIVE',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    maintainedBy: 'Payment Marketing Team',
    usageCount: 5,
    starterSlices: [
      {
        type: 'CAMPAIGN_HERO',
        props: { headline: 'HSBC [Card Name] Credit Card', subHeadline: 'Earn rewards with every purchase. Apply today and enjoy your first year fee waived.', badge: 'Limited Time Offer', bgGradient: 'linear-gradient(160deg,#0A1A3D 0%,#0D2B6B 60%,#1A3A8F 100%)', accentColor: '#C9A84C' },
        locked: false,
      },
      {
        type: 'CAMPAIGN_BENEFITS',
        props: {
          sectionTitle: 'Card Benefits',
          items: [
            { icon: '🌍', title: '0% Foreign Transaction Fee', description: 'No extra charges on overseas spending' },
            { icon: '✈️', title: 'Airport Lounge Access', description: '6 complimentary lounge visits per year' },
            { icon: '🛡️', title: 'Travel Insurance', description: 'Up to HKD 800,000 coverage automatically' },
            { icon: '🎭', title: 'Lifestyle Rewards', description: 'Earn 2x points on dining and entertainment' },
            { icon: '💎', title: 'Concierge Service', description: '24/7 global concierge for travel and dining' },
            { icon: '📱', title: 'Contactless & Pay', description: 'Apple Pay, Google Pay and Samsung Pay' },
          ],
        },
        locked: false,
      },
      {
        type: 'CAMPAIGN_CTA',
        props: { primaryLabel: 'Apply for This Card', primaryUrl: '/apply/credit-card', subNote: 'First Year Annual Fee Waived', secondaryLabel: 'Compare Cards', secondaryUrl: '/credit-cards/compare' },
        locked: false,
      },
    ],
  },
  {
    templateId: 'tpl-deposit-campaign',
    name: 'Deposit Campaign',
    description: 'SDUI campaign page for time deposit and savings rate promotions. Includes header nav, promotional banner, structured rate table, open-deposit CTA and FAQ accordion. Follows HSBC wealth campaign standards for CN and HK markets.',
    icon: '🏦',
    channels: ['SDUI'],
    bizLineIds: ['WEALTH', 'MARKETING'],
    category: 'campaign',
    seoRequired: false,
    aeoRequired: false,
    status: 'ACTIVE',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    maintainedBy: 'Wealth Product Team',
    usageCount: 2,
    starterSlices: [
      { type: 'HEADER_NAV', props: { title: 'Savings Offers', showNotificationBell: false, showQRScanner: false, showBackButton: true }, locked: true },
      { type: 'PROMO_BANNER', props: { title: '🌟 Exclusive Savings Rate', subtitle: 'Limited-time offer for new funds only. Open your time deposit today.', badgeText: '🔥 New Funds Only', backgroundColor: '#FFF7ED' }, locked: false },
      { type: 'DEPOSIT_RATE_TABLE', props: { sectionTitle: 'Time Deposit Rates:', asAtDate: '', rates: [{ term: '3 Month', rate: '—' }, { term: '6 Month', rate: '—' }, { term: '12 Month', rate: '—' }], footnote: 'New Fund refers to funds not previously held with HSBC.' }, locked: false },
      { type: 'DEPOSIT_OPEN_CTA', props: { label: 'Open a Deposit', deepLink: 'hsbc://deposit/open', backgroundColor: '#C41E3A', textColor: '#FFFFFF' }, locked: false },
      { type: 'SPACER', props: { height: 16 }, locked: false },
      { type: 'DEPOSIT_FAQ', props: { sectionTitle: 'Frequently Asked Questions', items: [{ id: 'faq-1', question: 'What is a time deposit?', answer: 'A time deposit is a savings product with a fixed term and a guaranteed interest rate.' }, { id: 'faq-2', question: 'What is "New Fund"?', answer: 'New Fund refers to funds not previously held with HSBC.' }] }, locked: false },
    ],
  },
];

// ─── Rule Parameter Definitions ───────────────────────────────────────────────

export const CUSTOMER_SEGMENT_DEFS: CustomerSegmentDef[] = [
  { segmentId: 'premier',  displayName: 'HSBC Premier',          description: 'Top-tier retail banking customers with Premier status',            active: true },
  { segmentId: 'elite',    displayName: 'HSBC Elite / Jade',     description: 'Ultra-high-net-worth private wealth clients',                       active: true },
  { segmentId: 'advance',  displayName: 'HSBC Advance',          description: 'Mid-tier customers with Advance eligibility',                       active: true },
  { segmentId: 'mass',     displayName: 'Personal Banking',       description: 'Standard retail customers without Premier or Advance status',       active: true },
  { segmentId: 'business', displayName: 'Business Banking',       description: 'SME and commercial business customers',                            active: true },
];

export const ACCOUNT_TYPE_DEFS: AccountTypeDef[] = [
  { typeId: 'wealth_account',   displayName: 'Wealth / Investment Account', description: 'Investment, fund, and portfolio management accounts',    active: true },
  { typeId: 'credit_card',      displayName: 'Credit Card',                  description: 'All credit card products (Visa, Mastercard, Amex)',      active: true },
  { typeId: 'current_account',  displayName: 'Current Account',              description: 'Day-to-day transactional accounts',                      active: true },
  { typeId: 'savings_account',  displayName: 'Savings Account',              description: 'Interest-bearing savings accounts',                      active: true },
  { typeId: 'mortgage',         displayName: 'Mortgage',                     description: 'Home loans and mortgage products',                       active: true },
  { typeId: 'time_deposit',     displayName: 'Time Deposit',                 description: 'Fixed-term deposit products',                            active: true },
  { typeId: 'personal_loan',    displayName: 'Personal Loan',                description: 'Unsecured personal lending products',                    active: true },
];

export const LOCATION_DEFS: LocationDef[] = [
  { locationId: 'HK',             displayName: 'Hong Kong',      description: 'Customers whose registered address is in Hong Kong',               active: true },
  { locationId: 'mainland_china', displayName: 'Mainland China', description: 'Customers with a mainland China address or residency',             active: true },
  { locationId: 'macau',          displayName: 'Macau',          description: 'Customers located in Macau SAR',                                   active: true },
  { locationId: 'singapore',      displayName: 'Singapore',      description: 'Customers with a Singapore address',                               active: true },
  { locationId: 'uk',             displayName: 'United Kingdom', description: 'Customers with a UK address',                                      active: true },
  { locationId: 'other',          displayName: 'Other',          description: 'All other customer locations not listed above',                    active: true },
];
