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
  count: number;
  corpus: SearchCorpusEntry[];
}

/**
 * POST /api/v1/search
 * Sends a natural-language query to the BFF semantic search endpoint.
 * The BFF ranks the SDUI content corpus using TF-IDF + keyword overlap.
 */
export async function semanticSearch(
  query: string,
  options: { limit?: number; types?: string[] } = {},
): Promise<SearchResponse> {
  const res = await fetch(`${BFF_BASE}/api/v1/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: options.limit ?? 8, types: options.types }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Search failed: ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}

/**
 * GET /api/v1/search/corpus
 * Fetches the full searchable corpus — suitable for client-side caching.
 * Cache with a short TTL (e.g. 5 min) since the corpus changes when pages are published.
 */
export async function fetchSearchCorpus(): Promise<SearchCorpusResponse> {
  const res = await fetch(`${BFF_BASE}/api/v1/search/corpus`);
  if (!res.ok) throw new Error(`Corpus fetch failed: ${res.status}`);
  return res.json() as Promise<SearchCorpusResponse>;
}
