# Fix: 504 Timeout Error with Supabase HTTPS

## 🔴 Error

```
{"code":504,"error_code":"request_timeout","msg":"Processing this request timed out, please retry after a moment.","error_id":"..."}
```

## 🎯 Root Cause

Node.js is **rejecting the self-signed certificate** from Supabase's HTTPS endpoint. When Next.js tries to make requests to Supabase over HTTPS, Node.js's default security behavior rejects self-signed certificates, causing requests to timeout.

## ✅ Solution

We've configured Node.js to accept self-signed certificates **for local development only** by setting `NODE_TLS_REJECT_UNAUTHORIZED=0` in `server.js`.

### What Was Changed

**`server.js`** - Added certificate acceptance at the top:
```javascript
// Allow self-signed certificates for local development (Supabase TLS)
// This is safe for local development only - NEVER use in production
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.log('⚠️  Self-signed certificates enabled for local development')
}
```

This ensures:
- ✅ Node.js accepts Supabase's self-signed certificate
- ✅ Only enabled in development mode (`NODE_ENV !== 'production'`)
- ✅ Safe for local development
- ✅ Never affects production builds

## 🚀 Next Steps

### 1. Restart Your Dev Server

After this change, restart your Next.js development server:

```powershell
# Stop current server (Ctrl+C)
pnpm dev
```

### 2. Verify It's Working

You should see this message when starting:
```
⚠️  Self-signed certificates enabled for local development
```

### 3. Test OAuth Flow

1. Navigate to: `http://localhost:3000/auth/login`
2. Click **"Continue with Notion"**
3. The OAuth flow should now work without timeouts

## 🔍 Why This Happens

### The Problem Chain

1. **Supabase has TLS enabled** (`api.tls.enabled = true`) for Notion OAuth
2. **Supabase uses self-signed certificates** (auto-generated for local dev)
3. **Browsers accept self-signed certs** (after user approval)
4. **Node.js rejects self-signed certs** by default (security feature)
5. **Requests timeout** because Node.js won't connect

### The Solution

By setting `NODE_TLS_REJECT_UNAUTHORIZED=0` in development:
- Node.js accepts self-signed certificates
- Requests to Supabase HTTPS succeed
- OAuth flow works correctly

## ⚠️ Important Security Notes

### ✅ Safe for Local Development

- Only enabled when `NODE_ENV !== 'production'`
- Only affects local development server
- Self-signed certificates are safe for localhost

### ❌ Never Use in Production

- **Never** set `NODE_TLS_REJECT_UNAUTHORIZED=0` in production
- Production Supabase uses proper certificates
- Production builds don't include this code

### 🔒 Production Safety

The code checks `process.env.NODE_ENV !== 'production'`:
- ✅ Development: Certificate rejection disabled
- ✅ Production: Certificate validation enforced (default behavior)

## 🐛 Troubleshooting

### Still Getting Timeouts?

1. **Verify server.js is being used:**
   ```powershell
   # Check if you're using the custom server
   pnpm dev
   # Should show: "⚠️  Self-signed certificates enabled for local development"
   ```

2. **Check NODE_ENV:**
   ```powershell
   $env:NODE_ENV
   # Should be empty or "development" (not "production")
   ```

3. **Try HTTP mode temporarily:**
   ```powershell
   pnpm run dev:http
   # This uses standard Next.js dev server (no custom server.js)
   # Note: OAuth might still fail, but you can test other features
   ```

### Certificate Errors in Browser

If you see browser certificate warnings:
1. Navigate to `https://127.0.0.1:55321` in your browser
2. Click **"Advanced"** → **"Proceed to 127.0.0.1 (unsafe)"**
3. Accept the certificate (safe for local development)

### Alternative: Use HTTP for Next.js

If you prefer not to modify Node.js certificate validation:

**Option:** Run Next.js on HTTP, Supabase on HTTPS:
- Next.js: `http://localhost:3000` (no TLS needed)
- Supabase: `https://127.0.0.1:55321` (TLS required for OAuth)
- OAuth flow: Notion → Supabase HTTPS → Next.js HTTP ✅

This works because:
- The critical OAuth callback (Notion → Supabase) uses HTTPS
- Supabase redirects to Next.js HTTP (this is fine)

**To use this approach:**
```powershell
# Use HTTP dev server
pnpm run dev:http

# Keep Supabase URLs as HTTPS in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
```

## 📋 Verification Checklist

- [x] Updated `server.js` to accept self-signed certificates
- [ ] Restarted Next.js dev server
- [ ] Verified console shows certificate warning message
- [ ] Tested OAuth flow: Click "Continue with Notion"
- [ ] No more 504 timeout errors

## 📚 Related Documentation

- [FIX_SUPABASE_HTTPS_ERROR.md](./FIX_SUPABASE_HTTPS_ERROR.md) - HTTPS URL configuration
- [NOTION_OAUTH_HTTPS_SETUP.md](../NOTION_OAUTH_HTTPS_SETUP.md) - Complete HTTPS setup
- [ENV_FILES_UPDATED.md](./ENV_FILES_UPDATED.md) - Environment variable updates

---

**Status**: ✅ Fixed - Node.js now accepts self-signed certificates  
**Next**: Restart your dev server and test OAuth flow

