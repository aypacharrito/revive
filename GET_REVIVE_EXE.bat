@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title REVIVE - Download Real Windows Installer
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\GET_REVIVE_EXE.ps1"
set "EXITCODE=%ERRORLEVEL%"
echo.
if not "%EXITCODE%"=="0" echo [!] REVIVE installer is not available yet, or the download failed.
echo Press any key to close.
pause >nul
exit /b %EXITCODE%
