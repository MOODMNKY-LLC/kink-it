-- Add all_day and reminder_minutes fields to tasks table for calendar integration
-- This enables all-day events and reminders for task deadlines

-- Add all_day column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'all_day'
  ) THEN
    ALTER TABLE public.tasks
    ADD COLUMN all_day boolean DEFAULT false;
  END IF;
END $$;

-- Add reminder_minutes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'reminder_minutes'
  ) THEN
    ALTER TABLE public.tasks
    ADD COLUMN reminder_minutes integer;
  END IF;
END $$;

-- Add index for reminder queries
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_minutes 
ON public.tasks(reminder_minutes) 
WHERE reminder_minutes IS NOT NULL;

-- Add index for all_day queries
CREATE INDEX IF NOT EXISTS idx_tasks_all_day 
ON public.tasks(all_day) 
WHERE all_day = true;

-- Add comment
COMMENT ON COLUMN public.tasks.all_day IS 'Whether the task due date is an all-day event (no specific time)';
COMMENT ON COLUMN public.tasks.reminder_minutes IS 'Minutes before due_date to send reminder notification';
