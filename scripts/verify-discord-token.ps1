# Verify Discord Token Setup
# Run this script to check if DISCORD_TOKEN is properly configured

Write-Host "=== Discord Token Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check DISCORD_BOT_TOKEN
if ($env:DISCORD_BOT_TOKEN) {
    Write-Host "✅ DISCORD_BOT_TOKEN is set" -ForegroundColor Green
    Write-Host "   Length: $($env:DISCORD_BOT_TOKEN.Length) characters" -ForegroundColor Gray
} else {
    Write-Host "❌ DISCORD_BOT_TOKEN is NOT set" -ForegroundColor Red
}

Write-Host ""

# Check DISCORD_TOKEN
if ($env:DISCORD_TOKEN) {
    Write-Host "✅ DISCORD_TOKEN is set" -ForegroundColor Green
    Write-Host "   Length: $($env:DISCORD_TOKEN.Length) characters" -ForegroundColor Gray
    Write-Host "   Value starts with: $($env:DISCORD_TOKEN.Substring(0, [Math]::Min(20, $env:DISCORD_TOKEN.Length)))..." -ForegroundColor Gray
} else {
    Write-Host "❌ DISCORD_TOKEN is NOT set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Setting DISCORD_TOKEN from DISCORD_BOT_TOKEN..." -ForegroundColor Yellow
    
    if ($env:DISCORD_BOT_TOKEN) {
        $env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN
        Write-Host "✅ DISCORD_TOKEN set from DISCORD_BOT_TOKEN" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cannot set DISCORD_TOKEN - DISCORD_BOT_TOKEN not available" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Load DISCORD_BOT_TOKEN from .env.local" -ForegroundColor Gray
        Write-Host "2. Set DISCORD_TOKEN = DISCORD_BOT_TOKEN" -ForegroundColor Gray
        Write-Host "3. Restart Cursor IDE from this PowerShell session" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. If DISCORD_TOKEN is set, restart Cursor IDE" -ForegroundColor Yellow
Write-Host "2. Test Discord MCP in Cursor" -ForegroundColor Yellow
Write-Host ""
Write-Host "To start Cursor with environment variables:" -ForegroundColor Gray
Write-Host "  cursor ." -ForegroundColor White
