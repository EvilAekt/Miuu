import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const moveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Memindahkan posisi urutan lagu di dalam antrean")
    .addIntegerOption((opt) =>
      opt.setName("from").setDescription("Nomor posisi lagu saat ini").setRequired(true).setMinValue(1)
    )
    .addIntegerOption((opt) =>
      opt.setName("to").setDescription("Nomor posisi tujuan baru").setRequired(true).setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const from = interaction.options.getInteger("from", true);
    const to = interaction.options.getInteger("to", true);

    const total = player.queue.tracks.length;
    if (from > total || to > total) {
      await interaction.reply({
        embeds: [createErrorEmbed("Posisi Di Luar Batas", `Antrean saat ini hanya memiliki **${total} lagu** berikutnya.`)],
        ephemeral: true,
      });
      return;
    }

    if (from === to) {
      await interaction.reply({
        embeds: [createErrorEmbed("Posisi Sama", "Nomor posisi awal dan nomor posisi tujuan tidak boleh sama.")],
        ephemeral: true,
      });
      return;
    }

    const [track] = player.queue.tracks.splice(from - 1, 1);
    player.queue.tracks.splice(to - 1, 0, track);

    await interaction.reply({
      embeds: [createSuccessEmbed("Posisi Lagu Dipindahkan", `↔️ Berhasil memindahkan **${track.info.title}** dari urutan **#${from}** ke urutan **#${to}**.`)],
    });
  },
};
