import type { Client, TextChannel } from "discord.js";
import { runHealthCheck } from "../health/healthCheck.js";
import { lavalink } from "../player/lavalink.js";
import { createErrorEmbed } from "../ui/embeds.js";

let consecutiveFailures = 0;
let lastAlertSentTime = 0;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // Minimal jeda 15 menit antar alert agar tidak spam

export function startHealthMonitor(client: Client, intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  console.log(`[Health Monitor] Memulai background canary check tiap ${intervalMs / 1000}s...`);

  const timer = setInterval(async () => {
    try {
      const activePlayer = lavalink.players.values().next().value || null;
      const report = await runHealthCheck(activePlayer);

      const hasError =
        report.lavalink.status === "error" ||
        report.youtube.status === "error" ||
        report.spotify.status === "error";

      if (hasError) {
        consecutiveFailures++;
        console.warn(`[Health Monitor] Peringatan: Kesehatan sistem mengalami kendala (Gagal beruntun: ${consecutiveFailures}).`);

        const now = Date.now();
        if (consecutiveFailures >= 2 && now - lastAlertSentTime > ALERT_COOLDOWN_MS) {
          lastAlertSentTime = now;
          await sendFailureNotification(client, report);
        }
      } else {
        if (consecutiveFailures > 0) {
          console.log("[Health Monitor] Kesehatan sistem telah kembali normal (Semua canary PASS).");
        }
        consecutiveFailures = 0;
      }
    } catch (err: any) {
      console.error("[Health Monitor Error]", err?.message);
    }
  }, intervalMs);

  return timer;
}

async function sendFailureNotification(client: Client, report: any): Promise<void> {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    // Cari text channel yang dapat dikirimi pesan oleh bot
    const channel =
      guild.systemChannel ||
      (guild.channels.cache.find(
        (c) => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has("SendMessages")
      ) as TextChannel | undefined);

    if (channel && channel.isTextBased() && "send" in channel) {
      const failedComponents = [];
      if (report.lavalink.status === "error") failedComponents.push(`• **Lavalink Server**: ${report.lavalink.detail}`);
      if (report.youtube.status === "error") failedComponents.push(`• **YouTube Plugin**: ${report.youtube.detail}`);
      if (report.spotify.status === "error") failedComponents.push(`• **Spotify Resolver**: ${report.spotify.detail}`);

      const embed = createErrorEmbed(
        "🚨 Peringatan Kesehatan Bot (PRD v2 E1)",
        `Terdeteksi kendala beruntun pada infrastruktur audio bot:\n\n${failedComponents.join("\n")}\n\n` +
          `**Saran Tindakan:**\n` +
          `1. Pastikan Lavalink berjalan di port 2333 (\`start-all.bat\`).\n` +
          `2. Jalankan perintah \`/diagnose\` untuk uji mendalam.`
      );

      await (channel as TextChannel).send({ embeds: [embed] });
      console.log(`[Health Monitor] Notifikasi peringatan dikirim ke #${channel.name}.`);
    }
  } catch (err: any) {
    console.error("[Health Monitor] Gagal mengirim notifikasi:", err?.message);
  }
}
