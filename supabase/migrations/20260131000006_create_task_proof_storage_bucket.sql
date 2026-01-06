-- Create Storage Bucket for Task Proof Uploads
-- This migration creates the bucket and sets up RLS policies for secure proof file storage
-- Supports photo, video, and text proof submissions for tasks

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-proofs',
  'task-proofs',
  false, -- Private bucket - proofs should only be accessible to task participants
  10485760, -- 10MB limit (larger than avatars to support videos)
  ARRAY[
    'image/png', 
    'image/jpeg', 
    'image/webp', 
    'image/jpg',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload proof files for tasks assigned to them
CREATE POLICY "Users can upload task proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-proofs'
  AND (
    -- User can upload to their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    -- OR user is assigned to the task (check via task_id in path)
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
    )
  )
);

-- Policy: Users can view proof files for tasks they're involved in
CREATE POLICY "Users can view task proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs'
  AND (
    -- User's own files
    (storage.foldername(name))[1] = auth.uid()::text
    -- OR user is assigned to or assigned the task
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
    )
  )
);

-- Policy: Users can update proof files for tasks assigned to them
CREATE POLICY "Users can update task proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-proofs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND t.assigned_to = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'task-proofs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND t.assigned_to = auth.uid()
    )
  )
);

-- Policy: Users can delete proof files for tasks assigned to them
CREATE POLICY "Users can delete task proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-proofs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
    )
  )
);

-- File organization structure: {user_id}/tasks/{task_id}/proof_{timestamp}.{ext}

