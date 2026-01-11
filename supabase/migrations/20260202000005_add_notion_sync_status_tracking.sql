-- Migration: Add Notion Sync Status Tracking
-- Adds columns to track Notion sync status for all syncable entities
-- This enables users to see sync status, last sync time, and error messages

-- ============================================================================
-- SYNC STATUS ENUM
-- ============================================================================

-- Create enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notion_sync_status') THEN
    CREATE TYPE notion_sync_status AS ENUM ('synced', 'pending', 'failed', 'error');
  END IF;
END $$;

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS notion_page_id text,
ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
ADD COLUMN IF NOT EXISTS notion_sync_error text;

CREATE INDEX IF NOT EXISTS idx_tasks_notion_page_id ON public.tasks(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_tasks_notion_sync_status ON public.tasks(notion_sync_status);

-- ============================================================================
-- RULES TABLE
-- ============================================================================

ALTER TABLE public.rules
ADD COLUMN IF NOT EXISTS notion_page_id text,
ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
ADD COLUMN IF NOT EXISTS notion_sync_error text;

CREATE INDEX IF NOT EXISTS idx_rules_notion_page_id ON public.rules(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_rules_notion_sync_status ON public.rules(notion_sync_status);

-- ============================================================================
-- CONTRACTS TABLE
-- ============================================================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS notion_page_id text,
ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
ADD COLUMN IF NOT EXISTS notion_sync_error text;

CREATE INDEX IF NOT EXISTS idx_contracts_notion_page_id ON public.contracts(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_contracts_notion_sync_status ON public.contracts(notion_sync_status);

-- ============================================================================
-- JOURNAL ENTRIES TABLE
-- ============================================================================

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS notion_page_id text,
ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
ADD COLUMN IF NOT EXISTS notion_sync_error text;

CREATE INDEX IF NOT EXISTS idx_journal_entries_notion_page_id ON public.journal_entries(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_notion_sync_status ON public.journal_entries(notion_sync_status);

-- ============================================================================
-- CALENDAR EVENTS TABLE
-- ============================================================================

ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS notion_page_id text,
ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
ADD COLUMN IF NOT EXISTS notion_sync_error text;

CREATE INDEX IF NOT EXISTS idx_calendar_events_notion_page_id ON public.calendar_events(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_notion_sync_status ON public.calendar_events(notion_sync_status);

-- ============================================================================
-- APP IDEAS TABLE
-- ============================================================================

-- Check if app_ideas table exists, if not create it
CREATE TABLE IF NOT EXISTS public.app_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'feature',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'new',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_ideas
ADD COLUMN IF NOT EXISTS notion_page_id text,
ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
ADD COLUMN IF NOT EXISTS notion_sync_error text;

CREATE INDEX IF NOT EXISTS idx_app_ideas_notion_page_id ON public.app_ideas(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_app_ideas_notion_sync_status ON public.app_ideas(notion_sync_status);

-- ============================================================================
-- KINKSTERS TABLE
-- ============================================================================

-- Check if kinksters table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kinksters') THEN
    ALTER TABLE public.kinksters
    ADD COLUMN IF NOT EXISTS notion_page_id text,
    ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
    ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
    ADD COLUMN IF NOT EXISTS notion_sync_error text;

    CREATE INDEX IF NOT EXISTS idx_kinksters_notion_page_id ON public.kinksters(notion_page_id);
    CREATE INDEX IF NOT EXISTS idx_kinksters_notion_sync_status ON public.kinksters(notion_sync_status);
  END IF;
END $$;

-- ============================================================================
-- IMAGE GENERATIONS TABLE
-- ============================================================================

-- Check if image_generations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'image_generations') THEN
    ALTER TABLE public.image_generations
    ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz,
    ADD COLUMN IF NOT EXISTS notion_sync_status notion_sync_status,
    ADD COLUMN IF NOT EXISTS notion_sync_error text;

    CREATE INDEX IF NOT EXISTS idx_image_generations_notion_sync_status ON public.image_generations(notion_sync_status);
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.tasks.notion_page_id IS 'Notion page ID for this task';
COMMENT ON COLUMN public.tasks.notion_synced_at IS 'Timestamp of last successful sync to Notion';
COMMENT ON COLUMN public.tasks.notion_sync_status IS 'Current sync status: synced, pending, failed, error';
COMMENT ON COLUMN public.tasks.notion_sync_error IS 'Error message if sync failed';

COMMENT ON COLUMN public.rules.notion_page_id IS 'Notion page ID for this rule';
COMMENT ON COLUMN public.rules.notion_synced_at IS 'Timestamp of last successful sync to Notion';
COMMENT ON COLUMN public.rules.notion_sync_status IS 'Current sync status: synced, pending, failed, error';
COMMENT ON COLUMN public.rules.notion_sync_error IS 'Error message if sync failed';

COMMENT ON COLUMN public.contracts.notion_page_id IS 'Notion page ID for this contract';
COMMENT ON COLUMN public.contracts.notion_synced_at IS 'Timestamp of last successful sync to Notion';
COMMENT ON COLUMN public.contracts.notion_sync_status IS 'Current sync status: synced, pending, failed, error';
COMMENT ON COLUMN public.contracts.notion_sync_error IS 'Error message if sync failed';

COMMENT ON COLUMN public.journal_entries.notion_page_id IS 'Notion page ID for this journal entry';
COMMENT ON COLUMN public.journal_entries.notion_synced_at IS 'Timestamp of last successful sync to Notion';
COMMENT ON COLUMN public.journal_entries.notion_sync_status IS 'Current sync status: synced, pending, failed, error';
COMMENT ON COLUMN public.journal_entries.notion_sync_error IS 'Error message if sync failed';

COMMENT ON COLUMN public.calendar_events.notion_page_id IS 'Notion page ID for this calendar event';
COMMENT ON COLUMN public.calendar_events.notion_synced_at IS 'Timestamp of last successful sync to Notion';
COMMENT ON COLUMN public.calendar_events.notion_sync_status IS 'Current sync status: synced, pending, failed, error';
COMMENT ON COLUMN public.calendar_events.notion_sync_error IS 'Error message if sync failed';

COMMENT ON COLUMN public.app_ideas.notion_page_id IS 'Notion page ID for this idea';
COMMENT ON COLUMN public.app_ideas.notion_synced_at IS 'Timestamp of last successful sync to Notion';
COMMENT ON COLUMN public.app_ideas.notion_sync_status IS 'Current sync status: synced, pending, failed, error';
COMMENT ON COLUMN public.app_ideas.notion_sync_error IS 'Error message if sync failed';
