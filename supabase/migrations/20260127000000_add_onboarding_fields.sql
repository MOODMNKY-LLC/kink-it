-- Add onboarding tracking fields to profiles table
-- This migration adds fields to track user onboarding progress

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notion_parent_page_id text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;

-- Create notion_databases table to track discovered databases
CREATE TABLE IF NOT EXISTS public.notion_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  database_id text NOT NULL,
  database_name text NOT NULL,
  database_type text, -- 'tasks', 'rules', 'rewards', etc.
  parent_page_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, database_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notion_databases_user_id 
  ON public.notion_databases(user_id);

CREATE INDEX IF NOT EXISTS idx_notion_databases_parent_page_id 
  ON public.notion_databases(parent_page_id);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
  ON public.profiles(onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step 
  ON public.profiles(onboarding_step);

-- Enable RLS on notion_databases
ALTER TABLE public.notion_databases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own databases
CREATE POLICY "notion_databases_select_own"
ON public.notion_databases FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own databases
CREATE POLICY "notion_databases_insert_own"
ON public.notion_databases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own databases
CREATE POLICY "notion_databases_update_own"
ON public.notion_databases FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own databases
CREATE POLICY "notion_databases_delete_own"
ON public.notion_databases FOR DELETE
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.notion_parent_page_id IS 'Notion parent page ID for user template';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed onboarding';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Current step in onboarding process (1-5)';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Additional onboarding data stored as JSON';
COMMENT ON TABLE public.notion_databases IS 'Tracks Notion databases discovered during onboarding';


