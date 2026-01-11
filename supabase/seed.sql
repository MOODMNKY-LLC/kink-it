-- Seed data for KINK IT local development
-- This file creates test users, profiles, tasks, and related data for development and testing
-- Run with: supabase db reset (seed.sql runs automatically after migrations)

-- ============================================================================
-- TEST USERS (auth.users)
-- ============================================================================
-- Note: In Supabase local development, we can insert directly into auth.users
-- For production, use Supabase Auth API or Admin API

-- Simeon (Dominant) - First user becomes admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'simeon@kinkit.app',
  crypt('password123', gen_salt('bf')), -- Password: password123
  now(),
  jsonb_build_object(
    'name', 'Simeon',
    'full_name', 'Simeon',
    'display_name', 'Simeon',
    'dynamic_role', 'dominant'
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Kevin (Submissive)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'kevin@kinkit.app',
  crypt('password123', gen_salt('bf')), -- Password: password123
  now(),
  jsonb_build_object(
    'name', 'Kevin',
    'full_name', 'Kevin',
    'display_name', 'Kevin',
    'dynamic_role', 'submissive'
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROFILES
-- ============================================================================
-- Profiles are created automatically by handle_new_user() trigger, but we'll
-- update them to set partner relationships and additional data

-- Simeon's profile (Dominant, User - NOT admin, so first authenticated Notion user can become admin)
-- Note: Admin role will be assigned by handle_new_user() trigger to first authenticated Notion user
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  display_name,
  system_role,
  dynamic_role,
  partner_id,
  love_languages,
  hard_limits,
  soft_limits,
  notifications_enabled,
  theme_preference,
  submission_state -- Dominants don't use this, but column exists
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'simeon@kinkit.app',
  'Simeon',
  'Simeon',
  'user', -- Changed from 'admin' - seeded users should NOT be admin
  'dominant',
  '00000000-0000-0000-0000-000000000002'::uuid, -- Partner: Kevin
  ARRAY['words_of_affirmation', 'quality_time', 'physical_touch'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  true,
  'dark',
  'active' -- Default, not used for dominants
) ON CONFLICT (id) DO UPDATE SET
  partner_id = EXCLUDED.partner_id,
  love_languages = EXCLUDED.love_languages,
  -- Ensure seeded users never get admin role (even if updated)
  system_role = CASE WHEN profiles.system_role = 'admin' THEN 'user' ELSE EXCLUDED.system_role END;

-- Kevin's profile (Submissive)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  display_name,
  system_role,
  dynamic_role,
  partner_id,
  love_languages,
  hard_limits,
  soft_limits,
  notifications_enabled,
  theme_preference,
  submission_state
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'kevin@kinkit.app',
  'Kevin',
  'Kevin',
  'user',
  'submissive',
  '00000000-0000-0000-0000-000000000001'::uuid, -- Partner: Simeon
  ARRAY['acts_of_service', 'receiving_gifts', 'words_of_affirmation'],
  ARRAY['no_permanent_damage', 'no_public_humiliation'],
  ARRAY['light_impact', 'temperature_play'],
  true,
  'dark',
  'active' -- Starting state: active submission
) ON CONFLICT (id) DO UPDATE SET
  partner_id = EXCLUDED.partner_id,
  love_languages = EXCLUDED.love_languages,
  submission_state = EXCLUDED.submission_state;

-- ============================================================================
-- SUBMISSION STATE LOGS
-- ============================================================================
-- Create initial log entry for Kevin's active submission state
INSERT INTO public.submission_state_logs (
  user_id,
  workspace_id,
  previous_state,
  new_state,
  reason,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid, -- Kevin
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon's workspace
  NULL, -- No previous state (initial)
  'active',
  'Initial submission state - ready for tasks and protocols',
  now() - INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK TEMPLATES
-- ============================================================================
-- Create reusable task templates for common assignments

INSERT INTO public.task_templates (
  id,
  workspace_id,
  title,
  description,
  default_priority,
  default_point_value,
  proof_required,
  proof_type,
  created_by
) VALUES
-- Daily routine template
(
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon's workspace
  'Daily Check-In',
  'Complete your daily check-in form with mood, energy level, and any concerns.',
  'medium',
  10,
  true,
  'text',
  '00000000-0000-0000-0000-000000000001'::uuid -- Created by Simeon
),
-- Exercise template
(
  '10000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Exercise Routine',
  'Complete your assigned exercise routine for the day.',
  'high',
  20,
  true,
  'photo',
  '00000000-0000-0000-0000-000000000001'::uuid
),
-- Protocol template
(
  '10000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Protocol Review',
  'Review and acknowledge the updated protocol document.',
  'medium',
  15,
  true,
  'text',
  '00000000-0000-0000-0000-000000000001'::uuid
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TASKS
-- ============================================================================
-- Create sample tasks with various statuses for testing

INSERT INTO public.tasks (
  id,
  workspace_id,
  title,
  description,
  priority,
  status,
  due_date,
  point_value,
  proof_required,
  proof_type,
  template_id,
  assigned_by,
  assigned_to,
  completed_at,
  approved_at,
  completion_notes,
  created_at,
  updated_at
) VALUES
-- Pending task
(
  '20000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon's workspace
  'Complete Morning Routine',
  'Follow your morning protocol: meditation, journaling, and breakfast.',
  'high',
  'pending',
  now() + INTERVAL '1 day',
  25,
  true,
  'text',
  NULL,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Assigned by Simeon
  '00000000-0000-0000-0000-000000000002'::uuid, -- Assigned to Kevin
  NULL,
  NULL,
  NULL,
  now() - INTERVAL '1 day',
  now() - INTERVAL '1 day'
),
-- In progress task
(
  '20000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Daily Check-In',
  'Complete your daily check-in form.',
  'medium',
  'in_progress',
  now() + INTERVAL '6 hours',
  10,
  true,
  'text',
  '10000000-0000-0000-0000-000000000001'::uuid, -- Uses template
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  NULL,
  NULL,
  now() - INTERVAL '2 hours',
  now() - INTERVAL '30 minutes'
),
-- Completed task (awaiting approval)
(
  '20000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Exercise Routine',
  'Complete 30 minutes of cardio and strength training.',
  'high',
  'completed',
  now() - INTERVAL '1 day',
  20,
  true,
  'photo',
  '10000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  now() - INTERVAL '2 hours',
  NULL,
  'Completed all exercises as assigned. Feeling good!',
  now() - INTERVAL '2 days',
  now() - INTERVAL '2 hours'
),
-- Approved task
(
  '20000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Protocol Review',
  'Review the updated consent and protocol document.',
  'medium',
  'approved',
  now() - INTERVAL '3 days',
  15,
  true,
  'text',
  '10000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  now() - INTERVAL '3 days' + INTERVAL '2 hours',
  now() - INTERVAL '3 days' + INTERVAL '4 hours',
  'Reviewed and understood all protocols.',
  now() - INTERVAL '4 days',
  now() - INTERVAL '3 days' + INTERVAL '4 hours'
),
-- Low priority task
(
  '20000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Read Assigned Article',
  'Read the article about communication in D/s dynamics and prepare discussion points.',
  'low',
  'pending',
  now() + INTERVAL '3 days',
  5,
  false,
  NULL,
  NULL,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  NULL,
  NULL,
  now() - INTERVAL '5 hours',
  now() - INTERVAL '5 hours'
),
-- Urgent task
(
  '20000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Immediate Check-In Required',
  'Please check in immediately regarding your current state and any concerns.',
  'urgent',
  'pending',
  now() + INTERVAL '1 hour',
  0,
  true,
  'text',
  NULL,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  NULL,
  NULL,
  now() - INTERVAL '15 minutes',
  now() - INTERVAL '15 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TASK PROOF
-- ============================================================================
-- Create proof submissions for completed tasks

INSERT INTO public.task_proof (
  id,
  task_id,
  proof_type,
  proof_url,
  proof_text,
  submitted_at,
  created_by
) VALUES
-- Proof for completed exercise task
(
  '30000000-0000-0000-0000-000000000001'::uuid,
  '20000000-0000-0000-0000-000000000003'::uuid, -- Exercise Routine task
  'photo',
  'https://storage.supabase.co/kink-it/proofs/exercise-20260105.jpg', -- Placeholder URL
  NULL,
  now() - INTERVAL '2 hours',
  '00000000-0000-0000-0000-000000000002'::uuid -- Submitted by Kevin
),
-- Proof for protocol review
(
  '30000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000004'::uuid, -- Protocol Review task
  'text',
  NULL,
  'I have reviewed the updated protocol document dated 2026-01-02. I understand all sections including consent boundaries, communication protocols, and safety measures. I acknowledge my submission and agree to follow these guidelines.',
  now() - INTERVAL '3 days' + INTERVAL '2 hours',
  '00000000-0000-0000-0000-000000000002'::uuid
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Seed data created:
-- - 2 test users (Simeon: dominant/admin, Kevin: submissive)
-- - 2 profiles with partner relationships
-- - 1 submission state log entry
-- - 3 task templates
-- - 6 sample tasks (various statuses and priorities)
-- - 2 task proof submissions
--
-- Test credentials:
-- - Simeon: simeon@kinkit.app / password123
-- - Kevin: kevin@kinkit.app / password123
--
-- Note: In production, use Supabase Auth API to create users properly.
-- This seed file is for local development only.
