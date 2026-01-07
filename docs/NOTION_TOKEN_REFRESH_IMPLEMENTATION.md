# Notion OAuth Token Refresh Implementation

**Date**: 2026-02-02  
**Status**: ✅ Implementation Complete

---

## Problem Statement

Users were required to complete the full Notion OAuth authentication process on every login because:

1. Access tokens were only stored in Supabase session (`session.provider_token`)
2. Refresh tokens were not being stored persistently
3. When sessions expired, tokens were lost
4. No automatic token refresh mechanism existed

---

## Solution Overview

Implemented a comprehensive token refresh system that:

1. **Persistent Token Storage**: Stores both access and refresh tokens in encrypted database table
2. **Automatic Refresh**: Automatically refreshes expired tokens before API calls
3. **Backward Compatibility**: Falls back to session tokens and manual API keys
4. **Secure Encryption**: Uses pgcrypto for token encryption at rest

---

## Implementation Details

### 1. Database Schema

**Table**: `user_notion_oauth_tokens`

Stores encrypted OAuth tokens with:
- `access_token_encrypted`: Encrypted access token
- `refresh_token_encrypted`: Encrypted refresh token  
- `bot_id`: Notion bot identifier
- `workspace_id`: Notion workspace ID
- `workspace_name`: Human-readable workspace name
- `expires_at`: Token expiration timestamp
- Full RLS policies for user access

**Migration**: `20260202000003_create_user_notion_oauth_tokens.sql`

### 2. Token Management Utility

**File**: `lib/notion-auth.ts`

Key functions:

- `storeNotionOAuthTokens()`: Stores tokens after OAuth callback
- `getNotionAccessToken()`: Gets valid token, refreshes if needed
- `refreshNotionAccessToken()`: Exchanges refresh token for new access token

**Token Refresh Logic**:
1. Check if token exists and is expired (within 5-minute buffer)
2. If expired, use refresh_token to get new access_token
3. Update stored tokens in database
4. Return valid access_token

**Fallback Chain**:
1. Stored OAuth tokens (with refresh)
2. Session provider_token (if available)
3. Manual API keys (backward compatibility)

### 3. OAuth Callback Handler

**File**: `app/auth/callback/route.ts`

Updated to:
- Extract tokens from OAuth response
- Store tokens in database after successful authentication
- Handle token data passed from custom callback (if implemented)

**Token Extraction**:
- Attempts to get tokens from session (`provider_token`, `provider_refresh_token`)
- Fetches workspace info from Notion API
- Stores all token data securely

### 4. API Route Updates

Updated routes to use `getNotionAccessToken()` utility:

- `app/api/onboarding/notion/sync-template/route.ts`
- `app/api/onboarding/notion/verify-template/route.ts`

**Benefits**:
- Automatic token refresh before API calls
- Consistent token access across all routes
- Better error handling and fallbacks

---

## Token Refresh Flow

```
User makes API request
    ↓
getNotionAccessToken(userId) called
    ↓
Check stored token expiry
    ↓
Token expired? → Refresh using refresh_token
    ↓
Update stored tokens
    ↓
Return valid access_token
    ↓
API call proceeds with valid token
```

---

## Security Considerations

1. **Encryption**: All tokens encrypted using pgcrypto before storage
2. **RLS Policies**: Users can only access their own tokens
3. **Environment Variables**: Encryption key stored in environment
4. **SECURITY DEFINER**: Database functions use elevated privileges safely
5. **No Client Exposure**: Refresh tokens never exposed to client

---

## Migration Steps

1. **Apply Migration**:
   ```bash
   supabase migration up
   ```

2. **Environment Variables** (already configured):
   - `NOTION_API_KEY_ENCRYPTION_KEY` or `SUPABASE_ENCRYPTION_KEY`
   - `SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID`
   - `SUPABASE_AUTH_EXTERNAL_NOTION_SECRET`

3. **Test Flow**:
   - User authenticates with Notion OAuth
   - Tokens are stored automatically
   - API calls use stored tokens
   - Tokens refresh automatically when expired

---

## Known Limitations

1. **Supabase OAuth Limitation**: Supabase Auth may not expose `provider_refresh_token` directly in session object. Current implementation:
   - Attempts to extract from session
   - Falls back to empty refresh_token if not available
   - Requires re-authentication if refresh_token is missing

2. **Future Enhancement**: Consider implementing custom OAuth callback handler that exchanges code directly with Notion to capture refresh_token reliably.

---

## Testing Checklist

- [ ] User authenticates with Notion OAuth
- [ ] Tokens are stored in `user_notion_oauth_tokens` table
- [ ] API calls succeed using stored tokens
- [ ] Token refresh works when access_token expires
- [ ] Fallback to session token works if stored token missing
- [ ] Fallback to manual API keys works
- [ ] Error handling works for expired refresh tokens

---

## Related Files

- `supabase/migrations/20260202000003_create_user_notion_oauth_tokens.sql`
- `lib/notion-auth.ts`
- `app/auth/callback/route.ts`
- `app/api/onboarding/notion/sync-template/route.ts`
- `app/api/onboarding/notion/verify-template/route.ts`

---

## References

- [Notion OAuth Documentation](https://developers.notion.com/docs/authorization)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

