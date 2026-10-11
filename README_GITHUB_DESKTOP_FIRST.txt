REVIVE v0.8 - PUBLIC DOWNLOAD WEBSITE INCLUDED

1. Double-click RUN_NOW.bat in the extracted update package.
2. Paste the full path to your existing REVIVE GitHub Desktop clone.
3. Type IMPORT; then in GitHub Desktop COMMIT and PUSH.
4. Vercel will redeploy the website if your GitHub integration is configured.
5. Website 404? See docs/WEBSITE_DEPLOYMENT.md for Vercel Root Directory / public folder settings.

The website DOES NOT yet contain a live Windows .exe until a GitHub Release installer is published. Donation link is deliberately inactive until you provide one.

REVIVE / GITHUB DESKTOP - THE CORRECT RUN NOW
============================================

IN THE EXTRACTED REVIVE PACKAGE (not inside GitHub repo):

Double-click RUN_NOW.bat
Paste C:\Users\YOUR_NAME\Documents\GitHub\Revive
Type IMPORT after reviewing the number of files.

This copies all updated source code into that GitHub repository and backs
up changed files to Documents\REVIVE Backups\.
It does NOT install packages, run REVIVE, create releases, push commits,
or automatically change anything on Vercel.

THEN: Open GitHub Desktop > Review Changes > Commit > Push origin.

For the cloud connections, double-click SETUP_CLOUD.bat.
For the actual game launcher, use START_REVIVE_APP.bat.
For details, see docs/CLOUD_CONNECTIONS.md.
