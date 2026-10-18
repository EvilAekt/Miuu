# scripts/update-lavalink.ps1: Pemeriksaan dan pembaruan Lavalink server dengan auto-rollback (PRD v2 E2)
param (
    [switch]$CheckOnly,
    [switch]$ForceUpdate
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    Lavalink Update Manager (PRD v2)      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$jarPath = ".\Lavalink.jar"
$bakPath = ".\Lavalink.jar.bak"

# 1. Cek versi terbaru dari GitHub API
try {
    Write-Host "[Update] Memeriksa rilis terbaru Lavalink di GitHub..." -NoNewline
    $releaseUrl = "https://api.github.com/repos/lavalink-devs/Lavalink/releases/latest"
    $headers = @{ "User-Agent" = "DiscordMusicBot-Updater" }
    $release = Invoke-RestMethod -Uri $releaseUrl -Headers $headers -TimeoutSec 10
    $latestTag = $release.tag_name
    Write-Host " Selesai!" -ForegroundColor Green
    Write-Host "[Update] Versi rilis terbaru: $latestTag" -ForegroundColor Cyan

    $downloadAsset = $release.assets | Where-Object { $_.name -eq "Lavalink.jar" } | Select-Object -First 1
    if (-not $downloadAsset) {
        Write-Host "[Update] Aset Lavalink.jar tidak ditemukan di rilis $latestTag" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host " Gagal!" -ForegroundColor Red
    Write-Host "[Update] Tidak dapat menghubungi GitHub API: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

if ($CheckOnly) {
    Write-Host "[Update] Mode CheckOnly: Tidak melakukan perubahan file." -ForegroundColor Yellow
    exit 0
}

# 2. Cadangkan file lama sebelum update
if (Test-Path $jarPath) {
    Write-Host "[Update] Mencadangkan Lavalink.jar ke Lavalink.jar.bak..." -ForegroundColor Cyan
    Copy-Item $jarPath -Destination $bakPath -Force
}

# 3. Unduh versi baru
$tempJar = ".\Lavalink.jar.new"
try {
    Write-Host "[Update] Mengunduh Lavalink.jar ($latestTag)..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadAsset.browser_download_url -OutFile $tempJar -TimeoutSec 60
    Move-Item $tempJar $jarPath -Force
    Write-Host "[Update] File jar berhasil diperbarui ke versi $latestTag." -ForegroundColor Green
} catch {
    Write-Host "[Update] Gagal mengunduh jar baru: $($_.Exception.Message)" -ForegroundColor Red
    if (Test-Path $tempJar) { Remove-Item $tempJar -Force }
    exit 1
}

# 4. Uji jalan (Health verification)
Write-Host "[Testing] Menguji kelayakan binary Lavalink baru..." -ForegroundColor Cyan
$javaExe = ".\jre\bin\java.exe"
if (-not (Test-Path $javaExe)) { $javaExe = "java" }

$testProcess = Start-Process -FilePath $javaExe -ArgumentList "-jar $jarPath --help" -PassThru -WindowStyle Hidden
$testProcess.WaitForExit(10000)

if ($testProcess.ExitCode -eq 0 -or $null -eq $testProcess.ExitCode) {
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✅ Pembaruan Lavalink Sukses & Terverifikasi!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    # 5. Rollback otomatis jika uji gagal
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "❌ Verifikasi gagal! Melakukan Rollback Otomatis..." -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    if (Test-Path $bakPath) {
        Copy-Item $bakPath -Destination $jarPath -Force
        Write-Host "[Rollback] Berhasil memulihkan Lavalink.jar ke versi cadangan sebelumnya." -ForegroundColor Green
    } else {
        Write-Host "[Rollback] Peringatan: File cadangan tidak ditemukan." -ForegroundColor Red
    }
    exit 1
}
