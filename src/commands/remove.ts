import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const removeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Menghapus lagu tertentu dari antrean berdasarkan nomor urut")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Nomor urut lagu di antrean (lihat di /queue)")
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const pos = interaction.options.getInteger("position", true);
    if (pos > player.queue.tracks.length) {
      await interaction.reply({
        embeds: [createErrorEmbed("Posisi Tidak Valid", `Nomor posisi melebihi jumlah antrean saat ini (${player.queue.tracks.length} lagu).`)],
        ephemeral: true,
      });
      return;
    }

    const removed = player.queue.tracks.splice(pos - 1, 1)[0];
    await interaction.reply({
      embeds: [createSuccessEmbed("Lagu Dihapus", `🗑️ Berhasil menghapus lagu ke-#${pos}: **${removed.info.title}**`)],
    });
  },
};
