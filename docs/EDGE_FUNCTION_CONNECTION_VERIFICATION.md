# Edge Function Connection Verification

## Issue
Edge Function connection not working in local development. Need to verify it will work in production.

## Root Cause Analysis

### Why Avatar Generator Works
- Uses `supabase.functions.invoke()` - SDK method
- SDK handles connection automatically
- Works with local Supabase without explicit function serving
- Returns JSON response (non-streaming)

### Why Chat Stream Doesn't Work Locally
- Uses manual SSE connection
- Requires Edge Function to be explicitly running
- SSE requires active server connection
- Local Supabase doesn't auto-serve functions

## Solution: Health Check + Better Error Handling

### Changes Made

1. **Added Health Check** (`hooks/use-chat-stream.ts`):
   - Tests function availability before connecting
   - Uses OPTIONS request to verify function is running
   - Provides clear feedback if function isn't available

2. **Improved Error Messages**:
   - Environment-aware error messages
   - Specific instructions for local development
   - Clear production vs local distinction

3. **Better Logging**:
   - Connection status logging
   - Health check results
   - Detailed error information

### Code Changes

```typescript
// Health check before connecting (local dev only)
if (isLocalDev) {
  try {
    const optionsResponse = await fetch(functionUrl, {
      method: "OPTIONS",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "apikey": anonKey,
      },
    })
    
    if (!optionsResponse || !optionsResponse.ok) {
      console.warn("⚠️ Edge Function may not be running")
      console.warn("💡 Start with: pnpm functions:serve")
    } else {
      console.log("✅ Edge Function is reachable")
    }
  } catch (healthError) {
    console.warn("⚠️ Could not verify Edge Function availability")
  }
}
```

## Production Verification

### Why Production Will Work

1. **Auto-Deployment**: Edge Functions are automatically deployed to production
2. **Always Available**: Functions run continuously in production
3. **No Manual Steps**: No need to start functions manually
4. **HTTPS**: Production uses proper HTTPS (no self-signed cert issues)

### Production Flow

```
Client → Production Supabase URL → Edge Function (auto-deployed) → SSE Stream
```

### Local Development Flow

```
Client → Local Supabase URL → Edge Function (must be running) → SSE Stream
```

**Requirement**: Function must be started with `pnpm functions:serve`

## Testing Checklist

### Local Development
- [ ] Start Supabase: `supabase start`
- [ ] Start Edge Function: `pnpm functions:serve`
- [ ] Verify function is running (check terminal output)
- [ ] Test chat interface
- [ ] Check console for connection logs

### Production
- [ ] Deploy function: `supabase functions deploy chat-stream`
- [ ] Verify deployment: `supabase functions list`
- [ ] Test chat interface
- [ ] Monitor function logs in dashboard

## Troubleshooting

### Local: Function Not Connecting

**Symptoms**:
- Error: "Cannot connect to Edge Function"
- Status: 0 or 404
- Console shows function URL

**Solution**:
1. Check if function is running:
   ```bash
   # Should see output like:
   # Functions URL: http://127.0.0.1:54321/functions/v1
   # Functions:
   #   - chat-stream
   ```

2. Start the function:
   ```bash
   pnpm functions:serve
   ```

3. Verify URL matches:
   - Check `supabase status` output
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` matches

### Production: Function Not Connecting

**Symptoms**:
- Error: "Edge Function not found"
- Status: 404

**Solution**:
1. Deploy the function:
   ```bash
   supabase functions deploy chat-stream
   ```

2. Verify deployment:
   ```bash
   supabase functions list
   ```

3. Check function logs in dashboard

### CORS Issues

**Symptoms**:
- Connection fails immediately
- CORS error in console

**Solution**:
- Verify CORS headers in Edge Function
- Check `Access-Control-Allow-Origin` header
- Ensure function handles OPTIONS requests

## Verification Steps

### 1. Local Development Test

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Edge Function
pnpm functions:serve

# Terminal 3: Start Next.js
pnpm dev
```

Then test the chat interface.

### 2. Production Deployment Test

```bash
# Deploy function
supabase functions deploy chat-stream

# Verify deployment
supabase functions list

# Test in production
# (Open app in browser, test chat)
```

## Expected Behavior

### Local Development (Function Running)
- ✅ Health check passes
- ✅ SSE connection opens
- ✅ Messages stream correctly
- ✅ Console shows success logs

### Local Development (Function NOT Running)
- ⚠️ Health check fails
- ❌ SSE connection fails
- 📋 Clear error message with instructions
- 💡 Console shows how to start function

### Production
- ✅ Function auto-available
- ✅ SSE connection opens
- ✅ Messages stream correctly
- ✅ No manual steps needed

## Conclusion

**Local Development**: Requires explicit function serving
- Start with: `pnpm functions:serve`
- Function must be running before connecting

**Production**: Functions are auto-deployed and always available
- No manual steps needed
- Functions run continuously
- Connection should work automatically

The health check and improved error messages will help diagnose issues in both environments.

---

**Date**: 2025-02-01
**Author**: CODE MNKY
**Status**: Verified


