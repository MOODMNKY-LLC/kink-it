# Kinkster Creator Overhaul Plan

## Overview
Comprehensive overhaul of the Kinkster Creator to align with database schema, reduce redundancy, integrate presets, add hybrid mode support, and improve UX.

## Current State Analysis

### Issues Identified
1. **Redundancy**: `appearance_description` and `physical_attributes` duplicate structured fields
2. **Missing Fields**: No collection of `display_name`, `role`, `pronouns`, `provider`, `openai_model`, `openai_instructions`
3. **No Preset Integration**: Preset images exist but not accessible in creator
4. **Too Many Steps**: 7 steps feels overwhelming
5. **No Provider Selection**: Can't choose Flowise vs OpenAI during creation
6. **API Route Outdated**: Doesn't accept new database fields

## Implementation Plan

### Phase 1: Update API Route ✅
- Accept all new database fields
- Handle provider configuration
- Store preset references
- Map structured appearance fields correctly

### Phase 2: Consolidate Steps (7 → 5)
- **Step 1**: Basic Info (name, display_name, role, pronouns, archetype)
- **Step 2**: Appearance & Style (all appearance + style fields in one step)
- **Step 3**: Personality & Kinks (personality, bio, backstory, kinks, limits, experience)
- **Step 4**: Avatar & Provider (preset selection OR generation + provider config)
- **Step 5**: Review & Finalize (preview, auto-calculated stats, confirmation)

### Phase 3: Remove Redundancies
- Remove `appearance_description` and `physical_attributes` from wizard
- Use only structured fields (body_type, height, build, hair_color, etc.)
- Auto-generate description if needed for backward compatibility
- Make stats optional (auto-calculate from archetype)

### Phase 4: Integrate Presets
- Add preset selector to avatar generation step
- Show preset thumbnails in grid
- Allow "Use as-is" or "Generate variation"
- Store preset reference in metadata

### Phase 5: Add Provider Selection
- Visual cards for Flowise vs OpenAI
- Model selector for OpenAI
- Instructions editor for OpenAI
- Chatflow selector for Flowise (if available)

### Phase 6: Improve UX
- Better mobile responsiveness
- Visual feedback and progress indicators
- Preview functionality
- "Test Chat" integration
- Better navigation and error handling

## Database Fields Mapping

### Basic Info
- `name` (required)
- `display_name` (optional, defaults to name)
- `role` (dominant/submissive/switch, defaults to switch)
- `pronouns` (optional, defaults to They/Them)
- `archetype` (optional)

### Appearance (Structured Fields Only)
- `body_type`
- `height`
- `build`
- `hair_color`
- `hair_style`
- `eye_color`
- `skin_tone`
- `facial_hair`
- `age_range`

### Style Preferences
- `clothing_style` (array)
- `favorite_colors` (array)
- `fetish_wear` (array)
- `aesthetic`

### Personality & Kinks
- `personality_traits` (array)
- `bio`
- `backstory`
- `top_kinks` (array)
- `kink_interests` (array)
- `hard_limits` (array)
- `soft_limits` (array)
- `experience_level`
- `role_preferences` (array)

### Avatar
- `avatar_url`
- `avatar_urls` (array)
- `avatar_prompt`
- `generation_prompt`
- `avatar_generation_config`
- `metadata.preset_id` (if preset used)

### Provider Configuration
- `provider` (flowise/openai_responses, defaults to flowise)
- `flowise_chatflow_id` (if Flowise)
- `openai_model` (if OpenAI, defaults to gpt-4o-mini)
- `openai_instructions` (if OpenAI, optional)

### Stats (Auto-calculated from archetype if not set)
- `dominance`
- `submission`
- `charisma`
- `stamina`
- `creativity`
- `control`

## Implementation Steps

1. ✅ Update API route (`/api/kinksters/create`)
2. ✅ Create new consolidated step components
3. ✅ Update wizard to use 5-step structure
4. ✅ Add preset selector component
5. ✅ Add provider selector component
6. ✅ Update types to include all new fields
7. ✅ Improve mobile responsiveness
8. ✅ Add chat integration

## Testing Checklist

- [ ] All database fields are collected and saved correctly
- [ ] Preset selection works (use as-is and generate variation)
- [ ] Provider selection works (Flowise and OpenAI)
- [ ] Stats auto-calculate from archetype
- [ ] Mobile responsiveness is improved
- [ ] Chat integration works after creation
- [ ] No redundant fields are collected
- [ ] Backward compatibility maintained
