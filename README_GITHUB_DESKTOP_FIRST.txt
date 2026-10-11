REVIVE — ONE-STEP GITHUB DESKTOP IMPORT
=======================================
1. EXTRACT this ZIP anywhere.
2. DOUBLE-CLICK RUN_NOW.bat.
3. PASTE the path to your existing local GitHub Desktop repository folder, then press ENTER.
4. The updated files copy immediately. There is NO second 'IMPORT' question.
5. Open GitHub Desktop, review changes, COMMIT, and PUSH ORIGIN.

Your .git folder, .env secrets, game files, dependencies, and original backups are preserved.
The importer itself DOES NOT run an installer, commit, or push.

AFTER GITHUB PUSH:
- Windows preview workflow builds the real REVIVE-Setup-1.1.0.exe in a Windows runner.
- Once the workflow publishes the release, double-click GET_REVIVE_EXE.bat
  to download it directly to Windows Downloads.
- Or run RUN_INSTALLER_NOW.bat to build locally on Windows with Node.js LTS.

No compiled EXE is bundled in this ZIP. Do not confuse .bat files or source ZIPs with an installer.
