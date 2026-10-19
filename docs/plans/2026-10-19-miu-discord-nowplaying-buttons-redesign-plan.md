# Plan: Redesign & Penataan Tombol Kontrol Musik Discord (Karakter Miu)

- **Tanggal**: 2026-10-19
- **Status**: Draft (Menunggu Konfirmasi User)
- **Author**: Antigravity (web-planning)
- **Komponen Target**: `src/ui/embeds.ts`, `src/events/interactionCreate.ts`, `src/ui/componentsV2.ts`

---

## 1. Analisis Masalah Saat Ini

Berdasarkan screenshot yang dikirimkan:
1. **Ketidakseimbangan Tata Letak Tombol (Layout Asymmetry)**:
   - **Baris 1 (Row 1)** berisi 5 tombol penuh: `[ Jeda ]` `[ Lewati ]` `[ Loop: Off ]` `[ Acak ]` `[ Berhenti ]`.
   - **Baris 2 (Row 2)** hanya berisi 3 tombol: `[ Vol -10% ]` `[ Vol +10% ]` `[ Lihat Antrean ]`.
   - Terdapat **2 slot tombol kosong di sisi kanan Baris 2**, membuat tampilan terasa pincang, bolong, dan tidak tertata rapi.
2. **Karakter Miu Belum Terasa Maksimal (Kurang Kawaii/Imut)**:
   - Emoji dan teks tombol masih kaku dan bernuansa bot musik biasa (`Vol -10%`, `Vol +10%`, `Loop: Off`).
   - Warna tombol mayoritas abu-abu gelap (`ButtonStyle.Secondary`) tanpa variasi manis.
3. **Penyempurnaan Embed di Atas Tombol**:
   - Garis progress bar `🌸───────────` menggunakan tanda strip biasa yang terkadang renggang di aplikasi Discord mobile.
   - Informasi volume, loop, dan antrean di bawah progress bar dapat diformat lebih rapi dan simetris menggunakan format badge/code block yang serasi.

---

## 2. Perbandingan Opsi Desain

| Kriteria | Opsi A: 5x5 Rapi Simetris + Lirik & Web Player (Sangat Direkomendasikan) | Opsi B: 4x4 Ramping Simetris | Opsi C: 5 Tombol Saja (Single Row) |
| :--- | :--- | :--- | :--- |
| **Kerapian & Keseimbangan** | **Sempurna (100% Simetris)**: 5 tombol di Baris 1, 5 tombol di Baris 2. Tidak ada rongga kosong. | **Rapi (4x4)**: 4 tombol di Baris 1, 4 tombol di Baris 2. | Padat tapi kehilangan fitur volume dan antrean cepat. |
| **Kesesuaian Karakter Miu** | **Sangat Manis**: Ditambahkan tombol `🎤 Lirik` dan tombol direct link `🎀 Web Player` ke dashboard ultra-kawaii. | Manis, namun tidak ada tautan langsung ke web dashboard. | Standar. |
| **Pengalaman Pengguna (UX)** | Pengguna bisa mengatur musik, melihat lirik lagu, dan membuka web player hanya dengan 1 kali klik. | Cukup lengkap untuk kontrol dasar. | Terlalu terbatas. |

---

## 3. Konsep Tata Letak Tombol Baru (Opsi A)

```
+-----------------------------------------------------------------------------------------+
| [🌸 Miu Avatar] 🌸 Miu Sedang Memutar Musik ~                       [Album Artwork]     |
| Creep                                                                                   |
| 🎤 Artis: Radiohead                                                                     |
|                                                                                         |
| 0:45 ━━━━━━━🌸━━━━━━━━━━━━ 3:59                                                         |
| 🔊 Volume: 50%   •   🔁 Ulang: Mati   •   🎀 Antrean: 2 lagu                            |
| 🤍 Diminta oleh chainnn • Semoga harimu menyenangkan!                                   |
+-----------------------------------------------------------------------------------------+
| [ 💖 Jeda ]     [ 🌸 Lewati ]   [ 🔁 Loop ]     [ ✨ Acak ]     [ 🛑 Berhenti ]         |  <- Row 1 (Core)
| [ 🔉 Vol - ]    [ 🔊 Vol + ]    [ 📜 Antrean ]  [ 🎤 Lirik ]    [ 🎀 Web Player ]       |  <- Row 2 (Utility)
+-----------------------------------------------------------------------------------------+
```

### Detail Tombol-Tombol:

#### **Baris 1: Kontrol Pemutaran Inti (Playback Controls)**
1. `btn_play_pause`:
   - Jika sedang memutar: `[ 💖 Jeda ]` (Emoji: `⏸️`, Style: `Primary` atau `Secondary`)
   - Jika dijeda: `[ ▶️ Putar ]` (Emoji: `▶️`, Style: `Success`)
2. `btn_skip`:
   - `[ 🌸 Lewati ]` (Emoji: `⏭️`, Style: `Secondary`)
3. `btn_loop`:
   - `[ 🔁 Loop ]` / `[ 🔂 Lagu ]` / `[ 🔁 Antrean ]` (Style: `Success` jika aktif, `Secondary` jika off)
4. `btn_shuffle`:
   - `[ ✨ Acak ]` (Emoji: `🔀`, Style: `Secondary`)
5. `btn_stop`:
   - `[ 🛑 Stop ]` (Emoji: `⏹️`, Style: `Danger`)

#### **Baris 2: Utilitas Suara & Fitur Manis Miu (Tools & Sweet Features)**
1. `btn_vol_down`:
   - `[ 🔉 Vol - ]` (Emoji: `🔉`, Style: `Secondary`) -> Mengurangi volume 10%.
2. `btn_vol_up`:
   - `[ 🔊 Vol + ]` (Emoji: `🔊`, Style: `Secondary`) -> Menambah volume 10%.
3. `btn_queue`:
   - `[ 📜 Antrean ]` (Emoji: `📜`, Style: `Secondary`) -> Menampilkan halaman antrean lagu.
4. `btn_lyrics` *(Fitur Baru!)*:
   - `[ 🎤 Lirik ]` (Emoji: `🎤`, Style: `Secondary`) -> Menampilkan lirik lagu saat ini secara ephemeral (hanya terlihat oleh pengklik) langsung dari LRCLIB / Spotify!
5. `btn_web_dashboard` *(Fitur Baru!)*:
   - `[ 🎀 Web Player ]` (Emoji: `🎀`, Style: `Link`, URL: `https://miu-music-us.onrender.com/`) -> Membuka dashboard website strawberry milk Miu yang baru di browser HP/PC.

---

## 4. Rencana Perubahan Kode (File Changes)

1. **`src/ui/embeds.ts`**:
   - Perbarui fungsi `createNowPlayingComponents(player, disabled)`:
     - Menambahkan tombol `btn_lyrics` pada Baris 2.
     - Menambahkan tombol link `btn_web_dashboard` ke Baris 2.
     - Menyesuaikan label dan emoji agar lebih imut dan seragam.
   - Perbarui fungsi `createNowPlayingEmbed`:
     - Memperbaiki progress bar menggunakan karakter box yang lebih mulus (`━━━━🌸━━━━`).
     - Merapikan baris detail informasi (Volume, Loop, Antrean) agar simetris.

2. **`src/events/interactionCreate.ts`**:
   - Menambahkan handler interaksi untuk tombol `btn_lyrics`:
     - Mengambil lirik dari API / cache LRCLIB yang sudah ada di bot (`getOrFetchLyrics`).
     - Mengirimkan pesan lirik berbingkai embed pink cantik secara `ephemeral: true`.

3. **`src/ui/componentsV2.ts`**:
   - Menyelaraskan komponen V2 jika mode experimental Components V2 diaktifkan.

---

## 5. Rencana Langkah Kerja (Checklist)

- [ ] **Langkah 1**: Perbarui `createNowPlayingComponents` di `src/ui/embeds.ts` dengan tata letak 5x5 simetris.
- [ ] **Langkah 2**: Tambahkan interaksi `btn_lyrics` di `src/events/interactionCreate.ts` dengan embed lirik manis Miu.
- [ ] **Langkah 3**: Rapikan progress bar dan tata letak field di `createNowPlayingEmbed`.
- [ ] **Langkah 4**: Sinkronkan perubahan di `src/ui/componentsV2.ts`.
- [ ] **Langkah 5**: Jalankan `npm run build` dan `npm test` untuk memverifikasi seluruh 99 tests tetap lulus.
- [ ] **Langkah 6**: Commit & push ke GitHub agar otomatis ter-deploy ke bot live Discord dan Render.
