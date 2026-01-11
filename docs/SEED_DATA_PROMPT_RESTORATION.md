# Seed Data Prompt Restoration

**Date**: 2026-02-15  
**Status**: ✅ **RESTORED**

---

## Issue

The seed data prompt functionality existed in code but was not connected to the UI flow in onboarding. After bond creation, users were never asked if they wanted example data.

---

## Root Cause

1. **Missing State Management**: `handleCreateBond` created the bond but didn't:
   - Set `createdBondId` state
   - Set `showSeedDataPrompt(true)` to trigger the dialog

2. **Missing UI Component**: No Dialog component was rendered to show the seed data prompt

3. **Orphaned Function**: `handleCopySeedData` existed but was never called because the prompt never appeared

---

## Solution

### 1. Fixed `handleCreateBond` Function

**Before**:
```typescript
onNext({
  bond_id: data.bond.id,
  bond_name: data.bond.name,
  bond_type: data.bond.bond_type,
  bond_mode: "create",
})
```

**After**:
```typescript
// Store bond ID and show seed data prompt
setCreatedBondId(data.bond.id)
setShowSeedDataPrompt(true)
```

### 2. Added Dialog Component

Added a complete Dialog UI component that:
- Shows after bond creation
- Explains what example data includes
- Provides "Skip for Now" and "Yes, Add Examples" buttons
- Shows loading state while copying
- Prevents accidental closure during copy operation

### 3. Improved Bond Settings

Enhanced the Bond Settings seed data copy:
- Better error messages with details
- More informative success toast with item counts
- Improved logging for debugging

---

## Files Modified

1. **`components/onboarding/steps/bond-setup-step.tsx`**:
   - Added Dialog imports
   - Fixed `handleCreateBond` to trigger prompt
   - Added Dialog UI component
   - Added dialog close prevention during copy

2. **`components/bonds/bond-settings.tsx`**:
   - Enhanced success toast with item counts
   - Improved error handling and logging
   - Extended refresh delay for better UX

---

## User Flow

### Onboarding Flow:
1. User creates bond → Bond created successfully
2. **NEW**: Dialog appears asking "Add Example Data?"
3. User chooses:
   - **"Yes, Add Examples"**: Copies seed data, shows success, proceeds to next step
   - **"Skip for Now"**: Proceeds to next step without seed data
4. User can add seed data later from Bond Settings

### Bond Settings Flow:
1. User navigates to Bond Settings
2. Scrolls to "Example Data" section
3. Clicks "Add Example Data" button
4. Seed data is copied
5. Success toast shows with item counts
6. Page refreshes after 2 seconds to show new data

---

## Testing Checklist

### Onboarding:
- [ ] Create a new bond during onboarding
- [ ] Verify dialog appears after bond creation
- [ ] Click "Yes, Add Examples" → Verify seed data is copied
- [ ] Click "Skip for Now" → Verify proceeds without copying
- [ ] Verify dialog cannot be closed during copy operation
- [ ] Verify data appears in Rules, Tasks, Boundaries after copy

### Bond Settings:
- [ ] Navigate to Bond Settings
- [ ] Click "Add Example Data" button
- [ ] Verify success toast shows correct counts
- [ ] Verify page refreshes and shows new data
- [ ] Test error handling (e.g., if seed data doesn't exist)

---

## Technical Details

### Dialog Implementation

```typescript
<Dialog 
  open={showSeedDataPrompt} 
  onOpenChange={(open) => {
    // Prevent closing dialog while copying
    if (!open && !copyingSeedData) {
      setShowSeedDataPrompt(false)
    }
  }}
>
  <DialogContent showCloseButton={!copyingSeedData}>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### State Management

- `showSeedDataPrompt`: Controls dialog visibility
- `createdBondId`: Stores bond ID for seed data copy
- `copyingSeedData`: Prevents dialog closure during copy

### Error Handling

Both flows handle errors gracefully:
- Onboarding: Shows error toast, still proceeds to next step (seed data is optional)
- Bond Settings: Shows detailed error messages, doesn't refresh page on error

---

## Future Improvements

1. **Progress Indicator**: Show progress during seed data copy (e.g., "Copying rules...", "Copying tasks...")

2. **Selective Copy**: Allow users to choose which modules to copy (e.g., only Rules and Tasks)

3. **Replace Option**: Add option to replace existing seed data instead of skipping if data already exists

4. **Visual Feedback**: Show preview of what will be copied before confirming
