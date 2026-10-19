import test from "node:test";
import assert from "node:assert/strict";
import { calculateMatchScore, cleanTitleForSearch } from "../src/matching/matcher.js";

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

test("cleanTitleForSearch - cleans noise metadata and featured artists correctly", () => {
  assert.equal(cleanTitleForSearch("Indecision (feat. Daniel Caesar)"), "Indecision");
  assert.equal(cleanTitleForSearch("Numb / Encore [ft. JAY-Z]"), "Numb / Encore");
  assert.equal(cleanTitleForSearch("Creep - Remastered"), "Creep");
  assert.equal(cleanTitleForSearch("Hotel California (Live / Remastered 2013)"), "Hotel California");
  assert.equal(cleanTitleForSearch("Song Name (Official Music Video)"), "Song Name");
  assert.equal(cleanTitleForSearch("Simple Song"), "Simple Song");
});

test("sfxManager - smart resume records interruption and restores correctly", async () => {
  const { playSfxWithSmartResume, handleSfxTrackEnd, getSfxInterruption } = await import("../src/player/sfxManager.js");

  const mockOriginalTrack: any = {
    info: { title: "Radiohead - Creep", identifier: "yt-creep", author: "Radiohead", duration: 239000 },
  };
  const mockSfxTrack: any = {
    info: { title: "Airhorn SFX", identifier: "sfx-airhorn", author: "Miu SFX", duration: 3000 },
  };

  let playOptionsCalledWith: any = null;
  let skipCalled = false;

  const mockPlayer: any = {
    guildId: "guild-sfx-test",
    playing: true,
    position: 45000,
    queue: {
      current: mockOriginalTrack,
      tracks: [],
    },
    skip: async () => { skipCalled = true; },
    play: async (opts?: any) => { playOptionsCalledWith = opts; },
  };

  // 1. Panggil playSfxWithSmartResume
  const res = await playSfxWithSmartResume(mockPlayer, mockSfxTrack);
  assert.equal(res.success, true);
  assert.equal(res.resumed, true);
  assert.equal(skipCalled, true);
  assert.equal(mockPlayer.queue.tracks[0].info.identifier, "sfx-airhorn");

  const interruption = getSfxInterruption("guild-sfx-test");
  assert.ok(interruption);
  assert.equal(interruption.originalTrack.info.title, "Radiohead - Creep");
  assert.equal(interruption.position, 44800); // 45000 - 200ms backtrack

  // 2. Simulasi SFX selesai (trackEnd)
  const handled = await handleSfxTrackEnd(mockPlayer, mockSfxTrack);
  assert.equal(handled, true);
  assert.equal(mockPlayer.queue.tracks[0].info.identifier, "yt-creep");
  assert.equal(playOptionsCalledWith?.position, 44800);
  assert.equal(getSfxInterruption("guild-sfx-test"), undefined);
});

