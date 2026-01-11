# Notion Template Sync Debug Report

**Date**: 2026-02-02  
**Status**: 🔧 Debugging & Fixes Applied

---

## Problem Summary

Template sync is failing with "Template not found" error during onboarding step 3, even though the template exists. This started happening after implementing the OAuth token refresh system.

---

## Root Causes Identified

### 1. Missing `duplicated_template_id` Usage (PRIMARY ISSUE)

**Problem**: 
- Notion provides `duplicated_template_id` in the OAuth response when user duplicates template
- We were storing it but NOT using it for template sync
- Instead, we were searching through all pages, which is unreliable

**Impact**: 
- Search might not find the template if:
  - Template title doesn't match keywords exactly
  - Template is in a different location
  - Search API has permission issues
  - Too many pages in workspace

**Solution**: 
- ✅ Created `get_user_notion_duplicated_template_id()` function
- ✅ Updated sync-template route to use `duplicated_template_id` FIRST
- ✅ Only fall back to search if `duplicated_template_id` not available

### 2. Insufficient Error Logging

**Problem**:
- No visibility into what the search API returns
- Can't see why template matching fails
- Hard to debug without detailed logs

**Solution**:
- ✅ Added comprehensive logging throughout sync process
- ✅ Log search results, page titles, database counts
- ✅ Log errors with full context

### 3. Token Retrieval Issues

**Problem**:
- `getNotionAccessToken()` might fail silently
- No fallback to session token in sync route
- Database function errors not logged

**Solution**:
- ✅ Added fallback to `session.provider_token` in sync route
- ✅ Added error logging in `getNotionAccessToken()`
- ✅ Better error messages for users

---

## Changes Made

### 1. New Database Function

**File**: `supabase/migrations/20260202000004_add_get_duplicated_template_id_function.sql`

\`\`\`sql
CREATE OR REPLACE FUNCTION public.get_user_notion_duplicated_template_id(
  p_user_id uuid
) RETURNS text
\`\`\`

**Purpose**: Retrieve the template page ID that Notion provided during OAuth

### 2. Updated Sync Route Logic

**File**: `app/api/onboarding/notion/sync-template/route.ts`

**New Flow**:
1. **First**: Try to get `duplicated_template_id` from stored OAuth tokens
2. **If found**: Use it directly to fetch template page and databases
3. **If not found**: Fall back to search method
4. **Enhanced logging**: Log every step for debugging

**Key Changes**:
- Check for `duplicated_template_id` before searching
- Use direct page fetch instead of search when ID available
- Comprehensive logging at each step
- Better error messages with context

### 3. Enhanced Error Handling

**Files**: 
- `app/api/onboarding/notion/sync-template/route.ts`
- `components/onboarding/steps/notion-setup-step.tsx`

**Improvements**:
- Log search API errors with full details
- Log page titles found during search
- Log database counts for each potential template
- Show debug info in error responses (in development)

---

## Expected Behavior After Fix

### Scenario 1: User Has `duplicated_template_id` (Most Common)

1. User authenticates with Notion OAuth and duplicates template
2. `duplicated_template_id` is stored in `user_notion_oauth_tokens`
3. User clicks "Sync with Notion" in onboarding
4. Route retrieves `duplicated_template_id` from database
5. Route fetches template page directly using the ID
6. Route discovers databases from page children
7. ✅ **Success** - Template synced immediately

### Scenario 2: User Doesn't Have `duplicated_template_id` (Fallback)

1. User authenticates but didn't duplicate template during OAuth
2. No `duplicated_template_id` stored
3. User clicks "Sync with Notion"
4. Route falls back to search method
5. Route searches for pages matching template keywords
6. Route checks each page for child databases
7. ✅ **Success** if template found, ❌ **Error** if not found

---

## Debugging Information

### Console Logs to Check

When sync fails, check browser console and server logs for:

1. **Token Retrieval**:
   \`\`\`
   "Using session provider_token as fallback for template sync"
   "No Notion access token available for user: <user_id>"
   \`\`\`

2. **Template ID Check**:
   \`\`\`
   "Found duplicated_template_id from OAuth: <template_id>"
   "No duplicated_template_id found, using search method"
   \`\`\`

3. **Search Results**:
   \`\`\`
   "Notion search returned X pages"
   "Searched X pages. Found Y with titles. Titles: [...]"
   \`\`\`

4. **Template Matching**:
   \`\`\`
   "Found potential template page: '<title>' (ID: <id>)"
   "Page '<title>' has X child databases"
   "✓ Template found: '<title>' with X databases"
   \`\`\`

5. **Errors**:
   \`\`\`
   "Notion search API error: {...}"
   "Template not found after searching {...}"
   \`\`\`

---

## Testing Steps

1. **Test with `duplicated_template_id`**:
   - Sign in with Notion OAuth
   - Make sure to duplicate template during OAuth
   - Go to onboarding step 3
   - Click "Sync with Notion"
   - Should succeed immediately

2. **Test Search Fallback**:
   - Sign in with Notion OAuth (without duplicating template)
   - Manually duplicate template in Notion
   - Go to onboarding step 3
   - Click "Sync with Notion"
   - Should find template via search

3. **Test Error Handling**:
   - Check console logs for detailed error messages
   - Verify error messages are helpful
   - Check that manual entry still works

---

## Next Steps if Still Failing

If sync still fails after these fixes:

1. **Check Console Logs**: Look for the detailed logs we added
2. **Verify Token**: Ensure token is valid and has correct permissions
3. **Check Notion Integration**: Verify integration has access to workspace
4. **Verify Template**: Ensure template actually exists and has databases
5. **Check Permissions**: Notion integration needs "Read content" capability

---

## Files Modified

1. `supabase/migrations/20260202000004_add_get_duplicated_template_id_function.sql` - New function
2. `app/api/onboarding/notion/sync-template/route.ts` - Major updates
3. `components/onboarding/steps/notion-setup-step.tsx` - Enhanced error logging
4. `app/auth/callback/route.ts` - Improved workspace_id extraction (previous fix)

---

## Migration Required

**Important**: Apply the new migration before testing:

\`\`\`bash
supabase migration up
\`\`\`

This creates the `get_user_notion_duplicated_template_id()` function needed for the fix.
