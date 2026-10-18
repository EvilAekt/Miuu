# Plan: Upgrade UI Web Dashboard Menjadi Ultra-Kawaii Pastel Pink (Karakter Miu)

- **Tanggal**: 2026-10-19
- **Status**: Selesai (Completed)
- **Author**: Antigravity (web-implementation)

---

## 1. Tujuan
Mentransformasi antarmuka Web Dashboard secara menyeluruh dari gaya *dark cyber-studio* menjadi **Ultra-Kawaii Pastel Pink Wonderland** yang selaras 100% dengan estetika karakter Miu pada banner profil dan foto profilnya:
- Palet warna lembut *Strawberry Milk & Sakura Candy* (Soft Pastel Pink, Marshmallow White, dan Warm Rose).
- Tipografi bulat (*bubbly & friendly*) menggunakan Google Fonts **Quicksand** & **Nunito**.
- Komponen *puffy glassmorphic* yang menggemaskan dengan sudut sangat melengkung (*extra-rounded corners*), bayangan lembut (*soft fluffy glow*), dan efek partikel melayang (sakura 🌸, pita pita 🎀, bintang berkilau ✨, kelinci 🐇).
- Tetap mempertahankan **latensi ultra-rendah (< 20 ms), zero-lag SSE streaming, dan kelulusan 100% unit tests (99/99 passed)**.

---

## 2. Asumsi & Pertanyaan Terbuka

### Asumsi:
1. **Mode Tampilan Utama**: Menggunakan tema **Miu Strawberry Pastel (Light/Soft Pink)** sebagai default utama agar identik dengan banner Miu, serta menyediakan opsi **Miu Night Dreamy Pastel (Dark Pink)** untuk pengguna yang menyukai tampilan gelap saat malam hari.
2. **Performa & Animasi**: Semua ornamen imut (partikel melayang, pantulan tombol *bouncy*, rotasi piringan hitam) menggunakan akselerasi perangkat keras GPU (`transform3d`, `opacity`, CSS keyframes murni) tanpa dependensi library eksternal agar file HTML tetap ringan (< 20 KB terkompresi Gzip).
3. **Integritas Uji Otomatis**: Seluruh elemen yang diuji dalam `tests/visual_upgrade.test.ts`, `tests/latency_optimization.test.ts`, dan `tests/ultra_latency_optimization.test.ts` (ID elemen, nama kelas, selector, dan fungsi inti) dipertahankan 100%.

### Pertanyaan Terbuka:
- Tidak ada isu pemblokir (blocking issues). Jika user ingin preferensi tertentu antara dominasi Light Soft Pastel Pink vs Dark Velvet Pink, keduanya sudah disiapkan dalam toggle tema.

---

## 3. Pendekatan Desain & Arsitektur

### Perbandingan Opsi Desain:
| Aspek | Opsi A: Dreamy Kawaii Milk & Candy Glassmorphism (Direkomendasikan) | Opsi B: Dark Mode Only dengan Sedikit Garis Pink |
| :--- | :--- | :--- |
| **Kesesuaian dengan Banner/Avatar** | **Sangat Sesuai (100% Cocok)**: Mirip ilustrasi Miu dengan latar pink pastel lembut, boneka kelinci putih, dan pita pita manis. | Kurang cocok (masih terasa seperti dashboard server/hacker dengan garis pink tipis). |
| **Kesan Visual (Aesthetic)** | *Super cute, cozy, delightful, WOW factor* tinggi, ceria dan menenangkan. | Cenderung kaku dan gelap. |
| **Kontras & Keterbacaan** | Menggunakan warna teks *Dark Chocolate Rose* (`#4A2E35`) di atas kartu putih susu, kontras rasio WCAG AAA (> 7:1). | Kontras cukup, namun nuansa "lucu" tidak maksimal. |
| **Fleksibilitas** | Memiliki toggle tema Miu Pastel (Default), Miu Night Dream, Cosmic, Cyberpunk, OLED. | Terbatas pada tema gelap saja. |

### Opsi Terpilih: **Opsi A (Dreamy Kawaii Milk & Candy Glassmorphism)**
- **Alasan Pemilihan**:
  1. Langsung menjawab permintaan user: *"jadi lebih lucu dengan warna pink kayak di bannernyaa kayak foto profilnyaa"*.
  2. Kartu kaca semi-transparan putih susu (*frosted milky glass*) dengan border pink lembut memberikan kesan manis seperti kafe anime Jepang.
  3. Desain responsif sempurna di perangkat mobile (HP) dan desktop.

---

## 4. Konsep Visual Antarmuka Baru

```
+----------------------------------------------------------------------------------------------------+
| 🌸 [Miu Avatar] Miu Music 🎀          [ 🔍 Ketik lagu manis kesukaanmu... 🍰 ]   [🎤 Karaoke] [💖 Online] |
+----------------------------------------------------------------------------------------------------+
|  HERO BANNER MIU (Kelinci, Piringan Hitam, dan Pita-Pita Berbintang ✨)                            |
+----------------------------------------------------------------------------------------------------+
|  🌸 SEKARANG MEMUTAR (Kawaii Turntable)              | 🎀 ANTREAN & KONTROL MANIS                 |
|  +-------------------------------------------------+ | +----------------------------------------+ |
|  |  +-------------------+  (Jarum Hati Rose Gold)  | | | 📜 Daftar Lagu Berikutnya (3)   [Acak] | |
|  |  |  Artwork Lagu     |   \                      | | | 1. 🎵 Lagu Manis 1 - Artis     3:20   | |
|  |  |   + Disc Pink (O) |    \                     | | | 2. 🎵 Lagu Manis 2 - Artis     4:15   | |
|  |  +-------------------+                          | | +----------------------------------------+ |
|  |  🎶 Indecision                                  | | 🍰 Tombol Suara (SFX Cute Soundboard)    | |
|  |  👤 Rex Orange County                           | | [ 🌸 Nya~ ]  [ 🎀 Yey! ]  [ ✨ Ting! ]   | |
|  |  0:45 ━━━━━━━🌸━━━━━━━━━━━━ 3:06                | | [ 🍰 Kawaii ] [ 💖 Love ] [ 🐇 Hop! ]    | |
|  |  [⏮️]  [ 💖 Jeda / Putar ]  [⏭️]  [🔁 Loop]     | |                                          | |
|  |  🔊 Volume: [━━━━●━━━━] 50%                     | | 📊 Statistik Mendengarkan Miu           | |
|  +-------------------------------------------------+ | +----------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
|  🌸 LIRIK LAGU KARAOKE AKTIF: "Sweet melody floating around you..." ✨                             |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Token Desain Kawaii Miu

```css
:root {
  /* Palet Utama: Strawberry Milk & Sakura Dream */
  --bg-dark: #fff5f8;                                 /* Soft candy marshmallow backdrop */
  --bg-gradient: linear-gradient(135deg, #fff0f5 0%, #ffe4ec 50%, #ffd8e4 100%);
  --card-bg: rgba(255, 255, 255, 0.78);               /* Milky frosted glass */
  --card-border: rgba(255, 182, 193, 0.55);           /* Soft sakura ribbon border */
  --card-hover-border: #ff7597;                       /* Vibrant strawberry pink hover */
  --card-shadow: 0 14px 34px rgba(255, 145, 175, 0.18);
  
  --primary: #ff7597;                                 /* Kawaii Strawberry Pink */
  --primary-hover: #ff527d;
  --primary-glow: rgba(255, 117, 151, 0.40);
  
  --accent: #ffb7c5;                                  /* Sakura Blossom Pink */
  --accent-glow: rgba(255, 183, 197, 0.45);
  
  --text-main: #4a2835;                               /* Deep chocolate rose (kontras tajam & manis) */
  --text-muted: #8c5e6f;                              /* Soft plum blush */
  --text-dim: #b892a0;                                /* Pastel rose ash */
  
  --success: #65d6a4;                                 /* Mint candy */
  --warning: #ffb86c;                                 /* Peach sparkle */
  --error: #ff5c7c;                                   /* Strawberry red */
  
  /* Font Family Bulat & Imut */
  --font-display: 'Quicksand', 'Outfit', sans-serif;
  --font-body: 'Nunito', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --border-radius-card: 26px;
  --border-radius-btn: 9999px;
}
```

---

## 6. Perubahan File

| File Path | Aksi | Ringkasan Perubahan |
| :--- | :--- | :--- |
| `src/web/dashboardHtml.ts` | Modify | 1. Import font Google: `Quicksand` dan `Nunito`.<br>2. Perbarui seluruh CSS theme tokens ke palet Strawberry Milk & Kawaii Pink.<br>3. Tambahkan efek animasi partikel melayang (sakura 🌸, pita 🎀, bintang ✨).<br>4. Tambahkan ornamen kelinci imut dan label vinyl pink.<br>5. Bikin tombol kontrol bergaya *bubbly candy pill* dengan animasi *bounce*.<br>6. Perbarui search bar, volume slider, dan seekbar dengan motif bunga & hati.<br>7. Perbarui tampilan Karaoke Overlay agar terasa seperti konser imut. |
| `src/web/server.ts` | Verify | Memastikan static file serving (`/assets/*`) dan endpoint data tetap berjalan lancar. |

---

## 7. Langkah Implementasi (Checklist)

- [x] **Langkah 1: Typography & Palet Warna**:
  - Impor Google Fonts `Quicksand:wght@500;600;700` dan `Nunito:wght@400;600;700;800`.
  - Terapkan token CSS Kawaii Strawberry Milk sebagai tema default di `:root`.
  - Sesuaikan warna teks menjadi *Deep Chocolate Rose* (`#4A2835`) agar mudah dibaca di atas kartu putih susu.

- [x] **Langkah 2: Ambient Background & Floating Kawaii Particles**:
  - Ganti background gradasi dengan *soft pastel candy pink*.
  - Tambahkan CSS floating keyframes untuk animasi partikel melayang (bunga sakura 🌸, pita pink 🎀, bintang berkilau ✨).

- [x] **Langkah 3: Komponen Card, Header, & Hero Banner**:
  - Ubah kartu menjadi *Milky Frosted Glass* dengan border pink melengkung (`border-radius: 26px`) dan bayangan lembut.
  - Percantik header dengan badge online berbentuk hati pink berdenyut (`💖 Online`).
  - Percantik kartu Hero Banner Miu dengan frame pita dan ucapan selamat datang yang lebih ceria.

- [x] **Langkah 4: Kawaii Vinyl Player & Turntable Needle**:
  - Ubah piringan hitam agar memiliki label tengah warna pink pastel bermotif kelinci/pita.
  - Sesuaikan jarum turntable (*tone arm*) dengan sentuhan warna rose-gold dan cartridge pink.
  - Pertahankan seluruh selector dan atribut yang dibutuhkan pengujian otomatis.

- [x] **Langkah 5: Kontrol Interaktif (Buttons, Seekbar, Volume)**:
  - Ubah tombol putar/jeda, skip, loop, shuffle menjadi bentuk kapsul bulat (*candy pill*) dengan efek tekan membal (*spring bounce*).
  - Ubah slider volume dan seekbar menjadi motif permen dengan indikator bunga sakura (`🌸`).

- [x] **Langkah 6: Soundboard & Antrean (Queue)**:
  - Berikan ikon lucu bertema kafe/anime pada tombol soundboard (`🍰`, `🎀`, `✨`, `⭐`, `🍬`, `🧸`).
  - Rapikan list antrean dengan badge nomor berbentuk lingkaran pastel.

- [x] **Langkah 7: Verifikasi & Testing**:
  - Jalankan `npm test` untuk memverifikasi 99 unit test tetap lulus 100%.
  - Jalankan `npm run build` untuk memverifikasi kompilasi TypeScript bebas error.

---

## 8. Strategi Testing

1. **Automated Unit Tests**:
   - `tests/visual_upgrade.test.ts` (Wajib lulus: selektor `ambientArtBlur`, `toneArm`, `audioVisualizer`, `hoverTimeBadge`, `lyricShimmer`).
   - `tests/latency_optimization.test.ts` (Wajib lulus: SSE `EventSource`, 100ms interval, Optimistic UI).
   - `tests/ultra_latency_optimization.test.ts` (Wajib lulus: Page Visibility API).
2. **Visual Verification**:
   - Memastikan tampilan di browser desktop dan mobile tampil manis, kontras warna tajam dan mudah dibaca, serta tombol-tombol responsif.

---

## 9. Kriteria Selesai (Definition of Done)
- [x] Semua checklist langkah implementasi tercentang `- [x]`.
- [x] Tidak ada regresi pada fungsionalitas pemutar musik, lirik, atau remote HP.
- [x] Tampilan website berkesan sangat lucu dan seirama dengan banner serta foto profil Miu.
- [x] Seluruh unit test (`npm test`) lulus 100% (99/99).
- [x] Kode terkompilasi bersih tanpa error TypeScript (`npm run build`).
