import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import { getTopNextTracks, recordTrackTransition, recordArtistAffinity } from "../db/index.js";

// Cache alasan rekomendasi lagu saat ini: Map<guildId, { trackTitle: string; reason: string }>
export const currentTrackReasons = new Map<string, { trackTitle: string; reason: string }>();

export function setRecommendationReason(guildId: string, trackTitle: string, reason: string): void {
  currentTrackReasons.set(guildId, { trackTitle, reason });
}

export function getRecommendationReason(guildId: string): string {
  const info = currentTrackReasons.get(guildId);
  return info ? info.reason : "Lagu ini dipilih berdasarkan rekomendasi kemiripan genre dan artis terkait.";
}

export async function findSmartCandidate(
  player: Player,
  lastTrack: Track | UnresolvedTrack,
  mode: "riwayat" | "campur" | "jelajah" = "campur"
): Promise<{ track: Track | UnresolvedTrack; reason: string } | null> {
  const lastKey = `${lastTrack.info.author} - ${lastTrack.info.title}`.toLowerCase().trim();

  // 1. Jika mode "riwayat" atau "campur": Cek pola transisi riwayat nyata (PRD v4 E5: track_transitions)
  if (mode === "riwayat" || mode === "campur") {
    const transitions = getTopNextTracks(lastKey, 3);
    if (transitions.length > 0) {
      const candidateQuery = transitions[0].to_key;
      try {
        const res = await player.search({ query: candidateQuery }, { id: "smart", username: "Smart Autoplay" });
        if (res && res.tracks.length > 0) {
          return {
            track: res.tracks[0],
            reason: `Lagu ini sering didengarkan berturut-turut setelah "${lastTrack.info.title}" (${transitions[0].count}x pemutaran bersamaan).`,
          };
        }
      } catch {}
    }
  }

  // 2. Jika mode "jelajah": Eksplorasi artis baru / terkait
  if (mode === "jelajah") {
    try {
      const res = await player.search(
        { query: `artists similar to ${lastTrack.info.author} audio`, source: "ytmsearch" },
        { id: "smart", username: "Smart Autoplay" }
      );
      if (res && res.tracks.length > 0) {
        const lastAuthor = (lastTrack.info.author || "").toLowerCase();
        const next = res.tracks.find((t) => (t.info.author || "").toLowerCase() !== lastAuthor) || res.tracks[0];
        return {
          track: next,
          reason: `Lagu ini dipilih dari eksplorasi artis terkait genre serupa dengan ${lastTrack.info.author} (Mode Jelajah).`,
        };
      }
    } catch {}
  }

  // 3. Fallback / Default ("campur"): YouTube Music Mix berdasarkan artis
  try {
    const res = await player.search(
      { query: `${lastTrack.info.author} songs`, source: "ytmsearch" },
      { id: "smart", username: "Smart Autoplay" }
    );
    if (res && res.tracks.length > 0) {
      // Pilih track yang bukan lagu yang sama
      const next = res.tracks.find((t) => t.info.title.toLowerCase() !== lastTrack.info.title.toLowerCase()) || res.tracks[0];
      return {
        track: next,
        reason: `Lagu ini dipilih berdasarkan kemiripan gaya musik dan popularitas karya dari artis ${lastTrack.info.author}.`,
      };
    }
  } catch {}

  return null;
}

export { recordTrackTransition, recordArtistAffinity };
