import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BIZ_LINES as BIZ_LINES_DATA } from '../../store/mockData';
import type { ContentAsset, AssetType, BizLineId, ContentApprovalStatus } from '../../types/ucp';
import { useUCP } from '../../store/UCPStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_ICONS: Record<AssetType, string> = {
  IMAGE: '🖼️', VIDEO: '🎬', FILE: '📎', DOCUMENT: '📄',
};

const ASSET_COLORS: Record<AssetType, { bg: string; text: string }> = {
  IMAGE:    { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  VIDEO:    { bg: 'rgba(251,191,36,0.15)',  text: '#d97706' },
  FILE:     { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  DOCUMENT: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
};

const APPROVAL_COLORS: Record<ContentApprovalStatus, { bg: string; text: string; label: string }> = {
  DRAFT:            { bg: '#F3F4F6', text: '#6B7280', label: 'Draft' },
  PENDING_APPROVAL: { bg: '#FEF3C7', text: '#D97706', label: 'Pending Approval' },
  APPROVED:         { bg: '#D1FAE5', text: '#059669', label: 'Approved' },
  REJECTED:         { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected' },
};

function formatSize(bytes: number) {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── In-browser video conversion (MOV/WebM → MP4 H.264 via MediaRecorder) ────

type ConversionState = 'idle' | 'converting' | 'done' | 'error' | 'unsupported';

interface ConversionResult {
  blob: Blob;
  objectUrl: string;
  sizeBytes: number;
  durationSeconds: number;
}

async function convertToMp4(file: File, onProgress: (pct: number) => void): Promise<ConversionResult> {
  // Use HTMLVideoElement to decode + capture output via MediaRecorder
  return new Promise((resolve, reject) => {
    const videoEl = document.createElement('video');
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.preload = 'metadata';

    const srcUrl = URL.createObjectURL(file);
    videoEl.src = srcUrl;

    videoEl.onloadedmetadata = () => {
      const duration = Math.round(videoEl.duration);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.min(videoEl.videoWidth, 1920);
      canvas.height = Math.min(videoEl.videoHeight, 1080);
      const ctx = canvas.getContext('2d')!;

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
        ? 'video/mp4;codecs=avc1,mp4a.40.2'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const stream = canvas.captureStream(30);

      // Try to add audio from the video element
      let recorder: MediaRecorder;
      try {
        // @ts-ignore — captureStream is non-standard
        const audioStream: MediaStream = (videoEl as any).captureStream?.() ?? new MediaStream();
        audioStream.getAudioTracks().forEach(t => stream.addTrack(t));
        recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
      } catch {
        recorder = new MediaRecorder(stream, { mimeType });
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        URL.revokeObjectURL(srcUrl);
        const blob = new Blob(chunks, { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        resolve({ blob, objectUrl, sizeBytes: blob.size, durationSeconds: duration });
      };
      recorder.onerror = () => reject(new Error('MediaRecorder error'));

      recorder.start(500);
      videoEl.play().then(() => {
        const interval = setInterval(() => {
          if (videoEl.ended || videoEl.paused) { clearInterval(interval); return; }
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const pct = Math.round((videoEl.currentTime / videoEl.duration) * 100);
          onProgress(pct);
        }, 33); // ~30 fps

        videoEl.onended = () => {
          clearInterval(interval);
          onProgress(100);
          recorder.stop();
          videoEl.remove();
        };
      }).catch(reject);
    };

    videoEl.onerror = () => reject(new Error('Could not decode video'));
    document.body.appendChild(videoEl);
  });
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface AssetForm {
  name: string;
  assetType: AssetType;
  altText: string;
  tags: string;
  bizLineId: BizLineId;
  presenter: string;
  presenterTitle: string;
  durationSeconds: string;
}

const EMPTY_FORM: AssetForm = {
  name: '', assetType: 'IMAGE', altText: '', tags: '', bizLineId: 'WEALTH',
  presenter: '', presenterTitle: '', durationSeconds: '',
};

type ViewMode = 'grid' | 'list';
type PanelMode = 'detail' | 'edit' | 'create';

// ─── Media Preview ─────────────────────────────────────────────────────────────

function MediaPreview({ asset }: { asset: ContentAsset }) {
  const displayUrl = asset.localObjectUrl ?? asset.url;

  if (asset.assetType === 'VIDEO') {
    return (
      <video
        key={displayUrl}
        controls
        style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 200 }}
        preload="metadata"
      >
        <source src={displayUrl} />
        <p style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', padding: 12 }}>
          Video preview not available
        </p>
      </video>
    );
  }

  if (asset.assetType === 'IMAGE') {
    return (
      <img
        src={displayUrl}
        alt={asset.name}
        style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180 }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  if (asset.assetType === 'DOCUMENT') {
    return (
      <div style={{ border: '1px solid var(--surface-border)', borderRadius: 8, overflow: 'hidden', height: 200 }}>
        <iframe src={displayUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={asset.name} />
      </div>
    );
  }

  return (
    <div style={{
      height: 100, background: ASSET_COLORS[asset.assetType].bg, borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 36 }}>{ASSET_ICONS[asset.assetType]}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.mimeType}</span>
    </div>
  );
}

// ─── Upload zone with conversion ──────────────────────────────────────────────

function UploadZone({ onFile, currentAsset }: {
  onFile: (file: File, conversionResult?: ConversionResult) => void;
  currentAsset?: ContentAsset | null;
}) {
  const [convState, setConvState] = useState<ConversionState>('idle');
  const [convProgress, setConvProgress] = useState(0);
  const [convNote, setConvNote] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const needsConversion = !file.type.startsWith('video/mp4') && file.type.startsWith('video/');
    if (needsConversion) {
      // Check browser support
      if (typeof MediaRecorder === 'undefined') {
        setConvState('unsupported');
        setConvNote('MediaRecorder not supported — upload directly or convert with ffmpeg externally.');
        // Still pass through original file
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onFile(file);
        return;
      }
      setConvState('converting');
      setConvProgress(0);
      setConvNote(`Converting ${file.name} → H.264 MP4…`);
      try {
        const result = await convertToMp4(file, pct => setConvProgress(pct));
        setConvState('done');
        setConvNote(`Converted to MP4 · ${formatSize(result.sizeBytes)} · ${formatDuration(result.durationSeconds)}`);
        setPreviewUrl(result.objectUrl);
        onFile(file, result);
      } catch (err) {
        setConvState('error');
        setConvNote(`Conversion failed: ${(err as Error).message}. Using original file.`);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onFile(file);
      }
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFile(file);
    }
  }

  const colors: React.CSSProperties = convState === 'error' ? { borderColor: '#EF4444', background: '#FEF2F2' }
    : convState === 'done' ? { borderColor: '#10B981', background: '#ECFDF5' }
    : convState === 'converting' ? { borderColor: '#F59E0B', background: '#FFFBEB' }
    : {};

  return (
    <div>
      <div
        style={{
          border: '2px dashed var(--surface-border)', borderRadius: 8,
          padding: '20px', textAlign: 'center', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, transition: 'all 0.15s',
          ...colors,
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {convState === 'converting' ? (
          <div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>⚙️</div>
            <div style={{ fontWeight: 600, color: '#D97706', marginBottom: 6 }}>{convNote}</div>
            <div style={{ height: 6, background: '#FDE68A', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${convProgress}%`, background: '#F59E0B', borderRadius: 3, transition: 'width 0.2s' }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 4, color: '#92400E' }}>{convProgress}%</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📤</div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Click to browse or drag a file here</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Images, videos (MOV/MP4 → converted to H.264 MP4), PDFs, files
            </div>
          </>
        )}
      </div>
      {(convState === 'done' || convState === 'error' || convState === 'unsupported') && convNote && (
        <div style={{
          marginTop: 6, padding: '6px 10px', borderRadius: 6, fontSize: 11,
          background: convState === 'done' ? '#D1FAE5' : '#FEF2F2',
          color: convState === 'done' ? '#065F46' : '#991B1B',
        }}>
          {convState === 'done' ? '✓' : '⚠'} {convNote}
        </div>
      )}
      {previewUrl && (
        <div style={{ marginTop: 10 }}>
          {previewUrl.includes('video') || convNote.includes('MP4') || convNote.includes('Converting') ? (
            <video src={previewUrl} controls style={{ width: '100%', borderRadius: 6, background: '#000', maxHeight: 160 }} />
          ) : (
            <img src={previewUrl} alt="preview" style={{ width: '100%', borderRadius: 6, objectFit: 'cover', maxHeight: 120 }} />
          )}
        </div>
      )}
      <input ref={fileRef} type="file" style={{ display: 'none' }}
        accept="image/*,video/*,application/pdf,.xlsx,.xls,.csv,.doc,.docx"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Approval badge ───────────────────────────────────────────────────────────

function ApprovalBadge({ status }: { status?: ContentApprovalStatus }) {
  const s = status ?? 'DRAFT';
  const c = APPROVAL_COLORS[s];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
      background: c.bg, color: c.text,
    }}>{c.label}</span>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ContentEditorPanel() {
  const { state, dispatch } = useUCP();
  const { contentAssets, approvalFlows, pageRefs, currentUser } = state;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [filterApproval, setFilterApproval] = useState<ContentApprovalStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<ContentAsset | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>('detail');

  // Upload/edit form state
  const [form, setForm] = useState<AssetForm>(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingConversion, setPendingConversion] = useState<ConversionResult | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<ContentAsset | null>(null);

  // Approval action
  const [showApprovalModal, setShowApprovalModal] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState('');

  // Sync selected asset when store updates (e.g. after dispatch)
  useEffect(() => {
    if (selected) {
      const fresh = contentAssets.find(a => a.assetId === selected.assetId);
      if (fresh) setSelected(fresh);
      else setSelected(null);
    }
  }, [contentAssets]);

  const filtered = contentAssets.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType   = filterType   === 'all' || a.assetType   === filterType;
    const matchStatus = filterStatus === 'all' || a.status       === filterStatus;
    const matchApproval = filterApproval === 'all' || (a.approvalStatus ?? 'DRAFT') === filterApproval;
    return matchSearch && matchType && matchStatus && matchApproval;
  });

  const assetTypeCounts = (['IMAGE', 'VIDEO', 'DOCUMENT', 'FILE'] as AssetType[]).map(t => ({
    type: t, count: contentAssets.filter(a => a.assetType === t && a.status === 'ACTIVE').length,
  }));

  const isApprover = currentUser.role.endsWith('-APPROVER') || currentUser.role === 'ADMIN';

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM);
    setPendingFile(null);
    setPendingConversion(null);
    setSelected(null);
    setPanelMode('create');
  }

  function openEdit(asset: ContentAsset) {
    setForm({
      name: asset.name,
      assetType: asset.assetType,
      altText: asset.altText ?? '',
      tags: (asset.tags ?? []).join(', '),
      bizLineId: asset.bizLineId,
      presenter: asset.presenter ?? '',
      presenterTitle: asset.presenterTitle ?? '',
      durationSeconds: asset.durationSeconds ? String(asset.durationSeconds) : '',
    });
    setPendingFile(null);
    setPendingConversion(null);
    setSelected(asset);
    setPanelMode('edit');
  }

  function handleFileReady(file: File, conversion?: ConversionResult) {
    setPendingFile(file);
    setPendingConversion(conversion ?? null);
    const assetType: AssetType = file.type.startsWith('video/') ? 'VIDEO'
      : file.type.startsWith('image/') ? 'IMAGE'
      : file.type === 'application/pdf' ? 'DOCUMENT' : 'FILE';
    setForm(prev => ({
      ...prev,
      name: prev.name || file.name.replace(/\.[^.]+$/, ''),
      assetType,
      durationSeconds: conversion ? String(conversion.durationSeconds) : prev.durationSeconds,
    }));
  }

  function handleCreate() {
    if (!form.name.trim()) return;
    const mimeType = pendingFile?.type ?? (form.assetType === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
    const sizeBytes = pendingConversion?.sizeBytes ?? pendingFile?.size ?? 0;
    const localObjectUrl = pendingConversion?.objectUrl
      ?? (pendingFile ? URL.createObjectURL(pendingFile) : undefined);

    const newAsset: ContentAsset = {
      assetId: `asset-${Date.now()}`,
      name: form.name.trim(),
      assetType: form.assetType,
      mimeType,
      sizeBytes,
      url: localObjectUrl ?? `https://placehold.co/800x500/003366/ffffff?text=${encodeURIComponent(form.name)}`,
      thumbnailUrl: form.assetType === 'IMAGE' ? localObjectUrl : undefined,
      altText: form.altText || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      marketId: currentUser.marketId,
      bizLineId: form.bizLineId,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      status: 'ACTIVE',
      approvalStatus: 'DRAFT',
      durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : undefined,
      presenter: form.presenter || undefined,
      presenterTitle: form.presenterTitle || undefined,
      localObjectUrl,
    };
    dispatch({ type: 'ADD_ASSET', asset: newAsset });
    dispatch({ type: 'SHOW_TOAST', message: `"${newAsset.name}" uploaded`, toastType: 'success' });
    setSelected(newAsset);
    setPanelMode('detail');
  }

  function handleUpdate() {
    if (!selected || !form.name.trim()) return;
    const updates: Partial<ContentAsset> = {
      name: form.name.trim(),
      altText: form.altText || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      bizLineId: form.bizLineId,
      presenter: form.presenter || undefined,
      presenterTitle: form.presenterTitle || undefined,
      durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : undefined,
    };
    if (pendingConversion) {
      updates.url = pendingConversion.objectUrl;
      updates.localObjectUrl = pendingConversion.objectUrl;
      updates.sizeBytes = pendingConversion.sizeBytes;
      updates.durationSeconds = pendingConversion.durationSeconds;
      updates.mimeType = 'video/mp4';
    } else if (pendingFile) {
      updates.url = URL.createObjectURL(pendingFile);
      updates.localObjectUrl = updates.url;
      updates.sizeBytes = pendingFile.size;
      updates.mimeType = pendingFile.type;
    }
    dispatch({ type: 'UPDATE_ASSET', assetId: selected.assetId, updates });
    dispatch({ type: 'SHOW_TOAST', message: `"${form.name}" updated`, toastType: 'success' });
    setPanelMode('detail');
  }

  function handleDelete(asset: ContentAsset) {
    dispatch({ type: 'DELETE_ASSET', assetId: asset.assetId });
    dispatch({ type: 'SHOW_TOAST', message: `"${asset.name}" deleted`, toastType: 'success' });
    setConfirmDelete(null);
    setSelected(null);
    setPanelMode('detail');
  }

  function handleSubmitApproval() {
    if (!selected || !selectedFlowId) return;
    const flow = approvalFlows.find(f => f.flowId === selectedFlowId);
    if (!flow) return;
    dispatch({ type: 'SUBMIT_ASSET_APPROVAL', assetId: selected.assetId, approvalGroupId: flow.approverGroupId });
    dispatch({ type: 'SHOW_TOAST', message: 'Submitted for approval', toastType: 'success' });
    setShowApprovalModal(null);
    setApprovalComment('');
  }

  function handleApprove() {
    if (!selected) return;
    dispatch({ type: 'APPROVE_ASSET', assetId: selected.assetId, comment: approvalComment || undefined });
    dispatch({ type: 'SHOW_TOAST', message: 'Asset approved', toastType: 'success' });
    setShowApprovalModal(null);
    setApprovalComment('');
  }

  function handleReject() {
    if (!selected || !approvalComment.trim()) return;
    dispatch({ type: 'REJECT_ASSET', assetId: selected.assetId, comment: approvalComment });
    dispatch({ type: 'SHOW_TOAST', message: 'Asset rejected', toastType: 'success' });
    setShowApprovalModal(null);
    setApprovalComment('');
  }

  // ── Inline form fields ───────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 6,
    border: '1px solid var(--surface-border)', background: 'var(--surface-bg)',
    color: 'var(--text-primary)', fontSize: 12, outline: 'none',
  };

  function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</div>
        {children}
      </div>
    );
  }

  function AssetFormFields({ showFileUpload = false }: { showFileUpload?: boolean }) {
    return (
      <>
        {showFileUpload && (
          <FormField label="File">
            <UploadZone onFile={handleFileReady} currentAsset={selected} />
          </FormField>
        )}
        <FormField label="Name *">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. FX Viewpoint May 2026" style={inp} />
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Type</div>
            <select value={form.assetType} onChange={e => setForm(p => ({ ...p, assetType: e.target.value as AssetType }))} style={{ ...inp }}>
              <option value="IMAGE">🖼️ Image</option>
              <option value="VIDEO">🎬 Video</option>
              <option value="DOCUMENT">📄 Document</option>
              <option value="FILE">📎 File</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Business Line</div>
            <select value={form.bizLineId} onChange={e => setForm(p => ({ ...p, bizLineId: e.target.value as BizLineId }))} style={{ ...inp }}>
              {BIZ_LINES_DATA.map(b => <option key={b.bizLineId} value={b.bizLineId}>{b.displayName}</option>)}
            </select>
          </div>
        </div>
        <FormField label="Alt Text">
          <input value={form.altText} onChange={e => setForm(p => ({ ...p, altText: e.target.value }))} placeholder="Describe for accessibility" style={inp} />
        </FormField>
        <FormField label="Tags (comma-separated)">
          <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="fx, viewpoint, wealth" style={inp} />
        </FormField>
        {(form.assetType === 'VIDEO') && (
          <>
            <FormField label="Presenter Name">
              <input value={form.presenter} onChange={e => setForm(p => ({ ...p, presenter: e.target.value }))} placeholder="Jackie Wong" style={inp} />
            </FormField>
            <FormField label="Presenter Title">
              <input value={form.presenterTitle} onChange={e => setForm(p => ({ ...p, presenterTitle: e.target.value }))} placeholder="FX Strategist, HSBC Global Research" style={inp} />
            </FormField>
            <FormField label="Duration (seconds)">
              <input type="number" value={form.durationSeconds} onChange={e => setForm(p => ({ ...p, durationSeconds: e.target.value }))} placeholder="120" style={inp} />
            </FormField>
          </>
        )}
      </>
    );
  }

  // ── Right panel content ──────────────────────────────────────────────────────

  function DetailPanel({ asset }: { asset: ContentAsset }) {
    const refs = pageRefs[asset.assetId] ?? [];
    const appStatus = asset.approvalStatus ?? 'DRAFT';
    const flow = approvalFlows.find(f =>
      f.marketId === asset.marketId && (f.bizLineId === asset.bizLineId || f.bizLineId === null)
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{asset.name}</div>
            <div style={{ marginTop: 4 }}><ApprovalBadge status={appStatus} /></div>
          </div>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Media preview */}
        <MediaPreview asset={asset} />

        {/* Metadata table */}
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          {[
            ['Type',        asset.assetType],
            ['MIME',        asset.mimeType],
            ['Size',        formatSize(asset.sizeBytes)],
            ...(asset.durationSeconds ? [['Duration', formatDuration(asset.durationSeconds)]] : []),
            ...(asset.presenter ? [['Presenter', asset.presenter]] : []),
            ...(asset.presenterTitle ? [['Title', asset.presenterTitle]] : []),
            ['Market',      asset.marketId],
            ['Biz Line',    asset.bizLineId],
            ['Uploaded By', asset.uploadedByName],
            ['Date',        formatDate(asset.uploadedAt)],
            ['Status',      asset.status],
          ].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <td style={{ padding: '5px 0', color: 'var(--text-muted)', width: 90, fontSize: 11 }}>{k}</td>
              <td style={{ padding: '5px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </table>

        {/* Tags */}
        {(asset.tags ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(asset.tags ?? []).map(t => (
              <span key={t} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                background: 'var(--surface-bg)', color: 'var(--text-muted)',
                border: '1px solid var(--surface-border)',
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Page references */}
        {refs.length > 0 && (
          <div style={{ padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 4 }}>⚠ Referenced by {refs.length} page{refs.length > 1 ? 's' : ''}</div>
            {refs.map(r => <div key={r.pageId} style={{ color: '#78350F' }}>• {r.pageName}</div>)}
          </div>
        )}

        {/* Approval status detail */}
        {appStatus !== 'DRAFT' && (
          <div style={{ padding: '8px 10px', background: APPROVAL_COLORS[appStatus].bg, borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: APPROVAL_COLORS[appStatus].text, marginBottom: 2 }}>
              {appStatus === 'PENDING_APPROVAL' && '⏳ Awaiting approval'}
              {appStatus === 'APPROVED' && '✓ Approved by ' + (asset.approvalReviewerName ?? '—')}
              {appStatus === 'REJECTED' && '✗ Rejected by ' + (asset.approvalReviewerName ?? '—')}
            </div>
            {asset.approvalComment && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{asset.approvalComment}"</div>}
            {asset.approvalReviewedAt && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(asset.approvalReviewedAt)}</div>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button onClick={() => navigator.clipboard.writeText(asset.url)} style={btnGhost}>📋 Copy URL</button>
          {asset.status === 'ACTIVE' && appStatus === 'DRAFT' && (
            <button onClick={() => { setSelectedFlowId(flow?.flowId ?? approvalFlows[0]?.flowId ?? ''); setShowApprovalModal('submit'); }}
              style={{ ...btnGhost, color: '#D97706', borderColor: '#FDE68A' }}>
              📤 Submit for Approval
            </button>
          )}
          {isApprover && appStatus === 'PENDING_APPROVAL' && (
            <>
              <button onClick={() => setShowApprovalModal('approve')} style={{ ...btnGhost, color: '#059669', borderColor: '#6EE7B7' }}>✓ Approve</button>
              <button onClick={() => setShowApprovalModal('reject')}  style={{ ...btnGhost, color: '#DC2626', borderColor: '#FECACA' }}>✗ Reject</button>
            </>
          )}
          {asset.status === 'ACTIVE' && (
            <button onClick={() => openEdit(asset)} style={{ ...btnGhost }}>✏️ Edit Metadata / Replace File</button>
          )}
          {asset.status === 'ACTIVE' && (
            <button onClick={() => dispatch({ type: 'ARCHIVE_ASSET', assetId: asset.assetId })}
              style={{ ...btnGhost, color: '#6B7280' }}>🗂️ Archive</button>
          )}
          {asset.status === 'ARCHIVED' && (
            <button onClick={() => dispatch({ type: 'RESTORE_ASSET', assetId: asset.assetId })}
              style={{ ...btnGhost, color: '#059669' }}>♻️ Restore</button>
          )}
          <button onClick={() => setConfirmDelete(asset)} style={{ ...btnGhost, color: '#DC2626', borderColor: '#FECACA' }}>🗑 Delete</button>
        </div>
      </div>
    );
  }

  const btnGhost: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 6, border: '1px solid var(--surface-border)',
    background: 'transparent', color: 'var(--text-secondary)', fontSize: 12,
    cursor: 'pointer', textAlign: 'left', width: '100%',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-bg)', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-panel)', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Content Editor</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            Upload, preview, and manage content assets with approval workflow
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {assetTypeCounts.map(({ type, count }) => (
          <div key={type} onClick={() => setFilterType(filterType === type ? 'all' : type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filterType === type ? ASSET_COLORS[type].bg : 'var(--surface-bg)',
              color: filterType === type ? ASSET_COLORS[type].text : 'var(--text-muted)',
              border: `1px solid ${filterType === type ? ASSET_COLORS[type].text + '44' : 'var(--surface-border)'}`,
              transition: 'all 0.15s',
            }}>
            {ASSET_ICONS[type]} {type} <strong>{count}</strong>
          </div>
        ))}
        <button onClick={openCreate} style={{
          background: 'var(--hsbc-red)', color: '#fff', border: 'none',
          borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          + Upload Content
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 20px', alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-panel)', flexShrink: 0,
      }}>
        <input placeholder="Search by name or tag…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 260, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
          <option value="all">All Types</option>
          <option value="IMAGE">🖼️ Images</option>
          <option value="VIDEO">🎬 Videos</option>
          <option value="DOCUMENT">📄 Documents</option>
          <option value="FILE">📎 Files</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="all">All Status</option>
        </select>
        <select value={filterApproval} onChange={e => setFilterApproval(e.target.value as any)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
          <option value="all">All Approvals</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['grid', 'list'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: '5px 9px', borderRadius: 5, border: '1px solid var(--surface-border)',
              background: viewMode === m ? 'var(--hsbc-red)' : 'transparent',
              color: viewMode === m ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
            }}>{m === 'grid' ? '⊞' : '☰'}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Asset area — drop zone */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { handleFileReady(f); openCreate(); } }}>

          {filtered.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'var(--text-muted)', gap: 12 }}>
              <span style={{ fontSize: 48 }}>📂</span>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No assets found</div>
              <div style={{ fontSize: 13 }}>Adjust filters or drag and drop files here</div>
              <button onClick={openCreate} style={{ marginTop: 8, padding: '9px 20px', borderRadius: 6, border: '1px dashed var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                Browse & Upload
              </button>
            </div>
          )}

          {/* Grid view */}
          {viewMode === 'grid' && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {filtered.map(asset => {
                const isSelected = selected?.assetId === asset.assetId;
                const colors = ASSET_COLORS[asset.assetType];
                const appStatus = asset.approvalStatus ?? 'DRAFT';
                return (
                  <div key={asset.assetId} onClick={() => { setSelected(isSelected ? null : asset); setPanelMode('detail'); }}
                    style={{
                      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      border: isSelected ? `2px solid var(--hsbc-red)` : '2px solid var(--surface-border)',
                      background: 'var(--surface-panel)', opacity: asset.status === 'ARCHIVED' ? 0.55 : 1,
                      transition: 'border-color 0.15s',
                    }}>
                    {/* Thumbnail / media preview */}
                    <div style={{ height: 110, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {asset.assetType === 'VIDEO' ? (
                        <video
                          src={asset.localObjectUrl ?? asset.url}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          preload="metadata"
                          muted
                          onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                      ) : asset.thumbnailUrl ? (
                        <img src={asset.localObjectUrl ?? asset.thumbnailUrl} alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span style={{ fontSize: 36 }}>{ASSET_ICONS[asset.assetType]}</span>
                      )}
                      <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: colors.bg, color: colors.text, backdropFilter: 'blur(4px)' }}>
                        {asset.assetType}
                      </span>
                      {asset.status === 'ARCHIVED' && (
                        <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#aaa' }}>ARCHIVED</span>
                      )}
                      {appStatus !== 'DRAFT' && (
                        <span style={{ position: 'absolute', bottom: 6, left: 6 }}><ApprovalBadge status={appStatus} /></span>
                      )}
                    </div>
                    <div style={{ padding: '9px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
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
                  {['Asset', 'Type', 'Size', 'Market / Biz Line', 'Uploaded By', 'Date', 'Approval', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(asset => {
                  const isSelected = selected?.assetId === asset.assetId;
                  const colors = ASSET_COLORS[asset.assetType];
                  return (
                    <tr key={asset.assetId} onClick={() => { setSelected(isSelected ? null : asset); setPanelMode('detail'); }}
                      style={{ borderBottom: '1px solid var(--surface-border)', background: isSelected ? 'rgba(219,0,17,0.06)' : 'transparent', cursor: 'pointer', opacity: asset.status === 'ARCHIVED' ? 0.55 : 1 }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(219,0,17,0.06)' : 'transparent'; }}>
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          {asset.assetType === 'VIDEO' ? (
                            <video src={asset.localObjectUrl ?? asset.url} style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} preload="metadata" muted />
                          ) : asset.thumbnailUrl ? (
                            <img src={asset.localObjectUrl ?? asset.thumbnailUrl} alt={asset.name} style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <span style={{ width: 48, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, borderRadius: 4, fontSize: 18 }}>{ASSET_ICONS[asset.assetType]}</span>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</div>
                            {(asset.tags ?? []).length > 0 && (
                              <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                                {(asset.tags ?? []).slice(0, 3).map(t => (
                                  <span key={t} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: 'var(--surface-bg)', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}>{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '9px 10px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 8, background: colors.bg, color: colors.text }}>{asset.assetType}</span></td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)' }}>{formatSize(asset.sizeBytes)}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12 }}><div>{asset.marketId}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.bizLineId}</div></td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>{asset.uploadedByName}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(asset.uploadedAt)}</td>
                      <td style={{ padding: '9px 10px' }}><ApprovalBadge status={asset.approvalStatus ?? 'DRAFT'} /></td>
                      <td style={{ padding: '9px 10px' }}>
                        <button onClick={e => { e.stopPropagation(); setSelected(asset); setPanelMode('detail'); }}
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)' }}>
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right panel */}
        {(selected || panelMode === 'create') && (
          <div style={{
            width: 320, flexShrink: 0, borderLeft: '1px solid var(--surface-border)',
            background: 'var(--surface-panel)', overflowY: 'auto', padding: 18,
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            {/* Create new */}
            {panelMode === 'create' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Upload Content</div>
                  <button onClick={() => setPanelMode('detail')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
                </div>
                <AssetFormFields showFileUpload />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button onClick={() => setPanelMode('detail')} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCreate} disabled={!form.name.trim()} style={{ flex: 2, padding: '8px', borderRadius: 6, border: 'none', background: form.name.trim() ? 'var(--hsbc-red)' : '#ccc', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Upload Asset</button>
                </div>
              </div>
            )}

            {/* Edit mode */}
            {panelMode === 'edit' && selected && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Asset</div>
                  <button onClick={() => setPanelMode('detail')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Replace File (optional)</div>
                  <UploadZone onFile={handleFileReady} currentAsset={selected} />
                </div>
                <AssetFormFields showFileUpload={false} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button onClick={() => setPanelMode('detail')} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleUpdate} disabled={!form.name.trim()} style={{ flex: 2, padding: '8px', borderRadius: 6, border: 'none', background: form.name.trim() ? '#059669' : '#ccc', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                </div>
              </div>
            )}

            {/* Detail mode */}
            {panelMode === 'detail' && selected && <DetailPanel asset={selected} />}
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {confirmDelete && (() => {
        const refs = pageRefs[confirmDelete.assetId] ?? [];
        const hasRefs = refs.length > 0;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 10 }}>🗑 Delete Content Asset</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>"{confirmDelete.name}"</strong>? This cannot be undone.
              </div>
              {hasRefs && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: 6, fontSize: 12 }}>⚠ This asset is referenced by {refs.length} page{refs.length > 1 ? 's' : ''}:</div>
                  {refs.map(r => (
                    <div key={r.pageId} style={{ fontSize: 12, color: '#7F1D1D', padding: '3px 0', borderTop: '1px solid #FECACA' }}>
                      • {r.pageName} <span style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: 10 }}>({r.pageId})</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: '#DC2626', marginTop: 8, fontWeight: 600 }}>
                    These pages will lose this asset. You must update them before deleting, or proceed knowing they will break.
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {hasRefs ? 'Delete Anyway' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Approval modals ───────────────────────────────────────────────────── */}
      {showApprovalModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface-panel)', borderRadius: 12, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

            {showApprovalModal === 'submit' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>📤 Submit for Approval</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  Select the approval group for <strong>"{selected.name}"</strong>. The assigned approvers will be notified.
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Approval Flow</div>
                  <select value={selectedFlowId} onChange={e => setSelectedFlowId(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13 }}>
                    {approvalFlows.map(f => <option key={f.flowId} value={f.flowId}>{f.flowName} — {f.approverGroupName}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowApprovalModal(null)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSubmitApproval} disabled={!selectedFlowId} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: selectedFlowId ? '#D97706' : '#ccc', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
                </div>
              </>
            )}

            {showApprovalModal === 'approve' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#059669', marginBottom: 10 }}>✓ Approve Content</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  Approve <strong>"{selected.name}"</strong>. Add an optional comment.
                </div>
                <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="Optional approval note…" rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', outline: 'none', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowApprovalModal(null)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleApprove} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                </div>
              </>
            )}

            {showApprovalModal === 'reject' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 10 }}>✗ Reject Content</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  Reject <strong>"{selected.name}"</strong>. A reason is required.
                </div>
                <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="Reason for rejection (required)…" rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', outline: 'none', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowApprovalModal(null)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleReject} disabled={!approvalComment.trim()} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: approvalComment.trim() ? '#DC2626' : '#ccc', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
