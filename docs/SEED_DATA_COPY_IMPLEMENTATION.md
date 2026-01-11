# Seed Data Copy Implementation

**Date**: 2026-02-15  
**Status**: ✅ **IMPLEMENTED**

---

## Overview

This implementation provides users with the option to copy comprehensive example data into their bond during onboarding. This helps new users understand how KINK IT works by seeing realistic examples of rules, tasks, boundaries, contracts, journal entries, calendar events, and resources.

---

## Approach: Dynamic Linking with User Prompt

**Selected Approach**: Approach 1 - Dynamic Linking  
**Method**: Copy seed data (not link) - each user gets their own editable version  
**When**: Only during onboarding Step 2 (bond creation)  
**User Control**: Prompt with clear explanation - "Would you like example data?"

---

## Implementation Components

### 1. Database Function

**File**: `supabase/migrations/20260215000008_copy_seed_data_to_bond.sql`

**Function**: `copy_seed_data_to_bond(p_bond_id uuid, p_user_id uuid)`

**Features**:
- SECURITY DEFINER to bypass RLS policies
- Copies data from seed bond (`40000000-0000-0000-0000-000000000001`) to user's bond
- Updates all foreign keys:
  - `bond_id` → user's bond
  - `created_by`, `assigned_to`, `assigned_by`, `added_by` → user's ID
- Resets task/reward statuses to `pending`/`available` for examples
- Returns JSON summary of copied items

**Modules Copied**:
1. Rules (8 items)
2. Boundaries (15 items)
3. Contracts (1 item, set to `draft` status)
4. Tasks (8 items, self-assigned to user)
5. Rewards (5 items, self-assigned to user)
6. Journal Entries (5 items)
7. Calendar Events (5 items)
8. Resources (7 items)

**Total**: ~54 example items across 8 modules

**Not Copied**:
- Messages (requires partner)
- Check-ins (requires partner)
- Achievements (user-specific progress)
- Analytics (calculated data)

---

### 2. API Endpoint

**File**: `app/api/bonds/copy-seed-data/route.ts`

**Endpoint**: `POST /api/bonds/copy-seed-data`

**Request Body**:
```json
{
  "bond_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Seed data copied successfully",
  "data": {
    "success": true,
    "bond_id": "uuid",
    "user_id": "uuid",
    "copied": {
      "rules": 8,
      "boundaries": 15,
      "contracts": 1,
      "tasks": 8,
      "rewards": 5,
      "journal_entries": 5,
      "calendar_events": 5,
      "resources": 7
    },
    "total": 54
  }
}
```

**Security**:
- Verifies user authentication
- Verifies user is active member of bond
- Calls database function with proper error handling

---

### 3. UI Component

**File**: `components/onboarding/steps/bond-setup-step.tsx`

**Features**:
- Shows prompt **only after bond creation** (not when joining)
- Clear explanation of what example data provides
- Benefits listed:
  - Example rules and protocols
  - Sample tasks and rewards
  - Boundary examples
  - Journal entries and calendar events
  - Educational resources
- Two options:
  - "Yes, Add Examples" - Copies seed data
  - "Skip" - Proceeds without examples
- Loading state during copy operation
- Success toast showing number of items added
- Dismissible (X button)

**User Experience**:
1. User creates bond → Bond created successfully
2. Prompt appears: "Would you like example data?"
3. User chooses:
   - **Yes**: Seed data copied, toast shows count, proceed to next step
   - **Skip**: Proceed to next step without examples
4. Examples are fully editable and can be deleted anytime

---

## User Flow

### Creating a Bond with Examples

1. **Step 2: Bond Setup**
   - User enters bond name, description, type
   - Clicks "Create Bond"
   - Bond created successfully ✅

2. **Seed Data Prompt Appears**
   - Clear explanation of benefits
   - List of what will be added
   - Two buttons: "Yes, Add Examples" or "Skip"

3. **If User Chooses "Yes, Add Examples"**:
   - Loading state: "Adding Examples..."
   - API call to `/api/bonds/copy-seed-data`
   - Database function copies ~54 items
   - Success toast: "Added 54 example items to your bond!"
   - Proceed to Step 3 (Notion Setup)

4. **If User Chooses "Skip"**:
   - Prompt dismissed
   - Proceed to Step 3 (Notion Setup)
   - No examples added

### Joining an Existing Bond

- **No prompt shown** - Seed data copy is only for new bonds created during onboarding
- User proceeds directly to next step

---

## Technical Details

### Foreign Key Mapping

**Rules, Boundaries, Contracts, Journal, Calendar, Resources**:
- `bond_id`: Seed bond → User's bond
- `created_by`: Seed users → New user

**Tasks**:
- `workspace_id`: Seed bond → User's bond
- `assigned_by`: Seed users → New user
- `assigned_to`: Seed users → New user (self-assigned)
- `status`: Reset to `pending`
- `completed_at`, `approved_at`: Reset to NULL

**Rewards**:
- `workspace_id`: Seed bond → User's bond
- `assigned_by`: Seed users → New user
- `assigned_to`: Seed users → New user (self-assigned)
- `status`: Reset to `available`
- `redeemed_at`: Reset to NULL

### Self-Assignment Strategy

Tasks and rewards are **self-assigned** to the user (both `assigned_by` and `assigned_to` = user ID). This ensures:
- Examples work for both dominants and submissives
- Users can see how tasks/rewards function regardless of role
- Examples are immediately actionable

### Status Resets

- **Tasks**: Reset to `pending` status (not completed)
- **Rewards**: Reset to `available` status (not redeemed)
- **Contracts**: Set to `draft` status (user can review before activating)

---

## Testing Instructions

### 1. Apply Migration

```bash
supabase db reset
```

This will:
- Create the `copy_seed_data_to_bond` function
- Ensure seed bond exists with seed data

### 2. Test Bond Creation with Examples

1. **Start Onboarding**:
   - Log in via Notion OAuth
   - Complete Step 1 (Role Selection)

2. **Create Bond**:
   - Step 2: Enter bond name, description, type
   - Click "Create Bond"
   - ✅ Bond created successfully

3. **Seed Data Prompt**:
   - Prompt should appear immediately after bond creation
   - Shows clear explanation and benefits
   - Two options visible

4. **Test "Yes, Add Examples"**:
   - Click "Yes, Add Examples"
   - Loading state appears
   - Success toast: "Added X example items to your bond!"
   - Proceed to Step 3

5. **Verify Examples**:
   - Navigate to `/rules` - Should see 8 example rules
   - Navigate to `/tasks` - Should see 8 example tasks
   - Navigate to `/boundaries` - Should see 15 example boundaries
   - Navigate to `/contract` - Should see 1 example contract (draft)
   - Navigate to `/journal` - Should see 5 example entries
   - Navigate to `/calendar` - Should see 5 example events
   - Navigate to `/resources` - Should see 7 example resources

6. **Test "Skip"**:
   - Create another bond
   - Click "Skip" on prompt
   - Verify no examples added
   - Modules should show empty states

### 3. Test Joining Bond

1. **Join Existing Bond**:
   - Use invite code to join bond
   - ✅ No prompt should appear
   - Proceed directly to next step

### 4. Test Error Handling

1. **Invalid Bond ID**:
   - Call API with non-existent bond_id
   - Should return 403 error

2. **User Not Member**:
   - Try to copy seed data to bond user isn't member of
   - Should return 403 error

3. **Database Function Error**:
   - Function should return error JSON
   - API should handle gracefully
   - User should still proceed to next step

---

## Benefits

### For Users

✅ **Faster Onboarding**: See how KINK IT works immediately  
✅ **Learning Tool**: Understand features through examples  
✅ **Editable**: All examples can be modified or deleted  
✅ **Optional**: Can skip if preferred  
✅ **Clear Purpose**: Understand what examples provide

### For Development

✅ **No Schema Changes**: Uses existing tables  
✅ **RLS Compliant**: Function uses SECURITY DEFINER  
✅ **Maintainable**: Single source of truth (seed bond)  
✅ **Testable**: Easy to verify copy operation  
✅ **Scalable**: Can add more seed data without code changes

---

## Future Enhancements

Potential improvements:
1. **Role-Based Examples**: Different examples for dominants vs submissives
2. **Template Selection**: Choose from multiple example sets
3. **Partial Copy**: Let users select which modules to copy
4. **Example Indicators**: Visual badges showing "Example" items
5. **Bulk Delete**: "Clear all examples" button

---

## Files Modified

1. ✅ `supabase/migrations/20260215000008_copy_seed_data_to_bond.sql` - Database function
2. ✅ `app/api/bonds/copy-seed-data/route.ts` - API endpoint
3. ✅ `components/onboarding/steps/bond-setup-step.tsx` - UI prompt component

---

## Migration Status

**Migration File**: `20260215000008_copy_seed_data_to_bond.sql`  
**Status**: Ready to apply  
**Dependencies**: None  
**Rollback**: Drop function if needed

---

**Next Step**: Run `supabase db reset` to apply migration and test the implementation!
