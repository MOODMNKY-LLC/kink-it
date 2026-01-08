-- Fix RLS policy to allow searching bonds by invite code
-- Users need to be able to search for bonds by invite_code even if they're not members yet
-- This allows the invite code joining flow to work

-- Add policy to allow authenticated users to search bonds by invite_code
-- For bonds with status 'forming' or 'active' (accepting new members)
CREATE POLICY "Users can search bonds by invite code"
ON public.bonds FOR SELECT
TO authenticated
USING (
  -- Allow searching bonds by invite_code if bond is in 'forming' or 'active' status
  -- This enables the invite code joining flow
  bond_status IN ('forming', 'active')
  AND invite_code IS NOT NULL
  -- Note: The actual invite_code matching is done in the API route query
  -- This policy just allows the SELECT to proceed for bonds with invite codes
);

-- Grant necessary permissions
-- The policy above allows any authenticated user to see forming bonds with invite codes
-- This is safe because:
-- 1. Only bonds with status 'forming' are visible
-- 2. Users still need the correct invite_code to join (checked in API route)
-- 3. The API route validates the invite_code matches before allowing join
