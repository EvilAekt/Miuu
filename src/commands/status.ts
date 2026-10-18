import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { runHealthCheck } from "../health/healthCheck.js";
import { lavalink } from "../player/lavalink.js";
import fs from "node:fs";
import { isMaintenanceMode } from "../config/maintenance.js";
import { getPendingScrobbles, getMaintenanceLogs } from "../db/index.js";
import { getAnnualReviewStatus } from "../reminders/annualReview.js";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}h`);
  if (h > 0) parts.push(`${h}j`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}d`);
  return parts.join(" ");
}

export const statusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Melihat status kesehatan bot, Lavalink, Spotify resolver, memori, scrobble, dan pemulihan"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const player = lavalink.getPlayer(interaction.guildId!);
    const report = await runHealthCheck(player, interaction.guildId!);
    const isMaintenance = isMaintenanceMode();
    const pendingScrobbles = getPendingScrobbles();
    const drillLogs = getMaintenanceLogs("drill");
    const lastDrill = drillLogs.length > 0
      ? new Date(drillLogs[0].created_at).toLocaleDateString("id-ID")
      : "Belum dijadwalkan";

    const review = getAnnualReviewStatus();
    let dbSizeKb = "N/A";
    try {
      const stats = fs.statSync("./data/bot.db");
      dbSizeKb = `${(stats.size / 1024).toFixed(1)} KB`;
    } catch {}

    const getIcon = (status: "ok" | "degraded" | "error") => {
      if (status === "ok") return "🟢";
      if (status === "degraded") return "🟡";
      return "🔴";
    };

    const isAllOk =
      !isMaintenance &&
      !review.isOverdue &&
      report.lavalink.status === "ok" &&
      report.youtube.status !== "error" &&
      report.spotify.status !== "error";

    const embed = new EmbedBuilder()
      .setColor(isMaintenance ? 0xfee75c : (isAllOk ? 0x57f287 : 0xed4245))
      .setTitle("📊 Status & Observabilitas Bot (PRD v2 s/d v5)")
      .setDescription(
        `**Mode:** ${isMaintenance ? "🧊 **MODE BEKUKAN (Maintenance)**" : "🟢 **MODE NORMAL**"}\n` +
          `**Status Keseluruhan:** ${isAllOk ? "🟢 Semua Sistem Normal" : (isMaintenance ? "🟡 Mode Pemeliharaan Aktif" : (review.isOverdue ? "⚠️ Tinjauan Tahunan Terlambat" : "⚠️ Perlu Perhatian"))}\n` +
          `**Uptime Bot:** \`${formatUptime(report.botUptimeSeconds)}\` | **Node.js:** \`${process.version}\`\n` +
          `**Memori:** \`RSS: ${report.memory.rssMb} MB\` | \`Heap: ${report.memory.heapUsedMb}/${report.memory.heapTotalMb} MB\``
      )
      .addFields([
        {
          name: `${getIcon(report.lavalink.status)} Lavalink Server`,
          value: `Status: **${report.lavalink.status.toUpperCase()}**\nDetail: ${report.lavalink.detail}`,
          inline: true,
        },
        {
          name: `${getIcon(report.youtube.status)} YouTube Plugin`,
          value: `Status: **${report.youtube.status.toUpperCase()}**\nDetail: ${report.youtube.detail}`,
          inline: true,
        },
        {
          name: `${getIcon(report.spotify.status)} Spotify Resolver`,
          value: `Status: **${report.spotify.status.toUpperCase()}**\nDetail: ${report.spotify.detail}`,
          inline: true,
        },
        {
          name: "📅 Operasi Stabil & Tinjauan (PRD v5)",
          value: `• Tinjauan Terakhir: **${review.lastReviewDate}**\n• Tinjauan Berikutnya: **${review.nextReviewDate}** (${review.daysRemaining} hari lagi)\n• Status Tinjauan: ${review.isOverdue ? "⚠️ **Tinjauan Terlambat!**" : "✅ **Tepat Waktu**"}\n• Ukuran Database: \`${dbSizeKb}\``,
          inline: false,
        },
        {
          name: "🎵 Scrobble & Pemeliharaan (PRD v4)",
          value: `• Scrobble Tertunda: **${pendingScrobbles.length} lagu**\n• Latihan Pemulihan Terakhir: **${lastDrill}**\n• Dependensi: \`discord.js v14\` | \`Lavalink v4\``,
          inline: false,
        },
        {
          name: "📉 Pemutaran Gagal (24 Jam Terakhir)",
          value: report.recentFailuresCount24h > 0
            ? `⚠️ Ditemukan **${report.recentFailuresCount24h} lagu gagal diputar**.`
            : "✅ Tidak ada kegagalan lagu tercatat.",
          inline: false,
        },
      ])
      .setFooter({ text: `Diperbarui pada ${new Date(report.timestamp).toLocaleTimeString("id-ID")}` });

    if (!isAllOk) {
      const suggestions = [];
      if (report.lavalink.status === "error") suggestions.push("• Jalankan `start-all.bat` untuk menyalakan ulang Lavalink server.");
      if (report.spotify.status === "error") suggestions.push("• Halaman embed Spotify mungkin sedang diubah. Gunakan link YouTube sebagai cadangan.");
      if (report.youtube.status === "error") suggestions.push("• Periksa apakah IP rumahan terkena sign-in bot YouTube.");

      if (suggestions.length > 0) {
        embed.addFields([{ name: "💡 Langkah Perbaikan yang Disarankan", value: suggestions.join("\n") }]);
      }
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
