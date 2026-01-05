# Authentication Verification Checklist

## Environment Variables ✅
All required Supabase environment variables should be configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- All Postgres connection strings ✅

## Database Schema ✅
Tables created and RLS enabled:
- `profiles` table with system_role and dynamic_role ✅
- `app_ideas` table with proper relationships ✅
- RLS policies configured for secure access ✅

## Auth Flow Components ✅
- Login page at `/auth/login` with cyan/blue gradient ✅
- Sign-up page at `/auth/sign-up` with dynamic role selection ✅
- Email verification page at `/auth/verify-email` ✅
- Middleware configured to refresh sessions ✅

## Supabase Client Setup ✅
- Browser client using `createBrowserClient` ✅
- Server client using `createServerClient` with cookies ✅
- Middleware using `updateSession` to refresh tokens ✅

## Current Issue: White Screen / Blank Auth Pages

### Diagnosis
The issue is likely related to how the layout is handling authenticated vs non-authenticated states. The layout wraps authenticated content in a dark mode container, but auth pages should render without it.

### Things to Check

#### 1. Verify Supabase is Running
```bash
# Check if Supabase is running
supabase status
```

Expected output should show services running on ports:
- API: `http://127.0.0.1:55321`
- DB: `postgresql://postgres:postgres@127.0.0.1:55432/postgres`
- Studio: `http://127.0.0.1:55323`

#### 2. Verify Environment Variables
Open `.env.local` and confirm:
```bash
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-status>

# Notion (Optional)
NOTION_API_KEY=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
NOTION_APP_IDEAS_DATABASE_ID=cc491ef5f0a64eac8e05a6ea10dfb735
```

#### 3. Check Browser Console
When you see the white/blank screen:
1. Open browser DevTools (F12)
2. Check the **Console** tab for errors
3. Check the **Network** tab to see if API calls are failing
4. Look for CORS errors or 401/403 responses

### Common Issues and Fixes

#### Issue: "Failed to fetch" or CORS errors
**Fix**: Ensure Supabase is running and the URL in `.env.local` matches the actual API port (55321).

#### Issue: Database connection errors
**Fix**: Run the migration scripts:
```bash
# From project root
psql postgresql://postgres:postgres@127.0.0.1:55432/postgres < scripts/001_create_app_ideas.sql
psql postgresql://postgres:postgres@127.0.0.1:55432/postgres < scripts/002_create_profiles.sql
```

#### Issue: White screen with no errors
**Fix**: Clear browser cache and Next.js cache:
```bash
# Stop dev server (Ctrl+C)
rm -rf .next
pnpm dev
```

#### Issue: Auth pages show but forms don't work
**Fix**: Check that the Supabase client is properly initialized. The error should appear in the browser console.

### Testing Steps

#### 1. Test Sign Up (First User = Admin)
1. Navigate to `http://localhost:3000/auth/sign-up`
2. You should see a cyan/blue gradient background with a sign-up form
3. Fill out:
   - Full name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Dynamic role: Select "Submissive"
4. Click "Sign Up"
5. Check Inbucket at `http://127.0.0.1:55324` for the verification email
6. Click the verification link
7. First user will automatically get `system_role: admin`

#### 2. Test Sign In
1. Navigate to `http://localhost:3000/auth/login`
2. You should see a cyan/blue gradient background with a login form
3. Enter the email and password from step 1
4. Click "Sign In"
5. Should redirect to `/` (dashboard)
6. You should see the dark-themed dashboard with your profile

#### 3. Verify Profile
After authentication, check:
- Dashboard shows your display name
- "Admin" badge appears in the sidebar user section
- Your dynamic role (Submissive) is displayed

### Database Verification

Check if the tables exist:
```sql
-- Connect to local Supabase
psql postgresql://postgres:postgres@127.0.0.1:55432/postgres

-- List tables
\dt

-- Check profiles table structure
\d profiles

-- Check if any profiles exist
SELECT id, email, system_role, dynamic_role FROM profiles;

-- Exit psql
\q
```

### Next.js Dev Server

Make sure the dev server is running:
```bash
pnpm dev
```

Expected output:
```
▲ Next.js 15.5.9
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.3s
```

### If All Else Fails

1. **Stop everything**:
   ```bash
   # Stop Next.js dev server (Ctrl+C in terminal)
   # Stop Supabase
   supabase stop
   ```

2. **Clean and restart**:
   ```bash
   # Clean Next.js cache
   rm -rf .next
   
   # Restart Supabase
   supabase start
   
   # Start Next.js
   pnpm dev
   ```

3. **Check for port conflicts**:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3000
   netstat -ano | findstr :55321
   netstat -ano | findstr :55432
   ```

## Expected Behavior After Fix

✅ **Auth Pages**: Visible with cyan/blue gradient, forms are functional  
✅ **Sign Up**: Creates user, sends verification email to Inbucket  
✅ **Sign In**: Redirects to dashboard after successful login  
✅ **Dashboard**: Shows dark theme with user profile and admin badge (first user)  
✅ **Profile Data**: Correctly stored in `profiles` table with roles  

## Support

If you're still experiencing issues:
1. Share the browser console errors
2. Share the terminal output from `pnpm dev`
3. Share the output from `supabase status`
4. Confirm the contents of `.env.local` (without exposing keys)
