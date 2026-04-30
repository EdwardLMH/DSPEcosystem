import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import {
  WeChatServiceAccount, WeChatMessageTemplate,
  SAMessageType, SAMessageAudience, ServiceAccountMessage,
} from '../../types/ucp';
import { Button } from '../shared/Button';

// ─── Message type config ──────────────────────────────────────────────────────

const MESSAGE_TYPES: { type: SAMessageType; label: string; icon: string; desc: string }[] = [
  { type: 'TEMPLATE_MESSAGE', label: 'Template Message', icon: '📋', desc: 'Structured WeChat template with variable fields' },
  { type: 'RICH_ARTICLE',     label: 'Rich Article',     icon: '📰', desc: 'Full article extracted from page content' },
  { type: 'CUSTOMER_SERVICE', label: 'Customer Service', icon: '💬', desc: 'Custom free-text message via CS channel' },
];

const AUDIENCE_TYPES: { type: SAMessageAudience; label: string; icon: string }[] = [
  { type: 'ALL_FOLLOWERS', label: 'All Followers',    icon: '👥' },
  { type: 'SEGMENT',       label: 'Segment',          icon: '🎯' },
  { type: 'TAG',           label: 'Tag Group',        icon: '🏷️' },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusStyle(status: ServiceAccountMessage['status']): { bg: string; color: string } {
  switch (status) {
    case 'SENT':             return { bg: 'var(--prod-live-bg)',  color: 'var(--prod-live)' };
    case 'DRAFT':            return { bg: 'var(--surface-active)',color: 'var(--text-muted)' };
    case 'PENDING_APPROVAL': return { bg: 'var(--status-pending-bg)', color: 'var(--status-pending)' };
    case 'APPROVED':         return { bg: 'var(--status-approved-bg)', color: 'var(--status-approved)' };
    case 'REJECTED':         return { bg: 'var(--status-rejected-bg)', color: 'var(--status-rejected)' };
    case 'SENDING':          return { bg: 'var(--status-live-bg)', color: 'var(--status-live)' };
    case 'FAILED':           return { bg: 'var(--status-rejected-bg)', color: 'var(--status-rejected)' };
    default:                 return { bg: 'var(--surface-active)', color: 'var(--text-muted)' };
  }
}

// ─── Main composer ────────────────────────────────────────────────────────────

export function WeChatMessageComposer() {
  const { state, dispatch } = useUCP();
  const { layout, wechatAccounts, wechatTemplates, saMessages, currentUser } = state;

  // Find accounts for this page's market
  const marketAccounts = wechatAccounts.filter(a =>
    a.assignedMarkets.some(m => m.marketId === layout.marketId) && a.active
  );

  // Existing messages for this page
  const existingMessages = saMessages.filter(m => m.pageId === layout.pageId);

  // Local state
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    marketAccounts.find(a => a.assignedMarkets.some(m => m.isDefault))?.accountId ?? marketAccounts[0]?.accountId ?? ''
  );
  const [messageType,       setMessageType]       = useState<SAMessageType>('TEMPLATE_MESSAGE');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateData,      setTemplateData]      = useState<Record<string, string>>({});
  const [audienceType,      setAudienceType]      = useState<SAMessageAudience>('ALL_FOLLOWERS');
  const [scheduleOnRelease, setScheduleOnRelease] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [messageName,       setMessageName]       = useState('');

  const selectedAccount   = marketAccounts.find(a => a.accountId === selectedAccountId);
  const accountTemplates  = wechatTemplates.filter(t =>
    t.accountId === selectedAccountId &&
    t.active &&
    (!t.bizLineScope || t.bizLineScope.includes(currentUser.bizLineId))
  );
  const selectedTemplate  = accountTemplates.find(t => t.templateId === selectedTemplateId);

  const estimatedRecipients: Record<SAMessageAudience, number> = {
    ALL_FOLLOWERS: selectedAccount?.followerCount ?? 0,
    SEGMENT:       Math.round((selectedAccount?.followerCount ?? 0) * 0.4),
    TAG:           Math.round((selectedAccount?.followerCount ?? 0) * 0.12),
    OPENID_LIST:   0,
  };

  function handleTemplateFieldChange(key: string, value: string) {
    setTemplateData(prev => ({ ...prev, [key]: value }));
  }

  function handleSaveDraft() {
    dispatch({
      type: 'SHOW_TOAST',
      message: `Draft "${messageName || 'WeChat message'}" saved`,
      toastType: 'info',
    });
    dispatch({ type: 'TOGGLE_WECHAT_COMPOSER' });
  }

  function handleSubmitApproval() {
    dispatch({
      type: 'SHOW_TOAST',
      message: `WeChat message submitted for approval`,
      toastType: 'success',
    });
    dispatch({ type: 'TOGGLE_WECHAT_COMPOSER' });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => dispatch({ type: 'TOGGLE_WECHAT_COMPOSER' })}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 90,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 500, maxWidth: '95vw',
        background: 'var(--surface-panel)',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
        zIndex: 91,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
          background: '#E6F9EE',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>💬</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  WeChat Message Composer
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {layout.name}
                </div>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_WECHAT_COMPOSER' })}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
            >×</button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Message name */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Message Name</label>
            <input
              value={messageName}
              onChange={e => setMessageName(e.target.value)}
              placeholder="e.g. Jade Upgrade Invitation – May 2026"
              style={inputStyle}
            />
          </div>

          {/* ── Service Account selector ────────────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Service Account</label>
            {marketAccounts.length === 0 ? (
              <div style={{
                padding: '10px 14px', background: 'var(--surface-hover)',
                borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)',
              }}>
                No active WeChat accounts for {layout.marketId} market.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {marketAccounts.map(account => {
                  const isSelected = account.accountId === selectedAccountId;
                  const mktEntry   = account.assignedMarkets.find(m => m.marketId === layout.marketId);
                  return (
                    <label
                      key={account.accountId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isSelected ? 'var(--channel-wechat)' : 'var(--border-light)'}`,
                        background: isSelected ? '#E6F9EE' : 'var(--surface-hover)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="wechat-account"
                        value={account.accountId}
                        checked={isSelected}
                        onChange={() => { setSelectedAccountId(account.accountId); setSelectedTemplateId(''); }}
                        style={{ accentColor: 'var(--channel-wechat)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {account.displayName}
                          {mktEntry?.isDefault && (
                            <span style={{ fontSize: 9, marginLeft: 6, color: '#92671A', fontWeight: 700 }}>★ DEFAULT</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {account.wechatName} · {(account.followerCount / 1000).toFixed(0)}K followers
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Message type selector ───────────────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Message Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MESSAGE_TYPES.map(mt => {
                const isSelected = messageType === mt.type;
                return (
                  <label
                    key={mt.type}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isSelected ? 'var(--channel-wechat)' : 'var(--border-light)'}`,
                      background: isSelected ? '#E6F9EE' : 'var(--surface-hover)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="message-type"
                      value={mt.type}
                      checked={isSelected}
                      onChange={() => setMessageType(mt.type)}
                      style={{ marginTop: 2, accentColor: 'var(--channel-wechat)' }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {mt.icon} {mt.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{mt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Template Message fields ─────────────────────────────── */}
          {messageType === 'TEMPLATE_MESSAGE' && (
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Template</label>
              {accountTemplates.length === 0 ? (
                <div style={{
                  padding: '10px 14px', background: 'var(--surface-hover)',
                  borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)',
                }}>
                  No templates available for this account / biz line.
                </div>
              ) : (
                <>
                  <select
                    value={selectedTemplateId}
                    onChange={e => { setSelectedTemplateId(e.target.value); setTemplateData({}); }}
                    style={{ ...inputStyle, marginBottom: 12 }}
                  >
                    <option value="">— Select template —</option>
                    {accountTemplates.map(t => (
                      <option key={t.templateId} value={t.templateId}>{t.templateName}</option>
                    ))}
                  </select>

                  {selectedTemplate && (
                    <div style={{
                      background: 'var(--surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}>
                      {selectedTemplate.fields.map(field => (
                        <div key={field.key}>
                          <label style={labelStyle}>{field.label}</label>
                          <input
                            value={templateData[field.key] ?? ''}
                            onChange={e => handleTemplateFieldChange(field.key, e.target.value)}
                            placeholder={`Enter ${field.label}…`}
                            type={field.type === 'date' ? 'date' : 'text'}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Rich Article info box ────────────────────────────────── */}
          {messageType === 'RICH_ARTICLE' && (
            <div style={{ marginBottom: 18 }}>
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: 12,
                color: '#1D4ED8',
                marginBottom: 12,
              }}>
                Content extracted from page HTML. The article will use the page title and meta description as digest.
              </div>

              {/* WeChat article chrome mockup */}
              <div style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                maxWidth: 320,
                margin: '0 auto',
                boxShadow: 'var(--shadow-md)',
              }}>
                {/* WeChat article header bar */}
                <div style={{
                  background: '#EDEDED', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 11,
                }}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <span style={{ color: '#555', flex: 1 }}>公众号文章预览</span>
                  <span style={{ color: '#07C160', fontWeight: 700 }}>···</span>
                </div>
                {/* Article body mockup */}
                <div style={{ background: '#fff', padding: '14px 12px' }}>
                  <div style={{
                    width: '100%', height: 100,
                    background: 'linear-gradient(135deg, #0F3057, #1D4ED8)',
                    borderRadius: 6, marginBottom: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#fff', fontSize: 28 }}>H</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6, lineHeight: 1.4 }}>
                    {layout.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>
                    {layout.description ?? 'HSBC content — click to read more…'}
                  </div>
                  <div style={{
                    marginTop: 10, paddingTop: 10,
                    borderTop: '1px solid #EEE',
                    fontSize: 10, color: '#BBB',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>HSBC · {layout.locale}</span>
                    <span>👁 1.2K · 🔗 234</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Customer Service text ────────────────────────────────── */}
          {messageType === 'CUSTOMER_SERVICE' && (
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Message Content</label>
              <textarea
                rows={5}
                placeholder="Enter customer service message text…"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
            </div>
          )}

          {/* ── Audience selector ────────────────────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Audience</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AUDIENCE_TYPES.map(at => {
                const isSelected = audienceType === at.type;
                return (
                  <button
                    key={at.type}
                    onClick={() => setAudienceType(at.type)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isSelected ? 'var(--channel-wechat)' : 'var(--border-light)'}`,
                      background: isSelected ? '#E6F9EE' : '#fff',
                      color: isSelected ? '#065F46' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: isSelected ? 700 : 400,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {at.icon} {at.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Estimated recipients:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {(estimatedRecipients[audienceType] / 1000).toFixed(0)}K
              </strong>
            </div>
          </div>

          {/* ── Schedule ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Send Schedule</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  checked={scheduleOnRelease}
                  onChange={() => setScheduleOnRelease(true)}
                  style={{ accentColor: 'var(--channel-wechat)' }}
                />
                Send on page release / approval
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  checked={!scheduleOnRelease}
                  onChange={() => setScheduleOnRelease(false)}
                  style={{ accentColor: 'var(--channel-wechat)' }}
                />
                Schedule at specific date/time
              </label>
              {!scheduleOnRelease && (
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={e => setScheduledDateTime(e.target.value)}
                  style={{ ...inputStyle, marginTop: 4 }}
                />
              )}
            </div>
          </div>

          {/* ── Preview bubble ────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Preview</label>
            <div style={{
              background: '#EDEDED',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              maxWidth: 320,
            }}>
              {/* WeChat top bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 10, fontSize: 11, color: '#666',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--channel-wechat)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>H</div>
                <span style={{ fontWeight: 600 }}>{selectedAccount?.wechatName ?? 'HSBC WeChat'}</span>
              </div>
              {/* Bubble */}
              <div style={{
                background: '#fff', borderRadius: 8,
                padding: '10px 12px', fontSize: 12, lineHeight: 1.5,
                color: '#1A1A1A',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                {messageType === 'TEMPLATE_MESSAGE' && selectedTemplate ? (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {templateData['title'] || selectedTemplate.templateName}
                    </div>
                    {selectedTemplate.fields.filter(f => f.key !== 'title').map(f => (
                      <div key={f.key} style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
                        {f.label}: {templateData[f.key] || <span style={{ color: '#BBB' }}>—</span>}
                      </div>
                    ))}
                    <div style={{
                      marginTop: 10, paddingTop: 8, borderTop: '1px solid #EEE',
                      fontSize: 11, color: 'var(--channel-wechat)', fontWeight: 600,
                    }}>
                      查看详情 &gt;
                    </div>
                  </div>
                ) : messageType === 'RICH_ARTICLE' ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{
                      width: 48, height: 48, background: '#0F3057',
                      borderRadius: 4, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 900, fontSize: 18,
                    }}>H</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{layout.name}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                        {layout.description?.slice(0, 60) ?? 'HSBC article'}…
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#BBB', fontStyle: 'italic' }}>
                    [Customer service message preview]
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Existing messages ─────────────────────────────────────── */}
          {existingMessages.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Previous Messages for this Page
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {existingMessages.map(msg => {
                  const st = statusStyle(msg.status);
                  return (
                    <div
                      key={msg.messageId}
                      style={{
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {msg.messageName}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '1px 7px', borderRadius: 'var(--radius-full)',
                          ...st,
                        }}>
                          {msg.status}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {msg.accountName} · {msg.messageType.replace(/_/g, ' ')}
                      </div>
                      {msg.status === 'SENT' && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                          <span>📨 {(msg.deliveredCount / 1000).toFixed(1)}K delivered</span>
                          <span>👁 {(msg.openedCount / 1000).toFixed(1)}K opened</span>
                          <span>🔗 {(msg.clickedCount / 1000).toFixed(1)}K clicked</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          flexShrink: 0,
          background: 'var(--surface-hover)',
        }}>
          <Button variant="secondary" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button
            variant="primary"
            icon="📤"
            onClick={handleSubmitApproval}
            disabled={marketAccounts.length === 0}
            style={{ background: 'var(--channel-wechat)', borderColor: 'var(--channel-wechat)' }}
          >
            Submit for Approval
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-primary)', marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 11px',
  border: '1.5px solid var(--border-mid)',
  borderRadius: 'var(--radius-md)',
  fontSize: 13, fontFamily: 'var(--font-family)',
  outline: 'none', color: 'var(--text-primary)',
  background: '#fff',
};
