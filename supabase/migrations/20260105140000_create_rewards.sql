-- Create rewards table for storing rewards that can be assigned or redeemed
-- Supports multiple reward types: verbal, points, relational, achievement

CREATE TYPE reward_type AS ENUM ('verbal', 'points', 'relational', 'achievement');
CREATE TYPE reward_status AS ENUM ('available', 'redeemed', 'completed', 'in_progress');

CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL, -- Currently user_id, future multi-partner support
  reward_type reward_type NOT NULL,
  title text NOT NULL,
  description text,
  point_value integer DEFAULT 0, -- Points earned (if reward_type = 'points')
  point_cost integer DEFAULT 0, -- Points required to redeem (if applicable)
  love_language text, -- Maps to partner's love languages
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  status reward_status DEFAULT 'available',
  redeemed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_assigned_to ON public.rewards(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rewards_assigned_by ON public.rewards(assigned_by);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_workspace_id ON public.rewards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rewards_task_id ON public.rewards(task_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_rewards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at
CREATE TRIGGER rewards_updated_at_trigger
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rewards_updated_at();

-- RLS Policies
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Users can view rewards assigned to them
CREATE POLICY "rewards_select_own"
ON public.rewards FOR SELECT
USING (auth.uid() = assigned_to);

-- Users can view rewards they assigned
CREATE POLICY "rewards_select_assigned_by"
ON public.rewards FOR SELECT
USING (auth.uid() = assigned_by);

-- Partners can view each other's rewards
CREATE POLICY "rewards_select_partner"
ON public.rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND partner_id = rewards.assigned_to
  )
);

-- Admins can view all rewards
CREATE POLICY "rewards_select_admin"
ON public.rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- Only dominants can create rewards
CREATE POLICY "rewards_insert_dominant"
ON public.rewards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
  AND auth.uid() = assigned_by
);

-- Dominants can update rewards they created
CREATE POLICY "rewards_update_dominant"
ON public.rewards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
  AND auth.uid() = assigned_by
);

-- Submissives can update rewards assigned to them (to redeem)
CREATE POLICY "rewards_update_submissive"
ON public.rewards FOR UPDATE
USING (
  auth.uid() = assigned_to
  AND status = 'available'
);

-- Function to get available rewards for a user
CREATE OR REPLACE FUNCTION public.get_available_rewards(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  reward_type reward_type,
  title text,
  description text,
  point_value integer,
  point_cost integer,
  love_language text,
  assigned_by uuid,
  assigned_to uuid,
  task_id uuid,
  status reward_status,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.reward_type,
    r.title,
    r.description,
    r.point_value,
    r.point_cost,
    r.love_language,
    r.assigned_by,
    r.assigned_to,
    r.task_id,
    r.status,
    r.created_at
  FROM public.rewards r
  WHERE r.assigned_to = p_user_id
    AND r.status = 'available'
  ORDER BY r.created_at DESC;
END;
$$;

-- Function to get completed rewards count for a user
CREATE OR REPLACE FUNCTION public.get_completed_rewards_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.rewards
  WHERE assigned_to = p_user_id
    AND status = 'completed';
  
  RETURN count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_available_rewards(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_completed_rewards_count(uuid) TO authenticated;




