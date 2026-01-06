# Notion OAuth Redirect URI Fix

## 🔍 Issue Identified

**Error**: "Missing or invalid redirect_uri" when authenticating with Notion

**Root Cause**: The `additional_redirect_urls` in `supabase/config.toml` were missing the `/auth/callback` path. Supabase requires **exact** URLs including the full callback path.

## ✅ Fix Applied

Updated `supabase/config.toml`:

**Before:**
```toml
additional_redirect_urls = [
  "https://127.0.0.1:3000",
  "https://localhost:3000",
  "http://127.0.0.1:3000"
]
```

**After:**
```toml
additional_redirect_urls = [
  "https://127.0.0.1:3000/auth/callback",
  "https://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
  "http://localhost:3000/auth/callback"
]
```

## 🔄 OAuth Flow

1. **User clicks "Sign in with Notion"**
   - Next.js calls: `supabase.auth.signInWithOAuth({ provider: 'notion', options: { redirectTo: 'https://127.0.0.1:3000/auth/callback' } })`

2. **Supabase redirects to Notion**
   - Redirect URI sent to Notion: `https://127.0.0.1:55321/auth/v1/callback`
   - This is Supabase's OAuth callback endpoint (with TLS enabled)

3. **Notion redirects back to Supabase**
   - URL: `https://127.0.0.1:55321/auth/v1/callback?code=...&state=...`

4. **Supabase processes OAuth and redirects to Next.js**
   - URL: `https://127.0.0.1:3000/auth/callback?code=...`
   - This URL must be in `additional_redirect_urls` ✅

## 📋 Required Configuration

### 1. Supabase Config (`supabase/config.toml`)

✅ **Updated** - Now includes full callback paths

### 2. Notion OAuth App Settings

**CRITICAL**: Make sure your Notion OAuth app has this redirect URI configured:

```
https://127.0.0.1:55321/auth/v1/callback
```

**To configure:**
1. Go to https://www.notion.so/my-integrations
2. Select your **KINK IT** integration
3. Under **Redirect URIs**, add:
   - `https://127.0.0.1:55321/auth/v1/callback` (Local HTTPS)
   - `https://rbloeqwxivfzxmfropek.supabase.co/auth/v1/callback` (Production)

### 3. Restart Supabase

After updating `config.toml`, restart Supabase:

```bash
supabase stop
supabase start
```

## ✅ Verification Steps

1. **Check Supabase is running with HTTPS:**
   ```bash
   supabase status
   ```
   Should show: `API URL: https://127.0.0.1:55321`

2. **Verify Notion OAuth app has correct redirect URI:**
   - Check https://www.notion.so/my-integrations
   - Ensure `https://127.0.0.1:55321/auth/v1/callback` is listed

3. **Test OAuth flow:**
   - Navigate to your login page
   - Click "Sign in with Notion"
   - Should redirect to Notion → back to Supabase → back to your app

## 🐛 Troubleshooting

### Still getting "Missing or invalid redirect_uri"

1. **Verify Notion app configuration:**
   - The redirect URI in Notion must match **exactly**: `https://127.0.0.1:55321/auth/v1/callback`
   - No trailing slashes
   - Must use `https://` (not `http://`)
   - Must use `127.0.0.1` (not `localhost`)

2. **Check Supabase TLS is enabled:**
   ```bash
   # In supabase/config.toml, verify:
   [api.tls]
   enabled = true
   ```

3. **Restart Supabase:**
   ```bash
   supabase stop
   supabase start
   ```

4. **Check browser console:**
   - Look for any CORS or certificate errors
   - Verify the redirect_uri being sent matches what's in Notion

### Redirect works but callback fails

- Verify `additional_redirect_urls` includes the exact callback URL
- Check that Next.js is running on the expected port (3000)
- Ensure the callback route exists: `app/auth/callback/route.ts`

---

**Status**: ✅ Config Updated  
**Next**: Restart Supabase and verify Notion OAuth app settings






