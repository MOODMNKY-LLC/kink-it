-- Create Image Generations and Tagging System
-- Centralized storage for all image generations with tagging support
-- Supports avatars, scenes, compositions, and pose variations

-- Image Generations Table: Centralized storage for all generations
CREATE TABLE IF NOT EXISTS public.image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Generation metadata
  generation_type text NOT NULL CHECK (generation_type IN ('avatar', 'scene', 'composition', 'pose', 'other')),
  
  -- Generation data
  generation_prompt text NOT NULL,
  generation_config jsonb DEFAULT '{}'::jsonb, -- model, size, quality, aspect_ratio, etc.
  model text, -- 'dalle-3', 'gemini-3-pro', etc.
  aspect_ratio text,
  
  -- Storage
  storage_path text NOT NULL,
  image_url text NOT NULL,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Image Tags Table: Tag definitions
CREATE TABLE IF NOT EXISTS public.image_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system tags
  
  -- Tag metadata
  name text NOT NULL,
  category text, -- Optional category grouping (e.g., 'character', 'scene', 'style')
  color text, -- Optional color for UI display
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT NOW(),
  
  -- Ensure unique tag names per user (or system-wide if user_id is NULL)
  CONSTRAINT unique_tag_name_per_user UNIQUE (user_id, name)
);

-- Image Generation Tags Junction Table: Many-to-many relationship
CREATE TABLE IF NOT EXISTS public.image_generation_tags (
  image_generation_id uuid NOT NULL REFERENCES public.image_generations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.image_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (image_generation_id, tag_id)
);

-- Image Generation Entities Table: Polymorphic relationships
-- Links generations to various entity types (kinksters, scenes, compositions, poses)
CREATE TABLE IF NOT EXISTS public.image_generation_entities (
  image_generation_id uuid NOT NULL REFERENCES public.image_generations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('kinkster', 'scene', 'scene_composition', 'character_pose')),
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (image_generation_id, entity_type, entity_id)
);

-- Add reference_image_url to kinksters table
ALTER TABLE public.kinksters
ADD COLUMN IF NOT EXISTS reference_image_url text,
ADD COLUMN IF NOT EXISTS reference_image_storage_path text;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON public.image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_type ON public.image_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_image_generations_created_at ON public.image_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_generations_model ON public.image_generations(model);

CREATE INDEX IF NOT EXISTS idx_image_tags_user_id ON public.image_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_category ON public.image_tags(category);
CREATE INDEX IF NOT EXISTS idx_image_tags_name ON public.image_tags(name);

CREATE INDEX IF NOT EXISTS idx_image_generation_tags_generation_id ON public.image_generation_tags(image_generation_id);
CREATE INDEX IF NOT EXISTS idx_image_generation_tags_tag_id ON public.image_generation_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_image_generation_entities_generation_id ON public.image_generation_entities(image_generation_id);
CREATE INDEX IF NOT EXISTS idx_image_generation_entities_entity ON public.image_generation_entities(entity_type, entity_id);

-- RLS Policies for image_generations
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own image generations"
ON public.image_generations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image generations"
ON public.image_generations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image generations"
ON public.image_generations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image generations"
ON public.image_generations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for image_tags
ALTER TABLE public.image_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags and system tags"
ON public.image_tags FOR SELECT
TO authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
ON public.image_tags FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own tags"
ON public.image_tags FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.image_tags FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for image_generation_tags
ALTER TABLE public.image_generation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags for their own generations"
ON public.image_generation_tags FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = image_generation_tags.image_generation_id
    AND image_generations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tags for their own generations"
ON public.image_generation_tags FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = image_generation_tags.image_generation_id
    AND image_generations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tags from their own generations"
ON public.image_generation_tags FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = image_generation_tags.image_generation_id
    AND image_generations.user_id = auth.uid()
  )
);

-- RLS Policies for image_generation_entities
ALTER TABLE public.image_generation_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entities for their own generations"
ON public.image_generation_entities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = image_generation_entities.image_generation_id
    AND image_generations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create entities for their own generations"
ON public.image_generation_entities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = image_generation_entities.image_generation_id
    AND image_generations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete entities from their own generations"
ON public.image_generation_entities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = image_generation_entities.image_generation_id
    AND image_generations.user_id = auth.uid()
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_image_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_image_generations_updated_at
BEFORE UPDATE ON public.image_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_image_generations_updated_at();

-- Create some default system tags
INSERT INTO public.image_tags (id, user_id, name, category, color)
VALUES
  (gen_random_uuid(), NULL, 'character', 'type', '#3b82f6'),
  (gen_random_uuid(), NULL, 'scene', 'type', '#10b981'),
  (gen_random_uuid(), NULL, 'composition', 'type', '#8b5cf6'),
  (gen_random_uuid(), NULL, 'pose', 'type', '#f59e0b'),
  (gen_random_uuid(), NULL, 'favorite', 'status', '#ef4444'),
  (gen_random_uuid(), NULL, 'work-in-progress', 'status', '#f97316')
ON CONFLICT DO NOTHING;

