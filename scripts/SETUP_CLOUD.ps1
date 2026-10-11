# Guided setup only. Does not purchase services, install dependencies, or collect secrets.
$ErrorActionPreference = 'Continue'
$guide = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs\CLOUD_CONNECTIONS.md'
function heading([string]$name) { Clear-Host; Write-Host 'REVIVE / CLOUD CONNECTION WIZARD' -ForegroundColor Cyan; Write-Host ''; Write-Host $name -ForegroundColor White; Write-Host ('-' * 60) }
function next { Write-Host ''; [void](Read-Host 'Press ENTER to return to the menu') }
function openPage([string]$address){$a=(Read-Host 'Open the official setup page in your browser? (Y/n)').Trim();if($a -eq '' -or $a -match '^(y|yes)$'){Start-Process $address}}
while($true){
 heading 'Choose a setup step'
 Write-Host ' 1. Vercel - deploy the REVIVE cloud API'
 Write-Host ' 2. Supabase - accounts, permanent friends, and messages'
 Write-Host ' 3. Upstash Redis - online presence and lobby cache'
 Write-Host ' 4. Cloudflare R2 - authorized game downloads'
 Write-Host ' 5. OpenAI - optional AI diagnostics'
 Write-Host ' 6. Cloud health check (after deployment)'
 Write-Host ' 7. REVIVE desktop - connect public URLs and keys'
 Write-Host ' 8. Open complete deployment checklist'
 Write-Host ' 9. Exit'
 Write-Host ''
 $choice = (Read-Host 'Enter 1-9').Trim()
 switch($choice){
 '1' { heading '1 / Vercel'; Write-Host 'Create a new Vercel project; import the Revive GitHub repo.'; Write-Host 'CRITICAL: Set Root Directory to cloud (not the repository root).'; Write-Host 'Choose Framework: Other. Do not enter secrets into GitHub.'; Write-Host 'Keep the Vercel production URL for REVIVE desktop Settings.'; openPage 'https://vercel.com/new'; next }
 '2' { heading '2 / Supabase'; Write-Host 'Create a Supabase project and enable Email Authentication.'; Write-Host 'Run cloud/sql/social.sql in the Supabase SQL Editor.'; Write-Host 'Keep Project URL and PUBLISHABLE key for the desktop app.'; Write-Host 'Configure in Vercel: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.'; Write-Host 'NEVER use the Supabase service_role/secret key on desktops.'; openPage 'https://supabase.com/dashboard/projects'; next }
 '3' { heading '3 / Upstash'; Write-Host 'Vercel project > Storage/Marketplace > Add Upstash Redis.'; Write-Host 'Provision a serverless Redis database and connect it to REVIVE.'; Write-Host 'Confirm env vars: UPSTASH_REDIS_REST_URL and'; Write-Host 'UPSTASH_REDIS_REST_TOKEN on the Vercel project.'; Write-Host 'Redeploy the project after the integration is connected.'; Write-Host 'It stores online presence temporarily, not your permanent friend records.'; openPage 'https://vercel.com/marketplace?category=storage'; next }
 '4' { heading '4 / Cloudflare R2'; Write-Host 'Create an R2 bucket for YOUR OWN or REDISTRIBUTABLE games.'; Write-Host 'Create a restricted R2 API token with access to that bucket.'; Write-Host 'In Vercel set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,'; Write-Host 'R2_SECRET_ACCESS_KEY, and R2_BUCKET.'; Write-Host 'Never publish copyrighted games without distribution rights.'; openPage 'https://dash.cloudflare.com/'; next }
 '5' { heading '5 / OpenAI'; Write-Host 'Optional: create an API key under your OpenAI API account.'; Write-Host 'Add OPENAI_API_KEY only to Vercel environment variables.'; Write-Host 'Also set REVIVE_OWNER_TOKEN (private random secret 24+ chars).'; Write-Host 'OpenAI API usage is billed separately from ChatGPT.'; openPage 'https://platform.openai.com/api-keys'; next }
 '6' { heading '6 / Check deployed cloud'; $address=(Read-Host 'Paste your Vercel URL (https://...vercel.app)').Trim().TrimEnd('/');try{$parsed=[uri]$address;if($parsed.Scheme -ne 'https' -or !$parsed.Host){throw 'Invalid URL'};$response=Invoke-RestMethod -Method GET -Uri "$address/api/health" -TimeoutSec 15;Write-Host '';($response|ConvertTo-Json -Depth 4)|Write-Host;Write-Host 'true = environment values are present, not a live end-to-end service test.'}catch{Write-Warning "Unable to check this deployment: $_"};next }
 '7' { heading '7 / REVIVE desktop'; Write-Host 'Launch the app separately with START_REVIVE_APP.bat or an installer.'; Write-Host 'Open Settings and connect:'; Write-Host ' - Vercel URL in Cloud Library API origin'; Write-Host ' - Same Vercel URL in AI diagnostics origin'; Write-Host ' - Supabase Project URL and PUBLISHABLE key in Friends'; Write-Host ' - Your owner token ONLY on your own desktop (never friends)'; Write-Host ' - WebDAV optional: separate cloud saves'; Write-Host 'No Upstash token is ever entered in the desktop app.';next }
 '8' { heading 'Full guide'; if (Test-Path $guide){Start-Process $guide}else{Write-Host "Missing guide: $guide"};next }
 '9' { break }
 default { Write-Host 'Choose a number from 1 to 9.'; Start-Sleep -Milliseconds 600 }
 }
 if($choice -eq '9'){break}
}
