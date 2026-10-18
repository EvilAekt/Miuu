import { Client, REST, Routes } from "discord.js";
import { commands } from "../commands/index.js";
import { config } from "../config/env.js";
import { syncGuildsOnReady } from "../guilds/guildManager.js";
import { initAnnualReview, checkReviewReminder } from "../reminders/annualReview.js";

export async function onReady(client: Client): Promise<void> {
  console.log(`[Bot Ready] Terhubung sebagai ${client.user?.tag} (${client.user?.id})`);

  syncGuildsOnReady(client);
  initAnnualReview();
  checkReviewReminder(client, config.OWNER_ID).catch(() => {});

  const joinedGuilds = client.guilds.cache.map((g) => `${g.name} [${g.id}]`).join(", ");
  console.log(`[Guilds] Bot bergabung di ${client.guilds.cache.size} server: ${joinedGuilds || "(belum ada server)"}`);

  try {
    const rest = new REST().setToken(config.DISCORD_TOKEN);
    const body = commands.map((c) => c.data.toJSON());

    console.log(`[Slash Commands] Mendaftarkan ${commands.length} guild command ke Guild ID: ${config.GUILD_ID}...`);
    await rest.put(Routes.applicationGuildCommands(client.user!.id, config.GUILD_ID), {
      body,
    });
    console.log(`[Slash Commands] Berhasil mendaftarkan semua guild command!`);
  } catch (error: any) {
    console.error(`[Slash Commands Error] Gagal mendaftarkan guild command:`, error?.message ?? error);
    try {
      console.log(`[Slash Commands] Mencoba mendaftarkan command secara global...`);
      const rest = new REST().setToken(config.DISCORD_TOKEN);
      const body = commands.map((c) => c.data.toJSON());
      await rest.put(Routes.applicationCommands(client.user!.id), { body });
      console.log(`[Slash Commands] Berhasil mendaftarkan command secara global!`);
    } catch (globalErr: any) {
      console.error(`[Slash Commands Error] Pendaftaran global juga gagal:`, globalErr?.message ?? globalErr);
      console.log(
        `[Tips Izin] Pastikan bot diundang dengan scope 'bot' DAN 'applications.commands':\nhttps://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`
      );
    }
  }
}
