# Prompt Optimization Analysis: Character Consistency & Scene Generation

**Date**: 2026-01-06  
**Source**: [ChatGPT Conversation - Bara Art Wallpaper Request](https://chatgpt.com/share/695ca984-fe08-800f-8fac-2e3e535ab72b)  
**Status**: Implemented

---

## Executive Summary

Analysis of a comprehensive ChatGPT conversation about character consistency and scene generation revealed a structured prompt template approach that significantly improves character consistency and scene quality. This document outlines the key insights and their implementation in our system.

---

## Key Insights from ChatGPT Conversation

### 1. Structured Prompt Template

The conversation revealed a sophisticated prompt structure with clear sections:

\`\`\`
[STYLE HEADER]
[CHARACTER CANON]
[POSE + EMOTION]
[ENVIRONMENT]
[COMPOSITION]
[QUALITY TAGS]
[NEGATIVE CONSTRAINTS]
\`\`\`

**Benefits:**
- Ensures all critical information is included systematically
- Maintains consistency across generations
- Makes prompts easier to debug and refine
- Separates concerns (style, character, scene, quality)

### 2. Character Canon Extraction

The conversation emphasizes creating a detailed "character canon" that includes:
- Hair (color, style, length)
- Beard (if applicable)
- Eyes (color, size, expression style)
- Skin tone (warm/cool, specific tones)
- Build (bara-specific: broad shoulders, prominent chest, etc.)
- Signature outfit cues (distinctive clothing elements)

**Implementation**: Extract from Kinkster `physical_attributes` and `appearance_description` fields.

### 3. Negative Constraints Strategy

Critical negative constraints prevent common AI generation issues:
- "no photorealism, no painterly oil texture, no muddy colors"
- "no clutter covering the face, no extra limbs, no warped hands"
- "no low-detail background, no text artifacts"

**Implementation**: Style-specific negative constraints stored in style presets, plus universal constraints.

### 4. Composition Rules

The conversation provides specific composition guidelines:
- **Focal Hierarchy**: 70% character, 20% props, 10% background
- **Camera Angles**: 3/4 hero shot, close-up for emotion, wide angle for energy
- **Visual Hierarchy**: Character sharpest, background softer

**Implementation**: Configurable focal hierarchy and camera angle options.

### 5. Consistency Checklist

QA checklist for validating generations:
- Does character read as intended style?
- Is linework clean and intentional?
- Are colors vibrant but controlled?
- Is lighting cinematic?
- Does environment feel dense but not confusing?
- Is face/hand the sharpest area?

**Implementation**: `validateConsistency()` function for pre-generation validation.

---

## Implementation Details

### New Files Created

1. **`lib/playground/prompt-templates.ts`**
   - Structured prompt builders
   - Character canon extractor
   - Consistency validator
   - Template functions for scene, pose, and composition prompts

### Key Functions

#### `extractCharacterCanon(kinkster: Kinkster)`
Extracts structured character description from Kinkster data for consistent use across generations.

#### `buildStructuredScenePrompt(userPrompt, options)`
Builds structured scene generation prompt using the template format:
- Style header (from style presets)
- Character canon (extracted from Kinkster)
- Pose + emotion (user input)
- Environment (scene description)
- Composition (camera angle + focal hierarchy)
- Quality tags (technical specifications)
- Negative constraints (style-specific)

#### `buildStructuredPosePrompt(characterCanon, poseDescription, options)`
Builds structured pose variation prompt maintaining character identity.

#### `buildStructuredCompositionPrompt(character1Canon, character2Canon, compositionDescription, options)`
Builds structured scene composition prompt for two-character scenes.

#### `validateConsistency(prompt, characterCanon)`
Validates prompt completeness and consistency using checklist criteria.

---

## Integration Points

### Current System Integration

1. **Scene Generation** (`components/playground/scene-composition/scene-generator.tsx`)
   - Use `buildStructuredScenePrompt()` instead of raw prompt
   - Extract character canon from Kinkster if available
   - Apply style presets with structured template

2. **Pose Variation** (`components/playground/pose-variation/pose-variation.tsx`)
   - Use `buildStructuredPosePrompt()` for pose transfer
   - Extract character canon from selected Kinkster
   - Maintain character identity across poses

3. **Scene Composition** (`components/playground/scene-composition/scene-composer.tsx`)
   - Use `buildStructuredCompositionPrompt()` for two-character scenes
   - Extract canon for both characters
   - Apply composition rules (focal hierarchy, camera angle)

4. **API Route** (`app/api/generate-image/route.ts`)
   - Integrate structured prompts into generation workflow
   - Use character canon extraction when Kinkster data available
   - Apply negative constraints based on style

---

## Benefits

### Character Consistency
- **Before**: Ad-hoc prompts, inconsistent character descriptions
- **After**: Structured character canon extracted from Kinkster data, consistently applied across all generations

### Scene Quality
- **Before**: Basic scene descriptions, no composition rules
- **After**: Structured scene prompts with composition rules, focal hierarchy, and camera angles

### Prompt Engineering
- **Before**: Single prompt string, style appended at end
- **After**: Structured template with clear sections, style integrated throughout

### Quality Control
- **Before**: No validation framework
- **After**: Consistency checklist validator for pre-generation QA

---

## Usage Examples

### Scene Generation with Character Canon

\`\`\`typescript
import { extractCharacterCanon, buildStructuredScenePrompt } from "@/lib/playground/prompt-templates"
import { getStylePresetById } from "@/lib/playground/style-presets"

const kinkster = await getKinkster(characterId)
const canon = extractCharacterCanon(kinkster)
const style = getStylePresetById("anime")

const prompt = buildStructuredScenePrompt("A neon-lit bar district at night", {
  style,
  characterCanon: canon,
  pose: "standing confidently",
  emotion: "friendly smile",
  eyeContact: "looking at viewer",
  environment: "neon-lit bar district",
  environmentMotifs: ["graffiti walls", "hanging lamps", "patchwork signage"],
  cameraAngle: "3/4",
  focalHierarchy: { character: 70, props: 20, background: 10 },
})
\`\`\`

### Pose Variation with Character Consistency

\`\`\`typescript
const canon = extractCharacterCanon(kinkster)
const prompt = buildStructuredPosePrompt(canon, "sitting on a barstool, leaning forward", {
  style: getStylePresetById("anime"),
  cameraAngle: "medium-close",
})
\`\`\`

### Scene Composition with Two Characters

\`\`\`typescript
const canon1 = extractCharacterCanon(character1)
const canon2 = extractCharacterCanon(character2)

const prompt = buildStructuredCompositionPrompt(
  canon1,
  canon2,
  "Two characters sharing a drink at a bar, engaging in conversation",
  {
    style: getStylePresetById("anime"),
    cameraAngle: "3/4",
    focalHierarchy: { character: 70, props: 20, background: 10 },
  }
)
\`\`\`

---

## Next Steps

1. **Integrate into Existing Workflows**
   - Update scene generator to use structured prompts
   - Update pose variation to use structured prompts
   - Update scene composer to use structured prompts

2. **Enhance Character Canon Extraction**
   - Improve outfit extraction from appearance_description
   - Add more distinctive feature detection
   - Store character canon in database for faster access

3. **Expand Style Presets**
   - Add negative constraints to each style preset
   - Create style-specific composition rules
   - Add style-specific quality tags

4. **Consistency Validation UI**
   - Add pre-generation validation warnings
   - Show consistency checklist in UI
   - Allow users to review and adjust prompts before generation

5. **Documentation**
   - Create user guide for prompt templates
   - Document character canon best practices
   - Provide examples for each generation type

---

## References

- **Source Conversation**: [ChatGPT - Bara Art Wallpaper Request](https://chatgpt.com/share/695ca984-fe08-800f-8fac-2e3e535ab72b)
- **Implementation**: `lib/playground/prompt-templates.ts`
- **Style Presets**: `lib/playground/style-presets.ts`
- **Kinkster Types**: `types/kinkster.ts`

---

## Conclusion

The structured prompt template approach from the ChatGPT conversation provides a systematic way to improve character consistency and scene quality. By implementing character canon extraction, structured prompt builders, and consistency validation, we can maintain character identity across all generations while improving overall image quality.

The hybrid approach (structured prompts + multi-image references) leverages both prompt engineering and Gemini 3 Pro's multi-image capabilities for optimal results.
