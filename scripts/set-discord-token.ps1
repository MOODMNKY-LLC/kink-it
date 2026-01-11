# Set Discord Token for MCP
# This script loads DISCORD_BOT_TOKEN from .env.local and sets DISCORD_TOKEN

$envContent = Get-Content ".env.local"
$tokenLine = $envContent | Where-Object { $_ -match "^DISCORD_BOT_TOKEN=" }

if ($tokenLine) {
    $token = $tokenLine.Split("=")[1].Trim()
    $env:DISCORD_BOT_TOKEN = $token
    $env:DISCORD_TOKEN = $token
    Write-Host "✅ DISCORD_TOKEN set successfully!" -ForegroundColor Green
    Write-Host "   Token length: $($token.Length) characters" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Keep this PowerShell window open" -ForegroundColor Yellow
    Write-Host "   Restart Cursor IDE from this terminal or manually" -ForegroundColor Yellow
} else {
    Write-Host "❌ DISCORD_BOT_TOKEN not found in .env.local" -ForegroundColor Red
}
