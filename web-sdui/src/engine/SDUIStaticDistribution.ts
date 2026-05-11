// SDUIStaticDistribution.ts
// HSBC SDUI Web Renderer
//
// Implements the three-tier resolution chain for SDUI screens:
//   1. Fetch manifest.json from CDN — compare version vs. Cache API entry
//   2a. Version unchanged → serve Cache API entry (no download)
//   2b. Version changed / no cache → download, SHA-256 verify, persist, render
//   3. CDN unreachable → serve Cache API; if absent → serve localStorage fallback
//
// Also manages self-pick entry-point preferences:
//   • Customer preferences stored in localStorage under "selfPick_{userId}_{screenId}"
//   • Preserved across remote updates unless selfPickForceUpdate === true in manifest

const CDN_BASE      = 'https://cdn.hsbc.com/sdui';
const APP_ID        = 'hsbcmobile';
const PLATFORM      = 'web';
const CACHE_NAME    = 'hsbc-sdui-screens-v1';
const VERSION_PREFIX = 'sdui_version_';
const SELF_PICK_PREFIX = 'selfPick_';

// ─── Manifest types ───────────────────────────────────────────────────────────

export interface SDUIManifest {
  schemaVersion: string;
  generatedAt: string;
  screens: Record<string, SDUIScreenEntry>;
  selfPickForceUpdate: boolean;
}

interface SDUIScreenEntry {
  version: string;
  etag: string;
  sizeBytes: number;
}

interface SelfPickEntry {
  items: Record<string, string>[];
  savedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Manifest ─────────────────────────────────────────────────────────────────

export async function fetchManifest(): Promise<SDUIManifest | null> {
  try {
    const res = await fetch(`${CDN_BASE}/${APP_ID}/${PLATFORM}/manifest.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as SDUIManifest;
  } catch {
    return null;
  }
}

// ─── 3-Tier Resolution Chain ──────────────────────────────────────────────────

/**
 * Resolves the best available SDUI JSON string for `screenId`.
 * Returns { json, isStale } — isStale=true means we served cached/fallback data.
 */
export async function resolveScreen(
  screenId: string
): Promise<{ json: string | null; isStale: boolean }> {
  const manifest = await fetchManifest();

  if (manifest) {
    const entry = manifest.screens[screenId];
    if (entry) {
      const storedVersion = localStorage.getItem(VERSION_PREFIX + screenId);

      if (storedVersion === entry.version) {
        // Version unchanged — serve from Cache API (no network download)
        const cached = await loadFromCacheApi(screenId);
        if (cached !== null) return { json: cached, isStale: false };
      }

      // Version changed or no cache entry — download from CDN
      const downloaded = await downloadScreen(screenId, entry.version, entry.etag);
      if (downloaded !== null) {
        await persistToCacheApi(screenId, downloaded);
        localStorage.setItem(VERSION_PREFIX + screenId, entry.version);
        return { json: downloaded, isStale: false };
      }

      // Download failed (corrupted / missing on CDN) — keep existing cache
      console.warn(`[SDUI] CDN download failed for screen '${screenId}' v${entry.version}`);
    }
  }

  // Step 3 — CDN unreachable or no entry for this screen
  const cacheHit = await loadFromCacheApi(screenId);
  if (cacheHit !== null) return { json: cacheHit, isStale: true };

  // Last resort — localStorage fallback (small screens only; filled by previous BFF calls)
  const lsFallback = localStorage.getItem(`sdui_fallback_${screenId}`);
  if (lsFallback) return { json: lsFallback, isStale: true };

  return { json: null, isStale: true };
}

// ─── Cache API helpers ────────────────────────────────────────────────────────

async function loadFromCacheApi(screenId: string): Promise<string | null> {
  try {
    if (!('caches' in self)) return null;
    const cache = await caches.open(CACHE_NAME);
    const res   = await cache.match(screenCacheUrl(screenId));
    if (!res) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function persistToCacheApi(screenId: string, json: string): Promise<void> {
  try {
    if (!('caches' in self)) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      screenCacheUrl(screenId),
      new Response(json, { headers: { 'Content-Type': 'application/json' } })
    );
  } catch {
    // Quota exceeded or private browsing — silently skip
  }
}

function screenCacheUrl(screenId: string): string {
  return `${CDN_BASE}/${APP_ID}/${PLATFORM}/${screenId}/cached.json`;
}

// ─── CDN Download ─────────────────────────────────────────────────────────────

async function downloadScreen(
  screenId: string,
  version: string,
  etag: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${CDN_BASE}/${APP_ID}/${PLATFORM}/${screenId}/${version}.json`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const stripped    = etag.replace(/"/g, '');
    const computed    = await sha256Hex(arrayBuffer);

    if (computed.toLowerCase() !== stripped.toLowerCase()) {
      console.error(`[SDUI] Integrity check failed for screen '${screenId}': expected ${stripped}, got ${computed}`);
      return null;
    }

    return new TextDecoder().decode(arrayBuffer);
  } catch {
    return null;
  }
}

// ─── Self-Pick ────────────────────────────────────────────────────────────────

/**
 * Returns merged self-pick items for the SELF_PICK_ENTRY_POINTS slice.
 * When `forceUpdate` is true: clears saved preferences and returns remote defaults.
 * Otherwise:  saved customer ordering overrides remote defaults.
 */
export function resolvedSelfPickItems(
  userId: string,
  screenId: string,
  remoteDefaults: Record<string, string>[],
  forceUpdate: boolean
): Record<string, string>[] {
  const key = `${SELF_PICK_PREFIX}${userId}_${screenId}`;

  if (forceUpdate) {
    localStorage.removeItem(key);
    return remoteDefaults;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return remoteDefaults;
    const entry: SelfPickEntry = JSON.parse(raw);
    return entry.items ?? remoteDefaults;
  } catch {
    return remoteDefaults;
  }
}

/** Saves customer self-pick ordering to localStorage. */
export function saveCustomerSelfPick(
  userId: string,
  screenId: string,
  items: Record<string, string>[]
): void {
  const key   = `${SELF_PICK_PREFIX}${userId}_${screenId}`;
  const entry: SelfPickEntry = { items, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Quota exceeded — silently skip
  }
}
