import React, { useState } from 'react';
import { MOCK_UI_COMPONENTS } from '../../store/mockData';
import { UIComponent, SliceCategory, SliceType } from '../../types/ucp';
import { SLICE_CATEGORIES } from '../../utils/sliceDefinitions';
import { useUCP } from '../../store/UCPStore';

// ─── Per-type meta field schema ───────────────────────────────────────────────

interface MetaField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const TYPE_META_FIELDS: Partial<Record<SliceType, MetaField[]>> = {
  HEADER_NAV: [
    { key: 'title',                label: 'Title',                 type: 'text',    placeholder: 'e.g. 搜尋' },
    { key: 'searchPlaceholder',    label: 'Search Placeholder',    type: 'text',    placeholder: 'e.g. 搜尋功能、產品' },
    { key: 'showNotificationBell', label: 'Show Notification Bell', type: 'boolean' },
    { key: 'showQRScanner',        label: 'Show QR Scanner',       type: 'boolean' },
  ],
  QUICK_ACCESS: [
    { key: 'itemsCount',   label: 'Max Items',    type: 'number', placeholder: '4' },
    { key: 'columnsCount', label: 'Grid Columns', type: 'number', placeholder: '4' },
    { key: 'labelStyle',   label: 'Label Style',  type: 'select', options: [
      { value: 'below', label: 'Below icon' }, { value: 'hidden', label: 'Hidden' },
    ]},
  ],
  PROMO_BANNER: [
    { key: 'defaultTitle',    label: 'Default Title',    type: 'text',     placeholder: '全新活動' },
    { key: 'defaultSubtitle', label: 'Default Subtitle', type: 'text',     placeholder: '點擊了解更多' },
    { key: 'defaultCtaLabel', label: 'Default CTA Label', type: 'text',    placeholder: '立即參與' },
    { key: 'aspectRatio',     label: 'Image Aspect Ratio', type: 'select', options: [
      { value: '16:5', label: '16:5 (wide)' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1 (square)' },
    ]},
    { key: 'overlayStyle',    label: 'Overlay Style', type: 'select', options: [
      { value: 'gradient', label: 'Gradient' }, { value: 'solid', label: 'Solid' }, { value: 'none', label: 'None' },
    ]},
  ],
  FUNCTION_GRID: [
    { key: 'gridColumns', label: 'Grid Columns', type: 'select', options: [
      { value: '4', label: '4 columns' }, { value: '5', label: '5 columns' }, { value: '3', label: '3 columns' },
    ]},
    { key: 'maxRows',    label: 'Max Rows',    type: 'number', placeholder: '2' },
    { key: 'iconSize',   label: 'Icon Size',   type: 'select', options: [
      { value: 'md', label: 'Medium (40px)' }, { value: 'sm', label: 'Small (32px)' }, { value: 'lg', label: 'Large (48px)' },
    ]},
    { key: 'showLabels', label: 'Show Labels', type: 'boolean' },
  ],
  AI_ASSISTANT: [
    { key: 'defaultGreeting', label: 'Default Greeting', type: 'textarea', placeholder: 'Hi，我是你的智能財富助理' },
    { key: 'avatarStyle',     label: 'Avatar Style',    type: 'select', options: [
      { value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'none', label: 'None' },
    ]},
    { key: 'expandable',      label: 'Expandable',      type: 'boolean' },
  ],
  AD_BANNER: [
    { key: 'defaultTitle',     label: 'Default Title',    type: 'text',    placeholder: '精選推廣' },
    { key: 'defaultCtaLabel',  label: 'Default CTA Label', type: 'text',  placeholder: '了解更多' },
    { key: 'dismissible',      label: 'Dismissible by user', type: 'boolean' },
    { key: 'animationType',    label: 'Animation',        type: 'select', options: [
      { value: 'slide', label: 'Slide in' }, { value: 'fade', label: 'Fade in' }, { value: 'none', label: 'None' },
    ]},
  ],
  FLASH_LOAN: [
    { key: 'defaultProductName', label: 'Default Product Name', type: 'text',   placeholder: '閃電貸' },
    { key: 'defaultTagline',     label: 'Default Tagline',      type: 'text',   placeholder: '最高可借額度' },
    { key: 'defaultCtaLabel',    label: 'Default CTA Label',    type: 'text',   placeholder: '獲取額度' },
    { key: 'currency',           label: 'Currency',             type: 'select', options: [
      { value: 'HKD', label: 'HKD' }, { value: 'SGD', label: 'SGD' }, { value: 'GBP', label: 'GBP' }, { value: 'USD', label: 'USD' },
    ]},
    { key: 'showProgressBar',    label: 'Show Limit Progress',  type: 'boolean' },
  ],
  WEALTH_SELECTION: [
    { key: 'defaultSectionTitle', label: 'Default Section Title', type: 'text',   placeholder: '財富精選' },
    { key: 'gridColumns',         label: 'Product Grid Columns',  type: 'select', options: [
      { value: '2', label: '2 columns' }, { value: '1', label: '1 column (full-width)' }, { value: '3', label: '3 columns' },
    ]},
    { key: 'showRiskLabel',       label: 'Show Risk Label',       type: 'boolean' },
    { key: 'showYield',           label: 'Show Yield / Return',   type: 'boolean' },
  ],
  FEATURED_RANKINGS: [
    { key: 'defaultSectionTitle', label: 'Default Section Title', type: 'text',   placeholder: '特色榜單' },
    { key: 'rankingStyle',        label: 'Ranking Style',         type: 'select', options: [
      { value: 'numbered', label: 'Numbered list' }, { value: 'card', label: 'Card grid' },
    ]},
    { key: 'maxItems',            label: 'Max Items',             type: 'number', placeholder: '5' },
    { key: 'showPerformance',     label: 'Show Performance %',    type: 'boolean' },
  ],
  LIFE_DEALS: [
    { key: 'defaultSectionTitle', label: 'Default Section Title', type: 'text',   placeholder: '生活特惠' },
    { key: 'dealColumns',         label: 'Deal Columns',          type: 'select', options: [
      { value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' },
    ]},
    { key: 'showMerchantLogo',    label: 'Show Merchant Logo',    type: 'boolean' },
    { key: 'showExpiryDate',      label: 'Show Expiry Date',      type: 'boolean' },
  ],
  SPACER: [
    { key: 'defaultHeight', label: 'Default Height (px)', type: 'number', placeholder: '16' },
    { key: 'responsive',    label: 'Responsive Scaling',  type: 'boolean' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE:     { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e' },
  DEPRECATED: { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
};

const CAT_COLORS: Record<string, string> = {
  navigation: '#60a5fa',
  promotion:  '#f472b6',
  function:   '#34d399',
  wealth:     '#fbbf24',
  lifestyle:  '#a78bfa',
  layout:     '#94a3b8',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Shared field input ───────────────────────────────────────────────────────

function MetaFieldInput({
  field, value, onChange, readOnly,
}: {
  field: MetaField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 5,
    border: `1px solid var(--surface-border)`,
    background: readOnly ? 'var(--surface-bg)' : 'var(--surface-panel)',
    color: readOnly ? 'var(--text-secondary)' : 'var(--text-primary)',
    fontSize: 12, outline: 'none',
    cursor: readOnly ? 'default' : 'text',
  };

  if (field.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => !readOnly && onChange(e.target.checked)}
          disabled={readOnly}
          style={{ cursor: readOnly ? 'default' : 'pointer', accentColor: 'var(--hsbc-red)' }}
        />
        <span style={{ fontSize: 12, color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        value={String(value ?? '')}
        onChange={e => !readOnly && onChange(e.target.value)}
        disabled={readOnly}
        style={{ ...inputStyle, cursor: readOnly ? 'default' : 'pointer' }}
      >
        {field.options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={e => !readOnly && onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={field.placeholder}
        rows={2}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={String(value ?? '')}
      onChange={e => !readOnly && onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      readOnly={readOnly}
      placeholder={field.placeholder}
      style={inputStyle}
    />
  );
}

// ─── Default meta values per type ────────────────────────────────────────────

function defaultMetaFor(sliceType: SliceType): Record<string, string | boolean | number> {
  const fields = TYPE_META_FIELDS[sliceType] ?? [];
  const defaults: Record<string, string | boolean | number> = {};
  fields.forEach(f => {
    if (f.type === 'boolean') defaults[f.key] = true;
    else if (f.type === 'number') defaults[f.key] = Number(f.placeholder ?? 1);
    else if (f.type === 'select' && f.options) defaults[f.key] = f.options[0].value;
    else defaults[f.key] = '';
  });
  return defaults;
}

// ─── Component form state ─────────────────────────────────────────────────────

interface ComponentForm {
  label: string;
  description: string;
  category: SliceCategory;
  version: string;
  maintainedBy: string;
  meta: Record<string, string | boolean | number>;
}

const EMPTY_FORM: ComponentForm = {
  label: '', description: '', category: 'function', version: '1.0.0', maintainedBy: '', meta: {},
};

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ComponentRegistryPanel() {
  const { state, dispatch } = useUCP();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<SliceCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'DEPRECATED'>('all');
  const [selected, setSelected] = useState<UIComponent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ComponentForm>(EMPTY_FORM);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<ComponentForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<UIComponent | null>(null);
  const [components, setComponents] = useState<UIComponent[]>(MOCK_UI_COMPONENTS.map(c => ({
    ...c,
    meta: defaultMetaFor(c.sliceType),
  } as UIComponent & { meta: Record<string, string | boolean | number> })));

  const filtered = components.filter(c => {
    const matchSearch = !search ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.sliceType.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || c.category === filterCategory;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  function openDetail(comp: UIComponent) {
    setSelected(comp);
    setIsEditing(false);
    setEditForm({
      label: comp.label,
      description: comp.description,
      category: comp.category,
      version: comp.version,
      maintainedBy: comp.maintainedBy,
      meta: (comp as any).meta ?? defaultMetaFor(comp.sliceType),
    });
  }

  function handleEditSave() {
    if (!selected || !editForm.label.trim()) return;
    setComponents(prev => prev.map(c =>
      c.componentId === selected.componentId
        ? { ...c, label: editForm.label, description: editForm.description, category: editForm.category,
            version: editForm.version, maintainedBy: editForm.maintainedBy,
            updatedAt: new Date().toISOString(), meta: editForm.meta } as any
        : c
    ));
    setSelected(prev => prev ? {
      ...prev, label: editForm.label, description: editForm.description,
      category: editForm.category, version: editForm.version, maintainedBy: editForm.maintainedBy,
      updatedAt: new Date().toISOString(), meta: editForm.meta,
    } as any : null);
    setIsEditing(false);
  }

  function handleDeprecate(comp: UIComponent) {
    const next = comp.status === 'ACTIVE' ? 'DEPRECATED' : 'ACTIVE';
    setComponents(prev => prev.map(c =>
      c.componentId === comp.componentId ? { ...c, status: next, updatedAt: new Date().toISOString() } : c
    ));
    if (selected?.componentId === comp.componentId) setSelected(prev => prev ? { ...prev, status: next } : null);
  }

  function handleDelete(comp: UIComponent) {
    setComponents(prev => prev.filter(c => c.componentId !== comp.componentId));
    if (selected?.componentId === comp.componentId) setSelected(null);
    setConfirmDelete(null);
  }

  function handleNewSave() {
    if (!newForm.label.trim() || !newForm.maintainedBy.trim()) return;
    const newComp: UIComponent = {
      componentId: `comp-custom-${Date.now()}`,
      sliceType: 'CUSTOM' as any,
      label: newForm.label,
      description: newForm.description,
      icon: '🔧',
      category: newForm.category,
      configurable: [],
      minHeight: 60,
      singleton: false,
      version: newForm.version,
      maintainedBy: newForm.maintainedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    setComponents(prev => [{ ...newComp, meta: newForm.meta } as any, ...prev]);
    setShowNewModal(false);
    setNewForm(EMPTY_FORM);
  }

  const detailFields = selected ? (TYPE_META_FIELDS[selected.sliceType] ?? []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        borderBottom: '1px solid var(--surface-border)',
        background: 'var(--surface-panel)', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Component Registry</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            SDUI slice components — meta configuration, page usage, edit and delete
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowNewModal(true)}
          style={{
            background: 'var(--hsbc-red)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >+ New Component</button>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 20px', alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)', flexShrink: 0,
        background: 'var(--surface-panel)',
      }}>
        <input
          placeholder="Search components…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, maxWidth: 280, padding: '7px 12px', borderRadius: 6,
            border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as any)}
          style={{
            padding: '7px 12px', borderRadius: 6, border: '1px solid var(--surface-border)',
            background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
          }}
        >
          <option value="all">All Categories</option>
          {SLICE_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          style={{
            padding: '7px 12px', borderRadius: 6, border: '1px solid var(--surface-border)',
            background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
          }}
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} component{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                {['Component', 'Type / Category', 'Version', 'Maintained By', 'Updated', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(comp => {
                const isSelected = selected?.componentId === comp.componentId;
                const catColor = CAT_COLORS[comp.category] ?? '#94a3b8';
                const statusStyle = STATUS_COLORS[comp.status];
                return (
                  <tr
                    key={comp.componentId}
                    onClick={() => openDetail(comp)}
                    style={{
                      borderBottom: '1px solid var(--surface-border)',
                      background: isSelected ? 'rgba(219,0,17,0.06)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.1s',
                      opacity: comp.status === 'DEPRECATED' ? 0.65 : 1,
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(219,0,17,0.06)' : 'transparent'; }}
                  >
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{comp.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{comp.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{comp.description}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: 3 }}>{comp.sliceType}</div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                        background: `${catColor}22`, color: catColor, textTransform: 'capitalize',
                      }}>{comp.category}</span>
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      v{comp.version}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {comp.maintainedBy}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(comp.updatedAt)}
                    </td>
                    <td style={{ padding: '11px 12px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                        background: statusStyle.bg, color: statusStyle.text,
                      }}>{comp.status}</span>
                    </td>
                    <td style={{ padding: '11px 8px' }}>
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { openDetail(comp); setIsEditing(true); }}
                          title="Edit"
                          style={{
                            padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                            border: '1px solid var(--surface-border)', background: 'transparent',
                            color: 'var(--text-secondary)',
                          }}
                        >Edit</button>
                        <button
                          onClick={() => setConfirmDelete(comp)}
                          title="Delete"
                          style={{
                            padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                            border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                            color: '#ef4444',
                          }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    No components match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail / Edit panel */}
        {selected && (
          <div style={{
            width: 380, flexShrink: 0, borderLeft: '1px solid var(--surface-border)',
            background: 'var(--surface-panel)', overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', padding: '14px 18px',
              borderBottom: '1px solid var(--surface-border)', gap: 8, flexShrink: 0,
            }}>
              <span style={{ fontSize: 24 }}>{selected.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.label}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{selected.sliceType}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                      border: '1px solid var(--surface-border)', background: 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >Edit</button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '4px 6px' }}
                >✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Core meta fields */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  General
                </div>
                {[
                  { label: 'Label', key: 'label', value: isEditing ? editForm.label : selected.label },
                  { label: 'Description', key: 'description', value: isEditing ? editForm.description : selected.description },
                  { label: 'Version', key: 'version', value: isEditing ? editForm.version : selected.version },
                  { label: 'Maintained By', key: 'maintainedBy', value: isEditing ? editForm.maintainedBy : selected.maintainedBy },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{f.label}</div>
                    {f.key === 'description' ? (
                      <textarea
                        value={f.value}
                        readOnly={!isEditing}
                        onChange={e => isEditing && setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 5,
                          border: '1px solid var(--surface-border)',
                          background: !isEditing ? 'var(--surface-bg)' : 'var(--surface-panel)',
                          color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                          resize: 'vertical', fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <input
                        value={f.value}
                        readOnly={!isEditing}
                        onChange={e => isEditing && setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 5,
                          border: '1px solid var(--surface-border)',
                          background: !isEditing ? 'var(--surface-bg)' : 'var(--surface-panel)',
                          color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                        }}
                      />
                    )}
                  </div>
                ))}

                {/* Category — only editable when editing */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Category</div>
                  {isEditing ? (
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value as SliceCategory }))}
                      style={{
                        width: '100%', padding: '6px 10px', borderRadius: 5,
                        border: '1px solid var(--surface-border)', background: 'var(--surface-panel)',
                        color: 'var(--text-primary)', fontSize: 12,
                      }}
                    >
                      {SLICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  ) : (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                      borderRadius: 10, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                      background: `${CAT_COLORS[selected.category] ?? '#94a3b8'}22`,
                      color: CAT_COLORS[selected.category] ?? '#94a3b8',
                    }}>{selected.category}</div>
                  )}
                </div>
              </div>

              {/* Type-specific meta fields */}
              {detailFields.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Component Defaults
                  </div>
                  {detailFields.map(field => {
                    const currentMeta = isEditing ? editForm.meta : ((selected as any).meta ?? defaultMetaFor(selected.sliceType));
                    return (
                      <div key={field.key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</div>
                        <MetaFieldInput
                          field={field}
                          value={currentMeta[field.key] ?? (field.type === 'boolean' ? true : field.type === 'number' ? 0 : '')}
                          onChange={v => isEditing && setEditForm(prev => ({
                            ...prev, meta: { ...prev.meta, [field.key]: v },
                          }))}
                          readOnly={!isEditing}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Configurable props */}
              {selected.configurable.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Configurable Props
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {selected.configurable.map(p => (
                      <span key={p} style={{
                        fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
                        background: 'var(--surface-bg)', color: 'var(--text-secondary)',
                        border: '1px solid var(--surface-border)',
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Static info when viewing */}
              {!isEditing && (
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  {[
                    ['Singleton', selected.singleton ? 'Yes' : 'No'],
                    ['Min Height', `${selected.minHeight}px`],
                    ['Created', formatDate(selected.createdAt)],
                    ['Updated', formatDate(selected.updatedAt)],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-muted)', width: 100 }}>{k}</td>
                      <td style={{ padding: '6px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{v}</td>
                    </tr>
                  ))}
                </table>
              )}
            </div>

            {/* Panel footer actions */}
            <div style={{
              padding: '12px 18px', borderTop: '1px solid var(--surface-border)',
              display: 'flex', gap: 8, flexShrink: 0, background: 'var(--surface-panel)',
            }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6,
                      border: '1px solid var(--surface-border)', background: 'transparent',
                      color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                    }}
                  >Cancel</button>
                  <button
                    onClick={handleEditSave}
                    style={{
                      flex: 2, padding: '8px', borderRadius: 6, border: 'none',
                      background: 'var(--hsbc-red)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >Save Changes</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleDeprecate(selected)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      border: '1px solid var(--surface-border)', background: 'transparent',
                      color: selected.status === 'ACTIVE' ? '#d97706' : '#22c55e',
                    }}
                  >{selected.status === 'ACTIVE' ? 'Deprecate' : 'Re-activate'}</button>
                  <button
                    onClick={() => setConfirmDelete(selected)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444',
                    }}
                  >Delete</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Delete "{confirmDelete.label}"?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              This removes the component from the registry and Component Library. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  padding: '9px 18px', borderRadius: 6, border: 'none',
                  background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Delete Component</button>
            </div>
          </div>
        </div>
      )}

      {/* New Component Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>New Component</div>
            {[
              { label: 'Component Name *', key: 'label', placeholder: 'e.g. Rates Ticker' },
              { label: 'Description', key: 'description', placeholder: 'Brief description of what it does' },
              { label: 'Version', key: 'version', placeholder: '1.0.0' },
              { label: 'Maintained By *', key: 'maintainedBy', placeholder: 'Team or individual name' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</div>
                <input
                  value={(newForm as any)[f.key]}
                  onChange={e => setNewForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6,
                    border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</div>
              <select
                value={newForm.category}
                onChange={e => setNewForm(prev => ({ ...prev, category: e.target.value as SliceCategory }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                  color: 'var(--text-primary)', fontSize: 13,
                }}
              >
                {SLICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowNewModal(false); setNewForm(EMPTY_FORM); }}
                style={{
                  padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleNewSave}
                disabled={!newForm.label.trim() || !newForm.maintainedBy.trim()}
                style={{
                  padding: '9px 18px', borderRadius: 6, border: 'none',
                  background: !newForm.label.trim() || !newForm.maintainedBy.trim() ? 'var(--surface-border)' : 'var(--hsbc-red)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Create Component</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
