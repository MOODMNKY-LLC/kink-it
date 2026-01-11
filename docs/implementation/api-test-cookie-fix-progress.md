# API Test Cookie Fix Progress

**Date**: 2026-01-05  
**Status**: In Progress - Cookie Format Issue

---

## What's Working ✅

1. **Server Check**: Detects when dev server is running with retries
2. **Authentication**: Supabase auth works correctly (users can authenticate)
3. **Cookie Creation**: Cookies are being created with correct name format (`sb-localhost-auth-token`)
4. **HTTPS Support**: Self-signed certificates are handled correctly

---

## Current Issue ⚠️

The API calls are failing with `SocketError: other side closed`. The connection is established but immediately closed by the server.

**Error Details**:
\`\`\`
SocketError: other side closed
code: 'UND_ERR_SOCKET'
bytesWritten: 1435 (request is being sent)
bytesRead: 0 (no response received)
\`\`\`

---

## Cookie Implementation

### Current Approach

We're creating cookies manually from the Supabase session:

\`\`\`typescript
function createSupabaseCookies(session: { access_token: string; refresh_token: string }): string {
  const sessionPayload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
  })
  
  const encoded = Buffer.from(sessionPayload)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const cookieName = `sb-${PROJECT_REF}-auth-token`
  return `${cookieName}=${encodeURIComponent(encoded)}`
}
\`\`\`

### Cookie Format

- **Name**: `sb-localhost-auth-token` (for local development)
- **Value**: Base64URL-encoded JSON containing access_token and refresh_token
- **Encoding**: Base64URL (RFC 4648 Section 5)

---

## Possible Issues

1. **Cookie Value Format**: The cookie value might not match exactly what Supabase SSR expects
2. **Cookie Name**: For localhost, Supabase SSR might use a different naming convention
3. **Cookie Chunking**: Large cookies might need to be split (`.0`, `.1`, etc.)
4. **Server-Side Error**: The API route might be crashing before responding
5. **Middleware Interference**: The middleware might be rejecting the request

---

## Next Steps

### Option 1: Debug Server-Side
- Check server logs for errors
- Add logging to API routes to see if requests are reaching them
- Check middleware for any rejection logic

### Option 2: Verify Cookie Format
- Inspect actual cookies set by browser after login
- Compare with test script cookies
- Check Supabase SSR source code for exact format

### Option 3: Alternative Approach
- Use Supabase Admin API for testing (bypasses auth)
- Create test-specific authentication endpoint
- Use HTTP mode instead of HTTPS

### Option 4: Manual Testing
- Test via browser DevTools
- Use Postman/Insomnia with cookies from browser
- Document manual testing process

---

## Test Script Status

**File**: `scripts/test-api-endpoints.ts`

**Current State**:
- ✅ Server check implemented
- ✅ Authentication working
- ✅ Cookie creation implemented
- ⚠️ API calls failing (connection closed)

**To Run**:
\`\`\`bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run tests
pnpm test:api
\`\`\`

---

## Related Files

- `scripts/test-api-endpoints.ts` - Test script
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/middleware.ts` - Middleware for session refresh
- `app/api/submission-state/route.ts` - API route being tested
- `app/api/tasks/route.ts` - API route being tested

---

**Next Action**: Debug server-side to see why connection is being closed
