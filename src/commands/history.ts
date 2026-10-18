import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getHistory } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const historyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("Melihat riwayat 15 lagu terakhir yang diputar di server ini"),

  async execute(interaction: ChatInputCommandInteraction) {
    const list = getHistory(interaction.guildId!, 15);

    if (list.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed("Belum Ada Riwayat", "Belum ada riwayat pemutaran musik yang tercatat di server ini.")],
        ephemeral: true,
      });
      return;
    }

    const historyText = list
      .map((h, idx) => `\`${idx + 1}.\` [${h.title}](${h.source_url}) — ${h.artist || "Unknown"} *(<t:${Math.floor(h.played_at / 1000)}:R>)*`)
      .join("\n");

    await interaction.reply({
      embeds: [createSuccessEmbed(`Riwayat Pemutaran Terakhir (${list.length})`, historyText)],
    });
  },
};
