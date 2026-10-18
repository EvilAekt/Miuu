// tests/queue_session_robustness.test.ts: Pengujian Konkurensi Sesi dan Integritas Antrean T3
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerSession,
  unregisterSession,
  getAllActiveSessions,
  MAX_CONCURRENT_SESSIONS,
} from "../src/sessions/sessionManager.js";
import { saveQueueSnapshot, getQueueSnapshot, clearQueueSnapshot, db } from "../src/db/index.js";
import { makeTrack } from "./helpers/factories.js";

test("T3 Queue & Session - should allow first session and reuse when same VC re-registers", () => {
  const guildId = "guild-session-1";
  const vcId = "voice-1";

  unregisterSession(guildId);

  const res1 = registerSession(guildId, vcId, "text-1", "user-1");
  assert.equal(res1.allowed, true);
  assert.ok(res1.session);

  // Same VC registration should succeed and reuse session
  const res2 = registerSession(guildId, vcId, "text-2", "user-2");
  assert.equal(res2.allowed, true);
  assert.equal(res2.session?.sessionId, res1.session?.sessionId);

  unregisterSession(guildId);
});

test("T3 Queue & Session - should reject session when guild already has active player in another VC", () => {
  const guildId = "guild-session-multi-vc";
  unregisterSession(guildId);

  const res1 = registerSession(guildId, "voice-room-a", "text-1", "user-1");
  assert.equal(res1.allowed, true);

  // Different VC in same guild should be rejected (1 bot per guild limit)
  const res2 = registerSession(guildId, "voice-room-b", "text-2", "user-2");
  assert.equal(res2.allowed, false);
  assert.ok(res2.reason?.includes("Voice Channel lain"));

  unregisterSession(guildId);
});

test("T3 Queue & Session - should enforce global max concurrent sessions limit of 3", () => {
  // Clear all sessions
  for (const s of getAllActiveSessions()) {
    unregisterSession(s.guildId);
  }

  // Register 3 different guilds
  const r1 = registerSession("guild-conc-1", "vc-1", "tx-1");
  const r2 = registerSession("guild-conc-2", "vc-2", "tx-2");
  const r3 = registerSession("guild-conc-3", "vc-3", "tx-3");

  assert.equal(r1.allowed, true);
  assert.equal(r2.allowed, true);
  assert.equal(r3.allowed, true);

  // 4th guild must be rejected
  const r4 = registerSession("guild-conc-4", "vc-4", "tx-4");
  assert.equal(r4.allowed, false);
  assert.ok(r4.reason?.includes(`Batas maksimal pemutaran bersamaan (${MAX_CONCURRENT_SESSIONS} sesi)`));

  // Cleanup
  unregisterSession("guild-conc-1");
  unregisterSession("guild-conc-2");
  unregisterSession("guild-conc-3");
});

test("T3 Queue & Session - should record busy_rejected events in demand_events table", () => {
  const guildId = "guild-demand-log";
  unregisterSession(guildId);

  registerSession(guildId, "vc-orig", "text-1", "user-orig");
  registerSession(guildId, "vc-denied", "text-2", "user-denied");

  const row = db
    .prepare("SELECT * FROM demand_events WHERE guild_id = ? AND type = 'busy_rejected' ORDER BY created_at DESC LIMIT 1")
    .get(guildId) as any;

  assert.ok(row);
  assert.equal(row.type, "busy_rejected");
  assert.equal(row.user_id, "user-denied");

  unregisterSession(guildId);
});

test("T3 Queue & Session - should preserve order and track metadata across queue snapshot save and restore", () => {
  const guildId = "guild-snapshot-robustness";
  const tracks = [
    makeTrack({ title: "First Track", author: "Artist A" }),
    makeTrack({ title: "Second Track", author: "Artist B" }),
    makeTrack({ title: "Third Track", author: "Artist C" }),
  ];

  saveQueueSnapshot(guildId, "text-ch", "voice-ch", tracks);

  const snapshot = getQueueSnapshot(guildId);
  assert.ok(snapshot);
  assert.equal(snapshot.tracks.length, 3);
  assert.equal(snapshot.tracks[0].info.title, "First Track");
  assert.equal(snapshot.tracks[1].info.title, "Second Track");
  assert.equal(snapshot.tracks[2].info.title, "Third Track");

  clearQueueSnapshot(guildId);
  assert.equal(getQueueSnapshot(guildId), null);
});
