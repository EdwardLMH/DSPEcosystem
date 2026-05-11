// Semantic Search API client
// Calls the BFF search endpoint which simulates vector-based ranking.
// Used by the AI_SEARCH_BAR slice on web-sdui and referenced by all
// native SDUI platforms (iOS, Android, HarmonyNext) via the same endpoint.

const BFF_BASE = import.meta.env.VITE_BFF_BASE_URL ?? 'http://localhost:4000';

export interface SearchResultItem {
  id: string;
  type: 'product' | 'ranking' | 'deal' | 'campaign' | 'function';
  title: string;
  description: string;
  icon: string;
  category: string;
  deepLink: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  totalMatched: number;
  results: SearchResultItem[];
}

export interface SearchCorpusEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  keywords: string[];
  icon: string;
  category: string;
  deepLink: string;
}

export interface SearchCorpusResponse {
  version: string;
  generatedAt: string;
  appId: string;
  count: number;
  corpus: SearchCorpusEntry[];
}

/**
 * POST /api/v1/search
 * Sends a natural-language query to the BFF semantic search endpoint.
 * The BFF ranks the SDUI content corpus using TF-IDF + keyword overlap.
 * Pass appId to search within a per-app corpus configured via OCDP AI Search.
 */
export async function semanticSearch(
  query: string,
  options: { limit?: number; types?: string[]; appId?: string } = {},
): Promise<SearchResponse> {
  const res = await fetch(`${BFF_BASE}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: options.limit ?? 8,
      types: options.types,
      appId: options.appId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Search failed: ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}

/**
 * GET /api/v1/search/corpus?appId=
 * Fetches the full searchable corpus — suitable for client-side caching.
 * Pass appId to retrieve the per-app corpus built from operator-configured sources.
 * Cache with a short TTL (e.g. 5 min) since the corpus changes when pages are published.
 */
export async function fetchSearchCorpus(appId?: string): Promise<SearchCorpusResponse> {
  const url = appId ? `${BFF_BASE}/api/v1/search/corpus?appId=${encodeURIComponent(appId)}` : `${BFF_BASE}/api/v1/search/corpus`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Corpus fetch failed: ${res.status}`);
  return res.json() as Promise<SearchCorpusResponse>;
}

/**
 * POST /api/v1/search/config/:configId/rebuild
 * Triggers a corpus rebuild on the BFF for the given AI Search config.
 * The BFF ingests quick-access entry points and content sources, then
 * re-indexes the corpus for the associated appId.
 */
export async function rebuildSearchCorpus(
  configId: string,
  configPayload: Record<string, unknown>,
): Promise<{ appId: string; corpusSize: number; rebuiltAt: string }> {
  const res = await fetch(`${BFF_BASE}/api/v1/search/config/${encodeURIComponent(configId)}/rebuild`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configPayload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Rebuild failed: ${res.status}`);
  }
  return res.json() as Promise<{ appId: string; corpusSize: number; rebuiltAt: string }>;
}

