import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';

export function WeChatComposerPanel() {
  const { state } = useOCDP();
  const { wechatAccounts, wechatTemplates } = state;
  const [selectedAccountId, setSelectedAccountId] = useState(wechatAccounts[0]?.accountId ?? '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const account = wechatAccounts.find(a => a.accountId === selectedAccountId);
  const templates = wechatTemplates.filter(t => t.accountId === selectedAccountId);
  const template  = templates.find(t => t.templateId === selectedTemplateId);

  function handleSend() { setSent(true); setTimeout(() => setSent(false), 3000); }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>WeChat Composer</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Draft and send template messages via Service Accounts</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', gap: 24 }}>
        {/* Config panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
          {/* Service account picker */}
          <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-primary)' }}>Service Account</div>
            {wechatAccounts.map(a => (
              <label key={a.accountId} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: selectedAccountId === a.accountId ? 'rgba(7,193,96,0.06)' : 'transparent', border: selectedAccountId === a.accountId ? '1px solid rgba(7,193,96,0.25)' : '1px solid transparent' }}>
                <input type="radio" name="account" value={a.accountId} checked={selectedAccountId === a.accountId} onChange={() => { setSelectedAccountId(a.accountId); setSelectedTemplateId(''); setFieldValues({}); }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.wechatName} · {a.followerCount.toLocaleString()} followers</div>
                </div>
                {a.verified && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: 'rgba(7,193,96,0.1)', color: '#07C160' }}>Verified</span>}
              </label>
            ))}
          </div>

          {/* Template picker */}
          {templates.length > 0 && (
            <div style={{ background: 'var(--surface-panel)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Message Template</div>
              <select value={selectedTemplateId} onChange={e => { setSelectedTemplateId(e.target.value); setFieldValues({}); }} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', background: '#fff' }}>
                <option value="">Select template…</option>
                {templates.map(t => <option key={t.templateId} value={t.templateId}>{t.templateName}</option>)}
              </select>

              {template && (
                <div style={{ marginTop: 16 }}>
                  {template.fields.map(field => (
                    <div key={field.key} style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label} ({field.key})</label>
                      <input
                        value={fieldValues[field.key] ?? ''}
                        onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                        type={field.type === 'date' ? 'date' : 'text'}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send */}
          {template && (
            <button onClick={handleSend} disabled={sent} style={{ padding: '12px', background: sent ? '#059669' : '#07C160', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
              {sent ? '✅ Message sent!' : `Send to ${account?.wechatName ?? 'followers'}`}
            </button>
          )}
        </div>

        {/* Preview */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Preview</div>
          <div style={{ background: '#EDEDED', borderRadius: 16, padding: 16, fontFamily: '-apple-system, sans-serif' }}>
            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <div style={{ background: '#07C160', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>汇</div>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{account?.wechatName ?? 'HSBC'}</span>
              </div>
              <div style={{ padding: 14 }}>
                {template ? template.fields.map(f => (
                  <div key={f.key} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#999' }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{fieldValues[f.key] || `[${f.key}]`}</div>
                  </div>
                )) : <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '20px 0' }}>Select a template to preview</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
