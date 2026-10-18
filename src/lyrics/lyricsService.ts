import { db } from "../db/index.js";

export interface LyricsResult {
  trackName: string;
  artistName: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  syncedLines: Array<{ time: number; text: string }>;
}

export function cleanTrackTitle(str: string): string {
  return str
    .replace(/(\(|\[).*?(official|video|lyric|audio|mv|remaster|visualizer).*?(\)|\])/gi, "")
    .replace(/ft\..*|feat\..*/gi, "")
    .trim();
}

export function parseLrcLyrics(lrcText: string): Array<{ time: number; text: string }> {
  const lines = lrcText.split(/\r?\n/);
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const timeMs = Math.round((minutes * 60 + seconds) * 1000);
      const text = match[3].trim();
      result.push({ time: timeMs, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export async function fetchLyrics(rawTitle: string, rawArtist = ""): Promise<LyricsResult | null> {
  let title = cleanTrackTitle(rawTitle);
  let artist = cleanTrackTitle(rawArtist);

  if (artist.toLowerCase().includes("topic") && title.includes(" - ")) {
    const parts = title.split(" - ");
    artist = parts[0].trim();
    title = parts.slice(1).join(" - ").trim();
  }

  const cacheKey = `${artist.toLowerCase()}_${title.toLowerCase()}`.replace(/\s+/g, "_");

  // 1. Cek SQLite cache
  try {
    const cachedRow = db
      .prepare("SELECT content FROM lyrics_cache WHERE track_key = ? AND expires_at > ?")
      .get(cacheKey, Date.now()) as { content: string } | undefined;

    if (cachedRow) {
      const parsed = JSON.parse(cachedRow.content);
      return {
        ...parsed,
        syncedLines: parsed.syncedLyrics ? parseLrcLyrics(parsed.syncedLyrics) : [],
      };
    }
  } catch {}

  // 2. Fetch ke LRCLIB API
  let data: any = null;
  if (title && artist) {
    try {
      const res = await fetch(
        `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
      );
      if (res.ok) {
        data = await res.json();
      }
    } catch {}
  }

  if (!data || (!data.plainLyrics && !data.syncedLyrics)) {
    try {
      const query = `${artist} ${title}`.trim();
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const list = (await res.json()) as any[];
        if (Array.isArray(list) && list.length > 0) {
          data = list.find((item: any) => item.syncedLyrics || item.plainLyrics) || list[0];
        }
      }
    } catch {}
  }

  if (!data || (!data.plainLyrics && !data.syncedLyrics)) {
    return null;
  }

  const result: LyricsResult = {
    trackName: data.trackName || title,
    artistName: data.artistName || artist,
    plainLyrics: data.plainLyrics || null,
    syncedLyrics: data.syncedLyrics || null,
    syncedLines: data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [],
  };

  // Simpan ke SQLite cache selama 7 hari
  try {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    db.prepare(`
      INSERT INTO lyrics_cache (track_key, kind, content, expires_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(track_key) DO UPDATE SET
        content = excluded.content,
        expires_at = excluded.expires_at
    `).run(cacheKey, "lrclib", JSON.stringify({
      trackName: result.trackName,
      artistName: result.artistName,
      plainLyrics: result.plainLyrics,
      syncedLyrics: result.syncedLyrics,
    }), expiresAt);
  } catch (err: any) {
    console.warn("[Lyrics Cache Save Error]", err?.message);
  }

  return result;
}

/**
 * Melakukan pre-fetch lirik secara asinkron di latar belakang (non-blocking microtask).
 * Memastikan lirik sudah tersimpan di SQLite/RAM sebelum diminta di dashboard (0ms latency).
 */
export function prefetchTrackLyrics(rawTitle: string, rawArtist = ""): void {
  if (!rawTitle) return;
  fetchLyrics(rawTitle, rawArtist).catch(() => {});
}
