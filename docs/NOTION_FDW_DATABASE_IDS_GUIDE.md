# Notion FDW Database IDs Configuration Guide

**Purpose**: Configure Notion database IDs so FDW can query your Notion workspace

---

## 🎯 What is the Purpose of This Workflow?

### The Problem
Currently, when admins want to search across all bond members' content:
- ❌ Multiple slow API calls (500-2000ms each)
- ❌ Can't join Supabase + Notion data efficiently
- ❌ Limited search capabilities
- ❌ No unified view of all content

### The Solution: Notion FDW
Foreign Data Wrapper (FDW) enables:
- ✅ **Fast SQL queries** (50-200ms) instead of API calls
- ✅ **Unified searches** across Supabase + Notion in one query
- ✅ **Bond-aware access** - Only shows data from users in admin's bonds
- ✅ **Admin-only** - Secure RBAC enforcement
- ✅ **Template access** - Can access parent page and template databases

### Real-World Use Case
**Before FDW:**
\`\`\`
Admin searches for "kinky scene" across 10 bond members:
- 10 API calls to Notion (2 seconds each) = 20 seconds
- 10 API calls to Supabase = 2 seconds
- Total: ~22 seconds
\`\`\`

**After FDW:**
\`\`\`
Admin searches for "kinky scene" across 10 bond members:
- 1 SQL query joining Supabase + Notion = 200ms
- Total: 0.2 seconds (110x faster!)
\`\`\`

---

## 📍 Where Do Database IDs Come From?

### Option 1: From Your Notion Workspace (Manual)

**Step 1**: Open your Notion workspace  
**Step 2**: Navigate to your Image Generations database  
**Step 3**: Get the database ID from the URL

**Example URL:**
\`\`\`
https://www.notion.so/your-workspace/Image-Generations-37f13e53-37cd-4460-b2fd-62a6c80e2d9e
                                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                    This is the database ID
\`\`\`

**Database ID Format**: `37f13e53-37cd-4460-b2fd-62a6c80e2d9e` (UUID format)

### Option 2: From Notion API (Automated)

Your codebase already has logic to retrieve database IDs. Check:

\`\`\`typescript
// app/api/notion/integration-status/route.ts
// This endpoint lists all accessible databases
\`\`\`

You can use the Notion API to get database IDs programmatically.

### Option 3: From Existing `notion_databases` Table

If users have already synced their templates, database IDs might already exist:

\`\`\`sql
-- Check existing database IDs
SELECT database_type, database_id, database_name, user_id
FROM notion_databases
ORDER BY database_type, user_id;
\`\`\`

**Note**: For FDW, we need database IDs with `user_id IS NULL` (template/global databases).

---

## 🔧 How to Configure Database IDs

### Method 1: Manual SQL Insert (Quick Setup)

\`\`\`sql
-- Insert template database IDs
INSERT INTO notion_databases (database_type, database_id, database_name, user_id)
VALUES 
  (
    'image_generations', 
    '37f13e53-37cd-4460-b2fd-62a6c80e2d9e', -- Replace with your actual database ID
    'Image Generations', 
    NULL -- NULL = template/global database
  ),
  (
    'kinkster_profiles', 
    'your-kinkster-profiles-db-id', -- Replace with your actual database ID
    'KINKSTER Profiles', 
    NULL
  )
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT * FROM notion_databases WHERE user_id IS NULL;
\`\`\`

### Method 2: Via API Endpoint (If Available)

If you have an endpoint that syncs template databases, use that:

\`\`\`bash
# Example (adjust endpoint as needed)
POST /api/notion/sync-template
{
  "database_type": "image_generations",
  "database_id": "37f13e53-37cd-4460-b2fd-62a6c80e2d9e"
}
\`\`\`

### Method 3: From Notion API Directly

Use your production Notion API key to query databases:

\`\`\`typescript
// Get all databases from Notion workspace
const response = await fetch('https://api.notion.com/v1/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY_PROD}`,
    'Notion-Version': '2022-06-28',
  },
  body: JSON.stringify({
    filter: {
      property: 'object',
      value: 'database'
    }
  })
});

const databases = await response.json();
// Extract database IDs from results
\`\`\`

---

## 🚀 Complete Workflow

### Step 1: Get Database IDs from Notion

**From Notion Workspace:**
1. Open your Notion workspace
2. Navigate to **Image Generations** database
3. Copy the database ID from URL (the UUID after the last `/`)
4. Repeat for **KINKSTER Profiles** database

**From Notion API:**
\`\`\`bash
# Use your production API key
curl -X POST 'https://api.notion.com/v1/search' \
  -H "Authorization: Bearer YOUR_NOTION_API_KEY_HERE" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "object",
      "value": "database"
    }
  }'
\`\`\`

### Step 2: Insert Database IDs

\`\`\`sql
INSERT INTO notion_databases (database_type, database_id, database_name, user_id)
VALUES 
  ('image_generations', 'your-image-db-id', 'Image Generations', NULL),
  ('kinkster_profiles', 'your-kinkster-db-id', 'KINKSTER Profiles', NULL)
ON CONFLICT DO NOTHING;
\`\`\`

### Step 3: Initialize Foreign Tables

\`\`\`sql
SELECT * FROM public.setup_notion_fdw_tables();
\`\`\`

This will:
- Create `notion_fdw.image_generations_all` foreign table
- Create `notion_fdw.kinkster_profiles_all` foreign table
- Automatically create admin views

### Step 4: Verify

\`\`\`sql
-- Check foreign tables
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'notion_fdw';

-- Test query
SELECT COUNT(*) FROM notion_fdw.image_generations_all;

-- Test admin view
SELECT * FROM public.admin_image_generations_all LIMIT 5;
\`\`\`

---

## 💡 Why This Workflow?

### The Architecture

\`\`\`
┌─────────────────┐
│   Notion API    │  ← Slow (500-2000ms per call)
└─────────────────┘
        │
        │ Multiple API calls
        ▼
┌─────────────────┐
│  Your App API   │
└─────────────────┘
\`\`\`

**With FDW:**

\`\`\`
┌─────────────────┐
│  Notion FDW     │  ← Fast SQL queries (50-200ms)
└─────────────────┘
        │
        │ Single SQL query
        ▼
┌─────────────────┐
│  Supabase DB    │  ← Unified data access
└─────────────────┘
\`\`\`

### Benefits

1. **Speed**: 10-100x faster searches
2. **Unified**: Join Supabase + Notion data in one query
3. **Efficient**: Database-level filtering vs application-level
4. **Scalable**: Handles large datasets efficiently
5. **Secure**: RBAC enforced, bond-aware filtering

### Use Cases

**Admin Image Gallery Search:**
\`\`\`typescript
// Before: Multiple API calls
const results = await Promise.all([
  notionApi.search('kinky scene', user1),
  notionApi.search('kinky scene', user2),
  // ... 10 more API calls
]);
// Takes 20+ seconds

// After: Single SQL query
const { data } = await supabase.rpc('admin_search_image_generations', {
  search_query: 'kinky scene',
  admin_user_id: userId,
  limit_count: 100
});
// Takes 200ms
\`\`\`

**Admin KINKSTER Browse:**
\`\`\`typescript
// Search across all bond members' KINKSTER profiles
const { data } = await supabase.rpc('admin_search_kinkster_profiles', {
  search_query: 'dominant',
  admin_user_id: userId
});
\`\`\`

---

## 🔍 Finding Database IDs in Notion

### Method 1: From URL

1. Open database in Notion
2. Look at URL: `https://www.notion.so/workspace/Database-Name-{DATABASE_ID}`
3. Copy the UUID (32 characters with dashes)

### Method 2: From Database Properties

1. Open database
2. Click `...` menu → `Copy link`
3. Extract database ID from the link

### Method 3: From Notion API

\`\`\`bash
# List all databases
curl -X POST 'https://api.notion.com/v1/search' \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property": "object", "value": "database"}}'
\`\`\`

---

## 📋 Quick Reference

### Database IDs Needed

- ✅ **Image Generations**: Database ID from your Notion workspace
- ✅ **KINKSTER Profiles**: Database ID from your Notion workspace
- ⏳ **Tasks** (optional): If you have a Tasks database
- ⏳ **Ideas** (optional): If you have an Ideas database

### SQL Commands

\`\`\`sql
-- 1. Insert database IDs
INSERT INTO notion_databases (database_type, database_id, database_name, user_id)
VALUES ('image_generations', 'YOUR-DB-ID', 'Image Generations', NULL);

-- 2. Initialize foreign tables
SELECT * FROM public.setup_notion_fdw_tables();

-- 3. Verify
SELECT * FROM pg_tables WHERE schemaname = 'notion_fdw';
\`\`\`

---

## 🎯 Summary

**Purpose**: Enable fast admin searches across all bond members' Notion content

**Workflow**:
1. Get database IDs from Notion workspace
2. Insert into `notion_databases` table
3. Run `setup_notion_fdw_tables()`
4. Use admin search functions

**Benefits**: 10-100x faster searches, unified data access, bond-aware filtering

**Next Step**: Get your database IDs from Notion and insert them!
