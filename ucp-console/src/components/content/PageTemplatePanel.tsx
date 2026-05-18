import { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import type { PageTemplate, TemplateChannel, BizLineId } from '../../types/ucp';
import { TemplateDevicePreview } from './SlicePreview';
import { LanguageSelector } from '../shared/LanguageSelector';

// ─── Shared display helpers ───────────────────────────────────────────────────

const CHANNEL_CFG: Record<TemplateChannel, { label: string; icon: string; color: string }> = {
  SDUI:         { label: 'SDUI',         icon: '📱', color: '#D97706' },
  WEB_STANDARD: { label: 'Web Standard', icon: '🌐', color: '#2563EB' },
  WEB_WECHAT:   { label: 'WeChat H5',    icon: '💬', color: '#07C160' },
};

const CATEGORY_LABELS: Record<PageTemplate['category'], string> = {
  generic: 'Generic', campaign: 'Campaign', product: 'Product', insight: 'Market Insight', journey: 'Journey',
};

const CATEGORY_COLORS: Record<PageTemplate['category'], string> = {
  generic: '#6B7280', campaign: '#DB0011', product: '#2563EB', insight: '#7C3AED', journey: '#059669',
};

const ALL_CHANNELS: TemplateChannel[] = ['SDUI', 'WEB_STANDARD', 'WEB_WECHAT'];
const ALL_CATEGORIES: PageTemplate['category'][] = ['generic', 'campaign', 'product', 'insight', 'journey'];
const ALL_BIZ_LINES: BizLineId[] = ['PAYMENT', 'WEB_ENABLER', 'LENDING', 'COLLECTION', 'WEALTH', 'MARKETING'];

function pill(active: boolean, activeColor = '#DB0011'): React.CSSProperties {
  return { padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: active ? activeColor : '#F3F4F6', color: active ? '#fff' : '#374151', border: `1px solid ${active ? activeColor : '#E5E7EB'}`, transition: 'all 0.12s' };
}

// ─── New Template Modal ───────────────────────────────────────────────────────

const inputSt: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' };
const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' };

function NewTemplateModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useUCP();
  const [tName, setTName] = useState('');
  const [tIcon, setTIcon] = useState('📄');
  const [tDesc, setTDesc] = useState('');
  const [tCategory, setTCategory] = useState<PageTemplate['category']>('generic');
  const [tChannels, setTChannels] = useState<TemplateChannel[]>(['SDUI']);
  const [tBizLines, setTBizLines] = useState<BizLineId[]>(['WEALTH']);
  const [tSeoAeo, setTSeoAeo] = useState(false);

  function toggleCh(ch: TemplateChannel) {
    setTChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }
  function toggleBiz(id: BizLineId) {
    setTBizLines(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  }

  function handleCreate() {
    if (!tName.trim()) return;
    dispatch({
      type: 'CREATE_TEMPLATE',
      template: {
        name: tName.trim(), icon: tIcon, description: tDesc.trim(), category: tCategory,
        channels: tChannels, bizLineIds: tBizLines, seoAeoCompliance: tSeoAeo,
        status: 'ACTIVE', maintainedBy: 'UCP Author', starterSlices: [],
        supportedLocales: ['en'], translations: {},
      },
    });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>New Page Template</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Create a reusable blueprint for OCDP authors</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#9CA3AF', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Icon + Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 10 }}>
            <div>
              <label style={labelSt}>Icon</label>
              <input value={tIcon} onChange={e => setTIcon(e.target.value)} style={{ ...inputSt, textAlign: 'center', fontSize: 22 }} />
            </div>
            <div>
              <label style={labelSt}>Name *</label>
              <input value={tName} onChange={e => setTName(e.target.value)} placeholder="e.g. Credit Card Acquisition" style={inputSt} autoFocus />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelSt}>Description</label>
            <textarea value={tDesc} onChange={e => setTDesc(e.target.value)} rows={2} placeholder="Describe what pages this template is for and what requirements it enforces" style={{ ...inputSt, resize: 'vertical', fontFamily: 'var(--font-family)' }} />
          </div>

          {/* Category */}
          <div>
            <label style={labelSt}>Category</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setTCategory(cat)} style={pill(tCategory === cat, CATEGORY_COLORS[cat])}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <label style={labelSt}>Applicable Channels *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ALL_CHANNELS.map(ch => {
                const on = tChannels.includes(ch);
                const cfg = CHANNEL_CFG[ch];
                return (
                  <button key={ch} onClick={() => toggleCh(ch)} style={{ flex: 1, padding: '10px 8px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', border: on ? `2px solid ${cfg.color}` : '2px solid #E5E7EB', background: on ? `${cfg.color}10` : '#fff', transition: 'all 0.12s' }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{cfg.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: on ? cfg.color : '#374151' }}>{cfg.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Biz Lines */}
          <div>
            <label style={labelSt}>Applicable Business Lines</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {ALL_BIZ_LINES.map(id => (
                <button key={id} onClick={() => toggleBiz(id)} style={pill(tBizLines.includes(id), '#374151')}>
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* SEO / AEO Compliance */}
          <div>
            <label style={labelSt}>SEO / AEO Compliance</label>
            <button onClick={() => setTSeoAeo(v => !v)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${tSeoAeo ? '#4F46E5' : '#E5E7EB'}`, background: tSeoAeo ? '#EEF2FF' : '#F9FAFB', color: tSeoAeo ? '#4F46E5' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
              <span style={{ fontSize: 16 }}>{tSeoAeo ? '✓' : '○'}</span>
              <div>
                <div>SEO / AEO Compliant</div>
                <div style={{ fontSize: 10, fontWeight: 400, color: tSeoAeo ? '#6366F1' : '#9CA3AF', marginTop: 1 }}>
                  {tSeoAeo ? 'Predefined: SEO Hero Header · FAQ (schema.org) · Structured Data JSON-LD' : 'Enable to auto-inject SEO Hero Header, FAQ, and JSON-LD structured data slices'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleCreate} disabled={!tName.trim() || tChannels.length === 0} style={{ padding: '8px 22px', background: tName.trim() && tChannels.length ? '#DB0011' : '#F3F4F6', color: tName.trim() && tChannels.length ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: tName.trim() && tChannels.length ? 'pointer' : 'not-allowed' }}>
            Create & Open Editor →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template list card ───────────────────────────────────────────────────────

function TemplateListCard({ template, selected, onClick }: { template: PageTemplate; selected: boolean; onClick: () => void }) {
  const catColor = CATEGORY_COLORS[template.category];
  return (
    <div onClick={onClick} style={{ padding: '11px 14px', borderRadius: 8, cursor: 'pointer', background: selected ? '#FEF2F2' : '#fff', border: `1.5px solid ${selected ? '#DB0011' : '#E5E7EB'}`, transition: 'all 0.12s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = '#D1D5DB'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: catColor }} />
      <div style={{ paddingLeft: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{template.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: selected ? '#DB0011' : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
              {template.channels.map(ch => {
                const cfg = CHANNEL_CFG[ch];
                return <span key={ch} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 8, background: `${cfg.color}18`, color: cfg.color, fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>;
              })}
              {template.status === 'DEPRECATED' && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>DEPRECATED</span>}
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{template.usageCount} pages</div>
        </div>
      </div>
    </div>
  );
}

// ─── Template detail view ─────────────────────────────────────────────────────

function TemplateDetail({ template, onDeleted }: { template: PageTemplate; onDeleted: () => void }) {
  const { dispatch } = useUCP();
  const catColor = CATEGORY_COLORS[template.category];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const primaryLocale = (template.supportedLocales ?? ['en'])[0];
  const [activeLocale, setActiveLocale] = useState(primaryLocale);

  const isTranslating = activeLocale !== primaryLocale;
  const displayName = isTranslating ? (template.translations?.[activeLocale]?.name ?? template.name) : template.name;
  const displayDesc = isTranslating ? (template.translations?.[activeLocale]?.description ?? template.description) : template.description;

  function handleDelete() {
    dispatch({ type: 'DELETE_TEMPLATE', templateId: template.templateId });
    onDeleted();
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Combined header + preview hero */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(160deg,#1A1A1A,#2C2C2C)', position: 'relative', overflow: 'hidden' }}>
        {/* Category accent stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: catColor }} />

        {/* Template identity row */}
        <div style={{ paddingLeft: 18, paddingRight: 20, paddingTop: 16, paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{template.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 5, lineHeight: 1.2 }}>{displayName}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {template.channels.map(ch => {
                  const cfg = CHANNEL_CFG[ch];
                  return <span key={ch} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${cfg.color}28`, color: cfg.color, fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>;
                })}
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${catColor}28`, color: catColor, fontWeight: 700 }}>{CATEGORY_LABELS[template.category]}</span>
                {template.seoAeoCompliance && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }}>🔍 SEO/AEO</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Inline device preview */}
        {template.starterSlices.length > 0 && (
          <div style={{ paddingBottom: 20, paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 4 }} />
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'flex-start' }}>
              Preview · {template.starterSlices.length} starter slice{template.starterSlices.length !== 1 ? 's' : ''}
            </div>
            <TemplateDevicePreview slices={template.starterSlices} channels={template.channels} />
          </div>
        )}
        {template.starterSlices.length === 0 && (
          <div style={{ paddingBottom: 16, paddingLeft: 18, paddingRight: 18 }}>
            <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
              No starter slices — open the editor to add them.
            </div>
          </div>
        )}
      </div>

      {/* Detail body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
        {/* Language selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Languages</div>
          <LanguageSelector
            primaryLocale={primaryLocale}
            supportedLocales={template.supportedLocales ?? [primaryLocale]}
            activeLocale={activeLocale}
            onSelectLocale={l => setActiveLocale(l)}
            onAddLocale={locale => {
              dispatch({ type: 'SET_TEMPLATE_LOCALES', templateId: template.templateId, locales: [...(template.supportedLocales ?? [primaryLocale]), locale] });
              setActiveLocale(locale);
            }}
            onRemoveLocale={locale => {
              dispatch({ type: 'SET_TEMPLATE_LOCALES', templateId: template.templateId, locales: (template.supportedLocales ?? [primaryLocale]).filter(l => l !== locale) });
              if (activeLocale === locale) setActiveLocale(primaryLocale);
            }}
            size="sm"
          />
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 18 }}>
          {isTranslating ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', flex: 1 }}>🌐 Editing {activeLocale} copy</div>
                <button
                  onClick={() => dispatch({ type: 'TRANSLATE_TEMPLATE', templateId: template.templateId, locale: activeLocale })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', background: '#DB0011', color: '#fff',
                    border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-family)',
                  }}
                >
                  🌐 Translate
                </button>
              </div>
              <textarea
                value={template.translations?.[activeLocale]?.description ?? ''}
                onChange={e => dispatch({ type: 'SET_TEMPLATE_TRANSLATION', templateId: template.templateId, locale: activeLocale, field: 'description', value: e.target.value })}
                rows={3}
                style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #C7D2FE', borderRadius: 6, resize: 'vertical', fontFamily: 'var(--font-family)', color: '#1E1B4B', background: '#EEF2FF', boxSizing: 'border-box' }}
                placeholder={displayDesc || 'Enter translation…'}
              />
            </div>
          ) : displayDesc}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Category', value: CATEGORY_LABELS[template.category] },
            { label: 'Status', value: template.status },
            { label: 'Maintained by', value: template.maintainedBy },
            { label: 'Usage', value: `${template.usageCount} page${template.usageCount !== 1 ? 's' : ''}` },
            { label: 'Created', value: new Date(template.createdAt).toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'Updated', value: new Date(template.updatedAt).toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ].map(item => (
            <div key={item.label} style={{ padding: '8px 10px', background: '#F9FAFB', borderRadius: 7 }}>
              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Biz Lines */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Applicable Business Lines</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {template.bizLineIds.map(id => (
              <span key={id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: '#F3F4F6', color: '#374151', fontWeight: 600 }}>{id}</span>
            ))}
          </div>
        </div>

        {/* Template ID */}
        <div style={{ paddingTop: 12, borderTop: '1px solid #F3F4F6', marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 3 }}>Template ID</div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6B7280', wordBreak: 'break-all' }}>{template.templateId}</div>
        </div>

        {/* Edit CTA */}
        <button onClick={() => dispatch({ type: 'OPEN_TEMPLATE_EDITOR', templateId: template.templateId })} style={{ width: '100%', padding: '10px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          ✏️ Edit Template
        </button>

        {/* Delete CTA */}
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '9px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleDelete} style={{ flex: 1, padding: '9px', background: '#7F1D1D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Confirm Delete
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '9px', background: 'transparent', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            🗑 Delete Template
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function PageTemplatePanel() {
  const { state } = useUCP();
  const { pageTemplates } = state;

  const [filterChannel, setFilterChannel] = useState<TemplateChannel | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<PageTemplate['category'] | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(pageTemplates[0]?.templateId ?? null);
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = pageTemplates.filter(t => {
    if (filterChannel !== 'ALL' && !t.channels.includes(filterChannel)) return false;
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedTemplate = pageTemplates.find(t => t.templateId === selectedId) ?? null;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', fontFamily: 'var(--font-family)' }}>

      {/* ── Left: Template library list ── */}
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-light, #E5E7EB)', background: 'var(--surface-bg, #F9FAFB)', overflow: 'hidden' }}>
        {/* List header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border-light, #E5E7EB)', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                📋 Page Templates
                <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(219,0,17,0.08)', color: '#DB0011', fontWeight: 700 }}>
                  {pageTemplates.filter(t => t.status === 'ACTIVE').length}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Reusable page blueprints</div>
            </div>
            <button onClick={() => setShowNewModal(true)} style={{ padding: '7px 12px', background: '#DB0011', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              + New
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." style={{ width: '100%', padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button style={pill(filterChannel === 'ALL', '#6B7280')} onClick={() => setFilterChannel('ALL')}>All</button>
            {ALL_CHANNELS.map(ch => (
              <button key={ch} style={pill(filterChannel === ch, CHANNEL_CFG[ch].color)} onClick={() => setFilterChannel(ch)}>
                {CHANNEL_CFG[ch].icon}
              </button>
            ))}
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} style={pill(filterCategory === cat, CATEGORY_COLORS[cat])} onClick={() => setFilterCategory(prev => prev === cat ? 'ALL' : cat)}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#9CA3AF' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>No templates found</div>
              <div style={{ fontSize: 11, marginTop: 3 }}>Try adjusting the filter</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {filtered.map(t => (
                <TemplateListCard key={t.templateId} template={t} selected={selectedId === t.templateId} onClick={() => setSelectedId(t.templateId)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Template detail / editor CTA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {selectedTemplate ? (
          <TemplateDetail template={selectedTemplate} onDeleted={() => setSelectedId(null)} />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', gap: 10 }}>
            <span style={{ fontSize: 48 }}>📋</span>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Select a template</div>
            <div style={{ fontSize: 12 }}>Click a template from the list to view its details and open the editor</div>
          </div>
        )}
      </div>

      {showNewModal && <NewTemplateModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
