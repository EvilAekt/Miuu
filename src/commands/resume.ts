import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";
import { getResumePosition, clearResumePosition } from "../db/index.js";
import { formatDuration } from "../ui/embeds.js";

export const resumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Melanjutkan musik yang dijeda atau melompat ke posisi tersimpan (PRD v5 E6)")
    .addBooleanOption((option) =>
      option
        .setName("from_saved")
        .setDescription("Lanjutkan dari posisi terakhir tersimpan untuk konten/podcast ini")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const fromSaved = interaction.options.getBoolean("from_saved") || false;

    // 1. Cek jika pengguna ingin melanjutkan dari posisi tersimpan
    if (fromSaved || (!player.paused && player.queue.current)) {
      if (player.queue.current) {
        const trackKey = `${player.queue.current.info.author} - ${player.queue.current.info.title}`;
        const saved = getResumePosition(interaction.user.id, trackKey);
        if (saved && saved.position_ms > 0) {
          await player.seek(saved.position_ms);
          if (player.paused) await player.resume();
          const timeStr = formatDuration(saved.position_ms);
          clearResumePosition(interaction.user.id, trackKey);
          await interaction.reply({
            embeds: [
              createSuccessEmbed(
                "Melanjutkan Posisi Tersimpan",
                `⏩ Melanjutkan pemutaran **${player.queue.current.info.title}** dari menit **${timeStr}**.`
              ),
            ],
          });
          return;
        }
      }
    }

    // 2. Unpause normal
    if (!player.paused) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Sedang Dijeda", "Musik saat ini sedang berputar aktif.")],
        ephemeral: true,
      });
      return;
    }

    await player.resume();
    await interaction.reply({
      embeds: [createSuccessEmbed("Melanjutkan Musik", "▶️ Pemutaran musik berhasil dilanjutkan.")],
    });
  },
};
