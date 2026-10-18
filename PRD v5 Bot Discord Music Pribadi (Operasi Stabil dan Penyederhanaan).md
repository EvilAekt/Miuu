# PRD v5: Bot Discord Music Pribadi (Operasi Stabil dan Penyederhanaan)

Draft v0.1. 18 Oktober 2026. Lanjutan dari PRD v1 sampai v4. Pemakaian pribadi.

## 1. Ringkasan dan hubungan dengan v1 sampai v4

PRD v1 sampai v4 membangun bot, merawatnya, memperluasnya, lalu menyiapkan jalur keluar. PRD v4 menutup dengan satu keputusan: setelah V4.1, proyek masuk ritme tetap dan ide baru lewat Epic 0 tahunan. PRD v5 adalah dokumen untuk ritme itu.

PRD v5 bukan fase pembangunan. Ini siklus tahunan yang berisi lima hal: tinjau data, sederhanakan, audit risiko, pastikan kelangsungan, lalu kerjakan kandidat fitur hanya bila lolos gerbang. Akibatnya, hasil terbaik siklus ini sering berupa kode yang berkurang, bukan bertambah.

PRD v5 ditulis sebelum siklus pertama berjalan. Semua ambang adalah usulan awal dan dikoreksi dari data `maintenance_log`, `play_log`, dan `demand_events` saat tanggal tinjau tahunan tiba.

Tidak akan ada PRD v6. Tahun berikutnya, siklus ini diulang dan yang ditulis hanya halaman keputusan satu halaman (templat di Bagian 13). PRD baru hanya dibuat bila ada keputusan besar, seperti pindah platform, rewrite, atau bot publik. Keputusan seperti itu butuh PRD terpisah dengan gerbang sendiri.

Batasan tetap: bot privat, tanpa monetisasi, stack TypeScript + discord.js + Lavalink + SQLite, batas desain v3 (5 server, 20 pengguna aktif, 3 sesi bersamaan).

## 2. Gerbang masuk v5

- Tanggal tinjau tahunan yang ditetapkan di PRD v4 sudah tiba. Alternatif: jam perawatan melebihi ambang Pelihara v4 selama 2 bulan berturut-turut.
- V4.1 selesai: dokumentasi, CI, staging, dan skrip pensiun sudah ada dan diuji.
- `maintenance_log` memuat minimal 6 bulan data.
- Epic fitur (E4 sampai E7) hanya masuk bila punya pemicu nyata. Tanpa pemicu, hanya E1 sampai E3 yang dikerjakan.

## 3. Tujuan dan non-tujuan

Tujuan

- G1: biaya kepemilikan (jam, uang, kompleksitas) turun atau stabil dibanding tahun sebelumnya.
- G2: fitur, command, tabel, dan dependency yang tidak dipakai dihapus.
- G3: risiko tahunan teraudit: kepatuhan ketentuan, keamanan, dan rahasia yang dirotasi.
- G4: kelangsungan bot tidak bergantung pada satu orang atau satu ingatan.
- G5: fitur baru masuk hanya dengan bukti pemakaian, maksimal 2 epic per siklus.

Non-tujuan

- Menambah pengguna atau server di atas batas v3.
- Bot publik, bot terverifikasi, monetisasi.
- Rewrite atau ganti stack tanpa alasan yang terukur.
- Fitur berbasis AI atau machine learning.
- Failover otomatis, Kubernetes, load balancer.

## 4. Epic 0: tinjauan tahunan (dikerjakan pertama, diulang tiap tahun)

Ini versi lengkap dari Epic 0 di PRD v4. Kumpulkan data 12 bulan terakhir, lalu isi halaman keputusan (Bagian 13).

Data yang dihitung:

- Jam perawatan per bulan dan jenisnya, dari `maintenance_log`. Bandingkan dengan tahun lalu.
- Biaya aktual: hosting, domain, listrik bila memakai server rumah.
- Ketersediaan bot pada jam pemakaian dan daftar insiden (penyebab, lama, waktu pulih).
- Pemakaian per command dan per modul. Tandai yang tidak dipakai 90 hari (usulan).
- Jumlah pengguna aktif dan tren pemutaran per bulan.
- Tingkat sukses lagu per sumber (YouTube, Spotify, lokal) dan lagu yang paling sering gagal.
- Umur dependency: berapa yang tertinggal satu major, berapa yang tidak dirawat lagi.
- Sinyal baru di `demand_events`: `volume_adjust` (perubahan volume dalam 30 detik pertama lagu) dan `long_content_stop` (konten lebih dari 30 menit yang dihentikan di tengah).

Keluaran:

- Jalur: Lanjut, Pelihara, atau Pensiun (definisi di PRD v4).
- Daftar hapus: command, modul, tabel, dependency.
- Kandidat fitur yang lolos gerbang (maksimal 2).
- Risiko yang diterima secara sadar.
- Tanggal tinjau tahunan berikutnya.

## 5. Epic dan kebutuhan

Prioritas: P0 wajib di setiap siklus, P1 setelahnya, P2 opsional. E4 sampai E7 hanya dikerjakan bila Epic 0 memilih Lanjut dan pemicunya ada.

### E1. Penyederhanaan (P0)

- Hapus semua command dan modul di daftar hapus: kode, tabel, config, dan dokumen terkait. Arsipkan data lama ke file sebelum tabel dihapus.
- Umumkan penghapusan 2 minggu sebelumnya lewat channel log dan `/status`. Command yang dihapus membalas pesan singkat berisi alasan dan alternatifnya selama 30 hari.
- Audit dependency: hapus yang tidak perlu, ganti yang tidak dirawat, catat alasan di ADR. Jumlah dependency langsung tidak boleh naik dibanding tahun lalu.
- Cari kode mati dengan alat seperti knip, lalu hapus.
- Gabungkan modul yang tumpang tindih. Modul yang dimatikan lewat `maintenance_mode` selama setahun penuh dihapus.
- Retensi data: pangkas `play_log`, `health_events`, `demand_events`, dan `maintenance_log` sesuai batas di config. Jalankan VACUUM terjadwal, pantau ukuran database dan backup.
- Catat tren (bukan target): RAM bot dan Lavalink, waktu start, ukuran database, jumlah baris kode.
- Tes inti harus lulus sesudah penghapusan, dan tes regresi pemutaran dijalankan di staging.

Kriteria: minimal satu modul atau command tak terpakai dihapus bila ada, jumlah dependency langsung tidak naik, dan tidak ada regresi di tes inti.

### E2. Audit kepatuhan dan rotasi rahasia (P0)

Kepatuhan

- Baca ulang ketentuan Discord (Developer Terms dan Policy), ketentuan YouTube, ketentuan layanan yang dipakai (LRCLIB, ListenBrainz atau Last.fm bila aktif), dan lisensi dependency. Catat perubahan dan dampaknya di ADR.
- Tinjau data pengguna yang disimpan: apakah masih perlu, retensinya, dan uji `/forget` sampai tuntas, termasuk token scrobble.

Rotasi rahasia tahunan (dengan langkah di runbook)

- Token bot (utama, satelit, staging). Token Discord yang direset langsung mematikan token lama, jadi siapkan `.env` baru dan langkah restart sebelum menekan tombol reset.
- Password Lavalink dan kredensial hosting (SSH key).
- Kunci enkripsi token scrobble, dengan prosedur re-enkripsi yang diuji di staging. Bila gagal, pengguna cukup menghubungkan ulang akunnya.
- Password akun YouTube cadangan dan token OAuth atau poToken plugin.

Audit keamanan

- Jalankan audit dependency (`pnpm audit` atau setara) dan pindai rahasia di repo beserta riwayat git (misalnya dengan gitleaks).
- Uji port terbuka dari jaringan lain: Lavalink, dashboard, dan PWA tidak boleh terjangkau tanpa autentikasi.
- Periksa izin bot di tiap server. Izin yang tidak dipakai dicabut.
- Uji restore backup (digabung dengan latihan kuartalan dari v4).

Kriteria: daftar periksa lengkap dengan tanggal dan hasil, semua rotasi selesai dengan downtime 10 menit atau kurang per item (usulan), dan tidak ada rahasia di repo.

### E3. Kelangsungan dan serah terima (P0)

- Akses darurat: simpan akses ke Developer Portal, hosting, domain, backup, dan akun cadangan di manajer password dengan fitur akses darurat untuk satu orang tepercaya. Dokumen tidak memuat rahasia.
- Kepemilikan aplikasi: periksa opsi Team di Developer Portal agar aplikasi bot tidak melekat pada satu akun pribadi.
- Orang kedua: satu orang tepercaya melatih pemulihan staging dari backup memakai runbook v4, tanpa bantuan, sekali setahun. Bila tidak ada orang yang bersedia, catat sebagai risiko yang diterima.
- Dokumen "bila pemilik tidak tersedia": siapa dihubungi, apa yang boleh dilakukan (matikan bot, ekspor data pengguna), dan apa yang tidak.
- Pengingat tinjauan: bot mengirim DM ke pemilik 14 hari sebelum tanggal tinjau, lalu tiap minggu sampai tinjauan selesai. Ini menjawab pertanyaan terbuka nomor 5 di PRD v4. Tanggal disimpan di `review_state`.
- Peringatan terlambat: bila 13 bulan berlalu tanpa tinjauan, `/status` menandai "tinjauan terlambat". Bot tetap berjalan.

Kriteria: orang kedua memulihkan staging dari dokumen, tanggal tinjau berikutnya terjadwal, dan pengingat bot terkirim pada uji.

### E4. Host cadangan (P2, bersyarat)

Pemicu: bot mati total lebih dari 8 jam sekali, atau lebih dari 24 jam kumulatif dalam 12 bulan pada jam pemakaian (usulan).

- Host cadangan pasif memakai token yang sama, dan hanya satu host aktif. Failover otomatis ditolak karena dua instance dengan token sama membalas ganda.
- Failover manual lewat satu skrip yang memastikan host lama sudah mati, memulihkan data, lalu menyalakan host cadangan.
- Data: replikasi SQLite ke host cadangan (misalnya Litestream) atau salinan backup tiap jam. Tetapkan batas kehilangan data yang diterima.
- Konfigurasi cadangan memakai repo dan Compose yang sama dengan host utama.
- Latihan failover 2 kali setahun, termasuk kembali ke host utama.

Kriteria: failover manual selesai dalam 15 menit atau kurang, data hilang paling lama 1 jam, dan tidak ada momen dua instance aktif bersamaan.

### E5. Kenyamanan audio (P1, bersyarat)

Pemicu: sinyal `volume_adjust` tinggi (usulan: lebih dari 20% pemutaran) atau permintaan pengguna dua kali atau lebih.

- Ingat volume lagu: tombol "Ingat volume" muncul setelah `/volume` diubah. Selisih disimpan per lagu di `track_prefs` dan diterapkan otomatis pada pemutaran berikutnya.
- ReplayGain untuk file lokal: baca tag ReplayGain dan terapkan lewat filter volume Lavalink.
- Preset filter: simpan preset favorit per pengguna (bass, nightcore, kustom) dan pakai dengan satu command.
- Di luar cakupan: crossfade dan gapless. Lavalink tidak menyediakannya saat PRD ini ditulis. Cek ulang di spike awal.

Kriteria: `volume_adjust` turun minimal 30% setelah fitur aktif 2 minggu (usulan), dan modul bisa dimatikan tanpa mengganggu pemutaran.

### E6. Konten panjang dengan resume (P2, bersyarat)

Pemicu: `long_content_stop` muncul minimal 4 kali per bulan, atau pemilik meminta dukungan podcast dan buku audio.

- Simpan posisi per pengguna dan item di `resume_positions`. Perbarui tiap 30 detik.
- Saat item yang sama diputar lagi, tombol "Lanjutkan dari 23:10" muncul. `/resume` melanjutkan posisi terakhir.
- Sumber: folder buku audio (file lokal dari v3) dan podcast lewat RSS. `/podcast add`, `list`, dan `play` memakai URL enclosure feed lewat sumber HTTP Lavalink.
- Kasus tepi: redirect, URL iklan dinamis, dan feed yang rusak menghasilkan pesan error jelas.
- Hapus posisi bila item selesai 95% atau lebih, atau tidak dipakai 90 hari.
- Episode Spotify tetap tidak didukung, kecuali jalur resmi dari E7 tersedia.

Kriteria: resume akurat dalam 5 detik, 10 episode RSS uji diputar atau gagal dengan pesan jelas.

### E7. Sisa bawaan dari v4 (P2, bersyarat)

Item ini tidak otomatis masuk. Tiap item harus lolos gerbang epic aslinya di PRD v4:

- Scrobbling Last.fm (ListenBrainz sudah di E4 v4).
- Spotify resmi lewat LavaSrc, bila ada akun Premium dan spike Client Credentials berhasil.
- Push notification untuk PWA.

Batas siklus tetap berlaku: maksimal 2 epic fitur baru dari E4 sampai E7.

## 6. Roadmap v5

Estimasi kasar untuk satu developer paruh waktu.

V5.0, Tinjauan tahunan (1 minggu): Epic 0.

- Kriteria: halaman keputusan terisi, jalur dipilih, kandidat maksimal 2.

V5.1, Penyederhanaan dan audit (1 sampai 2 minggu): E1, E2.

- Kriteria: lihat masing-masing epic.

V5.2, Kelangsungan (1 minggu): E3.

- Kriteria: orang kedua memulihkan staging, pengingat aktif.

V5.3, Kandidat (maksimal 2 epic, 1 sampai 2 minggu tiap epic): E4 sampai E7, hanya yang lolos gerbang.

- Kriteria: tiap epic mencapai metrik sendiri dalam 4 minggu, atau dimatikan.

Siklus berikutnya: Epic 0 diulang di tanggal tinjau tahunan. Tanpa PRD baru.

## 7. Perubahan arsitektur

Komponen baru:

- `docs/review/<tahun>/`: halaman keputusan tahunan dan hasil daftar periksa audit.
- `src/reminders/`: pengingat tinjauan dan penanda terlambat.
- `scripts/`: skrip audit (dependency, rahasia, port) dan skrip rotasi rahasia.
- `src/media/`: preferensi volume per lagu dan preset filter (E5).
- `src/podcast/`: parser RSS dan posisi resume (E6).
- `deploy/standby/`: konfigurasi dan skrip failover (E4).

Prinsip: perubahan bersih kode v5 diusahakan nol atau negatif. Tidak ada perubahan inti. Semua modul baru bisa dimatikan lewat config dan ikut terhenti oleh `maintenance_mode`. E1 boleh menghapus modul yang dibuat di v3 dan v4 bila tidak dipakai.

## 8. Tambahan model data (SQLite)

- `review_state`: last\_review\_at, next\_review\_at, reminder\_sent\_at (satu baris)
- `track_prefs` (E5): track\_key, volume\_delta, updated\_by, updated\_at
- `filter_presets` (E5): user\_id, name, filters\_json
- `resume_positions` (E6): user\_id, item\_key, position\_ms, duration\_ms, updated\_at
- `podcast_feeds` (E6): id, guild\_id, feed\_url, title, added\_by
- `demand_events`: tipe baru `volume_adjust` dan `long_content_stop`.

Perbedaan dari v2 sampai v4: v5 boleh menghapus tabel dan kolom yang tidak terpakai. Migrasi yang menghapus data wajib didahului backup dan arsip file, dijalankan lebih dulu pada salinan database, lalu diuji di staging.

## 9. Spesifikasi UX tambahan

- Pengingat tinjauan: DM ringkas berisi tanggal tinjau, jumlah hari tersisa, dan tautan ke daftar periksa.
- `/status` ditambah: tanggal tinjauan terakhir dan berikutnya, label "tinjauan terlambat", umur rotasi rahasia terakhir, ukuran database.
- Command yang dihapus: balasan ephemeral "Command ini dihapus pada tinjauan 2026. Gunakan ... sebagai gantinya." selama 30 hari.
- Tombol "Ingat volume" di Now Playing setelah volume diubah.
- `/filter preset`: simpan, pakai, hapus. `/resume` dan `/podcast`: sesuai E6.

## 10. Kebutuhan non-fungsional tambahan

- Keandalan: penghapusan fitur tidak boleh mengganggu pemutaran inti. Tes regresi di staging sebelum rilis.
- Keamanan: rotasi rahasia tidak boleh meninggalkan rahasia lama di repo, log, atau backup yang masih aktif.
- Privasi: retensi data diatur dan `/forget` diuji tiap tahun.
- Perawatan: dokumentasi dan runbook diperbarui oleh siklus ini. Dokumen yang tidak cocok dengan kode diperbaiki atau dihapus.
- Performa: RAM dan waktu start tidak memburuk dibanding tahun lalu.
- Dependensi: aturan v2 tetap berlaku, ditambah aturan jumlah dependency langsung tidak naik.

## 11. Metrik keberhasilan

- Jam perawatan per bulan: tidak naik dibanding tahun lalu, target usulan 2 jam atau kurang.
- Jumlah command dan dependency langsung: tidak naik dibanding tahun lalu.
- Tinjauan tahunan selesai paling lambat 14 hari setelah tanggal tinjau.
- Rotasi rahasia: 100% item di daftar selesai, downtime 10 menit atau kurang per item.
- Orang kedua memulihkan staging dalam waktu yang dicatat dan ditetapkan sebagai target tahun berikutnya.
- Epic fitur baru: maksimal 2 per siklus, masing-masing mencapai metrik sendiri atau dimatikan.
- RAM gabungan bot dan Lavalink: naik tidak lebih dari 10% dibanding tahun lalu (usulan).
- Ketersediaan pada jam pemakaian: setara atau lebih baik dari v3.

## 12. Risiko dan mitigasi

- Siklus tahunan terlewat karena tidak ada yang ingat: pengingat bot, entri kalender, dan label "tinjauan terlambat".
- Penghapusan fitur menghapus sesuatu yang jarang tapi penting: ambang 90 hari, pengumuman 2 minggu, arsip data sebelum tabel dihapus, dan tag rilis untuk rollback.
- Rotasi rahasia memutus bot: latihan di staging, langkah siap sebelum reset, jendela waktu yang dipilih sendiri.
- Rotasi kunci enkripsi scrobble gagal: re-enkripsi diuji di staging, cadangan terburuk berupa pengguna menghubungkan ulang akun.
- Host cadangan menyalakan dua instance sekaligus: failover manual saja, host lama dipastikan mati lebih dulu.
- Tidak ada orang kedua: risiko diterima dan dicatat, jalur Pensiun terencana tetap siap.
- Kompleksitas merayap lewat kandidat: batas 2 epic per siklus, tiap epic bisa dimatikan, dinilai lagi di tinjauan berikutnya.
- Ketentuan Discord, YouTube, atau layanan lain berubah: audit tahunan, dan jalur Pelihara atau Pensiun bila perubahan itu mematikan fitur inti.
- Dokumen ini sendiri menjadi beban: tidak ada PRD v6, hanya halaman keputusan satu halaman per tahun.

## 13. Templat halaman keputusan tahunan

Salin ke `docs/review/<tahun>/keputusan.md` dan isi tiap tahun:

- Tanggal tinjau dan penulis.
- Data utama: jam perawatan per bulan, biaya, ketersediaan, insiden, pengguna aktif.
- Jalur terpilih: Lanjut, Pelihara, atau Pensiun, beserta alasan satu paragraf.
- Daftar hapus: command, modul, tabel, dependency.
- Kandidat fitur yang lolos gerbang (maksimal 2), dengan pemicu dan metrik keberhasilan.
- Rotasi rahasia yang dilakukan dan tanggalnya.
- Hasil latihan pemulihan dan orang kedua.
- Risiko yang diterima secara sadar.
- Tanggal tinjau tahunan berikutnya.

## 14. Pertanyaan terbuka

1. Apakah tanggal tinjau tahunan sudah ditetapkan? Bila belum, tetapkan sebelum V5.0 dimulai.
2. Siapa orang kedua yang tepercaya untuk akses darurat dan latihan pemulihan?
3. Berapa jam perawatan per bulan selama 12 bulan terakhir, menurut `maintenance_log`?
4. Command atau modul mana yang terasa tidak pernah dipakai?
5. Apakah aplikasi Discord perlu dipindah ke Team?

## 15. Setelah v5

Siklus ini berulang tiap tahun tanpa PRD baru. Bila Epic 0 memilih Pensiun, jalankan skrip dari E3 PRD v4. Proyek dianggap berhasil bila bot tetap berguna untuk pemiliknya dengan beban perawatan yang tidak naik, bukan bila fiturnya bertambah.
