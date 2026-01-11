# Notion OAuth Re-Authorization Issue - Diagnosis

## 🔴 Problem

Users must go through Notion integration installation/authorization **every time** they authenticate, even though tokens should be stored and refreshed automatically.

## 🎯 Root Cause Analysis

### The Issue

**Supabase's OAuth handler doesn't expose `refresh_token`** in the session object. When you use `supabase.auth.signInWithOAuth()`:

1. ✅ Supabase handles OAuth flow correctly
2. ✅ Creates user session
3. ✅ Stores `access_token` in `session.provider_token`
4. ❌ **Does NOT expose `refresh_token`** - `session.provider_refresh_token` is `undefined` or `null`
5. ❌ Without refresh token, tokens can't be refreshed when they expire
6. ❌ Notion requires full re-authorization when tokens expire

### Current Flow (Problematic)

\`\`\`
User clicks "Continue with Notion"
    ↓
supabase.auth.signInWithOAuth()
    ↓
Supabase OAuth Handler
    ↓
Notion Authorization Page (user must "install" integration)
    ↓
Notion → Supabase Callback
    ↓
Supabase processes OAuth
    ↓
Supabase → App Callback (/auth/callback)
    ↓
App tries to get refresh_token from session
    ↓
❌ refresh_token is undefined/null
    ↓
Tokens stored WITHOUT refresh_token
    ↓
When tokens expire → No refresh possible → Re-authorization required
\`\`\`

## ✅ Solution Options

### Option 1: Use Direct OAuth Flow (Recommended)

**Bypass Supabase's OAuth handler** and handle OAuth directly to capture refresh tokens.

**Pros:**
- ✅ Full control over OAuth flow
- ✅ Can capture refresh tokens reliably
- ✅ Can store tokens before creating session

**Cons:**
- ⚠️ Must create Supabase session manually (requires Admin API)
- ⚠️ More complex implementation

**Implementation:**
1. Change login to use direct Notion OAuth URL
2. Custom callback handler captures refresh tokens
3. Create Supabase session using Admin API
4. Store tokens in database

### Option 2: Check if Supabase Stores Refresh Tokens Internally

**Supabase might store refresh tokens internally** but not expose them. Check:

1. Does Supabase refresh tokens automatically?
2. Are tokens stored in Supabase's internal auth tables?
3. Can we access them via Admin API?

**If Supabase refreshes automatically:**
- The issue might be session expiry, not token expiry
- Check session refresh logic
- Ensure sessions persist across browser sessions

### Option 3: Use Custom Callback Handler (Hybrid)

**Keep Supabase OAuth handler** but also use custom callback to capture refresh tokens:

1. User clicks login → Supabase OAuth handler
2. Notion redirects to Supabase → Supabase redirects to app
3. **Also** redirect to custom callback handler to capture refresh tokens
4. Store refresh tokens separately

**Pros:**
- ✅ Keeps Supabase session management
- ✅ Captures refresh tokens

**Cons:**
- ⚠️ More complex flow
- ⚠️ Two redirects

## 🔍 Diagnostic Steps

### Step 1: Check if Tokens Are Being Stored

\`\`\`sql
-- Check if OAuth tokens exist
SELECT 
  user_id,
  bot_id,
  workspace_id,
  expires_at,
  created_at,
  updated_at
FROM user_notion_oauth_tokens
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

### Step 2: Check if Refresh Tokens Are Present

\`\`\`sql
-- Check if refresh tokens are stored (they're encrypted, so we can't see values)
-- But we can check if the column has data
SELECT 
  user_id,
  CASE 
    WHEN refresh_token_encrypted IS NULL THEN 'NULL'
    WHEN length(refresh_token_encrypted) = 0 THEN 'EMPTY'
    ELSE 'PRESENT'
  END as refresh_token_status,
  expires_at,
  created_at
FROM user_notion_oauth_tokens
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

### Step 3: Test Token Refresh

\`\`\`typescript
// Test if refresh works
const token = await getNotionAccessToken(userId)
if (!token) {
  console.error("No token available - refresh might have failed")
} else {
  console.log("Token retrieved successfully")
}
\`\`\`

### Step 4: Check Session Object

Add logging to see what Supabase exposes:

\`\`\`typescript
console.log("Session structure:", {
  hasProviderToken: !!session.provider_token,
  hasProviderRefreshToken: !!(session as any).provider_refresh_token,
  sessionKeys: Object.keys(session),
  userMetadata: session.user?.app_metadata,
})
\`\`\`

## 🚀 Recommended Fix

**Use Option 1: Direct OAuth Flow**

1. **Update login page** to use direct Notion OAuth URL
2. **Complete custom callback handler** to create Supabase session
3. **Store refresh tokens** before creating session
4. **Test token refresh** works correctly

## 📋 Verification

After implementing fix:

- [ ] Tokens stored with refresh_token (not empty)
- [ ] Token refresh works when access token expires
- [ ] User doesn't need to re-authorize on subsequent logins
- [ ] Sessions persist across browser sessions

---

**Status**: Diagnosis Complete  
**Next**: Implement direct OAuth flow or verify Supabase exposes refresh tokens
