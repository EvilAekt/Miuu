// src/backup/backupManager.ts: Pengelola Pencadangan & Pemulihan Database SQLite Terkompresi
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BACKUP_DIR = path.resolve(process.cwd(), "backups");

export function getDatabaseFilePath(): string {
  const primaryDb = path.resolve(process.cwd(), "data", "bot.db");
  if (fs.existsSync(primaryDb)) return primaryDb;
  return path.resolve(process.cwd(), "data", "musicbot.db");
}

export interface BackupItem {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: Date;
}

/**
 * Memastikan direktori folder backups/ siap digunakan.
 */
export function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Membuat backup snapshot baru dari database SQLite yang dikompresi (.gz).
 */
export async function createDatabaseBackup(label = "manual"): Promise<BackupItem> {
  ensureBackupDir();

  const dbFile = getDatabaseFilePath();
  if (!fs.existsSync(dbFile)) {
    throw new Error(`File database tidak ditemukan di: ${dbFile}`);
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `backup_${label}_${timestamp}.db.gz`;
  const targetPath = path.join(BACKUP_DIR, filename);

  const rawDbContent = fs.readFileSync(dbFile);
  const compressed = zlib.gzipSync(rawDbContent);
  fs.writeFileSync(targetPath, compressed);

  const stats = fs.statSync(targetPath);

  // Bersihkan backup lama (pertahankan maksimal 5 cadangan terbaru)
  rotateBackups(5);

  return {
    filename,
    path: targetPath,
    sizeBytes: stats.size,
    createdAt: stats.mtime,
  };
}

/**
 * Menampilkan daftar file backup yang tersedia, disortir dari yang paling baru.
 */
export function listDatabaseBackups(): BackupItem[] {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files.filter((f) => f.endsWith(".db.gz") || f.endsWith(".bak"));

  const list = backupFiles.map((f) => {
    const fullPath = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(fullPath);
    return {
      filename: f,
      path: fullPath,
      sizeBytes: stat.size,
      createdAt: stat.mtime,
    };
  });

  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Menghapus file backup lama agar jumlah cadangan tidak melebihi ambang batas.
 */
export function rotateBackups(maxKeep = 5): number {
  const list = listDatabaseBackups();
  let deletedCount = 0;

  if (list.length > maxKeep) {
    const excess = list.slice(maxKeep);
    for (const item of excess) {
      try {
        fs.unlinkSync(item.path);
        deletedCount++;
      } catch (e) {
        console.warn(`[BackupManager] Gagal menghapus backup kadaluarsa: ${item.filename}`, e);
      }
    }
  }

  return deletedCount;
}

/**
 * Memulihkan database SQLite dari file backup yang dipilih.
 */
export async function restoreDatabaseBackup(filename: string): Promise<{ success: boolean; message: string }> {
  ensureBackupDir();

  // Validasi keamanan: Mencegah serangan path traversal
  if (filename.includes("..") || path.isAbsolute(filename) || path.basename(filename) !== filename) {
    throw new Error("Path file backup tidak valid atau terindikasi path traversal.");
  }

  const targetPath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`File backup ${filename} tidak ditemukan.`);
  }

  const dbFile = getDatabaseFilePath();

  // Buat backup darurat sebelum menimpa database aktif
  if (fs.existsSync(dbFile)) {
    const safetyBackup = path.join(BACKUP_DIR, `pre_restore_safety_${Date.now()}.db.gz`);
    const raw = fs.readFileSync(dbFile);
    fs.writeFileSync(safetyBackup, zlib.gzipSync(raw));
  }

  // Decompress dan tulis kembali ke file database aktif
  const compressedData = fs.readFileSync(targetPath);
  let decompressedData: Buffer;

  if (filename.endsWith(".gz")) {
    decompressedData = zlib.gunzipSync(compressedData);
  } else {
    decompressedData = compressedData;
  }

  fs.writeFileSync(dbFile, decompressedData);
  return {
    success: true,
    message: `Database berhasil dipulihkan dari cadangan: ${filename}`,
  };
}
