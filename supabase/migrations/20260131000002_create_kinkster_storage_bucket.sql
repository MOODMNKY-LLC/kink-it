-- Create Storage Bucket for Kinkster Avatars
-- This migration creates the bucket and sets up RLS policies for secure image storage

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kinkster-avatars',
  'kinkster-avatars',
  true, -- Public bucket for easy CDN delivery
  5242880, -- 5MB limit (DALL-E 3 generates ~1-2MB images)
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS on storage.objects is managed by Supabase
-- We only need to create policies, not alter the table;

-- Policy: Users can upload their own kinkster avatars
CREATE POLICY "Users can upload kinkster avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kinkster-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own kinkster avatars
CREATE POLICY "Users can view their own kinkster avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kinkster-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can view kinkster avatars (for CDN delivery)
CREATE POLICY "Public can view kinkster avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kinkster-avatars');

-- Policy: Users can update their own kinkster avatars
CREATE POLICY "Users can update their own kinkster avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kinkster-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'kinkster-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own kinkster avatars
CREATE POLICY "Users can delete their own kinkster avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kinkster-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

