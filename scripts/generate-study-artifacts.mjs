import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = String(process.env.STUDY_BFF_PORT || 4100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_JSON = path.join(ROOT, 'study-json');
const OUT_HTML = path.join(ROOT, 'study-html');

const obkycArtifacts = [
  { file: 'obkyc-journeys/obkyc-ios-journey.json', platform: 'ios', channel: 'SDUI', locale: 'en' },
  { file: 'obkyc-journeys/obkyc-android-journey.json', platform: 'android', channel: 'SDUI', locale: 'en' },
  { file: 'obkyc-journeys/obkyc-harmonynext-journey.json', platform: 'harmonynext', channel: 'SDUI', locale: 'en' },
  { file: 'obkyc-journeys/obkyc-web-journey.json', platform: 'web', channel: 'WEB_STANDARD', locale: 'en' },
];

const jsonArtifacts = [
  {
    file: 'harmonynext-hk-pages/home-hub-hk.json',
    url: '/api/v1/screen/home-hub-hk',
    headers: { 'x-platform': 'harmonynext', 'x-channel': 'SDUI', 'x-locale': 'en' },
  },
  {
    file: 'harmonynext-hk-pages/fx-viewpoint-hk.json',
    url: '/api/v1/screen/fx-viewpoint-hk',
    headers: { 'x-platform': 'all', 'x-channel': 'SDUI', 'x-locale': 'en' },
  },
  {
    file: 'harmonynext-hk-pages/announcement-overlay-hk.json',
    url: '/api/v1/screen/announcement-overlay-hk',
    headers: { 'x-platform': 'all', 'x-channel': 'SDUI', 'x-locale': 'en' },
  },
  {
    file: 'harmonynext-hk-pages/announcement-force-update-hk.json',
    url: '/api/v1/screen/announcement-force-update-hk',
    headers: { 'x-platform': 'all', 'x-channel': 'SDUI', 'x-locale': 'en' },
  },
  {
    file: 'ocdp-pages/deposit-campaign-cn.json',
    url: '/api/v1/screen/deposit-campaign-cn',
    headers: { 'x-platform': 'harmonynext', 'x-channel': 'SDUI', 'x-locale': 'zh-CN' },
  },
  {
    file: 'ocdp-pages/deposit-campaign-cn-web-sdui.json',
    url: '/api/v1/screen/deposit-campaign-cn',
    headers: { 'x-platform': 'web', 'x-channel': 'SDUI', 'x-locale': 'zh-CN' },
  },
  {
    file: 'ocdp-pages/deposit-campaign-cn-web-standard.json',
    url: '/api/v1/screen/deposit-campaign-cn',
    headers: { 'x-platform': 'web', 'x-channel': 'WEB_STANDARD', 'x-locale': 'zh-CN' },
  },
];

const englishDepositTranslations = {
  'dep-header': { title: 'Renminbi Deposit Offer' },
  'dep-cd-rate-banner': {
    title: 'Up to 1.15% p.a.',
    subtitle: '3-month RMB new-fund negotiable certificate of deposit offer, available for eligible newly transferred funds. Capture this limited-time opportunity and put idle funds to work.',
    badgeText: 'New funds only',
  },
  'dep-rate-table': {
    sectionTitle: 'Time deposit rates',
    footnote: 'Minimum time deposit balance for Personal Banking customers is RMB50. New funds refer to eligible funds newly transferred to HSBC China. Rates are for reference only and may change from time to time.',
    termLabel: 'Term',
    rateLabel: 'Interest rate (p.a.)',
    asAtPrefix: 'As at',
    rates: [
      { term: '3-month time deposit' },
      { term: '6-month time deposit' },
      { term: '12-month time deposit' },
      { term: '24-month time deposit' },
      { term: '36-month time deposit' },
      { term: '60-month time deposit' },
    ],
  },
  'dep-open-cta': {
    label: 'Open a Deposit',
    note: 'Deep link: opens the HSBC China mobile banking deposit module; if the app is not installed, customers are sent to the relevant app download channel.',
  },
  'dep-faq': {
    sectionTitle: 'Frequently Asked Questions',
    items: [
      {
        question: 'Can I withdraw my time deposit before maturity?',
        answer: 'Yes. Early withdrawal may mean the original interest rate no longer applies. Interest may be reduced or become zero, and related fees may apply. Please refer to HSBC China’s handling requirements at the time of transaction.',
      },
      {
        question: 'What happens if I do not withdraw at maturity?',
        answer: 'You can choose the maturity instruction when placing the deposit, such as withdrawal at maturity or automatic renewal. If renewed automatically, the applicable rate on the renewal date will usually apply.',
      },
      {
        question: 'Which tenors are available?',
        answer: 'Common tenors include 3 months, 6 months, 12 months, 24 months, 36 months and 60 months. Different tenors carry different rates, so you can choose based on your funding plan.',
      },
      {
        question: 'Why are time deposit rates usually higher than current deposit rates?',
        answer: 'Time deposits keep funds stable for an agreed period, so banks can usually offer a higher rate than current deposits. The actual rate is subject to the page or branch announcement at the time of transaction.',
      },
    ],
  },
  'dep-insurance': { title: 'Deposit Insurance', altText: 'Deposit Insurance logo' },
};

const htmlArtifacts = [
  {
    file: 'ocdp-pages/new-fund-deposit-campaign-cn-zh-cn.html',
    locale: 'zh-CN',
    title: '新资金定期存款推广（中国）- OCDP 静态预览',
    description: 'OCDP 新资金定期存款推广（中国）页面的简体中文静态 HTML 学习预览。',
  },
  {
    file: 'ocdp-pages/new-fund-deposit-campaign-cn.html',
    locale: 'en',
    title: 'New Fund Deposit Campaign (CN) - OCDP Static Preview',
    description: 'Static HTML study preview for the OCDP New Fund Deposit Campaign (CN) page.',
  },
];

function startBff() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(ROOT, 'mock-bff'),
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', data => process.stdout.write(`[mock-bff] ${data}`));
  child.stderr.on('data', data => process.stderr.write(`[mock-bff] ${data}`));
  return child;
}

async function waitForBff(child) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Mock BFF exited before it was ready with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for mock BFF at ${BASE_URL}`);
}

async function fetchJson(url, headers) {
  const response = await fetch(`${BASE_URL}${url}`, { headers });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return response.json();
}

async function postJson(url, headers, body = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${url} failed with ${response.status}`);
  }
  return response.json();
}

function byId(payload, instanceId) {
  return payload.layout.children.find(child => child.instanceId === instanceId);
}

function props(payload, instanceId) {
  return byId(payload, instanceId)?.props ?? {};
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function attr(value) {
  return htmlEscape(value);
}

function jsonScript(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function localMedia(url) {
  const value = String(url ?? '');
  const pathname = value.startsWith('http') ? new URL(value).pathname : value;
  return `../../mock-bff/public${pathname}`;
}

function withEnglishCopy(payload) {
  const copy = structuredClone(payload);
  for (const child of copy.layout.children) {
    const translation = englishDepositTranslations[child.instanceId];
    if (!translation) continue;

    if (child.instanceId === 'dep-rate-table') {
      child.props.sectionTitle = translation.sectionTitle;
      child.props.footnote = translation.footnote;
      child.props.rates = child.props.rates.map((rate, index) => ({
        ...rate,
        term: translation.rates[index]?.term ?? rate.term,
      }));
      continue;
    }

    if (child.instanceId === 'dep-faq') {
      child.props.sectionTitle = translation.sectionTitle;
      child.props.items = child.props.items.map((item, index) => ({
        ...item,
        question: translation.items[index]?.question ?? item.question,
        answer: translation.items[index]?.answer ?? item.answer,
      }));
      continue;
    }

    child.props = { ...child.props, ...translation };
  }
  copy.metadata.locale = 'en';
  return copy;
}

function renderDepositHtml(payload, options) {
  const isZh = options.locale === 'zh-CN';
  const header = props(payload, 'dep-header');
  const banner = props(payload, 'dep-image-banner');
  const callout = props(payload, 'dep-cd-rate-banner');
  const rateTable = props(payload, 'dep-rate-table');
  const cta = props(payload, 'dep-open-cta');
  const faq = props(payload, 'dep-faq');
  const insurance = props(payload, 'dep-insurance');
  const jsonLd = props(payload, 'dep-legal-jsonld');
  const schema = jsonLd.schema ?? {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    inLanguage: options.locale,
    name: '汇丰中国新资金存款优惠',
    provider: { '@type': 'BankOrCreditUnion', name: '汇丰银行（中国）有限公司' },
    areaServed: 'CN',
    category: 'Time Deposit',
    dateModified: jsonLd.lastReviewedDate || '2026-05-17',
  };
  schema.inLanguage = options.locale;
  schema.dateModified = jsonLd.lastReviewedDate || schema.dateModified;

  const rateTranslation = isZh
    ? { term: '存期', rate: '年利率', asAt: '截至', note: 'Deep link：打开汇丰中国手机银行存款模块；如未安装手机银行，将按 iOS、Android、华为、小米等渠道跳转下载。' }
    : { term: 'Term', rate: 'Interest rate (p.a.)', asAt: 'As at', note: englishDepositTranslations['dep-open-cta'].note };
  const pageName = isZh ? '新资金定期存款推广（中国）' : 'New Fund Deposit Campaign (CN)';
  const generatedLine = isZh
    ? '由本地 BFF 最新 Web SDUI/Web Standard 负载生成。'
    : 'Generated from the latest local BFF payload for Web SDUI/Web Standard study.';

  return `<!doctype html>
<html lang="${attr(options.locale)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(options.title)}</title>
  <meta name="description" content="${attr(options.description)}" />
  <script type="application/ld+json">${jsonScript(schema)}</script>
  <style>
    :root { color-scheme: light; --hsbc-red:#c41230; --text:#1a1a1a; --muted:#666; --soft:#f8f8f8; --line:#e6e6e6; --warning-bg:#fff7ed; --warning-text:#92400e; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif; }
    * { box-sizing: border-box; } body { margin:0; background:#eceff3; color:var(--text); } .ocdp-shell { min-height:100vh; display:grid; place-items:start center; padding:32px 16px; }
    .phone { width:min(430px,100%); min-height:820px; background:var(--soft); border:1px solid #d6d9de; box-shadow:0 18px 60px rgba(15,23,42,.18); overflow:hidden; }
    .ocdp-meta { background:#111827; color:#f9fafb; padding:10px 14px; font-size:11px; line-height:1.45; } .ocdp-meta strong { display:block; font-size:12px; margin-bottom:2px; }
    .header { display:flex; align-items:center; gap:8px; background:#fff; padding:12px 14px; border-bottom:1px solid var(--line); } .back { border:0; background:transparent; color:#0a0a0a; font-size:28px; line-height:1; width:28px; height:28px; cursor:pointer; } .header-title { font-size:17px; font-weight:600; }
    .hero { width:100%; height:200px; object-fit:cover; display:block; background:#173b67; } .callout { display:flex; flex-direction:column; gap:8px; padding:16px; background:var(--warning-bg); } .badge { align-self:flex-start; min-height:22px; padding:3px 10px; border-radius:999px; background:rgba(146,64,14,.12); color:var(--warning-text); font-size:10px; font-weight:700; } .callout-title { color:var(--warning-text); font-size:16px; font-weight:700; } .callout-copy { color:rgba(146,64,14,.82); font-size:13px; line-height:1.5; }
    .rate-table { background:#fff; } .rate-table-head { display:flex; justify-content:space-between; gap:12px; padding:12px 16px; background:var(--soft); } .section-title { color:#333; font-size:13px; font-weight:600; } .as-at { color:#888; font-size:10px; white-space:nowrap; } .rate-columns,.rate-row { display:grid; grid-template-columns:1fr auto; gap:14px; align-items:center; padding:9px 16px; } .rate-columns { background:#f5f6f8; color:var(--muted); font-size:12px; font-weight:600; } .rate-row { min-height:46px; border-top:1px solid #f0f0f0; font-size:13px; } .rate-value { color:var(--hsbc-red); font-size:15px; font-weight:700; } .footnote { padding:10px 16px; background:var(--soft); color:#888; font-size:10px; line-height:1.45; }
    .cta-wrap { padding:12px 16px; background:var(--soft); } .cta { width:100%; min-height:54px; border:0; border-radius:8px; background:var(--hsbc-red); color:#fff; font-size:16px; font-weight:700; cursor:pointer; } .cta-note { margin-top:8px; color:#777; font-size:10px; line-height:1.45; }
    .spacer { height:16px; } .faq { background:#fff; } .faq-title { padding:12px 16px; background:var(--soft); font-size:13px; font-weight:600; color:#333; } details { border-top:1px solid #f0f0f0; } summary { cursor:pointer; padding:14px 16px; font-size:13px; list-style:none; } summary::-webkit-details-marker { display:none; } .answer { padding:0 16px 14px; color:#666; font-size:13px; line-height:1.55; }
    .insurance { background:#fff; padding:12px 16px; } .insurance a { display:block; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#fff; } .insurance img { display:block; width:100%; height:140px; object-fit:contain; padding:8px; }
  </style>
</head>
<body>
  <main class="ocdp-shell">
    <article class="phone" aria-label="${attr(options.title)}">
      <div class="ocdp-meta"><strong>${htmlEscape(isZh ? '页面' : 'Page')}: ${htmlEscape(pageName)} · Page ID: deposit-campaign-cn · ${htmlEscape(isZh ? '市场' : 'Market')}: CN · ${htmlEscape(isZh ? '渠道' : 'Channel')}: SDUI</strong>${htmlEscape(generatedLine)}</div>
      <header class="header"><button class="back" type="button" aria-label="Back">‹</button><div class="header-title">${htmlEscape(header.title)}</div></header>
      <img class="hero" src="${attr(localMedia(banner.imageUrl))}" alt="Deposit campaign banner" />
      <section class="callout"><span class="badge">${htmlEscape(callout.badgeText)}</span><div class="callout-title">${htmlEscape(callout.title)}</div><div class="callout-copy">${htmlEscape(callout.subtitle)}</div></section>
      <section class="rate-table"><div class="rate-table-head"><div class="section-title">${htmlEscape(rateTable.sectionTitle)}</div><div class="as-at">${htmlEscape(rateTranslation.asAt)} ${htmlEscape(rateTable.asAtDate)}</div></div><div class="rate-columns"><span>${htmlEscape(rateTranslation.term)}</span><span>${htmlEscape(rateTranslation.rate)}</span></div>${rateTable.rates.map(rate => `<div class="rate-row"><span>${htmlEscape(rate.term)}</span><span class="rate-value">${htmlEscape(rate.rate)}%</span></div>`).join('')}<div class="footnote">${htmlEscape(rateTable.footnote)}</div></section>
      <section class="cta-wrap"><button class="cta" type="button" data-component-id="DEPOSIT_OPEN_CTA" data-sensors-event="sensorsdata_deposit_open_click" data-deeplink="${attr(cta.deepLink)}" data-ios="${attr(cta.fallback?.ios)}" data-android="${attr(cta.fallback?.android)}" data-huawei="${attr(cta.fallback?.huawei)}" data-xiaomi="${attr(cta.fallback?.xiaomi)}">${htmlEscape(cta.label)}</button><div class="cta-note">${htmlEscape(rateTranslation.note)}</div></section>
      <div class="spacer"></div><section class="faq"><div class="faq-title">${htmlEscape(faq.sectionTitle)}</div>${faq.items.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary>${htmlEscape(item.question)}</summary><div class="answer">${htmlEscape(item.answer)}</div></details>`).join('')}</section>
      <section class="insurance" aria-label="${attr(insurance.title)}"><a href="${attr(insurance.linkUrl)}" target="_blank" rel="noreferrer" data-component-id="DEPOSIT_INSURANCE" data-sensors-event="sensorsdata_deposit_insurance_click"><img src="${attr(localMedia(insurance.logoUrl))}" alt="${attr(insurance.altText)}" /></a></section>
    </article>
  </main>
  <script>
    (function () {
      var PAGE = { page_id: "deposit-campaign-cn", page_name: ${JSON.stringify(pageName)}, market: "CN", language: ${JSON.stringify(options.locale)}, channel: "web_sdui_static_html", analytics_provider: "sensordata", campaign: "new-fund", product: "time_deposit" };
      var STORAGE_KEY = "study_html_sensorsdata_events";
      function deviceChannel() { var ua = navigator.userAgent || ""; if (/huawei|honor/i.test(ua)) return "huawei"; if (/miuibrowser|xiaomi|redmi/i.test(ua)) return "xiaomi"; if (/iphone|ipad|ipod/i.test(ua)) return "ios"; if (/android/i.test(ua)) return "android"; return "web"; }
      function realSensors() { if (window.sensors && typeof window.sensors.track === "function") return window.sensors; if (window.sensorsDataAnalytic201505 && typeof window.sensorsDataAnalytic201505.track === "function") return window.sensorsDataAnalytic201505; return null; }
      function track(eventName, props) { var payload = Object.assign({}, PAGE, props || {}, { event_name: eventName, device_channel: deviceChannel(), url: window.location.href, timestamp: new Date().toISOString() }); var sensors = realSensors(); if (sensors) sensors.track(eventName, payload); window.__studySensorsDataEvents = window.__studySensorsDataEvents || []; window.__studySensorsDataEvents.push(payload); try { var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); saved.push(payload); localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(-100))); } catch (error) {} if (window.console && console.info) console.info("[SensorsData]", eventName, payload); }
      function fallbackUrl(button) { var channel = deviceChannel(); if (channel === "ios") return button.dataset.ios; if (channel === "huawei") return button.dataset.huawei || button.dataset.android; if (channel === "xiaomi") return button.dataset.xiaomi || button.dataset.android; return button.dataset.android || button.dataset.ios; }
      function openDeposit(button) { var deeplink = button.dataset.deeplink; var fallback = fallbackUrl(button); track(button.dataset.sensorsEvent || "sensorsdata_deposit_open_click", { component_id: button.dataset.componentId || "DEPOSIT_OPEN_CTA", cta_name: button.textContent.trim(), deeplink: deeplink, fallback_url: fallback }); sessionStorage.setItem("deposit_open_click_pending", "1"); window.location.href = deeplink; window.setTimeout(function () { if (document.visibilityState === "visible") window.location.href = fallback; }, 1200); }
      track("sensorsdata_page_view", { metric_scope: "dau_mau", referrer: document.referrer || "" });
      document.querySelectorAll("[data-sensors-event]").forEach(function (element) { element.addEventListener("click", function (event) { if (element.dataset.componentId === "DEPOSIT_OPEN_CTA") { event.preventDefault(); openDeposit(element); return; } track(element.dataset.sensorsEvent, { component_id: element.dataset.componentId || "", target_url: element.href || "" }); }); });
      function trackConversion() { if (sessionStorage.getItem("deposit_open_click_pending") !== "1") return; sessionStorage.removeItem("deposit_open_click_pending"); track("sensorsdata_deposit_open_conversion", { component_id: "DEPOSIT_OPEN_CTA", conversion_type: "deeplink_attempt" }); }
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") trackConversion(); });
      window.addEventListener("pagehide", trackConversion);
    })();
  </script>
</body>
</html>
`;
}

async function writeJsonArtifact(artifact) {
  const payload = await fetchJson(artifact.url, artifact.headers);
  normalizeStudyMetadata(artifact.file, payload);
  const target = path.join(OUT_JSON, artifact.file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, target)}`);
  return payload;
}

function normalizeStudyMetadata(file, payload) {
  if (!payload.metadata) return;

  if (file.endsWith('/home-hub-hk.json')) {
    payload.metadata.platform = 'harmonynext';
    payload.metadata.nativeTargets = ['harmonynext'];
    return;
  }

  if (
    file.endsWith('/fx-viewpoint-hk.json') ||
    file.endsWith('/announcement-overlay-hk.json') ||
    file.endsWith('/announcement-force-update-hk.json')
  ) {
    payload.metadata.platform = 'all';
    payload.metadata.nativeTargets = ['ios', 'android', 'harmonynext'];
  }
}

async function writeHtmlArtifacts(webPayload) {
  for (const artifact of htmlArtifacts) {
    const payload = artifact.locale === 'en' ? withEnglishCopy(webPayload) : webPayload;
    const target = path.join(OUT_HTML, artifact.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, renderDepositHtml(payload, artifact));
    console.log(`wrote ${path.relative(ROOT, target)}`);
  }
}

function obkycHeaders(artifact) {
  return {
    'x-platform': artifact.platform,
    'x-channel': artifact.channel,
    'x-locale': artifact.locale,
  };
}

async function writeObkycArtifact(artifact) {
  const headers = obkycHeaders(artifact);
  const session = await postJson('/api/v1/kyc/sessions/start', headers, {
    journeyId: 'obkyc-account-opening',
  });
  const steps = [];
  for (let index = 1; index <= session.totalSteps; index++) {
    const stepId = `step-${String(index).padStart(3, '0')}`;
    const step = await fetchJson(`/api/v1/kyc/sessions/${session.sessionId}/steps/${stepId}`, headers);
    steps.push(step);
  }

  const journey = {
    schemaVersion: '2.3',
    journeyId: 'obkyc-account-opening',
    journeyName: artifact.platform === 'web' ? 'OBKYC Account Opening - Web' : 'OBKYC Account Opening',
    sessionId: session.sessionId,
    platform: artifact.platform,
    channel: artifact.channel,
    locale: artifact.locale,
    totalSteps: session.totalSteps,
    generatedAt: new Date().toISOString(),
    endpoints: {
      start: '/api/v1/kyc/sessions/start',
      resume: `/api/v1/kyc/sessions/${session.sessionId}/resume`,
      step: `/api/v1/kyc/sessions/${session.sessionId}/steps/{stepId}`,
      submit: `/api/v1/kyc/sessions/${session.sessionId}/steps/{stepId}/submit`,
    },
    steps,
  };

  const target = path.join(OUT_JSON, artifact.file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(journey, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, target)}`);
}

async function main() {
  const bff = startBff();
  try {
    await waitForBff(bff);
    let webStandardPayload;
    for (const artifact of jsonArtifacts) {
      const payload = await writeJsonArtifact(artifact);
      if (artifact.file === 'ocdp-pages/deposit-campaign-cn-web-standard.json') {
        webStandardPayload = payload;
      }
    }
    await writeHtmlArtifacts(webStandardPayload);
    for (const artifact of obkycArtifacts) {
      await writeObkycArtifact(artifact);
    }
  } finally {
    bff.kill('SIGTERM');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
