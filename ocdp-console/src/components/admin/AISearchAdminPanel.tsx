import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { AISearchAssetSource, AISearchConfig, AISearchAppId, AISearchContentSource, AISearchContentSourceType } from '../../types/ocdp';
import { v4 } from '../../utils/uuid';

const BFF_BASE = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BFF_BASE_URL ?? 'http://localhost:4000';

const APP_META: Record<AISearchAppId, { label: string; icon: string }> = {
  ios:         { label: 'iOS App',         icon: '' },
  android:     { label: 'Android App',     icon: '🤖' },
  harmonynext: { label: 'HarmonyNext App', icon: '⬡' },
  web:         { label: 'Web / Website',   icon: '🌐' },
};

const REFRESH_LABELS: Record<string, string> = {
  manual: 'Manual only',
  hourly: 'Every hour',
  daily:  'Every day',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--border-mid)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-family)',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };
const ta: React.CSSProperties  = { ...inp, resize: 'vertical', minHeight: 90 };

function summarizeRules(config: AISearchConfig) {
  const assetRules = config.assetSources?.reduce((sum, src) => sum + src.audienceRules.length, 0) ?? 0;
  const entryRules = config.entryPointRules?.reduce((sum, src) => sum + src.visibilityRules.length + (src.audienceRules?.length ?? 0), 0) ?? 0;
  const contentRules = config.contentSources.reduce((sum, src) => sum + (src.visibilityRules?.length ?? 0), 0);
  return assetRules + entryRules + contentRules;
}

function audienceSummary(src: AISearchAssetSource) {
  if (src.audienceRules.length === 0) return 'No audience rule';
  return src.audienceRules.map(rule => {
    const parts = [
      rule.customerSegments?.join('/'),
      rule.accountTypes?.join('/'),
      rule.locations?.join('/'),
    ].filter(Boolean);
    return `${rule.action.toUpperCase()}: ${parts.join(' · ') || 'all profiles'}`;
  }).join('; ');
}

// ─── Config card ─────────────────────────────────────────────────────────────

function ConfigCard({
  config,
  onEdit,
  onDelete,
  onRebuild,
  rebuilding,
}: {
  config: AISearchConfig;
  onEdit: (c: AISearchConfig) => void;
  onDelete: (id: string) => void;
  onRebuild: (id: string) => void;
  rebuilding: boolean;
}) {
  const meta = APP_META[config.appId];
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 28, lineHeight: 1, marginTop: 2 }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{config.displayName}</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: config.enabled ? '#D1FAE5' : '#F3F4F6',
            color: config.enabled ? '#059669' : '#9CA3AF' }}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
            background: 'rgba(219,0,17,0.06)', color: '#DB0011' }}>
            {meta.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Quick access: <strong>{config.quickAccessSource.mode === 'url' ? config.quickAccessSource.url || '—' : 'Inline JSON'}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Content sources: <strong>{config.contentSources.length}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Asset rules: <strong>{config.assetSources?.length ?? 0}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Entry rules: <strong>{config.entryPointRules?.length ?? 0}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Refresh: <strong>{REFRESH_LABELS[config.refreshSchedule]}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Corpus: <strong>{config.corpusSize} items</strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Rules: <strong>{summarizeRules(config)}</strong>
          </span>
          {config.lastRebuiltAt && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last rebuilt: {new Date(config.lastRebuiltAt).toLocaleString()}
            </span>
          )}
          {!config.lastRebuiltAt && (
            <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>Never rebuilt</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onRebuild(config.configId)}
          disabled={rebuilding}
          style={{
            fontSize: 11, cursor: rebuilding ? 'default' : 'pointer',
            padding: '5px 12px', borderRadius: 6, border: '1px solid #60A5FA',
            background: rebuilding ? '#F3F4F6' : '#EFF6FF', color: rebuilding ? '#9CA3AF' : '#2563EB',
            fontFamily: 'var(--font-family)',
          }}>
          {rebuilding ? 'Rebuilding…' : 'Rebuild Corpus'}
        </button>
        <button onClick={() => onEdit(config)}
          style={{ fontSize: 11, cursor: 'pointer', padding: '5px 12px', borderRadius: 6,
            border: '1px solid var(--border-light)', background: 'var(--surface-hover)',
            color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' }}>
          Edit
        </button>
        <button onClick={() => onDelete(config.configId)}
          style={{ fontSize: 11, cursor: 'pointer', padding: '5px 12px', borderRadius: 6,
            border: '1px solid #FECACA', background: '#FEE2E2', color: '#DC2626',
            fontFamily: 'var(--font-family)' }}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Content source row ───────────────────────────────────────────────────────

function ContentSourceRow({
  source,
  pages,
  onRemove,
}: {
  source: AISearchContentSource;
  pages: { pageId: string; name: string }[];
  onRemove: () => void;
}) {
  const label = source.type === 'ocdp_page'
    ? (pages.find(p => p.pageId === source.ref)?.name ?? source.label)
    : source.label || source.ref;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      background: 'var(--surface-bg)', borderRadius: 6, border: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
        background: source.type === 'ocdp_page' ? '#DBEAFE' : '#FEF3C7',
        color: source.type === 'ocdp_page' ? '#1D4ED8' : '#92400E' }}>
        {source.type === 'ocdp_page' ? 'OCDP' : 'AEM'}
      </span>
      <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
        {label}
      </span>
      <button onClick={onRemove}
        style={{ fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
          border: '1px solid #FECACA', background: '#FEE2E2', color: '#DC2626',
          fontFamily: 'var(--font-family)' }}>
        ×
      </button>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type FormState = Partial<Omit<AISearchConfig, 'contentSources'>> & { contentSources: AISearchContentSource[] };

export function AISearchAdminPanel() {
  const { state, dispatch } = useOCDP();
  const { aiSearchConfigs, pages } = state;

  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<AISearchConfig | null>(null);
  const [form, setForm]             = useState<FormState>({ contentSources: [] });
  const [rebuildingId, setRebuildingId] = useState<string | null>(null);
  const [rebuildStatus, setRebuildStatus] = useState<Record<string, string>>({});

  // Content source adder state
  const [newSourceType, setNewSourceType] = useState<AISearchContentSourceType>('ocdp_page');
  const [newSourcePageId, setNewSourcePageId] = useState('');
  const [newSourceAemUrl, setNewSourceAemUrl] = useState('');
  const [reviewItem, setReviewItem] = useState<{ title: string; payload: unknown } | null>(null);
  const [newAssetType, setNewAssetType] = useState<AISearchAssetSource['type']>('video');
  const [newAssetLabel, setNewAssetLabel] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');

  const livePages = pages.filter(p => p.authoringStatus === 'LIVE' || p.authoringStatus === 'APPROVED');

  function openNew() {
    setForm({
      configId: v4(),
      appId: 'ios',
      displayName: '',
      enabled: true,
      quickAccessSource: { mode: 'url', url: '' },
      contentSources: [],
      refreshSchedule: 'manual',
      lastRebuiltAt: null,
      corpusSize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(c: AISearchConfig) {
    setForm({ ...c, contentSources: [...c.contentSources] });
    setEditing(c);
    setShowForm(true);
  }

  function save() {
    if (!form.displayName || !form.appId) return;
    const now = new Date().toISOString();
    if (editing) {
      dispatch({
        type: 'EDIT_AI_SEARCH_CONFIG',
        configId: editing.configId,
        updates: { ...form, updatedAt: now } as Partial<AISearchConfig>,
      });
    } else {
      dispatch({
        type: 'ADD_AI_SEARCH_CONFIG',
        config: { ...form, createdAt: now, updatedAt: now } as AISearchConfig,
      });
    }
    setShowForm(false);
  }

  function addContentSource() {
    if (newSourceType === 'ocdp_page' && !newSourcePageId) return;
    if (newSourceType === 'aem_url' && !newSourceAemUrl) return;

    const source: AISearchContentSource = newSourceType === 'ocdp_page'
      ? {
          type: 'ocdp_page',
          ref: newSourcePageId,
          label: pages.find(p => p.pageId === newSourcePageId)?.name ?? newSourcePageId,
        }
      : {
          type: 'aem_url',
          ref: newSourceAemUrl,
          label: newSourceAemUrl,
        };

    setForm(f => ({ ...f, contentSources: [...(f.contentSources ?? []), source] }));
    setNewSourcePageId('');
    setNewSourceAemUrl('');
  }

  function removeContentSource(idx: number) {
    setForm(f => ({ ...f, contentSources: f.contentSources.filter((_, i) => i !== idx) }));
  }

  function removeAssetSource(idx: number) {
    setForm(f => ({ ...f, assetSources: (f.assetSources ?? []).filter((_, i) => i !== idx) }));
  }

  function editAssetSource(idx: number, patch: Partial<AISearchAssetSource>) {
    setForm(f => ({
      ...f,
      assetSources: (f.assetSources ?? []).map((src, i) => i === idx ? { ...src, ...patch } : src),
    }));
  }

  function addAssetSource() {
    if (!newAssetLabel || !newAssetUrl) return;
    const isFolder = newAssetUrl.endsWith('/');
    const source: AISearchAssetSource = {
      sourceId: `asset-${Date.now()}`,
      type: newAssetType,
      label: newAssetLabel,
      ...(isFolder ? { parentFolderUrl: newAssetUrl } : { url: newAssetUrl }),
      description: `${newAssetLabel} configured for semantic search`,
      keywords: newAssetLabel,
      audienceRules: [
        {
          ruleId: `allow-${Date.now()}`,
          label: 'Default HK audience',
          customerSegments: ['premier', 'elite'],
          accountTypes: ['wealth_account'],
          locations: ['HK'],
          action: 'allow',
        },
      ],
    };
    setForm(f => ({ ...f, assetSources: [...(f.assetSources ?? []), source] }));
    setNewAssetLabel('');
    setNewAssetUrl('');
  }

  async function handleRebuild(configId: string) {
    setRebuildingId(configId);
    setRebuildStatus(s => ({ ...s, [configId]: '' }));
    try {
      const config = aiSearchConfigs.find(c => c.configId === configId);
      const res = await fetch(`${BFF_BASE}/api/v1/search/config/${configId}/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: config ? JSON.stringify(config) : undefined,
      });
      const data = await res.json();
      if (res.ok) {
        dispatch({
          type: 'EDIT_AI_SEARCH_CONFIG',
          configId,
          updates: {
            lastRebuiltAt: data.rebuiltAt ?? new Date().toISOString(),
            corpusSize: data.corpusSize ?? 0,
          },
        });
        setRebuildStatus(s => ({ ...s, [configId]: `Done — ${data.corpusSize ?? '?'} items indexed` }));
      } else {
        setRebuildStatus(s => ({ ...s, [configId]: `Error: ${data.message ?? res.status}` }));
      }
    } catch {
      setRebuildStatus(s => ({ ...s, [configId]: 'Network error' }));
    } finally {
      setRebuildingId(null);
    }
  }

  const usedAppIds = aiSearchConfigs.filter(c => c.configId !== editing?.configId).map(c => c.appId);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-bg)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>AI Search</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Configure semantic search for each mobile app and the website. Each app gets its own corpus built from entry points, OCDP/AEM content, and governed video, image, and file URLs.
            </p>
          </div>
          <button
            onClick={openNew}
            disabled={usedAppIds.length >= 4}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: 'none', cursor: usedAppIds.length >= 4 ? 'default' : 'pointer',
              background: usedAppIds.length >= 4 ? '#F3F4F6' : '#DB0011',
              color: usedAppIds.length >= 4 ? '#9CA3AF' : '#fff',
              fontFamily: 'var(--font-family)', flexShrink: 0,
            }}>
            + New Config
          </button>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          {(['ios', 'android', 'harmonynext', 'web'] as AISearchAppId[]).map(appId => {
            const cfg = aiSearchConfigs.find(c => c.appId === appId);
            return (
              <div key={appId} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-light)',
                background: cfg?.enabled ? '#F0FDF4' : '#F9FAFB',
              }}>
                <span style={{ fontSize: 16 }}>{APP_META[appId].icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: cfg?.enabled ? '#15803D' : 'var(--text-muted)' }}>
                  {APP_META[appId].label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                  background: cfg ? (cfg.enabled ? '#BBF7D0' : '#E5E7EB') : '#FEE2E2',
                  color: cfg ? (cfg.enabled ? '#15803D' : '#6B7280') : '#DC2626' }}>
                  {cfg ? (cfg.enabled ? `${cfg.corpusSize} items` : 'disabled') : 'not configured'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {aiSearchConfigs.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>No AI Search configs yet</div>
            <div style={{ fontSize: 13 }}>Create a config for each app or website to enable semantic search.</div>
          </div>
        )}
        {aiSearchConfigs.map(cfg => (
          <div key={cfg.configId}>
            <ConfigCard
              config={cfg}
              onEdit={openEdit}
              onDelete={id => dispatch({ type: 'DELETE_AI_SEARCH_CONFIG', configId: id })}
              onRebuild={handleRebuild}
              rebuilding={rebuildingId === cfg.configId}
            />
            {rebuildStatus[cfg.configId] && (
              <div style={{
                padding: '6px 20px 6px 72px', fontSize: 12, fontWeight: 600,
                color: rebuildStatus[cfg.configId].startsWith('Error') || rebuildStatus[cfg.configId] === 'Network error'
                  ? '#DC2626' : '#059669',
              }}>
                {rebuildStatus[cfg.configId]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Slide-in form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', zIndex: 200,
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{
            width: 520, height: '100%', overflowY: 'auto',
            background: '#fff', padding: 28, boxSizing: 'border-box',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {editing ? 'Edit AI Search Config' : 'New AI Search Config'}
              </h3>
              <button onClick={() => setShowForm(false)}
                style={{ fontSize: 20, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
            </div>

            {/* App target */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>App / Platform</span>
              <select style={sel} value={form.appId ?? 'ios'}
                onChange={e => setForm(f => ({ ...f, appId: e.target.value as AISearchAppId }))}>
                {(['ios', 'android', 'harmonynext', 'web'] as AISearchAppId[]).map(id => (
                  <option key={id} value={id} disabled={usedAppIds.includes(id)}>
                    {APP_META[id].label}{usedAppIds.includes(id) ? ' (already configured)' : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Display name */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Display Name</span>
              <input style={inp} placeholder="e.g. HSBC HK iOS Search" value={form.displayName ?? ''}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
            </label>

            {/* Enabled toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Enable AI Search for this app</span>
            </label>

            {/* Quick access source */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Quick Access Entry Points</div>
              <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
                {(['url', 'json'] as const).map(mode => (
                  <button key={mode}
                    onClick={() => setForm(f => ({ ...f, quickAccessSource: { ...f.quickAccessSource, mode } as AISearchConfig['quickAccessSource'] }))}
                    style={{
                      flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
                      border: '1px solid var(--border-mid)', cursor: 'pointer',
                      background: form.quickAccessSource?.mode === mode ? '#DB0011' : '#fff',
                      color: form.quickAccessSource?.mode === mode ? '#fff' : 'var(--text-secondary)',
                      borderRadius: mode === 'url' ? '6px 0 0 6px' : '0 6px 6px 0',
                      fontFamily: 'var(--font-family)',
                    }}>
                    {mode === 'url' ? 'Remote URL' : 'Inline JSON'}
                  </button>
                ))}
              </div>

              {form.quickAccessSource?.mode === 'url' ? (
                <input style={inp}
                  placeholder="https://example.com/quick-access.json"
                  value={form.quickAccessSource.url ?? ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    quickAccessSource: { ...f.quickAccessSource!, url: e.target.value },
                  }))} />
              ) : (
                <>
                  <textarea style={ta}
                    placeholder={'[\n  { "id": "fn-transfer", "title": "Transfer", "icon": "↔️", "deepLink": "hsbc://transfer", "description": "...", "keywords": "transfer,send" }\n]'}
                    value={form.quickAccessSource?.json ?? ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      quickAccessSource: { ...f.quickAccessSource!, json: e.target.value },
                    }))} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Each item must include: id, title, icon, deepLink, description, keywords (comma-separated).
                  </div>
                </>
              )}
            </div>

            {/* Content sources */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Content Sources ({form.contentSources.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {form.contentSources.map((src, idx) => (
                  <ContentSourceRow
                    key={idx}
                    source={src}
                    pages={pages}
                    onRemove={() => removeContentSource(idx)}
                  />
                ))}
                {form.contentSources.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No content sources added yet.</div>
                )}
              </div>

              {/* Add new source */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <select style={{ ...sel, flex: '0 0 110px' }} value={newSourceType}
                  onChange={e => setNewSourceType(e.target.value as AISearchContentSourceType)}>
                  <option value="ocdp_page">OCDP Page</option>
                  <option value="aem_url">AEM URL</option>
                </select>

                {newSourceType === 'ocdp_page' ? (
                  <select style={{ ...sel, flex: 1 }} value={newSourcePageId}
                    onChange={e => setNewSourcePageId(e.target.value)}>
                    <option value="">— select a live page —</option>
                    {livePages.map(p => (
                      <option key={p.pageId} value={p.pageId}
                        disabled={form.contentSources.some(s => s.ref === p.pageId)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input style={{ ...inp, flex: 1 }} placeholder="https://aem.example.com/page"
                    value={newSourceAemUrl}
                    onChange={e => setNewSourceAemUrl(e.target.value)} />
                )}

                <button onClick={addContentSource}
                  style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    border: '1px solid #DB0011', background: '#DB0011', color: '#fff',
                    cursor: 'pointer', fontFamily: 'var(--font-family)', flexShrink: 0 }}>
                  Add
                </button>
              </div>
            </div>

            {/* Refresh schedule */}
            {(form.assetSources?.length) && (
              <div style={{ padding: 12, border: '1px solid var(--border-light)', borderRadius: 8, background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Audience Governance
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Review, edit or delete governed configuration files, URL folders and asset URLs. The BFF applies these rules at search time using customer segment, account type and location.
                  </div>
                </div>

                {(form.assetSources?.length ?? 0) > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Video / Image / File URLs</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {form.assetSources!.map((src, idx) => (
                        <div key={src.sourceId} style={{ padding: 10, border: '1px solid var(--border-light)', borderRadius: 6, background: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase' }}>{src.type}</span>
                            <input
                              style={{ ...inp, padding: '5px 8px', fontSize: 12 }}
                              value={src.label}
                              onChange={e => editAssetSource(idx, { label: e.target.value })}
                            />
                          </div>
                          <input
                            style={{ ...inp, padding: '5px 8px', fontSize: 12, marginTop: 6 }}
                            value={src.url ?? src.parentFolderUrl ?? ''}
                            onChange={e => editAssetSource(idx, src.url !== undefined ? { url: e.target.value } : { parentFolderUrl: e.target.value })}
                          />
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{audienceSummary(src)}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <button onClick={() => setReviewItem({ title: src.label, payload: src })}
                              style={{ fontSize: 11, padding: '4px 9px', borderRadius: 5, border: '1px solid var(--border-mid)', background: '#fff', cursor: 'pointer' }}>Review</button>
                            <button onClick={() => removeAssetSource(idx)}
                              style={{ fontSize: 11, padding: '4px 9px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Add Governed URL</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <select style={{ ...sel, flex: '0 0 88px' }} value={newAssetType}
                      onChange={e => setNewAssetType(e.target.value as AISearchAssetSource['type'])}>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="file">File</option>
                    </select>
                    <input style={{ ...inp, flex: '1 1 140px' }} placeholder="Label"
                      value={newAssetLabel} onChange={e => setNewAssetLabel(e.target.value)} />
                    <input style={{ ...inp, flex: '1 1 220px' }} placeholder="URL or folder URL ending with /"
                      value={newAssetUrl} onChange={e => setNewAssetUrl(e.target.value)} />
                    <button onClick={addAssetSource}
                      style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                        border: '1px solid #DB0011', background: '#DB0011', color: '#fff',
                        cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
                      Add URL
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    New URLs default to Premier/Elite HK wealth customers; edit the saved JSON rule for other segment, account type or location targeting.
                  </div>
                </div>

              </div>
            )}

            {reviewItem && (
              <div style={{ padding: 12, border: '1px solid var(--border-light)', borderRadius: 8, background: '#111827', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Review: {reviewItem.title}</span>
                  <button onClick={() => setReviewItem(null)}
                    style={{ fontSize: 11, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>Close</button>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.45, maxHeight: 220, overflow: 'auto' }}>
                  {JSON.stringify(reviewItem.payload, null, 2)}
                </pre>
              </div>
            )}

            {/* Refresh schedule */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Corpus Refresh Schedule</span>
              <select style={sel} value={form.refreshSchedule ?? 'manual'}
                onChange={e => setForm(f => ({ ...f, refreshSchedule: e.target.value as AISearchConfig['refreshSchedule'] }))}>
                <option value="manual">Manual only (trigger from this panel)</option>
                <option value="hourly">Every hour</option>
                <option value="daily">Every day</option>
              </select>
            </label>

            {/* Search endpoint override */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Search Endpoint Override <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></span>
              <input style={inp} placeholder={`${BFF_BASE}/api/v1/search`}
                value={form.searchEndpointOverride ?? ''}
                onChange={e => setForm(f => ({ ...f, searchEndpointOverride: e.target.value || undefined }))} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Leave blank to use the default BFF search endpoint.</span>
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={save}
                disabled={!form.displayName}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700, borderRadius: 8,
                  border: 'none', cursor: form.displayName ? 'pointer' : 'default',
                  background: form.displayName ? '#DB0011' : '#E5E7EB',
                  color: form.displayName ? '#fff' : '#9CA3AF',
                  fontFamily: 'var(--font-family)',
                }}>
                {editing ? 'Save Changes' : 'Create Config'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                  border: '1px solid var(--border-mid)', background: '#fff',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
