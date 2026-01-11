# 🚨 Fix White/Blank Screen Issue - Quick Guide

## Problem Identified ✅

Your `.env.local` file is **missing required Supabase credentials**. This is why:
- ❌ Auth screens appear white/blank
- ❌ No UI elements are visible
- ❌ Forms don't work

## Solution (5 Minutes) ⚡

### Step 1: Get Supabase Keys (Choose One Method)

**🌟 Method A - Supabase Studio (Easiest)**
1. Open http://127.0.0.1:55323 in your browser
2. Click "Settings" (left sidebar)
3. Click "API"
4. Copy two keys:
   - `anon` key (public, starts with "eyJh...")
   - `service_role` key (private, also starts with "eyJh...")

**💻 Method B - PowerShell Command**
\`\`\`powershell
# Run this to see your keys:
$json = supabase status --output json | ConvertFrom-Json
Write-Host "`n📋 ANON KEY:" -ForegroundColor Cyan
Write-Host $json.anon_key -ForegroundColor Yellow
Write-Host "`n🔐 SERVICE ROLE KEY:" -ForegroundColor Cyan
Write-Host $json.service_role_key -ForegroundColor Yellow
\`\`\`

### Step 2: Create .env.local File

1. **In Cursor**: Create a new file named `.env.local` in project root
2. **Copy** the template from `ENV_LOCAL_TEMPLATE.txt`
3. **Paste** into `.env.local`
4. **Replace** `YOUR_ANON_KEY_HERE` with your actual anon key
5. **Replace** `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key
6. **Save** the file

**Quick Copy Template:**
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
NOTION_API_KEY=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
NOTION_APP_IDEAS_DATABASE_ID=cc491ef5f0a64eac8e05a6ea10dfb735
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

### Step 3: Restart Everything

\`\`\`bash
# Stop dev server (Ctrl+C if running)
pnpm dev
\`\`\`

### Step 4: Verify Setup ✅

\`\`\`bash
# Run verification script
node scripts/verify-env.js
\`\`\`

**Expected Output:**
\`\`\`
✅ All environment variables are set correctly!
✅ Successfully connected to Supabase!
\`\`\`

## Test Your Fix 🧪

### Visit Login Page
Open: http://localhost:3000/auth/login

**You should see:**
- ✅ Cyan/blue gradient background
- ✅ Login form with email/password fields  
- ✅ "Sign up" link at bottom
- ✅ **NO MORE WHITE SCREEN!**

### Visit Sign Up Page
Open: http://localhost:3000/auth/sign-up

**You should see:**
- ✅ Same beautiful gradient
- ✅ Sign-up form with all fields visible
- ✅ Dynamic role dropdown (Dominant/Submissive/Switch)
- ✅ All text is readable

### Create Your First Account (Becomes Admin!)
1. Fill out sign-up form:
   - Name: Your name
   - Email: your@email.com
   - Password: (minimum 6 characters)
   - Role: Choose your dynamic role
2. Click "Sign Up"
3. Check email at http://127.0.0.1:55324 (Mailpit)
4. Click verification link
5. Sign in
6. **You're now the admin!** 👑

## Still Having Issues? 🔍

### White Screen Still There?
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console (F12) for errors
4. Verify `.env.local` file was created and saved
5. Ensure dev server was restarted **after** creating `.env.local`

### "Cannot find module" errors?
\`\`\`bash
# Reinstall dependencies
pnpm install
\`\`\`

### Keys not working?
1. Verify you copied the **entire** key (they're very long!)
2. No spaces before or after the key
3. Used `anon` key (not `service_role` for NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Supabase not running?
\`\`\`bash
# Check status
supabase status

# If stopped, start it
supabase start
\`\`\`

## What's Next? 🚀

Once your auth screens are working:

1. **Sign up** as the first user (you'll be admin automatically)
2. **Verify email** via Mailpit link
3. **Sign in** to see the dashboard
4. **Explore** the KINK IT app features
5. **Check sidebar** for your admin badge

## Additional Resources 📚

- **Full Setup Guide**: `SETUP_ENV_LOCAL.md`
- **Auth Verification**: `AUTH_VERIFICATION.md`
- **Environment Template**: `ENV_LOCAL_TEMPLATE.txt`
- **Variables Documentation**: `ENV_VARIABLES.md`

## Security Reminder 🔒

- ✅ `.env.local` is already in `.gitignore`
- ✅ Never commit credentials to git
- ✅ Service role key is server-side only
- ✅ Anon key is safe to use client-side

## Summary

The white screen issue was caused by missing environment variables. By following the steps above, you've:

1. ✅ Identified the missing Supabase credentials
2. ✅ Created `.env.local` with correct values
3. ✅ Restarted the dev server
4. ✅ Verified the connection works
5. ✅ Fixed the white screen issue

**Your KINK IT app should now be fully functional!** 🎉

---

**Need more help?** 
- Run: `node scripts/verify-env.js` to diagnose issues
- Check: Browser console (F12) for specific errors
- Verify: Supabase status with `supabase status`
- Review: The detailed guides in the docs folder
