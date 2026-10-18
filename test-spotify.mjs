// M0 langkah 3: uji spotify-url-info terhadap daftar link.
// Pakai: node scripts/m0/test-spotify.mjs [file]  (default: scripts/m0/spotify-links.txt)
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import spotifyUrlInfo from "spotify-url-info";

const { getDetails } = spotifyUrlInfo(fetch);
const defaultFile = existsSync("scripts/m0/spotify-links.txt")
  ? "scripts/m0/spotify-links.txt"
  : (existsSync("spotify-links.txt") ? "spotify-links.txt" : "scripts/m0/spotify-links.txt");
const file = process.argv[2] ?? defaultFile;

const lines = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const outDir = existsSync("scripts/m0") ? "scripts/m0/out" : "out";
mkdirSync(outDir, { recursive: true });
const rows = [];

for (const [i, line] of lines.entries()) {
  const [url, ...rest] = line.split(/\s+/);
  const expected = Number(rest.find((r) => r.startsWith("expected="))?.split("=")[1]) || null;
  const t0 = performance.now();
  const row = { no: i + 1, url: url.replace("https://open.spotify.com/", ""), status: "", tipe: "", jumlah: "", expected: expected ?? "", ms: 0, catatan: "" };

  try {
    const { preview, tracks } = await getDetails(url);
    row.ms = Math.round(performance.now() - t0);
    row.tipe = preview?.type ?? "?";
    row.jumlah = tracks?.length ?? 0;
    row.status = "OK";

    const first = tracks?.[0];
    const notes = [];
    if (first) {
      notes.push(`field: ${Object.keys(first).join(",")}`);
      notes.push(`durasi=${first.duration ?? first.duration_ms ?? "tidak ada"}`);
      notes.push(`isrc=${first.isrc ?? first.external_ids?.isrc ?? "tidak ada"}`);
    }
    if (!tracks?.length) { row.status = "KOSONG"; }
    if (expected && row.jumlah < expected) { row.status = "TERPOTONG"; notes.push(`dapat ${row.jumlah} dari ${expected}`); }
    row.catatan = notes.join(" | ");

    writeFileSync(`${outDir}/${String(i + 1).padStart(2, "0")}.json`, JSON.stringify({ url, preview, tracks }, null, 2));
  } catch (e) {
    row.ms = Math.round(performance.now() - t0);
    row.status = "GAGAL";
    row.catatan = (e?.message ?? String(e)).slice(0, 120);
  }
  rows.push(row);
  await new Promise((r) => setTimeout(r, 1000)); // jeda sopan antar request
}

console.table(rows.map(({ no, url, status, tipe, jumlah, expected, ms }) => ({ no, url, status, tipe, jumlah, expected, ms })));
for (const r of rows.filter((r) => r.catatan)) console.log(`#${r.no} ${r.status}: ${r.catatan}`);
