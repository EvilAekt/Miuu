# PRD v6: Bot Discord Music Pribadi (Kolaborasi, AI, dan Pengalaman Imersif)

Draft v1.0. 18 Oktober 2026. Lanjutan strategis dari PRD v1 sampai v5. Pemakaian pribadi & komunitas tepercaya.

---

## 1. Ringkasan Eksekutif & Hubungan dengan PRD v1–v5

PRD v1 hingga v5 telah berhasil mendirikan bot musik mandiri yang stabil, cepat, minim biaya operasional, dan memiliki tata kelola data yang aman. 
- **PRD v1**: Membangun fondasi audio engine (Lavalink v4, Node.js + TypeScript, discord.js v14, SQLite WAL).
- **PRD v2**: Menghadirkan personalisasi antrean, DSP audio equalizer, lirik sinkron LRC, dan Web Dashboard lokal.
- **PRD v3**: Menghadirkan isolasi multi-server, peran DJ, pemulihan otomatis antrean (`/restore`), pemutaran file lokal offline (`/library`), dan proteksi path-traversal.
- **PRD v4**: Menghadirkan pembersihan database berkala, kepatuhan privasi GDPR (`/forget`), scrobbling (Last.fm/ListenBrainz), serta Markov Chain recommendation.
- **PRD v5**: Menghadirkan audit kode tahunan, stabilisasi operasi, per-track volume memory, preset equalizer, dan pemutar podcast RSS.

**PRD v6** adalah lompatan kualitas pengalaman (*Quality of Experience*) yang berfokus pada **tiga pilar utama**:
1. **Smart Session Control**: Kendali pemutaran yang cerdas dan kontekstual melalui Sleep Timer dengan *smooth volume fade-out* serta Soundboard efek suara instan (`/sfx`).
2. **AI-Powered Discovery (Google Gemini API)**: Kurasi lagu berbasis suasana hati bebas (`/mood`) dan pemahaman makna lirik (`/lyrics explain`) dengan model cepat dan hemat biaya `gemini-2.5-flash`.
3. **Web Dashboard Imersif & Ketahanan Sistem**: Canvas Spectrum Visualizer real-time (60fps), keyboard shortcuts, switch tema, serta pencadangan database terkompresi otomatis (`/backup`).

---

## 2. Batasan Desain & Prinsip Utama

1. **Self-Hosted & Ringan**: Bot tetap beroperasi di PC Windows lokal pengguna tanpa ketergantungan pada server cloud berbayar.
2. **Batas Kapasitas (PRD v3 Scope)**: Maksimal 5 server privat, 20 pengguna tepercaya, dan 3 sesi pemutaran suara bersamaan.
3. **Zero Audio Lag**: Integrasi fitur baru (SFX, AI, Visualizer) tidak boleh menimbulkan stuttering atau memblokir *audio pipeline* Lavalink.
4. **Graceful Degradation**: Jika koneksi internet terbatas atau `GEMINI_API_KEY` tidak diisi di `.env`, bot tetap berfungsi 100% pada fitur audio standar tanpa error atau crash.
5. **Keamanan & Privasi**: Semua backup database disimpan secara lokal di direktori `backups/`, tidak dikirim ke pihak ketiga, dan tetap menghormati perintah `/forget`.

---

## 3. Rincian Epic & Spesifikasi Kebutuhan

### Epic 1: Smart Session Control (Sleep Timer & Soundboard Interaktif) - P0

#### E1.1: Sleep Timer dengan Smooth Fade-Out (`/sleeptimer`)
- **Tujuan**: Memungkinkan pengguna mendengarkan musik sebelum tidur tanpa khawatir bot terus menyala sepanjang malam.
- **Perilaku**:
  - Pilihan durasi: 15, 30, 45, 60, atau custom menit.
  - Saat waktu tersisa 30 detik terakhir: Volume Lavalink diturunkan secara bertahap (fade-out dari volume aktif ke 0%).
  - Saat waktu habis: Pemutar dihentikan (`stop`), antrean dibersihkan jika tidak dalam mode 24/7, bot meninggalkan Voice Channel, dan notifikasi embed penutup dikirimkan.
  - Perintah pembatalan: `/sleeptimer cancel`.

#### E1.2: Instant Soundboard & Meme SFX (`/sfx`)
- **Tujuan**: Memutar klip efek suara pendek (misal: "airhorn", "applause", "bruh", "ba-dum-tss", "victory") secara instan saat berinteraksi di voice chat.
- **Perilaku**:
  - Klip audio pendek bersumber dari file lokal di folder `music/sfx/` atau stream audio instan.
  - Tidak menghapus antrean lagu saat ini. Bot menyimpan posisi track, memutar efek suara, lalu melanjutkan lagu utama kembali.

---

### Epic 2: Collaborative Listening & Queue Interaction - P1

#### E2.1: Queue Voting & Vote-Skip Real-time
- **Tujuan**: Memudahkan anggota di voice channel untuk berpartisipasi menentukan alur lagu tanpa bentrok kekuasaan dengan DJ.
- **Perilaku**:
  - Saat user menjalankan `/skip`, jika pengguna bukan DJ atau pemilik server, bot membuka sesi pemungutan suara berdurasi 30 detik dengan tombol interaktif `[Vote Skip (1/X)]`.
  - Jika rasio suara memenuhi ambang batas `vote_skip_ratio` (default 50% peserta voice channel), lagu dilewati secara otomatis.

#### E2.2: Sesi Web Dashboard Listen Along
- **Tujuan**: Sinkronisasi status lagu aktif di Web Dashboard sehingga pengguna di perangkat lain (misal tablet/laptop) dapat melihat progres real-time.

---

### Epic 3: AI Mood & Playlist Curator (Integrasi Google Gemini API) - P1

#### E3.1: Slash Command `/mood <prompt>`
- **Tujuan**: Menghasilkan rekomendasi playlist berbasis suasana hati alami pengguna.
- **Perilaku**:
  - Menggunakan Google Gemini API (`gemini-2.5-flash`) via SDK `@google/genai`.
  - Menerima deskripsi bahasa alami (contoh: *"lagu santai untuk coding malam hari dengan sentuhan jazz dan lofi"*).
  - Gemini merespons dengan format JSON terstruktur berisi daftar 5 judul lagu dan artis yang paling relevan.
  - Bot secara otomatis mencari dan memasukkan lagu-lagu tersebut ke dalam antrean pemutaran.

#### E3.2: Analisis & Penjelasan Lirik (`/lyrics explain`)
- **Tujuan**: Memberikan konteks makna lagu atau menerjemahkan lirik puitis ke Bahasa Indonesia secara singkat dan elegan.
- **Perilaku**:
  - Mengambil lirik lagu aktif via modul `lyricsManager`.
  - Mengirimkan cuplikan lirik ke Gemini API dengan prompt kurator musik.
  - Menampilkan ringkasan makna, tema emosional, dan terjemahan bait penting dalam Discord Embed yang artistik.

---

### Epic 4: Antarmuka Web Dashboard Imersif (Next-Gen Web UI) - P1

#### E4.1: Audio Spectrum Canvas Visualizer (60fps)
- **Tujuan**: Menghadirkan visualisasi gelombang frekuensi audio yang responsif dan memukau di `http://localhost:3000`.
- **Perilaku**:
  - Menggunakan HTML5 Canvas rendering engine.
  - Memiliki mode batang frekuensi (*frequency bars*) dan gelombang halus (*smooth sine waves*) yang sinkron dengan posisi pemutaran lagu.

#### E4.2: Multiple Theme Switcher & Glassmorphism
- **Tujuan**: Kustomisasi tampilan dashboard sesuai preferensi estetika pengguna.
- **Pilihan Tema**:
  1. *OLED Dark* (Hitam pekat hemat daya).
  2. *Cyberpunk Neon* (Aksen ungu dan cyan futuristik).
  3. *Retro Sunset* (Gradien hangat oranye dan magenta).
  4. *Studio Clean* (Minimalis modern abu-abu lembut).

#### E4.3: Global Keyboard Shortcuts (Hotkeys)
- **Space**: Toggle Play / Pause.
- **Arrow Right / Left**: Lompat maju/mundur 10 detik.
- **Arrow Up / Down**: Naik / turun volume 5%.
- **Key J / L**: Lagu sebelumnya / lagu berikutnya (Previous/Skip).
- **Key M**: Mute / Unmute.

---

### Epic 5: Automated Backup & One-Click Disaster Recovery - P0

#### E5.1: Database Snapshot & Archive Manager (`/backup`)
- **Tujuan**: Mencegah kehilangan riwayat, playlist kustom, statistik, dan favorit saat terjadi kegagalan sistem atau migrasi PC.
- **Perilaku**:
  - `/backup create`: Melakukan `WAL checkpoint` pada SQLite, lalu mengompresi database `data/musicbot.db` ke format `.zip` di direktori `backups/` dengan penamaan bertanggal (`backup_YYYY-MM-DD_HHmmss.zip`).
  - `/backup list`: Menampilkan 5 arsip backup terbaru beserta ukuran file dan tanggal pembuatan.
  - `/backup restore <filename>`: Memulihkan database dari snapshot cadangan dengan aman.

#### E5.2: Rotasi Backup Otomatis
- **Perilaku**:
  - Bot secara otomatis mempertahankan maksimal 5 file cadangan terbaru. File cadangan yang lebih lama dari 30 hari otomatis dibersihkan untuk menghemat ruang disk.

---

### Epic 6: Evaluasi, Observabilitas & Quality Gates - P0

- [x] Kompilasi TypeScript 100% bersih tanpa error (`npx tsc --noEmit`).
- [x] Test suite komprehensif `tests/prd_v6.test.ts` untuk menguji sleep timer, backup manager, dan mood curator.
- [x] Menjaga seluruh 49 unit tests terdahulu tetap lolos 100% tanpa regresi.
- [x] Pembaruan dokumen panduan [README.md](file:///c:/Users/galan/Downloads/files/README.md).
