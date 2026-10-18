// src/commands/dj.ts: Slash Command /dj untuk mengelola Virtual AI Voice DJ Host
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { setDjConfig, getDjConfig, type DjPersonality } from "../dj/voiceAnnouncer.js";
import { createSuccessEmbed, createInfoEmbed } from "../ui/embeds.js";

export const djCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("dj")
    .setDescription("Atur penyiar radio suara virtual (Virtual AI Voice DJ Host) sebelum lagu diputar")
    .addSubcommand((sub) =>
      sub
        .setName("enable")
        .setDescription("Aktifkan Virtual Voice DJ Host di server ini")
        .addStringOption((opt) =>
          opt
            .setName("personality")
            .setDescription("Gaya kepribadian penyiar DJ")
            .setRequired(false)
            .addChoices(
              { name: "Santai & Ramah (Casual)", value: "casual" },
              { name: "Semangat & Energik (Hype)", value: "hype" },
              { name: "Tenang & Lembut (Chill)", value: "chill" }
            )
        )
        .addIntegerOption((opt) =>
          opt
            .setName("frequency")
            .setDescription("Putar intro suara setiap berapa lagu (contoh: 1 untuk tiap lagu, 3 untuk tiap 3 lagu)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Nonaktifkan Virtual Voice DJ Host")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Periksa status dan gaya kepribadian Virtual DJ")
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "enable") {
      const personality = (interaction.options.getString("personality") || "casual") as DjPersonality;
      const frequency = interaction.options.getInteger("frequency") || 3;

      const cfg = setDjConfig(guildId, {
        enabled: true,
        personality,
        frequency,
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Virtual Voice DJ Diaktifkan 🎙️",
            `Penyiar radio suara virtual kini **AKTIF** di server ini!\n` +
              `• **Gaya Kepribadian:** ${cfg.personality.toUpperCase()}\n` +
              `• **Frekuensi Pengumuman:** Setiap ${cfg.frequency} lagu\n` +
              `*DJ akan menyapa dan mengumumkan lagu baru secara otomatis.*`
          ),
        ],
      });
      return;
    }

    if (sub === "disable") {
      setDjConfig(guildId, { enabled: false });
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Virtual Voice DJ Dinonaktifkan 🔇",
            "Penyiar suara virtual telah dinonaktifkan. Lagu akan diputar langsung tanpa pengantar."
          ),
        ],
      });
      return;
    }

    if (sub === "status") {
      const cfg = getDjConfig(guildId);
      await interaction.reply({
        embeds: [
          createInfoEmbed(
            "Status Virtual Voice DJ 🎙️",
            `Status: **${cfg.enabled ? "🟢 AKTIF" : "🔴 NONAKTIF"}**\n` +
              `Kepribadian: **${cfg.personality}**\n` +
              `Frekuensi: Setiap **${cfg.frequency} lagu**`
          ),
        ],
      });
      return;
    }
  },
};
