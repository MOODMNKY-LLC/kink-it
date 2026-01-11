-- Seed data for KINK IT local development
-- This file creates test users, profiles, tasks, and related data for development and testing
-- Run with: supabase db reset (seed.sql runs automatically after migrations)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- Ensure pgcrypto is enabled for password hashing
-- Set search path to include extensions schema for pgcrypto functions
SET search_path = public, extensions;

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
  extensions.crypt('password123', extensions.gen_salt('bf'::text)), -- Password: password123
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
  extensions.crypt('password123', extensions.gen_salt('bf'::text)), -- Password: password123
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
-- Note: bond_id will be set later after bond is created (to avoid foreign key constraint)
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
-- Note: bond_id will be set later after bond is created (to avoid foreign key constraint)
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
-- COMPREHENSIVE SEED DATA FOR ALL 12 MODULES
-- ============================================================================
-- Real-world examples for Bonds, Rules, Boundaries, Contracts, Communication, 
-- Tasks, Rewards, Achievements, Calendar, Journal, Analytics, Library
-- Date: 2026-02-15
-- This seed data provides users with realistic, editable examples
-- All seed data uses ON CONFLICT DO NOTHING to allow safe re-running

-- ============================================================================
-- MODULE 1: BONDS
-- ============================================================================
-- Create example bond with mission statement, roles, and symbols

-- Example Bond: "Simeon & Kevin's Dynamic"
-- Note: This bond has invite_code "SEED" for easy testing
INSERT INTO public.bonds (
  id,
  name,
  description,
  bond_type,
  bond_status,
  created_by,
  is_private,
  invite_code,
  metadata
) VALUES (
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Simeon & Kevin''s Dynamic',
  'A 24/7 D/s dynamic focused on structure, service, and mutual growth. This bond represents our commitment to power exchange, consent, and intentional dominance.',
  'dyad'::bond_type,
  'active'::bond_status,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Created by Simeon
  true,
  'SEED', -- Invite code for easy testing
  jsonb_build_object(
    'mission', 'To create a structured, consensual power exchange that supports both partners'' growth and fulfillment',
    'founded_date', '2025-01-15',
    'symbols', jsonb_build_array(
      'Morning coffee service ritual',
      'Evening kneeling ceremony',
      'Day collar (subtle reminder)'
    ),
    'honorifics', jsonb_build_object(
      'dominant', jsonb_build_array('Sir', 'Master', 'Daddy'),
      'submissive', jsonb_build_array('boy', 'pet', 'slave')
    )
  )
) ON CONFLICT (id) DO NOTHING;

-- Bond Members
INSERT INTO public.bond_members (
  id,
  bond_id,
  user_id,
  role_in_bond,
  is_active,
  can_invite,
  can_manage,
  joined_at
) VALUES
-- Simeon as Dominant
(
  '41000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
  'dominant',
  true,
  true,
  true,
  now() - INTERVAL '30 days'
),
-- Kevin as Submissive
(
  '41000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid, -- Kevin
  'submissive',
  true,
  false,
  false,
  now() - INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 2: RULES & PROTOCOLS
-- ============================================================================
-- 8 example rules covering various categories and priorities

INSERT INTO public.rules (
  id,
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
) VALUES
-- Morning greeting protocol
(
  '50000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Morning Greeting Protocol',
  'Upon waking, you will send a morning greeting message acknowledging the start of a new day under my authority. Include your current state (mood, energy level) and any immediate needs or concerns.',
  'protocol'::rule_category,
  'active'::rule_status,
  10,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('reminder_time', '08:00', 'required_fields', jsonb_build_array('mood', 'energy_level'))
),
-- Coffee service ritual
(
  '50000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Coffee Service Ritual',
  'Each morning, prepare and serve coffee according to established protocol. This includes proper presentation, timing, and respectful service posture.',
  'protocol'::rule_category,
  'active'::rule_status,
  9,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('ritual_steps', jsonb_build_array('prepare', 'present', 'serve', 'acknowledge'))
),
-- Evening kneeling ritual
(
  '50000000-0000-0000-0000-000000000003'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Evening Kneeling Ritual',
  'Each evening before bed, you will kneel and present yourself for review. This is a time for reflection, acknowledgment, and connection.',
  'protocol'::rule_category,
  'active'::rule_status,
  9,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('duration_minutes', 5, 'location', 'designated_space')
),
-- Permission systems
(
  '50000000-0000-0000-0000-000000000004'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Permission Systems',
  'You must request permission before: making purchases over $50, scheduling social activities, making significant decisions affecting the dynamic, or engaging in activities that require my awareness.',
  'standing'::rule_category,
  'active'::rule_status,
  8,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('requires_permission', jsonb_build_array('purchases_over_50', 'social_activities', 'significant_decisions'))
),
-- Meal reporting
(
  '50000000-0000-0000-0000-000000000005'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Meal Reporting',
  'Report all meals consumed throughout the day. Include time, food items, and portion sizes. This helps me ensure you are maintaining proper nutrition.',
  'standing'::rule_category,
  'active'::rule_status,
  7,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('reporting_times', jsonb_build_array('breakfast', 'lunch', 'dinner', 'snacks'))
),
-- Honorific usage
(
  '50000000-0000-0000-0000-000000000006'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Honorific Usage',
  'Use appropriate honorifics when addressing me in private settings. Preferred titles: Sir, Master, or Daddy depending on context. In public, use my name unless otherwise instructed.',
  'standing'::rule_category,
  'active'::rule_status,
  6,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('honorifics', jsonb_build_array('Sir', 'Master', 'Daddy'), 'context', 'private_settings')
),
-- Transparency default
(
  '50000000-0000-0000-0000-000000000007'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Transparency Default',
  'Personal journal entries are visible to me by default. This transparency supports accountability and connection. You may mark specific entries as private if needed, but the default is openness.',
  'standing'::rule_category,
  'active'::rule_status,
  5,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  NULL,
  jsonb_build_object('default_visibility', 'dominant', 'can_mark_private', true)
),
-- Weekly reflection (temporary rule)
(
  '50000000-0000-0000-0000-000000000008'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Weekly Reflection',
  'Each Sunday evening, complete a weekly reflection covering: accomplishments, challenges, growth areas, and goals for the coming week. This temporary rule will be reviewed after 4 weeks.',
  'temporary'::rule_category,
  'active'::rule_status,
  4,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '2 weeks',
  now() + INTERVAL '2 weeks',
  jsonb_build_object('review_date', (now() + INTERVAL '2 weeks')::text, 'day_of_week', 'Sunday')
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 3: BOUNDARIES
-- ============================================================================
-- 15 example activities across all categories with various ratings

INSERT INTO public.boundaries (
  id,
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
) VALUES
-- Impact play examples
(
  '60000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Hand Spanking',
  'impact'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'experienced'::experience_level,
  'experienced'::experience_level,
  'Enjoyed regularly, good for warm-up',
  true,
  '00000000-0000-0000-0000-000000000002'::uuid, -- Kevin
  jsonb_build_object('intensity', 'light_to_medium', 'aftercare_required', true)
),
(
  '60000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Flogging',
  'impact'::activity_category,
  'maybe'::boundary_rating,
  'yes'::boundary_rating,
  'some'::experience_level,
  'experienced'::experience_level,
  'Interested but need more experience and discussion',
  false,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('requires_discussion', true, 'preferred_implements', jsonb_build_array('leather', 'suede'))
),
(
  '60000000-0000-0000-0000-000000000003'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Caning',
  'impact'::activity_category,
  'no'::boundary_rating,
  'yes'::boundary_rating,
  'curious'::experience_level,
  'experienced'::experience_level,
  'Too intense, prefer other impact methods',
  false,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('hard_limit', false, 'may_revisit', true)
),
-- Rope examples
(
  '60000000-0000-0000-0000-000000000004'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Basic Bondage',
  'rope'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'experienced'::experience_level,
  'expert'::experience_level,
  'Love rope work, especially chest harnesses',
  true,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('preferred_positions', jsonb_build_array('chest_harness', 'wrists_behind_back'))
),
(
  '60000000-0000-0000-0000-000000000005'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Shibari',
  'rope'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'some'::experience_level,
  'expert'::experience_level,
  'Learning together, beautiful art form',
  true,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
  jsonb_build_object('learning_focus', 'safety', 'preferred_styles', jsonb_build_array('kinbaku'))
),
(
  '60000000-0000-0000-0000-000000000006'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Suspension',
  'rope'::activity_category,
  'hard_no'::boundary_rating,
  'yes'::boundary_rating,
  'none'::experience_level,
  'experienced'::experience_level,
  'Hard limit - too risky, prefer floor work',
  false,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('hard_limit', true, 'reason', 'safety_concerns')
),
-- Sensation examples
(
  '60000000-0000-0000-0000-000000000007'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Wax Play',
  'sensation'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'some'::experience_level,
  'experienced'::experience_level,
  'Enjoy temperature play, prefer low-melt wax',
  true,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('wax_type', 'low_melt', 'safety_note', 'test_temperature_first')
),
(
  '60000000-0000-0000-0000-000000000008'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Ice Play',
  'sensation'::activity_category,
  'maybe'::boundary_rating,
  'yes'::boundary_rating,
  'curious'::experience_level,
  'experienced'::experience_level,
  'Interested but sensitive to cold',
  false,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('sensitivity_note', 'cold_sensitive', 'preferred_method', 'gradual_introduction')
),
(
  '60000000-0000-0000-0000-000000000009'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Blindfolding',
  'sensation'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'experienced'::experience_level,
  'experienced'::experience_level,
  'Enhances other activities, increases anticipation',
  true,
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('safeword_importance', 'heightened', 'preferred_materials', jsonb_build_array('silk', 'leather'))
),
-- Power exchange examples
(
  '60000000-0000-0000-0000-000000000010'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Orgasm Control',
  'power_exchange'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'experienced'::experience_level,
  'experienced'::experience_level,
  'Core part of our dynamic, well-established',
  true,
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('protocols', jsonb_build_array('permission_required', 'tracking', 'rewards'))
),
(
  '60000000-0000-0000-0000-000000000011'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Chastity',
  'power_exchange'::activity_category,
  'maybe'::boundary_rating,
  'yes'::boundary_rating,
  'curious'::experience_level,
  'experienced'::experience_level,
  'Interested but need more discussion and research',
  false,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('requires_research', true, 'concerns', jsonb_build_array('comfort', 'duration', 'hygiene'))
),
(
  '60000000-0000-0000-0000-000000000012'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Forced Orgasms',
  'power_exchange'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'experienced'::experience_level,
  'experienced'::experience_level,
  'Enjoyed within negotiated limits',
  true,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('limits', jsonb_build_array('safeword_respected', 'aftercare_required'))
),
-- Roleplay examples
(
  '60000000-0000-0000-0000-000000000013'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Pet Play',
  'roleplay'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'some'::experience_level,
  'experienced'::experience_level,
  'Enjoy exploring pet headspace together',
  true,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('preferred_roles', jsonb_build_array('puppy', 'kitten'), 'gear_optional', true)
),
(
  '60000000-0000-0000-0000-000000000014'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Age Play',
  'roleplay'::activity_category,
  'no'::boundary_rating,
  'maybe'::boundary_rating,
  'none'::experience_level,
  'some'::experience_level,
  'Not interested in age play dynamics',
  false,
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('hard_limit', false, 'may_revisit', false)
),
(
  '60000000-0000-0000-0000-000000000015'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Service Roleplay',
  'roleplay'::activity_category,
  'yes'::boundary_rating,
  'yes'::boundary_rating,
  'experienced'::experience_level,
  'experienced'::experience_level,
  'Natural extension of our dynamic, very fulfilling',
  true,
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('service_types', jsonb_build_array('household', 'personal', 'ritual'))
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 4: CONTRACT & CONSENT
-- ============================================================================
-- 1 example covenant with all sections

INSERT INTO public.contracts (
  id,
  bond_id,
  title,
  content,
  version,
  status,
  created_by,
  effective_from,
  metadata
) VALUES (
  '70000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Simeon & Kevin''s Dynamic Covenant',
  '## Roles & Responsibilities

**Dominant (Simeon)**: Provides structure, guidance, and leadership. Makes decisions within negotiated boundaries. Maintains accountability and ensures safety.

**Submissive (Kevin)**: Commits to service, obedience, and growth. Maintains transparency and communicates needs honestly. Follows protocols and rules.

## Duration & Review

This covenant is effective from January 15, 2025, and will be reviewed quarterly. Either party may request renegotiation at any time.

## Rules & Protocols

All rules and protocols established within this dynamic are part of this covenant. Rules may be added, modified, or removed through mutual discussion and consent.

## Limits & Boundaries

Hard limits are absolute and non-negotiable. Soft limits may be explored with discussion and consent. All activities require ongoing consent.

## Safewords & Signals

**Safewords**: Red (stop immediately), Yellow (slow down/check in), Green (all good)

**Non-verbal signals**: Hand signal for when verbal communication is not possible

## Communication & Check-Ins

Daily check-ins are required. Weekly reviews will be conducted. Open communication is essential for the health of this dynamic.

## Consent Principles

Consent is ongoing, enthusiastic, and can be withdrawn at any time. No means no. Silence does not mean consent.

## Termination Clause

Either party may terminate this dynamic at any time. Termination should be discussed when possible, but safety and well-being take priority.',
  1,
  'active'::contract_status,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now() - INTERVAL '30 days',
  jsonb_build_object('sections', jsonb_build_array('roles', 'duration', 'rules', 'limits', 'safewords', 'communication', 'consent', 'termination'))
) ON CONFLICT (id) DO NOTHING;

-- Contract Signatures
INSERT INTO public.contract_signatures (
  id,
  contract_id,
  user_id,
  signature_status,
  signed_at,
  signature_data
) VALUES
(
  '71000000-0000-0000-0000-000000000001'::uuid,
  '70000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
  'signed'::signature_status,
  now() - INTERVAL '30 days',
  jsonb_build_object('signed_at', (now() - INTERVAL '30 days')::text, 'ip_address', '127.0.0.1')
),
(
  '71000000-0000-0000-0000-000000000002'::uuid,
  '70000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid, -- Kevin
  'signed'::signature_status,
  now() - INTERVAL '30 days',
  jsonb_build_object('signed_at', (now() - INTERVAL '30 days')::text, 'ip_address', '127.0.0.1')
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 9: CALENDAR EVENTS
-- ============================================================================
-- 5 example events: scene, ritual, task deadline, check-in, milestone

INSERT INTO public.calendar_events (
  id,
  bond_id,
  title,
  description,
  event_type,
  start_date,
  end_date,
  all_day,
  reminder_minutes,
  created_by,
  metadata
) VALUES
-- Scene event
(
  'c0000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Evening Scene',
  'Planned impact and rope scene. Focus on service and submission. Aftercare included.',
  'scene'::event_type,
  now() + INTERVAL '3 days' + INTERVAL '19 hours', -- 3 days from now at 7 PM
  now() + INTERVAL '3 days' + INTERVAL '21 hours', -- Ends at 9 PM
  false,
  60, -- Reminder 1 hour before
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('aftercare_time', 30, 'activities', jsonb_build_array('impact', 'rope'))
),
-- Ritual event
(
  'c0000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Weekly Review Ritual',
  'Scheduled weekly review and reflection. Discuss progress, challenges, and goals.',
  'ritual'::event_type,
  now() + INTERVAL '7 days' + INTERVAL '20 hours', -- Next Sunday at 8 PM
  now() + INTERVAL '7 days' + INTERVAL '21 hours', -- Ends at 9 PM
  false,
  120, -- Reminder 2 hours before
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('recurring', true, 'frequency', 'weekly')
),
-- Task deadline
(
  'c0000000-0000-0000-0000-000000000003'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Weekly Reflection Due',
  'Deadline for completing weekly reflection task.',
  'task_deadline'::event_type,
  now() + INTERVAL '7 days' + INTERVAL '20 hours', -- Sunday at 8 PM
  now() + INTERVAL '7 days' + INTERVAL '20 hours',
  false,
  240, -- Reminder 4 hours before
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('task_id', '20000000-0000-0000-0000-000000000008'::text)
),
-- Check-in event
(
  'c0000000-0000-0000-0000-000000000004'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Daily Check-In Reminder',
  'Scheduled daily check-in time. Report mood, energy, and any concerns.',
  'check_in'::event_type,
  now() + INTERVAL '1 day' + INTERVAL '20 hours', -- Tomorrow at 8 PM
  now() + INTERVAL '1 day' + INTERVAL '20 hours',
  false,
  30, -- Reminder 30 minutes before
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('recurring', true, 'frequency', 'daily')
),
-- Milestone event
(
  'c0000000-0000-0000-0000-000000000005'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Dynamic Anniversary',
  'Celebrating 6 months of our dynamic. Special ritual and reflection planned.',
  'milestone'::event_type,
  now() + INTERVAL '60 days', -- 60 days from now
  now() + INTERVAL '60 days',
  true, -- All day event
  NULL,
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('milestone_type', 'anniversary', 'months', 6)
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 7: REWARDS
-- ============================================================================
-- 5 example rewards covering all reward types

INSERT INTO public.rewards (
  id,
  workspace_id,
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
) VALUES
-- Verbal acknowledgment (completed)
(
  '50000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid, -- Kevin's workspace
  'verbal'::reward_type,
  'Excellent Service Recognition',
  'Outstanding service and dedication this week. Your consistency with protocols and attention to detail has been exceptional.',
  0,
  0,
  'words_of_affirmation',
  '00000000-0000-0000-0000-000000000001'::uuid, -- Assigned by Simeon
  '00000000-0000-0000-0000-000000000002'::uuid, -- Assigned to Kevin
  NULL,
  'completed'::reward_status,
  NULL,
  now() - INTERVAL '3 days',
  now() - INTERVAL '5 days',
  now() - INTERVAL '3 days'
),
-- Points reward (completed)
(
  '50000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'points'::reward_type,
  'Task Completion Bonus',
  'Bonus points for completing all tasks this week with exceptional quality.',
  50,
  0,
  NULL,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'completed'::reward_status,
  NULL,
  now() - INTERVAL '2 days',
  now() - INTERVAL '4 days',
  now() - INTERVAL '2 days'
),
-- Relational reward (available)
(
  '50000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'relational'::reward_type,
  'Extended Quality Time',
  'An evening of focused attention and connection. We''ll spend quality time together doing something you choose.',
  0,
  0,
  'quality_time',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'available'::reward_status,
  NULL,
  NULL,
  now() - INTERVAL '7 days',
  now() - INTERVAL '7 days'
),
-- Permission-based reward (available)
(
  '50000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'relational'::reward_type,
  'Permission for Special Activity',
  'You''ve earned permission to choose our next scene activity. This reward gives you input on what we explore together.',
  0,
  0,
  'acts_of_service',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'available'::reward_status,
  NULL,
  NULL,
  now() - INTERVAL '5 days',
  now() - INTERVAL '5 days'
),
-- Achievement reward (completed)
(
  '50000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'achievement'::reward_type,
  'Consistency Milestone',
  'Congratulations on maintaining consistent service for 30 days. This milestone demonstrates your commitment and growth.',
  0,
  0,
  NULL,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'completed'::reward_status,
  NULL,
  now() - INTERVAL '10 days',
  now() - INTERVAL '30 days',
  now() - INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 10: JOURNAL ENTRIES
-- ============================================================================
-- 5 example entries: personal, shared, gratitude, scene log

INSERT INTO public.journal_entries (
  id,
  bond_id,
  title,
  content,
  entry_type,
  tags,
  created_by,
  metadata
) VALUES
-- Personal reflection (visible to Dominant by default)
(
  'd0000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Morning Reflection',
  'Feeling grateful today for the structure and care in our dynamic. The morning protocol helps me start each day with intention and purpose. I''m noticing how much calmer I feel when I follow the routines we''ve established.',
  'personal'::journal_entry_type,
  ARRAY['gratitude', 'reflection', 'structure'],
  '00000000-0000-0000-0000-000000000002'::uuid, -- Kevin
  jsonb_build_object('mood', 'grateful', 'energy_level', 'medium')
),
-- Shared entry
(
  'd0000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Weekly Check-In Reflection',
  'This week I focused on improving my consistency with daily protocols. I noticed I struggled with the evening ritual a few times when I was tired, but I''m learning to prioritize these moments even when energy is low. I appreciate your patience as I grow.',
  'shared'::journal_entry_type,
  ARRAY['check-in', 'growth', 'consistency'],
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('week_of', (now() - INTERVAL '7 days')::date::text)
),
-- Gratitude entry
(
  'd0000000-0000-0000-0000-000000000003'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Gratitude Practice',
  'Today I''m grateful for: 1) Your clear communication about expectations, 2) The way you notice and acknowledge my efforts, 3) The safety I feel in our dynamic, 4) The growth I''m experiencing, 5) The connection we share.',
  'gratitude'::journal_entry_type,
  ARRAY['gratitude', 'appreciation'],
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('gratitude_count', 5)
),
-- Scene log
(
  'd0000000-0000-0000-0000-000000000004'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Scene Debrief: Evening Session',
  'Scene focused on service and submission. Started with kneeling ritual, then moved to impact play and rope work. I felt very present and connected throughout. The aftercare was perfect - I felt cared for and secure. No concerns or issues to note.',
  'scene_log'::journal_entry_type,
  ARRAY['scene', 'debrief', 'aftercare'],
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('scene_date', (now() - INTERVAL '2 days')::date::text, 'activities', jsonb_build_array('impact', 'rope', 'service'))
),
-- Dominant's leadership reflection
(
  'd0000000-0000-0000-0000-000000000005'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Leadership Reflection',
  'Observing consistent growth in commitment and presence. The daily protocols are becoming natural habits, which shows genuine engagement. Noticed increased confidence in service roles. Continue to prioritize clear communication and recognition of efforts.',
  'personal'::journal_entry_type,
  ARRAY['leadership', 'observation', 'growth'],
  '00000000-0000-0000-0000-000000000001'::uuid, -- Simeon
  jsonb_build_object('perspective', 'dominant', 'focus', 'growth_observation')
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULE 12: LIBRARY & GUIDES
-- ============================================================================
-- 7 example resources: articles, guides, books, videos, forums

INSERT INTO public.resources (
  id,
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
  metadata
) VALUES
-- Educational article
(
  'e0000000-0000-0000-0000-000000000001'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Understanding Power Exchange Dynamics',
  'Comprehensive guide to power exchange relationships, covering communication, consent, and structure.',
  'https://example.com/power-exchange-guide',
  'article'::resource_type,
  'education'::resource_category,
  ARRAY['power_exchange', 'communication', 'consent'],
  5,
  'Excellent foundational reading. Covers key concepts we reference regularly.',
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('reading_time', '15 minutes', 'difficulty', 'beginner')
),
-- Safety guide
(
  'e0000000-0000-0000-0000-000000000002'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Rope Safety Guide',
  'Essential safety information for rope bondage, including nerve safety, circulation, and emergency procedures.',
  'https://example.com/rope-safety',
  'guide'::resource_type,
  'safety'::resource_category,
  ARRAY['rope', 'safety', 'bondage'],
  5,
  'Must-read before any rope work. We review this regularly.',
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('required_reading', true, 'topics', jsonb_build_array('nerve_safety', 'circulation', 'emergency'))
),
-- Book
(
  'e0000000-0000-0000-0000-000000000003'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'The New Topping Book',
  'Classic guide for dominants covering technique, communication, and relationship dynamics.',
  'https://example.com/new-topping-book',
  'book'::resource_type,
  'education'::resource_category,
  ARRAY['dominance', 'technique', 'communication'],
  5,
  'Highly recommended. Covers both practical and philosophical aspects.',
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('authors', jsonb_build_array('Dossie Easton', 'Janet Hardy'), 'pages', 320)
),
-- Video
(
  'e0000000-0000-0000-0000-000000000004'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Shibari Basics Tutorial',
  'Step-by-step video tutorial covering basic Shibari ties and safety considerations.',
  'https://example.com/shibari-tutorial',
  'video'::resource_type,
  'technique'::resource_category,
  ARRAY['shibari', 'rope', 'tutorial'],
  4,
  'Good for learning together. We practice along with the video.',
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('duration_minutes', 45, 'skill_level', 'beginner')
),
-- Forum
(
  'e0000000-0000-0000-0000-000000000005'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'D/s Community Forum',
  'Active online community for discussing power exchange dynamics, sharing experiences, and getting support.',
  'https://example.com/ds-forum',
  'forum'::resource_type,
  'community'::resource_category,
  ARRAY['community', 'support', 'discussion'],
  4,
  'Helpful for reading about others'' experiences and getting perspective.',
  '00000000-0000-0000-0000-000000000002'::uuid,
  jsonb_build_object('membership_required', false, 'activity_level', 'high')
),
-- Guide
(
  'e0000000-0000-0000-0000-000000000006'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Aftercare Guide',
  'Comprehensive guide to aftercare practices, covering physical and emotional care after scenes.',
  'https://example.com/aftercare-guide',
  'guide'::resource_type,
  'safety'::resource_category,
  ARRAY['aftercare', 'safety', 'care'],
  5,
  'Essential reading. We use this as a reference for our aftercare protocols.',
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('topics', jsonb_build_array('physical_care', 'emotional_care', 'check_ins'))
),
-- Article
(
  'e0000000-0000-0000-0000-000000000007'::uuid,
  '40000000-0000-0000-0000-000000000001'::uuid,
  'Consent and Negotiation in BDSM',
  'Article covering consent models, negotiation strategies, and ongoing consent practices.',
  'https://example.com/consent-negotiation',
  'article'::resource_type,
  'education'::resource_category,
  ARRAY['consent', 'negotiation', 'communication'],
  5,
  'Important foundational concepts. We reference this during our contract reviews.',
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object('reading_time', '20 minutes', 'topics', jsonb_build_array('consent_models', 'negotiation', 'ongoing_consent'))
)
ON CONFLICT (id) DO NOTHING;
