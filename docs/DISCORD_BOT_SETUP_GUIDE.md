# Discord Bot Setup Guide - KINK IT

## Complete Step-by-Step Guide for Discord Developer Portal

This guide walks you through setting up the KINK IT Discord bot with all necessary permissions and configurations.

---

## Prerequisites

- Discord account
- Admin access to your Discord server
- Basic understanding of Discord permissions

---

## Step 1: Access Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account
3. If prompted, authorize the Developer Portal application

---

## Step 2: Create a New Application

1. Click the **"New Application"** button (top right)
2. Enter application name: **"KINK IT Bot"** (or your preferred name)
3. Click **"Create"**
4. You'll see a confirmation message

**Note**: You can change the name later in General Information settings.

---

## Step 3: General Information Configuration

1. In the left sidebar, click **"General Information"**
2. Configure the following:

   **Application Name**: `KINK IT Bot`
   
   **Description**: 
   ```
   Automated notification bot for KINK IT - a D/s relationship management application. 
   Sends notifications for tasks, rewards, submission states, and other relationship events.
   ```
   
   **Application Icon**: 
   - Upload a custom icon (optional, recommended: 512x512px PNG)
   - This will be the bot's avatar
   
   **Tags**: Add relevant tags like `automation`, `notifications`, `relationship-management`

3. **Save Changes** (if you made any)

---

## Step 4: Create Bot User

1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"** button
3. Confirm by clicking **"Yes, do it!"**
4. You'll see bot configuration options appear

---

## Step 5: Configure Bot Settings

### Basic Bot Configuration

1. **Username**: `KINK IT Bot` (or your preferred name)
2. **Icon**: Upload bot avatar (512x512px PNG recommended)
3. **Description**: 
   ```
   Sends automated notifications for KINK IT app events including tasks, rewards, submission states, and relationship updates.
   ```

### Important Bot Settings

**Public Bot**: 
- ❌ **Uncheck** (Keep bot private - only you can add it to servers)

**Requires OAuth2 Code Grant**: 
- ❌ **Uncheck** (Not needed for basic bot functionality)

**Message Content Intent**: 
- ⚠️ **Check ONLY if** you plan to read message content (not needed initially for KINK IT)
- For now, leave **unchecked** since we're only sending notifications

**Privileged Gateway Intents**:
- **Server Members Intent**: ❌ Uncheck (not needed)
- **Message Content Intent**: ❌ Uncheck (not needed for sending only)
- **Presence Intent**: ❌ Uncheck (not needed)

### Reset Token

1. Click **"Reset Token"** to generate a new bot token
2. **⚠️ IMPORTANT**: Copy the token immediately and store it securely
3. **Never share this token publicly or commit it to version control**
4. Store in your `.env.local` file as `DISCORD_BOT_TOKEN`

**Token Format**: `YOUR_BOT_TOKEN_HERE.ABCDEF.ghijklmnopqrstuvwxyz1234567890`

---

## Step 6: Configure OAuth2 Settings

1. In the left sidebar, click **"OAuth2"**
2. Click **"General"** tab

### Redirects Configuration

1. Click **"Add Redirect"**
2. Add redirect URLs if needed for OAuth2 user authentication:
   - For KINK IT, you may not need redirects if only using bot functionality
   - If implementing user OAuth2 login: `http://localhost:3000/auth/discord/callback` (development)
   - Production: `https://yourdomain.com/auth/discord/callback`

**Note**: For bot-only functionality (notifications), redirects are optional.

---

## Step 7: Generate OAuth2 URL with Permissions

1. In the **"OAuth2"** section, click **"URL Generator"** tab
2. This is where you'll configure scopes and permissions

### Select Scopes

Under **"SCOPES"**, check:

- ✅ **`bot`** - Required for bot functionality
- ⚠️ **`webhook.incoming`** - Optional, only if you want webhook creation flow
- ❌ **`applications.commands`** - Not needed (we're not using slash commands)

### Select Bot Permissions

Under **"BOT PERMISSIONS"**, check the following:

#### Essential Permissions (Required)

- ✅ **Send Messages** (`0x0000000000000800`)
  - Allows bot to send messages in channels
  - **Required for all notifications**

- ✅ **View Channels** (`0x0000000000000400`)
  - Allows bot to see channels exist
  - **Required to verify channels before sending**

- ✅ **Read Message History** (`0x0000000000000100`)
  - Allows bot to read previous messages
  - **Required for context and verification**

#### Recommended Permissions

- ✅ **Manage Webhooks** (`0x0000000000200000`)
  - Allows bot to create and manage webhooks
  - **Required if creating webhooks programmatically**

- ✅ **Embed Links** (`0x0000000000004000`)
  - Allows bot to embed links in messages
  - **Recommended for rich message formatting**

- ✅ **Attach Files** (`0x0000000000008000`)
  - Allows bot to upload files
  - **Optional, for future file attachments**

#### Optional Permissions (Future Use)

- ⚠️ **Manage Messages** (`0x0000000000002000`)
  - Allows bot to delete/edit messages
  - **Only if you want message management features**

- ⚠️ **Read Messages/View Channels** (already included above)

### Generated URL

At the bottom of the page, you'll see a **"Generated URL"** that looks like:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=PERMISSION_INTEGER&scope=bot
```

**Copy this URL** - you'll use it to invite the bot to your server.

---

## Step 8: Copy Important Credentials

Before proceeding, copy and securely store these values:

### From "General Information" Tab:

1. **Application ID** (Client ID)
   - Format: `1234567890123456789`
   - Store as: `DISCORD_APPLICATION_ID` or `DISCORD_CLIENT_ID`

2. **Public Key**
   - Format: `abcdef1234567890...`
   - Store as: `DISCORD_PUBLIC_KEY`

### From "Bot" Tab:

3. **Bot Token**
   - Format: `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABCDEF.ghijklmnop...`
   - Store as: `DISCORD_BOT_TOKEN`
   - ⚠️ **Keep this secret!**

### From "OAuth2" Tab:

4. **Client Secret** (if using OAuth2 user authentication)
   - Format: `abcdef1234567890...`
   - Store as: `DISCORD_CLIENT_SECRET`
   - ⚠️ **Keep this secret!**

### Store in `.env.local`:

```bash
# Discord Bot Configuration
DISCORD_APPLICATION_ID=1234567890123456789
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_PUBLIC_KEY=abcdef1234567890abcdef1234567890abcdef12
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE.ABCDEF.ghijklmnopqrstuvwxyz1234567890
DISCORD_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12

# Discord Webhook (already configured)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1457594153109164134/s6eRp1w03Gw-clh0QF_-uL70LAS7hdE8jgpz16-18kBmmCbEJ08PMBX4RXB4TqOlPknj
```

---

## Step 9: Invite Bot to Your Server

1. **Copy the Generated URL** from Step 7
2. **Paste it into your browser**
3. You'll see Discord's authorization page
4. **Select your server** from the dropdown
5. **Review the permissions** (should match what you selected)
6. Click **"Authorize"**
7. Complete any CAPTCHA if prompted
8. The bot will appear offline in your server (this is normal until it's running)

---

## Step 10: Verify Bot in Server

1. Go to your Discord server
2. Check the member list - you should see **"KINK IT Bot"** (or your bot name)
3. The bot will appear **offline** (gray) until it connects
4. Right-click the bot → **"Roles"** → Assign the **"@KINK IT Bot"** role you created

---

## Step 11: Configure Bot Role Permissions

1. Go to **Server Settings** → **Roles**
2. Find or create **"@KINK IT Bot"** role
3. Configure permissions:

### Channel-Specific Permissions

For each **notification channel** (#task-assignments, #task-completions, etc.):

1. Right-click channel → **Edit Channel** → **Permissions**
2. Add **@KINK IT Bot** role
3. Enable:
   - ✅ View Channel
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Attach Files
4. Disable:
   - ❌ Manage Messages (unless you want message management)
   - ❌ All other permissions

### Server-Wide Permissions

For the **@KINK IT Bot** role at server level:

1. **Server Settings** → **Roles** → **@KINK IT Bot**
2. Enable:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Manage Webhooks (if creating webhooks programmatically)
3. Disable:
   - ❌ Administrator (not needed, use specific permissions)
   - ❌ Manage Server
   - ❌ All moderation permissions

---

## Step 12: Test Bot Connection

### Test 1: Webhook Message (Already Working)

Your webhook is already configured and tested. This confirms basic connectivity.

### Test 2: Bot API Message (After Integration)

Once you implement the bot API integration, test by sending a message:

```typescript
// Example test (after implementing API)
const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: '🧪 Test message from KINK IT Bot'
  })
})
```

---

## Permission Summary

### Required Permissions (Minimum)

| Permission | Value | Purpose |
|-----------|-------|---------|
| Send Messages | `0x0000000000000800` | Send notifications |
| View Channels | `0x0000000000000400` | See channels exist |
| Read Message History | `0x0000000000000100` | Read channel context |

**Total Permission Integer**: `3072` (decimal) or `0xC00` (hex)

### Recommended Permissions (Full Functionality)

| Permission | Value | Purpose |
|-----------|-------|---------|
| Send Messages | `0x0000000000000800` | Send notifications |
| View Channels | `0x0000000000000400` | See channels exist |
| Read Message History | `0x0000000000000100` | Read channel context |
| Manage Webhooks | `0x0000000000200000` | Create/manage webhooks |
| Embed Links | `0x0000000000004000` | Rich message formatting |
| Attach Files | `0x0000000000008000` | File attachments |

**Total Permission Integer**: `2147485696` (decimal) or `0x80000C00` (hex)

### Permission Integer Calculation

You can calculate the permission integer by adding the hex values:

```
0x0000000000000800 (Send Messages)
+ 0x0000000000000400 (View Channels)
+ 0x0000000000000100 (Read Message History)
+ 0x0000000000200000 (Manage Webhooks)
+ 0x0000000000004000 (Embed Links)
+ 0x0000000000008000 (Attach Files)
= 0x80000C00 (2147485696 decimal)
```

---

## OAuth2 Scopes Summary

### Required Scopes

- **`bot`** - Enables bot functionality, required for all bot operations

### Optional Scopes

- **`webhook.incoming`** - Only if implementing webhook creation flow
- **`applications.commands`** - Only if using slash commands (not needed for KINK IT)

---

## Security Best Practices

1. **Never commit tokens to version control**
   - Store all tokens in `.env.local`
   - Add `.env.local` to `.gitignore`

2. **Rotate tokens periodically**
   - Reset bot token every 90 days
   - Update `.env.local` when rotated

3. **Use least privilege principle**
   - Only grant permissions actually needed
   - Don't use Administrator permission

4. **Monitor bot activity**
   - Check server audit logs regularly
   - Monitor for unauthorized access

5. **Secure webhook URLs**
   - Store webhook URLs in environment variables
   - Rotate webhooks if compromised

---

## Troubleshooting

### Bot Appears Offline

**Cause**: Bot token not configured or bot not running
**Solution**: 
- Verify `DISCORD_BOT_TOKEN` is set correctly
- Ensure bot code is running and connecting to Discord

### "Missing Permissions" Error

**Cause**: Bot lacks required permissions
**Solution**:
- Check bot role has correct permissions
- Verify channel-specific permissions
- Re-invite bot with updated permissions

### "Invalid Token" Error

**Cause**: Bot token is incorrect or expired
**Solution**:
- Reset bot token in Developer Portal
- Update `DISCORD_BOT_TOKEN` in `.env.local`
- Restart bot application

### Webhook Works But Bot API Doesn't

**Cause**: Bot not added to server or lacks permissions
**Solution**:
- Verify bot is in server member list
- Check bot role permissions
- Ensure bot token is correct

---

## Next Steps

1. ✅ Complete bot setup (this guide)
2. ⏳ Store credentials in `.env.local`
3. ⏳ Update `.cursor/mcp.json` with bot token (for Discord MCP)
4. ⏳ Implement bot API integration in KINK IT app
5. ⏳ Test notification flow end-to-end
6. ⏳ Configure notification preferences

---

## Additional Resources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Permissions Documentation](https://discord.com/developers/docs/topics/permissions)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Discord Bot Best Practices](https://discord.com/developers/docs/topics/community-resources)

---

## Quick Reference

### Permission Values (Hex)

```
Send Messages:        0x0000000000000800
View Channels:       0x0000000000000400
Read Message History: 0x0000000000000100
Manage Webhooks:      0x0000000000200000
Embed Links:          0x0000000000004000
Attach Files:         0x0000000000008000
```

### OAuth2 URL Template

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=PERMISSION_INTEGER&scope=bot
```

### API Endpoint Template

```
POST https://discord.com/api/v10/channels/{CHANNEL_ID}/messages
Authorization: Bot {BOT_TOKEN}
Content-Type: application/json
```

---

**Setup Complete!** Your Discord bot is now configured and ready for integration with KINK IT.


