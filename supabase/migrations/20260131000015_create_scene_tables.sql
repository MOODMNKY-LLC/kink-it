-- Create tables for unified art generation space
-- Supports scene libraries, scene compositions, and character pose variations

-- Scenes table: Stores generated background scenes
CREATE TABLE IF NOT EXISTS public.scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Scene metadata
  name text,
  scene_type text, -- indoor, outdoor, fantasy, realistic, abstract, etc.
  aspect_ratio text NOT NULL, -- 16:9, 9:16, 1:1, 4:3, etc.
  tags text[] DEFAULT '{}',
  
  -- Generation data
  generation_prompt text NOT NULL,
  generation_config jsonb DEFAULT '{}'::jsonb, -- model, size, quality, etc.
  
  -- Storage
  storage_path text NOT NULL,
  image_url text NOT NULL,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_aspect_ratio CHECK (
    aspect_ratio IN ('1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '3:2', '2:3', '5:4', '4:5')
  )
);

-- Scene compositions table: Tracks completed scene compositions
CREATE TABLE IF NOT EXISTS public.scene_compositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Character references
  character1_id uuid REFERENCES public.kinksters(id) ON DELETE SET NULL,
  character2_id uuid REFERENCES public.kinksters(id) ON DELETE SET NULL,
  
  -- Scene reference
  scene_id uuid REFERENCES public.scenes(id) ON DELETE SET NULL,
  
  -- Composition data
  composition_prompt text NOT NULL,
  character1_reference_url text, -- Avatar URL used as reference
  character2_reference_url text, -- Avatar URL used as reference
  scene_reference_url text, -- Scene image URL used as reference
  
  -- Generation data
  generation_config jsonb DEFAULT '{}'::jsonb, -- model, aspect_ratio, etc.
  
  -- Storage
  storage_path text NOT NULL,
  generated_image_url text NOT NULL,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Character poses table: Tracks pose variations for characters
CREATE TABLE IF NOT EXISTS public.character_poses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kinkster_id uuid NOT NULL REFERENCES public.kinksters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Pose metadata
  pose_type text, -- standing, sitting, action, portrait, etc.
  pose_description text,
  
  -- Reference data
  pose_reference_url text, -- Reference image for pose
  character_reference_url text NOT NULL, -- Character avatar used
  
  -- Generation data
  generation_prompt text NOT NULL,
  generation_config jsonb DEFAULT '{}'::jsonb,
  
  -- Storage
  storage_path text NOT NULL,
  generated_image_url text NOT NULL,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON public.scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_type ON public.scenes(scene_type);
CREATE INDEX IF NOT EXISTS idx_scenes_aspect_ratio ON public.scenes(aspect_ratio);
CREATE INDEX IF NOT EXISTS idx_scenes_created_at ON public.scenes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenes_tags ON public.scenes USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_scene_compositions_user_id ON public.scene_compositions(user_id);
CREATE INDEX IF NOT EXISTS idx_scene_compositions_character1_id ON public.scene_compositions(character1_id);
CREATE INDEX IF NOT EXISTS idx_scene_compositions_character2_id ON public.scene_compositions(character2_id);
CREATE INDEX IF NOT EXISTS idx_scene_compositions_scene_id ON public.scene_compositions(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_compositions_created_at ON public.scene_compositions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_character_poses_kinkster_id ON public.character_poses(kinkster_id);
CREATE INDEX IF NOT EXISTS idx_character_poses_user_id ON public.character_poses(user_id);
CREATE INDEX IF NOT EXISTS idx_character_poses_pose_type ON public.character_poses(pose_type);
CREATE INDEX IF NOT EXISTS idx_character_poses_created_at ON public.character_poses(created_at DESC);

-- Enable RLS
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_poses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scenes
DROP POLICY IF EXISTS "Users can view their own scenes" ON public.scenes;
CREATE POLICY "Users can view their own scenes"
  ON public.scenes
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scenes" ON public.scenes;
CREATE POLICY "Users can insert their own scenes"
  ON public.scenes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scenes" ON public.scenes;
CREATE POLICY "Users can update their own scenes"
  ON public.scenes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scenes" ON public.scenes;
CREATE POLICY "Users can delete their own scenes"
  ON public.scenes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scene_compositions
DROP POLICY IF EXISTS "Users can view their own scene compositions" ON public.scene_compositions;
CREATE POLICY "Users can view their own scene compositions"
  ON public.scene_compositions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scene compositions" ON public.scene_compositions;
CREATE POLICY "Users can insert their own scene compositions"
  ON public.scene_compositions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scene compositions" ON public.scene_compositions;
CREATE POLICY "Users can update their own scene compositions"
  ON public.scene_compositions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scene compositions" ON public.scene_compositions;
CREATE POLICY "Users can delete their own scene compositions"
  ON public.scene_compositions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for character_poses
DROP POLICY IF EXISTS "Users can view their own character poses" ON public.character_poses;
CREATE POLICY "Users can view their own character poses"
  ON public.character_poses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own character poses" ON public.character_poses;
CREATE POLICY "Users can insert their own character poses"
  ON public.character_poses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own character poses" ON public.character_poses;
CREATE POLICY "Users can update their own character poses"
  ON public.character_poses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own character poses" ON public.character_poses;
CREATE POLICY "Users can delete their own character poses"
  ON public.character_poses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_scenes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_scenes_updated_at ON public.scenes;
CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON public.scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_scenes_updated_at();

CREATE OR REPLACE FUNCTION update_scene_compositions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_scene_compositions_updated_at ON public.scene_compositions;
CREATE TRIGGER update_scene_compositions_updated_at
  BEFORE UPDATE ON public.scene_compositions
  FOR EACH ROW
  EXECUTE FUNCTION update_scene_compositions_updated_at();

CREATE OR REPLACE FUNCTION update_character_poses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_character_poses_updated_at ON public.character_poses;
CREATE TRIGGER update_character_poses_updated_at
  BEFORE UPDATE ON public.character_poses
  FOR EACH ROW
  EXECUTE FUNCTION update_character_poses_updated_at();


