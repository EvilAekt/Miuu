// src/commands/crossfade.ts: Slash Command /crossfade untuk transisi audio halus
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { setCrossfadeDuration, getCrossfadeDuration } from "../mixing/crossfadeManager.js";
import { createSuccessEmbed, createInfoEmbed } from "../ui/embeds.js";

export const crossfadeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("crossfade")
    .setDescription("Atur durasi transisi pemudaran audio halus (crossfade) antar-lagu")
    .addIntegerOption((opt) =>
      opt
        .setName("seconds")
        .setDescription("Durasi pemudaran dalam detik (0 untuk mematikan, 1 - 10 detik)")
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const secondsOption = interaction.options.getInteger("seconds");
    const guildId = interaction.guildId!;

    if (secondsOption === null) {
      const current = getCrossfadeDuration(guildId);
      await interaction.reply({
        embeds: [
          createInfoEmbed(
            "Status Crossfade Audio 🎚️",
            current > 0
              ? `Crossfade saat ini **AKTIF** dengan durasi **${current} detik**.\nLagu akan memudar secara halus saat berganti.`
              : "Crossfade saat ini **NONAKTIF** (pemutaran lagu langsung berganti tanpa pemudaran)."
          ),
        ],
      });
      return;
    }

    const applied = setCrossfadeDuration(guildId, secondsOption);

    if (applied === 0) {
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Crossfade Dinonaktifkan 🎚️",
            "Transisi audio crossfade telah dimatikan. Lagu akan berganti secara langsung."
          ),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Crossfade Diaktifkan 🎚️",
            `Durasi transisi pemudaran audio antar-lagu diatur ke **${applied} detik**.\nMusik akan memudar halus (*fade-in / fade-out*) saat berganti trek.`
          ),
        ],
      });
    }
  },
};
