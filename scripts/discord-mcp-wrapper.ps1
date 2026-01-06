# Discord MCP Wrapper Script
# This script loads DISCORD_TOKEN from .env.local and runs the Docker container

# Load token from .env.local
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $match = [regex]::Match($content, 'DISCORD_BOT_TOKEN\s*=\s*([^\r\n#]+)')
    if ($match.Success) {
        $token = $match.Groups[1].Value.Trim()
        $env:DISCORD_TOKEN = $token
    }
}

# Run Docker container
docker run -i --rm -e DISCORD_TOKEN=$env:DISCORD_TOKEN mcp/mcp-discord $args



