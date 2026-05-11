import { useState } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { AISearchConfig, AISearchAppId, AISearchContentSource, AISearchContentSourceType } from '../../types/ocdp';
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
            Refresh: <strong>{REFRESH_LABELS[config.refreshSchedule]}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Corpus: <strong>{config.corpusSize} items</strong>
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

  async function handleRebuild(configId: string) {
    setRebuildingId(configId);
    setRebuildStatus(s => ({ ...s, [configId]: '' }));
    try {
      const res = await fetch(`${BFF_BASE}/api/v1/search/config/${configId}/rebuild`, { method: 'POST' });
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
              Configure semantic search for each mobile app and the website. Each app gets its own search corpus built from quick-access entry points and product/content pages.
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
