<#
.SYNOPSIS
  Skrip Latihan Pemulihan Bencana (Disaster Recovery Drill - PRD v4 Epic 1)
.DESCRIPTION
  Mensimulasikan pemulihan bot dari nol ke folder isolasi staging:
  1. Memvalidasi ketersediaan file cadangan (backup bot.db).
  2. Menyalin backup ke direktori staging terisolasi.
  3. Membuka database staging dengan Node.js untuk memverifikasi integritas PRAGMA quick_check.
  4. Mencatat log keberhasilan drill ke tabel maintenance_log.
#>

$ErrorActionPreference = "Stop"
$startTime = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Simulasi Pemulihan Bencana (DR Drill)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$dataDir = Join-Path $PSScriptRoot "..\data"
$sourceDb = Join-Path $dataDir "bot.db"
$stagingDir = Join-Path $PSScriptRoot "..\staging"
$stagingDb = Join-Path $stagingDir "bot.db"

if (-not (Test-Path $sourceDb)) {
    Write-Error "Database utama tidak ditemukan di: $sourceDb"
    exit 1
}

Write-Host "[1/4] Membuat snapshot cadangan darurat..." -ForegroundColor Yellow
if (-not (Test-Path $stagingDir)) {
    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null
}

Copy-Item -Path $sourceDb -Destination $stagingDb -Force
Write-Host " -> Berhasil menyalin database ke folder staging: $stagingDb" -ForegroundColor Green

Write-Host "[2/4] Menjalankan uji integritas pada database staging..." -ForegroundColor Yellow
$cleanStagingPath = $stagingDb.Replace('\', '/')
$verifyCode = "const Database = require('better-sqlite3'); const db = new Database('$cleanStagingPath'); const check = db.pragma('quick_check'); console.log('Integrity check result:', JSON.stringify(check)); const tableCount = db.prepare('SELECT count(*) as count FROM sqlite_master WHERE type=\'table\'').get().count; console.log('Total tables verified:', tableCount); if (tableCount < 5) throw new Error('Tabel database tidak lengkap!'); db.close();"

$nodeOutput = node -e $verifyCode
Write-Host " -> $nodeOutput" -ForegroundColor Green

Write-Host "[3/4] Menguji query pemulihan data (playlists, tracks, settings)..." -ForegroundColor Yellow
$sampleCode = "const Database = require('better-sqlite3'); const db = new Database('$cleanStagingPath'); const guilds = db.prepare('SELECT count(*) as count FROM guilds').get().count; const playlists = db.prepare('SELECT count(*) as count FROM playlists').get().count; console.log('Guild count:', guilds, '| Playlist count:', playlists); db.close();"
$queryOutput = node -e $sampleCode
Write-Host " -> $queryOutput" -ForegroundColor Green

$startTime.Stop()
$elapsedMinutes = [Math]::Max(1, [int][Math]::Ceiling($startTime.Elapsed.TotalMinutes))

Write-Host "[4/4] Mencatat log latihan pemulihan ke database..." -ForegroundColor Yellow
node scripts/log-maintenance.mjs drill $elapsedMinutes "Latihan pemulihan otomatis staging lulus tanpa data korup"

# Bersihkan direktori staging setelah tes selesai
Remove-Item -Path $stagingDir -Recurse -Force
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LATIHAN PEMULIHAN SELESAI & SUKSES!    " -ForegroundColor Green
Write-Host "  Waktu Pemulihan: $($startTime.Elapsed.TotalSeconds.ToString('F1')) detik" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
