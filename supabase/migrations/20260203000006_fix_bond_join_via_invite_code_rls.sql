-- Fix RLS policy to allow users to join bonds via invite code
-- Users need to be able to INSERT into bond_members when joining via invite code
-- The current policy only allows bond creators or authorized members to add members,
-- but users joining via invite code aren't members yet!

-- Add policy to allow authenticated users to join bonds via invite code
-- This policy allows INSERT when:
-- 1. Bond exists and has an invite_code
-- 2. Bond status is 'forming' or 'active' (accepting members)
-- 3. User is authenticated
-- Note: The API route validates the invite_code before calling this, so this is safe
-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can join bonds via invite code" ON public.bond_members;
CREATE POLICY "Users can join bonds via invite code"
ON public.bond_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow joining if bond has invite_code and is accepting members
  EXISTS (
    SELECT 1 FROM public.bonds
    WHERE bonds.id = bond_members.bond_id
    AND bonds.invite_code IS NOT NULL
    AND bonds.bond_status IN ('forming', 'active')
  )
  -- User must be inserting their own membership
  AND user_id = (SELECT auth.uid())
);

-- Grant necessary permissions
-- This policy is safe because:
-- 1. Only bonds with invite codes and status 'forming'/'active' can be joined
-- 2. Users can only insert their own membership (user_id = auth.uid())
-- 3. The API route validates the invite_code matches before allowing join
-- 4. The unique index prevents duplicate active memberships
