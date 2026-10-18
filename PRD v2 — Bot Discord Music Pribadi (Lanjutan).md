# PRD v2 — Bot Discord Music Pribadi (Lanjutan)

*Draft v0.1 · 18 Oktober 2026 · Lanjutan dari PRD v1.0 · Pemakaian pribadi di PC Windows, tanpa VPS*

## 1. Ringkasan dan hubungan dengan v1

PRD v1 membangun bot yang memutar link YouTube dan Spotify dengan kontrol native Discord, berjalan di PC lokal. PRD v2 mengatur tahap sesudah v1 dipakai nyata: membuat bot lebih nyaman dipakai tiap hari, lebih mudah dirawat, dan menambah fitur ala Jockie yang sengaja ditunda (lirik, statistik, dashboard lokal).

PRD ini ditulis sebelum v1 selesai, jadi prioritas di sini adalah hipotesis. Setelah 2–4 minggu pemakaian v1, urutannya ditinjau ulang berdasarkan data (Bagian 4).

Batasan tetap dari v1: satu server Discord, 1 sampai 4 pengguna, PC Windows, tanpa VPS, tanpa Spotify Premium. Stack tetap TypeScript + discord.js + Lavalink + SQLite.

## 2. Gerbang masuk v2 (v1 dianggap selesai)

v2 dimulai setelah semua ini terpenuhi:

- Milestone M0–M3 PRD v1 selesai dan kriteria penerimaannya lulus.
- 20 link uji (YouTube dan Spotify) menghasilkan suara atau error yang jelas, tanpa crash.
- Sesi pemutaran 2 jam berjalan tanpa intervensi.
- Antrean pulih setelah bot di-restart.
- Bot dipakai nyata minimal 2 minggu, dengan lagu yang gagal dan keluhan tercatat (Bagian 4).

## 3. Tujuan dan non-tujuan

**Tujuan**

- G1: bot tetap berfungsi dengan perawatan minimal, meski YouTube atau Spotify berubah.
- G2: kegagalan terlihat dan bisa didiagnosis dalam hitungan menit, bukan ditebak-tebak.
- G3: kualitas pencocokan lagu Spotify ke YouTube naik dan bisa dikoreksi manual.
- G4: koleksi pribadi (playlist, favorit, riwayat) terasa lengkap.
- G5: fitur ala Jockie yang ditunda tersedia: autoplay, lirik, dashboard lokal.

**Non-tujuan (v2)**

- Bot publik, banyak server, monetisasi, fitur premium.
- Streaming langsung dari Spotify.
- Pindah ke VPS sebagai default (hanya dievaluasi, Bagian 10).

## 4. Input dari pemakaian v1 (Epic 0, dikerjakan pertama)

Keputusan prioritas v2 harus berbasis data, jadi bot mencatat sendiri:

- `play_log`: lagu, sumber, hasil (berhasil atau gagal), alasan gagal, waktu mulai bunyi, di-skip atau tuntas.
- Jumlah pemakaian per command.
- Kejadian error Lavalink, plugin YouTube, dan resolver Spotify.

Setelah 2–4 minggu, ringkas dalam satu halaman: lagu yang paling sering gagal, median waktu mulai bunyi, command yang paling sering dan paling jarang dipakai, serta jumlah intervensi manual per minggu. Hasilnya dipakai untuk mengurutkan epic di bawah.

Privasi: semua data disimpan lokal di SQLite dan tidak dikirim ke mana pun.

## 5. Epic dan kebutuhan

Prioritas: **P0** wajib untuk v2, **P1** setelahnya, **P2** opsional.

### E1. Kesehatan dan observabilitas (P0)

- `/status`: versi bot, uptime, status Lavalink, plugin YouTube aktif atau tidak, hasil tes resolver Spotify terakhir, pemakaian RAM, dan jumlah lagu gagal dalam 24 jam terakhir. Balasan ephemeral.
- Health check berkala (tiap beberapa menit): Lavalink terhubung, pencarian ringan ke YouTube, dan satu link Spotify 'canary' yang tetap.
- Notifikasi saat gagal beruntun: pesan ke channel log pribadi atau DM pemilik, berisi penyebab dan saran langkah.
- Log berotasi, level log bisa diubah tanpa restart.

### E2. Perawatan otomatis (P0)

- Skrip `update-lavalink.ps1`: unduh versi baru Lavalink dan plugin, simpan versi lama sebagai cadangan, uji, lalu rollback otomatis jika tes gagal.
- Cek versi dependency terjadwal dengan laporan ringkas (tidak memperbarui otomatis).
- Backup harian file SQLite dan `.env` ke folder lain (opsional: disk eksternal).
- `/diagnose` (khusus pemilik): memutar tes pendek di VC dan melaporkan hasil tiap langkah (resolve, load, play).
- Migrasi skema database memakai tool migrasi (misalnya Drizzle) agar perubahan data aman.

### E3. Kualitas pencocokan lagu (P0)

- `/fixmatch`: jika lagu Spotify terputar dengan padanan yang salah, pengguna memilih padanan lain dari beberapa kandidat (select menu). Pilihan disimpan sebagai override di `match_overrides` dan dipakai seterusnya.
- Skor pencocokan ditingkatkan: penalti untuk kata seperti live, cover, karaoke, slowed, sped up, dan remix jika tidak ada di judul asli; bonus untuk kanal artis resmi dan kanal 'Topic'.
- Preferensi pribadi: daftar kata dan kanal yang selalu dihindari atau diprioritaskan (di config).
- Indikator kasar kecocokan: persentase pemutaran Spotify yang tidak di-skip dalam 10 detik pertama.

### E4. Koleksi pribadi (P1)

- Playlist: ubah nama, urut ulang, hapus lagu, gabung, serta ekspor dan impor (JSON atau .txt berisi link).
- `/history` dan `/replay` (putar ulang yang terakhir atau sesi tertentu).
- `/stats`: lagu dan artis teratas, total waktu mendengar, per periode (minggu, bulan) dan per pengguna.
- Favorit cepat: tombol suka di pesan Now Playing menambah lagu ke favorit.

### E5. Autoplay dan radio tanpa API Spotify (P1)

- `/autoplay` di v1 baru kerangka; v2 mengisinya dengan sumber rekomendasi yang tidak bergantung pada Spotify: pencarian 'mirip' lewat YouTube Mix atau lagu terkait, serta riwayat pemutaran sendiri.
- `/radio <lagu atau artis>`: antrean berkelanjutan dari satu lagu awal.
- Aturan: hindari mengulang lagu yang baru diputar dalam N lagu terakhir; berhenti jika VC kosong.
- Kualitas rekomendasi dinilai lewat skip-rate dari Epic 0.

### E6. Ketahanan sumber audio (P1)

- Circuit breaker: jika plugin YouTube gagal beruntun (misalnya 5 kali dalam 5 menit), bot memberi tahu dan beralih ke fallback.
- `YtDlpEngine` (yt-dlp + ffmpeg + `@discordjs/voice`) sebagai mesin cadangan di balik interface `PlayerEngine` dari v1, dengan cara pemasangan dan pembaruan yt-dlp di Windows yang terdokumentasi.
- Sumber tambahan seperti SoundCloud sebagai cadangan pencarian.
- Opsi OAuth atau poToken untuk plugin YouTube bila muncul permintaan sign-in (pakai akun cadangan, bukan akun utama).

### E7. Migrasi UI ke Components V2 (P1)

- Pesan Now Playing dan queue dibangun ulang dengan Container, Section (cover album), dan tombol.
- Batasan: flag IsComponentsV2 menonaktifkan `content` dan `embeds`, dan maksimal 40 komponen per pesan.
- Tidak mengubah perilaku, hanya tampilan.

### E8. Lirik (P2, ditunda dari v1)

- Tombol 'Lirik' di Now Playing dan `/lyrics [judul]`, balasan ephemeral, berhalaman.
- Sumber yang dievaluasi: LRCLIB, database lirik terbuka dengan API publik tanpa API key. LRCLIB mencocokkan berdasarkan artis, judul, album, dan durasi, serta menyediakan lirik bersinkron (format LRC). Perlu diuji untuk lagu Indonesia dan lagu dengan judul berantakan. Permintaan diberi antrean dan jeda karena LRCLIB bisa membatasi laju.
- Lirik adalah karya pencipta dan penerbitnya: pakai hanya untuk tampilan pribadi, jangan dibagikan massal, dan cache hanya sementara.
- Judul YouTube dibersihkan (buang 'Official MV', 'Lyrics', dan sejenisnya) sebelum pencarian.
- Lirik berjalan otomatis ala karaoke tidak dilakukan lewat edit pesan Discord karena batas laju edit; tersedia hanya di dashboard lokal (E9).

### E9. Dashboard web lokal (P2)

- Halaman di `http://localhost:<port>` untuk melihat Now Playing dan antrean, kontrol dasar, mengelola playlist, melihat statistik, dan lirik bersinkron.
- Stack: server Fastify atau Express di proses yang sama dengan bot, WebSocket untuk pembaruan langsung, front-end ringan (Vite + framework kecil, atau HTML + htmx).
- Keamanan: bind ke `127.0.0.1` saja, tanpa akses dari jaringan lain.
- Alternatif yang dievaluasi: Discord Activity (Embedded App SDK) agar UI tampil di dalam Discord. Discord memerlukan URL HTTPS publik, jadi perlu tunnel seperti cloudflared; URL quick tunnel berubah setiap dijalankan sehingga pengaturan di Developer Portal harus diperbarui tiap kali. Karena itu Activity ditandai eksperimental dan bukan pilihan awal.

### E10. Kenyamanan di PC Windows (P1)

- Menjalankan bot di latar belakang tanpa jendela terminal (Task Scheduler dengan jendela tersembunyi, atau process manager seperti pm2).
- Notifikasi Windows atau ikon tray saat bot siap atau gagal (opsional).
- Menangani PC sleep lalu bangun: bot terhubung ulang otomatis ke Discord dan Lavalink.
- Mode tetap di VC selama PC menyala (P2; di v1 dinyatakan tidak dibutuhkan).

## 6. Roadmap v2

Estimasi kasar untuk satu developer paruh waktu.

**V2.0, Fondasi (1 minggu): Epic 0, E1, E2**

- Kriteria: `/status` akurat; kegagalan Lavalink memicu notifikasi dalam 5 menit; update Lavalink dengan rollback berhasil diuji sekali dengan kegagalan yang disengaja.

**V2.1, Kualitas dan koleksi (1–2 minggu): E3, E4**

- Kriteria: `/fixmatch` menyimpan koreksi dan dipakai pada pemutaran berikutnya; ekspor dan impor playlist bolak-balik tanpa kehilangan lagu.

**V2.2, Ketahanan dan tampilan (1–2 minggu): E5, E6, E7, E10**

- Kriteria: simulasi kegagalan plugin YouTube berpindah ke fallback otomatis; Now Playing memakai Components V2; bot pulih setelah PC sleep tanpa tindakan manual.

**V2.3, Lirik dan dashboard (1–2 minggu): E8, E9**

- Kriteria: lirik muncul untuk minimal 8 dari 10 lagu uji; dashboard menampilkan lirik bersinkron dan hanya bisa diakses dari PC sendiri.

Urutan V2.1–V2.3 bisa berubah setelah Epic 0 menghasilkan data.

## 7. Perubahan arsitektur

Komponen baru:

```
src/
  health/        # health check, /status, notifikasi
  jobs/          # penjadwal: cek berkala, backup, laporan
  matching/      # skor pencocokan, override, preferensi
  recommend/     # autoplay dan radio
  lyrics/        # klien LRCLIB, pembersih judul, cache sementara
  web/           # server lokal + WebSocket + front-end dashboard
scripts/
  update-lavalink.ps1
  backup.ps1
```

Prinsip: modul baru berbicara ke inti lewat interface yang sudah ada (`PlayerEngine`, `QueueManager`, resolver), bukan mengubah inti. Fitur P2 dibuat sebagai modul yang bisa dimatikan lewat config.

## 8. Tambahan model data (SQLite)

- `play_log`: id, guild\_id, user\_id, source, source\_url, title, artist, result, fail\_reason, start\_latency\_ms, skipped\_at\_ms, played\_at
- `match_overrides`: spotify\_id, youtube\_id, created\_by, created\_at
- `match_preferences`: type (avoid atau prefer), kind (keyword atau channel), value
- `health_events`: id, component, status, detail, created\_at
- `lyrics_cache` (sementara): track\_key, kind, content, expires\_at

Perubahan skema dikelola dengan migrasi berversi.

## 9. Spesifikasi UX tambahan

- **`/status`:** satu pesan ephemeral dengan indikator per komponen (OK, lambat, gagal) dan penyebab terakhir. Jika ada yang gagal, tampil langkah yang disarankan.
- **`/fixmatch`:** menampilkan lagu yang terakhir diputar, lalu select menu berisi 5 kandidat (judul, kanal, durasi). Setelah memilih, bot langsung memutar kandidat itu dan menyimpannya.
- **`/stats`:** ringkasan teks dengan peringkat; pilihan periode lewat tombol.
- **Notifikasi kegagalan:** pesan singkat berisi apa yang gagal, sejak kapan, dan apa yang sedang dicoba bot.
- **Lirik:** satu halaman berisi beberapa ratus karakter, dengan tombol prev/next; pesan ephemeral.

## 10. Keputusan hosting dan skala (evaluasi, bukan fitur)

Bot tetap di PC. Pindah ke VPS atau mode 24/7 dipertimbangkan hanya jika salah satu terjadi:

- PC sering mati atau sleep sehingga bot terasa tidak bisa diandalkan.
- Pengguna bertambah melebihi 4 orang atau lebih dari satu server.
- YouTube konsisten memblokir IP rumahan dan solusi OAuth atau poToken tidak cukup.

Jika itu terjadi, buat PRD terpisah: biaya, pemilihan penyedia, dan dampaknya ke Spotify serta YouTube (IP datacenter lebih sering dibatasi). Multi-bot ala Jockie juga masuk keputusan itu.

## 11. Kebutuhan non-fungsional tambahan

- **Keandalan:** kegagalan satu modul (lirik, dashboard, rekomendasi) tidak boleh menghentikan pemutaran.
- **Performa:** health check dan pencatatan tidak menambah latensi mulai bunyi lebih dari sekitar 100 ms (target).
- **Data:** backup bisa dipulihkan, dan prosedur restore diuji sekali.
- **Keamanan:** dashboard hanya di `127.0.0.1`; token dan kredensial tidak muncul di log, `/status`, atau halaman web.
- **Dependensi:** library tambahan harus berlisensi jelas dan masih dirawat; catat alasan tiap penambahan.

## 12. Metrik keberhasilan

Dihitung dari `play_log` dan `health_events`:

- Persentase lagu yang berhasil diputar: target awal ≥ 95%, disesuaikan setelah ada data.
- Median waktu mulai bunyi: ≤ 3 detik untuk YouTube, ≤ 5 detik untuk Spotify.
- Waktu pulih dari kegagalan Lavalink atau plugin: ≤ 2 menit tanpa tindakan manual.
- Intervensi manual per minggu: turun dibanding minggu pertama v1.
- Persentase pemutaran Spotify yang dikoreksi dengan `/fixmatch`: turun seiring waktu.

## 13. Risiko dan mitigasi

- **Scraping Spotify rusak (jalur tanpa API):** canary harian di E1, notifikasi, library di-pin dan diperbarui, `/import` sebagai cadangan.
- **YouTube mengubah mekanisme:** circuit breaker dan `YtDlpEngine` (E6).
- **Scope creep:** epic P2 dikerjakan hanya setelah P0 dan P1 stabil; tiap epic punya kriteria selesai.
- **Lirik dan hak cipta:** hanya tampilan pribadi, cache sementara, tidak dibagikan.
- **Dashboard terbuka tanpa sengaja:** bind ke localhost dan uji dari perangkat lain di jaringan rumah.
- **Pembaruan Windows me-restart PC:** auto-start dan reconnect (E10).
- **Beban perawatan bertambah:** E2 mengotomatiskan hal yang berulang; fitur yang tidak pernah dipakai (lihat statistik command) dihapus.

## 14. Pertanyaan terbuka

1. Urutan prioritas epic: setelah Epic 0 menghasilkan data, apa yang paling mengganggu di v1?
2. Cukup lewat Discord, atau dashboard lokal benar-benar diinginkan?
3. Perlu lirik bersinkron, atau lirik biasa sudah cukup?
4. Notifikasi kegagalan lebih nyaman lewat DM atau channel log pribadi?

## 15. Backlog v3

Multi-bot ala Jockie, Discord Activity, pindah ke VPS dan mode 24/7, dukungan lebih dari satu server, aplikasi tray khusus Windows, dan sumber audio lokal (file di PC).
