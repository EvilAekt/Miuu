import { test } from "node:test";
import assert from "node:assert/strict";
import {
  set8DAudio,
  setPlaybackSpeed,
  setPlaybackPitch,
  setAutoNormalize,
  ROTATION_SPEED_MAP,
} from "../src/audio/advancedDsp.js";
import { generateMusicWrapped } from "../src/stats/wrappedGenerator.js";
import {
  setDjConfig,
  getDjConfig,
  generateDjScript,
  getTtsAudioUrl,
  shouldAnnounceTrack,
} from "../src/dj/voiceAnnouncer.js";

test("PRD v7 E2 - advancedDsp computes 8D rotation, speed, pitch, and normalization", async () => {
  assert.equal(ROTATION_SPEED_MAP.slow, 0.08);
  assert.equal(ROTATION_SPEED_MAP.normal, 0.15);
  assert.equal(ROTATION_SPEED_MAP.fast, 0.25);

  // Mock player filterManager
  let lastTimescale: any = null;
  let lastRotation: any = null;
  let lastEQ: any = null;

  const mockPlayer = {
    filterManager: {
      filters: {},
      setRotation: async (payload: any) => { lastRotation = payload; },
      setTimescale: async (payload: any) => { lastTimescale = payload; },
      setEQ: async (payload: any) => { lastEQ = payload; },
    },
  };

  // Test 8D
  const res8d = await set8DAudio(mockPlayer, true, "fast");
  assert.equal(res8d.enabled, true);
  assert.equal(res8d.hz, 0.25);
  assert.deepEqual(lastRotation, { rotationHz: 0.25 });

  // Test speed clamping
  const appliedSpeed = await setPlaybackSpeed(mockPlayer, 3.5); // Should clamp to 2.0
  assert.equal(appliedSpeed, 2.0);
  assert.equal(lastTimescale.speed, 2.0);

  const slowSpeed = await setPlaybackSpeed(mockPlayer, 0.1); // Should clamp to 0.5
  assert.equal(slowSpeed, 0.5);

  // Test pitch clamping
  const appliedPitch = await setPlaybackPitch(mockPlayer, 1.25);
  assert.equal(appliedPitch, 1.25);
  assert.equal(lastTimescale.pitch, 1.25);

  // Test normalization
  const norm = await setAutoNormalize(mockPlayer, true);
  assert.equal(norm, true);
  assert.ok(Array.isArray(lastEQ));
});

test("PRD v7 E4 - wrappedGenerator aggregates listening statistics and persona", () => {
  const wrapped = generateMusicWrapped("test-guild-wrapped", undefined, "Test Server", 30);
  assert.ok(wrapped.targetName === "Test Server");
  assert.ok(typeof wrapped.totalPlays === "number");
  assert.ok(typeof wrapped.totalMinutes === "number");
  assert.ok(typeof wrapped.persona === "string");
  assert.ok(typeof wrapped.peakTimeSlot === "string");
});

test("PRD v7 E1 - voiceAnnouncer handles DJ config, personality scripts, and rotation", () => {
  const guildId = "test-guild-dj";

  // Set config
  const cfg = setDjConfig(guildId, { enabled: true, personality: "hype", frequency: 2 });
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.personality, "hype");
  assert.equal(cfg.frequency, 2);

  // Read config
  const read = getDjConfig(guildId);
  assert.equal(read.personality, "hype");

  // Script generation
  const scriptHype = generateDjScript("Daylight", "Taylor Swift", "Galang", "hype");
  assert.ok(scriptHype.includes("Daylight"));
  assert.ok(scriptHype.includes("Taylor Swift"));
  assert.ok(scriptHype.includes("Galang"));

  const scriptChill = generateDjScript("Lofi Beat", "Chillhop", undefined, "chill");
  assert.ok(scriptChill.includes("Lofi Beat"));

  // TTS URL
  const ttsUrl = getTtsAudioUrl("Halo dunia", "id");
  assert.ok(ttsUrl.startsWith("https://translate.google.com/translate_tts"));
  assert.ok(ttsUrl.includes("tl=id"));

  // Rotation test
  const firstTrack = shouldAnnounceTrack(guildId); // Count 1 -> true (first track always announced)
  assert.equal(firstTrack, true);

  const secondTrack = shouldAnnounceTrack(guildId); // Count 2 -> true (frequency 2)
  assert.equal(secondTrack, true);
});
