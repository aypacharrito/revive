@echo off
setlocal
cd /d "%~dp0"
title REVIVE Owner Authorized Link Import
where npm.cmd >nul 2>nul || (echo Install Node.js LTS: https://nodejs.org/ & pause & exit /b 1)
call npm.cmd --prefix cloud install --no-audit --no-fund || (echo npm install failed & pause & exit /b 1)
call node "cloud\scripts\import-authorized-url.mjs"
echo.
pause
