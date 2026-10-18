import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed } from "../ui/embeds.js";
import type { RepeatMode } from "lavalink-client";

export const loopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Mengatur mode pengulangan musik (off, track, queue)")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Pilihan mode pengulangan")
        .setRequired(true)
        .addChoices(
          { name: "Matikan Loop (off)", value: "off" },
          { name: "Ulangi Lagu Ini (track)", value: "track" },
          { name: "Ulangi Seluruh Antrean (queue)", value: "queue" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const mode = interaction.options.getString("mode", true) as RepeatMode;
    await player.setRepeatMode(mode);

    const labels: Record<string, string> = {
      off: "❌ Dimatikan (off)",
      track: "🔂 Mengulang Lagu Saat Ini (track)",
      queue: "🔁 Mengulang Seluruh Antrean (queue)",
    };

    await interaction.reply({
      embeds: [createSuccessEmbed("Mode Loop Diperbarui", `Mode loop sekarang diatur ke: **${labels[mode]}**`)],
    });
  },
};
