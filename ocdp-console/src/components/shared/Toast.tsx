import { useEffect } from 'react';
import { useOCDP } from '../../store/OCDPStore';

export function Toast() {
  const { state, dispatch } = useOCDP();
  const { toast } = state;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
    return () => clearTimeout(t);
  }, [toast?.id]);

  if (!toast) return null;

  const BG = { success: '#059669', error: '#DC2626', info: '#2563EB' };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, padding: '12px 20px', background: BG[toast.type], color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-lg)', maxWidth: 400, animation: 'toastIn 0.25s ease-out' }}>
      {toast.message}
    </div>
  );
}
