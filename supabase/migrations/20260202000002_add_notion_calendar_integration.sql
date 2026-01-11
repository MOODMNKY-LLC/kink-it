-- Add Notion Calendar Integration Support
-- Adds fields needed for opening KINK IT calendar events in Notion Calendar

-- Ensure calendar_events table exists (in case MVP migration hasn't been applied)
-- This is a minimal version - full table creation is in 20260202000000_create_mvp_tables.sql

-- Create event_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('scene', 'task_deadline', 'check_in', 'ritual', 'milestone', 'other');
  END IF;
END $$;

-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid REFERENCES public.bonds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL DEFAULT 'other',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  reminder_minutes integer,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create basic indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_calendar_events_bond_id ON public.calendar_events(bond_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies if they don't exist (simplified - full policies in MVP migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calendar_events' 
    AND policyname = 'Users can view their own calendar events'
  ) THEN
    CREATE POLICY "Users can view their own calendar events"
    ON public.calendar_events FOR SELECT
    USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calendar_events' 
    AND policyname = 'Users can create calendar events'
  ) THEN
    CREATE POLICY "Users can create calendar events"
    ON public.calendar_events FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calendar_events' 
    AND policyname = 'Users can update their own calendar events'
  ) THEN
    CREATE POLICY "Users can update their own calendar events"
    ON public.calendar_events FOR UPDATE
    USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calendar_events' 
    AND policyname = 'Users can delete their own calendar events'
  ) THEN
    CREATE POLICY "Users can delete their own calendar events"
    ON public.calendar_events FOR DELETE
    USING (created_by = auth.uid());
  END IF;
END $$;

-- Add Google account email to profiles (optional, for Notion Calendar integration)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_account_email text;

-- Add comment explaining usage
COMMENT ON COLUMN public.profiles.google_account_email IS 
  'Google account email for Notion Calendar integration. Used to generate cron:// URLs for opening events in Notion Calendar.';

-- Add iCalUID to calendar_events (RFC5545 format identifier)
-- This is required for Notion Calendar's cron:// API
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS ical_uid text;

-- Create index for iCalUID lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_ical_uid 
ON public.calendar_events(ical_uid) 
WHERE ical_uid IS NOT NULL;

-- Add comment explaining usage
COMMENT ON COLUMN public.calendar_events.ical_uid IS 
  'RFC5545 iCalendar UID for calendar integration. Format: {event_id}@kink-it.app. Used by Notion Calendar cron:// API.';

-- Function to generate iCalUID for an event
-- Format: {event_id}@kink-it.app (RFC5545 compliant)
CREATE OR REPLACE FUNCTION public.generate_ical_uid(event_id uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- RFC5545 format: globally unique identifier
  -- Using event ID + domain ensures uniqueness
  RETURN event_id::text || '@kink-it.app';
END;
$$;

-- Trigger to auto-generate iCalUID on event creation
CREATE OR REPLACE FUNCTION public.set_calendar_event_ical_uid()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.ical_uid IS NULL THEN
    NEW.ical_uid := public.generate_ical_uid(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_calendar_event_ical_uid ON public.calendar_events;
CREATE TRIGGER trigger_set_calendar_event_ical_uid
  BEFORE INSERT ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_calendar_event_ical_uid();

-- Backfill existing events with iCalUID
UPDATE public.calendar_events
SET ical_uid = public.generate_ical_uid(id)
WHERE ical_uid IS NULL;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION public.generate_ical_uid(uuid) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.generate_ical_uid IS 
  'Generates RFC5545-compliant iCalendar UID for calendar events. Format: {uuid}@kink-it.app';
