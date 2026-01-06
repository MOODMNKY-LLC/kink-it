# Notion FDW Quick Start Guide

**Using Production API Key from Environment Variables**

---

## Quick Setup (5 Minutes)

### Step 1: Apply Migration

```bash
# Apply the migration that sets up FDW structure
supabase migration up
```

This creates:
- ✅ Foreign data wrapper
- ✅ Helper functions
- ✅ Admin views
- ✅ Search functions

### Step 2: Create Foreign Server

Call the setup API endpoint (uses your `NOTION_API_KEY_PROD` from env):

```bash
# Via API (requires admin authentication)
curl -X POST http://localhost:3000/api/admin/notion/setup-fdw \
  -H "Authorization: Bearer <your_access_token>"
```

Or manually via SQL (if you have direct DB access):

```sql
-- Get your API key from .env.local and run:
SELECT public.create_notion_fdw_server('your_notion_api_key_here');
```

### Step 3: Initialize Foreign Tables

```sql
-- This reads database IDs from notion_databases table
SELECT * FROM public.setup_notion_fdw_tables();
```

### Step 4: Test

```sql
-- Test foreign table
SELECT * FROM notion_fdw.image_generations_all LIMIT 1;

-- Test admin view (requires admin role)
SELECT * FROM public.admin_image_generations_all LIMIT 1;

-- Test admin search
SELECT * FROM public.admin_search_image_generations('kinky', auth.uid(), 10);
```

---

## What Gets Created

### Foreign Tables (in `notion_fdw` schema)
- `image_generations_all` - All Image Generations from Notion
- `kinkster_profiles_all` - All KINKSTER Profiles from Notion
- `tasks_all` - All Tasks (if database exists)
- `ideas_all` - All Ideas (if database exists)

### Admin Views (in `public` schema)
- `admin_image_generations_all` - Bond members' images with Notion data
- `admin_kinkster_profiles_all` - Bond members' KINKSTER profiles with Notion data

### Admin Functions
- `admin_search_image_generations(query, user_id, limit)` - Fast search
- `admin_search_kinkster_profiles(query, user_id, limit)` - Fast search

### Helper Functions
- `is_admin(user_id)` - Check if user is admin
- `get_bond_member_ids(admin_id)` - Get all bond member IDs
- `create_notion_fdw_server(api_key)` - Setup foreign server
- `setup_notion_fdw_tables()` - Initialize foreign tables

---

## API Usage

### Admin Image Search

```typescript
// app/api/admin/gallery/search/route.ts
const { data } = await supabase
  .rpc('admin_search_image_generations', {
    search_query: 'kinky scene',
    admin_user_id: userId,
    limit_count: 100
  })
```

### Admin KINKSTER Browse

```typescript
const { data } = await supabase
  .rpc('admin_search_kinkster_profiles', {
    search_query: 'dominant',
    admin_user_id: userId
  })
```

---

## Troubleshooting

### Foreign Server Not Created

```sql
-- Check if server exists
SELECT * FROM pg_foreign_server WHERE srvname = 'notion_service_account_server';

-- Create manually if needed
SELECT public.create_notion_fdw_server('your_api_key');
```

### Foreign Tables Not Found

```sql
-- Check database IDs
SELECT * FROM notion_databases WHERE database_type IN ('image_generations', 'kinkster_profiles');

-- Re-run setup
SELECT * FROM public.setup_notion_fdw_tables();
```

### Permission Denied

Ensure you're authenticated as admin:
```sql
SELECT public.is_admin(auth.uid()); -- Should return true
```

---

**Status**: Ready to Deploy  
**Migration**: `20260201000003_setup_notion_fdw_with_env_key.sql`  
**Setup Endpoint**: `/api/admin/notion/setup-fdw`


