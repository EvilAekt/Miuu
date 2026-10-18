#!/usr/bin/env node
/**
 * Skrip Rencana Pensiun Bot (PRD v4 Epic 3)
 * Menjalankan langkah-langkah pensiun terstruktur:
 * 1. Mengekspor semua playlist & favorit pengguna ke folder backups/user_exports/
 * 2. Mengambil snapshot final database SQLite.
 * 3. Memberikan panduan pencabutan token dan pengarsipan repository.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

console.log("==========================================");
console.log("    Skrip Pensiun Bot Musik (PRD v4 E3)   ");
console.log("==========================================");

const dbPath = path.resolve("./data/bot.db");
if (!fs.existsSync(dbPath)) {
  console.error("Database bot.db tidak ditemukan.");
  process.exit(1);
}

const db = new Database(dbPath);

const exportDir = path.resolve("./backups/retirement_export_" + Date.now());
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// 1. Ekspor semua playlist
const playlists = db.prepare("SELECT * FROM playlists").all();
console.log(`[1/3] Mengekspor ${playlists.length} playlist pengguna...`);
const exportedPlaylists = [];
for (const pl of playlists) {
  const tracks = db.prepare("SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC").all(pl.id);
  exportedPlaylists.push({
    name: pl.name,
    owner_user_id: pl.owner_user_id,
    created_at: pl.created_at,
    tracks: tracks.map((t) => ({
      title: t.title,
      artist: t.artist,
      source_url: t.source_url,
      duration_ms: t.duration_ms,
    })),
  });
}
fs.writeFileSync(
  path.join(exportDir, "all_playlists.json"),
  JSON.stringify(exportedPlaylists, null, 2),
  "utf8"
);
console.log(` -> Disimpan di: ${path.join(exportDir, "all_playlists.json")}`);

// 2. Ekspor semua favorit
console.log("[2/3] Mengekspor daftar favorit semua pengguna...");
const favRows = db.prepare("SELECT * FROM favorites").all();
fs.writeFileSync(
  path.join(exportDir, "all_favorites.json"),
  JSON.stringify(favRows, null, 2),
  "utf8"
);
console.log(` -> Disimpan di: ${path.join(exportDir, "all_favorites.json")}`);

// 3. Instruksi Final
console.log("[3/3] Ekspor data selesai. Langkah manual penutupan:");
console.log(`
1. Beritahukan pengguna server bahwa bot akan dinonaktifkan.
2. File cadangan playlist dan favorit berada di:
   ${exportDir}
3. Buka Discord Developer Portal (https://discord.com/developers/applications)
   dan lakukan "Reset Token" atau hapus aplikasi bot.
4. Hentikan proses Lavalink dan Bot pada PC/server.
5. Arsipkan repository git ini dengan status readonly.
`);
console.log("==========================================");
