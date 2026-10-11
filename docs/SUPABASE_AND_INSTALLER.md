# REVIVE: Supabase and Windows installer setup

## Verified live configuration
The **existing REVIVE** Supabase project `zvmwxgesqsmtkzsaitlf` was found healthy. Its `public.profiles`, `public.friend_requests`, and `public.messages` tables were created with RLS, and friend-request RPC functions were restricted. No user accounts were created. The Vercel REVIVE project was configured with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (production, preview, development). This does not configure Redis, R2, or donation payments.

## Connect desktop friends and messages
In the REVIVE desktop program, open Settings → Friends / Cloud Chat. Enter:

- Supabase URL: `https://zvmwxgesqsmtkzsaitlf.supabase.co`
- Publishable key: open Supabase → revive → Project Settings → API Keys → **publishable** and copy the `sb_publishable_...` key. Do **not** use a secret/service_role key.

Click Save social settings. Open Friends → Create account, verify email if prompted, sign in, and then add your friend's @handle. Each friend uses their own account. In Supabase Authentication configure allowed application URLs, email verification, and sensible rate limits.

The schema uses RLS. Future schema changes should go through migrations and advisor checks. Database operations were performed directly on the existing project; you do not need to run the included SQL again against that same project.

## Upstash Redis for friends online status
Go to Vercel → revive → Storage → Connect Database → Upstash for Redis. Choose a **new** `revive-redis` database rather than either existing Pacifica database. Select a suitable region and understand any charges before confirming. REVIVE now also accepts the Vercel-injected `KV_REST_API_URL` and `KV_REST_API_TOKEN`, so you do **not** need to duplicate Redis credentials as aliases. Do not put the token in the Electron app. Redis stores short-lived online presence, **not** permanent friends/chat.

## Windows .EXE installer NOW on your own PC
**Importer (for GitHub Desktop):** extract ZIP outside your Git repo, double-click `RUN_NOW.bat`, paste the existing repository folder from GitHub Desktop → Show in Explorer, type `IMPORT`, commit, push.

**Windows application installer:** double-click `INSTALL_REVIVE_WINDOWS.bat` from the project folder. Node.js (npm) is required; get it from https://nodejs.org if missing. The helper installs Electron dependencies, runs tests, creates an NSIS installer at `desktop\dist\REVIVE-Setup-0.7.0.exe`, then asks if you wish to open it. The `.exe` is generated **on your Windows PC**; the ZIP itself is not a prebuilt binary. A Windows SmartScreen warning may appear because the build is unsigned.

**Automated Windows build in GitHub:** GitHub repository → Actions → **Windows launcher build** → Run workflow. On success open the run → Artifacts → `REVIVE-Windows-installer` to download the built EXE ZIP. Artifact downloads generally require GitHub access and are not a permanent public download link. This workflow is already included.

**Public downloadable installer from REVIVE website:** requires a **GitHub Release** containing `REVIVE-Setup-*.exe`, plus `latest.yml` for app updates. Existing signed release workflow requires code-signing certificate secrets and a matching Git tag. Until published the site should say 'Coming soon'; a Supabase connection alone does not make a public installer.

## Other Vercel variables still missing
- Upstash: REVIVE already has `KV_REST_API_URL` and `KV_REST_API_TOKEN` visible; verify they belong to your intended REVIVE Redis store. The code also supports `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- OpenAI diagnostics: `OPENAI_API_KEY`, `REVIVE_OWNER_TOKEN`
- Optional donations: `DONATION_URL` (REVIVE-specific verified Stripe/PayPal Payment Link)

Do not reuse CRM production Redis tokens or publish game archives without distribution permission.
