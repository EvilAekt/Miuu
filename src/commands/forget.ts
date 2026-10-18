import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { forgetUserData } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const forgetCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("forget")
    .setDescription("Menghapus seluruh data musik pribadi Anda (favorit, playlist, riwayat, token scrobble)")
    .addBooleanOption((opt) =>
      opt
        .setName("confirm")
        .setDescription("Konfirmasi bahwa Anda yakin ingin menghapus permanen seluruh data Anda")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const confirm = interaction.options.getBoolean("confirm", true);

    if (!confirm) {
      await interaction.reply({
        embeds: [createErrorEmbed("Penghapusan Dibatalkan", "Opsi konfirmasi bernilai `False`. Data Anda tetap aman dan tidak dihapus.")],
        ephemeral: true,
      });
      return;
    }

    const userId = interaction.user.id;
    const result = forgetUserData(userId);

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          "🧹 Data Pribadi Berhasil Dihapus",
          `Seluruh data pribadi Anda di bot ini telah dihapus permanen dari database lokal sesuai hak privasi:\n\n` +
            `⭐ **Lagu Favorit:** \`${result.favoritesDeleted} dihapus\`\n` +
            `📑 **Playlist Kustom:** \`${result.playlistsDeleted} dihapus\`\n` +
            `📜 **Riwayat Pemutaran:** \`${result.historyDeleted} dihapus\`\n` +
            `🎵 **Akun Scrobble:** \`${result.scrobbleDeleted} dihapus\`\n\n` +
            `*Catatan: Anda dapat membuat koleksi baru kapan saja.*`
        ),
      ],
      ephemeral: true,
    });
  },
};
