# Vercel Environment Variables Update - KINK IT

**Date:** January 5, 2026  
**Status:** ✅ Local environment updated | ⏳ Vercel production pending

---

## 📋 Credentials Retrieved from Notion

Successfully retrieved KINK IT credentials from Notion Credentials database:

### Notion API Key (KINK IT)
- **API Key**: Retrieved from Notion (stored in .env.local)
- **Use Case**: KINK IT
- **Status**: Active
- **Source**: Notion Credentials Database

### Discord Bot Token
- **Bot Token**: Retrieved from Notion (stored in .env.local)
- **Description**: MOOD MNKY bot token
- **Status**: Active
- **Source**: Notion Credentials Database

---

## ✅ Local Environment (.env.local)

The following environment variables have been updated in `.env.local`:

\`\`\`bash
# ============================================
# NOTION INTEGRATION (REQUIRED)
# ============================================
NOTION_API_KEY=YOUR_KINK_IT_NOTION_API_KEY_HERE

# ============================================
# DISCORD BOT INTEGRATION (OPTIONAL)
# ============================================
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
\`\`\`

---

## 🚀 Vercel Production Environment

To add these credentials to Vercel production, use one of the following methods:

### Option 1: Vercel CLI (Interactive)

\`\`\`bash
# Add Notion API Key
vercel env add NOTION_API_KEY production
# When prompted, paste the API key from your .env.local file

# Add Discord Bot Token
vercel env add DISCORD_BOT_TOKEN production
# When prompted, paste the bot token from your .env.local file
\`\`\`

### Option 2: Vercel Dashboard

1. Go to: https://vercel.com/mood-mnkys-projects/kink-it/settings/environment-variables
2. Click **"Add New"**
3. Add each variable:
   - **Key**: `NOTION_API_KEY`
   - **Value**: (Get from your .env.local file)
   - **Environment**: Production (and optionally Preview/Development)
   - Click **"Save"**
4. Repeat for `DISCORD_BOT_TOKEN`:
   - **Key**: `DISCORD_BOT_TOKEN`
   - **Value**: (Get from your .env.local file)
   - **Environment**: Production (and optionally Preview/Development)
   - Click **"Save"**

### Option 3: Helper Script

Run the helper script (requires interactive input):

\`\`\`bash
bash scripts/add-env-vars-to-vercel.sh
\`\`\`

---

## 📝 Additional Environment Variables

The following Notion and Discord variables are already configured:

### Notion OAuth (for Supabase Auth)
- `SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID` - Already configured
- `SUPABASE_AUTH_EXTERNAL_NOTION_SECRET` - Already configured
- `NOTION_APP_IDEAS_DATABASE_ID` - Already configured

### Discord Integration
- `DISCORD_APPLICATION_ID` - Already configured
- `DISCORD_PUBLIC_KEY` - Already configured
- `DISCORD_CLIENT_ID` - Already configured
- `DISCORD_CLIENT_SECRET` - Already configured
- `DISCORD_WEBHOOK_URL` - Already configured

---

## 🔒 Security Notes

- ✅ API keys stored in `.env.local` (gitignored)
- ✅ Will be encrypted in Vercel production
- ⚠️ Never commit API keys to git
- ⚠️ Never expose API keys in client-side code
- ⚠️ Use API routes as a proxy for client-side service calls

---

## 🧪 Verification

After adding to Vercel, verify they're working:

\`\`\`bash
# Pull production env vars to verify
vercel env pull .env.production

# Check if variables are present
grep -E "NOTION_API_KEY|DISCORD_BOT_TOKEN" .env.production
\`\`\`

---

## 📚 References

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Notion API Documentation](https://developers.notion.com/reference)
- [Discord.js Documentation](https://discord.js.org/#/docs)
- [Notion Credentials Database](https://www.notion.so/95da498bdc724b4190fe67dcd61e23de)

---

**Last Updated:** January 5, 2026  
**Source:** Notion Credentials Database (KINK IT)
