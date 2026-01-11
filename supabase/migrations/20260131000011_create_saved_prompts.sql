-- Create saved_prompts table for storing user's saved image generation prompts
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  character_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_created_at ON saved_prompts(created_at DESC);

-- Enable RLS
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own saved prompts
DROP POLICY IF EXISTS "Users can view their own saved prompts" ON saved_prompts;
CREATE POLICY "Users can view their own saved prompts"
  ON saved_prompts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved prompts
DROP POLICY IF EXISTS "Users can insert their own saved prompts" ON saved_prompts;
CREATE POLICY "Users can insert their own saved prompts"
  ON saved_prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved prompts
DROP POLICY IF EXISTS "Users can update their own saved prompts" ON saved_prompts;
CREATE POLICY "Users can update their own saved prompts"
  ON saved_prompts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved prompts
DROP POLICY IF EXISTS "Users can delete their own saved prompts" ON saved_prompts;
CREATE POLICY "Users can delete their own saved prompts"
  ON saved_prompts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saved_prompts_updated_at ON saved_prompts;
CREATE TRIGGER update_saved_prompts_updated_at
  BEFORE UPDATE ON saved_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_prompts_updated_at();
