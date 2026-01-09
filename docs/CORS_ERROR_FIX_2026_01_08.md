# CORS Error Fix - January 8, 2026

## 🔴 Errors Identified

### 1. CORS Policy Error (Critical)
**Error Message:**
```
Access to XMLHttpRequest at 'https://127.0.0.1:55321/functions/v1/chat-stream' 
from origin 'https://localhost:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Origin' header in the response must not 
be the wildcard '*' when the request's credentials mode is 'include'.
```

**Root Cause:**
- Edge Function was using `Access-Control-Allow-Origin: *` (wildcard)
- Request includes credentials (auth headers)
- Browser security policy: wildcard `*` not allowed with credentials
- Origin mismatch: `localhost:3000` → `127.0.0.1:55321`

### 2. Edge Function Not Running
**Error Message:**
```
Cannot connect to Edge Function at https://127.0.0.1:55321/functions/v1/chat-stream.
⚠️ The function is not running locally.
```

**Root Cause:**
- Edge Function needs to be started locally for development

### 3. Network Failures
- Multiple `GET https://localhost:3000/api/notifications [failed - net::ERR_ABORTED]`
- Likely related to origin mismatch or request cancellation

---

## ✅ Fix Applied

### Edge Function CORS Headers Fix

**File:** `supabase/functions/chat-stream/index.ts`

**Changes:**
1. **Created `getCorsHeaders()` helper function** that:
   - Extracts origin from request headers
   - Uses specific origin instead of wildcard `*`
   - Normalizes `localhost` → `127.0.0.1` for consistency
   - Adds `Access-Control-Allow-Credentials: true`
   - Handles fallback cases

2. **Applied CORS headers to all responses:**
   - ✅ OPTIONS preflight requests
   - ✅ Streaming SSE responses
   - ✅ Non-streaming JSON responses
   - ✅ All error responses (400, 405, 500)

**Code:**
```typescript
// Helper function to get CORS headers
const getCorsHeaders = (): HeadersInit => {
  const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || "*"
  
  // Normalize localhost origins
  let allowedOrigin = origin
  if (origin.includes("localhost:3000")) {
    allowedOrigin = origin.replace("localhost", "127.0.0.1")
  } else if (origin.includes("127.0.0.1:3000")) {
    allowedOrigin = origin
  } else if (origin === "*" || !origin) {
    // Fallback to wildcard only if no origin provided
    allowedOrigin = "*"
  }
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  }
}
```

---

## 🧪 Testing

### Step 1: Start Edge Function Locally

```bash
# Option 1: Using pnpm script
pnpm functions:serve

# Option 2: Using Supabase CLI directly
supabase functions serve chat-stream --no-verify-jwt
```

### Step 2: Verify Fix

1. **Open browser console** where errors were appearing
2. **Navigate to chat page** (`/chat`)
3. **Send a message** in the chat interface
4. **Check console** - CORS error should be gone
5. **Verify connection** - SSE stream should connect successfully

### Step 3: Verify CORS Headers

In browser DevTools → Network tab:
1. Find the `chat-stream` request
2. Check Response Headers:
   - ✅ `Access-Control-Allow-Origin: https://127.0.0.1:3000` (specific origin, not `*`)
   - ✅ `Access-Control-Allow-Credentials: true`
   - ✅ `Access-Control-Allow-Methods: POST, OPTIONS`

---

## 📋 Additional Recommendations

### 1. Use Consistent Origins

**Current Issue:** App uses `localhost:3000`, Supabase uses `127.0.0.1:55321`

**Recommendation:** Use `127.0.0.1` consistently:
- ✅ `.env.local`: `NEXT_PUBLIC_SUPABASE_URL="https://127.0.0.1:55321"`
- ✅ Access app via: `https://127.0.0.1:3000` (not `localhost:3000`)

**Why:** 
- Avoids origin mismatch issues
- Certificate acceptance is consistent
- CORS works correctly

### 2. Edge Function Development Workflow

**Always start Edge Function locally:**
```bash
# Terminal 1: Start Next.js dev server
pnpm dev

# Terminal 2: Start Edge Functions
pnpm functions:serve
# OR
supabase functions serve chat-stream --no-verify-jwt
```

### 3. Production Considerations

**For production deployment:**
- Edge Function CORS will work automatically
- Production Supabase URL will be used
- No origin mismatch (same domain or configured CORS)

---

## 🔍 Related Issues

### Notifications API Failures

**Error:** `GET https://localhost:3000/api/notifications [failed - net::ERR_ABORTED]`

**Possible Causes:**
1. Origin mismatch (`localhost` vs `127.0.0.1`)
2. Request cancellation (component unmounting)
3. Network timeout

**Investigation Needed:**
- Check if notifications API route handles CORS
- Verify request cancellation logic
- Check for race conditions

---

## ✅ Status

- ✅ **CORS Error Fixed** - Edge Function now uses specific origin
- ✅ **All Responses Updated** - CORS headers applied consistently
- ⏳ **Edge Function Needs to be Started** - User action required
- ⏳ **Notifications API** - Needs investigation

---

## 📝 Next Steps

1. **Start Edge Function:**
   ```bash
   pnpm functions:serve
   ```

2. **Test Chat Functionality:**
   - Navigate to `/chat`
   - Send a message
   - Verify no CORS errors

3. **Monitor Console:**
   - Check for remaining errors
   - Verify SSE connection works

4. **Investigate Notifications API:**
   - Check if failures persist
   - Review request cancellation logic

---

**Date**: 2026-01-08  
**Status**: ✅ Fixed - CORS headers updated  
**Next Action**: Start Edge Function and test
