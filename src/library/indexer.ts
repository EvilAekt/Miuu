import fs from "node:fs";
import path from "node:path";
import { saveLocalTracks, searchLocalTracks, getLocalTrackById } from "../db/index.js";

const SUPPORTED_EXTENSIONS = new Set([".mp3", ".flac", ".wav", ".ogg", ".m4a"]);

export function getMusicDirectory(): string {
  const customDir = process.env.LOCAL_MUSIC_DIRS || "./music";
  const absPath = path.resolve(customDir);
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true });
  }
  return absPath;
}

export function validateSafePath(relPath: string): string {
  const baseDir = getMusicDirectory();

  if (path.isAbsolute(relPath)) {
    throw new Error(`Akses path dilarang: path absolut tidak diizinkan.`);
  }

  const fullPath = path.resolve(baseDir, relPath);
  const rel = path.relative(baseDir, fullPath);

  // Pastikan path berada strictly di dalam baseDir (Anti Path Traversal)
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Akses path dilarang: path traversal terdeteksi.`);
  }

  // Cek jika symlink mengarah ke luar baseDir
  if (fs.existsSync(fullPath)) {
    const real = fs.realpathSync(fullPath);
    const realRel = path.relative(baseDir, real);
    if (realRel.startsWith("..") || path.isAbsolute(realRel)) {
      throw new Error(`Akses path dilarang: symlink keluar dari folder musik yang diizinkan.`);
    }
  }

  return fullPath;
}

export interface ScannedTrack {
  rel_path: string;
  title: string;
  artist: string;
  album: string;
  duration_ms: number;
  mtime: number;
}

export function scanLocalMusicDirectory(): { scannedCount: number; tracks: ScannedTrack[] } {
  const baseDir = getMusicDirectory();
  const scannedTracks: ScannedTrack[] = [];

  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          const rel = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          const stats = fs.statSync(fullPath);

          // Parsing nama file untuk Artis dan Judul (format "Artis - Judul" atau "Judul")
          const baseName = path.basename(entry.name, ext);
          let artist = "Unknown";
          let title = baseName;

          if (baseName.includes(" - ")) {
            const parts = baseName.split(" - ");
            artist = parts[0].trim();
            title = parts.slice(1).join(" - ").trim();
          }

          scannedTracks.push({
            rel_path: rel,
            title,
            artist,
            album: path.basename(path.dirname(fullPath)) || "Local Music",
            duration_ms: 180000, // Estimasi awal jika ID3 tag belum diparse
            mtime: stats.mtimeMs,
          });
        }
      }
    }
  }

  traverse(baseDir);

  if (scannedTracks.length > 0) {
    saveLocalTracks(scannedTracks);
  }

  return { scannedCount: scannedTracks.length, tracks: scannedTracks };
}

export { searchLocalTracks, getLocalTrackById };
