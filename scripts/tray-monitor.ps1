<#
.SYNOPSIS
  Windows Health & Tray Monitor untuk Discord Music Bot (PRD v3 E5).
  Memantau http://127.0.0.1:3000/api/status secara berkala dan menampilkan status/notifikasi.
#>

param(
  [switch]$Once,
  [int]$IntervalSeconds = 30
)

function Show-Notification {
  param([string]$Title, [string]$Message, [string]$Type = "Info")
  Write-Host "[$Type] $Title - $Message" -ForegroundColor $(if ($Type -eq "Error") { "Red" } elseif ($Type -eq "Warning") { "Yellow" } else { "Green" })
}

function Check-BotHealth {
  try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/status" -TimeoutSec 5 -ErrorAction Stop
    if ($res.connected -eq $true) {
      Show-Notification -Title "Bot Online" -Message "Bot: $($res.botName), Ping: $($res.ping)ms, Guilds: $($res.guildCount)" -Type "Info"
      return $true
    } else {
      Show-Notification -Title "Bot Degraded" -Message "Bot tidak terhubung ke Discord Gateway!" -Type "Warning"
      return $false
    }
  } catch {
    Show-Notification -Title "Bot Offline!" -Message "Server dashboard lokal di http://127.0.0.1:3000 tidak merespons. Periksa apakah bot mati." -Type "Error"
    return $false
  }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Discord Music Bot - Health & Tray Monitor" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($Once) {
  $success = Check-BotHealth
  exit $(if ($success) { 0 } else { 1 })
}

Write-Host "Memulai loop pemantauan tiap $IntervalSeconds detik... (Tekan Ctrl+C untuk berhenti)" -ForegroundColor Gray

while ($true) {
  Check-BotHealth
  Start-Sleep -Seconds $IntervalSeconds
}
