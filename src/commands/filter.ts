import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";
import { FilterManager } from "lavalink-client";
import {
  saveFilterPreset,
  getFilterPreset,
  listFilterPresets,
  deleteFilterPreset,
} from "../db/index.js";

async function applyFilterByType(player: any, type: string) {
  switch (type) {
    case "clear":
      await player.filterManager.resetFilters();
      return "Semua filter audio telah dinonaktifkan.";
    case "bassboost_low":
      await player.filterManager.setEQ(FilterManager.EQList.BassboostLow);
      return "🔊 Efek **Bassboost (Low)** berhasil diaktifkan.";
    case "bassboost_medium":
      await player.filterManager.setEQ(FilterManager.EQList.BassboostMedium);
      return "🔊 Efek **Bassboost (Medium)** berhasil diaktifkan.";
    case "bassboost_high":
      await player.filterManager.setEQ(FilterManager.EQList.BassboostHigh);
      return "🔊 Efek **Bassboost (High)** berhasil diaktifkan.";
    case "nightcore":
      await player.filterManager.toggleNightcore();
      return "✨ Efek **Nightcore** berhasil diaktifkan.";
    case "vaporwave":
      await player.filterManager.toggleVaporwave();
      return "🌊 Efek **Vaporwave** berhasil diaktifkan.";
    case "pop":
      await player.filterManager.setEQ(FilterManager.EQList.Pop);
      return "🎵 Preset Equalizer **Pop** berhasil diaktifkan.";
    case "rock":
      await player.filterManager.setEQ(FilterManager.EQList.Rock);
      return "🎸 Preset Equalizer **Rock** berhasil diaktifkan.";
    case "electronic":
      await player.filterManager.setEQ(FilterManager.EQList.Electronic);
      return "⚡ Preset Equalizer **Electronic** berhasil diaktifkan.";
    default:
      return null;
  }
}

export const filterCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Menerapkan efek filter audio atau mengelola preset kustom (PRD v5 E5)")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Jenis filter audio")
        .setRequired(false)
        .addChoices(
          { name: "Clear / Nonaktifkan Semua Filter", value: "clear" },
          { name: "Bassboost (Low)", value: "bassboost_low" },
          { name: "Bassboost (Medium)", value: "bassboost_medium" },
          { name: "Bassboost (High)", value: "bassboost_high" },
          { name: "Nightcore (Cepat & Nada Tinggi)", value: "nightcore" },
          { name: "Vaporwave (Lambat & Santai)", value: "vaporwave" },
          { name: "Pop EQ", value: "pop" },
          { name: "Rock EQ", value: "rock" },
          { name: "Electronic EQ", value: "electronic" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("preset_action")
        .setDescription("Kelola preset filter pribadi (PRD v5 E5)")
        .setRequired(false)
        .addChoices(
          { name: "Pakai Preset", value: "load" },
          { name: "Simpan Preset", value: "save" },
          { name: "Daftar Preset Saya", value: "list" },
          { name: "Hapus Preset", value: "delete" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("preset_name")
        .setDescription("Nama preset kustom")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const presetAction = interaction.options.getString("preset_action");
    const presetName = interaction.options.getString("preset_name");
    const type = interaction.options.getString("type");

    try {
      await interaction.deferReply();

      // 1. Handle preset actions
      if (presetAction) {
        if (presetAction === "list") {
          const presets = listFilterPresets(interaction.user.id);
          if (presets.length === 0) {
            await interaction.editReply({
              embeds: [createSuccessEmbed("Preset Filter", "Anda belum memiliki preset filter tersimpan.")],
            });
            return;
          }
          const listStr = presets.map((p) => `• **${p.name}** (${p.filters_json})`).join("\n");
          await interaction.editReply({
            embeds: [createSuccessEmbed("Preset Filter Pribadi", listStr)],
          });
          return;
        }

        if (!presetName) {
          await interaction.editReply({
            embeds: [createErrorEmbed("Nama Preset Wajib", "Harap masukkan nama preset pada opsi `preset_name`.")],
          });
          return;
        }

        if (presetAction === "save") {
          if (!type) {
            await interaction.editReply({
              embeds: [createErrorEmbed("Tipe Filter Wajib", "Pilih tipe filter pada opsi `type` untuk disimpan sebagai preset.")],
            });
            return;
          }
          saveFilterPreset(interaction.user.id, presetName, type);
          await interaction.editReply({
            embeds: [createSuccessEmbed("Preset Disimpan", `Preset **${presetName}** (${type}) berhasil disimpan.`)],
          });
          return;
        }

        if (presetAction === "delete") {
          const deleted = deleteFilterPreset(interaction.user.id, presetName);
          if (deleted) {
            await interaction.editReply({
              embeds: [createSuccessEmbed("Preset Dihapus", `Preset **${presetName}** berhasil dihapus.`)],
            });
          } else {
            await interaction.editReply({
              embeds: [createErrorEmbed("Preset Tidak Ditemukan", `Preset **${presetName}** tidak ditemukan.`)],
            });
          }
          return;
        }

        if (presetAction === "load") {
          const savedType = getFilterPreset(interaction.user.id, presetName);
          if (!savedType) {
            await interaction.editReply({
              embeds: [createErrorEmbed("Preset Tidak Ditemukan", `Preset **${presetName}** tidak ditemukan.`)],
            });
            return;
          }
          const res = await applyFilterByType(player, savedType);
          await interaction.editReply({
            embeds: [createSuccessEmbed(`Preset Dimuat: ${presetName}`, res || "Filter berhasil diterapkan.")],
          });
          return;
        }
      }

      // 2. Direct filter application
      if (!type) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Opsi Diperlukan", "Pilih opsi `type` atau opsi `preset_action`.")],
        });
        return;
      }

      const res = await applyFilterByType(player, type);
      if (res) {
        await interaction.editReply({
          embeds: [createSuccessEmbed("Filter Diterapkan", res)],
        });
      } else {
        await interaction.editReply({
          embeds: [createErrorEmbed("Filter Tidak Dikenal", "Jenis filter yang dipilih tidak valid.")],
        });
      }
    } catch (err: any) {
      console.error("[Filter Command Error]", err);
      await interaction.editReply({
        embeds: [createErrorEmbed("Gagal Menerapkan Filter", err?.message || "Terjadi kesalahan pada Lavalink filter.")],
      });
    }
  },
};
