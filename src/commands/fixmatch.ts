import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { lastPlayedSpotifyTracks } from "../matching/matcher.js";
import { formatDuration, createErrorEmbed } from "../ui/embeds.js";
import { getValidPlayer } from "./utils.js";

export const fixmatchCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("fixmatch")
    .setDescription("Memilih padanan lagu YouTube yang tepat jika lagu Spotify terputar dengan versi yang salah"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const guildId = interaction.guildId!;
    let target = lastPlayedSpotifyTracks.get(guildId);

    // Fallback jika belum tersimpan di map: coba ambil dari queue.current
    if (!target && player.queue.current) {
      target = {
        spotifyId: player.queue.current.info.title,
        title: player.queue.current.info.title,
        artist: player.queue.current.info.author || "Unknown",
        durationMs: player.queue.current.info.duration || 0,
        youtubeId: player.queue.current.info.identifier,
      };
    }

    if (!target) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            "Tidak Ada Lagu untuk Dikoreksi",
            "Belum ada lagu yang sedang diputar atau dicatat untuk dikoreksi padanannya.\n" +
              "Putar lagu Spotify terlebih dahulu, lalu jalankan `/fixmatch` jika versi yang terputar salah."
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const query = `${target.artist} - ${target.title}`;
      const searchRes = await player.search({ query, source: "ytsearch" }, interaction.user);

      if (!searchRes || !searchRes.tracks || searchRes.tracks.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Kandidat Tidak Ditemukan", `Tidak menemukan kandidat alternatif di YouTube untuk query: **${query}**`)],
        });
        return;
      }

      // Ambil hingga 5 kandidat teratas
      const topCandidates = searchRes.tracks.slice(0, 5);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`fixmatch_select_${target.spotifyId}`)
        .setPlaceholder("Pilih padanan lagu YouTube yang benar...");

      topCandidates.forEach((cand, idx) => {
        const titleLabel = `${idx + 1}. ${cand.info.title}`.slice(0, 100);
        const desc = `${cand.info.author} • ${formatDuration(cand.info.duration || 0)}`.slice(0, 100);

        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(titleLabel)
            .setDescription(desc)
            .setValue(cand.info.identifier || cand.info.uri || String(idx))
        );
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎯 Koreksi Padanan Lagu Spotify (PRD v2 E3)")
        .setDescription(
          `**Lagu Asli:** ${target.title}\n` +
            `**Artis:** ${target.artist}\n\n` +
            `Silakan pilih salah satu dari 5 kandidat YouTube di menu dropdown bawah ini.\n` +
            `*Pilihan Anda akan langsung diputar dan disimpan permanen di database agar pemutaran berikutnya selalu cocok.*`
        )
        .setFooter({ text: "Kandidat diambil dari YouTube Search" });

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (err: any) {
      console.error("[Fixmatch Command Error]", err);
      await interaction.editReply({
        embeds: [createErrorEmbed("Gagal Mencari Kandidat", err?.message || "Terjadi kendala teknis saat mencari padanan lagu.")],
      });
    }
  },
};
