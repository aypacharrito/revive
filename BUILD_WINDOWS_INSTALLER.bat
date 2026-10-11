@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title REVIVE - Windows Installer Builder
where npm.cmd >nul 2>nul
if errorlevel 1 (echo Install Node.js LTS from https://nodejs.org/en/ & pause & exit /b 1)
call npm.cmd --prefix desktop install --no-audit --no-fund
if errorlevel 1 goto :error
call npm.cmd --prefix desktop test
if errorlevel 1 goto :error
call npm.cmd --prefix desktop run dist:win
if errorlevel 1 goto :error
explorer "%~dp0desktop\dist"
echo Installer built successfully. Find it inside desktop\dist.
pause
exit /b 0
:error
echo Build failed; see output above.
pause
exit /b 1
