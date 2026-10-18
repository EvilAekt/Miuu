# 🛡️ Panduan Kelangsungan & Akses Darurat (PRD v5 Epic 3)
### "Bila Pemilik Tidak Tersedia"

Dokumen ini ditujukan untuk administrator server atau orang kedua yang dipercaya jika pemilik utama bot musik berhalangan, tidak aktif, atau terjadi keadaan darurat.

---

### 1. Informasi Sistem Utama
- **Nama Bot:** Miu#5872 (Client ID: `1561188740511043634`)
- **Server Utama:** Kekaisaran Lamburgh
- **Host Mesin:** PC Windows Lokal
- **Repositori Kode:** Folder lokal `files/`

---

### 2. Apa yang Boleh Dilakukan Oleh Orang Kedua
1. **Mematikan Bot & Audio Node:**
   - Jalankan Command Prompt / Terminal pada host PC dan hentikan proses:
     ```powershell
     Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
     Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
     ```
2. **Mengekspor Seluruh Data Playlist Pengguna:**
   - Jalankan skrip pensiun / ekspor mandiri:
     ```bash
     node scripts/retire-bot.mjs
     ```
   - Semua playlist dan favorit pengguna akan tersimpan rapi dalam format `.json` di folder `backups/`.
3. **Mengaktifkan Mode Pemeliharaan (Maintenance Mode):**
   - Tambahkan `MAINTENANCE_MODE=true` di file `.env` dan restart bot.

---

### 3. Apa yang TIDAK Boleh Dilakukan
1. Jangan mempublikasikan file `.env` atau token bot ke publik/GitHub.
2. Jangan mengubah izin Discord Gateway Intents tanpa konsultasi.
3. Jangan menghapus file database utama `data/bot.db` tanpa mencadangkannya terlebih dahulu.

---

### 4. Prosedur Pemulihan Cepat dari Backup
Jika PC mengalami restart mendadak atau file database rusak:
1. Pastikan Lavalink aktif dengan menjalankan `start-all.bat`.
2. Atau jalankan latihan pemulihan otomatis untuk memverifikasi kesehatan database:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/drill-recovery.ps1
   ```
