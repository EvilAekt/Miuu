// src/player/searchCache.ts: Ultra-Fast In-Memory Search LRU Cache for Lavalink Queries
// Memangkas Search-to-Play Latency dari ~1000ms menjadi < 1ms untuk pencarian berulang

export interface SearchCacheEntry {
  result: any;
  cachedAt: number;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 150;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 Jam

const searchCacheMap = new Map<string, SearchCacheEntry>();

function normalizeKey(query: string, source = "ytsearch"): string {
  return `${source.toLowerCase().trim()}:${query.toLowerCase().trim()}`;
}

/**
 * Mengambil hasil pencarian dari in-memory LRU cache jika masih valid
 */
export function getCachedSearchResults(query: string, source = "ytsearch"): any | null {
  const key = normalizeKey(query, source);
  const entry = searchCacheMap.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    searchCacheMap.delete(key);
    return null;
  }

  // Refresh posisi LRU (pindahkan ke paling akhir)
  searchCacheMap.delete(key);
  searchCacheMap.set(key, entry);

  return entry.result;
}

/**
 * Menyimpan hasil pencarian lagu ke dalam in-memory cache dengan LRU eviction
 */
export function setCachedSearchResults(
  query: string,
  source = "ytsearch",
  result: any,
  ttlMs = DEFAULT_TTL_MS
): void {
  // Hanya simpan jika hasil valid dan memiliki tracks
  if (!result || !result.tracks || result.tracks.length === 0) return;

  const key = normalizeKey(query, source);

  // Jika kapasitas penuh, singkirkan elemen tertua (kunci pertama di Map)
  if (searchCacheMap.size >= MAX_CACHE_ENTRIES && !searchCacheMap.has(key)) {
    const oldestKey = searchCacheMap.keys().next().value;
    if (oldestKey) {
      searchCacheMap.delete(oldestKey);
    }
  }

  searchCacheMap.set(key, {
    result,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Mengosongkan cache pencarian (digunakan untuk testing dan maintenance)
 */
export function clearSearchCache(): void {
  searchCacheMap.clear();
}

/**
 * Mendapatkan jumlah entri pencarian yang aktif di memori
 */
export function getSearchCacheSize(): number {
  return searchCacheMap.size;
}
