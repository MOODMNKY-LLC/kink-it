# Image Management System - Quick Reference

**Last Updated**: 2026-01-31  
**Related**: [Comprehensive Analysis](./IMAGE_MANAGEMENT_SYSTEM_COMPREHENSIVE_ANALYSIS.md)

---

## System Overview

**Purpose**: AI-generated avatar creation and management for KINKSTER characters  
**Status**: Core functionality complete, enhancements needed  
**Storage**: Supabase Storage (`kinkster-avatars` bucket)  
**Generation**: OpenAI DALL-E 3  
**Optimization**: Supabase Image Transformation API + Next.js Image component

---

## Architecture Quick Reference

### Implementation Paths

**Path 1: Next.js API Route** (Synchronous)
- Route: `POST /api/kinksters/avatar/generate`
- File: `app/api/kinksters/avatar/generate/route.ts`
- Use Case: Development, simple scenarios
- Response: Blocks until complete

**Path 2: Edge Function** (Asynchronous)
- Function: `generate-kinkster-avatar`
- File: `supabase/functions/generate-kinkster-avatar/index.ts`
- Use Case: Production, scalable scenarios
- Response: Immediate 202, background processing

### Storage Structure

```
kinkster-avatars/
  └── {user_id}/
      └── kinksters/
          └── avatar_{timestamp}_{kinkster_id}.{ext}
```

### Data Flow

```
User → Component → Hook → API/Edge Function → OpenAI → 
Download → Upload → Storage → Database → Display
```

---

## Key Files

### Backend
- `app/api/kinksters/avatar/generate/route.ts` - Next.js API route
- `app/api/kinksters/avatar/store/route.ts` - Manual storage route
- `supabase/functions/generate-kinkster-avatar/index.ts` - Edge Function
- `supabase/migrations/20260131000002_create_kinkster_storage_bucket.sql` - Storage bucket
- `supabase/migrations/20260131000003_create_avatar_management_functions.sql` - DB functions
- `supabase/migrations/20260131000004_add_avatar_realtime_policies.sql` - Realtime policies

### Frontend
- `hooks/use-avatar-generation.ts` - React hook for generation
- `components/kinksters/steps/avatar-generation-step.tsx` - Generation UI
- `components/kinksters/kinkster-sheet.tsx` - Avatar display
- `components/kinksters/steps/finalize-step.tsx` - Preview before creation
- `lib/supabase-image-loader.ts` - Next.js image loader

### Database
- `kinksters` table - Stores avatar_url, avatar_prompt, avatar_generation_config
- Helper functions: `validate_avatar_url`, `get_user_avatar_stats`, `get_avatar_generation_status`

---

## Usage Examples

### Generate Avatar (Edge Function)

```typescript
import { useAvatarGeneration } from '@/hooks/use-avatar-generation'

const { generateAvatar, progress, isGenerating } = useAvatarGeneration({
  userId: user.id,
  kinksterId: kinkster?.id,
  onComplete: (storageUrl) => {
    // Handle completion
  },
  onError: (error) => {
    // Handle error
  },
})

await generateAvatar(characterData, customPrompt)
```

### Display Avatar

```typescript
import Image from 'next/image'
import supabaseImageLoader from '@/lib/supabase-image-loader'

<Image
  loader={supabaseImageLoader}
  src={kinkster.avatar_url}
  width={256}
  height={256}
  alt={kinkster.name}
/>
```

### Manual Storage

```typescript
const response = await fetch('/api/kinksters/avatar/store', {
  method: 'POST',
  body: JSON.stringify({
    image_url: 'https://...',
    kinkster_id: 'optional-uuid',
  }),
})
```

---

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - Required for image generation
- `NEXT_PUBLIC_SUPABASE_URL` - Required for storage and loader
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required for client operations

### Storage Bucket Settings

- **Name**: `kinkster-avatars`
- **Public**: Yes (for CDN)
- **Size Limit**: 5MB
- **Allowed Types**: PNG, JPEG, WebP
- **Cache Control**: 3600 seconds

### Generation Settings

- **Model**: DALL-E 3
- **Size**: 1024x1024
- **Quality**: Standard
- **Format**: PNG (default)

---

## Status Indicators

### Progress States
- `generating` - OpenAI generation in progress
- `downloading` - Downloading from OpenAI
- `uploading` - Uploading to storage
- `completed` - Successfully stored
- `error` - Generation or storage failed

### URL Types
- **Supabase Storage URL**: `https://{project}.supabase.co/storage/v1/object/public/kinkster-avatars/...`
- **OpenAI Temporary URL**: `https://oaidalleapiprodscus.blob.core.windows.net/...` (expires)

---

## Known Gaps

1. ❌ Proof upload storage (mentioned in PRD, not implemented)
2. ❌ Image management UI (view/delete/regenerate avatars)
3. ❌ Migration tools (existing OpenAI URLs → Storage)
4. ❌ Automated cleanup jobs
5. ❌ Comprehensive test coverage
6. ⚠️ Code duplication (Next.js route vs Edge Function)

---

## Quick Troubleshooting

### Images Not Displaying
- Check `avatar_url` in database
- Verify Supabase Storage bucket exists
- Check RLS policies
- Verify image loader configuration

### Generation Failing
- Verify `OPENAI_API_KEY` is set
- Check rate limits
- Review error messages in console
- Check Edge Function logs: `supabase functions logs generate-kinkster-avatar`

### Storage Upload Failing
- Verify bucket exists and is public
- Check RLS policies allow user uploads
- Verify file size < 5MB
- Check file format is allowed

### Realtime Not Working
- Verify Realtime policies exist
- Check topic naming matches (`kinkster:{id}:avatar` or `user:{id}:avatar`)
- Verify user authentication
- Check Edge Function is broadcasting correctly

---

## Related Documentation

- [Comprehensive Analysis](./IMAGE_MANAGEMENT_SYSTEM_COMPREHENSIVE_ANALYSIS.md) - Full system analysis
- [Implementation Plan](./KINKSTER_IMAGE_MANAGEMENT_IMPLEMENTATION.md) - Implementation details
- [Edge Function Optimization](./KINKSTER_EDGE_FUNCTION_OPTIMIZATION.md) - Edge Function details
- [Image Management Summary](./KINKSTER_IMAGE_MANAGEMENT_SUMMARY.md) - Quick summary

---

**For detailed information, see [Comprehensive Analysis](./IMAGE_MANAGEMENT_SYSTEM_COMPREHENSIVE_ANALYSIS.md)**



