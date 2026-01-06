# Notion FDW for Fast Search & Browsing Implementation Guide

**Date**: 2025-02-01  
**Author**: CODE MNKY  
**Purpose**: Implement Notion Foreign Data Wrapper for blazing-fast search across Supabase and Notion data

---

## Executive Summary

Your use case is **perfect** for the Notion FDW! You're frequently joining Supabase data (image generations, KINKSTER profiles) with Notion data for search and browsing. The FDW will enable **native SQL joins** instead of multiple API calls, resulting in **10-100x faster searches**.

### Key Benefits

✅ **Single SQL Query**: Join Supabase + Notion data in one query  
✅ **Native Performance**: Postgres query optimizer handles joins efficiently  
✅ **Full-Text Search**: Use Postgres full-text search across both sources  
✅ **Complex Queries**: Aggregations, filters, sorting all in SQL  
✅ **Reduced Latency**: No API roundtrips, direct database queries  

---

## Current Architecture vs. FDW Architecture

### Current Approach (Slow)

```typescript
// 1. Query Supabase
const images = await supabase
  .from('image_generations')
  .select('*')
  .eq('user_id', userId)

// 2. Query Notion for each image (N+1 problem!)
for (const image of images) {
  const notionData = await notionClient.pages.retrieve({
    page_id: image.notion_page_id
  })
  // Join in code...
}

// 3. Search across both sources
const results = images.filter(img => 
  img.prompt.includes(searchTerm) || 
  notionData[img.id]?.title.includes(searchTerm)
)
```

**Problems**:
- ❌ Multiple API calls (N+1 queries)
- ❌ Slow (network latency × number of images)
- ❌ Complex code (manual joins)
- ❌ No native full-text search

### FDW Approach (Fast)

```sql
-- Single query joining both sources!
SELECT 
  ig.id,
  ig.user_id,
  ig.prompt,
  ig.image_url,
  nig.title as notion_title,
  nig.description as notion_description,
  nig.tags as notion_tags,
  -- Full-text search across both sources
  ts_rank_cd(
    to_tsvector('english', ig.prompt || ' ' || nig.title || ' ' || nig.description),
    plainto_tsquery('english', $1)
  ) as relevance
FROM image_generations ig
JOIN notion_image_generations nig ON ig.notion_page_id = nig.id
WHERE ig.user_id = $1
  AND (
    ig.prompt ILIKE '%' || $1 || '%' OR
    nig.title ILIKE '%' || $1 || '%' OR
    nig.description ILIKE '%' || $1 || '%'
  )
ORDER BY relevance DESC, ig.created_at DESC
LIMIT 50;
```

**Benefits**:
- ✅ Single query (no N+1)
- ✅ Fast (native Postgres joins)
- ✅ Simple (SQL only)
- ✅ Native full-text search

---

## Implementation Strategy

### Phase 1: Setup FDW with Service Account

**Prerequisites**:
- Notion team workspace (or shared workspace)
- Service account API key with access to all user databases
- Or: Single workspace where all users' databases are accessible

**Step 1: Enable Wrappers Extension**

```sql
-- Already installed, but verify
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;
```

**Step 2: Create Foreign Data Wrapper**

```sql
-- Enable Wasm wrapper
CREATE FOREIGN DATA WRAPPER IF NOT EXISTS wasm_wrapper
HANDLER extensions.wasm_fdw_handler
VALIDATOR extensions.wasm_fdw_validator;
```

**Step 3: Store API Key in Vault (Secure)**

```sql
-- Store service account Notion API key in Vault
INSERT INTO vault.secrets (name, secret)
VALUES (
  'notion_fdw_api_key',
  'ntn_your_service_account_key_here'
)
RETURNING id;
-- Note the returned ID for next step
```

**Step 4: Create Foreign Server**

```sql
-- Create foreign server using Vault key
CREATE SERVER notion_server
FOREIGN DATA WRAPPER wasm_wrapper
OPTIONS (
  fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm',
  fdw_package_name 'supabase:notion-fdw',
  fdw_package_version '0.1.1',
  fdw_package_checksum '6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de',
  api_key_id '<vault_key_id_from_step_3>'
);
```

---

## Phase 2: Create Foreign Tables

### Image Generations Foreign Table

```sql
-- Create schema for foreign tables (private, not exposed via API)
CREATE SCHEMA IF NOT EXISTS notion_fdw;

-- Foreign table for Image Generations database
CREATE FOREIGN TABLE notion_fdw.image_generations (
  id TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  supabase_url TEXT,
  prompt TEXT,
  model TEXT,
  created_time TIMESTAMPTZ,
  last_edited_time TIMESTAMPTZ,
  user_id TEXT, -- Notion user ID or workspace identifier
  attrs JSONB -- All other properties as JSON
)
SERVER notion_server
OPTIONS (
  object 'database', -- Notion object type
  database_id 'your-image-generations-database-id'
);
```

### KINKSTER Profiles Foreign Table

```sql
CREATE FOREIGN TABLE notion_fdw.kinkster_profiles (
  id TEXT,
  name TEXT,
  bio TEXT,
  personality_traits TEXT[],
  backstory TEXT,
  supabase_url TEXT,
  created_time TIMESTAMPTZ,
  last_edited_time TIMESTAMPTZ,
  user_id TEXT,
  attrs JSONB
)
SERVER notion_server
OPTIONS (
  object 'database',
  database_id 'your-kinkster-profiles-database-id'
);
```

---

## Phase 3: Create Secure Views with RLS

### Image Generations View (User-Filtered)

```sql
-- Create view that joins Supabase + Notion with user filtering
CREATE OR REPLACE VIEW public.image_generations_with_notion AS
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
  -- Combined search vector for full-text search
  setweight(to_tsvector('english', coalesce(ig.prompt, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(nig.title, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(nig.description, '')), 'C') as search_vector
FROM public.image_generations ig
LEFT JOIN notion_fdw.image_generations nig ON ig.notion_page_id = nig.id
WHERE ig.user_id = auth.uid(); -- RLS: users only see their own data

-- Enable RLS on view (inherits from base table)
ALTER VIEW public.image_generations_with_notion SET (security_invoker = true);
```

### KINKSTER Profiles View

```sql
CREATE OR REPLACE VIEW public.kinkster_profiles_with_notion AS
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
  -- Search vector
  setweight(to_tsvector('english', coalesce(k.name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(k.bio, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(nkp.backstory, '')), 'C') as search_vector
FROM public.kinksters k
LEFT JOIN notion_fdw.kinkster_profiles nkp ON k.notion_page_id = nkp.id
WHERE k.user_id = auth.uid();

ALTER VIEW public.kinkster_profiles_with_notion SET (security_invoker = true);
```

---

## Phase 4: Create Search Functions

### Unified Image Search Function

```sql
CREATE OR REPLACE FUNCTION public.search_image_generations(
  search_query TEXT,
  user_filter UUID DEFAULT auth.uid(),
  limit_count INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  prompt TEXT,
  image_url TEXT,
  notion_title TEXT,
  notion_description TEXT,
  notion_tags TEXT[],
  relevance REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ig.id,
    ig.user_id,
    ig.prompt,
    ig.image_url,
    ign.notion_title,
    ign.notion_description,
    ign.notion_tags,
    ts_rank_cd(
      ign.search_vector,
      plainto_tsquery('english', search_query)
    ) as relevance,
    ig.created_at
  FROM public.image_generations_with_notion ign
  JOIN public.image_generations ig ON ign.id = ig.id
  WHERE ign.user_id = user_filter
    AND ign.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, ig.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.search_image_generations TO authenticated;
```

### KINKSTER Profile Search Function

```sql
CREATE OR REPLACE FUNCTION public.search_kinkster_profiles(
  search_query TEXT,
  user_filter UUID DEFAULT auth.uid(),
  limit_count INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  notion_backstory TEXT,
  relevance REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.user_id,
    k.name,
    k.bio,
    k.avatar_url,
    kpn.notion_backstory,
    ts_rank_cd(
      kpn.search_vector,
      plainto_tsquery('english', search_query)
    ) as relevance,
    k.created_at
  FROM public.kinkster_profiles_with_notion kpn
  JOIN public.kinksters k ON kpn.id = k.id
  WHERE kpn.user_id = user_filter
    AND kpn.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, k.created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_kinkster_profiles TO authenticated;
```

---

## Phase 5: Update API Endpoints

### Image Gallery Search Endpoint

```typescript
// app/api/gallery/search/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '50')

  // Use FDW-powered search function
  const { data, error } = await supabase
    .rpc('search_image_generations', {
      search_query: query,
      user_filter: user.id,
      limit_count: limit
    })

  if (error) {
    console.error('Search error:', error)
    // Fallback to Supabase-only search if FDW fails
    const { data: fallbackData } = await supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', user.id)
      .ilike('prompt', `%${query}%`)
      .limit(limit)
    
    return NextResponse.json({ data: fallbackData })
  }

  return NextResponse.json({ data })
}
```

### KINKSTER Browse Endpoint

```typescript
// app/api/kinksters/browse/route.ts
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '50')

  const { data, error } = await supabase
    .rpc('search_kinkster_profiles', {
      search_query: query,
      user_filter: user.id,
      limit_count: limit
    })

  if (error) {
    // Fallback logic...
  }

  return NextResponse.json({ data })
}
```

---

## Phase 6: Performance Optimizations

### Create Indexes on Supabase Tables

```sql
-- Index for fast user filtering
CREATE INDEX IF NOT EXISTS idx_image_generations_user_created 
ON image_generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kinksters_user_created 
ON kinksters(user_id, created_at DESC);

-- GIN index for full-text search (if storing search_vector)
CREATE INDEX IF NOT EXISTS idx_image_generations_search_vector 
ON image_generations USING GIN(search_vector);
```

### Materialized View for Frequently Accessed Data

```sql
-- Cache frequently accessed joined data
CREATE MATERIALIZED VIEW public.image_generations_notion_cache AS
SELECT 
  ig.*,
  nig.title as notion_title,
  nig.description as notion_description,
  nig.tags as notion_tags
FROM public.image_generations ig
LEFT JOIN notion_fdw.image_generations nig ON ig.notion_page_id = nig.id;

-- Refresh cache periodically (every 5 minutes)
SELECT cron.schedule(
  'refresh-image-generations-cache',
  '*/5 * * * *', -- Every 5 minutes
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.image_generations_notion_cache;'
);
```

---

## Phase 7: Error Handling & Fallbacks

### Robust Search Function with Fallback

```sql
CREATE OR REPLACE FUNCTION public.search_image_generations_safe(
  search_query TEXT,
  user_filter UUID DEFAULT auth.uid(),
  limit_count INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  image_url TEXT,
  source TEXT -- 'fdw' or 'supabase_only'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fdw_error BOOLEAN := FALSE;
BEGIN
  -- Try FDW search first
  BEGIN
    RETURN QUERY
    SELECT 
      ig.id,
      ig.prompt,
      ig.image_url,
      'fdw'::TEXT as source
    FROM public.image_generations_with_notion ign
    JOIN public.image_generations ig ON ign.id = ig.id
    WHERE ign.user_id = user_filter
      AND ign.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_cd(ign.search_vector, plainto_tsquery('english', search_query)) DESC
    LIMIT limit_count;
    
    -- If we got results, return them
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- FDW failed, mark for fallback
    fdw_error := TRUE;
  END;

  -- Fallback to Supabase-only search
  RETURN QUERY
  SELECT 
    ig.id,
    ig.prompt,
    ig.image_url,
    'supabase_only'::TEXT as source
  FROM public.image_generations ig
  WHERE ig.user_id = user_filter
    AND ig.prompt ILIKE '%' || search_query || '%'
  ORDER BY ig.created_at DESC
  LIMIT limit_count;
END;
$$;
```

---

## Use Cases & Examples

### Use Case 1: Image Gallery Search

**Before (Slow)**:
```typescript
// Multiple API calls
const images = await supabase.from('image_generations').select('*')
for (const img of images) {
  const notion = await notionClient.pages.retrieve({ page_id: img.notion_page_id })
  // Join manually...
}
```

**After (Fast)**:
```typescript
// Single SQL query
const { data } = await supabase
  .rpc('search_image_generations', {
    search_query: 'kinky scene',
    user_filter: userId,
    limit_count: 50
  })
// Results include both Supabase and Notion data!
```

### Use Case 2: KINKSTER Profile Browse

**Before**:
```typescript
const kinksters = await supabase.from('kinksters').select('*')
// Then fetch Notion details separately...
```

**After**:
```typescript
const { data } = await supabase
  .rpc('search_kinkster_profiles', {
    search_query: 'dominant',
    user_filter: userId
  })
// Full data from both sources!
```

### Use Case 3: Cross-Platform Analytics

```sql
-- Analytics query joining Supabase usage with Notion content
SELECT 
  DATE_TRUNC('day', ig.created_at) as date,
  COUNT(*) as total_generations,
  COUNT(nig.id) as synced_to_notion,
  AVG(LENGTH(nig.description)) as avg_notion_description_length
FROM image_generations ig
LEFT JOIN notion_fdw.image_generations nig ON ig.notion_page_id = nig.id
WHERE ig.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', ig.created_at)
ORDER BY date DESC;
```

---

## Security Considerations

### 1. RLS on Views

```sql
-- Ensure views respect RLS
ALTER VIEW public.image_generations_with_notion SET (security_invoker = true);
```

### 2. User Filtering in Functions

```sql
-- Always filter by user_id
WHERE ig.user_id = auth.uid() -- or passed parameter
```

### 3. Private Schema for Foreign Tables

```sql
-- Keep foreign tables in private schema
CREATE SCHEMA notion_fdw; -- Not exposed via API
```

### 4. Grant Permissions Carefully

```sql
-- Only grant execute on functions, not direct access to foreign tables
GRANT EXECUTE ON FUNCTION public.search_image_generations TO authenticated;
-- Do NOT grant SELECT on notion_fdw.*
```

---

## Migration Checklist

### Week 1: Setup
- [ ] Enable Wrappers extension
- [ ] Create service account Notion API key
- [ ] Store key in Vault
- [ ] Create foreign server
- [ ] Test connection

### Week 2: Foreign Tables
- [ ] Create foreign tables for Image Generations
- [ ] Create foreign tables for KINKSTER Profiles
- [ ] Test queries on foreign tables
- [ ] Verify data mapping

### Week 3: Views & Functions
- [ ] Create secure views with RLS
- [ ] Create search functions
- [ ] Test search performance
- [ ] Add error handling

### Week 4: Integration
- [ ] Update API endpoints
- [ ] Add fallback logic
- [ ] Performance testing
- [ ] Monitor query times

### Week 5: Optimization
- [ ] Create indexes
- [ ] Set up materialized views (if needed)
- [ ] Configure cache refresh
- [ ] Document usage

---

## Performance Expectations

### Before FDW
- Image search: **500-2000ms** (multiple API calls)
- KINKSTER browse: **300-1000ms** (N+1 queries)
- Cross-platform search: **1000-3000ms** (sequential API calls)

### After FDW
- Image search: **50-200ms** (single SQL query)
- KINKSTER browse: **30-150ms** (native join)
- Cross-platform search: **100-300ms** (optimized SQL)

**Expected Improvement**: **5-10x faster** for typical queries!

---

## Troubleshooting

### FDW Query Fails

**Symptom**: Foreign table queries return errors

**Solutions**:
1. Check API key is valid and has access
2. Verify database IDs are correct
3. Check Notion API rate limits
4. Use fallback to Supabase-only search

### Slow Queries

**Symptom**: FDW queries are slower than expected

**Solutions**:
1. Add indexes on Supabase tables
2. Use materialized views for frequently accessed data
3. Limit result sets appropriately
4. Consider caching strategies

### User Data Privacy

**Symptom**: Users seeing other users' data

**Solutions**:
1. Verify RLS is enabled on views
2. Check user filtering in functions
3. Test with different user accounts
4. Audit foreign table access

---

## Conclusion

The Notion FDW is **perfect** for your use case! It will enable:

✅ **Blazing-fast search** across Supabase + Notion  
✅ **Unified browsing** of image galleries and KINKSTER profiles  
✅ **Complex analytics** joining both data sources  
✅ **Simplified code** (SQL instead of API orchestration)  

**Recommendation**: Implement in phases, starting with Image Generations search, then expanding to KINKSTER profiles and other use cases.

---

**Status**: Ready for Implementation  
**Priority**: High (Significant performance gains)  
**Estimated Effort**: 2-3 weeks for full implementation


