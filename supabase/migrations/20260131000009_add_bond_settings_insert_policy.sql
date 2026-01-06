-- Add INSERT policy for bond_settings
-- This allows bond creators/managers to manually create settings if needed
-- (though the trigger should handle this automatically)

CREATE POLICY "Bond creators can insert settings"
ON public.bond_settings FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_bond(bond_id, (SELECT auth.uid()))
  OR public.is_admin((SELECT auth.uid()))
);

-- Add comment explaining the policy
COMMENT ON POLICY "Bond creators can insert settings" ON public.bond_settings IS 
  'Allows bond creators and managers to insert settings. Normally handled by trigger, but needed for upsert operations and manual creation.';

