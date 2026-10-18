// tests/parseInput_robustness.test.ts: Pengujian Robustness & Boundary T2 Sesuai Aturan 'should <hasil> when <kondisi>'
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInput } from "../src/resolvers/parseInput.js";

test("T2 parseInput - should strip tracking parameters when YouTube URL contains si and feature", () => {
  const input = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=12345678&feature=shared";
  const res = parseInput(input);
  assert.equal(res.source, "youtube");
  if (res.source === "youtube") {
    assert.ok(!res.url.includes("si="));
    assert.ok(!res.url.includes("feature="));
    assert.ok(res.url.includes("v=dQw4w9WgXcQ"));
  }
});

test("T2 parseInput - should preserve list and timestamp when YouTube URL contains them", () => {
  const input = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL12345&t=42s";
  const res = parseInput(input);
  assert.equal(res.source, "youtube");
  if (res.source === "youtube") {
    assert.ok(res.url.includes("list=PL12345"));
    assert.ok(res.url.includes("t=42s"));
  }
});

test("T2 parseInput - should recognize youtu.be shortlink and music.youtube.com subdomain", () => {
  const shortlink = parseInput("https://youtu.be/dQw4w9WgXcQ");
  assert.equal(shortlink.source, "youtube");

  const musicUrl = parseInput("https://music.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(musicUrl.source, "youtube");
});

test("T2 parseInput - should normalize YouTube Shorts into standard watch URL format", () => {
  const input = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
  const res = parseInput(input);
  assert.equal(res.source, "youtube");
  if (res.source === "youtube") {
    assert.equal(res.isShort, true);
    assert.equal(res.url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }
});

test("T2 parseInput - should parse Spotify regional paths when intl-id or intl-es is present", () => {
  const idUrl = "https://open.spotify.com/intl-id/track/4cOdK2wGLETKBW3PvgPWqT";
  const resId = parseInput(idUrl);
  assert.equal(resId.source, "spotify");
  if (resId.source === "spotify") {
    assert.equal(resId.id, "4cOdK2wGLETKBW3PvgPWqT");
    assert.equal(resId.type, "track");
    assert.ok(!resId.url.includes("intl-id")); // Normalisasi canonical URL
  }

  const esUrl = "https://open.spotify.com/intl-es/album/6akEvsycV25bry39OSlBD5";
  const resEs = parseInput(esUrl);
  assert.equal(resEs.source, "spotify");
  if (resEs.source === "spotify") {
    assert.equal(resEs.id, "6akEvsycV25bry39OSlBD5");
    assert.equal(resEs.type, "album");
  }
});

test("T2 parseInput - should parse Spotify URIs when spotify:track or spotify:album format is used", () => {
  const uri = "spotify:track:4cOdK2wGLETKBW3PvgPWqT";
  const res = parseInput(uri);
  assert.equal(res.source, "spotify");
  if (res.source === "spotify") {
    assert.equal(res.id, "4cOdK2wGLETKBW3PvgPWqT");
    assert.equal(res.type, "track");
  }
});

test("T2 parseInput - should recognize Bandcamp URLs when valid subdomain is provided", () => {
  const bandcamp = "https://artistname.bandcamp.com/track/cool-song";
  const res = parseInput(bandcamp);
  assert.equal(res.source, "bandcamp");
});

test("T2 parseInput - should fallback to search query when input is plain text or contains emoji", () => {
  const query = "Lofi Hip Hop Chill ☕ 🎧";
  const res = parseInput(query);
  assert.equal(res.source, "search");
  if (res.source === "search") {
    assert.equal(res.query, query);
  }
});

test("T2 parseInput - should never throw unhandled exception when given extreme input values", () => {
  // Empty & whitespace
  assert.doesNotThrow(() => parseInput(""));
  assert.doesNotThrow(() => parseInput("   \n\t   "));

  // Huge string (2,000 characters)
  const longQuery = "a".repeat(2000);
  assert.doesNotThrow(() => {
    const res = parseInput(longQuery);
    assert.equal(res.source, "search");
  });

  // Malformed URL
  assert.doesNotThrow(() => parseInput("https://"));
  assert.doesNotThrow(() => parseInput("http://??//&&"));
});

test("T2 parseInput - should safely treat non-http protocols as keyword search", () => {
  const jsUri = "javascript:alert(1)";
  const resJs = parseInput(jsUri);
  assert.equal(resJs.source, "search");

  const fileUri = "file:///etc/passwd";
  const resFile = parseInput(fileUri);
  assert.equal(resFile.source, "search");
});
