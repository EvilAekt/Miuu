// Provide fallback env if running without .env loaded
process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "mock_token";
process.env.GUILD_ID = process.env.GUILD_ID || "123456789";
process.env.LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD || "youshallnotpass";

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  recordHistory,
  getListeningStats,
  saveCustomPlaylist,
  getCustomPlaylistTracks,
  incrementCommandUsage,
} from "../src/db/index.js";
import { cleanTrackTitle, parseLrcLyrics } from "../src/lyrics/lyricsService.js";
import { isRadioActive, stopRadio } from "../src/recommend/radio.js";
import { startDashboardServer } from "../src/web/server.js";

test("PRD v2 E4 - getListeningStats calculates server & user music statistics", () => {
  const testGuild = "guild_stats_" + Date.now();
  const testUser = "user_stats_123";

  // Insert test history data
  recordHistory(testGuild, testUser, "Cincin", "Hindia", "https://youtube.com/watch?v=111");
  recordHistory(testGuild, testUser, "Cincin", "Hindia", "https://youtube.com/watch?v=111");
  recordHistory(testGuild, testUser, "Evaluasi", "Hindia", "https://youtube.com/watch?v=222");
  recordHistory(testGuild, "other_user", "Rumah Ke Rumah", "Hindia", "https://youtube.com/watch?v=333");

  incrementCommandUsage("stats");
  incrementCommandUsage("play");

  // Query server stats
  const serverStats = getListeningStats(testGuild);
  assert.equal(serverStats.totalPlays, 4);
  assert.ok(serverStats.totalDurationMs > 0);
  assert.equal(serverStats.topTracks[0].title, "Cincin");
  assert.equal(serverStats.topTracks[0].plays, 2);
  assert.equal(serverStats.topArtists[0].artist, "Hindia");

  // Query user stats
  const userStats = getListeningStats(testGuild, testUser);
  assert.equal(userStats.totalPlays, 3);
  assert.equal(userStats.topTracks[0].title, "Cincin");
});

test("PRD v2 E4 - playlist export and import roundtrip preserves track structure", () => {
  const userId = "user_export_import_" + Date.now();
  const playlistName = "My LoFi Vibes";

  const originalTracks = [
    {
      title: "Rainy Afternoon",
      artist: "ChilledCow",
      source_url: "https://youtube.com/watch?v=lofi1",
      duration_ms: 180000,
    },
    {
      title: "Night Study",
      artist: "Lofi Girl",
      source_url: "https://youtube.com/watch?v=lofi2",
      duration_ms: 210000,
    },
  ];

  // 1. Simpan (Save)
  saveCustomPlaylist(userId, playlistName, originalTracks);

  // 2. Ambil untuk diekspor (Export)
  const exportedTracks = getCustomPlaylistTracks(userId, playlistName);
  assert.equal(exportedTracks.length, 2);
  assert.equal(exportedTracks[0].title, "Rainy Afternoon");
  assert.equal(exportedTracks[1].artist, "Lofi Girl");

  // 3. Simulasikan format file JSON yang diekspor dan diimpor kembali ke playlist baru
  const importedName = "Imported LoFi";
  saveCustomPlaylist(userId, importedName, exportedTracks);

  const importedTracks = getCustomPlaylistTracks(userId, importedName);
  assert.equal(importedTracks.length, 2);
  assert.equal(importedTracks[0].title, "Rainy Afternoon");
  assert.equal(importedTracks[1].source_url, "https://youtube.com/watch?v=lofi2");
});

test("PRD v2 E5 - Radio session state management and stopping", () => {
  const guildId = "guild_radio_" + Date.now();
  assert.equal(isRadioActive(guildId), false);

  stopRadio(guildId);
  assert.equal(isRadioActive(guildId), false);
});

test("PRD v2 E8 - cleanTrackTitle removes metadata suffixes and ft credits", () => {
  const raw1 = "Hindia - Cincin (Official Lyric Video)";
  assert.equal(cleanTrackTitle(raw1), "Hindia - Cincin");

  const raw2 = "Song Name [Official Visualizer] feat. Someone";
  assert.equal(cleanTrackTitle(raw2), "Song Name");

  const raw3 = "Awesome Track (Remastered 2024)";
  assert.equal(cleanTrackTitle(raw3), "Awesome Track");
});

test("PRD v2 E8 & E9 - parseLrcLyrics parses LRC timestamp format correctly", () => {
  const sampleLrc = `
[00:12.50] Di atas meja kita berdansa
[00:18.20] Menghabiskan sisa malam
[01:05.00] Sampai pagi menjelang
`;

  const parsed = parseLrcLyrics(sampleLrc);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].time, 12500);
  assert.equal(parsed[0].text, "Di atas meja kita berdansa");
  assert.equal(parsed[1].time, 18200);
  assert.equal(parsed[2].time, 65000);
  assert.equal(parsed[2].text, "Sampai pagi menjelang");
});

test("PRD v2 E9 - Local Web Dashboard binds to 127.0.0.1 and responds to /api/status and /", async () => {
  const mockClient: any = {
    isReady: () => true,
    user: { username: "TestBot" },
    ws: { ping: 42 },
    guilds: {
      cache: {
        size: 1,
        first: () => ({ id: "guild_test_mock" }),
        values: () => [{ id: "guild_test_mock" }][Symbol.iterator](),
      },
    },
  };

  // Gunakan port 0 (ephemeral port) agar tidak terjadi konflik EADDRINUSE
  const server = startDashboardServer(mockClient, { port: 0, host: "127.0.0.1" });

  await new Promise<void>((resolve) => {
    if (server.listening) resolve();
    else server.once("listening", resolve);
  });

  const address = server.address() as any;
  const actualPort = address.port;

  try {
    // 1. Test GET /
    const htmlRes = await fetch(`http://127.0.0.1:${actualPort}/`);
    assert.equal(htmlRes.status, 200);
    const htmlText = await htmlRes.text();
    assert.ok(htmlText.includes("Discord Music Bot"));
    assert.ok(htmlText.includes("Live Synced Lyrics"));

    // 2. Test GET /api/status
    const apiRes = await fetch(`http://127.0.0.1:${actualPort}/api/status`);
    assert.equal(apiRes.status, 200);
    const apiJson = (await apiRes.json()) as any;
    assert.equal(apiJson.botName, "TestBot");
    assert.equal(apiJson.connected, true);
    assert.equal(apiJson.ping, 42);
    assert.ok(apiJson.stats !== undefined);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
});
