// tests/latency_optimization.test.ts: Unit Tests untuk Server-Sent Events, Zero-Lag Optimistic UI, dan High-Precision Clock
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  sseClients,
  broadcastDashboardEvent,
  getCompleteDashboardStatus,
  renderDashboardHtml,
  startDashboardServer,
  setLanToken,
  currentLanToken,
} from "../src/web/server.js";

test("Latency Optimization - sseClients registration and broadcastDashboardEvent formatting", () => {
  // Clear existing clients for clean test state
  sseClients.clear();

  let receivedPayload = "";
  const mockClientRes: any = {
    write: (chunk: string) => {
      receivedPayload += chunk;
      return true;
    },
  };

  sseClients.add(mockClientRes);
  assert.equal(sseClients.size, 1);

  // Broadcast event
  const testData = { status: "playing", latency: 5 };
  broadcastDashboardEvent("state_change", testData);

  assert.equal(
    receivedPayload,
    `event: state_change\ndata: ${JSON.stringify(testData)}\n\n`
  );

  // Error handling test: when write throws, client should be removed from sseClients
  const faultyClientRes: any = {
    write: () => {
      throw new Error("Broken pipe socket closed");
    },
  };
  sseClients.add(faultyClientRes);
  assert.equal(sseClients.size, 2);

  broadcastDashboardEvent("ping", { t: Date.now() });

  // faulty client must be purged
  assert.ok(!sseClients.has(faultyClientRes));
  assert.ok(sseClients.has(mockClientRes));

  sseClients.clear();
});

test("Latency Optimization - getCompleteDashboardStatus returns full metrics and server timestamp", () => {
  const mockClient: any = {
    user: { username: "TestAudioBot", id: "bot-123" },
    isReady: () => true,
    ws: { ping: 24 },
    guilds: {
      cache: new Map([["guild-test", { id: "guild-test" }]]),
    },
  };

  const status = getCompleteDashboardStatus(mockClient);

  assert.equal(status.botName, "TestAudioBot");
  assert.equal(status.connected, true);
  assert.equal(status.ping, 24);
  assert.equal(typeof status.serverTime, "number");
  assert.ok(status.serverTime > 0);
  assert.ok("player" in status);
  assert.ok("stats" in status);
  assert.ok("healthEvents" in status);
});

test("Latency Optimization - GET /api/events SSE HTTP Endpoint behavior and security", async () => {
  const mockClient: any = {
    user: { username: "TestAudioBot", id: "bot-123" },
    isReady: () => true,
    ws: { ping: 12 },
    guilds: { cache: new Map() },
  };

  const testPort = 3591;
  const server = startDashboardServer(mockClient, { port: testPort, host: "127.0.0.1" });

  await new Promise<void>((resolve) => {
    server.listen(testPort, "127.0.0.1", () => resolve());
  });

  try {
    // 1. Connect to SSE endpoint via localhost (should return 200 text/event-stream and initial 'init' event)
    const sseResponse = await new Promise<{
      statusCode: number;
      contentType: string;
      initialChunk: string;
    }>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${testPort}/api/events`, (res) => {
        let firstData = "";
        res.on("data", (chunk) => {
          firstData += chunk.toString();
          // After receiving first chunk containing init event, close request
          req.destroy();
          resolve({
            statusCode: res.statusCode || 0,
            contentType: res.headers["content-type"] || "",
            initialChunk: firstData,
          });
        });
        res.on("error", (err) => reject(err));
      });
      req.on("error", (err) => {
        // Ignored if socket was destroyed by us
        if ((err as any).code !== "ECONNRESET") reject(err);
      });
    });

    assert.equal(sseResponse.statusCode, 200);
    assert.ok(sseResponse.contentType.includes("text/event-stream"));
    assert.ok(sseResponse.initialChunk.includes("event: init"));
    assert.ok(sseResponse.initialChunk.includes("TestAudioBot"));

    // 2. Fallback REST status endpoint GET /api/status also returns status
    const restResponse = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${testPort}/api/status`, (res) => {
        let raw = "";
        res.on("data", (c) => { raw += c.toString(); });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            data: JSON.parse(raw),
          });
        });
        res.on("error", reject);
      });
    });

    assert.equal(restResponse.statusCode, 200);
    assert.equal(restResponse.data.botName, "TestAudioBot");
    assert.equal(restResponse.data.connected, true);
  } finally {
    server.close();
  }
});

test("Latency Optimization - renderDashboardHtml embeds SSE, Optimistic UI, and 100ms Interpolation", () => {
  const html = renderDashboardHtml();

  // SSE client integration
  assert.ok(html.includes("EventSource"), "HTML harus menyertakan EventSource untuk SSE");
  assert.ok(html.includes("/api/events"), "HTML harus menyambungkan ke endpoint /api/events");
  assert.ok(html.includes("initSSE()"), "HTML harus menginisialisasi initSSE()");

  // Optimistic UI updates
  assert.ok(html.includes("updatePlayPauseUi"), "HTML harus memiliki helper updatePlayPauseUi untuk zero-lag");
  assert.ok(html.includes("isUserDraggingVolume"), "HTML harus membedakan input pengguna agar tidak jitter");

  // 100ms clock interpolation
  assert.ok(html.includes("setInterval"), "HTML harus memiliki interval timer");
  assert.ok(html.includes("100"), "HTML harus menginterpolasi waktu lokal setiap 100ms");
  assert.ok(html.includes("applyStatusData"), "HTML harus memisahkan logika applyStatusData");
});
