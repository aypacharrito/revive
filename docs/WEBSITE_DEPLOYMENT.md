# REVIVE v0.8 — Public website and Windows download

This is a **free desktop-app download website** modeled on the functional structure of Steam and Xbox's official download pages, with an original REVIVE design. There is no store, checkout, game purchase, or required payment.

## Upload using the existing RUN NOW workflow

1. Extract this ZIP outside your cloned `Revive` repository.
2. Double-click `RUN_NOW.bat` and paste the complete GitHub Desktop folder path (e.g., `C:\Users\YourUser\Documents\GitHub\Revive`).
3. Confirm `IMPORT`. The script backs up edited files and preserves your `.git` directory, `.env`, and untracked files.
4. GitHub Desktop → **Changes → Commit to main → Push origin**.
5. Vercel project → Deployments: wait for a **new** production deployment and open its assigned domain.

## Fixing the 404 on Vercel

Your existing source repository had no public website or root `index.html`; it only contained desktop code and `/cloud/api` functions. Vercel can deploy an API successfully but show 404 at `/` if no homepage is included.

The v0.8 package deliberately includes *both* placements:

- `public/index.html`, `public/styles.css`, `public/site.js` for a Vercel project whose Root Directory is the repository root.
- `cloud/public/index.html`, `cloud/public/styles.css`, `cloud/public/site.js` for a Vercel project whose Root Directory is `cloud` (preferred if it also hosts the API).

**Vercel settings:** Project → Settings → Build and Deployment. Framework Preset = **Other**. Root Directory = **cloud** (recommended if you are using the same project for `/api`), and leave default output behavior or use `public` as Output Directory if you have explicitly overridden it. No build command is required for this static landing page. If you want a *website-only* Vercel project, use Root Directory = repository root and its `public` folder.

Do not set the Vercel root to `desktop` for the public site. The Electron UI is not a deployable public website by itself.

## Installer button behavior

The site checks public GitHub Releases for an asset named `REVIVE-Setup-<version>.exe` and directs the button to that exact release asset when published. If there is no installer, it **does not pretend the app is downloadable**: the button opens the repository's Releases page and the page explains that a Windows build is not yet published. The secondary `Download source code` link is usable immediately.

The existing `.github/workflows/windows-build.yml` compiles a testable installer into an Actions artifact; that is **not** a public release asset. The separate `windows-release.yml` publishes installers only after signing secrets and tag/version settings have been configured. Do not claim a public installer has shipped until GitHub Releases actually shows an `.exe` downloadable by anonymous visitors.

## Donations, the only monetization

The website never asks people to pay for software, games, or services. It contains one optional **Support REVIVE** section. To make it work, create a verified donation-style payment link in your own payment provider account (for example Stripe Payment Links), then replace `const donationURL = '';` in **both** `public/site.js` and `cloud/public/site.js` with the actual HTTPS link. Do not paste Stripe secret keys into either file. The user may choose any contribution amount if configured in the provider. Until then the donation section explicitly says checkout isn't connected.

## Test locally

```bash
node scripts/test_website.mjs
python -m http.server 8899 --directory cloud/public
```

Visit `http://localhost:8899/`. The release status requires internet access and a public GitHub release API.

## Design boundaries

REVIVE is not affiliated with or endorsed by Valve or Microsoft, and doesn't embed their design assets. The hero application frame is a **conceptual mockup**, not a screenshot of a fully working friends/multiplayer feature. The launcher has a game library, emulator linking and local backups, but full game multiplayer restoration is still game-specific research. Only distribute game files you have rights to share.
