// Fallback environment
process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "mock_token";
process.env.GUILD_ID = process.env.GUILD_ID || "123456789";
process.env.LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD || "youshallnotpass";

import test from "node:test";
import assert from "node:assert/strict";
import {
  getReviewState,
  setReviewState,
  getTrackVolumePref,
  setTrackVolumePref,
  saveFilterPreset,
  getFilterPreset,
  listFilterPresets,
  deleteFilterPreset,
  saveResumePosition,
  getResumePosition,
  clearResumePosition,
  addPodcastFeed,
  listPodcastFeeds,
  removePodcastFeed,
  pruneDatabaseData,
  forgetUserData,
} from "../src/db/index.js";
import { getAnnualReviewStatus, initAnnualReview } from "../src/reminders/annualReview.js";

test("PRD v5 Epic 0 & E3 - Review State & Annual Review Status", () => {
  const now = Date.now();
  const nextYear = now + 365 * 24 * 60 * 60 * 1000;
  setReviewState(now, nextYear, null);

  const state = getReviewState();
  assert.ok(state);
  assert.equal(state.last_review_at, now);
  assert.equal(state.next_review_at, nextYear);

  const status = getAnnualReviewStatus();
  assert.ok(status.daysRemaining > 300);
  assert.equal(status.isOverdue, false);
});

test("PRD v5 E5 - Track Volume Preferences per-track memory", () => {
  const trackKey = "Taylor Swift - Cruel Summer";
  const userId = "user_vol_123";

  setTrackVolumePref(trackKey, 85, userId);
  assert.equal(getTrackVolumePref(trackKey), 85);

  // Update preferensi
  setTrackVolumePref(trackKey, 70, userId);
  assert.equal(getTrackVolumePref(trackKey), 70);

  // Case-insensitive lookup
  assert.equal(getTrackVolumePref("taylor swift - cruel summer"), 70);
});

test("PRD v5 E5 - Filter Presets CRUD per user", () => {
  const userId = "user_filter_" + Date.now();
  saveFilterPreset(userId, "MyBass", "bassboost_medium");
  saveFilterPreset(userId, "PartyNight", "nightcore");

  assert.equal(getFilterPreset(userId, "MyBass"), "bassboost_medium");
  assert.equal(getFilterPreset(userId, "PartyNight"), "nightcore");

  const list = listFilterPresets(userId);
  assert.equal(list.length, 2);

  const deleted = deleteFilterPreset(userId, "MyBass");
  assert.equal(deleted, true);
  assert.equal(getFilterPreset(userId, "MyBass"), null);
});

test("PRD v5 E6 - Resume Positions for long content", () => {
  const userId = "user_podcast_" + Date.now();
  const itemKey = "Hardcore History - Wrath of the Khans";

  // Simpan posisi di menit ke-25 (1,500,000 ms) dari 3,600,000 ms
  saveResumePosition(userId, itemKey, 1500000, 3600000);
  const pos = getResumePosition(userId, itemKey);
  assert.ok(pos);
  assert.equal(pos.position_ms, 1500000);

  // Jika posisi >= 95% dari durasi, otomatis terhapus
  saveResumePosition(userId, itemKey, 3500000, 3600000); // ~97%
  const completedPos = getResumePosition(userId, itemKey);
  assert.equal(completedPos, null);

  // Clear manual
  saveResumePosition(userId, itemKey, 500000, 3600000);
  clearResumePosition(userId, itemKey);
  assert.equal(getResumePosition(userId, itemKey), null);
});

test("PRD v5 E6 - Podcast Feeds subscriptions", () => {
  const guildId = "guild_podcast_" + Date.now();
  const feedId = addPodcastFeed(guildId, "https://feeds.example.com/podcast.rss", "Tech Weekly", "user123");
  assert.ok(feedId > 0);

  const feeds = listPodcastFeeds(guildId);
  assert.ok(feeds.some((f) => f.id === feedId && f.title === "Tech Weekly"));

  const removed = removePodcastFeed(guildId, feedId);
  assert.equal(removed, true);
  const afterFeeds = listPodcastFeeds(guildId);
  assert.equal(afterFeeds.some((f) => f.id === feedId), false);
});

test("PRD v5 E1 - pruneDatabaseData executes safely", () => {
  const res = pruneDatabaseData(180);
  assert.ok(typeof res.playLogDeleted === "number");
  assert.ok(typeof res.healthDeleted === "number");
  assert.ok(typeof res.demandDeleted === "number");
  assert.ok(typeof res.maintenanceDeleted === "number");
});

test("PRD v5 E1 & E2 - forgetUserData cleans PRD v5 resume_positions and filter_presets", () => {
  const userId = "user_gdpr_v5_" + Date.now();
  saveFilterPreset(userId, "RockBoost", "rock");
  saveResumePosition(userId, "Long Audio Track", 200000, 1000000);

  assert.ok(getFilterPreset(userId, "RockBoost"));
  assert.ok(getResumePosition(userId, "Long Audio Track"));

  forgetUserData(userId);

  assert.equal(getFilterPreset(userId, "RockBoost"), null);
  assert.equal(getResumePosition(userId, "Long Audio Track"), null);
});
