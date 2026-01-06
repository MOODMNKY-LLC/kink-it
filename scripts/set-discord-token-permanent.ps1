# Set DISCORD_TOKEN Permanently in PowerShell Profile
# This ensures DISCORD_TOKEN is always available when PowerShell starts

Write-Host "=== Setting DISCORD_TOKEN in PowerShell Profile ===" -ForegroundColor Cyan
Write-Host ""

# Check if profile exists
if (-not (Test-Path $PROFILE)) {
    Write-Host "Creating PowerShell profile..." -ForegroundColor Yellow
    New-Item -Path $PROFILE -Type File -Force | Out-Null
}

# Load token from .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    exit 1
}

$content = Get-Content ".env.local" -Raw
$match = [regex]::Match($content, 'DISCORD_BOT_TOKEN\s*=\s*([^\r\n#]+)')

if (-not $match.Success) {
    Write-Host "❌ DISCORD_BOT_TOKEN not found in .env.local" -ForegroundColor Red
    exit 1
}

$token = $match.Groups[1].Value.Trim()

# Check if already added
$profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if ($profileContent -and $profileContent -match "DISCORD_TOKEN.*=.*`"$token`"") {
    Write-Host "✅ DISCORD_TOKEN already in PowerShell profile" -ForegroundColor Green
} else {
    # Add to profile
    $setupCode = @"

# Discord MCP Token Setup (Auto-loaded from .env.local)
`$envFile = Join-Path `$PSScriptRoot ".env.local"
if (Test-Path `$envFile) {
    `$content = Get-Content `$envFile -Raw
    `$match = [regex]::Match(`$content, 'DISCORD_BOT_TOKEN\s*=\s*([^\r\n#]+)')
    if (`$match.Success) {
        `$env:DISCORD_TOKEN = `$match.Groups[1].Value.Trim()
    }
}

"@
    
    Add-Content -Path $PROFILE -Value $setupCode
    Write-Host "✅ Added DISCORD_TOKEN setup to PowerShell profile" -ForegroundColor Green
    Write-Host "   Profile location: $PROFILE" -ForegroundColor Gray
}

# Set for current session
$env:DISCORD_TOKEN = $token
Write-Host ""
Write-Host "✅ DISCORD_TOKEN set for current session" -ForegroundColor Green
Write-Host "   Length: $($token.Length) characters" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart PowerShell or run: . `$PROFILE" -ForegroundColor Yellow
Write-Host "2. Restart Cursor IDE" -ForegroundColor Yellow
Write-Host "3. DISCORD_TOKEN will be auto-loaded from .env.local" -ForegroundColor Yellow



