# REVIVE — Private PC Game Launcher (Starter v0.1)

Windows-first prototype with an Electron desktop launcher, local game import, executable SHA-256 metadata inspection, save-game snapshots, optional owner-controlled WebDAV cloud sync, and an optional OpenAI diagnostic API deployable to Vercel.

**No actual game files, game installers, cracks, ROMs, or copyrighted assets are included.** Adding a game does not mean multiplayer services are restored. Import only software you can lawfully use; distribute only files you have rights to redistribute.

## What's real now

- Desktop launcher UI with custom dark stellar theme
- Import an installed Windows `.exe`, or choose a game directory and select an executable found inside
- Persistent local game library (per Windows user)
- Launch executable with correct working directory and approximate playtime tracking
- Recursive read-only file inventory and SHA-256 executable fingerprint (not trusted-manifest verification)
- Explicit save folder selection per game; local compressed backup snapshots and restore with safety backup
- Optional WebDAV backup/upload to private storage and restore of latest cloud save
- Optional AI diagnostics via the Vercel API, uploading only limited metadata (not executable files)
- Separate GitHub Actions workflow to build a Windows installer on GitHub

## What is NOT implemented yet

- Game binaries upload/distribution, automated game patching, verified game repair, DRM workarounds
- Automatic LAN tunneling, online multiplayer restoration, friends, matchmaking, in-game overlay
- Cross-machine synchronization conflict resolution or automatic background save syncing
- Cloud user accounts; the Vercel diagnostic endpoint currently has **one owner token**
- The ZIP is source code; a Windows executable is produced after building on Windows

## Run the desktop app (Windows 10/11)

Install Node.js 22 and npm, then run:

```powershell
cd desktop
npm install
npm test
npm start
```

To create an installable `.exe` on Windows:

```powershell
npm run dist:win
```

Installer output is under `desktop/dist`. Alternatively create a private GitHub repository, push this project, and trigger the **Windows launcher build** workflow; it uploads the installer as a GitHub Actions artifact. Windows code signing is not configured, so Windows SmartScreen might warn about the unsigned installer. Review and sign binaries before sharing widely.

To preview only the UI, open `desktop/ui/index.html` in a browser. Sample Blur/Sunset cards in preview mode are placeholders, not included games. File actions require the actual desktop app.

## Deploy the AI backend to Vercel

1. Create a separate Vercel project with **root directory `cloud`** and **Framework Preset: Other**.
2. In the Vercel project settings, create private environment variables `OPENAI_API_KEY` and `REVIVE_OWNER_TOKEN` (at least 24 random characters). Optionally set `OPENAI_MODEL` to a supported Responses model.
3. Deploy the project and confirm `/api/health` responds.
4. In the desktop Settings, set the Vercel origin URL (e.g. `https://example.vercel.app`) and the same owner token. Never put `OPENAI_API_KEY` in the desktop app or GitHub.
5. The desktop diagnostic action sends only file inventory metadata. OpenAI API billing is **separate from ChatGPT**.

**Security:** The demo owner-token endpoint is suitable for a trusted private prototype, not a public multiplayer service. Add real accounts, access control, rate limiting, monitoring, and quotas before inviting others to use the AI service. Keep owner credentials private.

## Connect your cloud-save folder

For real save sync, enter the HTTPS WebDAV folder URL plus account/app-password in desktop Settings. Example: a dedicated `REVIVE` folder on Nextcloud. Create the remote folder first. Credentials are stored using Electron `safeStorage`, encrypted via the OS. Each game stores a `GAME_UUID.revive` latest-save blob on that storage. A new upload overwrites that remote latest snapshot, but local snapshots preserve history. Backups cover at most 120 MB/3500 files per game in v0.1. Always close the game before backing up or restoring.

Restore first creates a safety snapshot, then writes matching files. It does not delete obsolete files. Snapshots are private save data; never share anyone else's saves without permission.

## Multiplayer research targets

- **Blur:** LAN mode; can support external authorized community setup. Launcher integration and virtual LAN not implemented yet.
- **Sunset Overdrive:** Steam edition already has Steam Cloud. An additional independent save backup is optional. PC edition is single-player; adding a launcher does not create multiplayer.

## Platform separation

GitHub = source + Windows build jobs; Vercel = cloud API, future friends/dashboard; desktop = game library, local scanning and launch; WebDAV (or later object storage) = cloud-save blobs. **Do not host whole copyrighted games on Vercel.** Vercel Functions have a 4.5 MB request/response body limit; large uploads should go directly to object storage.

## Engineering roadmap

1. v0.2: Metadata edits, launcher integrations, unit-tested background save sync conflict detection, stronger encrypted archive format, Windows signed builds.
2. v0.3: Friend accounts and invitations, private presence service, encrypted save-sharing permissions.
3. v0.4: Tested per-game profiles (Blur LAN virtual-network setup with user consent and legal compatibility research), compatibility test harness, logs and health checks.
4. v0.5: Owner-only authorized installer/package distribution with per-game permissions, virus scanning and SHA-256 manifests; licensed game bundles only.

## Sources consulted

- [Playnite source](https://github.com/JosefNemec/Playnite), [Playnite import docs](https://github.com/Playnite/Docs/blob/main/docs/manual/library/games/addingGames.md)
- [Heroic](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher), [Legendary](https://github.com/legendary-gl/legendary)
- [Valve GameNetworkingSockets](https://github.com/ValveSoftware/GameNetworkingSockets)
- [Epic online services](https://dev.epicgames.com/docs/epic-online-services)
- [Microsoft GDK](https://github.com/microsoft/GDK)
- [Steam Cloud](https://partner.steamgames.com/doc/features/cloud), [Sunset Overdrive SteamDB cloud config](https://steamdb.info/app/847370/ufs/)
- [Vercel websocket support](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections), [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [OpenAI SDK](https://github.com/openai/openai-node), [ChatGPT vs API billing](https://help.openai.com/en/articles/9039756-managing-billing-settings-on-the-chatgpt-web-and-api-platform)

## License & reuse

This original starter is provided as-is. External open-source projects are research references and **their code has not been copied into this project**. Follow their individual licenses if you later integrate any of their code.
