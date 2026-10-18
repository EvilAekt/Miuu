import { lavalink } from "../player/lavalink.js";
import { resolveSpotifyUrl } from "../resolvers/spotify.js";
import { recordHealthEvent, getRecentFailures } from "../db/index.js";
import type { Player } from "lavalink-client";

export interface ComponentHealth {
  name: string;
  status: "ok" | "degraded" | "error";
  latencyMs: number;
  detail: string;
}

export interface SystemHealthReport {
  timestamp: number;
  botUptimeSeconds: number;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  lavalink: ComponentHealth;
  youtube: ComponentHealth;
  spotify: ComponentHealth;
  recentFailuresCount24h: number;
}

const CANARY_SPOTIFY_TRACK = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT";

export async function runHealthCheck(player?: Player | null, guildId?: string): Promise<SystemHealthReport> {
  const mem = process.memoryUsage();
  const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

  // 1. Lavalink Health
  const node = lavalink?.nodeManager?.nodes?.values()?.next()?.value;
  let lavalinkHealth: ComponentHealth;
  if (!node || !node.connected) {
    lavalinkHealth = {
      name: "Lavalink",
      status: "error",
      latencyMs: 0,
      detail: "Node terputus atau tidak terhubung",
    };
    recordHealthEvent("lavalink", "error", "Node disconnected");
  } else {
    lavalinkHealth = {
      name: "Lavalink",
      status: "ok",
      latencyMs: (node as any).stats?.ping || 0,
      detail: `Terhubung (Players: ${lavalink.players.size})`,
    };
  }

  // 2. YouTube Search Canary
  let youtubeHealth: ComponentHealth;
  const ytStart = Date.now();
  try {
    if (player) {
      const res = await player.search({ query: "canary test audio", source: "ytsearch" }, { id: "canary", username: "Canary" });
      const duration = Date.now() - ytStart;
      if (res && res.tracks && res.tracks.length > 0) {
        youtubeHealth = {
          name: "YouTube Plugin",
          status: duration > 3000 ? "degraded" : "ok",
          latencyMs: duration,
          detail: `Berhasil mencari (${res.tracks.length} hasil, ${duration}ms)`,
        };
      } else {
        youtubeHealth = {
          name: "YouTube Plugin",
          status: "degraded",
          latencyMs: duration,
          detail: "Hasil pencarian kosong",
        };
      }
    } else {
      youtubeHealth = {
        name: "YouTube Plugin",
        status: "ok",
        latencyMs: 0,
        detail: "Siap (Player idle)",
      };
    }
  } catch (err: any) {
    youtubeHealth = {
      name: "YouTube Plugin",
      status: "error",
      latencyMs: Date.now() - ytStart,
      detail: err?.message || "Gagal melakukan pencarian YouTube",
    };
    recordHealthEvent("youtube", "error", err?.message);
  }

  // 3. Spotify Resolver Canary (spotify-url-info)
  let spotifyHealth: ComponentHealth;
  const spStart = Date.now();
  try {
    const spRes = await resolveSpotifyUrl(CANARY_SPOTIFY_TRACK);
    const duration = Date.now() - spStart;
    if (spRes && spRes.tracks && spRes.tracks.length > 0) {
      spotifyHealth = {
        name: "Spotify Resolver",
        status: duration > 4000 ? "degraded" : "ok",
        latencyMs: duration,
        detail: `Berhasil resolve metadata (${spRes.tracks[0].title}, ${duration}ms)`,
      };
    } else {
      spotifyHealth = {
        name: "Spotify Resolver",
        status: "degraded",
        latencyMs: duration,
        detail: "Metadata kosong",
      };
    }
  } catch (err: any) {
    spotifyHealth = {
      name: "Spotify Resolver",
      status: "error",
      latencyMs: Date.now() - spStart,
      detail: err?.message || "Gagal membaca halaman embed Spotify",
    };
    recordHealthEvent("spotify", "error", err?.message);
  }

  // 4. Hitung lagu gagal 24 jam terakhir
  const failures = guildId ? getRecentFailures(guildId, 24) : [];

  return {
    timestamp: Date.now(),
    botUptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: toMb(mem.rss),
      heapUsedMb: toMb(mem.heapUsed),
      heapTotalMb: toMb(mem.heapTotal),
    },
    lavalink: lavalinkHealth,
    youtube: youtubeHealth,
    spotify: spotifyHealth,
    recentFailuresCount24h: failures.length,
  };
}
