import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import {
  getGuildAutoplay,
  setGuildAutoplay,
  getGuildAutoplayMode,
  setGuildAutoplayMode,
} from "../db/index.js";
import { createSuccessEmbed } from "../ui/embeds.js";

export const autoplayCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Mengaktifkan atau mengatur pemutaran otomatis saat antrean habis")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Mode rekomendasi autoplay cerdas (PRD v4 Epic 5)")
        .setRequired(false)
        .addChoices(
          { name: "Campur (Mix Rekomendasi & YouTube - Bawaan)", value: "campur" },
          { name: "Riwayat (Prioritaskan Transisi Lagu Riwayat Nyata)", value: "riwayat" },
          { name: "Jelajah (Eksplorasi Lagu Baru & Artis Terkait)", value: "jelajah" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const chosenMode = interaction.options.getString("mode") as "riwayat" | "campur" | "jelajah" | null;

    if (chosenMode) {
      setGuildAutoplay(interaction.guildId!, true);
      setGuildAutoplayMode(interaction.guildId!, chosenMode);

      const modeNames = {
        campur: "Campur (Mix)",
        riwayat: "Riwayat (History-based)",
        jelajah: "Jelajah (Explore)",
      };

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Mode Autoplay Diperbarui",
            `Autoplay telah **Diaktifkan** dengan mode **${modeNames[chosenMode]}**.\nSaat lagu selesai, bot akan memilih rekomendasi sesuai preferensi mode ini.`
          ),
        ],
      });
      return;
    }

    const currentStatus = getGuildAutoplay(interaction.guildId!);
    const newStatus = !currentStatus;
    setGuildAutoplay(interaction.guildId!, newStatus);
    const activeMode = getGuildAutoplayMode(interaction.guildId!);

    const statusText = newStatus ? "✅ **Aktif**" : "❌ **Nonaktif**";
    const desc = newStatus
      ? `Ketika antrean selesai, bot otomatis mencari rekomendasi dengan mode **${activeMode}**.\nGunakan \`/autoplay mode:<riwayat|campur|jelajah>\` untuk mengganti mode.`
      : "Pemutaran otomatis dinonaktifkan. Bot akan keluar dari VC jika antrean kosong sesuai durasi auto-leave.";

    await interaction.reply({
      embeds: [createSuccessEmbed(`Mode Autoplay: ${statusText}`, desc)],
    });
  },
};
