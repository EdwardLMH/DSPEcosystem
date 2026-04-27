import React, { useMemo, useRef } from 'react';
import { encodeQR } from '../../utils/qrEncoder';

interface QRCodeProps {
  value: string;
  size?: number;           // pixel size of the rendered QR
  quietZone?: number;      // modules of white border
  fgColor?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}

export function QRCode({
  value,
  size = 200,
  quietZone = 4,
  fgColor = '#1A1A2E',
  bgColor = '#FFFFFF',
  label,
  sublabel,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const matrix = useMemo(() => {
    try {
      return encodeQR(value);
    } catch (e) {
      console.error('[QR]', e);
      return null;
    }
  }, [value]);

  // Draw whenever matrix or size changes
  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const moduleCount = matrix.length;
    const totalModules = moduleCount + quietZone * 2;
    const moduleSize = size / totalModules;

    canvas.width  = size;
    canvas.height = size;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c]) {
          ctx.fillStyle = fgColor;
          ctx.fillRect(
            (c + quietZone) * moduleSize,
            (r + quietZone) * moduleSize,
            moduleSize,
            moduleSize,
          );
        }
      }
    }
  }, [matrix, size, quietZone, fgColor, bgColor]);

  if (!matrix) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', borderRadius: 8, fontSize: 11, color: '#9CA3AF' }}>
        URL too long
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        padding: 12,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        border: '1px solid #E5E7EB',
      }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
      {label && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>{label}</div>
          {sublabel && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
