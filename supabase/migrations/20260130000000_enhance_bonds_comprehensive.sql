-- Comprehensive Bond Management System Enhancements
-- Adds activity logging, settings, and enhanced features

-- Create bond_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS public.bond_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type text NOT NULL,  -- 'member_joined', 'member_left', 'member_role_changed', 'bond_updated', 'invite_sent', 'permission_changed', 'task_assigned', etc.
  activity_description text NOT NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,  -- Additional context (member_id, old_value, new_value, etc.)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_bond_activity_log_bond_id ON public.bond_activity_log(bond_id);
CREATE INDEX IF NOT EXISTS idx_bond_activity_log_user_id ON public.bond_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_bond_activity_log_type ON public.bond_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_bond_activity_log_created_at ON public.bond_activity_log(created_at DESC);

-- Create bond_settings table for bond-specific preferences
CREATE TABLE IF NOT EXISTS public.bond_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL UNIQUE REFERENCES public.bonds(id) ON DELETE CASCADE,
  
  -- Membership settings
  max_members integer DEFAULT NULL,  -- NULL = unlimited
  auto_approve_members boolean DEFAULT false,  -- Auto-approve join requests
  require_approval_for_leaving boolean DEFAULT false,  -- Require approval before leaving
  
  -- Invite settings
  invite_expires_after_days integer DEFAULT NULL,  -- NULL = never expires
  max_invites_per_member integer DEFAULT NULL,  -- NULL = unlimited
  
  -- Notification settings
  notify_on_member_join boolean DEFAULT true,
  notify_on_member_leave boolean DEFAULT true,
  notify_on_role_change boolean DEFAULT true,
  notify_on_task_assigned boolean DEFAULT true,
  notify_on_task_completed boolean DEFAULT true,
  
  -- Privacy settings
  show_member_profiles boolean DEFAULT true,  -- Show member profiles to other members
  show_activity_feed boolean DEFAULT true,  -- Show activity feed to members
  allow_external_invites boolean DEFAULT true,  -- Allow invites to non-members
  
  -- Feature flags
  enable_task_management boolean DEFAULT true,
  enable_points_system boolean DEFAULT true,
  enable_rewards_system boolean DEFAULT true,
  enable_journal_sharing boolean DEFAULT false,
  enable_calendar_sharing boolean DEFAULT false,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for bond_settings
CREATE INDEX IF NOT EXISTS idx_bond_settings_bond_id ON public.bond_settings(bond_id);

-- Enhance bonds table with additional fields
ALTER TABLE public.bonds
  ADD COLUMN IF NOT EXISTS max_members integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS tags text[],  -- Array of tags for categorization
  ADD COLUMN IF NOT EXISTS location text,  -- Optional location
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS established_date date,  -- When bond was formally established
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_bonds_tags ON public.bonds USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_bonds_last_activity ON public.bonds(last_activity_at DESC);

-- Enhance bond_members with additional fields
ALTER TABLE public.bond_members
  ADD COLUMN IF NOT EXISTS nickname text,  -- Nickname within this bond
  ADD COLUMN IF NOT EXISTS bio text,  -- Bio for this bond context
  ADD COLUMN IF NOT EXISTS avatar_url text,  -- Bond-specific avatar
  ADD COLUMN IF NOT EXISTS joined_via text DEFAULT 'invite_code',  -- 'invite_code', 'direct_add', 'admin'
  ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invitation_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS notes text;  -- Admin/manager notes about member

-- Create indexes for enhanced fields
CREATE INDEX IF NOT EXISTS idx_bond_members_last_active ON public.bond_members(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_bond_members_role ON public.bond_members(role_in_bond);

-- Create function to log bond activity
CREATE OR REPLACE FUNCTION public.log_bond_activity(
  p_bond_id uuid,
  p_user_id uuid,
  p_activity_type text,
  p_activity_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO public.bond_activity_log (
    bond_id,
    user_id,
    activity_type,
    activity_description,
    metadata
  ) VALUES (
    p_bond_id,
    p_user_id,
    p_activity_type,
    p_activity_description,
    p_metadata
  )
  RETURNING id INTO activity_id;
  
  -- Update bond's last_activity_at
  UPDATE public.bonds
  SET last_activity_at = now()
  WHERE id = p_bond_id;
  
  RETURN activity_id;
END;
$$;

-- Create function to get bond statistics
CREATE OR REPLACE FUNCTION public.get_bond_statistics(p_bond_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_members', (
      SELECT COUNT(*) FROM public.bond_members
      WHERE bond_id = p_bond_id AND is_active = true
    ),
    'total_tasks', (
      SELECT COUNT(*) FROM public.tasks
      WHERE assigned_to IN (
        SELECT user_id FROM public.bond_members
        WHERE bond_id = p_bond_id AND is_active = true
      )
    ),
    'completed_tasks', (
      SELECT COUNT(*) FROM public.tasks
      WHERE assigned_to IN (
        SELECT user_id FROM public.bond_members
        WHERE bond_id = p_bond_id AND is_active = true
      )
      AND status IN ('completed', 'approved')
    ),
    'total_points', (
      SELECT COALESCE(SUM(points), 0) FROM public.points_ledger
      WHERE user_id IN (
        SELECT user_id FROM public.bond_members
        WHERE bond_id = p_bond_id AND is_active = true
      )
    ),
    'recent_activity_count', (
      SELECT COUNT(*) FROM public.bond_activity_log
      WHERE bond_id = p_bond_id
      AND created_at > now() - interval '7 days'
    ),
    'members_by_role', (
      SELECT jsonb_object_agg(role_in_bond, count)
      FROM (
        SELECT role_in_bond, COUNT(*) as count
        FROM public.bond_members
        WHERE bond_id = p_bond_id AND is_active = true
        GROUP BY role_in_bond
      ) role_counts
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Create trigger to auto-create bond_settings when bond is created
CREATE OR REPLACE FUNCTION public.create_bond_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.bond_settings (bond_id)
  VALUES (NEW.id)
  ON CONFLICT (bond_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_bond_settings_trigger
  AFTER INSERT ON public.bonds
  FOR EACH ROW
  EXECUTE FUNCTION public.create_bond_settings();

-- Create trigger to log member joins (INSERT only)
CREATE OR REPLACE FUNCTION public.log_member_join()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    PERFORM public.log_bond_activity(
      NEW.bond_id,
      NEW.user_id,
      'member_joined',
      'Member joined the bond',
      jsonb_build_object(
        'member_id', NEW.id,
        'role', NEW.role_in_bond,
        'joined_via', NEW.joined_via
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_member_join_trigger
  AFTER INSERT ON public.bond_members
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.log_member_join();

-- Create trigger to log member leaves
CREATE OR REPLACE FUNCTION public.log_member_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    PERFORM public.log_bond_activity(
      OLD.bond_id,
      OLD.user_id,
      'member_left',
      'Member left the bond',
      jsonb_build_object(
        'member_id', OLD.id,
        'role', OLD.role_in_bond
      )
    );
    
    -- Update left_at timestamp
    NEW.left_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_member_leave_trigger
  AFTER UPDATE ON public.bond_members
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = false)
  EXECUTE FUNCTION public.log_member_leave();

-- Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role_in_bond IS NOT NULL AND NEW.role_in_bond IS NOT NULL AND OLD.role_in_bond != NEW.role_in_bond THEN
    PERFORM public.log_bond_activity(
      NEW.bond_id,
      NEW.user_id,
      'member_role_changed',
      'Member role changed',
      jsonb_build_object(
        'member_id', NEW.id,
        'old_role', OLD.role_in_bond,
        'new_role', NEW.role_in_bond
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_role_change_trigger
  AFTER UPDATE ON public.bond_members
  FOR EACH ROW
  WHEN (OLD.role_in_bond IS NOT NULL AND NEW.role_in_bond IS NOT NULL AND OLD.role_in_bond != NEW.role_in_bond)
  EXECUTE FUNCTION public.log_role_change();

-- Create trigger to update bond updated_at
CREATE TRIGGER bond_settings_updated_at
  BEFORE UPDATE ON public.bond_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on new tables
ALTER TABLE public.bond_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bond_activity_log
CREATE POLICY "Bond members can view activity logs"
ON public.bond_activity_log FOR SELECT
TO authenticated
USING (
  public.is_bond_member(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- RLS Policies for bond_settings
CREATE POLICY "Bond members can view settings"
ON public.bond_settings FOR SELECT
TO authenticated
USING (
  public.is_bond_member(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

CREATE POLICY "Bond managers can update settings"
ON public.bond_settings FOR UPDATE
TO authenticated
USING (
  public.can_manage_bond(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- Comments for documentation
COMMENT ON TABLE public.bond_activity_log IS 
  'Audit trail of all activities within a bond for transparency and accountability.';

COMMENT ON TABLE public.bond_settings IS 
  'Bond-specific settings and preferences that control behavior and features.';

COMMENT ON FUNCTION public.log_bond_activity IS 
  'Logs an activity event for a bond and updates the bond''s last_activity_at timestamp.';

COMMENT ON FUNCTION public.get_bond_statistics IS 
  'Returns comprehensive statistics about a bond including member counts, task statistics, and activity metrics.';
