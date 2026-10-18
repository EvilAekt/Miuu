# scripts/backup.ps1: Backup otomatis database SQLite dan .env (PRD v2 E2)
param (
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetFolder = Join-Path $BackupDir "backup_$timestamp"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     Memulai Backup Database & Config     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
}

# 1. Backup SQLite Database
$dbFile = ".\data\bot.db"
if (Test-Path $dbFile) {
    Copy-Item $dbFile -Destination (Join-Path $targetFolder "bot.db") -Force
    $size = (Get-Item (Join-Path $targetFolder "bot.db")).Length / 1KB
    Write-Host "[Backup] Berhasil mencadangkan bot.db ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
} else {
    Write-Host "[Backup] Peringatan: File bot.db tidak ditemukan di .\data" -ForegroundColor Yellow
}

# 2. Backup WAL & SHM jika ada
if (Test-Path ".\data\bot.db-wal") {
    Copy-Item ".\data\bot.db-wal" -Destination (Join-Path $targetFolder "bot.db-wal") -Force
}
if (Test-Path ".\data\bot.db-shm") {
    Copy-Item ".\data\bot.db-shm" -Destination (Join-Path $targetFolder "bot.db-shm") -Force
}

# 3. Backup .env file
$envFile = ".\.env"
if (Test-Path $envFile) {
    Copy-Item $envFile -Destination (Join-Path $targetFolder ".env") -Force
    Write-Host "[Backup] Berhasil mencadangkan .env" -ForegroundColor Green
} else {
    Write-Host "[Backup] Peringatan: File .env tidak ditemukan" -ForegroundColor Yellow
}

# 4. Bersihkan backup lama sesuai masa retensi
$limitDate = (Get-Date).AddDays(-$RetentionDays)
$oldBackups = Get-ChildItem -Path $BackupDir -Directory -Filter "backup_*" | Where-Object { $_.CreationTime -lt $limitDate }
foreach ($old in $oldBackups) {
    Remove-Item $old.FullName -Recurse -Force
    Write-Host "[Cleanup] Menghapus backup lama: $($old.Name)" -ForegroundColor Gray
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Backup selesai! Tersimpan di: $targetFolder" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
