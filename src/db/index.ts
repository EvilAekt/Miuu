import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbDir = path.resolve("./data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "bot.db");
export const db = new Database(dbPath);

// Enable WAL mode & high-performance PRAGMA settings for ultra-low latency I/O
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("temp_store = MEMORY");
db.pragma("cache_size = -64000");
db.pragma("mmap_size = 268435456");

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      default_volume INTEGER DEFAULT 50,
      auto_leave_minutes INTEGER DEFAULT 3,
      allowed_role_id TEXT,
      always_on INTEGER DEFAULT 0,
      autoplay INTEGER DEFAULT 0,
      ui_mode TEXT DEFAULT 'classic'
    );
  `);

  try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN autoplay INTEGER DEFAULT 0;");
  } catch {}
  try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN ui_mode TEXT DEFAULT 'classic';");
  } catch {}
  try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN dj_role_id TEXT;");
  } catch {}
  try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN vote_skip_ratio REAL DEFAULT 0.5;");
  } catch {}
  try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN max_queue INTEGER DEFAULT 100;");
  } catch {}
  try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN autoplay_mode TEXT DEFAULT 'campur';");
  } catch {}

  db.exec(`

    CREATE TABLE IF NOT EXISTS track_cache (
      source TEXT NOT NULL,
      source_id TEXT NOT NULL,
      resolved_source TEXT NOT NULL,
      resolved_id TEXT NOT NULL,
      title TEXT NOT NULL,
      duration_ms INTEGER,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (source, source_id)
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      duration_ms INTEGER,
      FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      duration_ms INTEGER
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      source_url TEXT NOT NULL,
      played_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS queue_snapshots (
      guild_id TEXT PRIMARY KEY,
      text_channel_id TEXT,
      voice_channel_id TEXT,
      tracks_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- PRD v2 Section 8: Model data SQLite (Epic 0, E1, E3, E8)
    CREATE TABLE IF NOT EXISTS play_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      result TEXT NOT NULL,
      fail_reason TEXT,
      start_latency_ms INTEGER,
      skipped_at_ms INTEGER,
      played_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS command_usage (
      command_name TEXT PRIMARY KEY,
      use_count INTEGER DEFAULT 0,
      last_used_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_overrides (
      spotify_id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      kind TEXT NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lyrics_cache (
      track_key TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      content TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    -- PRD v3 & v4 Tables
    CREATE TABLE IF NOT EXISTS guilds (
      guild_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      added_by TEXT,
      approved_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      voice_channel_id TEXT NOT NULL,
      bot_id TEXT,
      started_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS demand_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      user_id TEXT,
      detail TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rel_path TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      album TEXT,
      duration_ms INTEGER,
      mtime INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      minutes_spent INTEGER NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scrobble_accounts (
      user_id TEXT NOT NULL,
      service TEXT NOT NULL,
      token_enc TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, service)
    );

    CREATE TABLE IF NOT EXISTS scrobble_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      service TEXT NOT NULL,
      artist TEXT NOT NULL,
      title TEXT NOT NULL,
      album TEXT,
      duration_ms INTEGER,
      played_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS track_transitions (
      from_key TEXT NOT NULL,
      to_key TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (from_key, to_key)
    );

    CREATE TABLE IF NOT EXISTS artist_affinity (
      user_id TEXT NOT NULL,
      artist TEXT NOT NULL,
      completes INTEGER DEFAULT 0,
      skips INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, artist)
    );

    -- PRD v5 Tables (Epic 0, E3, E5, E6)
    CREATE TABLE IF NOT EXISTS review_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_review_at INTEGER,
      next_review_at INTEGER,
      reminder_sent_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS track_prefs (
      track_key TEXT PRIMARY KEY,
      volume_delta INTEGER NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS filter_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      filters_json TEXT NOT NULL,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS resume_positions (
      user_id TEXT NOT NULL,
      item_key TEXT NOT NULL,
      position_ms INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, item_key)
    );

    CREATE TABLE IF NOT EXISTS podcast_feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      feed_url TEXT NOT NULL,
      title TEXT NOT NULL,
      added_by TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_track_cache_lookup ON track_cache(source, source_id);
    CREATE INDEX IF NOT EXISTS idx_history_guild ON history(guild_id, played_at);
    CREATE INDEX IF NOT EXISTS idx_play_log_guild ON play_log(guild_id, played_at);
    CREATE INDEX IF NOT EXISTS idx_health_events_comp ON health_events(component, created_at);
    CREATE INDEX IF NOT EXISTS idx_demand_events_type ON demand_events(type, created_at);
    CREATE INDEX IF NOT EXISTS idx_scrobble_queue_status ON scrobble_queue(status, played_at);
    CREATE INDEX IF NOT EXISTS idx_resume_positions ON resume_positions(user_id, item_key);
    CREATE INDEX IF NOT EXISTS idx_podcast_feeds ON podcast_feeds(guild_id);
  `);
}

// Ensure schema is created immediately on database load
initDatabase();

// Track Cache helpers (PRD Section 6.3 & 9)
export interface TrackCacheEntry {
  source: string;
  source_id: string;
  resolved_source: string;
  resolved_id: string;
  title: string;
  duration_ms: number;
  updated_at: number;
}

const getTrackCacheStmt = db.prepare<[string, string], TrackCacheEntry>(
  "SELECT * FROM track_cache WHERE source = ? AND source_id = ?"
);

const setTrackCacheStmt = db.prepare<[string, string, string, string, string, number, number]>(
  `INSERT INTO track_cache (source, source_id, resolved_source, resolved_id, title, duration_ms, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(source, source_id) DO UPDATE SET
     resolved_source = excluded.resolved_source,
     resolved_id = excluded.resolved_id,
     title = excluded.title,
     duration_ms = excluded.duration_ms,
     updated_at = excluded.updated_at`
);

export function getCachedTrack(source: string, sourceId: string): TrackCacheEntry | undefined {
  return getTrackCacheStmt.get(source, sourceId);
}

export function setCachedTrack(
  source: string,
  sourceId: string,
  resolvedSource: string,
  resolvedId: string,
  title: string,
  durationMs: number
): void {
  setTrackCacheStmt.run(source, sourceId, resolvedSource, resolvedId, title, durationMs, Date.now());
}

// History helper
const insertHistoryStmt = db.prepare<[string, string, string, string, string, number]>(
  "INSERT INTO history (guild_id, user_id, title, artist, source_url, played_at) VALUES (?, ?, ?, ?, ?, ?)"
);

export function recordHistory(
  guildId: string,
  userId: string,
  title: string,
  artist: string,
  sourceUrl: string
): void {
  try {
    insertHistoryStmt.run(guildId, userId, title, artist, sourceUrl, Date.now());
  } catch (err: any) {
    console.warn("[DB] Gagal mencatat riwayat:", err?.message);
  }
}

export function getHistory(guildId: string, limit = 10): any[] {
  return db.prepare("SELECT * FROM history WHERE guild_id = ? ORDER BY played_at DESC LIMIT ?").all(guildId, limit);
}

// Queue Snapshots (PRD Section 15: Antrean pulih setelah restart bot)
export function saveQueueSnapshot(
  guildId: string,
  textChannelId: string,
  voiceChannelId: string,
  tracks: any[]
): void {
  const stmt = db.prepare(`
    INSERT INTO queue_snapshots (guild_id, text_channel_id, voice_channel_id, tracks_json, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      text_channel_id = excluded.text_channel_id,
      voice_channel_id = excluded.voice_channel_id,
      tracks_json = excluded.tracks_json,
      updated_at = excluded.updated_at
  `);
  stmt.run(guildId, textChannelId, voiceChannelId, JSON.stringify(tracks), Date.now());
}

export function getQueueSnapshot(guildId: string): { textChannelId: string; voiceChannelId: string; tracks: any[] } | null {
  const row = db.prepare("SELECT * FROM queue_snapshots WHERE guild_id = ?").get(guildId) as any;
  if (!row) return null;
  try {
    return {
      textChannelId: row.text_channel_id,
      voiceChannelId: row.voice_channel_id,
      tracks: JSON.parse(row.tracks_json),
    };
  } catch {
    return null;
  }
}

export function clearQueueSnapshot(guildId: string): void {
  db.prepare("DELETE FROM queue_snapshots WHERE guild_id = ?").run(guildId);
}

// Playlist Helpers (PRD Section 5.1: /playlist save|play|list|delete)
export function saveCustomPlaylist(ownerUserId: string, name: string, tracks: any[]): number {
  // Delete existing with same name if any
  deleteCustomPlaylist(ownerUserId, name);

  const insertPlaylist = db.prepare("INSERT INTO playlists (owner_user_id, name, created_at) VALUES (?, ?, ?)");
  const info = insertPlaylist.run(ownerUserId, name, Date.now());
  const playlistId = info.lastInsertRowid as number;

  const insertTrack = db.prepare(`
    INSERT INTO playlist_tracks (playlist_id, position, source, source_url, title, artist, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: any[]) => {
    items.forEach((track, idx) => {
      insertTrack.run(
        playlistId,
        idx + 1,
        track.info?.sourceName || track.source || "youtube",
        track.info?.uri || track.source_url || "",
        track.info?.title || track.title || "Unknown",
        track.info?.author || track.artist || "Unknown",
        track.info?.duration || track.duration_ms || 0
      );
    });
  });

  insertMany(tracks);
  return playlistId;
}

export function getCustomPlaylists(ownerUserId: string): any[] {
  return db.prepare(`
    SELECT p.id, p.name, p.created_at, COUNT(t.id) as track_count
    FROM playlists p
    LEFT JOIN playlist_tracks t ON p.id = t.playlist_id
    WHERE p.owner_user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(ownerUserId);
}

export function getCustomPlaylistTracks(ownerUserId: string, name: string): any[] {
  return db.prepare(`
    SELECT t.*
    FROM playlist_tracks t
    JOIN playlists p ON p.id = t.playlist_id
    WHERE p.owner_user_id = ? AND LOWER(p.name) = LOWER(?)
    ORDER BY t.position ASC
  `).all(ownerUserId, name);
}

export function deleteCustomPlaylist(ownerUserId: string, name: string): boolean {
  const info = db.prepare("DELETE FROM playlists WHERE owner_user_id = ? AND LOWER(name) = LOWER(?)").run(ownerUserId, name);
  return info.changes > 0;
}

// Favorites Helpers (PRD Section 5.1: /favorite)
export function addFavoriteTrack(userId: string, track: any): void {
  db.prepare(`
    INSERT INTO favorites (user_id, source, source_url, title, artist, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    track.info?.sourceName || "youtube",
    track.info?.uri || "",
    track.info?.title || "Unknown",
    track.info?.author || "Unknown",
    track.info?.duration || 0
  );
}

export function getFavoriteTracks(userId: string): any[] {
  return db.prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY id DESC").all(userId);
}

export function removeFavoriteTrack(userId: string, id: number): boolean {
  const res = db.prepare("DELETE FROM favorites WHERE user_id = ? AND id = ?").run(userId, id);
  return res.changes > 0;
}

// Autoplay settings (PRD Section 5.1 & 15)
export function getGuildAutoplay(guildId: string): boolean {
  const row = db.prepare("SELECT autoplay FROM guild_settings WHERE guild_id = ?").get(guildId) as any;
  return row ? Boolean(row.autoplay) : false;
}

export function setGuildAutoplay(guildId: string, enabled: boolean): void {
  db.prepare(`
    INSERT INTO guild_settings (guild_id, autoplay) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET autoplay = excluded.autoplay
  `).run(guildId, enabled ? 1 : 0);
}

export function getGuildAutoplayMode(guildId: string): "riwayat" | "campur" | "jelajah" {
  const row = db.prepare("SELECT autoplay_mode FROM guild_settings WHERE guild_id = ?").get(guildId) as any;
  if (row?.autoplay_mode === "riwayat" || row?.autoplay_mode === "jelajah") {
    return row.autoplay_mode;
  }
  return "campur";
}

export function setGuildAutoplayMode(guildId: string, mode: "riwayat" | "campur" | "jelajah"): void {
  db.prepare(`
    INSERT INTO guild_settings (guild_id, autoplay_mode) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET autoplay_mode = excluded.autoplay_mode
  `).run(guildId, mode);
}

// 24/7 Always On Mode Helpers (PRD Section 9 & 15: always_on)
export function getGuildAlwaysOn(guildId: string): boolean {
  const row = db.prepare("SELECT always_on FROM guild_settings WHERE guild_id = ?").get(guildId) as any;
  return row ? Boolean(row.always_on) : false;
}

export function setGuildAlwaysOn(guildId: string, enabled: boolean): void {
  db.prepare(`
    INSERT INTO guild_settings (guild_id, always_on) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET always_on = excluded.always_on
  `).run(guildId, enabled ? 1 : 0);
}

// UI Mode Helpers (PRD Section 8 & 15: classic vs v2)
export function getGuildUiMode(guildId: string): "classic" | "v2" {
  const row = db.prepare("SELECT ui_mode FROM guild_settings WHERE guild_id = ?").get(guildId) as any;
  return (row?.ui_mode === "v2") ? "v2" : "classic";
}

export function setGuildUiMode(guildId: string, mode: "classic" | "v2"): void {
  db.prepare(`
    INSERT INTO guild_settings (guild_id, ui_mode) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET ui_mode = excluded.ui_mode
  `).run(guildId, mode);
}

// ==========================================
// PRD v2 Helpers (Epic 0, E1, E3)
// ==========================================

export interface PlayLogEntry {
  id?: number;
  guild_id: string;
  user_id: string;
  source: string;
  source_url: string;
  title: string;
  artist?: string;
  result: "success" | "failed" | "skipped";
  fail_reason?: string;
  start_latency_ms?: number;
  skipped_at_ms?: number;
  played_at?: number;
}

export function recordPlayLog(entry: PlayLogEntry): void {
  db.prepare(`
    INSERT INTO play_log (guild_id, user_id, source, source_url, title, artist, result, fail_reason, start_latency_ms, skipped_at_ms, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.guild_id,
    entry.user_id,
    entry.source,
    entry.source_url,
    entry.title,
    entry.artist || "Unknown",
    entry.result,
    entry.fail_reason || null,
    entry.start_latency_ms || 0,
    entry.skipped_at_ms || null,
    entry.played_at || Date.now()
  );
}

export function getRecentFailures(guildId: string, hours = 24): any[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return db.prepare(`
    SELECT * FROM play_log
    WHERE guild_id = ? AND result = 'failed' AND played_at >= ?
    ORDER BY played_at DESC
  `).all(guildId, cutoff);
}

export function getPlayLogSummary(guildId: string, days = 7): { total: number; failed: number; skipped: number; success: number } {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const rows = db.prepare(`
    SELECT result, COUNT(*) as count FROM play_log
    WHERE guild_id = ? AND played_at >= ?
    GROUP BY result
  `).all(guildId, cutoff) as Array<{ result: string; count: number }>;

  const summary = { total: 0, failed: 0, skipped: 0, success: 0 };
  for (const r of rows) {
    if (r.result === "failed") summary.failed = r.count;
    else if (r.result === "skipped") summary.skipped = r.count;
    else if (r.result === "success") summary.success = r.count;
    summary.total += r.count;
  }
  return summary;
}

export function incrementCommandUsage(commandName: string): void {
  db.prepare(`
    INSERT INTO command_usage (command_name, use_count, last_used_at)
    VALUES (?, 1, ?)
    ON CONFLICT(command_name) DO UPDATE SET
      use_count = use_count + 1,
      last_used_at = excluded.last_used_at
  `).run(commandName, Date.now());
}

export function getCommandUsageStats(): Array<{ command_name: string; use_count: number; last_used_at: number }> {
  return db.prepare("SELECT * FROM command_usage ORDER BY use_count DESC").all() as any[];
}

export function recordHealthEvent(component: string, status: "ok" | "degraded" | "error", detail?: string): void {
  db.prepare(`
    INSERT INTO health_events (component, status, detail, created_at)
    VALUES (?, ?, ?, ?)
  `).run(component, status, detail || null, Date.now());
}

export function getRecentHealthEvents(limit = 10): Array<{ id: number; component: string; status: string; detail: string; created_at: number }> {
  return db.prepare("SELECT * FROM health_events ORDER BY id DESC LIMIT ?").all(limit) as any[];
}

export function setMatchOverride(spotifyId: string, youtubeId: string, createdBy: string): void {
  db.prepare(`
    INSERT INTO match_overrides (spotify_id, youtube_id, created_by, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(spotify_id) DO UPDATE SET
      youtube_id = excluded.youtube_id,
      created_by = excluded.created_by,
      created_at = excluded.created_at
  `).run(spotifyId, youtubeId, createdBy, Date.now());
}

export function getMatchOverride(spotifyId: string): string | null {
  const row = db.prepare("SELECT youtube_id FROM match_overrides WHERE spotify_id = ?").get(spotifyId) as any;
  return row ? row.youtube_id : null;
}

// Listening Statistics (PRD v2 E4: /stats)
export interface ListeningStats {
  totalPlays: number;
  totalDurationMs: number;
  topTracks: Array<{ title: string; artist: string; plays: number }>;
  topArtists: Array<{ artist: string; plays: number }>;
  topCommands: Array<{ command_name: string; use_count: number }>;
}

export function getListeningStats(guildId: string, userId?: string, days?: number): ListeningStats {
  const params: any[] = [guildId];
  let timeFilter = "";
  if (days && days > 0) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    timeFilter = " AND played_at >= ?";
    params.push(cutoff);
  }

  let userFilter = "";
  if (userId) {
    userFilter = " AND user_id = ?";
    params.push(userId);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM history WHERE guild_id = ?${timeFilter}${userFilter}`).get(...params) as any;
  const totalPlays = countRow?.count || 0;

  const topTracks = db.prepare(`
    SELECT title, artist, COUNT(*) as plays FROM history
    WHERE guild_id = ?${timeFilter}${userFilter}
    GROUP BY title, artist
    ORDER BY plays DESC
    LIMIT 5
  `).all(...params) as Array<{ title: string; artist: string; plays: number }>;

  const topArtists = db.prepare(`
    SELECT artist, COUNT(*) as plays FROM history
    WHERE guild_id = ? AND artist IS NOT NULL AND artist != '' AND artist != 'Unknown'${timeFilter}${userFilter}
    GROUP BY artist
    ORDER BY plays DESC
    LIMIT 5
  `).all(...params) as Array<{ artist: string; plays: number }>;

  const topCommands = db.prepare(`
    SELECT command_name, use_count FROM command_usage
    ORDER BY use_count DESC
    LIMIT 5
  `).all() as Array<{ command_name: string; use_count: number }>;

  const totalDurationMs = totalPlays * 210000;

  return {
    totalPlays,
    totalDurationMs,
    topTracks,
    topArtists,
    topCommands,
  };
}

// PRD v3 E1: Guilds Management & Multi-server
export function setGuildStatus(
  guildId: string,
  name: string,
  status: "pending" | "approved" | "blocked" = "approved",
  addedBy?: string
): void {
  db.prepare(`
    INSERT INTO guilds (guild_id, name, status, added_by, approved_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      name = excluded.name,
      status = excluded.status,
      approved_at = excluded.approved_at
  `).run(guildId, name, status, addedBy || null, status === "approved" ? Date.now() : null);
}

export function isGuildApproved(guildId: string): boolean {
  const row = db.prepare("SELECT status FROM guilds WHERE guild_id = ?").get(guildId) as { status: string } | undefined;
  // Jika belum ada di tabel guilds, default approved untuk kompatibilitas single guild atau cek status
  return !row || row.status === "approved";
}

export function getAllGuilds(): Array<{ guild_id: string; name: string; status: string; approved_at: number }> {
  return db.prepare("SELECT * FROM guilds ORDER BY approved_at DESC").all() as any[];
}

export function getGuildSettingsExtended(guildId: string) {
  const row = db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId) as any;
  return {
    default_volume: row?.default_volume ?? 50,
    auto_leave_minutes: row?.auto_leave_minutes ?? 3,
    allowed_role_id: row?.allowed_role_id || null,
    dj_role_id: row?.dj_role_id || null,
    vote_skip_ratio: row?.vote_skip_ratio ?? 0.5,
    max_queue: row?.max_queue ?? 100,
    autoplay: row?.autoplay ?? 0,
    always_on: row?.always_on ?? 0,
    ui_mode: row?.ui_mode || "classic",
  };
}

export function updateGuildSettings(
  guildId: string,
  updates: {
    default_volume?: number;
    auto_leave_minutes?: number;
    allowed_role_id?: string | null;
    dj_role_id?: string | null;
    vote_skip_ratio?: number;
    max_queue?: number;
  }
): void {
  const current = getGuildSettingsExtended(guildId);
  db.prepare(`
    INSERT INTO guild_settings (guild_id, default_volume, auto_leave_minutes, allowed_role_id, dj_role_id, vote_skip_ratio, max_queue)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      default_volume = excluded.default_volume,
      auto_leave_minutes = excluded.auto_leave_minutes,
      allowed_role_id = excluded.allowed_role_id,
      dj_role_id = excluded.dj_role_id,
      vote_skip_ratio = excluded.vote_skip_ratio,
      max_queue = excluded.max_queue
  `).run(
    guildId,
    updates.default_volume ?? current.default_volume,
    updates.auto_leave_minutes ?? current.auto_leave_minutes,
    updates.allowed_role_id !== undefined ? updates.allowed_role_id : current.allowed_role_id,
    updates.dj_role_id !== undefined ? updates.dj_role_id : current.dj_role_id,
    updates.vote_skip_ratio ?? current.vote_skip_ratio,
    updates.max_queue ?? current.max_queue
  );
}

// PRD v3 Epic 0: Demand Events
export function recordDemandEvent(type: string, guildId: string, userId?: string, detail?: string): void {
  db.prepare(`
    INSERT INTO demand_events (type, guild_id, user_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(type, guildId, userId || null, detail || null, Date.now());
}

export function getDemandEvents(limit = 20): any[] {
  return db.prepare("SELECT * FROM demand_events ORDER BY id DESC LIMIT ?").all(limit);
}

// PRD v4 Epic 0: Maintenance Log
export function recordMaintenanceLog(kind: string, minutesSpent: number, note?: string): void {
  db.prepare(`
    INSERT INTO maintenance_log (kind, minutes_spent, note, created_at)
    VALUES (?, ?, ?, ?)
  `).run(kind, minutesSpent, note || null, Date.now());
}

export function getMaintenanceLogs(kind?: string, limit = 20): any[] {
  if (kind) {
    return db.prepare("SELECT * FROM maintenance_log WHERE kind = ? ORDER BY id DESC LIMIT ?").all(kind, limit);
  }
  return db.prepare("SELECT * FROM maintenance_log ORDER BY id DESC LIMIT ?").all(limit);
}

// PRD v3 E1: /forget (Penghapusan data pribadi pengguna)
export function forgetUserData(userId: string): {
  favoritesDeleted: number;
  playlistsDeleted: number;
  historyDeleted: number;
  scrobbleDeleted: number;
} {
  const favInfo = db.prepare("DELETE FROM favorites WHERE user_id = ?").run(userId);
  const playInfo = db.prepare("DELETE FROM playlists WHERE owner_user_id = ?").run(userId);
  const histInfo = db.prepare("DELETE FROM history WHERE user_id = ?").run(userId);
  const scrobbleAcc = db.prepare("DELETE FROM scrobble_accounts WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM scrobble_queue WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM artist_affinity WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM resume_positions WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM filter_presets WHERE user_id = ?").run(userId);

  return {
    favoritesDeleted: favInfo.changes,
    playlistsDeleted: playInfo.changes,
    historyDeleted: histInfo.changes,
    scrobbleDeleted: scrobbleAcc.changes,
  };
}

// PRD v3 E4: Local Tracks
export function saveLocalTracks(
  tracks: Array<{
    rel_path: string;
    title: string;
    artist?: string;
    album?: string;
    duration_ms?: number;
    mtime: number;
  }>
): void {
  const insertStmt = db.prepare(`
    INSERT INTO local_tracks (rel_path, title, artist, album, duration_ms, mtime)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(rel_path) DO UPDATE SET
      title = excluded.title,
      artist = excluded.artist,
      album = excluded.album,
      duration_ms = excluded.duration_ms,
      mtime = excluded.mtime
  `);

  const tx = db.transaction((items) => {
    for (const t of items) {
      insertStmt.run(t.rel_path, t.title, t.artist || "Unknown", t.album || "Unknown", t.duration_ms || 0, t.mtime);
    }
  });

  tx(tracks);
}

export function searchLocalTracks(query?: string, limit = 25): any[] {
  if (!query || !query.trim()) {
    return db.prepare("SELECT * FROM local_tracks ORDER BY title ASC LIMIT ?").all(limit);
  }
  const term = `%${query.trim()}%`;
  return db
    .prepare("SELECT * FROM local_tracks WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? ORDER BY title ASC LIMIT ?")
    .all(term, term, term, limit);
}

export function getLocalTrackById(id: number): any {
  return db.prepare("SELECT * FROM local_tracks WHERE id = ?").get(id);
}

// PRD v4 E4: Scrobbling (ListenBrainz / Last.fm)
export function setScrobbleToken(userId: string, service: string, token: string): void {
  db.prepare(`
    INSERT INTO scrobble_accounts (user_id, service, token_enc, enabled, created_at)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(user_id, service) DO UPDATE SET
      token_enc = excluded.token_enc,
      enabled = 1
  `).run(userId, service, token, Date.now());
}

export function getScrobbleAccount(userId: string, service: string): { user_id: string; service: string; token_enc: string; enabled: number } | undefined {
  return db.prepare("SELECT * FROM scrobble_accounts WHERE user_id = ? AND service = ?").get(userId, service) as any;
}

export function removeScrobbleAccount(userId: string, service: string): boolean {
  const info = db.prepare("DELETE FROM scrobble_accounts WHERE user_id = ? AND service = ?").run(userId, service);
  return info.changes > 0;
}

export function enqueueScrobble(
  userId: string,
  service: string,
  track: { artist: string; title: string; album?: string; duration_ms?: number; played_at: number }
): void {
  db.prepare(`
    INSERT INTO scrobble_queue (user_id, service, artist, title, album, duration_ms, played_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(userId, service, track.artist, track.title, track.album || null, track.duration_ms || 0, track.played_at);
}

export function getPendingScrobbles(limit = 20): any[] {
  return db.prepare("SELECT * FROM scrobble_queue WHERE status = 'pending' ORDER BY played_at ASC LIMIT ?").all(limit);
}

export function updateScrobbleStatus(id: number, status: "sent" | "failed", incrementAttempt = true): void {
  db.prepare(`
    UPDATE scrobble_queue
    SET status = ?, attempts = attempts + ?
    WHERE id = ?
  `).run(status, incrementAttempt ? 1 : 0, id);
}

// PRD v4 E5: Track Transitions & Artist Affinity
export function recordTrackTransition(fromKey: string, toKey: string): void {
  if (!fromKey || !toKey || fromKey === toKey) return;
  db.prepare(`
    INSERT INTO track_transitions (from_key, to_key, count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(from_key, to_key) DO UPDATE SET
      count = count + 1,
      updated_at = excluded.updated_at
  `).run(fromKey.toLowerCase().trim(), toKey.toLowerCase().trim(), Date.now());
}

export function getTopNextTracks(fromKey: string, limit = 5): Array<{ to_key: string; count: number }> {
  return db
    .prepare("SELECT to_key, count FROM track_transitions WHERE from_key = ? ORDER BY count DESC LIMIT ?")
    .all(fromKey.toLowerCase().trim(), limit) as any[];
}

export function recordArtistAffinity(userId: string, artist: string, completed: boolean): void {
  if (!userId || !artist || artist === "Unknown") return;
  db.prepare(`
    INSERT INTO artist_affinity (user_id, artist, completes, skips, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, artist) DO UPDATE SET
      completes = completes + excluded.completes,
      skips = skips + excluded.skips,
      updated_at = excluded.updated_at
  `).run(userId, artist, completed ? 1 : 0, completed ? 0 : 1, Date.now());
}

// PRD v5 Epic 0 & E3: Review State Helpers
export function getReviewState(): {
  last_review_at: number;
  next_review_at: number;
  reminder_sent_at: number | null;
} | null {
  const row = db.prepare("SELECT * FROM review_state WHERE id = 1").get() as any;
  if (!row) return null;
  return {
    last_review_at: row.last_review_at,
    next_review_at: row.next_review_at,
    reminder_sent_at: row.reminder_sent_at || null,
  };
}

export function setReviewState(
  lastReviewAt: number,
  nextReviewAt: number,
  reminderSentAt?: number | null
): void {
  db.prepare(`
    INSERT INTO review_state (id, last_review_at, next_review_at, reminder_sent_at)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      last_review_at = excluded.last_review_at,
      next_review_at = excluded.next_review_at,
      reminder_sent_at = excluded.reminder_sent_at
  `).run(lastReviewAt, nextReviewAt, reminderSentAt ?? null);
}

// PRD v5 E5: Track Volume Preferences (Per-track Volume Memory)
export function getTrackVolumePref(trackKey: string): number | null {
  const row = db
    .prepare("SELECT volume_delta FROM track_prefs WHERE track_key = ?")
    .get(trackKey.toLowerCase().trim()) as any;
  return row ? row.volume_delta : null;
}

export function setTrackVolumePref(trackKey: string, volumeDelta: number, userId: string): void {
  db.prepare(`
    INSERT INTO track_prefs (track_key, volume_delta, updated_by, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(track_key) DO UPDATE SET
      volume_delta = excluded.volume_delta,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).run(trackKey.toLowerCase().trim(), volumeDelta, userId, Date.now());
}

// PRD v5 E5: Filter Presets
export function saveFilterPreset(userId: string, name: string, filtersJson: string): void {
  db.prepare(`
    INSERT INTO filter_presets (user_id, name, filters_json)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, name) DO UPDATE SET
      filters_json = excluded.filters_json
  `).run(userId, name.toLowerCase().trim(), filtersJson);
}

export function getFilterPreset(userId: string, name: string): string | null {
  const row = db
    .prepare("SELECT filters_json FROM filter_presets WHERE user_id = ? AND name = ?")
    .get(userId, name.toLowerCase().trim()) as any;
  return row ? row.filters_json : null;
}

export function listFilterPresets(userId: string): Array<{ name: string; filters_json: string }> {
  return db
    .prepare("SELECT name, filters_json FROM filter_presets WHERE user_id = ? ORDER BY name ASC")
    .all(userId) as any[];
}

export function deleteFilterPreset(userId: string, name: string): boolean {
  const res = db
    .prepare("DELETE FROM filter_presets WHERE user_id = ? AND name = ?")
    .run(userId, name.toLowerCase().trim());
  return res.changes > 0;
}

// PRD v5 E6: Long Content Resume Positions
export function saveResumePosition(
  userId: string,
  itemKey: string,
  positionMs: number,
  durationMs: number
): void {
  // Jika sudah 95% tuntas, hapus posisi
  if (durationMs > 0 && positionMs / durationMs >= 0.95) {
    clearResumePosition(userId, itemKey);
    return;
  }

  db.prepare(`
    INSERT INTO resume_positions (user_id, item_key, position_ms, duration_ms, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, item_key) DO UPDATE SET
      position_ms = excluded.position_ms,
      duration_ms = excluded.duration_ms,
      updated_at = excluded.updated_at
  `).run(userId, itemKey.toLowerCase().trim(), positionMs, durationMs, Date.now());
}

export function getResumePosition(
  userId: string,
  itemKey: string
): { position_ms: number; duration_ms: number; updated_at: number } | null {
  const row = db
    .prepare("SELECT position_ms, duration_ms, updated_at FROM resume_positions WHERE user_id = ? AND item_key = ?")
    .get(userId, itemKey.toLowerCase().trim()) as any;
  return row || null;
}

export function clearResumePosition(userId: string, itemKey: string): void {
  db.prepare("DELETE FROM resume_positions WHERE user_id = ? AND item_key = ?").run(
    userId,
    itemKey.toLowerCase().trim()
  );
}

export function cleanupOldResumePositions(maxAgeDays = 90): number {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const res = db.prepare("DELETE FROM resume_positions WHERE updated_at < ?").run(cutoff);
  return res.changes;
}

// PRD v5 E6: Podcast Feeds
export function addPodcastFeed(
  guildId: string,
  feedUrl: string,
  title: string,
  addedBy: string
): number {
  const res = db.prepare(`
    INSERT INTO podcast_feeds (guild_id, feed_url, title, added_by)
    VALUES (?, ?, ?, ?)
  `).run(guildId, feedUrl, title, addedBy);
  return Number(res.lastInsertRowid);
}

export function listPodcastFeeds(
  guildId: string
): Array<{ id: number; feed_url: string; title: string; added_by: string }> {
  return db
    .prepare("SELECT id, feed_url, title, added_by FROM podcast_feeds WHERE guild_id = ? ORDER BY id DESC")
    .all(guildId) as any[];
}

export function removePodcastFeed(guildId: string, id: number): boolean {
  const res = db.prepare("DELETE FROM podcast_feeds WHERE guild_id = ? AND id = ?").run(guildId, id);
  return res.changes > 0;
}

// PRD v5 E1: Pruning / Data Retention
export function pruneDatabaseData(retentionDays = 180): {
  playLogDeleted: number;
  healthDeleted: number;
  demandDeleted: number;
  maintenanceDeleted: number;
} {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const playLog = db.prepare("DELETE FROM play_log WHERE played_at < ?").run(cutoff);
  const health = db.prepare("DELETE FROM health_events WHERE created_at < ?").run(cutoff);
  const demand = db.prepare("DELETE FROM demand_events WHERE created_at < ?").run(cutoff);
  const maintenance = db.prepare("DELETE FROM maintenance_log WHERE created_at < ?").run(cutoff);

  try {
    db.exec("VACUUM;");
  } catch {}

  return {
    playLogDeleted: playLog.changes,
    healthDeleted: health.changes,
    demandDeleted: demand.changes,
    maintenanceDeleted: maintenance.changes,
  };
}
