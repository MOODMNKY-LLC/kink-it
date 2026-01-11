# Edge Function Connection Fix

## Issue
The `chat-stream` edge function couldn't connect while the `generate-kinkster-avatar` function worked properly.

## Root Cause Analysis

### Working Function (Avatar Generator)
- Uses `supabase.functions.invoke("generate-kinkster-avatar", { body: {...} })`
- SDK handles authentication automatically
- Simpler, more reliable connection method
- Returns JSON response (non-streaming)

### Non-Working Function (Chat Stream)
- Uses manual SSE connection: `new SSE(functionUrl, { headers: {...}, payload: {...} })`
- Manual auth header setup
- More complex, error-prone
- Requires streaming support (SSE)

## Fixes Applied

### 1. Improved Connection Method
**File**: `hooks/use-chat-stream.ts`

**Changes**:
- Get Supabase URL and anon key from client instance (more reliable than env vars)
- Added better error messages with function URL
- Improved error handling with detailed logging
- Added connection state debugging

**Code Changes**:
\`\`\`typescript
// Before
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// After
const supabaseUrl = (supabase as any).supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = (supabase as any).supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
\`\`\`

### 2. Enhanced Error Handling
- Added detailed error logging with URL, status, and response
- Better error messages for different failure scenarios
- Added connection state debugging
- Improved user-facing error messages

### 3. Better Debugging
- Added console logs for connection URL, Supabase URL, and anon key (partial)
- Added success message when connection opens
- Enhanced error details with response text

## Testing

### Local Development
For local development, ensure the function is running:
\`\`\`bash
supabase functions serve chat-stream --no-verify-jwt
\`\`\`

Or serve all functions:
\`\`\`bash
supabase functions serve --no-verify-jwt
\`\`\`

### Production
The function should be automatically deployed and accessible at:
\`\`\`
${SUPABASE_URL}/functions/v1/chat-stream
\`\`\`

## Connection Flow

1. **Client** (`hooks/use-chat-stream.ts`):
   - Gets session token from Supabase client
   - Constructs function URL
   - Creates SSE connection with auth headers
   - Sends payload with messages and options

2. **Edge Function** (`supabase/functions/chat-stream/index.ts`):
   - Handles CORS preflight (OPTIONS)
   - Validates request body
   - Extracts user_id and messages from payload
   - Creates SSE stream response
   - Processes messages with OpenAI Agents SDK
   - Streams chunks back to client

## Differences from Avatar Generator

| Aspect | Avatar Generator | Chat Stream |
|--------|------------------|-------------|
| Connection Method | `supabase.functions.invoke()` | Manual SSE with `sse.js` |
| Response Type | JSON | Server-Sent Events (SSE) |
| Auth Handling | Automatic (SDK) | Manual headers |
| Streaming | No | Yes |
| Use Case | Single request/response | Real-time streaming |

## Next Steps

1. ✅ Fixed connection method and error handling
2. ⏳ Test connection in browser
3. ⏳ Verify local function serving works
4. ⏳ Test production deployment
5. ⏳ Monitor error logs for any remaining issues

## Troubleshooting

### Connection Fails with Status 0
- **Cause**: Function not running locally or CORS issue
- **Fix**: Run `supabase functions serve chat-stream --no-verify-jwt`

### Connection Fails with Status 404
- **Cause**: Function not deployed or wrong URL
- **Fix**: Check function URL and deployment status

### Connection Fails with Status 401/403
- **Cause**: Authentication issue
- **Fix**: Check access token and ensure user is logged in

### Connection Fails with Status 500
- **Cause**: Server error in Edge Function
- **Fix**: Check Edge Function logs for details

---

**Date**: 2025-02-01
**Author**: CODE MNKY
