# Setup Discord MCP Environment Variables
# Run this script before starting Cursor IDE

Write-Host "=== Discord MCP Environment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ Found .env.local file" -ForegroundColor Green
    
    # Load DISCORD_BOT_TOKEN from .env.local
    $envContent = Get-Content ".env.local"
    $botTokenLine = $envContent | Where-Object { $_ -match "^DISCORD_BOT_TOKEN=" }
    
    if ($botTokenLine) {
        $botToken = $botTokenLine.Split("=")[1].Trim()
        
        if ($botToken -and $botToken -ne "YOUR_DISCORD_BOT_TOKEN_HERE") {
            # Set DISCORD_TOKEN for Docker
            $env:DISCORD_TOKEN = $botToken
            Write-Host "✅ DISCORD_TOKEN set from .env.local" -ForegroundColor Green
            Write-Host "   Token length: $($botToken.Length) characters" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  DISCORD_BOT_TOKEN not configured in .env.local" -ForegroundColor Yellow
            Write-Host "   Please add your bot token to .env.local" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  DISCORD_BOT_TOKEN not found in .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Please create .env.local with DISCORD_BOT_TOKEN" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Verify DISCORD_TOKEN is set:" -ForegroundColor Yellow
Write-Host '   $env:DISCORD_TOKEN' -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Cursor IDE from this terminal" -ForegroundColor Yellow
Write-Host "   (Environment variables will be available to Cursor)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test Discord MCP in Cursor:" -ForegroundColor Yellow
Write-Host '   "Login to Discord with bot token"' -ForegroundColor Gray
Write-Host '   "Send test message to channel 1457594125590462548"' -ForegroundColor Gray


