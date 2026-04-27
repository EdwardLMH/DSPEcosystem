import React from 'react';
import { DeviceSpec } from '../../utils/deviceSpecs';

interface DeviceFrameProps {
  device: DeviceSpec;
  scale: number;
  children: React.ReactNode;
}

/**
 * Renders a realistic device frame around scrollable content.
 * All dimensions are in logical pixels; `scale` scales the whole assembly.
 */
export function DeviceFrame({ device: d, scale, children }: DeviceFrameProps) {
  const totalW = d.screenW + d.bezelSide * 2;
  const totalH = d.screenH + d.bezelTop  + d.bezelBottom;

  const scaledW = totalW * scale;
  const scaledH = totalH * scale;

  // ── Side button geometry ──
  const btnStyle = (
    top: number, h: number, side: 'left' | 'right',
  ): React.CSSProperties => ({
    position: 'absolute',
    top:    top  * scale,
    height: h    * scale,
    width:  4    * scale,
    [side]: -(4  * scale),
    background: d.frameAccent,
    borderRadius: side === 'left'
      ? `${3 * scale}px 0 0 ${3 * scale}px`
      : `0 ${3 * scale}px ${3 * scale}px 0`,
  });

  // ── Camera cutout ──
  function renderCutout() {
    const cy = (d.statusBarH / 2) * scale;
    const cw = d.cutoutW * scale;
    const ch = d.cutoutH * scale;
    const cx = (d.screenW / 2) * scale - cw / 2;

    switch (d.cutout) {
      case 'island':
        return (
          <div style={{
            position: 'absolute',
            top: ((d.bezelTop + 10) * scale),
            left: cx + d.bezelSide * scale,
            width: cw, height: ch,
            background: '#0A0A0A',
            borderRadius: ch / 2,
            zIndex: 20,
          }} />
        );
      case 'notch':
        return (
          <div style={{
            position: 'absolute',
            top: d.bezelTop * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: d.cutoutW * scale,
            height: d.cutoutH * scale,
            background: d.frameColor,
            borderRadius: `0 0 ${d.cutoutH * scale * 0.5}px ${d.cutoutH * scale * 0.5}px`,
            zIndex: 20,
          }} />
        );
      case 'hole':
        return (
          <div style={{
            position: 'absolute',
            top:  (d.bezelTop + 14) * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width:  d.cutoutW * scale,
            height: d.cutoutH * scale,
            background: '#0A0A0A',
            borderRadius: '50%',
            zIndex: 20,
          }} />
        );
      default:
        return null;
    }
  }

  return (
    <div style={{
      width: scaledW,
      height: scaledH,
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Outer frame */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: d.frameColor,
        borderRadius: d.frameRadius * scale,
        boxShadow: [
          `0 0 0 ${1 * scale}px rgba(255,255,255,0.08)`,
          `0 ${8 * scale}px ${32 * scale}px rgba(0,0,0,0.55)`,
          `inset 0 ${1 * scale}px ${2 * scale}px rgba(255,255,255,0.12)`,
          `inset 0 -${1 * scale}px ${2 * scale}px rgba(0,0,0,0.3)`,
        ].join(', '),
      }} />

      {/* Side buttons */}
      {d.os === 'ios' ? (
        <>
          <div style={btnStyle(90, 36, 'left')}  /> {/* mute */}
          <div style={btnStyle(136, 52, 'left')} /> {/* vol+ */}
          <div style={btnStyle(196, 52, 'left')} /> {/* vol- */}
          <div style={btnStyle(130, 72, 'right')} /> {/* power */}
        </>
      ) : (
        <>
          <div style={btnStyle(110, 60, 'right')} /> {/* power */}
          <div style={btnStyle(180, 40, 'right')} /> {/* vol+ */}
          <div style={btnStyle(228, 40, 'right')} /> {/* vol- */}
        </>
      )}

      {/* Screen area */}
      <div style={{
        position: 'absolute',
        top:    d.bezelTop   * scale,
        left:   d.bezelSide  * scale,
        width:  d.screenW    * scale,
        height: d.screenH    * scale,
        background: '#fff',
        borderRadius: d.cornerRadius * scale,
        overflow: 'hidden',
        zIndex: 10,
      }}>
        {/* Status bar */}
        <div style={{
          height: d.statusBarH * scale,
          background: '#fff',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: `0 ${20 * scale}px ${6 * scale}px`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 5,
        }}>
          <span style={{ fontSize: 11 * scale, fontWeight: 700, color: '#1A1A2E' }}>
            {new Date().toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 * scale }}>
            {d.os === 'android' && (
              <>
                <span style={{ fontSize: 9 * scale, color: '#1A1A2E' }}>▲</span>
                <span style={{ fontSize: 9 * scale, color: '#1A1A2E' }}>WiFi</span>
              </>
            )}
            <span style={{ fontSize: 10 * scale, color: '#1A1A2E' }}>📶</span>
            <span style={{ fontSize: 10 * scale, color: '#1A1A2E' }}>🔋</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{
          height: `calc(100% - ${(d.statusBarH + (d.navBarH ?? 0)) * scale}px)`,
          overflowY: 'auto',
          overflowX: 'hidden',
          // scale content from 393px design width down to device width
          position: 'relative',
        }}>
          <div style={{
            transform: `scale(${(d.screenW * scale) / 393})`,
            transformOrigin: 'top left',
            width: `${393 / ((d.screenW * scale) / 393)}px`,
          }}>
            {children}
          </div>
        </div>

        {/* Android nav bar */}
        {d.navBarH && (
          <div style={{
            height: d.navBarH * scale,
            background: '#F8F8F8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            borderTop: '1px solid #E5E7EB',
          }}>
            {['‹', '○', '▢'].map((s, i) => (
              <span key={i} style={{ fontSize: 14 * scale, color: '#6B7280' }}>{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Camera cutout (rendered on top of screen) */}
      {renderCutout()}

      {/* Home indicator (iOS) */}
      {d.os === 'ios' && (
        <div style={{
          position: 'absolute',
          bottom: (d.bezelBottom * 0.3) * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width:  130 * scale,
          height: 5   * scale,
          background: '#1A1A2E',
          borderRadius: 3 * scale,
          opacity: 0.2,
          zIndex: 15,
        }} />
      )}
    </div>
  );
}
