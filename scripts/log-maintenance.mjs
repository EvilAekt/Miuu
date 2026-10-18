#!/usr/bin/env node
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = path.resolve("./data/bot.db");
if (!fs.existsSync(dbPath)) {
  console.error("Database bot.db belum dibuat di folder ./data.");
  process.exit(1);
}

const db = new Database(dbPath);

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
Pencatat Log Pemeliharaan Bot (PRD v4 Epic 0 & E1)
-------------------------------------------------
Penggunaan:
  node scripts/log-maintenance.mjs <kind> <minutes_spent> [catatan...]
  node scripts/log-maintenance.mjs --list [limit]

Jenis (kind):
  update       : Pembaruan dependency, lavalink, plugin
  incident     : Insiden mati/error, perbaikan sumber
  drill        : Latihan pemulihan bencana (disaster recovery)
  manual_fix   : Perbaikan konfigurasi, file musik, dsb.

Contoh:
  node scripts/log-maintenance.mjs update 15 "Update Lavalink plugin YouTube"
  node scripts/log-maintenance.mjs drill 20 "Latihan pemulihan kuartal 4 berhasil"
  node scripts/log-maintenance.mjs --list 10
`);
  process.exit(0);
}

if (args[0] === "--list") {
  const limit = parseInt(args[1] || "10", 10);
  const logs = db.prepare("SELECT * FROM maintenance_log ORDER BY id DESC LIMIT ?").all(limit);
  console.log(`\nRiwayat Pemeliharaan Bot (${logs.length} catatan terakhir):`);
  console.table(
    logs.map((l) => ({
      ID: l.id,
      Jenis: l.kind,
      Durasi: `${l.minutes_spent} mnt`,
      Waktu: new Date(l.created_at).toLocaleString("id-ID"),
      Catatan: l.note || "-",
    }))
  );
  process.exit(0);
}

const kind = args[0];
const minutes = parseInt(args[1] || "0", 10);
const note = args.slice(2).join(" ");

if (isNaN(minutes) || minutes < 0) {
  console.error("Error: Durasi menit pemeliharaan harus berupa angka positif.");
  process.exit(1);
}

db.prepare(`
  INSERT INTO maintenance_log (kind, minutes_spent, note, created_at)
  VALUES (?, ?, ?, ?)
`).run(kind, minutes, note || null, Date.now());

console.log(`✅ Log pemeliharaan berhasil dicatat: [${kind}] ${minutes} menit - "${note}"`);
