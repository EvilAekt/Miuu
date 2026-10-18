import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "./types.js";
import { scanLocalMusicDirectory, searchLocalTracks, getLocalTrackById, validateSafePath } from "../library/indexer.js";
import { getOrCreatePlayer } from "../player/lavalink.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const libraryCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("library")
    .setDescription("Kelola dan putar koleksi file musik lokal PC (PRD v3 E4)")
    .addSubcommand((sub) =>
      sub
        .setName("scan")
        .setDescription("Memindai ulang folder musik lokal untuk mengindeks lagu baru")
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("Melihat daftar lagu lokal yang telah diindeks")
        .addStringOption((opt) =>
          opt.setName("query").setDescription("Kata kunci pencarian judul atau artis").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Memutar lagu lokal berdasarkan ID atau kata kunci")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("ID nomor lagu dari daftar /library list").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "scan") {
      await interaction.deferReply();
      try {
        const result = scanLocalMusicDirectory();
        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "📁 Pemindaian Musik Lokal Selesai",
              `Berhasil memindai folder musik lokal!\n` +
                `🎶 **Total Terindeks:** \`${result.scannedCount} lagu\`\n\n` +
                `Gunakan \`/library list\` untuk melihat daftar atau \`/library play id: <nomor>\` untuk memutar.`
            ),
          ],
        });
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Memindai", err?.message || "Terjadi kendala saat membaca direktori musik.")],
        });
      }
      return;
    }

    if (subcommand === "list") {
      const query = interaction.options.getString("query") || undefined;
      const tracks = searchLocalTracks(query, 15);

      if (tracks.length === 0) {
        await interaction.reply({
          embeds: [
            createErrorEmbed(
              "Tidak Ada Lagu",
              query
                ? `Tidak ditemukan lagu lokal yang cocok dengan kata kunci: **${query}**`
                : "Belum ada file musik lokal yang terindeks. Jalankan `/library scan` terlebih dahulu."
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const listText = tracks
        .map((t) => `\`#${t.id}\` **${t.title}** — \`${t.artist}\` *(Album: ${t.album})*`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📂 Koleksi Musik Lokal (${tracks.length} lagu ditampilkan)`)
        .setDescription(listText)
        .setFooter({ text: "Gunakan /library play id: <nomor> untuk memutar lagu pilihan" });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === "play") {
      const member = interaction.member as GuildMember;
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus berada di Voice Channel terlebih dahulu.")],
          ephemeral: true,
        });
        return;
      }

      const trackId = interaction.options.getInteger("id", true);
      const track = getLocalTrackById(trackId);

      if (!track) {
        await interaction.reply({
          embeds: [createErrorEmbed("Lagu Tidak Ditemukan", `Tidak ada lagu lokal dengan ID \`#${trackId}\`. Gunakan \`/library list\` untuk melihat daftar ID.`)],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      try {
        // Validasi keamanan path sebelum dimuat
        const safePath = validateSafePath(track.rel_path);

        const player = await getOrCreatePlayer(interaction.guildId!, voiceChannel.id, interaction.channelId);

        // Cari via Lavalink local source atau fallback query
        let res = await player.search({ query: safePath, source: "local" }, interaction.user);
        if (!res || !res.tracks.length) {
          res = await player.search({ query: `${track.artist} - ${track.title}` }, interaction.user);
        }

        if (!res || !res.tracks.length) {
          await interaction.editReply({
            embeds: [createErrorEmbed("Gagal Memuat Lagu", `File audio lokal tidak dapat dibaca oleh engine audio.`)],
          });
          return;
        }

        const song = res.tracks[0];
        player.queue.add(song);

        if (!player.playing && !player.paused) {
          await player.play();
        }

        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "🎵 Memutar Musik Lokal",
              `Berhasil memuat lagu lokal ke antrean:\n` +
                `🎶 **${track.title}**\n` +
                `🎤 **Artis:** \`${track.artist}\`\n` +
                `📁 **Path:** \`${track.rel_path}\``
            ),
          ],
        });
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Memutar Lagu Lokal", err?.message || "File tidak dapat diakses.")],
        });
      }
      return;
    }
  },
};
