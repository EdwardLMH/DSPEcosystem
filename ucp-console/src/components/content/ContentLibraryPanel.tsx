import React, { useState, useRef } from 'react';
import { MOCK_CONTENT_ASSETS, BIZ_LINES as BIZ_LINES_DATA } from '../../store/mockData';
import type { ContentAsset, AssetType, BizLineId } from '../../types/ucp';
import { useUCP } from '../../store/UCPStore';

const ASSET_ICONS: Record<AssetType, string> = {
  IMAGE:    '🖼️',
  VIDEO:    '🎬',
  FILE:     '📎',
  DOCUMENT: '📄',
};

const ASSET_COLORS: Record<AssetType, { bg: string; text: string }> = {
  IMAGE:    { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  VIDEO:    { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  FILE:     { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  DOCUMENT: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface NewAssetForm {
  name: string;
  assetType: AssetType;
  altText: string;
  tags: string;
  bizLineId: BizLineId;
}

const EMPTY_FORM: NewAssetForm = {
  name: '', assetType: 'IMAGE', altText: '', tags: '', bizLineId: 'WEALTH',
};

type ViewMode = 'grid' | 'list';

export function ContentLibraryPanel() {
  const { state } = useUCP();
  const [assets, setAssets] = useState<ContentAsset[]>(MOCK_CONTENT_ASSETS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<ContentAsset | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState<NewAssetForm>(EMPTY_FORM);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = assets.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || a.assetType === filterType;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const assetType: AssetType = file.type.startsWith('video/') ? 'VIDEO'
      : file.type.startsWith('image/') ? 'IMAGE'
      : file.type === 'application/pdf' ? 'DOCUMENT'
      : 'FILE';
    setForm(prev => ({ ...prev, name: file.name.replace(/\.[^.]+$/, ''), assetType }));
    setShowNewModal(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const newAsset: ContentAsset = {
      assetId: `asset-${Date.now()}`,
      name: form.name,
      assetType: form.assetType,
      mimeType: form.assetType === 'IMAGE' ? 'image/jpeg' : form.assetType === 'VIDEO' ? 'video/mp4' : 'application/octet-stream',
      sizeBytes: 0,
      url: `https://placehold.co/800x500/333/fff?text=${encodeURIComponent(form.name)}`,
      thumbnailUrl: form.assetType === 'IMAGE' ? `https://placehold.co/160x100/333/fff?text=${encodeURIComponent(form.name)}` : undefined,
      altText: form.altText || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      marketId: state.currentUser.groupId,
      bizLineId: form.bizLineId,
      uploadedBy: state.currentUser.id,
      uploadedByName: state.currentUser.name,
      uploadedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    setAssets(prev => [newAsset, ...prev]);
    setShowNewModal(false);
    setForm(EMPTY_FORM);
  }

  function handleArchive(assetId: string) {
    setAssets(prev => prev.map(a => a.assetId === assetId ? { ...a, status: 'ARCHIVED' } : a));
    if (selected?.assetId === assetId) setSelected(null);
  }

  const BIZ_LINES = BIZ_LINES_DATA;
  const assetTypeCounts = (['IMAGE', 'VIDEO', 'DOCUMENT', 'FILE'] as AssetType[]).map(t => ({
    type: t,
    count: assets.filter(a => a.assetType === t && a.status === 'ACTIVE').length,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        borderBottom: '1px solid var(--surface-border)',
        background: 'var(--surface-panel)', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Content Library</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Images, videos, documents and files for use in pages and messages
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Summary chips */}
        {assetTypeCounts.map(({ type, count }) => (
          <div
            key={type}
            onClick={() => setFilterType(filterType === type ? 'all' : type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
              borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filterType === type ? ASSET_COLORS[type].bg : 'var(--surface-bg)',
              color: filterType === type ? ASSET_COLORS[type].text : 'var(--text-muted)',
              border: `1px solid ${filterType === type ? ASSET_COLORS[type].text + '44' : 'var(--surface-border)'}`,
              transition: 'all 0.15s',
            }}
          >
            {ASSET_ICONS[type]} {type} <strong>{count}</strong>
          </div>
        ))}
        <button
          onClick={() => setShowNewModal(true)}
          style={{
            background: 'var(--hsbc-red)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + New Content
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 20px', alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)', flexShrink: 0,
        background: 'var(--surface-panel)',
      }}>
        <input
          placeholder="Search by name or tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, maxWidth: 280, padding: '7px 12px', borderRadius: 6,
            border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          style={{
            padding: '7px 12px', borderRadius: 6, border: '1px solid var(--surface-border)',
            background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
          }}
        >
          <option value="all">All Types</option>
          <option value="IMAGE">🖼️ Images</option>
          <option value="VIDEO">🎬 Videos</option>
          <option value="DOCUMENT">📄 Documents</option>
          <option value="FILE">📎 Files</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          style={{
            padding: '7px 12px', borderRadius: 6, border: '1px solid var(--surface-border)',
            background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
          }}
        >
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="all">All</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['grid', 'list'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface-border)',
                background: viewMode === m ? 'var(--hsbc-red)' : 'transparent',
                color: viewMode === m ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              {m === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Asset area — drop zone */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: 20 }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        >
          {/* Drop overlay */}
          {dragOver && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(219,0,17,0.12)',
              border: '3px dashed var(--hsbc-red)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'var(--hsbc-red)',
              pointerEvents: 'none',
            }}>
              Drop files to upload
            </div>
          )}

          {/* Upload hint when empty */}
          {filtered.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '60%', color: 'var(--text-muted)', gap: 12,
            }}>
              <span style={{ fontSize: 48 }}>📂</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No assets found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your filters, or drag and drop files here</div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  marginTop: 8, padding: '9px 20px', borderRadius: 6,
                  border: '1px dashed var(--surface-border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                }}
              >Browse Files</button>
            </div>
          )}

          {/* Grid view */}
          {viewMode === 'grid' && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {filtered.map(asset => {
                const isSelected = selected?.assetId === asset.assetId;
                const colors = ASSET_COLORS[asset.assetType];
                return (
                  <div
                    key={asset.assetId}
                    onClick={() => setSelected(isSelected ? null : asset)}
                    style={{
                      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      border: isSelected ? `2px solid var(--hsbc-red)` : '2px solid var(--surface-border)',
                      background: 'var(--surface-panel)', transition: 'border-color 0.15s',
                      opacity: asset.status === 'ARCHIVED' ? 0.55 : 1,
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      height: 110, background: asset.thumbnailUrl ? 'transparent' : colors.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ fontSize: 36 }}>{ASSET_ICONS[asset.assetType]}</span>
                      )}
                      {/* Type badge */}
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
                        background: colors.bg, color: colors.text,
                        backdropFilter: 'blur(4px)',
                      }}>{asset.assetType}</span>
                      {asset.status === 'ARCHIVED' && (
                        <span style={{
                          position: 'absolute', top: 6, left: 6,
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
                          background: 'rgba(0,0,0,0.6)', color: '#aaa',
                        }}>ARCHIVED</span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{asset.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {formatSize(asset.sizeBytes)} · {formatDate(asset.uploadedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && filtered.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                  {['Asset', 'Type', 'Size', 'Market / Biz Line', 'Uploaded By', 'Date', ''].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left', fontSize: 11,
                      fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(asset => {
                  const isSelected = selected?.assetId === asset.assetId;
                  const colors = ASSET_COLORS[asset.assetType];
                  return (
                    <tr
                      key={asset.assetId}
                      onClick={() => setSelected(isSelected ? null : asset)}
                      style={{
                        borderBottom: '1px solid var(--surface-border)',
                        background: isSelected ? 'rgba(219,0,17,0.06)' : 'transparent',
                        cursor: 'pointer', opacity: asset.status === 'ARCHIVED' ? 0.55 : 1,
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(219,0,17,0.06)' : 'transparent'; }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {asset.thumbnailUrl ? (
                            <img
                              src={asset.thumbnailUrl}
                              alt={asset.name}
                              style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span style={{
                              width: 48, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: colors.bg, borderRadius: 4, fontSize: 18,
                            }}>{ASSET_ICONS[asset.assetType]}</span>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</div>
                            {asset.tags && asset.tags.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                                {asset.tags.slice(0, 3).map(t => (
                                  <span key={t} style={{
                                    fontSize: 10, padding: '1px 6px', borderRadius: 8,
                                    background: 'var(--surface-bg)', color: 'var(--text-muted)',
                                    border: '1px solid var(--surface-border)',
                                  }}>{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                          background: colors.bg, color: colors.text,
                        }}>{asset.assetType}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{formatSize(asset.sizeBytes)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        <div>{asset.marketId}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.bizLineId}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{asset.uploadedByName}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(asset.uploadedAt)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {asset.status === 'ACTIVE' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleArchive(asset.assetId); }}
                            style={{
                              fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                              border: '1px solid var(--surface-border)', background: 'transparent',
                              color: 'var(--text-muted)',
                            }}
                          >Archive</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            width: 300, flexShrink: 0, borderLeft: '1px solid var(--surface-border)',
            background: 'var(--surface-panel)', overflowY: 'auto', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
              >✕</button>
            </div>

            {/* Full image preview — click to lightbox */}
            {selected.assetType === 'IMAGE' && (selected.url || selected.thumbnailUrl) && (
              <div
                onClick={() => setLightbox(selected.url || selected.thumbnailUrl!)}
                style={{ cursor: 'zoom-in', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--surface-border)', position: 'relative' }}
                title="Click to view full size"
              >
                <img
                  src={selected.url || selected.thumbnailUrl}
                  alt={selected.name}
                  style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 180 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: 'rgba(0,0,0,0.5)', color: '#fff',
                  fontSize: 10, padding: '2px 6px', borderTopLeftRadius: 4,
                }}>🔍 Click to enlarge</div>
              </div>
            )}
            {selected.assetType === 'VIDEO' && selected.thumbnailUrl && (
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--surface-border)', position: 'relative' }}>
                <img
                  src={selected.thumbnailUrl}
                  alt={selected.name}
                  style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 160 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 32, opacity: 0.85 }}>▶️</span>
                </div>
              </div>
            )}

            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              {[
                ['Type',        selected.assetType],
                ['MIME',        selected.mimeType],
                ['Size',        formatSize(selected.sizeBytes)],
                ['Market',      selected.marketId],
                ['Biz Line',    selected.bizLineId],
                ['Uploaded By', selected.uploadedByName],
                ['Date',        formatDate(selected.uploadedAt)],
                ['Status',      selected.status],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '6px 0', color: 'var(--text-muted)', width: 90 }}>{k}</td>
                  <td style={{ padding: '6px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{v}</td>
                </tr>
              ))}
            </table>
            {selected.altText && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Alt Text</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{selected.altText}</div>
              </div>
            )}
            {selected.tags && selected.tags.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10,
                      background: 'var(--surface-bg)', color: 'var(--text-secondary)',
                      border: '1px solid var(--surface-border)',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => navigator.clipboard.writeText(selected.url)}
                style={{
                  padding: '8px', borderRadius: 6, border: '1px solid var(--surface-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: 12,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >📋 Copy URL</button>
              {selected.status === 'ACTIVE' && (
                <button
                  onClick={() => handleArchive(selected.assetId)}
                  style={{
                    padding: '8px', borderRadius: 6, border: '1px solid var(--surface-border)',
                    background: 'transparent', color: '#ef4444', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >🗂️ Archive Asset</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
          }}
        >
          <img
            src={lightbox}
            alt="Full size preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 20, right: 24,
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: 36, height: 36, fontSize: 18, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />

      {/* New Content Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>New Content Asset</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Fill in the details below or drag and drop a file onto the library
            </div>

            {/* Upload drop area */}
            <div
              style={{
                border: '2px dashed var(--surface-border)', borderRadius: 8,
                padding: '24px', textAlign: 'center', marginBottom: 16, cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 13,
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            >
              📤 Click to browse or drag a file here
            </div>

            {[
              { label: 'Asset Name', key: 'name', placeholder: 'e.g. Jade Hero Banner' },
              { label: 'Alt Text (for images)', key: 'altText', placeholder: 'Describe the image for accessibility' },
              { label: 'Tags (comma-separated)', key: 'tags', placeholder: 'jade, hero, premium' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</div>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6,
                    border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Asset Type</div>
                <select
                  value={form.assetType}
                  onChange={e => setForm(prev => ({ ...prev, assetType: e.target.value as AssetType }))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6,
                    border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                    color: 'var(--text-primary)', fontSize: 13,
                  }}
                >
                  <option value="IMAGE">🖼️ Image</option>
                  <option value="VIDEO">🎬 Video</option>
                  <option value="DOCUMENT">📄 Document</option>
                  <option value="FILE">📎 File</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Business Line</div>
                <select
                  value={form.bizLineId}
                  onChange={e => setForm(prev => ({ ...prev, bizLineId: e.target.value as BizLineId }))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6,
                    border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
                    color: 'var(--text-primary)', fontSize: 13,
                  }}
                >
                  {BIZ_LINES.map(b => (
                    <option key={b.bizLineId} value={b.bizLineId}>{b.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowNewModal(false); setForm(EMPTY_FORM); }}
                style={{
                  padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                style={{
                  padding: '9px 18px', borderRadius: 6, border: 'none',
                  background: !form.name.trim() ? 'var(--surface-border)' : 'var(--hsbc-red)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Upload Asset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
