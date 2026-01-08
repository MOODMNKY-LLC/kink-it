# Fix: Notion OAuth Requiring Re-Installation Every Time

## 🔴 Problem

Users are required to go through the full Notion integration installation/authorization flow every time they authenticate, even though tokens should be stored and refreshed automatically.

## 🎯 Root Cause

**Supabase's OAuth handler doesn't expose `refresh_token`** in the session object. When you use `supabase.auth.signInWithOAuth()`, Supabase handles the OAuth flow but:

1. **Refresh tokens are not exposed**: `session.provider_refresh_token` is often `undefined` or not available
2. **Tokens stored in session only**: Access tokens are in `session.provider_token` but expire when session expires
3. **No persistent storage**: Supabase doesn't automatically store refresh tokens in your database
4. **Notion requires re-authorization**: If refresh token isn't available, Notion requires full re-authorization

## ✅ Solution: Use Direct OAuth Flow

Instead of relying on Supabase's OAuth handler, we need to handle the OAuth flow directly to capture both access and refresh tokens.

### Current Flow (Problematic)

```
User → supabase.auth.signInWithOAuth() → Supabase OAuth Handler → Notion → Supabase → App
                                                                              ↓
                                                                    Only access_token available
                                                                    refresh_token lost
```

### Recommended Flow (Fixed)

```
User → Direct OAuth URL → Notion → Custom Callback Handler → Store tokens → Create Supabase session
```

## 🔧 Implementation Steps

### Step 1: Create Direct OAuth Initiation

**File**: `app/auth/login/page.tsx`

Instead of:
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "notion",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

Use:
```typescript
const handleNotionLogin = async () => {
  const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID
  const redirectUri = `${window.location.origin}/api/auth/notion/callback`
  
  // Direct OAuth URL with offline access
  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `owner=user`
  
  window.location.href = notionAuthUrl
}
```

### Step 2: Update Custom Callback Handler

**File**: `app/api/auth/notion/callback/route.ts`

This already exists and handles token exchange correctly! It:
- ✅ Exchanges code for tokens directly with Notion
- ✅ Gets both `access_token` and `refresh_token`
- ✅ Stores tokens in database
- ✅ Creates Supabase session

**But** - it needs to ensure tokens are stored BEFORE creating the session.

### Step 3: Verify Token Storage

Check that tokens are being stored:

```sql
-- Check if tokens exist
SELECT 
  user_id,
  bot_id,
  workspace_id,
  expires_at,
  created_at,
  updated_at
FROM user_notion_oauth_tokens
WHERE user_id = '<your-user-id>';
```

### Step 4: Verify Token Refresh Works

The `getNotionAccessToken()` function should automatically refresh expired tokens. Test it:

```typescript
// This should automatically refresh if expired
const token = await getNotionAccessToken(userId)
if (!token) {
  // No token available - user needs to re-authenticate
}
```

## 🐛 Troubleshooting

### Issue: Still Requiring Re-Authorization

**Check 1: Are tokens being stored?**

```sql
SELECT COUNT(*) FROM user_notion_oauth_tokens;
```

If 0, tokens aren't being stored. Check:
- OAuth callback handler is being called
- `storeNotionOAuthTokens()` is being called
- No errors in callback handler logs

**Check 2: Are refresh tokens valid?**

```typescript
// Test refresh token manually
const { data: refreshToken } = await supabase.rpc("get_user_notion_oauth_refresh_token", {
  p_user_id: userId,
  p_encryption_key: encryptionKey,
})

if (refreshToken) {
  // Try refreshing
  const refreshed = await refreshNotionAccessToken(refreshToken)
  console.log("Refresh successful:", !!refreshed.access_token)
}
```

**Check 3: Is Notion OAuth app configured correctly?**

In your Notion OAuth app settings (https://www.notion.so/my-integrations):
- ✅ Redirect URI matches: `https://127.0.0.1:55321/auth/v1/callback` (local) or your production URL
- ✅ OAuth app is "Public" (not "Internal")
- ✅ Required capabilities are enabled

**Check 4: Is Supabase OAuth handler interfering?**

If you're still using `supabase.auth.signInWithOAuth()`, it might be:
- Not exposing refresh tokens
- Overwriting your stored tokens
- Using a different redirect URI

**Solution**: Switch to direct OAuth flow (see Step 1 above).

## 🔄 Alternative: Use Supabase OAuth + Custom Token Storage

If you want to keep using Supabase's OAuth handler:

1. **Capture tokens in callback**: In `app/auth/callback/route.ts`, extract tokens from session
2. **Store immediately**: Call `storeNotionOAuthTokens()` right after session creation
3. **Problem**: `session.provider_refresh_token` might still be undefined

**Better approach**: Use direct OAuth flow to ensure refresh tokens are captured.

## 📋 Verification Checklist

- [ ] Tokens are stored in `user_notion_oauth_tokens` table
- [ ] Refresh tokens are present (not NULL)
- [ ] `getNotionAccessToken()` returns valid tokens
- [ ] Token refresh works when access token expires
- [ ] Notion OAuth app redirect URI matches
- [ ] Using direct OAuth flow (not Supabase's handler) OR Supabase exposes refresh tokens

## 🚀 Expected Behavior After Fix

**First Authentication:**
1. User clicks "Continue with Notion"
2. Redirected to Notion authorization page
3. User authorizes/installs integration
4. Redirected back to app
5. Tokens stored in database
6. User logged in

**Subsequent Logins:**
1. User clicks "Continue with Notion"
2. **If tokens exist and valid**: User logged in immediately (no Notion redirect)
3. **If tokens expired**: Automatically refreshed using refresh_token
4. **If refresh token invalid**: User redirected to Notion for re-authorization

**Current Problem:**
- Every login requires Notion authorization (Step 2 above)

**After Fix:**
- Only requires Notion authorization if refresh token is invalid/revoked

---

**Status**: Investigation Complete  
**Next**: Implement direct OAuth flow or verify Supabase exposes refresh tokens
