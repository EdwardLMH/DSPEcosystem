import React, { useState, useRef, useCallback } from 'react';
import { MOCK_UI_COMPONENTS } from '../../store/mockData';
import { UIComponent, SliceCategory, SliceType, ComponentSourceFile } from '../../types/ucp';
import { SLICE_CATEGORIES } from '../../utils/sliceDefinitions';
import { useUCP } from '../../store/UCPStore';
import { LanguageSelector } from '../shared/LanguageSelector';

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

// ─── Source file helpers ──────────────────────────────────────────────────────

const EXT_LANG_MAP: Record<string, ComponentSourceFile['language']> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript',
  swift: 'swift',
  kt: 'kotlin', kts: 'kotlin',
  dart: 'dart',
};

const LANG_PLATFORM_MAP: Record<ComponentSourceFile['language'], ComponentSourceFile['platform']> = {
  typescript: 'web',
  javascript: 'web',
  swift: 'ios',
  kotlin: 'android',
  dart: 'cross-platform',
  other: 'cross-platform',
};

const LANG_COLORS: Record<ComponentSourceFile['language'], string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  swift: '#f05138',
  kotlin: '#7f52ff',
  dart: '#00b4ab',
  other: '#94a3b8',
};

const LANG_ICONS: Record<ComponentSourceFile['language'], string> = {
  typescript: '🔷',
  javascript: '🟨',
  swift: '🔶',
  kotlin: '🟣',
  dart: '🩵',
  other: '📄',
};

function detectLanguage(fileName: string): ComponentSourceFile['language'] {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANG_MAP[ext] ?? 'other';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}



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
  grid:       '#22d3ee',
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
  sourceFiles: ComponentSourceFile[];
  gridRows: number;
  gridColumns: number;
}

const EMPTY_FORM: ComponentForm = {
  label: '', description: '', category: 'function', version: '1.0.0', maintainedBy: '', meta: {}, sourceFiles: [],
  gridRows: 2, gridColumns: 4,
};

// ─── Source File Upload Zone ──────────────────────────────────────────────────

function SourceFileUploadZone({
  files,
  onChange,
  currentUser,
}: {
  files: ComponentSourceFile[];
  onChange: (files: ComponentSourceFile[]) => void;
  currentUser: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [viewingSource, setViewingSource] = useState<ComponentSourceFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((fileList: FileList) => {
    const incoming: ComponentSourceFile[] = [];
    Array.from(fileList).forEach(file => {
      const lang = detectLanguage(file.name);
      const reader = new FileReader();
      const sf: ComponentSourceFile = {
        fileId: `sf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'text/plain',
        language: lang,
        platform: LANG_PLATFORM_MAP[lang],
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser,
        objectUrl: URL.createObjectURL(file),
      };
      reader.onload = e => {
        const text = e.target?.result as string;
        onChange([...files, ...incoming.map(f => f.fileId === sf.fileId ? { ...f, sourceText: text } : f)]);
      };
      reader.readAsText(file);
      incoming.push(sf);
    });
    if (incoming.length > 0) onChange([...files, ...incoming]);
  }, [files, onChange, currentUser]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  function removeFile(fileId: string) {
    onChange(files.filter(f => f.fileId !== fileId));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--hsbc-red)' : 'var(--surface-border)'}`,
          borderRadius: 8,
          padding: '18px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(219,0,17,0.04)' : 'var(--surface-bg)',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".ts,.tsx,.js,.jsx,.swift,.kt,.kts,.dart,.py,.go,.vue,.css,.scss"
          style={{ display: 'none' }}
          onChange={e => e.target.files && processFiles(e.target.files)}
        />
        <div style={{ fontSize: 22, marginBottom: 6 }}>📂</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Drop source files here or click to browse
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          .ts .tsx .js .jsx .swift .kt .dart and more
        </div>
      </div>

      {/* File list */}
      {files.map(f => (
        <div
          key={f.fileId}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6,
            border: '1px solid var(--surface-border)',
            background: 'var(--surface-bg)',
          }}
        >
          <span style={{ fontSize: 16 }}>{LANG_ICONS[f.language]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.fileName}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
                background: `${LANG_COLORS[f.language]}22`, color: LANG_COLORS[f.language],
              }}>{f.language}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.platform}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatBytes(f.fileSize)}</span>
            </div>
          </div>
          {f.sourceText && (
            <button
              onClick={() => setViewingSource(f)}
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid var(--surface-border)', background: 'transparent',
                color: 'var(--text-secondary)',
              }}
            >View</button>
          )}
          <button
            onClick={() => removeFile(f.fileId)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 14, padding: '2px 4px',
            }}
          >✕</button>
        </div>
      ))}

      {/* Source viewer modal */}
      {viewingSource && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-panel)', borderRadius: 12, width: 760, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
              borderBottom: '1px solid var(--surface-border)',
            }}>
              <span>{LANG_ICONS[viewingSource.language]}</span>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {viewingSource.fileName}
              </div>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                background: `${LANG_COLORS[viewingSource.language]}22`, color: LANG_COLORS[viewingSource.language],
              }}>{viewingSource.language}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(viewingSource.fileSize)}</span>
              <button
                onClick={() => setViewingSource(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, marginLeft: 4 }}
              >✕</button>
            </div>
            <pre style={{
              flex: 1, overflowY: 'auto', margin: 0, padding: '16px 18px',
              fontSize: 12, lineHeight: 1.6, fontFamily: 'monospace',
              color: 'var(--text-primary)', background: 'var(--surface-bg)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              borderRadius: '0 0 12px 12px',
            }}>
              {viewingSource.sourceText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Source File List (read-only) ─────────────────────────────────────────────

function SourceFileList({ files }: { files: ComponentSourceFile[] }) {
  const [viewingSource, setViewingSource] = useState<ComponentSourceFile | null>(null);

  if (!files.length) return (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No source files attached</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map(f => (
        <div
          key={f.fileId}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6,
            border: '1px solid var(--surface-border)',
            background: 'var(--surface-bg)',
          }}
        >
          <span style={{ fontSize: 16 }}>{LANG_ICONS[f.language]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.fileName}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
                background: `${LANG_COLORS[f.language]}22`, color: LANG_COLORS[f.language],
              }}>{f.language}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.platform}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatBytes(f.fileSize)}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>by {f.uploadedBy}</span>
            </div>
          </div>
          {f.sourceText && (
            <button
              onClick={() => setViewingSource(f)}
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid var(--surface-border)', background: 'transparent',
                color: 'var(--text-secondary)',
              }}
            >View</button>
          )}
          {f.objectUrl && !f.sourceText && (
            <a
              href={f.objectUrl}
              download={f.fileName}
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                border: '1px solid var(--surface-border)',
                color: 'var(--text-secondary)', textDecoration: 'none',
              }}
            >↓</a>
          )}
        </div>
      ))}

      {viewingSource && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-panel)', borderRadius: 12, width: 760, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
              borderBottom: '1px solid var(--surface-border)',
            }}>
              <span>{LANG_ICONS[viewingSource.language]}</span>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {viewingSource.fileName}
              </div>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                background: `${LANG_COLORS[viewingSource.language]}22`, color: LANG_COLORS[viewingSource.language],
              }}>{viewingSource.language}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(viewingSource.fileSize)}</span>
              <button
                onClick={() => setViewingSource(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, marginLeft: 4 }}
              >✕</button>
            </div>
            <pre style={{
              flex: 1, overflowY: 'auto', margin: 0, padding: '16px 18px',
              fontSize: 12, lineHeight: 1.6, fontFamily: 'monospace',
              color: 'var(--text-primary)', background: 'var(--surface-bg)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              borderRadius: '0 0 12px 12px',
            }}>
              {viewingSource.sourceText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Multi-language: active locale for the selected component
  const [activeCompLocale, setActiveCompLocale] = useState('en');

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
    const meta = (comp as any).meta ?? defaultMetaFor(comp.sliceType);
    setEditForm({
      label: comp.label,
      description: comp.description,
      category: comp.category,
      version: comp.version,
      maintainedBy: comp.maintainedBy,
      meta,
      sourceFiles: comp.sourceFiles ?? [],
      gridRows: typeof meta.gridRows === 'number' ? meta.gridRows : 2,
      gridColumns: typeof meta.gridColumns === 'number' ? meta.gridColumns : 4,
    });
  }

  function handleEditSave() {
    if (!selected || !editForm.label.trim()) return;
    const mergedMeta = editForm.category === 'grid'
      ? { ...editForm.meta, gridRows: editForm.gridRows, gridColumns: editForm.gridColumns }
      : editForm.meta;
    setComponents(prev => prev.map(c =>
      c.componentId === selected.componentId
        ? { ...c, label: editForm.label, description: editForm.description, category: editForm.category,
            version: editForm.version, maintainedBy: editForm.maintainedBy,
            updatedAt: new Date().toISOString(), meta: mergedMeta,
            sourceFiles: editForm.sourceFiles } as any
        : c
    ));
    setSelected(prev => prev ? {
      ...prev, label: editForm.label, description: editForm.description,
      category: editForm.category, version: editForm.version, maintainedBy: editForm.maintainedBy,
      updatedAt: new Date().toISOString(), meta: mergedMeta, sourceFiles: editForm.sourceFiles,
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
    const newMeta = newForm.category === 'grid'
      ? { ...newForm.meta, gridRows: newForm.gridRows, gridColumns: newForm.gridColumns }
      : newForm.meta;
    const newComp: UIComponent = {
      componentId: `comp-custom-${Date.now()}`,
      sliceType: 'CUSTOM' as any,
      label: newForm.label,
      description: newForm.description,
      icon: '⊞',
      category: newForm.category,
      configurable: newForm.category === 'grid' ? ['gridRows', 'gridColumns'] : [],
      minHeight: newForm.category === 'grid' ? newForm.gridRows * 60 : 60,
      singleton: false,
      version: newForm.version,
      maintainedBy: newForm.maintainedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      sourceFiles: newForm.sourceFiles,
      supportedLocales: ['en'],
      translations: {},
    };
    setComponents(prev => [{ ...newComp, meta: newMeta } as any, ...prev]);
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
        {selected && (() => {
          const primaryLocale = (selected.supportedLocales ?? ['en'])[0];
          const isTranslating = activeCompLocale !== primaryLocale;
          const displayLabel = isTranslating ? (selected.translations?.[activeCompLocale]?.label ?? selected.label) : selected.label;
          const displayDesc  = isTranslating ? (selected.translations?.[activeCompLocale]?.description ?? selected.description) : selected.description;
          return (
          <div style={{
            width: 380, flexShrink: 0, borderLeft: '1px solid var(--surface-border)',
            background: 'var(--surface-panel)', overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', padding: '14px 18px',
              borderBottom: '1px solid var(--surface-border)', gap: 8, flexShrink: 0,
            }}>
              <span style={{ fontSize: 24 }} aria-hidden="true">{selected.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLabel}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{selected.sliceType}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    aria-label={`Edit ${selected.label} component`}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                      border: '1px solid var(--surface-border)', background: 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >Edit</button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close component detail"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '4px 6px' }}
                >✕</button>
              </div>
            </div>

            {/* Language selector */}
            <div style={{ padding: '8px 18px', background: '#F0F4FF', borderBottom: '1px solid #C7D2FE' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4338CA', marginBottom: 5 }}>Languages</div>
              <LanguageSelector
                primaryLocale={primaryLocale}
                supportedLocales={selected.supportedLocales ?? [primaryLocale]}
                activeLocale={activeCompLocale}
                onSelectLocale={l => setActiveCompLocale(l)}
                onAddLocale={locale => {
                  dispatch({ type: 'SET_COMPONENT_LOCALES', componentId: selected.componentId, locales: [...(selected.supportedLocales ?? [primaryLocale]), locale] });
                  setActiveCompLocale(locale);
                  // also update local components state
                  setComponents(prev => prev.map(c => c.componentId === selected.componentId
                    ? { ...c, supportedLocales: [...(c.supportedLocales ?? [primaryLocale]), locale] } : c));
                }}
                onRemoveLocale={locale => {
                  dispatch({ type: 'SET_COMPONENT_LOCALES', componentId: selected.componentId, locales: (selected.supportedLocales ?? [primaryLocale]).filter(l => l !== locale) });
                  if (activeCompLocale === locale) setActiveCompLocale(primaryLocale);
                  setComponents(prev => prev.map(c => c.componentId === selected.componentId
                    ? { ...c, supportedLocales: (c.supportedLocales ?? [primaryLocale]).filter(l => l !== locale) } : c));
                }}
                size="sm"
              />
            </div>

            {/* Translation editing area when non-primary locale */}
            {isTranslating && (
              <div style={{ padding: '10px 18px', background: '#EEF2FF', borderBottom: '1px solid #C7D2FE', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', flex: 1 }}>🌐 Editing {activeCompLocale} copy</div>
                  <button
                    onClick={() => dispatch({ type: 'TRANSLATE_COMPONENT', componentId: selected.componentId, locale: activeCompLocale })}
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
                <div>
                  <label htmlFor={`comp-trans-label-${selected.componentId}`} style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Label</label>
                  <input
                    id={`comp-trans-label-${selected.componentId}`}
                    value={selected.translations?.[activeCompLocale]?.label ?? ''}
                    onChange={e => {
                      dispatch({ type: 'SET_COMPONENT_TRANSLATION', componentId: selected.componentId, locale: activeCompLocale, field: 'label', value: e.target.value });
                      setComponents(prev => prev.map(c => c.componentId === selected.componentId
                        ? { ...c, translations: { ...c.translations, [activeCompLocale]: { ...(c.translations?.[activeCompLocale] ?? {}), label: e.target.value } } } : c));
                    }}
                    placeholder={selected.label}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #C7D2FE', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label htmlFor={`comp-trans-desc-${selected.componentId}`} style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Description</label>
                  <textarea
                    id={`comp-trans-desc-${selected.componentId}`}
                    value={selected.translations?.[activeCompLocale]?.description ?? ''}
                    onChange={e => {
                      dispatch({ type: 'SET_COMPONENT_TRANSLATION', componentId: selected.componentId, locale: activeCompLocale, field: 'description', value: e.target.value });
                      setComponents(prev => prev.map(c => c.componentId === selected.componentId
                        ? { ...c, translations: { ...c.translations, [activeCompLocale]: { ...(c.translations?.[activeCompLocale] ?? {}), description: e.target.value } } } : c));
                    }}
                    placeholder={selected.description}
                    rows={2}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #C7D2FE', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Core meta fields — show translated values when in translation mode */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  General
                </div>
                {[
                  { label: 'Label',        key: 'label',        value: isEditing ? editForm.label : displayLabel },
                  { label: 'Description',  key: 'description',  value: isEditing ? editForm.description : displayDesc },
                  { label: 'Version',      key: 'version',      value: isEditing ? editForm.version : selected.version },
                  { label: 'Maintained By', key: 'maintainedBy', value: isEditing ? editForm.maintainedBy : selected.maintainedBy },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <label htmlFor={`comp-field-${f.key}-${selected.componentId}`} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>{f.label}</label>
                    {f.key === 'description' ? (
                      <textarea
                        id={`comp-field-${f.key}-${selected.componentId}`}
                        value={f.value}
                        readOnly={!isEditing || isTranslating}
                        onChange={e => isEditing && !isTranslating && setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 5,
                          border: '1px solid var(--surface-border)',
                          background: !isEditing || isTranslating ? 'var(--surface-bg)' : 'var(--surface-panel)',
                          color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                          resize: 'vertical', fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <input
                        id={`comp-field-${f.key}-${selected.componentId}`}
                        value={f.value}
                        readOnly={!isEditing || isTranslating}
                        onChange={e => isEditing && !isTranslating && setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
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

              {/* Grid layout fields — shown for grid category */}
              {(isEditing ? editForm.category : selected.category) === 'grid' && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Grid Layout
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Rows</div>
                      <input
                        type="number" min={1} max={20}
                        value={isEditing ? editForm.gridRows : ((selected as any).meta?.gridRows ?? 2)}
                        readOnly={!isEditing}
                        onChange={e => isEditing && setEditForm(prev => ({ ...prev, gridRows: Math.max(1, Number(e.target.value)) }))}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 5,
                          border: '1px solid var(--surface-border)',
                          background: !isEditing ? 'var(--surface-bg)' : 'var(--surface-panel)',
                          color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                          cursor: !isEditing ? 'default' : 'text',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Columns</div>
                      <input
                        type="number" min={1} max={12}
                        value={isEditing ? editForm.gridColumns : ((selected as any).meta?.gridColumns ?? 4)}
                        readOnly={!isEditing}
                        onChange={e => isEditing && setEditForm(prev => ({ ...prev, gridColumns: Math.max(1, Number(e.target.value)) }))}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 5,
                          border: '1px solid var(--surface-border)',
                          background: !isEditing ? 'var(--surface-bg)' : 'var(--surface-panel)',
                          color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                          cursor: !isEditing ? 'default' : 'text',
                        }}
                      />
                    </div>
                  </div>
                  {(() => {
                    const rows = isEditing ? editForm.gridRows : ((selected as any).meta?.gridRows ?? 2);
                    const cols = isEditing ? editForm.gridColumns : ((selected as any).meta?.gridColumns ?? 4);
                    const total = Math.min(rows * cols, 40);
                    return (
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface-bg)', border: '1px solid var(--surface-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {rows} row{rows !== 1 ? 's' : ''} × {cols} col{cols !== 1 ? 's' : ''}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cols, 6)}, 1fr)`, gap: 3 }}>
                          {Array.from({ length: total }).map((_, i) => (
                            <div key={i} style={{ height: 22, borderRadius: 3, background: 'var(--surface-panel)', border: '1px solid var(--surface-border)' }} />
                          ))}
                        </div>
                        {rows * cols > 40 && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                            Showing 40 of {rows * cols} cells
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

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

              {/* Source Files */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Source Files
                </div>
                {isEditing ? (
                  <SourceFileUploadZone
                    files={editForm.sourceFiles}
                    onChange={files => setEditForm(prev => ({ ...prev, sourceFiles: files }))}
                    currentUser={state.currentUser.name}
                  />
                ) : (
                  <SourceFileList files={selected.sourceFiles ?? []} />
                )}
              </div>

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
          );
        })()}
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
            background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxHeight: '85vh', overflowY: 'auto',
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
            {newForm.category === 'grid' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Grid Layout
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Rows</div>
                    <input
                      type="number" min={1} max={20}
                      value={newForm.gridRows}
                      onChange={e => setNewForm(prev => ({ ...prev, gridRows: Math.max(1, Number(e.target.value)) }))}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6,
                        border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                        color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Columns</div>
                    <input
                      type="number" min={1} max={12}
                      value={newForm.gridColumns}
                      onChange={e => setNewForm(prev => ({ ...prev, gridColumns: Math.max(1, Number(e.target.value)) }))}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6,
                        border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                        color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{
                  marginTop: 12, padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-bg)', border: '1px solid var(--surface-border)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Preview — {newForm.gridRows} row{newForm.gridRows !== 1 ? 's' : ''} × {newForm.gridColumns} column{newForm.gridColumns !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(newForm.gridColumns, 8)}, 1fr)`, gap: 4 }}>
                    {Array.from({ length: Math.min(newForm.gridRows * newForm.gridColumns, 40) }).map((_, i) => (
                      <div key={i} style={{
                        height: 28, borderRadius: 4,
                        background: 'var(--surface-panel)',
                        border: '1px solid var(--surface-border)',
                      }} />
                    ))}
                  </div>
                  {newForm.gridRows * newForm.gridColumns > 40 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                      Preview truncated — showing 40 of {newForm.gridRows * newForm.gridColumns} cells
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Source Files <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
              </div>
              <SourceFileUploadZone
                files={newForm.sourceFiles}
                onChange={files => setNewForm(prev => ({ ...prev, sourceFiles: files }))}
                currentUser={state.currentUser.name}
              />
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
