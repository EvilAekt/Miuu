import test from "node:test";
import assert from "node:assert/strict";
import { parseInput } from "../src/resolvers/parseInput.js";

test("parseInput - Spotify track URL", () => {
  const input = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT";
  const res = parseInput(input);
  assert.equal(res.source, "spotify");
  if (res.source === "spotify") {
    assert.equal(res.type, "track");
    assert.equal(res.id, "4cOdK2wGLETKBW3PvgPWqT");
  }
});

test("parseInput - Spotify intl-id regional URL", () => {
  const input = "https://open.spotify.com/intl-id/track/4cOdK2wGLETKBW3PvgPWqT?si=abc123xyz";
  const res = parseInput(input);
  assert.equal(res.source, "spotify");
  if (res.source === "spotify") {
    assert.equal(res.type, "track");
    assert.equal(res.id, "4cOdK2wGLETKBW3PvgPWqT");
  }
});

test("parseInput - Spotify album URL", () => {
  const input = "https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3";
  const res = parseInput(input);
  assert.equal(res.source, "spotify");
  if (res.source === "spotify") {
    assert.equal(res.type, "album");
    assert.equal(res.id, "1DFixLWuPkv3KT3TnV35m3");
  }
});

test("parseInput - Spotify URI format", () => {
  const input = "spotify:track:4cOdK2wGLETKBW3PvgPWqT";
  const res = parseInput(input);
  assert.equal(res.source, "spotify");
  if (res.source === "spotify") {
    assert.equal(res.type, "track");
    assert.equal(res.id, "4cOdK2wGLETKBW3PvgPWqT");
  }
});

test("parseInput - YouTube standard URL with tracking parameters", () => {
  const input = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=tracking123&feature=shared";
  const res = parseInput(input);
  assert.equal(res.source, "youtube");
  if (res.source === "youtube") {
    assert.equal(res.isShort, false);
    assert.ok(!res.url.includes("si="));
    assert.ok(!res.url.includes("feature="));
  }
});

test("parseInput - YouTube Shorts URL conversion", () => {
  const input = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
  const res = parseInput(input);
  assert.equal(res.source, "youtube");
  if (res.source === "youtube") {
    assert.equal(res.isShort, true);
    assert.equal(res.url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }
});

test("parseInput - Plain keyword search query", () => {
  const input = "Hindia - Cincin";
  const res = parseInput(input);
  assert.equal(res.source, "search");
  if (res.source === "search") {
    assert.equal(res.query, "Hindia - Cincin");
  }
});
