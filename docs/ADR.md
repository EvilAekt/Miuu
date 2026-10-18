# 📐 Architecture Decision Records (ADR)

Dokumentasi keputusan arsitektur utama untuk Bot Discord Music Pribadi (PRD v1, v2, v3, dan v4).

---

### ADR-001: Local PC First vs VPS Hosting
- **Status:** Diterima (PRD v1 & v3 Epic 2)
- **Konteks:** Menjalankan bot musik Discord dengan biaya $0 tanpa langganan VPS atau dependensi cloud bulanan.
- **Keputusan:** Menjalankan bot dan server audio Lavalink v4 secara lokal di Windows dengan JRE 21 bawaan dan background service. Opsi VPS dihindari karena IP datacenter kerap diblokir/rate limit oleh YouTube.
- **Konsekuensi:** Bot hanya online saat PC menyala atau dalam mode awake (pencegahan sleep via powercfg).

---

### ADR-002: Lavalink Audio Node vs Pemutar Internal Node.js
- **Status:** Diterima (PRD v1 K2)
- **Konteks:** Pemutaran audio di Node.js rentan frame drops dan lag saat garbage collection atau CPU spike.
- **Keputusan:** Menggunakan Lavalink v4 (Java) dengan plugin lavaplayer YouTube. Node.js hanya berfungsi sebagai controller (discord.js + lavalink-client).
- **Konsekuensi:** Memerlukan Java runtime (disediakan lokal di folder `jre/`), tetapi konsumsi RAM bot Node.js sangat hemat (< 60MB).

---

### ADR-003: SQLite WAL Mode vs PostgreSQL / Redis
- **Status:** Diterima (PRD v1 K3 & PRD v3 K3)
- **Konteks:** Kebutuhan penyimpanan cache lagu, playlist, favorit, statistik, riwayat, dan snapshot antrean.
- **Keputusan:** Menggunakan `better-sqlite3` dalam format file tunggal (`data/bot.db`) dengan `PRAGMA journal_mode = WAL`.
- **Konsekuensi:** Sangat cepat (< 1ms per operasi), zero-setup, mudah dibackup cukup dengan menyalin satu file, tanpa overhead proses database eksternal.

---

### ADR-004: Slash Commands & Interactive Components vs Text Commands
- **Status:** Diterima (PRD v1 K4 & PRD v2 Epic 8)
- **Konteks:** Antarmuka interaksi Discord yang ramah pengguna.
- **Keputusan:** Menggunakan Discord Interaction Framework (Slash Commands dengan autocomplete dan Interactive ActionRow Buttons / Select Menus).
- **Konsekuensi:** Mengurangi kesalahan input teks, menyediakan feedback visual real-time, dan mendukung layout Discord Components V2.

---

### ADR-005: Open LRCLIB Database vs Spotify Musixmatch Scraper
- **Status:** Diterima (PRD v2 Epic 8)
- **Konteks:** Menampilkan lirik lagu tersinkronisasi (synced lyrics) kata demi kata.
- **Keputusan:** Menggunakan LRCLIB public API terbuka tanpa autentikasi / API key berbayar.
- **Konsekuensi:** Tidak memerlukan token Spotify premium atau scraping ilegal, dengan tingkat kecocokan tinggi untuk lagu populer.

---

### ADR-006: Sesi Per-Channel & Pembatasan Konkurensi 3 Sesi
- **Status:** Diterima (PRD v3 Epic 1)
- **Konteks:** Mengizinkan beberapa server atau channel memutar musik bersamaan tanpa membebani PC.
- **Keputusan:** Memperkenalkan `SessionManager` per voice channel dengan `MAX_CONCURRENT_SESSIONS = 3`. Jika kapasitas penuh, permintaan berikutnya ditolak dengan pesan yang menjelaskan channel mana saja yang sedang aktif.
- **Konsekuensi:** Kestabilan CPU dan bandwidth komputer pemilik tetap terlindungi.

---

### ADR-007: Pengindeks Musik Lokal dengan Proteksi Anti-Path Traversal
- **Status:** Diterima (PRD v3 Epic 4)
- **Konteks:** Memutar file musik lokal dari hard drive pengguna (`./music`).
- **Keputusan:** Mengindeks file audio offline (`.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`) ke tabel `local_tracks` dan memvalidasi `realpath` dengan ketat untuk menolak karakter `..` atau symlink ke luar folder musik yang diizinkan.
- **Konsekuensi:** Pengguna aman dari serangan pembacaan file sistem sembarangan.

---

### ADR-008: Scrobbler ListenBrainz Asinkron & Privacy-First
- **Status:** Diterima (PRD v4 Epic 4)
- **Konteks:** Sinkronisasi lagu yang didengarkan ke profil musik pengguna.
- **Keputusan:** Menggunakan ListenBrainz dengan skema opt-in (`/scrobble connect`), enkripsi token di SQLite, dan antrean pengiriman ulang asinkron (`scrobble_queue`).
- **Konsekuensi:** Pemutaran musik di Discord tidak pernah terhenti atau terhambat jika API ListenBrainz lambat atau offline.
