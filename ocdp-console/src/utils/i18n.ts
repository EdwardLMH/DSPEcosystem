// ─── i18n / Localisation Utilities ───────────────────────────────────────────

export interface LocaleInfo {
  code: string;
  label: string;
  dir: 'ltr' | 'rtl';
  lang: string; // BCP-47 lang attribute
}

/** Language-level locales used by the authoring tools. */
export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en',    label: 'English',   dir: 'ltr', lang: 'en'    },
  { code: 'zh-TW', label: '繁體中文',  dir: 'ltr', lang: 'zh-Hant' },
  { code: 'zh-CN', label: '简体中文',  dir: 'ltr', lang: 'zh-Hans' },
  { code: 'ar',    label: 'العربية',  dir: 'rtl', lang: 'ar'    },
  { code: 'es',    label: 'Español',   dir: 'ltr', lang: 'es'    },
];

export function getLocaleInfo(code: string): LocaleInfo {
  return SUPPORTED_LOCALES.find(l => l.code === code) ?? SUPPORTED_LOCALES[0];
}

export function getLocaleDir(code: string): 'ltr' | 'rtl' {
  return getLocaleInfo(code).dir;
}

/**
 * Converts a country+language BCP-47 tag to the authoring language code.
 * e.g. 'en-HK' → 'en', 'zh-HK' → 'zh-TW', 'zh-Hant-HK' → 'zh-TW'
 */
export function toLangCode(bcp47: string): string {
  if (!bcp47) return 'en';
  const lower = bcp47.toLowerCase();
  if (lower.startsWith('zh-hant') || lower === 'zh-hk' || lower === 'zh-tw') return 'zh-TW';
  if (lower.startsWith('zh-hans') || lower === 'zh-cn' || lower === 'zh-sg') return 'zh-CN';
  if (lower.startsWith('zh')) return 'zh-TW';
  if (lower.startsWith('ar')) return 'ar';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return SUPPORTED_LOCALES.find(l => lower.startsWith(l.code.toLowerCase()))?.code ?? 'en';
}

// ─── Mock translation dictionary ─────────────────────────────────────────────

type TranslationMap = Record<string, string>;

const DICT: Record<string, TranslationMap> = {
  'zh-TW': {
    'apply now': '立即申請',
    'learn more': '了解更多',
    'contact your rm': '聯絡您的理財顧問',
    'connect with your advisor': '與您的顧問聯繫',
    'view all': '查看全部',
    'search': '搜尋',
    'open a deposit': '開立存款',
    'time deposit rate:': '定期存款利率：',
    'frequently asked questions': '常見問題',
    'why choose this card?': '為何選擇此信用卡？',
    'compare cards': '比較信用卡',
    'key takeaways': '要點',
    'past performance is not...': '過往表現並不代表將來表現。',
    'getting started': '開始使用',
    'open investment account and complete the following quests to enjoy reward!': '開立投資帳戶並完成以下任務以享受獎勵！',
    'check out all 4 quests': '查看全部4個任務',
    'feature product': '精選產品',
    'premier elite wealth studio': '尊尚卓越財富學堂',
    'guides and insights': '指南與洞見',
    'fx watchlist': '外匯觀察清單',
    'discover more': '探索更多',
    'hsbc premier': '匯豐卓越理財',
    'hsbc elite': '匯豐卓越尊尚',
    'hsbc advance': '匯豐進步計劃',
    'hsbc personal banking': '匯豐個人銀行',
    'account overview': '帳戶概覽',
    'transfer globally': '環球轉帳',
    'foreign exchange': '外匯兌換',
    'trade stock': '股票交易',
    'time deposit': '定期存款',
    'scan to pay': '掃描付款',
    'all product & services': '所有產品及服務',
    'your card needs to be activated': '您的信用卡需要啟動',
    'search functions, products & content': '搜尋功能、產品及內容',
    'takes 5 minutes': '只需5分鐘',
    'first year fee waived': '首年免年費',
    'step 1 of': '第1步，共',
  },
  'zh-CN': {
    'apply now': '立即申请',
    'learn more': '了解更多',
    'contact your rm': '联系您的理财顾问',
    'connect with your advisor': '与您的顾问联系',
    'view all': '查看全部',
    'search': '搜索',
    'open a deposit': '开立存款',
    'time deposit rate:': '定期存款利率：',
    'frequently asked questions': '常见问题',
    'why choose this card?': '为何选择此信用卡？',
    'compare cards': '比较信用卡',
    'key takeaways': '要点',
    'getting started': '开始使用',
    'feature product': '精选产品',
    'guides and insights': '指南与洞见',
    'fx watchlist': '外汇观察列表',
    'hsbc premier': '汇丰卓越理财',
    'hsbc elite': '汇丰卓越尊尚',
    'hsbc advance': '汇丰进步计划',
    'hsbc personal banking': '汇丰个人银行',
    'account overview': '账户概览',
    'transfer globally': '环球转账',
    'foreign exchange': '外汇兑换',
    'trade stock': '股票交易',
    'time deposit': '定期存款',
    'scan to pay': '扫码付款',
    'all product & services': '所有产品及服务',
    'search functions, products & content': '搜索功能、产品及内容',
  },
  ar: {
    'apply now': 'قدِّم الآن',
    'learn more': 'اعرف المزيد',
    'contact your rm': 'تواصل مع مستشارك',
    'connect with your advisor': 'تواصل مع مستشارك المالي',
    'view all': 'عرض الكل',
    'search': 'بحث',
    'open a deposit': 'فتح وديعة',
    'time deposit rate:': 'معدل الوديعة الثابتة:',
    'frequently asked questions': 'الأسئلة الشائعة',
    'key takeaways': 'النقاط الرئيسية',
    'getting started': 'البدء',
    'feature product': 'المنتجات المميزة',
    'guides and insights': 'الأدلة والرؤى',
    'fx watchlist': 'قائمة مراقبة العملات',
    'hsbc premier': 'HSBC بريمير',
    'hsbc elite': 'HSBC النخبة',
    'account overview': 'نظرة عامة على الحساب',
    'foreign exchange': 'صرف العملات الأجنبية',
    'trade stock': 'تداول الأسهم',
    'time deposit': 'وديعة ثابتة',
    'scan to pay': 'مسح للدفع',
    'search functions, products & content': 'بحث في الوظائف والمنتجات والمحتوى',
    'takes 5 minutes': 'يستغرق 5 دقائق',
    'first year fee waived': 'إعفاء من رسوم السنة الأولى',
  },
  es: {
    'apply now': 'Solicitar ahora',
    'learn more': 'Saber más',
    'contact your rm': 'Contacta a tu asesor',
    'connect with your advisor': 'Conecta con tu asesor financiero',
    'view all': 'Ver todo',
    'search': 'Buscar',
    'open a deposit': 'Abrir depósito',
    'time deposit rate:': 'Tasa de depósito a plazo:',
    'frequently asked questions': 'Preguntas frecuentes',
    'key takeaways': 'Puntos clave',
    'getting started': 'Comenzar',
    'feature product': 'Producto destacado',
    'guides and insights': 'Guías y perspectivas',
    'hsbc premier': 'HSBC Premier',
    'account overview': 'Resumen de cuenta',
    'foreign exchange': 'Divisas',
    'trade stock': 'Operar acciones',
    'time deposit': 'Depósito a plazo',
    'scan to pay': 'Escanear para pagar',
    'takes 5 minutes': 'Solo 5 minutos',
    'first year fee waived': 'Sin cuota el primer año',
  },
};

export function mockTranslate(text: string, targetLocale: string): string {
  if (!text || targetLocale === 'en') return text;
  const map = DICT[targetLocale];
  if (!map) return text;
  const lower = text.trim().toLowerCase();
  if (map[lower]) return map[lower];
  for (const [key, val] of Object.entries(map)) {
    if (lower === key) return val;
  }
  return `[${targetLocale}] ${text}`;
}

export const TRANSLATABLE_PROP_KEYS: Record<string, string[]> = {
  HEADER_NAV: ['title', 'searchPlaceholder'],
  AI_SEARCH_BAR: ['placeholder'],
  PROMO_BANNER: ['headline', 'subHeadline', 'ctaLabel'],
  AD_BANNER: ['title', 'subtitle', 'ctaLabel'],
  FLASH_LOAN: ['productName', 'tagline', 'ctaLabel'],
  WEALTH_SELECTION: ['sectionTitle'],
  FEATURED_RANKINGS: ['sectionTitle'],
  LIFE_DEALS: ['sectionTitle'],
  VIDEO_PLAYER: ['title', 'presenterName', 'presenterTitle'],
  MARKET_BRIEFING_TEXT: ['sectionTitle', 'disclaimer'],
  CONTACT_RM_CTA: ['label', 'subLabel'],
  DEPOSIT_RATE_TABLE: ['sectionTitle', 'footnote'],
  DEPOSIT_OPEN_CTA: ['label'],
  DEPOSIT_FAQ: ['sectionTitle'],
  ANNOUNCEMENT_OVERLAY: ['title', 'legalEntityText'],
  ANNOUNCEMENT_VISUAL: ['altText'],
  ANNOUNCEMENT_BODY: ['headline', 'dontShowAgainLabel', 'legalEntityText'],
  CAMPAIGN_HERO: ['headline', 'subHeadline', 'badge'],
  CAMPAIGN_BENEFITS: ['sectionTitle'],
  CAMPAIGN_CTA: ['ctaLabel', 'ctaSubtext', 'offerBadge', 'secondaryLabel'],
  HOME_SEARCH_HEADER: ['premierLabel', 'eliteLabel', 'advanceLabel', 'massLabel', 'placeholder'],
  PREMIER_HEADER: ['brandLabel'],
  ELITE_HEADER: ['brandLabel'],
  ADVANCE_HEADER: ['brandLabel'],
  MASS_HEADER: ['brandLabel'],
  HOME_SEARCH_BAR: ['placeholder'],
  CARD_ACTIVATION_BANNER: ['message'],
  QUEST_BANNER: ['title', 'description', 'ctaLabel'],
  FEATURE_PRODUCT: ['sectionTitle', 'moreLabel'],
  WEALTH_STUDIO_CAROUSEL: ['sectionTitle', 'moreLabel'],
  GUIDES_INSIGHTS_CAROUSEL: ['sectionTitle', 'moreLabel'],
  FX_WATCHLIST: ['sectionTitle', 'tierBadge'],
  DISCOVER_MORE_CAROUSEL: ['sectionTitle'],
};

export function translateSliceProps(
  props: Record<string, unknown>,
  textKeys: string[],
  targetLocale: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of textKeys) {
    const val = props[key];
    if (typeof val === 'string' && val.trim()) {
      result[key] = mockTranslate(val, targetLocale);
    }
  }
  return result;
}

export function getSliceProps(
  sliceProps: Record<string, unknown>,
  instanceId: string,
  translations: Record<string, Record<string, Record<string, string>>> | undefined,
  locale: string,
  primaryLocale: string,
): Record<string, unknown> {
  if (locale === primaryLocale || !translations) return sliceProps;
  const localeMap = translations[locale]?.[instanceId] ?? {};
  return { ...sliceProps, ...localeMap };
}
