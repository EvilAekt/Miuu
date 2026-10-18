// src/stats/wrappedGenerator.ts: Generator Spotify-Style Music Wrapped dari SQLite History
import { db } from "../db/index.js";

export interface MusicWrappedData {
  targetName: string;
  periodLabel: string;
  totalPlays: number;
  totalMinutes: number;
  topTracks: Array<{ title: string; artist: string; plays: number }>;
  topArtists: Array<{ artist: string; plays: number }>;
  peakTimeSlot: string;
  persona: string;
  personaDesc: string;
}

export function generateMusicWrapped(
  guildId: string,
  userId?: string,
  targetName = "Server",
  days = 30
): MusicWrappedData {
  const params: any[] = [guildId];
  let timeFilter = "";
  let periodLabel = days > 0 ? `30 Hari Terakhir` : "Sepanjang Waktu";

  if (days > 0) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    timeFilter = " AND played_at >= ?";
    params.push(cutoff);
  }

  let userFilter = "";
  if (userId) {
    userFilter = " AND user_id = ?";
    params.push(userId);
  }

  // 1. Total Plays
  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM history WHERE guild_id = ?${timeFilter}${userFilter}`)
    .get(...params) as any;
  const totalPlays = countRow?.count || 0;

  // 2. Top Tracks
  const topTracks = db
    .prepare(`
      SELECT title, artist, COUNT(*) as plays FROM history
      WHERE guild_id = ?${timeFilter}${userFilter}
      GROUP BY title, artist
      ORDER BY plays DESC
      LIMIT 5
    `)
    .all(...params) as Array<{ title: string; artist: string; plays: number }>;

  // 3. Top Artists
  const topArtists = db
    .prepare(`
      SELECT artist, COUNT(*) as plays FROM history
      WHERE guild_id = ? AND artist IS NOT NULL AND artist != '' AND artist != 'Unknown'${timeFilter}${userFilter}
      GROUP BY artist
      ORDER BY plays DESC
      LIMIT 3
    `)
    .all(...params) as Array<{ artist: string; plays: number }>;

  // 4. Analisis Jam Paling Aktif (Time Slots)
  const rows = db
    .prepare(`SELECT played_at FROM history WHERE guild_id = ?${timeFilter}${userFilter}`)
    .all(...params) as Array<{ played_at: number }>;

  const timeSlots = {
    "Dini Hari (00:00 - 05:00)": 0,
    "Pagi (05:00 - 11:00)": 0,
    "Siang (11:00 - 15:00)": 0,
    "Sore (15:00 - 18:00)": 0,
    "Malam (18:00 - 24:00)": 0,
  };

  for (const r of rows) {
    if (!r.played_at) continue;
    const hour = new Date(r.played_at).getHours();
    if (hour >= 0 && hour < 5) timeSlots["Dini Hari (00:00 - 05:00)"]++;
    else if (hour >= 5 && hour < 11) timeSlots["Pagi (05:00 - 11:00)"]++;
    else if (hour >= 11 && hour < 15) timeSlots["Siang (11:00 - 15:00)"]++;
    else if (hour >= 15 && hour < 18) timeSlots["Sore (15:00 - 18:00)"]++;
    else timeSlots["Malam (18:00 - 24:00)"]++;
  }

  let peakTimeSlot = "Malam (18:00 - 24:00)";
  let maxSlotCount = -1;
  for (const [slot, cnt] of Object.entries(timeSlots)) {
    if (cnt > maxSlotCount) {
      maxSlotCount = cnt;
      peakTimeSlot = slot;
    }
  }

  // 5. Total Estimasi Durasi (Rata-rata 3.5 menit per lagu)
  const totalMinutes = Math.round((totalPlays * 210) / 60);

  // 6. Penentuan Persona Musik
  let persona = "🎶 The Melodic Enthusiast";
  let personaDesc = "Anda menikmati musik dengan seimbang di berbagai momen hari.";

  if (timeSlots["Dini Hari (00:00 - 05:00)"] + timeSlots["Malam (18:00 - 24:00)"] > totalPlays * 0.5) {
    persona = "🌙 The Midnight Dreamer";
    personaDesc = "Lagu-lagu pengantar malam dan suasana hening adalah teman setia Anda.";
  } else if (topArtists.length > 0 && topArtists[0].plays > totalPlays * 0.35) {
    persona = `👑 The Devoted ${topArtists[0].artist} Fan`;
    personaDesc = `Kesetiaan Anda pada karya ${topArtists[0].artist} tidak perlu diragukan lagi!`;
  } else if (totalPlays > 50 && topTracks.length >= 5) {
    persona = "✨ The Eclectic Explorer";
    personaDesc = "Selera musik Anda kaya warna dan tidak terikat pada satu musisi saja.";
  }

  return {
    targetName,
    periodLabel,
    totalPlays,
    totalMinutes,
    topTracks,
    topArtists,
    peakTimeSlot,
    persona,
    personaDesc,
  };
}
