import React from 'react';
import { CanvasSlice } from '../../types/ucp';

// ─── Faithful mobile renders of each slice type ───────────────────────────────
// These are displayed inside the 375px-wide iPhone frame in the simulator.

function SimSection({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return <div style={{ padding: noPad ? 0 : '0 16px' }}>{children}</div>;
}

export function SimHeaderNav({ props }: { props: any }) {
  return (
    <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
      <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 18, padding: '7px 14px', fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🔍</span> {props.searchPlaceholder}
      </div>
      {props.showNotificationBell && <span style={{ fontSize: 20 }}>🔔</span>}
      {props.showQRScanner && <div style={{ width: 24, height: 24, border: '2px solid #1A1A2E', borderRadius: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 3 }}>{[...Array(4)].map((_, i) => <div key={i} style={{ background: '#1A1A2E', borderRadius: 1 }} />)}</div>}
    </div>
  );
}

export function SimQuickAccess({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0 8px' }}>
        {(props.items ?? []).slice(0, 5).map((item: any) => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 10, color: '#374151', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </SimSection>
  );
}

export function SimPromoBanner({ props }: { props: any }) {
  return (
    <SimSection noPad>
      <div style={{ margin: '8px 12px', background: props.backgroundColor || '#E8F4FD', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ flex: 1 }}>
          {props.badgeText && (
            <div style={{ fontSize: 9, fontWeight: 700, color: '#DB0011', marginBottom: 4, background: 'rgba(219,0,17,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: 10 }}>
              {props.badgeText}
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E', lineHeight: 1.2 }}>{props.title}</div>
          <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{props.subtitle}</div>
          <button style={{ marginTop: 8, background: '#DB0011', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 16px', borderRadius: 14, border: 'none', cursor: 'pointer' }}>
            {props.ctaLabel}
          </button>
        </div>
        {props.imageUrl
          ? <img src={props.imageUrl} alt="" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
          : <div style={{ width: 80, height: 80, background: 'rgba(0,0,0,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎨</div>
        }
      </div>
    </SimSection>
  );
}

export function SimFunctionGrid({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(props.rows ?? []).map((row: any[], ri: number) => (
          <div key={ri} style={{ display: 'flex', justifyContent: 'space-around' }}>
            {row.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ width: 44, height: 44, background: '#F5F6F8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 10, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </SimSection>
  );
}

export function SimAIAssistant({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', borderRadius: 10, padding: '8px 12px', margin: '4px 0' }}>
        <span style={{ fontSize: 20 }}>✉️</span>
        <span style={{ fontSize: 11, color: '#4B5563', flex: 1 }}>{props.greeting}</span>
        <span style={{ fontSize: 14 }}>›</span>
      </div>
    </SimSection>
  );
}

export function SimAdBanner({ props }: { props: any }) {
  return (
    <SimSection noPad>
      <div style={{ margin: '8px 12px', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderRadius: 14, padding: '12px 16px', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{props.title}</div>
            {props.subtitle && <div style={{ fontSize: 10, color: '#78716C', marginTop: 2 }}>{props.subtitle}</div>}
            <button style={{ marginTop: 8, background: '#DB0011', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
              {props.ctaLabel}
            </button>
          </div>
          {props.imageUrl
            ? <img src={props.imageUrl} alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />
            : <div style={{ width: 72, height: 72, background: 'rgba(0,0,0,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📢</div>
          }
        </div>
        {props.dismissible && (
          <button style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 14, color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
        )}
      </div>
    </SimSection>
  );
}

export function SimFlashLoan({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ background: 'linear-gradient(135deg, #FFF5F5, #FFE4E4)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0', boxShadow: '0 2px 8px rgba(219,0,17,0.08)' }}>
        <div>
          <div style={{ fontSize: 11, color: '#DB0011', fontWeight: 700 }}>⚡ {props.productName}</div>
          <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{props.tagline}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', marginTop: 3 }}>
            ¥{(props.maxAmount ?? 0).toLocaleString()}.00
          </div>
        </div>
        <button style={{ background: 'linear-gradient(135deg, #DB0011, #FF2233)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(219,0,17,0.3)' }}>
          {props.ctaLabel}
        </button>
      </div>
    </SimSection>
  );
}

export function SimWealthSelection({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ padding: '12px 0 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{props.sectionTitle}</span>
          <span style={{ fontSize: 12, color: '#DB0011' }}>更多 ›</span>
        </div>
        {(props.products ?? []).map((pr: any, i: number) => (
          <div key={pr.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: i < (props.products.length - 1) ? '1px solid #F3F4F6' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', marginBottom: 2 }}>{pr.productName}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 9, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 8 }}>
                  {pr.riskLevel}
                </span>
                <span style={{ fontSize: 9, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 8 }}>
                  {pr.redemption}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#DB0011' }}>{pr.yield7Day}</div>
              <div style={{ fontSize: 9, color: '#6B7280' }}>7日年化</div>
              {pr.highlighted && (
                <button style={{ marginTop: 4, background: '#DB0011', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                  {pr.ctaLabel}
                </button>
              )}
            </div>
          </div>
        ))}
        {(props.products?.length ?? 0) > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
            💬 理財產品這么多，哪款適合我？
          </div>
        )}
      </div>
    </SimSection>
  );
}

export function SimFeaturedRankings({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ padding: '12px 0 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{props.sectionTitle}</span>
          <span style={{ fontSize: 12, color: '#DB0011' }}>更多 ›</span>
        </div>
        {(props.items ?? []).map((item: any) => (
          <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#DB0011', background: '#FEF2F2', display: 'inline-block', padding: '2px 8px', borderRadius: 10, marginBottom: 3 }}>
                {item.badge}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{item.title}</div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{item.description}</div>
            </div>
            <span style={{ fontSize: 16, color: '#9CA3AF', flexShrink: 0 }}>›</span>
          </div>
        ))}
      </div>
    </SimSection>
  );
}

export function SimLifeDeals({ props }: { props: any }) {
  return (
    <SimSection>
      <div style={{ padding: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{props.sectionTitle}</span>
          <span style={{ fontSize: 12, color: '#DB0011' }}>更多 ›</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(props.deals ?? []).slice(0, 4).map((d: any) => (
            <div key={d.id} style={{ flex: 1, background: '#F9FAFB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ height: 64, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                {d.logoUrl
                  ? <img src={d.logoUrl} alt={d.brandName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : d.brandName
                }
              </div>
              <div style={{ background: '#DB0011', color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '4px 2px' }}>{d.tag}</div>
            </div>
          ))}
        </div>
        {(props.bottomLinks ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {props.bottomLinks.map((link: any, i: number) => (
              <div key={i} style={{ flex: 1, background: '#F9FAFB', borderRadius: 12, padding: '10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: 24 }}>{link.icon}</span>
                <span style={{ fontSize: 10, color: '#374151', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{link.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimSection>
  );
}

export function SimSpacer({ props }: { props: any }) {
  return <div style={{ height: props.height ?? 16 }} />;
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function SimSliceRenderer({ slice }: { slice: CanvasSlice }) {
  if (!slice.visible) return null;
  const p = slice.props as any;
  switch (slice.type) {
    case 'HEADER_NAV':        return <SimHeaderNav        props={p} />;
    case 'QUICK_ACCESS':      return <SimQuickAccess      props={p} />;
    case 'PROMO_BANNER':      return <SimPromoBanner      props={p} />;
    case 'FUNCTION_GRID':     return <SimFunctionGrid     props={p} />;
    case 'AI_ASSISTANT':      return <SimAIAssistant      props={p} />;
    case 'AD_BANNER':         return <SimAdBanner         props={p} />;
    case 'FLASH_LOAN':        return <SimFlashLoan        props={p} />;
    case 'WEALTH_SELECTION':  return <SimWealthSelection  props={p} />;
    case 'FEATURED_RANKINGS': return <SimFeaturedRankings props={p} />;
    case 'LIFE_DEALS':        return <SimLifeDeals        props={p} />;
    case 'SPACER':            return <SimSpacer           props={p} />;
    default: return null;
  }
}
