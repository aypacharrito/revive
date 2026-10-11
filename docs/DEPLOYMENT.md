# REVIVE — GitHub, Vercel and desktop deployment

## GitHub

Keep desktop and cloud sources in one GitHub repository (monorepo). Do **not** upload Windows game directories or access tokens. Use a private GitHub repository for early experiments if you wish to restrict source access.

1. Create a **private** repository, e.g. `revive-launcher`, in your GitHub account (or explicitly change the existing `revive` repository from public to private).
2. Unzip the project. Open the folder in GitHub Desktop and select **Repository → Publish repository**, unchecking public visibility.
3. Push source (ignore build folders and `.env` files). On GitHub select **Actions → Windows launcher build**. Artifacts from successful runs contain the unsigned Windows installer.
4. This starter cannot automatically create a new private repository via the connected GitHub actions available in ChatGPT. The existing `aypacharrito/revive` repository was found to be **empty and public** on October 10, 2026; no code was published there during this task.

## Vercel

Create a different Vercel project from the `cloud/` directory; do not deploy the Electron client as a Vercel website and do not use Vercel Functions to relay gameplay packets.

Configure `OPENAI_API_KEY` and `REVIVE_OWNER_TOKEN` as sensitive server secrets. Generate a random owner token of 32+ characters. Avoid sharing it with friends. This owner-only API has no per-user rate limits and is not public-production ready.

The existing `cloud/api/diagnose.js` analyzes capped local game inventories. `cloud/api/code-review.js` analyzes opt-in, bounded source text; no automatic binary decompilation or AI patch application.

## Cloud storage

Choose a separate HTTPS WebDAV account/app-password. Large saves are sent directly from the desktop application to your WebDAV endpoint; OpenAI and Vercel never receive save archives. The archives are not end-to-end encrypted at rest by REVIVE v0.2.

## What not to deploy

- Do not put copyrighted game installers, game directories, or private license keys into the repo.
- Do not publish a Cloud API owner bearer token in JavaScript or README examples.
- Do not claim that a lobby service or one-click link makes unsupported PC games multiplayer.
- Do not distribute unsigned installers or community modifications to strangers without verification, review, and appropriate rights.
