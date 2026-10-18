// tests/matcher_robustness.test.ts: Pengujian Mendalam T4 untuk Matcher Spotify ke YouTube
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateMatchScore, matchSpotifyToYouTube } from "../src/matching/matcher.js";
import { FakeLavalinkPlayer } from "./helpers/fakeLavalink.js";
import { setMatchOverride, setCachedTrack } from "../src/db/index.js";

test("T4 Matcher - should penalize cover, live, and slowed when original title lacks them", () => {
  const original = { title: "Komang", artist: "Raim Laode", durationMs: 220000 };

  const candidateCover = { title: "Komang (Cover Akustik)", author: "Cover Artist", duration: 220000 };
  const scoreCover = calculateMatchScore(original, candidateCover);
  assert.ok(scoreCover.reason.some((r) => r.includes('-40 Mengandung "cover"')));

  const candidateLive = { title: "Komang - Live at Concert", author: "Raim Laode", duration: 220000 };
  const scoreLive = calculateMatchScore(original, candidateLive);
  assert.ok(scoreLive.reason.some((r) => r.includes('-30 Mengandung "live"')));

  const candidateSlowed = { title: "Komang (Slowed + Reverb)", author: "Vibes", duration: 220000 };
  const scoreSlowed = calculateMatchScore(original, candidateSlowed);
  assert.ok(scoreSlowed.reason.some((r) => r.includes('-35 Mengandung "slowed"')));
});

test("T4 Matcher - should NOT penalize remix or cover when original Spotify title explicitly has them", () => {
  const originalRemix = { title: "Levitating (The Blessed Madonna Remix)", artist: "Dua Lipa", durationMs: 240000 };
  const candidateRemix = { title: "Levitating (The Blessed Madonna Remix) [Official Video]", author: "Dua Lipa", duration: 240000 };

  const res = calculateMatchScore(originalRemix, candidateRemix);
  assert.equal(res.reason.some((r) => r.includes('-30 Mengandung "remix"')), false);
  assert.ok(res.score > 70);
});

test("T4 Matcher - should grant duration bonuses within 3s and penalties beyond 60s", () => {
  const original = { title: "Daylight", artist: "Taylor Swift", durationMs: 293000 };

  // Difference 2s -> bonus +20
  const candidateIdentical = { title: "Taylor Swift - Daylight", author: "Taylor Swift", duration: 295000 };
  const resIdentical = calculateMatchScore(original, candidateIdentical);
  assert.ok(resIdentical.reason.some((r) => r.includes("+20 Durasi identik")));

  // Difference 70s -> penalty -30
  const candidateTooLong = { title: "Taylor Swift - Daylight Extended", author: "Taylor Swift", duration: 370000 };
  const resTooLong = calculateMatchScore(original, candidateTooLong);
  assert.ok(resTooLong.reason.some((r) => r.includes("-30 Selisih durasi > 60s")));
});

test("T4 Matcher - should prioritize match_overrides over Lavalink search results", async () => {
  const fakePlayer = new FakeLavalinkPlayer();
  const spotifyId = "sp_override_track_123";

  // Simpan override dengan createdBy
  setMatchOverride(spotifyId, "yt_override_target", "test-admin-user");

  const item = {
    title: "Overridden Song",
    artist: "Famous Singer",
    durationMs: 200000,
    uri: `spotify:track:${spotifyId}`,
  };

  const res = await matchSpotifyToYouTube(fakePlayer as any, item, { id: "user1" });
  assert.ok(res.bestTrack);
  assert.equal(res.candidates[0].score, 999);
  assert.equal(res.candidates[0].reason[0], "Manual match_override");
});

test("T4 Matcher - should use cached track without new scoring when track exists in SQLite cache", async () => {
  const fakePlayer = new FakeLavalinkPlayer();
  const spotifyId = "sp_cached_track_456";

  // Simpan di cache
  setCachedTrack("spotify", spotifyId, "youtube", "yt_cached_id", "Cached Title", 180000);

  const item = {
    title: "Cached Title",
    artist: "Cached Artist",
    durationMs: 180000,
    uri: `spotify:track:${spotifyId}`,
  };

  const res = await matchSpotifyToYouTube(fakePlayer as any, item, { id: "user1" });
  assert.ok(res.bestTrack);
  assert.equal(res.candidates[0].score, 500);
  assert.equal(res.candidates[0].reason[0], "Cached track");
});

test("T4 Matcher - should return null bestTrack when player search finds no candidates", async () => {
  const fakePlayer = new FakeLavalinkPlayer();
  // Override search to return empty
  fakePlayer.search = async () => ({ loadType: "empty", tracks: [] });

  const item = {
    title: "Non Existent Track 999XYZ",
    artist: "Ghost Singer",
    durationMs: 120000,
  };

  const res = await matchSpotifyToYouTube(fakePlayer as any, item, { id: "user1" });
  assert.equal(res.bestTrack, null);
  assert.equal(res.candidates.length, 0);
});
