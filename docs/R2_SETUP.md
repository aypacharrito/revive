# Enable REVIVE cloud games

REVIVE's cloud catalog needs a Cloudflare R2 bucket. No bucket or R2 credentials were created during this update.

## Create the bucket and credentials

1. Sign into your Cloudflare account and open **R2 Object Storage**. Activate R2 if necessary. Review the billing terms shown by Cloudflare; activation can require a billing method. See [Cloudflare's R2 setup](https://developers.cloudflare.com/r2/get-started/).
2. Create a private bucket named **revive-authorized-games**. This matches the example configuration. Public bucket access is unnecessary because REVIVE uses temporary signed download URLs.
3. Create R2 S3 API credentials restricted to this bucket. The backend lists catalog objects and signs downloads, so it needs **Object Read** permissions. Use a separate **Object Read & Write** credential for the owner publisher. See [Cloudflare API credentials](https://developers.cloudflare.com/r2/api/tokens/).
4. Copy the Cloudflare Account ID, access key ID, and secret access key into the appropriate provider settings. Keep secret values out of chats, GitHub, and the desktop app.

## Configure the hosted REVIVE project

In the existing Vercel **revive** project's environment settings, add these server-only variables for the environments you intend to test and deploy:

| Variable | Value |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare Account ID (32 hexadecimal characters) |
| `R2_ACCESS_KEY_ID` | Bucket-restricted backend read access key ID |
| `R2_SECRET_ACCESS_KEY` | Matching backend secret access key |
| `R2_BUCKET` | `revive-authorized-games` |

Redeploy after adding the values. `/api/health` reporting R2 configured only confirms the variables exist; a real catalog request also checks storage connectivity.

## Publish an authorized package

On the owner's PC, copy `cloud/.env.example` to `cloud/.env` and fill its four R2 variables using the separate publisher write credential. The `.env` file is excluded from Git and the source importer. Run **PUBLISH_AUTHORIZED_GAME.bat**, select a package, and provide the requested title and distribution-rights information. It calculates SHA-256, uploads the package, checks its remote size, and publishes a catalog entry.

Only publish packages you have permission to distribute. The bucket stores packages under `packages/<game-id>/<sha256>/<filename>` and metadata under `catalog/<game-id>.json`. Do not rename an existing package in storage without publishing matching metadata.

## Verify the complete flow

Open REVIVE's Cloud library, refresh, and download the newly published package. Pause the transfer, close REVIVE, reopen, and resume. The app should reacquire a signed URL, validate the byte range, and verify the final SHA-256. **Show file** should reveal the verified file. Downloaded executables are never automatically run.

If the catalog returns 503, check the bucket name, account ID, token permissions, and Vercel environment selection. If a resumed transfer reports a changed package, publish a distinct entry/version instead of replacing metadata during an active download.
