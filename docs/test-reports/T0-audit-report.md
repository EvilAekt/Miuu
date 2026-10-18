# Laporan Audit Unit Testing (Tugas T0)
**Tanggal**: 18 Oktober 2026  
**Pemeriksa**: Junior Dev / AI Testing Agent  
**Target Dokumen**: `Rencana Unit Testing PRD v1 sampai v8 Tugas untuk Junior Dev dan AI Murah.md`  
**Status Audit**: Selesai (Semua Temuan Diverifikasi Nyata)

---

## 1. Verifikasi Angka Nyata vs Klaim Dokumen

| Parameter | Klaim di Dokumen / Checklist | Hasil Nyata Hasil Audit | Status |
| :--- | :--- | :--- | :--- |
| **Jumlah Tes** | 49 (v6) -> 52 (v7) -> 55 (v8) | **59 Unit Test** | Valid (Melampaui klaim) |
| **Hasil Eksekusi** | Lulus semua | **59 Pass / 0 Fail** | 100% Hijau |
| **Waktu Eksekusi Suite** | < 30 detik | **1.37 - 1.71 detik** | Sangat Cepat (< 2 detik) |
| **Kestabilan (Flakiness)** | Belum terverifikasi | **0% Flaky** (5x run berturut-turut konsisten 59/59 pass) | Sangat Stabil |
| **Typecheck** | `npx tsc --noEmit` | **0 Error** | Clean Build |

---

## 2. Pemetaan Fitur / Epic PRD v1 s/d v8 ke File Tes Nyata

| PRD & Epic | Cakupan Fitur | File Tes Terkait | Status Pengujian |
| :--- | :--- | :--- | :--- |
| **PRD v1 Core** | Input Parsing, YouTube, Spotify | `tests/parseInput.test.ts` | Teruji sebagian (perlu perluasan T2) |
| **PRD v1 Matching** | Matcher scoring, bonus/penalti | `tests/matcher.test.ts` | Teruji fungsi kalkulasi |
| **PRD v1 DB & UI** | Cache, Playlog, History, Buttons | `tests/db.test.ts`, `tests/ui.test.ts` | Teruji |
| **PRD v2 Epic 1-9** | Radio, Lyrics LRC, Web Dashboard, Stats | `tests/prd_v2_features.test.ts` | Teruji |
| **PRD v3 Epic 1-5** | Multi-server isolation, GDPR forget, Safe path | `tests/prd_v3_v4.test.ts` | Teruji |
| **PRD v4 Epic 1-7** | Scrobble queue, Transitions, Bandcamp, PWA | `tests/prd_v3_v4.test.ts` | Teruji |
| **PRD v5 Epic 0-6** | Review state, Track volume prefs, Filter presets, Resume | `tests/prd_v5.test.ts` | Teruji |
| **PRD v6 Epic 1-5** | Sleep timer, Mood curator, Gzip backup | `tests/prd_v6.test.ts` | Teruji |
| **PRD v7 Epic 1-5** | 8D DSP audio, Wrapped generator, AI Voice DJ | `tests/prd_v7.test.ts` | Teruji |
| **PRD v8 Feature 1-4**| Smart crossfade, Music quiz, AI Intent, LAN Remote | `tests/prd_v8.test.ts` | Teruji |

---

## 3. Investigasi Temuan Senior (Celah F1 s/d F18)

1. **F1 (LAN Remote Dashboard Security)**:
   - *Status*: **Terkonfirmasi**. `src/web/server.ts` mengizinkan subnet LAN privat (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`). Siapa pun di jaringan Wi-Fi lokal yang sama dapat menembak endpoint `/api/player/:action` tanpa token sesi atau PIN otentikasi.
2. **F2 (Backup Restore Path Traversal & WAL)**:
   - *Status*: **Sebagian terlindungi, ada celah**. `validateSafePath` memblokir `..`, namun restore ke SQLite yang sedang aktif dalam mode WAL berisiko lock contention jika file db utama ditimpa saat bot sedang memutar lagu.
3. **F3 (Prompt Injection pada `/ask`)**:
   - *Status*: **Terkonfirmasi**. Prompt bahasa alami pengguna diteruskan ke Gemini tanpa sanitasi pembatasan izin peran DJ atau volume ekstrim di luar sistem.
4. **F4 (Filesystem Boundaries pada `/sfx` & `/library`)**:
   - *Status*: **Terlindungi di library, perlu uji batas khusus**. `validateSafePath` sudah ada di `src/storage/pathGuard.ts`, namun perlu diuji terhadap string reserved Windows (`CON`, `NUL`, `AUX`).
5. **F6 (Koordinasi Volume Multi-Fitur)**:
   - *Status*: **Terkonfirmasi**. Fitur Sleep Timer, Crossfade, dan Volume Command semuanya memanggil `player.setVolume` secara independen tanpa *central volume coordinator*.
6. **F9 (Mekanisme Crossfade)**:
   - *Status*: **Terkonfirmasi**. Lavalink v4 tidak mendukung pemutaran overlap dua track bersamaan dalam satu player. `crossfadeManager` saat ini mengimplementasikan transisi `fade-out` lagu aktif kemudian `fade-in` lagu baru.
7. **Bug Khusus di `src/resolvers/parseInput.ts` (Baris 44)**:
   - `url: \`https://www.youtube.com/watch?v=s\${shortsMatch[1]}\`` -> menghasilkan awalan `s` di depan ID YouTube Shorts (misal: `watch?v=sabc123` alih-alih `watch?v=abc123`).

---

## 4. Rekomendasi Rencana Aksi
1. Lanjutkan ke **T1**: Membangun modul fakes bersama di `tests/helpers/` (`fakeLavalink.ts`, `fakeDiscord.ts`, `factories.ts`, `fakeGemini.ts`) agar seluruh tes berikutnya tidak lagi bergantung pada mock ad-hoc.
2. Lanjutkan ke **T2**: Menulis pengujian komprehensif `tests/parseInput_robustness.test.ts` untuk menguji SSRF, URL berbahaya, dan penanganan YouTube Shorts.
