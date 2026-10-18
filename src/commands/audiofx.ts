// src/commands/audiofx.ts: Slash Command untuk Efek Audio Spasial 8D, Speed, Pitch, dan Auto-Normalizer
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import {
  set8DAudio,
  setPlaybackSpeed,
  setPlaybackPitch,
  setAutoNormalize,
  type RotationSpeed,
} from "../audio/advancedDsp.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const audiofxCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("audiofx")
    .setDescription("Atur efek audio tingkat lanjut: 8D Spasial, Kecepatan, Pitch, dan Normalisasi")
    .addSubcommand((sub) =>
      sub
        .setName("8d")
        .setDescription("Aktifkan atau matikan efek audio spasial 8D (rotasi 360 derajat di headphone)")
        .addBooleanOption((opt) =>
          opt.setName("enable").setDescription("Status aktif/nonaktif efek 8D").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("speed")
            .setDescription("Kecepatan rotasi spasial")
            .setRequired(false)
            .addChoices(
              { name: "Lambat (Slow)", value: "slow" },
              { name: "Normal", value: "normal" },
              { name: "Cepat (Fast)", value: "fast" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("speed")
        .setDescription("Ubah kecepatan pemutaran lagu (0.5x - 2.0x)")
        .addNumberOption((opt) =>
          opt
            .setName("multiplier")
            .setDescription("Faktor pengali kecepatan (contoh: 1.25 untuk sped up, 0.85 untuk slow)")
            .setRequired(true)
            .setMinValue(0.5)
            .setMaxValue(2.0)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("pitch")
        .setDescription("Ubah tinggi rendah nada lagu (Pitch: 0.5x - 2.0x)")
        .addNumberOption((opt) =>
          opt
            .setName("multiplier")
            .setDescription("Faktor pengali nada (contoh: 1.2 untuk nada lebih tinggi, 0.8 untuk nada berat)")
            .setRequired(true)
            .setMinValue(0.5)
            .setMaxValue(2.0)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("autonormalize")
        .setDescription("Aktifkan penyesuaian volume otomatis antar lagu agar tidak mengejutkan telinga")
        .addBooleanOption((opt) =>
          opt.setName("enable").setDescription("Status normalisasi volume").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const sub = interaction.options.getSubcommand();

    try {
      if (sub === "8d") {
        const enable = interaction.options.getBoolean("enable", true);
        const speed = (interaction.options.getString("speed") || "normal") as RotationSpeed;

        const res = await set8DAudio(player, enable, speed);
        if (res.enabled) {
          await interaction.reply({
            embeds: [
              createSuccessEmbed(
                "8D Audio Spasial Diaktifkan 🎧",
                `Efek rotasi stereo 360° aktif dengan kecepatan **${speed}** (${res.hz} Hz).\n*Gunakan headphone untuk sensasi terbaik!*`
              ),
            ],
          });
        } else {
          await interaction.reply({
            embeds: [createSuccessEmbed("8D Audio Dinonaktifkan 🎧", "Efek rotasi spasial telah dinonaktifkan.")],
          });
        }
        return;
      }

      if (sub === "speed") {
        const multiplier = interaction.options.getNumber("multiplier", true);
        const applied = await setPlaybackSpeed(player, multiplier);
        await interaction.reply({
          embeds: [
            createSuccessEmbed(
              "Kecepatan Pemutaran Diubah ⚡",
              `Kecepatan lagu saat ini diatur ke **${applied}x**.`
            ),
          ],
        });
        return;
      }

      if (sub === "pitch") {
        const multiplier = interaction.options.getNumber("multiplier", true);
        const applied = await setPlaybackPitch(player, multiplier);
        await interaction.reply({
          embeds: [
            createSuccessEmbed(
              "Nada Lagu (Pitch) Diubah 🎼",
              `Tinggi rendah nada diatur ke **${applied}x**.`
            ),
          ],
        });
        return;
      }

      if (sub === "autonormalize") {
        const enable = interaction.options.getBoolean("enable", true);
        await setAutoNormalize(player, enable);
        await interaction.reply({
          embeds: [
            createSuccessEmbed(
              "Auto-Normalizer 🎚️",
              `Normalisasi volume otomatis antar lagu sekarang: **${enable ? "AKTIF" : "NONAKTIF"}**.`
            ),
          ],
        });
        return;
      }
    } catch (err: any) {
      await interaction.reply({
        embeds: [createErrorEmbed("Gagal Menerapkan Efek Audio", err?.message || "Kesalahan internal audio DSP.")],
        ephemeral: true,
      });
    }
  },
};
