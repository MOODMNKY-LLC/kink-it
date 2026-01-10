-- Create Achievements System
-- Implements Module 3: Rewards & Recognition - Achievement System
-- Auto-unlocks achievements based on user activity

-- ============================================================================
-- ACHIEVEMENT TYPES & CATEGORIES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE achievement_category AS ENUM (
    'consistency',
    'milestone',
    'completion_rate',
    'check_in',
    'points',
    'relationship'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE achievement_rarity AS ENUM (
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ACHIEVEMENTS TABLE (Master List)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- Unique identifier (e.g., 'streak_7_days')
  title text NOT NULL,
  description text NOT NULL,
  category achievement_category NOT NULL,
  rarity achievement_rarity NOT NULL DEFAULT 'common'::achievement_rarity,
  icon text, -- Icon identifier or emoji
  unlock_criteria jsonb NOT NULL, -- Flexible criteria storage
  point_value integer DEFAULT 0, -- Points awarded on unlock
  display_order integer DEFAULT 0, -- For sorting in UI
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- USER ACHIEVEMENTS TABLE (Unlocks & Progress)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  bond_id uuid, -- Track per bond (FK constraint added in later migration after bonds table exists)
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  progress_data jsonb DEFAULT '{}'::jsonb, -- Store progress toward unlock
  notification_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id, bond_id) -- One unlock per user per achievement per bond
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON public.achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON public.achievements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_achievements_display_order ON public.achievements(display_order);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_bond_id ON public.user_achievements(bond_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "achievements_select_all" ON public.achievements;
DROP POLICY IF EXISTS "user_achievements_select_own" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_select_partner" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_select_bond" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_insert_system" ON public.user_achievements;

-- Achievements are public (all users can view active ones)
CREATE POLICY "achievements_select_all"
ON public.achievements FOR SELECT
USING (is_active = true);

-- Users can view their own achievements
CREATE POLICY "user_achievements_select_own"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Partners can view each other's achievements (transparency)
CREATE POLICY "user_achievements_select_partner"
ON public.user_achievements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND partner_id = user_achievements.user_id
  )
);

-- Bond members can view achievements within their bond
-- Note: This policy will be updated in a later migration after bond_members table exists
-- For now, allow viewing if bond_id is NULL (global achievements)
CREATE POLICY "user_achievements_select_bond"
ON public.user_achievements FOR SELECT
USING (bond_id IS NULL);

-- System can insert unlocks (via triggers/functions)
CREATE POLICY "user_achievements_insert_system"
ON public.user_achievements FOR INSERT
WITH CHECK (true); -- Unlocks happen via functions, not direct user action

-- ============================================================================
-- ACHIEVEMENT UNLOCK DETECTION FUNCTIONS
-- ============================================================================

-- Function to check and unlock task completion streak achievements
CREATE OR REPLACE FUNCTION public.check_task_streak_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_streak integer;
  max_streak integer;
  achievement_record RECORD;
BEGIN
  -- Calculate current streak (consecutive days with at least one completed task)
  WITH daily_completions AS (
    SELECT 
      DATE(completed_at) as completion_date,
      COUNT(*) as tasks_completed
    FROM public.tasks
    WHERE assigned_to = p_user_id
      AND status = 'completed'
      AND completed_at IS NOT NULL
      -- Note: bond_members check will be added in later migration
      -- For now, allow if p_bond_id is NULL
      AND p_bond_id IS NULL
    GROUP BY DATE(completed_at)
    ORDER BY completion_date DESC
  ),
  streak_calc AS (
    SELECT 
      completion_date,
      ROW_NUMBER() OVER (ORDER BY completion_date DESC) as day_number,
      completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1) * INTERVAL '1 day' as streak_group
    FROM daily_completions
  )
  SELECT COUNT(DISTINCT streak_group) INTO current_streak
  FROM streak_calc
  WHERE completion_date >= CURRENT_DATE - INTERVAL '100 days'
  LIMIT 1;

  -- Check for streak achievements (7, 30, 100 days)
  -- Use fully qualified column names to avoid conflict with RETURN TABLE column 'title'
  FOR achievement_record IN
    SELECT achievements.id, achievements.code, achievements.title, achievements.unlock_criteria
    FROM public.achievements
    WHERE category = 'consistency'
      AND code LIKE 'task_streak_%'
      AND is_active = true
      AND (unlock_criteria->>'streak_days')::integer <= COALESCE(current_streak, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id
          AND achievement_id = achievements.id
          AND (p_bond_id IS NULL OR bond_id = p_bond_id)
      )
  LOOP
    -- Insert unlock
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;

    -- Award points if achievement has point value
    IF EXISTS (SELECT 1 FROM public.achievements WHERE id = achievement_record.id AND point_value > 0) THEN
      INSERT INTO public.points_ledger (workspace_id, user_id, points, reason, source_type, source_id)
      SELECT 
        COALESCE(p_bond_id, p_user_id),
        p_user_id,
        (SELECT point_value FROM public.achievements WHERE id = achievement_record.id),
        'Achievement unlocked: ' || achievement_record.title,
        'reward',
        achievement_record.id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id AND achievement_id = achievement_record.id
        AND notification_sent = true
      );
    END IF;

    -- Return unlocked achievement
    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;

  RETURN;
END;
$$;

-- Function to check and unlock task milestone achievements
CREATE OR REPLACE FUNCTION public.check_task_milestone_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_completed integer;
  achievement_record RECORD;
BEGIN
  -- Count total completed tasks
  SELECT COUNT(*) INTO total_completed
  FROM public.tasks
  WHERE assigned_to = p_user_id
    AND status = 'completed'
    -- Note: bond_members check will be added in later migration
    -- For now, allow if p_bond_id is NULL
    AND p_bond_id IS NULL;

  -- Check for milestone achievements
  -- Use fully qualified column names to avoid conflict with RETURN TABLE column 'title'
  FOR achievement_record IN
    SELECT achievements.id, achievements.code, achievements.title, achievements.unlock_criteria
    FROM public.achievements
    WHERE category = 'milestone'
      AND code LIKE 'tasks_completed_%'
      AND is_active = true
      AND (unlock_criteria->>'task_count')::integer <= total_completed
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id
          AND achievement_id = achievements.id
          AND (p_bond_id IS NULL OR bond_id = p_bond_id)
      )
  LOOP
    -- Insert unlock
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;

    -- Award points
    IF EXISTS (SELECT 1 FROM public.achievements WHERE id = achievement_record.id AND point_value > 0) THEN
      INSERT INTO public.points_ledger (workspace_id, user_id, points, reason, source_type, source_id)
      SELECT 
        COALESCE(p_bond_id, p_user_id),
        p_user_id,
        (SELECT point_value FROM public.achievements WHERE id = achievement_record.id),
        'Achievement unlocked: ' || achievement_record.title,
        'reward',
        achievement_record.id;
    END IF;

    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;

  RETURN;
END;
$$;

-- Function to check and unlock check-in streak achievements
CREATE OR REPLACE FUNCTION public.check_checkin_streak_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_streak integer;
  achievement_record RECORD;
BEGIN
  -- Calculate current check-in streak
  WITH daily_checkins AS (
    SELECT DISTINCT check_in_date
    FROM public.check_ins
    WHERE user_id = p_user_id
      AND check_in_date >= CURRENT_DATE - INTERVAL '100 days'
    ORDER BY check_in_date DESC
  ),
  streak_calc AS (
    SELECT 
      check_in_date,
      ROW_NUMBER() OVER (ORDER BY check_in_date DESC) as day_number,
      check_in_date - (ROW_NUMBER() OVER (ORDER BY check_in_date DESC) - 1) * INTERVAL '1 day' as streak_group
    FROM daily_checkins
  )
  SELECT COUNT(DISTINCT streak_group) INTO current_streak
  FROM streak_calc
  WHERE check_in_date >= CURRENT_DATE - INTERVAL '100 days'
  LIMIT 1;

  -- Check for check-in streak achievements
  FOR achievement_record IN
    SELECT id, code, title, unlock_criteria
    FROM public.achievements
    WHERE category = 'check_in'
      AND code LIKE 'checkin_streak_%'
      AND is_active = true
      AND (unlock_criteria->>'streak_days')::integer <= COALESCE(current_streak, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id
          AND achievement_id = achievements.id
          AND (p_bond_id IS NULL OR bond_id = p_bond_id)
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;

    IF EXISTS (SELECT 1 FROM public.achievements WHERE id = achievement_record.id AND point_value > 0) THEN
      INSERT INTO public.points_ledger (workspace_id, user_id, points, reason, source_type, source_id)
      SELECT 
        COALESCE(p_bond_id, p_user_id),
        p_user_id,
        (SELECT point_value FROM public.achievements WHERE id = achievement_record.id),
        'Achievement unlocked: ' || achievement_record.title,
        'reward',
        achievement_record.id;
    END IF;

    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;

  RETURN;
END;
$$;

-- Function to check and unlock points milestone achievements
CREATE OR REPLACE FUNCTION public.check_points_milestone_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points integer;
  achievement_record RECORD;
BEGIN
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM public.points_ledger
  WHERE user_id = p_user_id
    AND (p_bond_id IS NULL OR workspace_id = p_bond_id);

  -- Check for points milestone achievements
  -- Use fully qualified column names to avoid conflict with RETURN TABLE column 'title'
  FOR achievement_record IN
    SELECT achievements.id, achievements.code, achievements.title, achievements.unlock_criteria
    FROM public.achievements
    WHERE category = 'points'
      AND code LIKE 'points_%'
      AND is_active = true
      AND (unlock_criteria->>'points_required')::integer <= total_points
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id
          AND achievement_id = achievements.id
          AND (p_bond_id IS NULL OR bond_id = p_bond_id)
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;

    IF EXISTS (SELECT 1 FROM public.achievements WHERE id = achievement_record.id AND point_value > 0) THEN
      INSERT INTO public.points_ledger (workspace_id, user_id, points, reason, source_type, source_id)
      SELECT 
        COALESCE(p_bond_id, p_user_id),
        p_user_id,
        (SELECT point_value FROM public.achievements WHERE id = achievement_record.id),
        'Achievement unlocked: ' || achievement_record.title,
        'reward',
        achievement_record.id;
    END IF;

    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;

  RETURN;
END;
$$;

-- Master function to check all achievement types
-- NOTE: This function is replaced by migration 20260110070000_fix_check_all_achievements_aliases.sql
-- to fix ambiguous column reference errors. This version is kept for reference but will be overridden.
CREATE OR REPLACE FUNCTION public.check_all_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use table aliases for each function call to avoid column name ambiguity
  -- This resolves the "column reference 'title' is ambiguous" error
  RETURN QUERY
    SELECT
      streak.unlocked_achievement_id,
      streak.achievement_code,
      streak.title
    FROM public.check_task_streak_achievements(p_user_id, p_bond_id) AS streak
    UNION ALL
    SELECT
      milestone.unlocked_achievement_id,
      milestone.achievement_code,
      milestone.title
    FROM public.check_task_milestone_achievements(p_user_id, p_bond_id) AS milestone
    UNION ALL
    SELECT
      checkin.unlocked_achievement_id,
      checkin.achievement_code,
      checkin.title
    FROM public.check_checkin_streak_achievements(p_user_id, p_bond_id) AS checkin
    UNION ALL
    SELECT
      points.unlocked_achievement_id,
      points.achievement_code,
      points.title
    FROM public.check_points_milestone_achievements(p_user_id, p_bond_id) AS points;

  RETURN;
END;
$$;

-- ============================================================================
-- SEED INITIAL ACHIEVEMENTS
-- ============================================================================

-- Task Streak Achievements
INSERT INTO public.achievements (code, title, description, category, rarity, icon, unlock_criteria, point_value, display_order) VALUES
('task_streak_7', 'Week Warrior', 'Complete tasks for 7 consecutive days', 'consistency'::achievement_category, 'common'::achievement_rarity, '🔥', '{"streak_days": 7}'::jsonb, 50, 1),
('task_streak_30', 'Monthly Master', 'Complete tasks for 30 consecutive days', 'consistency'::achievement_category, 'uncommon'::achievement_rarity, '⭐', '{"streak_days": 30}'::jsonb, 200, 2),
('task_streak_100', 'Centurion', 'Complete tasks for 100 consecutive days', 'consistency'::achievement_category, 'rare'::achievement_rarity, '👑', '{"streak_days": 100}'::jsonb, 500, 3)
ON CONFLICT (code) DO NOTHING;

-- Task Milestone Achievements
INSERT INTO public.achievements (code, title, description, category, rarity, icon, unlock_criteria, point_value, display_order) VALUES
('tasks_completed_1', 'First Steps', 'Complete your first task', 'milestone'::achievement_category, 'common'::achievement_rarity, '🎯', '{"task_count": 1}'::jsonb, 10, 10),
('tasks_completed_10', 'Getting Started', 'Complete 10 tasks', 'milestone'::achievement_category, 'common'::achievement_rarity, '📝', '{"task_count": 10}'::jsonb, 50, 11),
('tasks_completed_50', 'Dedicated', 'Complete 50 tasks', 'milestone'::achievement_category, 'uncommon'::achievement_rarity, '💪', '{"task_count": 50}'::jsonb, 150, 12),
('tasks_completed_100', 'Century Club', 'Complete 100 tasks', 'milestone'::achievement_category, 'rare'::achievement_rarity, '🏆', '{"task_count": 100}'::jsonb, 300, 13),
('tasks_completed_500', 'Legend', 'Complete 500 tasks', 'milestone'::achievement_category, 'epic'::achievement_rarity, '🌟', '{"task_count": 500}'::jsonb, 1000, 14)
ON CONFLICT (code) DO NOTHING;

-- Check-in Streak Achievements
INSERT INTO public.achievements (code, title, description, category, rarity, icon, unlock_criteria, point_value, display_order) VALUES
('checkin_streak_7', 'Consistent Check-In', 'Check in for 7 consecutive days', 'check_in'::achievement_category, 'common'::achievement_rarity, '📅', '{"streak_days": 7}'::jsonb, 30, 20),
('checkin_streak_30', 'Monthly Check-In', 'Check in for 30 consecutive days', 'check_in'::achievement_category, 'uncommon'::achievement_rarity, '📆', '{"streak_days": 30}'::jsonb, 150, 21)
ON CONFLICT (code) DO NOTHING;

-- Points Milestone Achievements
INSERT INTO public.achievements (code, title, description, category, rarity, icon, unlock_criteria, point_value, display_order) VALUES
('points_100', 'Point Collector', 'Earn 100 points', 'points'::achievement_category, 'common'::achievement_rarity, '💰', '{"points_required": 100}'::jsonb, 25, 30),
('points_500', 'Point Master', 'Earn 500 points', 'points'::achievement_category, 'uncommon'::achievement_rarity, '💎', '{"points_required": 500}'::jsonb, 100, 31),
('points_1000', 'Point Champion', 'Earn 1,000 points', 'points'::achievement_category, 'rare'::achievement_rarity, '💍', '{"points_required": 1000}'::jsonb, 250, 32),
('points_5000', 'Point Legend', 'Earn 5,000 points', 'points'::achievement_category, 'epic'::achievement_rarity, '👑', '{"points_required": 5000}'::jsonb, 500, 33)
ON CONFLICT (code) DO NOTHING;
