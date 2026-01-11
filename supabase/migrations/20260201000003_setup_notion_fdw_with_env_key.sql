-- Migration: Setup Notion FDW using Production API Key from Environment
-- This migration sets up the FDW to use NOTION_API_KEY_PROD from environment variables
-- The API key will be passed when creating the foreign server via Edge Function/API
--
-- NOTE: This migration creates the structure. The actual API key configuration
-- happens via the setup API endpoint or Edge Function that has access to env vars.

-- Step 1: Ensure wrappers extension is installed
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- Step 2: Create Wasm Foreign Data Wrapper
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

-- Step 3: Create function to setup foreign server with API key
-- This function will be called by the setup API endpoint with the actual API key
CREATE OR REPLACE FUNCTION public.create_notion_fdw_server(api_key_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  server_exists BOOLEAN;
BEGIN
  -- Check if server already exists
  SELECT EXISTS (
    SELECT 1 FROM pg_foreign_server WHERE srvname = 'notion_service_account_server'
  ) INTO server_exists;

  IF server_exists THEN
    -- Update existing server
    EXECUTE format('
      ALTER SERVER notion_service_account_server
      OPTIONS (
        SET api_key %L
      )', api_key_value);
    RETURN 'Updated existing foreign server';
  ELSE
    -- Create new server
    EXECUTE format('
      CREATE SERVER notion_service_account_server
      FOREIGN DATA WRAPPER wasm_wrapper
      OPTIONS (
        fdw_package_url ''https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm'',
        fdw_package_name ''supabase:notion-fdw'',
        fdw_package_version ''0.1.1'',
        fdw_package_checksum ''6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de'',
        api_key %L
      )', api_key_value);
    RETURN 'Created new foreign server';
  END IF;
END;
$$;

-- Grant execute to service role (for API endpoint)
GRANT EXECUTE ON FUNCTION public.create_notion_fdw_server TO service_role;

-- Step 4: Create private schema for foreign tables
CREATE SCHEMA IF NOT EXISTS notion_fdw;

-- Step 5: Create function to setup foreign tables dynamically
-- This reads database IDs from notion_databases table
-- Drop existing function first if it exists (from previous migration)
DROP FUNCTION IF EXISTS public.setup_notion_fdw_tables();
CREATE OR REPLACE FUNCTION public.setup_notion_fdw_tables()
RETURNS TABLE (
  table_name TEXT,
  database_id TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  image_gen_db_id TEXT;
  kinkster_db_id TEXT;
  tasks_db_id TEXT;
  ideas_db_id TEXT;
BEGIN
  -- Get Image Generations database ID (template/global or admin-owned)
  -- For FDW, we want databases accessible to admins (template databases or admin's databases)
  SELECT nd.database_id INTO image_gen_db_id
  FROM notion_databases nd
  WHERE nd.database_type = 'image_generations'
  ORDER BY 
    CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = nd.user_id AND system_role = 'admin') THEN 0 ELSE 1 END,
    nd.created_at DESC
  LIMIT 1;

  -- Get KINKSTER Profiles database ID
  SELECT nd.database_id INTO kinkster_db_id
  FROM notion_databases nd
  WHERE nd.database_type = 'kinkster_profiles'
  ORDER BY 
    CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = nd.user_id AND system_role = 'admin') THEN 0 ELSE 1 END,
    nd.created_at DESC
  LIMIT 1;

  -- Get Tasks database ID (if exists)
  SELECT nd.database_id INTO tasks_db_id
  FROM notion_databases nd
  WHERE nd.database_type = 'tasks'
    AND (nd.user_id IS NULL OR nd.user_id = '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY nd.created_at DESC
  LIMIT 1;

  -- Get Ideas database ID (if exists)
  SELECT nd.database_id INTO ideas_db_id
  FROM notion_databases nd
  WHERE nd.database_type = 'ideas'
    AND (nd.user_id IS NULL OR nd.user_id = '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY nd.created_at DESC
  LIMIT 1;

  -- Create Image Generations foreign table
  IF image_gen_db_id IS NOT NULL THEN
    BEGIN
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

      table_name := 'image_generations_all';
      database_id := image_gen_db_id;
      status := 'created';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      table_name := 'image_generations_all';
      database_id := image_gen_db_id;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END IF;

  -- Create KINKSTER Profiles foreign table
  IF kinkster_db_id IS NOT NULL THEN
    BEGIN
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

      table_name := 'kinkster_profiles_all';
      database_id := kinkster_db_id;
      status := 'created';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      table_name := 'kinkster_profiles_all';
      database_id := kinkster_db_id;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END IF;

  -- Create Tasks foreign table (if database exists)
  IF tasks_db_id IS NOT NULL THEN
    BEGIN
      DROP FOREIGN TABLE IF EXISTS notion_fdw.tasks_all;
      
      EXECUTE format('
        CREATE FOREIGN TABLE notion_fdw.tasks_all (
          id TEXT,
          title TEXT,
          description TEXT,
          status TEXT,
          priority TEXT,
          due_date TIMESTAMPTZ,
          assigned_to TEXT,
          created_time TIMESTAMPTZ,
          last_edited_time TIMESTAMPTZ,
          notion_user_id TEXT,
          attrs JSONB
        )
        SERVER notion_service_account_server
        OPTIONS (
          object ''database'',
          database_id %L
        )', tasks_db_id);

      table_name := 'tasks_all';
      database_id := tasks_db_id;
      status := 'created';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      table_name := 'tasks_all';
      database_id := tasks_db_id;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END IF;

  -- Create Ideas foreign table (if database exists)
  IF ideas_db_id IS NOT NULL THEN
    BEGIN
      DROP FOREIGN TABLE IF EXISTS notion_fdw.ideas_all;
      
      EXECUTE format('
        CREATE FOREIGN TABLE notion_fdw.ideas_all (
          id TEXT,
          title TEXT,
          description TEXT,
          category TEXT,
          status TEXT,
          created_time TIMESTAMPTZ,
          last_edited_time TIMESTAMPTZ,
          notion_user_id TEXT,
          attrs JSONB
        )
        SERVER notion_service_account_server
        OPTIONS (
          object ''database'',
          database_id %L
        )', ideas_db_id);

      table_name := 'ideas_all';
      database_id := ideas_db_id;
      status := 'created';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      table_name := 'ideas_all';
      database_id := ideas_db_id;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END IF;

  -- Return summary
  IF image_gen_db_id IS NULL AND kinkster_db_id IS NULL THEN
    table_name := 'summary';
    database_id := 'none';
    status := 'No database IDs found in notion_databases table. Run Notion integration sync first.';
    RETURN NEXT;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_notion_fdw_tables TO authenticated, service_role;

-- Step 6: Helper function to check if user is admin (reuse from previous migration if exists)
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

-- Step 7: Helper function to get bond member IDs
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

-- Step 8: Admin views are created by create_admin_views() function from migration 20260201000002
-- Views will be created after foreign tables are set up via setup_notion_fdw_tables()
-- If create_admin_views() doesn't exist, create it here
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
        -- Search vector
        setweight(to_tsvector(''english'', coalesce(ig.prompt, '''')), ''A'') ||
        setweight(to_tsvector(''english'', coalesce(nig.title, '''')), ''B'') ||
        setweight(to_tsvector(''english'', coalesce(nig.description, '''')), ''C'') as search_vector
      FROM public.image_generations ig
      LEFT JOIN notion_fdw.image_generations_all nig ON ig.notion_page_id = nig.id
      LEFT JOIN profiles p ON ig.user_id = p.id
      WHERE 
        public.is_admin(auth.uid())
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

-- Step 9: Note: Views are created dynamically by create_admin_views() function above

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
  IF NOT public.is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

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

-- Step 11: Access log table
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

DROP POLICY IF EXISTS "Admins can view their own access logs" ON public.admin_fdw_access_log;
CREATE POLICY "Admins can view their own access logs"
ON public.admin_fdw_access_log FOR SELECT
TO authenticated
USING (admin_user_id = auth.uid() OR public.is_admin(auth.uid()));

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

-- Comments
COMMENT ON SCHEMA notion_fdw IS 'Private schema for Notion Foreign Data Wrapper tables. Not exposed via API.';
COMMENT ON FUNCTION public.create_notion_fdw_server IS 'Creates or updates Notion FDW foreign server with API key. Called by setup API endpoint.';
COMMENT ON FUNCTION public.setup_notion_fdw_tables IS 'Initializes Notion FDW foreign tables based on database IDs in notion_databases table.';
