-- =====================================================
-- UPDATE BUILD KINKSTER INSTRUCTIONS TO INCLUDE SPECIALTY
-- Enhances system prompt generation to include specialty
-- Created: 2026-02-15
-- =====================================================

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
  
  -- Specialty (prominently featured)
  IF k.specialty IS NOT NULL AND k.specialty != '' THEN
    instructions := instructions || 'specializing in ' || k.specialty || '. ';
  END IF;
  
  -- Appearance
  IF k.age_range IS NOT NULL THEN instructions := instructions || 'In your ' || k.age_range || 's, '; END IF;
  IF k.build IS NOT NULL OR k.body_type IS NOT NULL THEN
    instructions := instructions || 'with a ' || COALESCE(k.build, k.body_type) || ' build, ';
  END IF;
  IF k.height IS NOT NULL THEN instructions := instructions || k.height || ', '; END IF;
  IF k.hair_color IS NOT NULL AND k.hair_style IS NOT NULL THEN
    instructions := instructions || k.hair_color || ' ' || k.hair_style || ' hair, ';
  ELSIF k.hair_color IS NOT NULL THEN instructions := instructions || k.hair_color || ' hair, '; END IF;
  IF k.eye_color IS NOT NULL THEN instructions := instructions || k.eye_color || ' eyes, '; END IF;
  IF k.skin_tone IS NOT NULL THEN instructions := instructions || k.skin_tone || ' skin, '; END IF;
  IF k.facial_hair IS NOT NULL THEN instructions := instructions || k.facial_hair || ', '; END IF;
  
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
  
  -- Specialty-specific guidance
  IF k.specialty IS NOT NULL AND k.specialty != '' THEN
    IF k.specialty ILIKE '%protocol%' OR k.specialty ILIKE '%etiquette%' THEN
      instructions := instructions || 'You are an expert in protocol and etiquette training. You teach proper formality, respect, and the beautiful structure of high-protocol dynamics. You guide others in understanding the significance of rituals, ceremonies, and proper conduct in power exchange relationships. ';
    ELSIF k.specialty ILIKE '%brat%' OR k.specialty ILIKE '%funishment%' THEN
      instructions := instructions || 'You are an expert in brat dynamics and funishment. You understand that bratting is a form of communication and play. You help others understand the difference between funishment and punishment, and how to engage with brats in a way that honors their need for attention, structure, and playful challenge. ';
    ELSIF k.specialty ILIKE '%caregiving%' OR k.specialty ILIKE '%aftercare%' THEN
      instructions := instructions || 'You are an expert in caregiving and aftercare. You understand the importance of emotional and physical support after scenes. You teach others about proper aftercare techniques, recognizing subdrop and domdrop, and creating safe spaces for vulnerability and recovery. ';
    ELSIF k.specialty ILIKE '%primal%' OR k.specialty ILIKE '%wrestling%' THEN
      instructions := instructions || 'You are an expert in primal play and wrestling. You understand the raw, instinctual nature of primal dynamics. You help others explore their animalistic side safely, teaching about wrestling, chasing, biting, and the intense physical connection that comes with primal play. ';
    ELSIF k.specialty ILIKE '%service%' OR k.specialty ILIKE '%worship%' THEN
      instructions := instructions || 'You are an expert in service submission and worship dynamics. You understand the deep fulfillment that comes from serving and worshipping a Dominant. You teach others about the beauty of devotion, the significance of service acts, and the spiritual aspects of worship in power exchange. ';
    END IF;
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

COMMENT ON FUNCTION public.build_kinkster_openai_instructions(UUID) IS 'Builds comprehensive system instructions for a Kinkster from their database fields, including specialty';
