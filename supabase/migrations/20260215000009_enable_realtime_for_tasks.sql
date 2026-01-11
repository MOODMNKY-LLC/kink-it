-- Enable Realtime for tasks table
-- This allows postgres_changes subscriptions to work for task updates
-- Required for use-tasks.ts hook to receive real-time updates

-- Add tasks table to supabase_realtime publication
-- This enables Realtime change tracking for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Set REPLICA IDENTITY FULL for tasks table
-- This ensures UPDATE and DELETE events include all column values
-- Required for postgres_changes to work properly
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

-- Add comment for documentation
COMMENT ON TABLE public.tasks IS 
  'Tasks assigned by Dominants to Submissives. Respects submission state - no assignments when paused. Realtime enabled for live updates.';
