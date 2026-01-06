# Production Environment Variables Debug Report

**Date:** February 2, 2025  
**Status:** ✅ Complete - Variables Added & Deployment Triggered

## Problem Statement

Notion API key functionality worked in development but failed in production. Production instance was missing several critical environment variables.

## Root Cause Analysis

### Primary Issue: Missing Encryption Key

The Notion API key feature requires **two** environment variables:

1. **`NOTION_API_KEY`** - The actual Notion API key (✅ was present)
2. **`NOTION_API_KEY_ENCRYPTION_KEY`** - Encryption key for storing user-provided keys (❌ was missing)

**Why This Matters:**
- The app allows users to upload their own Notion API keys
- These keys are encrypted before storage using `pgcrypto`
- The encryption key (`NOTION_API_KEY_ENCRYPTION_KEY`) is required to:
  - Encrypt keys when users upload them (`encrypt_notion_api_key` function)
  - Decrypt keys when making API calls (`decrypt_notion_api_key` function)
  - Without it, the encryption/decryption functions fail with "Server configuration error"

**Code Reference:**
- `app/api/notion/api-keys/route.ts` line 108: Checks for `NOTION_API_KEY_ENCRYPTION_KEY`
- `supabase/migrations/20260131000000_create_user_notion_api_keys.sql`: Uses encryption key parameter

### Secondary Issues: Missing API Keys

Additional missing variables that would cause failures:
- `AI_GATEWAY_API_KEY` - Required for AI image generation features
- `V0_API_KEY` - Required for v0 UI generation features

## Solution Implemented

### 1. Created Automated Sync Script

**File:** `scripts/update-vercel-env-vars.ps1`

Features:
- Reads values from `.env.local`
- Checks existing Vercel production variables
- Only adds missing variables (avoids duplicates)
- Supports `-ForceUpdate` flag for updating existing vars
- Handles both required and optional variables

### 2. Added Missing Variables

Successfully added to Vercel production:
- ✅ `NOTION_API_KEY_ENCRYPTION_KEY`
- ✅ `AI_GATEWAY_API_KEY`
- ✅ `V0_API_KEY`

### 3. Verified Existing Variables

Confirmed these were already present:
- ✅ `NOTION_API_KEY`
- ✅ `NOTION_APP_IDEAS_DATABASE_ID`
- ✅ `NEXT_PUBLIC_NOTION_TEMPLATE_URL`
- ✅ `SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID`
- ✅ `SUPABASE_AUTH_EXTERNAL_NOTION_SECRET`
- ✅ `OPENAI_API_KEY`
- ✅ `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- ✅ `VAPID_PRIVATE_KEY`
- ✅ `VERCEL_TOKEN`

### 4. Triggered Production Deployment

Deployment initiated:
- **Deployment URL:** https://kink-9e4f0p9f2-mood-mnkys-projects.vercel.app
- **Inspect URL:** https://vercel.com/mood-mnkys-projects/kink-it/59qbk8jgcqwEwdA8jRU4ipUz8EWt
- **Status:** Building/Completing

## Environment Variables Reference

### Notion Integration (All Required)

| Variable | Purpose | Status |
|----------|---------|--------|
| `NOTION_API_KEY` | Main Notion API key | ✅ Present |
| `NOTION_API_KEY_ENCRYPTION_KEY` | Encryption key for stored user keys | ✅ **Added** |
| `NOTION_APP_IDEAS_DATABASE_ID` | Database ID for app ideas | ✅ Present |
| `NEXT_PUBLIC_NOTION_TEMPLATE_URL` | Template URL for onboarding | ✅ Present |
| `SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID` | Notion OAuth Client ID | ✅ Present |
| `SUPABASE_AUTH_EXTERNAL_NOTION_SECRET` | Notion OAuth Client Secret | ✅ Present |

### AI & Gateway

| Variable | Purpose | Status |
|----------|---------|--------|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key | ✅ **Added** |
| `OPENAI_API_KEY` | OpenAI API key | ✅ Present |
| `V0_API_KEY` | v0 API key for UI generation | ✅ **Added** |

### PWA & Push Notifications

| Variable | Purpose | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key | ✅ Present |
| `VAPID_PRIVATE_KEY` | VAPID private key | ✅ Present |

## Verification Steps

### 1. Check Deployment Status

```bash
vercel inspect kink-9e4f0p9f2-mood-mnkys-projects.vercel.app --logs
```

### 2. Verify Environment Variables

```bash
vercel env ls production
```

### 3. Test Notion API Key Upload

1. Log into production app
2. Navigate to Notion integration settings
3. Try uploading a Notion API key
4. Should work without "Server configuration error"

### 4. Test AI Features

- Image generation should work with `AI_GATEWAY_API_KEY`
- v0 UI generation should work with `V0_API_KEY`

## Expected Behavior After Fix

### Before Fix:
- ❌ Notion API key upload failed with "Server configuration error"
- ❌ Encryption/decryption functions failed
- ❌ AI Gateway features may have failed
- ❌ v0 features may have failed

### After Fix:
- ✅ Notion API key upload works
- ✅ User-provided keys are encrypted and stored
- ✅ Keys can be decrypted for API calls
- ✅ AI Gateway features work
- ✅ v0 features work

## Security Considerations

### Encryption Key Requirements

The `NOTION_API_KEY_ENCRYPTION_KEY` must:
- Be at least 32 characters (pgcrypto requirement)
- Be a strong, random string
- Match between environments if you need to decrypt keys created in dev
- Be kept secret (never commit to git)

### Key Rotation

If you need to rotate the encryption key:
1. **Warning:** Existing encrypted keys will become unreadable
2. Users will need to re-upload their Notion API keys
3. Consider a migration strategy if rotating in production

## Future Improvements

1. **Environment Variable Validation**
   - Add startup check to verify all required vars are present
   - Fail fast with clear error messages

2. **Documentation**
   - Keep `ENV_VARIABLES.md` updated with all required vars
   - Document which vars are required vs optional

3. **Automated Sync**
   - Consider CI/CD step to sync env vars
   - Or use Vercel's environment variable sync feature

4. **Monitoring**
   - Add logging when encryption key is missing
   - Alert on "Server configuration error" occurrences

## Files Modified/Created

- ✅ `scripts/update-vercel-env-vars.ps1` - Created (automated sync script)
- ✅ `scripts/sync-all-env-to-vercel-production.ps1` - Created (interactive version)
- ✅ `docs/VERCEL_ENV_VARS_UPDATE_COMPLETE.md` - Created (summary)
- ✅ `docs/PRODUCTION_ENV_VARS_DEBUG_REPORT.md` - Created (this file)

## Conclusion

The Notion API key issue was caused by missing `NOTION_API_KEY_ENCRYPTION_KEY` in production. This key is essential for the encryption/decryption workflow that stores user-provided Notion API keys securely.

All missing environment variables have been added to Vercel production, and a new deployment has been triggered. The production instance should now have full functionality matching development.

