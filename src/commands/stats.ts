import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { getListeningStats } from "../db/index.js";
import { formatDuration } from "../ui/embeds.js";

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Melihat statistik lagu teratas, artis terfavorit, dan waktu mendengar (PRD v2 E4)")
    .addStringOption((opt) =>
      opt
        .setName("period")
        .setDescription("Periode waktu statistik")
        .setRequired(false)
        .addChoices(
          { name: "7 Hari Terakhir (Minggu)", value: "7" },
          { name: "30 Hari Terakhir (Bulan)", value: "30" },
          { name: "Sepanjang Waktu (All Time)", value: "all" }
        )
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Filter statistik untuk pengguna tertentu (opsional)").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const periodChoice = interaction.options.getString("period") || "all";
    const targetUser = interaction.options.getUser("user");

    const days = periodChoice === "7" ? 7 : periodChoice === "30" ? 30 : 0;
    const userId = targetUser ? targetUser.id : undefined;

    const stats = getListeningStats(interaction.guildId!, userId, days);

    if (stats.totalPlays === 0) {
      await interaction.reply({
        content: `Belum ada data pemutaran musik yang tercatat${targetUser ? ` untuk user <@${targetUser.id}>` : ""} pada periode ini.`,
        ephemeral: true,
      });
      return;
    }

    const hours = Math.floor(stats.totalDurationMs / (1000 * 60 * 60));
    const mins = Math.floor((stats.totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeFormatted = hours > 0 ? `${hours} jam ${mins} menit` : `${mins} menit`;

    const periodLabel = periodChoice === "7" ? "7 Hari Terakhir" : periodChoice === "30" ? "30 Hari Terakhir" : "Sepanjang Waktu";
    const title = targetUser
      ? `📈 Statistik Musik: ${targetUser.username} (${periodLabel})`
      : `📊 Statistik Musik Server (${periodLabel})`;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(title)
      .setDescription(
        `🎧 **Total Pemutaran:** \`${stats.totalPlays} lagu\`\n` +
          `⏱️ **Total Waktu Dengar:** \`${timeFormatted}\``
      );

    if (stats.topTracks.length > 0) {
      const tracksText = stats.topTracks
        .map((t, idx) => `\`${idx + 1}.\` **${t.title}** — ${t.artist} *(${t.plays}x)*`)
        .join("\n");
      embed.addFields([{ name: "🔥 Lagu Teratas", value: tracksText, inline: false }]);
    }

    if (stats.topArtists.length > 0) {
      const artistsText = stats.topArtists
        .map((a, idx) => `\`${idx + 1}.\` **${a.artist}** — *(${a.plays} lagu)*`)
        .join("\n");
      embed.addFields([{ name: "🎤 Artis Terfavorit", value: artistsText, inline: false }]);
    }

    if (stats.topCommands.length > 0 && !targetUser) {
      const commandsText = stats.topCommands
        .map((c, idx) => `\`${idx + 1}.\` \`/${c.command_name}\` — *${c.use_count}x*`)
        .join("\n");
      embed.addFields([{ name: "⚡ Perintah Paling Sering Digunakan", value: commandsText, inline: false }]);
    }

    embed.setFooter({ text: "Statistik dihitung dari riwayat lokal SQLite" });

    await interaction.reply({ embeds: [embed] });
  },
};
