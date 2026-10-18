# scripts/create-desktop-shortcut.ps1: Membuat shortcut 1-klik di Desktop Windows

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Membuat Shortcut Desktop (1-Click Discord Music Bot)   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$desktopPath = [System.Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktopPath)) {
    # Fallback jika desktop folder menggunakan OneDrive Desktop
    $desktopPath = Join-Path $env:USERPROFILE "Desktop"
}

$shortcutName = "Discord Music Bot.lnk"
$shortcutPath = Join-Path $desktopPath $shortcutName
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$targetBat = Join-Path $projectRoot "start-app.bat"

if (-not (Test-Path $targetBat)) {
    Write-Error "File start-app.bat tidak ditemukan di: $targetBat"
    exit 1
}

try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $targetBat
    $Shortcut.WorkingDirectory = $projectRoot
    $Shortcut.Description = "Luncurkan Bot Discord Music & Buka Web Dashboard Lokal"
    # Menggunakan ikon audio/musik Windows bawaan
    $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,138"
    $Shortcut.WindowStyle = 1 # Normal Window
    $Shortcut.Save()

    Write-Host ""
    Write-Host "[OK] BERHASIL!" -ForegroundColor Green
    Write-Host "Shortcut resmi telah dibuat di Desktop:" -ForegroundColor White
    Write-Host "--> $shortcutPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Sekarang Anda dapat menjalankan seluruh aplikasi dan langsung membuka website" -ForegroundColor Gray
    Write-Host "hanya dengan 1 kali klik (double-click) pada shortcut di Desktop!" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
} catch {
    Write-Error "Gagal membuat shortcut: $_"
    exit 1
}
