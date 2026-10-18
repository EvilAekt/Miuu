import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
  AttachmentBuilder,
} from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer, lavalink } from "../player/lavalink.js";
import {
  saveCustomPlaylist,
  getCustomPlaylists,
  getCustomPlaylistTracks,
  deleteCustomPlaylist,
} from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const playlistCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Kelola playlist musik pribadi Anda")
    .addSubcommand((sub) =>
      sub
        .setName("save")
        .setDescription("Menyimpan antrean lagu saat ini menjadi playlist baru")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Nama playlist yang ingin disimpan").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Memutar playlist pribadi yang telah disimpan")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Nama playlist yang ingin diputar").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Melihat daftar semua playlist pribadi yang Anda miliki")
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Menghapus playlist pribadi yang tersimpan")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Nama playlist yang ingin dihapus").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("export")
        .setDescription("Ekspor playlist tersimpan ke file JSON yang dapat diunduh (PRD v2 E4)")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Nama playlist yang ingin diekspor").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("import")
        .setDescription("Impor playlist dari file JSON hasil ekspor (PRD v2 E4)")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Nama playlist baru yang akan dibuat").setRequired(true)
        )
        .addAttachmentOption((opt) =>
          opt.setName("file").setDescription("File JSON playlist hasil ekspor").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "save") {
      const name = interaction.options.getString("name", true).trim();
      const player = lavalink.getPlayer(interaction.guildId!);

      if (!player || (!player.queue.current && player.queue.tracks.length === 0)) {
        await interaction.reply({
          embeds: [createErrorEmbed("Antrean Kosong", "Tidak ada lagu yang sedang diputar atau dalam antrean untuk disimpan.")],
          ephemeral: true,
        });
        return;
      }

      const allTracks = [];
      if (player.queue.current) allTracks.push(player.queue.current);
      allTracks.push(...player.queue.tracks);

      saveCustomPlaylist(userId, name, allTracks);
      await interaction.reply({
        embeds: [createSuccessEmbed("Playlist Tersimpan", `Berhasil menyimpan **${allTracks.length} lagu** ke dalam playlist **${name}**!`)],
      });
      return;
    }

    if (subcommand === "list") {
      const playlists = getCustomPlaylists(userId);
      if (playlists.length === 0) {
        await interaction.reply({
          embeds: [createErrorEmbed("Belum Ada Playlist", "Anda belum memiliki playlist yang tersimpan. Gunakan `/playlist save <nama>` untuk menyimpan antrean.")],
          ephemeral: true,
        });
        return;
      }

      const listText = playlists
        .map((p, idx) => `\`${idx + 1}.\` **${p.name}** — ${p.track_count} lagu *(dibuat <t:${Math.floor(p.created_at / 1000)}:R>)*`)
        .join("\n");

      await interaction.reply({
        embeds: [createSuccessEmbed(`Daftar Playlist Anda (${playlists.length})`, listText)],
      });
      return;
    }

    if (subcommand === "delete") {
      const name = interaction.options.getString("name", true).trim();
      const success = deleteCustomPlaylist(userId, name);
      if (!success) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak Ditemukan", `Playlist dengan nama **${name}** tidak ditemukan di akun Anda.`)],
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        embeds: [createSuccessEmbed("Playlist Dihapus", `Playlist **${name}** berhasil dihapus.`)],
      });
      return;
    }

    if (subcommand === "play") {
      const member = interaction.member as GuildMember;
      const voiceChannel = member.voice.channel;
      if (!voiceChannel) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus bergabung ke Voice Channel terlebih dahulu.")],
          ephemeral: true,
        });
        return;
      }

      const name = interaction.options.getString("name", true).trim();
      const tracks = getCustomPlaylistTracks(userId, name);

      if (tracks.length === 0) {
        await interaction.reply({
          embeds: [createErrorEmbed("Playlist Kosong / Tidak Ditemukan", `Playlist **${name}** tidak ditemukan atau tidak memiliki lagu.`)],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const player = await getOrCreatePlayer(interaction.guildId!, voiceChannel.id, interaction.channelId);

      // Resolve first track to start playback immediately
      let added = 0;
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        try {
          const res = await player.search({ query: t.source_url || `${t.artist} - ${t.title}` }, interaction.user);
          if (res && res.tracks.length > 0) {
            player.queue.add(res.tracks[0]);
            added++;
            if (!player.playing && !player.paused) {
              await player.play();
            }
          }
        } catch {}
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed("Memutar Playlist", `Berhasil memuat **${added}/${tracks.length} lagu** dari playlist **${name}** ke dalam antrean.`)],
      });
      return;
    }

    if (subcommand === "export") {
      const name = interaction.options.getString("name", true).trim();
      const tracks = getCustomPlaylistTracks(userId, name);

      if (tracks.length === 0) {
        await interaction.reply({
          embeds: [createErrorEmbed("Playlist Kosong / Tidak Ditemukan", `Playlist **${name}** tidak ditemukan atau tidak memiliki lagu untuk diekspor.`)],
          ephemeral: true,
        });
        return;
      }

      const exportData = {
        version: "2.0",
        format: "discord-music-bot-playlist",
        name,
        exportedAt: new Date().toISOString(),
        totalTracks: tracks.length,
        tracks: tracks.map((t) => ({
          title: t.title,
          artist: t.artist,
          source: t.source,
          source_url: t.source_url,
          duration_ms: t.duration_ms,
        })),
      };

      const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}-playlist.json`;
      const fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2), "utf-8");
      const attachment = new AttachmentBuilder(fileBuffer, { name: safeFileName });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "📤 Playlist Berhasil Diekspor",
            `Playlist **${name}** berhasil diekspor (${tracks.length} lagu).\n` +
              `Unduh file JSON terlampir untuk dibagikan atau disimpan sebagai cadangan.\n` +
              `Gunakan \`/playlist import name: <nama> file: <file>\` untuk mengimpor kembali kapan saja.`
          ),
        ],
        files: [attachment],
      });
      return;
    }

    if (subcommand === "import") {
      const name = interaction.options.getString("name", true).trim();
      const attachment = interaction.options.getAttachment("file", true);

      await interaction.deferReply();

      try {
        const response = await fetch(attachment.url);
        if (!response.ok) {
          throw new Error(`Gagal mengunduh file lampiran (HTTP ${response.status})`);
        }

        const content = await response.text();
        let parsedTracks: Array<{ title: string; artist?: string; source_url: string; duration_ms?: number }> = [];

        // Deteksi format: JSON atau daftar URL TXT
        if (attachment.name.endsWith(".json") || content.trim().startsWith("{") || content.trim().startsWith("[")) {
          const parsed = JSON.parse(content);
          const rawList = Array.isArray(parsed) ? parsed : parsed.tracks || [];
          for (const item of rawList) {
            if (typeof item === "string" && item.trim()) {
              parsedTracks.push({
                title: item.trim(),
                artist: "Unknown",
                source_url: item.trim(),
              });
            } else if (item && typeof item === "object") {
              const url = item.source_url || item.url || item.uri || "";
              const title = item.title || item.name || url || "Unknown";
              const artist = item.artist || item.author || "Unknown";
              const duration = item.duration_ms || item.duration || 0;
              if (title || url) {
                parsedTracks.push({
                  title,
                  artist,
                  source_url: url,
                  duration_ms: duration,
                });
              }
            }
          }
        } else {
          // Format TXT: satu baris per link atau "Artis - Judul"
          const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
          for (const line of lines) {
            parsedTracks.push({
              title: line,
              artist: "Unknown",
              source_url: line,
            });
          }
        }

        if (parsedTracks.length === 0) {
          await interaction.editReply({
            embeds: [createErrorEmbed("Format Tidak Valid", "Tidak ada lagu yang berhasil dibaca dari file tersebut. Pastikan format berupa JSON playlist atau teks baris link.")],
          });
          return;
        }

        saveCustomPlaylist(userId, name, parsedTracks);

        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "📥 Playlist Berhasil Diimpor",
              `Berhasil mengimpor **${parsedTracks.length} lagu** ke dalam playlist pribadi **${name}**!\n` +
                `Gunakan \`/playlist play name: ${name}\` untuk langsung memutarnya.`
            ),
          ],
        });
      } catch (err: any) {
        console.error("[Playlist Import Error]", err);
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Mengimpor Playlist", err?.message || "File tidak dapat diproses.")],
        });
      }
      return;
    }
  },
};
