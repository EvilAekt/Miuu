import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { getRecommendationReason } from "../recommend/smartRecommend.js";
import { createErrorEmbed } from "../ui/embeds.js";

export const whythisCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("whythis")
    .setDescription("Menjelaskan alasan kenapa lagu yang sedang diputar dipilih oleh bot (PRD v4 E5)"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.queue.current) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Lagu", "Saat ini tidak ada lagu yang sedang diputar.")],
        ephemeral: true,
      });
      return;
    }

    const current = player.queue.current;
    const reason = getRecommendationReason(interaction.guildId!);

    const embed = new EmbedBuilder()
      .setColor(0x06b6d4)
      .setTitle(`💡 Kenapa Lagu Ini Dipilih?`)
      .setDescription(
        `🎶 **Lagu:** **${current.info.title}**\n` +
          `🎤 **Artis:** \`${current.info.author || "Unknown"}\`\n\n` +
          `🔍 **Alasan Rekomendasi:**\n${reason}`
      )
      .setFooter({ text: "Sistem Rekomendasi Cerdas Antigravity (PRD v4)" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
