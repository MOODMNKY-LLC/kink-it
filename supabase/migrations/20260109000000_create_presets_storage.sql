-- Create storage bucket for background presets
-- This bucket stores preset background images for scene composition

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'background-presets',
  'background-presets',
  true, -- Public access for CDN delivery
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for character presets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-presets',
  'character-presets',
  true, -- Public access for CDN delivery
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for background-presets bucket
-- Public read access, admin write access
CREATE POLICY "Public can view background presets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'background-presets');

CREATE POLICY "Admins can upload background presets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'background-presets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "Admins can update background presets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'background-presets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "Admins can delete background presets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'background-presets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- RLS Policies for character-presets bucket
-- Public read access, admin write access
CREATE POLICY "Public can view character presets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'character-presets');

CREATE POLICY "Admins can upload character presets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'character-presets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "Admins can update character presets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'character-presets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "Admins can delete character presets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'character-presets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);
