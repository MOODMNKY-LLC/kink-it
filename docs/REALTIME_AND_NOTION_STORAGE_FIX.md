# Realtime Channel & Notion API Key Storage Fix

**Date:** February 2, 2025  
**Status:** ✅ Migration Created - Needs Application

## Issues Identified

### 1. Realtime Channel Authorization Errors

**Error:**
```
Unauthorized: You do not have permissions to read from this Channel topic: user:83227e77-e805-4031-ad9e-c5798745ca48:notifications
Unauthorized: You do not have permissions to read from this Channel topic: user:83227e77-e805-4031-ad9e-c5798745ca48:presence
```

**Root Cause:**
- Missing RLS policy for `user:%:presence` channels
- Presence channels need both SELECT (read) and INSERT (write) permissions
- Only notifications channel had SELECT policy, but no INSERT policy

**Fix:**
Created migration `20260202000001_fix_realtime_presence_and_notion_storage.sql` that:
- Adds SELECT policy for `user:%:presence` channels
- Adds INSERT policy for `user:%:presence` channels (for presence tracking)
- Adds INSERT policy for `user:%:notifications` channels (for broadcasting)
- Creates indexes for performance

### 2. Notion API Key Storage Error

**Error:**
```
Error adding API key: Error: Failed to store API key
```

**Root Cause:**
- Database function `store_user_notion_api_key` uses `encrypt_notion_api_key`
- `encrypt_notion_api_key` calls `pgp_sym_encrypt` from pgcrypto extension
- Functions are in `extensions` schema, but `search_path` only included `public`
- Function couldn't find `pgp_sym_encrypt` function

**Fix:**
Updated all encryption/decryption functions to:
- Use `SET search_path = public, extensions` to access pgcrypto functions
- Call `extensions.pgp_sym_encrypt` and `extensions.pgp_sym_decrypt` directly
- Added proper error handling

## Migration File

**File:** `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql`

### Changes:

1. **Realtime Presence Policies:**
   ```sql
   -- Users can read from their own presence channel
   CREATE POLICY "Users can read their own presence channel"
     ON realtime.messages FOR SELECT
     USING (topic LIKE 'user:%:presence' AND SPLIT_PART(topic, ':', 2)::uuid = auth.uid());
   
   -- Users can write to their own presence channel
   CREATE POLICY "Users can write to their own presence channel"
     ON realtime.messages FOR INSERT
     WITH CHECK (topic LIKE 'user:%:presence' AND SPLIT_PART(topic, ':', 2)::uuid = auth.uid());
   ```

2. **Realtime Notifications Write Policy:**
   ```sql
   -- Users can write to their own notification channel (for broadcasting)
   CREATE POLICY "Users can write to their own notification channel"
     ON realtime.messages FOR INSERT
     WITH CHECK (topic LIKE 'user:%:notifications' AND SPLIT_PART(topic, ':', 2)::uuid = auth.uid());
   ```

3. **Fixed Encryption Functions:**
   ```sql
   -- Updated to use extensions schema
   CREATE OR REPLACE FUNCTION public.encrypt_notion_api_key(...)
   SET search_path = public, extensions
   AS $$
     RETURN extensions.pgp_sym_encrypt(p_api_key, p_encryption_key);
   $$;
   ```

## Application Steps

### For Local Development:

```bash
# Apply migration to local Supabase
supabase db reset --local
# Or
supabase migration up
```

### For Production:

1. **Via Supabase Dashboard:**
   - Go to Database > Migrations
   - Click "New Migration"
   - Copy contents of `20260202000001_fix_realtime_presence_and_notion_storage.sql`
   - Apply migration

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

3. **Via MCP (if available):**
   - Use Supabase MCP `apply_migration` tool

## Verification

### Test Realtime Channels:

1. **Presence Channel:**
   - Open app in browser
   - Check browser console - should see no "Unauthorized" errors for presence
   - Online status should work

2. **Notifications Channel:**
   - Trigger a notification
   - Should receive without "Unauthorized" errors

### Test Notion API Key Storage:

1. Go to Account Settings > Notion API Keys
2. Try adding a new Notion API key
3. Should succeed without "Failed to store API key" error

## Expected Behavior After Fix

### Before:
- ❌ Presence channel: "Unauthorized" errors
- ❌ Notifications channel: "Unauthorized" errors  
- ❌ Notion API key upload: "Failed to store API key"

### After:
- ✅ Presence channel: Works correctly, no errors
- ✅ Notifications channel: Works correctly, no errors
- ✅ Notion API key upload: Stores successfully

## Additional Improvements

### Enhanced Error Logging

Updated `app/api/notion/api-keys/route.ts` to include:
- Detailed error messages
- Error codes
- Better debugging information

This will help identify future issues more quickly.

## Related Files

- `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql` - Migration file
- `app/api/notion/api-keys/route.ts` - API route (enhanced error logging)
- `hooks/use-online-status.ts` - Presence hook (should work after fix)
- `components/dashboard/notifications/terminal-notifications-realtime.tsx` - Notifications component (should work after fix)

