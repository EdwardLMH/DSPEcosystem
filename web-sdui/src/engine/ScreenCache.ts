import { ScreenPayload } from '../types/sdui';

const CACHE_PREFIX = 'sdui_screen_';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function cacheScreen(screenId: string, payload: ScreenPayload): void {
  try {
    const entry = { payload, cachedAt: Date.now() };
    localStorage.setItem(CACHE_PREFIX + screenId, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

export function getCachedScreen(screenId: string): {
  payload: ScreenPayload;
  isStale: boolean;
} | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + screenId);
    if (!raw) return null;
    const { payload, cachedAt } = JSON.parse(raw);
    const ageMs = Date.now() - cachedAt;
    if (ageMs > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_PREFIX + screenId);
      return null;
    }
    return { payload, isStale: ageMs > 60 * 60 * 1000 }; // stale after 1h
  } catch {
    return null;
  }
}
