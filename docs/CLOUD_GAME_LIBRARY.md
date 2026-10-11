# REVIVE 0.6 — Authorized cloud-game library / optional support

## Status and intent
This build includes **source code** for an R2-backed catalog, owner-only multipart publisher, signed download URLs, an in-app catalog, SHA-256 verification, and an optional Stripe Payment Link. The R2 deployment and Stripe account are **not configured** automatically. These are not yet proven against a real Cloudflare R2 account or on Windows; source tests pass.

A public storefront hosting delisted commercial games is not automatically lawful. Buying a game, receiving a copy from a friend, or the game's servers closing does not transfer distribution rights. The uploader is responsible for confirming original ownership, public domain status, redistribution license, or written permission. REVIVE does not provide DRM circumvention.

## Architecture

- **Cloudflare R2**: private bucket holding `packages/<id>/<sha256>/<filename>` and `catalog/<id>.json`. Multipart upload supports large archives. Game files are *not* stored in a Vercel project, GitHub, or Upstash Redis.
- **Vercel**: `/api/catalog` lists published, vetted metadata. `/api/catalog-download?id=<id>` reads the metadata, verifies package size and returns a short-lived R2 signed GET URL. This prototype catalog is **public**; it is for material authorized for public distribution. It does not provide friends-only entitlements yet.
- **REVIVE Desktop**: safely shows catalog metadata and launches verified downloads when the user clicks Download game. It verifies SHA-256 before completing a download to Downloads/REVIVE. It does *not* silently execute archives or auto-install unfamiliar code.
- **Stripe**: optional pay-what-you-want Payment Link supports REVIVE generally; donations are not tied to game access. This is NOT a nonprofit tax-deductible gift unless separately qualified.
- **Supabase**: a separate social beta for user accounts, friends, and chat; not currently integrated into cloud-download entitlements.

## First-time owner setup

1. In Cloudflare, create an R2 bucket, e.g., `revive-authorized-games`, and an API token restricted to that bucket. Enable the account's billing settings as required. Keep the token private.
2. Create a separate Vercel project with root `cloud` and deploy the cloud directory. Add **server-side** environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. The cloud's OpenAI diagnostic variables are separate and optional.
3. On your **owner computer only**, copy `cloud/.env.example` to `cloud/.env` and set the same R2 values. Do not upload `.env` to GitHub. Double-click `PUBLISH_AUTHORIZED_GAME.bat`. It installs publisher dependencies on first use, asks for an authorized package, an appropriate rights category and reference, computes SHA-256, uploads using R2 multipart, verifies remote byte count, and publishes the catalog entry after the data upload completes.
4. In REVIVE Desktop, open Settings → Cloud library, enter your Vercel project origin, e.g. `https://your-revive-api.vercel.app`. Do **not** enter the R2 secret in the desktop app. Open Cloud Library → Refresh catalog.
5. Set up a **separate REVIVE Stripe account/business descriptor as appropriate** (don't reuse another project's live payment link without intending to). Create a Payment Link with customer-chosen amount; paste `https://buy.stripe.com/...` into REVIVE Settings. The Support screen opens Stripe's hosted page.

## Important limitations

- First version uploads one package per game entry. The owner prepares the package contents. The player must unpack or run legally distributed installers manually; REVIVE does not install or auto-run code. Do not publish an installer or executable that is not authorized.
- The catalog currently enumerates up to 250 entries. Larger libraries should use paginated indexed metadata and a database.
- A public catalog endpoint means anyone can ask for signed downloads for published material; **do not upload friends-only licensed files or private data**. Friends-only entitlement checks and account verification must come before private/restricted distribution.
- SHA-256 validates the downloaded bytes against the owner's published hash; it is not a malware scan, signature of authorship, or proof that redistribution rights exist.
- Download cancellation works; pause/resume, update deltas, game installation manifests, secure automatic extraction, signed publisher manifests, entitlement control, and downloads from multiple peers are future milestones.
- User-provided R2 presigned URLs may expire; start large downloads promptly. Background app updates remain a separate signed GitHub Release system.
- Never commit `.env`, service-role keys, R2 API credentials, game binaries, firmware, ROMs, or proprietary installers to GitHub.

## Project sources
Cloudflare R2: https://developers.cloudflare.com/r2/objects/upload-objects/
Signed downloads: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
Stripe customer-defined donation links: https://support.stripe.com/questions/how-to-accept-donations-through-stripe
