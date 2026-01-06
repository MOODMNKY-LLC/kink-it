# Generate Background Scenes

**Purpose**: Generate 5 background scene templates and save them to temp directory.

---

## Quick Start

### Prerequisites

1. **Next.js dev server running**
   ```bash
   npm run dev
   ```

2. **Authenticated session**
   - Open the app in browser and log in
   - This ensures API routes can authenticate requests

3. **Environment variables**
   - `AI_GATEWAY_API_KEY` must be set in `.env.local`

### Generate Scenes

```bash
npm run generate:backgrounds
```

Or directly:
```bash
tsx scripts/generate-background-scenes.ts
```

---

## What It Does

The script will:

1. **Generate 5 background scenes**:
   - Tropical Beach
   - Modern Luxury Bathroom
   - Fitness Center
   - Neon Rave Club
   - Urban Bar District

2. **Save to temp directory**: `/temp/`
   - Files: `beach-tropical.{ext}`, `bathroom-modern.{ext}`, etc.

3. **Save to database** (optional):
   - Stores scene metadata in `scenes` table
   - Marks as template scenes for reuse

4. **Provide progress output**:
   - Shows generation progress for each scene
   - Reports success/failure for each
   - Summary at the end

---

## Output

### Console Output

```
🎨 Generating background scenes...
Found 5 templates

Using API base URL: http://localhost:3000
Note: Ensure Next.js dev server is running and you're authenticated.

[1/5] Generating: Tropical Beach...
  Calling API: http://localhost:3000/api/generate-image
  ✓ Generated: https://...
  ✓ Saved to temp: /path/to/temp/beach-tropical.png
  ✓ Saved to database
  ✅ Complete!

...

============================================================
✅ Generation complete!
Successfully generated: 5/5 scenes
============================================================

Generated Scenes:
  ✓ Tropical Beach
    Temp: temp/beach-tropical.png
    URL: https://...

  ✓ Modern Luxury Bathroom
    Temp: temp/bathroom-modern.png
    URL: https://...

...
```

### Files Created

- `temp/beach-tropical.{png|jpg|webp}`
- `temp/bathroom-modern.{png|jpg|webp}`
- `temp/gym-fitness.{png|jpg|webp}`
- `temp/rave-neon.{png|jpg|webp}`
- `temp/bar-urban.{png|jpg|webp}`

---

## Troubleshooting

### Error: "Unauthorized"

**Solution**: Make sure you're logged into the app in your browser. The API route requires authentication.

### Error: "Configuration error: No AI Gateway API key"

**Solution**: Add `AI_GATEWAY_API_KEY` to `.env.local`:
```env
AI_GATEWAY_API_KEY=your_key_here
```

### Error: "Failed to fetch"

**Solution**: Ensure Next.js dev server is running:
```bash
npm run dev
```

### Error: "Failed to save scene to database"

**Note**: This is optional. Scenes are still saved to temp directory even if database save fails.

---

## Background Scene Details

All scenes use structured prompts following the ChatGPT conversation style guide:

- **Style**: Bara anime cartoon comic style
- **Focus**: 100% background (no characters)
- **Quality**: Professional game art, crisp edges
- **Aspect Ratio**: 16:9 (landscape)
- **Negative Constraints**: No characters, no people, no photorealism

### Scene Templates

1. **Tropical Beach** (`beach-tropical`)
   - Outdoor, sunset atmosphere
   - Palm trees, ocean waves, golden sand

2. **Modern Luxury Bathroom** (`bathroom-modern`)
   - Indoor, steam atmosphere
   - Marble surfaces, mirrors, ambient lighting

3. **Fitness Center** (`gym-fitness`)
   - Indoor, industrial atmosphere
   - Weights, equipment, dynamic lighting

4. **Neon Rave Club** (`rave-neon`)
   - Indoor, party atmosphere
   - Neon lights, dance floor, strobe lights

5. **Urban Bar District** (`bar-urban`)
   - Outdoor, nightlife atmosphere
   - Neon signs, graffiti walls, street lights

---

## Using Generated Scenes

### In Scene Generator

The generated scenes can be:
1. Selected from the scene library
2. Used as backgrounds for character placement
3. Referenced by their template IDs

### In Scene Composer

Background scenes are used when composing two-character scenes:
1. Select a background scene
2. Select two characters
3. Generate composition

---

## API Route Alternative

You can also generate scenes via the API route:

```bash
curl -X POST http://localhost:3000/api/generate-background-scenes
```

This requires authentication and returns JSON with results.

---

## References

- **Script**: `scripts/generate-background-scenes.ts`
- **Templates**: `lib/playground/background-scenes.ts`
- **API Route**: `app/api/generate-background-scenes/route.ts`
- **Prompt Templates**: `lib/playground/prompt-templates.ts`
- **ChatGPT Style Guide**: [Bara Art Wallpaper Request](https://chatgpt.com/share/695ca984-fe08-800f-8fac-2e3e535ab72b)


