-- Fix ambiguous column reference 'title' in all achievement check functions
-- Issue: RETURN TABLE column names become PL/pgSQL variables, causing ambiguity
-- Solution: Use table aliases (a.id, a.code, a.title) instead of unqualified column names

-- Fix check_task_streak_achievements
CREATE OR REPLACE FUNCTION public.check_task_streak_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_streak integer;
  achievement_record RECORD;
BEGIN
  WITH daily_completions AS (
    SELECT DATE(completed_at) as completion_date
    FROM public.tasks
    WHERE assigned_to = p_user_id AND status = 'completed' AND completed_at IS NOT NULL AND p_bond_id IS NULL
    GROUP BY DATE(completed_at) ORDER BY completion_date DESC
  ),
  streak_calc AS (
    SELECT completion_date,
      ROW_NUMBER() OVER (ORDER BY completion_date DESC) as day_number,
      completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1) * INTERVAL '1 day' as streak_group
    FROM daily_completions
  )
  SELECT COUNT(DISTINCT streak_group) INTO current_streak
  FROM streak_calc WHERE completion_date >= CURRENT_DATE - INTERVAL '100 days' LIMIT 1;

  -- Use table alias 'a' to avoid RETURN TABLE column name conflict
  FOR achievement_record IN
    SELECT a.id, a.code, a.title, a.unlock_criteria
    FROM public.achievements a
    WHERE a.category = 'consistency' AND a.code LIKE 'task_streak_%' AND a.is_active = true
      AND (a.unlock_criteria->>'streak_days')::integer <= COALESCE(current_streak, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id AND (p_bond_id IS NULL OR ua.bond_id = p_bond_id)
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;
    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;
  RETURN;
END;
$$;

-- Fix check_task_milestone_achievements
CREATE OR REPLACE FUNCTION public.check_task_milestone_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  total_completed integer;
  achievement_record RECORD;
BEGIN
  SELECT COUNT(*) INTO total_completed FROM public.tasks
  WHERE assigned_to = p_user_id AND status = 'completed' AND p_bond_id IS NULL;

  -- Use table alias 'a' to avoid RETURN TABLE column name conflict
  FOR achievement_record IN
    SELECT a.id, a.code, a.title, a.unlock_criteria FROM public.achievements a
    WHERE a.category = 'milestone' AND a.code LIKE 'tasks_completed_%' AND a.is_active = true
      AND (a.unlock_criteria->>'task_count')::integer <= total_completed
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id AND (p_bond_id IS NULL OR ua.bond_id = p_bond_id)
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;
    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;
  RETURN;
END;
$$;

-- Fix check_checkin_streak_achievements
CREATE OR REPLACE FUNCTION public.check_checkin_streak_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_streak integer;
  achievement_record RECORD;
BEGIN
  WITH daily_checkins AS (
    SELECT DATE(check_in_date) as check_in_date FROM public.check_ins
    WHERE user_id = p_user_id AND p_bond_id IS NULL
    GROUP BY DATE(check_in_date) ORDER BY check_in_date DESC
  ),
  streak_calc AS (
    SELECT check_in_date,
      ROW_NUMBER() OVER (ORDER BY check_in_date DESC) as day_number,
      check_in_date - (ROW_NUMBER() OVER (ORDER BY check_in_date DESC) - 1) * INTERVAL '1 day' as streak_group
    FROM daily_checkins
  )
  SELECT COUNT(DISTINCT streak_group) INTO current_streak
  FROM streak_calc WHERE check_in_date >= CURRENT_DATE - INTERVAL '100 days' LIMIT 1;

  -- Use table alias 'a' to avoid RETURN TABLE column name conflict
  FOR achievement_record IN
    SELECT a.id, a.code, a.title, a.unlock_criteria FROM public.achievements a
    WHERE a.category = 'check_in' AND a.code LIKE 'checkin_streak_%' AND a.is_active = true
      AND (a.unlock_criteria->>'streak_days')::integer <= COALESCE(current_streak, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id AND (p_bond_id IS NULL OR ua.bond_id = p_bond_id)
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;
    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;
  RETURN;
END;
$$;

-- Fix check_points_milestone_achievements
CREATE OR REPLACE FUNCTION public.check_points_milestone_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  total_points integer;
  achievement_record RECORD;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total_points FROM public.points_ledger
  WHERE user_id = p_user_id AND (p_bond_id IS NULL OR workspace_id = p_bond_id);

  -- Use table alias 'a' to avoid RETURN TABLE column name conflict
  FOR achievement_record IN
    SELECT a.id, a.code, a.title, a.unlock_criteria FROM public.achievements a
    WHERE a.category = 'points' AND a.code LIKE 'points_%' AND a.is_active = true
      AND (a.unlock_criteria->>'points_required')::integer <= total_points
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id AND (p_bond_id IS NULL OR ua.bond_id = p_bond_id)
      )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id, bond_id)
    VALUES (p_user_id, achievement_record.id, p_bond_id)
    ON CONFLICT (user_id, achievement_id, bond_id) DO NOTHING;
    RETURN QUERY SELECT achievement_record.id, achievement_record.code, achievement_record.title;
  END LOOP;
  RETURN;
END;
$$;

-- Fix check_all_achievements to use subqueries for isolation
CREATE OR REPLACE FUNCTION public.check_all_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Use subqueries to isolate column references from RETURN TABLE scope
  RETURN QUERY
    SELECT result.unlocked_achievement_id, result.achievement_code, result.title
    FROM (
      SELECT streak.unlocked_achievement_id, streak.achievement_code, streak.title
      FROM public.check_task_streak_achievements(p_user_id, p_bond_id) AS streak
    ) AS result
    UNION ALL
    SELECT result.unlocked_achievement_id, result.achievement_code, result.title
    FROM (
      SELECT milestone.unlocked_achievement_id, milestone.achievement_code, milestone.title
      FROM public.check_task_milestone_achievements(p_user_id, p_bond_id) AS milestone
    ) AS result
    UNION ALL
    SELECT result.unlocked_achievement_id, result.achievement_code, result.title
    FROM (
      SELECT checkin.unlocked_achievement_id, checkin.achievement_code, checkin.title
      FROM public.check_checkin_streak_achievements(p_user_id, p_bond_id) AS checkin
    ) AS result
    UNION ALL
    SELECT result.unlocked_achievement_id, result.achievement_code, result.title
    FROM (
      SELECT points.unlocked_achievement_id, points.achievement_code, points.title
      FROM public.check_points_milestone_achievements(p_user_id, p_bond_id) AS points
    ) AS result;
  RETURN;
END;
$$;
