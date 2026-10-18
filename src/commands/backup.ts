// src/commands/backup.ts: Slash Command /backup untuk pencadangan & pemulihan database SQLite
import { SlashCommandBuilder, type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import type { Command } from "./types.js";
import { createDatabaseBackup, listDatabaseBackups, restoreDatabaseBackup } from "../backup/backupManager.js";
import { createSuccessEmbed, createInfoEmbed, createErrorEmbed } from "../ui/embeds.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const backupCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Kelola pencadangan dan pemulihan database musik lokal (SQLite)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Buat snapshot cadangan database baru yang terkompresi")
        .addStringOption((opt) =>
          opt
            .setName("label")
            .setDescription("Label penanda cadangan (contoh: sebelum_update, mingguan)")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Tampilkan daftar file cadangan database yang tersimpan")
    )
    .addSubcommand((sub) =>
      sub
        .setName("restore")
        .setDescription("Pulihkan database dari snapshot cadangan yang dipilih")
        .addStringOption((opt) =>
          opt
            .setName("filename")
            .setDescription("Nama file cadangan yang ingin dipulihkan (dari /backup list)")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      await interaction.deferReply();
      const label = interaction.options.getString("label") || "manual";

      try {
        const item = await createDatabaseBackup(label);
        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "Backup Database Berhasil 💾",
              `Snapshot database telah dibuat dan dikompresi:\n` +
                `• **File:** \`${item.filename}\`\n` +
                `• **Ukuran:** ${formatBytes(item.sizeBytes)}\n` +
                `• **Lokasi:** \`${item.path}\`\n` +
                `Rotasi otomatis menjaga 5 cadangan terbaru.`
            ),
          ],
        });
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Membuat Backup", err?.message || "Terjadi kesalahan internal.")],
        });
      }
      return;
    }

    if (sub === "list") {
      const list = listDatabaseBackups();
      if (list.length === 0) {
        await interaction.reply({
          embeds: [createInfoEmbed("Daftar Cadangan", "Belum ada file cadangan database di folder `backups/`. Gunakan `/backup create`.")],
          ephemeral: true,
        });
        return;
      }

      const rows = list.map((item, idx) => {
        const dateStr = item.createdAt.toLocaleString("id-ID");
        return `\`${idx + 1}.\` **${item.filename}** (${formatBytes(item.sizeBytes)}) — *${dateStr}*`;
      });

      await interaction.reply({
        embeds: [
          createInfoEmbed(
            "Arsip Cadangan Database (SQLite) 📦",
            `Ditemukan **${list.length} cadangan**:\n\n${rows.join("\n")}\n\n*Gunakan \`/backup restore filename: <nama_file>\` untuk memulihkan.*`
          ),
        ],
      });
      return;
    }

    if (sub === "restore") {
      await interaction.deferReply();
      const filename = interaction.options.getString("filename", true);

      try {
        const res = await restoreDatabaseBackup(filename);
        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "Pemulihan Berhasil 🔄",
              `${res.message}\n*(Snapshot keselamatan pra-pemulihan juga telah otomatis dibuat).*`
            ),
          ],
        });
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Memulihkan Database", err?.message || "File tidak ditemukan atau korup.")],
        });
      }
      return;
    }
  },
};
