import dns from "node:dns";
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config/env.js";
import { initLavalink } from "./player/lavalink.js";
import { initDatabase, saveQueueSnapshot } from "./db/index.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { startHealthMonitor } from "./jobs/healthMonitor.js";
import { startDashboardServer } from "./web/server.js";
import { setUiClient } from "./ui/embeds.js";

// Ensure IPv4 is preferred over IPv6 in cloud container environments
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

async function main() {
  console.log("==========================================");
  console.log("    Discord Music Bot - PRD v2 (V2.0)     ");
  console.log("==========================================");

  // 1. Inisialisasi Database SQLite (PRD Section 8 & 9)
  initDatabase();
  console.log("[Database] SQLite database siap (data/bot.db).");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });
  setUiClient(client);

  // 2. Mulai web dashboard server SEGERA agar port terbuka seketika untuk cloud provider (Render/Koyeb)
  const dashboardPort = Number(process.env.PORT) || 3000;
  let dashboardServer: any = null;
  try {
    dashboardServer = startDashboardServer(client, { port: dashboardPort, host: "0.0.0.0" });
  } catch (err: any) {
    console.error("[Dashboard Web Error] Gagal memulai dashboard server:", err?.message ?? err);
  }

  // 3. Inisialisasi Lavalink Client
  const lavalink = initLavalink(client);

  // 4. Registrasi Event Discord
  client.once("clientReady", async (c) => {
    try {
      await onReady(c);
    } catch (err: any) {
      console.error("[Ready Error]", err?.message ?? err);
    }

    // Inisialisasi koneksi Lavalink Node setelah bot login
    try {
      await lavalink.init({ id: c.user.id, username: c.user.username });
    } catch (err: any) {
      console.error("[Lavalink Init Warning] Gagal menginisialisasi Lavalink saat startup (akan otomatis reconnect):", err?.message ?? err);
    }

    // Mulai background health monitor (PRD v2 Epic 1)
    try {
      startHealthMonitor(c);
    } catch (err: any) {
      console.error("[Health Monitor Error]", err?.message ?? err);
    }
  });

  client.on("interactionCreate", onInteractionCreate);
  client.on("voiceStateUpdate", (oldState, newState) => onVoiceStateUpdate(oldState, newState, client));
  client.on("error", (err) => console.error("[Discord Client Error]", err));
  client.on("shardError", (err, id) => console.error(`[Discord Shard ${id} Error]`, err));
  client.on("shardDisconnect", (event, id) => console.warn(`[Discord Shard ${id} Disconnect]`, event));

  // 5. Tangani unhandled errors secara global agar kontainer tidak pernah exit dengan code 1
  process.on("unhandledRejection", (reason: any) => {
    console.error("[Unhandled Rejection]", reason?.message ?? reason);
  });

  process.on("uncaughtException", (err: any) => {
    console.error("[Uncaught Exception]", err?.message ?? err);
  });

  // 6. Tangani shutdown dengan rapi (simpan snapshot antrean)
  const shutdown = async () => {
    console.log("\n[Shutdown] Menutup koneksi bot...");
    for (const [guildId, player] of lavalink.players) {
      try {
        const tracks = [];
        if (player.queue.current) tracks.push(player.queue.current);
        tracks.push(...player.queue.tracks);
        if (tracks.length > 0) {
          saveQueueSnapshot(guildId, player.textChannelId || "", player.voiceChannelId || "", tracks);
          console.log(`[Shutdown] Menyimpan snapshot ${tracks.length} lagu untuk guild ${guildId}.`);
        }
        await player.destroy("Bot shutting down");
      } catch {}
    }
    if (dashboardServer) {
      try {
        dashboardServer.close();
      } catch {}
    }
    client.destroy();
    process.exit(0);
  };

  client.on("debug", (msg) => {
    // Only log essential gateway steps to avoid spam
    if (msg.includes("Gateway") || msg.includes("Shard") || msg.includes("Session") || msg.includes("Heartbeat") || msg.includes("token")) {
      console.log(`[Discord Debug] ${msg}`);
    }
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // 7. Login ke Discord Gateway
  console.log(`[Discord] Menghubungkan ke Discord Gateway (Token length: ${config.DISCORD_TOKEN?.length ?? 0})...`);
  try {
    const tokenResult = await client.login(config.DISCORD_TOKEN);
    console.log(`[Discord] client.login() Promise resolved! Bot token authenticated.`);
  } catch (loginErr: any) {
    console.error("[Discord Login Fatal Error]", loginErr?.message ?? loginErr);
  }
}

main().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
