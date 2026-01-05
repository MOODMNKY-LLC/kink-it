-- Create Kinkster Character Creation System
-- Allows users to create unique roleplay personas with custom AI-generated avatars

-- Create kinksters table
CREATE TABLE public.kinksters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  name text NOT NULL,
  bio text,
  backstory text,
  
  -- Avatar
  avatar_url text, -- Generated image URL
  avatar_prompt text, -- Prompt used for generation
  avatar_generation_config jsonb, -- Settings used (model, size, quality, etc.)
  
  -- Stats (1-20 scale, total points allocated = 60)
  dominance integer DEFAULT 10 CHECK (dominance >= 1 AND dominance <= 20),
  submission integer DEFAULT 10 CHECK (submission >= 1 AND submission <= 20),
  charisma integer DEFAULT 10 CHECK (charisma >= 1 AND charisma <= 20),
  stamina integer DEFAULT 10 CHECK (stamina >= 1 AND stamina <= 20),
  creativity integer DEFAULT 10 CHECK (creativity >= 1 AND creativity <= 20),
  control integer DEFAULT 10 CHECK (control >= 1 AND control <= 20),
  
  -- Appearance Description (for avatar generation)
  appearance_description text,
  physical_attributes jsonb, -- height, build, hair, eyes, skin tone, etc.
  
  -- Kink Preferences
  kink_interests text[],
  hard_limits text[],
  soft_limits text[],
  
  -- Character Traits
  personality_traits text[],
  role_preferences text[], -- dominant, submissive, switch, etc.
  
  -- Character Archetype (optional pre-built template)
  archetype text, -- e.g., "The Dominant", "The Submissive", "The Switch", "The Brat", etc.
  
  -- Metadata
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false, -- User's main character
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Note: Unique constraint for primary kinkster enforced via unique index below
  CONSTRAINT valid_stat_total CHECK (
    (dominance + submission + charisma + stamina + creativity + control) <= 120
  )
);

-- Create kinkster_creation_sessions table for saving progress
CREATE TABLE public.kinkster_creation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_data jsonb NOT NULL, -- All creation data
  current_step integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER kinksters_updated_at
  BEFORE UPDATE ON public.kinksters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER kinkster_creation_sessions_updated_at
  BEFORE UPDATE ON public.kinkster_creation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.kinksters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinkster_creation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kinksters
CREATE POLICY "Users can view their own kinksters"
  ON public.kinksters FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own kinksters"
  ON public.kinksters FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own kinksters"
  ON public.kinksters FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own kinksters"
  ON public.kinksters FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for kinkster_creation_sessions
CREATE POLICY "Users can manage their own creation sessions"
  ON public.kinkster_creation_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_kinksters_user_id ON public.kinksters(user_id);
CREATE INDEX idx_kinksters_is_primary ON public.kinksters(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_kinkster_creation_sessions_user_id ON public.kinkster_creation_sessions(user_id);

-- Create function to ensure only one primary kinkster per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_kinkster()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If setting this kinkster as primary, unset all others
  IF NEW.is_primary = true THEN
    UPDATE public.kinksters
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_primary_kinkster_trigger
  BEFORE INSERT OR UPDATE ON public.kinksters
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.ensure_single_primary_kinkster();

