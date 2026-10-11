# REVIVE — Research and engineering choices

Date reviewed: October 10, 2026. These are public sources and architecture references, not access to competitors' internal repositories or executables. Original starter code is independently authored.

## What competing launchers teach us

| Product | Access | Public research finding | What REVIVE does first |
| --- | --- | --- | --- |
| [Playnite](https://github.com/JosefNemec/Playnite) | Open source | Manual EXE import, game library plugins, metadata plugins, fullscreen mode; its [manual](https://github.com/Playnite/Docs/blob/main/docs/manual/library/games/addingGames.md) warns working directories matter | Executable import + launch with correct cwd; catalog later |
| [Heroic](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher) | Open source | Game launch lifecycle and [automatic save sync around launch/exit](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher/blob/main/src/backend/launcher.ts) | Manual save snapshots and remote latest backup, then reliable sync after proper conflict resolution |
| [Legendary](https://github.com/legendary-gl/legendary) | Open source | Imported installations verified against trusted service manifests; cloud-save syncing | Inventory/hash only, not claiming verified game integrity without publisher manifests |
| [Lutris](https://github.com/lutris/lutris) | Open source | Reusable runners and [scripted installs](https://github.com/lutris/lutris/blob/master/docs/installers.rst) | Future per-game compatibility manifests, without auto-executing untrusted scripts |
| [Valve NetworkingSockets](https://github.com/ValveSoftware/GameNetworkingSockets) | Open source | Realtime networking implementation in C++ | Later multiplayer transport experiments; library is not a universal legacy multiplayer patch |
| [Steam/Steamworks](https://partner.steamgames.com/doc/features/cloud) | Closed launcher; public SDK documentation | Common Windows save locations, Cloud Auto-Cloud mapping | Per-game save directories and backup history |
| [Epic Games/EOS](https://dev.epicgames.com/docs/epic-online-services/multiplayer/lobbies-and-sessions/lobbies-and-sessions-introduction) | Closed launcher; public SDK | Services expose lobbies, sessions and P2P APIs to integrated games | Future lobby UI and compatible game integrations |
| [Xbox GDK](https://learn.microsoft.com/en-us/xbox/gdk/docs/gdk-dev/get-started/get-started-home) | Closed Xbox app; public GDK | Xbox identity, Gaming Services and packaging rely on Microsoft product setup and entitlement APIs | Do not try to impersonate Xbox or copy its authentication |
| [Riot Client](https://technology.riotgames.com/node/40) | Closed launcher; public engineering article (2016) | Modular desktop services and frontend plugins avoid monolith | Keep local library, saves, diagnostics, and cloud backend independent |

### Videos consulted as references

- [Playnite Setup Guide (2025)](https://www.youtube.com/watch?v=G1lr47g-Q7c) — shows non-store exe imports, cover art/metadata, fullscreen and library organization (based on published description/chapter list, not private source access).
- [Heroic Launcher video overview (2025)](https://www.youtube.com/watch?v=2LU4zCsMK6Q) — Epic/GOG library integration and Steam Deck use (published description/chapter summary).

### Recent release signal

The official [Heroic source](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher/blob/main/src/backend/main.ts) has a September 15, 2026 change, and release notes include improvements to importing, cloud sync options, and updated Electron runtime. That makes maintainability and secure upgrade mechanisms important. Update source metadata with `python scripts/refresh_research.py` (public GitHub API, respects rate limits).

## Selected games

**Blur (PC, 2010)** — LAN multiplayer is possible. Community restoration options may require third-party tools. Tested automatic setup is not included. NAT discovery, network adapter selection, the game's session protocol, rights and compatibility all require game-specific testing. Community reference: https://www.nexusmods.com/blur/mods/4

**Sunset Overdrive (Steam PC)** — Steam Cloud is already available. Its public configuration shows likely Windows local save under `%LOCALAPPDATA%\\Sunset\\Saves\\{Steam3AccountID}`; verify installation and Steam account mapping before selecting a directory. See https://steamdb.info/app/847370/ufs/ . This is **not** a general PC online multiplayer game; a launcher cannot make it multiplayer simply by adding a lobby.

## Architecture and deployment

- **Desktop**: Electron/Node shell running a restricted local HTML/JS interface. Separate main/preload renderer; renderer cannot directly use Node or game-file APIs. Local Game Manager stores entries in app UserData; only chosen paths are imported.
- **Library scan**: read-only file inventory, executable SHA-256. No code execution during scan, binary editing, or auto-download of patches.
- **Saves**: local gzip-format snapshots, backup-before-restore and path validation. Optional HTTPS WebDAV latest snapshot in the owner's account. v0.1 remote backups are not end-to-end encrypted beyond WebDAV HTTPS and provider storage controls. A future version should add authenticated encryption with user-held recovery key.
- **AI**: Vercel server contains OpenAI secret; desktop submits capped inventory summaries with owner-token auth. AI may advise, not patch automatically.
- **Game downloads**: private owner-only authorized distribution module is a future possibility. "Delisted" does not imply public domain. Build legal permission checks per title and avoid generic redistribution of protected files.
- **Multiplayer**: lobbies/auth/chat are separate from actual game packet transport. Legacy games need compatible LAN virtualization, protocol bridges, or permitted replacement servers independently.
- **Cloud**: Vercel Functions 4.5MB body limit makes direct game binary uploads inappropriate. Use permissioned object storage with signed direct uploads if authorized installers are added later; Vercel for metadata/auth API. Vercel supports websocket connections with bounded function lifetime; use external durable state.
- **Build**: GitHub Actions Windows runner compiles Windows Electron installer. No CI artifacts include games. Installer unsigned for now.

## Known prototype limitations

No API account system, no auto sync, no save conflict detection, no E2EE at rest for remote backups, no remote library multi-device synchronization, no auto-authenticated integrated platform store/game ownership check, no relays/lobbies, no macOS/Linux support, no native code inspection and no launcher auto-update. These are planned, not advertised as completed.

## MVP verification

Run `cd desktop && npm test`: local import, directory scan, backup roundtrip, traversal protection and WebDAV loopback tests. Actual Windows Electron launch/packaging and game compatibility require Windows machine/runner testing. No closed-source games were downloaded or executed in research.
