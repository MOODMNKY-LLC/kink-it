# Discord MCP Troubleshooting Guide

**Issue**: Discord MCP Docker container not receiving DISCORD_TOKEN  
**Status**: Active troubleshooting  
**Date**: 2026-01-27

---

## 🔍 Problem Summary

The Discord MCP Docker container requires `DISCORD_TOKEN` environment variable, but Cursor's MCP system isn't passing it correctly to Docker.

**Symptoms**:
- `Login failed: Error [TokenInvalid]: An invalid token was provided`
- Discord bot is in server but MCP can't connect
- Token is valid (72 characters, confirmed working with direct Docker test)

---

## ✅ What We've Tried

1. ✅ **Token loaded from .env.local** - Working
2. ✅ **Direct Docker test** - Token works when passed directly to Docker
3. ✅ **PowerShell profile setup** - DISCORD_TOKEN auto-loads from .env.local
4. ❌ **MCP env section** - Cursor doesn't expand `${DISCORD_TOKEN}` syntax
5. ❌ **Wrapper script** - MCP stdio communication doesn't work with wrapper

---

## 🎯 Current Configuration

**`.cursor/mcp.json`**:
```json
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
```

**PowerShell Profile** (`$PROFILE`):
- Auto-loads `DISCORD_TOKEN` from `.env.local` on PowerShell startup

---

## 🚀 Solution Steps

### Step 1: Ensure DISCORD_TOKEN is Set

**Option A: Use PowerShell Profile (Already Set Up)**
```powershell
# Restart PowerShell or reload profile
. $PROFILE

# Verify token is set
$env:DISCORD_TOKEN
```

**Option B: Set Manually Before Starting Cursor**
```powershell
# Load from .env.local
.\scripts\load-and-set-discord-token.ps1

# Start Cursor from this PowerShell session
cursor .
```

### Step 2: Set as Windows System Environment Variable (Recommended)

**Windows Settings**:
1. Open **System Properties** → **Environment Variables**
2. Under **User variables**, click **New**
3. Variable name: `DISCORD_TOKEN`
4. Variable value: (your Discord bot token from .env.local)
5. Click **OK** and restart Cursor IDE

**PowerShell (Run as Admin)**:
```powershell
[System.Environment]::SetEnvironmentVariable("DISCORD_TOKEN", "your_token_here", "User")
```

### Step 3: Restart Cursor IDE Completely

1. **Close Cursor IDE completely** (not just the window)
2. **Restart Cursor IDE**
3. Docker should now have access to DISCORD_TOKEN

---

## 🧪 Verification

**Test 1: Check Environment Variable**
```powershell
$env:DISCORD_TOKEN
# Should show your token
```

**Test 2: Test Docker Directly**
```powershell
docker run --rm -e DISCORD_TOKEN=$env:DISCORD_TOKEN mcp/mcp-discord echo "Token: $($env:DISCORD_TOKEN.Length) chars"
# Should succeed
```

**Test 3: Test Discord MCP in Cursor**
- Login to Discord
- Send test message to channel 1457594125590462548

---

## 🔧 Alternative Solutions

### Option 1: Use Discord Webhook Instead

If MCP continues to have issues, use Discord webhooks directly:

```typescript
// In your Next.js app
const webhookUrl = process.env.DISCORD_WEBHOOK_URL
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Your message' })
})
```

### Option 2: Use Discord.js Directly

Create a simple Node.js script that uses Discord.js:

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.login(process.env.DISCORD_BOT_TOKEN);
// Use client to send messages
```

---

## 📝 Notes

- **Cursor MCP Docker Integration**: Cursor's MCP system passes environment variables to Docker containers, but only if they're available in the host environment when Cursor starts
- **PowerShell Profile**: Auto-loads DISCORD_TOKEN from .env.local, but Cursor must be started from a PowerShell session that has loaded the profile
- **System Environment Variable**: Most reliable method - ensures DISCORD_TOKEN is always available

---

## ✅ Success Criteria

After proper setup:
- ✅ `discord_login` succeeds
- ✅ Can send messages to Discord channels
- ✅ Bot appears online in server
- ✅ Messages appear in #announcements channel

---

**Last Updated**: 2026-01-27  
**Next Step**: Set DISCORD_TOKEN as Windows system environment variable and restart Cursor



