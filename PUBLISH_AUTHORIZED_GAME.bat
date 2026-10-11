@echo off
setlocal
cd /d "%~dp0"
title REVIVE - Owner Cloud Game Publisher
if not exist "cloud\.env" (
 echo R2 is not configured yet.
 echo Copy cloud\.env.example to cloud\.env and enter your PRIVATE Cloudflare R2 credentials.
 echo Never commit or send cloud\.env to anybody.
 pause
 exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
 echo Install Node.js 22+ to use this owner publisher: https://nodejs.org/
 pause
 exit /b 1
)
cd cloud
if not exist node_modules (
 echo Installing owner publisher dependencies on this PC...
 call npm install
 if errorlevel 1 (pause & exit /b 1)
)
node --env-file=.env scripts/publish-interactive.mjs
pause
