import React, { useState, useMemo } from 'react';
import { useUCP } from '../../store/UCPStore';
import { SimSliceRenderer } from './SliceRenderers';
import { DeviceFrame } from './DeviceFrame';
import { QRCode } from '../shared/QRCode';
import { DEVICES, DEVICE_GROUPS, DeviceSpec } from '../../utils/deviceSpecs';
import { Button } from '../shared/Button';
import { StatusBadge } from '../shared/StatusBadge';
import { WorkflowStatus } from '../../types/ucp';

// ─── Stage definitions ────────────────────────────────────────────────────────

type Stage = 'preview' | 'approval' | 'production';

interface StageConfig {
  id: Stage;
  label: string;
  icon: string;
  description: string;
  allowedStatuses: WorkflowStatus[];
  color: string;
  urlPath: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'preview',
    label: 'Preview',
    icon: '🔍',
    description: 'Draft — author review only',
    allowedStatuses: ['DRAFT', 'REJECTED'],
    color: '#6B7280',
    urlPath: 'preview',
  },
  {
    id: 'approval',
    label: 'Approval',
    icon: '🔄',
    description: 'Pending checker review',
    allowedStatuses: ['PENDING_APPROVAL'],
    color: '#D97706',
    urlPath: 'approval',
  },
  {
    id: 'production',
    label: 'Production',
    icon: '🚀',
    description: 'Live to all users',
    allowedStatuses: ['LIVE'],
    color: '#059669',
    urlPath: 'screen',
  },
];

// ─── Build the preview URL for a given stage ─────────────────────────────────

function buildPreviewUrl(stage: Stage, pageId: string, wfEntryId?: string): string {
  const base = window.location.origin.replace(':3001', ':4000');
  switch (stage) {
    case 'preview':
      return `${base}/api/v1/ucp/preview/${pageId}?stage=preview`;
    case 'approval':
      return `${base}/api/v1/ucp/preview/${wfEntryId ?? pageId}?stage=approval`;
    case 'production':
      return `${base}/api/v1/screen/${pageId}`;
  }
}

// ─── Device picker button ─────────────────────────────────────────────────────

function DeviceButton({ device, selected, onClick }: {
  device: DeviceSpec;
  selected: boolean;
  onClick: () => void;
}) {
  const osEmoji = device.os === 'ios' ? '🍎' : '🤖';
  return (
    <button
      onClick={onClick}
      title={device.label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '6px 10px',
        borderRadius: 8,
        border: selected ? '2px solid #DB0011' : '2px solid rgba(255,255,255,0.12)',
        background: selected ? 'rgba(219,0,17,0.15)' : 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        minWidth: 60,
      }}
    >
      <span style={{ fontSize: 11 }}>{osEmoji}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: selected ? '#FF6677' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
        {device.shortLabel}
      </span>
    </button>
  );
}

// ─── Stage tab ────────────────────────────────────────────────────────────────

function StageTab({ stage, active, disabled, onClick }: {
  stage: StageConfig;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `Not available in current workflow status` : stage.description}
      style={{
        flex: 1,
        padding: '8px 4px',
        border: 'none',
        borderBottom: active ? `3px solid ${stage.color}` : '3px solid transparent',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 16 }}>{stage.icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: active ? stage.color : 'rgba(255,255,255,0.5)' }}>
        {stage.label}
      </span>
    </button>
  );
}

// ─── Main simulator ───────────────────────────────────────────────────────────

export function MobileSimulator() {
  const { state, dispatch } = useUCP();
  const { layout, workflow } = state;

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('iphone17');
  const [stage, setStage] = useState<Stage>('preview');
  const [showQR, setShowQR] = useState(true);

  const device = DEVICES.find(d => d.id === selectedDeviceId) ?? DEVICES[0];
  const currentWf = workflow.find(w => w.pageId === layout.pageId);
  const wfStatus: WorkflowStatus = currentWf?.status ?? 'DRAFT';

  // Determine which stages are accessible given the current workflow state
  const stageAvailable = (s: StageConfig) =>
    s.allowedStatuses.includes(wfStatus) || s.id === 'preview'; // preview always available

  const activeStage = STAGES.find(s => s.id === stage)!;

  const previewUrl = useMemo(
    () => buildPreviewUrl(stage, layout.pageId, currentWf?.entryId),
    [stage, layout.pageId, currentWf?.entryId],
  );

  // Target modal height available for phone
  const maxPhoneH = Math.min(window.innerHeight * 0.72, 700);
  const maxPhoneW = Math.min(window.innerWidth * 0.28, 260);

  const totalDevH = device.screenH + device.bezelTop + device.bezelBottom;
  const totalDevW = device.screenW + device.bezelSide * 2;
  const scale = Math.min(maxPhoneH / totalDevH, maxPhoneW / totalDevW, 0.65);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(8,10,20,0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 16,
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_SIMULATOR' }); }}
    >
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, width: '100%', maxWidth: 1100, padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📱</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Mobile Preview</span>
          <StatusBadge status={wfStatus} size="sm" />
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowQR(v => !v)}
          style={{
            background: showQR ? 'rgba(219,0,17,0.2)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${showQR ? 'rgba(219,0,17,0.5)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 8, padding: '6px 14px',
            color: showQR ? '#FF6677' : 'rgba(255,255,255,0.6)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {showQR ? '📷 Hide QR' : '📷 Show QR'}
        </button>
        <Button
          size="sm" variant="ghost"
          onClick={() => dispatch({ type: 'TOGGLE_SIMULATOR' })}
          style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}
        >✕ Close</Button>
      </div>

      {/* ── Main 3-column layout: QR | Phone | QR ── */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', width: '100%', maxWidth: 1100, padding: '0 20px' }}>

        {/* LEFT PANEL — Device picker + Stage selector */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stage selector */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Preview Stage
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {STAGES.map(s => (
                <StageTab
                  key={s.id}
                  stage={s}
                  active={stage === s.id}
                  disabled={!stageAvailable(s)}
                  onClick={() => stageAvailable(s) && setStage(s.id)}
                />
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              {activeStage.icon} <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{activeStage.label}:</strong>{' '}
              {activeStage.description}
            </div>
          </div>

          {/* Device picker */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Device
            </div>
            {DEVICE_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 6 }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.ids.map(id => {
                    const dev = DEVICES.find(d => d.id === id)!;
                    return (
                      <DeviceButton
                        key={id}
                        device={dev}
                        selected={selectedDeviceId === id}
                        onClick={() => setSelectedDeviceId(id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Page stats */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
            <div>📦 <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{layout.slices.filter(s => s.visible).length}</strong> visible slices</div>
            <div>🙈 <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{layout.slices.filter(s => !s.visible).length}</strong> hidden</div>
            <div>📐 <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{device.screenW}×{device.screenH}</strong> logical px</div>
            <div>🖥 Scale <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{(scale * 100).toFixed(0)}%</strong></div>
          </div>
        </div>

        {/* CENTRE — Device frame */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Stage badge strip */}
          <div style={{
            background: `${activeStage.color}22`,
            border: `1px solid ${activeStage.color}55`,
            borderRadius: 8,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>{activeStage.icon}</span>
            <span style={{ color: activeStage.color, fontWeight: 700, fontSize: 12 }}>
              {activeStage.label} Stage
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>—</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{device.label}</span>
          </div>

          <DeviceFrame device={device} scale={scale}>
            {layout.slices.map(slice => (
              <SimSliceRenderer key={slice.instanceId} slice={slice} />
            ))}
          </DeviceFrame>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            {device.label} · {device.os.toUpperCase()} · {layout.locale}
          </div>
        </div>

        {/* RIGHT PANEL — QR codes */}
        {showQR && (
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Scan to Open on Device
            </div>

            {STAGES.map(s => {
              const url = buildPreviewUrl(s.id, layout.pageId, currentWf?.entryId);
              const available = stageAvailable(s);
              return (
                <div
                  key={s.id}
                  style={{
                    background: stage === s.id
                      ? `${s.color}18`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${stage === s.id ? s.color + '55' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 14,
                    padding: 14,
                    opacity: available ? 1 : 0.35,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Stage header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: available ? s.color : 'rgba(255,255,255,0.3)' }}>
                      {s.label}
                    </span>
                    {!available && (
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
                        NOT READY
                      </span>
                    )}
                  </div>

                  {/* QR code */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <QRCode
                      value={url}
                      size={160}
                      fgColor={available ? '#1A1A2E' : '#9CA3AF'}
                      label={undefined}
                    />
                  </div>

                  {/* URL + copy */}
                  <div style={{ marginTop: 10, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{
                      flex: 1,
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.3)',
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 5,
                      padding: '4px 6px',
                      lineHeight: 1.4,
                    }}>
                      {url}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                      }}
                      title="Copy URL"
                      style={{
                        flexShrink: 0,
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        borderRadius: 5,
                        width: 24, height: 24,
                        cursor: 'pointer',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >⎘</button>
                  </div>

                  {/* Stage description */}
                  <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>
                    {s.description}
                  </div>
                </div>
              );
            })}

            {/* Help note */}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, padding: '0 4px' }}>
              💡 Scan with the HSBC internal preview app to render the live SDUI layout on your real device. QR codes are stage-specific — approval QR only works for checkers.
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding */}
      <div style={{ height: 24 }} />
    </div>
  );
}
