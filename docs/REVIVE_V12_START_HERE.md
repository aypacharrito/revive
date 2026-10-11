# REVIVE 1.2 start here

For players, run the separately delivered **REVIVE-Setup-1.2.0.exe**. This source folder is for maintaining REVIVE, not a prerequisite for installation.

## Development

Use Node.js 22 or 24 on Windows. In `desktop`, run `npm ci`, `npm test`, and `npm start`. Build with `npm run dist:win` or the root **RUN_INSTALLER_NOW.bat**. The installer appears at `desktop/dist/REVIVE-Setup-1.2.0.exe`. This build explicitly uses `--publish never`.

In `cloud`, run `npm ci` and `npm test`. Run `node scripts/test_website.mjs` from the repository root. Lockfiles are included and Windows workflows use `npm ci`.

## Hosted website

The existing REVIVE project uses `cloud` as its Vercel root and `public` as its output directory. The reviewed update includes a `/download` rewrite and `/api/installer`, which reads the official public GitHub release list. Storage and social secrets stay in Vercel environment variables.

Test a preview before production. Check `/download`, `/api/health`, `/api/config`, `/api/installer`, and `/api/catalog`. A 503 from catalog is expected while R2 is missing; it must not be represented as a ready cloud library. The installer endpoint will continue returning the published 1.1 installer until a 1.2 release exists.

## Public release

The GitHub integration rejected writes during preparation; these changes have not been pushed. Review and push with GitHub Desktop after source import, or reconnect a GitHub integration that can write to `aypacharrito/revive`. The Windows preview workflow tests and builds the installer, writes a checksum, and publishes an unsigned prerelease.

Use code signing for production distributions and validate the signed update feed before enabling a production release. Do not label the local installer as a signed public release. The local EXE has been built and its packaged app tested, but installation/uninstallation across multiple clean Windows computers remains a release check.

## Remaining service checks

- Configure R2 using [R2_SETUP.md](R2_SETUP.md), publish a package you may redistribute, and test a real interrupted/resumed download against the deployed backend.
- Verify signup, invitation acceptance, messaging, sign-out, and presence with two real accounts on separate devices.
- Test each supported emulator with its own supplied executable/core and a permitted game. REVIVE does not bundle emulators or promise compatibility for every title.
- Configure the AI backend if wanted, then validate a user-approved diagnostic request. No owner API keys belong in the app or source ZIP.
