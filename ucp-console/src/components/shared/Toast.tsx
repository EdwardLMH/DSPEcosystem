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

  if (!state.toast) return null;

  const colours: Record<string, string> = {
    success: '#059669',
    error:   '#DC2626',
    info:    '#2563EB',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 'var(--z-toast)' as any,
      background: colours[state.toast.type] ?? '#1A1A2E',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      fontSize: 14,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      animation: 'toastIn 0.25s ease-out',
      pointerEvents: 'none',
    }}>
      {state.toast.message}
    </div>
  );
}
