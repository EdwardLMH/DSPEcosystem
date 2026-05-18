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
  { code: 'zh-HK', label: '繁體中文（香港）',  dir: 'ltr', lang: 'zh-Hant-HK' },
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
 * e.g. 'en-HK' → 'en', 'zh-HK' → 'zh-HK', 'zh-Hant-HK' → 'zh-HK'
 */
export function toLangCode(bcp47: string): string {
  if (!bcp47) return 'en';
  const lower = bcp47.toLowerCase();
  if (lower.startsWith('zh-hant') || lower === 'zh-hk' || lower === 'zh-tw') return 'zh-HK';
  if (lower.startsWith('zh-hans') || lower === 'zh-cn' || lower === 'zh-sg') return 'zh-CN';
  if (lower.startsWith('zh')) return 'zh-HK';
  if (lower.startsWith('ar')) return 'ar';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return SUPPORTED_LOCALES.find(l => lower.startsWith(l.code.toLowerCase()))?.code ?? 'en';
}

// ─── Mock translation dictionary ─────────────────────────────────────────────

type TranslationMap = Record<string, string>;

const DICT: Record<string, TranslationMap> = {
  en: {
    '人民币存款优惠': 'Renminbi Savings Offers',
    '年化利率最高 1.15%': 'Up to 1.15% p.a. Annual Equivalent Rate',
    '3个月人民币新资金可转让存单优惠，适用于符合条件的新转入资金。把握限时机会，让闲置资金更有效运用。': '3-Month New Fund CNY Transferable CD exclusively for new deposits. Start earning more with HSBC China today.',
    '仅限新资金': 'New funds only',
    '定期存款利率': 'Time Deposit Rates',
    '个人银行客户定期存款起存金额为人民币50元。新资金指符合条件的新转入汇丰中国资金。利率仅供参考，并可能不时调整。': 'Minimum balance for Personal Banking customers is RMB50. New Fund refers to eligible funds newly deposited with HSBC China. Rates are for reference only and are subject to change.',
    '立即开立存款': 'Open a Deposit',
    '常见问题': 'Frequently Asked Questions',
    '存款保险': 'Deposit Insurance',
    '存款保险标识': 'Deposit Insurance logo',
    '© 版权所有。汇丰银行（中国）有限公司2026': '© Copyright. HSBC Bank (China) Company Limited 2026',
    '沪公网安备 31011502400282号': 'Shanghai public security filing No. 31011502400282',
    '沪ICP备15029387-3号': 'Shanghai ICP No. 15029387-3',
    '定期存款到期前可以提前支取吗？': 'Can I withdraw a time deposit before maturity?',
    '可以。提前支取可能无法享受原定利率，利息可能减少或为零，并可能产生相关费用。具体规则以汇丰中国实际办理要求为准。': 'Yes. Early withdrawal may mean the original rate no longer applies, interest may be reduced or zero, and fees may apply. Please refer to HSBC China requirements at the time of handling.',
    '到期后没有支取会怎样？': 'What happens if I do not withdraw at maturity?',
    '您可在办理时选择到期处理方式，例如到期支取或自动续存。自动续存时通常将按续存当日适用利率执行。': 'You can choose maturity instructions when opening the deposit, such as withdrawal at maturity or automatic renewal. Automatic renewal normally uses the rate applicable on the renewal date.',
    '可选择哪些存期？': 'Which tenors are available?',
    '常见存期包括3个月、6个月、12个月、24个月、36个月及60个月。不同存期对应不同利率，您可根据资金安排选择。': 'Common tenors include 3, 6, 12, 24, 36 and 60 months. Different tenors have different rates, so you can choose based on your funding plan.',
    '为什么定期存款利率通常高于活期存款？': 'Why are time deposit rates usually higher than current account rates?',
    '定期存款在约定期限内保持资金稳定，因此银行通常可提供高于活期存款的利率。实际利率以办理时页面或网点公示为准。': 'Time deposits keep funds stable for an agreed tenor, so banks can usually offer rates higher than current account deposits. Actual rates are subject to the page or branch notice at the time of handling.',
  },
  'zh-HK': {
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
    'special announcement': '特別通知',
    'hsbc special announcement envelope illustration': '滙豐特別通知信封插圖',
    "your well-being is our priority. we're committed to supporting our customers affected by the tai po fire incident.": '您的安康是我們的首要考慮。我們致力支援受大埔火災事故影響的客戶。',
    'if you need urgent assistance, please contact the following dedicated hotlines:': '如您需要緊急協助，請致電以下專線：',
    'hsbc banking services / hsbc life insurance': '滙豐銀行服務 / 滙豐人壽保險',
    'hsbc general insurance (operated by axa)': '滙豐一般保險（由安盛承保）',
    "don't show this message again": '不再顯示此訊息',
    'close': '關閉',
    'hsbc website': '滙豐網站',
    'the hongkong and shanghai banking corporation limited': '香港上海滙豐銀行有限公司',
    'get ready for elaisee': '準備使用 eLaisee',
    'elaisee feature artwork': 'eLaisee 功能插圖',
    'enjoy chinese new year by sending elaisee money with customised messages, 24 hours a day, in an eco-friendlier way.': '透過 eLaisee 送出自訂祝福訊息及利是，全天候以更環保方式歡度農曆新年。',
    'make sure your app is up to date to use the new feature.': '請確保您的應用程式已更新，以使用此新功能。',
    'update now': '立即更新',
    'fx viewpoint': '外匯觀點',
    'fx viewpoint — eur & gbp market insights (may 2026)': '外匯觀點 — 歐元及英鎊市場洞察（2026年5月）',
    'jackie wong': 'Jackie Wong',
    'fx strategist, hsbc global research': '滙豐環球研究外匯策略師',
    'a weak usd is likely to persist into 2026, providing temporary support for the eur and gbp.': '美元偏弱的走勢可能延續至2026年，為歐元及英鎊提供短暫支持。',
    'with the ecb expected to maintain its policy rate in 2026, the eur should remain broadly stable.': '由於市場預期歐洲央行於2026年維持政策利率，歐元應會大致保持穩定。',
    'boe delivered a 25 bps cut in may 2026 — further easing is data-dependent and market pricing appears stretched.': '英倫銀行於2026年5月減息25個基點，後續寬鬆將取決於數據，而市場定價看來偏高。',
    'gbp/usd faces near-term resistance at 1.3200 amid mixed uk growth signals.': '在英國增長訊號好壞參半下，英鎊兌美元短期於1.3200附近面臨阻力。',
    'investors should consider diversified fx exposure to manage downside risk against a volatile usd backdrop.': '在美元波動的背景下，投資者可考慮分散外匯配置，以管理下行風險。',
    'this material is issued by hsbc and is for information purposes only. it does not constitute investment advice or a recommendation to buy or sell any financial instrument.': '本資料由滙豐發出，僅供參考，並不構成投資建議或買賣任何金融工具的推薦。',
    'speak to your relationship manager about fx opportunities': '向您的客戶經理了解外匯機會',
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
    'special announcement': '特别通知',
    'hsbc special announcement envelope illustration': '汇丰特别通知信封插图',
    "your well-being is our priority. we're committed to supporting our customers affected by the tai po fire incident.": '您的安康是我们的首要考虑。我们致力于支持受大埔火灾事故影响的客户。',
    'if you need urgent assistance, please contact the following dedicated hotlines:': '如您需要紧急协助，请联系以下专线：',
    'hsbc banking services / hsbc life insurance': '汇丰银行服务 / 汇丰人寿保险',
    'hsbc general insurance (operated by axa)': '汇丰一般保险（由安盛承保）',
    "don't show this message again": '不再显示此消息',
    'close': '关闭',
    'hsbc website': '汇丰网站',
    'the hongkong and shanghai banking corporation limited': '香港上海汇丰银行有限公司',
    'get ready for elaisee': '准备使用 eLaisee',
    'elaisee feature artwork': 'eLaisee 功能插图',
    'enjoy chinese new year by sending elaisee money with customised messages, 24 hours a day, in an eco-friendlier way.': '通过 eLaisee 发送带有自定义祝福的电子利是，全天候以更环保的方式欢度农历新年。',
    'make sure your app is up to date to use the new feature.': '请确保您的应用程序已更新，以使用此新功能。',
    'update now': '立即更新',
    'fx viewpoint': '外汇观点',
    'fx viewpoint — eur & gbp market insights (may 2026)': '外汇观点 — 欧元及英镑市场洞察（2026年5月）',
    'jackie wong': 'Jackie Wong',
    'fx strategist, hsbc global research': '汇丰环球研究外汇策略师',
    'a weak usd is likely to persist into 2026, providing temporary support for the eur and gbp.': '美元偏弱的走势可能延续至2026年，为欧元及英镑提供短期支持。',
    'with the ecb expected to maintain its policy rate in 2026, the eur should remain broadly stable.': '由于市场预期欧洲央行将在2026年维持政策利率，欧元应会大致保持稳定。',
    'boe delivered a 25 bps cut in may 2026 — further easing is data-dependent and market pricing appears stretched.': '英格兰银行于2026年5月降息25个基点，后续宽松将取决于数据，而市场定价看起来偏高。',
    'gbp/usd faces near-term resistance at 1.3200 amid mixed uk growth signals.': '在英国增长信号好坏参半的情况下，英镑兑美元短期在1.3200附近面临阻力。',
    'investors should consider diversified fx exposure to manage downside risk against a volatile usd backdrop.': '在美元波动的背景下，投资者可考虑分散外汇配置，以管理下行风险。',
    'this material is issued by hsbc and is for information purposes only. it does not constitute investment advice or a recommendation to buy or sell any financial instrument.': '本资料由汇丰发布，仅供参考，并不构成投资建议或买卖任何金融工具的推荐。',
    'speak to your relationship manager about fx opportunities': '向您的客户经理了解外汇机会',
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
  if (!text) return text;
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
  PROMO_BANNER: ['headline', 'subHeadline', 'title', 'subtitle', 'badgeText', 'ctaLabel', 'altText'],
  AD_BANNER: ['title', 'subtitle', 'ctaLabel'],
  FLASH_LOAN: ['productName', 'tagline', 'ctaLabel'],
  WEALTH_SELECTION: ['sectionTitle'],
  FEATURED_RANKINGS: ['sectionTitle'],
  LIFE_DEALS: ['sectionTitle'],
  VIDEO_PLAYER: ['title', 'presenterName', 'presenterTitle'],
  MARKET_BRIEFING_TEXT: ['sectionTitle', 'bulletPoints', 'disclaimer'],
  CONTACT_RM_CTA: ['label', 'subLabel'],
  DEPOSIT_RATE_TABLE: ['sectionTitle', 'footnote'],
  DEPOSIT_OPEN_CTA: ['label'],
  DEPOSIT_FAQ: ['sectionTitle', 'items.question', 'items.answer'],
  DEPOSIT_INSURANCE: ['title', 'altText'],
  JSON_LD_STRUCTURED_DATA: ['copyrightText', 'publicSecurityText', 'icpText'],
  ANNOUNCEMENT_OVERLAY: ['title', 'body', 'hotlines.label', 'dontShowAgain.label', 'actions.label', 'visual.altText', 'legalEntityText'],
  ANNOUNCEMENT_VISUAL: ['altText'],
  ANNOUNCEMENT_BODY: ['headline', 'paragraphs', 'bulletItems', 'hotlines.label', 'dontShowAgainLabel', 'legalEntityText'],
  ANNOUNCEMENT_ACTIONS: ['primaryAction.label', 'secondaryAction.label', 'tertiaryAction.label'],
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
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of textKeys) {
    const path = key.split('.');
    const rootKey = path[0];
    const val = props[rootKey];
    if (typeof val === 'string' && val.trim()) {
      result[rootKey] = mockTranslate(val, targetLocale);
      continue;
    }
    if (Array.isArray(val)) {
      if (path.length === 1) {
        result[rootKey] = val.map(item => typeof item === 'string' && item.trim() ? mockTranslate(item, targetLocale) : item);
        continue;
      }
      const field = path[1];
      const existingItems = Array.isArray(result[rootKey])
        ? [...(result[rootKey] as unknown[])]
        : val.map(item => typeof item === 'object' && item !== null ? { ...(item as Record<string, unknown>) } : item);
      result[rootKey] = existingItems.map((item, index) => {
        if (typeof item !== 'object' || item === null) return item;
        const sourceItem = val[index] as Record<string, unknown>;
        const nestedVal = sourceItem[field];
        return typeof nestedVal === 'string' && nestedVal.trim()
          ? { ...(item as Record<string, unknown>), [field]: mockTranslate(nestedVal, targetLocale) }
          : item;
      });
      continue;
    }
    if (path.length === 2 && typeof val === 'object' && val !== null) {
      const field = path[1];
      const sourceObject = val as Record<string, unknown>;
      const nestedVal = sourceObject[field];
      if (typeof nestedVal === 'string' && nestedVal.trim()) {
        result[rootKey] = {
          ...(typeof result[rootKey] === 'object' && result[rootKey] !== null ? result[rootKey] as Record<string, unknown> : sourceObject),
          [field]: mockTranslate(nestedVal, targetLocale),
        };
      }
    }
  }
  return result;
}

export function getSliceProps(
  sliceProps: Record<string, unknown>,
  instanceId: string,
  translations: Record<string, Record<string, Record<string, unknown>>> | undefined,
  locale: string,
  primaryLocale: string,
): Record<string, unknown> {
  if (locale === primaryLocale || !translations) return sliceProps;
  const localeMap = translations[locale]?.[instanceId] ?? {};
  return { ...sliceProps, ...localeMap };
}
