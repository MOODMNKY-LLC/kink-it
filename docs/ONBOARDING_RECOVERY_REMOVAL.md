# Onboarding Recovery Step Removal

**Date**: 2026-01-10  
**Status**: ✅ **COMPLETE**

---

## Problem Analysis

### Why Recovery Was Problematic in Onboarding

1. **False Positives**: New users just duplicated the template → databases exist in Notion but Supabase is empty → triggers "recovery needed" when there's nothing to recover

2. **UX Violations**:
   - **Progressive Disclosure**: Recovery is an advanced feature shown to beginners
   - **Reduce Friction**: Adds unnecessary step during initial setup
   - **Clear Value**: Confusing for new users ("recover what? I just started!")
   - **Context-Appropriate**: Recovery is for returning users with data loss, not new users

3. **User Mental State**:
   - During onboarding: User wants to complete setup and start using the app
   - Recovery is REACTIVE (user needs it when they discover data loss)
   - Not PROACTIVE (shouldn't be forced during setup)

---

## Solution Implemented

### 1. ✅ Removed from Onboarding

**Changes**:
- Removed `NotionRecoveryStep` import from `onboarding-wizard.tsx`
- Updated `TOTAL_STEPS` from 7 to 6
- Removed case 6 (recovery step) from wizard
- Step 6 now goes directly to Welcome Splash (completion)

**Files Modified**:
- `components/onboarding/onboarding-wizard.tsx`

### 2. ✅ Added to Account Settings

**New Location**: `/account/settings/data-recovery`

**Implementation**:
- Created new page: `app/account/settings/data-recovery/page.tsx`
- Created new component: `components/account/notion-data-recovery-settings.tsx`
- Added "Data Recovery" tab to settings layout
- Uses existing `DataRecoveryFlow` component (reusable)

**Files Created**:
- `app/account/settings/data-recovery/page.tsx`
- `components/account/notion-data-recovery-settings.tsx`

**Files Modified**:
- `app/account/settings/layout.tsx` - Added Data Recovery tab

---

## Benefits

### For New Users
- ✅ Cleaner onboarding flow (6 steps instead of 7)
- ✅ No confusing "recovery" prompts during setup
- ✅ Faster time to value (less friction)
- ✅ Focus on setup, not recovery

### For Returning Users
- ✅ Recovery is discoverable when needed
- ✅ Optional (not forced)
- ✅ Context-appropriate (in settings, not onboarding)
- ✅ Can be accessed anytime via Settings → Data Recovery

### For All Users
- ✅ Better UX alignment (recovery is emergency tool, not setup step)
- ✅ Follows UX best practices (progressive disclosure, reduce friction)
- ✅ More intuitive placement (settings = advanced features)

---

## User Flow

### New User Onboarding
1. Welcome & Role Selection
2. Bond Setup
3. Notion Setup
4. Notion Verification
5. Notion API Key
6. Welcome Splash ✅ **Complete!**

### Returning User Needing Recovery
1. Navigate to Settings → Data Recovery
2. System checks recovery status
3. If recovery needed → Shows available databases
4. User clicks "Start Recovery"
5. Recovery flow opens (same as before)

---

## Detection Logic

The recovery detection hook (`useNotionRecoveryDetection`) remains unchanged:
- Detects empty databases (Supabase empty but Notion has data)
- Detects sync failures
- Returns scenario with available databases

**Key Difference**: Detection is now **on-demand** (when user visits settings) instead of **forced** (during onboarding).

---

## Migration Notes

### For Existing Users
- Users already past step 6 will complete normally
- Recovery step will be skipped for new users
- Existing users can access recovery via Settings → Data Recovery

### Backward Compatibility
- Recovery component (`NotionRecoveryStep`) still exists but unused
- Can be removed in future cleanup if desired
- `DataRecoveryFlow` component reused in settings (no duplication)

---

## Future Enhancements

### Optional Improvements
1. **Smart Notifications**: Show notification banner if sync failures detected AFTER onboarding
2. **Help Documentation**: Link to recovery guide in help docs
3. **Search Integration**: Make recovery discoverable via search
4. **Contextual Help**: Show recovery option when sync errors occur

---

## Files Summary

### Removed/Modified
- ✅ `components/onboarding/onboarding-wizard.tsx` - Removed recovery step

### Created
- ✅ `app/account/settings/data-recovery/page.tsx` - New settings page
- ✅ `components/account/notion-data-recovery-settings.tsx` - Settings component

### Modified
- ✅ `app/account/settings/layout.tsx` - Added Data Recovery tab

### Unchanged (Reused)
- ✅ `components/notion/data-recovery-flow.tsx` - Reused in settings
- ✅ `hooks/use-notion-recovery-detection.ts` - Same detection logic
- ✅ `components/onboarding/steps/notion-recovery-step.tsx` - Can be removed later

---

**Status**: ✅ **COMPLETE** - Recovery moved from onboarding to account settings
