// src/commands/wrapped.ts: Slash Command /wrapped untuk rekap musik personal & server
import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { generateMusicWrapped } from "../stats/wrappedGenerator.js";

export const wrappedCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("wrapped")
    .setDescription("Tampilkan rekapitulasi kebiasaan mendengarkan musik bergaya Spotify Wrapped")
    .addStringOption((opt) =>
      opt
        .setName("period")
        .setDescription("Rentang waktu statistik")
        .setRequired(false)
        .addChoices(
          { name: "30 Hari Terakhir", value: "30" },
          { name: "Sepanjang Waktu (All Time)", value: "all" }
        )
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Lihat statistik pengguna tertentu (opsional)").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const periodVal = interaction.options.getString("period") || "30";
    const days = periodVal === "all" ? 0 : 30;
    const targetUser = interaction.options.getUser("user");
    const targetName = targetUser ? targetUser.username : interaction.guild?.name || "Server";

    const wrapped = generateMusicWrapped(
      interaction.guildId!,
      targetUser?.id,
      targetName,
      days
    );

    if (wrapped.totalPlays === 0) {
      await interaction.reply({
        content: `ℹ️ Belum ada riwayat pemutaran musik yang tercatat untuk **${targetName}** pada periode ini.`,
        ephemeral: true,
      });
      return;
    }

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
    const tracksList = wrapped.topTracks.length > 0
      ? wrapped.topTracks
          .map((t, i) => `${medals[i]} **${t.title}** — *${t.artist}* (\`${t.plays}x\`)`)
          .join("\n")
      : "*Belum ada data lagu.*";

    const artistsList = wrapped.topArtists.length > 0
      ? wrapped.topArtists
          .map((a, i) => `${i + 1}. **${a.artist}** (\`${a.plays} putaran\`)`)
          .join("\n")
      : "*Belum ada data artis.*";

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setAuthor({
        name: `🎉 MUSIC WRAPPED — ${wrapped.periodLabel.toUpperCase()}`,
        iconURL: targetUser?.displayAvatarURL() || interaction.guild?.iconURL() || undefined,
      })
      .setTitle(`🎶 Kilas Balik Musik: ${wrapped.targetName}`)
      .setDescription(
        `🎭 **Persona Musik:** **${wrapped.persona}**\n> *${wrapped.personaDesc}*\n\n` +
          `⏱️ **Total Mendengarkan:** **${wrapped.totalMinutes} menit** (~${Math.round(wrapped.totalMinutes / 60)} jam)\n` +
          `🎵 **Total Lagu Diputar:** **${wrapped.totalPlays} kali**\n` +
          `🌙 **Waktu Paling Aktif:** **${wrapped.peakTimeSlot}**`
      )
      .addFields([
        { name: "🏆 5 Lagu Teratas Favorit", value: tracksList, inline: false },
        { name: "🎤 3 Musisi Paling Sering Didengar", value: artistsList, inline: false },
      ])
      .setFooter({
        text: "Miu Music Bot • Spotify-Style Wrapped Analytics",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
