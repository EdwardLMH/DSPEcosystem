import React, { useState, useEffect } from 'react';

// ─── BFF base URL ─────────────────────────────────────────────────────────────

const BFF_BASE = 'http://localhost:4000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DepositSlice {
  instanceId: string;
  type: string;
  visible: boolean;
  props: Record<string, unknown>;
}

interface RateRow { term: string; rate: string }
interface FAQItem { id: string; question: string; answer: string }

// ─── Root page ────────────────────────────────────────────────────────────────

export function DepositCampaignPage() {
  const [slices, setSlices] = useState<DepositSlice[] | null>(null);
  const [error, setError]   = useState(false);

  useEffect(() => {
    fetch(`${BFF_BASE}/screen/deposit-campaign-hk`, {
      headers: { 'x-platform': 'web', Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        const children: DepositSlice[] = data?.layout?.children ?? [];
        setSlices(children.filter(s => s.visible !== false));
      })
      .catch(() => setError(true));
  }, []);

  const bodySlices = slices ?? [];

  return (
    <div style={styles.page}>
      {/* Loading */}
      {!slices && !error && (
        <>
          <DepositHeaderBar title="Renminbi Savings Offers" />
          <div style={styles.loading}>Loading…</div>
        </>
      )}

      {/* SDUI or fallback */}
      {(slices || error) && (
        <>
          {bodySlices.length > 0
            ? bodySlices.map(s => <SliceView key={s.instanceId} slice={s} />)
            : <DepositHardcodedFallback />
          }
        </>
      )}
    </div>
  );
}

// ─── Slice dispatcher ─────────────────────────────────────────────────────────

function SliceView({ slice }: { slice: DepositSlice }) {
  switch (slice.type) {
    case 'HEADER_NAV':
      return <DepositHeaderBar
        title={String(slice.props['title'] ?? 'Renminbi Savings Offers')}
        showBack={slice.props['showBackButton'] !== false}
      />;
    case 'PROMO_BANNER':
      return <DepositPromoBanner slice={slice} />;
    case 'DEPOSIT_RATE_TABLE':
      return <DepositRateTable slice={slice} />;
    case 'DEPOSIT_OPEN_CTA':
      return <DepositOpenCTA slice={slice} />;
    case 'DEPOSIT_FAQ':
      return <DepositFAQSection slice={slice} />;
    case 'SPACER':
      return <div style={{ height: Number(slice.props['height'] ?? 16) }} />;
    default:
      return null;
  }
}

// ─── 1. Header Bar ────────────────────────────────────────────────────────────

function DepositHeaderBar({
  title = 'Renminbi Savings Offers',
  showBack = true,
}: {
  title?: string;
  showBack?: boolean;
}) {
  return (
    <div style={styles.headerBar}>
      {showBack && <span style={styles.backArrow} onClick={() => window.history.back()}>‹</span>}
      <span style={styles.headerTitle}>{title}</span>
    </div>
  );
}

// ─── 2. Promo Banner ──────────────────────────────────────────────────────────

function DepositPromoBanner({ slice }: { slice: DepositSlice }) {
  const imageUrl = (String(slice.props['imageUrl'] ?? ''))
    .replace('http://localhost:4000', 'http://localhost:4000');
  const bgColor  = String(slice.props['backgroundColor'] ?? '#FFFFFF');
  const title    = String(slice.props['title'] ?? '');
  const subtitle = String(slice.props['subtitle'] ?? '');
  const badge    = String(slice.props['badgeText'] ?? '');
  const textColor = String(slice.props['textColor'] ?? '#92400E');

  if (slice.props['imageUrl']) {
    return (
      <img
        src={imageUrl}
        alt="Deposit campaign banner"
        style={styles.heroBannerImage}
      />
    );
  }

  if (title) {
    return (
      <div style={{ ...styles.calloutBanner, backgroundColor: bgColor }}>
        {badge && (
          <span style={{ ...styles.calloutBadge, color: textColor, backgroundColor: hexWithAlpha(textColor, 0.12) }}>
            {badge}
          </span>
        )}
        <div style={{ ...styles.calloutTitle, color: textColor }}>{title}</div>
        {subtitle && <div style={{ ...styles.calloutSubtitle, color: textColor + 'CC' }}>{subtitle}</div>}
      </div>
    );
  }

  return null;
}

// ─── 3. Deposit Rate Table ────────────────────────────────────────────────────

function DepositRateTable({ slice }: { slice: DepositSlice }) {
  const sectionTitle = String(slice.props['sectionTitle'] ?? 'Time Deposit Rate:');
  const asAtDate     = String(slice.props['asAtDate'] ?? '');
  const footnote     = String(slice.props['footnote'] ?? '');
  const rows         = (slice.props['rates'] as RateRow[]) ?? [];

  return (
    <div style={styles.rateTableWrap}>
      <div style={styles.rateTableHeader}>
        <span style={styles.rateTableTitle}>{sectionTitle}</span>
        {asAtDate && <span style={styles.rateTableDate}>As at {asAtDate}</span>}
      </div>
      <div style={styles.rateColHeaders}>
        <span style={{ flex: 1 }}>Term</span>
        <span>Interest Rate (p.a.)</span>
      </div>
      {rows.map((row, idx) => (
        <div
          key={idx}
          style={{ ...styles.rateRow, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8F8F8' }}
        >
          <span style={styles.rateRowTerm}>{row.term}</span>
          <span style={styles.rateRowRate}>{row.rate}%</span>
        </div>
      ))}
      {footnote && <div style={styles.rateFootnote}>{footnote}</div>}
    </div>
  );
}

// ─── 4. Deposit Open CTA ──────────────────────────────────────────────────────

function DepositOpenCTA({ slice }: { slice: DepositSlice }) {
  const label    = String(slice.props['label'] ?? 'Open a Deposit');
  const bgColor  = String(slice.props['backgroundColor'] ?? '#C41E3A');
  const textColor = String(slice.props['textColor'] ?? '#FFFFFF');

  return (
    <div style={styles.ctaWrap}>
      <button
        style={{ ...styles.ctaButton, backgroundColor: bgColor, color: textColor }}
        onClick={() => console.log('hsbc://deposit/open?currency=CNY&campaign=new-fund')}
      >
        {label}
      </button>
    </div>
  );
}

// ─── 5. FAQ Section ───────────────────────────────────────────────────────────

function DepositFAQSection({ slice }: { slice: DepositSlice }) {
  const sectionTitle = String(slice.props['sectionTitle'] ?? 'Frequently Asked Questions');
  const items        = (slice.props['items'] as FAQItem[]) ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={styles.faqWrap}>
      <div style={styles.faqSectionTitle}>{sectionTitle}</div>
      {items.map((item, idx) => (
        <div key={item.id} style={styles.faqItem}>
          <div
            style={styles.faqQuestion}
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <span style={{ flex: 1 }}>{item.question}</span>
            <span style={styles.faqChevron}>{expandedId === item.id ? '∧' : '∨'}</span>
          </div>
          {expandedId === item.id && (
            <div style={styles.faqAnswer}>{item.answer}</div>
          )}
          {idx < items.length - 1 && <div style={styles.divider} />}
        </div>
      ))}
    </div>
  );
}

// ─── Hardcoded fallback ───────────────────────────────────────────────────────

function DepositHardcodedFallback() {
  const rates: RateRow[] = [
    { term: '3 Month Time Deposit',  rate: '0.65' },
    { term: '6 Month Time Deposit',  rate: '0.85' },
    { term: '12 Month Time Deposit', rate: '0.95' },
    { term: '24 Month Time Deposit', rate: '1.05' },
    { term: '36 Month Time Deposit', rate: '1.25' },
    { term: '60 Month Time Deposit', rate: '1.30' },
  ];
  const faqs: FAQItem[] = [
    { id: 'faq-1', question: 'Can I withdraw my time deposit before it matures?',
      answer: "Yes, you can. But you'll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch." },
    { id: 'faq-2', question: "What happens if I don't withdraw my money after maturity?",
      answer: "If you don't take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity." },
    { id: 'faq-3', question: 'How long can I keep a time deposit?',
      answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates. The most popular choices are 6-month or 12-month plans.' },
    { id: 'faq-4', question: 'Why is the interest rate higher for time deposits than regular savings accounts?',
      answer: "Banks can offer better rates because they know you'll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest." },
  ];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <DepositHeaderBar title="Renminbi Savings Offers" />

      {/* Hero */}
      <div style={styles.heroBanner}>
        <span style={styles.heroEmoji}>🏦</span>
        <div style={styles.heroTitle}>New Fund Deposit Campaign</div>
      </div>

      {/* Rate callout */}
      <div style={styles.calloutBanner}>
        <span style={{ ...styles.calloutBadge, color: '#92400E', backgroundColor: '#1A92400E' }}>
          🔥 New Funds Only
        </span>
        <div style={{ ...styles.calloutTitle, color: '#92400E' }}>
          🌟 Up to 1.15% p.a. Annual Equivalent Rate
        </div>
        <div style={{ ...styles.calloutSubtitle, color: '#92400ECC' }}>
          3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don't miss this limited-time rate. Start earning more today.
        </div>
      </div>

      {/* Rate table */}
      <div style={styles.rateTableWrap}>
        <div style={styles.rateTableHeader}>
          <span style={styles.rateTableTitle}>Time Deposit Rate:</span>
          <span style={styles.rateTableDate}>As at 5/22/2025</span>
        </div>
        <div style={styles.rateColHeaders}>
          <span style={{ flex: 1 }}>Term</span>
          <span>Interest Rate (p.a.)</span>
        </div>
        {rates.map((row, idx) => (
          <div key={idx} style={{ ...styles.rateRow, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8F8F8' }}>
            <span style={styles.rateRowTerm}>{row.term}</span>
            <span style={styles.rateRowRate}>{row.rate}%</span>
          </div>
        ))}
        <div style={styles.rateFootnote}>
          Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.
        </div>
      </div>

      {/* CTA */}
      <div style={styles.ctaWrap}>
        <button style={{ ...styles.ctaButton, backgroundColor: '#C41E3A', color: '#FFFFFF' }}>
          Open a Deposit
        </button>
      </div>

      <div style={{ height: 16 }} />

      {/* FAQ */}
      <div style={styles.faqWrap}>
        <div style={styles.faqSectionTitle}>Frequently Asked Questions</div>
        {faqs.map((item, idx) => (
          <div key={item.id} style={styles.faqItem}>
            <div
              style={styles.faqQuestion}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <span style={{ flex: 1 }}>{item.question}</span>
              <span style={styles.faqChevron}>{expandedId === item.id ? '∧' : '∨'}</span>
            </div>
            {expandedId === item.id && (
              <div style={styles.faqAnswer}>{item.answer}</div>
            )}
            {idx < faqs.length - 1 && <div style={styles.divider} />}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function hexWithAlpha(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return hex;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    paddingBottom: 32,
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flex: 1, color: '#999', fontSize: 14, minHeight: 200,
  },
  headerBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', padding: '12px 14px',
    borderBottom: '1px solid #E0E0E0',
  },
  backArrow: { fontSize: 22, color: '#0A0A0A', cursor: 'pointer' },
  headerTitle: { fontSize: 17, fontWeight: 600, color: '#0A0A0A' },
  heroBannerImage: { width: '100%', height: 200, objectFit: 'cover', display: 'block' },
  heroBanner: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: 200, backgroundColor: '#1A3A6B', gap: 8,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', padding: '0 16px' },
  calloutBanner: {
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: 16, backgroundColor: '#FFF7ED',
  },
  calloutBadge: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    padding: '3px 10px', borderRadius: 20, alignSelf: 'flex-start',
  },
  calloutTitle: { fontSize: 16, fontWeight: 700 },
  calloutSubtitle: { fontSize: 13, lineHeight: '1.5' },
  rateTableWrap: { backgroundColor: '#FFFFFF' },
  rateTableHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', backgroundColor: '#F8F8F8',
  },
  rateTableTitle: { fontSize: 13, fontWeight: 600, color: '#333333' },
  rateTableDate:  { fontSize: 10, color: '#999999' },
  rateColHeaders: {
    display: 'flex', justifyContent: 'space-between',
    padding: '8px 16px', backgroundColor: '#F5F6F8',
    fontSize: 12, fontWeight: 600, color: '#666666',
  },
  rateRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderTop: '1px solid #F0F0F0',
  },
  rateRowTerm: { fontSize: 13, color: '#333333' },
  rateRowRate:  { fontSize: 15, fontWeight: 700, color: '#C41230' },
  rateFootnote: {
    fontSize: 10, color: '#999999', backgroundColor: '#F8F8F8',
    padding: '10px 16px',
  },
  ctaWrap: { padding: '12px 16px', backgroundColor: '#F8F8F8' },
  ctaButton: {
    width: '100%', padding: '16px 0', fontSize: 16, fontWeight: 700,
    border: 'none', borderRadius: 12, cursor: 'pointer',
  },
  faqWrap: { backgroundColor: '#FFFFFF', marginTop: 0 },
  faqSectionTitle: {
    fontSize: 13, fontWeight: 600, color: '#333333',
    padding: '12px 16px', backgroundColor: '#F8F8F8',
  },
  faqItem: { backgroundColor: '#FFFFFF' },
  faqQuestion: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '14px 16px', cursor: 'pointer', fontSize: 13, color: '#1A1A1A',
  },
  faqChevron: { fontSize: 13, color: '#999999', flexShrink: 0, marginTop: 1 },
  faqAnswer:  { fontSize: 13, color: '#666666', padding: '0 16px 14px', lineHeight: '1.5' },
  divider:    { height: 1, backgroundColor: '#F0F0F0', marginLeft: 16 },
};
