# KINKSTER Image Management System - Implementation Plan

**Date**: 2026-01-31  
**Status**: Implementation Complete  
**Related**: KINKSTER Character Creation System

---

## 🎯 Overview

Comprehensive image management system for KINKSTER avatars, implementing persistent storage in Supabase Storage with automatic CDN delivery, image optimization, and secure access controls.

---

## 🏗️ Architecture

### Storage Layer

**Supabase Storage Bucket**: `kinkster-avatars`
- **Public Access**: Enabled for CDN delivery
- **File Size Limit**: 5MB (DALL-E 3 generates ~1-2MB images)
- **Allowed MIME Types**: `image/png`, `image/jpeg`, `image/webp`, `image/jpg`

**File Organization Structure**:
\`\`\`
kinkster-avatars/
  └── {user_id}/
      └── kinksters/
          └── avatar_{timestamp}_{kinkster_id}.{ext}
\`\`\`

### Security (RLS Policies)

1. **Upload Policy**: Users can upload avatars to their own folder
2. **View Policy**: Users can view their own avatars + public access for CDN
3. **Update Policy**: Users can update their own avatars
4. **Delete Policy**: Users can delete their own avatars

### Image Pipeline

\`\`\`
OpenAI DALL-E 3 Generation
    ↓
Download Image (fetch)
    ↓
Convert to Buffer
    ↓
Upload to Supabase Storage
    ↓
Get Public URL
    ↓
Store URL in Database
\`\`\`

---

## 🔧 Implementation Details

### 1. Storage Bucket Migration

**File**: `supabase/migrations/20260131000002_create_kinkster_storage_bucket.sql`

Creates:
- Storage bucket with appropriate limits
- RLS policies for secure access
- Public access for CDN delivery

### 2. Avatar Generation Route (Enhanced)

**File**: `app/api/kinksters/avatar/generate/route.ts`

**Changes**:
- After OpenAI generation, downloads image from URL
- Converts to buffer
- Uploads to Supabase Storage
- Returns Supabase Storage URL instead of OpenAI URL
- Fallback: Returns OpenAI URL with warning if storage fails

**Response Format**:
\`\`\`json
{
  "image_url": "https://{project}.supabase.co/storage/v1/object/public/kinkster-avatars/...",
  "storage_url": "https://{project}.supabase.co/storage/v1/object/public/kinkster-avatars/...",
  "storage_path": "{user_id}/kinksters/avatar_{timestamp}.png",
  "openai_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "prompt": "...",
  "generation_config": { ... }
}
\`\`\`

### 3. Manual Image Storage Route

**File**: `app/api/kinksters/avatar/store/route.ts`

**Purpose**: Store any image URL in Supabase Storage (useful for manual uploads or migration)

**Usage**:
\`\`\`typescript
POST /api/kinksters/avatar/store
{
  "image_url": "https://...",
  "kinkster_id": "optional-uuid"
}
\`\`\`

---

## 🎨 Image Optimization

### Supabase Image Transformation

Supabase Storage provides on-the-fly image transformation:

\`\`\`typescript
// Get optimized image URL
const { data } = supabase.storage
  .from('kinkster-avatars')
  .getPublicUrl(filePath, {
    transform: {
      width: 512,
      height: 512,
      quality: 80,
      format: 'webp'
    }
  })
\`\`\`

### Next.js Image Component Integration

Create custom loader for Next.js Image component:

\`\`\`typescript
// lib/supabase-image-loader.ts
export default function supabaseImageLoader({ src, width, quality }) {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
  return `https://${projectId}.supabase.co/storage/v1/object/public/kinkster-avatars/${src}?width=${width}&quality=${quality || 75}`
}
\`\`\`

---

## 📊 Database Integration

### Kinkster Table Update

The `kinksters` table already includes:
- `avatar_url` - Stores Supabase Storage URL
- `avatar_prompt` - Stores generation prompt
- `avatar_generation_config` - Stores generation settings

### Migration Required

Run migration to create storage bucket:
\`\`\`bash
supabase migration up 20260131000002_create_kinkster_storage_bucket
\`\`\`

---

## 🚀 Usage Examples

### Generate and Store Avatar

\`\`\`typescript
// In avatar generation step
const response = await fetch('/api/kinksters/avatar/generate', {
  method: 'POST',
  body: JSON.stringify({
    characterData: {
      name: 'Character Name',
      appearance_description: '...',
      // ... other character data
    }
  })
})

const { image_url, storage_url } = await response.json()
// image_url is now Supabase Storage URL (persistent)
\`\`\`

### Display Avatar with Optimization

\`\`\`typescript
import Image from 'next/image'
import supabaseImageLoader from '@/lib/supabase-image-loader'

<Image
  loader={supabaseImageLoader}
  src={kinkster.avatar_url}
  width={512}
  height={512}
  alt={kinkster.name}
/>
\`\`\`

---

## 🔒 Security Considerations

1. **RLS Policies**: Enforce user-based access control
2. **File Type Validation**: Only allow image types
3. **File Size Limits**: Prevent abuse (5MB limit)
4. **User Isolation**: Each user's avatars in separate folder
5. **Public Access**: Required for CDN, but RLS still enforces user boundaries

---

## 📈 Performance Optimizations

1. **CDN Delivery**: Supabase Storage automatically uses CDN
2. **Cache Control**: Set to 3600 seconds (1 hour)
3. **Image Transformation**: On-the-fly optimization reduces bandwidth
4. **Format Conversion**: Automatic WebP conversion for modern browsers

---

## 🐛 Error Handling

### Storage Upload Failure

If Supabase Storage upload fails:
- Returns OpenAI URL as fallback
- Includes warning in response
- Logs error for debugging
- User can retry or use temporary URL

### Image Download Failure

If OpenAI image download fails:
- Returns error immediately
- User can regenerate avatar

---

## 🔄 Migration Path

### Existing Kinksters with OpenAI URLs

1. Create migration script to:
   - Find all kinksters with OpenAI URLs
   - Download images
   - Upload to Supabase Storage
   - Update `avatar_url` in database

2. Or: Use manual storage route for individual migrations

---

## 📝 Next Steps

1. ✅ Storage bucket created
2. ✅ Avatar generation enhanced
3. ✅ Manual storage route created
4. ⚠️ Run migration
5. ⚠️ Create Next.js image loader
6. ⚠️ Update avatar display components
7. ⚠️ Add image management UI (delete, regenerate)
8. ⚠️ Create migration script for existing avatars

---

## 🔗 Related Files

- `supabase/migrations/20260131000002_create_kinkster_storage_bucket.sql`
- `app/api/kinksters/avatar/generate/route.ts`
- `app/api/kinksters/avatar/store/route.ts`
- `components/kinksters/steps/avatar-generation-step.tsx`
- `components/kinksters/kinkster-sheet.tsx`

---

**Last Updated**: 2026-01-31  
**Status**: Implementation Complete, Migration Pending
