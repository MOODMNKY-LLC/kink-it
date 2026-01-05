# Authentication Verification Checklist

## Environment Variables ✅
All required Supabase environment variables are configured:
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

## How to Test

### 1. Sign Up (First User = Admin)
1. Navigate to `/auth/sign-up`
2. Fill out the form with:
   - Full name
   - Email
   - Password (min 6 characters)
   - Dynamic role (Dominant/Submissive/Switch)
3. Click "Sign Up"
4. Check email for verification link
5. Click verification link
6. First user will automatically get `system_role: admin`

### 2. Sign In
1. Navigate to `/auth/login`
2. Enter email and password
3. Click "Sign In"
4. Should redirect to `/` (dashboard)

### 3. Check Profile
After authentication, your profile should be created automatically with:
- Full name from signup
- Email from auth
- Dynamic role selected during signup
- System role: "admin" for first user, "user" for subsequent users

## Troubleshooting

### If auth screens are blank:
1. Check browser console for errors
2. Verify all environment variables are set in Vars section
3. Ensure database migration scripts have been run
4. Check that middleware.ts is not blocking auth routes

### If signup doesn't create profile:
1. Run the `002_create_profiles.sql` script
2. Verify the trigger function `handle_new_user()` exists
3. Check Supabase logs for errors

### If middleware redirects to login constantly:
1. Verify middleware is excluding `/auth/` routes
2. Check that cookies are being set properly
3. Ensure session refresh is working in middleware
