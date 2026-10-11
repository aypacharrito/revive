REVIVE v0.7 - QUICK START FOR GITHUB DESKTOP
==========================================

You asked for the Pacifica-style RUN NOW importer.

1. Download/extract the ENTIRE REVIVE_GITHUB_RUN_NOW_v0.7.zip package.
2. In GitHub Desktop, open your REVIVE repository > Show in Explorer.
3. Copy the full folder path, like C:\Users\YOUR_NAME\Documents\GitHub\Revive.
4. In the EXTRACTED ZIP folder, double-click RUN_NOW.bat.
5. Paste the repository path. Check the file counts. Type IMPORT.
6. Go back to GitHub Desktop, review changes, commit, and push.

RUN_NOW.bat copies source only. It DOES NOT launch REVIVE, install Node,
install Electron, commit or push code, or provision cloud services.
A backup of overwritten source files is saved outside your repository.

TO OPEN REVIVE: double-click START_REVIVE_APP.bat instead.
TO CONNECT CLOUD: double-click SETUP_CLOUD.bat, then follow the prompts.
TO BUILD INSTALLER: use BUILD_WINDOWS_INSTALLER.bat.

NEVER put Upstash Redis tokens, R2 secrets, OpenAI API keys, or a Supabase
service_role key in GitHub. Configure backend secrets in Vercel settings.

See docs/CLOUD_CONNECTIONS.md for the full step-by-step cloud setup.
