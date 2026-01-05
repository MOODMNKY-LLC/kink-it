# Environment Files Updated for HTTPS

## ✅ Changes Made

All Supabase URLs in environment files have been updated from HTTP to HTTPS to match the TLS-enabled Supabase configuration.

### Files Updated

1. **`.env.local`** (Active configuration)
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`: `http://` → `https://`
   - ✅ `SUPABASE_REST_URL`: `http://` → `https://`
   - ✅ `SUPABASE_GRAPHQL_URL`: `http://` → `https://`
   - ✅ `SUPABASE_FUNCTIONS_URL`: `http://` → `https://`
   - ✅ `SUPABASE_STUDIO_URL`: `http://` → `https://`
   - ✅ `SUPABASE_MCP_URL`: `http://` → `https://`
   - ✅ `SUPABASE_MAILPIT_URL`: Remains `http://` (Mailpit doesn't require TLS)

2. **`ENV_LOCAL_TEMPLATE.txt`** (Template file)
   - ✅ Updated to show HTTPS URLs
   - ✅ Added note about accepting self-signed certificate

## 🔍 Updated URLs

### Supabase API & Services (HTTPS)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
SUPABASE_REST_URL=https://127.0.0.1:55321/rest/v1
SUPABASE_GRAPHQL_URL=https://127.0.0.1:55321/graphql/v1
SUPABASE_FUNCTIONS_URL=https://127.0.0.1:55321/functions/v1
SUPABASE_STUDIO_URL=https://127.0.0.1:55323
SUPABASE_MCP_URL=https://127.0.0.1:55321/mcp
```

### Mailpit (HTTP - No TLS Required)
```bash
SUPABASE_MAILPIT_URL=http://127.0.0.1:55324
```

## 🚀 Next Steps

### 1. Restart Next.js Dev Server

After updating `.env.local`, restart your Next.js development server:

```powershell
# Stop current server (Ctrl+C)
# Then restart:
pnpm dev
```

### 2. Accept Self-Signed Certificate

When you first access Supabase over HTTPS, your browser will show a security warning. This is **normal and safe** for local development.

**To accept the certificate:**

1. Navigate to: `https://127.0.0.1:55321` or `https://127.0.0.1:55323` (Studio)
2. Click **"Advanced"** or **"Show Details"**
3. Click **"Proceed to 127.0.0.1 (unsafe)"** or **"Accept the Risk and Continue"**
4. The certificate will be trusted for this session

**Note:** You may need to do this once per browser.

### 3. Verify Configuration

Check that Supabase is running with TLS:

```powershell
supabase status
```

You should see HTTPS URLs:
- ✅ API: `https://127.0.0.1:55321`
- ✅ Studio: `https://127.0.0.1:55323`

### 4. Test OAuth Flow

After restarting your dev server:

1. Navigate to: `http://localhost:3000/auth/login`
2. Click **"Continue with Notion"**
3. The OAuth flow should now work correctly

## ⚠️ Important Notes

### Why HTTPS is Required

- **Notion OAuth requires HTTPS** - This is a security requirement that cannot be bypassed
- **Self-signed certificates** - Supabase auto-generates certificates for local development
- **Safe for local dev** - Certificate warnings are expected and safe to accept

### Certificate Trust

- Certificates are **only trusted in your browser**
- Other tools (like `curl`) may need `--insecure` flag
- Use `127.0.0.1` (not `localhost`) for consistency

### Environment Variable Loading

- Next.js loads `.env.local` at startup
- **Must restart dev server** after changing environment variables
- Changes take effect immediately after restart

## 🐛 Troubleshooting

### Still Getting HTTP Errors?

1. **Verify environment variable is loaded:**
   ```powershell
   # Check if HTTPS URL is set
   $env:NEXT_PUBLIC_SUPABASE_URL
   ```

2. **Clear Next.js cache:**
   ```powershell
   Remove-Item -Recurse -Force .next
   pnpm dev
   ```

3. **Check `.env.local` location:**
   - Should be at: `C:\DEV-MNKY\MOOD_MNKY\kink-it\.env.local`
   - Not in a subdirectory

### Certificate Errors

If you see certificate errors:

1. **Accept the certificate** in your browser (see Step 2 above)
2. **Use `127.0.0.1`** (not `localhost`)
3. **Verify Supabase is running:** `supabase status`

### OAuth Still Failing?

1. **Verify Notion redirect URI** matches exactly:
   ```
   https://127.0.0.1:55321/auth/v1/callback
   ```

2. **Check Supabase config** has Notion OAuth enabled:
   ```toml
   [auth.external.notion]
   enabled = true
   ```

3. **Restart Supabase** after config changes:
   ```powershell
   supabase stop
   supabase start
   ```

## 📋 Verification Checklist

- [x] Updated `.env.local` with HTTPS URLs
- [x] Updated `ENV_LOCAL_TEMPLATE.txt` template
- [ ] Restarted Next.js dev server
- [ ] Accepted self-signed certificate in browser
- [ ] Verified Supabase is running: `supabase status`
- [ ] Tested OAuth flow: Click "Continue with Notion"

## 📚 Related Documentation

- [FIX_SUPABASE_HTTPS_ERROR.md](./FIX_SUPABASE_HTTPS_ERROR.md) - Detailed troubleshooting guide
- [NOTION_OAUTH_HTTPS_SETUP.md](../NOTION_OAUTH_HTTPS_SETUP.md) - Complete HTTPS setup guide
- [SUPABASE_LOCAL_CREDENTIALS.md](../SUPABASE_LOCAL_CREDENTIALS.md) - Updated with HTTPS URLs

---

**Status**: ✅ Environment Files Updated  
**Next**: Restart your Next.js dev server and accept the certificate

