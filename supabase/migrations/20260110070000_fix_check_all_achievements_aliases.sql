-- Fix check_all_achievements function to use explicit table aliases
-- This resolves "column reference 'title' is ambiguous" errors
-- The fix uses explicit aliases for each function call in UNION ALL
-- CRITICAL: Must use fully qualified column references (alias.column) to avoid ambiguity

CREATE OR REPLACE FUNCTION public.check_all_achievements(p_user_id uuid, p_bond_id uuid DEFAULT NULL)
RETURNS TABLE(unlocked_achievement_id uuid, achievement_code text, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use subqueries to isolate column references from RETURN TABLE scope
  -- This prevents PL/pgSQL from confusing RETURN TABLE column names with SELECT aliases
  -- The subquery creates a new scope where 'title' refers only to the function result column
  RETURN QUERY
    SELECT
      result.unlocked_achievement_id,
      result.achievement_code,
      result.title
    FROM (
      SELECT
        streak.unlocked_achievement_id,
        streak.achievement_code,
        streak.title
      FROM public.check_task_streak_achievements(p_user_id, p_bond_id) AS streak
    ) AS result
    UNION ALL
    SELECT
      result.unlocked_achievement_id,
      result.achievement_code,
      result.title
    FROM (
      SELECT
        milestone.unlocked_achievement_id,
        milestone.achievement_code,
        milestone.title
      FROM public.check_task_milestone_achievements(p_user_id, p_bond_id) AS milestone
    ) AS result
    UNION ALL
    SELECT
      result.unlocked_achievement_id,
      result.achievement_code,
      result.title
    FROM (
      SELECT
        checkin.unlocked_achievement_id,
        checkin.achievement_code,
        checkin.title
      FROM public.check_checkin_streak_achievements(p_user_id, p_bond_id) AS checkin
    ) AS result
    UNION ALL
    SELECT
      result.unlocked_achievement_id,
      result.achievement_code,
      result.title
    FROM (
      SELECT
        points.unlocked_achievement_id,
        points.achievement_code,
        points.title
      FROM public.check_points_milestone_achievements(p_user_id, p_bond_id) AS points
    ) AS result;

  RETURN;
END;
$$;
