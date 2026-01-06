# AI Gateway Usage Clarification

**Date**: 2026-01-31

---

## Current Implementation Status

### ✅ Still Using AI Gateway For:
- **Gemini 3 Pro Image Preview** - Uses `AI_GATEWAY_API_KEY` and routes through Vercel AI Gateway via `generateText`

### ⚠️ Currently NOT Using AI Gateway For:
- **DALL-E 3** - After migration, now uses Vercel AI SDK `generateImage` which goes **directly to OpenAI API** (not through AI Gateway)

---

## Should We Use AI Gateway for DALL-E 3?

**Benefits of routing DALL-E 3 through AI Gateway:**
- ✅ Rate limiting and request management
- ✅ Caching capabilities
- ✅ Analytics and monitoring
- ✅ Cost tracking
- ✅ Consistent routing for all models

**Current Implementation:**
- Uses OpenAI API directly (faster, no gateway overhead)
- Still has fallback mechanism

---

## Option: Route DALL-E 3 Through AI Gateway

If you want to route DALL-E 3 through AI Gateway for consistency, we can update the implementation to use:

```typescript
// Option 1: Use gateway provider with model string
import { gateway } from 'ai'

const { image } = await generateImage({
  model: 'openai/dall-e-3',  // Gateway format
  prompt: prompt,
  size: imageSize,
})

// Option 2: Configure OpenAI provider with gateway baseURL
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({
  baseURL: process.env.AI_GATEWAY_URL, // If you have gateway URL
  apiKey: process.env.AI_GATEWAY_API_KEY,
})
```

**Recommendation**: Keep current implementation (direct OpenAI) unless you need Gateway features like rate limiting or analytics for DALL-E 3.

---

## AI Elements Component Overwrite Guidance

### ✅ Safe to Overwrite (AI-specific, won't conflict):
- Any components in `components/ai-elements/` directory
- These are new components, not replacements

### ⚠️ Review Before Overwriting:
- `input.tsx` - If AI Elements has enhanced input, you might want it
- `textarea.tsx` - AI Elements might have prompt-specific textarea
- `scroll-area.tsx` - Might have chat-specific enhancements
- `card.tsx` - Unlikely to conflict, but review

### ❌ Keep Existing (Don't Overwrite):
- `button.tsx` - Your existing shadcn/ui button is fine
- `tooltip.tsx` - Your existing shadcn/ui tooltip is fine
- `dialog.tsx`, `sheet.tsx`, `popover.tsx` - Standard UI components

### 📋 Recommended Approach:
1. **Install AI Elements to `components/ai-elements/`** (default location)
2. **Don't overwrite existing `components/ui/` components**
3. **Import AI Elements components from `@/components/ai-elements/`**
4. **Use shadcn/ui components from `@/components/ui/`**

This way you get the best of both worlds without conflicts!

---

## Quick Answer

**Q: Are we still using Vercel AI Gateway?**
**A:** Yes, for Gemini. DALL-E 3 now goes directly to OpenAI (faster). We can route it through Gateway if you want consistency.

**Q: Should I overwrite remaining components?**
**A:** No - install AI Elements to `components/ai-elements/` (default) and keep your existing `components/ui/` components. Only overwrite if AI Elements has a specific enhancement you need.


