# REVIVE v1.0 — GitHub RUN NOW, Supabase connected, Windows installer workflow

**For importing to GitHub Desktop:** double-click `RUN_NOW.bat`, paste `C:\Users\YOURNAME\Documents\GitHub\Revive`, type `IMPORT`, and push in GitHub Desktop. This does NOT start Electron.

**To build/install REVIVE as a real Windows application:** double-click `INSTALL_REVIVE_WINDOWS.bat`. Node.js with npm is required; the build runs locally on **Windows** and generates an `.exe` in `desktop/dist`. This source ZIP does NOT itself contain a prebuilt `.exe`.

**For the cloud setup and verified live Supabase connection:** read [`docs/SUPABASE_AND_INSTALLER.md`](docs/SUPABASE_AND_INSTALLER.md). The live REVIVE Supabase account/chat/friends tables are created with RLS. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` have been added to the REVIVE Vercel project. Upstash still requires a dedicated Redis connection.

The rest of the v0.9 desktop launcher, website, API, and GitHub workflows are preserved. This folder does not contain proprietary commercial games or console ROMs.
