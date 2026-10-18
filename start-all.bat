@echo off
title Discord Music Bot and Web Dashboard
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\start-all.ps1"
if %errorlevel% neq 0 pause
