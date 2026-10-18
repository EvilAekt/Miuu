import test from "node:test";
import assert from "node:assert/strict";
import { calculateMatchScore } from "../src/matching/matcher.js";

test("calculateMatchScore - official audio and topic bonuses", () => {
  const spotify = {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    durationMs: 354000,
  };

  const officialCandidate = {
    title: "Queen - Bohemian Rhapsody (Official Video)",
    author: "Queen Official",
    duration: 355000, // +1s
  };

  const result = calculateMatchScore(spotify, officialCandidate);
  assert.ok(result.score > 80, `Expected high score, got ${result.score}`);
  assert.ok(result.reason.some((r) => r.includes("Artis cocok")));
});

test("calculateMatchScore - penalty for cover and karaoke", () => {
  const spotify = {
    title: "Cincin",
    artist: "Hindia",
    durationMs: 279000,
  };

  const coverCandidate = {
    title: "Hindia - Cincin (Cover Akustik)",
    author: "Random Musician",
    duration: 270000,
  };

  const result = calculateMatchScore(spotify, coverCandidate);
  assert.ok(result.reason.some((r) => r.includes("cover")));
  assert.ok(result.score < 60, `Expected low score for cover, got ${result.score}`);
});

test("calculateMatchScore - penalty for duration discrepancy", () => {
  const spotify = {
    title: "Track A",
    artist: "Artist B",
    durationMs: 180000, // 3 minutes
  };

  const longCandidate = {
    title: "Track A - Artist B (10 Hours Loop)",
    author: "Loop Channel",
    duration: 36000000, // 10 hours
  };

  const result = calculateMatchScore(spotify, longCandidate);
  assert.ok(result.reason.some((r) => r.includes("Selisih durasi > 60s")));
  assert.ok(result.score <= 45, `Expected score <= 45, got ${result.score}`);
});
