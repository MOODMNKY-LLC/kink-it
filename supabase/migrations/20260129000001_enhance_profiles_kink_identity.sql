-- Enhance Profiles with Kink/BDSM Identity and Subtype Fields
-- Adds comprehensive self-expression options for kinksters

-- Create kink_subtype enum for common BDSM subtypes
CREATE TYPE kink_subtype AS ENUM (
  -- Submissive subtypes
  'brat',              -- Playfully resistant submissive
  'little',            -- Age play: little/middle
  'pet',               -- Pet play (pup/kitten/pony/etc)
  'slave',             -- Service-oriented, high protocol
  'masochist',         -- Enjoys receiving pain/sensation
  'service_sub',       -- Service-oriented submission
  'primal_prey',       -- Primal play: prey role
  'rope_bunny',        -- Enjoys rope bondage
  'exhibitionist',     -- Enjoys being seen/showcased
  'degradation_sub',   -- Enjoys degradation/humiliation
  
  -- Dominant subtypes
  'daddy',             -- Caregiver dominant (DD/lg)
  'mommy',             -- Caregiver dominant (MD/lb)
  'master',            -- High protocol, structured control
  'mistress',          -- Female-identifying master
  'sadist',            -- Enjoys giving pain/sensation
  'rigger',            -- Rope bondage specialist
  'primal_predator',   -- Primal play: predator role
  'owner',             -- Ownership-focused dominant
  'handler',           -- Pet play handler/trainer
  'degradation_dom',   -- Enjoys degradation/humiliation
  
  -- Switch/Other
  'switch',            -- Enjoys both roles
  'versatile',         -- Flexible in roles
  'none'               -- No specific subtype
);

-- Create dynamic_intensity enum
CREATE TYPE dynamic_intensity AS ENUM (
  'casual',            -- Occasional scenes/play
  'part_time',         -- Regular but not constant
  'lifestyle',         -- Integrated into daily life
  '24_7',              -- Full-time power exchange
  'tpe'                -- Total Power Exchange
);

-- Create dynamic_structure enum
CREATE TYPE dynamic_structure AS ENUM (
  'd_s',               -- Dominant/submissive
  'm_s',               -- Master/slave
  'owner_pet',         -- Owner/pet dynamic
  'caregiver_little',  -- CG/l dynamic
  'primal',            -- Primal play dynamic
  'rope_partnership',  -- Rope-focused dynamic
  'mentor_protege',    -- Educational/mentorship dynamic
  'casual_play',       -- Scene-based, no relationship
  'other'              -- Other structure
);

-- Add kink identity fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kink_subtypes kink_subtype[] DEFAULT ARRAY[]::kink_subtype[],
ADD COLUMN IF NOT EXISTS dynamic_intensity dynamic_intensity,
ADD COLUMN IF NOT EXISTS dynamic_structure dynamic_structure[] DEFAULT ARRAY[]::dynamic_structure[],
ADD COLUMN IF NOT EXISTS kink_interests text[] DEFAULT ARRAY[]::text[],  -- Free-form kink interests
ADD COLUMN IF NOT EXISTS experience_level text,  -- 'beginner', 'intermediate', 'advanced', 'expert'
ADD COLUMN IF NOT EXISTS scene_preferences text[],  -- Preferred types of scenes
ADD COLUMN IF NOT EXISTS kink_identity_public boolean DEFAULT false;  -- Whether to show kink identity publicly

-- Create index for kink subtype searches
CREATE INDEX IF NOT EXISTS idx_profiles_kink_subtypes 
ON public.profiles USING GIN(kink_subtypes);

CREATE INDEX IF NOT EXISTS idx_profiles_dynamic_intensity 
ON public.profiles(dynamic_intensity) 
WHERE dynamic_intensity IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.profiles.kink_subtypes IS 
  'Array of kink/BDSM subtypes that describe the user''s identity (brat, little, pet, master, etc.)';

COMMENT ON COLUMN public.profiles.dynamic_intensity IS 
  'Intensity level of power exchange: casual, part-time, lifestyle, 24/7, or TPE';

COMMENT ON COLUMN public.profiles.dynamic_structure IS 
  'Types of relationship structures the user engages in (D/s, M/s, Owner/Pet, etc.)';

COMMENT ON COLUMN public.profiles.kink_interests IS 
  'Free-form array of kink interests and activities';

COMMENT ON COLUMN public.profiles.experience_level IS 
  'Self-reported experience level in BDSM/kink community';

COMMENT ON COLUMN public.profiles.scene_preferences IS 
  'Types of scenes or play the user prefers';

COMMENT ON COLUMN public.profiles.kink_identity_public IS 
  'Whether the user wants their kink identity visible to others in the app';
