# Rencana Unit Testing PRD v1 sampai v8: Tugas untuk Junior Dev dan AI Murah

Dari: Senior Dev. Untuk: Junior Dev atau AI executor yang murah (model flash atau sejenisnya). Draft v1.0. 18 Oktober 2026.

## 0. Baca ini dulu

Tugasmu: menulis unit test untuk bot musik Discord berdasarkan PRD v1 sampai v8, lalu melaporkan celah yang kamu temukan. Dokumen ini memecah pekerjaan menjadi 39 tugas (T0 sampai T38). Kerjakan satu tugas per sesi, urut sesuai Bagian 5.

Tiga hal yang harus kamu tahu:

- Senior belum melihat kode repo. Nama file dan fungsi di sini adalah tebakan dari struktur folder PRD v1 (`src/commands`, `src/player`, `src/resolvers`, `src/db`, `src/config`). Cari padanan aslinya. Bila beda, pakai nama asli dan catat di laporan.
- Checklist PRD v6 sampai v8 mengaku semua tes lulus (49, 52, 55 tes). Belum ada yang memverifikasi. T0 memeriksanya.
- Kamu menulis tes. Kamu tidak memperbaiki kode produksi. Bila tes menemukan bug, laporkan (Bagian 6). Jangan ubah kode produksi tanpa izin senior.

Framework: Vitest, sesuai stack di PRD v1. Ikuti gaya tes yang sudah ada di folder `tests/`.

Tingkat tugas (menentukan siapa yang mengerjakan):

- A: aman untuk AI murah. Fungsi murni dengan input dan output jelas.
- B: AI murah boleh mengerjakan, manusia wajib review sebelum merge.
- C: manusia atau AI yang kuat. Tugas ini menyangkut keamanan, timing, atau konkurensi. AI murah hanya boleh menulis draf.

Ukuran untuk junior: S (1 sampai 2 jam), M (3 sampai 5 jam), L (6 sampai 10 jam).

Cara kerja satu tugas:

1. Baca tugas sampai habis, lalu baca kode produksi yang terkait.
2. Tulis daftar judul tes dulu. Tunjukkan ke reviewer untuk tugas B dan C.
3. Isi tes dan jalankan. Semua harus hijau, kecuali bug yang kamu temukan.
4. Uji sensitivitas: ubah satu hal di kode produksi (misalnya balik tanda `<` jadi `>`), pastikan tesmu merah, lalu kembalikan. Tes yang tidak pernah merah tidak berguna.
5. Jalankan seluruh suite. Waktu suite tidak boleh naik lebih dari 3 detik per tugas.
6. Tulis laporan singkat (Bagian 6).

Prompt untuk AI murah. Tempel apa adanya dan ganti isi dalam kurung siku:

Kamu penulis unit test. Kerjakan tugas \[ID tugas\] dari dokumen rencana tes. Aturan: tulis hanya file tes baru di folder tests/. Jangan ubah kode produksi. Jangan tambah dependency. Jangan pakai jaringan atau Discord asli. Pakai fake timers untuk waktu dan SQLite in-memory untuk database. Satu tes menguji satu perilaku, namanya 'should \[hasil\] when \[kondisi\]'. Sebelum menulis kode, tulis daftar judul tes dan berhenti untuk persetujuan. Bila kode produksi tidak cocok dengan deskripsi tugas, berhenti dan laporkan perbedaannya. Jangan mengarang fungsi yang tidak ada. Bila tes merah karena bug di kode produksi, jangan ubah tesnya agar hijau. Laporkan bug itu.

Lampirkan ke prompt: Bagian 1 dokumen ini, teks tugasnya, file kode produksi terkait, dan satu contoh tes yang sudah ada.

## 1. Aturan emas testing

- Cepat: seluruh suite unit di bawah 30 detik di laptop dan di bawah 2 menit di CI.
- Deterministik: tanpa `Date.now()` nyata, tanpa `setTimeout` nyata, tanpa `Math.random()` yang tidak terkendali. Pakai fake timers dan random dengan seed.
- Terisolasi: tiap tes membuat state sendiri. Reset singleton di `beforeEach`. Tes tidak boleh bergantung pada urutan.
- Tanpa jaringan: blokir `fetch` dan socket di setup global supaya tes yang lupa mock langsung gagal.
- Tanpa Discord dan Lavalink asli di unit test. Pakai fake dari T1. Lavalink asli hanya di T35.
- Database: SQLite `:memory:` dengan migrasi nyata. Jangan mock database. Bila migrasi lambat, buat template sekali per file lalu salin.
- Jangan mock hal yang sedang diuji. Mock hanya batas luar: Lavalink, Discord, Gemini, jaringan, jam, filesystem.
- Satu perilaku per tes. Nama tes: `should <hasil> when <kondisi>`.
- Kasus buruk sama pentingnya dengan kasus baik: kosong, null, terlalu panjang, unicode, emoji, nol, negatif, NaN, batas atas dan bawah.
- Snapshot hanya untuk keluaran kecil, misalnya satu embed. Snapshot besar tidak ada yang membacanya.
- Tes lambat atau butuh Docker diberi label `slow` dan dipisah dari suite harian.
- Tes yang kadang gagal dianggap bug. Jangan diulang otomatis untuk menutupinya. Cari penyebabnya.
- Cakupan: 80% baris global dan 95% di modul kritis (parser, penjaga path, backup, autentikasi web, pengatur volume). Angka bukan tujuan. Uji sensitivitas lebih penting.
- Proporsi: banyak unit test, sedikit tes integrasi, dan checklist manual untuk suara asli (T37).

## 2. Temuan senior: celah yang harus diuji

Tingkat: Kritis, Tinggi, Sedang. Tiap temuan menunjuk tugas yang mengujinya.

F1, Kritis. PRD v8 membuka dashboard ke LAN lewat QR, padahal PRD v1 dan v2 mewajibkan bind ke `127.0.0.1`. PRD v8 tidak menyebut autentikasi. Siapa pun di Wi-Fi yang sama bisa mengontrol bot. Endpoint `/api/listen` (v7) punya risiko sama. Tugas: T25.

F2, Kritis. `/backup restore <filename>` menerima nama file dari pengguna. Risiko path traversal dan zip-slip. Restore ke database yang sedang terbuka (WAL) bisa merusak data. PRD tidak menyebut cek integritas dan izin. Tugas: T18.

F3, Kritis. `/ask` meminta LLM menyusun aksi (play, volume, filter). Prompt injection lewat teks pengguna, judul lagu, atau lirik bisa memicu aksi di luar daftar yang diizinkan atau melewati izin DJ. Tugas: T16, T17.

F4, Kritis. `/sfx`, `/library`, restore, dan podcast menyentuh filesystem Windows: `..`, path absolut, huruf drive, UNC, nama khusus (CON, NUL), byte null, symlink. Tugas: T12, T14, T18.

F5, Kritis. Rahasia bisa bocor lewat log atau pesan error: `GEMINI_API_KEY`, token bot, token scrobble, kunci enkripsi, password Lavalink. Tugas: T31, T36.

F6, Tinggi. Banyak fitur mengubah volume tanpa koordinator: sleep timer, crossfade, autonormalize, memori volume per lagu, `/sfx`, `/volume`. Bug klasik: volume tersangkut di 0 setelah fade dibatalkan. Tugas: T28.

F7, Tinggi. Filter Lavalink saling menimpa: `/8d`, `/speed`, `/pitch`, preset EQ, bass, nightcore. Mengatur satu filter bisa menghapus yang lain bila state tidak digabung. Tugas: T20.

F8, Tinggi. `/speed` dan `/pitch` mengubah arti waktu. Sinkron lirik LRC, aturan scrobble 50%, timing crossfade, progress bar, dan sleep timer bisa meleset. Tugas: T29.

F9, Tinggi. PRD v8 menyebut crossfade sebagai overlap, tetapi mekanismenya fade-out lalu fade-in pada satu player. Itu bukan overlap. Sepengetahuan senior Lavalink tidak punya crossfade bawaan, jadi verifikasi dulu. Kasus tepi: skip, pause, seek, siaran langsung, lagu pendek. Tugas: T23, T35.

F10, Tinggi. Kuis: `customId` tombol tidak boleh memuat jawaban. Klik ganda, penebak di luar VC, antrean harus pulih, judul tidak boleh bocor lewat Now Playing. `source: pop` tidak terdefinisi di PRD. Tugas: T24.

F11, Tinggi. Rich Presence yang diperbarui tiap detik melanggar batas laju gateway Discord (cek angkanya di dokumentasi Discord). Tugas: T22.

F12, Tinggi. `/lyrics explain` mengirim lirik ke Gemini. Ini bertentangan dengan semangat PRD v2 (lirik hanya untuk tampilan pribadi) dan PRD v4 (data yang keluar harus opt-in). PRD v6 sampai v8 juga menambah fitur AI yang PRD v5 tetapkan sebagai non-tujuan. Keputusan produk ada di pemilik. Tugas penguji: T16 memastikan ada opt-in dan batas.

F13, Sedang. Rotasi backup v6 punya dua aturan: maksimal 5 file dan hapus yang lebih tua dari 30 hari. Bila semua backup lebih tua dari 30 hari, aturan kedua menghapus semuanya. Tugas: T18.

F14, Sedang. `/wrapped` dan jam aktif tidak menyebut zona waktu. Pengguna di WIB (UTC+7), jadi pukul 23:30 WIB bisa terhitung siang bila memakai UTC. `/wrapped [user]` juga menampilkan data orang lain tanpa aturan izin. Tugas: T22.

F15, Sedang. Klaim kinerja (CPU di bawah 2%, RAM di bawah 250 MB) belum punya cara ukur. Klaim `/autonormalize` memakai engine native Lavalink v4 belum terbukti. Tugas: T34, T20, T35.

F16, Sedang. Checklist menyebut 49, 52, lalu 55 tes. Sebuah PRD baru menambah sekitar 3 tes untuk 5 sampai 6 fitur. Itu tipis. Tugas: T0.

F17, Sedang. Vote skip: ambang 50% dengan satu pendengar, bot ikut terhitung, pendengar yang tuli, peserta keluar saat voting. Tugas: T15.

F18, Sedang. PRD v8 E5 berjudul offline caching, tetapi isinya hanya metadata di SQLite. Tidak ada audio yang disimpan. Uji juga data basi (video dihapus). Tugas: T27.

## 3. Pertanyaan untuk pemilik produk (jangan ditebak)

Sebelum menulis tes untuk perilaku yang ambigu, minta jawaban ke senior. Tes yang menyandikan tebakan akan mengunci bug.

- Q1: `/quiz source: pop` berarti apa? PRD v8 tidak mendefinisikannya.
- Q2: apa rumus poin kuis berdasarkan kecepatan jawab?
- Q3: vote skip dengan 1 pendengar langsung lolos atau butuh 1 suara? Pendengar yang tuli dihitung atau tidak?
- Q4: boleh `/wrapped [user]` melihat data orang lain? Zona waktu default Asia/Jakarta?
- Q5: pengguna dashboard LAN dipetakan ke pengguna Discord yang mana? Token QR berlaku berapa lama?
- Q6: filter audio bertahan lintas lagu atau di-reset tiap lagu?
- Q7: `/ask` berhenti atau lanjut bila satu aksi gagal? Maksimal berapa aksi per permintaan?
- Q8: lirik boleh dikirim ke Gemini, dan apakah harus opt-in?
- Q9: crossfade yang diinginkan fade-out lalu fade-in, atau overlap sungguhan?
- Q10: saat banyak hal mengubah volume, siapa yang menang? (T28)

## 4. Daftar tugas

Nama file adalah tebakan. Tiap tugas berisi tingkat, ukuran, kasus uji, dan kriteria selesai.

### Kelompok 0: fondasi

T0. Audit tes yang sudah ada (tingkat B, ukuran M)

- Jalankan `npx tsc --noEmit` dan seluruh suite. Catat jumlah tes, waktu total, dan kegagalan. Bandingkan dengan klaim 55 tes.
- Jalankan cakupan. Daftar modul dengan cakupan di bawah 50%.
- Jalankan suite 5 kali berturut-turut. Catat tes yang berubah hasil (flaky).
- Cari tes tanpa assertion, tes yang hanya memeriksa tidak ada error, tes yang memakai jaringan atau `setTimeout` nyata.
- Petakan tiap Epic PRD v1 sampai v8 ke file tes. Tulis belum ada bila kosong.
- Selesai bila: laporan satu halaman berisi angka nyata dan peta Epic ke tes.

T1. Infrastruktur fake bersama di `tests/helpers/` (tingkat B, ukuran L)

- FakeLavalinkPlayer: mencatat panggilan play, pause, seek, volume, filters, stop. Bisa mensimulasikan trackEnd, trackException, trackStuck, disconnect, dan jeda waktu.
- FakeInteraction untuk slash command dan tombol: reply, deferReply, followUp, editReply, member dengan voice channel dan role. Mencatat balasan ephemeral atau tidak, dan allowedMentions.
- FakeClock: pembungkus fake timers Vitest.
- `makeDb()`: SQLite in-memory dengan migrasi nyata.
- Factory: `makeTrack`, `makeUser`, `makeGuild`, `makeSession`.
- Setup global yang memblokir `fetch` dan socket.
- FakeGemini: mengembalikan teks yang diatur tes, melempar error, lambat, atau mengirim JSON rusak.
- Selesai bila: tiap fake punya tes sendiri. Fake yang salah menghasilkan tes yang salah.

### Kelompok A: inti pemutar (PRD v1 dan v2)

T2. Parser input (`src/resolvers/parseInput.ts`, tingkat A, ukuran S)

- YouTube: `watch`, `youtu.be`, `music.youtube.com`, playlist, `/shorts/ID` dinormalisasi jadi URL video biasa, parameter pelacak dibuang, parameter `list` dan `t` ditangani.
- Spotify: track, album, playlist, URI `spotify:track:...`, path regional `/intl-id/`. Artist, show, dan episode menghasilkan pesan belum didukung.
- SoundCloud diteruskan. Bandcamp subdomain dikenali dan domain kustom ditolak dengan pesan jelas (PRD v4).
- URL tak dikenal ditolak dengan pesan jelas. Teks biasa menjadi pencarian.
- Input aneh: kosong, spasi saja, 2.000 karakter, emoji, newline di tengah, huruf besar di host.
- URL berbahaya: `javascript:`, `file:///`, `http://localhost`, `http://127.0.0.1`, IP privat (10.x, 192.168.x, 169.254.x), userinfo seperti `http://a@b`. Tidak boleh diteruskan sebagai sumber HTTP. Ini mencegah SSRF.
- Fungsi tidak pernah melempar exception untuk string apa pun.
- Selesai bila: semua kasus di atas punya tes dan T33 memakai fungsi ini untuk fuzz.

T3. Antrean dan sesi (`src/player/QueueManager.ts`, tingkat B, ukuran L)

- Operasi: add, addNext, remove, move, clear, shuffle dengan seed, loop (off, track, queue), skip, skipto, previous.
- Batas antrean 500 dengan pesan saat penuh. Impor di atas 100 lagu per perintah terpotong dengan ringkasan.
- Indeks tidak valid: negatif, melebihi panjang, bukan angka, antrean kosong.
- Snapshot dan restore: simpan, buat instance baru dari DB (meniru restart), isi dan urutan sama.
- Auto-leave saat VC kosong atau antrean habis lebih dari N menit (default 3, pakai fake timer). Batal bila ada yang masuk atau lagu baru ditambah.
- Dua sesi dalam satu guild (dua VC, PRD v3) tidak saling memengaruhi.
- Lagu gagal ditandai dan dilewati. Ringkasan akhir berbunyi seperti 3 dari 50 lagu gagal diputar.
- Selesai bila: invarian antrean tidak pernah rusak setelah operasi apa pun (dilanjutkan di T33).

T4. Pencocokan Spotify ke YouTube (`src/resolvers/matcher.ts`, tingkat A, ukuran M)

- Skor memakai judul, artis, selisih durasi (toleransi default 5 detik, ikut config), dan ISRC bila ada.
- Hasil bertipe song di YouTube Music menang atas video biasa.
- Penalti untuk live, cover, karaoke, slowed, sped up, remix bila kata itu tidak ada di judul asli. Tanpa penalti bila ada di judul asli.
- Bonus kanal resmi dan kanal Topic.
- Buat 20 pasangan judul nyata, termasuk judul Indonesia, huruf campur, feat., tanda kurung, dan versi loop 10 jam.
- `match_overrides` mengalahkan skor. `match_preferences` avoid dan prefer berlaku. Skor seri menghasilkan pilihan yang deterministik.
- Kandidat kosong menghasilkan pesan jelas tanpa crash. Urutan fallback: YouTube Music, YouTube, SoundCloud (pakai resolver palsu).
- `track_cache`: pencarian kedua tidak memanggil resolver.
- Playlist Spotify yang terpotong di 50 sampai 100 lagu menghasilkan penanda terpotong dan pesan yang menyarankan `/import`.

T5. Adapter pemutar dengan Lavalink palsu (`src/player/LavalinkEngine.ts`, tingkat B, ukuran L)

- play, pause, resume, stop, seek, volume. Seek di luar batas (negatif, melebihi durasi) dan seek pada siaran langsung ditolak. Volume di luar batas, NaN, dan string ditolak.
- trackException dan trackStuck: lanjut ke lagu berikutnya, pesan error jelas, tidak loop tanpa akhir (ada batas percobaan).
- Lavalink disconnect: sambung ulang dengan backoff, antrean tetap utuh.
- Node mati saat play: pesan jelas, tidak crash.
- Circuit breaker (PRD v2): 5 gagal dalam 5 menit memicu fallback, lalu pulih (fake clock). Lewati bila belum diimplementasi dan catat.
- Event trackEnd ganda tidak melewati dua lagu.
- Pesan error spesifik untuk video privat, diblokir region, dibatasi umur.
- Selesai bila: tidak ada skenario Lavalink palsu yang membuat proses melempar exception tak tertangkap.

T6. Penjaga izin dan batas UI (`src/commands`, `src/events`, `src/ui`, tingkat B, ukuran M)

- Pemanggil tidak di VC (balasan ephemeral), di VC lain dari bot, di DM, bot tanpa izin Connect atau Speak.
- Command khusus pemilik (`/status`, `/diagnose`, `/backup`, `/guilds`, `/library rescan`) ditolak untuk non-pemilik, termasuk pemilik server Discord yang bukan pemilik bot.
- Allowlist user dan role. Peran DJ dan vote skip (PRD v3).
- Guild berstatus pending menolak semua command.
- Tombol pada pesan Now Playing lama dinonaktifkan. Tombol hanya berfungsi untuk pengguna di VC yang sama.
- Batas UI: 5 tombol per baris dan maksimal 5 baris, 10 lagu per halaman queue, autocomplete maksimal 25 pilihan dan timeout internal sekitar 2 detik.
- Meta-test: ambil daftar semua command dari registri dan pastikan tiap command punya deklarasi izin. Command baru tanpa deklarasi membuat tes gagal.
- Selesai bila: meta-test aktif dan lulus.

### Kelompok B: data dan layanan (PRD v2 sampai v5)

T7. Migrasi dan retensi database (`src/db`, tingkat B, ukuran M)

- Migrasi dari DB kosong sampai versi terbaru berhasil.
- Dari salinan skema tiap versi lama (v1 sampai v8) ke terbaru, data lama tetap utuh.
- Dijalankan dua kali tidak merusak (idempoten). Kegagalan di tengah membatalkan semuanya (transaksi).
- Foreign key dan indeks ada. WAL aktif. `PRAGMA integrity_check` hasilnya ok.
- Retensi: `play_log` 180 hari serta `health_events`, `demand_events`, `maintenance_log` sesuai config. Uji batas hari ke-180 dan ke-181.
- Migrasi yang menghapus tabel (PRD v5) membuat arsip file lebih dulu.
- Selesai bila: tiap versi skema lama punya fixture dan lulus.

T8. Playlist, favorit, ekspor dan impor (tingkat A, ukuran M)

- Ekspor lalu impor kembali memberi hasil sama persis (JSON dan .txt), termasuk unicode dan emoji.
- Impor rusak: JSON tidak valid, tipe salah, 50.000 baris, baris kosong, duplikat, field tak dikenal, URL berbahaya (aturan T2).
- Playlist milik pengguna dan playlist server (scope). Pengguna lain tidak bisa mengubah playlist orang.
- Ubah nama, urut ulang, hapus, gabung. Nama kosong, duplikat, dan 500 karakter.
- Batas jumlah playlist dan lagu. Favorit: tambah dua kali, hapus yang tidak ada.
- `/import` Spotify massal lewat modal dan lampiran .txt: batas 100 lagu per perintah, link yang tidak valid dilaporkan satu per satu.

T9. Meta-test `/forget` (tingkat C, ukuran M)

- Baca skema lewat `PRAGMA table_info`. Temukan semua tabel dengan kolom `user_id`, `created_by`, `added_by`, atau `updated_by`.
- Tes gagal bila ada tabel pengguna yang tidak ada di daftar hapus `/forget` atau di daftar pengecualian tertulis beserta alasannya. Tabel baru di versi mendatang otomatis terjaring.
- Isi data satu pengguna di semua tabel, jalankan `/forget`, pastikan nol baris tersisa. Data pengguna lain utuh.
- Token scrobble dan antrean scrobble ikut terhapus.
- `/forget` dua kali tidak error. Kegagalan di tengah membatalkan semuanya.
- Selesai bila: menambah tabel berkolom `user_id` tanpa mendaftarkannya membuat tes ini merah (buktikan dengan uji sensitivitas).

T10. Scrobble dan enkripsi token (`src/scrobble/`, tingkat C, ukuran M)

- Aturan kirim: lagu di bawah 30 detik tidak dikirim. Kirim setelah 50% durasi atau 4 menit, mana yang lebih dulu. Pause tidak dihitung. Skip sebelum ambang tidak dikirim. Loop satu lagu dihitung per putaran.
- Antrean kirim ulang: backoff, batas percobaan, status pending, sent, failed. Layanan mati tidak menahan pemutaran.
- Enkripsi: round trip, nonce berbeda tiap enkripsi, ciphertext yang diubah satu byte gagal didekripsi, kunci salah gagal, kunci hilang mematikan fitur dengan pesan jelas.
- Token tidak muncul di log, error, dan `/status` (pakai logger palsu yang menangkap semua keluaran).
- Metadata memakai sumber asli (Spotify atau tag file), bukan judul video YouTube.
- Hanya pengguna yang opt-in yang dikirim.
- Waktu dengar dihitung dengan aturan T29 bila `/speed` aktif.
