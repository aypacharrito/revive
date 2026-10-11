# REVIVE GitHub Desktop import. No build, install, or git-push operations.
[CmdletBinding()]
param(
  [string]$Destination,
  [string]$SourceOverride
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$source = if ($SourceOverride) { (Resolve-Path -LiteralPath $SourceOverride).Path } else { (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path }
$source = [IO.Path]::GetFullPath($source).TrimEnd([IO.Path]::DirectorySeparatorChar)
function Normalize-Destination([string]$entered) {
  $entered = $entered.Trim().Trim('"').Trim("'")
  if (-not $entered) { throw 'A destination path is required.' }
  $entered = [Environment]::ExpandEnvironmentVariables($entered)
  if ($entered -match '^~[\\/]') { $entered = Join-Path $HOME $entered.Substring(2) }
  if ($entered -match '^(Documents|Desktop)[\\/]') { $entered = Join-Path $HOME $entered }
  if (-not [IO.Path]::IsPathRooted($entered)) {
    # When a bare folder name is used, GitHub Desktop normally stores it in Documents/GitHub.
    $entered = Join-Path (Join-Path $HOME 'Documents\GitHub') $entered
  }
  return [IO.Path]::GetFullPath($entered).TrimEnd([IO.Path]::DirectorySeparatorChar)
}
Write-Host ''
Write-Host 'REVIVE / GITHUB DESKTOP IMPORT' -ForegroundColor Cyan
Write-Host 'This copies code only. No npm, Electron, Vercel deployment, git commit, or push.'
Write-Host 'Example: C:\Users\YOUR-NAME\Documents\GitHub\Revive'
if (-not $Destination) { $Destination = Read-Host 'Paste the GitHub Desktop repository folder path' }
$dest = Normalize-Destination $Destination
Write-Host ('Destination: ' + $dest)
if ($dest -eq $source -or $dest.StartsWith($source + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or $source.StartsWith($dest + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'The destination cannot be the extracted REVIVE source folder or its parent/child.'
}
if (-not (Test-Path -LiteralPath $dest -PathType Container)) { throw 'Folder not found. Create or clone the repository with GitHub Desktop first, then run this importer again.' }
if (-not (Test-Path -LiteralPath (Join-Path $dest '.git'))) {
  throw 'This folder is not a Git repository. In GitHub Desktop, choose File > Add Local Repository / Create a repository here, and then run RUN_NOW again.'
}
# Never copy local credentials, build results, Git metadata, node_modules, or existing backups.
$blocked = @('.git','.vercel','node_modules','dist','out','.next','.cache','coverage','_REVIVE_BACKUPS')
$excludedSuffixes = @('.env','.env.local','.env.production','.env.development')
$sourceFiles = @(Get-ChildItem -LiteralPath $source -Recurse -File -Force | Where-Object {
  $rel = $_.FullName.Substring($source.Length + 1)
  $parts = $rel -split '[\\/]'
  if (@($parts | Where-Object { $blocked -contains $_ }).Count -gt 0) { return $false }
  if ($_.Name -in $excludedSuffixes) { return $false }
  if ($_.Name -match '^\.env\.(?!example$)') { return $false }
  if ($_.Name -match '\.(log|exe|dll|iso|rom|pak)$') { return $false }
  return $true
})
$updates = @(); $newFiles = @(); $unchanged = 0
foreach ($f in $sourceFiles) {
  $rel = $f.FullName.Substring($source.Length + 1)
  $target = Join-Path $dest $rel
  if (Test-Path -LiteralPath $target -PathType Leaf) {
    $oldHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    $newHash = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash
    if ($oldHash -eq $newHash) { $unchanged++; continue }
    $updates += [pscustomobject]@{Rel=$rel; Src=$f.FullName; Dest=$target}
  } else { $newFiles += [pscustomobject]@{Rel=$rel; Src=$f.FullName; Dest=$target} }
}
Write-Host ''
Write-Host ('New: ' + $newFiles.Count + '  |  Updated: ' + $updates.Count + '  |  Unchanged: ' + $unchanged) -ForegroundColor Cyan
Write-Host 'Your .git, untracked files, .env, local dependencies, and game files are preserved.'
Write-Host 'Unreferenced old project files are NOT deleted.'
if ($newFiles.Count -eq 0 -and $updates.Count -eq 0) { Write-Host 'Already up to date.' -ForegroundColor Green; exit 0 }
# The validated repository path is the only prompt. Begin copying immediately.
$backup = $null
if ($updates.Count -gt 0) {
  # Place backups outside the Git repository so they cannot be accidentally pushed.
  $safeRepo = [IO.Path]::GetFileName($dest) -replace '[^a-zA-Z0-9_-]','_'
  $backupBase = Join-Path (Join-Path $HOME 'Documents\REVIVE Backups') $safeRepo
  $backup = Join-Path $backupBase (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
  New-Item -ItemType Directory -Path $backup -Force | Out-Null
  foreach ($item in $updates) {
    $out = Join-Path $backup $item.Rel
    New-Item -ItemType Directory -Path (Split-Path -Parent $out) -Force | Out-Null
    Copy-Item -LiteralPath $item.Dest -Destination $out -Force
  }
  Write-Host ('Backup of changed files: ' + $backup) -ForegroundColor DarkCyan
}
$done = 0
try {
  foreach ($item in @($updates) + @($newFiles)) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $item.Dest) -Force | Out-Null
    Copy-Item -LiteralPath $item.Src -Destination $item.Dest -Force
    $done++
  }
} catch {
  Write-Warning ('An error occurred after copying ' + $done + ' files. Changed originals are backed up at ' + $backup)
  throw
}
Write-Host ''
Write-Host ('SUCCESS! Copied ' + $done + ' source files into ' + $dest) -ForegroundColor Green
if ($backup) { Write-Host ('Backup: ' + $backup) }
Write-Host 'NEXT: Open GitHub Desktop > Revive > review Changes > commit > Push origin.' -ForegroundColor Yellow
Write-Host 'NEXT: Double-click SETUP_CLOUD.bat to connect the hosted services.'
