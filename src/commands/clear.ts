import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const clearCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Mengosongkan seluruh lagu yang ada di dalam antrean"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    if (player.queue.tracks.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed("Antrean Kosong", "Tidak ada lagu di dalam antrean untuk dikosongkan.")],
        ephemeral: true,
      });
      return;
    }

    const count = player.queue.tracks.length;
    player.queue.tracks.splice(0, player.queue.tracks.length);

    await interaction.reply({
      embeds: [createSuccessEmbed("Antrean Dikosongkan", `🧹 Berhasil membersihkan **${count} lagu** dari antrean berikutnya. Lagu yang sedang berputar tetap dilanjutkan.`)],
    });
  },
};
