-- Add category field to image_generations table
-- Categories: scenes, avatars, profile_photos, banners, wallpapers, other

ALTER TABLE public.image_generations
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('scenes', 'avatars', 'profile_photos', 'banners', 'wallpapers', 'other'));

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_image_generations_category ON public.image_generations(category);

-- Update existing records: if generation_type is 'avatar', set category to 'avatars'
UPDATE public.image_generations
SET category = 'avatars'
WHERE generation_type = 'avatar' AND category IS NULL;

-- Update existing records: if generation_type is 'scene', set category to 'scenes'
UPDATE public.image_generations
SET category = 'scenes'
WHERE generation_type = 'scene' AND category IS NULL;

-- Set default category for remaining records
UPDATE public.image_generations
SET category = 'other'
WHERE category IS NULL;

-- Add comment
COMMENT ON COLUMN public.image_generations.category IS 'Category flag for image generations: scenes, avatars, profile_photos, banners, wallpapers, other';
