# PRD v3: Bot Discord Music Pribadi (Skala dan Jangkauan)

Draft v0.1. 18 Oktober 2026. Lanjutan dari PRD v1 dan PRD v2. Pemakaian pribadi, mulai dari PC Windows.

## 1. Ringkasan dan hubungan dengan v1 dan v2

PRD v1 membangun bot dasar. PRD v2 membuatnya awet dan mudah dirawat. PRD v3 memperluas jangkauannya: bot hidup tanpa bergantung pada PC harian, melayani lebih dari satu server, memutar di beberapa voice channel sekaligus, memutar file musik lokal, dan menambah cara kontrol baru (tray Windows dan Discord Activity).

Semua item v3 berasal dari backlog PRD v2 (Bagian 15). Belum ada yang terbukti dibutuhkan. Karena itu v3 dimulai dengan Epic 0, yang memutuskan item mana yang dikerjakan, ditunda, atau dibuang. Hasil "tidak ada yang dikerjakan" tetap hasil yang sah.

Batasan tetap dari v1 dan v2: bot privat, tanpa monetisasi, stack TypeScript + discord.js + Lavalink + SQLite. Batas desain baru (asumsi, dikoreksi di Epic 0): paling banyak 5 server, 20 pengguna aktif, dan 3 sesi pemutaran bersamaan.

## 2. Gerbang masuk v3

v3 dimulai setelah semua ini terpenuhi:

- V2.0 sampai V2.2 selesai dan kriteria penerimaannya lulus.
- Metrik v2 (Bagian 12 PRD v2) tercapai 4 minggu berturut-turut: lagu berhasil diputar minimal 95%, waktu mulai bunyi sesuai target, dan pemulihan kegagalan maksimal 2 menit.
- Backup dan restore SQLite sudah diuji.
- Minimal satu pemicu nyata tercatat: pemicu hosting di Bagian 10 PRD v2, permintaan server kedua, atau keluhan "bot sedang dipakai di VC lain". Tanpa pemicu, v3 tidak dimulai.
- Dashboard lokal v2 (E9) hanya wajib selesai bila Activity (E6 di bawah) dikerjakan.

## 3. Tujuan dan non-tujuan

Tujuan

- G1: bot tersedia saat dibutuhkan tanpa PC harian menyala (bila pemicu hosting terpenuhi).
- G2: bot melayani beberapa server dengan data yang terisolasi.
- G3: beberapa voice channel memutar musik bersamaan.
- G4: file musik lokal bisa diputar dan masuk koleksi.
- G5: kontrol tambahan di luar slash command: tray Windows dan Discord Activity.
- G6: biaya perawatan tidak naik lebih cepat dari manfaatnya. Fitur v3 yang tidak dipakai dimatikan.

Non-tujuan

- Bot publik, verifikasi Discord, monetisasi, fitur premium.
- Sharding, Kubernetes, Redis, PostgreSQL. SQLite tetap dipakai sampai kontensi lock terukur.
- Streaming langsung dari Spotify.
- Bot di server yang belum disetujui pemilik.

## 4. Epic 0: evaluasi dan keputusan (dikerjakan pertama)

Data v2 (`play_log`, `health_events`) belum menjawab kebutuhan v3. Tambahkan tabel `demand_events` yang mencatat:

- `busy_rejected`: pengguna memutar musik, tetapi bot sedang di VC lain.
- `guild_join_pending`: bot diundang ke server yang belum terdaftar.
- `unsupported_link`: link yang ditolak karena sumbernya tidak didukung.

Kumpulkan data 2 sampai 4 minggu, lalu tulis satu halaman keputusan. Tiap epic E1 sampai E6 mendapat putusan ya, tunda, atau tidak, lengkap dengan angka pendukung. Data tambahan yang dihitung:

- Persentase jam pemakaian saat bot offline karena PC sleep atau mati.
- Jumlah kegagalan YouTube per bulan dan apakah OAuth atau poToken sudah dipakai.
- Pemakaian command dan dashboard v2.
- Daftar file musik lokal yang ingin diputar (catat manual oleh pemilik).

Ambang keputusan (usulan awal, boleh diubah):

- E1 multi-server: ya bila ada server kedua nyata dengan pemakai yang dikenal pemilik.
- E2 hosting: ya bila bot offline saat dibutuhkan lebih dari 2 kali per bulan, atau ada keluhan tiap minggu.
- E3 multi-bot: ya bila `busy_rejected` muncul lebih dari 4 kali per bulan.
- E4 audio lokal: ya bila pemilik punya koleksi file yang ingin diputar rutin.
- E5 tray: ya hanya bila E2 memutuskan PC Windows tetap menjadi host.
- E6 Activity: ya hanya bila E2 menghasilkan URL HTTPS tetap dan dashboard v2 dipakai rutin.

Privasi: semua data tetap lokal di SQLite dan tidak dikirim ke luar.

## 5. Epic dan kebutuhan

Prioritas: P0 wajib untuk jalur yang dipilih, P1 setelahnya, P2 opsional. Prioritas berlaku hanya setelah Epic 0 menyetujui epic yang bersangkutan.

### E1. Sesi dan multi-server (P0 bila disetujui)

Sesi

- Ganti kunci antrean dari `guild_id` menjadi `session_id` (guild\_id + voice\_channel\_id). `QueueManager`, snapshot antrean, dan auto-leave bekerja per sesi.
- Ini satu-satunya refactor besar di inti. Kerjakan lebih dulu walau multi-server belum aktif, karena E3 membutuhkannya.
- Tes regresi: perilaku satu server dan satu sesi tidak berubah.

Server

- `GUILD_ID` tunggal diganti tabel `guilds`. Server pertama dimigrasi dengan status approved.
- Bot yang masuk ke server baru berstatus pending. Bot menolak semua command, lalu mengirim DM ke pemilik dengan tombol Setujui dan Tolak. Pending lebih dari 24 jam: bot keluar sendiri.
- Slash command didaftarkan per server saat disetujui dan saat startup.
- Data per server: antrean, history, `play_log`, pengaturan. Data milik pengguna (playlist, favorit) berlaku di server mana pun. `match_overrides` dan `track_cache` bersifat global karena koreksi lagu benar di semua server.
- `/settings` untuk admin server: volume default, auto-leave, DJ role, rasio vote skip, batas antrean.
- `/forget`: pengguna menghapus datanya sendiri (favorit, playlist, history, `play_log`). Retensi `play_log` default 180 hari, bisa diatur.
- Batas sesi bersamaan total di config (`max_concurrent_sessions`, default 3).
- P1: DJ role dan vote skip, karena kontrol "siapa saja boleh skip" tidak cocok lagi bila pendengar bertambah.

Kriteria: dua server berjalan, tes isolasi otomatis membuktikan tidak ada kebocoran data antar server, dan server yang belum disetujui tidak bisa menjalankan command.

### E2. Hosting tanpa PC harian (P0 bila disetujui)

Tiga opsi dievaluasi sebelum memilih:

- A. PC Windows tetap. Tanpa biaya baru. Masalah ketersediaan tetap ada. Bila dipilih, E2 selesai dan E5 (tray) menjadi relevan.
- B. Server rumah: mini PC, laptop lama, atau Raspberry Pi. Memakai IP rumahan yang lebih jarang dibatasi YouTube. Biaya berupa listrik. Uji Lavalink di arm64 lebih dulu bila memakai Raspberry Pi.
- C. VPS. Selalu menyala, tetapi IP datacenter lebih sering dibatasi YouTube (PRD v1 Bagian 12) dan ada biaya bulanan.

Urutan saran: A bila masalahnya jarang, B bila masalahnya ketersediaan, C hanya bila perlu akses dari luar rumah (Activity) atau tidak ada perangkat di rumah. Pilihan diputuskan dengan data: uji pemutaran di host kandidat selama 1 minggu sebelum cutover.

Kebutuhan untuk opsi B dan C:

- Port ke Linux: ganti skrip `.ps1` dengan skrip lintas platform, periksa path dan line ending.
- Paket: Docker Compose berisi layanan bot dan Lavalink, dengan volume untuk SQLite, plugin, dan log. Alternatif: unit systemd. Port Lavalink tidak dibuka ke luar jaringan Compose.
- Rahasia: `.env` di host dengan izin file terbatas, tidak masuk image, tidak masuk log.
- Deploy: skrip menarik kode, build, restart, menjalankan health check, dan rollback ke versi sebelumnya bila gagal.
- Heartbeat eksternal: bot tidak bisa melaporkan matinya dirinya sendiri atau host. Pasang pengecek di luar host (misalnya Healthchecks.io, atau Uptime Kuma di perangkat lain) yang mengirim pesan saat heartbeat berhenti.
- Backup harian dari v2 dikirim ke luar host. Restore diuji di host baru.
- VPS: SSH hanya dengan key, firewall menutup semua port kecuali SSH, pembaruan keamanan OS otomatis.
- OAuth YouTube di server tanpa layar: jalankan lewat alur device code dari log, sesuai dokumentasi plugin.
- Cutover: uji lebih dulu dengan bot staging (token kedua). Saat pindah, matikan instance lama sebelum menyalakan yang baru, karena dua instance dengan token sama membalas dobel. Simpan instance lama sebagai cadangan selama 1 minggu.
- File lokal (E4) tidak ikut pindah kecuali folder musik disinkronkan ke host baru.

Kriteria: 7 hari tanpa intervensi, host pulih dalam 5 menit setelah reboot, deploy dengan rollback diuji sekali lewat kegagalan yang disengaja, restore backup berhasil, dan tingkat sukses lagu tidak turun lebih dari 2 poin persentase dibanding v2.

### E3. Multi-bot ala Jockie (P1 bila disetujui, bergantung pada E1)

- Satu proses menjalankan N klien discord.js, satu per token.
- Bot utama menerima semua slash command dan tombol. Bot satelit tidak mendaftarkan command. Satelit hanya memakai intent Guilds dan GuildVoiceStates, bergabung ke VC, dan memutar.
- Satu node Lavalink dipakai bersama. Tiap bot punya manager dan User-Id sendiri di klien Lavalink.
- Router sesi saat `/play`:
  1. Bila VC pemanggil sudah punya sesi, pakai bot sesi itu.
  2. Bila belum, pilih bot yang idle: utama dulu, lalu satelit berurutan.
  3. Bila semua sibuk, balas ephemeral yang menyebut bot mana ada di VC mana.
- Satelit dilewati dan dicatat di log bila tidak ada di server itu atau tidak punya izin Connect dan Speak di VC tujuan.
- Tombol dan command kontrol diarahkan lewat VC pemanggil ke sesinya. Aturan "harus di VC yang sama dengan bot" berlaku per sesi.
- Pesan Now Playing dikirim bot utama dan menampilkan bot yang sedang memutar.
- Bot kembali ke pool saat sesi berakhir (auto-leave).
- Config: `BOT_TOKENS` untuk satelit dan `max_bots`. Token tidak muncul di log, `/status`, atau pesan error.
- Sebelum mulai: baca Developer Policy Discord dan cek batas jumlah aplikasi per akun. Tiap satelit adalah aplikasi Discord sendiri dan diundang manual.

Kriteria: 3 sesi di 3 VC berjalan 2 jam tanpa putus, dan crash satu satelit tidak menghentikan sesi lain.

### E4. Audio lokal (P1 bila disetujui)

- Folder musik diatur di config (`LOCAL_MUSIC_DIRS`). Hanya file di dalam folder itu yang bisa diputar.
- Pengindeks memindai folder, membaca tag (judul, artis, album, durasi, cover) dengan library seperti `music-metadata` (cek lisensi dan perawatan), lalu menyimpan hasilnya di `local_tracks`. Pindai ulang manual lewat `/library rescan` (khusus pemilik) dan terjadwal.
- Format mengikuti dukungan Lavalink, misalnya mp3, flac, wav, ogg, dan m4a. Diverifikasi di spike awal. Sumber `local` Lavalink diaktifkan di `application.yml`.
- Pengguna tidak pernah mengirim path. Autocomplete `/play` menampilkan hasil dari indeks (label "Lokal"), dan hanya ID indeks yang diterima. Bot memeriksa path asli (realpath) berada di bawah folder yang diizinkan, dan menolak symlink yang keluar dari folder itu.
- Album atau folder bisa diantrekan sekaligus.
- Cover dikirim sebagai attachment di Now Playing.
- Playlist boleh berisi campuran sumber. Bila file hilang, lagu ditandai gagal dengan pesan jelas.
- P2: `/play` dengan lampiran file. Hanya host `cdn.discordapp.com` dan `media.discordapp.net` yang diterima, dengan batas ukuran dan tipe file. URL CDN Discord kedaluwarsa, jadi tidak boleh disimpan di playlist atau snapshot antrean.
- Lirik (E8 v2) memakai tag file lokal untuk pencarian.

Kriteria: 100 file sampel terindeks dengan tag benar, tes input path jahat (`..`, symlink, path absolut) semuanya ditolak, dan pemutaran lokal lolos sesi 2 jam.

### E5. Tray Windows (P2, hanya bila PC tetap menjadi host)

- Ikon tray menampilkan status dari endpoint health lokal (hijau, kuning, merah). Bot mati berarti tidak ada respons, ikon merah dalam 30 detik. Ini menutup celah notifikasi saat bot mati di PC.
- Menu: mulai, hentikan, restart, buka log, buka dashboard, jalankan update Lavalink, mulai bersama Windows.
- Toast Windows saat bot siap atau gagal.
- Tray menggantikan `start-all.ps1` sebagai pengendali proses (Lavalink dulu, lalu bot).
- Implementasi dimulai dari yang teringan: skrip PowerShell dengan `NotifyIcon`. Pindah ke Tauri hanya bila kebutuhan UI bertambah. Electron dihindari karena berat untuk fungsi sekecil ini.
- Tray tidak boleh menyimpan token dan hanya berbicara ke `127.0.0.1`.

Kriteria: ikon merah muncul dalam 30 detik setelah proses bot dimatikan paksa, dan tray berjalan stabil 1 minggu.

### E6. Discord Activity (P2, eksperimental, bersyarat)

Syarat: E2 menghasilkan URL HTTPS tetap (host dengan domain sendiri, atau named tunnel, bukan quick tunnel yang URL-nya berubah) dan dashboard v2 sudah dipakai rutin.

- Activity memakai front-end dashboard v2 (satu codebase), dibungkus Embedded App SDK. URL dipetakan di Developer Portal.
- Autentikasi wajib: login OAuth2 Discord lewat SDK, server memverifikasi token, mengecek pengguna ada di server yang disetujui dan berada di VC sesi itu. Semua endpoint dan WebSocket menuntut autentikasi.
- Dashboard lokal v2 tetap bind ke `127.0.0.1`. Jalur Activity memakai route atau port terpisah dengan autentikasi. Dashboard lama tidak pernah dibuka ke publik.
- Aturan kontrol sama dengan tombol: hanya pengguna di VC yang sama.
- Rate limit, CORS ketat, dan log tanpa token.
- Sakelar mati di config. Kegagalan Activity tidak boleh memengaruhi pemutaran.
- Time-box 1 minggu. Bila belum stabil, tunda ke v4.

Kriteria: pengguna di VC bisa melihat antrean dan menekan kontrol dari dalam Discord, pengguna di luar VC ditolak, dan uji dari perangkat tanpa login gagal dengan benar.

## 6. Roadmap v3

Estimasi kasar untuk satu developer paruh waktu. Urutan akhir mengikuti hasil Epic 0.

V3.0, Evaluasi (2 sampai 4 minggu pencatatan, 1 hari keputusan): Epic 0.

- Kriteria: dokumen keputusan selesai, `demand_events` terisi, tiap epic punya putusan.

V3.1, Sesi dan server (1 sampai 2 minggu): E1.

- Kriteria: tes isolasi lulus, regresi satu server lulus.

V3.2, Hosting (1 sampai 2 minggu): E2. Boleh dikerjakan lebih dulu dari V3.1 bila ketersediaan adalah keluhan utama, karena keduanya tidak saling bergantung.

- Kriteria: lihat E2.

V3.3, Multi-bot (1 sampai 2 minggu): E3.

- Kriteria: 3 sesi bersamaan 2 jam.

V3.4, Lokal dan tray (1 sampai 2 minggu): E4, E5.

- Kriteria: lihat E4 dan E5.

V3.5, Activity (1 minggu, time-box): E6.

## 7. Perubahan arsitektur

Komponen baru:

- `src/sessions/`: `SessionManager` dengan kunci guild\_id + voice\_channel\_id. Menggantikan antrean per server.
- `src/bots/`: `BotPool`, klien utama dan satelit, router sesi.
- `src/guilds/`: registri server, persetujuan, pengaturan per server.
- `src/library/`: pengindeks file lokal, pembaca tag, penjaga path.
- `src/web/auth/`: OAuth Discord dan verifikasi untuk Activity.
- `tray/`: aplikasi tray Windows, proses terpisah dari bot.
- `deploy/`: `Dockerfile`, `compose.yml`, unit systemd, skrip deploy dan rollback.
- `scripts/`: skrip lintas platform pengganti `.ps1` untuk host Linux.

Prinsip: perubahan inti dibatasi pada satu refactor (kunci sesi). Modul lain berbicara lewat interface yang sudah ada (`PlayerEngine`, resolver). `PlayerEngine` mendapat identitas bot (`botId`) agar tiap bot punya instance sendiri. Modul P2 bisa dimatikan lewat config. Kegagalan satu sesi atau satu satelit tidak menyebar ke sesi lain.

## 8. Tambahan model data (SQLite)

- `guilds`: guild\_id, name, status (pending, approved, blocked), added\_by, approved\_at
- `guild_settings` (perluasan): dj\_role\_id, vote\_skip\_ratio, max\_queue
- `bots`: bot\_id, role (main atau satellite), name, enabled. Token tidak disimpan di database, hanya di `.env`.
- `sessions`: session\_id, guild\_id, voice\_channel\_id, bot\_id, started\_at. Snapshot antrean memakai session\_id.
- `local_tracks`: id, root\_id, rel\_path, title, artist, album, duration\_ms, mtime, cover\_cache\_path
- `demand_events`: id, type, guild\_id, user\_id, detail, created\_at
- `play_log`, `history`, `health_events`: pastikan kolom guild\_id ada dan terisi.
- `playlists`: tambah scope (user atau server). Default scope user.

Migrasi: server dari config lama masuk sebagai server pertama berstatus approved. Migrasi diuji pada salinan database sebelum dijalankan.

## 9. Spesifikasi UX tambahan

- `/settings`: satu pesan ephemeral untuk admin server, dengan tombol dan select menu.
- Vote skip: bila pendengar lebih dari 2 dan pemanggil bukan peminta lagu atau DJ, tombol skip memulai voting. Pesan menampilkan progres, misalnya "2 dari 3 setuju".
- Pesan bot sibuk: "Semua bot sedang dipakai. Bot 1 di VC Santai, Bot 2 di VC Game. Gabung ke salah satunya atau coba lagi nanti."
- Now Playing: tampilkan nama bot yang memutar bila multi-bot aktif, dan label sumber "Lokal" untuk file lokal.
- `/guilds` (khusus pemilik): daftar server, setujui, blokir.
- `/library` (khusus pemilik): cari, pindai ulang, statistik koleksi.
- Persetujuan server baru: DM ke pemilik berisi nama server, jumlah anggota, siapa yang mengundang, dan tombol Setujui atau Tolak.
- Tray: menu singkat, satu klik per aksi.
- Activity: satu layar berisi Now Playing, antrean, dan tombol kontrol.

## 10. Kebutuhan non-fungsional tambahan

- Isolasi: kegagalan satu sesi, satu satelit, atau satu server tidak menghentikan yang lain.
- Performa: ukur CPU, RAM, dan frame deficit Lavalink pada 3 sesi bersamaan. Target: tidak ada putus audio selama 2 jam.
- Keamanan: token multi-bot hanya di `.env` atau penyimpanan rahasia host. Lavalink tetap tidak terbuka ke luar. Path file lokal selalu divalidasi di sisi bot. Activity dan jalur publik wajib terautentikasi. Host Linux mengikuti pengerasan di E2.
- Biaya: catat biaya bulanan aktual hosting dan bandingkan dengan anggaran yang ditetapkan di Epic 0.
- Data: backup di luar mesin utama, restore diuji, retensi `play_log` diatur, `/forget` tersedia.
- Kompatibilitas: Windows tetap didukung selama E2 memilih opsi A. Kode lintas platform diuji di Linux lewat Docker.
- Dependensi: library baru berlisensi jelas dan masih dirawat. Catat alasan tiap penambahan.

## 11. Metrik keberhasilan

Dihitung dari `play_log`, `health_events`, dan `demand_events`:

- Ketersediaan bot saat jam pemakaian di host baru: target awal 99% atau lebih, diukur lewat heartbeat eksternal.
- Waktu pulih setelah reboot host: 5 menit atau kurang tanpa tindakan manual.
- Tingkat sukses lagu di host baru: tidak lebih dari 2 poin persentase di bawah v2.
- Kebocoran data antar server: 0 pada tes isolasi.
- Sesi bersamaan: 3 sesi 2 jam tanpa putus.
- `busy_rejected` turun mendekati 0 setelah E3.
- Biaya hosting bulanan: di bawah anggaran.
- Fitur v3 yang tidak dipakai dalam 4 minggu: dimatikan atau dihapus.

## 12. Risiko dan mitigasi

- Rekayasa berlebihan untuk 1 sampai 4 pengguna: gerbang masuk, Epic 0, dan ambang keputusan. Tiap epic boleh ditolak.
- YouTube memblokir IP datacenter: opsi B (IP rumahan) dievaluasi lebih dulu, uji 1 minggu sebelum cutover, batalkan pindah bila tingkat sukses turun. Cadangan: OAuth atau poToken dan `YtDlpEngine` dari v2.
- Dua instance bot dengan token sama saat migrasi: bot staging untuk uji, instance lama dimatikan sebelum instance baru menyala.
- Kebocoran data antar server: tes isolasi otomatis di tiap rilis.
- Dashboard atau Activity terbuka ke internet: autentikasi wajib, dashboard lokal tetap di `127.0.0.1`, uji dari luar jaringan, sakelar mati.
- Path traversal pada audio lokal: pengguna tidak pernah mengirim path, validasi realpath, tes input jahat.
- Token bertambah (multi-bot): semua di `.env`, tidak di log, reset segera bila bocor.
- Ketentuan Discord untuk banyak aplikasi bot: baca Developer Policy dan batas akun sebelum E3.
- Risiko ToS YouTube dan hak cipta naik karena bot 24/7, lebih banyak pengguna, dan IP datacenter: batasi ke server yang dikenal pemilik, terima risikonya secara sadar atau kurangi cakupan.
- Beban perawatan bertambah: tiap epic punya kriteria selesai dan kriteria dimatikan. Fitur yang tidak dipakai dihapus.
- Skrip Windows saja: porting dan uji di Linux sebelum pindah host.

## 13. Pertanyaan terbuka

1. Pemicu mana dari Bagian 2 yang benar-benar terjadi selama v2?
2. Berapa anggaran bulanan untuk hosting?
3. Server tambahan mana yang akan dipakai, dan siapa pemakainya? Apakah mereka dikenal pemilik?
4. Apakah ada perangkat rumah untuk opsi B (mini PC, laptop lama, Raspberry Pi)?
5. Apakah koleksi musik lokal berada di mesin yang sama dengan host bot?
6. Apakah vote skip dan DJ role dibutuhkan, atau satu allowlist cukup?

## 14. Backlog v4

Akses Spotify resmi bila ada akun Premium (LavaSrc atau API resmi), scrobbling ke Last.fm atau ListenBrainz, rekomendasi berbasis riwayat yang lebih cerdas, web player yang bisa dipakai di ponsel (PWA), sumber audio tambahan seperti Bandcamp, dan bot publik terverifikasi (hanya lewat keputusan dan PRD terpisah).
