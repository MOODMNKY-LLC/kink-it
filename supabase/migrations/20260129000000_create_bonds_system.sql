-- Create Bonds System for Multi-Member Relationship Groups
-- Replaces simple partner_id with bond-based relationship structure
-- Supports polyamorous D/s relationships and multi-member dynamics

-- Create bond_type enum for different relationship structures
CREATE TYPE bond_type AS ENUM (
  'dyad',           -- Two-person relationship (traditional D/s pair)
  'polycule',       -- Multi-person polyamorous network
  'household',      -- Traditional leather family/household structure
  'dynamic'         -- General power exchange dynamic (flexible)
);

-- Create bond_status enum
CREATE TYPE bond_status AS ENUM (
  'forming',        -- Bond is being created, members joining
  'active',         -- Bond is active and operational
  'paused',         -- Bond is temporarily paused
  'dissolved'       -- Bond has been dissolved
);

-- Create bonds table (the relationship group/unit)
CREATE TABLE IF NOT EXISTS public.bonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  bond_type bond_type NOT NULL DEFAULT 'dynamic',
  bond_status bond_status NOT NULL DEFAULT 'forming',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Bond settings
  is_private boolean DEFAULT true,  -- Private bonds require invitation
  invite_code text UNIQUE,          -- Unique code for joining private bonds
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb  -- Flexible storage for bond-specific data
);

-- Create bond_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.bond_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Role within the bond
  role_in_bond text NOT NULL,  -- 'founder', 'dominant', 'submissive', 'switch', 'member'
  
  -- Membership details
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true,
  
  -- Permissions within bond
  can_invite boolean DEFAULT false,  -- Can invite new members
  can_manage boolean DEFAULT false,  -- Can manage bond settings
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
  
  -- Note: One active membership per user per bond enforced via unique index below
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bonds_created_by ON public.bonds(created_by);
CREATE INDEX IF NOT EXISTS idx_bonds_status ON public.bonds(bond_status);
CREATE INDEX IF NOT EXISTS idx_bonds_type ON public.bonds(bond_type);
CREATE INDEX IF NOT EXISTS idx_bonds_invite_code ON public.bonds(invite_code) WHERE invite_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bond_members_bond_id ON public.bond_members(bond_id);
CREATE INDEX IF NOT EXISTS idx_bond_members_user_id ON public.bond_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bond_members_active ON public.bond_members(bond_id, is_active) WHERE is_active = true;

-- Create unique index to ensure one active membership per user per bond
CREATE UNIQUE INDEX IF NOT EXISTS idx_bond_members_unique_active 
ON public.bond_members(bond_id, user_id) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bonds
CREATE POLICY "Users can view bonds they belong to"
ON public.bonds FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_members.bond_id = bonds.id
    AND bond_members.user_id = (SELECT auth.uid())
    AND bond_members.is_active = true
  )
  OR created_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

CREATE POLICY "Users can create bonds"
ON public.bonds FOR INSERT
TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Bond creators and admins can update bonds"
ON public.bonds FOR UPDATE
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_members.bond_id = bonds.id
    AND bond_members.user_id = (SELECT auth.uid())
    AND bond_members.is_active = true
    AND bond_members.can_manage = true
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

-- RLS Policies for bond_members
CREATE POLICY "Users can view members of their bonds"
ON public.bond_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bond_members bm2
    WHERE bm2.bond_id = bond_members.bond_id
    AND bm2.user_id = (SELECT auth.uid())
    AND bm2.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

CREATE POLICY "Bond creators and authorized members can add members"
ON public.bond_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND (
      bonds.created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.bond_members bm
        WHERE bm.bond_id = bonds.id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.is_active = true
        AND bm.can_invite = true
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

CREATE POLICY "Users can update their own membership"
ON public.bond_members FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND (
      bonds.created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.bond_members bm
        WHERE bm.bond_id = bonds.id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.is_active = true
        AND bm.can_manage = true
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

-- Add bond_id to profiles table (replacing partner_id concept)
-- Keep partner_id for backward compatibility, but add bond_id
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bond_id uuid REFERENCES public.bonds(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_bond_id ON public.profiles(bond_id) WHERE bond_id IS NOT NULL;

-- Add foreign key constraint to user_achievements.bond_id if it doesn't exist
-- This was deferred because achievements migration runs before bonds migration
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_achievements_bond_id_fkey'
  ) THEN
    ALTER TABLE public.user_achievements
    ADD CONSTRAINT user_achievements_bond_id_fkey 
    FOREIGN KEY (bond_id) REFERENCES public.bonds(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update user_achievements RLS policy to include bond_members check
-- This was deferred because bond_members table didn't exist when achievements migration ran
DROP POLICY IF EXISTS "user_achievements_select_bond" ON public.user_achievements;
CREATE POLICY "user_achievements_select_bond"
ON public.user_achievements FOR SELECT
USING (
  bond_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.bond_members
    WHERE bond_id = user_achievements.bond_id
    AND user_id = auth.uid()
    AND is_active = true
  )
);

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_bond_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.bonds WHERE invite_code = code) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER bonds_updated_at
  BEFORE UPDATE ON public.bonds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.bonds IS 
  'Relationship groups/bonds that connect multiple users in D/s dynamics. Supports dyads, polycules, households, and flexible dynamic structures.';

COMMENT ON TABLE public.bond_members IS 
  'Membership records linking users to bonds with roles and permissions.';

COMMENT ON COLUMN public.bonds.bond_type IS 
  'Type of bond: dyad (2-person), polycule (multi-person poly), household (leather family), dynamic (flexible structure)';

COMMENT ON COLUMN public.bond_members.role_in_bond IS 
  'User''s role within this specific bond: founder, dominant, submissive, switch, or member';
