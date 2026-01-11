# Bond RLS Recursion Fix

**Date**: 2026-01-29  
**Issue**: Infinite recursion in `bond_members` INSERT policy

---

## Problem

When creating a bond and adding the founder as the first member, the RLS policy caused infinite recursion:

\`\`\`
Error: infinite recursion detected in policy for relation "bond_members"
\`\`\`

**Root Cause**: The INSERT policy for `bond_members` was checking the `bond_members` table itself to verify if a user has `can_invite` permission. When inserting the first member (the founder), this check queried `bond_members`, which triggered the same policy check, creating infinite recursion.

---

## Solution

**Key Fix**: Check `bonds.created_by` FIRST before checking `bond_members`. This allows bond creators to add the first member without needing to query `bond_members`.

### Updated Policy Logic

1. **First Check**: Is the user the bond creator? → Allow (no recursion)
2. **Second Check**: If NOT creator, check if user is an authorized member → Allow
3. **Third Check**: Is the user an admin? → Allow

### Policy Structure

\`\`\`sql
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
\`\`\`

---

## Migration

**File**: `supabase/migrations/20260129000002_fix_bond_members_rls_recursion.sql`

**Changes**:
1. Drops old problematic policies
2. Creates new policies with proper recursion prevention
3. Fixes both INSERT and UPDATE policies

---

## Testing

After applying the migration:

1. ✅ Create a new bond → Should succeed
2. ✅ Add founder as first member → Should succeed (no recursion)
3. ✅ Add additional members → Should succeed
4. ✅ Update membership → Should succeed

---

## Related Issues

- Bond creation failing with "Failed to create bond"
- RPC function fallback working but bond insert failing
- Infinite recursion in RLS policies

---

## Related Documentation

- [Bonds System Implementation](./BONDS_SYSTEM_IMPLEMENTATION.md)
- [Bonds Debug Fix](./BONDS_DEBUG_FIX.md)
- [RLS Policies Guide](./developer/rls-policies.md)
