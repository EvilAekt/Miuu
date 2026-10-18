import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import { getMatchOverride, setMatchOverride, getCachedTrack, setCachedTrack } from "../db/index.js";
import type { ResolvedSpotifyItem } from "../resolvers/spotify.js";

export interface MatchScoreResult {
  track: Track | UnresolvedTrack;
  score: number;
  reason: string[];
}

// Map guildId to the last played track's Spotify info for /fixmatch
export interface LastPlayedSpotifyInfo {
  spotifyId: string;
  title: string;
  artist: string;
  durationMs: number;
  youtubeId?: string;
}

export const lastPlayedSpotifyTracks = new Map<string, LastPlayedSpotifyInfo>();

/**
 * Menghitung skor kecocokan antara lagu Spotify dan kandidat video YouTube.
 * (PRD v2 E3: Skor pencocokan ditingkatkan dengan penalti dan bonus)
 */
export function calculateMatchScore(
  spotify: { title: string; artist: string; durationMs?: number },
  candidate: { title: string; author: string; duration: number }
): { score: number; reason: string[] } {
  let score = 50;
  const reasons: string[] = [];

  const normSpTitle = spotify.title.toLowerCase();
  const normSpArtist = spotify.artist.toLowerCase();
  const normCandTitle = candidate.title.toLowerCase();
  const normCandAuthor = candidate.author.toLowerCase();

  // 1. Bonus nama artis pada judul atau channel
  if (normCandAuthor.includes(normSpArtist) || normCandTitle.includes(normSpArtist)) {
    score += 20;
    reasons.push("+20 Artis cocok");
  }

  // 2. Bonus kanal resmi 'Topic' (rilis audio resmi YouTube Music)
  if (normCandAuthor.includes("topic") || normCandAuthor.includes("vevo") || normCandAuthor.includes("official")) {
    score += 25;
    reasons.push("+25 Kanal resmi/Topic/VEVO");
  }

  // 3. Bonus audio/video resmi
  if (normCandTitle.includes("official audio") || normCandTitle.includes("official music video") || normCandTitle.includes("official lyric video")) {
    score += 15;
    reasons.push("+15 Official video/audio");
  }

  // 4. Penalti jika kandidat mengandung kata terlarang yang TIDAK ADA di judul asli
  const penaltyWords = [
    { word: "cover", penalty: 40 },
    { word: "karaoke", penalty: 40 },
    { word: "live", penalty: 30 },
    { word: "slowed", penalty: 35 },
    { word: "sped up", penalty: 35 },
    { word: "remix", penalty: 30 },
    { word: "reaction", penalty: 50 },
    { word: "parody", penalty: 50 },
    { word: "8d audio", penalty: 30 },
    { word: "instrumental", penalty: 30 },
  ];

  for (const item of penaltyWords) {
    if (normCandTitle.includes(item.word) && !normSpTitle.includes(item.word)) {
      score -= item.penalty;
      reasons.push(`-${item.penalty} Mengandung "${item.word}"`);
    }
  }

  // 5. Perbandingan durasi (jika Spotify duration tersedia)
  if (spotify.durationMs && spotify.durationMs > 0 && candidate.duration > 0) {
    const diffSec = Math.abs((spotify.durationMs - candidate.duration) / 1000);
    if (diffSec <= 3) {
      score += 20;
      reasons.push("+20 Durasi identik (±3s)");
    } else if (diffSec <= 10) {
      score += 10;
      reasons.push("+10 Durasi hampir sama (±10s)");
    } else if (diffSec > 60) {
      score -= 30;
      reasons.push("-30 Selisih durasi > 60s");
    }
  }

  return { score: Math.max(0, score), reason: reasons };
}

/**
 * Mencari kandidat YouTube terbaik untuk Spotify track dengan mempertimbangkan override, cache, dan skor.
 */
export async function matchSpotifyToYouTube(
  player: Player,
  item: ResolvedSpotifyItem,
  requester: any
): Promise<{ bestTrack: Track | UnresolvedTrack | null; candidates: MatchScoreResult[] }> {
  const spotifyId = item.uri?.split(":").pop() || `${item.artist} - ${item.title}`;

  // 1. Cek manual override di database (PRD v2 E3: match_overrides)
  const overrideYtId = getMatchOverride(spotifyId);
  if (overrideYtId) {
    try {
      const res = await player.search({ query: `https://www.youtube.com/watch?v=${overrideYtId}` }, requester);
      if (res && res.tracks.length > 0) {
        return {
          bestTrack: res.tracks[0],
          candidates: [{ track: res.tracks[0], score: 999, reason: ["Manual match_override"] }],
        };
      }
    } catch {}
  }

  // 2. Cek cache SQLite
  const cached = getCachedTrack("spotify", spotifyId);
  if (cached) {
    try {
      const res = await player.search({ query: `https://www.youtube.com/watch?v=${cached.resolved_id}` }, requester);
      if (res && res.tracks.length > 0) {
        return {
          bestTrack: res.tracks[0],
          candidates: [{ track: res.tracks[0], score: 500, reason: ["Cached track"] }],
        };
      }
    } catch {}
  }

  // 3. Cari beberapa kandidat dari YouTube Music / YouTube Search
  const query = `${item.artist} - ${item.title}`;
  let rawTracks: (Track | UnresolvedTrack)[] = [];

  try {
    const resMusic = await player.search({ query, source: "ytmsearch" }, requester);
    if (resMusic && resMusic.tracks.length > 0) {
      rawTracks.push(...resMusic.tracks.slice(0, 5));
    }
  } catch {}

  try {
    const resYt = await player.search({ query, source: "ytsearch" }, requester);
    if (resYt && resYt.tracks.length > 0) {
      // Masukkan kandidat unik
      for (const t of resYt.tracks.slice(0, 5)) {
        if (!rawTracks.some((r) => r.info.identifier === t.info.identifier)) {
          rawTracks.push(t);
        }
      }
    }
  } catch {}

  if (rawTracks.length === 0) {
    return { bestTrack: null, candidates: [] };
  }

  // 4. Hitung skor untuk tiap kandidat
  const scoredCandidates: MatchScoreResult[] = rawTracks.map((cand) => {
    const { score, reason } = calculateMatchScore(
      { title: item.title, artist: item.artist, durationMs: item.durationMs },
      { title: cand.info.title, author: cand.info.author || "Unknown", duration: cand.info.duration || 0 }
    );
    return { track: cand, score, reason };
  });

  // Urutkan kandidat dari skor tertinggi
  scoredCandidates.sort((a, b) => b.score - a.score);

  const best = scoredCandidates[0]?.track || null;
  if (best && best.info.identifier) {
    setCachedTrack("spotify", spotifyId, "youtube", best.info.identifier, best.info.title, best.info.duration || 0);
  }

  return {
    bestTrack: best,
    candidates: scoredCandidates,
  };
}
