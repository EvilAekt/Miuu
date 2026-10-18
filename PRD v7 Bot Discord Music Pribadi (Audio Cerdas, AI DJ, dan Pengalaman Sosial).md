# PRD v7: Bot Discord Music Pribadi (Audio Cerdas, AI DJ, dan Pengalaman Sosial)

Draft v1.0. 18 Oktober 2026. Lanjutan strategis dari PRD v1 sampai v6. Pemakaian pribadi & komunitas tepercaya.

---

## 1. Ringkasan Eksekutif & Hubungan dengan PRD v1–v6

PRD v1 hingga v6 telah membangun fondasi bot musik yang kokoh:
- **PRD v1–v2**: Inti pemutar musik (Lavalink v4, YouTube & Spotify Resolvers, SQLite WAL, DSP Audio, Web Dashboard).
- **PRD v3–v4**: Skala multi-server, hak DJ, pemulihan otomatis (`/restore`), pemutar lokal (`/library`), GDPR (`/forget`), scrobbling ListenBrainz, dan rekomendasi Markov Chain.
- **PRD v5–v6**: Audit tahunan, podcast RSS, preset equalizer, memori volume per-lagu, Sleep Timer (*smooth fade-out*), Soundboard instan (`/sfx`), kurasi suasana hati berbasis Google Gemini AI (`/mood`), Canvas Audio Spectrum Visualizer (60fps), Multiple Themes, dan GZIP Backup (`/backup`).

**PRD v7** hadir untuk mentransformasi pengalaman mendengar musik menjadi lebih imersif, sosial, dan personal melalui **tiga pilar terobosan**:
1. **Virtual AI Voice DJ**: Penyiar radio virtual yang memberikan pengantar suara (*voice announcer*) dinamis sebelum lagu dimulai.
2. **Advanced Audio Enhancement Suite**: Filter 8D Audio (rotasi 360° binaural stereo), kontrol presisi `/speed` dan `/pitch`, serta Normalizer Volume otomatis via engine native Lavalink v4.
3. **Music Wrapped & Social Insights**: Infografis rekap musik personal & server bergaya *Spotify Wrapped* (`/wrapped`), sanitasi antrean cerdas (anti-duplikasi), dan siaran audio langsung di browser (*Web Listen Along*).

---

## 2. Batasan Desain & Prinsip Kinerja

1. **Efisiensi Sumber Daya**: Semua filter audio tingkat lanjut diproses langsung oleh audio thread Lavalink di background tanpa membebani event loop Node.js (CPU Node.js < 2%, RAM bot < 250MB).
2. **Batas Skala (PRD v3 Scope)**: Maksimal 5 server privat, 20 pengguna aktif, dan 3 sesi suara bersamaan.
3. **Zero Cost & Privacy**: Voice announcer TTS bekerja secara lokal/ringan tanpa mewajibkan API berbayar.
4. **Anti-Duplikasi Cerdas**: Deteksi duplikasi berbasis URL dan kecocokan judul tanpa membatasi pengguna yang memang sengaja ingin memutar ulang.

---

## 3. Rincian Epic & Kebutuhan Fungsional

### Epic 1: Virtual Voice DJ Host (`/dj`) - P0
- **Tujuan**: Menghadirkan atmosfer siaran radio profesional dengan penyiar suara virtual otomatis.
- **Fitur**:
  - `/dj set [mode: on|off] [personality: casual|energetic|chill]`: Mengaktifkan/menonaktifkan voice announcer.
  - Saat lagu berikutnya akan diputar, bot secara acak (misal setiap 3-5 lagu atau lagu pertama sesi) menyisipkan sambutan pendek berdurasi 3-5 detik:
    - *"Selanjutnya, lagu favoritmu [Judul Lagu] dari [Artis], selamat mendengarkan!"*
  - Buffer audio intro disintesis dan diputar secara instan sebelum audio utama berjalan.

---

### Epic 2: Advanced Audio Enhancement Suite (8D Audio, Speed & Pitch) - P0
- **Tujuan**: Menghadirkan pengalaman audio spasial dan manipulasi tempo nada berkualitas tinggi.
- **Fitur**:
  - `/8d [enable: true|false] [speed: slow|normal|fast]`:
    - Mengaktifkan filter rotasi stereo Lavalink (`rotation: { rotationHz: 0.15 }`).
    - Menghasilkan efek audio berputar 360 derajat di headphone pendengar secara mulus.
  - `/speed <multiplier: 0.5 - 2.0>`:
    - Mengubah kecepatan pemutaran lagu menggunakan filter Lavalink `timescale: { speed: X }`.
    - Cocok untuk mode *Sped-Up Songs* (1.15x - 1.3x) atau *Slowed Songs* (0.8x - 0.9x).
  - `/pitch <multiplier: 0.5 - 2.0>`:
    - Mengubah tinggi rendah nada lagu menggunakan `timescale: { pitch: X }`.
  - `/autonormalize [enable: true|false]`:
    - Normalisasi tingkat volume otomatis antar lagu agar transisi lagu tidak mengejutkan pendengar.

---

### Epic 3: Queue Sanitation & Anti-Duplikasi Cerdas - P1
- **Tujuan**: Menjaga kebersihan antrean dari lagu yang tidak sengaja ditambahkan berkali-kali.
- **Fitur**:
  - Peringatan instan saat lagu yang sama sudah berada dalam antrean.
  - `/queue clean [mode: duplicates|unplayable]`:
    - `duplicates`: Menghapus semua kemunculan ganda lagu di antrean dan menyisakan satu pemutaran pertama.
    - `unplayable`: Memeriksa dan membuang link lagu yang rusak atau dibatasi region.

---

### Epic 4: Personal & Server Music Wrapped (`/wrapped`) - P1
- **Tujuan**: Menyajikan rekapitulasi data kebiasaan bermusik pengguna dalam bentuk infografis Discord Embed yang memikat.
- **Fitur**:
  - `/wrapped [period: month|year|all] [user]`:
    - Menghasilkan infografis *Music Wrapped*:
      - 🏆 Top 5 Lagu Paling Sering Diputar.
      - 🎤 Top 3 Artis Favorit.
      - ⏱️ Total Menit Mendengarkan Musik.
      - 🌙 Jam Paling Aktif Mendengar (Pagi, Siang, Malam, Dini Hari).
      - 🎭 Persona Musik Pengguna (misal: *Night Owl Chill Listener*, *Lofi Workaholic*, *High-Energy Gymmer*).
  - **Dynamic Discord Rich Presence**: Status profil Discord bot otomatis diperbarui secara real-time menampilkan judul lagu aktif, artis, dan waktu berjalan.

---

### Epic 5: Web Audio Listen Along (Browser Live Relay) - P2
- **Tujuan**: Memungkinkan anggota mendengarkan siaran musik bot langsung dari browser PC atau smartphone tanpa harus bergabung ke Voice Channel Discord.
- **Fitur**:
  - Endpoint HTTP `/api/listen` di web dashboard lokal yang menyiarkan status sinkronisasi audio untuk browser.

---

### Epic 6: Evaluasi, Observabilitas & Quality Gates - P0
- [x] Kompilasi TypeScript 100% bersih tanpa error (`npx tsc --noEmit`).
- [x] Test suite komprehensif `tests/prd_v7.test.ts`.
- [x] Menjaga seluruh 52 unit test sebelumnya tetap lulus 100% tanpa regresi.
- [x] Pembaruan dokumen panduan [README.md](file:///c:/Users/galan/Downloads/files/README.md).
