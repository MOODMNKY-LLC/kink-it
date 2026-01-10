-- Add tagline column to profiles table
-- This allows users to add a short tagline/bio to their profile

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tagline text;

-- Create index for tagline searches (if needed in future)
-- CREATE INDEX IF NOT EXISTS idx_profiles_tagline 
-- ON public.profiles USING gin(to_tsvector('english', tagline))
-- WHERE tagline IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.tagline IS 
  'Short tagline or bio for the user profile';
