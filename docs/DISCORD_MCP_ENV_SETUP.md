# Discord MCP Environment Variable Setup

**Date**: 2026-01-27  
**Status**: ✅ Configured

---

## Configuration Update

The Discord MCP server configuration has been updated to use `DISCORD_BOT_TOKEN` from your environment variables.

### Updated Configuration

**File**: `.cursor/mcp.json`

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

### How It Works

1. **Environment Variable**: The MCP config references `${DISCORD_BOT_TOKEN}` from your `.env.local` file
2. **Docker Mapping**: The `env` section maps `DISCORD_BOT_TOKEN` → `DISCORD_TOKEN` for the Docker container
3. **Container Access**: Docker receives `DISCORD_TOKEN` via the `-e` flag

---

## Setup Instructions

### 1. Ensure DISCORD_BOT_TOKEN is Set

Make sure your `.env.local` file contains:

```bash
DISCORD_BOT_TOKEN=your_actual_discord_bot_token_here
```

### 2. Restart Cursor IDE

After updating the MCP configuration:
1. **Close Cursor IDE completely**
2. **Reopen Cursor IDE**
3. The MCP server will pick up the environment variable

### 3. Verify Configuration

To verify the Discord MCP is working:

1. Check MCP server status in Cursor settings
2. The Discord MCP should show as connected
3. You can test by using Discord MCP functions in chat

---

## Troubleshooting

### Discord Token Not Found

**Error**: `Discord token not found in config`

**Solution**:
1. Verify `DISCORD_BOT_TOKEN` is set in `.env.local`
2. Ensure the token value doesn't have quotes or extra spaces
3. Restart Cursor IDE completely
4. Check that Docker is running

### Environment Variable Not Loading

**Issue**: MCP config can't access environment variables

**Solution**:
1. Ensure `.env.local` is in the project root
2. Try exporting the variable manually:
   ```powershell
   # Windows PowerShell
   $env:DISCORD_BOT_TOKEN = "your_token_here"
   ```
3. Restart Cursor IDE

### Docker Container Issues

**Error**: Container fails to start

**Solution**:
1. Ensure Docker Desktop is running
2. Pull the MCP Discord image:
   ```bash
   docker pull mcp/mcp-discord
   ```
3. Check Docker logs for errors

---

## Alternative: Direct Environment Variable

If the `${DISCORD_BOT_TOKEN}` substitution doesn't work, you can:

1. **Export DISCORD_TOKEN directly**:
   ```powershell
   # Windows PowerShell
   $env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN
   ```

2. **Or add to .env.local**:
   ```bash
   DISCORD_TOKEN=your_discord_bot_token_here
   ```

Then update the MCP config to use `DISCORD_TOKEN` directly:

```json
"env": {
  "DISCORD_TOKEN": "${DISCORD_TOKEN}"
}
```

---

## Verification

After setup, you should be able to:

1. ✅ Use Discord MCP functions (`discord_send`, `discord_login`, `discord_test`)
2. ✅ Send messages to Discord channels
3. ✅ See Discord MCP in available MCP servers list

---

**Last Updated**: 2026-01-27  
**Status**: Ready for Use




