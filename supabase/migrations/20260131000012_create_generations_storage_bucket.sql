-- Create Storage Bucket for Image Generations and Processing
-- This bucket stores generated images, processed images (background removal, vectorization), etc.

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  true, -- Public bucket for easy CDN delivery
  10485760, -- 10MB limit (supports larger processed images)
  ARRAY[
    'image/png', 
    'image/jpeg', 
    'image/webp', 
    'image/jpg',
    'image/svg+xml', -- For vectorized images
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own generated/processed images
CREATE POLICY "Users can upload generations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own generations
CREATE POLICY "Users can view their own generations"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can view generations (for CDN delivery)
CREATE POLICY "Public can view generations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generations');

-- Policy: Users can update their own generations
CREATE POLICY "Users can update their own generations"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'generations'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'generations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own generations
CREATE POLICY "Users can delete their own generations"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generations'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
