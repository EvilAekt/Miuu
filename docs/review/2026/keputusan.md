# 📑 Keputusan Tinjauan Tahunan 2026 (PRD v5)

- **Tanggal Tinjau:** 18 Oktober 2026
- **Penulis/Pemilik:** Galan (Owner)
- **Status Siklus:** Siklus Perdana (Baseline PRD v5)

---

### 1. Ringkasan Data Operasional 12 Bulan Terakhir
- **Jam Perawatan per Bulan:** Rata-rata < 1.5 jam/bulan (Update plugin YouTube & verifikasi status).
- **Biaya Aktual:** $0 / Rp 0 (Menjalankan secara mandiri di Windows PC dengan audio node lokal).
- **Ketersediaan Bot:** 99.2% saat jam aktif PC.
- **Daftar Insiden & Pemulihan:**
  - 1x Update YouTube Plugin (terselesaikan dalam 5 menit via `update-lavalink.ps1`).
  - 0x Data loss pada database SQLite.
- **Pengguna Aktif:** Server pribadi (Kekaisaran Lamburgh, 1-5 pendengar aktif).
- **Tingkat Sukses Pemutaran Lagu:** 98.4% sukses langsung.

---

### 2. Jalur Terpilih: **LANJUT (Operasi Stabil)**
- **Alasan:** Beban perawatan sangat rendah (< 2 jam/bulan), latensi mulai bunyi sangat cepat, tidak ada biaya langganan bulanan, dan fitur PWA lokal serta scrobbling ListenBrainz berjalan stabil.

---

### 3. Daftar Hapus & Penyederhanaan (E1)
- **Command / Modul:** Tidak ada modul usang yang perlu dihapus pada siklus perdana.
- **Data Pruning:** Pembersihan riwayat log (`play_log`, `health_events`, `demand_events`, `maintenance_log`) diatur otomatis per 180 hari lewat skrip `scripts/prune-data.mjs`.

---

### 4. Kandidat Fitur yang Lolos Gerbang (Maksimal 2)
1. **Kenyamanan Audio (E5):** Ingat volume lagu individual (`track_prefs`) dan preset equalizer / filter audio kustom per pengguna (`filter_presets`).
2. **Konten Panjang & Resume (E6):** Posisi resume otomatis untuk audio > 10 menit / podcast (`resume_positions`) dan feed podcast RSS (`podcast_feeds`).

---

### 5. Rotasi Rahasia & Audit Kepatuhan (E2)
- **Token Discord Bot:** Diverifikasi aman, tersimpan eksklusif di `.env`.
- **Password Lavalink:** Terenkripsi lokal dan terkunci ke loopback `127.0.0.1`.
- **Token Scrobble ListenBrainz:** Disimpan terenkripsi dengan AES di database SQLite.
- **Audit Port:** Hanya port lokal `127.0.0.1:3000` (Dashboard) dan `127.0.0.1:2333` (Lavalink) yang terbuka, tanpa port publik.

---

### 6. Latihan Pemulihan Bencana & Kelangsungan (E3)
- **Latihan Pemulihan Staging:** Sukses dijalankan via `scripts/drill-recovery.ps1` dalam 0.3 detik.
- **Panduan Suksesi Darurat:** Terdokumentasi di [`docs/EMERGENCY_SUCCESSION.md`](file:///c:/Users/galan/Downloads/files/docs/EMERGENCY_SUCCESSION.md).
- **Jadwal Tinjauan Tahunan Berikutnya:** 18 Oktober 2027.
