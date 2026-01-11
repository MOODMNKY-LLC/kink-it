# Edge Function SSE Connection Fix - Self-Signed Certificate

## 🔴 Issue

After running `supabase functions serve chat-stream --no-verify-jwt`, you still get:

\`\`\`
Cannot connect to Edge Function at https://127.0.0.1:55321/functions/v1/chat-stream
⚠️ The function is not running locally.
\`\`\`

## 🎯 Root Cause

The Edge Function **IS running**, but your **browser is blocking the SSE connection** because it hasn't accepted Supabase's self-signed certificate yet.

### Why This Happens

1. Supabase runs with TLS enabled (`api.tls.enabled = true`) for local development
2. Supabase uses a **self-signed certificate** (auto-generated)
3. Browsers **block SSE connections** to HTTPS endpoints with untrusted certificates
4. Even though the function is running, the browser won't connect

## ✅ Solution: Accept the Certificate

### Step 1: Accept Supabase's Certificate

**In your browser:**

1. Navigate to: `https://127.0.0.1:55321`
2. You'll see a security warning: "Your connection is not private"
3. Click **"Advanced"** or **"Show Details"**
4. Click **"Proceed to 127.0.0.1 (unsafe)"** or **"Accept the Risk and Continue"**
5. The page should load (you might see a JSON response or error - that's fine)

### Step 2: Verify Function is Running

**In your terminal where you ran `supabase functions serve`:**

You should see output like:
\`\`\`
Functions URL: http://127.0.0.1:54321/functions/v1
Functions:
  - chat-stream
\`\`\`

**Note:** The function serve command shows HTTP port 54321, but it proxies through Supabase API on HTTPS port 55321.

### Step 3: Test the Connection

After accepting the certificate:

1. **Refresh your chat page**
2. **Try sending a message**
3. The connection should now work!

## 🔍 Verification

### Check Function is Running

\`\`\`bash
# Check if process is running
ps aux | grep "supabase functions serve" | grep -v grep

# Should show:
# moodmnky  <PID>  ... supabase functions serve --no-verify-jwt
\`\`\`

### Test Function Directly

\`\`\`bash
# Test with curl (bypasses browser certificate check)
curl -k https://127.0.0.1:55321/functions/v1/chat-stream \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"user_id":"test","messages":[]}'

# Should return an error (not a connection error):
# {"error":"user_id and messages are required"}
# This means the function IS accessible!
\`\`\`

### Check Browser Console

After accepting the certificate, check your browser console:

**Before accepting certificate:**
- ❌ `Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID`
- ❌ `Cannot connect to Edge Function`

**After accepting certificate:**
- ✅ `🔗 Connecting to Edge Function: https://127.0.0.1:55321/functions/v1/chat-stream`
- ✅ `✅ SSE connection opened successfully`
- ✅ `📡 Streaming chat messages...`

## 🐛 Troubleshooting

### Still Getting Connection Errors?

**1. Verify Function is Actually Running**

\`\`\`bash
# Check process
ps aux | grep "supabase functions serve"

# Restart if needed
# Stop: Ctrl+C in the terminal running the function
# Start: supabase functions serve chat-stream --no-verify-jwt
\`\`\`

**2. Check Supabase Status**

\`\`\`bash
supabase status

# Should show:
# Edge Functions │ https://127.0.0.1:55321/functions/v1
\`\`\`

**3. Clear Browser Cache**

Sometimes browsers cache certificate rejections:

- **Chrome/Edge**: Settings → Privacy → Clear browsing data → Cached images and files
- **Firefox**: Settings → Privacy → Clear Data → Cached Web Content
- **Safari**: Develop → Empty Caches

**4. Try Incognito/Private Mode**

Test in incognito mode to rule out browser extensions or cached certificates:

- **Chrome**: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- **Firefox**: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- **Safari**: `Cmd+Shift+N`

**5. Check CORS Headers**

The Edge Function should have CORS headers. Check `supabase/functions/chat-stream/index.ts`:

\`\`\`typescript
// Should include:
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
}
\`\`\`

## 📋 Quick Checklist

- [ ] Supabase is running: `supabase status` shows services running
- [ ] Function is running: `ps aux | grep "supabase functions serve"` shows process
- [ ] Certificate accepted: Navigated to `https://127.0.0.1:55321` and accepted certificate
- [ ] Browser console shows connection attempts (not certificate errors)
- [ ] Function responds to curl test (returns error, not connection error)

## 🚀 Alternative: Use HTTP for Functions (Not Recommended)

If you continue having issues, you could temporarily disable TLS for Supabase:

**⚠️ Warning:** This breaks Notion OAuth (requires HTTPS)

1. Edit `supabase/config.toml`:
   \`\`\`toml
   [api.tls]
   enabled = false  # Change from true to false
   \`\`\`

2. Restart Supabase:
   \`\`\`bash
   supabase stop
   supabase start
   \`\`\`

3. Update `.env.local`:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
   \`\`\`

**But this will break OAuth!** Only use if you're not testing OAuth flows.

## 📚 Related Documentation

- [FIX_504_TIMEOUT_ERROR.md](./FIX_504_TIMEOUT_ERROR.md) - Node.js certificate handling
- [NOTION_OAUTH_HTTPS_SETUP.md](../NOTION_OAUTH_HTTPS_SETUP.md) - HTTPS setup guide
- [EDGE_FUNCTION_LOCAL_DEV_FIX.md](./EDGE_FUNCTION_LOCAL_DEV_FIX.md) - General Edge Function setup

---

**Status**: ✅ Fixed - Accept certificate in browser  
**Next**: Accept certificate → Refresh page → Test chat
