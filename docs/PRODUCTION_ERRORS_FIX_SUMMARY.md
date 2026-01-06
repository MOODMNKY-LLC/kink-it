# Production Errors Fix Summary

**Date:** February 2, 2025  
**Status:** ✅ Fixes Created - Migration Ready to Apply

## Issues Fixed

### 1. ✅ Notion API Key Storage Error

**Error:** `Error adding API key: Error: Failed to store API key`

**Root Cause:**
- Database function `store_user_notion_api_key` had incorrect `search_path`
- Missing `extensions` schema in search_path prevented access to `pgp_sym_encrypt`
- Function couldn't encrypt the API key, causing storage to fail

**Fix Applied:**
- Updated `store_user_notion_api_key` function to use `SET search_path = public, extensions`
- Updated `encrypt_notion_api_key` function to explicitly use `extensions.pgp_sym_encrypt`
- Updated `decrypt_notion_api_key` function to explicitly use `extensions.pgp_sym_decrypt`
- Added proper error handling and GRANT permissions

**Migration:** `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql`

### 2. ✅ Realtime Channel Authorization Errors

**Errors:**
```
Unauthorized: You do not have permissions to read from this Channel topic: user:83227e77-e805-4031-ad9e-c5798745ca48:notifications
Unauthorized: You do not have permissions to read from this Channel topic: user:83227e77-e805-4031-ad9e-c5798745ca48:presence
```

**Root Cause:**
- Missing RLS policy for `user:%:presence` channels
- Presence channels require both SELECT (read) and INSERT (write) permissions
- Notifications channel had SELECT but missing INSERT policy

**Fix Applied:**
- Added SELECT policy for `user:%:presence` channels
- Added INSERT policy for `user:%:presence` channels (for presence tracking)
- Added INSERT policy for `user:%:notifications` channels (for broadcasting)
- Created performance indexes for both channel types

**Migration:** `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql`

## Migration File

**File:** `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql`

### Key Changes:

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
   -- Users can write to their own notification channel
   CREATE POLICY "Users can write to their own notification channel"
     ON realtime.messages FOR INSERT
     WITH CHECK (topic LIKE 'user:%:notifications' AND SPLIT_PART(topic, ':', 2)::uuid = auth.uid());
   ```

3. **Fixed Encryption Functions:**
   ```sql
   -- Updated store_user_notion_api_key to use extensions schema
   CREATE OR REPLACE FUNCTION public.store_user_notion_api_key(...)
   SET search_path = public, extensions
   AS $$
     v_encrypted_key := extensions.pgp_sym_encrypt(p_api_key, p_encryption_key);
   $$;
   ```

## Application Instructions

### For Production Database:

**Option 1: Via Supabase Dashboard**
1. Go to Supabase Dashboard > Database > Migrations
2. Click "New Migration"
3. Copy contents of `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql`
4. Click "Apply Migration"

**Option 2: Via Supabase CLI**
```bash
# From project root
supabase db push
```

**Option 3: Via Supabase MCP**
- Use `mcp_supabase_apply_migration` tool with:
  - name: `fix_realtime_presence_and_notion_storage`
  - query: (contents of migration file)

### For Local Development:

The migration will be applied automatically when you run:
```bash
supabase db reset --local
```

Or manually:
```bash
supabase migration up
```

## Verification Steps

### 1. Test Notion API Key Storage

1. Log into production app
2. Navigate to Account Settings > Notion API Keys
3. Click "Add API Key"
4. Enter a valid Notion API key
5. **Expected:** Should store successfully without "Failed to store API key" error

### 2. Test Realtime Channels

1. Open production app in browser
2. Open browser console (F12)
3. **Expected:** No "Unauthorized" errors for:
   - `user:{userId}:notifications`
   - `user:{userId}:presence`
4. Online status indicator should work
5. Notifications should be received in real-time

### 3. Check Migration Status

```sql
-- Check if migration was applied
SELECT * FROM supabase_migrations.schema_migrations 
WHERE name LIKE '%fix_realtime_presence_and_notion_storage%';

-- Verify policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'messages' 
AND schemaname = 'realtime'
AND policyname LIKE '%presence%' OR policyname LIKE '%notification%';

-- Verify functions updated
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_name IN ('store_user_notion_api_key', 'encrypt_notion_api_key', 'decrypt_notion_api_key');
```

## Expected Behavior After Fix

### Before:
- ❌ Notion API key upload: "Failed to store API key"
- ❌ Presence channel: "Unauthorized" errors
- ❌ Notifications channel: "Unauthorized" errors
- ❌ Online status: Not working
- ❌ Real-time notifications: Not working

### After:
- ✅ Notion API key upload: Stores successfully
- ✅ Presence channel: Works correctly, no errors
- ✅ Notifications channel: Works correctly, no errors
- ✅ Online status: Tracks user presence correctly
- ✅ Real-time notifications: Received in real-time

## Additional Improvements

### Enhanced Error Logging

Updated `app/api/notion/api-keys/route.ts` to include:
- Detailed error messages with error codes
- Better debugging information
- More specific error responses

This will help identify future issues more quickly.

## Related Files

- `supabase/migrations/20260202000001_fix_realtime_presence_and_notion_storage.sql` - Migration file
- `app/api/notion/api-keys/route.ts` - Enhanced error logging
- `hooks/use-online-status.ts` - Presence hook (will work after migration)
- `components/dashboard/notifications/terminal-notifications-realtime.tsx` - Notifications (will work after migration)
- `components/kinky/kinky-terminal.tsx` - Terminal notifications (will work after migration)

## Next Steps

1. ✅ Migration file created
2. ⏳ Apply migration to production database
3. ⏳ Test Notion API key upload
4. ⏳ Verify Realtime channels work
5. ⏳ Monitor for any remaining errors

## Notes

- The migration is idempotent (uses `CREATE OR REPLACE` and `DROP POLICY IF EXISTS`)
- Safe to run multiple times
- No data loss - only adds policies and updates functions
- Backward compatible - doesn't break existing functionality

