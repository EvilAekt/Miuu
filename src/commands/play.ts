import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type GuildMember,
} from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer, lavalink } from "../player/lavalink.js";
import { parseInput } from "../resolvers/parseInput.js";
import { resolveSpotifyUrl, type ResolvedSpotifyItem } from "../resolvers/spotify.js";
import {
  createTrackAddedEmbed,
  createPlaylistAddedEmbed,
  createErrorEmbed,
} from "../ui/embeds.js";
import { getCachedTrack, setCachedTrack, getGuildSettingsExtended } from "../db/index.js";
import { matchSpotifyToYouTube, lastPlayedSpotifyTracks } from "../matching/matcher.js";
import { registerSession } from "../sessions/sessionManager.js";
import { getCachedSearchResults, setCachedSearchResults } from "../player/searchCache.js";
import type { Player, Track, UnresolvedTrack } from "lavalink-client";

export const playCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Memutar musik dari YouTube, Spotify, atau kata kunci pencarian")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Link YouTube, Spotify (track/album/playlist), atau judul lagu")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("next")
        .setDescription("Putar di urutan berikutnya (atas antrean)")
        .setRequired(false)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().trim();
    if (!focusedValue || /^https?:\/\//i.test(focusedValue) || /^spotify:/i.test(focusedValue)) {
      await interaction.respond([]);
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(focusedValue)}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      const data = (await res.json()) as [string, string[]];
      const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
      const choices = suggestions.slice(0, 25).map((s) => ({
        name: s.slice(0, 100),
        value: s.slice(0, 100),
      }));
      await interaction.respond(choices);
    } catch {
      await interaction.respond([]).catch(() => {});
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus bergabung ke Voice Channel terlebih dahulu untuk memutar musik.")],
        ephemeral: true,
      });
      return;
    }

    const sessionCheck = registerSession(interaction.guildId!, voiceChannel.id, interaction.channelId, interaction.user.id);
    if (!sessionCheck.allowed) {
      await interaction.reply({
        embeds: [createErrorEmbed("Sesi Tidak Diizinkan", sessionCheck.reason || "Bot sedang aktif di sesi lain.")],
        ephemeral: true,
      });
      return;
    }

    const settings = getGuildSettingsExtended(interaction.guildId!);
    const existingPlayer = lavalink.getPlayer(interaction.guildId!);
    if (existingPlayer && existingPlayer.queue.tracks.length >= settings.max_queue) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            "Antrean Penuh",
            `Antrean lagu di server ini telah mencapai batas maksimal **${settings.max_queue} lagu**.\n` +
              `Tunggu beberapa lagu selesai diputar atau gunakan \`/clear\` untuk mengosongkan antrean.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const query = interaction.options.getString("query", true);
    const playNext = interaction.options.getBoolean("next") ?? false;

    try {
      const player = await getOrCreatePlayer(
        interaction.guildId!,
        voiceChannel.id,
        interaction.channelId
      );

      const parsed = parseInput(query);

      // Handle Spotify input
      if (parsed.source === "spotify") {
        await handleSpotifyInput(parsed.url, player, interaction, playNext);
        return;
      }

      // Handle YouTube or direct keyword search
      await handleDirectInput(query, parsed, player, interaction, playNext);
    } catch (err: any) {
      console.error("[Play Command Error]", err);
      const errMsg = err?.message || "Terjadi kesalahan saat memproses permintaan musik.";
      await interaction.editReply({
        embeds: [createErrorEmbed("Gagal Memproses", errMsg)],
      });
    }
  },
};

async function resolveSpotifyTrackWithCache(
  player: Player,
  item: ResolvedSpotifyItem,
  requester: any
): Promise<Track | UnresolvedTrack | null> {
  const matchResult = await matchSpotifyToYouTube(player, item, requester);
  return matchResult.bestTrack;
}

async function handleSpotifyInput(
  url: string,
  player: Player,
  interaction: ChatInputCommandInteraction,
  playNext: boolean
) {
  const result = await resolveSpotifyUrl(url);

  if (result.tracks.length === 1) {
    const first = result.tracks[0];
    const track = await resolveSpotifyTrackWithCache(player, first, interaction.user);

    if (!track) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Lagu Tidak Ditemukan", `Tidak menemukan padanan audio di YouTube untuk: **${first.artist} - ${first.title}**`)],
      });
      return;
    }

    const spotifyId = first.uri?.split(":").pop() || `${first.artist} - ${first.title}`;
    lastPlayedSpotifyTracks.set(interaction.guildId!, {
      spotifyId,
      title: first.title,
      artist: first.artist,
      durationMs: first.durationMs || 0,
      youtubeId: track.info.identifier,
    });

    if (playNext) {
      player.queue.tracks.unshift(track);
    } else {
      player.queue.add(track);
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }

    const pos = playNext ? 1 : player.queue.tracks.length;
    await interaction.editReply({
      embeds: [createTrackAddedEmbed(track, pos)],
    });
    return;
  }

  // Multi-track Spotify (album / playlist): Resolusi Bertahap (Progressive Resolution)
  // 1. Resolve first track immediately so music plays without waiting
  const firstItem = result.tracks[0];
  const firstTrack = await resolveSpotifyTrackWithCache(player, firstItem, interaction.user);

  if (!firstTrack) {
    await interaction.editReply({
      embeds: [createErrorEmbed("Gagal Memuat Playlist", `Tidak dapat menemukan lagu pertama (${firstItem.title}) di YouTube.`)],
    });
    return;
  }

  const firstSpotifyId = firstItem.uri?.split(":").pop() || `${firstItem.artist} - ${firstItem.title}`;
  lastPlayedSpotifyTracks.set(interaction.guildId!, {
    spotifyId: firstSpotifyId,
    title: firstItem.title,
    artist: firstItem.artist,
    durationMs: firstItem.durationMs || 0,
    youtubeId: firstTrack.info.identifier,
  });

  if (playNext) {
    player.queue.tracks.unshift(firstTrack);
  } else {
    player.queue.add(firstTrack);
  }

  if (!player.playing && !player.paused) {
    await player.play();
  }

  await interaction.editReply({
    embeds: [createPlaylistAddedEmbed(result.name, result.tracks.length, firstTrack, result.isTruncated)],
  });

  // 2. Resolve remaining tracks in the background
  const remaining = result.tracks.slice(1);
  (async () => {
    let addedCount = 0;
    for (const item of remaining) {
      try {
        const track = await resolveSpotifyTrackWithCache(player, item, interaction.user);
        if (track) {
          player.queue.add(track);
          addedCount++;
        }
      } catch (e: any) {
        console.warn(`[Spotify BG Resolver] Gagal resolve "${item.title}":`, e?.message);
      }
    }
    console.log(`[Spotify BG Resolver] Selesai: berhasil menambahkan ${addedCount}/${remaining.length} lagu latar.`);
  })();
}

async function handleDirectInput(
  rawQuery: string,
  parsed: any,
  player: Player,
  interaction: ChatInputCommandInteraction,
  playNext: boolean
) {
  let res;
  const isDirectUrl = parsed.source === "youtube" || parsed.source === "url";
  const source = isDirectUrl ? "url" : "ytsearch";
  const searchQuery = isDirectUrl ? parsed.url : rawQuery;

  // 1. Cek in-memory LRU cache terlebih dahulu (< 1ms)
  res = getCachedSearchResults(searchQuery, source);

  if (!res) {
    if (isDirectUrl) {
      res = await player.search({ query: parsed.url }, interaction.user);
    } else {
      res = await player.search({ query: rawQuery, source: "ytsearch" }, interaction.user);
    }

    if (res && res.tracks && res.tracks.length > 0) {
      setCachedSearchResults(searchQuery, source, res);
    }
  }

  if (res.loadType === "error") {
    await interaction.editReply({
      embeds: [createErrorEmbed("Lavalink Error", res.exception?.message || "Terjadi kesalahan saat memuat sumber lagu.")],
    });
    return;
  }

  if (res.loadType === "empty" || !res.tracks.length) {
    await interaction.editReply({
      embeds: [createErrorEmbed("Tidak Ditemukan", `Tidak ada hasil lagu yang ditemukan untuk pencarian: \`${rawQuery}\``)],
    });
    return;
  }

  if (res.loadType === "playlist") {
    for (const track of res.tracks) {
      player.queue.add(track);
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }

    const playlistName = res.playlist?.title || "YouTube Playlist";
    await interaction.editReply({
      embeds: [createPlaylistAddedEmbed(playlistName, res.tracks.length, res.tracks[0])],
    });
    return;
  }

  // Single track or search result
  const track = res.tracks[0];
  if (playNext) {
    player.queue.tracks.unshift(track);
  } else {
    player.queue.add(track);
  }

  if (!player.playing && !player.paused) {
    await player.play();
  }

  const position = playNext ? 1 : player.queue.tracks.length;
  await interaction.editReply({
    embeds: [createTrackAddedEmbed(track, position)],
  });
}

async function searchWithFallback(player: Player, query: string, requester: any) {
  const cached = getCachedSearchResults(query, "ytmsearch") || getCachedSearchResults(query, "ytsearch");
  if (cached) return cached;

  // First try YouTube Music
  let res = await player.search({ query, source: "ytmsearch" }, requester);
  if (!res || res.loadType === "empty" || res.loadType === "error" || !res.tracks.length) {
    // Fallback to standard YouTube search
    res = await player.search({ query, source: "ytsearch" }, requester);
  }

  if (res && res.tracks && res.tracks.length > 0) {
    setCachedSearchResults(query, "ytsearch", res);
  }
  return res;
}
