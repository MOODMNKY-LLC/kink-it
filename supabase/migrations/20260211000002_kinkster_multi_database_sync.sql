-- =====================================================
-- MULTI-DATABASE KINKSTER SYNC ENHANCEMENT
-- Links users across Supabase, personal Notion, and master database
-- =====================================================

-- 1. Add fields to profiles for user's personal Notion KINKSTERS database
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notion_kinksters_database_id TEXT,
ADD COLUMN IF NOT EXISTS notion_workspace_id TEXT,
ADD COLUMN IF NOT EXISTS notion_access_token TEXT,
ADD COLUMN IF NOT EXISTS notion_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notion_connected_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.notion_kinksters_database_id IS 'ID of the KINKSTERS database in user''s personal Notion workspace';
COMMENT ON COLUMN public.profiles.notion_workspace_id IS 'User''s Notion workspace ID for API calls';

-- 2. Add fields to kinksters for multi-database tracking
ALTER TABLE public.kinksters
ADD COLUMN IF NOT EXISTS notion_database_id TEXT,
ADD COLUMN IF NOT EXISTS master_notion_page_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error', 'local_only')),
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS last_local_update TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_notion_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.kinksters.notion_database_id IS 'ID of the Notion database this kinkster syncs to (user''s personal KINKSTERS db)';
COMMENT ON COLUMN public.kinksters.master_notion_page_id IS 'Page ID in the master KINKSTERS database (for community/public kinksters)';
COMMENT ON COLUMN public.kinksters.sync_status IS 'Current sync state: synced, pending, conflict, error, local_only';
COMMENT ON COLUMN public.kinksters.is_public IS 'Whether this kinkster is shared to the master database for community features';

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_kinksters_sync_status ON public.kinksters(sync_status) WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_kinksters_notion_database ON public.kinksters(notion_database_id) WHERE notion_database_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kinksters_master_notion ON public.kinksters(master_notion_page_id) WHERE master_notion_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_notion_kinksters_db ON public.profiles(notion_kinksters_database_id) WHERE notion_kinksters_database_id IS NOT NULL;

-- 4. Sync helper functions
CREATE OR REPLACE FUNCTION public.get_user_notion_config(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config JSONB;
BEGIN
  SELECT jsonb_build_object(
    'notion_parent_page_id', notion_parent_page_id,
    'notion_kinksters_database_id', notion_kinksters_database_id,
    'notion_workspace_id', notion_workspace_id,
    'notion_connected', notion_connected_at IS NOT NULL,
    'notion_connected_at', notion_connected_at
  ) INTO config
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(config, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.save_user_notion_kinksters_db(
  p_database_id TEXT,
  p_workspace_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    notion_kinksters_database_id = p_database_id,
    notion_workspace_id = COALESCE(p_workspace_id, notion_workspace_id),
    notion_connected_at = COALESCE(notion_connected_at, NOW()),
    updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'database_id', p_database_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_kinkster_for_notion(p_kinkster_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  k RECORD;
  u RECORD;
BEGIN
  SELECT * INTO k FROM public.kinksters WHERE id = p_kinkster_id;
  IF NOT FOUND THEN RETURN '{"error": "Kinkster not found"}'::jsonb; END IF;
  
  SELECT notion_kinksters_database_id INTO u FROM public.profiles WHERE id = k.user_id;
  
  RETURN jsonb_build_object(
    'database_id', u.notion_kinksters_database_id,
    'kinkster_id', k.id,
    'properties', jsonb_build_object(
      'Name', k.name,
      'Display Name', COALESCE(k.display_name, k.name),
      'Role', COALESCE(k.role, 'switch'),
      'Pronouns', COALESCE(k.pronouns, 'They/Them'),
      'Bio', k.bio,
      'Body Type', k.body_type,
      'Height', k.height,
      'Build', k.build,
      'Hair Color', k.hair_color,
      'Hair Style', k.hair_style,
      'Eye Color', k.eye_color,
      'Skin Tone', k.skin_tone,
      'Facial Hair', k.facial_hair,
      'Age Range', k.age_range,
      'Aesthetic', k.aesthetic,
      'Experience Level', COALESCE(k.experience_level, 'intermediate'),
      'Is Primary', k.is_primary,
      'Is Active', k.is_active,
      'Supabase ID', k.id::text,
      'Personality Traits', COALESCE(k.personality_traits, '{}'),
      'Clothing Style', COALESCE(k.clothing_style, '{}'),
      'Favorite Colors', COALESCE(k.favorite_colors, '{}'),
      'Fetish Wear', COALESCE(k.fetish_wear, '{}'),
      'Top Kinks', COALESCE(k.top_kinks, '{}')
    ),
    'avatar_url', k.avatar_url,
    'gallery_urls', COALESCE(k.gallery_urls, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_kinkster_synced(
  p_kinkster_id UUID,
  p_notion_page_id TEXT,
  p_notion_database_id TEXT DEFAULT NULL,
  p_master_page_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.kinksters
  SET 
    notion_page_id = p_notion_page_id,
    notion_database_id = COALESCE(p_notion_database_id, notion_database_id),
    master_notion_page_id = COALESCE(p_master_page_id, master_notion_page_id),
    notion_last_synced_at = NOW(),
    sync_status = 'synced',
    sync_error = NULL,
    updated_at = NOW()
  WHERE id = p_kinkster_id AND user_id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'kinkster_id', p_kinkster_id, 'notion_page_id', p_notion_page_id, 'synced_at', NOW());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_kinksters_pending_sync(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (id UUID, name TEXT, sync_status TEXT, last_local_update TIMESTAMPTZ, notion_page_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.name, k.sync_status, k.last_local_update, k.notion_page_id
  FROM public.kinksters k
  WHERE k.user_id = p_user_id
  AND (k.sync_status IN ('pending', 'error') OR k.notion_page_id IS NULL OR k.last_local_update > COALESCE(k.notion_last_synced_at, '1970-01-01'::timestamptz))
  ORDER BY k.last_local_update DESC;
END;
$$;

-- 5. Auto-sync triggers
CREATE OR REPLACE FUNCTION public.trigger_kinkster_needs_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.name IS DISTINCT FROM NEW.name OR OLD.display_name IS DISTINCT FROM NEW.display_name OR
      OLD.role IS DISTINCT FROM NEW.role OR OLD.bio IS DISTINCT FROM NEW.bio OR
      OLD.avatar_url IS DISTINCT FROM NEW.avatar_url OR OLD.body_type IS DISTINCT FROM NEW.body_type OR
      OLD.personality_traits IS DISTINCT FROM NEW.personality_traits OR OLD.top_kinks IS DISTINCT FROM NEW.top_kinks) THEN
    NEW.sync_status := 'pending';
    NEW.last_local_update := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kinkster_needs_sync ON public.kinksters;
CREATE TRIGGER kinkster_needs_sync
  BEFORE UPDATE ON public.kinksters
  FOR EACH ROW WHEN (OLD.sync_status = 'synced')
  EXECUTE FUNCTION public.trigger_kinkster_needs_sync();

CREATE OR REPLACE FUNCTION public.trigger_kinkster_insert_pending()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.sync_status := 'pending';
  NEW.last_local_update := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kinkster_insert_pending ON public.kinksters;
CREATE TRIGGER kinkster_insert_pending
  BEFORE INSERT ON public.kinksters
  FOR EACH ROW EXECUTE FUNCTION public.trigger_kinkster_insert_pending();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_notion_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_user_notion_kinksters_db(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_kinkster_for_notion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_kinkster_synced(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kinksters_pending_sync(UUID) TO authenticated;
