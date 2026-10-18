import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import { db } from "../db/index.js";

export type RadioTrack = Track | UnresolvedTrack;

export interface RadioSession {
  guildId: string;
  seedQuery: string;
  seedTrackTitle: string;
  seedArtist: string;
  playedUris: Set<string>;
  active: boolean;
}

const radioSessions = new Map<string, RadioSession>();

export function isRadioActive(guildId: string): boolean {
  const session = radioSessions.get(guildId);
  return !!session && session.active;
}

export function getRadioSession(guildId: string): RadioSession | undefined {
  return radioSessions.get(guildId);
}

export function stopRadio(guildId: string): void {
  const session = radioSessions.get(guildId);
  if (session) {
    session.active = false;
    radioSessions.delete(guildId);
  }
}

export async function fetchRadioRecommendations(
  player: Player,
  count = 3
): Promise<RadioTrack[]> {
  const session = radioSessions.get(player.guildId);
  if (!session || !session.active) return [];

  const currentUris = new Set<string>(session.playedUris);
  if (player.queue.current?.info?.uri) currentUris.add(player.queue.current.info.uri);
  for (const t of player.queue.tracks) {
    if (t.info?.uri) currentUris.add(t.info.uri);
  }

  // Buat beberapa search query variatif agar playlist dinamis dan tidak monoton
  const searchQueries = [
    `ytmsearch:${session.seedArtist} mix`,
    `ytmsearch:${session.seedArtist} similar songs`,
    `ytmsearch:${session.seedTrackTitle} ${session.seedArtist}`,
    `ytsearch:${session.seedArtist} songs`,
  ];

  const foundTracks: RadioTrack[] = [];

  for (const query of searchQueries) {
    if (foundTracks.length >= count) break;
    try {
      const res = await player.search(
        { query },
        { id: "radio", username: "Radio Mode" }
      );
      if (res && res.tracks && res.tracks.length > 0) {
        for (const track of res.tracks) {
          const uri = track.info.uri;
          if (uri && !currentUris.has(uri)) {
            currentUris.add(uri);
            session.playedUris.add(uri);
            foundTracks.push(track);
            if (foundTracks.length >= count) break;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Radio Search Error for query "${query}"]`, err?.message);
    }
  }

  // Fallback ke lagu dari riwayat database lokal jika pencarian YouTube sedikit
  if (foundTracks.length < count) {
    try {
      const historyRows = db
        .prepare(
          "SELECT title, artist, source_url FROM history WHERE guild_id = ? AND artist LIKE ? ORDER BY played_at DESC LIMIT 5"
        )
        .all(player.guildId, `%${session.seedArtist}%`) as Array<{
        title: string;
        artist: string;
        source_url: string;
      }>;

      for (const row of historyRows) {
        if (foundTracks.length >= count) break;
        if (!currentUris.has(row.source_url)) {
          const res = await player.search(
            { query: row.source_url || `${row.artist} - ${row.title}` },
            { id: "radio", username: "Radio Mode" }
          );
          if (res && res.tracks && res.tracks.length > 0) {
            const track = res.tracks[0];
            const uri = track.info.uri;
            if (uri && !currentUris.has(uri)) {
              currentUris.add(uri);
              session.playedUris.add(uri);
              foundTracks.push(track);
            }
          }
        }
      }
    } catch {}
  }

  return foundTracks;
}

export async function startRadio(
  player: Player,
  seedQuery: string,
  requester: any
): Promise<{ seedTrack: RadioTrack; queuedCount: number }> {
  // 1. Cari seed track
  const res = await player.search({ query: seedQuery }, requester);
  if (!res || !res.tracks || res.tracks.length === 0) {
    throw new Error(`Tidak dapat menemukan lagu untuk benih radio: "${seedQuery}"`);
  }

  const seedTrack = res.tracks[0];
  const seedArtist = seedTrack.info.author || "Unknown";
  const seedTitle = seedTrack.info.title;

  // Bersihkan antrean lama dan set session baru
  player.queue.tracks.splice(0, player.queue.tracks.length);
  player.queue.add(seedTrack);

  const playedUris = new Set<string>();
  if (seedTrack.info.uri) {
    playedUris.add(seedTrack.info.uri);
  }

  const session: RadioSession = {
    guildId: player.guildId,
    seedQuery,
    seedTrackTitle: seedTitle,
    seedArtist,
    playedUris,
    active: true,
  };
  radioSessions.set(player.guildId, session);

  // 2. Putar seed track segera
  if (!player.playing && !player.paused) {
    await player.play();
  }

  // 3. Pre-fetch 3 lagu awal agar antrean langsung siap
  const initialTracks = await fetchRadioRecommendations(player, 3);
  for (const t of initialTracks) {
    player.queue.add(t);
  }

  return {
    seedTrack,
    queuedCount: initialTracks.length,
  };
}
