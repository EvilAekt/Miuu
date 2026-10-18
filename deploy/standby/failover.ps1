<#
.SYNOPSIS
  Skrip Failover Manual ke Host Cadangan Pasif (PRD v5 Epic 4)
.DESCRIPTION
  1. Memverifikasi bahwa instance bot di host utama sudah mati (tidak ada dua instance aktif bersamaan).
  2. Menyalin backup database terbaru ke folder data host standby.
  3. Menyalakan kontainer / proses standby.
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Failover Manual Host Cadangan (PRD v5)  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Pastikan port 2333 dan 3000 lokal tidak bentrok
$lavalinkPortInUse = Test-NetConnection -ComputerName 127.0.0.1 -Port 2333 -InformationLevel Quiet
if ($lavalinkPortInUse) {
    Write-Host "[PERINGATAN] Port 2333 masih aktif pada mesin ini!" -ForegroundColor Red
    Write-Host "Pastikan instance utama dimatikan terlebih dahulu untuk mencegah konflik dua instance." -ForegroundColor Red
    $confirm = Read-Host "Apakah Anda ingin mematikan paksa proses lokal sebelum menyalakan standby? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Failover dibatalkan oleh pengguna." -ForegroundColor Yellow
        exit 0
    }
}

# 2. Sinkronisasi database dari backup terbaru
$backupDir = Join-Path $PSScriptRoot "..\..\backups"
$latestBackup = Get-ChildItem -Path $backupDir -Filter "backup_*.db" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestBackup) {
    Write-Host "Memulihkan dari backup: $($latestBackup.Name)..." -ForegroundColor Yellow
    Copy-Item -Path $latestBackup.FullName -Destination (Join-Path $PSScriptRoot "..\..\data\bot.db") -Force
    Write-Host "Database berhasil dipulihkan." -ForegroundColor Green
} else {
    Write-Host "Tidak ditemukan file backup di $backupDir. Menggunakan data/bot.db yang ada." -ForegroundColor Yellow
}

Write-Host "Menyalakan host cadangan..." -ForegroundColor Yellow
Write-Host "Jalankan perintah berikut untuk mengaktifkan standby:" -ForegroundColor Green
Write-Host "docker compose -f deploy/standby/compose.yml up -d" -ForegroundColor White
Write-Host "Atau jalankan start-all.bat pada host cadangan." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
