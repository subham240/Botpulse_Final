@echo off
title BotPulse - Cloudflare Tunnel Launcher
echo ========================================================
echo   Starting BotPulse Backend with Cloudflare Public Tunnel
echo ========================================================
cd /d "C:\Users\lenovo\Downloads\Final_Minor_Project\Botpulse"
"C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe" -X utf8 start_tunnel.py > launcher.log 2>&1
pause
