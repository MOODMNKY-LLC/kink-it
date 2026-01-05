# Kinkster Character Creation System - Research & Design Plan

## Overview

This document outlines the research, design, and implementation plan for the Kinkster Character Creation System - a comprehensive, game-like character creation experience that allows users to create unique roleplay personas with custom AI-generated avatars.

## Research Findings

### Surviving Purge Game Analysis

**Game Style**: Bara-style visual novel/RPG hybrid on Steam
**Key Features**:
- Character customization with stat allocation
- Visual character representation
- Roleplay-focused gameplay
- Character progression systems
- Multiple character builds/archetypes

**Inspiration Points**:
- Visual character representation
- Stat-based character building
- Character archetypes and builds
- Progression systems
- Roleplay-focused mechanics

### MMO Character Creation Patterns

**Common Elements**:
1. **Multi-Step Wizard**: Name → Appearance → Stats → Finalize
2. **Stat Allocation**: Point-based or slider-based stat distribution
3. **Visual Customization**: Appearance options (limited or extensive)
4. **Character Preview**: Real-time preview of character
5. **Archetype Selection**: Pre-built templates or starting classes
6. **Validation**: Ensure character meets requirements before creation

**Best Practices**:
- Clear progress indicators
- Ability to go back and change previous steps
- Visual feedback for stat allocation
- Character preview throughout process
- Save progress capability
- Clear explanations of stats/attributes

### OpenAI DALL-E 3 API Research

**Key Capabilities**:
- Image generation from text prompts
- Multiple image sizes (1024x1024, 1792x1024, 1024x1792)
- Quality options (standard, hd)
- Style consistency through prompt engineering
- Character consistency via detailed descriptions

**Best Practices for Character Generation**:
1. **Detailed Character Descriptions**: Include physical attributes, clothing, pose, style
2. **Style Consistency**: Use consistent art style keywords
3. **Prompt Templates**: Pre-built templates ensure consistency
4. **Iterative Refinement**: Allow regeneration with adjustments
5. **Seed Values**: (Not available in DALL-E 3, but can use consistent prompts)

**Prompt Engineering for Consistent Characters**:
- Base style description (e.g., "digital art, character portrait, fantasy art style")
- Physical attributes (height, build, hair, eyes, etc.)
- Clothing and accessories
- Pose and expression
- Lighting and composition
- Quality modifiers

### BDSM/Kink Domain Stat System

**Adapted MMO Stats for Kink Domain**:

1. **Dominance** (DPS/Strength equivalent)
   - Ability to take control, lead scenes
   - Assertiveness and confidence
   - Natural leadership in dynamics

2. **Submission** (Defense/Constitution equivalent)
   - Ability to surrender control
   - Endurance and resilience
   - Capacity for service and devotion

3. **Charisma** (Social/Leadership)
   - Social skills and charm
   - Ability to negotiate and communicate
   - Attractiveness and presence

4. **Stamina** (Endurance)
   - Physical and mental endurance
   - Ability to sustain scenes
   - Recovery and resilience

5. **Creativity** (Magic/Intelligence)
   - Scene planning and creativity
   - Problem-solving in dynamics
   - Innovation in play

6. **Control** (Precision/Dexterity)
   - Precision and skill
   - Technical ability
   - Attention to detail

**Stat Allocation System**:
- Starting points: 20-30 points to distribute
- Minimum/Maximum per stat: 1-10 or 1-20 scale
- Archetype bonuses: Pre-built templates with stat distributions
- Stat descriptions: Clear explanations of what each stat affects

## System Architecture

### Database Schema

```sql
-- Kinkster Characters Table
CREATE TABLE kinksters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  name text NOT NULL,
  bio text,
  backstory text,
  
  -- Avatar
  avatar_url text, -- Generated image URL
  avatar_prompt text, -- Prompt used for generation
  avatar_generation_config jsonb, -- Settings used
  
  -- Stats (1-20 scale, total points allocated)
  dominance integer DEFAULT 5 CHECK (dominance >= 1 AND dominance <= 20),
  submission integer DEFAULT 5 CHECK (submission >= 1 AND submission <= 20),
  charisma integer DEFAULT 5 CHECK (charisma >= 1 AND charisma <= 20),
  stamina integer DEFAULT 5 CHECK (stamina >= 1 AND stamina <= 20),
  creativity integer DEFAULT 5 CHECK (creativity >= 1 AND creativity <= 20),
  control integer DEFAULT 5 CHECK (control >= 1 AND control <= 20),
  
  -- Appearance Description (for avatar generation)
  appearance_description text,
  physical_attributes jsonb, -- height, build, hair, eyes, etc.
  
  -- Kink Preferences
  kink_interests text[],
  hard_limits text[],
  soft_limits text[],
  
  -- Character Traits
  personality_traits text[],
  role_preferences text[], -- dominant, submissive, switch, etc.
  
  -- Metadata
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false, -- User's main character
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_user_primary UNIQUE (user_id, is_primary) WHERE is_primary = true
);

-- Character Creation Sessions (for saving progress)
CREATE TABLE kinkster_creation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_data jsonb NOT NULL, -- All creation data
  current_step integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### API Endpoints

1. **POST /api/kinksters/create** - Create new kinkster
2. **GET /api/kinksters** - List user's kinksters
3. **GET /api/kinksters/[id]** - Get kinkster details
4. **PATCH /api/kinksters/[id]** - Update kinkster
5. **DELETE /api/kinksters/[id]** - Delete kinkster
6. **POST /api/kinksters/[id]/avatar/generate** - Generate avatar
7. **POST /api/kinksters/creation-session** - Save creation progress
8. **GET /api/kinksters/creation-session** - Load creation progress

### Character Creation Flow

**Step 1: Basic Information**
- Character name
- Brief bio
- Character archetype selection (optional)

**Step 2: Appearance**
- Physical attributes (height, build, hair, eyes, etc.)
- Appearance description
- Style preferences

**Step 3: Stat Allocation**
- Point-based stat distribution
- Archetype templates (optional)
- Stat descriptions and tooltips
- Visual stat bars/graphs

**Step 4: Kink Preferences**
- Role preferences (dominant, submissive, switch)
- Kink interests selection
- Hard/soft limits
- Experience level

**Step 5: Personality & Backstory**
- Personality traits
- Backstory/character history
- Character motivations

**Step 6: Avatar Generation**
- Prompt construction UI
- Preview of prompt
- Generate avatar button
- Regenerate option
- Save avatar

**Step 7: Finalize**
- Review all character details
- Confirm creation
- Set as primary (optional)

### UI Components Needed

1. **Character Creation Wizard**
   - Multi-step stepper component
   - Progress indicator
   - Navigation (next/back)
   - Save progress option

2. **Stat Allocation Component**
   - Sliders or point allocation UI
   - Stat descriptions
   - Visual stat bars
   - Total points remaining indicator
   - Archetype templates

3. **Appearance Customization**
   - Form fields for physical attributes
   - Description textarea
   - Preview area

4. **Avatar Generation UI**
   - Prompt builder with presets
   - Prompt preview
   - Generate button
   - Loading state
   - Image preview
   - Regenerate option

5. **Character Sheet Display**
   - Character card/profile
   - Stat visualization
   - Avatar display
   - Character details

### OpenAI Integration

**Prompt Template Structure**:
```
[Art Style] character portrait of [Character Name], [Physical Description], 
[Clothing/Accessories], [Pose/Expression], [Lighting], [Composition], 
[Quality Modifiers], [App Theme Consistency]
```

**Backend Presets**:
- Art style: "digital art, character portrait, fantasy art style, detailed"
- Lighting: "dramatic lighting, professional portrait lighting"
- Composition: "centered, full body/portrait, high detail"
- Quality: "high quality, 4k, detailed, professional"

**API Implementation**:
- Use OpenAI Images API (DALL-E 3)
- Store API key securely in environment variables
- Rate limiting and error handling
- Image storage (Supabase Storage or CDN)
- Prompt sanitization and validation

## Implementation Plan

### Phase 1: Foundation
1. Database schema creation
2. Basic API endpoints
3. Character creation wizard shell

### Phase 2: Core Features
1. Stat allocation system
2. Appearance customization
3. Kink preferences selection

### Phase 3: Avatar Generation
1. OpenAI API integration
2. Prompt construction UI
3. Avatar generation flow
4. Image storage

### Phase 4: Polish
1. Character sheet display
2. Character management
3. UI/UX refinements
4. Testing and optimization

## Next Steps

1. Create database migration for kinksters table
2. Build character creation wizard component
3. Implement stat allocation UI
4. Create OpenAI integration for avatar generation
5. Build character sheet/profile display
6. Test end-to-end character creation flow

