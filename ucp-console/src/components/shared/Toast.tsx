import React, { useEffect, useRef } from 'react';
import { useUCP } from '../../store/UCPStore';

export function Toast() {
  const { state, dispatch } = useUCP();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!state.toast) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state.toast]);

  const colours: Record<string, string> = {
    success: '#059669',
    error:   '#DC2626',
    info:    '#2563EB',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-toast)' as any,
        minHeight: 44,
        pointerEvents: 'none',
      }}
    >
      {state.toast && (
        <div style={{
          background: colours[state.toast.type] ?? '#1A1A2E',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          fontSize: 14,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          animation: 'toastIn 0.25s ease-out',
        }}>
          {state.toast.message}
        </div>
      )}
    </div>
  );
}
