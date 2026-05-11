import React, { useState, useEffect } from 'react';
import { useSDUIContext } from '../../context/SDUIContext';
import { useChannelMeta } from '../../hooks/useChannelMeta';

// ─── BFF base URL ─────────────────────────────────────────────────────────────

const BFF_BASE = 'http://localhost:4000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FXSlice {
  instanceId: string;
  type: string;
  visible: boolean;
  props: Record<string, unknown>;
}

// ─── Root page ────────────────────────────────────────────────────────────────

export function FXViewpointPage() {
  const { bffHeaders } = useSDUIContext();
  const [slices, setSlices] = useState<FXSlice[] | null>(null);
  const [error, setError]   = useState(false);

  useChannelMeta({
    title: 'FX Viewpoint — EUR & GBP Market Insights | HSBC Hong Kong',
    description: 'Expert FX market insights from HSBC Global Research covering EUR and GBP outlook for 2026.',
    jsonLd: { '@type': 'Article', name: 'FX Viewpoint EUR & GBP', publisher: { '@type': 'Organization', name: 'HSBC' } },
  });

  useEffect(() => {
    fetch(`${BFF_BASE}/screen/fx-viewpoint-hk`, {
      headers: { ...bffHeaders, 'x-platform': 'web', Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        const children: FXSlice[] = data?.layout?.children ?? [];
        setSlices(children.filter(s => s.visible !== false));
      })
      .catch(() => setError(true));
  }, [bffHeaders['x-locale'], bffHeaders['x-channel']]);

  const stickySlice = slices?.find(
    s => s.type === 'CONTACT_RM_CTA' && s.props['sticky'] === true
  );
  const bodySlices = slices?.filter(s => s.type !== 'CONTACT_RM_CTA') ?? [];

  return (
    <div style={styles.page}>
      {/* Loading */}
      {!slices && !error && (
        <>
          <FXHeaderBar title="FX Viewpoint" />
          <div style={styles.loading}>Loading…</div>
        </>
      )}

      {/* SDUI or fallback */}
      {(slices || error) && (
        <>
          {bodySlices.length > 0
            ? bodySlices.map(s => <SliceView key={s.instanceId} slice={s} />)
            : <FXHardcodedFallback />
          }
        </>
      )}

      {/* Sticky CTA */}
      <div style={styles.stickyWrap}>
        {stickySlice
          ? <ContactRMCTA slice={stickySlice} />
          : <ContactRMBar label="Contact Your RM"
              subLabel="Speak to your Relationship Manager about FX opportunities" />
        }
      </div>
    </div>
  );
}

// ─── Slice dispatcher ─────────────────────────────────────────────────────────

function SliceView({ slice }: { slice: FXSlice }) {
  switch (slice.type) {
    case 'HEADER_NAV':
      return <FXHeaderBar
        title={String(slice.props['title'] ?? 'FX Viewpoint')}
        showBack={slice.props['showBackButton'] !== false}
      />;
    case 'VIDEO_PLAYER':
      return <FXVideoPlayer slice={slice} />;
    case 'MARKET_BRIEFING_TEXT':
      return <FXMarketBriefing slice={slice} />;
    default:
      return null;
  }
}

// ─── 1. Header Bar ────────────────────────────────────────────────────────────

function FXHeaderBar({ title = 'FX Viewpoint', showBack = true }: {
  title?: string; showBack?: boolean;
}) {
  return (
    <div style={styles.headerBar}>
      {showBack && <span style={styles.backArrow}>‹</span>}
      <span style={styles.headerTitle}>{title}</span>
    </div>
  );
}

// ─── 2. Video Player ──────────────────────────────────────────────────────────

function FXVideoPlayer({ slice }: { slice: FXSlice }) {
  const [playing, setPlaying] = useState(false);
  const videoUrl = String(slice.props['videoUrl'] ?? '');

  return (
    <div>
      {playing && videoUrl ? (
        <video
          src={videoUrl}
          controls
          autoPlay
          style={{ width: '100%', height: 210, background: '#000', display: 'block' }}
        />
      ) : (
        <FXVideoThumbnail
          title={String(slice.props['title'] ?? '')}
          onClick={videoUrl ? () => setPlaying(true) : undefined}
        />
      )}
      <div style={styles.presenterBar}>
        <div style={styles.presenterAvatar}>👤</div>
        <div>
          <div style={styles.presenterName}>{String(slice.props['presenterName'] ?? '')}</div>
          <div style={styles.presenterRole}>{String(slice.props['presenterTitle'] ?? '')}</div>
        </div>
      </div>
      <div style={styles.divider} />
    </div>
  );
}

function FXVideoThumbnail({ title, presenterName, presenterTitle, onClick }: {
  title: string; presenterName?: string; presenterTitle?: string; onClick?: () => void;
}) {
  return (
    <div>
      <div style={{ ...styles.videoThumb, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <div style={styles.playIcon}>▶</div>
        <div style={styles.videoTitle}>{title}</div>
      </div>
      {(presenterName || presenterTitle) && (
        <>
          <div style={styles.presenterBar}>
            <div style={styles.presenterAvatar}>👤</div>
            <div>
              <div style={styles.presenterName}>{presenterName}</div>
              <div style={styles.presenterRole}>{presenterTitle}</div>
            </div>
          </div>
          <div style={styles.divider} />
        </>
      )}
    </div>
  );
}

// ─── 3. Market Briefing Text ──────────────────────────────────────────────────

function FXMarketBriefing({ slice }: { slice: FXSlice }) {
  const sectionTitle = String(slice.props['sectionTitle'] ?? 'Key takeaways');
  const bullets = (slice.props['bulletPoints'] as string[]) ?? [];
  const disclaimer = String(slice.props['disclaimer'] ?? '');

  return (
    <FXBriefingCard
      sectionTitle={sectionTitle}
      bullets={bullets}
      disclaimer={disclaimer || undefined}
    />
  );
}

function FXBriefingCard({ sectionTitle, bullets, disclaimer }: {
  sectionTitle: string; bullets: string[]; disclaimer?: string;
}) {
  return (
    <div style={styles.briefingCard}>
      <h3 style={styles.briefingTitle}>{sectionTitle}</h3>
      <ul style={styles.bulletList}>
        {bullets.map((pt, i) => (
          <li key={i} style={styles.bulletItem}>
            <span style={styles.bullet} />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
      {disclaimer && (
        <p style={styles.disclaimer}>{disclaimer}</p>
      )}
    </div>
  );
}

// ─── 4. Contact RM CTA ────────────────────────────────────────────────────────

function ContactRMCTA({ slice }: { slice: FXSlice }) {
  return (
    <ContactRMBar
      label={String(slice.props['label'] ?? 'Contact Your RM')}
      subLabel={String(slice.props['subLabel'] ?? '')}
      bgColor={String(slice.props['backgroundColor'] ?? '#DB0011')}
    />
  );
}

function ContactRMBar({ label, subLabel, bgColor = '#DB0011' }: {
  label: string; subLabel?: string; bgColor?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', background: '#fff' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        backgroundColor: bgColor, borderRadius: 24, padding: '9px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 15 }}>📞</span>
        <div>
          <div style={styles.ctaLabel}>{label}</div>
          {subLabel && <div style={styles.ctaSubLabel}>{subLabel}</div>}
        </div>
        <span style={styles.ctaArrow}>›</span>
      </div>
    </div>
  );
}

// ─── Hardcoded fallback ───────────────────────────────────────────────────────

function FXHardcodedFallback() {
  const bullets = [
    'A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.',
    'With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.',
    'BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.',
    'GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.',
    'Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.',
  ];

  return (
    <>
      <FXHeaderBar title="FX Viewpoint" />
      <FXVideoThumbnail
        title="FX Viewpoint — EUR & GBP Market Insights (May 2026)"
        presenterName="Jackie Wong"
        presenterTitle="FX Strategist, HSBC Global Research"
      />
      <FXBriefingCard
        sectionTitle="Key takeaways"
        bullets={bullets}
        disclaimer="This material is issued by HSBC and is for information purposes only. It does not constitute investment advice or a recommendation to buy or sell any financial instrument."
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', minHeight: '100vh',
    backgroundColor: '#F8F8F8', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    paddingBottom: 72,
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flex: 1, color: '#999', fontSize: 14,
  },
  headerBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', padding: '12px 14px',
    borderBottom: '1px solid #E0E0E0',
  },
  backArrow: { fontSize: 22, color: '#0A0A0A', cursor: 'pointer' },
  headerTitle: { fontSize: 17, fontWeight: 600, color: '#0A0A0A' },
  divider: { height: 1, backgroundColor: '#E0E0E0' },
  videoThumb: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: 210, backgroundColor: '#003366',
    gap: 8,
  },
  playIcon: { fontSize: 40, color: '#FFFFFF' },
  videoTitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    padding: '0 16px',
  },
  presenterBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', padding: '12px 16px',
  },
  presenterAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    backgroundColor: 'rgba(0,51,102,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  },
  presenterName: { fontSize: 14, fontWeight: 600, color: '#0A0A0A' },
  presenterRole: { fontSize: 12, color: '#666' },
  briefingCard: { backgroundColor: '#FFFFFF', padding: 16 },
  briefingTitle: {
    fontSize: 16, fontWeight: 700, color: '#0A0A0A',
    margin: '0 0 16px 0',
  },
  bulletList: { listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 10 },
  bulletItem: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#333' },
  bullet: {
    width: 6, height: 6, borderRadius: '50%', backgroundColor: '#003366',
    flexShrink: 0, marginTop: 5,
  },
  disclaimer: {
    fontSize: 10, color: '#999', backgroundColor: '#F0F0F0',
    borderRadius: 6, padding: 10, margin: '0',
  },
  stickyWrap: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
  },
  ctaBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 20px',
  },
  ctaLabel: { fontSize: 14, fontWeight: 600, color: '#FFFFFF' },
  ctaSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  ctaArrow: { fontSize: 18, color: '#FFFFFF' },
};
