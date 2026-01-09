# Debug: Supabase "Failed to fetch" Error

**Date**: 2026-01-08  
**Error Type**: Network/Certificate Error  
**Status**: Fix Available

---

## 🔴 Error Symptoms

You're seeing these errors in the browser console:

```
Failed to fetch
TypeError: Failed to fetch
Error fetching bond memberships: {}
```

These errors occur when:
- Supabase Auth client tries to check session (`_useSession` → `_getUser`)
- Components try to fetch data from Supabase (bond memberships, tasks, etc.)
- Any Supabase query fails with network error

---

## 🎯 Root Cause

**Browser is blocking Supabase requests** because the self-signed certificate for `https://127.0.0.1:55321` hasn't been accepted.

This is a **development environment issue** that happens when:
1. You haven't visited `https://127.0.0.1:55321` directly
2. Browser hasn't accepted the self-signed certificate
3. Certificate trust hasn't been established

---

## ✅ Quick Fix (3 Steps)

### Step 1: Navigate to Supabase API

Open this URL directly in your browser:

```
https://127.0.0.1:55321
```

### Step 2: Accept the Certificate

1. You'll see a security warning: **"Your connection is not private"**
2. Click **"Advanced"** (or "Show Details")
3. Click **"Proceed to 127.0.0.1 (unsafe)"** (or similar)
4. ✅ Certificate is now accepted

**Expected Result:** You should see a Supabase API response or error page (not a connection error).

### Step 3: Refresh Your App

Refresh your app page (`https://127.0.0.1:3000`) and the errors should be gone.

---

## 🔍 Verification

### Check 1: Browser Console

After accepting certificate, refresh your app and check console:

**✅ Success:**
```
[Supabase Client] Initializing with URL: https://127.0.0.1:55321
```

**❌ Still Failing:**
```
🔒 Certificate/Network Error Detected!
Error fetching bond memberships: ...
```

### Check 2: Test Connection

Open browser console and run:

```javascript
// Use the built-in test function (available in dev mode)
testSupabaseConnection()
```

**Expected Output:**
```
🧪 Testing Supabase connection...
URL: https://127.0.0.1:55321

1️⃣ Testing REST endpoint...
   Status: 200 OK
   ✅ REST endpoint accessible

2️⃣ Testing Auth endpoint...
   Status: 200 OK
   ✅ Auth endpoint accessible

✅ Connection test complete!
```

**If it fails:** Certificate not accepted or wrong URL.

### Check 3: Network Tab

1. Open DevTools → **Network** tab
2. Filter by **Fetch/XHR**
3. Look for requests to `127.0.0.1:55321`
4. Check status:
   - **200/400**: ✅ Working
   - **0/blocked**: ❌ Certificate not accepted

---

## 🐛 Troubleshooting

### Still Getting "Failed to fetch"?

**Checklist:**

1. ✅ **Using correct URL**: `https://127.0.0.1:3000` (not `localhost`)
2. ✅ **Supabase URL correct**: `.env.local` has `https://127.0.0.1:55321`
3. ✅ **Certificate accepted**: Visited `https://127.0.0.1:55321` and accepted
4. ✅ **Dev server restarted**: After changing `.env.local`
5. ✅ **Browser cache cleared**: Sometimes needed

### Works in One Browser But Not Another?

Different browsers handle certificates separately:
- **Chrome**: Usually strictest, needs explicit acceptance
- **Firefox**: May need manual certificate import
- **Safari**: May need to accept in System Preferences

**Solution:** Accept certificate in each browser separately.

### Certificate Accepted But Still Failing?

**Possible causes:**

1. **Browser cache** - Clear cache and restart browser
2. **Service worker** - Unregister service worker if present
3. **Multiple tabs** - Close all tabs and open fresh
4. **Mixed origins** - Ensure all URLs use HTTPS

**Solution:**
1. Close all tabs with your app
2. Clear browser cache
3. Restart browser
4. Open fresh tab: `https://127.0.0.1:3000`

---

## 📋 Browser-Specific Instructions

### Chrome/Edge

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Advanced"**
3. Click **"Proceed to 127.0.0.1 (unsafe)"**
4. ✅ Certificate accepted

**Note:** Chrome may require accepting for each port separately.

### Firefox

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Advanced"**
3. Click **"Accept the Risk and Continue"**
4. ✅ Certificate accepted

**Note:** Firefox may show a persistent warning - you can add an exception in Settings → Privacy & Security → Certificates.

### Safari

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Show Details"**
3. Click **"visit this website"**
4. Enter password if prompted
5. ✅ Certificate accepted

**Note:** Safari may require accepting in System Preferences → Certificates.

---

## 🔧 Advanced Debugging

### Check Supabase Status

```bash
supabase status
```

**Expected:** Should show Supabase running on `https://127.0.0.1:55321`

### Test Direct Connection (Terminal)

```bash
curl -k https://127.0.0.1:55321/rest/v1/
```

**Expected:** HTTP 200 or 400 (not connection error)

### Check Environment Variables

Open browser console and check:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

**Expected:** `https://127.0.0.1:55321` (not `localhost`)

### Diagnostic Endpoint

Visit: `https://127.0.0.1:3000/api/debug/supabase-connection`

Should show:
```json
{
  "authTest": { "success": true },
  "queryTest": { "success": true }
}
```

---

## 💡 Prevention

To avoid this issue in the future:

1. **Always use `127.0.0.1`** (not `localhost`) for both app and Supabase URLs
2. **Accept certificate once** when you first start Supabase
3. **Keep Supabase running** - don't stop/start frequently
4. **Use same browser** for development (certificates are browser-specific)

---

## 🚀 Expected Result

After fixing:

- ✅ No more "Failed to fetch" errors
- ✅ Supabase queries work (bond memberships, tasks, etc.)
- ✅ Auth operations work (getUser, getSession)
- ✅ Console shows: `[Supabase Client] Initializing with URL: https://127.0.0.1:55321`
- ✅ Network tab shows successful requests to `127.0.0.1:55321`

---

## 📝 Related Documentation

- [Supabase Fetch Error Fix](./SUPABASE_FETCH_ERROR_FIX.md) - Detailed fix guide
- [Certificate Acceptance Guide](./CERTIFICATE_ACCEPTANCE_GUIDE.md) - Browser-specific instructions
- [Supabase Connection Debug](./SUPABASE_CONNECTION_DEBUG.md) - Advanced debugging

---

**Status**: ✅ Fix Available  
**Priority**: High (blocks all Supabase operations)  
**Estimated Fix Time**: 2 minutes
