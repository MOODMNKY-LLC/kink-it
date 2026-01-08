# Fix: Supabase "Failed to fetch" Errors

## 🔴 Error

```
AuthRetryableFetchError: Failed to fetch
TypeError: Failed to fetch
Error fetching bond memberships: {}
```

## 🎯 Root Cause

**Browser is blocking Supabase requests** due to:

1. **Certificate mismatch**: Accessing via `localhost` but Supabase URL uses `127.0.0.1`
2. **Self-signed certificate**: Browser blocking HTTPS requests to `127.0.0.1:55321`
3. **Mixed origins**: Page loaded from `localhost` but making requests to `127.0.0.1`

## ✅ Solution

### Step 1: Use `127.0.0.1` Instead of `localhost`

**Critical:** Always use `127.0.0.1` for both:
- Your app URL: `https://127.0.0.1:3000`
- Supabase URL in `.env.local`: `https://127.0.0.1:55321`

### Step 2: Verify `.env.local` Configuration

Check your `.env.local` file:

```bash
# ✅ CORRECT
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321

# ❌ WRONG
NEXT_PUBLIC_SUPABASE_URL=https://localhost:55321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321  # Missing 's' in https
```

### Step 3: Accept Certificate for Supabase

1. **Navigate to Supabase API directly:**
   ```
   https://127.0.0.1:55321
   ```

2. **Accept the certificate:**
   - Click **"Advanced"**
   - Click **"Proceed to 127.0.0.1 (unsafe)"**

3. **Verify it works:**
   - Should see Supabase API response or error page (not connection error)

### Step 4: Restart Dev Server

After changing `.env.local`:

```bash
# Stop dev server (Ctrl+C)
# Then restart:
pnpm dev
```

**Important:** Environment variables are loaded at startup, so you must restart!

### Step 5: Clear Browser Cache

Sometimes browsers cache failed requests:

- **Chrome/Edge**: Settings → Privacy → Clear browsing data → Cached images and files
- **Firefox**: Settings → Privacy → Clear Data → Cached Web Content
- **Safari**: Develop → Empty Caches

## 🔍 Debugging

### Check What URL Supabase Client Is Using

I've added logging to `lib/supabase/client.ts`. Check your browser console:

```
[Supabase Client] Initializing with URL: https://127.0.0.1:55321
```

If you see `localhost` instead of `127.0.0.1`, your `.env.local` is wrong.

### Test Supabase Connection Manually

Open browser console and run:

```javascript
// Test Supabase connection
const response = await fetch('https://127.0.0.1:55321/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
console.log('Supabase connection test:', response.status)
```

**Expected:** Status 200 or 400 (not network error)

**If it fails:** Certificate not accepted or wrong URL

## 🐛 Common Issues

### Issue 1: Still Getting "Failed to fetch"

**Check:**
1. ✅ Using `https://127.0.0.1:3000` (not `localhost`)
2. ✅ `.env.local` has `https://127.0.0.1:55321` (not `localhost`)
3. ✅ Accepted certificate for `https://127.0.0.1:55321`
4. ✅ Restarted dev server after changing `.env.local`
5. ✅ Cleared browser cache

### Issue 2: Works in One Browser But Not Another

Different browsers handle certificates differently:
- **Chrome**: Usually strictest
- **Firefox**: May need manual certificate import
- **Safari**: May need to accept in System Preferences

**Solution:** Accept certificate in each browser separately.

### Issue 3: Works Sometimes But Not Always

**Possible causes:**
- Browser cache
- Service worker caching old requests
- Multiple tabs interfering

**Solution:**
1. Close all tabs with your app
2. Clear cache
3. Restart browser
4. Open fresh tab: `https://127.0.0.1:3000`

## 📋 Quick Checklist

- [ ] Using `https://127.0.0.1:3000` (not `localhost`)
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321`
- [ ] Accepted certificate for `https://127.0.0.1:55321`
- [ ] Restarted dev server after changing `.env.local`
- [ ] Cleared browser cache
- [ ] Checked console for Supabase client initialization log

## 🚀 Expected Result

After fixes:
- ✅ No more "Failed to fetch" errors
- ✅ Supabase queries work (bond memberships, etc.)
- ✅ Auth operations work (getUser, getSession)
- ✅ Console shows: `[Supabase Client] Initializing with URL: https://127.0.0.1:55321`

---

**Status**: Fix available  
**Priority**: Use `127.0.0.1` consistently and accept certificates
