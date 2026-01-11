# Discord Bot Setup - Complete Guide Summary

## Overview

This document provides a complete overview of the Discord bot setup process for KINK IT, including all necessary steps, permissions, and configurations.

## Documentation Created

### 1. Main Setup Guide
**File**: `docs/DISCORD_BOT_SETUP_GUIDE.md`
- Complete step-by-step instructions for Discord Developer Portal
- Permission configuration details
- OAuth2 setup instructions
- Security best practices
- Troubleshooting guide

### 2. Setup Checklist
**File**: `docs/DISCORD_BOT_SETUP_CHECKLIST.md`
- Quick reference checklist
- Credentials checklist
- Security checklist
- Next steps checklist

### 3. Permission Calculator
**File**: `scripts/discord-permission-calculator.md`
- Permission value reference
- Calculation examples
- Quick reference table

### 4. Updated Environment Template
**File**: `ENV_LOCAL_TEMPLATE.txt`
- Updated with Discord bot credentials
- Includes webhook URL
- Security warnings included

## Quick Start Path

### Step 1: Create Bot in Developer Portal (15 minutes)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Name it "KINK IT Bot"
3. Go to "Bot" tab → Click "Add Bot"
4. Copy the bot token (store securely!)
5. Go to "OAuth2" → "URL Generator"
6. Select `bot` scope
7. Select permissions:
   - Send Messages
   - View Channels
   - Read Message History
   - Manage Webhooks
   - Embed Links
   - Attach Files
8. Copy the generated OAuth2 URL

### Step 2: Invite Bot to Server (2 minutes)

1. Paste OAuth2 URL in browser
2. Select your Discord server
3. Click "Authorize"
4. Bot appears in server (offline until connected)

### Step 3: Configure Server Permissions (5 minutes)

1. Create "@KINK IT Bot" role (if not exists)
2. Assign role to bot
3. Configure role permissions:
   - View Channels
   - Send Messages
   - Read Message History
   - Embed Links
   - Attach Files
   - Manage Webhooks
4. Configure channel-specific permissions for notification channels

### Step 4: Store Credentials (2 minutes)

Add to `.env.local`:

\`\`\`bash
DISCORD_APPLICATION_ID=YOUR_APPLICATION_ID
DISCORD_CLIENT_ID=YOUR_CLIENT_ID
DISCORD_PUBLIC_KEY=YOUR_PUBLIC_KEY
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN
DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET
\`\`\`

### Step 5: Configure Discord MCP (Optional, 2 minutes)

1. Export `DISCORD_TOKEN` from `DISCORD_BOT_TOKEN`:
   \`\`\`powershell
   $env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN
   \`\`\`
2. Restart Cursor IDE
3. Test Discord MCP connectivity

## Required Permissions Summary

### Minimum Permissions (Required)
- **Send Messages** - Send notifications
- **View Channels** - See channels exist
- **Read Message History** - Read channel context

**Permission Integer**: `68608` (decimal) or `0x10C00` (hex)

### Recommended Permissions (Full Functionality)
- **Send Messages** - Send notifications
- **View Channels** - See channels exist
- **Read Message History** - Read channel context
- **Manage Webhooks** - Create/manage webhooks
- **Embed Links** - Rich message formatting
- **Attach Files** - File attachments

**Permission Integer**: `536951424` (decimal) or `0x20010C00` (hex)

## OAuth2 Scopes

### Required
- **`bot`** - Enables bot functionality

### Optional
- **`webhook.incoming`** - For webhook creation flow
- **`applications.commands`** - For slash commands (not needed)

## Credentials to Collect

From Discord Developer Portal, collect:

1. **Application ID** (Client ID)
   - Location: General Information → Application ID
   - Store as: `DISCORD_APPLICATION_ID` and `DISCORD_CLIENT_ID`

2. **Public Key**
   - Location: General Information → Public Key
   - Store as: `DISCORD_PUBLIC_KEY`

3. **Bot Token** ⚠️ (Keep Secret!)
   - Location: Bot → Token → Reset Token
   - Store as: `DISCORD_BOT_TOKEN`
   - Also export as: `DISCORD_TOKEN` (for MCP)

4. **Client Secret** ⚠️ (Keep Secret!)
   - Location: OAuth2 → Client Secret → Reset
   - Store as: `DISCORD_CLIENT_SECRET`
   - Only needed if using OAuth2 user authentication

## Security Checklist

- [ ] Bot token stored in `.env.local` (never committed)
- [ ] `.env.local` is in `.gitignore`
- [ ] Bot set to private (not public)
- [ ] Using least privilege permissions
- [ ] No Administrator permission granted
- [ ] Tokens rotated periodically (every 90 days)
- [ ] Webhook URLs stored securely

## Testing

### Test 1: Webhook (Already Working ✅)
Your webhook is already configured and tested.

### Test 2: Bot API (After Integration)
Once bot is set up and integrated, test sending a message via bot API.

### Test 3: Discord MCP (After Token Configuration)
Once `DISCORD_TOKEN` is exported, test MCP connectivity.

## Integration Next Steps

1. ✅ Complete bot setup (this guide)
2. ⏳ Store credentials in `.env.local`
3. ⏳ Export `DISCORD_TOKEN` for MCP
4. ⏳ Update `.cursor/mcp.json` if needed
5. ⏳ Implement Discord API integration in app
6. ⏳ Create notification service layer
7. ⏳ Test end-to-end notification flow

## Troubleshooting

### Bot Appears Offline
- Verify bot token is correct
- Ensure bot code is running
- Check bot is added to server

### Missing Permissions Error
- Re-invite bot with updated permissions
- Check role permissions
- Verify channel-specific permissions

### Invalid Token Error
- Reset bot token in Developer Portal
- Update `.env.local`
- Restart application

## Resources

- **Setup Guide**: `docs/DISCORD_BOT_SETUP_GUIDE.md`
- **Checklist**: `docs/DISCORD_BOT_SETUP_CHECKLIST.md`
- **Permission Calculator**: `scripts/discord-permission-calculator.md`
- **Server Layout**: `docs/DISCORD_SERVER_LAYOUT_PLAN.md`
- **MCP Setup**: `docs/DISCORD_MCP_SETUP.md`
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Permissions Docs](https://discord.com/developers/docs/topics/permissions)

## Estimated Time

- **Developer Portal Setup**: 15 minutes
- **Server Configuration**: 10 minutes
- **Credential Storage**: 5 minutes
- **Testing**: 5 minutes
- **Total**: ~35 minutes

---

**Ready to proceed?** Follow `docs/DISCORD_BOT_SETUP_GUIDE.md` for detailed step-by-step instructions!
