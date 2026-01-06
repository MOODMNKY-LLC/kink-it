# Fix Profile Fetch Error

## Issue
Error: `[v0] Error fetching profile: {}`

This error occurs when a user exists in `auth.users` but doesn't have a corresponding profile in the `profiles` table.

## Root Causes

1. **Trigger Not Fired**: The `on_auth_user_created` trigger may not have fired when the user was created
2. **Trigger Failed**: The trigger function may have encountered an error during execution
3. **User Created Before Trigger**: User was created before the trigger was set up
4. **Migration Not Applied**: The `002_create_profiles.sql` migration hasn't been applied

## Solution Applied

### 1. Enhanced Error Handling (`lib/auth/get-user.ts`)

- Added detailed error logging with error code, message, details, and hint
- Added automatic profile creation fallback when profile doesn't exist (PGRST116 error)
- Improved error messages for debugging

### 2. Updated Dashboard (`app/page.tsx`)

- Fixed profile display to use `dynamic_role` instead of non-existent `role` field
- Updated colors to match new theme (primary/accent instead of purple)
- Added admin badge display

### 3. Improved Layout Error Handling (`app/layout.tsx`)

- Added error logging for profile fetch failures
- Prevents layout from breaking if profile fetch fails

## How to Fix Existing Users

If you have existing users without profiles, you can manually create them:

### Option 1: Run SQL Migration

```sql
-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  dynamic_role,
  system_role
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  COALESCE(
    (u.raw_user_meta_data->>'dynamic_role')::dynamic_role,
    'submissive'
  ),
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = 1 THEN 'admin'::user_role
    ELSE 'user'::user_role
  END
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### Option 2: Verify Trigger Exists

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### Option 3: Re-run Migration

```bash
# Reset database (WARNING: This will delete all data)
supabase db reset

# Or apply migration manually
supabase migration up
```

## Prevention

The enhanced `getUserProfile()` function now:
1. Logs detailed error information
2. Automatically creates a profile if it doesn't exist (PGRST116 error)
3. Handles edge cases gracefully

## Testing

After applying the fix:
1. Check browser console for detailed error logs
2. Verify profile is created automatically for new users
3. Check that existing users can access the dashboard

## Related Files

- `lib/auth/get-user.ts` - Enhanced error handling and auto-creation
- `app/page.tsx` - Fixed profile display
- `app/layout.tsx` - Improved error handling
- `scripts/002_create_profiles.sql` - Profile creation trigger
- `scripts/003_enhance_profile_trigger.sql` - Enhanced trigger for Notion metadata





