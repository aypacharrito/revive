# REVIVE v0.9: Make the website download and donation buttons live

## What changed
The public website will never route an unavailable installer button to GitHub source or an empty Releases page. Once a publicly downloadable `REVIVE-Setup-*.exe` is attached to a GitHub Release in `aypacharrito/revive`, the download button switches automatically to the real `.exe` asset. It checks the latest 20 releases and excludes drafts and missing/suspiciously tiny files. Nothing in this folder alone is a compiled Windows installer.

## Publish a Windows installer
**The preferred public release is signed.** Add `WINDOWS_SIGNING_PFX_BASE64` and `WINDOWS_SIGNING_PFX_PASSWORD` to the GitHub `desktop-release` environment, with required reviewer approval. Increment `desktop/package.json` version and push a matching tag `vX.Y.Z` to trigger `.github/workflows/windows-release.yml`. This workflow tests, builds and publishes `REVIVE-Setup-X.Y.Z.exe` with the updater's `latest.yml`. The website then detects it automatically. Do not create the tag until the signing credentials and `desktop-release` approval are configured.

**Optional unsigned test installer:** GitHub Actions `Windows launcher build` runs on Windows and uploads a temporary installer as a workflow artifact, for owner testing. That is **not** the same thing as a signed public release and is not linked from the public site. Unsigned executables may trigger SmartScreen warnings.

## Configure donations (only monetization)
Create a REVIVE-specific voluntary contribution Payment Link in an authorized Stripe account or PayPal account. Set Vercel project's **DONATION_URL** environment variable to the actual HTTPS `https://buy.stripe.com/...` or supported PayPal link, and redeploy. `/api/donation-config` validates the hostname before returning the link. Never put Stripe secret keys or an unrelated company's payment link in the website. If it's not set, the donation CTA states that donations are unavailable rather than opening a fake checkout.

## Vercel
Project Root Directory should be `cloud` for the API+website deployment. Framework = Other. `cloud/vercel.json` declares `public` as the static output folder. If your Vercel project is at repository root, root `vercel.json` declares `public` too; this serves the website, but not the cloud API (so use `cloud` root for donations and multiplayer). Confirm `https://YOUR-DOMAIN/` displays the site and `/api/donation-config` returns JSON.

## GitHub Desktop workflow
Extract ZIP to Downloads, double-click `RUN_NOW.bat`, paste the local GitHub repository folder, type IMPORT, then review and commit/push. No need to run the Electron app to upload source. `RUN_NOW` does not delete your game files, `.git`, or `.env` values.
