-- MVP Tables Migration
-- Creates database tables for Rules, Boundaries, Contracts, Journals, Calendar Events, and Resources
-- This implements MVP functionality for sidebar sections

-- ============================================================================
-- RULES & PROTOCOLS
-- ============================================================================

CREATE TYPE rule_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE rule_category AS ENUM ('standing', 'situational', 'temporary', 'protocol');

CREATE TABLE IF NOT EXISTS public.rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category rule_category NOT NULL DEFAULT 'standing',
  status rule_status NOT NULL DEFAULT 'active',
  priority integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  effective_from timestamptz,
  effective_until timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_rules_bond_id ON public.rules(bond_id);
CREATE INDEX IF NOT EXISTS idx_rules_status ON public.rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_category ON public.rules(category);
CREATE INDEX IF NOT EXISTS idx_rules_created_by ON public.rules(created_by);

ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bond members can view rules"
ON public.rules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = rules.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Dominants can create rules"
ON public.rules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = rules.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Dominants can update rules"
ON public.rules FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Dominants can delete rules"
ON public.rules FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND created_by = auth.uid()
);

-- ============================================================================
-- BOUNDARIES & KINK EXPLORATION
-- ============================================================================

CREATE TYPE boundary_rating AS ENUM ('yes', 'maybe', 'no', 'hard_no');
CREATE TYPE experience_level AS ENUM ('none', 'curious', 'some', 'experienced', 'expert');
CREATE TYPE activity_category AS ENUM ('impact', 'rope', 'sensation', 'power_exchange', 'roleplay', 'other');

CREATE TABLE IF NOT EXISTS public.boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  activity_name text NOT NULL,
  category activity_category NOT NULL DEFAULT 'other',
  user_rating boundary_rating,
  partner_rating boundary_rating,
  user_experience experience_level DEFAULT 'none',
  partner_experience experience_level DEFAULT 'none',
  notes text,
  is_mutual boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_boundaries_bond_id ON public.boundaries(bond_id);
CREATE INDEX IF NOT EXISTS idx_boundaries_category ON public.boundaries(category);
CREATE INDEX IF NOT EXISTS idx_boundaries_user_rating ON public.boundaries(user_rating);
CREATE INDEX IF NOT EXISTS idx_boundaries_partner_rating ON public.boundaries(partner_rating);

ALTER TABLE public.boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bond members can view boundaries"
ON public.boundaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = boundaries.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Bond members can create boundaries"
ON public.boundaries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = boundaries.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Bond members can update their own boundaries"
ON public.boundaries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = boundaries.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Bond members can delete boundaries"
ON public.boundaries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = boundaries.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
  AND created_by = auth.uid()
);

-- ============================================================================
-- CONTRACTS & CONSENT
-- ============================================================================

CREATE TYPE contract_status AS ENUM ('draft', 'pending_signature', 'active', 'archived', 'superseded');
CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'declined');

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  parent_contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  effective_from timestamptz,
  effective_until timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  signature_status signature_status NOT NULL DEFAULT 'pending',
  signed_at timestamptz,
  signature_data jsonb, -- For storing digital signature data
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contracts_bond_id ON public.contracts(bond_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_version ON public.contracts(version);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON public.contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_user_id ON public.contract_signatures(user_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bond members can view contracts"
ON public.contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = contracts.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Dominants can create contracts"
ON public.contracts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = contracts.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Dominants can update contracts"
ON public.contracts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND created_by = auth.uid()
  AND status = 'draft'
);

CREATE POLICY "Bond members can view signatures"
ON public.contract_signatures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts
    JOIN public.bond_members ON bond_members.bond_id = contracts.bond_id
    WHERE contracts.id = contract_signatures.contract_id
    AND bond_members.user_id = auth.uid()
    AND bond_members.is_active = true
  )
);

CREATE POLICY "Bond members can sign contracts"
ON public.contract_signatures FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.contracts
    JOIN public.bond_members ON bond_members.bond_id = contracts.bond_id
    WHERE contracts.id = contract_signatures.contract_id
    AND bond_members.user_id = auth.uid()
    AND bond_members.is_active = true
    AND contracts.status = 'pending_signature'
  )
);

CREATE POLICY "Users can update their own signatures"
ON public.contract_signatures FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- JOURNAL ENTRIES
-- ============================================================================

CREATE TYPE journal_entry_type AS ENUM ('personal', 'shared', 'gratitude', 'scene_log');

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid REFERENCES public.bonds(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  entry_type journal_entry_type NOT NULL DEFAULT 'personal',
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_bond_id ON public.journal_entries(bond_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_by ON public.journal_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_type ON public.journal_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON public.journal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Dominants can view partner's personal entries"
ON public.journal_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND EXISTS (
    SELECT 1 FROM public.bond_members bm1
    JOIN public.bond_members bm2 ON bm2.bond_id = bm1.bond_id
    WHERE bm1.user_id = auth.uid()
    AND bm2.user_id = journal_entries.created_by
    AND bm1.is_active = true
    AND bm2.is_active = true
    AND journal_entries.entry_type = 'personal'
  )
);

CREATE POLICY "Bond members can view shared entries"
ON public.journal_entries FOR SELECT
USING (
  entry_type = 'shared'
  AND EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = journal_entries.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Users can create journal entries"
ON public.journal_entries FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries FOR DELETE
USING (created_by = auth.uid());

-- ============================================================================
-- CALENDAR EVENTS
-- ============================================================================

CREATE TYPE event_type AS ENUM ('scene', 'task_deadline', 'check_in', 'ritual', 'milestone', 'other');

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid REFERENCES public.bonds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL DEFAULT 'other',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  reminder_minutes integer, -- Minutes before event to remind
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_bond_id ON public.calendar_events(bond_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bond members can view calendar events"
ON public.calendar_events FOR SELECT
USING (
  bond_id IS NULL -- Personal events
  OR EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = calendar_events.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Users can create calendar events"
ON public.calendar_events FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND (
    bond_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.bond_members
      WHERE bond_id = calendar_events.bond_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  )
);

CREATE POLICY "Users can update their own calendar events"
ON public.calendar_events FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own calendar events"
ON public.calendar_events FOR DELETE
USING (created_by = auth.uid());

-- ============================================================================
-- RESOURCES LIBRARY
-- ============================================================================

CREATE TYPE resource_type AS ENUM ('article', 'video', 'book', 'podcast', 'forum', 'guide', 'other');
CREATE TYPE resource_category AS ENUM ('education', 'safety', 'technique', 'community', 'legal', 'other');

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid REFERENCES public.bonds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text,
  resource_type resource_type NOT NULL DEFAULT 'article',
  category resource_category NOT NULL DEFAULT 'other',
  tags text[] DEFAULT '{}',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  added_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_resources_bond_id ON public.resources(bond_id);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_added_by ON public.resources(added_by);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bond members can view resources"
ON public.resources FOR SELECT
USING (
  bond_id IS NULL -- Public resources
  OR EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = resources.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Dominants can create resources"
ON public.resources FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND dynamic_role = 'dominant'
  )
  AND (
    bond_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.bond_members
      WHERE bond_id = resources.bond_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  )
);

CREATE POLICY "Users can update their own resources"
ON public.resources FOR UPDATE
USING (added_by = auth.uid());

CREATE POLICY "Users can delete their own resources"
ON public.resources FOR DELETE
USING (added_by = auth.uid());

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER rules_updated_at
  BEFORE UPDATE ON public.rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER boundaries_updated_at
  BEFORE UPDATE ON public.boundaries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.rules IS 
  'Rules and protocols governing D/s dynamics within bonds. Created by Dominants, visible to all bond members.';

COMMENT ON TABLE public.boundaries IS 
  'Kink activity boundaries and exploration tracking. Both partners can rate activities and track experience levels.';

COMMENT ON TABLE public.contracts IS 
  'Relationship contracts (Covenants) with version control and digital signatures.';

COMMENT ON TABLE public.contract_signatures IS 
  'Digital signatures for contracts. Tracks signature status and timestamp.';

COMMENT ON TABLE public.journal_entries IS 
  'Personal and shared journal entries. Personal entries visible to Dominant by default for transparency.';

COMMENT ON TABLE public.calendar_events IS 
  'Calendar events for scenes, tasks, rituals, and milestones. Can be personal or bond-shared.';

COMMENT ON TABLE public.resources IS 
  'Resource library for educational content, guides, and curated materials. Can be public or bond-specific.';

