-- Add recurring field to tasks table for daily/weekly/monthly recurring tasks
-- This enables "everyday" tasks and other recurring patterns

-- Add recurring column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'recurring'
  ) THEN
    -- Create enum type for recurring patterns
    CREATE TYPE task_recurrence AS ENUM ('none', 'daily', 'weekly', 'monthly');
    
    ALTER TABLE public.tasks
    ADD COLUMN recurring task_recurrence DEFAULT 'none';
  END IF;
END $$;

-- Add index for recurring queries
CREATE INDEX IF NOT EXISTS idx_tasks_recurring 
ON public.tasks(recurring) 
WHERE recurring != 'none';

-- Add comment
COMMENT ON COLUMN public.tasks.recurring IS 'Recurrence pattern: none (one-time), daily (everyday), weekly, or monthly';
