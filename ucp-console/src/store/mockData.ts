import { PageLayout, CanvasSlice, WorkflowEntry, AuditEntry, StaffUser } from '../types/ucp';
import { v4 } from '../utils/uuid';
const uuidv4 = v4;

// ─── Mock initial page layout (mirroring Wealth_hub.jpg) ─────────────────────

export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  pageId: 'home-wealth-hk',
  name: 'Home – Wealth Hub (HK)',
  platform: 'ios',
  locale: 'zh-HK',
  slices: [
    {
      instanceId: 'slice-header',
      type: 'HEADER_NAV',
      props: {
        title: '定期存款',
        searchPlaceholder: '搜尋功能、產品',
        showNotificationBell: true,
        showQRScanner: true,
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-quick',
      type: 'QUICK_ACCESS',
      props: {
        items: [
          { id: 'q1', icon: '🌙', label: '朝朝寶', deepLink: 'hsbc://wealth/morning-treasure' },
          { id: 'q2', icon: '💵', label: '借錢',   deepLink: 'hsbc://loan/apply' },
          { id: 'q3', icon: '↔️', label: '轉帳',   deepLink: 'hsbc://transfer' },
          { id: 'q4', icon: '📊', label: '賬戶總覽', deepLink: 'hsbc://accounts' },
        ],
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-promo-10',
      type: 'PROMO_BANNER',
      props: {
        title: '10分招財日',
        subtitle: '查帳單·學投資·優配置',
        ctaLabel: '點擊參與',
        ctaDeepLink: 'hsbc://campaign/finance-day',
        imageUrl: '',
        backgroundColor: '#E8F4FD',
        badgeText: '每月10日開啓',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-func-grid',
      type: 'FUNCTION_GRID',
      props: {
        rows: [
          [
            { id: 'f1', icon: '💳', label: '信用卡',   deepLink: 'hsbc://cards' },
            { id: 'f2', icon: '📄', label: '收支明細', deepLink: 'hsbc://statements' },
            { id: 'f3', icon: '🔄', label: '他行卡轉入', deepLink: 'hsbc://transfer/external' },
            { id: 'f4', icon: '🏙️', label: '城市服務', deepLink: 'hsbc://city-services' },
            { id: 'f5', icon: '🔥', label: '熱門活動', deepLink: 'hsbc://events' },
          ],
          [
            { id: 'f6', icon: '📈', label: '理財',     deepLink: 'hsbc://wealth' },
            { id: 'f7', icon: 'Ⓜ️', label: 'M+會員',  deepLink: 'hsbc://membership' },
            { id: 'f8', icon: '🎬', label: '影票',     deepLink: 'hsbc://movies' },
            { id: 'f9', icon: '💹', label: '基金',     deepLink: 'hsbc://funds' },
            { id: 'f10', icon: '⋯', label: '全部',    deepLink: 'hsbc://all-services' },
          ],
        ],
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-ai',
      type: 'AI_ASSISTANT',
      props: {
        greeting: 'Hi，我是你的智能財富助理',
        avatarUrl: '',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-ad-spring',
      type: 'AD_BANNER',
      props: {
        title: '春季播種黃金期',
        subtitle: '配置正當時，播下「金種子」',
        ctaLabel: '抽體驗禮',
        ctaDeepLink: 'hsbc://campaign/spring-investment',
        imageUrl: '',
        dismissible: true,
        validUntil: '2025-06-30',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-flash-loan',
      type: 'FLASH_LOAN',
      props: {
        productName: '閃電貸 極速放款',
        tagline: '最高可借額度',
        maxAmount: 300000,
        currency: 'HKD',
        ctaLabel: '獲取額度',
        ctaDeepLink: 'hsbc://loan/flash',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-wealth-sel',
      type: 'WEALTH_SELECTION',
      props: {
        sectionTitle: '財富精選',
        products: [
          {
            id: 'w1',
            productName: '活錢理財｜歷史天天正收益',
            tag: '代碼',
            yield7Day: '2.80%',
            riskLevel: 'R1低風險',
            redemption: '贖回T+1到帳',
            ctaLabel: '去看看',
            ctaDeepLink: 'hsbc://wealth/daily-positive',
            highlighted: true,
          },
          {
            id: 'w2',
            productName: '主投債券',
            tag: '代碼',
            yield7Day: '3.04%',
            riskLevel: '歷史周周正',
            redemption: '成立以來…',
            ctaLabel: '查看',
            ctaDeepLink: 'hsbc://wealth/bond-fund',
          },
          {
            id: 'w3',
            productName: '年均收益率',
            tag: '收益確定',
            yield7Day: '2.31%',
            riskLevel: '保証領取',
            redemption: '穩健低波',
            ctaLabel: '查看',
            ctaDeepLink: 'hsbc://wealth/guaranteed',
          },
        ],
        moreDeepLink: 'hsbc://wealth/all',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-rankings',
      type: 'FEATURED_RANKINGS',
      props: {
        sectionTitle: '特色榜單',
        items: [
          {
            id: 'r1',
            icon: '🥇',
            badge: '優中選優',
            title: '3322選基',
            description: '近1年漲跌幅高達318.19%',
            ctaDeepLink: 'hsbc://rankings/top-funds',
          },
          {
            id: 'r2',
            icon: '🔒',
            badge: '固收優選',
            title: '穩健省心好選擇',
            description: '歷史持有3月盈利概率高達98.23%',
            ctaDeepLink: 'hsbc://rankings/fixed-income',
          },
          {
            id: 'r3',
            icon: '📈',
            badge: '屢創新高',
            title: '屢創新高榜',
            description: '近3年净值創新高次數達152',
            ctaDeepLink: 'hsbc://rankings/all-time-high',
          },
        ],
        moreDeepLink: 'hsbc://rankings/all',
      },
      visible: true,
      locked: false,
    },
    {
      instanceId: 'slice-life-deals',
      type: 'LIFE_DEALS',
      props: {
        sectionTitle: '生活特惠',
        deals: [
          { id: 'd1', brandName: 'KFC',          logoUrl: '', tag: '單品優惠',  ctaDeepLink: 'hsbc://deals/kfc' },
          { id: 'd2', brandName: 'Luckin Coffee', logoUrl: '', tag: '5折喝瑞幸', ctaDeepLink: 'hsbc://deals/luckin' },
          { id: 'd3', brandName: 'DQ',            logoUrl: '', tag: '5折起',     ctaDeepLink: 'hsbc://deals/dq' },
        ],
        moreDeepLink: 'hsbc://deals/all',
        bottomLinks: [
          { label: '達標抽好禮\n丰润守护 健康随行', icon: '🎁', deepLink: 'hsbc://campaign/health' },
          { label: '行庆招财日\n享受特惠禮遇',       icon: '🏦', deepLink: 'hsbc://campaign/anniversary' },
        ],
      },
      visible: true,
      locked: false,
    },
  ],
};

// ─── Mock workflow entries ────────────────────────────────────────────────────

export const MOCK_WORKFLOW_ENTRIES: WorkflowEntry[] = [
  {
    entryId: 'wf-001',
    pageId: 'home-wealth-hk',
    pageName: 'Home – Wealth Hub (HK)',
    status: 'DRAFT',
    authorId: 'j.chan@hsbc.com.hk',
    authorName: 'Janet Chan',
    comments: [],
    layout: DEFAULT_PAGE_LAYOUT,
    version: 1,
  },
];

// ─── Mock audit log ───────────────────────────────────────────────────────────

export const MOCK_AUDIT: AuditEntry[] = [
  {
    id: 'a-001',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    actorId: 'j.chan@hsbc.com.hk',
    actorRole: 'WEALTH-AUTHOR',
    action: 'PAGE_CREATED',
    pageId: 'home-wealth-hk',
    pageName: 'Home – Wealth Hub (HK)',
    details: 'Initial page draft created',
  },
];

// ─── Staff user roster ────────────────────────────────────────────────────────

export const MOCK_USERS: StaffUser[] = [
  { id: 'j.chan@hsbc.com.hk',  name: 'Janet Chan',  email: 'j.chan@hsbc.com.hk',  role: 'WEALTH-AUTHOR'   },
  { id: 'm.wong@hsbc.com.hk',  name: 'Michael Wong', email: 'm.wong@hsbc.com.hk', role: 'WEALTH-APPROVER' },
  { id: 'k.lee@hsbc.com.hk',   name: 'Karen Lee',   email: 'k.lee@hsbc.com.hk',   role: 'CARDS-AUTHOR'   },
  { id: 'b.lam@hsbc.com.hk',   name: 'Brian Lam',   email: 'b.lam@hsbc.com.hk',   role: 'ADMIN'          },
];
