-- Create tables for background and character presets
-- This migration creates the database schema for managing preset images

-- Background Presets Table
CREATE TABLE IF NOT EXISTS public.background_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('environment', 'scene')),
  storage_path text NOT NULL,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Character Presets Table
CREATE TABLE IF NOT EXISTS public.character_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  props jsonb, -- GenerationProps structure
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Scene Presets Table (for scene/environment combinations)
CREATE TABLE IF NOT EXISTS public.scene_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  background_type text CHECK (background_type IN ('environment', 'scene')),
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_background_presets_type ON public.background_presets(type);
CREATE INDEX IF NOT EXISTS idx_background_presets_tags ON public.background_presets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_character_presets_tags ON public.character_presets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_scene_presets_background_type ON public.scene_presets(background_type);
CREATE INDEX IF NOT EXISTS idx_scene_presets_tags ON public.scene_presets USING GIN(tags);

-- Enable RLS
ALTER TABLE public.background_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read, admin write
CREATE POLICY "Public can view background presets"
ON public.background_presets FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage background presets"
ON public.background_presets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "Public can view character presets"
ON public.character_presets FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage character presets"
ON public.character_presets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "Public can view scene presets"
ON public.scene_presets FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage scene presets"
ON public.scene_presets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Add updated_at triggers
CREATE TRIGGER background_presets_updated_at
  BEFORE UPDATE ON public.background_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER character_presets_updated_at
  BEFORE UPDATE ON public.character_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER scene_presets_updated_at
  BEFORE UPDATE ON public.scene_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.background_presets IS 'Preset background images for scene composition';
COMMENT ON TABLE public.character_presets IS 'Preset character images (like KINKSTER-model.png)';
COMMENT ON TABLE public.scene_presets IS 'Preset scene/environment combinations';
