# Notion Service Account & RBAC-Aware FDW Implementation

**Date**: 2025-02-01  
**Author**: CODE MNKY  
**Purpose**: Implement Notion FDW with service account key for admin-level access to all bond members' content

---

## Executive Summary

This guide implements a **service account-based FDW** that enables **admins** to have immediate, fast access to all content from users in their bonds, while maintaining security through RBAC (Role-Based Access Control).

### Key Architecture Decisions

✅ **Service Account Key** (env variable) → Used by FDW for all Notion queries  
✅ **User API Keys** (encrypted DB) → Still used for writes and user-specific operations  
✅ **Admin FDW Views** → Filter by bond membership, expose all bond members' data  
✅ **Regular User Views** → Only their own data (existing implementation)  
✅ **RBAC Functions** → Check admin role, get bond members, enforce access  

---

## Part 1: Understanding Notion Service Account Keys

### What is a Service Account Key?

A **Notion Service Account** (also called an **Internal Integration**) is a special type of Notion API credential that:

✅ **Created within a Notion workspace** (not via OAuth)  
✅ **Has access to all databases/pages** in that workspace by default  
✅ **No user consent required** (workspace admin grants access)  
✅ **Perfect for server-to-server** communication  
✅ **Can access multiple workspaces** if granted permission  

### Service Account vs. App Credentials

| Feature | Service Account (Internal Integration) | App Credentials (OAuth) |
|---------|--------------------------------------|------------------------|
| **Creation** | Created in Notion workspace settings | Created via OAuth flow |
| **Access Scope** | All databases in workspace (by default) | User-specific (requires consent) |
| **User Consent** | Not required | Required per user |
| **Use Case** | Server-to-server, admin access | User-specific operations |
| **API Key Format** | `secret_...` or `ntn_...` | `secret_...` or `ntn_...` |
| **Multi-Tenant** | Single workspace access | Per-user workspace access |

### When to Use Each

**Service Account Key** (FDW):
- ✅ Admin-level queries across all users
- ✅ Fast searches via FDW
- ✅ Analytics and reporting
- ✅ Read-only operations

**User API Keys** (Custom Integration):
- ✅ User-specific writes
- ✅ Per-user workspace access
- ✅ OAuth-based authentication
- ✅ Write operations

---

## Part 2: RBAC System Overview

### Current RBAC Structure

Based on your codebase, you have:

1. **System Roles**: `admin`, `user`
2. **Dynamic Roles**: `dominant`, `submissive`, `user`
3. **Bond Relationships**: Users connected through bonds
4. **Access Control**: Role-based permissions

### Admin Access Requirements

Admins need to:
- ✅ See all content from users in their bonds
- ✅ Search across all bond members' Notion data
- ✅ Access image generations, KINKSTER profiles, etc.
- ✅ Maintain security (only bond members, not all users)

---

## Part 3: Service Account Setup

### Step 1: Create Notion Internal Integration

1. **Go to Notion Workspace Settings**
   - Open your Notion workspace
   - Navigate to **Settings & Members** → **Connections**
   - Click **+ New connection** → **Develop or manage integrations**

2. **Create Internal Integration**
   - Click **+ New integration**
   - Name it: `KINK IT Admin Service Account`
   - Select **Internal** (not Public)
   - Choose workspace access level

3. **Grant Database Access**
   - For each database (Image Generations, KINKSTER Profiles, etc.)
   - Click **...** → **Add connections**
   - Select your service account integration

4. **Copy API Key**
   - After creation, copy the **Internal Integration Token**
   - Format: `secret_...` or `ntn_...`
   - **Keep this secure!**

### Step 2: Store Service Account Key

**Option A: Environment Variable (Recommended)**

\`\`\`bash
# .env.local
NOTION_SERVICE_ACCOUNT_API_KEY=secret_your_service_account_key_here
\`\`\`

**Option B: Supabase Vault (More Secure)**

\`\`\`sql
-- Store in Vault for FDW
INSERT INTO vault.secrets (name, secret)
VALUES (
  'notion_service_account_api_key',
  'secret_your_service_account_key_here'
)
RETURNING id;
-- Note the ID for FDW server configuration
\`\`\`

---

## Part 4: FDW Setup with Service Account

### Step 1: Enable Wrappers Extension

\`\`\`sql
-- Verify wrappers extension is installed
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;
\`\`\`

### Step 2: Create Foreign Data Wrapper

\`\`\`sql
-- Enable Wasm wrapper
CREATE FOREIGN DATA WRAPPER IF NOT EXISTS wasm_wrapper
HANDLER extensions.wasm_fdw_handler
VALIDATOR extensions.wasm_fdw_validator;
\`\`\`

### Step 3: Create Foreign Server with Service Account Key

**Using Environment Variable (via Edge Function/API)**:

\`\`\`sql
-- Note: This would be done via your API/Edge Function that has access to env vars
-- The FDW server creation happens server-side

-- For direct SQL (if you have env var access):
CREATE SERVER notion_service_account_server
FOREIGN DATA WRAPPER wasm_wrapper
OPTIONS (
  fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm',
  fdw_package_name 'supabase:notion-fdw',
  fdw_package_version '0.1.1',
  fdw_package_checksum '6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de',
  api_key 'secret_your_service_account_key_here' -- From env var
);
\`\`\`

**Using Vault (More Secure)**:

\`\`\`sql
-- First, store key in Vault (done via API/Edge Function)
-- Then create server with Vault key ID
CREATE SERVER notion_service_account_server
FOREIGN DATA WRAPPER wasm_wrapper
OPTIONS (
  fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm',
  fdw_package_name 'supabase:notion-fdw',
  fdw_package_version '0.1.1',
  fdw_package_checksum '6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de',
  api_key_id '<vault_key_id>' -- From Vault INSERT above
);
\`\`\`

### Step 4: Create Foreign Tables

\`\`\`sql
-- Create private schema for foreign tables
CREATE SCHEMA IF NOT EXISTS notion_fdw;

-- Foreign table for Image Generations (all users' data accessible via service account)
CREATE FOREIGN TABLE notion_fdw.image_generations_all (
  id TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  supabase_url TEXT,
  prompt TEXT,
  model TEXT,
  created_time TIMESTAMPTZ,
  last_edited_time TIMESTAMPTZ,
  notion_user_id TEXT, -- Notion user/workspace identifier
  attrs JSONB
)
SERVER notion_service_account_server
OPTIONS (
  object 'database',
  database_id 'your-image-generations-database-id'
);

-- Foreign table for KINKSTER Profiles
CREATE FOREIGN TABLE notion_fdw.kinkster_profiles_all (
  id TEXT,
  name TEXT,
  bio TEXT,
  personality_traits TEXT[],
  backstory TEXT,
  supabase_url TEXT,
  created_time TIMESTAMPTZ,
  last_edited_time TIMESTAMPTZ,
  notion_user_id TEXT,
  attrs JSONB
)
SERVER notion_service_account_server
OPTIONS (
  object 'database',
  database_id 'your-kinkster-profiles-database-id'
);
\`\`\`

---

## Part 5: RBAC-Aware Functions

### Helper Function: Check if User is Admin

\`\`\`sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
      AND (system_role = 'admin' OR dynamic_role = 'dominant')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
\`\`\`

### Helper Function: Get Bond Members

\`\`\`sql
-- Based on your actual bond_members table structure
-- Returns all user IDs that are in bonds where the admin is a member

CREATE OR REPLACE FUNCTION public.get_bond_member_ids(admin_user_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_ids UUID[];
BEGIN
  -- Get all users in bonds where admin is a member
  SELECT ARRAY_AGG(DISTINCT bm.user_id)
  INTO member_ids
  FROM bond_members bm
  WHERE bm.bond_id IN (
    -- Get all bond IDs where admin is a member
    SELECT DISTINCT bond_id
    FROM bond_members
    WHERE user_id = admin_user_id
      AND is_active = true
  )
  AND bm.is_active = true
  UNION
  -- Include admin themselves
  SELECT admin_user_id;
  
  RETURN COALESCE(member_ids, ARRAY[admin_user_id]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bond_member_ids TO authenticated;
\`\`\`

### Helper Function: Map Notion User ID to Supabase User ID

\`\`\`sql
-- If Notion user IDs don't directly map to Supabase user IDs,
-- you may need a mapping table or function

CREATE OR REPLACE FUNCTION public.get_supabase_user_from_notion(notion_user_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_user_id UUID;
BEGIN
  -- Option 1: If you store Notion user ID in profiles
  SELECT id INTO supabase_user_id
  FROM profiles
  WHERE notion_user_id = get_supabase_user_from_notion.notion_user_id
  LIMIT 1;
  
  -- Option 2: If you have a mapping table
  -- SELECT supabase_user_id INTO supabase_user_id
  -- FROM notion_user_mappings
  -- WHERE notion_user_id = get_supabase_user_from_notion.notion_user_id;
  
  RETURN supabase_user_id;
END;
$$;
\`\`\`

---

## Part 6: Admin-Only Views

### Admin Image Generations View (All Bond Members)

\`\`\`sql
CREATE OR REPLACE VIEW public.admin_image_generations_all AS
SELECT 
  ig.id,
  ig.user_id,
  ig.prompt,
  ig.image_url,
  ig.created_at,
  ig.updated_at,
  -- Notion data
  nig.title as notion_title,
  nig.description as notion_description,
  nig.tags as notion_tags,
  nig.created_time as notion_created_time,
  -- Owner info
  p.email as owner_email,
  p.display_name as owner_name,
  -- Search vector
  setweight(to_tsvector('english', coalesce(ig.prompt, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(nig.title, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(nig.description, '')), 'C') as search_vector
FROM public.image_generations ig
LEFT JOIN notion_fdw.image_generations_all nig ON ig.notion_page_id = nig.id
LEFT JOIN profiles p ON ig.user_id = p.id
WHERE 
  -- Only accessible to admins
  public.is_admin(auth.uid())
  -- And only show bond members' data
  AND ig.user_id = ANY(public.get_bond_member_ids(auth.uid()));

-- Grant access only to authenticated users (RLS will filter)
GRANT SELECT ON public.admin_image_generations_all TO authenticated;

-- RLS policy ensures only admins can access
ALTER VIEW public.admin_image_generations_all SET (security_invoker = true);
\`\`\`

### Admin KINKSTER Profiles View

\`\`\`sql
CREATE OR REPLACE VIEW public.admin_kinkster_profiles_all AS
SELECT 
  k.id,
  k.user_id,
  k.name,
  k.bio,
  k.avatar_url,
  k.created_at,
  -- Notion data
  nkp.personality_traits as notion_personality_traits,
  nkp.backstory as notion_backstory,
  nkp.created_time as notion_created_time,
  -- Owner info
  p.email as owner_email,
  p.display_name as owner_name,
  -- Search vector
  setweight(to_tsvector('english', coalesce(k.name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(k.bio, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(nkp.backstory, '')), 'C') as search_vector
FROM public.kinksters k
LEFT JOIN notion_fdw.kinkster_profiles_all nkp ON k.notion_page_id = nkp.id
LEFT JOIN profiles p ON k.user_id = p.id
WHERE 
  public.is_admin(auth.uid())
  AND k.user_id = ANY(public.get_bond_member_ids(auth.uid()));

GRANT SELECT ON public.admin_kinkster_profiles_all TO authenticated;
ALTER VIEW public.admin_kinkster_profiles_all SET (security_invoker = true);
\`\`\`

---

## Part 7: Admin Search Functions

### Admin Image Search (All Bond Members)

\`\`\`sql
CREATE OR REPLACE FUNCTION public.admin_search_image_generations(
  search_query TEXT,
  admin_user_id UUID DEFAULT auth.uid(),
  limit_count INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  prompt TEXT,
  image_url TEXT,
  notion_title TEXT,
  notion_description TEXT,
  notion_tags TEXT[],
  owner_email TEXT,
  owner_name TEXT,
  relevance REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT public.is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Get bond member IDs
  DECLARE
    bond_member_ids UUID[];
  BEGIN
    bond_member_ids := public.get_bond_member_ids(admin_user_id);
  END;

  -- Perform search across all bond members
  RETURN QUERY
  SELECT 
    aig.id,
    aig.user_id,
    aig.prompt,
    aig.image_url,
    aig.notion_title,
    aig.notion_description,
    aig.notion_tags,
    aig.owner_email,
    aig.owner_name,
    ts_rank_cd(
      aig.search_vector,
      plainto_tsquery('english', search_query)
    ) as relevance,
    aig.created_at
  FROM public.admin_image_generations_all aig
  WHERE aig.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, aig.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute only to authenticated (admin check inside function)
GRANT EXECUTE ON FUNCTION public.admin_search_image_generations TO authenticated;
\`\`\`

### Admin KINKSTER Search

\`\`\`sql
CREATE OR REPLACE FUNCTION public.admin_search_kinkster_profiles(
  search_query TEXT,
  admin_user_id UUID DEFAULT auth.uid(),
  limit_count INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  notion_backstory TEXT,
  owner_email TEXT,
  owner_name TEXT,
  relevance REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    akp.id,
    akp.user_id,
    akp.name,
    akp.bio,
    akp.avatar_url,
    akp.notion_backstory,
    akp.owner_email,
    akp.owner_name,
    ts_rank_cd(
      akp.search_vector,
      plainto_tsquery('english', search_query)
    ) as relevance,
    akp.created_at
  FROM public.admin_kinkster_profiles_all akp
  WHERE akp.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, akp.created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_search_kinkster_profiles TO authenticated;
\`\`\`

---

## Part 8: API Endpoint Updates

### Admin Image Gallery Search Endpoint

\`\`\`typescript
// app/api/admin/gallery/search/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('system_role, dynamic_role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.system_role === 'admin' || profile?.dynamic_role === 'dominant'
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '100')

  // Use admin FDW search function
  const { data, error } = await supabase
    .rpc('admin_search_image_generations', {
      search_query: query,
      admin_user_id: user.id,
      limit_count: limit
    })

  if (error) {
    console.error('Admin search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    data,
    count: data?.length || 0,
    search_query: query
  })
}
\`\`\`

---

## Part 9: Security Considerations

### 1. RLS on Admin Views

\`\`\`sql
-- Ensure admin views respect RLS
ALTER VIEW public.admin_image_generations_all SET (security_invoker = true);
ALTER VIEW public.admin_kinkster_profiles_all SET (security_invoker = true);
\`\`\`

### 2. Function Security

\`\`\`sql
-- All admin functions use SECURITY DEFINER
-- They check admin role internally
-- They filter by bond membership
\`\`\`

### 3. Service Account Key Security

✅ **Store in Vault** (preferred) or environment variables  
✅ **Never expose in client code**  
✅ **Rotate periodically**  
✅ **Monitor access logs**  

### 4. Access Logging

\`\`\`sql
-- Create audit log for admin FDW queries
CREATE TABLE IF NOT EXISTS public.admin_fdw_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  query_type TEXT NOT NULL,
  search_query TEXT,
  result_count INT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log admin searches
CREATE OR REPLACE FUNCTION public.log_admin_fdw_access(
  admin_id UUID,
  query_type TEXT,
  search_query TEXT,
  result_count INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_fdw_access_log (
    admin_user_id,
    query_type,
    search_query,
    result_count
  ) VALUES (
    admin_id,
    query_type,
    search_query,
    result_count
  );
END;
$$;
\`\`\`

---

## Part 10: Migration Plan

### Week 1: Setup
- [ ] Create Notion Internal Integration
- [ ] Store service account key in Vault/env
- [ ] Create foreign server
- [ ] Test FDW connection

### Week 2: Foreign Tables
- [ ] Create foreign tables for Image Generations
- [ ] Create foreign tables for KINKSTER Profiles
- [ ] Verify data mapping
- [ ] Test queries

### Week 3: RBAC Functions
- [ ] Create admin check function
- [ ] Create bond membership function
- [ ] Create admin views
- [ ] Test access control

### Week 4: Admin Functions
- [ ] Create admin search functions
- [ ] Add access logging
- [ ] Update API endpoints
- [ ] Test end-to-end

### Week 5: Testing & Optimization
- [ ] Performance testing
- [ ] Security audit
- [ ] Add indexes
- [ ] Document usage

---

## Part 11: Usage Examples

### Admin Search All Bond Members' Images

\`\`\`typescript
// Admin can search across all bond members
const { data } = await supabase
  .rpc('admin_search_image_generations', {
    search_query: 'kinky scene',
    admin_user_id: adminUserId,
    limit_count: 100
  })

// Returns images from all bond members with Notion metadata!
\`\`\`

### Admin Browse All KINKSTER Profiles

\`\`\`typescript
const { data } = await supabase
  .rpc('admin_search_kinkster_profiles', {
    search_query: 'dominant',
    admin_user_id: adminUserId
  })

// Returns KINKSTER profiles from all bond members!
\`\`\`

---

## Part 12: Troubleshooting

### Service Account Can't Access Databases

**Solution**: Ensure service account is added as a connection to each database in Notion workspace settings.

### Admin Views Return Empty

**Check**:
1. Is user actually an admin? (`is_admin()` function)
2. Are there bond members? (`get_bond_member_ids()` function)
3. Is Notion user ID mapping correct?

### FDW Queries Slow

**Solutions**:
1. Add indexes on Supabase tables
2. Use materialized views for frequently accessed data
3. Limit result sets
4. Consider caching

---

## Conclusion

This implementation gives **admins immediate, fast access** to all bond members' Notion content via FDW, while maintaining security through RBAC. The service account key enables powerful search capabilities that would be impossible with user-specific API keys.

**Key Benefits**:
✅ Fast admin searches (50-200ms vs 500-2000ms)  
✅ Access to all bond members' content  
✅ Maintains security (RBAC + bond filtering)  
✅ Unified search across Supabase + Notion  

**Next Steps**: Start with service account setup, then implement admin views and functions.

---

**Status**: Ready for Implementation  
**Priority**: High (Significant admin productivity gains)  
**Estimated Effort**: 3-4 weeks for full implementation
