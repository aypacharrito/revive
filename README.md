# REVIVE 1.2

REVIVE is a Windows game library inspired by Steam and Xbox: recent games, a clear Play action, favorites, save protection, friends, consoles, and verified downloads.

## Install the finished app

The accompanying **REVIVE-Setup-1.2.0.exe** is a real Windows x64 installer built and tested locally. Double-click it to install REVIVE. The EXE is delivered separately from this source ZIP; no source import or build is needed to use it. Its SHA-256 sidecar identifies the exact delivered installer.

This is an unsigned preview. Code signing and a public 1.2 GitHub release are still pending. The official [GitHub Releases page](https://github.com/aypacharrito/revive/releases) may show an older version until the new release is published.

## What changed

- A recent-game hero and Jump back in shelf make returning to a game easy. Favorites, platform filters, sorting, and search work together.
- Download history survives restart. R2 transfers can pause and resume, obtain fresh signed URLs, validate ranges, and verify SHA-256 before completion. Manual downloads can retry from the beginning.
- Artwork and progress indicators render under the app's security policy. Cloud settings now save correctly. Duplicate game launches are blocked and short sessions no longer add a phantom minute.
- A branded Windows icon, supported Electron runtime, dependency lockfiles, and repeatable Windows build jobs make packaging reliable.
- The website update fixes `/download`, checks the official installer through a cached backend endpoint, and keeps GitHub Releases accessible when that check fails.

## Update the existing GitHub Desktop repository

1. Extract **REVIVE-1.2-Source-Update.zip**.
2. Double-click **RUN_NOW.bat** in its extracted folder.
3. Paste your existing GitHub Desktop repository folder path and press **Enter**.
4. Review the changes in GitHub Desktop, commit, and push when ready.

The folder path is the only importer prompt. Changed originals are backed up outside the repository. Personal game files, local credentials, and Git history are preserved. Source import does not publish the website or run the installer.

## Connected services

Supabase provides accounts, friends, and messages. Upstash provides presence. Those services are configured on the existing backend, but social use across two signed-in players still needs validation.

Cloud game packages need Cloudflare R2, which has not been configured. See [R2 setup](docs/R2_SETUP.md). Local imports and local save backup/restore work independently. AI diagnostics need a configured owner backend key. Emulator cores and game files must be supplied separately.

The accompanying verification report records exactly what passed and what remains pending. See [start here](docs/REVIVE_V12_START_HERE.md) for development and release steps.
