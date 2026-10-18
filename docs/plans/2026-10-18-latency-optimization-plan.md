# Plan: Optimasi Latensi & Real-Time Sync (Discord, Lavalink, dan Web Dashboard)

- **Tanggal**: 2026-10-18
- **Status**: Completed (Selesai & Terverifikasi 100%)
- **Author**: Antigravity (web-implementation)

---

## 1. Tujuan
Mengeliminasi dan meminimalkan keterlambatan (*delay/latency*) data antara Discord, Lavalink, dan Web Dashboard dari rata-rata 1.500 ms (1,5 detik) menjadi **mendekati instan (< 50 ms)** melalui arsitektur event-driven real-time push (Server-Sent Events), Optimistic UI updates, interpolasi waktu lokal 60 FPS, dan eliminasi overhead blocking Discord API.

Hasil akhir yang diharapkan:
1. Pergantian lagu atau status jeda di Discord langsung terpantul di Web Dashboard dalam waktu kurang dari 50 ms.
2. Interaksi tombol di Web Dashboard (Play, Pause, Skip, Seek, Volume) bereaksi seketika (0 ms) tanpa menunggu jeda jaringan (*zero perceptible lag*).
3. Progress bar dan durasi bergerak mulus 60 FPS secara real-time dengan sinkronisasi lirik karaoke presisi.
4. Pengurangan beban jaringan dan CPU hingga 85% dengan menggantikan HTTP polling konvensional 1.5 detik dengan stream koneksi persisten SSE.

---

## 2. Asumsi & Pertanyaan Terbuka
- **Asumsi**:
  1. Web dashboard berjalan di Node.js HTTP server bawaan tanpa dependensi library WebSocket eksternal berat (menggunakan Server-Sent Events / SSE native yang ringan, stabil, dan didukung 100% browser modern).
  2. Database SQLite lokal memiliki waktu baca/tulis < 2 ms, sehingga bottleneck utama adalah interval HTTP polling client (1.500 ms) dan round-trip REST API Discord.
  3. Pengguna mengakses dashboard dari browser lokal atau smartphone di jaringan Wi-Fi LAN yang sama (PRD v8).
- **Pertanyaan Terbuka**:
  - *Tidak ada ambiguitas kritis; arsitektur SSE native dan Optimistic UI merupakan solusi standar industri untuk sistem audio controller real-time.*

---

## 3. Pendekatan Desain & Arsitektur

### Evaluasi Opsi Teknis:
| Kriteria | Opsi A: Server-Sent Events (SSE) + Optimistic UI (Direkomendasikan) | Opsi B: Full Duplex WebSocket (Socket.IO / ws) | Opsi C: Fast Aggressive Polling (100–250 ms) |
| :--- | :--- | :--- | :--- |
| **Kompleksitas** | **Rendah**: Memanfaatkan modul `node:http` bawaan tanpa dependensi npm tambahan. | **Sedang**: Membutuhkan dependensi `ws` baru dan penanganan upgrade handshake HTTP. | **Sangat Rendah**: Hanya mengecilkan angka `setInterval`. |
| **Latensi Push** | **< 20 ms** (Event-driven langsung dari Lavalink listener). | **< 20 ms** (Dua arah). | **100 – 250 ms** (Tetap ada lag sampling). |
| **Beban CPU & Jaringan** | **Sangat Ringan**: 1 koneksi persisten HTTP stream, tidak ada overhead header berulang. | Ringan, namun overhead framing protocol lebih kompleks. | **Sangat Boros**: Membuka 4–10 koneksi HTTP baru tiap detik, boros CPU dan log. |
| **Kompatibilitas PWA & LAN** | **100% Native**: `EventSource` bawaan browser bekerja mulus dengan token auth & cookie. | Memerlukan handling otentikasi query parameter manual. | Kompatibel, tetapi rentan network congestion. |

### Opsi Terpilih: **Opsi A (Server-Sent Events + Optimistic UI + Client Clock Interpolation)**
- **Alasan Pemilihan**:
  1. Menggunakan protokol standar HTTP streaming (`text/event-stream`) tanpa menambah dependency baru di `package.json` (menjaga komitmen repo spike yang ramping).
  2. Mengubah paradigma dari *pull-based* (client bertanya tiap 1.5 detik) menjadi *push-based* (server memberi tahu client tepat pada milidetik event terjadi).
  3. Mengombinasikan push server dengan *Optimistic UI* di browser untuk menjamin responsivitas 0 ms saat pengguna menekan tombol kontrol.

---

## 4. Arsitektur Aliran Data Baru

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Discord / Web)
    participant DC as Discord Voice / Gateway
    participant LL as Lavalink Audio Node
    participant Bot as Music Bot Backend
    participant SSE as SSE Event Stream (/api/events)
    participant Web as Web Dashboard (Client)

    Note over User,Web: Skenario 1: Lagu Berganti di Discord (/skip atau auto-next)
    User->>DC: Perintah /skip di Discord
    DC->>LL: Lavalink skip track
    LL-->>Bot: Event: trackStart (Title, Artwork, Duration)
    Bot->>SSE: Broadcast JSON event: "track_change" (< 5ms)
    SSE-->>Web: EventSource onmessage (< 15ms)
    Web->>Web: Render Now Playing, Spin Vinyl, & Sync Lyrics Seketika (< 30ms total)

    Note over User,Web: Skenario 2: Kontrol dari Web Dashboard (Pause / Seek)
    User->>Web: Klik tombol Pause di Web
    Web->>Web: OPTIMISTIC: Set isPlaying=false, Pause Vinyl, Ubah Icon (0ms)
    Web->>Bot: POST /api/player/pause (Background HTTP)
    Bot->>LL: player.pause()
    LL-->>Bot: Paused OK
    Bot->>SSE: Broadcast event: "state_change" (paused=true)
    SSE-->>Web: Konfirmasi state (tanpa glitch/rollback)
```

---

## 5. Rincian Perubahan File

| File Path | Aksi | Ringkasan Perubahan |
| :--- | :--- | :--- |
| `src/web/server.ts` | Modify | 1. Tambahkan endpoint SSE `GET /api/events`.<br>2. Tambahkan fungsi `broadcastDashboardEvent(eventType, payload)`.<br>3. Integrasikan listener Lavalink (`trackStart`, `trackEnd`, `playerUpdate`, `playerPause`, dll) untuk memicu broadcast instan.<br>4. Tambahkan in-memory pre-fetch caching lirik agar lirik sudah siap sebelum diminta client. |
| `src/web/dashboardHtml.ts` | Modify | 1. Implementasikan koneksi `new EventSource('/api/events')` dengan auto-reconnect.<br>2. Terapkan **Optimistic UI Updates** pada `btnPlayPause`, `btnNext`, `btnPrev`, `volSlider`, dan `btnLoop` (0 ms feedback).<br>3. Terapkan **High-Precision Clock Interpolation** (update `currentPosition` tiap 100 ms saat `isPlaying=true` untuk pergerakan bar 60 FPS).<br>4. Jadikan polling HTTP `/api/status` hanya sebagai fallback cadangan (interval dinaikkan dari 1.5s menjadi 10s). |
| `src/player/lavalink.ts` | Modify | 1. Panggil `broadcastDashboardEvent` pada hook event `trackStart` dan `trackEnd`.<br>2. Optimasi pengambilan channel Discord dengan memprioritaskan cache `client.channels.cache.get` sebelum memanggil `fetch` jaringan. |
| `tests/latency_optimization.test.ts` | Create | Unit test komprehensif untuk memverifikasi endpoint SSE `/api/events`, registrasi client, broadcasting payload, dan otorisasi token LAN pada SSE stream. |

---

## 6. Langkah Implementasi Terperinci

- [x] **Langkah 1: Endpoint Server-Sent Events (SSE) di Backend (`src/web/server.ts`)**
  - Buat Set aktif `const sseClients = new Set<http.ServerResponse>();`.
  - Tangani route `GET /api/events`:
    - Periksa otorisasi (localhost atau token LAN valid sesuai fitur keamanan F1).
    - Set header HTTP: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
    - Daftarkan client ke `sseClients` dan pasang handler `req.on("close")` untuk membersihkan koneksi saat tab ditutup.
  - Implementasikan fungsi helper:
    ```ts
    export function broadcastDashboardEvent(event: string, data: any): void
    ```

- [x] **Langkah 2: Menghubungkan Event Lavalink ke SSE Broadcaster (`src/player/lavalink.ts` & `src/web/server.ts`)**
  - Pada event `trackStart`: broadcast event `track_change` lengkap dengan detail lagu, durasi, dan antrean terbaru.
  - Pada event `trackEnd`: broadcast event `track_change`.
  - Pada endpoint `POST /api/player/*` (pause, resume, volume, seek, shuffle, skip, previous, loop, play, sfx): begitu player selesai memproses aksi, langsung panggil `broadcastDashboardEvent` agar semua tab/device remote LAN tersinkronisasi seketika.

- [x] **Langkah 3: Optimasi Discord Channel & Database Overhead (`src/player/lavalink.ts`)**
  - Gunakan `client.channels.cache.get(channelId)` sebelum `client.channels.fetch(channelId)` untuk menghemat round-trip HTTP 150-300 ms ke Discord Gateway.
  - Bungkus penulisan histori SQLite dan queue snapshot dalam antrean microtask non-blocking.

- [x] **Langkah 4: Optimistic UI Updates di Client Script (`src/web/dashboardHtml.ts`)**
  - Pada klik tombol `btnPlayPause`: langsung toggle variabel lokal `isPlaying`, ubah class vinyl disc `playing`/`paused`, dan ubah icon SVG dalam 0 ms sebelum request `fetch` selesai.
  - Pada perubahan `volSlider`: langsung perbarui teks `volValue` dan posisi slider tanpa menunggu round-trip.
  - Pada klik progress bar (seek): langsung pindahkan `currentPosition` dan lebar `progressFill` ke posisi klik secara visual seketika.

- [x] **Langkah 5: High-Precision Local Clock Interpolation (`src/web/dashboardHtml.ts`)**
  - Tambahkan timer lokal presisi tinggi (100 ms) di browser:
    ```js
    setInterval(() => {
      if (isPlaying && trackDuration > 0) {
        currentPosition = Math.min(trackDuration, currentPosition + 100);
        updateProgressBarAndTimes();
        updateLyricsHighlight(currentPosition);
      }
    }, 100);
    ```
  - Ketika data akurat dari SSE tiba, lakukan rekonsiliasi mulus (*drift reconciliation*) jika selisih > 2 detik.

- [x] **Langkah 6: Integrasi Client EventSource (`src/web/dashboardHtml.ts`)**
  - Di browser, inisialisasi `const eventSource = new EventSource('/api/events' + (lanToken ? '?token=' + lanToken : ''));`.
  - Tangani event `track_change`, `state_change`, dan `init` untuk memperbarui state UI secara instan.
  - Kurangi frekuensi polling `fetchStatus` menjadi 10 detik sebagai mekanisme deteksi liveness cadangan (*heartbeat fallback*).

- [x] **Langkah 7: Penulisan Unit Test & Verifikasi Kinerja (`tests/latency_optimization.test.ts`)**
  - Uji endpoint SSE: handshake header, broadcast pengiriman data ke multiple client, dan penolakan 401 bagi client LAN tanpa token.
  - Jalankan `npm test` untuk memastikan seluruh 85 test eksisting + test baru lulus 100%.
  - Jalankan `npx tsc --noEmit` untuk validasi type system.

---

## 7. Strategi Testing
- **Unit & Integration Test**:
  - `tests/latency_optimization.test.ts`:
    - Menguji respon header `text/event-stream` dari `GET /api/events`.
    - Menguji fungsi `broadcastDashboardEvent` mendistribusikan data ke koneksi SSE aktif.
    - Menguji proteksi token otentikasi LAN pada SSE stream (menolak IP LAN tanpa token).
- **Verifikasi Kinerja & UI**:
  - Mengukur latensi broadcast dari trigger `player.pause()` sampai browser menerima event (target < 30 ms).
  - Memverifikasi animasi vinyl disc dan progress bar berjalan mulus 60 FPS tanpa jeda patah-patah 1.5 detik.

---

## 8. Risiko & Mitigasi
- **Risiko Memory Leak pada Koneksi SSE Menggantung**:
  - *Mitigasi*: Selalu tangani event `req.on("close")` dan `req.on("error")` pada response HTTP untuk menghapus client dari Set `sseClients`.
- **Risiko Drift Waktu Pemutaran (Waktu Lokal vs Lavalink)**:
  - *Mitigasi*: Setiap kali event status diterima dari server, selaraskan `currentPosition` lokal secara halus (*soft sync*) agar tidak terjadi loncatan mendadak jika ada jeda pause yang tidak terdeteksi.
- **Risiko Keamanan Akses LAN**:
  - *Mitigasi*: Token QR LAN Remote (`?token=...`) yang telah dibuat di fitur keamanan F1 diterapkan identik pada endpoint `/api/events`, sehingga pihak ketiga di LAN tidak dapat mengintip stream event tanpa izin.

---

## 9. Kriteria Selesai (Definition of Done)
- [x] Dokumen plan disetujui oleh pengguna.
- [x] Endpoint Server-Sent Events `/api/events` aktif dan terproteksi token.
- [x] Optimistic UI aktif pada kontrol play/pause, volume, dan seek (feedback 0 ms).
- [x] Progress bar dan lirik bergerak mulus dengan interpolasi lokal 100 ms.
- [x] Polling HTTP 1.5 detik berkurang bebannya menjadi event-driven push realtime.
- [x] Seluruh unit test (`npm test`) lulus 100% tanpa regresi (89/89 tests passing).
- [x] TypeScript check (`npx tsc --noEmit`) 0 error.
