# Discord MCP Final Setup Instructions

**Status**: Token loaded successfully, but Cursor needs restart  
**Date**: 2026-01-27

---

## ✅ Token Status

✅ **DISCORD_BOT_TOKEN** found in `.env.local`  
✅ **Token length**: 72 characters  
✅ **Token format**: Valid Discord bot token format

---

## 🚨 Critical Step: Restart Cursor IDE

The Discord MCP Docker container needs `DISCORD_TOKEN` to be available when Cursor starts. 

### Option 1: Start Cursor from PowerShell (Recommended)

1. **Run the token loader script**:
   ```powershell
   .\scripts\load-and-set-discord-token.ps1
   ```

2. **Keep that PowerShell window open**

3. **Start Cursor from that PowerShell session**:
   ```powershell
   cursor .
   ```

### Option 2: Set Environment Variable Permanently

**Add to PowerShell Profile** (`$PROFILE`):

```powershell
# Discord MCP Token Setup
if (Test-Path ".env.local") {
    $content = Get-Content ".env.local" -Raw
    $match = [regex]::Match($content, 'DISCORD_BOT_TOKEN\s*=\s*([^\r\n#]+)')
    if ($match.Success) {
        $token = $match.Groups[1].Value.Trim()
        if ($token -and $token -ne "YOUR_DISCORD_BOT_TOKEN_HERE") {
            $env:DISCORD_BOT_TOKEN = $token
            $env:DISCORD_TOKEN = $token
        }
    }
}
```

**Then restart PowerShell** or run:
```powershell
. $PROFILE
```

---

## 🧪 Testing After Restart

Once Cursor is restarted with `DISCORD_TOKEN` set:

1. **Test Discord Login**:
   ```
   Login to Discord with bot token using random string "test"
   ```

2. **Send Test Message**:
   ```
   Send a test message to Discord channel 1457594125590462548: "🎉 KINK IT Discord MCP Test - Connection successful!"
   ```

---

## 🔍 Verification

**Check if DISCORD_TOKEN is available to Docker**:

```powershell
# In PowerShell where you set DISCORD_TOKEN
docker run --rm -e DISCORD_TOKEN=$env:DISCORD_TOKEN mcp/mcp-discord echo "Token available: $($env:DISCORD_TOKEN.Length) chars"
```

If this works, Docker can access the token. Then restart Cursor from that same PowerShell session.

---

## 📝 Current Configuration

**MCP Config** (`.cursor/mcp.json`):
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

**Note**: The `env` section was removed - Docker will pick up `DISCORD_TOKEN` from the host environment automatically.

---

## ✅ Success Criteria

After proper setup:
- ✅ Discord login succeeds
- ✅ Can send messages to Discord channels
- ✅ Bot appears online in server
- ✅ Messages appear in #announcements channel

---

**Last Updated**: 2026-01-27  
**Status**: Waiting for Cursor Restart


