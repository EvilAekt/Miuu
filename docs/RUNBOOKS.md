# 🛠️ Runbooks Pemulihan & Operasional (PRD v4 E1)

Dokumentasi ini merangkum langkah-langkah darurat terstruktur untuk memulihkan bot dari nol tanpa perlu mengingat perintah rumit.

---

## 📌 Skenario 1: Token Bot Discord Bocor atau Perlu Direset
1. Buka [Discord Developer Portal](https://discord.com/developers/applications).
2. Pilih aplikasi bot `Miu`, masuk ke tab **Bot**, klik **Reset Token**.
3. Buka file `.env` di folder bot:
   ```env
   DISCORD_TOKEN="token_baru_anda_di_sini"
   ```
4. Jalankan ulang bot dengan:
   ```cmd
   npm start
   ```
5. Verifikasi koneksi di log:
   `[Bot Ready] Terhubung sebagai Miu#5872`

---

## 📌 Skenario 2: Plugin YouTube Lavalink Mengalami Error atau Pemblokiran
Gejala: Lagu gagal diputar dengan pesan `All clients failed` atau `Sign in to confirm you're not a bot`.
1. Jalankan skrip pemeriksa dan pembaruan Lavalink otomatis:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/update-lavalink.ps1 -CheckOnly
   ```
2. Jika ada pembaruan plugin YouTube:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/update-lavalink.ps1
   ```
   *Skrip otomatis mencadangkan file lama dan melakukan rollback jika tes gagal.*
3. Jika YouTube meminta verifikasi sign-in atau OAuth:
   - Tambahkan akun cadangan pada blok `youtube:` di `application.yml`:
     ```yaml
     plugins:
       youtube:
         enabled: true
         oauth:
           enabled: true
     ```
   - Restart Lavalink: `.\jre\bin\java.exe -jar Lavalink.jar`.

---

## 📌 Skenario 3: Resolver Metadata Spotify Rusak
Gejala: Link Spotify gagal diselesaikan menjadi judul/artis.
1. Jalankan pengujian canary independen:
   ```powershell
   node test-spotify.mjs spotify-links.txt
   ```
2. Jika scraping `spotify-url-info` dibatasi oleh rate-limit Spotify:
   - Gunakan fitur `/import` dengan file teks `.txt` berisi daftar link lagu secara langsung.
   - Alternatif: Perbarui dependensi `spotify-url-info` ke rilis terbaru:
     ```powershell
     npm update spotify-url-info
     ```

---

## 📌 Skenario 4: Database SQLite Korup atau Terhapus
Gejala: Error SQLite disk I/O error atau data playlist hilang.
1. Hentikan proses bot:
   ```powershell
   Stop-Process -Name "node" -Force
   ```
2. Pulihkan file cadangan terbaru dari folder `backups/`:
   ```powershell
   Copy-Item "backups\bot_db_YYYYMMDD_HHMMSS.db" "data\bot.db" -Force
   ```
3. Uji integritas database dengan menjalankan test suite:
   ```powershell
   npm test
   ```
4. Nyalakan kembali bot: `npm start`.

---

## 📌 Skenario 5: Mengaktifkan Mode Perawatan (Maintenance Mode)
Gunakan saat Anda sedang melakukan perbaikan besar atau pemeliharaan server:
1. Di `.env`, ubah:
   ```env
   MAINTENANCE_MODE=true
   ```
2. Restart bot.
3. Bot akan menampilkan banner pemeliharaan di `/status` dan Web Dashboard, serta menahan perintah non-inti sementara waktu.
