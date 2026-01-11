# Realtime WebSocket Certificate Fix

## 🔴 Issue

Realtime presence channel is failing to connect:

\`\`\`
[OnlineStatus] Channel closed
[OnlineStatus] Channel not subscribed, cannot track presence. State: closed
[OnlineStatus] Channel subscription timed out - will retry
\`\`\`

## 🎯 Root Cause

**WebSocket connections** (used by Supabase Realtime) are also blocked by browsers when using self-signed certificates. Even if you've accepted the certificate for regular HTTPS requests, **WebSocket connections require separate acceptance**.

Additionally, you're accessing the app via `localhost:3000` but the certificate is issued for `127.0.0.1`, which can cause certificate mismatches.

## ✅ Solution

### Step 1: Use `127.0.0.1` Instead of `localhost`

**Important:** Always use `127.0.0.1` instead of `localhost` to match your certificates.

**Change your browser URL from:**
\`\`\`
https://localhost:3000/chat
\`\`\`

**To:**
\`\`\`
https://127.0.0.1:3000/chat
\`\`\`

### Step 2: Accept Certificate for HTTPS API

1. Navigate to: `https://127.0.0.1:55321`
2. Click **"Advanced"** → **"Proceed to 127.0.0.1 (unsafe)"**
3. Accept the certificate

### Step 3: Accept Certificate for WebSocket (Realtime)

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for WebSocket connection errors
4. Click on the error URL: `wss://127.0.0.1:55321/realtime/v1/websocket`
5. Browser will prompt to accept certificate - click **"Advanced"** → **"Proceed"**

**Firefox:**
1. Navigate to: `wss://127.0.0.1:55321/realtime/v1/websocket` (in address bar)
2. Accept the certificate warning

**Safari:**
1. Navigate to: `https://127.0.0.1:55321` first
2. Accept certificate
3. WebSocket should inherit the trust

### Step 4: Verify Connection

After accepting certificates, check your browser console. You should see:

**✅ Success:**
\`\`\`
✅ Realtime subscription active for conversation: <id>
[OnlineStatus] Channel subscribed
\`\`\`

**❌ Still Failing:**
\`\`\`
[OnlineStatus] Channel closed
[OnlineStatus] Channel subscription timed out
\`\`\`

## 🔍 Alternative: Disable Realtime Temporarily

If you continue having issues, you can temporarily disable the online status feature:

**In `components/chat/enhanced-ai-chat-interface.tsx`:**

\`\`\`typescript
// Comment out or disable useOnlineStatus
// const { isOnline } = useOnlineStatus({ userId: userId || "", enabled: false })
const isOnline = true // Temporary fallback
\`\`\`

This won't affect chat functionality, only the online status indicator.

## 🐛 Troubleshooting

### Still Getting Timeouts?

**1. Check Supabase Realtime Status**

\`\`\`bash
supabase status

# Should show:
# Realtime │ Enabled
\`\`\`

**2. Verify WebSocket Port**

Realtime uses the same port as the API (55321) but with `wss://` protocol.

**3. Clear Browser Cache**

Sometimes browsers cache WebSocket connection failures:

- **Chrome/Edge**: Settings → Privacy → Clear browsing data → Cached images and files
- **Firefox**: Settings → Privacy → Clear Data → Cached Web Content
- **Safari**: Develop → Empty Caches

**4. Try Incognito Mode**

Test in incognito/private mode to rule out extensions:

- **Chrome**: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- **Firefox**: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- **Safari**: `Cmd+Shift+N`

**5. Check Network Tab**

1. Open DevTools → **Network** tab
2. Filter by **WS** (WebSocket)
3. Look for connection attempts to `wss://127.0.0.1:55321`
4. Check if they're failing with certificate errors

**6. Verify Environment Variables**

Check `.env.local`:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
\`\`\`

**Important:** Must use `127.0.0.1`, not `localhost`!

## 📋 Quick Checklist

- [ ] Using `https://127.0.0.1:3000` (not `localhost`)
- [ ] Accepted certificate for `https://127.0.0.1:55321`
- [ ] Accepted certificate for WebSocket `wss://127.0.0.1:55321`
- [ ] Cleared browser cache
- [ ] Checked `.env.local` uses `127.0.0.1` (not `localhost`)
- [ ] Verified Supabase is running: `supabase status`

## 🚀 Expected Behavior After Fix

**Console logs should show:**
\`\`\`
✅ Realtime subscription active for conversation: <id>
[OnlineStatus] Channel subscribed
\`\`\`

**No more errors:**
- ❌ `Channel closed`
- ❌ `Channel subscription timed out`
- ❌ `Cannot track presence`

---

**Status**: Fixed - Accept WebSocket certificate  
**Next**: Use `127.0.0.1` instead of `localhost` and accept certificates
