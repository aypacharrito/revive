# REVIVE v1.1 — Universal Cloud + Windows installer pipeline

## Fast start: ONE prompt, NO `IMPORT` confirmation

1. Extract this ZIP.
2. Double-click **RUN_NOW.bat**.
3. Paste your existing GitHub Desktop repository folder path (e.g. `C:\Users\YOU\Documents\GitHub\Revive`) and press **Enter**.
4. The validated files copy immediately, with backups of changed files kept outside GitHub. No second confirmation, build, or automatic push.
5. In **GitHub Desktop**, review Changes, **Commit to main**, then **Push origin**.

## How to obtain a REAL Windows `.exe`

This archive **does not contain a precompiled installer**. Copying source code into GitHub cannot compile a Windows executable by itself.

After you push v1.1 to `main` on GitHub, [the Windows preview workflow](https://github.com/aypacharrito/revive/actions/workflows/windows-preview.yml) is configured to build a real **REVIVE-Setup-1.1.0.exe** using GitHub's Windows runner. It uploads the installer and SHA-256 checksum, then attempts to publish both under [REVIVE Releases](https://github.com/aypacharrito/revive/releases). GitHub repository permissions and successful CI are required; a release has **not** been verified as published.

Once that workflow succeeds, double-click **GET_REVIVE_EXE.bat** from this extracted folder. It downloads the real installer from the official `aypacharrito/revive` release to Windows Downloads, verifies its size and release checksum (when present), and shows it in Explorer. It does **not** run the executable automatically.

**Alternative:** On your Windows PC, with Node.js LTS installed and an internet connection, double-click **RUN_INSTALLER_NOW.bat**. It installs Electron build dependencies and builds the real installer in `desktop\dist` on your own computer. The build is not guaranteed until executed on Windows.

Unsigned preview installers can trigger Windows publisher warnings. Do not disable Windows security protections to bypass warnings; validate the official source and checksum. Signed production releases remain a future task.

## Other v1.1 features

- **One REVIVE network:** desktop obtains the public Supabase project URL and publishable key from REVIVE's Vercel backend. No player should need to manually enter cloud keys; each user signs into their own account.
- **Persistent friends and messages:** Supabase schema uses RLS. Actual multiplayer/social use across two user devices still needs end-to-end testing.
- **Presence:** Upstash Redis (Vercel). Public clients never receive Redis credentials.
- **Cloud library:** Cloudflare R2 signed, SHA-256-verified, resumable downloads. R2 requires a separately configured bucket and credentials.
- **Owner publishing:** `PUBLISH_AUTHORIZED_GAME.bat` and `PUBLISH_AUTHORIZED_LINK.bat` publish only packages with authorization to redistribute. An ordinary Google Drive or MediaFire sharing page is not automatically a direct download URL.

The `.exe` is **not** embedded in source code or checked into the git repository. Installers belong in GitHub Releases rather than as large binary files inside repository source history.
