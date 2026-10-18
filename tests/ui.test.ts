import test from "node:test";
import assert from "node:assert/strict";
import { formatDuration, createProgressBar } from "../src/ui/embeds.js";
import { createNowPlayingContainer, createNowPlayingPayloadV2 } from "../src/ui/componentsV2.js";
import { MessageFlags } from "discord.js";

test("formatDuration - 0 ms returns 0:00", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(-10), "0:00");
});

test("formatDuration - seconds and minutes formatting", () => {
  assert.equal(formatDuration(45000), "0:45");
  assert.equal(formatDuration(65000), "1:05");
  assert.equal(formatDuration(3 * 60 * 1000 + 42 * 1000), "3:42");
});

test("formatDuration - hours formatting", () => {
  assert.equal(formatDuration(3665000), "1:01:05");
});

test("createProgressBar - start, middle, and end positions", () => {
  const start = createProgressBar(0, 100000, 10);
  assert.ok(start.startsWith("🔘"));

  const middle = createProgressBar(50000, 100000, 10);
  assert.ok(middle.includes("🔘"));
  assert.notEqual(middle.indexOf("🔘"), 0);

  const end = createProgressBar(100000, 100000, 10);
  assert.ok(end.endsWith("🔘"));
});

test("componentsV2 - createNowPlayingContainer and payload generation", () => {
  const mockTrack = {
    info: {
      title: "Bohemian Rhapsody",
      author: "Queen",
      uri: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      duration: 354000,
      isStream: false,
    },
    requester: { username: "Galan" },
  } as any;

  const mockPlayer = {
    position: 60000,
    volume: 50,
    repeatMode: "off",
    paused: false,
    queue: { tracks: [] },
  } as any;

  const container = createNowPlayingContainer(mockTrack, mockPlayer, false);
  const json = container.toJSON();

  assert.equal(json.type, 17); // Type 17 = Container
  assert.equal(json.accent_color, 0x5865f2);
  assert.ok(json.components && json.components.length > 0);

  const payload = createNowPlayingPayloadV2(mockTrack, mockPlayer, false);
  assert.equal(payload.flags, MessageFlags.IsComponentsV2);
  assert.equal(payload.components.length, 1);
});

