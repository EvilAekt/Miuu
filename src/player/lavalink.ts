import { Client, TextChannel } from "discord.js";
import { LavalinkManager, type Player, type Track, type UnresolvedTrack } from "lavalink-client";
import { config } from "../config/env.js";
import {
  recordHistory,
  getGuildAutoplay,
  getGuildAutoplayMode,
  getGuildAlwaysOn,
  getGuildUiMode,
  saveQueueSnapshot,
  clearQueueSnapshot,
  recordPlayLog,
  recordHealthEvent,
  getTrackVolumePref,
  saveResumePosition,
  recordDemandEvent,
} from "../db/index.js";
import { isRadioActive, fetchRadioRecommendations, stopRadio } from "../recommend/radio.js";
import { unregisterSession } from "../sessions/sessionManager.js";
import { queueUserScrobble } from "../scrobble/listenbrainz.js";
import {
  findSmartCandidate,
  setRecommendationReason,
  recordTrackTransition,
  recordArtistAffinity,
} from "../recommend/smartRecommend.js";
import { createNowPlayingEmbed, createNowPlayingComponents, createErrorEmbed } from "../ui/embeds.js";
import { createNowPlayingPayloadV2 } from "../ui/componentsV2.js";
import { broadcastDashboardEvent, getCompleteDashboardStatus } from "../web/server.js";
import { prefetchTrackLyrics } from "../lyrics/lyricsService.js";

export let lavalink: LavalinkManager;
const autoLeaveTimers = new Map<string, NodeJS.Timeout>();
export const lastNowPlayingMessages = new Map<string, { channelId: string; messageId: string }>();

export function initLavalink(client: Client): LavalinkManager {
  const primaryNode = {
    id: "primary",
    host: config.LAVALINK_HOST,
    port: config.LAVALINK_PORT,
    authorization: config.LAVALINK_PASSWORD,
    secure: config.LAVALINK_SECURE ?? (config.LAVALINK_PORT === 443),
    retryAmount: 10,
    retryDelay: 3000,
  };

  const backupHost =
    config.LAVALINK_BACKUP_HOST ||
    (config.LAVALINK_HOST !== "lavalink.jirayu.net" ? "lavalink.jirayu.net" : "nodelink.gdjkhp.com");
  const backupNode = {
    id: "backup",
    host: backupHost,
    port: config.LAVALINK_BACKUP_PORT ?? 443,
    authorization: config.LAVALINK_BACKUP_PASSWORD ?? "youshallnotpass",
    secure: config.LAVALINK_BACKUP_SECURE ?? true,
    retryAmount: 10,
    retryDelay: 3000,
  };

  const nodes = [primaryNode];
  if (primaryNode.host !== backupNode.host) {
    nodes.push(backupNode);
  }

  lavalink = new LavalinkManager({
    nodes,
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    autoSkip: true,
    client: { id: client.user?.id ?? "", username: client.user?.username ?? "" },
  });

  client.on("raw", (data) => lavalink.sendRawData(data));

  lavalink.nodeManager.on("connect", (node) => {
    console.log(`[Lavalink] Node ${node.id} (${node.options.host}) connected successfully.`);
    recordHealthEvent("lavalink", "ok", `Node ${node.id} (${node.options.host}) connected successfully.`);
  });

  lavalink.nodeManager.on("disconnect", (node, reason) => {
    console.warn(`[Lavalink] Node ${node.id} (${node.options.host}) disconnected:`, reason);
    recordHealthEvent("lavalink", "warn", `Node ${node.id} (${node.options.host}) disconnected: ${reason}`);
  });

  lavalink.nodeManager.on("error", (node, error) => {
    console.error(`[Lavalink] Node ${node.id} (${node.options.host}) error:`, error?.message ?? error);
    recordHealthEvent("lavalink", "error", `Node ${node.id} error: ${error?.message ?? error}`);
  });

  lavalink.on("trackStart", async (player: Player, track: Track | null) => {
    if (!track) return;
    // Cancel any pending auto-leave timer since music is playing
    cancelAutoLeave(player.guildId);

    // Real-Time Broadcast Status ke Web Dashboard via SSE (< 5ms latency)
    try {
      broadcastDashboardEvent("track_change", getCompleteDashboardStatus(client));
    } catch {}

    // Speculative Background Lirik Pre-fetch (0ms wait saat tab lirik dibuka)
    try {
      prefetchTrackLyrics(track.info.title, track.info.author);
      const nextTrack = player.queue.tracks[0];
      if (nextTrack && nextTrack.info?.title) {
        prefetchTrackLyrics(nextTrack.info.title, nextTrack.info.author);
      }
    } catch {}

    // Update Discord Client Rich Presence (PRD v7)
    try {
      client.user?.setActivity(`${track.info.title} - ${track.info.author}`, { type: 2 });
    } catch {}

    // Record history to SQLite
    const requesterId = (track.requester as any)?.id || "unknown";
    recordHistory(player.guildId, requesterId, track.info.title, track.info.author, track.info.uri || "");

    // Record telemetry to play_log (PRD v2 Epic 0)
    try {
      recordPlayLog({
        guild_id: player.guildId,
        user_id: requesterId,
        source: track.info.sourceName || "youtube",
        source_url: track.info.uri || "",
        title: track.info.title,
        artist: track.info.author,
        result: "success",
        start_latency_ms: 0,
        played_at: Date.now(),
      });
    } catch {}

    // Simpan snapshot antrean ke SQLite (PRD Section 9 & 15)
    try {
      const allActive = [];
      if (player.queue.current) allActive.push(player.queue.current);
      allActive.push(...player.queue.tracks);
      saveQueueSnapshot(player.guildId, player.textChannelId || "", player.voiceChannelId || "", allActive);
    } catch {}

    // PRD v5 E5: Otomatis terapkan preferensi volume lagu jika tersimpan di SQLite
    try {
      const trackKey = `${track.info.author} - ${track.info.title}`;
      const prefVol = getTrackVolumePref(trackKey);
      if (prefVol !== null) {
        console.log(`[Lavalink] Menerapkan volume preferensi ${prefVol}% untuk "${track.info.title}"`);
        await player.setVolume(prefVol);
      }
    } catch {}

    if (!player.textChannelId) return;
    try {
      // Optimasi latency: gunakan client cache sebelum network fetch
      const channel = client.channels.cache.get(player.textChannelId) || (await client.channels.fetch(player.textChannelId));
      if (channel && channel.isTextBased() && "send" in channel) {
        // Disable buttons on the previous Now Playing message if one exists (PRD Section 10)
        const prevMsgInfo = lastNowPlayingMessages.get(player.guildId);
        if (prevMsgInfo) {
          try {
            const prevChannel = client.channels.cache.get(prevMsgInfo.channelId) || (await client.channels.fetch(prevMsgInfo.channelId));
            if (prevChannel && "messages" in prevChannel) {
              const prevMsg = await (prevChannel as TextChannel).messages.fetch(prevMsgInfo.messageId);
              if (prevMsg) {
                await prevMsg.edit({ components: createNowPlayingComponents(player, true) });
              }
            }
          } catch {}
        }

        const uiMode = getGuildUiMode(player.guildId);
        let sentMsg;
        if (uiMode === "v2") {
          const payload = createNowPlayingPayloadV2(track, player, false);
          sentMsg = await (channel as TextChannel).send(payload as any);
        } else {
          const embed = createNowPlayingEmbed(track, player);
          const components = createNowPlayingComponents(player, false);
          sentMsg = await (channel as TextChannel).send({ embeds: [embed], components });
        }
        lastNowPlayingMessages.set(player.guildId, {
          channelId: channel.id,
          messageId: sentMsg.id,
        });
      }
    } catch (err: any) {
      console.warn(`[Lavalink] Gagal mengirim pesan Now Playing:`, err?.message);
    }
  });

  lavalink.on("trackEnd", async (player: Player, track: Track | UnresolvedTrack | null) => {
    if (!track) return;
    try {
      broadcastDashboardEvent("track_change", getCompleteDashboardStatus(client));
    } catch {}
    const requesterId = (track.requester as any)?.id;
    const author = track.info?.author || "Unknown";
    const title = track.info?.title || "Unknown";
    const duration = track.info?.duration || 0;
    const pos = player.position || 0;

    // 1. Scrobble jika pemutaran selesai (PRD v4 E4)
    if (requesterId && typeof requesterId === "string") {
      queueUserScrobble(requesterId, {
        artist: author,
        title,
        durationMs: track.info?.duration,
      });
      recordArtistAffinity(requesterId, author, true);
    }

    // 2. Rekam transisi antar-lagu untuk rekomendasi cerdas (PRD v4 E5)
    if (player.queue.previous && player.queue.previous.length > 0) {
      const prevTrack = player.queue.previous[player.queue.previous.length - 1];
      if (prevTrack && prevTrack.info?.title) {
        const fromKey = `${prevTrack.info.author} - ${prevTrack.info.title}`;
        const toKey = `${author} - ${title}`;
        recordTrackTransition(fromKey, toKey);
      }
    }

    // 3. PRD v5 E6: Catat resume position untuk konten panjang (> 10 menit) atau long_content_stop (> 30 menit)
    try {
      if (duration >= 1800000 && pos > 0 && pos / duration < 0.95) {
        recordDemandEvent(
          "long_content_stop",
          player.guildId,
          typeof requesterId === "string" ? requesterId : undefined,
          `Konten panjang dihentikan pada ${pos}ms dari total ${duration}ms`
        );
      }
      if (typeof requesterId === "string" && duration >= 600000 && pos >= 10000 && pos / duration < 0.95) {
        const trackKey = `${author} - ${title}`;
        saveResumePosition(requesterId, trackKey, pos, duration);
      }
    } catch {}
  });

  lavalink.on("trackError", async (player: Player, track: Track | UnresolvedTrack | null, payload: any) => {
    console.error(`[Lavalink] trackError pada "${track?.info?.title}":`, payload?.exception?.message ?? payload);
    const requesterId = (track?.requester as any)?.id || "unknown";
    const msg = payload?.exception?.message || "YouTube/Lavalink menolak pemutaran lagu ini.";

    // Record failure telemetry (PRD v2 Epic 0 & E1)
    try {
      recordPlayLog({
        guild_id: player.guildId,
        user_id: requesterId,
        source: track?.info?.sourceName || "youtube",
        source_url: track?.info?.uri || "",
        title: track?.info?.title || "Unknown",
        artist: track?.info?.author || "Unknown",
        result: "failed",
        fail_reason: msg.slice(0, 200),
        played_at: Date.now(),
      });
      recordHealthEvent("lavalink", "error", `trackError pada "${track?.info?.title}": ${msg.slice(0, 100)}`);
    } catch {}

    if (!player.textChannelId) return;
    try {
      const channel = await client.channels.fetch(player.textChannelId);
      if (channel && channel.isTextBased() && "send" in channel) {
        const embed = createErrorEmbed("Gagal Memutar Lagu", `Lagu **${track?.info?.title || "Unknown"}** tidak dapat diputar:\n\`${msg.slice(0, 150)}\``);
        await (channel as TextChannel).send({ embeds: [embed] });
      }
    } catch {}
  });

  lavalink.on("queueEnd", async (player: Player) => {
    // Check if Radio Mode is active (PRD v2 Epic 5)
    if (isRadioActive(player.guildId)) {
      if (player.voiceChannelId) {
        try {
          const channel = await client.channels.fetch(player.voiceChannelId);
          if (channel && channel.isVoiceBased()) {
            const humans = channel.members.filter((m) => !m.user.bot);
            if (humans.size === 0) {
              console.log(`[Radio] VC di guild ${player.guildId} kosong dari member manusia. Menghentikan stasiun radio.`);
              stopRadio(player.guildId);
            }
          }
        } catch {}
      }

      if (isRadioActive(player.guildId)) {
        console.log(`[Radio] Antrean habis, mengambil rekomendasi radio berikutnya untuk guild ${player.guildId}...`);
        const nextTracks = await fetchRadioRecommendations(player, 3);
        if (nextTracks.length > 0) {
          for (const t of nextTracks) {
            player.queue.add(t);
          }
          await player.play();
          return;
        }
      }
    }

    // Check if Autoplay is enabled (PRD Section 5.1 & PRD v4 E5: Smart Candidate)
    const autoplay = getGuildAutoplay(player.guildId);
    if (autoplay && player.queue.previous && player.queue.previous.length > 0) {
      const lastTrack = player.queue.previous[player.queue.previous.length - 1];
      if (lastTrack) {
        console.log(`[Autoplay] Antrean habis, mencari rekomendasi cerdas terkait "${lastTrack.info.title}"...`);
        try {
          // 1. Coba Smart Candidate berbasis mode dan transisi riwayat nyata
          const mode = getGuildAutoplayMode(player.guildId);
          const smartMatch = await findSmartCandidate(player, lastTrack, mode);
          if (smartMatch) {
            setRecommendationReason(player.guildId, smartMatch.track.info.title, smartMatch.reason);
            player.queue.add(smartMatch.track);
            await player.play();
            return;
          }

          // 2. Fallback YouTube search
          let res = await player.search(
            { query: `${lastTrack.info.author} songs`, source: "ytmsearch" },
            { id: "autoplay", username: "Autoplay" }
          );
          if (!res || !res.tracks.length) {
            res = await player.search(
              { query: `${lastTrack.info.author} ${lastTrack.info.title}`, source: "ytsearch" },
              { id: "autoplay", username: "Autoplay" }
            );
          }

          if (res && res.tracks.length > 0) {
            const prevUris = new Set(
              player.queue.previous
                .map((t) => t.info.uri)
                .filter((uri): uri is string => typeof uri === "string")
            );
            const nextTrack = res.tracks.find((t) => t.info.uri && !prevUris.has(t.info.uri)) || res.tracks[0];
            if (nextTrack) {
              setRecommendationReason(player.guildId, nextTrack.info.title, `Lagu dipilih berdasarkan popularitas dari artis ${lastTrack.info.author}.`);
              console.log(`[Autoplay] Memutar otomatis: ${nextTrack.info.title}`);
              player.queue.add(nextTrack);
              await player.play();
              return;
            }
          }
        } catch (err: any) {
          console.warn("[Autoplay Error]", err?.message);
        }
      }
    }

    console.log(`[Lavalink] Antrean guild ${player.guildId} telah selesai. Memulai auto-leave timer.`);
    clearQueueSnapshot(player.guildId);
    try {
      broadcastDashboardEvent("state_change", getCompleteDashboardStatus(client));
    } catch {}
    scheduleAutoLeave(player, client);
  });

  return lavalink;
}

export function scheduleAutoLeave(player: Player, client: Client, delayMs = config.AUTO_LEAVE_MINUTES * 60 * 1000): void {
  cancelAutoLeave(player.guildId);

  // Periksa apakah Mode 24/7 (Always On) aktif (PRD Section 9 & 15)
  if (getGuildAlwaysOn(player.guildId)) {
    console.log(`[Lavalink] Mode 24/7 aktif pada guild ${player.guildId}. Mengabaikan auto-leave timer.`);
    return;
  }

  const timer = setTimeout(async () => {
    try {
      console.log(`[Lavalink] Auto-leave dipicu untuk guild ${player.guildId}. Keluar dari VC.`);
      if (player.textChannelId) {
        const channel = await client.channels.fetch(player.textChannelId);
        if (channel && channel.isTextBased() && "send" in channel) {
          await (channel as TextChannel).send("⏳ Antrean selesai dan tidak ada aktivitas lagi. Bot keluar dari Voice Channel.");
        }
      }
      unregisterSession(player.guildId, player.voiceChannelId || undefined);
      await player.destroy("Inactivity auto-leave");
      autoLeaveTimers.delete(player.guildId);
    } catch (err: any) {
      console.error(`[Lavalink] Gagal auto-leave:`, err?.message);
    }
  }, delayMs);

  autoLeaveTimers.set(player.guildId, timer);
}

export function cancelAutoLeave(guildId: string): void {
  const existing = autoLeaveTimers.get(guildId);
  if (existing) {
    clearTimeout(existing);
    autoLeaveTimers.delete(guildId);
  }
}

export async function getOrCreatePlayer(
  guildId: string,
  voiceChannelId: string,
  textChannelId: string
): Promise<Player> {
  let player = lavalink.getPlayer(guildId);
  if (!player) {
    // Pastikan setidaknya 1 node terhubung sebelum createPlayer
    const availableNodes = lavalink.nodeManager.nodes.filter((n) => n.connected);
    if (availableNodes.size === 0) {
      console.warn("[Lavalink] Belum ada node aktif saat createPlayer. Mencoba reconnectAll dan menunggu...");
      try {
        await lavalink.nodeManager.reconnectAll();
      } catch {}
      for (let i = 0; i < 4; i++) {
        await new Promise((res) => setTimeout(res, 500));
        if (lavalink.nodeManager.nodes.some((n) => n.connected)) break;
      }
    }

    player = lavalink.createPlayer({
      guildId,
      voiceChannelId,
      textChannelId,
      selfDeaf: true,
      volume: config.DEFAULT_VOLUME,
    });
  }

  // Update text channel and voice channel if needed
  player.textChannelId = textChannelId;
  if (player.voiceChannelId !== voiceChannelId) {
    player.voiceChannelId = voiceChannelId;
  }

  if (!player.connected) {
    await player.connect();
  }

  return player;
}
