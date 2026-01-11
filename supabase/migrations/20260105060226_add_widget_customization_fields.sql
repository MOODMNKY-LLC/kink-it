-- Add widget customization fields to profiles table
-- Allows users to customize their widget banner text and background image

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_text text,
ADD COLUMN IF NOT EXISTS widget_image_url text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.banner_text IS 'Customizable scrolling banner text for the widget component';
COMMENT ON COLUMN public.profiles.widget_image_url IS 'URL to custom background image for widget component (replaces default GIF)';
