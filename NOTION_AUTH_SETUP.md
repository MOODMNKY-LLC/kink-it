# Notion Authentication Setup for KINK IT

## 📋 Credentials Retrieved from Notion Database

### Notion API Key
\`\`\`bash
NOTION_API_KEY=YOUR_NOTION_API_KEY_HERE
\`\`\`

### Notion OAuth Credentials (for Supabase Auth)
\`\`\`bash
NOTION_OAUTH_CLIENT_ID=YOUR_NOTION_OAUTH_CLIENT_ID_HERE
NOTION_OAUTH_CLIENT_SECRET=YOUR_NOTION_OAUTH_CLIENT_SECRET_HERE
\`\`\`

### Notion App ID Database (from ENV_VARIABLES.md)
\`\`\`bash
NOTION_APP_IDEAS_DATABASE_ID=cc491ef5f0a64eac8e05a6ea10dfb735
\`\`\`

---

## 🔧 Step 1: Update Your `.env.local`

Open your `.env.local` file and **add/update** these variables:

\`\`\`bash
# ============================================
# NOTION INTEGRATION (UPDATED)
# ============================================

# Notion API Key (for direct API access)
NOTION_API_KEY=YOUR_NOTION_API_KEY_HERE

# Notion App Ideas Database ID
NOTION_APP_IDEAS_DATABASE_ID=YOUR_NOTION_DATABASE_ID_HERE

# ============================================
# NOTION OAUTH (FOR SUPABASE AUTH)
# ============================================

# Notion OAuth Client ID
SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID=YOUR_NOTION_OAUTH_CLIENT_ID_HERE

# Notion OAuth Client Secret  
SUPABASE_AUTH_EXTERNAL_NOTION_SECRET=YOUR_NOTION_OAUTH_CLIENT_SECRET_HERE
\`\`\`

**Important Notes:**
- The OAuth secret uses the Supabase naming convention for environment variables
- This allows config.toml to reference it using `env(SUPABASE_AUTH_EXTERNAL_NOTION_SECRET)`
- The API key is for direct Notion API calls (syncing ideas, etc.)
- The OAuth credentials are for user authentication via Notion

---

## 📝 Step 2: Supabase Configuration

The `supabase/config.toml` file has been automatically updated with:

\`\`\`toml
[auth.external.notion]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_NOTION_SECRET)"
redirect_uri = ""
\`\`\`

This configuration:
- ✅ Enables Notion as an OAuth provider
- ✅ Reads credentials from environment variables (secure)
- ✅ Uses default redirect URI (`http://127.0.0.1:55321/auth/v1/callback` for local dev)

---

## 🔄 Step 3: Restart Supabase

After updating `.env.local`, restart your Supabase instance:

\`\`\`bash
# Stop Supabase
supabase stop

# Start Supabase (picks up new env vars and config)
supabase start
\`\`\`

---

## ✅ Verification

### Check Supabase Auth Providers

1. Open Supabase Studio: **http://127.0.0.1:55323**
2. Navigate to **Authentication** → **Providers**
3. You should see **Notion** listed as an enabled provider

### Test Notion OAuth Flow

In your Next.js app, you can now use Supabase's OAuth flow:

\`\`\`typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Sign in with Notion
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'notion',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
\`\`\`

---

## 🎯 What This Enables

### User Authentication
- Users can sign in to KINK IT using their Notion account
- Seamless SSO experience
- No need to manage passwords

### Notion Data Access
- After OAuth, your app gets access tokens
- Can read/write to user's Notion workspace
- Perfect for syncing app ideas, tasks, etc.

### Integration Benefits
1. **App Ideas Sync**: Automatically sync ideas to Notion database
2. **User Profiles**: Link Notion workspace to user profiles
3. **Collaborative Features**: Share data between app and Notion
4. **Backup**: All data exists in both systems

---

## 🔐 Production Configuration

### Current Setup
- **Production Supabase URL**: `https://rbloeqwxivfzxmfropek.supabase.co`
- **OAuth Redirect**: Already configured in Notion app
- **Local Dev**: Uses `http://127.0.0.1:55321/auth/v1/callback`

### Notion App Settings
Your Notion integration is configured with:
- **Authorization URL**: `https://api.notion.com/v1/oauth/authorize`
- **Redirect URIs** (configured in Notion):
  - Production: `https://rbloeqwxivfzxmfropek.supabase.co/auth/v1/callback`
  - Local: `http://127.0.0.1:55321/auth/v1/callback`

---

## 🐛 Troubleshooting

### Error: "Notion provider not enabled"
- Check that `enabled = true` in config.toml
- Restart Supabase: `supabase stop && supabase start`

### Error: "Invalid OAuth credentials"
- Verify environment variables are set correctly in `.env.local`
- Check for typos in client ID and secret
- Ensure no extra spaces in the values

### Error: "Redirect URI mismatch"
- Add local redirect URI to Notion app settings:
  - Go to Notion Developer Portal
  - Add `http://127.0.0.1:55321/auth/v1/callback`
  - Or use `http://localhost:55321/auth/v1/callback`

### OAuth flow doesn't start
- Check browser console for errors
- Verify Supabase is running: `supabase status`
- Test the auth endpoint: `http://127.0.0.1:55323` (Studio)

---

## 📚 References

- [Supabase Notion Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-notion)
- [Notion OAuth Documentation](https://developers.notion.com/docs/authorization)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)

---

**Status**: ✅ Ready for configuration
**Next**: Update `.env.local` and restart Supabase
