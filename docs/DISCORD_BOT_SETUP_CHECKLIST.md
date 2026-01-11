# Discord Bot Setup Checklist

## Quick Setup Checklist

Use this checklist to ensure you've completed all steps:

### Developer Portal Setup

- [ ] Created new application in Discord Developer Portal
- [ ] Named application "KINK IT Bot" (or preferred name)
- [ ] Added application description
- [ ] Uploaded application icon (optional)
- [ ] Created bot user
- [ ] Configured bot username and avatar
- [ ] Set "Public Bot" to **OFF** (private bot)
- [ ] Set "Requires OAuth2 Code Grant" to **OFF**
- [ ] Set "Message Content Intent" to **OFF** (unless needed)
- [ ] Generated and copied bot token
- [ ] Stored bot token securely in `.env.local`

### OAuth2 Configuration

- [ ] Opened OAuth2 → URL Generator
- [ ] Selected `bot` scope
- [ ] Selected required permissions:
  - [ ] Send Messages
  - [ ] View Channels
  - [ ] Read Message History
  - [ ] Manage Webhooks
  - [ ] Embed Links
  - [ ] Attach Files
- [ ] Copied generated OAuth2 URL
- [ ] Copied Application ID (Client ID)
- [ ] Copied Public Key (if available)
- [ ] Copied Client Secret (if using OAuth2)

### Server Setup

- [ ] Invited bot to Discord server using OAuth2 URL
- [ ] Verified bot appears in server member list
- [ ] Created "@KINK IT Bot" role (if not exists)
- [ ] Assigned "@KINK IT Bot" role to bot
- [ ] Configured bot role permissions:
  - [ ] View Channels
  - [ ] Send Messages
  - [ ] Read Message History
  - [ ] Embed Links
  - [ ] Attach Files
  - [ ] Manage Webhooks
- [ ] Configured channel-specific permissions for notification channels

### Environment Variables

- [ ] Added `DISCORD_APPLICATION_ID` to `.env.local`
- [ ] Added `DISCORD_CLIENT_ID` to `.env.local`
- [ ] Added `DISCORD_PUBLIC_KEY` to `.env.local`
- [ ] Added `DISCORD_BOT_TOKEN` to `.env.local`
- [ ] Added `DISCORD_CLIENT_SECRET` to `.env.local` (if using OAuth2)
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Never committed tokens to version control

### Testing

- [ ] Tested webhook connectivity (already working)
- [ ] Verified bot appears in server
- [ ] Tested bot permissions (after API integration)
- [ ] Verified bot can send messages (after API integration)

### Integration

- [ ] Updated `.cursor/mcp.json` with Discord bot token (for MCP)
- [ ] Implemented Discord API integration in app
- [ ] Created notification service layer
- [ ] Tested end-to-end notification flow

---

## Permission Integer Reference

### Minimum Permissions (Required)
\`\`\`
Send Messages + View Channels + Read Message History
= 3072 (decimal) or 0xC00 (hex)
\`\`\`

### Recommended Permissions (Full Functionality)
\`\`\`
Send Messages + View Channels + Read Message History + 
Manage Webhooks + Embed Links + Attach Files
= 2147485696 (decimal) or 0x80000C00 (hex)
\`\`\`

---

## Credentials Checklist

Before proceeding, ensure you have:

- [ ] Application ID (Client ID)
- [ ] Public Key
- [ ] Bot Token ⚠️ (Keep Secret!)
- [ ] Client Secret ⚠️ (Keep Secret! - if using OAuth2)
- [ ] OAuth2 Invite URL
- [ ] Webhook URL (already have)

---

## Security Checklist

- [ ] All tokens stored in `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] Never shared tokens publicly
- [ ] Bot set to private (not public)
- [ ] Using least privilege permissions
- [ ] No Administrator permission granted
- [ ] Tokens rotated periodically (every 90 days)

---

## Next Steps After Setup

1. Store all credentials in `.env.local`
2. Update Discord MCP configuration
3. Implement Discord API integration
4. Test notification flow
5. Configure user preferences

---

**Status**: ⏳ In Progress | ✅ Complete | ❌ Not Started
