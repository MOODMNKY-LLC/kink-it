# Discord MCP Token Configuration Fix

**Issue**: Discord MCP Docker container not receiving `DISCORD_BOT_TOKEN`  
**Date**: 2026-01-27

---

## 🔍 Problem

The Discord MCP Docker container needs `DISCORD_TOKEN` environment variable, but it's not being passed correctly from the MCP configuration.

**Current Config** (`.cursor/mcp.json`):
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
  ],
  "env": {
    "DISCORD_TOKEN": "${DISCORD_BOT_TOKEN}"
  }
}
```

**Issue**: Docker containers can't access `${DISCORD_BOT_TOKEN}` syntax - they need the environment variable to be available in the host environment.

---

## ✅ Solution

### Option 1: Export DISCORD_TOKEN in Your Shell (Recommended)

**Windows PowerShell**:
```powershell
# Export DISCORD_TOKEN from DISCORD_BOT_TOKEN
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN

# Or if DISCORD_BOT_TOKEN is in .env.local, load it first:
# (You'll need to load .env.local values)
```

**Linux/Mac**:
```bash
export DISCORD_TOKEN=$DISCORD_BOT_TOKEN
```

**Then restart Cursor IDE** to pick up the environment variable.

### Option 2: Add DISCORD_TOKEN to .env.local

Add this line to your `.env.local` file:

```bash
# Discord Token for MCP (same as DISCORD_BOT_TOKEN)
DISCORD_TOKEN=your_discord_bot_token_here
```

**Then export it**:
```powershell
# Windows PowerShell
$env:DISCORD_TOKEN = "your_discord_bot_token_here"
```

### Option 3: Update MCP Config to Use DISCORD_BOT_TOKEN Directly

If the Docker container accepts `DISCORD_BOT_TOKEN`, update `.cursor/mcp.json`:

```json
"mcp-discord": {
  "command": "docker",
  "args": [
    "run",
    "-i",
    "--rm",
    "-e",
    "DISCORD_BOT_TOKEN",
    "mcp/mcp-discord"
  ],
  "env": {
    "DISCORD_BOT_TOKEN": "${DISCORD_BOT_TOKEN}"
  }
}
```

**Note**: This only works if the `mcp/mcp-discord` container accepts `DISCORD_BOT_TOKEN` instead of `DISCORD_TOKEN`. Most Discord MCP containers expect `DISCORD_TOKEN`.

---

## 🧪 Testing After Fix

1. **Restart Cursor IDE** completely
2. **Test Discord MCP login**:
   ```
   Login to Discord with bot token
   ```
3. **Send test message**:
   ```
   Send a test message to Discord channel 1457594125590462548: "Test message"
   ```

---

## 🔍 Verification

To verify the token is available:

**Windows PowerShell**:
```powershell
# Check if DISCORD_TOKEN is set
$env:DISCORD_TOKEN

# Should output your bot token
```

**Linux/Mac**:
```bash
echo $DISCORD_TOKEN
```

---

## 📝 Recommended Approach

**Best Practice**: Export `DISCORD_TOKEN` in your shell profile so it's always available:

**Windows PowerShell Profile** (`$PROFILE`):
```powershell
# Add to PowerShell profile
if ($env:DISCORD_BOT_TOKEN) {
    $env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN
}
```

**Linux/Mac** (`.bashrc` or `.zshrc`):
```bash
# Add to shell profile
export DISCORD_TOKEN=$DISCORD_BOT_TOKEN
```

---

**Last Updated**: 2026-01-27  
**Status**: Ready for Configuration


