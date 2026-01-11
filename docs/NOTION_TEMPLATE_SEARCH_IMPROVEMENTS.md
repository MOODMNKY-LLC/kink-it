# Notion Template Search Improvements

**Date**: 2026-02-02  
**Status**: ✅ Improvements Applied

---

## Problem

Template sync was failing because:
1. We weren't using `duplicated_template_id` when available
2. Search was too strict (required exact title match + 5+ databases)
3. Didn't handle cases where users select existing pages during OAuth
4. No visibility into what pages were found

---

## Solution Overview

### 1. Use `duplicated_template_id` First (Most Reliable)

**New Flow**:
1. Check for `duplicated_template_id` from OAuth tokens
2. If found, use it directly (no search needed)
3. If not found, fall back to search

**Why**: When users duplicate template during OAuth, Notion provides the exact page ID. This is 100% reliable.

### 2. Improved Search Logic

**Changes**:
- **Expanded keywords**: Added more variations ("KINKIT", "Kink It", "template", etc.)
- **Lowered thresholds**: 
  - Exact match: 3+ databases (was 5)
  - Heuristic: 5+ databases (was 10)
- **Increased search size**: 100 pages (was 50)
- **Better matching**: Fuzzy matching on titles, checks for "kink" anywhere

**Why**: Users might have templates with different names or fewer databases.

### 3. Enhanced Error Messages

**New Features**:
- Shows how many pages were found
- Lists pages with databases (so user can see what's available)
- Explains why sync failed
- Provides actionable suggestions

**Example Error**:
\`\`\`
Found 15 pages, but none match the expected template structure.
Found pages with databases: "My KINK IT Setup" (8 databases), "Tasks & Rules" (6 databases).
If one of these is your template, you can enter its page ID manually below.
\`\`\`

### 4. Comprehensive Logging

**Added Logs**:
- Token retrieval status
- Template ID check results
- Search results count
- Page titles found
- Database counts per page
- Matching results

**Purpose**: Makes debugging much easier when sync fails.

---

## How It Works Now

### Scenario 1: User Duplicated Template During OAuth

1. OAuth stores `duplicated_template_id`
2. Sync retrieves it from database
3. Fetches template page directly
4. ✅ **Success** - No search needed

### Scenario 2: User Selected Existing Page During OAuth

1. No `duplicated_template_id` stored
2. Sync searches for pages (up to 100)
3. Looks for pages matching template keywords
4. Checks pages with many databases (heuristic)
5. ✅ **Success** if found, ❌ **Error with helpful message** if not

### Scenario 3: Manual Entry

1. User can always enter page ID manually
2. Error messages show available pages with databases
3. User can copy ID from error message

---

## Key Improvements

### Database Function

**File**: `supabase/migrations/20260202000004_add_get_duplicated_template_id_function.sql`

\`\`\`sql
CREATE OR REPLACE FUNCTION public.get_user_notion_duplicated_template_id(
  p_user_id uuid
) RETURNS text
\`\`\`

Retrieves the template page ID that Notion provided during OAuth.

### Search Flexibility

**Before**:
- Required exact title match
- Required 5+ databases for exact match
- Required 10+ databases for heuristic
- Searched 50 pages

**After**:
- Fuzzy title matching
- Requires 3+ databases for exact match
- Requires 5+ databases for heuristic
- Searches 100 pages
- Expanded keyword list

### Error Messages

**Before**:
\`\`\`
Template not found. Please ensure you duplicated the template...
\`\`\`

**After**:
\`\`\`
Found 15 pages, but none match the expected template structure.
Found pages with databases: "My KINK IT Setup" (8 databases)...
If one of these is your template, you can enter its page ID manually below.
\`\`\`

---

## Testing

1. **Test with duplicated template**:
   - Sign in with Notion OAuth, duplicate template
   - Should sync immediately using `duplicated_template_id`

2. **Test with existing page**:
   - Sign in with Notion OAuth, select existing page
   - Should find it via search
   - Check console logs for search process

3. **Test error handling**:
   - If sync fails, check error message
   - Should show available pages with databases
   - User can copy page ID from error message

---

## Files Modified

1. `supabase/migrations/20260202000004_add_get_duplicated_template_id_function.sql` - New function
2. `app/api/onboarding/notion/sync-template/route.ts` - Major improvements
3. `components/onboarding/steps/notion-setup-step.tsx` - Better error display

---

## Next Steps

1. **Apply Migration**: Run `supabase migration up`
2. **Test**: Try syncing with both duplicated and existing templates
3. **Monitor Logs**: Check console for detailed search process
4. **Iterate**: Adjust thresholds/keywords based on real-world results

---

## Future Enhancements

Consider adding:
1. **Page Selection UI**: Show search results and let user select
2. **Template Detection**: Use ML/pattern matching to identify templates
3. **Database Schema Matching**: Match by database structure, not just count
4. **Recent Pages**: Prioritize recently accessed pages
