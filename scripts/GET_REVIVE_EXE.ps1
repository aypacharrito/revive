# Download the real published REVIVE Windows installer from the official GitHub repository.
# Never downloads or executes source archives; never runs the downloaded EXE automatically.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$repo = 'aypacharrito/revive'
$api = "https://api.github.com/repos/$repo/releases?per_page=30"
Write-Host 'REVIVE | OFFICIAL WINDOWS INSTALLER' -ForegroundColor Cyan
Write-Host 'Looking for a verified EXE release from github.com/aypacharrito/revive ...'
try {
  $releases = @(Invoke-RestMethod -Uri $api -Headers @{'User-Agent'='REVIVE-Windows-Installer-Downloader';'Accept'='application/vnd.github+json'} -TimeoutSec 30)
} catch {
  throw 'GitHub releases cannot be checked at the moment. Check your internet connection.'
}
$selected = $null
foreach ($release in $releases) {
  if ($release.draft) { continue }
  foreach ($item in $release.assets) {
    if ($item.name -match '^REVIVE-Setup-[0-9A-Za-z._-]+\.exe$' -and $item.size -gt 3000000 -and $item.browser_download_url -match '^https://github\.com/aypacharrito/revive/releases/download/') {
      $selected = @{release=$release;asset=$item}
      break
    }
  }
  if ($selected) { break }
}
if (-not $selected) {
  Write-Host 'No Windows installer is published yet.' -ForegroundColor Yellow
  Write-Host 'First run RUN_NOW.bat, commit and Push origin in GitHub Desktop.'
  Write-Host 'Then wait for the Windows preview build under GitHub > Actions.'
  Write-Host 'Workflow: https://github.com/aypacharrito/revive/actions/workflows/windows-preview.yml'
  exit 2
}
$asset = $selected.asset
$downloads = Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads'
[IO.Directory]::CreateDirectory($downloads) | Out-Null
$out = Join-Path $downloads $asset.name
$part = "$out.partial"
if (Test-Path -LiteralPath $part) { Remove-Item -LiteralPath $part -Force }
Write-Host ("Found " + $selected.release.tag_name + ' / ' + $asset.name)
Write-Host ('Downloading to: ' + $out)
try {
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $part -MaximumRedirection 10 -TimeoutSec 1200 -UseBasicParsing
  $actualLength = (Get-Item -LiteralPath $part).Length
  if ($actualLength -ne [long]$asset.size) { throw "File size mismatch: expected $($asset.size), downloaded $actualLength." }
  # An optional checksum is provided by the v1.1 preview workflow.
  $sumAsset = @($selected.release.assets | Where-Object { $_.name -eq ($asset.name + '.sha256') }) | Select-Object -First 1
  $hash = (Get-FileHash -LiteralPath $part -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($sumAsset -and $sumAsset.browser_download_url -match '^https://github\.com/aypacharrito/revive/releases/download/') {
    $checksumText = (Invoke-WebRequest -Uri $sumAsset.browser_download_url -TimeoutSec 30 -UseBasicParsing).Content
    $expected = [regex]::Match([string]$checksumText, '^[A-Fa-f0-9]{64}').Value.ToUpperInvariant()
    if (-not $expected -or $hash -ne $expected) { throw 'SHA-256 mismatch; refusing to use the downloaded installer.' }
    Write-Host 'SHA-256 checksum verified.' -ForegroundColor Green
  } else {
    Write-Host ('SHA-256 (check against release): ' + $hash)
  }
  Move-Item -LiteralPath $part -Destination $out -Force
} catch {
  if (Test-Path -LiteralPath $part) { Remove-Item -LiteralPath $part -Force }
  throw
}
Write-Host ('READY: ' + $out) -ForegroundColor Green
Write-Host 'This is an unsigned preview build. Check its publisher/source before installation.'
Start-Process explorer.exe -ArgumentList ('/select,"' + $out + '"')
