# scripts/start-all.ps1: 1-Click Launcher untuk Bot Discord Music, Lavalink, dan Web Dashboard

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    DISCORD MUSIC BOT and WEB DASHBOARD (1-CLICK)         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

# 1. Cek apakah Bot & Web Dashboard sudah aktif di port 3000
$botPortOpen = $false
try {
    $checkBot = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
    $botPortOpen = $checkBot.TcpTestSucceeded
} catch {
    $botPortOpen = $false
}

if ($botPortOpen) {
    Write-Host "[Status] Bot dan Web Dashboard sudah berjalan aktif!" -ForegroundColor Green
    Write-Host "[Browser] Membuka Web Dashboard di browser: http://localhost:3000" -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "Tekan sembarang tombol untuk menutup jendela ini..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

# 2. Cek apakah Lavalink sudah berjalan di port 2333
$lavalinkPortOpen = $false
try {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 2333 -WarningAction SilentlyContinue
    $lavalinkPortOpen = $tcp.TcpTestSucceeded
} catch {
    $lavalinkPortOpen = $false
}

if ($lavalinkPortOpen) {
    Write-Host "[1/3] Lavalink Audio Engine : [OK] SUDAH AKTIF (Port 2333)" -ForegroundColor Green
} else {
    Write-Host "[1/3] Lavalink Audio Engine : [...] Menjalankan server..." -ForegroundColor Yellow
    $javaExe = ".\jre\bin\java.exe"
    if (-not (Test-Path $javaExe)) {
        $javaExe = "java"
    }

    Start-Process -FilePath $javaExe -ArgumentList "-Duser.language=en -Duser.country=US -jar Lavalink.jar" -WindowStyle Minimized
    Write-Host "      Menunggu Lavalink siap di port 2333..." -NoNewline

    $retries = 30
    while ($retries -gt 0) {
        Start-Sleep -Seconds 1
        try {
            $check = Test-NetConnection -ComputerName 127.0.0.1 -Port 2333 -WarningAction SilentlyContinue
            if ($check.TcpTestSucceeded) {
                Write-Host " [OK] SIAP!" -ForegroundColor Green
                $lavalinkPortOpen = $true
                break
            }
        } catch {}
        Write-Host "." -NoNewline
        $retries--
    }

    if (-not $lavalinkPortOpen) {
        Write-Host " [ERR] GAGAL!" -ForegroundColor Red
        Write-Host "Lavalink tidak merespons dalam 30 detik. Cek file logs/spring.log" -ForegroundColor Red
        pause
        exit 1
    }
}

# 3. Jalankan Background Watcher untuk membuka browser otomatis saat web server siap
Start-Job -ScriptBlock {
    $retries = 35
    while ($retries -gt 0) {
        Start-Sleep -Seconds 1
        try {
            $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
            if ($tcp.TcpTestSucceeded) {
                Start-Process "http://localhost:3000"
                break
            }
        } catch {}
        $retries--
    }
} | Out-Null

Write-Host "[2/3] Discord Music Bot     : [OK] Memulai koneksi..." -ForegroundColor Cyan
Write-Host "[3/3] Local Web Dashboard   : [*] Menyiapkan http://localhost:3000 (Otomatis terbuka di browser)" -ForegroundColor Cyan
Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[i] Web Dashboard akan terbuka otomatis di browser Anda dalam beberapa detik." -ForegroundColor Yellow
Write-Host "[i] Link Manual: http://localhost:3000" -ForegroundColor White
Write-Host "[i] Tekan Ctrl+C untuk menghentikan bot kapan saja." -ForegroundColor DarkGray
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# 4. Jalankan Bot Discord di foreground
npm start
