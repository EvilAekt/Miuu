// M0 langkah 1: cek Lavalink lewat REST. Tanpa library tambahan.
// Pakai: node --env-file=.env scripts/m0/test-lavalink.mjs <url atau kata kunci> ...
const host = process.env.LAVALINK_HOST ?? "127.0.0.1";
const port = process.env.LAVALINK_PORT ?? "2333";
const password = process.env.LAVALINK_PASSWORD;
const base = `http://${host}:${port}`;

if (!password) {
  console.error("LAVALINK_PASSWORD kosong. Isi .env dulu.");
  process.exit(1);
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Beri minimal satu input. Contoh: node --env-file=.env scripts/m0/test-lavalink.mjs "https://youtu.be/ID" "ytmsearch:judul lagu"');
  process.exit(1);
}

async function get(path) {
  const res = await fetch(base + path, { headers: { Authorization: password } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} di ${path}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

let failed = 0;

try {
  console.log("Versi Lavalink:", await get("/version"));
  const info = await get("/v4/info");
  console.log("Source aktif:", info.sourceManagers.join(", "));
  console.log("Plugin:", info.plugins.map((p) => `${p.name} ${p.version}`).join(", ") || "(kosong)");
  if (!info.plugins.some((p) => p.name.toLowerCase().includes("youtube"))) {
    console.error("Plugin YouTube tidak termuat. Cek lavalink/logs.");
    failed++;
  }
} catch (e) {
  console.error("Lavalink tidak terjangkau:", e.message);
  process.exit(1);
}

for (const input of inputs) {
  const identifier = /^(https?:|[a-z]+search:)/i.test(input) ? input : `ytmsearch:${input}`;
  const t0 = performance.now();
  try {
    const data = await get(`/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`);
    const ms = Math.round(performance.now() - t0);
    const d = data.data;
    if (data.loadType === "error") {
      console.log(`GAGAL  ${identifier}\n       ${d.message} (${d.severity})  ${ms} ms`);
      failed++;
    } else if (data.loadType === "empty") {
      console.log(`KOSONG ${identifier}  ${ms} ms`);
      failed++;
    } else if (data.loadType === "track") {
      console.log(`OK track     ${d.info.title} | ${d.info.author} | ${Math.round(d.info.length / 1000)} dtk | live=${d.info.isStream}  ${ms} ms`);
    } else if (data.loadType === "playlist") {
      console.log(`OK playlist  ${d.info.name} | ${d.tracks.length} lagu  ${ms} ms`);
    } else if (data.loadType === "search") {
      const first = d[0];
      console.log(`OK search    ${d.length} hasil, teratas: ${first.info.title} | ${first.info.author} | ${Math.round(first.info.length / 1000)} dtk | isrc=${first.info.isrc ?? "-"}  ${ms} ms`);
    }
  } catch (e) {
    console.log(`GAGAL  ${identifier}\n       ${e.message}`);
    failed++;
  }
}

process.exit(failed ? 1 : 0);
