@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title REVIVE - Update GitHub Desktop Repository
color 0B
cls
echo.
echo  ========================================================
echo             REVIVE  -  GITHUB CODE IMPORTER
echo  ========================================================
echo.
echo  This copies REVIVE SOURCE CODE into your existing GitHub
echo  Desktop folder. It does NOT install Node or launch the app.
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\IMPORT_TO_GITHUB.ps1"
set "exitCode=%ERRORLEVEL%"
echo.
if not "%exitCode%"=="0" echo [!] Import did not finish. Your existing repository was preserved.
if "%exitCode%"=="0" timeout /t 5 /nobreak >nul
if not "%exitCode%"=="0" (
  echo Press any key to close this window.
  pause >nul
)
exit /b %exitCode%
