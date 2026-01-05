-- Fix infinite recursion in bond_members policies
-- The issue: Policies were checking bond_members table which triggered the same policies
-- Solution: Check bonds.created_by FIRST before checking bond_members
-- This allows bond creators to add/view the first member (themselves) without recursion

-- Fix SELECT policy first (this is checked during INSERT, causing recursion)
DROP POLICY IF EXISTS "Users can view members of their bonds" ON public.bond_members;

CREATE POLICY "Users can view members of their bonds"
ON public.bond_members FOR SELECT
TO authenticated
USING (
  -- FIRST: Allow if user created the bond (no recursion needed)
  EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND bonds.created_by = (SELECT auth.uid())
  )
  -- SECOND: Only check bond_members if user is NOT the creator
  OR (
    NOT EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND bonds.created_by = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.bond_members bm2
      WHERE bm2.bond_id = bond_members.bond_id
      AND bm2.user_id = (SELECT auth.uid())
      AND bm2.is_active = true
    )
  )
  -- OR allow if user is admin
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Bond creators and authorized members can add members" ON public.bond_members;

-- Create fixed policy that avoids recursion
-- Key fix: Check bonds.created_by FIRST, only check bond_members if NOT creator
CREATE POLICY "Bond creators and authorized members can add members"
ON public.bond_members FOR INSERT
TO authenticated
WITH CHECK (
  -- FIRST: Allow if user created the bond (no recursion needed)
  EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND bonds.created_by = (SELECT auth.uid())
  )
  -- SECOND: Only check bond_members if user is NOT the creator
  OR (
    -- Check if user is NOT the creator first
    NOT EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND bonds.created_by = (SELECT auth.uid())
    )
    -- Then check if user is an authorized member
    AND EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND EXISTS (
        SELECT 1 FROM public.bond_members bm
        WHERE bm.bond_id = bonds.id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.is_active = true
        AND bm.can_invite = true
      )
    )
  )
  -- OR allow if user is admin
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
);

-- Also fix the UPDATE policy to avoid similar issues
DROP POLICY IF EXISTS "Users can update their own membership" ON public.bond_members;

CREATE POLICY "Users can update their own membership"
ON public.bond_members FOR UPDATE
TO authenticated
USING (
  -- Allow users to update their own membership
  user_id = (SELECT auth.uid())
  -- OR allow bond creators to update any membership in their bond (no recursion)
  OR EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND bonds.created_by = (SELECT auth.uid())
  )
  -- OR allow managers (only if NOT creator to avoid recursion)
  OR (
    NOT EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND bonds.created_by = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND EXISTS (
        SELECT 1 FROM public.bond_members bm
        WHERE bm.bond_id = bonds.id
        AND bm.user_id = (SELECT auth.uid())
        AND bm.is_active = true
        AND bm.can_manage = true
      )
    )
  )
  -- OR allow admins
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND system_role = 'admin'
  )
)
WITH CHECK (
  -- Same checks for WITH CHECK clause
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND bonds.created_by = (SELECT auth.uid())
  )
  OR (
    NOT EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND bonds.created_by = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.bonds
      WHERE bonds.id = bond_members.bond_id
      AND EXISTS (
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

