import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const shuffleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Mengacak urutan lagu di dalam antrean"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    if (player.queue.tracks.length < 2) {
      await interaction.reply({
        embeds: [createErrorEmbed("Antrean Terlalu Sedikit", "Dibutuhkan minimal 2 lagu di dalam antrean untuk mengacak urutan.")],
        ephemeral: true,
      });
      return;
    }

    await player.queue.shuffle();
    await interaction.reply({
      embeds: [createSuccessEmbed("Antrean Diacak", `🔀 Berhasil mengacak urutan **${player.queue.tracks.length} lagu** di dalam antrean.`)],
    });
  },
};
