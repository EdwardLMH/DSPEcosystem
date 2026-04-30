import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { Channel, PageType, PageLayout, BizLineId, CampaignSchedule } from '../../types/ucp';
import { Button } from '../shared/Button';

// ─── Data ────────────────────────────────────────────────────────────────────

const CHANNEL_CARDS: {
  channel: Channel;
  title: string;
  subtitle: string;
  desc: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    channel: 'SDUI',
    title: 'SDUI',
    subtitle: 'Mobile App + WeChat Mini Program',
    desc: 'Server-driven UI — renders native iOS, Android, and WeChat mini program screens from JSON slices.',
    icon: '📱',
    color: '#fff',
    bg: 'var(--channel-sdui)',
    border: 'var(--channel-sdui)',
  },
  {
    channel: 'WEB_STANDARD',
    title: 'Web Standard',
    subtitle: 'Browser — any device',
    desc: 'Standard HSBC web pages served at hsbc.com / market domains, indexed by search engines and LLMs.',
    icon: '🌐',
    color: '#fff',
    bg: 'var(--channel-web)',
    border: 'var(--channel-web)',
  },
  {
    channel: 'WEB_WECHAT',
    title: 'WeChat Browser',
    subtitle: 'WeChat Built-in Browser + Service Account',
    desc: 'Web pages optimised for WeChat\'s embedded browser. Can be sent via Service Account messages.',
    icon: '💬',
    color: '#fff',
    bg: 'var(--channel-wechat)',
    border: 'var(--channel-wechat)',
  },
];

const PAGE_TYPES: { type: PageType; label: string; icon: string; desc: string }[] = [
  { type: 'WEALTH_HUB',  label: 'Wealth Hub',    icon: '💰', desc: 'Home page with wealth slices' },
  { type: 'KYC_JOURNEY', label: 'KYC Journey',    icon: '🪪', desc: 'Account opening onboarding flow' },
  { type: 'PRODUCT',     label: 'Product Page',   icon: '📦', desc: 'Single product landing page' },
  { type: 'CAMPAIGN',    label: 'Campaign',        icon: '🎪', desc: 'Time-limited promotional page' },
  { type: 'CUSTOM',      label: 'Custom Page',     icon: '📝', desc: 'Start from blank canvas' },
];

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function NewPageModal() {
  const { state, dispatch } = useUCP();
  const { bizLines } = state;

  const [step,        setStep]        = useState<1 | 2>(1);
  const [channel,     setChannel]     = useState<Channel | null>(null);
  const [name,        setName]        = useState('');
  const [pageType,    setPageType]    = useState<PageType>('WEALTH_HUB');
  const [scope,       setScope]       = useState<'GLOBAL' | 'MARKET'>('MARKET');
  const [bizLineId,   setBizLineId]   = useState<BizLineId>((bizLines[0]?.bizLineId ?? 'WEALTH') as BizLineId);
  const [platform,    setPlatform]    = useState<PageLayout['platform']>('all');
  const [locale,      setLocale]      = useState('en-HK');
  const [error,       setError]       = useState('');
  // Campaign schedule
  const [publishAt,   setPublishAt]   = useState('');
  const [takedownAt,  setTakedownAt]  = useState('');

  function close() {
    dispatch({ type: 'TOGGLE_NEW_PAGE_MODAL' });
  }

  function handleCreate() {
    if (!name.trim())  { setError('Page name is required'); return; }
    if (!channel)      { setError('Please select a channel'); return; }
    if (pageType === 'CAMPAIGN') {
      if (!publishAt)  { setError('Campaign publish date/time is required'); return; }
      if (!takedownAt) { setError('Campaign takedown date/time is required'); return; }
      if (new Date(takedownAt) <= new Date(publishAt)) {
        setError('Takedown date must be after publish date'); return;
      }
    }
    const campaignSchedule: CampaignSchedule | undefined = pageType === 'CAMPAIGN' && publishAt && takedownAt
      ? { publishAt: new Date(publishAt).toISOString(), takedownAt: new Date(takedownAt).toISOString() }
      : undefined;
    dispatch({
      type: 'CREATE_PAGE',
      name: name.trim(),
      pageType,
      platform,
      locale,
      channel,
      bizLineId,
      scope,
      campaignSchedule,
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 'var(--z-modal)' as any,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        width: 640,
        maxWidth: '95vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
      }}>

        {/* ── Modal header ───────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Create New Page
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Step {step} of 2 — {step === 1 ? 'Choose channel' : 'Page details'}
            </div>
          </div>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step === s ? 'var(--hsbc-red)' : step > s ? 'var(--status-approved)' : 'var(--surface-active)',
                color: step >= s ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {step > s ? '✓' : s}
              </div>
            ))}
            <button
              onClick={close}
              style={{
                marginLeft: 8,
                background: 'none', border: 'none',
                fontSize: 22, cursor: 'pointer',
                color: 'var(--text-muted)', lineHeight: 1,
              }}
            >×</button>
          </div>
        </div>

        {/* ── Modal body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* ── STEP 1: Channel selector ─────────────────────────────── */}
          {step === 1 && (
            <div>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Select the delivery channel for this page. The channel determines how the page is rendered and where it is published.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CHANNEL_CARDS.map(card => {
                  const isSelected = channel === card.channel;
                  return (
                    <div
                      key={card.channel}
                      onClick={() => setChannel(card.channel)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${isSelected ? card.border : 'var(--border-light)'}`,
                        background: isSelected ? `${card.bg}14` : '#fff',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      {/* Channel icon pill */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: card.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {card.icon}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {card.title}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: 'var(--text-muted)',
                            background: 'var(--surface-active)',
                            padding: '1px 6px', borderRadius: 4,
                          }}>
                            {card.subtitle}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {card.desc}
                        </div>
                      </div>

                      {/* Radio */}
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? card.bg : 'var(--border-mid)'}`,
                        background: isSelected ? card.bg : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 2,
                      }}>
                        {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: Details form ─────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Page name */}
              <div>
                <label style={labelStyle}>Page Name *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="e.g. Visa Platinum Q3 Campaign – HK"
                  style={{ ...inputStyle, borderColor: error ? '#EF4444' : 'var(--border-mid)' }}
                />
                {error && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{error}</div>}
              </div>

              {/* Page type */}
              <div>
                <label style={labelStyle}>Page Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PAGE_TYPES.map(pt => (
                    <div
                      key={pt.type}
                      onClick={() => setPageType(pt.type)}
                      style={{
                        border: `2px solid ${pageType === pt.type ? 'var(--hsbc-red)' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: pageType === pt.type ? '#FEF2F2' : 'var(--surface-hover)',
                        transition: 'border-color 0.12s',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{pt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{pt.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{pt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign schedule — only when pageType is CAMPAIGN */}
              {pageType === 'CAMPAIGN' && (
                <div style={{
                  background: '#FEF3C7', border: '1.5px solid #F59E0B',
                  borderRadius: 8, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎪 Campaign Schedule
                    <span style={{ fontSize: 10, fontWeight: 400, color: '#B45309' }}>
                      — timer activates automatically after approval
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, color: '#92400E' }}>Auto-Publish Date &amp; Time *</label>
                      <input
                        type="datetime-local"
                        value={publishAt}
                        onChange={e => { setPublishAt(e.target.value); setError(''); }}
                        style={{ ...inputStyle, borderColor: '#F59E0B' }}
                      />
                      <div style={{ fontSize: 10, color: '#B45309', marginTop: 3 }}>
                        Page goes LIVE at this time
                      </div>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, color: '#92400E' }}>Auto-Takedown Date &amp; Time *</label>
                      <input
                        type="datetime-local"
                        value={takedownAt}
                        min={publishAt || undefined}
                        onChange={e => { setTakedownAt(e.target.value); setError(''); }}
                        style={{ ...inputStyle, borderColor: '#F59E0B' }}
                      />
                      <div style={{ fontSize: 10, color: '#B45309', marginTop: 3 }}>
                        Page taken down at this time
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#92400E', marginTop: 10, lineHeight: 1.5 }}>
                    After approval, the page will be published automatically at the scheduled time.
                    The approver can stop the timer and choose to publish manually or send back to draft.
                  </div>
                </div>
              )}

              {/* Scope + Biz Line */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Scope</label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as 'GLOBAL' | 'MARKET')}
                    style={selectStyle}
                  >
                    <option value="MARKET">Market (your market only)</option>
                    <option value="GLOBAL">Global (all markets)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Business Line</label>
                  <select
                    value={bizLineId}
                    onChange={e => setBizLineId(e.target.value as BizLineId)}
                    style={selectStyle}
                  >
                    {bizLines.map(bl => (
                      <option key={bl.bizLineId} value={bl.bizLineId}>{bl.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Platform — only for SDUI */}
              {channel === 'SDUI' && (
                <div>
                  <label style={labelStyle}>Platform</label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value as PageLayout['platform'])}
                    style={selectStyle}
                  >
                    <option value="all">All (iOS · Android · Web)</option>
                    <option value="ios">iOS only</option>
                    <option value="android">Android only</option>
                    <option value="web">Web only</option>
                  </select>
                </div>
              )}

              {/* Locale */}
              <div>
                <label style={labelStyle}>Locale</label>
                <select
                  value={locale}
                  onChange={e => setLocale(e.target.value)}
                  style={selectStyle}
                >
                  <option value="en-HK">en-HK (English – Hong Kong)</option>
                  <option value="zh-HK">zh-HK (Traditional Chinese)</option>
                  <option value="zh-CN">zh-CN (Simplified Chinese)</option>
                  <option value="en-GB">en-GB (English – UK)</option>
                  <option value="en-SG">en-SG (English – Singapore)</option>
                  <option value="en-IN">en-IN (English – India)</option>
                </select>
              </div>

              {/* Channel reminder */}
              <div style={{
                background: 'var(--surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>
                  {CHANNEL_CARDS.find(c => c.channel === channel)?.icon}
                </span>
                <span>
                  Channel: <strong>{CHANNEL_CARDS.find(c => c.channel === channel)?.title}</strong>
                  {' — '}{CHANNEL_CARDS.find(c => c.channel === channel)?.subtitle}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal footer ───────────────────────────────────────────── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: 'var(--surface-hover)',
        }}>
          <div>
            {step === 2 && (
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                variant="primary"
                disabled={!channel}
                onClick={() => { if (channel) setStep(2); }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCreate}
              >
                Create Page
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  border: '1.5px solid var(--border-mid)',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--font-family)',
  color: 'var(--text-primary)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid var(--border-mid)',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--font-family)',
  background: '#fff',
  cursor: 'pointer',
  color: 'var(--text-primary)',
};
