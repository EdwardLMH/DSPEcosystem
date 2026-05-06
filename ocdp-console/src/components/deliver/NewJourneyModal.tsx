import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { NativeTarget } from '../../types/ocdp';

const SCREEN_TYPES = ['TEXT_INPUT', 'DATE_PICKER', 'ID_CAPTURE', 'ADDRESS_FORM', 'DOC_UPLOAD', 'LIVENESS', 'QUESTIONNAIRE', 'GOAL_PICKER', 'PRODUCT_LIST', 'DECLARATION', 'OPEN_BANKING', 'WEALTH_DECL', 'CUSTOM'] as const;
const STEP_ICONS   = ['👤', '🎂', '📞', '🪪', '🏠', '📄', '🤳', '💰', '🔗', '✅', '📊', '🎯', '✨', '🔐', '📝', '💳', '🏦', '🌐'];

const CHANNELS = [
  { value: 'SDUI' as const,         label: 'SDUI',         icon: '📱', desc: 'JSON-driven — mobile native & web clients' },
  { value: 'WEB_STANDARD' as const, label: 'Web Standard', icon: '🌐', desc: 'OCDP renders the journey as HTML directly' },
  { value: 'WEB_WECHAT' as const,   label: 'WeChat H5',    icon: '💬', desc: 'WeChat in-app browser H5 SPA journey' },
];

const NATIVE_TARGETS: { value: NativeTarget; label: string; icon: string }[] = [
  { value: 'ios',         label: 'iOS',         icon: '🍎' },
  { value: 'android',     label: 'Android',     icon: '🤖' },
  { value: 'harmonynext', label: 'HarmonyNext',  icon: '🌸' },
  { value: 'web',         label: 'Web',         icon: '🌐' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8,
  fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };

interface StepDraft { label: string; description: string; screenType: string; icon: string }

export function NewJourneyModal() {
  const { state, dispatch } = useOCDP();
  const { bizLines, markets } = state;

  const [name,          setName]          = useState('');
  const [description,   setDescription]   = useState('');
  const [channel,       setChannel]       = useState<'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT'>('SDUI');
  const [nativeTargets, setNativeTargets] = useState<NativeTarget[]>(['ios', 'android', 'harmonynext', 'web']);
  const [marketId,      setMarketId]      = useState(markets[1]?.marketId ?? 'HK');
  const [bizLineId,     setBizLineId]     = useState('WEB_ENABLER');
  const [steps,         setSteps]         = useState<StepDraft[]>([]);
  const [addingStep,    setAddingStep]    = useState(false);
  const [newStep,       setNewStep]       = useState<StepDraft>({ label: '', description: '', screenType: 'TEXT_INPUT', icon: '👤' });

  function toggleNative(t: NativeTarget) {
    setNativeTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function handleChannelChange(ch: typeof channel) {
    setChannel(ch);
    if (ch === 'SDUI') setNativeTargets(['ios', 'android', 'harmonynext', 'web']);
  }

  function addStep() {
    if (!newStep.label.trim()) return;
    setSteps(prev => [...prev, { ...newStep }]);
    setNewStep({ label: '', description: '', screenType: 'TEXT_INPUT', icon: '👤' });
    setAddingStep(false);
  }

  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleCreate() {
    dispatch({
      type: 'CREATE_JOURNEY',
      journey: {
        name: name.trim(),
        description: description.trim(),
        channel,
        nativeTargets: channel === 'SDUI' ? nativeTargets : [],
        marketId,
        bizLineId,
      },
    });
  }

  const canCreate = name.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_NEW_JOURNEY_MODAL' }); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 600, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>New Journey</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Multi-step guided flow — choose channel first</div>
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_NEW_JOURNEY_MODAL' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>Journey Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Credit Card Application Flow" style={inputStyle} autoFocus />
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

            {/* SDUI: native target toggles */}
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

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description of this journey"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-family)' }} />
            </div>

            {/* Market + BizLine */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Market</label>
                <select value={marketId} onChange={e => setMarketId(e.target.value)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                  {markets.map(m => <option key={m.marketId} value={m.marketId}>{m.marketName}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Business Line</label>
                <select value={bizLineId} onChange={e => setBizLineId(e.target.value)} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                  {bizLines.map(b => <option key={b.bizLineId} value={b.bizLineId}>{b.displayName}</option>)}
                </select>
              </div>
            </div>

            {/* Steps builder */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Journey Steps ({steps.length})</label>
                <button onClick={() => setAddingStep(true)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  + Add Step
                </button>
              </div>

              {steps.length === 0 && !addingStep && (
                <div style={{ textAlign: 'center', padding: '20px', background: '#F9FAFB', borderRadius: 10, color: '#9CA3AF', fontSize: 12 }}>
                  No steps yet — click Add Step to begin building the flow.<br />
                  <span style={{ fontSize: 11 }}>You can also add steps after creating the journey.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#DB0011', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.screenType}</div>
                    </div>
                    <button onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>

              {addingStep && (
                <div style={{ marginTop: 10, padding: 14, background: '#FFF7F7', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Step</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Label *</label>
                      <input value={newStep.label} onChange={e => setNewStep(s => ({ ...s, label: e.target.value }))} placeholder="e.g. Identity Capture" style={inputStyle} autoFocus />
                    </div>
                    <div>
                      <label style={labelStyle}>Screen Type</label>
                      <select value={newStep.screenType} onChange={e => setNewStep(s => ({ ...s, screenType: e.target.value }))} style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
                        {SCREEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <input value={newStep.description} onChange={e => setNewStep(s => ({ ...s, description: e.target.value }))} placeholder="What happens in this step" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Icon</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STEP_ICONS.map(ic => (
                        <button key={ic} onClick={() => setNewStep(s => ({ ...s, icon: ic }))}
                          style={{ width: 32, height: 32, borderRadius: 6, fontSize: 16, border: newStep.icon === ic ? '2px solid #DB0011' : '1px solid #E5E7EB', background: newStep.icon === ic ? 'rgba(219,0,17,0.06)' : '#fff', cursor: 'pointer' }}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setAddingStep(false)} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
                    <button onClick={addStep} disabled={!newStep.label.trim()}
                      style={{ padding: '6px 14px', background: newStep.label.trim() ? '#DB0011' : '#F3F4F6', color: newStep.label.trim() ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: newStep.label.trim() ? 'pointer' : 'not-allowed' }}>
                      Add Step
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={() => dispatch({ type: 'TOGGLE_NEW_JOURNEY_MODAL' })}
            style={{ padding: '9px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!canCreate}
            style={{ padding: '9px 24px', background: canCreate ? '#DB0011' : '#F3F4F6', color: canCreate ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: canCreate ? 'pointer' : 'not-allowed' }}>
            Create Journey (Draft)
          </button>
        </div>
      </div>
    </div>
  );
}
