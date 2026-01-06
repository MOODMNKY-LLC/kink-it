# Setting Up .env.local for Local Development

## 🚨 Critical Issue Identified

Your `.env.local` file is missing the required Supabase credentials. This is why you're seeing a white/blank screen.

## Quick Fix (3 Steps)

### Step 1: Get Your Supabase Keys

Supabase is currently running. You need to get the `anon_key` from it.

**Option A - Using Supabase Studio (Easiest):**
1. Open http://127.0.0.1:55323 in your browser
2. Click on "Settings" in the left sidebar
3. Click on "API"
4. You'll see two keys:
   - `anon` key (public)
   - `service_role` key (private, server-only)
5. Copy both keys

**Option B - Using Command Line:**
```powershell
# Run this in PowerShell to extract keys
$json = supabase status --output json | ConvertFrom-Json
Write-Host "`nAnon Key:" -ForegroundColor Yellow
Write-Host $json.anon_key
Write-Host "`nService Role Key:" -ForegroundColor Yellow  
Write-Host $json.service_role_key
```

### Step 2: Create .env.local File

1. In Cursor, create a new file named `.env.local` in the project root
2. Copy the contents from `.env.local.TEMPLATE`
3. Replace `YOUR_ANON_KEY_HERE` with your actual anon key
4. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key

**Your `.env.local` should look like this:**

```bash
# ============================================
# SUPABASE LOCAL DEVELOPMENT (REQUIRED)
# ============================================

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.ACTUAL_KEY_FROM_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.ACTUAL_KEY_FROM_SUPABASE

# ============================================
# NOTION INTEGRATION (OPTIONAL)
# ============================================
NOTION_API_KEY=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
NOTION_APP_IDEAS_DATABASE_ID=cc491ef5f0a64eac8e05a6ea10dfb735

# ============================================
# DEVELOPMENT (OPTIONAL)
# ============================================
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Step 3: Restart Dev Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
pnpm dev
```

## Verification

After completing these steps, verify everything is working:

```bash
# Run the verification script
node scripts/verify-env.js
```

You should see:
```
✅ All environment variables are set correctly!
✅ Successfully connected to Supabase!
```

## What Should Happen Next

1. **Auth pages should now be visible** with the cyan/blue gradient background
2. **Forms should work** - you can sign up and sign in
3. **No more white/blank screens**

## Testing Your Setup

### 1. Navigate to Login Page
Open http://localhost:3000/auth/login

**Expected Result:**
- Beautiful cyan/blue gradient background ✅
- Login form with email and password fields ✅
- "Sign up" link at the bottom ✅

### 2. Navigate to Sign Up Page
Open http://localhost:3000/auth/sign-up

**Expected Result:**
- Same cyan/blue gradient background ✅
- Sign-up form with name, email, password, and dynamic role fields ✅
- "Sign in" link at the bottom ✅

### 3. Test Sign Up
1. Fill out the sign-up form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Dynamic Role: "Submissive"
2. Click "Sign Up"
3. Check http://127.0.0.1:55324 for the verification email
4. Click the confirmation link
5. You should be redirected to the dashboard

### 4. Verify First User is Admin
After signing up:
1. Sign in with your test credentials
2. You should see the dashboard with your name
3. In the sidebar, you should see an "Admin" badge
4. This is because you're the first user!

## Troubleshooting

### Still seeing white screen?
1. Check browser console (F12) for errors
2. Verify `.env.local` file exists and has correct keys
3. Make sure dev server was restarted after creating `.env.local`
4. Clear browser cache and try again

### "Failed to fetch" errors?
1. Ensure Supabase is still running: `supabase status`
2. If not running: `supabase start`
3. Verify the URL is correct: `http://127.0.0.1:55321`

### Keys not working?
1. Double-check you copied the full keys (they're very long JWT tokens)
2. No extra spaces or line breaks
3. Make sure you used the `anon` key, not other keys

## Security Reminder

🔒 **Never commit `.env.local` to git!**

The `.gitignore` file already excludes it, but double-check:
```bash
# Verify .env.local is ignored
git status
# Should NOT show .env.local as a tracked file
```

## Need Help?

If you're still having issues after following these steps:
1. Run: `node scripts/verify-env.js`
2. Share the output
3. Check browser console (F12) for specific errors
4. Verify Supabase is running: `supabase status`

Once `.env.local` is set up correctly, everything should work perfectly! 🚀







