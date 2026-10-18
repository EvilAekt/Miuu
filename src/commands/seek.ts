import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { formatDuration, createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

function parseTimeToMs(timeStr: string): number | null {
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 1) return parts[0] * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return null;
}

export const seekCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Melompat ke posisi durasi tertentu pada lagu yang sedang diputar")
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Posisi waktu tujuan (contoh: 1:30 atau 90)")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const currentTrack = player.queue.current;
    if (!currentTrack) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Musik", "Tidak ada lagu yang sedang diputar.")],
        ephemeral: true,
      });
      return;
    }

    if (currentTrack.info.isStream) {
      await interaction.reply({
        embeds: [createErrorEmbed("Live Stream", "Siaran langsung (live stream) tidak dapat di-seek.")],
        ephemeral: true,
      });
      return;
    }

    const timeInput = interaction.options.getString("time", true);
    const targetMs = parseTimeToMs(timeInput);

    if (targetMs === null || targetMs < 0 || targetMs > currentTrack.info.duration) {
      await interaction.reply({
        embeds: [createErrorEmbed("Waktu Tidak Valid", `Format waktu harus berupa detik (misal \`90\`) atau menit:detik (misal \`1:30\`), maksimal ${formatDuration(currentTrack.info.duration)}.`)],
        ephemeral: true,
      });
      return;
    }

    await player.seek(targetMs);
    await interaction.reply({
      embeds: [createSuccessEmbed("Posisi Diubah", `⏩ Melompat ke posisi **${formatDuration(targetMs)}**`)],
    });
  },
};
