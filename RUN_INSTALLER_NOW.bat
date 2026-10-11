@echo off
setlocal
cd /d "%~dp0"
title REVIVE - Build and Install Windows EXE
echo REVIVE / WINDOWS INSTALLER
echo This builds a real EXE on your Windows PC using Node.js and Electron Builder.
echo Existing games and save files are not changed.
call "%~dp0INSTALL_REVIVE_WINDOWS.bat"
exit /b %ERRORLEVEL%
