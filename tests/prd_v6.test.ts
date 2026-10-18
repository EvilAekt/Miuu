import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startSleepTimer, cancelSleepTimer, getSleepTimer } from "../src/timer/sleepTimerManager.js";
import { generateMoodPlaylist } from "../src/ai/moodCurator.js";
import {
  createDatabaseBackup,
  listDatabaseBackups,
  rotateBackups,
  restoreDatabaseBackup,
} from "../src/backup/backupManager.js";

test("PRD v6 E1 - sleepTimerManager sets, reads, and cancels timer properly", () => {
  const guildId = "test-guild-sleeptimer";
  let volumeChangedTo = 100;
  let finished = false;

  const session = startSleepTimer(
    guildId,
    30, // 30 minutes
    () => 100,
    (v) => { volumeChangedTo = v; },
    () => { finished = true; }
  );

  assert.ok(session.endsAt instanceof Date);
  assert.equal(session.durationMinutes, 30);

  const active = getSleepTimer(guildId);
  assert.ok(active !== null);
  assert.equal(active?.durationMinutes, 30);
  assert.ok(active?.remainingSeconds > 0);

  const cancelled = cancelSleepTimer(guildId);
  assert.equal(cancelled, true);

  const afterCancel = getSleepTimer(guildId);
  assert.equal(afterCancel, null);
});

test("PRD v6 E3 - moodCurator provides structured track recommendations", async () => {
  // Test heuristic fallback
  const res = await generateMoodPlaylist("coding santai malam hari dengan lofi", 3);
  assert.ok(res.tracks.length > 0);
  assert.ok(res.tracks.length <= 3);

  const first = res.tracks[0];
  assert.ok(typeof first.title === "string" && first.title.length > 0);
  assert.ok(typeof first.artist === "string" && first.artist.length > 0);
  assert.ok(typeof first.reason === "string");
});

test("PRD v6 E5 - backupManager creates, lists, rotates, and prevents path traversal", async () => {
  // Pastikan data dir dan db dummy ada
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbFile = path.resolve(dataDir, "musicbot.db");
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "sqlite dummy content for test");

  // Create backup
  const backup = await createDatabaseBackup("unittest");
  assert.ok(backup.filename.includes("unittest"));
  assert.ok(fs.existsSync(backup.path));
  assert.ok(backup.sizeBytes > 0);

  // List backups
  const list = listDatabaseBackups();
  assert.ok(list.length > 0);
  assert.ok(list.some((b) => b.filename === backup.filename));

  // Rotate backups
  rotateBackups(10);

  // Path traversal prevention
  await assert.rejects(
    async () => {
      await restoreDatabaseBackup("../../etc/passwd");
    },
    { message: /path traversal/i }
  );

  // Path absolute prevention
  await assert.rejects(
    async () => {
      await restoreDatabaseBackup("C:\\Windows\\System32\\cmd.exe");
    },
    { message: /path traversal/i }
  );
});
