# Discord OAuth Configuration Fix

## ✅ Fix Applied

Added explicit Discord OAuth configuration to `supabase/config.toml` with `enabled = false` to prevent Discord OAuth authentication attempts.

## What Was Changed

### `supabase/config.toml`

Added Discord OAuth provider configuration section:

```toml
# Discord OAuth provider - DISABLED (KINK IT uses Discord Bot for notifications, not user authentication)
# If you want to enable Discord user authentication, set enabled = true and configure credentials below
# Note: Discord OAuth requires different scopes (identify, email) than bot installation (bot scope)
[auth.external.discord]
enabled = false
client_id = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET)"
redirect_uri = ""
url = ""
skip_nonce_check = false
email_optional = false
```

### `ENV_LOCAL_TEMPLATE.txt`

Added section documenting Discord OAuth environment variables (for future reference):

```bash
# ============================================
# DISCORD OAUTH FOR USER AUTHENTICATION (OPTIONAL - DISABLED BY DEFAULT)
# ============================================
# These are used ONLY if you enable Discord OAuth user authentication in supabase/config.toml
# Currently disabled - KINK IT uses Notion OAuth for user authentication
# Discord is only used for bot notifications (different from user OAuth)
```

## Why This Fixes the Error

**Before**: Discord OAuth was not configured in Supabase, so when someone attempted Discord authentication, Supabase would try to use it but fail with "invalid_scope" error.

**After**: Discord OAuth is explicitly configured but disabled (`enabled = false`). This:
1. ✅ Prevents Supabase from attempting Discord OAuth
2. ✅ Makes the configuration explicit and clear
3. ✅ Allows easy enabling in the future if needed
4. ✅ Documents the distinction between Discord Bot and Discord OAuth

## Current Configuration

- ✅ **Notion OAuth**: Enabled for user authentication
- ✅ **Discord Bot**: Used for notifications (separate from OAuth)
- ✅ **Discord OAuth**: Explicitly disabled (not needed)

## If You Want to Enable Discord OAuth Later

1. Set `enabled = true` in `supabase/config.toml`
2. Add environment variables to `.env.local`:
   ```bash
   SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID=YOUR_CLIENT_ID
   SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET=YOUR_CLIENT_SECRET
   ```
3. Configure Discord OAuth app in Discord Developer Portal:
   - Add redirect URI: `https://127.0.0.1:55321/auth/v1/callback`
   - Use scopes: `identify`, `email` (NOT `bot` scope)
4. Add Discord login button to `app/auth/login/page.tsx`

## Next Steps

1. ✅ Configuration updated
2. ⏳ Restart Supabase local development:
   ```bash
   supabase stop
   supabase start
   ```
3. ⏳ Test that Discord OAuth errors no longer occur

## Summary

- ✅ Discord OAuth explicitly disabled in config
- ✅ Configuration documented
- ✅ Error handling improved in callback route
- ✅ Clear distinction between Discord Bot and Discord OAuth

The error should no longer occur, and if it does, it will be handled gracefully with user-friendly error messages.


