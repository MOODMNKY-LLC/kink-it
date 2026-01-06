# API Testing Note

**Date**: 2026-01-05  
**Issue**: API test script has authentication challenges

---

## Current Status

The API test script (`pnpm test:api`) has been improved but still has issues with authentication:

1. ✅ **Server Check**: Now works correctly - detects when server is running
2. ✅ **Authentication**: Supabase auth works (users can authenticate)
3. ⚠️ **API Calls**: Failing because Next.js API routes use cookie-based auth

---

## Problem

Next.js API routes use `createClient()` from `lib/supabase/server`, which reads authentication from cookies via `next/headers`. The test script is sending Authorization headers, but the API routes expect Supabase session cookies.

**Supabase SSR uses cookies like**:
- `sb-<project-ref>-auth-token` (access token)
- `sb-<project-ref>-auth-token.0`, `sb-<project-ref>-auth-token.1`, etc. (if token is large)
- `sb-<project-ref>-auth-code-verifier` (for PKCE)

---

## Solutions

### Option 1: Manual Testing (Recommended for Now)

Test the API endpoints manually using:
1. Browser DevTools Network tab
2. Postman/Insomnia
3. curl commands

### Option 2: Fix Test Script

To fix the test script, we need to:
1. Get the session cookies from Supabase auth
2. Set them properly in fetch requests
3. Handle cookie chunking if tokens are large

### Option 3: Use HTTP Mode

Test with HTTP dev server (`pnpm dev:http`) which might have different cookie handling.

---

## Manual Testing Guide

### Using Browser

1. **Start dev server**: `pnpm dev`
2. **Login**: Navigate to `https://127.0.0.1:3000/auth/login`
3. **Open DevTools**: F12 → Network tab
4. **Test endpoints**: 
   - Change submission state → See PATCH request
   - View tasks → See GET request
   - Create task → See POST request

### Using curl

```bash
# First, login and get cookies (manual process)
# Then use cookies in curl:

curl -k -X GET https://127.0.0.1:3000/api/submission-state \
  -H "Cookie: sb-<project-ref>-auth-token=<token>"
```

---

## Next Steps

1. ⏳ Fix test script to properly handle Supabase SSR cookies
2. ⏳ Or document manual testing process
3. ⏳ Or create a simpler test that uses the Supabase client directly

---

**Status**: Test script partially working - server check works, API calls need cookie fix





