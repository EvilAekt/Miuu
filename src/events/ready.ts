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

  const rest = new REST().setToken(config.DISCORD_TOKEN);
  const body = commands.map((c) => c.data.toJSON());

  // 1. Daftarkan secara instan ke server utama (0 delay)
  if (config.GUILD_ID) {
    try {
      console.log(`[Slash Commands] Mendaftarkan ${commands.length} command ke server utama (${config.GUILD_ID})...`);
      await rest.put(Routes.applicationGuildCommands(client.user!.id, config.GUILD_ID), { body });
      console.log(`[Slash Commands] Berhasil mendaftarkan guild command di server utama!`);
    } catch (err: any) {
      console.warn(`[Slash Commands Warning] Gagal mendaftarkan guild command:`, err?.message ?? err);
    }
  }

  // 2. Daftarkan secara GLOBAL agar muncul otomatis di SEMUA server Discord lain
  try {
    console.log(`[Slash Commands] Mendaftarkan ${commands.length} command secara GLOBAL untuk multi-server...`);
    await rest.put(Routes.applicationCommands(client.user!.id), { body });
    console.log(`[Slash Commands] Berhasil mendaftarkan command secara GLOBAL ke seluruh server!`);
  } catch (globalErr: any) {
    console.error(`[Slash Commands Error] Pendaftaran global gagal:`, globalErr?.message ?? globalErr);
    console.log(
      `[Tips Izin] Pastikan bot diundang dengan scope 'bot' DAN 'applications.commands':\nhttps://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`
    );
  }
}
