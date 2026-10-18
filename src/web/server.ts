import http from "node:http";
import os from "node:os";
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import type { Client } from "discord.js";
import { lavalink } from "../player/lavalink.js";
import { getListeningStats, getRecentHealthEvents } from "../db/index.js";
import { fetchLyrics, cleanTrackTitle } from "../lyrics/lyricsService.js";
import { isMaintenanceMode } from "../config/maintenance.js";
import { getCachedSearchResults, setCachedSearchResults } from "../player/searchCache.js";
import { config as envConfig } from "../config/env.js";
import { renderDashboardHtml } from "./dashboardHtml.js";

export { renderDashboardHtml };

export interface DashboardServerConfig {
  port: number;
  host: string;
}

/**
 * Mendapatkan IP lokal IPv4 perangkat di jaringan LAN / Wi-Fi
 */
export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

/**
 * Memverifikasi apakah remote IP adalah Localhost atau subnet privat LAN
 */
export function isLanOrLocalhost(ip: string): boolean {
  const cleanIp = ip.replace(/^::ffff:/, "");
  if (
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp === "localhost"
  ) {
    return true;
  }
  // Subnet Privat: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  return false;
}

/**
 * Token autentikasi untuk akses kontrol player dari perangkat LAN.
 * Dihasilkan secara acak saat server berjalan dan disematkan ke URL QR Code.
 */
export let currentLanToken: string = "remote_" + Math.random().toString(36).substring(2, 10);

export function setLanToken(token: string): void {
  currentLanToken = token;
}

/**
 * Memvalidasi apakah request memiliki hak akses (localhost atau LAN dengan token sah)
 */
export function isRequestAuthorized(req: http.IncomingMessage, url: URL): boolean {
  const remoteIp = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
  const isLocalhost = remoteIp === "127.0.0.1" || remoteIp === "::1" || remoteIp === "localhost";
  if (isLocalhost) return true;

  // 1. Cek query string ?token=...
  const queryToken = url.searchParams.get("token");
  if (queryToken && queryToken === currentLanToken) return true;

  // 2. Cek Header X-Remote-Token
  const headerToken = req.headers["x-remote-token"];
  if (headerToken && headerToken === currentLanToken) return true;

  // 3. Cek Cookie mmb_token
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/(?:^|;\s*)mmb_token=([^;]+)/);
  if (match && match[1] === currentLanToken) return true;

  return false;
}

/**
 * Kumpulan koneksi SSE aktif untuk real-time event-driven push
 */
export const sseClients = new Set<http.ServerResponse>();

export function broadcastDashboardEvent(eventType: string, data: any): void {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const clientRes of sseClients) {
    try {
      clientRes.write(payload);
    } catch {
      sseClients.delete(clientRes);
    }
  }
}

/**
 * Mengambil instance player aktif pertama
 */
export function getFirstActivePlayer() {
  if (!lavalink || !lavalink.players) return null;
  for (const [, player] of lavalink.players) {
    if (player.queue.current || player.playing || player.paused || player.queue.tracks.length > 0) {
      return player;
    }
  }
  return lavalink.players.values().next().value || null;
}

/**
 * Mengambil snapshot status dashboard lengkap untuk disajikan via REST atau SSE broadcast
 */
export function getCompleteDashboardStatus(client: Client) {
  const player = getFirstActivePlayer();
  let activePlayerData = null;

  if (player) {
    activePlayerData = {
      guildId: player.guildId,
      playing: !!player.playing,
      paused: !!player.paused,
      volume: player.volume,
      position: player.position || 0,
      repeatMode: player.repeatMode || "off",
      current: player.queue.current
        ? {
            title: player.queue.current.info.title,
            author: player.queue.current.info.author,
            artworkUrl: player.queue.current.info.artworkUrl || null,
            uri: player.queue.current.info.uri,
            duration: player.queue.current.info.duration,
          }
        : null,
      queue: player.queue.tracks.map((t) => ({
        title: t.info.title,
        author: t.info.author,
        duration: t.info.duration,
        uri: t.info.uri,
        artworkUrl: t.info.artworkUrl || null,
      })),
    };
  }

  const firstGuild = (client.guilds?.cache as any)?.first?.() || Array.from(client.guilds?.cache?.values?.() || [])[0];
  const guildId = player?.guildId || firstGuild?.id || "default";
  const stats = getListeningStats(guildId);
  const healthEvents = getRecentHealthEvents(5);

  return {
    botName: client.user?.username || "Discord Music Bot",
    connected: client.isReady(),
    wsStatus: client.ws?.status ?? -1,
    ping: client.ws?.ping ?? 0,
    guildCount: client.guilds?.cache?.size ?? 1,
    maintenanceMode: isMaintenanceMode(),
    player: activePlayerData,
    stats,
    healthEvents,
    serverTime: Date.now(),
  };
}

export function startDashboardServer(
  client: Client,
  config: DashboardServerConfig = { port: 3000, host: "0.0.0.0" }
): http.Server {
  const server = http.createServer(async (req, res) => {
    // Keamanan: Validasi bahwa akses hanya dari localhost atau jaringan lokal (LAN)
    const remoteIp = req.socket.remoteAddress || "";
    if (!isLanOrLocalhost(remoteIp)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("403 Forbidden: Dashboard hanya dapat diakses melalui Localhost atau Jaringan Lokal (LAN).");
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    // Helper kirim JSON
    const sendJson = (data: any, statusCode = 200) => {
      res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end(JSON.stringify(data));
    };

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    // Helper baca body request POST
    const readBody = async (): Promise<any> => {
      return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    // 0. SSE Stream: GET /api/events (Real-Time Push Stream)
    if (pathname === "/api/events" && req.method === "GET") {
      if (!isRequestAuthorized(req, url)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized SSE access" }));
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
      });

      // Kirim event pembuka seketika
      const initialStatus = getCompleteDashboardStatus(client);
      res.write(`event: init\ndata: ${JSON.stringify(initialStatus)}\n\n`);

      sseClients.add(res);

      req.on("close", () => {
        sseClients.delete(res);
      });
      return;
    }

    // 1. API: GET /api/status (REST Polling Fallback)
    if (pathname === "/api/status" && req.method === "GET") {
      return sendJson(getCompleteDashboardStatus(client));
    }

    // 1b. API: GET /api/diag (Live Cloud Diagnostics)
    if (pathname === "/api/diag" && req.method === "GET") {
      const diag: any = {
        serverTime: Date.now(),
        clientReady: client.isReady(),
        wsStatus: client.ws?.status,
        ping: client.ws?.ping,
        nodeVersion: process.version,
        tokenLength: envConfig.DISCORD_TOKEN?.length ?? 0,
      };

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://discord.com/api/v10/gateway/bot", {
          headers: { Authorization: `Bot ${envConfig.DISCORD_TOKEN}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        diag.gatewayHttp = { status: res.status, ok: res.ok, body: await res.json() };
      } catch (err: any) {
        diag.gatewayHttp = { error: err?.message ?? String(err) };
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const proto = envConfig.LAVALINK_SECURE ? "https" : "http";
        const res = await fetch(`${proto}://${envConfig.LAVALINK_HOST}:${envConfig.LAVALINK_PORT}/v4/info`, {
          headers: { Authorization: envConfig.LAVALINK_PASSWORD },
          signal: controller.signal,
        });
        clearTimeout(timer);
        diag.lavalinkHttp = { status: res.status, ok: res.ok, body: await res.json() };
      } catch (err: any) {
        diag.lavalinkHttp = { error: err?.message ?? String(err) };
      }

      try {
        diag.lavalinkNodes = lavalink?.nodeManager?.nodes
          ? Array.from(lavalink.nodeManager.nodes.values()).map((n) => ({
              id: n.id,
              host: n.options.host,
              port: n.options.port,
              connected: n.connected,
              stats: n.stats,
            }))
          : [];
      } catch (err: any) {
        diag.lavalinkNodes = { error: err?.message ?? String(err) };
      }

      if (!client.isReady() && (client.ws?.status === 3 || client.ws?.status === 5)) {
        console.log("[Diagnostic] Memanggil ulang client.login dari endpoint /api/diag...");
        client.login(envConfig.DISCORD_TOKEN).catch((err) => {
          console.error("[Diagnostic Login Error]", err);
        });
      }

      return sendJson(diag);
    }

    // PWA Manifest: GET /manifest.json (PRD v4 E6)
    if (pathname === "/manifest.json" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/manifest+json" });
      res.end(
        JSON.stringify({
          name: "Discord Music Bot Controller",
          short_name: "Miu Music",
          description: "Mobile PWA Controller untuk Discord Music Bot",
          start_url: "/",
          display: "standalone",
          background_color: "#0b0f19",
          theme_color: "#6366f1",
          icons: [
            {
              src: "https://cdn-icons-png.flaticon.com/512/3844/3844724.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        })
      );
      return;
    }

    // Static Assets: GET /assets/*
    if (pathname.startsWith("/assets/") && req.method === "GET") {
      const filename = path.basename(pathname);
      const filePath = path.join(process.cwd(), "assets", filename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".webp": "image/webp",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
        };
        const contentType = mimeTypes[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    // LAN Info: GET /api/lan-info (PRD v8 Feature 4)
    if (pathname === "/api/lan-info" && req.method === "GET") {
      const localIp = getLocalIpAddress();
      const lanUrl = `http://${localIp}:${config.port}/?token=${currentLanToken}`;
      return sendJson({
        localIp,
        port: config.port,
        lanUrl,
        token: currentLanToken,
      });
    }

    // 2. API: GET /api/lyrics
    if (pathname === "/api/lyrics" && req.method === "GET") {
      let title = url.searchParams.get("title");
      let artist = url.searchParams.get("artist") || "";

      if (!title) {
        const player = getFirstActivePlayer();
        if (player && player.queue.current) {
          title = player.queue.current.info.title;
          artist = player.queue.current.info.author || "";
        }
      }

      if (!title) {
        return sendJson({ error: "Tidak ada judul lagu yang diberikan atau sedang diputar." }, 400);
      }

      try {
        const lyrics = await fetchLyrics(title, artist);
        return sendJson(lyrics || { trackName: title, artistName: artist, plainLyrics: null, syncedLyrics: null, syncedLines: [] });
      } catch (err: any) {
        return sendJson({ error: err?.message || "Gagal mengambil lirik" }, 500);
      }
    }

    // 3. API Kontrol Player: POST /api/player/:action
    if (pathname.startsWith("/api/player/") && req.method === "POST") {
      // Keamanan F1: Validasi otorisasi LAN Remote
      if (!isRequestAuthorized(req, url)) {
        return sendJson(
          {
            success: false,
            message: "Akses ditolak (401 Unauthorized): Token autentikasi LAN Remote diperlukan atau tidak valid.",
          },
          401
        );
      }

      const action = pathname.replace("/api/player/", "");
      const player = getFirstActivePlayer();

      if (!player) {
        return sendJson({ success: false, message: "Tidak ada pemutar musik (player) yang aktif." }, 404);
      }

      const body = await readBody();

      const sendPlayerSuccess = (payload: any) => {
        try {
          broadcastDashboardEvent("state_change", getCompleteDashboardStatus(client));
        } catch (e) {
          console.error("SSE broadcast error:", e);
        }
        return sendJson(payload);
      };

      try {
        if (action === "pause") {
          await player.pause();
          return sendPlayerSuccess({ success: true, message: "Musik dijeda (paused)." });
        }
        if (action === "resume") {
          await player.resume();
          return sendPlayerSuccess({ success: true, message: "Musik dilanjutkan (resumed)." });
        }
        if (action === "skip") {
          const skipped = await player.skip();
          return sendPlayerSuccess({ success: true, message: "Lagu berhasil dilewati (skipped).", skipped });
        }
        if (action === "previous") {
          const prev = player.queue.previous[player.queue.previous.length - 1];
          if (prev) {
            player.queue.add(prev, 0);
            await player.skip();
            return sendPlayerSuccess({ success: true, message: "Memutar kembali lagu sebelumnya." });
          }
          return sendJson({ success: false, message: "Tidak ada lagu sebelumnya." }, 400);
        }
        if (action === "volume") {
          const newVol = Number(body.volume);
          if (isNaN(newVol) || newVol < 0 || newVol > 150) {
            return sendJson({ success: false, message: "Volume harus antara 0 dan 150." }, 400);
          }
          await player.setVolume(newVol);
          return sendPlayerSuccess({ success: true, message: `Volume diubah ke ${newVol}%.`, volume: newVol });
        }
        if (action === "shuffle") {
          player.queue.shuffle();
          return sendPlayerSuccess({ success: true, message: "Antrean lagu berhasil diacak." });
        }
        if (action === "sfx") {
          const effect = body.effect || "airhorn";
          const { SFX_PRESETS } = await import("../commands/sfx.js");
          const sfx = SFX_PRESETS[effect];
          if (sfx) {
            const res = await player.search({ query: sfx.query }, client.user as any);
            if (res && res.tracks && res.tracks.length > 0) {
              const track = res.tracks[0];
              if (player.playing) {
                player.queue.tracks.unshift(track);
                await player.skip();
              } else {
                await player.queue.add(track);
                await player.play();
              }
              return sendPlayerSuccess({ success: true, message: `Memutar SFX: ${sfx.label}` });
            }
          }
          return sendJson({ success: false, message: "SFX tidak ditemukan atau gagal dimuat." }, 404);
        }
        if (action === "seek") {
          const positionMs = Number(body.position);
          if (!isNaN(positionMs) && positionMs >= 0) {
            await player.seek(positionMs);
            return sendPlayerSuccess({ success: true, message: `Posisi dipindahkan ke ${Math.floor(positionMs / 1000)} detik.`, position: positionMs });
          }
          return sendJson({ success: false, message: "Parameter position tidak valid." }, 400);
        }
        if (action === "loop") {
          const currentMode = player.repeatMode || "off";
          const nextMode = body.mode || (currentMode === "off" ? "track" : currentMode === "track" ? "queue" : "off");
          await player.setRepeatMode(nextMode);
          return sendPlayerSuccess({ success: true, message: `Mode repeat diubah ke ${nextMode}.`, repeatMode: nextMode });
        }
        if (action === "play") {
          const query = body.query?.trim();
          if (!query) {
            return sendJson({ success: false, message: "Judul lagu atau link tidak boleh kosong." }, 400);
          }

          let res = getCachedSearchResults(query, "ytsearch");
          if (!res) {
            res = await player.search({ query }, client.user as any);
            if (res && res.tracks && res.tracks.length > 0) {
              setCachedSearchResults(query, "ytsearch", res);
            }
          }

          if (!res || !res.tracks || res.tracks.length === 0) {
            return sendJson({ success: false, message: "Lagu tidak ditemukan." }, 404);
          }
          const track = res.tracks[0];
          if (!player.playing && !player.paused) {
            await player.queue.add(track);
            await player.play();
          } else {
            await player.queue.add(track);
          }
          return sendPlayerSuccess({ success: true, message: `Ditambahkan: ${track.info.title}`, track: track.info });
        }

        return sendJson({ success: false, message: `Aksi player tidak dikenal: ${action}` }, 400);
      } catch (err: any) {
        return sendJson({ success: false, message: err?.message || "Gagal memproses perintah player." }, 500);
      }
    }

    // 4. Web UI: GET / (Single Page Dashboard dengan Kompresi Gzip)
    if (pathname === "/" && req.method === "GET") {
      const remoteIp = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
      const isLocalhost = remoteIp === "127.0.0.1" || remoteIp === "::1" || remoteIp === "localhost";
      const authorized = isRequestAuthorized(req, url);

      // Keamanan F1: Jika diakses dari perangkat LAN tanpa token yang sah
      if (!isLocalhost && !authorized) {
        res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" });
        res.end(renderUnauthorizedLanHtml());
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "text/html; charset=utf-8",
      };

      // Jika membawa token valid di query parameter, pasang cookie sesi browser
      const queryToken = url.searchParams.get("token");
      if (queryToken && queryToken === currentLanToken) {
        headers["Set-Cookie"] = `mmb_token=${currentLanToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
      }

      const rawHtml = renderDashboardHtml();
      const acceptEncoding = req.headers["accept-encoding"] || "";

      // Kompresi Gzip bawaan Node: pangkas dari ~60 KB menjadi ~12 KB (80% lebih kecil & cepat)
      if (acceptEncoding.includes("gzip")) {
        const compressed = zlib.gzipSync(Buffer.from(rawHtml, "utf-8"));
        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = String(compressed.length);
        res.writeHead(200, headers);
        res.end(compressed);
      } else {
        res.writeHead(200, headers);
        res.end(rawHtml);
      }
      return;
    }

    // 404 Not Found
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  });

  server.listen(config.port, config.host, () => {
    console.log(`[Dashboard Web] Server lokal aktif di http://${config.host}:${config.port}`);
  });

  return server;
}

export function renderUnauthorizedLanHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#ef4444">
  <title>Akses LAN Memerlukan Izin — Discord Music Bot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0b0f19;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      padding: 1.5rem;
    }
    .card {
      background: rgba(18, 24, 38, 0.85);
      border: 1px solid rgba(239, 68, 68, 0.3);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
      border-radius: 16px;
      max-width: 440px;
      width: 100%;
      padding: 2rem;
      text-align: center;
      backdrop-filter: blur(16px);
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.75rem 0;
      color: #fff;
    }
    p {
      font-size: 0.9rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .badge {
      display: inline-block;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <div class="badge">401 Unauthorized</div>
    <h1>Akses Remote LAN Dilindungi</h1>
    <p>
      Untuk melindungi keamanan bot dari kontrol tanpa izin di jaringan Wi-Fi lokal, Anda memerlukan token QR Code yang sah.
    </p>
    <p style="font-size: 0.85rem; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 0.8rem; border-radius: 8px;">
      👉 Buka dashboard di komputer host, klik tombol <b>📱 Remote HP</b>, lalu pindai QR Code yang tampil dengan kamera smartphone Anda.
    </p>
  </div>
</body>
</html>`;
}
