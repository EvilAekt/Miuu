# 🎵 Private Discord Music Bot (Miu#5872)

Bot musik Discord pribadi dengan performa tinggi dan latensi rendah yang berjalan secara lokal di Windows tanpa memerlukan VPS atau langganan Spotify Premium. Dibangun menggunakan **Node.js + TypeScript**, **discord.js v14**, **Lavalink v4 (Java 21)**, dan **SQLite (WAL mode)**.

---

## ⚡ Cara Menjalankan Bot (1-Click Desktop Launcher)

Bot ini sudah dilengkapi shortcut peluncur 1-klik di Desktop Windows Anda:
1. **Shortcut Desktop**: Cukup double-click shortcut **`Discord Music Bot`** di Desktop Anda.
2. Atau jalankan **`start-app.bat`** / **`start-all.bat`** di folder project.

Skrip ini akan secara otomatis:
1. Memeriksa ketersediaan server Lavalink di port `2333` (jika belum aktif, otomatis dijalankan).
2. Jika bot sudah berjalan, langsung membuka antarmuka browser ke `http://localhost:3000`.
3. Jika belum berjalan, menjalankan bot Discord dengan seluruh perintah & fitur v1-v5.
4. Menunggu port `3000` siap, lalu **secara otomatis membuka Web Dashboard lokal di default browser Anda** (`http://localhost:3000`) serta menampilkan URL di terminal.

Jika shortcut di Desktop terhapus, Anda dapat membuatnya kembali kapan saja dengan menjalankan:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/create-desktop-shortcut.ps1"
```

---

## 📋 Daftar Lengkap Slash Command (47 Perintah)

### 1. Pemutaran & Kontrol Dasar (P0 / MVP)
- `/play <input>` — Memutar musik dari YouTube URL, YouTube Shorts, Spotify Track/Album/Playlist, atau pencarian kata kunci dengan pencocokan cerdas.
- `/pause` — Menjeda lagu yang sedang diputar.
- `/resume` — Melanjutkan pemutaran musik.
- `/skip` — Melewati lagu yang sedang aktif.
- `/stop` — Menghentikan pemutaran, menghapus antrean, dan keluar dari Voice Channel (otomatis mematikan mode radio).
- `/queue [page]` — Menampilkan daftar antrean lagu interaktif dengan tombol halaman Sebelumnya/Berikutnya.
- `/nowplaying` — Menampilkan informasi detail lagu yang sedang diputar dengan bar progres dan 8 tombol kontrol interaktif.
- `/volume <percent>` — Mengatur tingkat volume pemutar (0–150%).
- `/loop <mode>` — Mengatur mode perulangan (`off`, `track`, atau `queue`).
- `/shuffle` — Mengacak urutan antrean lagu yang ada.
- `/seek <timestamp>` — Melompat ke detik atau menit tertentu dalam lagu (contoh: `1:30`, `90`, `02:45`).
- `/remove <position>` — Menghapus lagu tertentu dari antrean berdasarkan nomor urutan.
- `/clear` — Mengosongkan seluruh sisa antrean lagu.

### 2. Fitur Koleksi Pribadi, Playlist & Radio (Milestone 3 & PRD v2 Epic 4, 5)
- `/radio <seed>` — Menghasilkan antrean musik berkelanjutan tanpa batas dari satu lagu atau artis benih tanpa duplikasi lagu yang sama.
- `/playlist save <name>` — Menyimpan seluruh antrean lagu saat ini menjadi playlist pribadi.
- `/playlist play <name>` — Memuat dan memutar playlist pribadi yang tersimpan.
- `/playlist list` — Melihat daftar semua playlist pribadi milik Anda.
- `/playlist delete <name>` — Menghapus playlist pribadi yang tersimpan.
- `/playlist export <name>` — Mengekspor playlist ke file `.json` yang dapat diunduh untuk dicadangkan atau dibagikan ke teman.
- `/playlist import <name> <file>` — Mengimpor kembali playlist dari file `.json` atau daftar link teks `.txt`.
- `/favorite add` — Menyimpan lagu yang sedang diputar ke koleksi favorit.
- `/favorite list` — Melihat daftar semua lagu favorit Anda.
- `/favorite play` — Memutar seluruh lagu dari koleksi favorit ke dalam antrean.
- `/favorite remove <id>` — Menghapus lagu dari daftar favorit berdasarkan nomor ID.
- `/import links: [string] | file: [file .txt]` — Mengimpor banyak link track Spotify sekaligus (melewati batas 50 lagu embed Spotify) dengan resolusi progresif ke YouTube.
- `/autoplay` — Toggle pemutaran otomatis: saat antrean habis, bot secara otomatis mencari dan memutar rekomendasi lagu YouTube serupa.
- `/history` — Melihat riwayat 15 lagu terakhir yang diputar di server.
- `/restore` — Memulihkan antrean lagu setelah bot atau PC di-restart (snapshot tersimpan otomatis di SQLite).
- `/skipto <position>` — Melompat langsung ke nomor lagu tertentu di dalam antrean.
- `/previous` — Memutar kembali lagu yang diputar sebelumnya.
- `/move <from> <to>` — Memindahkan nomor urutan lagu di dalam antrean.
- `/filter <type>` — Menerapkan efek DSP audio Lavalink: `Bassboost (Low/Medium/High)`, `Nightcore`, `Vaporwave`, Equalizer `Pop`, `Rock`, `Electronic`, atau `Clear`.

### 3. Statistik, Observabilitas & Tampilan (PRD v2 Epic 1, 3, 4, 7, 8, 9)
- `/stats [period: 7|30|all] [user]` — Menampilkan peringkat lagu teratas, artis terfavorit, total durasi mendengar, dan perintah paling sering dipakai per server atau per pengguna.
- `/fixmatch` — Memilih dan mengunci alternatif lagu YouTube yang tepat (via Select Menu) jika lagu Spotify terputar dengan versi yang keliru (disimpan permanen di `match_overrides`).
- `/status` — Melihat status kesehatan bot, Lavalink ping, plugin YouTube, Spotify canary, pemakaian RAM, dan metrik lagu gagal dalam 24 jam terakhir.
- `/diagnose` — Pengujian diagnostik real-time end-to-end pipa audio (Resolve metadata Spotify canary, query Lavalink YouTube, verifikasi Audio node).
- `/lyrics [song] [artist]` — Menampilkan lirik lagu lengkap menggunakan database terbuka LRCLIB (tanpa API key).
- `/247` — Toggle mode 24/7 (Always On): bot akan tetap berada di Voice Channel tanpa batas waktu dan mengabaikan timer auto-leave.
- `/components [mode: classic|v2]` — Beralih antara antarmuka **Classic Embeds** atau **Modern Discord Components V2 Container Layout**.

### 4. Skala, Kontrol Server & Privasi (PRD v3 Epic 1, 4, 5)
- `/settings [volume] [auto_leave] [dj_role] [vote_skip_ratio] [max_queue]` — Konfigurasi tingkat server (DJ role, batas antrean, threshold vote skip 10–100%, dan durasi auto-leave).
- `/forget` — Hak Privasi & GDPR: menghapus seluruh data pribadi pengguna (favorit, playlist, riwayat lagu, akun scrobble) dari SQLite database.
- `/library [action: list|scan|play] [query]` — Memindai folder musik lokal (`./music`), mencari lagu offline berformat MP3/FLAC/WAV/OGG/M4A, dan memutarnya langsung dengan proteksi anti-path traversal.
- **Vote Skip Dinamis**: `/skip` otomatis mengaktifkan pemungutan suara jika terdapat lebih dari 2 pendengar aktif di voice channel (kecuali peminta adalah DJ/Admin atau pemanggil lagu).
- **Session Concurrency Guard**: Membatasi maksimal 3 sesi pemutaran bersamaan antar-server (`MAX_CONCURRENT_SESSIONS = 3`) untuk menjamin kestabilan CPU dan bandwidth.
- **Multi-Server Isolation**: Server sekunder otomatis berstatus `pending` dan antrean/sesi terisolasi ketat.

### 5. Keberlanjutan, Ekosistem & Rekomendasi (PRD v4 Epic 1, 4, 5, 6, 7)
- `/scrobble [action: connect|status|disconnect] [token]` — Integrasi scrobbling musik otomatis ke ListenBrainz dengan async retry queue dan penyimpanan token terenkripsi.
- `/whythis` — Transparansi AI & Rekomendasi: melihat alasan dan relasi transisi mengapa sebuah lagu otomatis dipilihkan oleh sistem autoplay/smart recommend.
- **Bandcamp Support**: Deteksi dan pemutaran langsung link lagu Bandcamp (`*.bandcamp.com/track/*`).
- **Smart Recommendations (`track_transitions` & `artist_affinity`)**: Rekomendasi cerdas berbasis riwayat lagu berikutnya dan kedekatan artis untuk transisi pemutaran alami.
- **PWA Mobile Dashboard**: Dashboard lokal di `http://localhost:3000` dilengkapi web app manifest (`/manifest.json`), ikon, dan layout mobile responsif.
- **Runbooks Pemulihan Bencana**: Panduan komprehensif penanganan insiden darurat di [`docs/RUNBOOKS.md`](file:///c:/Users/galan/Downloads/files/docs/RUNBOOKS.md).
- **Windows Tray & Canary Monitor**: Skrip pemantauan status latar belakang Windows di [`scripts/tray-monitor.ps1`](file:///c:/Users/galan/Downloads/files/scripts/tray-monitor.ps1).

### 6. Operasi Stabil, Podcast & Kenyamanan Audio (PRD v5 Epic 0, 1, 2, 3, 5, 6)
- `/podcast [action: add|list|play|remove] [url/feed] [episode]` — Berlangganan feed RSS podcast dan memutar episode audio langsung via Lavalink.
- `/volume [level] [remember: true/false]` — Mengatur volume audio dengan opsi mengingat volume khusus untuk lagu tersebut pada pemutaran berikutnya (`track_prefs`).
- `/filter [type] [preset_action: save|load|list|delete] [preset_name]` — Menerapkan filter audio instan atau menyimpan/memuat preset filter pribadi (`filter_presets`).
- `/resume [from_saved: true/false]` — Melanjutkan pemutaran musik yang dijeda atau melompat ke menit terakhir yang tersimpan untuk lagu/podcast panjang (`resume_positions`).
- **Sinyal `volume_adjust` & `long_content_stop`**: Mencatat analitik penyesuaian volume awal dan penghentian konten berdurasi panjang (> 30 menit) ke tabel `demand_events`.
- **Tinjauan Tahunan & Pengingat DM**: Pengingat otomatis 14 hari sebelum jatuh tempo tinjauan tahunan ke DM pemilik (`review_state`) dan template keputusan di [`docs/review/2026/keputusan.md`](file:///c:/Users/galan/Downloads/files/docs/review/2026/keputusan.md).

### 7. Kolaborasi, AI Mood & Pengalaman Imersif (PRD v6 Epic 1–5)
- `/sleeptimer [action: set|cancel|status] [minutes]` — Mengatur waktu mundur otomatis saat hendak tidur dengan penurunan volume halus (*smooth fade-out*) sebelum keluar Voice Channel.
- `/sfx <effect>` — Memainkan klip efek suara atau meme instan (Airhorn, Bruh, Applause, Ba-Dum-Tss, Victory Fanfare, Sad Violin, Nope) tanpa merusak antrean lagu.
- `/mood <prompt>` — Menghasilkan rekomendasi playlist lagu otomatis bertenaga **Google Gemini AI (`gemini-2.5-flash`)** berdasarkan deskripsi suasana hati atau aktivitas Anda.
- `/lyrics [song] [artist] [explain: true]` — Menampilkan lirik lengkap sekaligus analisis pesan emosional dan tafsir bait lirik lagu menggunakan Google Gemini AI.
- `/backup [action: create|list|restore] [label] [filename]` — Pencadangan database SQLite mandiri terkompresi (`.db.gz`) dengan rotasi otomatis 5 arsip terbaru dan proteksi anti-path traversal.

### 8. Audio Cerdas, Virtual AI DJ & Pengalaman Sosial (PRD v7 Epic 1–5)
- `/dj [action: enable|disable|status] [personality: casual|hype|chill] [frequency]` — Mengaktifkan penyiar radio suara virtual (Virtual Voice DJ Host) yang menyapa dan memperkenalkan lagu berikutnya secara otomatis.
- `/audiofx [subcommand: 8d|speed|pitch|autonormalize]` — Efek audio tingkat lanjut: audio spasial rotasi stereo 360° (8D Audio), pengaturan kecepatan (speed 0.5x–2.0x), nada (pitch 0.5x–2.0x), dan perataan volume antar-lagu (Auto-Normalizer).
- `/wrapped [period: 30|all] [user]` — Infografis rekap musik bergaya Spotify Wrapped (Top 5 Lagu, Top 3 Artis, total menit mendengar, jam paling aktif, dan Persona Musik pendengar).
- `/queue [page] [clean: duplicates|unplayable]` — Sanitasi antrean: mendeteksi dan menghapus lagu duplikat atau trek yang tidak dapat diputar dalam satu klik.
- **Dynamic Discord Rich Presence**: Status profil bot Discord otomatis menampilkan judul lagu, musisi, dan waktu berjalan secara real-time.

### 9. Smart Mixing, Party Mode & Multi-Device Remote (PRD v8 Feature 1–4)
- `/crossfade <duration>` — Mengatur transisi audio crossfade mulus antar-lagu (0–10 detik) dengan dynamic fade-in dan fade-out.
- `/quiz [action: start|stop|leaderboard] [rounds]` — Game kuis musik interaktif tebak judul lagu dengan 4 tombol pilihan ganda, pengatur waktu ronde, dan papan skor real-time.
- `/ask <prompt>` — AI Natural Language Commander yang didukung oleh **Google Gemini 2.5 Flash** (dengan cerdas memproses instruksi kombinasi multi-aksi seperti putar lagu, atur volume, nyalakan 8D audio, terapkan filter, atau setel timer tidur dalam satu kalimat).
- **Remote Kontrol Multi-Perangkat (LAN Remote & Media Session API)**: Tombol `📱 Remote HP` dengan modal QR code di Web Dashboard untuk membuka remote web dari smartphone pada Wi-Fi lokal, serta integrasi **Media Session API** untuk kontrol lockscreen HP.

---

## 🌐 Dashboard Web Lokal & Multi-Device LAN (PRD v2, v4, v6, v8)

Saat bot dijalankan, server dashboard web lokal otomatis aktif di:
```
http://localhost:3000
```
Fitur Dashboard:
- **Akses Aman Localhost & LAN Wi-Fi**: Terlindungi secara aman hanya untuk IP localhost PC dan subnet jaringan privat lokal (LAN 192.168.x.x / 10.x.x.x).
- **📱 Remote HP & QR Code**: Buka remote controller di browser smartphone dalam jaringan Wi-Fi lokal dengan satu kali pemindaian QR code.
- **🎧 Media Session API**: Kontrol pemutar bot langsung dari Lockscreen smartphone atau media keys keyboard tanpa harus selalu membuka layar browser.
- **Audio Spectrum Visualizer**: Canvas rendering 60fps animasi gelombang frekuensi audio yang sinkron dengan pemutaran lagu.
- **Theme Switcher**: Pilihan 4 tema estetis (*Modern Indigo, OLED Midnight, Cyberpunk Neon, Retro Sunset*) yang tersimpan otomatis di browser.
- **Global Keyboard Hotkeys**: Kendali pemutar instan via keyboard (`Space`: Play/Pause, `L`: Skip, `J`: Previous, `Arrow Up/Down`: Volume +/- 5%).
- **Quick Soundboard SFX**: Tombol instan di sidebar dashboard untuk memainkan sound effect langsung ke Voice Channel Discord.
- **Live Synced Lyrics**: Sinkronisasi lirik kata demi kata / baris demi baris mengikuti detik musik berjalan secara real-time dengan auto-scroll dan penyorotan warna cerah.
- **Real-time Queue**: Menampilkan daftar antrean lagu yang sedang menunggu beserta durasinya.
- **Server Health & Stats**: Menampilkan latensi gateway Discord, total lagu diputar, dan total waktu mendengarkan.

---

## 🔌 Panduan Operasional 24/7 & Runbooks (PRD v3, v4, v5)

1. **Mencegah Windows Sleep/Hibernate**:
   - Buka **Settings > System > Power** (atau Control Panel > Power Options).
   - Ubah *"When plugged in, put my device to sleep"* menjadi **Never**.
   - Atau jalankan perintah via Command Prompt:
     ```cmd
     powercfg -change -standby-timeout-ac 0
     ```
2. **Auto-Start Saat Login**:
   - Buat pintasan `start-all.bat` ke folder startup Windows (`Win + R` > ketik `shell:startup`).
3. **Emergency Runbooks & Suksesi**:
   - Prosedur insiden teknis di [`docs/RUNBOOKS.md`](file:///c:/Users/galan/Downloads/files/docs/RUNBOOKS.md).
   - Panduan keadaan darurat di [`docs/EMERGENCY_SUCCESSION.md`](file:///c:/Users/galan/Downloads/files/docs/EMERGENCY_SUCCESSION.md).
4. **Health Tray Monitor**:
   - Jalankan `powershell -ExecutionPolicy Bypass -File scripts/tray-monitor.ps1` untuk memantau status bot dan Lavalink di background Windows.
5. **Retensi & Pruning Database**:
   - Jalankan `node scripts/prune-data.mjs 180` secara berkala untuk memangkas log lawas dan mengoptimalkan ukuran database.

---

## 💾 Backup & Pemeliharaan

- **Database SQLite**: Terletak di `data/bot.db` (WAL mode). Menyimpan cache lagu Spotify, playlist pribadi, favorit, riwayat lagu, pengaturan server, scrobble queue, resume positions, filter presets, dan review state. Cukup salin folder `data/` secara berkala untuk mencadangkan.
- **Environment**: File `.env` memuat token bot dan konfigurasi Lavalink. Jangan pernah mempublikasikan file `.env`.
- **Unit Test**: Jalankan `npm test` untuk memverifikasi 59 unit test bawaan yang mencakup database, matcher bonus/penalti, resolusi URL, sistem playlist, mode radio, sinkronisasi lirik, multi-server isolation, anti-traversal local library, scrobble queue, podcast RSS, filter presets, 8D audio DSP, AI DJ host, Wrapped generator, smart crossfade mixing, music quiz game, AI natural language intent commander, dan multi-device LAN IP security.
