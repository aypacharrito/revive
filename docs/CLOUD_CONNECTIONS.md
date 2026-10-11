# REVIVE v0.7: GitHub + Vercel + Supabase + Upstash + Cloudflare R2

This is a **guided setup**, not an automatic provisioning system. Connecting cloud providers may require signing into accounts, authorizing integrations, and selecting paid or free plans. Never place secrets in a GitHub commit, desktop installer, chat, or screenshot.

## Architecture

| Component | Runs at | Stores / does |
|---|---|---|
| Windows REVIVE | Your PC and each friend's PC | Imported local games, emulator settings, GUI, launches games |
| GitHub Desktop | Your PC | Source version control, GitHub push; not the launcher runtime |
| Vercel | Cloud Functions, root directory **`cloud`** | OpenAI proxy, catalog listing and signed download links, authenticated online presence API |
| Supabase Auth + Postgres | Supabase | Permanent player identities, handles, friend requests, friendships, messages |
| Upstash Redis | Redis via Vercel | **Temporary online status**, 110-second TTL; future lobbies/ephemeral sessions; not permanent friend/chat database |
| Cloudflare R2 | Object storage | Game archives **with redistribution rights**, metadata manifests |
| WebDAV | Optional separate provider | Save backups (current implementation); independent from R2 game hosting |
| Stripe Payment Links | Optional | Voluntary REVIVE support. Never tie payment to unauthorized copies |

The default Supabase schema is in `cloud/sql/social.sql` and already uses row-level security. Do not replace permanent friends/messages with keys that have expiry. Redis is for inexpensive online indicators and temporary sessions.

## Step 0 — Import the repository code

1. Clone/open your existing REVIVE repo in GitHub Desktop; choose **Show in Explorer**.
2. Download and extract the `REVIVE_GITHUB_RUN_NOW_v0.7.zip` package into a *different* folder (e.g. Downloads).
3. Double-click **RUN_NOW.bat** in the extracted folder. Paste the *repository folder path*, such as `C:\Users\YOUR_NAME\Documents\GitHub\Revive`.
4. Review its preview. Type **IMPORT**. Previous versions of overwritten files are backed up under `Documents\REVIVE Backups\...`; `.git`, existing dependencies, local environment files and arbitrary local work are not removed.
5. In GitHub Desktop, review Changes, commit, then push to the GitHub remote. **RUN_NOW does not push code automatically.**
6. Review repository visibility before pushing sensitive source; never commit any secret.

If you want to **open the application**, use `START_REVIVE_APP.bat`. If you want the installable app in Windows Search, build/install using the existing installation helper or a verified installer. These are separate operations.

## Step 1 — Create Vercel cloud project

1. Open <https://vercel.com/new> and import your GitHub REVIVE repository.
2. Name the project `revive-cloud` (or another unused name).
3. Set **Root Directory to `cloud`**, not the project root. Choose Framework Preset **Other**. `cloud/api` has the API functions.
4. Deploy initially; missing optional services will show as not configured, which is expected.
5. Keep the assigned HTTPS production origin (e.g. `https://revive-cloud-...vercel.app`).
6. After adding integration environment variables, trigger a **new deployment**; existing deployments will not automatically absorb all env-var changes.

The public readiness endpoint is `GET https://YOUR-DEPLOYMENT/api/health`. It returns only `true/false` flags; it does **not** reveal keys, and doesn't prove that each provider is reachable. It is a configuration checklist, not a security audit.

## Step 2 — Supabase permanent friends, messages, and authentication

1. Create a project at <https://supabase.com/dashboard/projects>.
2. Open **SQL Editor**, run `cloud/sql/social.sql` from the repository. Review it before running. This enables profiles, friend request functions, chat access checks, and Row Level Security.
3. In Authentication, enable email confirmation and appropriate abuse/rate controls. Plan for account recovery and data retention before opening to strangers.
4. In REVIVE desktop Settings, enter the Supabase **Project URL** and its **publishable/anon** key. Never enter a `service_role`, `sb_secret_...`, or database administrator credential in a desktop app.
5. In Vercel, add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (same project) to the **Production** environment.
6. Each friend signs in on their own computer. Friends and messages persist in Supabase (they are **not** merely in the local UI).

## Step 3 — Upstash online friends and presence

1. In your Vercel project's **Storage / Marketplace**, install or connect **Upstash Redis**; choose a region geographically close to your players/backend and an appropriate plan. Official guide: <https://upstash.com/docs/redis/howto/vercelintegration>.
2. Add that database to your REVIVE Vercel project. Verify that Vercel has `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for production. If it injected differently named variables, configure these two names as aliases *inside Vercel Settings*.
3. Redeploy the Vercel project.
4. In REVIVE desktop Settings, set the same Vercel URL under the **Cloud Library API origin** (or the AI origin). Sign into Friends & Chat via Supabase.
5. REVIVE now calls `POST /api/presence` to set the current player's online state (110-second expiration) and `GET /api/presence?users=...` to query the state **only of accepted friends**. Online status is a best-effort indicator, not gameplay networking.

**Do not expose the Upstash token in the desktop app.** The server validates the user's Supabase access token before interacting with Redis. The friend relationships themselves remain in the relational database, so the online indicator never becomes the source of truth for friendship or authorization.

## Step 4 — Game cloud storage (Cloudflare R2)

1. Create an R2 bucket at <https://dash.cloudflare.com/>. Example: `revive-authorized-games`.
2. Generate a **bucket-scoped** S3-compatible API token and configure **only on Vercel**:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`
3. Redeploy Vercel, then use `PUBLISH_AUTHORIZED_GAME.bat` for a game you created, open-source redistributable package, public-domain work, or a title for which you hold explicit written distribution permission.
4. `GET /api/catalog` lists authorized releases and `/api/catalog-download` issues short-lived R2 download URLs. The desktop verifies SHA-256 after downloading. Automatic installer extraction and licensing/entitlement checks for private commercial games are **not finished**.

**Important:** Old, delisted, and abandoned commercial games generally remain copyrighted. Buying a copy does not license you to host copies for friends. The current shared game catalog is public and does not enforce per-user entitlements.

## Step 5 — Optional AI assistance

1. In <https://platform.openai.com/api-keys>, create an OpenAI API key. ChatGPT subscriptions do not include this API bill.
2. In Vercel only, add `OPENAI_API_KEY` and a random private `REVIVE_OWNER_TOKEN` (24+ characters).
3. In REVIVE desktop **on your own machine only**, set AI API Origin to the Vercel URL and Owner Token to the private owner token. Never distribute this token to friends.
4. AI diagnostics and source review remain deliberate owner actions, not a background agent that modifies users' game files.

## Step 6 — Optional support/payment

Use Stripe Payment Links if you want voluntary contributions for maintaining REVIVE. Configure through the desktop setting for Support REVIVE. Do not promise tax-deductible status and do not require a donation to access game files without redistribution permission.

## When something doesn't connect

- `GET /api/health` should return `services:{r2,upstash,supabase,ai}` status flags. This only reports whether required environment variables are set.
- `GET /api/catalog` requires the R2 variables and correctly configured bucket access.
- `POST /api/presence` requires both Supabase and Upstash, plus an actual Supabase **user bearer token** in Authorization. It is intentionally not a public endpoint.
- Friends remain available in Supabase even if Upstash is unavailable; online indicators disappear until Redis returns.
- Chat currently polls, and game networking is not restored by these cloud connectors. Multiplayer remains a separate per-game integration project.
- For a blank screen or installation issue, review Windows errors before distributing builds. These cross-service flows need end-to-end production tests.

## Sources

- <https://vercel.com/docs/marketplace-storage>
- <https://upstash.com/docs/redis/howto/vercelintegration>
- <https://upstash.com/docs/redis/howto/connect-with-upstash-redis>
- <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>
- <https://supabase.com/docs/guides/auth>
- <https://vercel.com/docs/deployments>
