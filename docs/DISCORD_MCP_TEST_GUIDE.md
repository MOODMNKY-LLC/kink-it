# Discord MCP Test Guide

**Date**: 2026-01-27  
**Purpose**: Test Discord MCP connectivity and message sending

---

## 🔧 Prerequisites

1. ✅ Bot is added to Discord server
2. ✅ Bot has "Send Messages" permission in target channel
3. ✅ `DISCORD_BOT_TOKEN` is set in `.env.local`
4. ✅ Cursor IDE is restarted (to pick up environment variables)

---

## 🧪 Test Steps

### Step 1: Verify Environment Variable

**Windows PowerShell**:
```powershell
# Check if DISCORD_BOT_TOKEN is set
$env:DISCORD_BOT_TOKEN

# If not set, export it from .env.local
$env:DISCORD_BOT_TOKEN = "your_token_here"
```

**Linux/Mac**:
```bash
# Check if DISCORD_BOT_TOKEN is set
echo $DISCORD_BOT_TOKEN

# If not set, export it
export DISCORD_BOT_TOKEN="your_token_here"
```

### Step 2: Test Discord MCP Functions

#### Test 1: Test Connection
```
Test Discord MCP connection
```

#### Test 2: Login
```
Login to Discord with bot token
```

#### Test 3: Send Test Message

**Channel ID**: `1457594125590462548` (#announcements)

**Test Message**:
```
Send a test message to Discord channel 1457594125590462548: "🎉 KINK IT Discord MCP Test - Connection successful!"
```

---

## 📋 Channel IDs Reference

From your environment variables:

- **#announcements**: `1457594125590462548`
- **Guild ID**: `1069695816001933332`

---

## 🐛 Troubleshooting

### Issue: "TokenInvalid" Error

**Symptom**: `Error [TokenInvalid]: An invalid token was provided`

**Solutions**:

1. **Verify Token is Correct**:
   ```powershell
   # Check token format (should start with letters/numbers)
   $env:DISCORD_BOT_TOKEN
   ```

2. **Export Token for Docker**:
   ```powershell
   # Windows PowerShell
   $env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN
   ```

3. **Restart Cursor IDE**:
   - Close Cursor completely
   - Reopen Cursor
   - MCP servers restart and pick up environment variables

4. **Check Docker Container**:
   ```powershell
   # Test if Docker can access token
   docker run --rm -e DISCORD_TOKEN=$env:DISCORD_BOT_TOKEN mcp/mcp-discord echo "Test"
   ```

### Issue: "Channel Not Found"

**Symptom**: Cannot send message to channel

**Solutions**:
1. ✅ Verify channel ID is correct
2. ✅ Check bot has "Send Messages" permission
3. ✅ Verify bot is in the server
4. ✅ Check channel exists and is accessible

### Issue: MCP Server Not Available

**Symptom**: Discord MCP functions not found

**Solutions**:
1. ✅ Check `.cursor/mcp.json` configuration
2. ✅ Verify Docker is running
3. ✅ Restart Cursor IDE
4. ✅ Check MCP server status in Cursor settings

---

## ✅ Success Criteria

After testing, you should be able to:

- ✅ Test Discord MCP connection successfully
- ✅ Login with bot token
- ✅ Send messages to Discord channels
- ✅ Receive confirmation of message sent

---

## 📝 Test Results Template

```
=== Discord MCP Test Results ===

Date: [Date]
Tester: [Your Name]

Test 1: Connection Test
- Status: [✅ Pass / ❌ Fail]
- Notes: [Any issues]

Test 2: Login Test
- Status: [✅ Pass / ❌ Fail]
- Notes: [Any issues]

Test 3: Send Message Test
- Channel: #announcements (1457594125590462548)
- Status: [✅ Pass / ❌ Fail]
- Message Sent: [Yes/No]
- Notes: [Any issues]

Overall Status: [✅ Ready / ❌ Needs Fixes]
```

---

**Last Updated**: 2026-01-27  
**Status**: Ready for Testing


