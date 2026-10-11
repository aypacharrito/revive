# REVIVE v0.4 — Automatic Desktop Updates

## What is implemented

REVIVE's packaged Windows NSIS installer now has an Electron auto-updater (`electron-updater`). It checks GitHub Releases shortly after startup and then every 4 hours. If a newer *published* release exists, it downloads in the background, shows a rotating REVIVE status emblem and percentage indicator, and caches the update. On normal app exit, the update is installed automatically. A manual “Restart & install” button is also present in Settings after a successful download; the app blocks this action while it knows a game is running.

The updater uses the `electron-builder` GitHub provider. The **current build target is `aypacharrito/revive`**, a public repository at the time of writing. The release must contain `latest.yml`, the NSIS installer EXE, and its `.blockmap` file (where generated). Published release versions must increase (`0.4.0` -> `0.4.1`); the updater won't fetch unfinished draft releases.

Only the app updates. Its library JSON, emulator paths, settings, artwork, backups, and imported game files are stored in the Windows user profile or their original directories, not the app installation folder. This is why the project MUST NOT move game content into `desktop/` or installed `resources/`.

## Important limits

- Double-clicking `RUN_NOW.bat` starts the *developer/source* build. This does **not** auto-update from GitHub Releases. Use GitHub Desktop `Fetch origin` / `Pull origin` to get source changes, then rerun the batch file. The batch file installs new Electron dependencies if needed.
- To get automatic update behavior, install the actual `REVIVE-Setup-x.y.z.exe` Windows application.
- There is no published release or configured certificate in this ZIP. Do not expect an updater to find an update until **you publish a signed v0.4.0 release and later a higher version**.
- Builds produced with `BUILD_WINDOWS_INSTALLER.bat` are intended for local testing; without a Windows Authenticode signing identity, they can produce SmartScreen warnings and will not satisfy the signed release workflow.
- REVIVE does not force a mid-game restart. It installs a ready update on app quit. Windows logoff/reboot while an installation is running remains a risk with NSIS installers.
- Owner review is required for each release. An unreviewed push to `main` does not automatically ship executable software to friends.

## One-time release setup

1. Decide whether the `aypacharrito/revive` repo is the **public distribution repo**. The updater must be able to access its Releases **without embedding a GitHub token in your desktop app**. Avoid using a private GitHub repository as the updater feed for friends. For a private source tree, plan a separate public release repository and adjust the workflow to publish to that designated repo with appropriately scoped release credentials.
2. Keep the repository name and owner stable; changing it can break installed updater feeds. The `publish.owner` and `publish.repo` values are explicit in `desktop/package.json`.
3. Acquire a legitimate Windows Authenticode code-signing certificate / service with the necessary code-signing permissions. Setup a protected GitHub Actions environment called `desktop-release` with required approvals.
4. Store your code signing cert as repository secrets `WINDOWS_SIGNING_PFX_BASE64` (Base64 text of your PFX) and `WINDOWS_SIGNING_PFX_PASSWORD`. Do not commit either secret or the certificate itself.
5. Commit the reviewed source code. Ensure tests pass (`cd desktop && npm test`). For the initial signed installed release, use a tag matching `desktop/package.json` exactly: `v0.4.0`. Push the tag to the **repository containing the release workflow**. It builds the installer and publishes a GitHub Release if tests and signing succeed.
6. Download and install that release on a Windows test PC. For the actual auto-update test, increment `desktop/package.json` to `0.4.1`, commit the change, create/push tag `v0.4.1`, and confirm the original installed v0.4.0 detects and downloads it. Test on a machine with *no games running*, then repeat with a game running to verify restart deferral.
7. Once verified, share the signed installer release link with friends. They install once; later versioned releases update automatically.

**PowerShell example to create the first release tag after committing and reviewing the project:**

```powershell
# Run in a local clone of the intended GitHub distribution repository
cd path\to\revive
git tag v0.4.0
git push origin v0.4.0
```

The release workflow refuses to publish if the tag doesn't match the package version or signing secrets are missing. Publishing to the wrong repository will not feed clients because the updater is intentionally pinned to `aypacharrito/revive`.

## UI and behavior

- Checking: subtle rotating branded emblem (non-blocking)
- Downloading: branded progress card + percentage / transfer rate
- Downloaded: "installs when you exit"; optional restart button in Settings
- Offline / no release / server error: information in Settings; gameplay unaffected
- Developer mode: explains GitHub Desktop is the source update mechanism
- Reduced-motion OS setting disables update animations

## Security

HTTPS GitHub Releases + checksummed `latest.yml`/artifacts are provided by electron-builder. The workflow **requires** a valid signing cert before publishing releases. Configure `publisherName` if necessary to pin trusted Authenticode signer names for update verification; test certificate rotation carefully. Never add an update URL/text field exposed to the renderer that could redirect automatic code downloads. Protect release permissions and GitHub account with MFA.

This initial release uses electron-builder 26's signature/checksum behavior; v27+ adds signed update manifest support, but upgrading to v27 should be tested as a migration, not blindly merged. Even with signing, zero security prompts cannot be guaranteed on every Windows device.

Official references:
- https://www.electron.build/docs/features/auto-update/
- https://www.electron.build/docs/api/electron-updater.class.nsisupdater/
- https://www.electron.build/docs/features/security/
