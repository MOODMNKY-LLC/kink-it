# Scene Creator Comprehensive Update Plan

**Date**: 2026-01-09  
**Status**: 🚧 In Progress  
**Priority**: High - Core Feature Enhancement

---

## 🎯 Overview

Comprehensive update to the Scene Creator image generator addressing props bugs, UI improvements, preset systems, feature consolidation, and bug fixes.

---

## ✅ Theme 1: Props System Debugging - FIXED

### Root Cause Identified
The Edge Function's `propsToPrompt` and `buildAvatarPrompt` functions only checked for `kink_accessories`, but the UI sends `character_accessories`. This caused kink accessories to be ignored.

### Fix Applied ✅
- Updated Edge Function to support both `character_accessories` and `kink_accessories`
- Added legacy support matching pattern in `lib/image/props.ts`
- Updated `propsToPrompt` function in Edge Function
- Updated `buildAvatarPrompt` function in Edge Function

### Files Modified
- `supabase/functions/generate-kinkster-avatar/index.ts`

---

## 🚧 Theme 2: UI/UX Improvements - Props Selector

### Current Issues
- Tabs take up vertical space
- Props selector could be more compact
- Better organization needed

### Planned Improvements
- Use Accordion/Collapsible for space efficiency
- Group related props together
- Use Popover for compact multi-select
- Better visual hierarchy

### Components to Use
- `@shadcn/accordion` - Collapsible sections
- `@shadcn/collapsible` - Individual collapsible items
- `@shadcn/popover` - Compact selectors
- `@shadcn/command` - Searchable selectors

### Implementation Steps
1. Replace Tabs with Accordion for main categories
2. Use Collapsible for sub-categories
3. Implement Popover for multi-select props
4. Add search/filter capability
5. Improve mobile responsiveness

---

## 🚧 Theme 3: Background/Environment Preset System

### Requirements
- Store background images in Supabase Storage
- Create database table for preset metadata
- Integrate with props system
- Support environment presets

### Architecture

#### Directory Structure
\`\`\`
public/
  backgrounds/
    environments/
      - dungeon.png
      - forest.png
      - urban.png
      ...
    scenes/
      - scene-1.png
      - scene-2.png
      ...
\`\`\`

#### Supabase Storage
- Bucket: `background-presets`
- Path structure: `environments/{name}.png`, `scenes/{name}.png`

#### Database Schema
\`\`\`sql
CREATE TABLE background_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('environment', 'scene')),
  storage_path text NOT NULL,
  thumbnail_url text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
\`\`\`

### Implementation Steps
1. Create `public/backgrounds` directory structure
2. Create Supabase Storage bucket `background-presets`
3. Create database migration for `background_presets` table
4. Update `BackgroundSettings` interface to support presets
5. Create preset selector component
6. Integrate with props selector

---

## 🚧 Theme 4: Preset Management System

### Character Presets
- KINKSTER-model.png (first preset)
- Store in `public/presets/characters/`
- Supabase Storage: `character-presets` bucket
- Database table: `character_presets`

### Scene Presets
- Environment backgrounds
- Store in `public/presets/scenes/`
- Supabase Storage: `scene-presets` bucket

### Database Schema
\`\`\`sql
CREATE TABLE character_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  props jsonb, -- GenerationProps
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE scene_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  background_type text, -- 'environment', 'scene'
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
\`\`\`

### Implementation Steps
1. Create preset directory structure
2. Create Supabase Storage buckets
3. Create database migrations
4. Create preset selector component
5. Add preset loading functionality
6. Create preset management UI (admin)

---

## 🚧 Theme 5: Feature Consolidation

### Current State
- Scene Builder: `/playground/scene-builder` (uses KinkyKincadePlayground)
- Kinkster Creator: `/playground/kinkster-creator` (uses KinksterCreationWizard)
- Separate interfaces

### Target State
- Unified interface with tabs
- All image generation in one place
- Kinkster creator integrated as tab
- Better UX flow

### Proposed Structure
\`\`\`
/playground/image-studio (or /playground/creative-studio)
  ├─ Tab 1: Generate (current KinkyKincadePlayground)
  ├─ Tab 2: Kinkster Creator (KinksterCreationWizard)
  ├─ Tab 3: Scene Composition (SceneComposer)
  └─ Tab 4: Presets (preset management)
\`\`\`

### Implementation Steps
1. Create new unified page component
2. Implement tab navigation
3. Integrate Kinkster Creator as tab
4. Integrate Scene Composition as tab
5. Add preset selector tab
6. Update navigation/routing
7. Rename appropriately

---

## 🚧 Theme 6: Remove Background Feature Fix

### Current Status
- API route exists: `/api/image/remove-background`
- Uses `@imgly/background-removal-node`
- May have runtime issues

### Debugging Steps
1. Check if library is properly imported
2. Verify Node.js runtime configuration
3. Test with different image formats
4. Check error logs
5. Verify Supabase Storage bucket exists

### Potential Issues
- Library import issues
- Runtime configuration
- Image format compatibility
- Storage bucket permissions

---

## 🚧 Theme 7: SVG Conversion Feature Fix

### Current Status
- API route exists: `/api/image/vectorize`
- Uses `@imgly/vectorizer`
- Known issues with Node.js runtime

### Known Issues
- `blob.arrayBuffer is not a function` error
- Library compatibility with Node.js
- May need alternative approach

### Debugging Steps
1. Check library compatibility
2. Test with different input formats
3. Verify error handling
4. Consider alternative libraries if needed

---

## 📋 Implementation Priority

1. ✅ **Theme 1: Props Bug Fix** - CRITICAL (Fixed)
2. 🚧 **Theme 6: Remove Background** - HIGH (User reported broken)
3. 🚧 **Theme 7: SVG Conversion** - HIGH (User reported broken)
4. 🚧 **Theme 2: UI Improvements** - MEDIUM (Better UX)
5. 🚧 **Theme 5: Feature Consolidation** - MEDIUM (Better organization)
6. 🚧 **Theme 3: Background Presets** - MEDIUM (New feature)
7. 🚧 **Theme 4: Preset Management** - LOW (Enhancement)

---

## 🎯 Next Steps

1. Test props fix in Edge Function
2. Debug remove background feature
3. Debug SVG conversion feature
4. Implement UI improvements
5. Create preset systems
6. Consolidate features

---

**Status**: 🚧 In Progress  
**Last Updated**: 2026-01-09
