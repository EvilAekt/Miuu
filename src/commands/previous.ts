import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const previousCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("previous")
    .setDescription("Memutar kembali lagu yang diputar sebelumnya"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    if (!player.queue.previous || player.queue.previous.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Lagu Sebelumnya", "Tidak ada riwayat lagu sebelumnya yang dapat diputar ulang.")],
        ephemeral: true,
      });
      return;
    }

    const prevTrack = player.queue.previous.pop()!;
    if (player.queue.current) {
      player.queue.tracks.unshift(player.queue.current);
    }
    player.queue.tracks.unshift(prevTrack);
    await player.skip();

    await interaction.reply({
      embeds: [createSuccessEmbed("Memutar Lagu Sebelumnya", `⏮️ Memutar kembali: **${prevTrack.info.title}**`)],
    });
  },
};
