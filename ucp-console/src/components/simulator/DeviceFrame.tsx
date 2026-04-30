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
 *
 * Supported cutout types:
 *   island  — Apple Dynamic Island (rounded pill, top-centre, overlaid on screen)
 *   notch   — Legacy wide notch (iPhone X–13 style)
 *   hole    — Single punch-hole camera (Android/Huawei standard)
 *   pill    — Wide pill-shaped camera (Huawei Mate 80 Pro)
 *   none    — Under-display camera; no visible cutout (Xiaomi 17 Ultra)
 *
 * Supported OS types:
 *   ios         — Side buttons left+right; home indicator bar; no nav bar
 *   android     — Power+volume right; 3-icon gesture nav bar
 *   harmonyos   — Power+volume right; HarmonyOS pill gesture bar (white capsule)
 */
export function DeviceFrame({ device: d, scale, children }: DeviceFrameProps) {
  const totalW = d.screenW + d.bezelSide * 2;
  const totalH = d.screenH + d.bezelTop  + d.bezelBottom;

  const scaledW = totalW * scale;
  const scaledH = totalH * scale;

  // ── Side button helper ────────────────────────────────────────────────────
  const btnStyle = (
    top: number, h: number, side: 'left' | 'right',
  ): React.CSSProperties => ({
    position: 'absolute',
    top:    top * scale,
    height: h   * scale,
    width:  4   * scale,
    [side]: -(4 * scale),
    background: d.frameAccent,
    borderRadius: side === 'left'
      ? `${3 * scale}px 0 0 ${3 * scale}px`
      : `0 ${3 * scale}px ${3 * scale}px 0`,
    zIndex: 5,
  });

  // ── Camera cutout (rendered inside the screen div, above content) ─────────
  function renderCutout() {
    if (d.cutout === 'none') return null; // under-display — invisible

    const cw = d.cutoutW * scale;
    const ch = d.cutoutH * scale;
    // All cutouts are horizontally centred
    const base: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#080808',
      zIndex: 20,
    };

    switch (d.cutout) {
      // Apple Dynamic Island — sits just below the bezel line
      case 'island':
        return (
          <div style={{
            ...base,
            top: 10 * scale,
            width: cw, height: ch,
            borderRadius: ch / 2,
            // Island has a subtle inner glow
            boxShadow: `0 0 ${4 * scale}px ${2 * scale}px rgba(0,0,0,0.8)`,
          }} />
        );

      // Wide notch (legacy)
      case 'notch':
        return (
          <div style={{
            ...base,
            top: 0,
            width: cw, height: ch,
            background: d.frameColor,
            borderRadius: `0 0 ${ch * 0.5}px ${ch * 0.5}px`,
          }} />
        );

      // Single circular punch-hole (standard Android / Huawei)
      case 'hole':
        return (
          <div style={{
            ...base,
            top: 14 * scale,
            width: cw, height: ch,
            borderRadius: '50%',
          }} />
        );

      // Elongated pill (Huawei Mate 80 Pro front camera bar)
      case 'pill':
        return (
          <div style={{
            ...base,
            top: 14 * scale,
            width: cw, height: ch,
            borderRadius: ch / 2,
            // Pill has a subtle gradient to look like glass
            background: 'linear-gradient(135deg, #1A1A1A, #050505)',
            boxShadow: `inset 0 0 ${2 * scale}px rgba(255,255,255,0.08)`,
          }} />
        );

      default:
        return null;
    }
  }

  // ── Navigation bar per OS ─────────────────────────────────────────────────
  function renderNavBar() {
    if (!d.navBarH) return null;
    const h = d.navBarH * scale;

    if (d.os === 'harmonyos') {
      // HarmonyOS: single white capsule gesture bar, dark tinted strip
      return (
        <div style={{
          height: h,
          background: 'rgba(248,248,248,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 100 * scale,
            height: 4  * scale,
            background: '#1A1A2E',
            borderRadius: 2 * scale,
            opacity: 0.25,
          }} />
        </div>
      );
    }

    // Android: 3-icon gesture nav (back ‹, home ○, recents ▢)
    return (
      <div style={{
        height: h,
        background: '#F8F8F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTop: '1px solid #E5E7EB',
        flexShrink: 0,
      }}>
        {['‹', '○', '▢'].map((s, i) => (
          <span key={i} style={{ fontSize: 14 * scale, color: '#6B7280' }}>{s}</span>
        ))}
      </div>
    );
  }

  // ── Status bar indicators per OS ──────────────────────────────────────────
  function renderStatusBarRight() {
    if (d.os === 'ios') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * scale }}>
          <span style={{ fontSize: 10 * scale }}>📶</span>
          <span style={{ fontSize: 10 * scale }}>🔋</span>
        </div>
      );
    }
    if (d.os === 'harmonyos') {
      // HarmonyOS shows signal bars + battery percentage
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 * scale }}>
          <span style={{ fontSize: 9 * scale, color: '#1A1A2E', fontWeight: 600 }}>5G</span>
          <span style={{ fontSize: 10 * scale }}>📶</span>
          <span style={{ fontSize: 9 * scale, color: '#1A1A2E', fontWeight: 600 }}>98%</span>
          <span style={{ fontSize: 10 * scale }}>🔋</span>
        </div>
      );
    }
    // Android
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 * scale }}>
        {d.brandBadge === 'Xiaomi' && (
          <span style={{ fontSize: 8 * scale, color: '#FF6900', fontWeight: 800, letterSpacing: '-0.5px' }}>MI</span>
        )}
        <span style={{ fontSize: 9 * scale, color: '#1A1A2E' }}>▲</span>
        <span style={{ fontSize: 10 * scale }}>📶</span>
        <span style={{ fontSize: 10 * scale }}>🔋</span>
      </div>
    );
  }

  // ── Side buttons per OS ────────────────────────────────────────────────────
  function renderSideButtons() {
    if (d.os === 'ios') {
      return (
        <>
          <div style={btnStyle(90, 32, 'left')}  /> {/* mute/action */}
          <div style={btnStyle(132, 50, 'left')} /> {/* vol+ */}
          <div style={btnStyle(190, 50, 'left')} /> {/* vol- */}
          <div style={btnStyle(130, 70, 'right')} /> {/* power */}
        </>
      );
    }
    // Android + HarmonyOS: power right, vol right
    return (
      <>
        <div style={btnStyle(110, 58, 'right')} /> {/* power */}
        <div style={btnStyle(178, 38, 'right')} /> {/* vol+ */}
        <div style={btnStyle(224, 38, 'right')} /> {/* vol- */}
      </>
    );
  }

  // ── Frame outer glow based on brand ──────────────────────────────────────
  const isLightFrame = d.frameColor > '#888888'; // rough luminance check
  const glowAlpha = isLightFrame ? '0.3' : '0.08';

  return (
    <div style={{ width: scaledW, height: scaledH, position: 'relative', flexShrink: 0 }}>

      {/* Outer frame body */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: d.frameColor,
        borderRadius: d.frameRadius * scale,
        boxShadow: [
          `0 0 0 ${1 * scale}px rgba(255,255,255,${glowAlpha})`,
          `0 ${8 * scale}px ${32 * scale}px rgba(0,0,0,0.55)`,
          `inset 0 ${1 * scale}px ${2 * scale}px rgba(255,255,255,0.14)`,
          `inset 0 -${1 * scale}px ${2 * scale}px rgba(0,0,0,0.25)`,
        ].join(', '),
      }} />

      {/* Brand text stamp (Huawei / Xiaomi) at bottom bezel */}
      {d.brandBadge && (
        <div style={{
          position: 'absolute',
          bottom: (d.bezelBottom * 0.35) * scale,
          left: 0, right: 0,
          textAlign: 'center',
          fontSize: 7 * scale,
          fontWeight: 700,
          letterSpacing: 1.5 * scale,
          color: isLightFrame ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)',
          zIndex: 6,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {d.brandBadge}
        </div>
      )}

      {/* Side buttons */}
      {renderSideButtons()}

      {/* Screen area */}
      <div style={{
        position: 'absolute',
        top:    d.bezelTop  * scale,
        left:   d.bezelSide * scale,
        width:  d.screenW   * scale,
        height: d.screenH   * scale,
        background: '#fff',
        borderRadius: d.cornerRadius * scale,
        overflow: 'hidden',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
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
          {renderStatusBarRight()}
        </div>

        {/* Camera cutout — rendered inside screen over status bar */}
        {renderCutout()}

        {/* Scrollable SDUI content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          minHeight: 0,
        }}>
          {/* Scale from 393px canonical design width to actual device screen width */}
          <div style={{
            transform: `scale(${(d.screenW * scale) / 393})`,
            transformOrigin: 'top left',
            width: `${393 / ((d.screenW * scale) / 393)}px`,
          }}>
            {children}
          </div>
        </div>

        {/* Navigation bar */}
        {renderNavBar()}
      </div>

      {/* iOS home indicator — outside screen, in bottom bezel */}
      {d.os === 'ios' && (
        <div style={{
          position: 'absolute',
          bottom: (d.bezelBottom * 0.28) * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width:  130 * scale,
          height: 5   * scale,
          background: '#1A1A2E',
          borderRadius: 3 * scale,
          opacity: 0.18,
          zIndex: 15,
        }} />
      )}
    </div>
  );
}
