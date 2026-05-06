import type {
  Market, ReleaseTarget, BizLine, AdGroup, ApprovalFlow,
  WeChatServiceAccount, WeChatMessageTemplate,
  PageLayout, WorkflowEntry, AuditEntry, StaffUser,
  PageMarketStatus, AEOScore, PageUsageStat,
} from '../types/ocdp';

// ─── Reference data ───────────────────────────────────────────────────────────

export const MARKETS: Market[] = [
  { marketId: 'GLOBAL', marketName: 'Global (.com)',              active: true,  timezone: 'UTC',            tzLabel: 'UTC (UTC+0)' },
  { marketId: 'HK',     marketName: 'Hong Kong (.com.hk)',        active: true,  timezone: 'Asia/Hong_Kong', tzLabel: 'HKT (UTC+8)' },
  { marketId: 'SG',     marketName: 'Singapore (.com.sg)',        active: true,  timezone: 'Asia/Singapore', tzLabel: 'SGT (UTC+8)' },
  { marketId: 'UK',     marketName: 'United Kingdom (.co.uk)',    active: true,  timezone: 'Europe/London',  tzLabel: 'BST/GMT (UTC+0/+1)' },
  { marketId: 'IN',     marketName: 'India (bank.in)',            active: true,  timezone: 'Asia/Kolkata',   tzLabel: 'IST (UTC+5:30)' },
  { marketId: 'CN',     marketName: 'China (WeChat)',             active: true,  timezone: 'Asia/Shanghai',  tzLabel: 'CST (UTC+8)' },
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
  { groupId: 'HK-WEALTH-AD',     groupName: 'HK Wealth AD Group',     marketId: 'HK',     bizLineId: 'WEALTH',   groupType: 'AD_GROUP' },
  { groupId: 'HK-PAYMENT-AD',    groupName: 'HK Payment AD Group',    marketId: 'HK',     bizLineId: 'PAYMENT',  groupType: 'AD_GROUP' },
  { groupId: 'HK-MARKETING-AD',  groupName: 'HK Marketing AD Group',  marketId: 'HK',     bizLineId: 'MARKETING', groupType: 'AD_GROUP' },
  { groupId: 'SG-WEALTH-AD',     groupName: 'SG Wealth AD Group',     marketId: 'SG',     bizLineId: 'WEALTH',   groupType: 'AD_GROUP' },
  { groupId: 'GLOBAL-WEALTH-AD', groupName: 'Global Wealth AD Group', marketId: 'GLOBAL', bizLineId: 'WEALTH',   groupType: 'AD_GROUP' },
  { groupId: 'HK-ADMIN-GRP',     groupName: 'HK Admin Group',         marketId: 'HK',     bizLineId: 'WEALTH',   groupType: 'ADMIN_GROUP' },
  { groupId: 'GLOBAL-ADMIN-GRP', groupName: 'Global Admin Group',     marketId: 'GLOBAL', bizLineId: 'WEALTH',   groupType: 'ADMIN_GROUP' },
  { groupId: 'HK-AUDIT-GRP',     groupName: 'HK Audit Group',         marketId: 'HK',     bizLineId: 'WEALTH',   groupType: 'AUDIT_GROUP' },
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
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'zh-HK', thumbnail: '💰', tags: ['wealth', 'home', 'hk'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
  slices: [
    {
      instanceId: 'slice-header', type: 'AI_SEARCH_BAR', visible: true, locked: true,
      props: {
        placeholder: '定期存款',
        enableSemanticSearch: true,
        enableQRScan: true,
        enableChatbot: true,
        enableMessageInbox: true,
        searchApiEndpoint: '/api/v1/search/semantic',
      },
    },
    {
      instanceId: 'slice-quick', type: 'QUICK_ACCESS', visible: true, locked: false,
      props: {
        items: [
          { id: 'q1', icon: '🌙', label: '朝朝寶',   deepLink: 'hsbc://wealth/morning-treasure' },
          { id: 'q2', icon: '💵', label: '借錢',     deepLink: 'hsbc://loan/apply' },
          { id: 'q3', icon: '↔️', label: '轉帳',     deepLink: 'hsbc://transfer' },
          { id: 'q4', icon: '📊', label: '賬戶總覽', deepLink: 'hsbc://accounts' },
        ],
      },
    },
    {
      instanceId: 'slice-promo-finance-day', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        title: '10分招財日', subtitle: '查帳單·學投資·優配置',
        ctaLabel: '點擊參與', ctaDeepLink: 'hsbc://campaign/finance-day',
        imageUrl: '', backgroundColor: '#E8F4FD', badgeText: '每月10日開啓',
      },
    },
    {
      instanceId: 'slice-function-grid', type: 'FUNCTION_GRID', visible: true, locked: false,
      props: {
        rows: [
          {
            rowId: 'row-1',
            items: [
              { id: 'fg-1',  icon: '💳', label: '信用卡',   deepLink: 'hsbc://cards' },
              { id: 'fg-2',  icon: '📄', label: '收支明細', deepLink: 'hsbc://statements' },
              { id: 'fg-3',  icon: '🔄', label: '他行卡轉入', deepLink: 'hsbc://transfer/external' },
              { id: 'fg-4',  icon: '🏙️', label: '城市服務', deepLink: 'hsbc://city-services' },
              { id: 'fg-5',  icon: '🔥', label: '熱門活動', deepLink: 'hsbc://events' },
            ],
          },
          {
            rowId: 'row-2',
            items: [
              { id: 'fg-6',  icon: '📈', label: '理財',     deepLink: 'hsbc://wealth' },
              { id: 'fg-7',  icon: 'Ⓜ️', label: 'M+會員',   deepLink: 'hsbc://membership' },
              { id: 'fg-8',  icon: '🎬', label: '影票優惠', deepLink: 'hsbc://movies' },
              { id: 'fg-9',  icon: '💹', label: '基金',     deepLink: 'hsbc://funds' },
              { id: 'fg-10', icon: '⋯',  label: '全部功能', deepLink: 'hsbc://all-services' },
            ],
          },
        ],
      },
    },
    {
      instanceId: 'slice-promo-flash-loan', type: 'PROMO_BANNER', visible: true, locked: false,
      visibilityRule: {
        ruleId: 'rule-flash-loan-mass-or-card',
        label: '閃電貸 — Mass segment OR Credit Card holders OR HK-based',
        conditions: [
          { field: 'customerSegment', operator: 'is',  value: 'mass' },
          { field: 'accountType',     operator: 'is',  value: 'credit_card' },
          { field: 'customerLocation',operator: 'is',  value: 'HK' },
        ],
        conditionLogic: 'OR',
        action: 'show',
      },
      props: {
        title: '閃電貸 — 極速放款', subtitle: '最高可借 HKD 300,000，即批即用',
        ctaLabel: '立即申請', ctaDeepLink: 'hsbc://loan/flash',
        imageUrl: '', backgroundColor: '#FFF7ED', badgeText: '⚡ 閃電放款',
      },
    },
    {
      instanceId: 'slice-wealth-selection', type: 'WEALTH_SELECTION', visible: true, locked: false,
      visibilityRule: {
        ruleId: 'rule-wealth-selection-premier-and-wealth',
        label: '財富精選 — Premier AND Wealth Account (OR Mainland China)',
        conditions: [
          { field: 'customerSegment', operator: 'is', value: 'premier' },
          { field: 'accountType',     operator: 'is', value: 'wealth_account' },
        ],
        conditionLogic: 'AND',
        action: 'show',
      },
      props: {
        sectionTitle: '財富精選',
        products: [
          {
            id: 'w1', productName: '活錢理財｜歷史天天正收益',
            tag: '代碼', yield7Day: '2.80%', riskLevel: 'R1低風險',
            redemption: '贖回T+1到帳', ctaLabel: '去看看',
            ctaDeepLink: 'hsbc://wealth/daily-positive', highlighted: true,
          },
          {
            id: 'w2', productName: '主投債券',
            tag: '代碼', yield7Day: '3.04%', riskLevel: '歷史周周正',
            redemption: '成立以來…', ctaLabel: '查看',
            ctaDeepLink: 'hsbc://wealth/bond-fund',
          },
          {
            id: 'w3', productName: '保本理財 / 年均收益率',
            tag: '保証領取', yield7Day: '2.31%', riskLevel: '穩健低波',
            redemption: '到期領取', ctaLabel: '了解更多',
            ctaDeepLink: 'hsbc://wealth/guaranteed',
          },
        ],
        moreDeepLink: 'hsbc://wealth/all',
      },
    },
    {
      instanceId: 'slice-promo-spring', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        title: '春季播種黃金期', subtitle: '抽體驗禮 | 豐富回報等你發現',
        ctaLabel: '立即參與', ctaDeepLink: 'hsbc://campaign/spring-investment',
        imageUrl: '', backgroundColor: '#F0FDF4', badgeText: '🌱 限時活動',
      },
    },
    {
      instanceId: 'slice-featured-rankings', type: 'FEATURED_RANKINGS', visible: true, locked: false,
      props: {
        sectionTitle: '特色榜單',
        items: [
          {
            rankId: 'r1', icon: '🥇', title: '3322選基 — 優中選優',
            subtitle: '近1年漲跌幅高達318.19%',
            badge: '精選', deepLink: 'hsbc://rankings/top-funds',
          },
          {
            rankId: 'r2', icon: '🔒', title: '穩健省心好選擇 — 固收優選',
            subtitle: '歷史持有3月盈利概率高達98.23%',
            badge: '低風險', deepLink: 'hsbc://rankings/fixed-income',
          },
          {
            rankId: 'r3', icon: '📈', title: '屢創新高榜',
            subtitle: '近3年净值創新高次數達152次',
            badge: '成長', deepLink: 'hsbc://rankings/all-time-high',
          },
        ],
        moreDeepLink: 'hsbc://rankings',
      },
    },
    {
      instanceId: 'slice-promo-campaigns', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        title: '達標抽好禮 — 豐潤守護', subtitle: '健康隨行保障計劃，達標即抽獎',
        ctaLabel: '查看詳情', ctaDeepLink: 'hsbc://campaign/health',
        imageUrl: '', backgroundColor: '#FFF1F2', badgeText: '🎁 專屬禮遇',
      },
    },
    {
      instanceId: 'slice-life-deals', type: 'LIFE_DEALS', visible: true, locked: false,
      props: {
        sectionTitle: '生活特惠',
        deals: [
          { id: 'd1', icon: '🍗', merchant: 'KFC',       title: '單品優惠',   tag: '信用卡優惠', deepLink: 'hsbc://deals/kfc' },
          { id: 'd2', icon: '☕', merchant: '瑞幸咖啡',   title: '5折優惠',    tag: '限時',       deepLink: 'hsbc://deals/luckin' },
          { id: 'd3', icon: '🍦', merchant: 'DQ 冰雪皇后', title: '5折起',     tag: '甜點優惠',   deepLink: 'hsbc://deals/dq' },
          { id: 'd4', icon: '🎬', merchant: '電影優惠',   title: '信用卡折扣', tag: '娛樂',       deepLink: 'hsbc://movies' },
        ],
        moreDeepLink: 'hsbc://deals',
        bottomLinks: [
          { id: 'bl1', label: '更多生活優惠', deepLink: 'hsbc://deals/all' },
          { id: 'bl2', label: '城市服務',     deepLink: 'hsbc://city-services' },
        ],
      },
    },
    {
      instanceId: 'slice-promo-anniversary', type: 'PROMO_BANNER', visible: true, locked: false,
      props: {
        title: '行慶招財日 — 特惠禮遇', subtitle: '銀行週年慶典，專屬優惠等你領取',
        ctaLabel: '了解更多', ctaDeepLink: 'hsbc://campaign/anniversary',
        imageUrl: '', backgroundColor: '#FFFBEB', badgeText: '🏦 週年慶典',
      },
    },
    {
      instanceId: 'slice-ai-assistant', type: 'AI_ASSISTANT', visible: true, locked: false,
      props: { greeting: 'Hi，我是你的智能財富助理', avatarUrl: '' },
    },
  ],
};

export const PAGE_JADE_CAMPAIGN: PageLayout = {
  pageId: 'jade-upgrade-hk', name: 'Jade Upgrade Campaign (HK)',
  pageType: 'CAMPAIGN', description: 'Jade upgrade invitation page for Premier customers',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'zh-HK', thumbnail: '🟡', tags: ['jade', 'wealth', 'campaign'],
  channel: 'WEB_WECHAT', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
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
  pageType: 'CAMPAIGN', description: 'Visa Platinum no-FX campaign for Q3 2026',
  nativeTargets: [], locale: 'en-HK', thumbnail: '💳', tags: ['cards', 'campaign', 'visa'],
  channel: 'WEB_STANDARD', scope: 'GLOBAL', marketId: 'GLOBAL',
  releaseMarketIds: ['GLOBAL', 'HK', 'SG'], bizLineId: 'PAYMENT', groupId: 'GLOBAL-WEALTH-AD',
  authoringStatus: 'DRAFT',
  webSlug: '/credit-cards/visa-platinum-q3',
  webMetaTitle: 'HSBC Visa Platinum – No FX Fee | HSBC',
  webMetaDescription: 'Apply for HSBC Visa Platinum with no foreign transaction fee. Earn rewards globally.',
  slices: [],
};

export const PAGE_OBKYC: PageLayout = {
  pageId: 'obkyc-journey', name: 'OBKYC – Account Opening Journey',
  pageType: 'KYC_JOURNEY', description: 'Open Banking KYC journey — 11-step mobile flow',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'en-HK', thumbnail: '🪪', tags: ['kyc', 'onboarding'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEB_ENABLER', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'DRAFT',
  slices: [
    { instanceId: 'kyc-header', type: 'HEADER_NAV', props: { title: 'Account Opening', searchPlaceholder: 'Search', showNotificationBell: false, showQRScanner: false }, visible: true, locked: true },
  ],
};

export const PAGE_FX_VIEWPOINT: PageLayout = {
  pageId: 'fx-viewpoint-hk', name: 'FX Viewpoint — EUR & GBP (HK)',
  pageType: 'MARKET_INSIGHT', description: 'Market insight page: EUR and GBP analysis — ECB on hold and BoE rate cut. Includes video, briefing text and RM contact CTA.',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'en-HK', thumbnail: '📈', tags: ['fx', 'market-insight', 'eur', 'gbp', 'wealth'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'HK',
  releaseMarketIds: ['HK'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
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
  pageType: 'CAMPAIGN', description: 'Renminbi Savings new fund deposit campaign — elevated time deposit rates with rate table and FAQ.',
  nativeTargets: ['ios', 'android', 'harmonynext'], locale: 'en-CN', thumbnail: '🏦', tags: ['deposit', 'savings', 'campaign', 'renminbi', 'time-deposit'],
  channel: 'SDUI', scope: 'MARKET', marketId: 'CN',
  releaseMarketIds: ['CN'], bizLineId: 'WEALTH', groupId: 'HK-WEALTH-AD',
  authoringStatus: 'APPROVED',
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
}

export const MOCK_JOURNEYS: Journey[] = [
  {
    journeyId: 'journey-obkyc',
    name: 'OBKYC Account Opening',
    description: '11-step open banking KYC flow regulated by HKMA',
    channel: 'SDUI', nativeTargets: ['ios', 'android', 'harmonynext', 'web'], marketId: 'HK', bizLineId: 'WEB_ENABLER', status: 'LIVE',
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
  locale:     'en-HK',
  channel:    'SDUI',
  scope:      'MARKET',
  marketId:   'HK',
  releaseMarketIds: ['HK'],
  bizLineId:  'WEB_ENABLER',
  groupId:    'HK-WEALTH-AD',
  authoringStatus: 'DRAFT',
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
  locale:     'en-HK',
  channel:    'WEB_STANDARD',
  scope:      'MARKET',
  marketId:   'HK',
  releaseMarketIds: ['HK'],
  bizLineId:  'WEB_ENABLER',
  groupId:    'HK-WEALTH-AD',
  authoringStatus: 'DRAFT',
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
];

// ─── Usage Stats ──────────────────────────────────────────────────────────────

export const MOCK_USAGE_STATS: PageUsageStat[] = [
  { pageId: 'visa-platinum-campaign', targetId: 'GLOBAL', daily: 8412,  weekly: 47230,  monthly: 183440, avgSessionSec: 142, bounceRate: 0.34 },
  { pageId: 'visa-platinum-campaign', targetId: 'HK',     daily: 3210,  weekly: 18200,  monthly: 67300,  avgSessionSec: 128, bounceRate: 0.41 },
  { pageId: 'jade-upgrade-hk',        targetId: 'HK',     daily: 3104,  weekly: 18420,  monthly: 62800,  avgSessionSec: 210, bounceRate: 0.22 },
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
  { id: 'j.chan@hsbc.com.hk', name: 'Janet Chan',    email: 'j.chan@hsbc.com.hk', role: 'WEALTH-AUTHOR',   marketId: 'HK',     bizLineId: 'WEALTH',  groupId: 'HK-WEALTH-AD' },
  { id: 'm.wong@hsbc.com.hk', name: 'Michael Wong',  email: 'm.wong@hsbc.com.hk', role: 'WEALTH-APPROVER', marketId: 'HK',     bizLineId: 'WEALTH',  groupId: 'HK-WEALTH-AD' },
  { id: 'k.lee@hsbc.com.hk',  name: 'Karen Lee',     email: 'k.lee@hsbc.com.hk',  role: 'PAYMENT-AUTHOR',  marketId: 'HK',     bizLineId: 'PAYMENT', groupId: 'HK-PAYMENT-AD' },
  { id: 'b.lam@hsbc.com.hk',  name: 'Brian Lam',     email: 'b.lam@hsbc.com.hk',  role: 'ADMIN',           marketId: 'HK',     bizLineId: 'WEALTH',  groupId: 'HK-ADMIN-GRP', isGlobalAdmin: true },
  { id: 's.ng@hsbc.com.hk',   name: 'Sarah Ng',      email: 's.ng@hsbc.com.hk',   role: 'AUDITOR',         marketId: 'HK',     bizLineId: 'WEALTH',  groupId: 'HK-AUDIT-GRP' },
  { id: 'g.author@hsbc.com',  name: 'Global Author', email: 'g.author@hsbc.com',  role: 'WEALTH-AUTHOR',   marketId: 'GLOBAL', bizLineId: 'WEALTH',  groupId: 'GLOBAL-WEALTH-AD' },
];
