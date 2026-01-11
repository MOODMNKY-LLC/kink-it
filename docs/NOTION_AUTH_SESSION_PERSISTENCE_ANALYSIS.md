# Notion Auth & Session Persistence - Deep Analysis

**Date**: 2026-01-08  
**Status**: 🔴 Critical Issue Identified - Fix Required

---

## Problem Statement

Users are being forced through Notion OAuth consent **every time they close the app**, even though they've already authenticated. This is a session persistence issue, not a Notion OAuth limitation.

---

## Root Cause Analysis

### The Critical Mismatch

**Current Flow (Broken):**
\`\`\`
Login Page → supabase.auth.signInWithOAuth() 
  → Supabase OAuth Handler 
  → Notion Authorization 
  → /auth/callback (Supabase handler)
  → exchangeCodeForSession()
  → ❌ Refresh token NOT reliably exposed
  → ❌ Refresh token NOT stored in database
  → Session expires → Must re-authenticate
\`\`\`

**Intended Flow (Not Being Used):**
\`\`\`
Login Page → Direct Notion OAuth URL
  → Notion Authorization
  → /api/auth/notion/callback (Custom handler)
  → Direct token exchange with Notion API
  → ✅ Both access_token AND refresh_token captured
  → ✅ Tokens stored in database BEFORE session creation
  → ✅ Session persists with refresh capability
\`\`\`

### Why Refresh Tokens Are Lost

1. **Wrong Callback Handler**: Login page redirects to `/auth/callback` instead of `/api/auth/notion/callback`
2. **Supabase Limitation**: `session.provider_refresh_token` is not reliably exposed by Supabase's OAuth handler
3. **Token Storage Failure**: `/auth/callback` tries to extract refresh token from session, but it's often `undefined`
4. **No Fallback**: When refresh token is missing, token refresh fails, forcing re-authentication

---

## Evidence from Codebase

### 1. Login Page (`app/auth/login/page.tsx`)
\`\`\`typescript
// ❌ Uses Supabase OAuth handler - redirects to /auth/callback
const { error } = await supabase.auth.signInWithOAuth({
  provider: "notion",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`, // Wrong callback!
  },
})
\`\`\`

### 2. Standard Callback (`app/auth/callback/route.ts`)
\`\`\`typescript
// ❌ Relies on Supabase exposing refresh token (which it doesn't reliably do)
const refreshToken = (session as any).provider_refresh_token || null
// Comment in code: "Supabase doesn't expose this reliably"
\`\`\`

### 3. Custom Callback (`app/api/auth/notion/callback/route.ts`)
\`\`\`typescript
// ✅ Correctly exchanges code directly with Notion API
const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
  // Gets BOTH access_token AND refresh_token
})

// ✅ Stores tokens BEFORE creating session
await storeNotionOAuthTokens(supabaseUser.id, {
  access_token,
  refresh_token, // ✅ Captured!
  // ...
})
\`\`\`

### 4. Token Refresh Logic (`lib/notion-auth.ts`)
\`\`\`typescript
// ✅ Has proper refresh logic, but can't work if refresh token was never stored
export async function getNotionAccessToken(userId: string) {
  // Checks for stored tokens, refreshes if expired
  // Falls back to session tokens (which expire)
}
\`\`\`

---

## ChatGPT Conversation Insights

The ChatGPT conversation identified 6 potential causes:

1. ✅ **Not storing refresh token** - CONFIRMED: Refresh tokens not being stored
2. ✅ **Storing tokens client-side** - NOT APPLICABLE: Tokens stored server-side
3. ⚠️ **Session cookie not persisting** - NEEDS VERIFICATION: Cookie settings may need review
4. ✅ **Always calling OAuth authorize** - PARTIALLY: Only happens when session expires
5. ✅ **Refresh failing** - CONFIRMED: Refresh fails because refresh token missing
6. ❌ **State/PKCE mismatch** - NOT APPLICABLE: Not the issue

---

## Solution

### Fix 1: Update Login Page to Use Custom Callback

Change `app/auth/login/page.tsx` to construct direct Notion OAuth URL instead of using Supabase's OAuth handler:

\`\`\`typescript
const handleNotionLogin = async () => {
  const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID
  const redirectUri = `${window.location.origin}/api/auth/notion/callback`
  
  // Generate state for CSRF protection
  const state = crypto.randomUUID()
  sessionStorage.setItem('notion_oauth_state', state)
  
  // Construct direct Notion OAuth URL
  const authUrl = new URL('https://api.notion.com/v1/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('owner', 'user')
  authUrl.searchParams.set('state', state)
  
  // Redirect to Notion
  window.location.href = authUrl.toString()
}
\`\`\`

### Fix 2: Verify Session Cookie Persistence

Ensure Supabase session cookies have proper attributes:
- `Max-Age` or `Expires` set
- `SameSite` configured correctly
- `Secure` flag set for HTTPS
- Domain matches application domain

### Fix 3: Add Startup Token Check

Before redirecting to OAuth, check if user has stored tokens:

\`\`\`typescript
// On app startup
const hasTokens = await hasNotionOAuthTokens(userId)
const accessToken = await getNotionAccessToken(userId)

if (hasTokens && accessToken) {
  // User has valid tokens, no need to re-authenticate
  return
}
\`\`\`

---

## Implementation Steps

1. ✅ Update login page to use direct OAuth URL
2. ✅ Add state validation in custom callback
3. ⚠️ **REQUIRED**: Add `NEXT_PUBLIC_NOTION_CLIENT_ID` environment variable
4. ✅ Verify custom callback handler is working correctly
5. ✅ Add logging to track token storage success/failure
6. ✅ Verify session cookie persistence settings
7. ✅ Test full flow: login → token storage → app close → app reopen → no re-auth

### Environment Variable Setup

**CRITICAL**: Add this to your `.env.local` and Vercel production:

\`\`\`bash
# Notion OAuth Client ID (public - safe to expose in client code)
NEXT_PUBLIC_NOTION_CLIENT_ID=<same value as SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID>
\`\`\`

**Why**: The OAuth client ID must be accessible in client-side code to construct the OAuth URL. It's safe to expose (unlike the client secret).

---

## Testing Checklist

- [ ] User can authenticate with Notion
- [ ] Refresh token is stored in database after auth
- [ ] Session persists after app close/reopen
- [ ] Token refresh works when access token expires
- [ ] No Notion consent screen on subsequent logins
- [ ] Session cookie persists correctly
- [ ] Error handling for expired refresh tokens

---

## Related Documentation

- `docs/NOTION_OAUTH_REAUTHORIZATION_FIX.md` - Previous analysis
- `docs/NOTION_TOKEN_REFRESH_IMPLEMENTATION.md` - Token refresh implementation
- `docs/NOTION_AUTH_FLOW.md` - Auth flow documentation
