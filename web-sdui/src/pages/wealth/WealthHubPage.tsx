import React, { useState, useEffect, useRef } from 'react';
import { tealium } from '../../analytics/TealiumClient';

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_ITEMS = [
  { icon: '🌙', label: '朝朝寶',   deepLink: 'hsbc://wealth/morning-treasure' },
  { icon: '💵', label: '借錢',     deepLink: 'hsbc://loan/apply' },
  { icon: '↔️', label: '轉帳',     deepLink: 'hsbc://transfer' },
  { icon: '📊', label: '帳戶總覽', deepLink: 'hsbc://accounts' },
];

const FUNC_ROWS = [
  [
    { icon:'💳', label:'信用卡',   deepLink:'hsbc://cards' },
    { icon:'📄', label:'收支明細', deepLink:'hsbc://statements' },
    { icon:'🔄', label:'他行卡轉入', deepLink:'hsbc://transfer/external' },
    { icon:'🏙️', label:'城市服務', deepLink:'hsbc://city-services' },
    { icon:'🔥', label:'熱門活動', deepLink:'hsbc://events' },
  ],
  [
    { icon:'📈', label:'理財',     deepLink:'hsbc://wealth' },
    { icon:'Ⓜ️', label:'M+會員',  deepLink:'hsbc://membership' },
    { icon:'🎬', label:'影票',     deepLink:'hsbc://movies' },
    { icon:'💹', label:'基金',     deepLink:'hsbc://funds' },
    { icon:'⋯',  label:'全部',    deepLink:'hsbc://all-services' },
  ],
];

const WEALTH_PRODUCTS = [
  { id:'w1', name:'活錢理財｜歷史天天正收益', tag:'代碼',     yield7Day:'2.80%', risk:'R1低風險',  redemption:'贖回T+1到帳', cta:'去看看', highlighted:true  },
  { id:'w2', name:'主投債券',                  tag:'代碼',     yield7Day:'3.04%', risk:'歷史周周正', redemption:'成立以來…',   cta:'查看',   highlighted:false },
  { id:'w3', name:'年均收益率',                tag:'收益確定', yield7Day:'2.31%', risk:'保証領取',   redemption:'穩健低波',    cta:'查看',   highlighted:false },
];

const RANKINGS = [
  { id:'r1', icon:'🥇', badge:'優中選優', title:'3322選基',     desc:'近1年漲跌幅高達318.19%' },
  { id:'r2', icon:'🔒', badge:'固收優選', title:'穩健省心好選擇', desc:'歷史持有3月盈利概率高達98.23%' },
  { id:'r3', icon:'📈', badge:'屢創新高', title:'屢創新高榜',    desc:'近3年净值創新高次數達152' },
];

const DEALS = [
  { id:'d1', brand:'KFC',           emoji:'🍗', tag:'單品優惠'  },
  { id:'d2', brand:'Luckin Coffee', emoji:'☕', tag:'5折喝瑞幸' },
  { id:'d3', brand:'DQ',            emoji:'🍦', tag:'5折起'    },
];

const BOTTOM_LINKS = [
  { icon:'🎁', label:'達標抽好禮\n丰润守护 健康随行', deepLink:'hsbc://campaign/health' },
  { icon:'🏦', label:'行庆招财日\n享受特惠禮遇',       deepLink:'hsbc://campaign/anniversary' },
];

// ─── Impression hook ──────────────────────────────────────────────────────────

function useImpressionOnce(fn: () => void) {
  const fired = useRef(false);
  useEffect(() => { if (!fired.current) { fired.current = true; fn(); } }, []);
}

// ─── Root page ────────────────────────────────────────────────────────────────

export function WealthHubPage() {
  const [adDismissed, setAdDismissed] = useState(false);
  useImpressionOnce(() => tealium.wealthHubViewed());

  const s: React.CSSProperties = { fontFamily: "'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif" };

  return (
    <div style={{ ...s, maxWidth: 480, margin: '0 auto', background: '#F8F8F8', minHeight: '100vh' }}>
      <WHHeaderNav />
      <WHQuickAccess />
      <WHPromoBanner />
      <WHFunctionGrid />
      <WHAIAssistant />
      {!adDismissed && <WHAdBanner onDismiss={() => setAdDismissed(true)} />}
      <WHFlashLoan />
      <WHWealthSelection />
      <WHFeaturedRankings />
      <WHLifeDeals />
      <div style={{ height: 40 }} />
    </div>
  );
}

// ─── 1. Header Nav ────────────────────────────────────────────────────────────

function WHHeaderNav() {
  useImpressionOnce(() => tealium.sliceImpression('HEADER_NAV', 'slice-header', 0));
  return (
    <div style={{ background: '#fff', padding: '8px 14px', display: 'flex',
      alignItems: 'center', gap: 10, borderBottom: '1px solid #F3F4F6' }}>
      <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 18, padding: '7px 14px',
        fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer' }}
        onClick={() => tealium.track({ tealium_event:'search_tap', event_category:'Wealth',
          event_action:'search_tapped', screen_name:'wealth_hub_hk', journey_name:'wealth_hub' })}>
        🔍 搜尋功能、產品
      </div>
      <span style={{ fontSize: 20, cursor: 'pointer' }}
        onClick={() => tealium.track({ tealium_event:'notification_tap',
          event_category:'Wealth', event_action:'notification_tapped',
          screen_name:'wealth_hub_hk', journey_name:'wealth_hub' })}>🔔</span>
      <span style={{ fontSize: 20, cursor: 'pointer' }}
        onClick={() => tealium.track({ tealium_event:'qr_tap', event_category:'Wealth',
          event_action:'qr_scanner_tapped', screen_name:'wealth_hub_hk', journey_name:'wealth_hub' })}>⬛</span>
    </div>
  );
}

// ─── 2. Quick Access ──────────────────────────────────────────────────────────

function WHQuickAccess() {
  useImpressionOnce(() => tealium.sliceImpression('QUICK_ACCESS', 'slice-quick', 1));
  return (
    <div style={{ background: '#fff', padding: '12px 16px',
      display: 'flex', justifyContent: 'space-around' }}>
      {QUICK_ITEMS.map(item => (
        <div key={item.label} style={{ display:'flex', flexDirection:'column',
          alignItems:'center', gap:5, cursor:'pointer' }}
          onClick={() => tealium.quickAccessTapped(item.label, item.deepLink)}>
          <div style={{ width:48, height:48, borderRadius:14, display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:22,
            background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)',
            boxShadow:'0 2px 6px rgba(0,0,0,0.08)' }}>{item.icon}</div>
          <span style={{ fontSize:10, color:'#374151', fontWeight:500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 3. Promo Banner ─────────────────────────────────────────────────────────

function WHPromoBanner() {
  useImpressionOnce(() =>
    tealium.promoBannerImpression('10分招財日', 'slice-promo-10', 'promo-10-finance-day'));
  return (
    <div style={{ margin: '8px 12px', background: '#E8F4FD', borderRadius:14,
      padding:'12px 16px', display:'flex', alignItems:'center',
      justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:9, fontWeight:700, color:'#DB0011', marginBottom:4,
          background:'rgba(219,0,17,0.1)', display:'inline-block',
          padding:'2px 8px', borderRadius:10 }}>每月10日開啓</div>
        <div style={{ fontSize:16, fontWeight:800, color:'#1A1A2E', lineHeight:1.2 }}>10分招財日</div>
        <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>查帳單·學投資·優配置</div>
        <button style={{ marginTop:8, background:'#DB0011', color:'#fff', fontSize:11,
          fontWeight:700, padding:'6px 16px', borderRadius:14, border:'none', cursor:'pointer' }}
          onClick={() => tealium.promoBannerTapped('10分招財日','slice-promo-10','promo-10-finance-day')}>
          點擊參與
        </button>
      </div>
      <div style={{ width:80, height:80, background:'rgba(0,0,0,0.08)',
        borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:32, flexShrink:0 }}>🎯</div>
    </div>
  );
}

// ─── 4. Function Grid ─────────────────────────────────────────────────────────

function WHFunctionGrid() {
  useImpressionOnce(() => tealium.sliceImpression('FUNCTION_GRID', 'slice-func-grid', 3));
  return (
    <div style={{ background:'#fff', padding:'8px 16px', display:'flex',
      flexDirection:'column', gap:6 }}>
      {FUNC_ROWS.map((row, ri) => (
        <div key={ri} style={{ display:'flex', justifyContent:'space-around' }}>
          {row.map(item => (
            <div key={item.label} style={{ display:'flex', flexDirection:'column',
              alignItems:'center', gap:4, flex:1, cursor:'pointer' }}
              onClick={() => tealium.track({ tealium_event:'function_tap',
                event_category:'Wealth', event_action:'function_tapped',
                event_label:item.label, screen_name:'wealth_hub_hk',
                journey_name:'wealth_hub', function_label:item.label, deep_link:item.deepLink })}>
              <div style={{ width:44, height:44, background:'#F5F6F8', borderRadius:12,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                {item.icon}
              </div>
              <span style={{ fontSize:10, color:'#374151', textAlign:'center', lineHeight:1.2 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── 5. AI Assistant ─────────────────────────────────────────────────────────

function WHAIAssistant() {
  useImpressionOnce(() => tealium.sliceImpression('AI_ASSISTANT', 'slice-ai', 4));
  return (
    <div style={{ margin:'4px 16px', background:'#F9FAFB', borderRadius:10,
      padding:'8px 12px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
      onClick={() => tealium.aiAssistantTapped()}>
      <span style={{ fontSize:20 }}>✉️</span>
      <span style={{ fontSize:11, color:'#4B5563', flex:1 }}>Hi，我是你的智能財富助理</span>
      <span style={{ fontSize:14 }}>›</span>
    </div>
  );
}

// ─── 6. Ad Banner ────────────────────────────────────────────────────────────

function WHAdBanner({ onDismiss }: { onDismiss: () => void }) {
  useImpressionOnce(() => tealium.sliceImpression('AD_BANNER', 'slice-ad-spring', 5));
  return (
    <div style={{ margin:'6px 12px', background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)',
      borderRadius:14, padding:'12px 16px', position:'relative',
      boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#92400E' }}>春季播種黃金期</div>
          <div style={{ fontSize:10, color:'#78716C', marginTop:2 }}>配置正當時，播下「金種子」</div>
          <button style={{ marginTop:8, background:'#DB0011', color:'#fff', fontSize:11,
            fontWeight:700, padding:'5px 14px', borderRadius:12, border:'none', cursor:'pointer' }}
            onClick={() => tealium.sliceTapped('AD_BANNER','slice-ad-spring','抽體驗禮',
              'hsbc://campaign/spring-investment')}>
            抽體驗禮
          </button>
        </div>
        <div style={{ width:72, height:72, background:'rgba(0,0,0,0.08)', borderRadius:10,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🌱</div>
      </div>
      <button style={{ position:'absolute', top:8, right:12, background:'none', border:'none',
        fontSize:14, color:'#9CA3AF', cursor:'pointer' }}
        onClick={() => { tealium.adBannerDismissed('春季播種黃金期'); onDismiss(); }}>✕</button>
    </div>
  );
}

// ─── 7. Flash Loan ───────────────────────────────────────────────────────────

function WHFlashLoan() {
  useImpressionOnce(() => tealium.sliceImpression('FLASH_LOAN', 'slice-flash-loan', 6));
  return (
    <div style={{ margin:'6px 12px', background:'linear-gradient(135deg,#FFF5F5,#FFE4E4)',
      borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center',
      justifyContent:'space-between', boxShadow:'0 2px 8px rgba(219,0,17,0.08)' }}>
      <div>
        <div style={{ fontSize:11, color:'#DB0011', fontWeight:700 }}>⚡ 閃電貸 極速放款</div>
        <div style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>最高可借額度</div>
        <div style={{ fontSize:22, fontWeight:800, color:'#1A1A2E', marginTop:3 }}>HKD 300,000.00</div>
      </div>
      <button style={{ background:'linear-gradient(135deg,#DB0011,#FF2233)', color:'#fff',
        fontSize:12, fontWeight:700, padding:'10px 18px', borderRadius:20, border:'none',
        cursor:'pointer', boxShadow:'0 4px 12px rgba(219,0,17,0.3)' }}
        onClick={() => tealium.sliceTapped('FLASH_LOAN','slice-flash-loan',
          '獲取額度','hsbc://loan/flash')}>
        獲取額度
      </button>
    </div>
  );
}

// ─── 8. Wealth Selection ─────────────────────────────────────────────────────

function WHWealthSelection() {
  useImpressionOnce(() => tealium.sliceImpression('WEALTH_SELECTION','slice-wealth-sel',7,
    'wealth-selection-hk-2026'));
  return (
    <div style={{ background:'#fff', padding:'12px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:10 }}>
        <span style={{ fontSize:15, fontWeight:700 }}>財富精選</span>
        <span style={{ fontSize:12, color:'#DB0011', cursor:'pointer' }}>更多 ›</span>
      </div>
      {WEALTH_PRODUCTS.map((p, i) => (
        <div key={p.id}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 0', cursor:'pointer' }}
            onClick={() => tealium.wealthProductTapped(p.name, p.id)}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#1A1A2E', marginBottom:2 }}>
                {p.name}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[p.risk, p.redemption].map(tag => (
                  <span key={tag} style={{ fontSize:9, background:'#F3F4F6', color:'#6B7280',
                    padding:'1px 6px', borderRadius:8 }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#DB0011' }}>{p.yield7Day}</div>
              <div style={{ fontSize:9, color:'#6B7280' }}>7日年化</div>
              {p.highlighted && (
                <button style={{ marginTop:4, background:'#DB0011', color:'#fff', fontSize:10,
                  fontWeight:700, padding:'4px 12px', borderRadius:12, border:'none',
                  cursor:'pointer' }}
                  onClick={e => { e.stopPropagation(); tealium.wealthProductTapped(p.name, p.id); }}>
                  {p.cta}
                </button>
              )}
            </div>
          </div>
          {i < WEALTH_PRODUCTS.length - 1 &&
            <div style={{ height:1, background:'#F3F4F6' }} />}
        </div>
      ))}
      <div style={{ marginTop:10, fontSize:11, color:'#6B7280', textAlign:'center' }}>
        💬 理財產品這么多，哪款適合我？
      </div>
    </div>
  );
}

// ─── 9. Featured Rankings ────────────────────────────────────────────────────

function WHFeaturedRankings() {
  useImpressionOnce(() => tealium.sliceImpression('FEATURED_RANKINGS', 'slice-rankings', 8));
  return (
    <div style={{ background:'#fff', padding:'12px 16px', marginTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:10 }}>
        <span style={{ fontSize:15, fontWeight:700 }}>特色榜單</span>
        <span style={{ fontSize:12, color:'#DB0011', cursor:'pointer' }}>更多 ›</span>
      </div>
      {RANKINGS.map(item => (
        <div key={item.id} style={{ display:'flex', gap:12, alignItems:'flex-start',
          padding:'8px 0', borderBottom:'1px solid #F9FAFB', cursor:'pointer' }}
          onClick={() => tealium.rankingsTapped(item.title, item.badge)}>
          <span style={{ fontSize:24, flexShrink:0 }}>{item.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#DB0011', background:'#FEF2F2',
              display:'inline-block', padding:'2px 8px', borderRadius:10, marginBottom:3 }}>
              {item.badge}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{item.title}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>{item.desc}</div>
          </div>
          <span style={{ fontSize:16, color:'#9CA3AF', flexShrink:0 }}>›</span>
        </div>
      ))}
    </div>
  );
}

// ─── 10. Life Deals ──────────────────────────────────────────────────────────

function WHLifeDeals() {
  useImpressionOnce(() => tealium.sliceImpression('LIFE_DEALS', 'slice-life-deals', 9));
  return (
    <div style={{ background:'#fff', padding:'12px 16px', marginTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:10 }}>
        <span style={{ fontSize:15, fontWeight:700 }}>生活特惠</span>
        <span style={{ fontSize:12, color:'#DB0011', cursor:'pointer' }}>更多 ›</span>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        {DEALS.map(d => (
          <div key={d.id} style={{ flex:1, background:'#F9FAFB', borderRadius:12,
            overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', cursor:'pointer' }}
            onClick={() => tealium.lifeDealTapped(d.brand, d.tag)}>
            <div style={{ height:64, background:'#E5E7EB', display:'flex',
              alignItems:'center', justifyContent:'center', fontSize:24 }}>{d.emoji}</div>
            <div style={{ background:'#DB0011', color:'#fff', fontSize:9, fontWeight:700,
              textAlign:'center', padding:'4px 2px' }}>{d.tag}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:10, marginTop:12 }}>
        {BOTTOM_LINKS.map(link => (
          <div key={link.label} style={{ flex:1, background:'#F9FAFB', borderRadius:12,
            padding:10, display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
            onClick={() => tealium.track({ tealium_event:'bottom_link_tap',
              event_category:'Wealth', event_action:'bottom_link_tapped',
              event_label:link.label, screen_name:'wealth_hub_hk',
              journey_name:'wealth_hub', deep_link:link.deepLink })}>
            <span style={{ fontSize:24 }}>{link.icon}</span>
            <span style={{ fontSize:10, color:'#374151', lineHeight:1.3,
              whiteSpace:'pre-line' }}>{link.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
