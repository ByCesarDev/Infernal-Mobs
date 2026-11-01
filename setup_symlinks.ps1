param(
    [switch]$Copy
)

# Target com.mojang folder for LeviLauncher Bedrock (1.26.51.01) with fallback detection
$leviMojang = Join-Path $env:APPDATA "levilauncher.exe\versions\1.26.51.01\Minecraft Bedrock\Users\Shared\games\com.mojang"
$roamingMojang = Join-Path $env:APPDATA "Minecraft Bedrock\Users\Shared\games\com.mojang"
$localMojang = Join-Path $env:LOCALAPPDATA "Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang"

$comMojangPaths = @()
if (Test-Path $leviMojang) { $comMojangPaths += $leviMojang }
if (Test-Path $roamingMojang) { $comMojangPaths += $roamingMojang }
if (Test-Path $localMojang) { $comMojangPaths += $localMojang }

if ($comMojangPaths.Count -eq 0) {
    # Default to LeviLauncher path if none already detected
    $comMojangPaths += $leviMojang
}

$repo = $PSScriptRoot

function Deploy-Pack {
    param(
        [string]$Target,
        [string]$Source,
        [string]$PackName,
        [switch]$AsCopy
    )

    if (Test-Path $Target) {
        $item = Get-Item $Target -Force
        $isLink = ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0

        if ($AsCopy) {
            Write-Host "  Replacing existing $PackName with fresh file copy..." -ForegroundColor Yellow
            Remove-Item -Path $Target -Recurse -Force
        } elseif ($isLink -and ($item.Target -eq $Source -or $item.Target -contains $Source)) {
            Write-Host "  $PackName link is already active and pointing to source: $Target -> $Source" -ForegroundColor Green
            return
        } else {
            Write-Host "  Replacing stale $PackName folder with live development link..." -ForegroundColor Yellow
            Remove-Item -Path $Target -Recurse -Force
        }
    }

    if ($AsCopy) {
        Copy-Item -Path $Source -Destination $Target -Recurse -Force
        Write-Host "  Copied $PackName to: $Target" -ForegroundColor Green
        return
    }

    # Attempt SymbolicLink, then Junction, then fallback to direct Copy
    try {
        New-Item -ItemType SymbolicLink -Path $Target -Value $Source -ErrorAction Stop | Out-Null
        Write-Host "  Created $PackName SymbolicLink: $Target -> $Source" -ForegroundColor Green
    } catch {
        try {
            New-Item -ItemType Junction -Path $Target -Value $Source -ErrorAction Stop | Out-Null
            Write-Host "  Created $PackName Junction: $Target -> $Source" -ForegroundColor Green
        } catch {
            Write-Host "  Link creation failed ($($_.Exception.Message)). Falling back to direct copy..." -ForegroundColor Magenta
            Copy-Item -Path $Source -Destination $Target -Recurse -Force
            Write-Host "  Copied $PackName to: $Target" -ForegroundColor Green
        }
    }
}

foreach ($comMojang in $comMojangPaths) {
    Write-Host "`nTarget: $comMojang" -ForegroundColor Cyan

    $devBpDir = Join-Path $comMojang "development_behavior_packs"
    $devRpDir = Join-Path $comMojang "development_resource_packs"

    if (-not (Test-Path $devBpDir)) {
        New-Item -ItemType Directory -Path $devBpDir -Force | Out-Null
    }
    if (-not (Test-Path $devRpDir)) {
        New-Item -ItemType Directory -Path $devRpDir -Force | Out-Null
    }

    # Behavior Pack Link / Copy
    $bpTarget = Join-Path $devBpDir "Infernal Mobs BP"
    $bpSource = Join-Path $repo "InfernalMobsBedrock-source\Infernal Mobs BP"
    Deploy-Pack -Target $bpTarget -Source $bpSource -PackName "Behavior Pack" -AsCopy:$Copy

    # Resource Pack Link / Copy
    $rpTarget = Join-Path $devRpDir "Infernal Mobs RP"
    $rpSource = Join-Path $repo "InfernalMobsBedrock-source\Infernal Mobs RP"
    Deploy-Pack -Target $rpTarget -Source $rpSource -PackName "Resource Pack" -AsCopy:$Copy
}
