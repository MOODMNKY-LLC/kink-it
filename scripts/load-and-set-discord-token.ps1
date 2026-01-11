# Load and Set Discord Token from .env.local
# This script loads DISCORD_BOT_TOKEN from .env.local and sets DISCORD_TOKEN

Write-Host "=== Loading Discord Token from .env.local ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    exit 1
}

# Read .env.local and find DISCORD_BOT_TOKEN
$content = Get-Content ".env.local" -Raw
$match = [regex]::Match($content, 'DISCORD_BOT_TOKEN\s*=\s*([^\r\n#]+)')

if (-not $match.Success) {
    Write-Host "❌ DISCORD_BOT_TOKEN not found in .env.local" -ForegroundColor Red
    exit 1
}

$token = $match.Groups[1].Value.Trim()

if (-not $token -or $token -eq "YOUR_DISCORD_BOT_TOKEN_HERE") {
    Write-Host "⚠️  DISCORD_BOT_TOKEN not configured (still has placeholder)" -ForegroundColor Yellow
    exit 1
}

# Set environment variables
$env:DISCORD_BOT_TOKEN = $token
$env:DISCORD_TOKEN = $token

Write-Host "✅ DISCORD_BOT_TOKEN loaded from .env.local" -ForegroundColor Green
Write-Host "✅ DISCORD_TOKEN set successfully!" -ForegroundColor Green
Write-Host "   Token length: $($token.Length) characters" -ForegroundColor Gray
Write-Host "   Token preview: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Gray
Write-Host ""
Write-Host "=== IMPORTANT ===" -ForegroundColor Cyan
Write-Host "Keep this PowerShell window open!" -ForegroundColor Yellow
Write-Host "Start Cursor IDE from this terminal:" -ForegroundColor Yellow
Write-Host "  cursor ." -ForegroundColor White
Write-Host ""
Write-Host "Or restart Cursor IDE completely after running this script." -ForegroundColor Gray
