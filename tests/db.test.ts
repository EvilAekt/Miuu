import test from "node:test";
import assert from "node:assert/strict";
import {
  setCachedTrack,
  getCachedTrack,
  recordHistory,
  getHistory,
  saveQueueSnapshot,
  getQueueSnapshot,
  clearQueueSnapshot,
  saveCustomPlaylist,
  getCustomPlaylists,
  getCustomPlaylistTracks,
  deleteCustomPlaylist,
  addFavoriteTrack,
  getFavoriteTracks,
  removeFavoriteTrack,
  getGuildAutoplay,
  setGuildAutoplay,
  getGuildAlwaysOn,
  setGuildAlwaysOn,
  getGuildUiMode,
  setGuildUiMode,
  recordPlayLog,
  getRecentFailures,
  getPlayLogSummary,
  incrementCommandUsage,
  getCommandUsageStats,
  recordHealthEvent,
  getRecentHealthEvents,
  setMatchOverride,
  getMatchOverride,
  db,
} from "../src/db/index.js";

test("db - track caching set and get", () => {
  const source = "spotify";
  const sourceId = "test-track-123";
  const resolvedSource = "youtube";
  const resolvedId = "dQw4w9WgXcQ";
  const title = "Never Gonna Give You Up";
  const durationMs = 213000;

  setCachedTrack(source, sourceId, resolvedSource, resolvedId, title, durationMs);
  const cached = getCachedTrack(source, sourceId);

  assert.ok(cached);
  assert.equal(cached.source, source);
  assert.equal(cached.source_id, sourceId);
  assert.equal(cached.resolved_id, resolvedId);
  assert.equal(cached.title, title);
});

test("db - track caching update on conflict", () => {
  const source = "spotify";
  const sourceId = "test-track-123";
  const newResolvedId = "new_youtube_id_999";

  setCachedTrack(source, sourceId, "youtube", newResolvedId, "Updated Title", 215000);
  const cached = getCachedTrack(source, sourceId);

  assert.ok(cached);
  assert.equal(cached.resolved_id, newResolvedId);
  assert.equal(cached.title, "Updated Title");
});

test("db - history recording and retrieval", () => {
  recordHistory("guild_test_1", "user_456", "Song Title 1", "Artist 1", "https://youtube.com/watch?v=1");
  recordHistory("guild_test_1", "user_456", "Song Title 2", "Artist 2", "https://youtube.com/watch?v=2");

  const list = getHistory("guild_test_1", 10);
  assert.ok(list.length >= 2);
  assert.equal(list[0].title, "Song Title 2");
});

test("db - queue snapshot save, get, and clear", () => {
  const guildId = "guild_snap_test";
  const tracks = [
    { info: { title: "Track A", author: "Artist A", uri: "https://youtube.com/a" } },
    { info: { title: "Track B", author: "Artist B", uri: "https://youtube.com/b" } },
  ];

  saveQueueSnapshot(guildId, "txt_1", "vc_1", tracks);
  const snap = getQueueSnapshot(guildId);

  assert.ok(snap);
  assert.equal(snap.textChannelId, "txt_1");
  assert.equal(snap.voiceChannelId, "vc_1");
  assert.equal(snap.tracks.length, 2);
  assert.equal(snap.tracks[0].info.title, "Track A");

  clearQueueSnapshot(guildId);
  assert.equal(getQueueSnapshot(guildId), null);
});

test("db - custom playlist CRUD", () => {
  const userId = "user_playlist_test";
  const name = "My Chill Mix";
  const tracks = [
    { info: { title: "Chill Track 1", author: "Lofi", uri: "https://youtube.com/c1", duration: 120000 } },
    { info: { title: "Chill Track 2", author: "Lofi", uri: "https://youtube.com/c2", duration: 130000 } },
  ];

  const id = saveCustomPlaylist(userId, name, tracks);
  assert.ok(id > 0);

  const playlists = getCustomPlaylists(userId);
  assert.ok(playlists.some((p) => p.name === name && p.track_count === 2));

  const savedTracks = getCustomPlaylistTracks(userId, name);
  assert.equal(savedTracks.length, 2);
  assert.equal(savedTracks[0].title, "Chill Track 1");

  const deleted = deleteCustomPlaylist(userId, name);
  assert.equal(deleted, true);
  assert.equal(getCustomPlaylistTracks(userId, name).length, 0);
});

test("db - favorites add, list, and remove", () => {
  const userId = "user_fav_test";
  const track = {
    info: {
      sourceName: "youtube",
      uri: "https://youtube.com/fav1",
      title: "Fav Track 1",
      author: "Artist Fav",
      duration: 180000,
    },
  };

  addFavoriteTrack(userId, track);
  const favs = getFavoriteTracks(userId);
  assert.ok(favs.length > 0);
  assert.equal(favs[0].title, "Fav Track 1");

  const removed = removeFavoriteTrack(userId, favs[0].id);
  assert.equal(removed, true);
});

test("db - autoplay settings toggle", () => {
  const guildId = "guild_autoplay_test";
  assert.equal(getGuildAutoplay(guildId), false);

  setGuildAutoplay(guildId, true);
  assert.equal(getGuildAutoplay(guildId), true);

  setGuildAutoplay(guildId, false);
  assert.equal(getGuildAutoplay(guildId), false);
});

test("db - 24/7 always_on settings toggle", () => {
  const guildId = "guild_always_on_test";
  assert.equal(getGuildAlwaysOn(guildId), false);

  setGuildAlwaysOn(guildId, true);
  assert.equal(getGuildAlwaysOn(guildId), true);

  setGuildAlwaysOn(guildId, false);
  assert.equal(getGuildAlwaysOn(guildId), false);
});

test("db - ui_mode default and toggle", () => {
  const guildId = "guild_ui_mode_test";
  assert.equal(getGuildUiMode(guildId), "classic");

  setGuildUiMode(guildId, "v2");
  assert.equal(getGuildUiMode(guildId), "v2");

  setGuildUiMode(guildId, "classic");
  assert.equal(getGuildUiMode(guildId), "classic");
});

test("db - play_log recording and failure query", () => {
  const guildId = "guild_play_log_test_" + Date.now();
  recordPlayLog({
    guild_id: guildId,
    user_id: "user1",
    source: "youtube",
    source_url: "https://youtube.com/track1",
    title: "Track Success",
    artist: "Artist 1",
    result: "success",
  });

  recordPlayLog({
    guild_id: guildId,
    user_id: "user1",
    source: "spotify",
    source_url: "https://spotify.com/track2",
    title: "Track Failed",
    artist: "Artist 2",
    result: "failed",
    fail_reason: "Cipher decipher failed",
  });

  const failures = getRecentFailures(guildId, 24);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].title, "Track Failed");

  const summary = getPlayLogSummary(guildId, 7);
  assert.equal(summary.success, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.total, 2);
});

test("db - command_usage increment and stats", () => {
  incrementCommandUsage("play");
  incrementCommandUsage("play");
  incrementCommandUsage("queue");

  const stats = getCommandUsageStats();
  const playStat = stats.find((s) => s.command_name === "play");
  assert.ok(playStat);
  assert.ok(playStat.use_count >= 2);
});

test("db - health_events logging and query", () => {
  recordHealthEvent("lavalink", "ok", "Node test connected");
  recordHealthEvent("youtube", "degraded", "High latency canary");

  const events = getRecentHealthEvents(5);
  assert.ok(events.length >= 2);
  assert.equal(events[0].component, "youtube");
});

test("db - match_overrides persistence", () => {
  const spotifyId = "sp_override_123";
  const youtubeId = "yt_match_456";

  setMatchOverride(spotifyId, youtubeId, "admin_user");
  assert.equal(getMatchOverride(spotifyId), youtubeId);
});


