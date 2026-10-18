// Fallback environment
process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "mock_token";
process.env.GUILD_ID = process.env.GUILD_ID || "123456789";
process.env.LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD || "youshallnotpass";

import test from "node:test";
import assert from "node:assert/strict";
import {
  setGuildStatus,
  isGuildApproved,
  getAllGuilds,
  getGuildSettingsExtended,
  updateGuildSettings,
  forgetUserData,
  recordDemandEvent,
  getDemandEvents,
  saveLocalTracks,
  searchLocalTracks,
  setScrobbleToken,
  getScrobbleAccount,
  enqueueScrobble,
  getPendingScrobbles,
  updateScrobbleStatus,
  recordTrackTransition,
  getTopNextTracks,
  recordArtistAffinity,
  db,
} from "../src/db/index.js";
import { registerSession, unregisterSession, MAX_CONCURRENT_SESSIONS } from "../src/sessions/sessionManager.js";
import { validateSafePath } from "../src/library/indexer.js";
import { parseInput } from "../src/resolvers/parseInput.js";
import { startDashboardServer } from "../src/web/server.js";

test("PRD v3 E1 - Guilds Approval & Multi-Server Isolation", () => {
  const testGuild1 = "guild_approved_" + Date.now();
  const testGuild2 = "guild_pending_" + Date.now();

  setGuildStatus(testGuild1, "Approved Server", "approved");
  setGuildStatus(testGuild2, "Pending Server", "pending");

  assert.equal(isGuildApproved(testGuild1), true);
  assert.equal(isGuildApproved(testGuild2), false);

  const guilds = getAllGuilds();
  assert.ok(guilds.some((g) => g.guild_id === testGuild1));
  assert.ok(guilds.some((g) => g.guild_id === testGuild2));
});

test("PRD v3 E1 - SessionManager enforces concurrency limit and busy rejection", () => {
  const g1 = "guild_session_1_" + Date.now();
  const g2 = "guild_session_2_" + Date.now();
  const g3 = "guild_session_3_" + Date.now();
  const g4 = "guild_session_4_" + Date.now();

  // Bersihkan sesi aktif sebelumnya
  unregisterSession(g1);
  unregisterSession(g2);
  unregisterSession(g3);
  unregisterSession(g4);

  const res1 = registerSession(g1, "vc1", "tc1");
  const res2 = registerSession(g2, "vc2", "tc2");
  const res3 = registerSession(g3, "vc3", "tc3");

  assert.equal(res1.allowed, true);
  assert.equal(res2.allowed, true);
  assert.equal(res3.allowed, true);

  // Sesi ke-4 harus ditolak karena melebihi MAX_CONCURRENT_SESSIONS (3)
  const res4 = registerSession(g4, "vc4", "tc4");
  assert.equal(res4.allowed, false);
  assert.ok(res4.reason?.includes("Batas maksimal"));

  // Sesi di VC lain dalam guild yang sama juga ditolak
  const resBusy = registerSession(g1, "vc_other", "tc1");
  assert.equal(resBusy.allowed, false);
  assert.ok(resBusy.reason?.includes("Voice Channel lain"));

  // Cleanup
  unregisterSession(g1);
  unregisterSession(g2);
  unregisterSession(g3);
});

test("PRD v3 E1 - Guild Settings Extended (DJ role, vote skip ratio, max queue)", () => {
  const guildId = "guild_settings_test_" + Date.now();

  updateGuildSettings(guildId, {
    default_volume: 75,
    auto_leave_minutes: 5,
    dj_role_id: "role_dj_999",
    vote_skip_ratio: 0.6,
    max_queue: 150,
  });

  const settings = getGuildSettingsExtended(guildId);
  assert.equal(settings.default_volume, 75);
  assert.equal(settings.auto_leave_minutes, 5);
  assert.equal(settings.dj_role_id, "role_dj_999");
  assert.equal(settings.vote_skip_ratio, 0.6);
  assert.equal(settings.max_queue, 150);
});

test("PRD v3 E1 - forgetUserData cleans all personal user data", () => {
  const userId = "user_forget_" + Date.now();

  db.prepare("INSERT INTO favorites (user_id, source, source_url, title) VALUES (?, ?, ?, ?)").run(
    userId,
    "youtube",
    "https://yt.com/1",
    "Track 1"
  );
  db.prepare("INSERT INTO playlists (owner_user_id, name, created_at) VALUES (?, ?, ?)").run(userId, "PL 1", Date.now());
  setScrobbleToken(userId, "listenbrainz", "test_token_123");

  const result = forgetUserData(userId);
  assert.equal(result.favoritesDeleted, 1);
  assert.equal(result.playlistsDeleted, 1);
  assert.equal(result.scrobbleDeleted, 1);

  // Verifikasi token scrobble hilang
  const acc = getScrobbleAccount(userId, "listenbrainz");
  assert.equal(acc, undefined);
});

test("PRD v3 E4 - validateSafePath prevents path traversal attacks", () => {
  // Path normal diizinkan
  const safe = validateSafePath("rock/song.mp3");
  assert.ok(safe.includes("rock"));

  // Path traversal harus ditolak
  assert.throws(() => {
    validateSafePath("../../../Windows/System32/drivers/etc/hosts");
  }, /Akses path dilarang/);
});

test("PRD v4 E4 - Scrobble queue and account storage", () => {
  const userId = "user_scrobble_" + Date.now();
  setScrobbleToken(userId, "listenbrainz", "token_lb_abc");

  const acc = getScrobbleAccount(userId, "listenbrainz");
  assert.ok(acc);
  assert.equal(acc.token_enc, "token_lb_abc");

  enqueueScrobble(userId, "listenbrainz", {
    artist: "Hindia",
    title: "Cincin",
    album: "Menari Dengan Bayangan",
    duration_ms: 210000,
    played_at: Date.now(),
  });

  const pending = getPendingScrobbles(10);
  const found = pending.find((p) => p.user_id === userId);
  assert.ok(found);
  assert.equal(found.title, "Cincin");

  updateScrobbleStatus(found.id, "sent");
});

test("PRD v4 E5 - Track Transitions and Artist Affinity recording", () => {
  const from = "hindia - cincin";
  const to = "hindia - evaluasi";

  recordTrackTransition(from, to);
  recordTrackTransition(from, to);

  const topNext = getTopNextTracks(from, 5);
  assert.ok(topNext.length > 0);
  assert.equal(topNext[0].to_key, to);
  assert.ok(topNext[0].count >= 2);

  const userId = "user_affinity_" + Date.now();
  recordArtistAffinity(userId, "Hindia", true);
  recordArtistAffinity(userId, "Hindia", false);

  const row = db.prepare("SELECT * FROM artist_affinity WHERE user_id = ? AND artist = ?").get(userId, "Hindia") as any;
  assert.equal(row.completes, 1);
  assert.equal(row.skips, 1);
});

test("PRD v4 E6 & E7 - Bandcamp URL recognition & PWA Manifest Endpoint", async () => {
  // Test Bandcamp input resolver
  const bandcampUrl = "https://chillhop.bandcamp.com/track/daydream";
  const parsed = parseInput(bandcampUrl);
  assert.equal(parsed.source, "bandcamp");
  assert.equal((parsed as any).url, bandcampUrl);

  // Test PWA Manifest
  const mockClient: any = {
    isReady: () => true,
    user: { username: "MiuBot" },
    ws: { ping: 25 },
    guilds: { cache: { size: 1, first: () => ({ id: "g1" }), values: () => [].values() } },
  };

  const server = startDashboardServer(mockClient, { port: 0, host: "127.0.0.1" });
  await new Promise<void>((r) => (server.listening ? r() : server.once("listening", r)));
  const port = (server.address() as any).port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/manifest.json`);
    assert.equal(res.status, 200);
    const manifest = (await res.json()) as any;
    assert.equal(manifest.name, "Discord Music Bot Controller");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.theme_color, "#6366f1");
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});
