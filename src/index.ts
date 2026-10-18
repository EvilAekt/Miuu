import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config/env.js";
import { initLavalink } from "./player/lavalink.js";
import { initDatabase, saveQueueSnapshot } from "./db/index.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { startHealthMonitor } from "./jobs/healthMonitor.js";
import { startDashboardServer } from "./web/server.js";

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

  // 2. Inisialisasi Lavalink Client
  const lavalink = initLavalink(client);

  let dashboardServer: any = null;

  // 2. Registrasi Event Discord
  client.once("clientReady", async (c) => {
    await onReady(c);
    // Inisialisasi koneksi Lavalink Node setelah bot login
    await lavalink.init({ id: c.user.id, username: c.user.username });
    // Mulai background health monitor (PRD v2 Epic 1)
    startHealthMonitor(c);
    // Mulai web dashboard (PRD v2 Epic 9 & PRD v8 Feature 4)
    const dashboardPort = Number(process.env.PORT) || 3000;
    dashboardServer = startDashboardServer(c, { port: dashboardPort, host: "0.0.0.0" });
  });

  client.on("interactionCreate", onInteractionCreate);
  client.on("voiceStateUpdate", (oldState, newState) => onVoiceStateUpdate(oldState, newState, client));

  // 3. Tangani shutdown dengan rapi (simpan snapshot antrean)
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

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // 4. Login ke Discord Gateway
  console.log("[Discord] Menghubungkan ke Discord Gateway...");
  await client.login(config.DISCORD_TOKEN);
}

main().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
