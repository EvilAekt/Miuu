# PRD v4: Bot Discord Music Pribadi (Keberlanjutan dan Pendalaman)

Draft v0.1. 18 Oktober 2026. Lanjutan dari PRD v1, v2, dan v3. Pemakaian pribadi.

## 1. Ringkasan dan hubungan dengan v1 sampai v3

PRD v1 membangun bot dasar. PRD v2 membuatnya awet. PRD v3 memperluas jangkauannya: hosting, multi-server, multi-bot, audio lokal. PRD v4 mengubah arah. Fokusnya bukan menambah fitur sebanyak mungkin, tetapi memastikan bot tetap hidup bertahun-tahun dengan sedikit tenaga, lalu menambah fitur yang memperdalam pemakaian: scrobbling, rekomendasi dari riwayat sendiri, kontrol dari ponsel, dan sumber audio tambahan.

Pemeliharanya satu orang. Setiap fitur baru menambah beban perawatan. Karena itu v4 dibuka dengan audit beban, lalu memilih satu dari tiga jalur: Lanjut, Pelihara, atau Pensiun. Dua jalur terakhir adalah hasil yang sah.

Semua epic fitur di v4 berasal dari backlog v4 di PRD v3 dan masih hipotesis. Epic keberlanjutan (E1 sampai E3) berlaku di jalur mana pun.

Batasan tetap: bot privat, tanpa monetisasi, stack TypeScript + discord.js + Lavalink + SQLite. Batas desain v3 (5 server, 20 pengguna aktif, 3 sesi bersamaan) tidak naik.

## 2. Gerbang masuk v4

- Epic v3 yang disetujui di Epic 0 v3 sudah selesai dan kriteria penerimaannya lulus.
- Bot stabil 8 minggu berturut-turut: metrik v2 dan v3 tercapai tanpa intervensi besar.
- Backup dan restore sudah diuji di host yang dipakai sekarang.
- Untuk epic fitur (E4 sampai E7): ada pemicu nyata, yaitu permintaan pengguna atau data yang cukup. Tanpa pemicu, hanya E1 sampai E3 yang dikerjakan.

## 3. Tujuan dan non-tujuan

Tujuan

- G1: pemilik bisa memulihkan bot dari nol memakai dokumentasi tertulis, tanpa mengingat apa pun.
- G2: pembaruan dependency rutin berjalan lewat tes otomatis dan staging, bukan lewat uji manual.
- G3: ada jalur keluar yang jelas: bekukan fitur atau pensiunkan bot dengan rapi.
- G4: lagu yang diputar bisa dicatat ke layanan scrobbling, dengan persetujuan tiap pengguna.
- G5: autoplay memakai riwayat sendiri dan terbukti lebih baik dari v2.
- G6: bot bisa dikontrol dari ponsel tanpa membuka surface serangan baru.
- G7: beban perawatan tidak naik. Fitur yang tidak dipakai dimatikan.

Non-tujuan

- Bot publik, bot terverifikasi Discord, monetisasi, fitur premium. Lihat Bagian 13.
- Pemutar audio di browser atau aplikasi native ponsel.
- Model machine learning berat, GPU, atau layanan LLM untuk rekomendasi.
- Sumber baru yang butuh akun berbayar atau kunci API mahal.
- Pindah dari SQLite, kecuali kontensi terukur.

## 4. Epic 0: audit dan keputusan arah (dikerjakan pertama)

Ukur beban nyata sebelum menambah apa pun. Selama 4 minggu, pemilik mencatat setiap intervensi di tabel `maintenance_log` lewat skrip CLI (menit yang dipakai, jenis, catatan singkat). Data yang dihitung:

- Jam perawatan per bulan dan jenisnya: pembaruan rutin, perbaikan sumber, insiden, lain-lain.
- Jumlah dan lama insiden, serta waktu dari gejala sampai pulih.
- Biaya hosting aktual dibanding anggaran v3.
- Pemakaian command dan fitur v3: mana yang dipakai, mana yang tidak.
- Jumlah pemutaran di `play_log` (dibutuhkan E5) dan jumlah pengguna aktif.
- Permintaan fitur dari pengguna: scrobbling, akses ponsel, sumber audio.

Hasilnya satu halaman keputusan arah:

- Lanjut: kembangkan fitur E4 sampai E7 yang punya pemicu.
- Pelihara: bekukan fitur. Hanya E1 sampai E3, patch keamanan, dan perbaikan sumber.
- Pensiun: jalankan rencana di E3.

Ambang usulan awal (boleh diubah): bila jam perawatan lebih dari 4 jam per bulan selama 2 bulan berturut-turut, jalur otomatis menjadi Pelihara, dan fitur yang tidak dipakai dimatikan sebelum fitur baru dipertimbangkan.

Pemilik juga menetapkan satu tanggal tinjau tahunan. Pada tanggal itu, epic 0 diulang dan keputusan arah diperbarui.

## 5. Epic dan kebutuhan

Prioritas: P0 wajib di jalur mana pun, P1 setelahnya, P2 opsional. E4 sampai E7 hanya dikerjakan bila Epic 0 memilih Lanjut dan pemicunya ada.

### E1. Dokumentasi, runbook, dan pemulihan (P0)

- README setup dari nol, diuji dengan mengikutinya di mesin bersih atau VM. Bagian yang tidak jelas diperbaiki sampai berhasil tanpa bantuan.
- Catatan keputusan (ADR) singkat untuk keputusan besar: K1 sampai K5 dari v1, dan pilihan hosting serta multi-bot dari v3.
- Inventaris akun dan layanan: aplikasi Discord (utama, satelit, staging), akun YouTube cadangan, hosting, domain, layanan heartbeat, penyimpanan backup. Isinya lokasi dan pemilik, bukan rahasia.
- Runbook satu halaman per skenario, dengan langkah berurutan dan cara memastikan berhasil:
  1. Token bocor atau perlu direset.
  2. YouTube berubah dan plugin rusak.
  3. Resolver Spotify rusak.
  4. Database korup atau hilang.
  5. Host mati atau disk penuh.
  6. Akun YouTube cadangan terkunci.
  7. Pembaruan API atau library Discord merusak bot.
- Latihan pemulihan satu kali per kuartal: restore backup ke mesin bersih, jalankan bot staging, dan catat berapa lama pulihnya. Runbook yang gagal dalam latihan diperbaiki saat itu juga.
- Runbook diperbarui setiap kali insiden nyata menemukan langkah yang kurang.

Kriteria: pihak lain (atau pemilik 6 bulan lagi) bisa memulihkan bot staging dari backup hanya dari dokumen, dalam waktu yang dicatat.

### E2. Pembaruan terkendali dan tes otomatis (P0)

- Kebijakan: tinjau dependency tiap bulan lewat laporan v2. Patch dan minor masuk ke staging otomatis dan ke produksi bila tes lulus. Major (discord.js, Node, Java, Lavalink, klien Lavalink, tool migrasi) dijadwalkan, dibaca changelog-nya, dan diuji 1 minggu di staging.
- Lockfile masuk repo, versi di-pin. Dependabot atau Renovate membuat pull request pembaruan.
- CI (misalnya GitHub Actions) menjalankan lint, typecheck, dan unit test: parser URL, queue manager, matcher, router sesi, penjaga path file lokal.
- Tes integrasi memakai Lavalink di Docker dan file audio kecil lokal, sehingga tidak bergantung pada YouTube atau Spotify.
- Tes migrasi database dijalankan pada salinan data sebelum tiap rilis.
- Tes kontrak sumber: canary YouTube dan Spotify dari v2 dijalankan terjadwal dan hasilnya masuk `health_events`.
- Rilis memakai tag versi, changelog, dan rollback satu perintah. Setiap rilis diuji dulu di bot staging dari v3.
- Pantauan perubahan eksternal masuk laporan bulanan: versi API dan gateway Discord, perubahan intents, rilis Lavalink dan plugin YouTube.
- Patch keamanan kritis diterapkan dalam 7 hari (usulan awal).

Kriteria: satu pembaruan minor lewat CI dan staging tanpa edit manual, dan satu pembaruan major dilatih di staging lengkap dengan rollback.

### E3. Jalur bekukan dan pensiun (P0)

- Sakelar `maintenance_mode` di config. Saat aktif, semua modul P1 dan P2 mati, `/status` menampilkan banner "mode bekukan", dan hanya pemutaran inti yang berjalan.
- Rencana pensiun sebagai skrip dan daftar langkah:
  1. Umumkan tanggal henti ke pengguna dan server.
  2. Ekspor data pengguna (playlist dan favorit dalam JSON atau .txt, dari fitur ekspor v2).
  3. Matikan bot dan Lavalink.
  4. Reset token di Developer Portal, hapus aplikasi Discord (utama, satelit, staging).
  5. Hapus backup menurut retensi dan hapus akun YouTube cadangan.
  6. Arsipkan repo dengan README yang menjelaskan status akhir.
- Pensiun sebagian juga didukung: matikan satelit, atau tutup satu server, tanpa mematikan sisanya.
- Skrip pensiun diuji sekali pada bot staging.

Kriteria: `maintenance_mode` mematikan semua modul non-inti tanpa restart manual berulang, dan skrip pensiun menyelesaikan semua langkah di staging.

### E4. Scrobbling (P1, bersyarat)

Tujuan: lagu yang didengar tercatat di profil dengar pengguna. Mulai dari ListenBrainz (terbuka dan sederhana). Last.fm menyusul sebagai P2.

- Opt-in per pengguna. `/scrobble connect` menampilkan penjelasan privasi, lalu meminta token lewat modal. Token tidak pernah muncul di chat atau log.
- Data yang dikirim: artis, judul, album, durasi, waktu putar. Tidak ada ID Discord.
- Metadata memakai sumber asli (Spotify, tag file lokal), bukan judul video YouTube yang berantakan.
- Aturan scrobble: lagu lebih dari 30 detik, dikirim setelah diputar setengah durasi atau 4 menit, mana yang lebih dulu. Aturan layanan diverifikasi saat implementasi. Status "sedang diputar" boleh dikirim.
- Pengiriman asinkron dengan antrean `scrobble_queue`. Gagal berarti dicoba ulang dengan backoff dan tidak pernah menahan pemutaran.
- Token disimpan terenkripsi (kunci di `.env`), bisa dihapus lewat `/scrobble disconnect`, dan ikut terhapus oleh `/forget`.
- Lagu yang sudah terkirim tetap ada di layanan luar. Penjelasan privasi menyebut hal ini.
- Mengubah prinsip v2 "data tidak dikirim ke mana pun": prinsip itu diperbarui menjadi "tidak dikirim ke luar tanpa opt-in pengguna".

Kriteria: 99% scrobble terkirim dalam 10 menit saat layanan hidup, dan kegagalan layanan tidak mengubah pemutaran.

### E5. Rekomendasi berbasis riwayat (P1, bersyarat)

Syarat data: minimal 1.000 pemutaran di `play_log` (usulan awal). Di bawah itu, tunda.

- Sinyal: lagu yang dituntaskan, lagu yang di-skip dalam 10 detik pertama, urutan lagu yang sering diputar berurutan (`track_transitions`), kedekatan artis (`artist_affinity`), dan jam dengar.
- Skor sederhana dan bisa dijelaskan, bobot di config. Tanpa model machine learning.
- Kandidat: riwayat sendiri yang belum diputar dalam N lagu terakhir, hasil YouTube Mix dari v2, dan opsional artis serupa dari layanan terbuka seperti ListenBrainz (diuji di spike).
- `/autoplay mode`: riwayat, campur (default, rasio lagu dikenal dan baru di config), atau jelajah.
- Tombol "Kenapa lagu ini?" di Now Playing menampilkan alasannya, misalnya "sering dituntaskan setelah lagu sebelumnya".
- Evaluasi: bandingkan skip-rate 10 detik pertama antara autoplay v2 dan v4 pada minimal 100 lagu per mode selama 2 minggu. Bila skip-rate relatif tidak turun minimal 10%, kembali ke v2 dan hapus modulnya.

Kriteria: skip-rate turun sesuai ambang, dan modul bisa dimatikan tanpa memengaruhi autoplay v2.

### E6. Kontrol dari ponsel (PWA) (P2, bersyarat)

Batasan: PWA hanya pengontrol. Audio tetap diputar di voice channel Discord.

- Layar: Sedang diputar, Antrean (urut ulang dan hapus), Cari dan tambah lagu, Playlist dan favorit, Lirik bersinkron.
- Bisa dipasang di layar utama ponsel lewat manifest PWA. Tanpa app store.
- Cara akses dipilih di Epic 0:
  1. Lewat jaringan pribadi (VPN seperti Tailscale atau WireGuard). Dashboard tidak dibuka ke internet. Pilihan awal yang disarankan.
  2. Lewat URL HTTPS publik memakai autentikasi dari Activity v3 (OAuth Discord dan allowlist).
- Autentikasi wajib di kedua jalur. Aturan kontrol sama dengan tombol: hanya pengguna di VC sesi itu.
- Dashboard lokal di `127.0.0.1` tetap berjalan terpisah.
- Tanpa push notification pada versi pertama.

Kriteria: dari ponsel, tambah lagu dan skip dalam 3 ketukan atau kurang, akses tanpa login ditolak, dan uji dari luar jaringan gagal dengan benar.

### E7. Sumber audio tambahan (P2, bersyarat)

Bandcamp

- Sumber bawaan Lavalink. Aktifkan di config dan uji pencarian serta link track dan album.
- `parseInput` mengenali subdomain bandcamp.com. Domain kustom Bandcamp tidak dikenali dan menghasilkan pesan jelas.

Spotify resmi (hanya bila ada akun Premium)

- Syarat: ada pemilik akun Premium dan aturan Development Mode saat itu mengizinkan.
- Spike pertama: cek apakah alur Client Credentials masih berjalan untuk aplikasi baru. Ini belum terverifikasi sejak v1.
- Pasang LavaSrc atau API resmi di belakang interface resolver. Manfaat: playlist besar tanpa batas 50 sampai 100 lagu, dan ISRC lebih lengkap.
- Resolver buatan sendiri dari v1 tetap menjadi cadangan.

Kriteria: 10 link Bandcamp uji menghasilkan suara atau error yang jelas tanpa crash.

## 6. Roadmap v4

Estimasi kasar untuk satu developer paruh waktu. Urutan akhir mengikuti Epic 0.

V4.0, Audit dan arah (4 minggu pencatatan, 1 hari keputusan): Epic 0.

- Kriteria: halaman keputusan arah selesai, `maintenance_log` terisi, tanggal tinjau tahunan ditetapkan.

V4.1, Keberlanjutan (1 sampai 2 minggu): E1, E2, E3. Berlaku di jalur Lanjut, Pelihara, maupun Pensiun.

- Kriteria: lihat masing-masing epic.

V4.2, Scrobbling dan rekomendasi (1 sampai 2 minggu): E4, E5. Hanya jalur Lanjut.

- Kriteria: scrobble 99% terkirim, skip-rate turun minimal 10%.

V4.3, Ponsel dan sumber tambahan (1 sampai 2 minggu): E6, E7. Hanya jalur Lanjut.

- Kriteria: lihat E6 dan E7.

Setelah V4.1 selesai, Epic 0 diulang di tanggal tinjau tahunan.

## 7. Perubahan arsitektur

Komponen baru:

- `docs/`: README, arsitektur ringkas, `adr/`, `runbooks/`, inventaris akun.
- CI: konfigurasi workflow (misalnya `.github/workflows/`), tes integrasi dengan Lavalink di Docker.
- `src/scrobble/`: klien ListenBrainz (dan Last.fm bila P2 jalan), antrean kirim ulang, enkripsi token.
- `src/recommend/` (perluasan v2): pengumpul sinyal, penghitung skor, pembuat penjelasan.
- `src/web/` (perluasan v3): tampilan PWA dan route ponsel dengan autentikasi.
- `scripts/`: skrip pencatat `maintenance_log`, skrip pensiun, skrip latihan pemulihan.
- Resolver baru (Bandcamp, Spotify resmi) masuk lewat interface resolver tanpa mengubah inti.

Prinsip: v4 tidak mengubah inti pemutaran. Semua modul bisa dimatikan lewat config. `maintenance_mode` mematikan semua modul P1 dan P2 sekaligus. Kegagalan modul mana pun tidak boleh menghentikan pemutaran.

## 8. Tambahan model data (SQLite)

- `maintenance_log`: id, kind (update, incident, drill, manual\_fix), minutes\_spent, note, created\_at
- `scrobble_accounts`: user\_id, service (listenbrainz atau lastfm), token\_enc, enabled, created\_at
- `scrobble_queue`: id, user\_id, service, artist, title, album, duration\_ms, played\_at, attempts, status (pending, sent, failed)
- `track_transitions`: from\_key, to\_key, count, updated\_at (key berupa ISRC, atau pasangan artis dan judul yang dinormalisasi)
- `artist_affinity`: user\_id, artist, completes, skips, updated\_at

Semua perubahan bersifat penambahan tabel, tanpa mengubah tabel lama. Migrasi diuji pada salinan database sebelum dijalankan.

## 9. Spesifikasi UX tambahan

- `/scrobble connect`, `/scrobble status`, `/scrobble disconnect`: semua ephemeral. Penjelasan privasi tampil sebelum modal token.
- `/autoplay mode`: pilihan riwayat, campur, jelajah. Tombol "Kenapa lagu ini?" muncul hanya pada lagu hasil autoplay.
- `/status` (v2) ditambah: mode (normal atau bekukan), tanggal latihan pemulihan terakhir, umur dependency tertua, jumlah scrobble tertunda.
- Mode bekukan: banner di `/status`, fitur yang mati ditampilkan sebagai "dinonaktifkan" saat dipanggil.
- PWA: tiga tab di ponsel (Sedang diputar, Antrean, Cari), tombol besar, tanpa menu bertingkat.

## 10. Kebutuhan non-fungsional tambahan

- Keandalan: kegagalan scrobbling, rekomendasi, atau PWA tidak mengganggu pemutaran.
- Performa: pencatatan sinyal dan scrobble berjalan asinkron dan tidak menambah latensi mulai bunyi.
- Keamanan: token scrobble terenkripsi dan tidak masuk log, `/status`, atau halaman web. PWA wajib terautentikasi dan diuji dari luar jaringan.
- Privasi: opt-in per pengguna untuk data yang keluar. `/forget` menghapus token dan antrean scrobble. Retensi `play_log` dari v3 tetap berlaku.
- Perawatan: runbook diperbarui setiap insiden. Fitur yang tidak dipakai 4 minggu dimatikan.
- Dependensi: library baru berlisensi jelas dan masih dirawat. Catat alasan tiap penambahan di ADR.

## 11. Metrik keberhasilan

Dihitung dari `maintenance_log`, `play_log`, `health_events`, dan `scrobble_queue`:

- Jam perawatan per bulan: target awal 2 jam atau kurang setelah V4.1, diukur dari `maintenance_log`.
- Waktu perbaikan setelah sumber rusak: median 2 hari atau kurang.
- Latihan pemulihan: lulus satu kali per kuartal, dengan waktu pulih tercatat.
- CI: semua tes lulus sebelum tiap rilis. Waktu CI target 10 menit atau kurang.
- Skip-rate autoplay v4: turun minimal 10% relatif terhadap v2.
- Scrobble: 99% terkirim dalam 10 menit saat layanan hidup.
- PWA: tambah lagu dan skip dalam 3 ketukan atau kurang. Akses tanpa login: 0 berhasil.
- Fitur v4 yang tidak dipakai dalam 4 minggu: dimatikan atau dihapus.

## 12. Risiko dan mitigasi

- Fitur baru menggerus waktu perawatan: Epic 0 punya jalur Pelihara. E1 sampai E3 dikerjakan lebih dulu.
- Satu orang memelihara semuanya: runbook, ADR, inventaris akun, dan latihan pemulihan kuartalan.
- Scrobbling mengirim data ke luar: opt-in, token terenkripsi, penjelasan privasi, hapus dengan satu command.
- Rekomendasi tidak lebih baik dari v2: gerbang data 1.000 pemutaran, evaluasi skip-rate, modul dibuang bila gagal.
- PWA membuka surface serangan baru: jalur VPN pribadi dipilih lebih dulu, autentikasi wajib, uji dari luar jaringan, sakelar mati.
- Layanan scrobbling atau API pihak ketiga berubah: modul bisa dimatikan, antrean tahan lama dengan percobaan ulang.
- Plugin YouTube komunitas berhenti dirawat: pantau di laporan bulanan, cadangan `YtDlpEngine`, dan jalur Pensiun tetap tersedia.
- Pembaruan major merusak bot: uji di staging 1 minggu dengan rollback.
- Dukungan Bandcamp terbatas: domain kustom tidak dikenali, pesan error jelas.
- Aturan Spotify berubah: spike dulu, resolver buatan sendiri tetap cadangan.
- Risiko ToS YouTube dan hak cipta dari v1 sampai v3: tetap diterima secara sadar. v4 tidak menambah pengguna atau server, jadi risikonya tidak naik.

## 13. Yang sengaja tidak dibangun

- Bot publik atau terverifikasi: butuh moderasi, kewajiban perlindungan data pribadi, dan paparan ToS yang jauh lebih besar. Bila suatu hari diinginkan, itu keputusan dan PRD terpisah, bukan lanjutan v4.
- Monetisasi dan fitur premium: bertentangan dengan tujuan proyek.
- Pemutar audio di browser (listen-along): menambah beban bandwidth dan masalah hak cipta, tanpa kebutuhan nyata.
- Aplikasi native iOS atau Android: PWA cukup.
- Rekomendasi dengan machine learning berat atau LLM: biaya perawatan lebih besar dari manfaat untuk 1 sampai 20 pengguna.

## 14. Pertanyaan terbuka

1. Berapa jam per bulan yang rela dipakai pemilik untuk merawat bot? Angka ini menjadi batas jalur Pelihara.
2. Apakah pengguna memakai ListenBrainz atau Last.fm, atau tidak memakai keduanya?
3. Perlu kontrol dari ponsel di luar rumah, atau cukup di jaringan rumah?
4. Ada rencana memiliki akun Spotify Premium?
5. Kapan tanggal tinjau tahunan, dan siapa yang mengingatkannya?

## 15. Setelah v4

Tidak ada PRD v5 yang dijadwalkan. Setelah V4.1 selesai, proyek masuk ritme tetap: perawatan bulanan, latihan pemulihan kuartalan, dan Epic 0 tahunan. Ide baru masuk lewat Epic 0 dan baru menjadi PRD bila lolos gerbang masuk.
