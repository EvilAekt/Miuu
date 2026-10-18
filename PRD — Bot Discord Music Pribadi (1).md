# PRD — Bot Discord Music Pribadi

*Draft v0.1 · 18 Oktober 2026 · Untuk pemakaian pribadi, berjalan di PC sendiri tanpa VPS*

## 1. Ringkasan

Bot Discord untuk memutar musik di voice channel server pribadi, terinspirasi Jockie Music tapi versi kecil: satu pemilik, satu server (atau sedikit), berjalan di PC lokal. Pengguna cukup menempelkan link YouTube atau Spotify (track, album, playlist) atau mengetik judul, lalu bot memutarnya lewat slash command dan tombol native Discord.

Prinsip desain:

- **Native Discord:** slash command dengan autocomplete, tombol, pesan ephemeral, tanpa prefix command.
- **Sederhana:** tanpa VPS, Redis, PostgreSQL, atau sharding. Semuanya berjalan lokal.
- **Tahan perubahan:** YouTube dan Spotify sering mengubah aturan, jadi lapisan sumber musik dibuat modular dan punya jalur cadangan.

## 2. Tujuan dan non-tujuan

**Tujuan**

- G1: memutar link YouTube (video, playlist) dan Spotify (track, album, playlist) dengan satu command.
- G2: kontrol pemutaran lengkap (pause, skip, loop, shuffle, seek, volume, queue).
- G3: pengalaman yang terasa native: tombol di pesan Now Playing, autocomplete, balasan error yang jelas.
- G4: bisa dijalankan di PC dengan satu skrip.
- G5: mudah dirawat ketika sumber musik berubah.

**Non-tujuan (v1)**

- Bot publik, banyak server, sharding, fitur premium, dashboard web.
- Online 24/7 (bot hanya aktif saat PC menyala dan terhubung internet).
- Streaming langsung dari Spotify (tidak tersedia untuk bot; lihat Bagian 6).
- Prefix command seperti `m!play`.
- Multi-bot ala Jockie (masuk backlog).

## 3. Konteks dan asumsi

- Pengguna: satu pemilik, paling banyak 4 orang, di satu server Discord pribadi (satu GUILD\_ID di config).
- Bot berjalan di PC pribadi; saat PC mati atau sleep, bot offline. Mode 24/7 tidak dibutuhkan.
- Tidak ada VPS, domain, atau server web.
- Bot tidak dipublikasikan: opsi Public Bot dimatikan dan hanya pemilik yang mengundangnya.
- PC memakai Windows dan tidak ada yang punya akun Spotify Premium (pemilik maupun kenalan); keduanya memengaruhi desain (Bagian 11 dan 14).

## 4. User stories

- Sebagai pemilik, saya menempelkan link playlist Spotify dan bot memutar lagunya tanpa saya menunggu semua lagu diproses.
- Sebagai pendengar, saya menempelkan link YouTube dan musik langsung main di voice channel saya.
- Sebagai pendengar, saya mengetik judul lagu dan memilih dari saran autocomplete.
- Sebagai pendengar, saya mengatur lagu lewat tombol di pesan Now Playing tanpa mengetik command.
- Sebagai pemilik, saya menyimpan playlist favorit dan memutarnya lagi nanti.
- Sebagai pemilik, saya ingin bot memberi tahu dengan jelas jika sebuah link tidak bisa diputar, bukan diam atau crash.

## 5. Kebutuhan fungsional

Prioritas: **P0** wajib untuk MVP, **P1** untuk v1.0, **P2** nanti.

### 5.1 Command

**P0**

- `/play query [next]`: query bisa berupa link YouTube, link Spotify, atau kata kunci. Autocomplete untuk kata kunci. Opsi `next` menaruh lagu di urutan berikutnya.
- `/pause`, `/resume`, `/skip`, `/stop` (kosongkan antrean dan keluar dari VC)
- `/queue` (berhalaman), `/nowplaying`
- `/volume`, `/loop` (off, track, queue), `/shuffle`, `/remove`, `/clear`, `/seek`

**P1**

- `/skipto`, `/move`, `/previous`
- Filter audio (bass boost, nightcore) lewat Lavalink
- `/playlist save|play|list|delete` dan `/favorite`
- `/autoplay`, `/history`
- Tombol 'tambahkan seluruh playlist' saat link video YouTube memuat parameter playlist
- Snapshot antrean ke SQLite agar bisa dilanjutkan setelah restart

* `/import`: tempel banyak link track Spotify sekaligus (lewat modal atau lampiran .txt) untuk melewati batas jumlah lagu per playlist

**P2**

- Mode tetap di VC (24/7, selama PC menyala), lyrics dari provider berlisensi, koreksi manual pencocokan Spotify ke YouTube, multi-bot.

### 5.2 Aturan perilaku

- `/play` otomatis join VC milik pemanggil. Command kontrol hanya boleh dari user yang berada di VC yang sama dengan bot.
- Jika pemanggil tidak di VC, balas dengan pesan ephemeral.
- Auto-leave jika VC kosong atau antrean habis lebih dari N menit (default 3, bisa diatur).
- Batas antrean default 500 lagu dan impor playlist default 100 lagu per perintah; keduanya bisa diatur di config.
- Allowlist opsional berdasarkan user ID atau role.
- Semua error dijelaskan spesifik: video privat, diblokir di region, dibatasi umur, link tidak dikenali, playlist Spotify tidak bisa diakses.

## 6. Pemrosesan link (fitur inti)

### 6.1 Pengenalan input

1. Parse URL. Host `youtube.com`, `youtu.be`, `music.youtube.com` dikenali sebagai YouTube. Host `open.spotify.com` (termasuk path regional seperti `/intl-xx/`) dan URI `spotify:` dikenali sebagai Spotify.
2. URL dari sumber lain yang didukung Lavalink (misalnya SoundCloud) diteruskan apa adanya; URL tak dikenal ditolak dengan pesan jelas.
3. Teks yang bukan URL diperlakukan sebagai pencarian kata kunci.
4. Normalisasi: buang parameter pelacak, ubah `/shorts/ID` menjadi URL video biasa.

### 6.2 YouTube

- Didukung: video, playlist, link `youtu.be`, YouTube Music.
- Video live bisa diputar tetapi tidak bisa di-seek; durasi ditampilkan sebagai LIVE.
- Video privat, diblokir region, atau dibatasi umur menghasilkan error spesifik. Video dibatasi umur mungkin butuh login (lihat Bagian 12).
- Playlist dinamis seperti Mix diperlakukan best-effort.

### 6.3 Spotify

- Spotify tidak memberi akses audio ke bot. Bot hanya mengambil metadata (judul, artis, durasi, cover), mencari padanannya di YouTube Music atau YouTube, lalu memutar hasil itu. Konsekuensinya, kadang yang terputar versi lain (live, cover, remix).
- Pencocokan: kecocokan judul + artis (ISRC hanya jika metadata menyediakannya), lalu selisih durasi (toleransi default 5 detik, bisa diatur). Pilih hasil bertipe 'song' dari YouTube Music lebih dulu.
- Tipe link: **track, album, playlist** didukung (P0). Link artist, show, dan episode podcast belum didukung dan harus menghasilkan pesan jelas.
- Playlist buatan Spotify (editorial atau algoritmik) dan playlist privat kemungkinan tidak bisa diambil; tampilkan error yang jelas. Jalur tanpa API juga membatasi jumlah lagu yang terbaca dari satu playlist (kemungkinan sekitar 50–100 lagu pertama); bot memberi tahu jika daftar terpotong dan menyarankan /import (Bagian 5.1).
- **Resolusi bertahap:** untuk playlist atau album besar, resolve lagu pertama dulu agar langsung bermain, lalu resolve sisanya di background saat mendekati giliran. Jangan membuat pengguna menunggu puluhan pencarian.
- **Cache:** simpan pemetaan ID Spotify ke video YouTube di SQLite agar tidak mencari ulang dan hasilnya konsisten.

### 6.4 Jika resolusi gagal

Coba urutan sumber: YouTube Music, YouTube, SoundCloud. Jika semua gagal, tandai lagu sebagai gagal dan lanjut ke lagu berikutnya. Di akhir impor, tampilkan ringkasan, contoh: '3 dari 50 lagu gagal diputar'.

## 7. Kebutuhan non-fungsional

- **Performa (target, bukan jaminan):** suara mulai ≤ 3 detik untuk link YouTube tunggal dan ≤ 5 detik untuk link Spotify track pada koneksi rumah normal.
- **Reliabilitas:** koneksi ke Lavalink auto-reconnect. Jika Lavalink mati, bot memberi pesan jelas dan tidak crash.
- **Sumber daya:** bot dan Lavalink harus nyaman berjalan berdampingan di PC harian; batasi heap JVM Lavalink (mulai dari 512 MB) dan ukur pemakaian RAM di M2.
- **Observabilitas:** log terstruktur (misalnya pino) ke file dengan rotasi; level log lewat env; token tidak boleh muncul di log.
- **Kompatibilitas:** Windows, macOS, atau Linux.
- **Perawatan:** versi dependency di-pin; ada skrip untuk memperbarui Lavalink dan plugin.

## 8. Arsitektur dan tech stack

```
Discord  <--- slash command / event --->  Bot (TypeScript, discord.js)
                                              |            |
                                       SQLite (file)   Lavalink v4 (Java, localhost)
                                                           |  plugin YouTube, LavaSrc
                                                           v
                                                  audio ke Discord Voice
```

**Komponen**

- **Bot:** TypeScript + discord.js. Berisi command handler, queue manager, UI builder, dan resolver link (Spotify lewat spotify-url-info, tanpa API key).
- **Client Lavalink:** `lavalink-client` atau `shoukaku`.
- **Audio:** Lavalink v4 dengan plugin YouTube (LavaSrc opsional, lihat Bagian 11).
- **Penyimpanan:** SQLite (misalnya better-sqlite3 atau Drizzle).
- **Konfigurasi:** `.env` dan file config, divalidasi dengan zod.
- **Tooling:** pnpm, tsx untuk dev, ESLint, Vitest.

**Lapisan abstraksi `PlayerEngine`:** interface (play, pause, seek, volume, dan seterusnya) dengan implementasi utama `LavalinkEngine`. Implementasi cadangan opsional `YtDlpEngine` (yt-dlp + ffmpeg + `@discordjs/voice`) bila jalur Lavalink bermasalah.

**Struktur folder**

```
src/
  commands/        # satu file per slash command
  events/          # ready, interactionCreate, voiceStateUpdate
  player/          # PlayerEngine, LavalinkEngine, QueueManager
  resolvers/       # youtube.ts, spotify.ts, parseInput.ts, matcher.ts
  ui/              # nowPlaying, queuePage, errorMessages
  db/              # schema, repositories
  config/          # env + validasi
lavalink/          # application.yml, plugins/ (jar tidak di-commit)
scripts/           # start-all, update-lavalink
```

**Keputusan teknis**

- **K1, Lavalink, bukan audio di proses bot:** audio berjalan di luar event loop Node, plugin YouTube dirawat komunitas, dan resolusi Spotify ditangani resolver buatan sendiri. Konsekuensi: butuh Java dan dua proses. Alternatif: yt-dlp + ffmpeg (lebih sederhana, tanpa Java, tapi pemeliharaan sumber jadi tanggung jawab sendiri).
- **K2, SQLite:** cukup untuk pemakaian pribadi, tanpa server database.
- **K3, slash command saja, didaftarkan sebagai guild command:** muncul langsung tanpa menunggu propagasi global dan tidak butuh intent MessageContent.
- **K4, UI:** mulai dari embed + tombol; migrasi ke Components V2 di M4 setelah logika inti stabil.
- **K5, bot privat:** tidak ada kebutuhan sharding, verifikasi, atau moderasi skala besar.

## 9. Model data (SQLite)

- `guild_settings`: guild\_id, default\_volume, auto\_leave\_minutes, allowed\_role\_id, always\_on
- `playlists`: id, owner\_user\_id, name, created\_at
- `playlist_tracks`: playlist\_id, position, source, source\_url, title, artist, duration\_ms
- `favorites`: user\_id, source, source\_url, title, artist, duration\_ms
- `track_cache`: source, source\_id, resolved\_source, resolved\_id, title, duration\_ms, updated\_at (pemetaan Spotify ke YouTube)
- `history` (P1): guild\_id, user\_id, title, artist, source\_url, played\_at

Antrean aktif disimpan di memori pada P0; snapshot ke SQLite masuk P1.

## 10. Spesifikasi UX

- **Now Playing:** judul (berupa link), artis, durasi dan progres, thumbnail, sumber, dan peminta. Tombol: pause/resume, skip, loop (bergilir off, track, queue), shuffle, stop, volume -10/+10, dan lihat queue. Discord membatasi 5 tombol per baris, maksimal 5 baris.
- Setiap lagu baru memunculkan pesan Now Playing baru; tombol pada pesan lama dinonaktifkan agar tidak membingungkan.
- Tombol hanya berfungsi untuk user yang berada di VC yang sama; yang lain mendapat balasan ephemeral.
- **Queue:** 10 lagu per halaman, tombol prev/next, menampilkan total durasi.
- **Autocomplete:** maksimal 25 pilihan dan harus merespons dalam sekitar 3 detik, jadi pakai cache dan timeout internal ±2 detik.
- **Impor playlist:** pesan ringkasan ('Menambahkan 48 lagu dari ...') yang diperbarui saat proses background selesai.
- **Error:** ephemeral, berbahasa Indonesia, menyebut penyebab dan langkah yang bisa dicoba.

## 11. Spotify: strategi dan risiko

Hasil pengecekan per Oktober 2026:

- Pada 6 Februari 2026 Spotify mengumumkan Development Mode mewajibkan pemilik app punya akun **Spotify Premium**, dibatasi **satu Client ID per developer**, dan akses endpoint dipersempit. Aturan ini berlaku untuk app baru sejak 11 Februari dan app lama sejak 9 Maret 2026.
- Spotify juga menyatakan bergerak menjauh dari Client Credentials flow untuk endpoint metadata. LavaSrc saat ini dikonfigurasi dengan clientId dan clientSecret, jadi **belum terverifikasi** apakah jalur ini masih lancar untuk app baru. Ini harus dicek di M0.
- Beberapa endpoint (misalnya rekomendasi dan artist top tracks) sudah dicabut atau dibatasi, jadi fitur autoplay tidak boleh bergantung pada rekomendasi Spotify.

**Keputusan untuk proyek ini:** tidak ada yang punya Spotify Premium (pemilik maupun kenalan), jadi app Development Mode tidak bisa dibuat. Jalur utama adalah resolver buatan sendiri yang membaca metadata publik dari halaman embed Spotify lewat library `spotify-url-info` (tanpa API key atau login). Library ini hanya mengambil judul, artis, durasi, dan cover; audio tetap diputar dari YouTube.

**Tangga fallback (dicoba berurutan)**

1. **Utama:** resolver sendiri dengan `spotify-url-info`, tanpa API resmi. Mendukung track, album, dan playlist; playlist besar kemungkinan terpotong di sekitar 50–100 lagu pertama, dan playlist privat atau buatan Spotify mungkin tidak terbaca. Jalur ini rapuh: bisa rusak jika Spotify mengubah halaman embed, dan pemakaiannya perlu diperiksa terhadap ketentuan Spotify. Library di-pin dan diperbarui saat rusak.
2. **Cadangan untuk playlist besar:** command `/import` menerima banyak link track Spotify yang ditempel (modal atau lampiran .txt), lalu me-resolve satu per satu. Di aplikasi desktop Spotify, memilih semua lagu di playlist lalu menyalinnya biasanya menghasilkan daftar link track, jadi batas jumlah lagu per playlist bisa dilewati tanpa API.
3. **Terakhir:** jika jalur di atas gagal (misalnya Spotify mengubah halaman embed), bot menolak link Spotify dengan pesan jelas dan menyarankan judul lagu atau link YouTube. Akses API resmi baru mungkin jika kelak ada akun Premium, jadi resolver dibuat modular agar LavaSrc atau API resmi bisa dipasang belakangan.

## 12. YouTube: strategi dan risiko

- Gunakan plugin YouTube komunitas Lavalink (multi-client). Plugin ini diperbarui ketika YouTube berubah, jadi cek pembaruan berkala atau saat error muncul.
- IP rumahan umumnya lebih jarang diblokir daripada IP datacenter, tetapi bukan jaminan. Jika muncul permintaan sign-in, ikuti opsi OAuth atau poToken di dokumentasi plugin dan **pakai akun YouTube cadangan, bukan akun utama**.
- Jalur cadangan: `YtDlpEngine` (K1).
- Pemakaian pribadi non-komersial menekan risiko, tetapi YouTube tetap melarang pengambilan audio di luar layanannya; ini risiko ToS yang perlu diterima secara sadar. Groovy dan Rythm ditutup pada 2021 setelah ditekan Google, namun keduanya bot publik skala besar.

## 13. Keamanan dan privasi

- Token bot dan secret Spotify hanya di `.env` yang masuk `.gitignore`. Jika bocor, reset di portal masing-masing.
- Intent minimal: Guilds dan GuildVoiceStates.
- Matikan Public Bot. Izin undangan minimal: View Channels, Send Messages, Embed Links, Connect, Speak.
- **Lavalink:** ganti password default, dan bind ke `127.0.0.1` supaya tidak terbuka ke jaringan rumah atau internet.
- Allowlist user/role untuk command.
- Data yang disimpan hanya ID Discord, playlist, dan cache pemetaan lagu.

## 14. Setup dan operasional lokal

**Prasyarat:** Node.js LTS, pnpm, Java (versi minimum mengikuti Lavalink v4; cek dokumentasi rilis terbaru), akun Discord dengan server pribadi, dan Git (opsional). Spotify Premium tidak diperlukan pada jalur Spotify yang dipilih.

**Alur awal**

1. Buat aplikasi dan bot di Discord Developer Portal, undang ke server pribadi.
2. Siapkan Lavalink: jar, `application.yml`, plugin YouTube dan LavaSrc.
3. Isi `.env`.
4. Jalankan `pnpm dev`, atau skrip `start-all` yang menyalakan Lavalink dulu lalu bot.

**Operasional**

- Docker tidak wajib. Jalankan Lavalink langsung dengan `java -jar Lavalink.jar`; pasang JDK (misalnya Temurin) lewat installer atau winget.
- Skrip `scripts/start-all.ps1` menyalakan Lavalink dulu, menunggu portnya siap, lalu menyalakan bot. Jika PowerShell menolak menjalankan skrip, buat pintasan `.bat` yang memanggil `powershell -ExecutionPolicy Bypass -File scripts/start-all.ps1`.
- Auto-start saat login (opsional): Task Scheduler dengan trigger 'At log on' atas nama user sendiri.
- Windows Defender Firewall mungkin meminta izin saat Lavalink pertama kali jalan; izinkan hanya untuk jaringan Private. Lavalink sendiri di-bind ke `127.0.0.1` (Bagian 13).
- Sleep atau hibernate memutus bot; ubah pengaturan daya (Settings > System > Power) saat bot dipakai.
- Rutin: perbarui Lavalink dan plugin, cek `pnpm outdated`.
- Backup: file SQLite dan `.env` (simpan terpisah dengan aman).

## 15. Roadmap dan kriteria penerimaan

Estimasi kasar untuk satu developer paruh waktu.

**M0, Spike (1–2 hari)**

- Lavalink berjalan lokal dan memutar satu link YouTube lewat skrip uji.
- spotify-url-info diuji dengan link Spotify track, album, dan playlist (termasuk playlist lebih dari 100 lagu); catat metadata yang didapat dan batas jumlah lagu per playlist.
- Hasil: konfirmasi bahwa jalur tanpa API cukup andal; jika tidak, pilih cadangan di Bagian 11.

**M1, MVP (3–5 hari)**

- Semua command P0 berjalan, termasuk `/play` untuk YouTube dan Spotify.
- Join dan leave VC benar; auto-leave bekerja.
- Kriteria: 20 link uji (Bagian 16) menghasilkan suara atau error yang jelas, tanpa crash.

**M2, UX native dan stabilitas (3–5 hari)**

- Now Playing dengan tombol, queue berhalaman, autocomplete, resolusi bertahap untuk playlist besar, cache pemetaan.
- Auto-reconnect Lavalink, logging, skrip start-all.
- Kriteria: sesi 2 jam tanpa intervensi; pemakaian RAM terukur dan tercatat.

**M3, Fitur ala Jockie (1 minggu)**

- Playlist tersimpan, favorit, /import link Spotify massal, filter audio, autoplay (tanpa rekomendasi Spotify), history, snapshot antrean.
- Kriteria: antrean pulih setelah restart bot.

**M4, Polishing**

- Migrasi ke Components V2 (perhatikan: flag IsComponentsV2 menonaktifkan `content` dan `embeds`; batas 40 komponen per pesan).
- Opsional: `YtDlpEngine`, mode tetap di VC, lyrics.

## 16. Rencana uji

- **YouTube:** video biasa, `youtu.be`, `music.youtube.com`, playlist 50+ video, live, privat, diblokir region, dibatasi umur, shorts.
- **Spotify:** track, album, playlist publik, playlist >100 lagu, playlist privat, link regional `/intl-xx/`, episode podcast dan link artist (harus gagal dengan rapi).
- **Operasional:** matikan Lavalink saat bot jalan, putus internet 30 detik, bot dipindah atau di-disconnect manual dari VC, VC kosong, restart bot.
- **Unit test:** parser URL, queue manager (loop, shuffle, remove), matcher Spotify ke YouTube (skor judul dan durasi).

## 17. Risiko dan mitigasi

- **YouTube memblokir atau mengubah mekanisme:** plugin diperbarui berkala, jalur cadangan `YtDlpEngine`, akun cadangan untuk OAuth.
- **Akses Spotify terbatas (Premium, kuota, Client Credentials):** tanpa Premium, bot memakai metadata dari halaman embed publik yang bisa rusak kapan saja bila Spotify mengubahnya; mitigasi: library di-pin dan diperbarui, spike M0, tangga fallback, pesan error yang jelas, dan link YouTube atau judul lagu tetap berfungsi.
- **Lagu Spotify cocok ke versi yang salah:** pencocokan multi-sinyal (ISRC, judul, artis, durasi), cache, koreksi manual (P2).
- **PC sleep atau mati:** diterima sebagai batasan; dokumentasikan pengaturan power.
- **Token bocor:** `.env` di gitignore, reset segera bila bocor, jangan tempel token di screenshot atau chat.
- **Lavalink terbuka ke jaringan:** bind ke localhost dan password kuat.
- **Risiko ToS:** pemakaian pribadi dan tidak dipublikasikan; diterima secara sadar.

## 18. Pertanyaan terbuka

Tidak ada pertanyaan terbuka. Fitur lyrics ditunda dan tetap di backlog (Bagian 19).

## 19. Backlog masa depan

Multi-bot (beberapa akun bot dari satu codebase agar bisa memutar di beberapa VC sekaligus), web UI lokal, lyrics, koreksi pencocokan lagu, statistik dengar, pindah ke VPS bila nanti ingin online 24/7.
