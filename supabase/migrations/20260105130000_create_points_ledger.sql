-- Create points_ledger table for tracking all point transactions
-- Supports both earned (positive) and spent (negative) points

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL, -- Currently user_id, future multi-partner support
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL, -- Can be positive (earned) or negative (spent)
  reason text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('task', 'reward', 'manual', 'redemption')),
  source_id uuid, -- References task_id, reward_id, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_workspace_id ON public.points_ledger(workspace_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON public.points_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_ledger_source ON public.points_ledger(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_created ON public.points_ledger(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- Users can view their own points ledger
CREATE POLICY "points_ledger_select_own"
ON public.points_ledger FOR SELECT
USING (auth.uid() = user_id);

-- Partners can view each other's points ledger
CREATE POLICY "points_ledger_select_partner"
ON public.points_ledger FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND partner_id = points_ledger.user_id
  )
);

-- Admins can view all points ledger entries
CREATE POLICY "points_ledger_select_admin"
ON public.points_ledger FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Only dominants can insert points (award points)
CREATE POLICY "points_ledger_insert_dominant"
ON public.points_ledger FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
);

-- Function to calculate current points balance for a user
CREATE OR REPLACE FUNCTION public.get_points_balance(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance integer;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO balance
  FROM public.points_ledger
  WHERE user_id = p_user_id;
  
  RETURN balance;
END;
$$;

-- Function to calculate current streak (consecutive days with at least one completed task)
CREATE OR REPLACE FUNCTION public.get_current_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_days integer := 0;
  check_date date := CURRENT_DATE; -- Renamed from current_date (reserved keyword)
  day_has_task boolean;
BEGIN
  -- Check up to 30 days back for consecutive completions
  FOR i IN 0..29 LOOP
    -- Check if there's at least one completed/approved task on this day
    SELECT EXISTS (
      SELECT 1 FROM public.tasks
      WHERE assigned_to = p_user_id
        AND status IN ('completed', 'approved')
        AND completed_at IS NOT NULL
        AND DATE(completed_at) = check_date
      LIMIT 1
    ) INTO day_has_task;
    
    IF day_has_task THEN
      streak_days := streak_days + 1;
      -- Move to previous day
      check_date := check_date - INTERVAL '1 day';
    ELSE
      -- No tasks completed on this day, streak broken
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_days;
END;
$$;

-- Trigger function to automatically award points when a task is approved
CREATE OR REPLACE FUNCTION public.award_points_for_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When task status changes to 'approved', award points
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Only award if point_value > 0 and points haven't been awarded yet
    IF NEW.point_value > 0 THEN
      -- Check if points were already awarded for this task
      IF NOT EXISTS (
        SELECT 1 FROM public.points_ledger
        WHERE source_type = 'task'
          AND source_id = NEW.id
      ) THEN
        INSERT INTO public.points_ledger (
          workspace_id,
          user_id,
          points,
          reason,
          source_type,
          source_id
        ) VALUES (
          NEW.workspace_id,
          NEW.assigned_to,
          NEW.point_value,
          'Task completed: ' || COALESCE(NEW.title, 'Untitled Task'),
          'task',
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS tasks_award_points_trigger ON public.tasks;
CREATE TRIGGER tasks_award_points_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.award_points_for_task();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_points_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_streak(uuid) TO authenticated;

