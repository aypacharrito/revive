# REVIVE console emulation architecture · October 10, 2026

## Implemented

- Console import is local and stores only the selected path, platform, title, and launcher metadata. Nothing is uploaded or decrypted.
- Explicit platform and file-extension allowlists; no arbitrary shell command template and no shell execution. Separate binary-picker and RetroArch core-picker are user initiated.
- Launch arguments are assembled from approved adapters and passed as argument arrays to `spawn(..., {shell:false})`.
- One unified REVIVE library for PC and console games, with artwork, favorites, playtime, save directory linking and optional WebDAV backups.
- The Consoles page reflects missing engine/core files; GPU vendor identification is informational. Select graphics settings in each emulator, with Automatic as the initial default.
- 13 systems; 6 integration engines, none bundled. No native emulator code was copied into REVIVE.

## Engine mapping (official sources)

| REVIVE system | Engine | Source/documentation | Launch model |
| --- | --- | --- | --- |
| GB/GBC/GBA/NES/SNES/Genesis/N64 | RetroArch | https://docs.libretro.com/guides/cli-intro/ | retroarch.exe -L core.dll game.ext |
| PS1 | DuckStation | https://github.com/stenzek/duckstation/wiki/Command-Line-Arguments | duckstation.exe -batch -fullscreen -- game.cue |
| PS2 | PCSX2 | https://pcsx2.net/docs/advanced/cli/ | pcsx2-qt.exe -batch -fullscreen -- game.iso |
| PS3 | RPCS3 | https://rpcs3.net/ | rpcs3.exe --no-gui EBOOT.BIN (may require format-specific configuration; test with your game) |
| Original Xbox | xemu | https://xemu.app/docs/cli/ | xemu.exe -full-screen -dvd_path game.iso |
| GameCube/Wii | Dolphin | https://github.com/dolphin-emu/dolphin/blob/master/Readme.md | Dolphin.exe --batch --exec game.iso |

**Emulator prerequisites and caveats:** RetroArch must have the correct core; PS1/PS2 and PS3 often need system firmware configured legally and independently; xemu requires specific system files and configuration, documented at https://xemu.app/docs/required-files/ . Some ISO formats aren't compatible with every emulator. RPCS3 launches and compatibility differ by title; the first adapter is experimental and must be tested on Windows. Users should install official releases and respect third-party licenses; particularly, DuckStation imposes restrictions on modified redistributions, so REVIVE never bundles or modifies it.

## GPU performance

- NVIDIA GeForce/RTX and AMD Radeon use the emulator's Vulkan/Direct3D/OpenGL graphics backends. REVIVE does not render the emulator's game graphics itself and cannot guarantee 0 lag.
- PCSX2 recommends *Automatic* graphics selection when unsure: https://pcsx2.net/docs/configuration/general/ . Vulkan may be excellent on both NVIDIA and AMD, but the correct choice is emulator/game-specific.
- RPCS3 can be CPU intensive. High GPU specifications don't guarantee compatible or high-speed PS3 emulation; see https://rpcs3.net/quickstart .
- Monitor frame pacing, shader compilation stutter, and CPU bottlenecks before changing settings. For users with iGPUs and discrete GPUs, Windows Graphics Settings can select a preferred high-performance GPU per emulator executable.

## Nintendo Switch: not auto-integrated

Yuzu's original development was shut down in March 2024, and Ryujinx development ended in October 2024 after contact from Nintendo. Nothing in REVIVE supports decrypting Switch packages, fetching Nintendo firmware, keys or downloads. Purchasing a physical or digital game does not by itself guarantee you can lawfully transfer and use the game file elsewhere. Do not treat an obsolete emulator binary or unofficial fork as a verified supported integration.

Reference: https://www.theverge.com/2024/10/1/24259791/nintendo-ryujinx-switch-emulator-gdkchan-removed-downloads-github

## Not included

- Game content, BIOS/firmware, keys, emulator engines, console jailbreaks, backup instructions that circumvent protections.
- Dedicated multiplayer relay / Netplay integration. Launching an emulator is not the same as making a formerly offline game online. RetroArch has optional netplay for certain cores, but cannot apply universally; PS3 and Xbox emulators have their own limitations.
- Automatic emulator installation/configuration, per-game graphics profiling, cross-device save-conflict handling.

## Planned next tests on Windows

1. Double-click RUN_NOW.bat with and without Node.js installed. Confirm first-run install and startup.
2. Configure official RetroArch + mGBA core; import a legal homebrew GB/GBA file; launch, exit, reopen and verify library persistence.
3. Configure PCSX2, DuckStation, Dolphin and xemu, verifying their officially documented flags with legal user-supplied test games.
4. RPCS3 boot path verification and game compatibility checks; no promise of broad support.
5. Benchmark on NVIDIA and AMD systems, comparing emulator Automatic vs Vulkan/D3D with CPU/GPU telemetry.
