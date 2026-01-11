# Seed Data Display Fix - Debugging Report

**Date**: 2026-02-15  
**Issue**: Seed data not appearing on module pages  
**Status**: ✅ **FIXED**

---

## Root Causes Identified

### Issue 1: Missing `bond_id` in Profiles ✅ FIXED

**Problem**: 
- Seed data for bond-scoped modules (rules, boundaries, contracts, journal, calendar, resources) references bond ID `40000000-0000-0000-0000-000000000001`
- Profiles in `seed.sql` did NOT have `bond_id` set
- API routes filter by `bond_id` from query params or profile
- Without `bond_id` in profiles, API routes couldn't filter correctly

**Fix**: 
- Updated `seed.sql` to set `bond_id = '40000000-0000-0000-0000-000000000001'` for both Simeon and Kevin's profiles
- Added `bond_id` to INSERT statements and ON CONFLICT UPDATE clauses

**Files Modified**:
- `supabase/seed.sql` (lines 87-119, 122-153)

---

### Issue 2: User-Scoped Data Filtering ✅ FIXED

**Problem**:
- Tasks API filters by `assigned_to` = user.id (submissive) or `assigned_by`/`assigned_to` partner (dominant)
- Rewards API filters by `assigned_to` = user.id
- Achievements API filters by `user_id` = user.id
- Seed data uses specific user IDs (`00000000-0000-0000-0000-000000000001` and `00000000-0000-0000-0000-000000000002`)
- If logged-in user is NOT one of these seed users, they won't see seed data

**Fix**:
- Modified API routes to include seed data when user's `bond_id` matches seed bond ID
- Tasks API: Includes seed tasks when `isInSeedBond = true`
- Rewards API: Includes seed rewards when `isInSeedBond = true`
- Achievements API: Includes seed achievements when `isInSeedBond = true`

**Files Modified**:
- `app/api/tasks/route.ts`
- `app/api/rewards/route.ts`
- `app/api/achievements/progress/route.ts`

---

### Issue 3: API Routes Missing `bond_id` Fallback ✅ FIXED

**Problem**:
- Some API routes only used `bond_id` from query params
- If client component didn't pass `bond_id` (when it's null), API wouldn't filter
- RLS policies might block access or show incorrect data

**Fix**:
- Updated API routes to fallback to `profile.bond_id` when query param is missing
- Ensures consistent filtering even if client doesn't pass `bond_id`

**Files Modified**:
- `app/api/rules/route.ts`
- `app/api/boundaries/route.ts`
- `app/api/contracts/route.ts`
- `app/api/journal/route.ts`
- `app/api/calendar/route.ts`
- `app/api/resources/route.ts`

---

### Issue 4: Communication Module Seed Data ✅ FIXED

**Problem**:
- Messages API filters by `from_user_id`/`to_user_id` = user.id or partner_id
- Check-ins API filters by `user_id` = user.id or partner_id
- Seed data uses specific user IDs

**Fix**:
- Updated Messages API to include seed messages when `isInSeedBond = true`
- Updated Check-ins API to include seed check-ins when `isInSeedBond = true`

**Files Modified**:
- `app/api/messages/route.ts`
- `app/api/check-ins/route.ts`

---

## Changes Summary

### Database Changes (`supabase/seed.sql`)

1. **Simeon's Profile**: Added `bond_id = '40000000-0000-0000-0000-000000000001'`
2. **Kevin's Profile**: Added `bond_id = '40000000-0000-0000-0000-000000000001'`
3. **ON CONFLICT UPDATE**: Added `bond_id` to UPDATE clauses

### API Route Changes

**Bond-Scoped APIs** (now include `bond_id` fallback):
- `/api/rules` - Falls back to `profile.bond_id`
- `/api/boundaries` - Falls back to `profile.bond_id`
- `/api/contracts` - Falls back to `profile.bond_id`
- `/api/journal` - Falls back to `profile.bond_id`
- `/api/calendar` - Falls back to `profile.bond_id`
- `/api/resources` - Falls back to `profile.bond_id`

**User-Scoped APIs** (now include seed data when in seed bond):
- `/api/tasks` - Includes seed tasks when `bond_id` matches seed bond
- `/api/rewards` - Includes seed rewards when `bond_id` matches seed bond
- `/api/achievements/progress` - Includes seed achievements when `bond_id` matches seed bond
- `/api/messages` - Includes seed messages when `bond_id` matches seed bond
- `/api/check-ins` - Includes seed check-ins when `bond_id` matches seed bond

---

## Testing Steps

1. **Reset Database**:
   ```bash
   supabase db reset
   ```

2. **Verify Profiles Have `bond_id`**:
   ```sql
   SELECT id, email, bond_id FROM profiles 
   WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
   ```
   Expected: Both profiles should have `bond_id = '40000000-0000-0000-0000-000000000001'`

3. **Test Each Module**:
   - Log in as Simeon (`simeon@kinkit.app` / `password123`)
   - Visit each module page and verify seed data appears:
     - `/tasks` - Should show 8 example tasks
     - `/rewards` - Should show 5 example rewards
     - `/achievements` - Should show 4 unlocked achievements
     - `/rules` - Should show 8 example rules
     - `/boundaries` - Should show 15 example activities
     - `/contract` - Should show 1 example contract
     - `/communication` - Should show 3 example messages and 4 check-ins
     - `/journal` - Should show 5 example entries
     - `/calendar` - Should show 5 example events
     - `/analytics` - Should show calculated stats from seed data
     - `/resources` - Should show 7 example resources

4. **Test as Different User**:
   - Authenticate via Notion OAuth (creates new user)
   - Join the seed bond "Simeon & Kevin's Dynamic"
   - Verify seed data appears for all modules (because you're in the seed bond)
   - Verify user can see seed data as examples

---

## Constants Used

```typescript
const SEED_BOND_ID = "40000000-0000-0000-0000-000000000001"
const SEED_USER_IDS = [
  "00000000-0000-0000-0000-000000000001", // Simeon
  "00000000-0000-0000-0000-000000000002", // Kevin
]
```

---

## Expected Behavior After Fix

### For Seed Users (Simeon/Kevin)
- See all their own seed data (tasks, rewards, achievements)
- See all bond-scoped seed data (rules, boundaries, contracts, journal, calendar, resources)
- See seed messages and check-ins

### For Other Users in Seed Bond
- See seed data as examples (tasks, rewards, achievements)
- See all bond-scoped seed data (rules, boundaries, contracts, journal, calendar, resources)
- See seed messages and check-ins as examples

### For Users NOT in Seed Bond
- See only their own data
- Do NOT see seed data (expected behavior)

---

## Next Steps

1. **Run `supabase db reset`** to apply seed.sql changes
2. **Test each module** to verify seed data appears
3. **Verify RLS policies** allow access to seed data
4. **Check browser console** for any API errors
5. **Verify user is logged in** as one of the seed users OR has joined the seed bond

---

## Notes

- Seed data is now accessible to all users in the seed bond, not just seed users
- This makes seed data serve as examples for all bond members
- Users can still edit/delete seed data examples
- Seed data uses `ON CONFLICT DO NOTHING` so it's safe to re-run migrations

---

**Status**: ✅ **All fixes applied - Ready for testing**
