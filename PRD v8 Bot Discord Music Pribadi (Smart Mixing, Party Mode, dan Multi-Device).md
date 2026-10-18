# PRD v8: Bot Discord Music Pribadi (Smart Mixing, Party Mode, dan Multi-Device)

Draft v1.0. 18 Oktober 2026. Lanjutan strategis dari PRD v1 sampai v7. Pemakaian pribadi & komunitas tepercaya.

---

## 1. Ringkasan Eksekutif & Hubungan dengan PRD v1–v7

Proyek bot musik mandiri ini telah mencapai kedewasaan arsitektural yang tinggi:
- **PRD v1–v3**: Fondasi audio Lavalink v4, YouTube/Spotify resolvers cerdas, SQLite WAL, DSP audio, Web Dashboard lokal, isolasi multi-server, peran DJ, dan pemulihan otomatis antrean (`/restore`).
- **PRD v4–v5**: Pembersihan otomatis database, kepatuhan privasi GDPR (`/forget`), scrobbling ListenBrainz, rekomendasi Markov Chain, audit tahunan, pemutar podcast RSS, dan preset equalizer kustom.
- **PRD v6–v7**: Sleep Timer dengan *smooth fade-out*, Soundboard instan (`/sfx`), kurasi suasana hati berbasis Google Gemini AI (`/mood`), Canvas Audio Spectrum Visualizer (60fps), GZIP Backup otomatis (`/backup`), Virtual AI Voice DJ Host (`/dj`), 8D Audio Spasial (`/audiofx`), dan rekapitulasi *Music Wrapped* (`/wrapped`).

**PRD v8** membawa bot ke tingkat interaktivitas sosial dan kemudahan kendali multi-perangkat (*Quality of Life*) melalui **tiga pilar utama**:
1. **Smart Crossfade & Mixing**: Transisi lagu yang mulus tanpa jeda hening (*gapless fade-in/fade-out*).
2. **Interactive Music Quiz & Party Mode**: Permainan tebak lagu berbasis cuplikan intro 12 detik dengan tombol interaktif dan leaderboard di Discord.
3. **Multi-Device LAN Remote & AI Natural Intent**: Akses pengendali jarak jauh smartphone via pemindaian QR Code lokal, kontrol lock screen via Media Session API, serta eksekusi perintah bahasa alami multi-tindakan (`/ask`).

---

## 2. Batasan Desain & Prinsip Kinerja

1. **Hemat Sumber Daya**: Fitur crossfade dan kuis musik tidak boleh menyebabkan lag audio atau membebani CPU komputer lokal (CPU < 2%, RAM bot < 250MB).
2. **Koneksi Lokal Aman**: Remote smartphone beroperasi di jaringan WiFi lokal (LAN) tanpa membuka port ke internet publik yang tidak aman.
3. **Graceful Fallback**: Perintah `/ask` dapat beroperasi menggunakan Gemini AI atau fallback lokal cerdas jika `GEMINI_API_KEY` belum dikonfigurasi.

---

## 3. Rincian Epic & Kebutuhan Fungsional

### Epic 1: Smart Crossfade & Audio Mixing (`/crossfade`) - P0
- **Tujuan**: Menghilangkan jeda hening canggung antar lagu dengan transisi pemudaran volume yang lembut.
- **Fitur**:
  - `/crossfade [duration_seconds: 0 - 10]`:
    - Mengatur durasi overlap transisi lagu dalam detik (default 0 / nonaktif, rentang 1–10 detik).
    - Saat lagu tersisa N detik, bot mulai menurunkan volume secara bertahap (*fade-out*).
    - Saat lagu baru dimulai, volume dinaikkan secara bertahap (*fade-in*) hingga mencapai tingkat volume target.

---

### Epic 2: Interactive Music Quiz & Song Game (`/quiz`) - P0
- **Tujuan**: Menghadirkan hiburan interaktif tebak lagu bersama teman di Voice Channel.
- **Fitur**:
  - `/quiz [rounds: 3|5|10] [source: queue|history|pop]`:
    - Bot memutar potongan intro 12 detik dari sebuah lagu secara acak.
    - Bot menampilkan 4 tombol pilihan ganda (*Button Components*) di Discord.
    - Anggota Voice Channel mengklik tombol untuk menebak judul atau penyanyi yang benar.
    - Sistem mencatat waktu tebakan dan mengakumulasi skor poin di leaderboard sesi kuis.

---

### Epic 3: Multi-Device LAN Remote Control (Mobile QR Connect) - P1
- **Tujuan**: Memudahkan pengguna mengontrol pemutaran musik dari tempat tidur atau sofa menggunakan smartphone.
- **Fitur**:
  - **Tombol "📱 Remote HP"** di header Web Dashboard (`http://localhost:3000`):
    - Membuka modal popup berisi **QR Code** yang memuat URL IP lokal LAN komputer (contoh: `http://192.168.1.15:3000`).
    - Pengguna cukup mengarahkan kamera HP untuk membuka dashboard di browser smartphone.
  - **Browser Media Session API**:
    - Terintegrasi dengan `navigator.mediaSession` di browser.
    - Menampilkan cover album, judul lagu, artis, serta tombol kontrol Play, Pause, Skip, dan Previous langsung di **Lock Screen smartphone** atau notifikasi browser laptop.

---

### Epic 4: AI Natural Language Music Commander (`/ask`) - P1
- **Tujuan**: Memungkinkan pengguna mengendalikan banyak aspek bot hanya dengan satu kalimat bebas.
- **Fitur**:
  - `/ask <perintah bebas>`:
    - Menganalisis instruksi gabungan pengguna (contoh: *"Putar lagu pop Taylor Swift, atur volume ke 80 persen, dan nyalakan 8d audio"*).
    - Model Gemini AI mem-parse instruksi menjadi rangkaian aksi terstruktur (Play, Volume, Filter).
    - Bot mengeksekusi semua aksi tersebut secara berurutan dan mengonfirmasi hasilnya ke pengguna dalam satu balasan embed.

---

### Epic 5: Local Favorite Offline Caching (Bandwidth Saver) - P2
- **Tujuan**: Menghemat pemakaian kuota dan memastikan lagu-lagu favorit dapat langsung diputar tanpa jeda pencarian berulang.
- **Fitur**:
  - Metadata lagu favorit dan riwayat disimpan secara terindeks di SQLite untuk resolusi instan saat diputar kembali.

---

### Epic 6: Evaluasi, Observabilitas & Quality Gates - P0
- [x] Kompilasi TypeScript 100% bersih tanpa error (`npx tsc --noEmit`).
- [x] Test suite komprehensif `tests/prd_v8.test.ts`.
- [x] Menjaga seluruh 55 unit test sebelumnya tetap lulus 100% tanpa regresi.
- [x] Pembaruan dokumen panduan [README.md](file:///c:/Users/galan/Downloads/files/README.md) dengan katalog perintah lengkap PRD v8.
