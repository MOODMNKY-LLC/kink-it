# Prompt Synthesis Lock-In Implementation Plan

## Overview

This document outlines the plan to lock in prompt control for image generation, removing direct prompt editing and implementing automatic prompt synthesis from props (similar to v0's prompt optimization approach).

## Current State Analysis

### Component Structure
1. **KINKSTER Creation**: `/kinksters/create` → `KinksterCreationWizard` → `AvatarGenerationStep`
   - Currently has custom prompt textarea
   - Uses `use-avatar-generation` hook
   - Props selector already integrated

2. **Playground Image Generator**: `/playground/image-generation` → `GenerationPanel`
   - Currently has `PromptBuilder` component with custom editing
   - Uses `use-playground-generation` hook
   - Props selector already integrated

### Current Issues
- Users can bypass props system with custom prompts
- No standardized prompt optimization
- Inconsistent prompt quality
- Brand style (Bara) not always enforced

## Solution Architecture

### Core Principle
**Props → Automatic Synthesis → Optimized Prompt → DALL-E 3**

### Key Components

1. **PropsSelector** (✅ Already exists)
   - User input for customization
   - Physical, clothing, kink accessories, background

2. **PromptPreview** (🆕 New component)
   - Read-only display of synthesized prompt
   - Real-time updates as props change
   - Shows optimization status

3. **optimizePromptForDALLE3** (🆕 New function)
   - Automatic prompt optimization
   - Removes redundancy
   - Ensures clarity and conciseness
   - Enforces Bara style consistency

4. **buildAvatarPrompt** (🔄 Enhanced)
   - Always uses props (no custom prompts)
   - Applies optimization automatically
   - Single source of truth

## Implementation Steps

### Phase 1: Create Prompt Optimization System

**File**: `lib/image/prompt-optimizer.ts` (new)

**Functions**:
- `optimizePromptForDALLE3(prompt: string): string`
  - Removes redundant terms
  - Ensures Bara style is emphasized
  - Optimizes length (target ~300-400 tokens)
  - Improves clarity and specificity
  - Maintains proper term ordering

**Optimization Rules**:
1. Bara style must be first and emphasized
2. Remove duplicate descriptors
3. Prioritize important terms
4. Ensure clarity and conciseness
5. Maintain DALL-E 3 format requirements

### Phase 2: Enhance buildAvatarPrompt

**File**: `lib/image/shared-utils.ts`

**Changes**:
- Remove custom prompt parameter support
- Always use props (default to KINKY_DEFAULT_PROPS if not provided)
- Apply `optimizePromptForDALLE3` automatically
- Ensure consistent structure

### Phase 3: Create PromptPreview Component

**File**: `components/playground/image-generation/prompt-preview.tsx` (new)

**Features**:
- Read-only prompt display
- Real-time updates as props change
- Shows optimization indicator
- Copy to clipboard functionality
- Character count display

### Phase 4: Update PromptBuilder Component

**File**: `components/playground/image-generation/prompt-builder.tsx`

**Changes**:
- Remove custom editing functionality
- Convert to read-only preview
- Use `PromptPreview` component
- Remove "Edit Custom" toggle
- Show synthesized prompt only

### Phase 5: Update GenerationPanel

**File**: `components/playground/image-generation/generation-panel.tsx`

**Changes**:
- Remove `customPrompt` state
- Remove `PromptBuilder` custom editing
- Always use synthesized prompt from props
- Update `handleGenerate` to not pass custom prompt

### Phase 6: Update AvatarGenerationStep

**File**: `components/kinksters/steps/avatar-generation-step.tsx`

**Changes**:
- Remove custom prompt textarea
- Remove `customPrompt` state
- Add `PromptPreview` component
- Always use synthesized prompt from props
- Update `handleGenerate` to not pass custom prompt

### Phase 7: Update Hooks

**Files**: 
- `hooks/use-playground-generation.ts`
- `hooks/use-avatar-generation.ts`

**Changes**:
- Remove `customPrompt` parameter from interfaces
- Remove custom prompt handling
- Always use synthesized prompts

### Phase 8: Update API Routes

**Files**:
- `app/api/kinksters/avatar/generate/route.ts`
- `supabase/functions/generate-kinkster-avatar/index.ts`

**Changes**:
- Remove `customPrompt` parameter handling
- Always use synthesized prompts from character data
- Ensure optimization is applied

## User Experience Flow

### Before (Current)
1. User adjusts props OR edits custom prompt
2. User clicks "Generate"
3. System uses custom prompt if provided, otherwise builds from props
4. Prompt sent to DALL-E 3

### After (New)
1. User adjusts props in PropsSelector
2. System automatically synthesizes optimized prompt (real-time preview)
3. User sees prompt preview (read-only)
4. User clicks "Generate"
5. System applies final optimization
6. Optimized prompt sent to DALL-E 3

## Benefits

1. **Consistent Quality**: All prompts are optimized and consistent
2. **Brand Consistency**: Bara style always enforced
3. **Better UX**: Structured inputs vs free text
4. **Easier Maintenance**: Single source of truth
5. **Proven Pattern**: Similar to v0's approach

## Testing Checklist

- [ ] Prompt optimization function works correctly
- [ ] Props always used (no custom prompts)
- [ ] Prompt preview updates in real-time
- [ ] No custom prompt editing exists
- [ ] Bara style always enforced
- [ ] Optimization improves prompt quality
- [ ] Both flows (KINKSTER creation and playground) work correctly
- [ ] API routes handle synthesized prompts correctly
- [ ] Edge function handles synthesized prompts correctly

## Migration Notes

- Existing custom prompts in database will be ignored
- All new generations will use props-based synthesis
- No breaking changes to API (custom_prompt parameter will be ignored)
- Backward compatible (old prompts still work, just not editable)



