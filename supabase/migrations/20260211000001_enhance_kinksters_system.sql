-- =====================================================
-- KINKSTERS SYSTEM ENHANCEMENT MIGRATION
-- Adds missing columns, functions, storage, and Notion sync
-- Created: 2026-02-11
-- =====================================================

-- Add missing columns to kinksters table
ALTER TABLE public.kinksters 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'switch',
ADD COLUMN IF NOT EXISTS pronouns TEXT DEFAULT 'They/Them',
ADD COLUMN IF NOT EXISTS avatar_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS generation_prompt TEXT,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS build TEXT,
ADD COLUMN IF NOT EXISTS hair_color TEXT,
ADD COLUMN IF NOT EXISTS hair_style TEXT,
ADD COLUMN IF NOT EXISTS eye_color TEXT,
ADD COLUMN IF NOT EXISTS skin_tone TEXT,
ADD COLUMN IF NOT EXISTS facial_hair TEXT,
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS clothing_style TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_colors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fetish_wear TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aesthetic TEXT,
ADD COLUMN IF NOT EXISTS top_kinks TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS partnership_id UUID,
ADD COLUMN IF NOT EXISTS notion_page_id TEXT,
ADD COLUMN IF NOT EXISTS notion_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kinksters_notion_page_id ON public.kinksters(notion_page_id) WHERE notion_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kinksters_partnership_id ON public.kinksters(partnership_id) WHERE partnership_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kinksters_role ON public.kinksters(role);
CREATE INDEX IF NOT EXISTS idx_kinksters_user_primary ON public.kinksters(user_id, is_primary) WHERE is_primary = true;

-- Storage bucket for kinkster galleries
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kinkster-gallery',
  'kinkster-gallery',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own kinkster avatars" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kinkster-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own kinkster avatars" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kinkster-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own kinkster avatars" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kinkster-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view kinkster avatars" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kinkster-avatars');

CREATE POLICY "Users can upload to their kinkster gallery" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kinkster-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their kinkster gallery" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kinkster-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete from their kinkster gallery" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kinkster-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view kinkster gallery" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kinkster-gallery');

-- Function: Build avatar generation prompt
CREATE OR REPLACE FUNCTION public.build_kinkster_avatar_prompt(kinkster_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  k RECORD;
  prompt TEXT;
BEGIN
  SELECT * INTO k FROM public.kinksters WHERE id = kinkster_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  
  prompt := 'Portrait of a ';
  IF k.age_range IS NOT NULL THEN prompt := prompt || k.age_range || ' '; END IF;
  IF k.build IS NOT NULL THEN prompt := prompt || k.build || ' build ';
  ELSIF k.body_type IS NOT NULL THEN prompt := prompt || k.body_type || ' '; END IF;
  prompt := prompt || 'person';
  IF k.height IS NOT NULL THEN prompt := prompt || ', ' || k.height; END IF;
  IF k.skin_tone IS NOT NULL THEN prompt := prompt || ', ' || k.skin_tone || ' skin'; END IF;
  IF k.hair_color IS NOT NULL OR k.hair_style IS NOT NULL THEN
    prompt := prompt || ', ';
    IF k.hair_color IS NOT NULL THEN prompt := prompt || k.hair_color || ' '; END IF;
    IF k.hair_style IS NOT NULL THEN prompt := prompt || k.hair_style || ' '; END IF;
    prompt := prompt || 'hair';
  END IF;
  IF k.eye_color IS NOT NULL THEN prompt := prompt || ', ' || k.eye_color || ' eyes'; END IF;
  IF k.facial_hair IS NOT NULL AND k.facial_hair != 'None' THEN prompt := prompt || ', ' || k.facial_hair; END IF;
  IF k.aesthetic IS NOT NULL THEN prompt := prompt || ', ' || k.aesthetic || ' aesthetic'; END IF;
  IF k.clothing_style IS NOT NULL AND array_length(k.clothing_style, 1) > 0 THEN
    prompt := prompt || ', wearing ' || k.clothing_style[1] || ' style clothing';
  END IF;
  
  RETURN prompt;
END;
$$;

-- Function: Add image to gallery
CREATE OR REPLACE FUNCTION public.add_to_kinkster_gallery(
  p_kinkster_id UUID,
  p_image_url TEXT,
  p_set_as_primary BOOLEAN DEFAULT false
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_gallery JSONB;
  result JSONB;
BEGIN
  SELECT COALESCE(gallery_urls, '[]'::jsonb) INTO current_gallery FROM public.kinksters WHERE id = p_kinkster_id;
  current_gallery := current_gallery || to_jsonb(p_image_url);
  
  IF p_set_as_primary THEN
    UPDATE public.kinksters SET 
      gallery_urls = current_gallery, avatar_url = p_image_url,
      avatar_urls = COALESCE(avatar_urls, '[]'::jsonb) || to_jsonb(p_image_url), updated_at = NOW()
    WHERE id = p_kinkster_id
    RETURNING jsonb_build_object('success', true, 'gallery_count', jsonb_array_length(gallery_urls), 'avatar_url', avatar_url) INTO result;
  ELSE
    UPDATE public.kinksters SET 
      gallery_urls = current_gallery,
      avatar_urls = COALESCE(avatar_urls, '[]'::jsonb) || to_jsonb(p_image_url), updated_at = NOW()
    WHERE id = p_kinkster_id
    RETURNING jsonb_build_object('success', true, 'gallery_count', jsonb_array_length(gallery_urls), 'avatar_url', avatar_url) INTO result;
  END IF;
  
  RETURN COALESCE(result, '{"success": false}'::jsonb);
END;
$$;

-- Function: Get kinkster for Notion sync
CREATE OR REPLACE FUNCTION public.get_kinkster_for_notion_sync(p_kinkster_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  k RECORD;
BEGIN
  SELECT * INTO k FROM public.kinksters WHERE id = p_kinkster_id;
  IF NOT FOUND THEN RETURN '{"error": "Kinkster not found"}'::jsonb; END IF;
  
  RETURN jsonb_build_object(
    'id', k.id, 'name', k.name, 'display_name', COALESCE(k.display_name, k.name),
    'role', COALESCE(k.role, 'switch'), 'pronouns', COALESCE(k.pronouns, 'They/Them'),
    'bio', k.bio, 'avatar_url', k.avatar_url, 'gallery_urls', COALESCE(k.gallery_urls, '[]'::jsonb),
    'body_type', k.body_type, 'height', k.height, 'build', k.build,
    'hair_color', k.hair_color, 'hair_style', k.hair_style, 'eye_color', k.eye_color,
    'skin_tone', k.skin_tone, 'facial_hair', k.facial_hair, 'age_range', k.age_range,
    'clothing_style', COALESCE(k.clothing_style, '{}'), 'favorite_colors', COALESCE(k.favorite_colors, '{}'),
    'fetish_wear', COALESCE(k.fetish_wear, '{}'), 'aesthetic', k.aesthetic,
    'personality_traits', COALESCE(k.personality_traits, '{}'), 'top_kinks', COALESCE(k.top_kinks, '{}'),
    'soft_limits', COALESCE(k.soft_limits, '{}'), 'hard_limits', COALESCE(k.hard_limits, '{}'),
    'experience_level', COALESCE(k.experience_level, 'intermediate'),
    'is_primary', k.is_primary, 'is_active', k.is_active,
    'generation_prompt', COALESCE(k.generation_prompt, public.build_kinkster_avatar_prompt(k.id)),
    'notion_page_id', k.notion_page_id, 'created_at', k.created_at, 'updated_at', k.updated_at
  );
END;
$$;

-- Function: Sync from Notion
CREATE OR REPLACE FUNCTION public.sync_kinkster_from_notion(p_kinkster_id UUID, p_notion_page_id TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.kinksters SET
    notion_page_id = p_notion_page_id, notion_last_synced_at = NOW(),
    display_name = COALESCE(p_data->>'display_name', display_name),
    role = COALESCE(p_data->>'role', role),
    pronouns = COALESCE(p_data->>'pronouns', pronouns),
    bio = COALESCE(p_data->>'bio', bio),
    body_type = COALESCE(p_data->>'body_type', body_type),
    height = COALESCE(p_data->>'height', height),
    build = COALESCE(p_data->>'build', build),
    hair_color = COALESCE(p_data->>'hair_color', hair_color),
    hair_style = COALESCE(p_data->>'hair_style', hair_style),
    eye_color = COALESCE(p_data->>'eye_color', eye_color),
    skin_tone = COALESCE(p_data->>'skin_tone', skin_tone),
    facial_hair = COALESCE(p_data->>'facial_hair', facial_hair),
    age_range = COALESCE(p_data->>'age_range', age_range),
    aesthetic = COALESCE(p_data->>'aesthetic', aesthetic),
    experience_level = COALESCE(p_data->>'experience_level', experience_level),
    updated_at = NOW()
  WHERE id = p_kinkster_id;
  
  RETURN jsonb_build_object('success', true, 'kinkster_id', p_kinkster_id, 'notion_page_id', p_notion_page_id, 'synced_at', NOW());
END;
$$;

-- Function: Get user kinkster stats
CREATE OR REPLACE FUNCTION public.get_user_kinkster_stats(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total_kinksters', COUNT(*),
      'active_kinksters', COUNT(*) FILTER (WHERE is_active = true),
      'primary_kinkster_id', MAX(id) FILTER (WHERE is_primary = true),
      'total_avatars', SUM(COALESCE(jsonb_array_length(avatar_urls), 0) + CASE WHEN avatar_url IS NOT NULL THEN 1 ELSE 0 END),
      'total_gallery_images', SUM(COALESCE(jsonb_array_length(gallery_urls), 0)),
      'roles', jsonb_build_object(
        'dominant', COUNT(*) FILTER (WHERE role = 'dominant'),
        'submissive', COUNT(*) FILTER (WHERE role = 'submissive'),
        'switch', COUNT(*) FILTER (WHERE role = 'switch')
      ),
      'synced_to_notion', COUNT(*) FILTER (WHERE notion_page_id IS NOT NULL)
    )
    FROM public.kinksters WHERE user_id = p_user_id
  );
END;
$$;

-- Function: Set primary kinkster
CREATE OR REPLACE FUNCTION public.set_primary_kinkster(p_kinkster_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  kinkster_user_id UUID;
BEGIN
  SELECT user_id INTO kinkster_user_id FROM public.kinksters WHERE id = p_kinkster_id;
  IF kinkster_user_id IS NULL THEN RETURN '{"success": false, "error": "Kinkster not found"}'::jsonb; END IF;
  IF kinkster_user_id != auth.uid() THEN RETURN '{"success": false, "error": "Not authorized"}'::jsonb; END IF;
  
  UPDATE public.kinksters SET is_primary = false, updated_at = NOW() WHERE user_id = kinkster_user_id AND is_primary = true;
  UPDATE public.kinksters SET is_primary = true, updated_at = NOW() WHERE id = p_kinkster_id;
  
  RETURN jsonb_build_object('success', true, 'primary_kinkster_id', p_kinkster_id);
END;
$$;

-- Function: Duplicate kinkster
CREATE OR REPLACE FUNCTION public.duplicate_kinkster(p_kinkster_id UUID, p_new_name TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_id UUID;
  source RECORD;
BEGIN
  SELECT * INTO source FROM public.kinksters WHERE id = p_kinkster_id;
  IF NOT FOUND OR source.user_id != auth.uid() THEN RETURN NULL; END IF;
  
  INSERT INTO public.kinksters (
    user_id, name, display_name, role, pronouns, bio, backstory,
    avatar_prompt, avatar_generation_config, dominance, submission,
    charisma, stamina, creativity, control, appearance_description,
    physical_attributes, kink_interests, hard_limits, soft_limits,
    personality_traits, role_preferences, archetype,
    body_type, height, build, hair_color, hair_style, eye_color,
    skin_tone, facial_hair, age_range, clothing_style, favorite_colors,
    fetish_wear, aesthetic, top_kinks, experience_level, metadata, is_active, is_primary
  ) VALUES (
    source.user_id, COALESCE(p_new_name, source.name || ' (Copy)'), source.display_name,
    source.role, source.pronouns, source.bio, source.backstory,
    source.avatar_prompt, source.avatar_generation_config, source.dominance, source.submission,
    source.charisma, source.stamina, source.creativity, source.control, source.appearance_description,
    source.physical_attributes, source.kink_interests, source.hard_limits, source.soft_limits,
    source.personality_traits, source.role_preferences, source.archetype,
    source.body_type, source.height, source.build, source.hair_color, source.hair_style, source.eye_color,
    source.skin_tone, source.facial_hair, source.age_range, source.clothing_style, source.favorite_colors,
    source.fetish_wear, source.aesthetic, source.top_kinks, source.experience_level, source.metadata, true, false
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function: Get user kinksters with pagination
CREATE OR REPLACE FUNCTION public.get_user_kinksters(
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_include_inactive BOOLEAN DEFAULT false
) RETURNS TABLE (id UUID, name TEXT, display_name TEXT, role TEXT, avatar_url TEXT, is_primary BOOLEAN, is_active BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.name, k.display_name, k.role, k.avatar_url, k.is_primary, k.is_active, k.created_at
  FROM public.kinksters k
  WHERE k.user_id = p_user_id AND (p_include_inactive OR k.is_active = true)
  ORDER BY k.is_primary DESC, k.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Junction table for avatar generation history
CREATE TABLE IF NOT EXISTS public.kinkster_avatar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kinkster_id UUID NOT NULL REFERENCES public.kinksters(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.image_generations(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kinkster_avatar_gen_kinkster ON public.kinkster_avatar_generations(kinkster_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_avatar_gen_generation ON public.kinkster_avatar_generations(generation_id);

ALTER TABLE public.kinkster_avatar_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their kinkster avatar generations" ON public.kinkster_avatar_generations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.kinksters k WHERE k.id = kinkster_id AND (k.user_id = auth.uid() OR k.is_system_kinkster = true)));

CREATE POLICY "Users can insert their kinkster avatar generations" ON public.kinkster_avatar_generations FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.kinksters k WHERE k.id = kinkster_id AND k.user_id = auth.uid()));

CREATE POLICY "Users can delete their kinkster avatar generations" ON public.kinkster_avatar_generations FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.kinksters k WHERE k.id = kinkster_id AND k.user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS set_kinksters_updated_at ON public.kinksters;
CREATE TRIGGER set_kinksters_updated_at BEFORE UPDATE ON public.kinksters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.build_kinkster_avatar_prompt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_kinkster_gallery(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kinkster_for_notion_sync(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_kinkster_from_notion(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_kinkster_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_kinkster(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duplicate_kinkster(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_kinksters(UUID, INTEGER, INTEGER, BOOLEAN) TO authenticated;

COMMENT ON TABLE public.kinksters IS 'Character profiles and avatars for KINK IT with detailed appearance, personality, kink preferences, and AI-generated avatars.';
COMMENT ON TABLE public.kinkster_avatar_generations IS 'Junction table linking kinksters to their generated avatar images with metadata';
