# Windows setup — run from an *Administrator* PowerShell in the repo folder:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
# Close Firefox first. Re-run after `git pull` (to refresh the toolbar styling) or after a Firefox update.
$ErrorActionPreference = "Stop"
$Admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $Admin) { throw "Run this from an administrator PowerShell: right-click the Start button, choose Terminal (Admin), then run it again." }
$Repo  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url   = ([System.Uri](Join-Path $Repo "index.html")).AbsoluteUri
$FF    = "$env:ProgramFiles\Mozilla Firefox"
if (-not (Test-Path $FF)) { $FF = "${env:ProgramFiles(x86)}\Mozilla Firefox" }
if (-not (Test-Path $FF)) { throw "Firefox install folder not found." }
$Prof  = Get-ChildItem "$env:APPDATA\Mozilla\Firefox\Profiles" -Directory |
         Where-Object Name -like "*.default-release" | Select-Object -First 1
if (-not $Prof) { throw "No *.default-release Firefox profile found - open Firefox once, then re-run." }

Write-Host "New tab page: $Url"
Write-Host "Profile:      $($Prof.FullName)"

# 1. autoconfig (new tab + homepage + focus fix) — written without a BOM so Firefox reads it
New-Item -ItemType Directory -Force "$FF\defaults\pref" | Out-Null
Copy-Item "$Repo\firefox\autoconfig.js" "$FF\defaults\pref\autoconfig.js" -Force
$cfg = (Get-Content "$Repo\firefox\autoconfig.cfg" -Raw).Replace("__NEWTAB_URL__", $Url)
[System.IO.File]::WriteAllText("$FF\autoconfig.cfg", $cfg, (New-Object System.Text.UTF8Encoding $false))

# 2. toolbar styling (skipped if you left it out in the builder)
if (Test-Path "$Repo\firefox\userChrome.css") {
  New-Item -ItemType Directory -Force "$($Prof.FullName)\chrome" | Out-Null
  Copy-Item "$Repo\firefox\userChrome.css" "$($Prof.FullName)\chrome\userChrome.css" -Force
}

# 3. preferences (only adds lines that aren't there yet)
$UserJs = "$($Prof.FullName)\user.js"
foreach ($line in (Get-Content "$Repo\firefox\user.js" | Where-Object { $_ -like "user_pref*" })) {
  if (-not (Test-Path $UserJs) -or -not (Select-String -Path $UserJs -SimpleMatch $line -Quiet)) {
    Add-Content -Path $UserJs -Value $line -Encoding ASCII
  }
}
Write-Host "Done - open Firefox."
