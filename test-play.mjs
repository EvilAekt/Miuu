// M0 langkah 2: putar satu link di voice channel.
// Pakai: node --env-file=.env scripts/m0/test-play.mjs <url atau kata kunci> [detik]
import { Client, GatewayIntentBits } from "discord.js";
import { LavalinkManager } from "lavalink-client";

const {
  DISCORD_TOKEN, GUILD_ID, VOICE_CHANNEL_ID, LAVALINK_PASSWORD,
  LAVALINK_HOST = "127.0.0.1", LAVALINK_PORT = "2333",
} = process.env;

const input = process.argv[2];
const playSeconds = Number(process.argv[3] ?? 20);

if (!DISCORD_TOKEN || !GUILD_ID || !VOICE_CHANNEL_ID || !LAVALINK_PASSWORD || !input) {
  console.error("Butuh DISCORD_TOKEN, GUILD_ID, VOICE_CHANNEL_ID, LAVALINK_PASSWORD di .env dan satu argumen url atau kata kunci.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let lavalink;
client.on("raw", (d) => lavalink?.sendRawData(d));

const ready = new Promise((resolve) => {
  client.once("clientReady", resolve); // discord.js versi baru
  client.once("ready", resolve);       // discord.js versi lama
});

await client.login(DISCORD_TOKEN);
await ready;

lavalink = new LavalinkManager({
  nodes: [{
    id: "local",
    host: LAVALINK_HOST,
    port: Number(LAVALINK_PORT),
    authorization: LAVALINK_PASSWORD,
  }],
  sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
  autoSkip: true,
  client: { id: client.user.id, username: client.user.username },
});

const nodeReady = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Node Lavalink tidak connect dalam 15 detik")), 15000);
  lavalink.nodeManager.on("connect", (node) => {
    clearTimeout(timer);
    console.log(`Node ${node.id} connect`);
    resolve();
  });
});
lavalink.nodeManager.on("error", (node, error) => console.error(`Node ${node.id} error:`, error?.message ?? error));

await lavalink.init({ id: client.user.id, username: client.user.username });
await nodeReady;

const player = lavalink.createPlayer({
  guildId: GUILD_ID,
  voiceChannelId: VOICE_CHANNEL_ID,
  textChannelId: VOICE_CHANNEL_ID,
  selfDeaf: true,
  volume: 50,
});

const t0 = performance.now();

lavalink.on("trackStart", (_p, track) => {
  const ms = Math.round(performance.now() - t0);
  console.log(`MULAI MAIN: ${track.info.title} | ${track.info.author}`);
  console.log(`Waktu dari search sampai trackStart: ${ms} ms (target PRD: 3000 ms untuk YouTube)`);
  setTimeout(async () => {
    console.log("Selesai uji, keluar dari VC.");
    await player.destroy();
    client.destroy();
    process.exit(0);
  }, playSeconds * 1000);
});
lavalink.on("trackError", (_p, track, payload) => {
  console.error("trackError:", track?.info?.title, payload?.exception?.message ?? payload);
  process.exit(1);
});
lavalink.on("trackStuck", (_p, track) => {
  console.error("trackStuck:", track?.info?.title);
  process.exit(1);
});

await player.connect();

const isUrl = /^https?:\/\//i.test(input);
const res = await player.search(isUrl ? { query: input } : { query: input, source: "ytmsearch" }, { id: "m0-test" });
console.log(`Hasil search: loadType=${res.loadType}, ${res.tracks.length} track`);

if (res.loadType === "error" || res.loadType === "empty" || res.tracks.length === 0) {
  console.error("Tidak ada track yang bisa diputar:", res.exception?.message ?? res.loadType);
  await player.destroy();
  client.destroy();
  process.exit(1);
}

await player.queue.add(res.tracks[0]);
await player.play();
