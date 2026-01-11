-- Add RLS policy to allow browsing public/discoverable bonds
-- Users need to be able to see public bonds (is_private = false) for discovery

-- Add policy to allow authenticated users to browse public bonds
-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can browse public bonds" ON public.bonds;
CREATE POLICY "Users can browse public bonds"
ON public.bonds FOR SELECT
TO authenticated
USING (
  -- Allow browsing bonds that are public (not private)
  is_private = false
  AND bond_status IN ('forming', 'active')
  -- Note: This allows users to see bond info for discovery
  -- They still need to request to join (handled by bond_join_requests)
);

-- Grant necessary permissions
-- This policy allows any authenticated user to see public bonds
-- This is safe because:
-- 1. Only public bonds (is_private = false) are visible
-- 2. Only bonds with status 'forming' or 'active' are visible
-- 3. Users still need to request to join (via bond_join_requests)
-- 4. Private bonds remain hidden (require invite code)
