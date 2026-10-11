# REVIVE — Desktop Launcher Design Study

Reviewed: October 10, 2026. **Observation and inspiration only:** this project contains no Steam, Xbox, Epic, Riot, or proprietary game launcher source code and doesn't claim access to their private design systems. Each point describes publicly documented behavior or an independently chosen design response.

## 1. Launchers studied and actionable lessons

### Steam / Steamworks — information hierarchy and reliable updates

Public references: [Steam library client screenshot](https://mobilesyrup.com/2023/06/15/steam-design-refresh-update-features/), [Steam Auto-Cloud](https://partner.steamgames.com/doc/features/cloud), [SteamPipe uploads](https://partner.steamgames.com/doc/sdk/uploading?language=english).

- Library side list and dominant selected-game hero let players launch with minimal context switching.
- The most important game state is adjacent to primary call-to-action: PLAY or INSTALL, last played, update or cloud status.
- Real cloud sync needs a safe pre-launch download and post-exit upload lifecycle. REVIVE currently offers manual WebDAV sync; automated conflict resolution is future work.
- SteamPipe uses depot and chunk pipelines for authenticated distribution. REVIVE's single-file verified downloader is not a SteamPipe clone. Real game distribution requires ownership checks, signed manifests, delta updates, resumable chunks, and redistribution rights.
- Download queue should expose active, verifying, paused, failed, and completed states; show bytes, network rate, and disk activity separately where measurable. REVIVE v0.2 includes verified active/completed/failed/cancelled states, but no pause/resume or disk processing graph.

### Xbox PC / Xbox mode — focus on resume and cross-store library

Public references: [Xbox aggregated library](https://news.xbox.com/en-us/2025/09/15/access-gaming-library-xbox-on-windows-pc-and-handheld/), [Xbox compact mode](https://news.xbox.com/en-us/2024/05/08/compact-mode-continues-evolving-in-the-xbox-app-on-pc/), [Xbox mode for Windows 11](https://news.xbox.com/en-us/2026/04/30/xbox-mode-pc-windows-11/).

- Recently played games should be easy to reach without searching; preserve user's task context when returning to the launcher.
- Aggregated library unifies installations from multiple stores while keeping those stores' entitlements and dependencies intact.
- Xbox mode offers controller-first fullscreen navigation. REVIVE v0.2 is keyboard/mouse-first only; controller-first shell and D-pad focus graph are future work.
- Avoid claiming launcher import changes DRM or store authorization. Integration requires individual store APIs and user permission.

### Epic Games Launcher — explicit library filters and download controls

Public references: [Library filters](https://www.epicgames.com/help/c-32735058/c-31292734/a14280729), [Download Manager](https://www.epicgames.com/help/c-32735058/c-31292734/a13481456?lang=en-US), [EOS lobbies](https://dev.epicgames.com/docs/epic-online-services/multiplayer/lobbies-and-sessions/lobbies-and-sessions-introduction).

- Search as you type; segment installed and favorite games; sorting is independent of view layout.
- Download UI benefits from priority, speed limits, schedules, and background behavior. REVIVE v0.2 supports real streaming bytes, per-task status, cancellation, and SHA-256 verification; the remaining features need a resumable queue engine.
- An EOS lobby is a service for integrated titles, not a patch that makes an arbitrary offline game multiplayer. REVIVE must support multiple per-game network adapters.

### Riot Client — always-available services and modular extension points

Public references: [Riot client architecture](https://www.riotgames.com/en/news/architecture-league-client-update), [Background patching](https://www.riotgames.com/en/news/riot-client-background-patching-valorant).

- Keep background activities separate from UI. REVIVE's game inspection uses a worker thread, while downloads stream in the main process and throttle UI updates.
- Modular screen components avoid one giant renderer. REVIVE keeps discrete views, shared components, design tokens, and isolated core service modules.
- Background patching is worth offering only once signed manifests and a safe restart policy exist.

### Playnite, Heroic, Legendary, Lutris — interoperable open-source patterns

- [Playnite source](https://github.com/JosefNemec/Playnite) demonstrates editable library metadata, configurable themes and fullscreen mode. [Playnite plugin docs](https://github.com/Playnite/Docs/blob/main/docs/tutorials/extensions/intro.md) make extension contracts explicit.
- [Playnite source strings](https://github.com/JosefNemec/Playnite/blob/master/source/Playnite/Localization/LocSource.xaml) document async image loading, tray behavior, game metadata import and covers; REVIVE should lazy-load artwork as libraries grow.
- [Heroic launcher](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher) offers imports, clouds saves, queueing, and categories across stores.
- [Legendary](https://github.com/legendary-gl/legendary) exposes owner-authorized imported-install verification and resumable downloads, but only with legitimate store authentication and manifests.
- [Lutris](https://github.com/lutris/lutris) uses game runners and install scripts; REVIVE will require signed/approved adapter descriptors rather than executing arbitrary downloaded scripts.

## 2. Detailed interaction quality specification

Each item has a measurable **target**, not an assertion that a production benchmark was achieved. Tests are required on Windows 11 hardware.

| Area | Desired interaction | v0.2 behavior | Follow-up test/feature |
|---|---|---|---|
| Cold launch | Immediate feedback while UI initializes | Brand splash and automatic dismissal | Benchmark first interactive paint; remove arbitrary delay after measurement |
| Navigation | 140–220ms subtle entry, no harsh page wipe | CSS enter transitions | Test under weak integrated GPUs and reduced-motion |
| Sidebar hover | Visible response within one frame | Background + horizontal 2px motion | Test keyboard focus contrast and high DPI |
| Main button | Consistent hover, pressed feedback, keyboard focus | Gradient hover, pressed scale, focus-visible ring | Contrast automation and click target 44px goal |
| Game tile hover | Shadow, lift, clear selection | Lift 6px + selected border | Avoid layout thrash with 500+ imported games |
| Search | Ctrl+K, type, filter without submitting | Ctrl+K and incremental filter | Search index and debounce for 10k entries |
| Back navigation | Never stranded in a game detail | Back-to-Library and Alt+Left | Persist state across restarts |
| Cover art | Per-game visual identity, optional user override | CSS fallback covers + file picker | Generate bounded thumbnail cache and lazy load |
| Scanning | Files scanned outside renderer; no edits | Read-only inventory in worker thread | Add cancellation, progress and manifest comparison |
| Download | Honest bytes, ETA, speed, integrity, cancellation | Bytes/rate/progress + SHA-256 + abort | Resume/pause/rate limit/retry/disk processing |
| Cloud | Auto-save only when lifecycle supports it safely | Manual explicit backup and restore | Versioning, E2EE, conflict detection |
| Failure states | Understandable action-oriented errors | Toasts and detail errors | Persistent diagnostic logs and retry UI |
| Multiplayer | State whether title can actually connect players | Per-game researched profiles | Verified game adapter and two-PC integration tests |
| Accessibility | Keyboard focus and no forced animation | Visible focus + reduced-motion CSS | Screen-reader audit, controller navigability |
| Security | Neither renderer nor AI directly controls disk arbitrarily | Context isolation, restricted IPC, owner-initiated AI | Permission boundaries, patch signing, per-user auth |

## 3. Multi-screen layout specification

- **Global shell:** 42px draggable Windows title area, 65px topbar, responsive navigation sidebar, persistent status bar. Avoid giant unused areas and avoid stuffing a store inside a private library launcher.
- **Library:** 280px hero, collection stats, search/filters, 2D game tiles, coherent no-art fallback. Proportional scaling for 960–1440px widths.
- **Game page:** cinematic hero, giant play button, favorite toggle, safe tools, save and compatibility cards.
- **Multiplayer:** explicit LAN/community/unsupported classification, steps and inspectable local adapter information. Never label Sunset Overdrive PC co-op as working.
- **Downloads:** show one transfer row per owner-authorized artifact. Checksum required before any bytes download. Keep a downloaded file only after hash match.
- **Saves:** backup-before-restore, owner-selected save directory, manual cloud transfer, current archive history.
- **AI Lab:** static report of files and game dependencies; optional server-side AI analysis and source review. Owner explicitly approves sending text excerpts.
- **Settings:** tokens encrypted by OS when available; OpenAI secret stays server-side.

## 4. Things we have not researched or copied

We did not inspect private Steam/Xbox/Epic/Riot source trees or unpack their proprietary binaries. We have not verified every launcher update or examined every tutorial video frame. We used public documentation, screenshots, public source trees and a Microsoft-hosted Sunset Overdrive multiplayer video as grounded references. No competitor's trademarks, screens or source are part of the REVIVE codebase.

Visual browser rendering was not verified in the current container because browser navigation was blocked by its administrative policy. CSS/layout require Windows Electron QA before claiming the UI is pixel-perfect.
