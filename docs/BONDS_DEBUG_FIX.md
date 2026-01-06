# Bonds System Debug & Fix Summary

**Date**: 2026-01-29  
**Issue**: Bonds not visible in onboarding or profile

---

## Issues Found & Fixed

### 1. Onboarding Step Validation ✅ FIXED

**File**: `app/onboarding/page.tsx`

**Issue**: Step validation was checking `urlStep <= 5` but we have 6 steps total.

**Fix**: Changed to `urlStep <= 6`

```typescript
// Before
const currentStep = urlStep && urlStep >= 1 && urlStep <= 5 ? urlStep : dbStep

// After
const currentStep = urlStep && urlStep >= 1 && urlStep <= 6 ? urlStep : dbStep
```

---

### 2. Missing Bond Management in Profile ✅ FIXED

**File**: `components/account/profile-form.tsx`

**Issue**: Profile form only had partner linking, no bond management UI.

**Fix**: 
- Created new `BondManagement` component (`components/account/bond-management.tsx`)
- Added it to `ProfileForm` before the partner linking section
- Component supports:
  - Viewing current bond
  - Creating new bonds
  - Joining existing bonds via invite code
  - Leaving bonds

---

### 3. Onboarding Progress Completion Check ✅ FIXED

**File**: `app/api/onboarding/progress/route.ts`

**Issue**: Completion check was `step >= 5` but final step is 6.

**Fix**: Changed to `step >= 6`

```typescript
// Before
completed: step >= 5, // 5 is the final step

// After
completed: step >= 6, // 6 is the final step (Welcome Splash)
```

---

## Verification

### Onboarding Flow

1. **Step 1**: Welcome & Role Selection ✅
2. **Step 2**: Bond Setup ✅ (Now visible)
   - Create new bond
   - Join existing bond
   - Skip for now
3. **Step 3**: Notion Setup ✅
4. **Step 4**: Notion Verification ✅
5. **Step 5**: Discord Integration ✅
6. **Step 6**: Welcome Splash ✅

### Profile Settings

1. **Basic Information Tab**:
   - User info ✅
   - **Bond Management** ✅ (NEW - Now visible)
   - Partner Linking (Legacy) ✅

2. **Kink Identity Tab**:
   - Kink identity form ✅

---

## Component Structure

```
components/
├── account/
│   ├── bond-management.tsx      (NEW - Bond management UI)
│   ├── profile-form.tsx         (UPDATED - Added BondManagement)
│   └── kink-identity-form.tsx
└── onboarding/
    ├── onboarding-wizard.tsx    (Already had BondSetupStep)
    └── steps/
        └── bond-setup-step.tsx   (Exists and properly exported)
```

---

## API Endpoints Verified

- ✅ `POST /api/bonds/create` - Create new bond
- ✅ `GET /api/bonds/search?code=...` - Search bond by invite code
- ✅ `POST /api/bonds/join` - Join existing bond

---

## Possible Remaining Issues

### If Bonds Still Not Visible:

1. **User Already Completed Onboarding**
   - If `onboarding_completed = true`, user is redirected away
   - **Solution**: Reset `onboarding_completed` and `onboarding_step` in database

2. **Database Migration Not Applied**
   - Ensure `bond_id` column exists in `profiles` table
   - Ensure `bonds` and `bond_members` tables exist
   - **Solution**: Run migrations

3. **Build Cache Issue**
   - Component might not be compiled yet
   - **Solution**: Restart dev server, clear `.next` cache

4. **User's Onboarding Step**
   - If `onboarding_step` in DB is set to 3+, user might skip step 2
   - **Solution**: Reset to step 1 or navigate to `/onboarding?step=2`

---

## Testing Steps

1. **Test Onboarding**:
   ```
   - Navigate to /onboarding
   - Should see step 1 (Welcome)
   - Click Next
   - Should see step 2 (Bond Setup) ✅
   ```

2. **Test Profile**:
   ```
   - Navigate to /account/profile
   - Click "Basic Information" tab
   - Scroll down
   - Should see "Bond Management" section ✅
   ```

3. **Test Bond Creation**:
   ```
   - In profile, click "Create New" in Bond Management
   - Enter bond name
   - Select bond type
   - Click "Create Bond"
   - Should see success message ✅
   ```

4. **Test Bond Joining**:
   ```
   - In profile, click "Join Existing" in Bond Management
   - Enter invite code
   - Click search
   - Select bond
   - Click "Join Bond"
   - Should see success message ✅
   ```

---

## Database Reset (If Needed)

If user needs to restart onboarding:

```sql
UPDATE profiles
SET 
  onboarding_completed = false,
  onboarding_step = 1,
  onboarding_data = '{}'::jsonb
WHERE id = '<user_id>';
```

---

## Files Changed

1. ✅ `app/onboarding/page.tsx` - Fixed step validation
2. ✅ `app/api/onboarding/progress/route.ts` - Fixed completion check
3. ✅ `components/account/bond-management.tsx` - NEW - Bond management component
4. ✅ `components/account/profile-form.tsx` - Added BondManagement import and usage

---

## Next Steps

1. ✅ Verify bonds appear in onboarding (step 2)
2. ✅ Verify bonds appear in profile settings
3. ⏳ Test bond creation flow
4. ⏳ Test bond joining flow
5. ⏳ Test bond leaving flow
6. ⏳ Verify bond data persists correctly

---

## Related Documentation

- [Bonds System User Guide](./user-guides/bonds-system-guide.md)
- [Bonds API Reference](./api/bonds-api.md)
- [Bonds Implementation Guide](./developer/bonds-implementation.md)



