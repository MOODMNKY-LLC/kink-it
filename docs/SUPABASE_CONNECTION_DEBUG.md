# Supabase Connection Debugging Guide

## 🔴 Current Issue

"Failed to fetch" errors when Supabase client tries to connect, even after switching to `127.0.0.1`.

## ✅ Verification Steps

### Step 1: Check Supabase is Running

```bash
supabase status
```

**Expected:** Should show "Development Tools" and "APIs" sections with URLs.

### Step 2: Test API Connectivity (Terminal)

```bash
curl -k https://127.0.0.1:55321/rest/v1/
```

**Expected:** HTTP 200 or 400 (not connection error)

**If it fails:** Supabase might not be running or port is blocked.

### Step 3: Test in Browser

1. **Open:** `https://127.0.0.1:55321/rest/v1/`
2. **Accept certificate** if prompted
3. **Expected:** Should see API response (not connection error)

### Step 4: Check Environment Variables

Open browser console and check for:
```
[Supabase Client] Initializing with URL: https://127.0.0.1:55321
```

**If you see `localhost` instead:** Your `.env.local` might not be loaded or dev server needs restart.

### Step 5: Run Diagnostic Endpoint

Navigate to: `https://127.0.0.1:3000/api/debug/supabase-connection`

This will test:
- ✅ Environment variables
- ✅ Auth endpoint connectivity
- ✅ REST API connectivity
- ✅ Provide specific recommendations

## 🐛 Common Issues & Fixes

### Issue 1: Certificate Not Accepted

**Symptoms:**
- "Failed to fetch" errors
- Network tab shows blocked requests
- Console shows certificate warnings

**Fix:**
1. Navigate to `https://127.0.0.1:55321` directly
2. Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"
3. Accept certificate
4. Refresh your app

### Issue 2: Using `localhost` Instead of `127.0.0.1`

**Symptoms:**
- Console warning: "Using 'localhost' in Supabase URL"
- Certificate mismatches
- Connection failures

**Fix:**
1. Check `.env.local`: Should have `https://127.0.0.1:55321`
2. Restart dev server: `pnpm dev`
3. Use `https://127.0.0.1:3000` (not `localhost`)

### Issue 3: Environment Variables Not Loaded

**Symptoms:**
- Console error: "Missing environment variables"
- Supabase client throws error on initialization

**Fix:**
1. Verify `.env.local` exists and has correct values
2. Restart dev server (env vars loaded at startup)
3. Check console for initialization log

### Issue 4: Browser Cache

**Symptoms:**
- Works sometimes but not always
- Errors persist after fixes

**Fix:**
1. Clear browser cache
2. Close all tabs with your app
3. Restart browser
4. Open fresh tab: `https://127.0.0.1:3000`

### Issue 5: Multiple Certificate Prompts

**Symptoms:**
- Certificate accepted but still getting errors
- Different errors in different browsers

**Fix:**
- Accept certificate in each browser separately
- Check browser security settings
- Try incognito/private mode

## 🔍 Debugging Tools

### Browser Console

Check for these logs:
```
[Supabase Client] Initializing with URL: https://127.0.0.1:55321
[Supabase Client] Make sure certificate is accepted for: https://127.0.0.1:55321
```

**If you see warnings about `localhost`:** Your env vars aren't loaded correctly.

### Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `127.0.0.1:55321`
4. Check status:
   - **200/400**: Working ✅
   - **0/CORS error**: Certificate issue ❌
   - **Failed**: Network issue ❌

### Diagnostic Endpoint

Visit: `https://127.0.0.1:3000/api/debug/supabase-connection`

Returns JSON with:
- Environment check
- Auth test results
- Query test results
- Specific recommendations

## 📋 Quick Checklist

- [ ] Supabase is running: `supabase status`
- [ ] Using `https://127.0.0.1:3000` (not `localhost`)
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321`
- [ ] Accepted certificate for `https://127.0.0.1:55321`
- [ ] Restarted dev server after changing `.env.local`
- [ ] Cleared browser cache
- [ ] Checked browser console for Supabase client logs
- [ ] Tested diagnostic endpoint: `/api/debug/supabase-connection`

## 🚀 Expected Result

After fixes:
- ✅ No "Failed to fetch" errors
- ✅ Console shows: `[Supabase Client] Initializing with URL: https://127.0.0.1:55321`
- ✅ Network tab shows successful requests to Supabase
- ✅ Diagnostic endpoint shows all tests passing
- ✅ Bond memberships load correctly
- ✅ Auth operations work

---

**Status**: Debugging tools added  
**Next**: Run diagnostic endpoint and check browser console
