# Notion FDW: Corrected Approach Using Authenticated User Credentials

**You're absolutely right!** Database IDs should be linked to authenticated users via their Notion credentials stored in `user_notion_api_keys`.

---

## ✅ The Correct Understanding

### Current Architecture

1. **User Authentication**:
   - User authenticates → `auth.users(id)` created
   - Profile created → `profiles(id)` = `auth.users.id` (same UUID)

2. **Notion API Key Storage**:
   - User adds Notion API key → Stored in `user_notion_api_keys`
   - `user_id` → References `auth.users(id)`
   - Encrypted using `pgcrypto`

3. **Database Discovery & Storage**:
   - When user syncs Notion template → Databases discovered via their API key
   - Stored in `notion_databases` table
   - `user_id` → References `profiles(id)` (which = `auth.users.id`)

4. **FDW Access**:
   - **Service Account Key** (`NOTION_API_KEY_PROD`) used for FDW foreign server
   - This is an internal integration token with access to all databases
   - Admin users can query all databases via FDW, filtered by bond membership

---

## 🎯 The Correct Workflow

### For Database ID Storage:

\`\`\`typescript
// When user syncs their Notion template
const { data: { user } } = await supabase.auth.getUser()
const userId = user.id // This is auth.users.id = profiles.id

// Get user's Notion API key
const { data: apiKey } = await supabase.rpc('get_user_notion_api_key', {
  p_key_id: keyId,
  p_user_id: userId,
  p_encryption_key: process.env.NOTION_API_KEY_ENCRYPTION_KEY
})

// Discover databases using user's API key
const response = await fetch('https://api.notion.com/v1/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': '2022-06-28',
  },
  body: JSON.stringify({
    filter: { property: 'object', value: 'database' }
  })
})

// Store databases with user's ID
await supabase.from('notion_databases').insert({
  database_type: 'image_generations',
  database_id: 'discovered-db-id',
  database_name: 'Image Generations',
  user_id: userId, // From authenticated user
  parent_page_id: 'parent-page-id'
})
\`\`\`

### For FDW Setup:

\`\`\`sql
-- FDW uses service account key (NOTION_API_KEY_PROD)
-- But queries databases by user_id for proper linking
-- Admin views filter by bond membership

-- The setup function should:
-- 1. Query notion_databases for all users (or admin's databases)
-- 2. Create foreign tables using service account key
-- 3. Admin views filter results by bond membership
\`\`\`

---

## 📋 Updated Setup Steps

### Step 1: User Syncs Their Databases

When a user authenticates and connects their Notion API key:

\`\`\`typescript
// User goes through onboarding/sync flow
// Their databases are discovered and stored in notion_databases
// with their authenticated user_id
\`\`\`

### Step 2: FDW Initialization (Admin/Service Account)

For FDW, we use the service account key but query databases by `user_id`:

\`\`\`sql
-- The setup function queries notion_databases
-- It can find databases for:
-- 1. Admin users (for template databases)
-- 2. All users (for admin to access via bond filtering)

-- Then creates foreign tables using service account key
SELECT * FROM public.setup_notion_fdw_tables();
\`\`\`

### Step 3: Admin Queries

Admin users can query all databases, filtered by bond membership:

\`\`\`typescript
// Admin search function filters by bond membership
const { data } = await supabase.rpc('admin_search_image_generations', {
  search_query: 'kinky scene',
  admin_user_id: userId, // Admin's user_id
  limit_count: 100
})

// Returns results from bond members only
\`\`\`

---

## 🔍 Key Points

### Database Ownership:
- ✅ Databases stored with `user_id` = authenticated user's ID
- ✅ `user_id` comes from `auth.users.id` (via `profiles.id`)
- ✅ Same ID used in both `user_notion_api_keys` and `notion_databases`

### FDW Access:
- ✅ Uses service account key (`NOTION_API_KEY_PROD`) for foreign server
- ✅ Can access all databases (service account has broad access)
- ✅ Admin views filter by `user_id` and bond membership

### The Flow:
\`\`\`
User Authenticates
  ↓
User Adds Notion API Key → Stored in user_notion_api_keys
  ↓
User Syncs Template → Databases Discovered
  ↓
Databases Stored → notion_databases with user_id = auth.users.id
  ↓
FDW Setup → Uses service account key, queries by user_id
  ↓
Admin Queries → Filtered by bond membership
\`\`\`

---

## 🚀 Corrected Next Steps

### For Your Current Setup:

Since you're setting up FDW with the service account key, you have two options:

**Option 1: Use Existing User Databases**
- If users have already synced their databases, they're in `notion_databases`
- FDW can query them using service account key
- Admin views filter by bond membership

**Option 2: Use Template/Parent Databases**
- For template databases (parent page), use admin user's ID
- Or use the first user who has synced
- FDW uses service account key to access

### Recommended Approach:

\`\`\`sql
-- For template/parent databases, use admin user or first synced user
-- Get admin user ID
SELECT id FROM profiles WHERE system_role = 'admin' LIMIT 1;

-- Or get first user who has synced databases
SELECT DISTINCT user_id FROM notion_databases LIMIT 1;

-- Insert template database with that user_id
INSERT INTO notion_databases (database_type, database_id, database_name, user_id, parent_page_id)
VALUES 
  (
    'image_generations',
    '2e0cd2a6-5422-8187-a13b-d8234760fcdc',
    '🎨 Image Generations',
    (SELECT id FROM profiles WHERE system_role = 'admin' LIMIT 1), -- Admin user
    '2e0cd2a6-5422-8187-a13b-d8234760fcdc'
  );

-- Then initialize FDW
SELECT * FROM public.setup_notion_fdw_tables();
\`\`\`

---

## 💡 Summary

**You're Correct**: Database IDs should be linked to authenticated users via their Notion credentials.

**The Setup**:
1. ✅ Users sync databases → Stored with their `user_id` (from `auth.users.id`)
2. ✅ FDW uses service account key for access
3. ✅ Admin views filter by bond membership
4. ✅ For template databases, use admin user's ID

**Next Step**: 
- If users have synced: Use their existing database entries
- If setting up template: Use admin user's ID
- Then run `setup_notion_fdw_tables()`

---

**Key Insight**: 
- `user_id` in `notion_databases` = authenticated user's ID (`auth.users.id` / `profiles.id`)
- FDW service account key can access all databases
- Admin filtering happens in views, not at FDW level
