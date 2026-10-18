// tests/helpers.test.ts: Memastikan Infrastruktur Fake T1 Berfungsi Sesuai Kontrak
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTrack, makeUser, makeGuild, makeSession } from "./helpers/factories.js";
import { FakeLavalinkPlayer } from "./helpers/fakeLavalink.js";
import { FakeInteraction } from "./helpers/fakeDiscord.js";
import { FakeGemini } from "./helpers/fakeGemini.js";

test("T1 Helpers - factories should produce valid deterministic objects", () => {
  const track = makeTrack({ title: "Custom Song", author: "Custom Artist" });
  assert.equal(track.info.title, "Custom Song");
  assert.equal(track.info.author, "Custom Artist");
  assert.ok(track.info.uri.includes("youtube.com"));

  const user = makeUser({ username: "Budi" });
  assert.equal(user.username, "Budi");
  assert.ok(user.id.length > 0);

  const guild = makeGuild({ name: "Discord Server Test" });
  assert.equal(guild.name, "Discord Server Test");

  const session = makeSession({ guildId: "g1", userId: "u1" });
  assert.equal(session.guildId, "g1");
  assert.equal(session.userId, "u1");
});

test("T1 Helpers - FakeLavalinkPlayer should record calls, manipulate queue, and filters", async () => {
  const player = new FakeLavalinkPlayer("guild-1", "voice-1", "text-1");
  const track1 = makeTrack({ title: "Song 1" });
  const track2 = makeTrack({ title: "Song 2" });

  // Add tracks
  player.queue.add([track1, track2]);
  assert.equal(player.queue.tracks.length, 2);

  // Play
  await player.play();
  assert.equal(player.playing, true);
  assert.equal(player.queue.current?.info.title, "Song 1");
  assert.equal(player.queue.tracks.length, 1);

  // Skip
  await player.skip();
  assert.equal(player.queue.current?.info.title, "Song 2");
  assert.equal(player.queue.previous.length, 1);

  // Filters
  await player.filterManager.setRotation({ rotationHz: 0.25 });
  assert.equal(player.filterManager.filters.rotation.rotationHz, 0.25);

  await player.filterManager.toggleNightcore();
  assert.equal(player.filterManager.filters.nightcore, true);

  await player.filterManager.resetFilters();
  assert.deepEqual(player.filterManager.filters, {});

  // Volume & Seek
  await player.setVolume(75);
  assert.equal(player.volume, 75);

  await player.seek(45000);
  assert.equal(player.position, 45000);

  // Events
  let eventReceived = false;
  player.on("trackEnd", () => { eventReceived = true; });
  player.emit("trackEnd");
  assert.equal(eventReceived, true);

  // Verify call recording
  const methods = player.historyCalls.map((c) => c.method);
  assert.ok(methods.includes("play"));
  assert.ok(methods.includes("skip"));
  assert.ok(methods.includes("setVolume"));
});

test("T1 Helpers - FakeInteraction should record replies, manage options and voice state", async () => {
  const interaction = new FakeInteraction({
    guildId: "g_test",
    userId: "u_test",
    voiceChannelId: "vc_123",
  });

  interaction.setOption("query", "lofi beats");
  interaction.setOption("volume", 50);
  interaction.setOption("next", true);
  interaction.setSubcommand("start");

  assert.equal(interaction.options.getString("query"), "lofi beats");
  assert.equal(interaction.options.getInteger("volume"), 50);
  assert.equal(interaction.options.getBoolean("next"), true);
  assert.equal(interaction.options.getSubcommand(), "start");
  assert.equal(interaction.member.voice.channel.id, "vc_123");

  await interaction.deferReply({ ephemeral: true });
  assert.equal(interaction.deferred, true);
  assert.equal(interaction.ephemeral, true);

  await interaction.editReply({ content: "Pencarian lagu..." });
  assert.equal(interaction.getLastReply().content, "Pencarian lagu...");
});

test("T1 Helpers - FakeGemini should return mocked response and simulate errors", async () => {
  FakeGemini.setJsonResponse({ summary: "Berhasil di-mock" });
  const mockFetch = FakeGemini.createMockFetch();

  const res = await mockFetch("https://generativelanguage.googleapis.com");
  const data = await res.json() as any;
  const content = JSON.parse(data.candidates[0].content.parts[0].text);
  assert.equal(content.summary, "Berhasil di-mock");

  // Test error simulation
  FakeGemini.setError(true);
  await assert.rejects(async () => {
    await mockFetch("https://generativelanguage.googleapis.com");
  });

  FakeGemini.reset();
});
