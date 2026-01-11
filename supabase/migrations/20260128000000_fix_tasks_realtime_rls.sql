-- Fix RLS policy for tasks Realtime channel
-- The channel name "tasks-updates" doesn't match the pattern 'task:%:changes'
-- This migration updates the RLS policy to allow the "tasks-updates" channel

-- Drop the existing policy
DROP POLICY IF EXISTS "tasks_broadcast_read" ON realtime.messages;

-- Create updated RLS Policy for Realtime messages
-- Allows both the "tasks-updates" channel and topic patterns like "task:%:changes"
CREATE POLICY "tasks_broadcast_read"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  -- Allow "tasks-updates" channel for all authenticated users
  -- (They may create tasks or be assigned tasks)
  topic = 'tasks-updates'
  OR
  -- Allow topic patterns like "task:%:changes" (for future use with database triggers)
  (
    topic LIKE 'task:%:changes' AND (
      -- User can read workspace broadcasts if they're in that workspace
      SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
      OR
      -- User can read user-specific broadcasts if they're the assignee
      topic LIKE 'task:user:' || auth.uid()::text || ':changes'
      OR
      -- Admins can read all
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND system_role = 'admin'
      )
    )
  )
);

-- Add index for better performance on tasks lookups
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
  ON public.tasks(assigned_to) 
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by 
  ON public.tasks(assigned_by) 
  WHERE assigned_by IS NOT NULL;
