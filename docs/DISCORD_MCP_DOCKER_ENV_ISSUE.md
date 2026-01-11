# Discord MCP Docker Environment Variable Issue

**Issue**: Discord MCP Docker container not receiving DISCORD_TOKEN  
**Date**: 2026-01-27

---

## 🔍 Problem

The Discord MCP Docker container requires `DISCORD_TOKEN` environment variable, but the current MCP configuration uses `${DISCORD_BOT_TOKEN}` syntax which doesn't work for Docker containers.

**Current Config** (`.cursor/mcp.json`):
\`\`\`json
"mcp-discord": {
  "command": "docker",
  "args": [
    "run",
    "-i",
    "--rm",
    "-e",
    "DISCORD_TOKEN",
    "mcp/mcp-discord"
  ],
  "env": {
    "DISCORD_TOKEN": "${DISCORD_BOT_TOKEN}"
  }
}
\`\`\`

**Issue**: Docker containers can't access `${DISCORD_BOT_TOKEN}` syntax - they need the environment variable to be available in the host environment when Docker runs.

---

## ✅ Solutions

### Solution 1: Export DISCORD_TOKEN Before Starting Cursor (Recommended)

**Windows PowerShell**:
\`\`\`powershell
# Set DISCORD_TOKEN from DISCORD_BOT_TOKEN
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN

# Then start Cursor from this PowerShell session
cursor .
\`\`\`

**Linux/Mac**:
\`\`\`bash
export DISCORD_TOKEN=$DISCORD_BOT_TOKEN
cursor .
\`\`\`

### Solution 2: Add DISCORD_TOKEN to .env.local

Add this line to your `.env.local` file:

\`\`\`bash
# Discord Token for MCP (same as DISCORD_BOT_TOKEN)
DISCORD_TOKEN=your_discord_bot_token_here
\`\`\`

**Then export it** before starting Cursor:
\`\`\`powershell
# Load from .env.local
$content = Get-Content .env.local -Raw
$match = [regex]::Match($content, 'DISCORD_TOKEN=([^\r\n]+)')
if ($match.Success) {
    $env:DISCORD_TOKEN = $match.Groups[1].Value.Trim()
}
\`\`\`

### Solution 3: Update MCP Config to Use Direct Environment Variable

If Cursor's MCP system supports reading from host environment, update `.cursor/mcp.json`:

\`\`\`json
"mcp-discord": {
  "command": "docker",
  "args": [
    "run",
    "-i",
    "--rm",
    "-e",
    "DISCORD_TOKEN",
    "mcp/mcp-discord"
  ]
}
\`\`\`

**Remove the `env` section** - Docker will pick up `DISCORD_TOKEN` from the host environment automatically.

---

## 🧪 Verification

After setting up, verify:

1. **Check environment variable**:
   \`\`\`powershell
   $env:DISCORD_TOKEN
   \`\`\`

2. **Test Docker container directly**:
   \`\`\`powershell
   docker run --rm -e DISCORD_TOKEN=$env:DISCORD_TOKEN mcp/mcp-discord echo "Test"
   \`\`\`

3. **Restart Cursor IDE** completely

4. **Test Discord MCP**:
   - Login: Should succeed
   - Send message: Should work

---

## 🔧 Alternative: Use Webhook Instead

If Discord MCP continues to have issues, you can use Discord webhooks directly:

**Your webhook URL** (from `.env.local`):
\`\`\`
https://discord.com/api/webhooks/1457594153109164134/s6eRp1w03Gw-clh0QF_-uL70LAS7hdE8jgpz16-18kBmmCbEJ08PMBX4RXB4TqOlPknj
\`\`\`

**Test webhook**:
\`\`\`powershell
Invoke-WebRequest -Uri 'https://discord.com/api/webhooks/1457594153109164134/s6eRp1w03Gw-clh0QF_-uL70LAS7hdE8jgpz16-18kBmmCbEJ08PMBX4RXB4TqOlPknj' -Method POST -ContentType 'application/json' -Body '{"content":"Test message from webhook"}'
\`\`\`

---

**Last Updated**: 2026-01-27  
**Status**: Troubleshooting
