import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const pauseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Menjeda sementara pemutaran musik saat ini"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    if (player.paused) {
      await interaction.reply({
        embeds: [createErrorEmbed("Sudah Dijeda", "Pemutaran musik saat ini sudah dalam keadaan jeda.")],
        ephemeral: true,
      });
      return;
    }

    await player.pause();
    await interaction.reply({
      embeds: [createSuccessEmbed("Musik Dijeda", "⏸️ Pemutaran musik berhasil dijeda. Gunakan `/resume` untuk melanjutkan.")],
    });
  },
};
