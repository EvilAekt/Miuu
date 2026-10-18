# 📋 Inventaris Akun, Layanan & Komponen (PRD v4 Epic 1)

Daftar inventaris aset, akun pihak ketiga, dan infrastruktur sistem bot musik (hanya memuat lokasi, identitas publik, dan pemilik — TIDAK memuat rahasia atau token).

---

### 1. Aplikasi & Gateway Discord
- **Aplikasi Utama:** `Miu` (Client ID: `1561188740511043634`)
  - Pemilik: Akun Developer Utama
  - Portal: [Discord Developer Portal](https://discord.com/developers/applications)
  - Intents: `Guilds`, `GuildVoiceStates`, `GuildMessages`
- **Primary Guild:** `Kekaisaran Lamburgh` (Guild ID: `1527705094051725424`)
  - Status Persetujuan: Approved Otomatis

---

### 2. Audio Engine & Plugin
- **Lavalink Server:** `Lavalink v4.0.8`
  - Node ID: `local`
  - Host: `localhost:2333`
  - Source Plugin: `dev.lavalink.youtube:youtube-plugin` (v1.11.4)
  - Runtime: OpenJDK 21 LTS (`./jre/bin/java.exe`)

---

### 3. Layanan Terbuka & API Eksternal
- **Lirik:** [LRCLIB Open Database](https://lrclib.net/) (Tanpa API key)
- **Spotify Metadata Resolver:** Open Spotify Embed API / oEmbed endpoint (Tanpa akun Premium)
- **Scrobbler:** [ListenBrainz API](https://api.listenbrainz.org/1/submit-listens) (Opt-in token pengguna)

---

### 4. Database & Penyimpanan Lokal
- **Database Engine:** SQLite 3 (WAL mode via `better-sqlite3`)
- **Lokasi File:** `./data/bot.db`
- **Lokasi Backup:** `./backups/backup_*.db`
- **Folder Musik Lokal:** `./music` (`LOCAL_MUSIC_DIRS`)
- **Dashboard Web Lokal:** `http://127.0.0.1:3000` (PWA Manifest di `/manifest.json`)

---

### 5. Jadwal & Prosedur Rutin
- **Pencadangan SQLite:** Harian via `scripts/backup.ps1`
- **Latihan Pemulihan Bencana (DR):** Satu kali per kuartal via `scripts/drill-recovery.ps1`
- **Pembaruan Plugin Lavalink:** Bulanan via `scripts/update-lavalink.ps1`
- **Audit Beban Pemeliharaan:** Kuartalan via `scripts/log-maintenance.mjs --list`
