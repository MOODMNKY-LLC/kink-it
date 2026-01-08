# Console Errors Fix Guide

## 🔴 Current Issues

### 1. Notifications API 404 Error

**Error:**
```
GET https://localhost:3000/api/notifications 404 (Not Found)
```

**Root Cause:**
- You're accessing the app via `localhost:3000` instead of `127.0.0.1:3000`
- The API route exists but might be blocked due to certificate mismatch
- Or authentication middleware is redirecting

**Fix:**
1. **Change URL from `localhost` to `127.0.0.1`:**
   ```
   ❌ https://localhost:3000/chat
   ✅ https://127.0.0.1:3000/chat
   ```

2. **Verify `.env.local` uses `127.0.0.1`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
   ```

3. **Check if API route is accessible:**
   - Navigate to: `https://127.0.0.1:3000/api/notifications`
   - Should return JSON (might require auth)

### 2. Realtime Connection Issues

**Errors:**
```
[OnlineStatus] Channel closed
[OnlineStatus] Channel not subscribed, cannot track presence. State: closed
[OnlineStatus] Channel subscription timed out - will retry
```

**Root Cause:**
- WebSocket certificate not accepted
- Using `localhost` instead of `127.0.0.1`

**Fix:**
1. **Use `127.0.0.1` instead of `localhost`** (see above)
2. **Accept WebSocket certificate:**
   - Open DevTools → Network tab
   - Filter by "WS" (WebSocket)
   - Click on `wss://127.0.0.1:55321/realtime/v1/websocket`
   - Accept certificate warning

**Full instructions:** See `docs/REALTIME_CERTIFICATE_FIX.md`

### 3. Image Optimization Warnings

**Warnings:**
```
Image with src "/images/kinky/kinky-avatar.svg" was detected as the Largest Contentful Paint (LCP)
Image with src "..." has "fill" but is missing "sizes" prop
Image has either width or height modified, but not the other
```

**Status:** ⚠️ Non-critical - These are Next.js optimization suggestions

**Fix (Optional):**
- Add `priority` prop to LCP images
- Add `sizes` prop to images with `fill`
- Add `width: "auto"` or `height: "auto"` when modifying one dimension

### 4. Favicon 404 Error

**Error:**
```
GET https://localhost:3000/favicon.ico?favicon.34212efc.ico 404 (Not Found)
```

**Fix:**
- Favicon exists at `app/favicon.ico`
- Error might be due to `localhost` vs `127.0.0.1` issue
- Should resolve when using `127.0.0.1`

## ✅ Quick Fix Checklist

1. **Change browser URL:**
   ```
   ❌ https://localhost:3000/chat
   ✅ https://127.0.0.1:3000/chat
   ```

2. **Accept certificates:**
   - `https://127.0.0.1:55321` (Supabase API)
   - `wss://127.0.0.1:55321/realtime/v1/websocket` (WebSocket)

3. **Verify `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
   ```

4. **Clear browser cache** (if issues persist)

5. **Restart dev server** after changing `.env.local`

## 🚀 Expected Result

After fixes:
- ✅ Notifications API should work (no 404)
- ✅ Realtime connection should establish
- ✅ No more certificate errors
- ⚠️ Image warnings remain (non-critical)

---

**Status**: Quick fixes available  
**Priority**: Use `127.0.0.1` instead of `localhost`
