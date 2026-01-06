# API Test Script Status

**Date**: 2026-01-05  
**Status**: Connection Issue - Server Closing Socket

---

## Current Status

The API test script (`pnpm test:api`) has been improved with:
- ✅ Server detection with retries
- ✅ Supabase authentication working
- ✅ Cookie creation with proper base64url encoding
- ✅ HTTPS support for self-signed certificates
- ⚠️ **API calls failing**: Server closes connection immediately

---

## Problem

The test script successfully:
1. Detects the dev server is running
2. Authenticates users with Supabase
3. Creates cookies in the correct format (`sb-localhost-auth-token` with `base64-` prefixed base64url value)
4. Establishes HTTPS connection

However, when making API requests, the server immediately closes the socket connection:
```
SocketError: other side closed
code: 'UND_ERR_SOCKET'
bytesWritten: 1426 (request sent)
bytesRead: 0 (no response received)
```

---

## Cookie Implementation

### Current Format

```typescript
// Cookie name: sb-localhost-auth-token (fallback for localhost)
// Cookie value: base64-<base64url-encoded-session-json>
```

The cookie value includes:
- `base64-` prefix (Supabase SSR v0.3.0+)
- Base64URL-encoded JSON containing:
  - `access_token`
  - `refresh_token`
  - `expires_at`
  - `expires_in`
  - `token_type`

### Cookie Name Determination

For localhost Supabase (`https://127.0.0.1:55321`), the script tries:
1. Hash-based name: `sb-<hash>-auth-token` (from URL hash)
2. Fallback: `sb-localhost-auth-token`

---

## Possible Causes

1. **Cookie Name Mismatch**: Supabase SSR might use a different cookie name format for localhost
2. **Server-Side Error**: The API route might be crashing before responding
3. **Middleware Issue**: Next.js middleware might be rejecting the request
4. **Cookie Format**: The cookie value format might not match exactly what Supabase SSR expects

---

## Recommended Next Steps

### Option 1: Manual Testing (Recommended)

Test the API endpoints manually using:

1. **Browser DevTools**:
   - Start dev server: `pnpm dev`
   - Login at `https://127.0.0.1:3000/auth/login`
   - Open DevTools → Network tab
   - Test endpoints and inspect cookies

2. **Inspect Actual Cookies**:
   - After logging in, check browser cookies
   - Note the exact cookie name format
   - Use that format in the test script

### Option 2: Add Test Endpoint

Create a simple test endpoint that doesn't require auth to verify connection works:

```typescript
// app/api/test/route.ts
export async function GET() {
  return NextResponse.json({ message: 'Test endpoint works' })
}
```

### Option 3: Use Supabase Admin API

For testing, use the Supabase Admin API with service role key instead of cookies:

```typescript
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

---

## Current Cookie Format

- **Name**: `sb-localhost-auth-token`
- **Value**: `base64-<base64url-encoded-session>`
- **Length**: ~1203 characters
- **Encoding**: Base64URL (RFC 4648 Section 5)

---

## Files Modified

- `scripts/test-api-endpoints.ts`: Main test script
- Cookie creation function uses `@supabase/ssr`'s `stringToBase64URL`
- Cookie name uses hash-based approach with localhost fallback

---

## Next Actions

1. **Manual Testing**: Test endpoints in browser and inspect actual cookies
2. **Debug Server**: Check server logs for errors when requests arrive
3. **Alternative Approach**: Consider using Supabase Admin API for testing instead of cookies




