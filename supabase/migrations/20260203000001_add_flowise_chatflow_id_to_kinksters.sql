-- Add Flowise chatflow ID support to kinksters table
-- This allows each Kinkster to have their own Flowise chatflow configured

ALTER TABLE public.kinksters
  ADD COLUMN IF NOT EXISTS flowise_chatflow_id text;

-- Add comment
COMMENT ON COLUMN public.kinksters.flowise_chatflow_id IS 
  'Flowise chatflow ID for this Kinkster. If null, falls back to Kinky Kincade default chatflow.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kinksters_flowise_chatflow_id 
  ON public.kinksters(flowise_chatflow_id) 
  WHERE flowise_chatflow_id IS NOT NULL;
