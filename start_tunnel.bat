@echo off
title BotPulse - Cloudflare Tunnel Launcher
echo ========================================================
echo   Starting BotPulse Backend with Cloudflare Public Tunnel
echo ========================================================
cd /d "%~dp0"
"C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe" -X utf8 start_tunnel.py
pause
