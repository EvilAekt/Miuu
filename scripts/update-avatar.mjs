import { Client, GatewayIntentBits } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const avatarPath = path.join(rootDir, "assets", "miu_avatar.jpg");

if (!fs.existsSync(avatarPath)) {
  console.error(`[Error] File avatar tidak ditemukan di: ${avatarPath}`);
  process.exit(1);
}

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("[Error] DISCORD_TOKEN tidak ditemukan di file .env");
  process.exit(1);
}

console.log("[Miu] Menghubungkan ke Discord...");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`[Miu] Login berhasil sebagai: ${client.user.tag}`);
  try {
    console.log(`[Miu] Mengunggah foto profil baru dari: ${avatarPath}...`);
    await client.user.setAvatar(avatarPath);
    console.log("[Miu] ✨ SUKSES! Foto profil Miu berhasil diperbarui di Discord!");
    console.log(`[Miu] Avatar URL baru: ${client.user.displayAvatarURL({ extension: "png", size: 512 })}`);
  } catch (err) {
    console.error("[Miu Error] Gagal memperbarui avatar:", err.message);
    if (err.message?.includes("rate limit") || err.code === 50035) {
      console.log("[Info] Discord membatasi penggantian avatar jika terlalu sering. Coba lagi dalam beberapa menit.");
    }
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(token).catch((err) => {
  console.error("[Miu Error] Gagal login ke Discord:", err.message);
  process.exit(1);
});
