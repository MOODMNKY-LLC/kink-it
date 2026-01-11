# Notion Auth Session Persistence - Fix Implementation

**Date**: 2026-01-08  
**Status**: ✅ Fix Applied - Testing Required

---

## Problem Summary

Users were being forced through Notion OAuth consent every time they closed the app because refresh tokens were not being stored. This was caused by using Supabase's OAuth handler which doesn't reliably expose refresh tokens.

---

## Solution Implemented

### 1. Updated Login Page (`app/auth/login/page.tsx`)

**Changed from:**
- Using `supabase.auth.signInWithOAuth()` which redirects to `/auth/callback`
- Relies on Supabase exposing refresh tokens (which it doesn't reliably do)

**Changed to:**
- Direct Notion OAuth URL construction
- Redirects to `/api/auth/notion/callback` (custom handler)
- Ensures refresh tokens are captured and stored

### 2. Enhanced Callback Handler (`app/api/auth/notion/callback/route.ts`)

**Added:**
- Basic state validation for CSRF protection
- Warning logging for missing state parameter

**Already implemented:**
- Direct token exchange with Notion API
- Captures both access_token AND refresh_token
- Stores tokens in database BEFORE session creation
- Creates Supabase session after token storage

---

## Required Environment Variable

**⚠️ ACTION REQUIRED**: Add this to your `.env.local`:

\`\`\`bash
# Notion OAuth Client ID (public - safe to expose in client code)
# This must match SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID
NEXT_PUBLIC_NOTION_CLIENT_ID=2dfd872b-594c-803e-a575-0037d97447ad
\`\`\`

**Why**: The OAuth client ID must be accessible in client-side code to construct the OAuth URL. The client ID is public by design (unlike the client secret).

**For Vercel Production:**
\`\`\`bash
vercel env add NEXT_PUBLIC_NOTION_CLIENT_ID production
# Enter: 2dfd872b-594c-803e-a575-0037d97447ad
\`\`\`

---

## How It Works Now

### First-Time Authentication:
1. User clicks "Continue with Notion"
2. Redirected to Notion OAuth consent screen
3. User authorizes and selects workspace/pages
4. Notion redirects to `/api/auth/notion/callback` with authorization code
5. **Custom callback handler:**
   - Exchanges code directly with Notion API
   - Gets BOTH access_token AND refresh_token ✅
   - Stores tokens in encrypted database table ✅
   - Creates Supabase session
   - Redirects to app

### Subsequent App Opens:
1. User opens app
2. Middleware checks for valid Supabase session
3. If session valid: ✅ User is authenticated
4. If session expired but refresh token exists:
   - `getNotionAccessToken()` automatically refreshes token ✅
   - New session created silently ✅
5. **Only if refresh token missing**: Redirect to OAuth (shouldn't happen now)

---

## Testing Checklist

- [ ] Add `NEXT_PUBLIC_NOTION_CLIENT_ID` to `.env.local`
- [ ] Restart development server
- [ ] Test first-time authentication:
  - [ ] OAuth flow completes successfully
  - [ ] Tokens stored in database
  - [ ] Session created
  - [ ] User redirected to app
- [ ] Test session persistence:
  - [ ] Close browser/app
  - [ ] Reopen app
  - [ ] User should be logged in automatically (no OAuth screen)
- [ ] Test token refresh:
  - [ ] Wait for access token to expire (or manually expire)
  - [ ] Make API call that requires Notion token
  - [ ] Token should refresh automatically
  - [ ] No OAuth screen should appear

---

## Verification

### Check Token Storage:
\`\`\`sql
-- In Supabase SQL Editor
SELECT 
  user_id,
  bot_id,
  workspace_id,
  workspace_name,
  expires_at,
  created_at
FROM user_notion_oauth_tokens
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

### Check Session:
- Open browser DevTools → Application → Cookies
- Look for Supabase session cookies
- Verify they have `Max-Age` or `Expires` set
- Verify `SameSite` and `Secure` flags are correct

### Check Logs:
Look for these log messages:
- `"Successfully stored Notion OAuth tokens for user: <user_id>"`
- `"Error refreshing Notion token:"` (should not appear on normal flow)

---

## Rollback Plan

If issues occur, revert `app/auth/login/page.tsx` to use Supabase OAuth handler:

\`\`\`typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "notion",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
\`\`\`

---

## Related Documentation

- `docs/NOTION_AUTH_SESSION_PERSISTENCE_ANALYSIS.md` - Detailed analysis
- `docs/NOTION_TOKEN_REFRESH_IMPLEMENTATION.md` - Token refresh implementation
- `docs/NOTION_OAUTH_REAUTHORIZATION_FIX.md` - Previous analysis
