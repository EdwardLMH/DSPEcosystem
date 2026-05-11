import { useState, useEffect, useCallback } from 'react';
import { ScreenPayload } from '../types/sdui';
import { cacheScreen, getCachedScreen } from '../engine/ScreenCache';
import {
  resolveScreen,
  fetchManifest,
  resolvedSelfPickItems,
  saveCustomerSelfPick,
} from '../engine/SDUIStaticDistribution';
import { useSDUIContext } from '../context/SDUIContext';

const BFF_BASE          = '/api/v1';
const REQUEST_TIMEOUT_MS = 3000;
// Background manifest re-check interval (ms): 30 min on WiFi assumed for Web
const MANIFEST_POLL_MS  = 30 * 60 * 1000;

interface UseSDUIScreenResult {
  payload: ScreenPayload | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  /** Resolved self-pick items for the SELF_PICK_ENTRY_POINTS slice */
  selfPickItems: Record<string, string>[];
  /** Call this when the customer reorders / changes their self-pick selection */
  onSelfPickChange: (items: Record<string, string>[]) => void;
}

export function useSDUIScreen(
  screenId: string,
  overrides?: { platform?: string; locale?: string; sduiVersion?: string; userId?: string }
): UseSDUIScreenResult {
  const { bffHeaders } = useSDUIContext();
  const [payload, setPayload]           = useState<ScreenPayload | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isStale, setIsStale]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [selfPickItems, setSelfPickItems] = useState<Record<string, string>[]>([]);

  const locale   = overrides?.locale    ?? bffHeaders['x-locale']   ?? 'en';
  const platform = overrides?.platform  ?? bffHeaders['x-platform'] ?? 'web';
  const channel  = bffHeaders['x-channel'] ?? 'SDUI';
  const userId   = overrides?.userId    ?? bffHeaders['x-user-id']  ?? '';

  // Merge a resolved screen payload and apply self-pick from the manifest flag
  const applyPayload = useCallback(
    async (data: ScreenPayload, stale: boolean, forceUpdate: boolean) => {
      setPayload(data);
      setIsStale(stale);
      setError(null);

      // Resolve self-pick items from the SELF_PICK_ENTRY_POINTS slice if present
      const selfPickSlice = data.layout?.children?.find(
        (n: { componentType?: string }) => n.componentType === 'SELF_PICK_ENTRY_POINTS'
      );
      if (selfPickSlice) {
        const remoteDefaults = (selfPickSlice.props?.items as Record<string, string>[]) ?? [];
        const resolved = resolvedSelfPickItems(userId, screenId, remoteDefaults, forceUpdate);
        setSelfPickItems(resolved);
      }
    },
    [userId, screenId]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      // ── Step 1: CDN static distribution ─────────────────────────────────
      const [staticResult, manifest] = await Promise.all([
        resolveScreen(screenId),
        fetchManifest(),
      ]);
      const forceUpdate = manifest?.selfPickForceUpdate ?? false;

      if (!cancelled && staticResult.json) {
        try {
          const parsed: ScreenPayload = JSON.parse(staticResult.json);
          await applyPayload(parsed, staticResult.isStale, forceUpdate);
          if (!staticResult.isStale) {
            // Fresh static JSON served — skip BFF call
            setIsLoading(false);
            return;
          }
        } catch {
          // Malformed static JSON — fall through to BFF
        }
      }

      // ── Step 2: BFF live endpoint (personalised / A-B) ───────────────────
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const headers: Record<string, string> = {
        ...bffHeaders,
        'x-platform':     platform,
        'x-locale':       locale,
        'x-sdui-version': overrides?.sduiVersion ?? '2.3',
      };

      try {
        const res = await fetch(`${BFF_BASE}/screen/${screenId}`, {
          headers,
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`BFF returned ${res.status}`);
        const data = (await res.json()) as ScreenPayload;
        cacheScreen(screenId, data);
        if (!cancelled) {
          await applyPayload(data, false, forceUpdate);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (err instanceof Error && err.name === 'AbortError') {
            setError('Request timed out');
          } else {
            setError(msg);
          }
          // Static result may already be applied above; try legacy cache if not
          if (!payload) {
            const cached = getCachedScreen(screenId);
            if (cached && !cancelled) {
              await applyPayload(cached.payload, cached.isStale, forceUpdate);
            }
          }
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    // Background manifest re-check poll
    const pollId = setInterval(async () => {
      if (cancelled) return;
      const { json, isStale: stale } = await resolveScreen(screenId);
      if (!stale && json && !cancelled) {
        try {
          const parsed: ScreenPayload = JSON.parse(json);
          const mf = await fetchManifest();
          await applyPayload(parsed, false, mf?.selfPickForceUpdate ?? false);
        } catch { /* ignore */ }
      }
    }, MANIFEST_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenId, locale, platform, channel]);

  const onSelfPickChange = useCallback(
    (items: Record<string, string>[]) => {
      setSelfPickItems(items);
      saveCustomerSelfPick(userId, screenId, items);
    },
    [userId, screenId]
  );

  return { payload, isLoading, isStale, error, selfPickItems, onSelfPickChange };
}
