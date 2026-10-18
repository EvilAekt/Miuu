import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const skiptoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("skipto")
    .setDescription("Melompat langsung ke nomor antrean lagu tertentu")
    .addIntegerOption((opt) =>
      opt.setName("position").setDescription("Nomor urutan lagu di antrean").setRequired(true).setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const position = interaction.options.getInteger("position", true);
    if (position > player.queue.tracks.length) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            "Posisi Tidak Valid",
            `Antrean hanya memiliki **${player.queue.tracks.length} lagu**. Tidak dapat melompat ke nomor **#${position}**.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const targetTrack = player.queue.tracks[position - 1];
    player.queue.tracks.splice(0, position - 1);
    await player.skip();

    await interaction.reply({
      embeds: [createSuccessEmbed("Melompat ke Lagu", `⏭️ Berhasil melompat ke urutan **#${position}**: **${targetTrack.info.title}**`)],
    });
  },
};
