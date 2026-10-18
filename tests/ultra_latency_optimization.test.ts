// tests/ultra_latency_optimization.test.ts: Unit Tests untuk Ultra-Low Latency & High Performance
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import zlib from "node:zlib";
import { db } from "../src/db/index.js";
import {
  getCachedSearchResults,
  setCachedSearchResults,
  clearSearchCache,
  getSearchCacheSize,
} from "../src/player/searchCache.js";
import { prefetchTrackLyrics } from "../src/lyrics/lyricsService.js";
import { startDashboardServer, renderDashboardHtml } from "../src/web/server.js";

test("Ultra Latency - In-Memory Search LRU Cache works with sub-millisecond retrieval and eviction", () => {
  clearSearchCache();
  assert.equal(getSearchCacheSize(), 0);

  const mockResult = {
    loadType: "search",
    tracks: [{ info: { title: "Faded", author: "Alan Walker", uri: "https://youtu.be/test1" } }],
  };

  // 1. Cache Miss
  const miss = getCachedSearchResults("Alan Walker Faded", "ytsearch");
  assert.equal(miss, null);

  // 2. Set & Hit
  setCachedSearchResults("Alan Walker Faded", "ytsearch", mockResult);
  assert.equal(getSearchCacheSize(), 1);

  const hit = getCachedSearchResults("alan walker faded", "ytsearch"); // Case insensitive
  assert.ok(hit);
  assert.equal(hit.tracks[0].info.title, "Faded");

  // 3. TTL Expiry simulation (ttlMs = -100ms)
  setCachedSearchResults("Expired Song", "ytsearch", mockResult, -100);
  const expiredHit = getCachedSearchResults("Expired Song", "ytsearch");
  assert.equal(expiredHit, null);

  // 4. LRU Eviction simulation: test max entries (150)
  clearSearchCache();
  for (let i = 0; i < 155; i++) {
    setCachedSearchResults(`Query Song ${i}`, "ytsearch", {
      tracks: [{ info: { title: `Track ${i}` } }],
    });
  }

  // Size must be capped at 150
  assert.equal(getSearchCacheSize(), 150);

  // Oldest queries (0 to 4) should have been evicted
  assert.equal(getCachedSearchResults("Query Song 0", "ytsearch"), null);
  assert.equal(getCachedSearchResults("Query Song 4", "ytsearch"), null);

  // Newer queries (5 to 154) should be present
  assert.ok(getCachedSearchResults("Query Song 150", "ytsearch"));
  assert.ok(getCachedSearchResults("Query Song 154", "ytsearch"));

  clearSearchCache();
});

test("Ultra Latency - SQLite Turbo PRAGMA settings are active in database connection", () => {
  const journalMode = db.pragma("journal_mode", { simple: true });
  assert.equal(String(journalMode).toLowerCase(), "wal");

  const synchronous = db.pragma("synchronous", { simple: true });
  // In SQLite, synchronous NORMAL returns 1
  assert.equal(synchronous, 1);

  const tempStore = db.pragma("temp_store", { simple: true });
  // In SQLite, temp_store MEMORY returns 2
  assert.equal(tempStore, 2);
});

test("Ultra Latency - Speculative Lyrics Pre-fetcher operates safely without throwing", () => {
  // Empty or invalid input should not crash
  assert.doesNotThrow(() => {
    prefetchTrackLyrics("");
    prefetchTrackLyrics("A non existent obscure track title test", "Some obscure artist");
  });
});

test("Ultra Latency - HTTP Gzip static asset compression cuts payload size significantly", async () => {
  const mockClient: any = {
    user: { username: "CompressionBot", id: "bot-comp-1" },
    isReady: () => true,
    ws: { ping: 15 },
    guilds: { cache: new Map() },
  };

  const testPort = 3592;
  const server = startDashboardServer(mockClient, { port: testPort, host: "127.0.0.1" });

  await new Promise<void>((resolve) => {
    server.listen(testPort, "127.0.0.1", () => resolve());
  });

  try {
    // 1. Request with Accept-Encoding: gzip
    const gzipped = await new Promise<{
      statusCode: number;
      contentEncoding: string;
      bodyLength: number;
      decompressedHtml: string;
    }>((resolve, reject) => {
      const req = http.get(
        `http://127.0.0.1:${testPort}/`,
        { headers: { "Accept-Encoding": "gzip" } },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const unzipped = zlib.gunzipSync(buffer).toString("utf-8");
            resolve({
              statusCode: res.statusCode || 0,
              contentEncoding: (res.headers["content-encoding"] || "").toLowerCase(),
              bodyLength: buffer.length,
              decompressedHtml: unzipped,
            });
          });
          res.on("error", reject);
        }
      );
      req.on("error", reject);
    });

    assert.equal(gzipped.statusCode, 200);
    assert.equal(gzipped.contentEncoding, "gzip");
    // Compressed size must be much smaller than the 50KB+ uncompressed HTML (expected around ~12KB - 16KB)
    assert.ok(gzipped.bodyLength < 25000, `Gzip payload size was ${gzipped.bodyLength} bytes, expected < 25000`);
    assert.ok(gzipped.decompressedHtml.includes("Discord Music Bot"));

    // 2. Request without compression (identity)
    const raw = await new Promise<{
      statusCode: number;
      contentEncoding: string;
      bodyLength: number;
    }>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${testPort}/`, (res) => {
        let len = 0;
        res.on("data", (c) => { len += c.length; });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            contentEncoding: (res.headers["content-encoding"] || "").toLowerCase(),
            bodyLength: len,
          });
        });
        res.on("error", reject);
      });
      req.on("error", reject);
    });

    assert.equal(raw.statusCode, 200);
    assert.equal(raw.contentEncoding, "");
    assert.ok(raw.bodyLength > 50000, `Raw uncompressed payload was ${raw.bodyLength} bytes, expected > 50000`);
  } finally {
    server.close();
  }
});

test("Ultra Latency - renderDashboardHtml embeds Page Visibility API throttling", () => {
  const html = renderDashboardHtml();
  assert.ok(html.includes("visibilitychange"), "HTML harus menyertakan listener visibilitychange");
  assert.ok(html.includes("document.hidden"), "HTML harus memeriksa document.hidden untuk battery saving");
  assert.ok(html.includes("setupClockTicker"), "HTML harus memiliki setupClockTicker untuk dynamic throttling");
});
