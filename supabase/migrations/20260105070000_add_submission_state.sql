-- Add submission_state enum and column to profiles table
-- This is a foundational feature that affects all other features

-- Create submission_state enum type
CREATE TYPE submission_state AS ENUM ('active', 'low_energy', 'paused');

-- Add submission_state column to profiles table with default 'active'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS submission_state submission_state DEFAULT 'active' NOT NULL;

-- Create submission_state_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.submission_state_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL, -- For future multi-partner support (using user_id for now)
  previous_state submission_state,
  new_state submission_state NOT NULL,
  reason text, -- Optional context for state change
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_state_logs_user_id 
  ON public.submission_state_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_submission_state_logs_created_at 
  ON public.submission_state_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_submission_state 
  ON public.profiles(submission_state);

-- Enable RLS on submission_state_logs
ALTER TABLE public.submission_state_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own logs, partners can read partner's logs, admins can read all
CREATE POLICY "submission_state_logs_select_own_or_partner"
ON public.submission_state_logs FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT partner_id FROM public.profiles WHERE id = user_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

-- RLS Policy: Only the user themselves can insert their own state changes
-- (This will be done via service role in API, but policy ensures security)
CREATE POLICY "submission_state_logs_insert_own"
ON public.submission_state_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.submission_state IS 
  'Self-declared submission state by submissive: active (full capacity), low_energy (reduced capacity), paused (temporary suspension of play)';

COMMENT ON TABLE public.submission_state_logs IS 
  'Audit trail of all submission state changes. Used for tracking patterns and ensuring accountability.';

-- Create database trigger function for broadcasting submission state changes
-- Uses realtime.broadcast_changes for scalable real-time updates
-- NOTE: realtime.broadcast_changes is only available in production Supabase
-- For local development, this trigger is commented out. Uncomment when deploying to production.
-- 
-- CREATE OR REPLACE FUNCTION notify_submission_state_change()
-- RETURNS TRIGGER AS $$
-- SECURITY DEFINER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   -- Broadcast state change (WHEN clause ensures this only fires on UPDATE with state change)
--   PERFORM realtime.broadcast_changes(
--     'profile:' || NEW.id::text || ':submission_state',
--     TG_OP,
--     'submission_state_changed',
--     TG_TABLE_NAME,
--     TG_TABLE_SCHEMA,
--     NEW,
--     OLD
--   );
--   RETURN NEW;
-- END;
-- $$;

-- Create trigger on profiles table
-- NOTE: Commented out for local development. Uncomment when deploying to production.
-- CREATE TRIGGER profiles_submission_state_broadcast_trigger
--   AFTER UPDATE ON public.profiles
--   FOR EACH ROW
--   WHEN (OLD.submission_state IS DISTINCT FROM NEW.submission_state)
--   EXECUTE FUNCTION notify_submission_state_change();

-- RLS Policy for Realtime messages (required for private channels)
-- Users can receive broadcasts for their own profile and their partner's profile
CREATE POLICY "profiles_submission_state_broadcast_read"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  topic LIKE 'profile:%:submission_state' AND (
    -- User can read their own state changes
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
    OR
    -- User can read their partner's state changes
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND partner_id = SPLIT_PART(topic, ':', 2)::uuid
    )
    OR
    -- Admins can read all
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND system_role = 'admin'
    )
  )
);

-- Index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id 
  ON public.profiles(partner_id) 
  WHERE partner_id IS NOT NULL;

