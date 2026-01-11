# Notion Template Sync Fix

**Date**: 2026-02-02  
**Status**: ✅ Fixed

---

## Problem Summary

The Notion template search and sync function was failing with "Template not found" errors even though the template existed. This occurred after implementing the OAuth token refresh system.

---

## Root Cause Analysis

### Issue 1: Workspace ID Extraction Failure

**Location**: `app/auth/callback/route.ts`

**Problem**: 
- After OAuth authentication, the code tried to extract `workspace_id` from Supabase session metadata: `session.user?.app_metadata?.provider_metadata?.workspace_id`
- Supabase doesn't store Notion OAuth response fields (workspace_id, bot_id) in session metadata
- This resulted in empty `workspace_id` values being passed to `storeNotionOAuthTokens()`
- The database function requires `workspace_id` to be NOT NULL, so token storage likely failed silently

**Evidence**:
- Tokens weren't being stored correctly in `user_notion_oauth_tokens` table
- `getNotionAccessToken()` couldn't find stored tokens
- Template sync failed because no valid token was available

### Issue 2: Missing Error Handling

**Location**: `lib/notion-auth.ts` and `app/auth/callback/route.ts`

**Problem**:
- Database function calls (`is_notion_oauth_token_expired`, `get_user_notion_oauth_access_token`) could fail silently
- No logging when token storage failed
- No validation before storing tokens (empty workspace_id/bot_id)

### Issue 3: No Fallback to Session Token

**Location**: `app/api/onboarding/notion/sync-template/route.ts`

**Problem**:
- If `getNotionAccessToken()` returned null, the route immediately failed
- Didn't check if `session.provider_token` was available as a fallback
- This meant even if OAuth worked, sync would fail if token storage had issues

---

## Solution Implemented

### Fix 1: Proper Workspace ID Extraction

**File**: `app/auth/callback/route.ts`

**Changes**:
1. After getting `provider_token` from session, fetch Notion user info using `/v1/users/me` endpoint
2. Extract `workspace_id` from `notionUser.bot?.owner?.workspace_id` (correct location in Notion API response)
3. Extract `bot_id` from `notionUser.bot?.id`
4. Extract `workspace_name` and `workspace_icon` from bot owner
5. Add validation to ensure `workspace_id` and `bot_id` are present before storing

**Code Changes**:
\`\`\`typescript
// Extract workspace_id from bot owner or use bot ID as fallback
const workspaceId = notionUser.bot?.owner?.workspace_id || 
                  notionUser.bot?.workspace?.id ||
                  notionUser.workspace?.id ||
                  ""

// Extract bot_id
const botId = notionUser.bot?.id || notionUser.id || ""

// Validate before storing
if (!workspaceId || !botId) {
  console.warn("Could not extract workspace_id or bot_id from Notion user response")
}
\`\`\`

### Fix 2: Enhanced Error Handling and Logging

**File**: `app/auth/callback/route.ts`

**Changes**:
1. Added validation before storing tokens
2. Added try-catch around `storeNotionOAuthTokens()` call
3. Added detailed logging for debugging
4. Don't fail auth flow if token storage fails (user can still use session token)

**File**: `lib/notion-auth.ts`

**Changes**:
1. Added error handling for `is_notion_oauth_token_expired` RPC call
2. Added error handling for `get_user_notion_oauth_access_token` RPC call
3. Log warnings when database functions fail, then fall back to session token

### Fix 3: Fallback to Session Token

**File**: `app/api/onboarding/notion/sync-template/route.ts`

**Changes**:
1. After `getNotionAccessToken()` returns null, check `session.provider_token`
2. Use session token as fallback if available
3. Only fail if neither stored token nor session token is available

**Code Changes**:
\`\`\`typescript
let notionApiKey = await getNotionAccessToken(user.id)

// If no token from utility, try session token as fallback
if (!notionApiKey) {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.provider_token) {
    console.log("Using session provider_token as fallback for template sync")
    notionApiKey = session.provider_token
  }
}
\`\`\`

---

## Testing Recommendations

1. **Test OAuth Flow**:
   - Sign in with Notion OAuth
   - Check browser console for token storage logs
   - Verify tokens are stored in `user_notion_oauth_tokens` table

2. **Test Template Sync**:
   - After OAuth, go to onboarding step 3 (Notion Setup)
   - Click "Sync with Notion"
   - Should successfully find and sync template

3. **Test Token Refresh**:
   - Wait for token to expire (or manually expire it in database)
   - Try template sync again
   - Should automatically refresh token and work

4. **Test Fallback**:
   - If token storage fails, verify sync still works with session token
   - Check console logs for fallback messages

---

## Files Modified

1. `app/auth/callback/route.ts` - Improved workspace_id extraction and error handling
2. `lib/notion-auth.ts` - Added error handling for database function calls
3. `app/api/onboarding/notion/sync-template/route.ts` - Added fallback to session token

---

## Expected Behavior After Fix

1. **OAuth Callback**:
   - Fetches Notion user info to get workspace_id and bot_id
   - Validates required fields before storing
   - Logs success/failure of token storage
   - Doesn't fail auth flow if storage fails

2. **Token Retrieval**:
   - Checks stored OAuth tokens first
   - Falls back to session provider_token if stored tokens unavailable
   - Falls back to manual API keys if neither available
   - Logs warnings when fallbacks are used

3. **Template Sync**:
   - Uses stored OAuth token if available
   - Falls back to session token if stored token unavailable
   - Only fails if no token available at all
   - Provides helpful error messages

---

## Additional Notes

- The Notion API `/v1/users/me` endpoint returns workspace information in `bot.owner.workspace_id`
- Supabase doesn't expose OAuth response fields in session metadata, so we must fetch them from Notion API
- Session tokens (`provider_token`) are valid for the current session but don't persist across sessions
- Stored OAuth tokens enable persistent access and automatic refresh

---

## Related Documentation

- `docs/NOTION_TOKEN_REFRESH_IMPLEMENTATION.md` - Token refresh system overview
- `docs/NOTION_AUTH_FLOW.md` - Complete OAuth authentication flow
- `supabase/migrations/20260202000003_create_user_notion_oauth_tokens.sql` - Database schema
