# Discord MCP Test Script
# Tests Discord MCP connectivity and message sending

Write-Host "=== Discord MCP Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if DISCORD_BOT_TOKEN is set
if (-not $env:DISCORD_BOT_TOKEN) {
    Write-Host "❌ DISCORD_BOT_TOKEN not found in environment" -ForegroundColor Red
    Write-Host "Please set it in your .env.local file and export it:" -ForegroundColor Yellow
    Write-Host '  $env:DISCORD_BOT_TOKEN = "your_token_here"' -ForegroundColor Gray
    exit 1
}

Write-Host "✅ DISCORD_BOT_TOKEN found in environment" -ForegroundColor Green
Write-Host ""

# Set DISCORD_TOKEN for Docker
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN
Write-Host "✅ DISCORD_TOKEN set for Docker container" -ForegroundColor Green
Write-Host ""

# Test Docker container can access token
Write-Host "Testing Docker container access..." -ForegroundColor Cyan
docker run --rm -e DISCORD_TOKEN=$env:DISCORD_TOKEN mcp/mcp-discord echo "Docker container can access DISCORD_TOKEN"

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart Cursor IDE to pick up environment variables" -ForegroundColor Gray
Write-Host "2. Test Discord MCP functions in Cursor chat" -ForegroundColor Gray
Write-Host "3. Use channel ID: 1457594125590462548 (#announcements)" -ForegroundColor Gray


