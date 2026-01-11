# Notion FDW: Using Authenticated User Credentials

**Correct Approach**: Database IDs should be linked to authenticated users via their Notion API keys stored in `user_notion_api_keys`.

---

## 🔄 The Correct Workflow

### Current Architecture

1. **User Authentication**:
   - User authenticates → `auth.users(id)` created
   - Profile created → `profiles(id)` (matches `auth.users.id`)

2. **Notion API Key Storage**:
   - User adds Notion API key → Stored in `user_notion_api_keys`
   - References: `user_id` → `auth.users(id)`
   - Encrypted using `pgcrypto`

3. **Database Discovery**:
   - When user syncs Notion → Databases discovered via their API key
   - Stored in `notion_databases` table
   - References: `user_id` → `profiles(id)` (which matches `auth.users.id`)

4. **FDW Access**:
   - **Service Account Key** (`NOTION_API_KEY_PROD`) used for FDW
   - This is an internal integration token with access to all databases
   - Admin users can query all databases via FDW

---

## 🎯 For FDW Setup

### Two Approaches:

#### Approach 1: User-Specific Databases (Current)
- Each user's databases stored in `notion_databases` with their `user_id`
- FDW function queries databases by `user_id`
- Admin can access databases from bond members

#### Approach 2: Service Account Databases (Template/Global)
- Template/parent databases stored with admin `user_id` or NULL
- FDW uses service account key to access all databases
- Admin can query all databases regardless of owner

### Recommended: Hybrid Approach

**For Template/Parent Databases**:
- Store with admin `user_id` (or first admin user)
- Use service account key for FDW access
- These are the "master" databases everyone uses

**For User-Specific Databases**:
- Store with user's `user_id`
- FDW can still access via service account key
- Admin views filter by bond membership

---

## 📋 Updated Setup Steps

### Step 1: Get Authenticated User ID

\`\`\`typescript
// In your API route or component
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // User not authenticated
  return
}

// user.id is the authenticated user's ID
// This matches profiles.id
\`\`\`

### Step 2: Check if User Has Notion API Key

\`\`\`sql
-- Check if user has a Notion API key stored
SELECT id, key_name, key_hash, is_active
FROM user_notion_api_keys
WHERE user_id = 'USER-ID-FROM-AUTH'
  AND is_active = true;
\`\`\`

### Step 3: Discover User's Databases

\`\`\`typescript
// Use user's Notion API key to discover databases
const { data: apiKey } = await supabase.rpc('get_user_notion_api_key', {
  p_key_id: keyId,
  p_user_id: user.id,
  p_encryption_key: process.env.NOTION_API_KEY_ENCRYPTION_KEY
})

// Query Notion API to discover databases
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

const databases = await response.json()
\`\`\`

### Step 4: Store Database IDs

\`\`\`sql
-- Insert discovered databases for authenticated user
INSERT INTO notion_databases (database_type, database_id, database_name, user_id, parent_page_id)
VALUES 
  (
    'image_generations',
    '2e0cd2a6-5422-8187-a13b-d8234760fcdc',
    '🎨 Image Generations',
    'AUTHENTICATED-USER-ID', -- From auth.users.id / profiles.id
    'parent-page-id-here'
  )
ON CONFLICT (user_id, database_id) DO UPDATE
SET database_name = EXCLUDED.database_name,
    updated_at = now();
\`\`\`

### Step 5: Initialize FDW (Uses Service Account)

\`\`\`sql
-- FDW uses service account key (NOTION_API_KEY_PROD)
-- This can access all databases regardless of owner
SELECT * FROM public.setup_notion_fdw_tables();
\`\`\`

---

## 🔍 Key Insight

**The Confusion**:
- `user_notion_api_keys.user_id` → References `auth.users(id)`
- `notion_databases.user_id` → References `profiles(id)`
- But `profiles.id` = `auth.users.id` (they match!)

**The Solution**:
- Use authenticated user's ID from `auth.users.id` (or `profiles.id`)
- This is the same ID used in both tables
- FDW uses service account key but queries databases by `user_id` for filtering

---

## 💡 Updated FDW Function Logic

The `setup_notion_fdw_tables()` function should:

1. **For Template Databases**:
   - Query `notion_databases` where `user_id` = admin user
   - Or where `database_type` matches template types

2. **For User Databases**:
   - Query `notion_databases` for all users
   - FDW service account can access all via service account key
   - Admin views filter by bond membership

3. **Admin Access**:
   - Admin users can query all databases via FDW
   - Results filtered by bond membership in admin views
   - Uses service account key for access, user_id for filtering

---

## 🚀 Corrected Next Steps

### For Authenticated User Setup:

\`\`\`typescript
// 1. Get authenticated user
const { data: { user } } = await supabase.auth.getUser()
const userId = user.id // This is auth.users.id = profiles.id

// 2. Check for Notion API key
const { data: apiKeys } = await supabase
  .from('user_notion_api_keys')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)

// 3. If API key exists, discover databases
if (apiKeys && apiKeys.length > 0) {
  // Use API key to discover databases
  // Store in notion_databases with user_id = userId
}

// 4. Initialize FDW (uses service account)
// This happens server-side with NOTION_API_KEY_PROD
\`\`\`

### For FDW Initialization:

\`\`\`sql
-- FDW setup uses service account key
-- But queries databases by user_id for proper linking
SELECT * FROM public.setup_notion_fdw_tables();

-- This creates foreign tables accessible via service account
-- Admin views filter by bond membership
\`\`\`

---

## 📋 Summary

**Correct Approach**:
- ✅ Database IDs linked to authenticated user's `user_id` (from `auth.users.id` / `profiles.id`)
- ✅ User's Notion API key stored in `user_notion_api_keys`
- ✅ Databases discovered via user's API key and stored in `notion_databases`
- ✅ FDW uses service account key (`NOTION_API_KEY_PROD`) for access
- ✅ Admin views filter results by bond membership

**Key Point**: 
- `user_id` in `notion_databases` = authenticated user's ID
- FDW service account key can access all databases
- Admin filtering happens in views, not at FDW level

---

**Next Step**: Update FDW setup to properly query databases by authenticated user's `user_id`!
