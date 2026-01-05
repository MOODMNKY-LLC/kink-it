# KINK IT - User Onboarding Implementation Plan

**Version**: 1.0  
**Date**: 2026-01-27  
**Status**: Implementation Ready  
**Deep Thinking Protocol**: Complete

---

## Executive Summary

This document outlines the comprehensive implementation plan for the KINK IT user onboarding process, including multi-step wizard, Notion template integration, Discord bot setup, and profile creation. The plan is based on deep research into onboarding best practices, Notion API capabilities, Discord OAuth2 flows, and D/s relationship management requirements.

---

## Research Findings Summary

### Theme 1: Profile Field Research

**Essential Onboarding Fields** (must collect immediately):
- `full_name` - From Notion OAuth metadata
- `display_name` - From Notion OAuth or user input
- `email` - From authentication
- `dynamic_role` - User selection (dominant/submissive/switch) - **REQUIRED**
- `submission_state` - Defaults to 'active' for submissives

**Optional Fields** (can be completed later):
- `love_languages` - Array of love languages
- `hard_limits` - Array of hard limits
- `soft_limits` - Array of soft limits
- `bio` - Personal bio/description
- `preferences` - Additional preferences
- `experience_level` - Years in D/s dynamics
- `communication_preferences` - Notification and communication settings

**Key Insight**: Progressive profiling is best practice - collect only what's needed to start using the app, then encourage completion over time.

### Theme 2: Notion Template Integration

**Template Duplication Process**:
1. Use Notion API `Create Page` endpoint with `template` parameter
2. Template can be: `{type: "default"}` or `{type: "template_id", template_id: "..."}`
3. Parent page ID is required: `parent: {page_id: "..."}`
4. After creation, API returns page object with `id` property

**Verification Strategy**:
1. After template duplication, get the created page ID
2. Use Search API or Get Page API to verify page exists
3. Get page children to discover nested databases
4. Store parent page ID in user profile for future reference

**Key Insight**: Notion API doesn't have a direct "duplicate template" endpoint, but you can use the Create Page API with template parameter. The parent page ID is critical for verification and future operations.

### Theme 3: Multi-Step Wizard Patterns

**Best Practices**:
- State management: Use React Context or Zustand
- Progress tracking: Track current step, completed steps, total steps
- Step validation: Validate each step before allowing progression
- URL-based navigation: Use hash (#step2) or query params (?step=2) for deep linking
- Persistence: Save progress to localStorage or backend to prevent data loss
- Keep steps focused (2-4 questions per step)
- Show progress indicator (X of Y steps)
- Allow back navigation
- Validate before proceeding
- Save state incrementally
- Use React Hook Form for form management

### Theme 4: Discord Guild Install

**OAuth2 Flow**:
- Use OAuth2 URL Generator in Discord Developer Portal
- Enable "Guild Install" checkbox
- Select scopes: `bot`, `guilds.join` (if adding user)
- Select permissions: Send Messages, Read Messages, etc.
- Redirect URI: Points back to app (e.g., `/auth/discord/callback`)
- After authorization, Discord redirects with `code` parameter
- Exchange code for access token
- Bot is automatically added to server
- Verify bot presence using Discord API

**Key Insight**: Guild install is separate from user OAuth. The bot gets added to the server during the OAuth flow, then redirects back to the app. We need to verify bot was added successfully.

### Theme 5: Welcome Splash & UX

**Best Practices**:
- Celebrate completion with visual feedback
- Show what's next (dashboard features)
- Provide clear call-to-action
- Use role-appropriate messaging
- Maintain D/s framing and language

---

## Onboarding Flow Design

### Step 1: Welcome & Role Selection
**Purpose**: Collect essential information to personalize experience

**Components**:
- Welcome message (role-appropriate)
- Dynamic role selection (dominant/submissive/switch)
- Brief explanation of what each role means
- Continue button (disabled until role selected)

**Data Collected**:
- `dynamic_role` (required)

**Validation**:
- Role must be selected

### Step 2: Notion Template Setup
**Purpose**: Set up Notion integration for data management

**Components**:
- Explanation of Notion integration benefits
- Template duplication instructions OR auto-duplication
- "Copy Template" button/link
- Continue button (disabled until template verified)

**Data Collected**:
- `notion_parent_page_id` (after verification)

**Validation**:
- Template must be copied/created
- Parent page ID must be verified

### Step 3: Template Verification
**Purpose**: Verify Notion template was set up correctly

**Components**:
- Auto-verification of parent page ID
- Database discovery (list discovered databases)
- Verification status indicators
- Link databases to profile
- Continue button (enabled after verification)

**Data Collected**:
- `notion_parent_page_id` (stored)
- Database IDs (stored in `notion_databases` table)

**Validation**:
- Parent page must exist
- At least one database should be discovered

### Step 4: Discord Integration (Optional)
**Purpose**: Set up Discord bot for notifications

**Components**:
- Explanation of Discord bot benefits
- Guild install OAuth link
- Verification of bot addition
- Skip option (if user doesn't want Discord)

**Data Collected**:
- Discord server ID (if added)
- Bot verification status

**Validation**:
- Optional step - can be skipped

### Step 5: Welcome Splash
**Purpose**: Celebrate completion and transition to dashboard

**Components**:
- Completion celebration (visual feedback)
- Summary of what was set up
- "What's Next" preview
- "Enter Dashboard" button

**Data Collected**:
- `onboarding_completed` = true

**Validation**:
- All required steps completed

---

## Database Schema Changes

### Migration: Add Onboarding Fields

```sql
-- Add onboarding tracking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notion_parent_page_id text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;

-- Create notion_databases table to track discovered databases
CREATE TABLE IF NOT EXISTS public.notion_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  database_id text NOT NULL,
  database_name text NOT NULL,
  database_type text, -- 'tasks', 'rules', 'rewards', etc.
  parent_page_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, database_id)
);

-- Enable RLS on notion_databases
ALTER TABLE public.notion_databases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own databases
CREATE POLICY "notion_databases_select_own"
ON public.notion_databases FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own databases
CREATE POLICY "notion_databases_insert_own"
ON public.notion_databases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own databases
CREATE POLICY "notion_databases_update_own"
ON public.notion_databases FOR UPDATE
USING (auth.uid() = user_id);
```

---

## API Endpoints

### 1. Notion Template Duplication
**Endpoint**: `POST /api/onboarding/notion/duplicate-template`
**Purpose**: Duplicate Notion template for user

**Request**:
```json
{
  "templateId": "optional-template-id",
  "parentPageId": "optional-parent-page-id"
}
```

**Response**:
```json
{
  "success": true,
  "pageId": "created-page-id",
  "parentPageId": "parent-page-id"
}
```

### 2. Notion Template Verification
**Endpoint**: `POST /api/onboarding/notion/verify-template`
**Purpose**: Verify template exists and discover databases

**Request**:
```json
{
  "parentPageId": "parent-page-id"
}
```

**Response**:
```json
{
  "success": true,
  "parentPageId": "parent-page-id",
  "databases": [
    {
      "id": "database-id",
      "name": "Tasks",
      "type": "tasks"
    }
  ]
}
```

### 3. Update Onboarding Progress
**Endpoint**: `PATCH /api/onboarding/progress`
**Purpose**: Update user's onboarding progress

**Request**:
```json
{
  "step": 3,
  "data": {
    "notion_parent_page_id": "page-id"
  }
}
```

**Response**:
```json
{
  "success": true,
  "step": 3,
  "completed": false
}
```

### 4. Complete Onboarding
**Endpoint**: `POST /api/onboarding/complete`
**Purpose**: Mark onboarding as complete

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "redirectTo": "/"
}
```

### 5. Discord Guild Install
**Endpoint**: `GET /api/auth/discord/guild-install`
**Purpose**: Initiate Discord guild install OAuth flow

**Response**: Redirects to Discord OAuth URL

### 6. Discord Verification
**Endpoint**: `GET /api/auth/discord/callback`
**Purpose**: Handle Discord OAuth callback and verify bot

**Query Params**:
- `code` - OAuth authorization code
- `guild_id` - Discord server ID

**Response**: Redirects to onboarding step 4 or dashboard

---

## Component Structure

### Onboarding Wizard Container
**Path**: `app/onboarding/page.tsx`
**Purpose**: Main onboarding wizard container

**Features**:
- Step management
- Progress tracking
- State persistence
- Navigation (next/back)

### Step Components

1. **WelcomeStep** (`components/onboarding/steps/welcome-step.tsx`)
   - Welcome message
   - Role selection
   - Continue button

2. **NotionSetupStep** (`components/onboarding/steps/notion-setup-step.tsx`)
   - Template duplication UI
   - Instructions
   - Verification trigger

3. **NotionVerificationStep** (`components/onboarding/steps/notion-verification-step.tsx`)
   - Verification status
   - Database discovery
   - Link databases

4. **DiscordStep** (`components/onboarding/steps/discord-step.tsx`)
   - Discord explanation
   - Guild install link
   - Verification status
   - Skip option

5. **WelcomeSplashStep** (`components/onboarding/steps/welcome-splash-step.tsx`)
   - Completion celebration
   - Summary
   - Dashboard entry

### Supporting Components

- **OnboardingProgress** (`components/onboarding/onboarding-progress.tsx`)
  - Progress indicator (X of Y steps)
  - Step navigation dots

- **OnboardingLayout** (`components/onboarding/onboarding-layout.tsx`)
  - Layout wrapper
  - Navigation controls

---

## Notion Template Structure

### Parent Page: "KINK IT - [User's Name]"

**Nested Databases**:
1. **Tasks** - Task management
2. **Rules & Protocols** - Rule management
3. **Contracts & Consent** - Contract management
4. **Rewards** - Reward tracking
5. **Points Ledger** - Points transactions
6. **Boundaries & Kink Exploration** - Boundary management
7. **Journal Entries** - Personal journaling
8. **Scene Logs** - Scene documentation
9. **Calendar Events** - Event scheduling
10. **Resources** - Educational content
11. **Communication & Check-ins** - Check-in tracking
12. **Analytics & Reports** - Analytics storage

**Template Properties**: See `docs/NOTION_TEMPLATE_GUIDE.md` for complete structure.

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create database migration for onboarding fields
- [ ] Create `notion_databases` table
- [ ] Update profile type definitions
- [ ] Create onboarding state management (Zustand/Context)

### Phase 2: Notion Integration
- [ ] Create comprehensive Notion template (using Notion MCP)
- [ ] Implement template duplication API
- [ ] Implement template verification API
- [ ] Implement database discovery logic

### Phase 3: Wizard Components
- [ ] Create onboarding wizard container
- [ ] Create WelcomeStep component
- [ ] Create NotionSetupStep component
- [ ] Create NotionVerificationStep component
- [ ] Create DiscordStep component
- [ ] Create WelcomeSplashStep component
- [ ] Create OnboardingProgress component
- [ ] Create OnboardingLayout component

### Phase 4: Discord Integration
- [ ] Implement Discord guild install OAuth flow
- [ ] Implement Discord verification logic
- [ ] Update Discord bot setup guide

### Phase 5: Integration & Testing
- [ ] Update auth callback to redirect to onboarding if incomplete
- [ ] Add onboarding completion check to dashboard
- [ ] Test complete onboarding flow
- [ ] Test Notion template verification
- [ ] Test Discord bot installation
- [ ] Test error handling and edge cases

---

## Success Criteria

1. **User can complete onboarding in < 5 minutes**
2. **Notion template is successfully duplicated and verified**
3. **All databases are discovered and linked**
4. **Discord bot is successfully added (if user chooses)**
5. **Onboarding progress is saved incrementally**
6. **User can resume onboarding if interrupted**
7. **Welcome splash provides clear next steps**
8. **Dashboard is accessible after onboarding completion**

---

## Error Handling

### Notion Template Errors
- **Template not found**: Show error message, provide manual copy instructions
- **Verification failed**: Allow retry, show troubleshooting steps
- **Database discovery failed**: Continue with partial discovery, allow manual addition

### Discord Errors
- **OAuth failed**: Show error message, allow retry
- **Bot not added**: Show troubleshooting steps, allow manual verification
- **Verification timeout**: Allow manual skip

### General Errors
- **Network errors**: Show retry option
- **Validation errors**: Show field-specific error messages
- **Server errors**: Show generic error, log for debugging

---

## Security Considerations

1. **Notion API Key**: Store securely, never expose to client
2. **Discord OAuth**: Use secure redirect URIs, validate state parameter
3. **Onboarding Data**: Encrypt sensitive data in `onboarding_data` JSONB field
4. **RLS Policies**: Ensure all new tables have proper RLS policies
5. **Rate Limiting**: Implement rate limiting on onboarding endpoints

---

## Future Enhancements

1. **Onboarding Analytics**: Track completion rates, drop-off points
2. **A/B Testing**: Test different onboarding flows
3. **Progressive Profiling**: Encourage profile completion over time
4. **Onboarding Tours**: Interactive tours of key features
5. **Partner Onboarding**: Streamlined onboarding for second partner

---

**Last Updated**: 2026-01-27  
**Status**: Ready for Implementation  
**Next Steps**: Begin Phase 1 implementation


