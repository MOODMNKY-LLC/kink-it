-- Migration: Copy Seed Data to Bond Function
-- Creates a function to copy comprehensive seed data from seed bond to user's new bond
-- This allows users to get example data during onboarding to understand how KINK IT works
-- Date: 2026-02-15

-- Seed bond ID constant
-- This is the bond that contains all seed data examples
DO $$
DECLARE
  SEED_BOND_ID uuid := '40000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Function will use this constant
  NULL;
END $$;

-- Create function to copy seed data from seed bond to user's bond
CREATE OR REPLACE FUNCTION public.copy_seed_data_to_bond(
  p_bond_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
  SEED_BOND_ID uuid := '40000000-0000-0000-0000-000000000001'::uuid;
  v_rules_count integer := 0;
  v_boundaries_count integer := 0;
  v_contracts_count integer := 0;
  v_tasks_count integer := 0;
  v_rewards_count integer := 0;
  v_journal_count integer := 0;
  v_calendar_count integer := 0;
  v_resources_count integer := 0;
  v_result jsonb;
BEGIN
  -- Validate inputs
  IF p_bond_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'bond_id and user_id are required';
  END IF;

  -- Verify bond exists and user is a member
  IF NOT EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = p_bond_id
    AND user_id = p_user_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User must be an active member of the bond';
  END IF;

  -- Get user's role for task assignment
  -- For seed data, we'll assign tasks to the user regardless of role
  -- This makes examples work for both dominants and submissives

  -- ============================================================================
  -- COPY RULES
  -- ============================================================================
  INSERT INTO public.rules (
    bond_id,
    title,
    description,
    category,
    status,
    priority,
    created_by,
    effective_from,
    effective_until,
    metadata
  )
  SELECT
    p_bond_id, -- New bond_id
    title,
    description,
    category,
    status,
    priority,
    p_user_id, -- New created_by
    effective_from,
    effective_until,
    metadata
  FROM public.rules
  WHERE bond_id = SEED_BOND_ID
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_rules_count = ROW_COUNT;

  -- ============================================================================
  -- COPY BOUNDARIES
  -- ============================================================================
  INSERT INTO public.boundaries (
    bond_id,
    activity_name,
    category,
    user_rating,
    partner_rating,
    user_experience,
    partner_experience,
    notes,
    is_mutual,
    created_by,
    metadata
  )
  SELECT
    p_bond_id, -- New bond_id
    activity_name,
    category,
    user_rating,
    partner_rating,
    user_experience,
    partner_experience,
    notes,
    is_mutual,
    p_user_id, -- New created_by
    metadata
  FROM public.boundaries
  WHERE bond_id = SEED_BOND_ID
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_boundaries_count = ROW_COUNT;

  -- ============================================================================
  -- COPY CONTRACTS
  -- ============================================================================
  INSERT INTO public.contracts (
    bond_id,
    title,
    content,
    version,
    status,
    created_by,
    effective_from,
    effective_until,
    metadata
  )
  SELECT
    p_bond_id, -- New bond_id
    title,
    content,
    version,
    'draft'::contract_status, -- Set to draft so user can review before activating
    p_user_id, -- New created_by
    effective_from,
    effective_until,
    metadata
  FROM public.contracts
  WHERE bond_id = SEED_BOND_ID
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_contracts_count = ROW_COUNT;

  -- ============================================================================
  -- COPY TASKS
  -- ============================================================================
  -- Note: Tasks use workspace_id with user IDs, not bond IDs
  -- So we copy tasks where assigned_to is one of the seed users
  -- For tasks, assign both assigned_by and assigned_to to the user
  -- This makes examples work regardless of role
  INSERT INTO public.tasks (
    workspace_id, -- Use user_id as workspace_id (current schema)
    title,
    description,
    priority,
    status,
    due_date,
    point_value,
    proof_required,
    proof_type,
    assigned_by,
    assigned_to,
    completed_at,
    approved_at,
    completion_notes,
    extension_requested,
    extension_reason,
    created_at,
    updated_at
  )
  SELECT
    p_user_id, -- New workspace_id (user_id)
    title,
    description,
    priority,
    'pending'::task_status, -- Reset to pending so user can see examples
    due_date,
    point_value,
    proof_required,
    proof_type,
    p_user_id, -- New assigned_by
    p_user_id, -- New assigned_to (self-assigned examples)
    NULL, -- Reset completed_at
    NULL, -- Reset approved_at
    NULL, -- Reset completion_notes
    false, -- Reset extension_requested
    NULL, -- Reset extension_reason
    now(), -- New created_at
    now() -- New updated_at
  FROM public.tasks
  WHERE assigned_to IN (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
    '00000000-0000-0000-0000-000000000002'::uuid  -- Kevin
  )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_tasks_count = ROW_COUNT;

  -- ============================================================================
  -- COPY REWARDS
  -- ============================================================================
  -- Note: Rewards use workspace_id with user IDs, not bond IDs
  -- So we copy rewards where assigned_to is one of the seed users
  INSERT INTO public.rewards (
    workspace_id, -- Use user_id as workspace_id (current schema)
    reward_type,
    title,
    description,
    point_value,
    point_cost,
    love_language,
    assigned_by,
    assigned_to,
    task_id,
    status,
    redeemed_at,
    completed_at,
    created_at,
    updated_at
  )
  SELECT
    p_user_id, -- New workspace_id (user_id)
    reward_type,
    title,
    description,
    point_value,
    point_cost,
    love_language,
    p_user_id, -- New assigned_by
    p_user_id, -- New assigned_to (self-assigned examples)
    task_id, -- Keep task_id if it exists
    'available'::reward_status, -- Reset to available
    NULL, -- Reset redeemed_at
    NULL, -- Reset completed_at
    now(), -- New created_at
    now() -- New updated_at
  FROM public.rewards
  WHERE assigned_to IN (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
    '00000000-0000-0000-0000-000000000002'::uuid  -- Kevin
  )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_rewards_count = ROW_COUNT;

  -- ============================================================================
  -- COPY JOURNAL ENTRIES
  -- ============================================================================
  INSERT INTO public.journal_entries (
    bond_id,
    title,
    content,
    entry_type,
    tags,
    created_by,
    created_at,
    updated_at,
    metadata
  )
  SELECT
    p_bond_id, -- New bond_id
    title,
    content,
    entry_type,
    tags,
    p_user_id, -- New created_by
    now(), -- New created_at
    now(), -- New updated_at
    metadata
  FROM public.journal_entries
  WHERE bond_id = SEED_BOND_ID
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_journal_count = ROW_COUNT;

  -- ============================================================================
  -- COPY CALENDAR EVENTS
  -- ============================================================================
  INSERT INTO public.calendar_events (
    bond_id,
    title,
    description,
    event_type,
    start_date,
    end_date,
    all_day,
    reminder_minutes,
    created_by,
    created_at,
    updated_at,
    metadata
  )
  SELECT
    p_bond_id, -- New bond_id
    title,
    description,
    event_type,
    start_date,
    end_date,
    all_day,
    reminder_minutes,
    p_user_id, -- New created_by
    now(), -- New created_at
    now(), -- New updated_at
    metadata
  FROM public.calendar_events
  WHERE bond_id = SEED_BOND_ID
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_calendar_count = ROW_COUNT;

  -- ============================================================================
  -- COPY RESOURCES
  -- ============================================================================
  INSERT INTO public.resources (
    bond_id,
    title,
    description,
    url,
    resource_type,
    category,
    tags,
    rating,
    notes,
    added_by,
    created_at,
    updated_at,
    metadata
  )
  SELECT
    p_bond_id, -- New bond_id
    title,
    description,
    url,
    resource_type,
    category,
    tags,
    rating,
    notes,
    p_user_id, -- New added_by
    now(), -- New created_at
    now(), -- New updated_at
    metadata
  FROM public.resources
  WHERE bond_id = SEED_BOND_ID
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_resources_count = ROW_COUNT;

  -- Build result summary
  v_result := jsonb_build_object(
    'success', true,
    'bond_id', p_bond_id,
    'user_id', p_user_id,
    'copied', jsonb_build_object(
      'rules', v_rules_count,
      'boundaries', v_boundaries_count,
      'contracts', v_contracts_count,
      'tasks', v_tasks_count,
      'rewards', v_rewards_count,
      'journal_entries', v_journal_count,
      'calendar_events', v_calendar_count,
      'resources', v_resources_count
    ),
    'total', v_rules_count + v_boundaries_count + v_contracts_count + 
             v_tasks_count + v_rewards_count + v_journal_count + 
             v_calendar_count + v_resources_count
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error in JSON format
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.copy_seed_data_to_bond(uuid, uuid) IS 
  'Copies comprehensive seed data from the seed bond to a user''s new bond. 
   This function is used during onboarding to provide users with example data 
   that helps them understand how KINK IT works. All foreign keys are updated 
   to reference the new bond and user. Tasks and rewards are self-assigned 
   to work for both dominants and submissives.';
