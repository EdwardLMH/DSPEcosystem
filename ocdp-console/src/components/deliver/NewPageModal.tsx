import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { Channel, BizLineId, NativeTarget } from '../../types/ocdp';

const PAGE_TYPES = ['WEALTH_HUB', 'KYC_JOURNEY', 'PRODUCT', 'CAMPAIGN', 'MARKET_INSIGHT', 'CUSTOM'] as const;

const CHANNELS: { value: Channel; label: string; icon: string; desc: string }[] = [
  { value: 'SDUI',         label: 'SDUI',         icon: '📱', desc: 'JSON-driven — rendered by mobile native & web clients' },
  { value: 'WEB_STANDARD', label: 'Web Standard', icon: '🌐', desc: 'HSBC.com web pages — OCDP renders HTML directly' },
  { value: 'WEB_WECHAT',   label: 'WeChat H5',    icon: '💬', desc: 'WeChat in-app browser — OCDP renders H5 SPA' },
];

const NATIVE_TARGETS: { value: NativeTarget; label: string; icon: string }[] = [
  { value: 'ios',          label: 'iOS',          icon: '🍎' },
  { value: 'android',      label: 'Android',      icon: '🤖' },
  { value: 'harmonynext',  label: 'HarmonyNext',  icon: '🌸' },
  { value: 'web',          label: 'Web',          icon: '🌐' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8,
  fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };

export function NewPageModal() {
  const { state, dispatch } = useOCDP();
  const { bizLines, markets, releaseTargets } = state;

  const [step, setStep] = useState<1 | 2>(1);
  const [name,          setName]          = useState('');
  const [pageType,      setPageType]      = useState<typeof PAGE_TYPES[number]>('PRODUCT');
  const [channel,       setChannel]       = useState<Channel>('SDUI');
  // SDUI: all 4 native targets checked by default
  const [nativeTargets, setNativeTargets] = useState<NativeTarget[]>(['ios', 'android', 'harmonynext', 'web']);
  const [locale,        setLocale]        = useState('en-HK');
  const [bizLineId,     setBizLineId]     = useState<BizLineId>('WEALTH');
  const [marketId,      setMarketId]      = useState(markets[1]?.marketId ?? 'HK');
  const [scope,         setScope]         = useState<'MARKET' | 'GLOBAL'>('MARKET');
  const [releaseIds,    setReleaseIds]    = useState<string[]>([]);
  const [description,   setDescription]  = useState('');

  // Web Standard extra
  const [webSlug,      setWebSlug]      = useState('');
  const [webTitle,     setWebTitle]     = useState('');
  const [webDesc,      setWebDesc]      = useState('');
  // WeChat extra
  const [wcPageUrl,    setWcPageUrl]    = useState('');
  const [wcShareTitle, setWcShareTitle] = useState('');

  const canProceed = name.trim().length > 0;

  function toggleNative(t: NativeTarget) {
    setNativeTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function toggleRelease(id: string) {
    setReleaseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleChannelChange(ch: Channel) {
    setChannel(ch);
    // Reset native targets to all-on when switching to SDUI
    if (ch === 'SDUI') setNativeTargets(['ios', 'android', 'harmonynext', 'web']);
  }

  function handleCreate() {
    const groupId = state.currentUser.groupId;
    dispatch({
      type: 'CREATE_PAGE',
      page: {
        name: name.trim(),
        pageType,
        description: description.trim() || undefined,
        nativeTargets: channel === 'SDUI' ? nativeTargets : [],
        locale,
        bizLineId,
        groupId,
        channel,
        scope,
        marketId,
        releaseMarketIds: releaseIds.length ? releaseIds : [marketId],
        thumbnail: channel === 'SDUI' ? '📱' : channel === 'WEB_WECHAT' ? '💬' : '🌐',
        tags: [],
        ...(channel === 'WEB_STANDARD' ? { webSlug, webMetaTitle: webTitle, webMetaDescription: webDesc } : {}),
        ...(channel === 'WEB_WECHAT'   ? { wechatPageUrl: wcPageUrl, wechatShareTitle: wcShareTitle } : {}),
      },
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_NEW_PAGE_MODAL' }); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 620, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>New Page</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Step {step} of 2 — {step === 1 ? 'Channel & Identity' : 'Market & Release Targets'}</div>
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_NEW_PAGE_MODAL' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ marginTop: 12, height: 3, background: '#F3F4F6', borderRadius: 2 }}>
            <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: '#DB0011', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Page name */}
              <div>
                <label style={labelStyle}>Page Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jade Investment Hub (HK)" style={inputStyle} autoFocus />
              </div>

              {/* Channel selector */}
              <div>
                <label style={labelStyle}>Channel *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {CHANNELS.map(ch => (
                    <button key={ch.value} onClick={() => handleChannelChange(ch.value)} style={{
                      flex: 1, padding: '12px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                      border: channel === ch.value ? '2px solid #DB0011' : '2px solid #E5E7EB',
                      background: channel === ch.value ? 'rgba(219,0,17,0.04)' : '#fff',
                      transition: 'all 0.12s',
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{ch.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: channel === ch.value ? '#DB0011' : '#111' }}>{ch.label}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, lineHeight: 1.3 }}>{ch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SDUI: native target checkboxes */}
              {channel === 'SDUI' && (
                <div style={{ padding: 14, background: '#FFF7F0', border: '1px solid #FDDCB5', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Native Client Targets
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {NATIVE_TARGETS.map(t => {
                      const on = nativeTargets.includes(t.value);
                      return (
                        <button key={t.value} onClick={() => toggleNative(t.value)} style={{
                          flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                          border: on ? '2px solid #D97706' : '2px solid #E5E7EB',
                          background: on ? '#FEF3C7' : '#fff',
                          transition: 'all 0.12s',
                        }}>
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: on ? '#92400E' : '#6B7280' }}>{t.label}</div>
                          <div style={{ fontSize: 9, color: on ? '#B45309' : '#9CA3AF', marginTop: 2 }}>{on ? '✓ included' : 'excluded'}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8 }}>
                    SDUI JSON will be delivered to all selected clients — iOS, Android, HarmonyNext native apps, and the Web SDUI renderer.
                  </div>
                </div>
              )}

              {/* Page type + locale in a row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Page Type</label>
                  <select value={pageType} onChange={e => setPageType(e.target.value as typeof PAGE_TYPES[number])} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                    {PAGE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Locale</label>
                  <input value={locale} onChange={e => setLocale(e.target.value)} placeholder="en-HK" style={inputStyle} />
                </div>
              </div>

              {/* Biz line */}
              <div>
                <label style={labelStyle}>Business Line</label>
                <select value={bizLineId} onChange={e => setBizLineId(e.target.value as BizLineId)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                  {bizLines.map(b => <option key={b.bizLineId} value={b.bizLineId}>{b.displayName}</option>)}
                </select>
              </div>

              {/* Web Standard extra fields */}
              {channel === 'WEB_STANDARD' && (
                <div style={{ padding: 14, background: '#F9FAFB', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Web Standard — SEO</div>
                  <div>
                    <label style={labelStyle}>URL Slug</label>
                    <input value={webSlug} onChange={e => setWebSlug(e.target.value)} placeholder="/credit-cards/visa-platinum" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Meta Title</label>
                    <input value={webTitle} onChange={e => setWebTitle(e.target.value)} placeholder="Page title for search engines" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Meta Description</label>
                    <input value={webDesc} onChange={e => setWebDesc(e.target.value)} placeholder="Short description for search results" style={inputStyle} />
                  </div>
                </div>
              )}

              {/* WeChat extra fields */}
              {channel === 'WEB_WECHAT' && (
                <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WeChat H5</div>
                  <div>
                    <label style={labelStyle}>WeChat Page URL</label>
                    <input value={wcPageUrl} onChange={e => setWcPageUrl(e.target.value)} placeholder="https://wechat.hsbc.com.hk/pages/..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Share Title</label>
                    <input value={wcShareTitle} onChange={e => setWcShareTitle(e.target.value)} placeholder="WeChat share card title" style={inputStyle} />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this page" rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-family)' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Scope */}
              <div>
                <label style={labelStyle}>Scope</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['MARKET', 'GLOBAL'] as const).map(s => (
                    <button key={s} onClick={() => setScope(s)} style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                      border: scope === s ? '2px solid #DB0011' : '2px solid #E5E7EB',
                      background: scope === s ? 'rgba(219,0,17,0.04)' : '#fff',
                      fontSize: 13, fontWeight: scope === s ? 700 : 500,
                      color: scope === s ? '#DB0011' : '#374151',
                    }}>
                      {s === 'MARKET' ? '🌏 Market-Specific' : '🌍 Global'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary market */}
              <div>
                <label style={labelStyle}>Primary Market</label>
                <select value={marketId} onChange={e => setMarketId(e.target.value)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                  {markets.map(m => <option key={m.marketId} value={m.marketId}>{m.marketName}</option>)}
                </select>
              </div>

              {/* Release targets */}
              <div>
                <label style={labelStyle}>Release Targets (select markets for approval routing)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#F9FAFB', borderRadius: 10 }}>
                  {releaseTargets.map(rt => (
                    <label key={rt.targetId} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={releaseIds.includes(rt.targetId)} onChange={() => toggleRelease(rt.targetId)}
                        style={{ width: 15, height: 15, accentColor: '#DB0011', cursor: 'pointer' }} />
                      <span style={{ fontWeight: 600, color: '#111' }}>{rt.targetId}</span>
                      <span style={{ color: '#6B7280' }}>{rt.displayName}</span>
                      {rt.isGlobal && <span style={{ fontSize: 10, background: '#EEF2FF', color: '#4F46E5', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>GLOBAL</span>}
                    </label>
                  ))}
                </div>
                {releaseIds.length === 0 && (
                  <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>⚠ No targets selected — will default to primary market</div>
                )}
              </div>

              {/* Summary */}
              <div style={{ padding: 14, background: '#F0F9FF', borderRadius: 10, borderLeft: '3px solid #0EA5E9' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
                  <div style={{ color: '#6B7280' }}>Name</div><div style={{ fontWeight: 600 }}>{name || '—'}</div>
                  <div style={{ color: '#6B7280' }}>Channel</div><div style={{ fontWeight: 600 }}>{channel}</div>
                  {channel === 'SDUI' && (
                    <><div style={{ color: '#6B7280' }}>Native Targets</div><div style={{ fontWeight: 600 }}>{nativeTargets.length ? nativeTargets.join(', ') : 'none'}</div></>
                  )}
                  <div style={{ color: '#6B7280' }}>Type</div><div style={{ fontWeight: 600 }}>{pageType}</div>
                  <div style={{ color: '#6B7280' }}>Biz Line</div><div style={{ fontWeight: 600 }}>{bizLineId}</div>
                  <div style={{ color: '#6B7280' }}>Scope</div><div style={{ fontWeight: 600 }}>{scope}</div>
                  <div style={{ color: '#6B7280' }}>Targets</div><div style={{ fontWeight: 600 }}>{releaseIds.length ? releaseIds.join(', ') : marketId}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          {step === 1 ? (
            <>
              <button onClick={() => dispatch({ type: 'TOGGLE_NEW_PAGE_MODAL' })}
                style={{ padding: '9px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => setStep(2)} disabled={!canProceed}
                style={{ padding: '9px 24px', background: canProceed ? '#DB0011' : '#F3F4F6', color: canProceed ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canProceed ? 'pointer' : 'not-allowed' }}>
                Next: Release Targets →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)}
                style={{ padding: '9px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={handleCreate}
                style={{ padding: '9px 24px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Create Page (Draft)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
