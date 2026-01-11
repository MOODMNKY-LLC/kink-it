-- =====================================================
-- KINKSTER PROVIDER SUPPORT (HYBRID MODE)
-- Adds provider selection (Flowise vs OpenAI Responses API)
-- Created: 2026-02-12
-- =====================================================

-- Add provider column to kinksters table
ALTER TABLE public.kinksters
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'flowise' 
  CHECK (provider IN ('flowise', 'openai_responses'));

-- Add OpenAI-specific configuration columns
ALTER TABLE public.kinksters
ADD COLUMN IF NOT EXISTS openai_model TEXT DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS openai_instructions TEXT,
ADD COLUMN IF NOT EXISTS openai_previous_response_id TEXT;

COMMENT ON COLUMN public.kinksters.provider IS 'Chat provider: flowise (visual workflows) or openai_responses (direct OpenAI)';
COMMENT ON COLUMN public.kinksters.openai_model IS 'OpenAI model to use for Responses API (e.g., gpt-5-mini, gpt-5, gpt-4o-mini)';
COMMENT ON COLUMN public.kinksters.openai_instructions IS 'Custom system instructions for OpenAI Responses API';
COMMENT ON COLUMN public.kinksters.openai_previous_response_id IS 'Previous response ID for conversation continuity in Responses API';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kinksters_provider ON public.kinksters(provider);
CREATE INDEX IF NOT EXISTS idx_kinksters_openai_model ON public.kinksters(openai_model) WHERE provider = 'openai_responses';

-- Function: Build Kinkster system prompt for OpenAI Responses API
CREATE OR REPLACE FUNCTION public.build_kinkster_openai_instructions(p_kinkster_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  k RECORD;
  instructions TEXT;
BEGIN
  SELECT * INTO k FROM public.kinksters WHERE id = p_kinkster_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  
  -- If custom instructions exist, use them
  IF k.openai_instructions IS NOT NULL AND k.openai_instructions != '' THEN
    RETURN k.openai_instructions;
  END IF;
  
  -- Build instructions from Kinkster data
  instructions := 'You are ' || COALESCE(k.display_name, k.name) || ', ';
  
  -- Role and pronouns
  IF k.role IS NOT NULL THEN instructions := instructions || 'a ' || k.role || ' '; END IF;
  IF k.pronouns IS NOT NULL THEN instructions := instructions || '(' || k.pronouns || ') '; END IF;
  
  -- Appearance
  IF k.age_range IS NOT NULL THEN instructions := instructions || 'in your ' || k.age_range || 's, '; END IF;
  IF k.build IS NOT NULL OR k.body_type IS NOT NULL THEN
    instructions := instructions || 'with a ' || COALESCE(k.build, k.body_type) || ' build, ';
  END IF;
  IF k.height IS NOT NULL THEN instructions := instructions || k.height || ', '; END IF;
  IF k.hair_color IS NOT NULL AND k.hair_style IS NOT NULL THEN
    instructions := instructions || k.hair_color || ' ' || k.hair_style || ' hair, ';
  ELSIF k.hair_color IS NOT NULL THEN instructions := instructions || k.hair_color || ' hair, '; END IF;
  IF k.eye_color IS NOT NULL THEN instructions := instructions || k.eye_color || ' eyes, '; END IF;
  IF k.skin_tone IS NOT NULL THEN instructions := instructions || k.skin_tone || ' skin, '; END IF;
  
  -- Personality
  IF k.personality_traits IS NOT NULL AND array_length(k.personality_traits, 1) > 0 THEN
    instructions := instructions || 'You are ' || array_to_string(k.personality_traits, ', ') || '. ';
  END IF;
  
  -- Bio
  IF k.bio IS NOT NULL THEN instructions := instructions || k.bio || ' '; END IF;
  
  -- Kinks and limits
  IF k.top_kinks IS NOT NULL AND array_length(k.top_kinks, 1) > 0 THEN
    instructions := instructions || 'Your top kinks include: ' || array_to_string(k.top_kinks, ', ') || '. ';
  END IF;
  IF k.soft_limits IS NOT NULL AND array_length(k.soft_limits, 1) > 0 THEN
    instructions := instructions || 'Your soft limits are: ' || array_to_string(k.soft_limits, ', ') || '. ';
  END IF;
  IF k.hard_limits IS NOT NULL AND array_length(k.hard_limits, 1) > 0 THEN
    instructions := instructions || 'Your hard limits (never acceptable) are: ' || array_to_string(k.hard_limits, ', ') || '. ';
  END IF;
  
  -- Experience level
  IF k.experience_level IS NOT NULL THEN
    instructions := instructions || 'You have ' || k.experience_level || ' experience in BDSM and kink dynamics. ';
  END IF;
  
  -- Aesthetic
  IF k.aesthetic IS NOT NULL THEN
    instructions := instructions || 'Your aesthetic is ' || k.aesthetic || '. ';
  END IF;
  
  -- Role-specific guidance
  IF k.role = 'dominant' THEN
    instructions := instructions || 'As a dominant, you take charge, set boundaries, and guide the conversation with confidence and authority. ';
  ELSIF k.role = 'submissive' THEN
    instructions := instructions || 'As a submissive, you are respectful, eager to please, and follow guidance while maintaining your own boundaries. ';
  ELSIF k.role = 'switch' THEN
    instructions := instructions || 'As a switch, you can adapt to both dominant and submissive roles based on the context and partner. ';
  END IF;
  
  -- Final instructions
  instructions := instructions || 'Stay in character, be authentic to your personality, and engage in respectful, consensual roleplay. Always respect hard limits and communicate clearly about boundaries.';
  
  RETURN instructions;
END;
$$;

-- Function: Get Kinkster chat configuration
CREATE OR REPLACE FUNCTION public.get_kinkster_chat_config(p_kinkster_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  k RECORD;
  config JSONB;
BEGIN
  SELECT * INTO k FROM public.kinksters WHERE id = p_kinkster_id;
  IF NOT FOUND THEN RETURN '{"error": "Kinkster not found"}'::jsonb; END IF;
  
  config := jsonb_build_object(
    'kinkster_id', k.id,
    'name', k.name,
    'display_name', COALESCE(k.display_name, k.name),
    'provider', COALESCE(k.provider, 'flowise'),
    'flowise_chatflow_id', k.flowise_chatflow_id,
    'openai_model', COALESCE(k.openai_model, 'gpt-5-mini'),
    'openai_instructions', COALESCE(k.openai_instructions, public.build_kinkster_openai_instructions(k.id)),
    'openai_previous_response_id', k.openai_previous_response_id
  );
  
  RETURN config;
END;
$$;

-- Function: Update Kinkster provider
CREATE OR REPLACE FUNCTION public.update_kinkster_provider(
  p_kinkster_id UUID,
  p_provider TEXT,
  p_openai_model TEXT DEFAULT NULL,
  p_openai_instructions TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  kinkster_user_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO kinkster_user_id FROM public.kinksters WHERE id = p_kinkster_id;
  IF kinkster_user_id IS NULL THEN RETURN '{"success": false, "error": "Kinkster not found"}'::jsonb; END IF;
  IF kinkster_user_id != auth.uid() THEN RETURN '{"success": false, "error": "Not authorized"}'::jsonb; END IF;
  
  -- Validate provider
  IF p_provider NOT IN ('flowise', 'openai_responses') THEN
    RETURN '{"success": false, "error": "Invalid provider. Must be flowise or openai_responses"}'::jsonb;
  END IF;
  
  -- Update provider
  UPDATE public.kinksters
  SET 
    provider = p_provider,
    openai_model = COALESCE(p_openai_model, openai_model, 'gpt-5-mini'),
    openai_instructions = COALESCE(p_openai_instructions, openai_instructions),
    updated_at = NOW()
  WHERE id = p_kinkster_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'kinkster_id', p_kinkster_id,
    'provider', p_provider,
    'openai_model', (SELECT openai_model FROM public.kinksters WHERE id = p_kinkster_id)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.build_kinkster_openai_instructions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kinkster_chat_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_kinkster_provider(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.build_kinkster_openai_instructions(UUID) IS 'Builds comprehensive system instructions for a Kinkster from their database fields';
COMMENT ON FUNCTION public.get_kinkster_chat_config(UUID) IS 'Returns complete chat configuration for a Kinkster including provider and settings';
COMMENT ON FUNCTION public.update_kinkster_provider(UUID, TEXT, TEXT, TEXT) IS 'Updates a Kinkster''s chat provider and OpenAI configuration';
