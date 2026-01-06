# Discord OAuth Error Fix

## 🔍 Issue Identified

**Error**: `GET /auth/discord/callback?error=invalid_scope&error_description=The+requested+scope+is+invalid%2C+unknown%2C+or+malformed.`

**Root Cause**: Discord OAuth2 user authentication is being attempted, but Discord is not configured as an OAuth provider in Supabase. KINK IT uses Discord for **bot functionality** (notifications), not for **user authentication**.

## Understanding the Difference

### Discord Bot Authentication (What KINK IT Uses)
- **Purpose**: Add bot to server, send notifications
- **Scopes**: `bot` (for bot installation)
- **Configuration**: Discord Developer Portal → Bot → Token
- **Usage**: Bot API calls, webhooks

### Discord User OAuth2 (What's Failing)
- **Purpose**: Authenticate users with their Discord account
- **Scopes**: `identify`, `email`, `guilds` (for user info)
- **Configuration**: Requires Supabase OAuth provider setup
- **Usage**: User login via Discord account

## Current Configuration

**KINK IT uses**: Notion OAuth for user authentication ✅
**KINK IT uses**: Discord Bot for notifications ✅
**KINK IT does NOT use**: Discord OAuth for user authentication ❌

## Why This Error Occurs

The error happens when:
1. Someone tries to authenticate with Discord (accidentally or intentionally)
2. Supabase receives a Discord OAuth callback
3. Discord OAuth is not configured in Supabase
4. Discord rejects the request with "invalid_scope"

## Solutions

### Option 1: Ignore the Error (Recommended)

Since KINK IT doesn't use Discord for user authentication, you can safely ignore this error. It only occurs if someone accidentally tries to authenticate with Discord.

**To prevent accidental Discord OAuth attempts:**
- Ensure no Discord login buttons exist in your UI
- Only use Discord for bot functionality
- The error will redirect to login page with error message (which is fine)

### Option 2: Configure Discord OAuth (If Needed)

If you want to add Discord as a user authentication option:

#### Step 1: Configure Discord OAuth in Supabase

Add to `supabase/config.toml`:

```toml
# Discord OAuth provider for user authentication
[auth.external.discord]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET)"
redirect_uri = ""
url = ""
skip_nonce_check = false
email_optional = false
```

#### Step 2: Add Environment Variables

Add to `.env.local`:

```bash
# Discord OAuth for user authentication (different from bot token)
SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET=YOUR_DISCORD_CLIENT_SECRET
```

**Note**: These are the same values as `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` from your Discord Developer Portal.

#### Step 3: Configure Discord OAuth App

In Discord Developer Portal → OAuth2 → General:

1. **Add Redirect URI**:
   ```
   https://127.0.0.1:55321/auth/v1/callback
   ```
   (This is Supabase's OAuth callback endpoint)

2. **Required Scopes** (for user authentication):
   - `identify` - Get user's Discord username and ID
   - `email` - Get user's email address
   - `guilds` (optional) - Get user's Discord servers

**Note**: These are DIFFERENT from bot scopes (`bot` scope is for bot installation, not user auth).

#### Step 4: Add Discord Login Button (Optional)

If you want users to sign in with Discord, add to `app/auth/login/page.tsx`:

```typescript
const handleDiscordLogin = async () => {
  const supabase = createClient()
  setIsOAuthLoading(true)
  setError(null)

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identify email", // User authentication scopes
      },
    })
    if (error) throw error
  } catch (error: unknown) {
    setError(error instanceof Error ? error.message : "An error occurred")
    setIsOAuthLoading(false)
  }
}
```

## Recommended Approach

**For KINK IT**: Use **Option 1** (ignore the error)

**Reasons**:
1. KINK IT already uses Notion OAuth for user authentication ✅
2. Discord is only used for bot notifications ✅
3. Adding Discord OAuth adds complexity without clear benefit
4. The error only occurs if someone accidentally tries Discord auth

## Error Handling

The current callback route (`app/auth/callback/route.ts`) already handles OAuth errors correctly:

```typescript
if (error) {
  const errorUrl = new URL("/auth/login", requestUrl.origin)
  errorUrl.searchParams.set("error", error)
  if (errorDescription) {
    errorUrl.searchParams.set("error_description", errorDescription)
  }
  return NextResponse.redirect(errorUrl)
}
```

This redirects users back to the login page with the error message, which is the correct behavior.

## Prevention

To prevent accidental Discord OAuth attempts:

1. **No Discord login buttons** in UI ✅ (already done)
2. **Only use Discord for bot functionality** ✅ (current setup)
3. **Clear error messages** if Discord OAuth is attempted ✅ (already handled)

## Summary

- **Error**: Discord OAuth callback with invalid scope
- **Cause**: Discord OAuth not configured (and not needed)
- **Impact**: Minimal - only affects accidental Discord auth attempts
- **Solution**: Ignore (recommended) or configure Discord OAuth if needed
- **Status**: ✅ Already handled correctly by callback route

---

**Current Setup**: ✅ Correct
- Notion OAuth for user authentication
- Discord Bot for notifications
- Error handling in place

No action required unless you want to add Discord as a user authentication option.




