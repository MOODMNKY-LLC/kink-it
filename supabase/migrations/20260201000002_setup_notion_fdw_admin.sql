-- Migration: Setup Notion FDW with Service Account Key for Admin Access
-- This enables admins to query all bond members' Notion content via fast SQL joins
--
-- Prerequisites:
-- 1. Store NOTION_API_KEY_PROD in Vault:
--    INSERT INTO vault.secrets (name, secret)
--    VALUES ('notion_service_account_api_key', 'your_notion_api_key_here')
--    RETURNING id;
-- 2. Note the returned ID for use in foreign server options
--
-- Or use environment variable directly (less secure, but simpler):
-- The API key will be passed via Edge Function/API when creating the server

-- Step 1: Ensure wrappers extension is installed
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- Step 2: Create Wasm Foreign Data Wrapper (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_foreign_data_wrapper WHERE fdwname = 'wasm_wrapper'
  ) THEN
    CREATE FOREIGN DATA WRAPPER wasm_wrapper
    HANDLER extensions.wasm_fdw_handler
    VALIDATOR extensions.wasm_fdw_validator;
  END IF;
END $$;

-- Step 3: Create Foreign Server
-- NOTE: Replace '<vault_key_id>' with the ID from Vault INSERT above
-- OR use api_key directly if storing in env (less secure)
-- The API key should be retrieved from environment variable NOTION_API_KEY_PROD
-- For now, we'll create a placeholder that needs to be updated with actual key

DO $$
DECLARE
  vault_key_id TEXT;
BEGIN
  -- Try to find existing vault secret
  SELECT id::TEXT INTO vault_key_id
  FROM vault.secrets
  WHERE name = 'notion_service_account_api_key'
  LIMIT 1;

  -- If no vault key exists, we'll need to create server with direct api_key
  -- This should be done via Edge Function that has access to env vars
  IF vault_key_id IS NULL THEN
    RAISE NOTICE 'Vault key not found. Server will be created via Edge Function with env variable.';
    -- Server creation will happen via API/Edge Function
  ELSE
    -- Create server with Vault key
    IF NOT EXISTS (
      SELECT 1 FROM pg_foreign_server WHERE srvname = 'notion_service_account_server'
    ) THEN
      EXECUTE format('
        CREATE SERVER notion_service_account_server
        FOREIGN DATA WRAPPER wasm_wrapper
        OPTIONS (
          fdw_package_url ''https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm'',
          fdw_package_name ''supabase:notion-fdw'',
          fdw_package_version ''0.1.1'',
          fdw_package_checksum ''6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de'',
          api_key_id %L
        )', vault_key_id);
    END IF;
  END IF;
END $$;

-- Step 4: Create private schema for foreign tables (not exposed via API)
CREATE SCHEMA IF NOT EXISTS notion_fdw;

-- Step 5: Create Foreign Tables
-- These will be created dynamically based on actual database IDs from notion_databases table
-- For now, we create placeholder tables that need database_id configuration

-- Foreign table for Image Generations database
-- NOTE: database_id needs to be set based on actual Notion database ID
-- This will be configured via a function that reads from notion_databases table

CREATE OR REPLACE FUNCTION public.setup_notion_fdw_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  image_gen_db_id TEXT;
  kinkster_db_id TEXT;
BEGIN
  -- Get Image Generations database ID
  SELECT database_id INTO image_gen_db_id
  FROM notion_databases
  WHERE database_type = 'image_generations'
    AND user_id IS NULL -- Template/global database
  LIMIT 1;

  -- Get KINKSTER Profiles database ID
  SELECT database_id INTO kinkster_db_id
  FROM notion_databases
  WHERE database_type = 'kinkster_profiles'
    AND user_id IS NULL -- Template/global database
  LIMIT 1;

  -- Create Image Generations foreign table if database ID found
  IF image_gen_db_id IS NOT NULL THEN
    -- Drop existing if exists
    DROP FOREIGN TABLE IF EXISTS notion_fdw.image_generations_all;

    EXECUTE format('
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
        notion_user_id TEXT,
        attrs JSONB
      )
      SERVER notion_service_account_server
      OPTIONS (
        object ''database'',
        database_id %L
      )', image_gen_db_id);

    RAISE NOTICE 'Created foreign table for Image Generations: %', image_gen_db_id;
  ELSE
    RAISE NOTICE 'Image Generations database ID not found in notion_databases';
  END IF;

  -- Create KINKSTER Profiles foreign table if database ID found
  IF kinkster_db_id IS NOT NULL THEN
    -- Drop existing if exists
    DROP FOREIGN TABLE IF EXISTS notion_fdw.kinkster_profiles_all;

    EXECUTE format('
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
        object ''database'',
        database_id %L
      )', kinkster_db_id);

    RAISE NOTICE 'Created foreign table for KINKSTER Profiles: %', kinkster_db_id;
  ELSE
    RAISE NOTICE 'KINKSTER Profiles database ID not found in notion_databases';
  END IF;
END;
$$;

-- Step 6: Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
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

-- Step 7: Helper function to get bond member IDs for admin
CREATE OR REPLACE FUNCTION public.get_bond_member_ids(admin_user_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
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
  AND bm.is_active = true;
  
  -- Include admin themselves
  IF member_ids IS NULL THEN
    member_ids := ARRAY[admin_user_id];
  ELSE
    member_ids := member_ids || admin_user_id;
  END IF;
  
  RETURN COALESCE(member_ids, ARRAY[admin_user_id]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bond_member_ids TO authenticated;

-- Step 8: Admin Image Generations View (all bond members)
-- Note: This view will only work after setup_notion_fdw_tables() is called
-- and foreign tables are created. The view creation is deferred to avoid
-- errors during migration if foreign tables don't exist yet.
CREATE OR REPLACE FUNCTION public.create_admin_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create view if foreign table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'notion_fdw' 
    AND table_name = 'image_generations_all'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW public.admin_image_generations_all AS
      SELECT 
        ig.id,
        ig.user_id,
        ig.prompt,
        ig.image_url,
        ig.created_at,
        ig.updated_at,
        ig.notion_page_id,
        -- Notion data
        nig.title as notion_title,
        nig.description as notion_description,
        nig.tags as notion_tags,
        nig.created_time as notion_created_time,
        -- Owner info
        p.email as owner_email,
        p.display_name as owner_name,
        -- Search vector for full-text search
        setweight(to_tsvector(''english'', coalesce(ig.prompt, '''')), ''A'') ||
        setweight(to_tsvector(''english'', coalesce(nig.title, '''')), ''B'') ||
        setweight(to_tsvector(''english'', coalesce(nig.description, '''')), ''C'') as search_vector
      FROM public.image_generations ig
      LEFT JOIN notion_fdw.image_generations_all nig ON ig.notion_page_id = nig.id
      LEFT JOIN profiles p ON ig.user_id = p.id
      WHERE 
        -- Only accessible to admins
        public.is_admin(auth.uid())
        -- And only show bond members'' data
        AND ig.user_id = ANY(public.get_bond_member_ids(auth.uid()))
    ';
    
    EXECUTE 'ALTER VIEW public.admin_image_generations_all SET (security_invoker = true)';
    EXECUTE 'GRANT SELECT ON public.admin_image_generations_all TO authenticated';
  END IF;
  
  -- Create KINKSTER profiles view if foreign table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'notion_fdw' 
    AND table_name = 'kinkster_profiles_all'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW public.admin_kinkster_profiles_all AS
      SELECT 
        k.id,
        k.user_id,
        k.name,
        k.bio,
        k.avatar_url,
        k.created_at,
        k.notion_page_id,
        -- Notion data
        nkp.personality_traits as notion_personality_traits,
        nkp.backstory as notion_backstory,
        nkp.created_time as notion_created_time,
        -- Owner info
        p.email as owner_email,
        p.display_name as owner_name,
        -- Search vector
        setweight(to_tsvector(''english'', coalesce(k.name, '''')), ''A'') ||
        setweight(to_tsvector(''english'', coalesce(k.bio, '''')), ''B'') ||
        setweight(to_tsvector(''english'', coalesce(nkp.backstory, '''')), ''C'') as search_vector
      FROM public.kinksters k
      LEFT JOIN notion_fdw.kinkster_profiles_all nkp ON k.notion_page_id = nkp.id
      LEFT JOIN profiles p ON k.user_id = p.id
      WHERE 
        public.is_admin(auth.uid())
        AND k.user_id = ANY(public.get_bond_member_ids(auth.uid()))
    ';
    
    EXECUTE 'ALTER VIEW public.admin_kinkster_profiles_all SET (security_invoker = true)';
    EXECUTE 'GRANT SELECT ON public.admin_kinkster_profiles_all TO authenticated';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_views TO authenticated;

-- Step 9: Admin views are created by create_admin_views() function above
-- This allows views to be created after foreign tables are set up

-- Step 10: Admin Search Functions
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

GRANT EXECUTE ON FUNCTION public.admin_search_image_generations TO authenticated;

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

-- Step 11: Note: setup_notion_fdw_tables() function is defined in migration 20260201000003
-- This migration only sets up the infrastructure (server, schema, helper functions, views)
-- The actual foreign table creation function is in the next migration

-- Step 12: Create access log table for admin FDW queries
CREATE TABLE IF NOT EXISTS public.admin_fdw_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  query_type TEXT NOT NULL,
  search_query TEXT,
  result_count INT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_fdw_access_log_admin_user 
ON public.admin_fdw_access_log(admin_user_id, accessed_at DESC);

ALTER TABLE public.admin_fdw_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own access logs"
ON public.admin_fdw_access_log FOR SELECT
TO authenticated
USING (admin_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Helper function to log admin FDW access
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

GRANT EXECUTE ON FUNCTION public.log_admin_fdw_access TO authenticated;

-- Comments for documentation
COMMENT ON SCHEMA notion_fdw IS 'Private schema for Notion Foreign Data Wrapper tables. Not exposed via API.';
-- Note: Foreign table and view comments are added dynamically when objects are created
-- via setup_notion_fdw_tables() and create_admin_views() functions

