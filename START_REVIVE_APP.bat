@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title REVIVE - Start Application
if not exist "desktop\package.json" (echo Missing desktop\package.json & pause & exit /b 1)
where npm.cmd >nul 2>nul
if errorlevel 1 (echo Install Node.js 22+ from https://nodejs.org/ and try again. & pause & exit /b 1)
if not exist "desktop\node_modules\electron\dist\electron.exe" (
 echo Installing application dependencies for first launch...
 call npm.cmd --prefix desktop install --no-audit --no-fund
 if errorlevel 1 (echo Installation failed & pause & exit /b 1)
)
call npm.cmd --prefix desktop start
if errorlevel 1 pause
