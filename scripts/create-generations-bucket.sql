-- Quick script to create generations bucket if it doesn't exist
-- Run this directly in Supabase SQL Editor or via CLI

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create policies (if they don't exist)
DO $$
BEGIN
  -- Upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload generations'
  ) THEN
    CREATE POLICY "Users can upload generations"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'generations'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- View own policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own generations'
  ) THEN
    CREATE POLICY "Users can view their own generations"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'generations'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Public view policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view generations'
  ) THEN
    CREATE POLICY "Public can view generations"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'generations');
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own generations'
  ) THEN
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
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own generations'
  ) THEN
    CREATE POLICY "Users can delete their own generations"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'generations'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

