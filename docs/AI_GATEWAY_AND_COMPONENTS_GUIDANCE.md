# AI Gateway & AI Elements Installation Guidance

**Date**: 2026-01-31

---

## 1. Vercel AI Gateway Usage

### Current Status:

✅ **Gemini 3 Pro** - Still using AI Gateway via `AI_GATEWAY_API_KEY`
- Routes through Vercel AI Gateway
- Uses `generateText` with `google/gemini-3-pro-image-preview` model

⚠️ **DALL-E 3** - Currently goes **directly to OpenAI API** (not through Gateway)
- After migration, uses Vercel AI SDK `generateImage` 
- Goes directly to OpenAI (faster, no gateway overhead)
- Still has OpenAI SDK fallback

### Should DALL-E 3 Use AI Gateway?

**Current Implementation**: Direct to OpenAI (faster, simpler)

**If you want Gateway benefits** (rate limiting, analytics, caching):
- We can route DALL-E 3 through AI Gateway
- Would use `openai/dall-e-3` model string format
- Requires `AI_GATEWAY_API_KEY` configuration

**Recommendation**: Keep current implementation unless you need Gateway features for DALL-E 3.

---

## 2. AI Elements Component Overwrite Guidance

### ✅ **DO NOT Overwrite** (Keep Your Existing):
- `button.tsx` - Your shadcn/ui button is fine
- `tooltip.tsx` - Your shadcn/ui tooltip is fine
- `dialog.tsx`, `sheet.tsx`, `popover.tsx` - Standard UI components work well

### ⚠️ **Review Before Overwriting** (AI Elements might have enhancements):
- `input.tsx` - AI Elements might have prompt-specific input
- `textarea.tsx` - AI Elements likely has enhanced textarea for prompts
- `scroll-area.tsx` - Might have chat-specific enhancements
- `card.tsx` - Unlikely conflict, but review

### ✅ **Safe to Overwrite** (If AI Elements offers them):
- Any components that are **AI-specific** and you don't have custom versions
- Components that AI Elements enhances for chat/AI use cases

### 📋 **Recommended Approach**:

**Best Practice**: Install AI Elements to default location (`components/ai-elements/`)

1. **When prompted about overwriting:**
   - `button.tsx` → **"N" (No)**
   - `tooltip.tsx` → **"N" (No)**
   - `input.tsx` → **Review** - AI Elements might have better prompt input
   - `textarea.tsx` → **Consider "Y"** - AI Elements has prompt-specific textarea
   - Other components → **Review case-by-case**

2. **Import Strategy:**
   ```tsx
   // AI Elements components
   import { Conversation, Message } from "@/components/ai-elements/conversation"
   
   // Standard shadcn/ui components
   import { Button } from "@/components/ui/button"
   import { Input } from "@/components/ui/input"
   ```

3. **This gives you:**
   - AI Elements for chat/AI-specific features
   - Your existing shadcn/ui components for general UI
   - No conflicts, best of both worlds

---

## Quick Answers

**Q: Are we still using Vercel AI Gateway?**
**A:** Yes, for Gemini. DALL-E 3 goes directly to OpenAI (faster). We can route it through Gateway if you want rate limiting/analytics.

**Q: Should I overwrite remaining components?**
**A:** 
- **No** for: `button.tsx`, `tooltip.tsx`
- **Review** for: `input.tsx`, `textarea.tsx` (AI Elements might have better versions)
- **Generally keep existing** unless AI Elements has specific AI-focused enhancements

**Best approach**: Install to `components/ai-elements/` (default) and keep your `components/ui/` components separate.


