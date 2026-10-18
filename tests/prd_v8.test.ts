// tests/prd_v8.test.ts: Unit Tests untuk PRD v8 (Smart Mixing, Quiz Game, AI Intent, dan LAN Remote)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  setCrossfadeDuration,
  getCrossfadeDuration,
  applyFadeIn,
  applyFadeOut,
} from "../src/mixing/crossfadeManager.js";
import {
  startQuiz,
  getQuizSession,
  submitAnswer,
  nextRound,
  stopQuiz,
} from "../src/quiz/quizManager.js";
import { parseNaturalIntent } from "../src/ai/intentParser.js";
import {
  isLanOrLocalhost,
  getLocalIpAddress,
  currentLanToken,
  setLanToken,
  isRequestAuthorized,
} from "../src/web/server.js";

test("PRD v8 Feature 1 - Crossfade Manager sets duration and calculates fade steps", async () => {
  const guildId = "guild-crossfade-test";

  // Test set and get
  const dur = setCrossfadeDuration(guildId, 6);
  assert.equal(dur, 6);
  assert.equal(getCrossfadeDuration(guildId), 6);

  // Clamp test (0 to 10)
  assert.equal(setCrossfadeDuration(guildId, 15), 10);
  assert.equal(setCrossfadeDuration(guildId, -5), 0);

  // Test Fade In simulation
  let currentVol = 0;
  const mockPlayer = {
    volume: 100,
    setVolume: async (v: number) => { currentVol = v; },
  };

  // Duration 0 seconds should immediately set target volume
  await applyFadeIn(mockPlayer as any, 80, 0);
  assert.equal(currentVol, 80);

  // Duration 0 for Fade Out
  await applyFadeOut(mockPlayer as any, 0);
  assert.equal(currentVol, 0);
});

test("PRD v8 Feature 2 - Music Quiz Game handles session lifecycle and scoring", async () => {
  const guildId = "guild-quiz-test";

  const session = startQuiz(guildId, 3);

  assert.ok(session);
  assert.equal(session.totalRounds, 3);
  assert.equal(session.currentRound, 1);
  assert.ok(session.currentQuestion);
  assert.equal(session.currentQuestion.options.length, 4);
  assert.ok(session.currentQuestion.correctIndex >= 0 && session.currentQuestion.correctIndex < 4);

  // Submit correct answer
  const correctIdx = session.currentQuestion.correctIndex;
  const ansResult = submitAnswer(guildId, "user-galang", correctIdx);
  assert.ok(ansResult);
  assert.equal(ansResult.correct, true);
  assert.equal(ansResult.isFirst, true);
  assert.equal(ansResult.currentScore, 10);

  // Submit duplicate answer from same user (isFirst will be false, score unchanged)
  const duplicate = submitAnswer(guildId, "user-galang", correctIdx);
  assert.ok(duplicate);
  assert.equal(duplicate.isFirst, false);
  assert.equal(duplicate.currentScore, 10);

  // Submit incorrect answer from another user
  const wrongIdx = (correctIdx + 1) % 4;
  const wrongAns = submitAnswer(guildId, "user-budi", wrongIdx);
  assert.ok(wrongAns);
  assert.equal(wrongAns.correct, false);
  assert.equal(wrongAns.currentScore, 0);

  // Next round
  const round2 = nextRound(guildId);
  assert.ok(round2);
  assert.equal(round2.finished, false);
  assert.equal(round2.session.currentRound, 2);

  // Stop quiz
  const stopped = stopQuiz(guildId);
  assert.equal(stopped, true);
  assert.equal(getQuizSession(guildId), null);
});

test("PRD v8 Feature 3 - AI Intent Parser correctly recognizes multi-action commands via Heuristic Fallback", async () => {
  // Test 1: Play song with volume and 8D
  const res1 = await parseNaturalIntent("putar lofi girl volume 40 nyalakan 8d");
  assert.equal(res1.playQuery, "lofi girl");
  assert.equal(res1.volume, 40);
  assert.equal(res1.enable8d, true);

  // Test 2: Volume adjustment and bassboost filter
  const res2 = await parseNaturalIntent("naikkan volume ke 80 dan nyalakan bassboost");
  assert.equal(res2.volume, 80);
  assert.equal(res2.filter, "bassboost_medium");

  // Test 3: Sleep timer
  const res3 = await parseNaturalIntent("setel radio tidur 30 menit");
  assert.equal(res3.sleeptimerMinutes, 30);

  // Test 4: Disable 8D
  const res4 = await parseNaturalIntent("matikan efek spasial 8d");
  assert.equal(res4.enable8d, false);
});

test("PRD v8 Feature 4 - Multi-Device LAN IP verification and authorization", () => {
  // Localhost addresses
  assert.equal(isLanOrLocalhost("127.0.0.1"), true);
  assert.equal(isLanOrLocalhost("::1"), true);
  assert.equal(isLanOrLocalhost("localhost"), true);
  assert.equal(isLanOrLocalhost("::ffff:127.0.0.1"), true);

  // Private LAN subnet addresses
  assert.equal(isLanOrLocalhost("192.168.1.15"), true);
  assert.equal(isLanOrLocalhost("::ffff:192.168.0.1"), true);
  assert.equal(isLanOrLocalhost("10.0.0.42"), true);
  assert.equal(isLanOrLocalhost("172.16.0.5"), true);
  assert.equal(isLanOrLocalhost("172.31.255.255"), true);

  // Public IP addresses must be rejected
  assert.equal(isLanOrLocalhost("8.8.8.8"), false);
  assert.equal(isLanOrLocalhost("1.1.1.1"), false);
  assert.equal(isLanOrLocalhost("104.21.5.2"), false);

  // Local IP retriever should return a non-empty string
  const ip = getLocalIpAddress();
  assert.ok(typeof ip === "string");
  assert.ok(ip.length > 0);
});

test("PRD v8 Security F1 - LAN Remote Token Authentication and Authorization", () => {
  // Setup a fixed token for deterministic test
  const testToken = "remote_test_secret_token";
  setLanToken(testToken);
  assert.equal(currentLanToken, testToken);

  // 1. Localhost should always be authorized regardless of token
  const localhostReq = {
    socket: { remoteAddress: "127.0.0.1" },
    headers: {},
  } as any;
  const localhostUrl = new URL("http://localhost:3000/api/player/skip");
  assert.equal(isRequestAuthorized(localhostReq, localhostUrl), true);

  // 2. LAN device without token should be REJECTED (401)
  const lanReqNoToken = {
    socket: { remoteAddress: "192.168.1.50" },
    headers: {},
  } as any;
  const lanUrlNoToken = new URL("http://192.168.1.10:3000/api/player/skip");
  assert.equal(isRequestAuthorized(lanReqNoToken, lanUrlNoToken), false);

  // 3. LAN device with invalid query token should be REJECTED
  const lanUrlInvalidToken = new URL("http://192.168.1.10:3000/api/player/skip?token=wrong_token");
  assert.equal(isRequestAuthorized(lanReqNoToken, lanUrlInvalidToken), false);

  // 4. LAN device with valid query token should be AUTHORIZED
  const lanUrlValidToken = new URL(`http://192.168.1.10:3000/api/player/skip?token=${testToken}`);
  assert.equal(isRequestAuthorized(lanReqNoToken, lanUrlValidToken), true);

  // 5. LAN device with valid X-Remote-Token header should be AUTHORIZED
  const lanReqWithHeader = {
    socket: { remoteAddress: "192.168.1.50" },
    headers: { "x-remote-token": testToken },
  } as any;
  assert.equal(isRequestAuthorized(lanReqWithHeader, lanUrlNoToken), true);

  // 6. LAN device with valid mmb_token cookie should be AUTHORIZED
  const lanReqWithCookie = {
    socket: { remoteAddress: "192.168.1.50" },
    headers: { cookie: `theme=dark; mmb_token=${testToken}; other=1` },
  } as any;
  assert.equal(isRequestAuthorized(lanReqWithCookie, lanUrlNoToken), true);

  // 7. LAN device with invalid cookie should be REJECTED
  const lanReqWithInvalidCookie = {
    socket: { remoteAddress: "192.168.1.50" },
    headers: { cookie: `mmb_token=invalid_cookie` },
  } as any;
  assert.equal(isRequestAuthorized(lanReqWithInvalidCookie, lanUrlNoToken), false);
});
