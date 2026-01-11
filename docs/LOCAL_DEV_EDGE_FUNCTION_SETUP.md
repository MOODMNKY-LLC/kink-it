# Local Development Edge Function Setup

## Current Issue
Edge Function connection fails in local development because the function is not running.

## Root Cause
**Local Development**: Edge Functions must be explicitly started with `pnpm functions:serve`
**Production**: Edge Functions are automatically deployed and always available

## Solution: Start the Function

### Step 1: Start Supabase (if not already running)
\`\`\`bash
supabase start
\`\`\`

### Step 2: Start the Edge Function
\`\`\`bash
# Option 1: Start only chat-stream function
pnpm functions:serve

# Option 2: Start all functions
pnpm functions:serve:all

# Option 3: Direct Supabase CLI
supabase functions serve chat-stream --no-verify-jwt
\`\`\`

### Step 3: Verify Function is Running
You should see output like:
\`\`\`
Functions URL: http://127.0.0.1:54321/functions/v1
Functions:
  - chat-stream
\`\`\`

### Step 4: Test Connection
The chat interface should now connect successfully. Check browser console for:
\`\`\`
✅ Edge Function is reachable
✅ SSE connection opened successfully
📡 Streaming chat messages...
\`\`\`

## Why Production Will Work

### Production Deployment
1. **Auto-Deployment**: Functions are deployed with `supabase functions deploy`
2. **Always Available**: Functions run continuously in production
3. **No Manual Steps**: No need to start functions manually
4. **HTTPS**: Production uses proper HTTPS (no cert issues)

### Production Flow
\`\`\`
Client → Production Supabase URL → Edge Function (auto-deployed) → SSE Stream ✅
\`\`\`

### Local Development Flow
\`\`\`
Client → Local Supabase URL → Edge Function (must be running) → SSE Stream ✅
\`\`\`

**Requirement**: Function must be started with `pnpm functions:serve`

## Verification Checklist

### ✅ Local Development (Function Running)
- [ ] Supabase is running: `supabase start`
- [ ] Edge Function is running: `pnpm functions:serve`
- [ ] Function appears in terminal output
- [ ] Chat interface connects successfully
- [ ] Console shows "✅ Edge Function is reachable"
- [ ] Messages stream correctly

### ✅ Production
- [ ] Function is deployed: `supabase functions deploy chat-stream`
- [ ] Function appears in dashboard
- [ ] Chat interface connects successfully
- [ ] Messages stream correctly
- [ ] No manual steps needed

## Troubleshooting

### Connection Refused (Local)
**Error**: `Failed to connect to 127.0.0.1:54321`

**Solution**:
1. Check if Supabase is running: `supabase status`
2. Start Edge Function: `pnpm functions:serve`
3. Verify function appears in output
4. Refresh browser

### Function Not Found (Production)
**Error**: `Edge Function not found at [URL]`

**Solution**:
1. Deploy function: `supabase functions deploy chat-stream`
2. Verify deployment: `supabase functions list`
3. Check function logs in dashboard
4. Refresh browser

### CORS Issues
**Error**: CORS error in console

**Solution**:
- Function already handles CORS (OPTIONS request)
- Verify `Access-Control-Allow-Origin: *` header
- Check browser console for specific CORS error

## Health Check Feature

The code now includes a health check that:
1. Tests function availability before connecting
2. Provides clear error messages
3. Shows instructions if function isn't running
4. Works automatically in production

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
- 💡 Console shows: "Start with: pnpm functions:serve"

### Production
- ✅ Function auto-available
- ✅ SSE connection opens
- ✅ Messages stream correctly
- ✅ No manual steps needed

## Quick Start Commands

\`\`\`bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Edge Function
pnpm functions:serve

# Terminal 3: Start Next.js
pnpm dev
\`\`\`

Then open the chat interface in your browser.

---

**Date**: 2025-02-01
**Status**: Verified - Production Ready
**Note**: Local development requires explicit function serving. Production works automatically.
