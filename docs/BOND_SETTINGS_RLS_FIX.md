# Bond Settings RLS Fix

**Date**: 2026-01-31  
**Status**: ✅ Migration Created, Ready to Apply

---

## Problem

When creating a bond, the following error occurs:

\`\`\`
Error: new row violates row-level security policy for table "bond_settings"
Code: 42501
\`\`\`

**Root Cause**: The trigger function `create_bond_settings()` runs with `SECURITY INVOKER` (user permissions), but there's no INSERT policy on `bond_settings` table. RLS blocks the INSERT operation.

---

## Solution

Make the trigger function `SECURITY DEFINER` so it runs with elevated privileges and can bypass RLS for this system operation.

---

## Migration File

**File**: `supabase/migrations/20260131000006_fix_bond_settings_trigger_rls.sql`

---

## Manual Application

If the migration can't be applied via CLI due to conflicts, execute this SQL directly in Supabase Dashboard SQL Editor:

\`\`\`sql
-- Fix bond_settings trigger RLS issue
-- The trigger function needs SECURITY DEFINER to bypass RLS when auto-creating settings

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_bond_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.bond_settings (bond_id)
  VALUES (NEW.id)
  ON CONFLICT (bond_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add comment explaining why SECURITY DEFINER is needed
COMMENT ON FUNCTION public.create_bond_settings() IS 
  'Trigger function to auto-create bond_settings when a bond is created. Uses SECURITY DEFINER to bypass RLS since this is a system operation.';
\`\`\`

---

## Verification

After applying the fix, test bond creation:

1. Create a new bond via the onboarding flow
2. Verify `bond_settings` record is created automatically
3. Check that no RLS errors occur

---

## Why SECURITY DEFINER?

- **System Operation**: Auto-creating settings is a system operation, not a user operation
- **No User Context Needed**: The trigger doesn't need user permissions - it's creating default settings
- **Consistent Pattern**: Other trigger functions (`log_bond_activity`) also use `SECURITY DEFINER`
- **Security**: Function is still restricted by `SET search_path = public` and only performs the intended operation

---

## Related Files

- `supabase/migrations/20260130000000_enhance_bonds_comprehensive.sql` - Original trigger creation
- `app/api/bonds/create/route.ts` - Bond creation API route
- `components/onboarding/steps/bond-setup-step.tsx` - Bond creation UI

---

**Status**: Ready to apply. Execute SQL manually if CLI migration fails.
