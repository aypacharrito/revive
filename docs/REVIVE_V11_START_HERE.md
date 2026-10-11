# REVIVE v1.1 installation + universal cloud guide

## Actual Windows EXE
The new `GET_REVIVE_EXE.bat` downloads the actual installer once the GitHub Windows preview release has published it. It verifies the expected asset size and SHA-256 checksum when present. It does not execute the downloaded installer automatically.

The zip is source and a GitHub Desktop import script, **not a precompiled installer**.
Use `RUN_NOW.bat` to import it, commit, push to `main`, then open [GitHub Actions](https://github.com/aypacharrito/revive/actions/workflows/windows-preview.yml). The Windows workflow runs on `push` when desktop files change or click **Run workflow**. Once successful, find the unsigned but real `REVIVE-Setup-1.1.0.exe` in [GitHub Releases](https://github.com/aypacharrito/revive/releases). Preview installers can show Windows Defender SmartScreen warnings. Do not disable your protection; confirm the source before running. Signing is recommended for a public release.
Alternatively double-click `RUN_INSTALLER_NOW.bat` in the extracted folder **on Windows** with Node.js LTS installed; it builds a real installer in `desktop/dist`.

## Universal network
The desktop automatically requests `GET /api/client-config` from `https://revive-omega-five.vercel.app` to get only the public Supabase project URL and publishable key. No friend needs an owner token, Redis token, or database secret. Vercel must deploy with **Root Directory = `cloud`** so `/api/client-config`, `/api/catalog`, `/api/presence`, and the website all work. If the cloud is offline, social login shows an error and can be overridden in advanced Settings.
Supabase must be on and player accounts still must be verified before Chat works. RLS is active. Upstash holds online presence for 110 seconds; Supabase persists friends/chat across restarts.

## Game library downloads
Cloudflare R2 is **not yet provisioned** by this ZIP. Once the owner configures an authorized R2 bucket and Vercel server environment variables `R2_ACCOUNT_ID`,`R2_ACCESS_KEY_ID`,`R2_SECRET_ACCESS_KEY`,`R2_BUCKET`, users may browse published catalog entries and obtain time-limited signed downloads. The signed transfer verifies SHA-256 and does not execute packages.
`PUBLISH_AUTHORIZED_GAME.bat` publishes a local file with rights verification. `PUBLISH_AUTHORIZED_LINK.bat` fetches a **direct HTTPS package link to the owner's own computer** first, confirms its size, and then uploads it to R2. Sharing pages from Google Drive/MediaFire may return HTML or require a confirmation; they cannot be magically transformed into direct archive links. Download a package you have rights to distribute manually if needed. Do not use REVIVE to rehost copyrighted games without permission.

## Speed
R2 offloads distribution from Google Drive or other source sites after uploading once. Transfer speed depends on players' internet, R2 networking and configuration; Steam-like speed cannot be guaranteed. The launcher shows progress and verifies complete downloads.
