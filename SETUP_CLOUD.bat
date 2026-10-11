@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title REVIVE - Connect Cloud Services
color 0B
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\SETUP_CLOUD.ps1"
if errorlevel 1 (echo Setup guide closed with an error. & pause)
