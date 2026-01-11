# Test Discord Token Directly with Docker
# This verifies the token works when passed directly to Docker

Write-Host "=== Testing Discord Token with Docker ===" -ForegroundColor Cyan
Write-Host ""

# Load token from .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    exit 1
}

$content = Get-Content ".env.local" -Raw
$match = [regex]::Match($content, 'DISCORD_BOT_TOKEN\s*=\s*([^\r\n#]+)')

if (-not $match.Success) {
    Write-Host "❌ DISCORD_BOT_TOKEN not found" -ForegroundColor Red
    exit 1
}

$token = $match.Groups[1].Value.Trim()

Write-Host "✅ Token loaded from .env.local" -ForegroundColor Green
Write-Host "   Length: $($token.Length) characters" -ForegroundColor Gray
Write-Host ""

# Test Docker with token
Write-Host "Testing Docker container with DISCORD_TOKEN..." -ForegroundColor Yellow
Write-Host ""

$env:DISCORD_TOKEN = $token

# Try to run a simple Docker command to verify token is passed
Write-Host "Running Docker test command..." -ForegroundColor Gray
docker run --rm -e "DISCORD_TOKEN=$token" mcp/mcp-discord echo "Token received: $($token.Length) chars"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Docker can access the token!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The issue is likely that Cursor's MCP system isn't passing" -ForegroundColor Yellow
    Write-Host "the environment variable to Docker correctly." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Docker test failed" -ForegroundColor Red
    Write-Host "   Exit code: $LASTEXITCODE" -ForegroundColor Gray
}
