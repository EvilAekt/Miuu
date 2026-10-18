#!/usr/bin/env node
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = path.resolve("./data/bot.db");
if (!fs.existsSync(dbPath)) {
  console.error("Database bot.db tidak ditemukan.");
  process.exit(1);
}

const db = new Database(dbPath);
const retentionDays = parseInt(process.argv[2] || "180", 10);
const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

console.log("==========================================");
console.log(`  Pembersihan & Retensi Data (PRD v5 E1) `);
console.log(`  Batas Retensi: ${retentionDays} hari               `);
console.log("==========================================");

const beforeStats = fs.statSync(dbPath);
console.log(`Ukuran database sebelum pruning: ${(beforeStats.size / 1024).toFixed(2)} KB`);

function safeDelete(table, column) {
  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!tableExists) return 0;
    const res = db.prepare(`DELETE FROM ${table} WHERE ${column} < ?`).run(cutoff);
    return res.changes;
  } catch {
    return 0;
  }
}

const playLogCount = safeDelete("play_log", "played_at");
const healthCount = safeDelete("health_events", "created_at");
const demandCount = safeDelete("demand_events", "created_at");
const maintenanceCount = safeDelete("maintenance_log", "created_at");
const resumeCount = safeDelete("resume_positions", "updated_at");

console.log(`-> Dihapus ${playLogCount} entri play_log lawas`);
console.log(`-> Dihapus ${healthCount} entri health_events lawas`);
console.log(`-> Dihapus ${demandCount} entri demand_events lawas`);
console.log(`-> Dihapus ${maintenanceCount} entri maintenance_log lawas`);
console.log(`-> Dihapus ${resumeCount} entri resume_positions kedaluwarsa`);

console.log("Menjalankan VACUUM database...");
db.exec("VACUUM;");

const afterStats = fs.statSync(dbPath);
console.log(`Ukuran database setelah VACUUM: ${(afterStats.size / 1024).toFixed(2)} KB`);
console.log("==========================================");
console.log("Pembersihan data selesai!");
