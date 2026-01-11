# Production Migration Instructions

**Migration**: `20260203000000_fix_bond_invite_code_search_rls.sql`  
**Date**: 2026-02-03  
**Purpose**: Fix bond invite code search RLS policy

---

## Quick Apply via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/rbloeqwxivfzxmfropek
   - Or go to your project: **kink-it-db**

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy and Paste Migration SQL**
   \`\`\`sql
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
   \`\`\`

4. **Run the Query**
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for success message

5. **Verify Migration**
   - Run this verification query:
   \`\`\`sql
   -- Check if policy exists
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'bonds'
   AND policyname = 'Users can search bonds by invite code';
   \`\`\`
   - Should return 1 row with the policy details

---

## Alternative: Using Supabase CLI (If Migration History Aligned)

If you want to align migration history first:

\`\`\`bash
# 1. Repair migration history (mark remote-only migrations as reverted)
supabase migration repair --status reverted 20260108115920 20260108120708 20260108121207 20260108122240 20260108122804 20260108125610

# 2. Pull remote schema to sync
supabase db pull --linked

# 3. Push new migration
supabase db push --linked
\`\`\`

**Note**: This approach requires resolving migration history conflicts first.

---

## What This Migration Does

- **Adds RLS Policy**: Allows authenticated users to search bonds by `invite_code`
- **Security**: Only allows searching bonds with status `'forming'` or `'active'` that have invite codes
- **Why Needed**: Previous RLS policy blocked invite code searches because users don't belong to bonds yet

---

## Verification

After applying the migration, test invite code search:

1. Create a bond with an invite code (or use existing)
2. Try searching for the bond using the invite code
3. Should now find the bond successfully

---

**Status**: Ready to apply ✅  
**Method**: Supabase Dashboard SQL Editor (Recommended)
