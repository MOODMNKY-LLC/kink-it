# Onboarding Flow Update: Notion API Key Step

**Date**: 2026-02-02  
**Status**: ✅ Implementation Complete

---

## Summary

Replaced the Discord bot installation step in onboarding with a Notion API key input step. This change makes the onboarding flow more focused on core functionality and allows users to expedite setup if they already have a Notion API key prepared.

---

## Changes Made

### 1. New Component: `NotionApiKeyStep`

**File**: `components/onboarding/steps/notion-api-key-step.tsx`

- Replaces `DiscordStep` in the onboarding flow
- Allows users to add their Notion API key during onboarding
- Includes skip option (like Discord step had)
- Validates API key format (`secret_` or `ntn_` prefix)
- Provides clear benefits explanation
- Links to Notion Integrations page for key generation

**Features**:
- Input form for key name and API key
- Real-time validation
- Success/error states
- Skip functionality
- Integration with existing API key management system

### 2. Updated Onboarding Wizard

**File**: `components/onboarding/onboarding-wizard.tsx`

- Replaced `DiscordStep` import with `NotionApiKeyStep`
- Updated step 5 to use `NotionApiKeyStep` instead of `DiscordStep`
- Maintained backward compatibility for Discord URL params (for existing users)

**Onboarding Flow** (Updated):
1. WelcomeStep - Role selection
2. BondSetupStep - Bond/invite code
3. NotionSetupStep - Template duplication (OAuth)
4. NotionVerificationStep - Verify template
5. **NotionApiKeyStep** - Add API key (OPTIONAL, can skip) ← **NEW**
6. WelcomeSplashStep - Completion

### 3. Disconnect Notion Functionality

**New API Route**: `app/api/notion/disconnect/route.ts`
- `DELETE /api/notion/disconnect`
- Deletes user's Notion OAuth tokens from database
- Protected by RLS policies
- Does NOT delete manual API keys (separate system)

**New API Route**: `app/api/notion/check-oauth/route.ts`
- `GET /api/notion/check-oauth`
- Checks if user has active OAuth connection
- Returns connection status

**Updated Settings Page**: `app/account/settings/notion-api-keys/page.tsx`
- Added OAuth connection status card
- Shows "Notion OAuth Connected" when active
- Disconnect button with confirmation dialog
- Clear warning about what will happen
- Explains manual API keys remain unaffected

---

## User Experience Improvements

### Onboarding Benefits

1. **Faster Setup**: Users with API keys ready can add them immediately
2. **Better Flow**: API key is more critical than Discord bot for core functionality
3. **Flexibility**: Can skip and add later in settings (same as Discord)
4. **Clear Benefits**: Explains why API key is useful (enhanced features, fallback auth)

### Settings Benefits

1. **Transparency**: Users can see their OAuth connection status
2. **Control**: Users can disconnect OAuth if needed
3. **Safety**: Clear warnings and confirmation dialogs
4. **Separation**: OAuth tokens vs. manual API keys are clearly distinguished

---

## Technical Details

### API Key Storage

- Uses existing `user_notion_api_keys` table
- Encrypted storage via `store_user_notion_api_key` function
- Same validation and security as manual API key addition

### OAuth Token Management

- OAuth tokens stored in `user_notion_oauth_tokens` table
- Disconnect only removes OAuth tokens, not manual API keys
- Manual API keys remain functional after OAuth disconnect

### Backward Compatibility

- Discord URL params still handled (for existing users mid-onboarding)
- Existing onboarding progress preserved
- No breaking changes to database schema

---

## Security Considerations

1. **API Key Validation**: Validates format before submission
2. **Encryption**: All API keys encrypted at rest
3. **RLS Policies**: OAuth token deletion protected by RLS
4. **Confirmation Dialogs**: Destructive actions require confirmation
5. **Clear Warnings**: Users understand what disconnect means

---

## Testing Checklist

- [ ] Test onboarding flow with API key addition
- [ ] Test onboarding flow with skip option
- [ ] Test API key validation (valid/invalid formats)
- [ ] Test OAuth connection status display
- [ ] Test disconnect functionality
- [ ] Test that manual API keys remain after OAuth disconnect
- [ ] Test backward compatibility with Discord URL params

---

## Future Enhancements

1. **Notion OAuth Reconnection**: Add "Reconnect" button if disconnected
2. **API Key Testing**: Add test button in onboarding step
3. **Multiple API Keys**: Support multiple keys in onboarding (currently one)
4. **Discord Step**: Could be added back as optional step 7 or moved to settings

---

## Migration Notes

- No database migrations required
- Existing users will see new step on next onboarding attempt
- Discord step removed but URL params still handled for compatibility
- OAuth tokens unaffected by this change

---

## Related Files

- `components/onboarding/steps/notion-api-key-step.tsx` (NEW)
- `components/onboarding/onboarding-wizard.tsx` (UPDATED)
- `app/api/notion/disconnect/route.ts` (NEW)
- `app/api/notion/check-oauth/route.ts` (NEW)
- `app/account/settings/notion-api-keys/page.tsx` (UPDATED)
- `app/onboarding/page.tsx` (No changes needed)

---

## Conclusion

The onboarding flow now prioritizes Notion API key setup over Discord bot installation, making it more focused on core functionality. The disconnect functionality gives users control over their OAuth connections while maintaining the security and flexibility of manual API keys.
