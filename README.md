# REVIVE v0.8 — Public Windows download website + GitHub Desktop importer

**This version fixes the missing homepage for Vercel.** It adds a polished Steam/Xbox-inspired but original REVIVE landing page, a Windows installer release-detection button, a working source ZIP download, and one optional donation section. It adds **no game sales, subscription, or paid downloads**.

**Use `RUN_NOW.bat` only to import code into your existing GitHub Desktop REVIVE repository.** Paste the folder you got from GitHub Desktop → Show in Explorer, type `IMPORT`, then commit and push. This does **not** install Electron or run the desktop program. Refer to [`docs/WEBSITE_DEPLOYMENT.md`](docs/WEBSITE_DEPLOYMENT.md) for exact Vercel settings and why the current site is 404.

Website copies are in `public/` and `cloud/public/` so either Vercel Root Directory (repository root or `cloud`) can serve the homepage. The older Vercel API in `cloud/api/` remains unchanged.

**Public installer warning:** no released `REVIVE-Setup-*.exe` has been verified. Until you publish a Windows installer through GitHub Releases, the website clearly indicates its release status and the source code remains downloadable. **Donations:** the link is a placeholder until you provide an actual payment link; no fees are charged by REVIVE.

## Previous project documentation

# REVIVE v0.7 — GitHub Desktop one-click source importer + Cloud Connections

**RUN_NOW.bat NOW MEANS "IMPORT CODE INTO GITHUB DESKTOP"**, not "start Electron".

**One-click GitHub workflow:** Extract this entire ZIP to Downloads, open GitHub Desktop → REVIVE → Show in Explorer, copy the repository path (such as `C:\Users\YourName\Documents\GitHub\Revive`), then double-click `RUN_NOW.bat` **in the extracted package**. Paste the path and type `IMPORT`. Changed code is backed up outside the repository. Finally review Changes, Commit, and Push in GitHub Desktop. You do **not** need Node.js to import code.

**Launch actual application:** use `START_REVIVE_APP.bat`. **Cloud guided setup:** use `SETUP_CLOUD.bat` and read [`docs/CLOUD_CONNECTIONS.md`](docs/CLOUD_CONNECTIONS.md). **Windows installer:** use `BUILD_WINDOWS_INSTALLER.bat` or `INSTALL_REVIVE_WINDOWS.bat`.

**New cloud services:** Vercel API readiness status, Supabase permanent friend graph and messages (retained), Upstash Redis authenticated presence (added), R2 game storage (retained), OpenAI diagnostics (retained). In Settings, a Cloud Connections dashboard shows which Vercel environment variables appear configured. Cloud accounts and billing still require owner setup; nothing is automatically provisioned by importing code. Multiplayer restoration is not implemented by a status or friends service.

**Keep secrets private:** Upstash, R2, and OpenAI keys are server-side variables in Vercel only. The desktop uses a Supabase publishable key and signed-in user sessions. Commercial games may be shared only with proper redistribution rights.

---

# REVIVE v0.6 — Steam-inspired Windows launcher + cloud game catalog

This source folder is for **GitHub Desktop**. You do **not** need to run a BAT file to commit or upload the code. Read `README_GITHUB_DESKTOP_FIRST.txt`.

**New in v0.6:** Cloud Library discovery screen, Cloudflare R2 large-file publisher for titles with redistribution permission, Vercel signed download API, verified in-app game downloads, dedicated optional Support REVIVE screen via Stripe Payment Links, and calmer input/dropdown focus styling. The existing local game library, console adapters, social beta, save backups, updater, and AI diagnostic code remain.

**Storage warning:** DO NOT upload proprietary/delisted games unless you have permission to redistribute them. The catalog API is public in this prototype, without per-user licensing checks. No R2 bucket, Stripe Payment Link, live multiplayer restoration, or hosted cloud download is preconfigured. Read `docs/CLOUD_GAME_LIBRARY.md` before deploying.

# REVIVE — Keep play alive

**Windows-first local game preservation launcher · v0.2.0 prototype**

REVIVE is a private game launcher that imports games installed on your own computer, helps you inspect game compatibility, creates save backups, supports owner-initiated verified file transfers and provides optional server-backed AI advice. The visual shell draws on publicly documented launcher patterns while retaining its own branding and original code.

**Important:** The app does **not** restore multiplayer for Sunset Overdrive PC, automatically establish Blur LAN tunnels, bypass store entitlements or make games playable over a single universal server. Cloud saves are different from multiplayer networking. Full multiplayer restoration is the primary future engineering goal and must be verified title by title.

## New in v0.2.0

- New original visual theme and animated startup, modular desktop pages, keyboard shortcuts (`Ctrl+K`, `Ctrl+1` through `Ctrl+4`, `Alt+Left`, `Escape`), hover/press/focus/reduced-motion styles
- Games can be favorited, renamed, or assigned owner-selected PNG/JPEG/WebP cover artwork; original game files are never changed by those library actions
- Selected-game hub with the Play button, local launch state, installation details, save controls, and compatibility status
- Dedicated multiplayer compatibility page with local network-adapter inspection; explicit Blur LAN versus Sunset Overdrive PC no-multiplayer profile
- Verified HTTPS asset downloading to the local Downloads/REVIVE directory with streamed progress, abort/cancel, size ceiling and strict SHA-256 check before completion
- File inspection in a worker thread to avoid blocking launcher UI, executable fingerprinting and read-only diagnostics
- Owner opt-in AI source review for up to 32 small source files selected from a folder; name/size preview before confirming remote submission; redaction is best effort, not a guarantee
- Existing optional WebDAV save snapshots and server-backed OpenAI game diagnostic analysis retained
- 16 automated local tests across core game importing, saving, transfer validation, compatibility and UI template rendering

## What is intentionally unfinished

- An actual Blur two-PC LAN integration is **not tested**, and automated virtual LAN joins are not implemented.
- Sunset Overdrive PC has no native multiplayer mode; REVIVE **cannot** enable Chaos Squad by merely adding a lobby.
- No friend accounts, invites, online lobbies, chat/voice, packet relay, game-specific network adaptation or real-time matchmaking.
- No cloud game streaming. Hosting/streaming video with Sunshine/Moonlight is an entirely different feature from co-op multiplayer.
- Downloads are owner-authorized, single-file, checksum-verified transfers, **not** SteamPipe-style delta downloads. No pause/resume, retry history or licensed game installation manifests yet.
- Save sync remains manual. No automatic conflict resolution, no end-to-end archive encryption and no cross-device cloud identity.
- No production Windows installer validation, visual browser screenshot verification or signed binary from this environment. The GitHub Actions workflow builds a Windows installer after you push the code.

## Run on your Windows desktop

Install [Node.js 22+](https://nodejs.org/en). Extract this ZIP to a working folder. Then in PowerShell:

```powershell
cd desktop
npm install
npm test
npm start
```

You will see a fully interactive Electron application. Click **Add a game** to import an executable from an existing lawful Windows installation. To generate a Windows installer:

```powershell
npm run dist:win
```

Windows builds will be in `desktop/dist/`; unsigned installers may show Windows SmartScreen warnings. If you only want to view the visual shell in a browser without file permissions, serve `desktop/ui` over a local development HTTP server. The browser-only preview shows *placeholder* sample games and does not launch games.

## GitHub Desktop

The ideal setup is a **new private repository** called `revive-launcher`. Open GitHub Desktop → Add Local Repository, select the extracted folder, initialize Git if prompted, and publish it **privately**. The repository includes `.github/workflows/windows-build.yml`; **Actions → Windows launcher build** will compile a downloadable Windows installer artifact after the code is published. The repo can hold hundreds or thousands of files; file count itself is not the meaningful limitation.

Your connected GitHub account has an existing empty **public** repo named `aypacharrito/revive`. REVIVE was **not pushed to that public repository** without your direction. Change its visibility to private first if you intend to use it for this private launcher, or start a new private repository.

## Vercel + OpenAI (optional)

Create a **separate Vercel project** for directory `cloud/` (Framework: Other). Provide environment variables (in Vercel settings, not in repository):

```text
OPENAI_API_KEY=(secret from OpenAI API platform)
REVIVE_OWNER_TOKEN=(long random string of at least 24 characters)
OPENAI_MODEL=(supported Responses API model, optional)
```

The optional endpoints are `GET /api/health`, `POST /api/diagnose`, and `POST /api/code-review`. The latter two require the matching owner bearer token in the desktop settings. Treat this as **owner-only prototype authentication**, not a multi-user release. API billing is separate from your ChatGPT subscription. Do not give your owner token to friends.

## Cloud saves

Enter your HTTPS WebDAV folder URL and app-specific credentials in desktop Settings. Then configure each game's actual save directory on its Game page. Uploads are manual; restore creates a local backup first. Snapshots are limited to 120 MB / 3,500 save files. Cloud archives are transferred over HTTPS but are not end-to-end encrypted by REVIVE. Do not synchronize active game saves while the game is writing them.

## Detailed design and research

- [Design and interaction study](docs/UX_STUDY.md): research into Steam, Xbox, Epic, Riot, Playnite, Heroic, Legendary, and Lutris; specific transitions and navigation design decisions.
- [Multiplayer restoration roadmap](docs/MULTIPLAYER_PLAN.md): Blur, Sunset Overdrive, LAN and game-specific networking strategies.
- [Deployment guide](docs/DEPLOYMENT.md): GitHub Desktop, Vercel setup, owner token isolation, hosting architecture.
- [QA matrix](docs/TEST_MATRIX.md): what has real automated validation, what needs Windows tests.
- [Full research notes](docs/RESEARCH.md): links to original public documentation.

All code in this ZIP is independently authored starter code. Competitors' privately-owned code was not accessed or replicated, and the project contains no game executables, copyrighted installers, ROMs, crack tools, or pirated assets. Sharing full games requires appropriate rights regardless of whether the titles are old, offline, or delisted.

## Run NOW (Windows) — v0.3 emulator adapters

**Extract the complete ZIP then double-click [`RUN_NOW.bat`](RUN_NOW.bat).** First use requires Windows, Node.js 22+, Internet access to install Electron packages, and user permission if the script offers Node installation. GitHub Desktop is only for tracking the folder, not for executing Electron. The `BUILD_WINDOWS_INSTALLER.bat` helper compiles an installer on Windows; the GitHub Actions workflow can also create it after you publish the project.

A new **Consoles** tab supports importing and launching your own console game files via existing **user-installed** engines: RetroArch (GB/GBC/GBA/NES/SNES/Genesis/N64), DuckStation (PS1), PCSX2 (PS2), RPCS3 (PS3), xemu (original Xbox), Dolphin (GameCube/Wii). Select the installed emulator `.exe` once, and select a RetroArch `.dll` core for each classic platform. ROMs, BIOS, firmware, keys, and emulator executables are never included or downloaded by REVIVE. Game-specific emulator setup is still required. GPU reporting is informational and never promises lag-free performance.

Switch emulation is intentionally not part of this build because major upstream projects shut down, compatibility and rights vary, and this package will not provide firmware, keys, circumvention tools, or unauthorized game distribution. Consult [`docs/EMULATION.md`](docs/EMULATION.md) for compatibility, links, GPU recommendations, and limitations.

## NEW v0.4 — Discord-style automatic updates for installed Windows builds

- Non-blocking signed-release update checks + periodic rechecks.
- Automatic background downloading, release progress feedback, rotating REVIVE emblem, and update install on exit; optional immediate restart in Settings if no games are running.
- GitHub release automation, protected by certificate/signing prerequisites and version tags.
- NSIS per-user one-click installation intended to avoid routine elevation prompts after the initial install (security warnings can still occur if unsigned).
- Game library, emulators, original game files and backups stay outside the application install folder.

**Important:** `RUN_NOW.bat` still runs the developer version and does not self-update. Use GitHub Desktop for source updates. End-user self-updates require a **signed Windows installer plus published release files** in the configured public `aypacharrito/revive` GitHub Releases feed; neither exists automatically merely by extracting this ZIP. Read [docs/AUTO_UPDATES.md](docs/AUTO_UPDATES.md) before releasing to friends.
