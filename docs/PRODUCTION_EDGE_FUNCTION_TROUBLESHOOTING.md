# Production Edge Function Connection Troubleshooting

## Issue

Cannot connect to Edge Function in production:
\`\`\`
Cannot connect to Edge Function at https://rbloeqwxivfzxmfropek.supabase.co/functions/v1/chat-stream
\`\`\`

## Function Status

✅ **Function is deployed and ACTIVE**
- Function ID: `f2651086-9ae2-40b1-bcc4-c11c1dc466a6`
- Status: ACTIVE
- Version: 10
- Endpoint is reachable (SSL connection successful)

## Root Causes

### 1. Environment Variables Not Set in Vercel (Most Likely)

**Problem**: `NEXT_PUBLIC_SUPABASE_URL` is not set correctly in Vercel production environment.

**Solution**: 
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set to: `https://rbloeqwxivfzxmfropek.supabase.co`
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set to your production anon key
4. Redeploy the application

### 2. CORS Issues

**Problem**: Browser blocking cross-origin requests.

**Solution**: Edge Function already has CORS headers configured. If issue persists:
- Check browser console for CORS errors
- Verify `Access-Control-Allow-Origin: *` header is present
- Check if preflight OPTIONS request succeeds

### 3. Authentication Issues

**Problem**: Access token invalid or expired.

**Solution**:
- Ensure user is logged in
- Check browser console for auth errors
- Verify session is valid: `supabase.auth.getSession()`

### 4. Network/Firewall Issues

**Problem**: Network blocking the connection.

**Solution**:
- Check browser network tab for blocked requests
- Verify firewall isn't blocking Supabase domain
- Test from different network

## Verification Steps

### Step 1: Check Environment Variables

In production browser console:
\`\`\`javascript
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing")
\`\`\`

Should show:
- URL: `https://rbloeqwxivfzxmfropek.supabase.co`
- Anon Key: `Set`

### Step 2: Test Function Endpoint

In browser console:
\`\`\`javascript
fetch('https://rbloeqwxivfzxmfropek.supabase.co/functions/v1/chat-stream', {
  method: 'OPTIONS',
  headers: {
    'apikey': 'YOUR_ANON_KEY'
  }
})
.then(r => console.log('CORS OK:', r.status))
.catch(e => console.error('CORS Error:', e))
\`\`\`

Should return status 200 or 204 (CORS preflight success).

### Step 3: Check Function Logs

In Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/rbloeqwxivfzxmfropek/functions
2. Click on `chat-stream`
3. Check "Logs" tab for errors

### Step 4: Verify Function Deployment

\`\`\`bash
supabase functions list --project-ref rbloeqwxivfzxmfropek
\`\`\`

Should show `chat-stream` as ACTIVE.

## Quick Fixes

### Fix 1: Set Vercel Environment Variables

\`\`\`bash
# Via Vercel CLI (if available)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://rbloeqwxivfzxmfropek.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Enter: your-production-anon-key
\`\`\`

Or via Dashboard:
1. https://vercel.com/mood-mnkys-projects/kink-it/settings/environment-variables
2. Add `NEXT_PUBLIC_SUPABASE_URL` = `https://rbloeqwxivfzxmfropek.supabase.co`
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your production anon key
4. Redeploy

### Fix 2: Redeploy Function

\`\`\`bash
supabase functions deploy chat-stream --project-ref rbloeqwxivfzxmfropek
\`\`\`

### Fix 3: Check Browser Console

Open browser DevTools → Console and look for:
- Connection errors
- CORS errors
- Authentication errors
- Network errors

## Expected Behavior

### Successful Connection

Browser console should show:
\`\`\`
🔗 Connecting to Edge Function: https://rbloeqwxivfzxmfropek.supabase.co/functions/v1/chat-stream
📋 Connection details: { supabaseUrl: "...", functionUrl: "...", ... }
✅ SSE connection opened successfully
📡 Streaming chat messages...
\`\`\`

### Failed Connection

Browser console will show:
\`\`\`
❌ SSE connection error: ...
📋 SSE error details: { status: 0, url: "...", ... }
\`\`\`

## Production URLs

- **Supabase Project**: `https://rbloeqwxivfzxmfropek.supabase.co`
- **Edge Function**: `https://rbloeqwxivfzxmfropek.supabase.co/functions/v1/chat-stream`
- **Dashboard**: https://supabase.com/dashboard/project/rbloeqwxivfzxmfropek

## Next Steps

1. ✅ Verify function is deployed (done)
2. ⏳ Check Vercel environment variables
3. ⏳ Test endpoint in browser console
4. ⏳ Check function logs for errors
5. ⏳ Verify authentication is working

---

**Last Updated**: 2026-01-08
