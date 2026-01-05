# Load Discord Token for MCP
# Run this script, then restart Cursor IDE

Write-Host "=== Loading Discord Token ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Please create .env.local with DISCORD_BOT_TOKEN" -ForegroundColor Yellow
    exit 1
}

# Load DISCORD_BOT_TOKEN from .env.local
$envContent = Get-Content ".env.local"
$tokenLine = $envContent | Where-Object { $_ -match "^DISCORD_BOT_TOKEN=" }

if (-not $tokenLine) {
    Write-Host "❌ DISCORD_BOT_TOKEN not found in .env.local" -ForegroundColor Red
    exit 1
}

$token = $tokenLine.Split("=")[1].Trim()

if (-not $token -or $token -eq "YOUR_DISCORD_BOT_TOKEN_HERE") {
    Write-Host "⚠️  DISCORD_BOT_TOKEN not configured in .env.local" -ForegroundColor Yellow
    Write-Host "   Please add your actual bot token" -ForegroundColor Gray
    exit 1
}

# Set environment variables
$env:DISCORD_BOT_TOKEN = $token
$env:DISCORD_TOKEN = $token

Write-Host "✅ DISCORD_TOKEN set successfully!" -ForegroundColor Green
Write-Host "   Token length: $($token.Length) characters" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Keep this PowerShell window open" -ForegroundColor Yellow
Write-Host "2. Start Cursor IDE from this terminal:" -ForegroundColor Yellow
Write-Host "   cursor ." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or restart Cursor IDE completely" -ForegroundColor Yellow
Write-Host "   (Environment variables will be available)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test Discord MCP in Cursor:" -ForegroundColor Yellow
Write-Host '   "Login to Discord with bot token"' -ForegroundColor Gray
Write-Host '   "Send test message to channel 1457594125590462548"' -ForegroundColor Gray


