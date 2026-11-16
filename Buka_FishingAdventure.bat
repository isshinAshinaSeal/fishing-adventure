@echo off
title Fishing Adventure - 2D Web Fishing Game
color 09
chcp 65001 >nul

echo ===============================================================================
echo                 🎣 SELAMAT DATANG DI FISHING ADVENTURE 🎣
echo                   Game Simulasi Memancing Santai 2D
echo ===============================================================================
echo.

cd /d "%~dp0"
if exist "fishing-adventure" (
    cd fishing-adventure
)

echo [INFO] Memeriksa environment Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan di PATH! Silakan install Node.js.
    pause
    exit /b 1
)

echo [INFO] Memulai server Fishing Adventure...
echo [INFO] Membuka browser ke http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js

pause
