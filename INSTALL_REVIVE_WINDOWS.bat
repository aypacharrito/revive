@echo off
setlocal
cd /d "%~dp0"
title REVIVE - Install in Windows
call "%~dp0BUILD_WINDOWS_INSTALLER.bat"
if errorlevel 1 (echo Installer build failed.&pause&exit /b 1)
set "LATEST="
for /f "delims=" %%I in ('dir /b /o:-d "desktop\dist\REVIVE-Setup-*.exe" 2^>nul') do if not defined LATEST set "LATEST=%%I"
if not defined LATEST (echo Could not find Windows installer.&pause&exit /b 1)
echo.
echo Open the installer to add REVIVE to the Windows Start Menu.
echo REVIVE downloaded from source is not signed yet; Windows security warnings may occur.
choice /M "Open installer now"
if errorlevel 2 exit /b 0
start "" "desktop\dist\%LATEST%"
exit /b 0
