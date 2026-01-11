# Notion FDW Setup Instructions

**Date**: 2025-02-01  
**Purpose**: Setup Notion Foreign Data Wrapper using production API key from environment variables

---

## Prerequisites

✅ **Notion API Key**: `NOTION_API_KEY_PROD` in `.env.local`  
✅ **Supabase Running**: `supabase start`  
✅ **Admin Access**: Service role key for database operations  
✅ **Wrappers Extension**: Already installed (verified)

---

## Step 1: Store API Key in Vault (Recommended)

### Option A: Via Supabase Dashboard

1. Go to **Supabase Dashboard** → **Project Settings** → **Vault**
2. Click **Add Secret**
3. Name: `notion_service_account_api_key`
4. Value: Your `NOTION_API_KEY_PROD` value
5. Click **Save**
6. **Note the Secret ID** (you'll need it)

### Option B: Via SQL Editor

\`\`\`sql
-- Store API key in Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('notion_service_account_api_key', 'your_notion_api_key_here')
ON CONFLICT (name) 
DO UPDATE SET secret = EXCLUDED.secret
RETURNING id;

-- Note the returned ID for use in foreign server
\`\`\`

---

## Step 2: Run Migration

The migration file `supabase/migrations/20260201000002_setup_notion_fdw_admin.sql` has been created.

### Apply Migration

\`\`\`bash
# Apply the migration
supabase migration up

# Or apply specific migration
supabase db push
\`\`\`

### What the Migration Does

1. ✅ Ensures `wrappers` extension is installed
2. ✅ Creates `wasm_wrapper` foreign data wrapper
3. ✅ Creates foreign server `notion_service_account_server`
4. ✅ Creates schema `notion_fdw` for foreign tables
5. ✅ Creates helper functions (`is_admin`, `get_bond_member_ids`)
6. ✅ Creates admin views (`admin_image_generations_all`, `admin_kinkster_profiles_all`)
7. ✅ Creates admin search functions
8. ✅ Sets up access logging

---

## Step 3: Configure Foreign Server

### If Using Vault (Recommended)

After storing the key in Vault, update the migration file with the Vault key ID:

\`\`\`sql
-- In migration file, update this line:
api_key_id '<vault_key_id_from_step_1>'
\`\`\`

### If Using Direct API Key (Less Secure)

The migration will attempt to use the API key directly if Vault key is not found.

**Note**: For production, prefer Vault storage.

---

## Step 4: Initialize Foreign Tables

After the migration runs, initialize the foreign tables:

\`\`\`sql
-- This function reads database IDs from notion_databases table
-- and creates foreign tables accordingly
SELECT public.setup_notion_fdw_tables();
\`\`\`

### Verify Foreign Tables Created

\`\`\`sql
-- Check if foreign tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'notion_fdw';

-- Should show:
-- notion_fdw.image_generations_all
-- notion_fdw.kinkster_profiles_all
\`\`\`

---

## Step 5: Test FDW Connection

### Test Image Generations Foreign Table

\`\`\`sql
-- Test query (should return data if FDW is working)
SELECT * 
FROM notion_fdw.image_generations_all 
LIMIT 5;
\`\`\`

### Test Admin View

\`\`\`sql
-- Test admin view (requires admin authentication)
SELECT * 
FROM public.admin_image_generations_all 
LIMIT 5;
\`\`\`

### Test Admin Search Function

\`\`\`sql
-- Test admin search (requires admin role)
SELECT * 
FROM public.admin_search_image_generations('kinky', auth.uid(), 10);
\`\`\`

---

## Step 6: Verify Database IDs

The `setup_notion_fdw_tables()` function reads database IDs from `notion_databases` table.

### Check Database IDs

\`\`\`sql
-- Verify database IDs exist
SELECT 
  database_type,
  database_id,
  database_name,
  user_id
FROM notion_databases
WHERE database_type IN ('image_generations', 'kinkster_profiles')
  AND user_id IS NULL; -- Template/global databases
\`\`\`

### If Database IDs Missing

If database IDs are not found, you may need to:

1. **Run Notion integration sync**:
   \`\`\`bash
   # This should populate notion_databases table
   # Via your onboarding flow or API endpoint
   \`\`\`

2. **Manually insert database IDs**:
   \`\`\`sql
   INSERT INTO notion_databases (database_type, database_id, database_name, user_id)
   VALUES 
     ('image_generations', 'your-database-id-here', 'Image Generations', NULL),
     ('kinkster_profiles', 'your-database-id-here', 'KINKSTER Profiles', NULL);
   \`\`\`

---

## Troubleshooting

### Error: Foreign Server Already Exists

\`\`\`sql
-- Drop and recreate
DROP SERVER IF EXISTS notion_service_account_server CASCADE;
-- Then re-run migration
\`\`\`

### Error: Foreign Tables Not Found

\`\`\`sql
-- Check if setup function was called
SELECT public.setup_notion_fdw_tables();

-- Check database IDs
SELECT * FROM notion_databases WHERE database_type IN ('image_generations', 'kinkster_profiles');
\`\`\`

### Error: Permission Denied

Ensure you're using service role key for admin operations:

\`\`\`bash
# Check service role key is set
echo $SUPABASE_SERVICE_ROLE_KEY
\`\`\`

### Error: API Key Invalid

Verify your `NOTION_API_KEY_PROD`:
- Format: `secret_...` or `ntn_...`
- Has access to parent page
- Has access to template databases
- Is an Internal Integration token

---

## Verification Checklist

- [ ] API key stored in Vault (or env variable accessible)
- [ ] Migration applied successfully
- [ ] Foreign server created (`notion_service_account_server`)
- [ ] Foreign tables created (`notion_fdw.image_generations_all`, `notion_fdw.kinkster_profiles_all`)
- [ ] Test query returns data
- [ ] Admin views accessible (with admin role)
- [ ] Admin search functions work
- [ ] Access logging enabled

---

## Next Steps

After setup is complete:

1. **Test Admin Search**: Use admin account to search across bond members
2. **Create API Endpoints**: Update admin endpoints to use FDW functions
3. **Monitor Performance**: Check query times and optimize if needed
4. **Set Up Caching**: Consider materialized views for frequently accessed data

---

## API Usage Examples

### Admin Image Search

\`\`\`typescript
// app/api/admin/gallery/search/route.ts
const { data } = await supabase
  .rpc('admin_search_image_generations', {
    search_query: 'kinky scene',
    admin_user_id: userId,
    limit_count: 100
  })
\`\`\`

### Admin KINKSTER Browse

\`\`\`typescript
const { data } = await supabase
  .rpc('admin_search_kinkster_profiles', {
    search_query: 'dominant',
    admin_user_id: userId
  })
\`\`\`

---

**Status**: Ready for Setup  
**Migration File**: `supabase/migrations/20260201000002_setup_notion_fdw_admin.sql`  
**Estimated Setup Time**: 15-30 minutes
