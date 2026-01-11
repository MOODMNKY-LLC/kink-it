# Certificate Acceptance Guide for Local Development

## 🔴 Current Issue

Browser is blocking Supabase requests with "Failed to fetch" errors because the self-signed certificate hasn't been accepted.

## ✅ Solution: Accept Certificate

### Step 1: Accept Certificate for Supabase API

**Navigate directly to Supabase API:**

\`\`\`
https://127.0.0.1:55321
\`\`\`

**In your browser:**

1. You'll see a security warning: "Your connection is not private"
2. Click **"Advanced"** (or "Show Details" in some browsers)
3. Click **"Proceed to 127.0.0.1 (unsafe)"** (or similar)
4. Certificate is now accepted ✅

**Expected Result:** You should see a Supabase API response or error page (not a connection error).

### Step 2: Verify Certificate is Accepted

**Test in browser console:**

\`\`\`javascript
// Run this in your browser console
fetch('https://127.0.0.1:55321/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY'
  }
})
.then(r => console.log('✅ Success:', r.status))
.catch(e => console.error('❌ Failed:', e))
\`\`\`

**Or use the built-in test function:**

\`\`\`javascript
// Available in development mode
testSupabaseConnection()
\`\`\`

### Step 3: Accept Certificate for WebSocket (Realtime)

If you're using Realtime features:

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for: `wss://127.0.0.1:55321/realtime/v1/websocket`
4. Click on it and accept certificate if prompted

## 🌐 Browser-Specific Instructions

### Chrome/Edge

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Advanced"**
3. Click **"Proceed to 127.0.0.1 (unsafe)"**
4. ✅ Certificate accepted

**Note:** Chrome may require accepting for each subdomain/port separately.

### Firefox

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Advanced"**
3. Click **"Accept the Risk and Continue"**
4. ✅ Certificate accepted

**Note:** Firefox may show a persistent warning - you can add an exception in Settings → Privacy & Security → Certificates → View Certificates.

### Safari

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Show Details"**
3. Click **"visit this website"**
4. Enter password if prompted
5. ✅ Certificate accepted

**Note:** Safari may require accepting in System Preferences → Certificates.

## 🔍 Verify It's Working

### Check 1: Browser Console

After accepting certificate, refresh your app and check console:

**✅ Success:**
\`\`\`
[Supabase Client] Initializing with URL: https://127.0.0.1:55321
\`\`\`

**❌ Still Failing:**
\`\`\`
[Supabase Client] Fetch failed: Failed to fetch
\`\`\`

### Check 2: Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `127.0.0.1:55321`
4. Check status:
   - **200/400**: ✅ Working
   - **0/blocked**: ❌ Certificate not accepted

### Check 3: Diagnostic Endpoint

Visit: `https://127.0.0.1:3000/api/debug/supabase-connection`

Should show:
\`\`\`json
{
  "authTest": { "success": true },
  "queryTest": { "success": true }
}
\`\`\`

## 🐛 Troubleshooting

### Still Getting "Failed to fetch"?

**1. Clear Browser Cache**
- Chrome: Settings → Privacy → Clear browsing data → Cached images
- Firefox: Settings → Privacy → Clear Data → Cached Web Content
- Safari: Develop → Empty Caches

**2. Try Incognito/Private Mode**
- Rules out extensions interfering
- Chrome: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows)
- Firefox: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)

**3. Check Browser Security Settings**
- Some browsers have strict certificate validation
- Try disabling "Strict certificate validation" temporarily

**4. Verify Supabase is Running**
\`\`\`bash
supabase status
\`\`\`

**5. Test Direct Connection**
\`\`\`bash
curl -k https://127.0.0.1:55321/rest/v1/
\`\`\`
Should return HTTP 200 (not connection error).

### Certificate Accepted But Still Failing?

**Possible causes:**
1. **Multiple certificates** - Accept certificate for each endpoint separately
2. **Browser cache** - Clear cache and restart browser
3. **Service worker** - Unregister service worker if present
4. **Mixed content** - Ensure all URLs use HTTPS

## 📋 Quick Checklist

- [ ] Navigated to `https://127.0.0.1:55321` directly
- [ ] Accepted certificate (Advanced → Proceed)
- [ ] Verified certificate accepted (can access API)
- [ ] Using `https://127.0.0.1:3000` (not `localhost`)
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Tested with `testSupabaseConnection()` in console
- [ ] Checked Network tab for successful requests

## 🚀 Expected Result

After accepting certificate:
- ✅ No more "Failed to fetch" errors
- ✅ Supabase queries work
- ✅ Auth operations work
- ✅ Network tab shows successful requests
- ✅ Diagnostic endpoint shows all tests passing

---

**Status**: Certificate acceptance required  
**Priority**: Accept certificate for `https://127.0.0.1:55321`
