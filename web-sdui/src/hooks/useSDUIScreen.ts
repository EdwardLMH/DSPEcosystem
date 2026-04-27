import { useState, useEffect } from 'react';
import { ScreenPayload } from '../types/sdui';
import { cacheScreen, getCachedScreen } from '../engine/ScreenCache';

const BFF_BASE = '/api/v1';
const REQUEST_TIMEOUT_MS = 3000;

interface UseSDUIScreenResult {
  payload: ScreenPayload | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
}

export function useSDUIScreen(
  screenId: string,
  context: { platform: string; locale: string; sduiVersion: string }
): UseSDUIScreenResult {
  const [payload, setPayload] = useState<ScreenPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    fetch(`${BFF_BASE}/screen/${screenId}`, {
      headers: {
        'x-platform': context.platform,
        'x-locale': context.locale,
        'x-sdui-version': context.sduiVersion,
      },
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`BFF returned ${res.status}`);
        return res.json() as Promise<ScreenPayload>;
      })
      .then(data => {
        cacheScreen(screenId, data);
        setPayload(data);
        setIsStale(false);
        setError(null);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          setError('Request timed out');
        } else {
          setError(err.message);
        }
        // Fall back to cache
        const cached = getCachedScreen(screenId);
        if (cached) {
          setPayload(cached.payload);
          setIsStale(cached.isStale);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [screenId, context.platform, context.locale]);

  return { payload, isLoading, isStale, error };
}
