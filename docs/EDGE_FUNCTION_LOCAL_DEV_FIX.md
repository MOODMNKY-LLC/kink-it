# Edge Function Local Development Connection Fix

## Issue
Edge Function connection failing in local development with error:
\`\`\`
Cannot connect to Edge Function at https://127.0.0.1:55321/functions/v1/chat-stream
\`\`\`

## Root Cause
The Edge Function needs to be running locally for local development. The error occurs because:
1. Local Supabase is running (port 55321)
2. Edge Function is NOT running/served
3. Connection attempts fail with status 0 (no HTTP response)

## Solution

### For Local Development

**Start the Edge Function** in a separate terminal:

\`\`\`bash
# Option 1: Using pnpm script
pnpm functions:serve

# Option 2: Using Supabase CLI directly
supabase functions serve chat-stream --no-verify-jwt

# Option 3: Serve all functions
pnpm functions:serve:all
# OR
supabase functions serve --no-verify-jwt
\`\`\`

### What Changed

1. **Local Development Detection**: Added automatic detection of local vs production environment
2. **Better Error Messages**: Error messages now provide specific instructions for local development
3. **Environment Logging**: Console logs now show environment (Local/Production) and helpful commands

### Code Changes

**File**: `hooks/use-chat-stream.ts`

\`\`\`typescript
// Detect if we're in local development
const isLocalDev = supabaseUrl.includes("127.0.0.1") || 
                   supabaseUrl.includes("localhost") || 
                   supabaseUrl.includes("::1")

// Improved error messages based on environment
if (status === 404 || status === 0) {
  if (isLocalDev) {
    errorMsg = `Edge Function not found at ${functionUrl}.\n\nFor local development, start the function:\n  pnpm functions:serve\n\nOr:\n  supabase functions serve chat-stream --no-verify-jwt`
  } else {
    errorMsg = `Edge Function not found at ${functionUrl}. Check if the function is deployed.`
  }
}
\`\`\`

## Testing

### Local Development
1. Start Supabase: `supabase start` (or it's already running)
2. Start Edge Function: `pnpm functions:serve`
3. Test chat interface - should connect successfully

### Production
- Function should be automatically deployed
- No manual steps needed

## Troubleshooting

### Function Still Not Connecting Locally

1. **Check if function is running**:
   \`\`\`bash
   # Should see output like:
   # Functions URL: http://127.0.0.1:54321/functions/v1
   # Functions:
   #   - chat-stream
   \`\`\`

2. **Check port conflicts**:
   - Default: `54321` (functions port)
   - Check `supabase/config.toml` for custom ports

3. **Check function logs**:
   \`\`\`bash
   # In the terminal running the function, you should see:
   # Listening on http://127.0.0.1:54321/functions/v1/chat-stream
   \`\`\`

4. **Verify URL matches**:
   - Check `supabase status` output
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` matches the status output

### Common Issues

**Issue**: Function starts but connection still fails
- **Solution**: Check CORS headers in Edge Function
- **Solution**: Verify `--no-verify-jwt` flag is used for local dev

**Issue**: Port mismatch
- **Solution**: Check `supabase/config.toml` for correct port
- **Solution**: Update `.env.local` if needed

**Issue**: Function not found in production
- **Solution**: Deploy function: `supabase functions deploy chat-stream`
- **Solution**: Check function is listed: `supabase functions list`

---

**Date**: 2025-02-01
**Author**: CODE MNKY
**Status**: Fixed
