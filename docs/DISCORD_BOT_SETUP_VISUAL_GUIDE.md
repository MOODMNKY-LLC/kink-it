# Discord Bot Setup - Visual Guide

## Complete Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Discord Developer Portal                          │
│  ─────────────────────────────────────────────────────────  │
│  1. Go to discord.com/developers/applications                │
│  2. Click "New Application"                                 │
│  3. Name: "KINK IT Bot"                                     │
│  4. Click "Create"                                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: General Information                               │
│  ─────────────────────────────────────────────────────────  │
│  • Application Name: KINK IT Bot                           │
│  • Description: [Add description]                          │
│  • Icon: [Upload 512x512px PNG]                            │
│  • Copy Application ID (Client ID)                          │
│  • Copy Public Key                                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Create Bot User                                    │
│  ─────────────────────────────────────────────────────────  │
│  1. Click "Bot" in sidebar                                 │
│  2. Click "Add Bot"                                        │
│  3. Click "Yes, do it!"                                    │
│  4. Configure:                                             │
│     • Username: KINK IT Bot                                 │
│     • Icon: [Upload avatar]                                 │
│     • Public Bot: ❌ OFF                                    │
│     • Requires OAuth2 Code Grant: ❌ OFF                    │
│     • Message Content Intent: ❌ OFF                        │
│  5. Click "Reset Token"                                    │
│  6. ⚠️ COPY TOKEN IMMEDIATELY                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: OAuth2 Configuration                               │
│  ─────────────────────────────────────────────────────────  │
│  1. Click "OAuth2" → "URL Generator"                       │
│  2. SCOPES:                                                 │
│     ✅ bot                                                  │
│     ⚠️ webhook.incoming (optional)                         │
│  3. BOT PERMISSIONS:                                        │
│     ✅ Send Messages                                        │
│     ✅ View Channels                                        │
│     ✅ Read Message History                                │
│     ✅ Manage Webhooks                                      │
│     ✅ Embed Links                                          │
│     ✅ Attach Files                                         │
│  4. Copy Generated URL                                      │
│  5. Copy Client Secret (if using OAuth2)                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Invite Bot to Server                              │
│  ─────────────────────────────────────────────────────────  │
│  1. Paste OAuth2 URL in browser                            │
│  2. Select your Discord server                             │
│  3. Review permissions                                      │
│  4. Click "Authorize"                                       │
│  5. Complete CAPTCHA if prompted                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Configure Server Permissions                      │
│  ─────────────────────────────────────────────────────────  │
│  1. Create "@KINK IT Bot" role (if needed)                 │
│  2. Assign role to bot                                      │
│  3. Configure role permissions:                             │
│     • View Channels                                         │
│     • Send Messages                                         │
│     • Read Message History                                  │
│     • Embed Links                                           │
│     • Attach Files                                          │
│     • Manage Webhooks                                       │
│  4. Configure channel permissions for                       │
│     notification channels                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Store Credentials                                 │
│  ─────────────────────────────────────────────────────────  │
│  Add to .env.local:                                         │
│  • DISCORD_APPLICATION_ID                                  │
│  • DISCORD_CLIENT_ID                                       │
│  • DISCORD_PUBLIC_KEY                                      │
│  • DISCORD_BOT_TOKEN ⚠️                                    │
│  • DISCORD_CLIENT_SECRET ⚠️                                 │
│  • DISCORD_WEBHOOK_URL (already have)                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Configure Discord MCP (Optional)                   │
│  ─────────────────────────────────────────────────────────  │
│  1. Export DISCORD_TOKEN:                                  │
│     PowerShell: $env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN│
│  2. Restart Cursor IDE                                     │
│  3. Test MCP connectivity                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    ✅ SETUP COMPLETE!
```

## Permission Selection Visual Guide

### In OAuth2 URL Generator:

```
┌─────────────────────────────────────────┐
│  SCOPES                                 │
│  ┌───────────────────────────────────┐ │
│  │ ☑ bot                             │ │
│  │ ☐ webhook.incoming                │ │
│  │ ☐ applications.commands          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  BOT PERMISSIONS                        │
│  ┌───────────────────────────────────┐ │
│  │ ☑ Send Messages                  │ │
│  │ ☑ View Channels                  │ │
│  │ ☑ Read Message History           │ │
│  │ ☑ Manage Webhooks                │ │
│  │ ☑ Embed Links                    │ │
│  │ ☑ Attach Files                   │ │
│  │ ☐ Administrator                  │ │
│  │ ☐ Manage Server                  │ │
│  │ ☐ ... (others unchecked)         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Generated URL:                         │
│  https://discord.com/api/oauth2/...     │
└─────────────────────────────────────────┘
```

## Credential Collection Checklist

```
Developer Portal → General Information
├── Application ID ──────────────→ DISCORD_APPLICATION_ID
├── Public Key ──────────────────→ DISCORD_PUBLIC_KEY
└── Application ID (same) ───────→ DISCORD_CLIENT_ID

Developer Portal → Bot
└── Token ───────────────────────→ DISCORD_BOT_TOKEN ⚠️

Developer Portal → OAuth2
└── Client Secret ────────────────→ DISCORD_CLIENT_SECRET ⚠️

Discord Server → Webhook
└── Webhook URL ──────────────────→ DISCORD_WEBHOOK_URL ✅ (already have)
```

## Permission Integer Reference

### Minimum (Required)
```
1024  (View Channels)
+ 2048  (Send Messages)
+ 65536 (Read Message History)
─────────────────────
= 68608 (decimal)
= 0x10C00 (hex)
```

### Recommended (Full Functionality)
```
68608 (Minimum)
+ 536870912 (Manage Webhooks)
+ 16384 (Embed Links)
+ 32768 (Attach Files)
─────────────────────
= 536951424 (decimal)
= 0x20010C00 (hex)
```

## Quick Command Reference

### PowerShell (Windows)
```powershell
# Export bot token for MCP
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN

# Or from .env.local
$env:DISCORD_TOKEN = (Get-Content .env.local | Select-String "DISCORD_BOT_TOKEN").ToString().Split("=")[1]
```

### Bash/Zsh (Linux/Mac)
```bash
# Export bot token for MCP
export DISCORD_TOKEN=$DISCORD_BOT_TOKEN

# Or from .env.local
export $(grep DISCORD_BOT_TOKEN .env.local | xargs)
```

## Testing Checklist

```
┌─────────────────────────────────────┐
│  Test 1: Webhook                    │
│  ✅ Already tested and working      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Test 2: Bot in Server               │
│  ☐ Bot appears in member list       │
│  ☐ Bot has correct role             │
│  ☐ Bot role has correct permissions │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Test 3: Bot API (After Integration) │
│  ☐ Can send message via API         │
│  ☐ Message appears in channel        │
│  ☐ Formatting is correct             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Test 4: Discord MCP                 │
│  ☐ MCP server connects               │
│  ☐ Can send messages via MCP        │
│  ☐ Error handling works              │
└─────────────────────────────────────┘
```

## Next Steps After Setup

```
1. ✅ Complete bot setup
   │
   ├─→ 2. Store credentials in .env.local
   │
   ├─→ 3. Export DISCORD_TOKEN for MCP
   │
   ├─→ 4. Test bot connectivity
   │
   └─→ 5. Begin app integration
       │
       ├─→ Create API routes
       ├─→ Implement notification service
       ├─→ Set up event triggers
       └─→ Test end-to-end flow
```

---

**Follow the detailed guide**: `docs/DISCORD_BOT_SETUP_GUIDE.md`




