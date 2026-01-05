# Fix: "400 Bad Request - The plain HTTP request was sent to HTTPS port"

## 🔴 Error

```
400 Bad Request
The plain HTTP request was sent to HTTPS port
```

**URL causing error:**
```
http://127.0.0.1:55321/auth/v1/authorize?provider=notion&...
```

## 🎯 Root Cause

Your Supabase instance has **TLS enabled** (`api.tls.enabled = true` in `supabase/config.toml`), which means it's listening on **HTTPS**. However, your environment variable `NEXT_PUBLIC_SUPABASE_URL` is still set to **HTTP**.

## ✅ Solution: Update Environment Variable

### Step 1: Update `.env.local`

Open your `.env.local` file and change:

**❌ Current (HTTP):**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
```

**✅ Correct (HTTPS):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
```

### Step 2: Restart Next.js Dev Server

After updating the environment variable, restart your Next.js dev server:

```powershell
# Stop the current dev server (Ctrl+C)
# Then restart:
pnpm dev
```

### Step 3: Accept Self-Signed Certificate (First Time Only)

When you first access Supabase over HTTPS, your browser will show a security warning because the certificate is self-signed. This is **normal and safe** for local development.

**To accept the certificate:**

1. Navigate to: `https://127.0.0.1:55321` in your browser
2. Click **"Advanced"** or **"Show Details"**
3. Click **"Proceed to 127.0.0.1 (unsafe)"** or **"Accept the Risk and Continue"**
4. The certificate will be trusted for this session

**Note:** You may need to do this once per browser.

### Step 4: Verify Configuration

Check that Supabase is running with TLS:

```powershell
supabase status
```

You should see HTTPS URLs:
- ✅ API: `https://127.0.0.1:55321`
- ✅ Studio: `https://127.0.0.1:55323`

## 🔍 Complete `.env.local` Example

Here's what your `.env.local` should look like:

```bash
# ============================================
# SUPABASE CONFIGURATION (LOCAL DEVELOPMENT)
# ============================================

# Supabase Project URL (Local) - USE HTTPS
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321

# Supabase Anonymous Key (Public - safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Supabase Service Role Key (KEEP SECRET - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6E5ODM4MTI5OTZ9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# ============================================
# NOTION INTEGRATION
# ============================================
NOTION_API_KEY=your_notion_api_key_here
NOTION_APP_IDEAS_DATABASE_ID=your_database_id_here

# ============================================
# SUPABASE AUTH - NOTION OAUTH
# ============================================
SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID=your_notion_client_id
SUPABASE_AUTH_EXTERNAL_NOTION_SECRET=your_notion_secret
```

## 🐛 Troubleshooting

### Still Getting HTTP Error?

1. **Check environment variable is loaded:**
   ```powershell
   # In PowerShell, check if variable is set
   $env:NEXT_PUBLIC_SUPABASE_URL
   ```

2. **Verify `.env.local` is in project root:**
   - File should be at: `C:\DEV-MNKY\MOOD_MNKY\kink-it\.env.local`
   - Not in a subdirectory

3. **Clear Next.js cache:**
   ```powershell
   # Delete .next folder
   Remove-Item -Recurse -Force .next
   
   # Restart dev server
   pnpm dev
   ```

### Certificate Errors in Browser

If you see certificate errors when accessing Supabase:

1. **Accept the certificate** in your browser (see Step 3 above)
2. **Use `127.0.0.1`** (not `localhost`) - certificates are issued for `127.0.0.1`
3. **Check Supabase is running:**
   ```powershell
   supabase status
   ```

### OAuth Redirect Issues

If Notion OAuth still fails after fixing HTTPS:

1. **Verify Notion redirect URI** matches exactly:
   ```
   https://127.0.0.1:55321/auth/v1/callback
   ```

2. **Check Supabase config** has Notion OAuth enabled:
   ```toml
   [auth.external.notion]
   enabled = true
   ```

3. **Restart Supabase** after any config changes:
   ```powershell
   supabase stop
   supabase start
   ```

## 📋 Quick Checklist

- [ ] Updated `NEXT_PUBLIC_SUPABASE_URL` to `https://127.0.0.1:55321` in `.env.local`
- [ ] Restarted Next.js dev server (`pnpm dev`)
- [ ] Accepted self-signed certificate in browser
- [ ] Verified Supabase is running: `supabase status`
- [ ] Tested OAuth flow: Click "Continue with Notion" button

## 🎯 Why This Happens

Supabase TLS is enabled because:
- ✅ **Notion OAuth requires HTTPS** (security requirement)
- ✅ **Self-signed certificates** are auto-generated for local dev
- ✅ **Safe for local development** (certificate warnings are expected)

The fix is simple: **Use HTTPS URLs** in your environment variables when TLS is enabled.

## 📚 Related Documentation

- [NOTION_OAUTH_HTTPS_SETUP.md](./NOTION_OAUTH_HTTPS_SETUP.md) - Complete HTTPS setup guide
- [Supabase TLS Configuration](https://supabase.com/docs/guides/local-development/cli/config#api-tls)

