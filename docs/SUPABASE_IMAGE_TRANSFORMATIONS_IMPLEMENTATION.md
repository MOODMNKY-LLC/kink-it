# Supabase Image Transformations Implementation

## Overview

This document describes the implementation of Supabase Image Transformations as a complementary optimization layer for our image manipulation workflow.

## Architecture

### Hybrid Approach

We use a **hybrid complementary approach**:
- **Supabase Image Transformations**: For optimization, resizing, format conversion, and serving
- **Server-side Processing**: For advanced AI features (background removal, vectorization)

### Components

1. **Custom Image Loader** (`lib/supabase-image-loader.ts`)
   - Next.js custom loader for Supabase Storage images
   - Automatically applies transformations via `/render/image/public/` endpoint
   - Handles both full URLs and relative paths

2. **Image Utilities** (`lib/supabase-image-utils.ts`)
   - Helper functions for generating optimized image URLs
   - Thumbnail generation
   - Responsive image URLs

3. **Optimized Image Component** (`components/ui/optimized-image.tsx`)
   - Wrapper around Next.js Image component
   - Automatically applies Supabase transformations for Supabase Storage images
   - Falls back to regular img tag for non-Supabase URLs

## Usage

### Next.js Image Component

```tsx
import Image from "next/image"
import supabaseImageLoader from "@/lib/supabase-image-loader"

<Image
  loader={supabaseImageLoader}
  src="https://project.supabase.co/storage/v1/object/public/bucket/image.png"
  width={800}
  height={600}
  alt="Image"
  quality={85}
/>
```

### Optimized Image Component

```tsx
import { OptimizedImage } from "@/components/ui/optimized-image"

<OptimizedImage
  src={imageUrl}
  alt="Image"
  width={800}
  height={600}
  quality={85}
/>
```

### Utility Functions

```tsx
import { getOptimizedImageUrl, getThumbnailUrl, getResponsiveImageUrls } from "@/lib/supabase-image-utils"

// Get optimized URL
const optimizedUrl = getOptimizedImageUrl(imageUrl, {
  width: 1200,
  quality: 85,
})

// Get thumbnail
const thumbnailUrl = getThumbnailUrl(imageUrl, 200)

// Get responsive URLs
const responsiveUrls = getResponsiveImageUrls(imageUrl)
// Returns: { mobile, tablet, desktop, full }
```

## Workflow

### Image Generation Flow

1. **Generate Image** → Store original in Supabase Storage (`generations` bucket)
2. **If Background Removal Needed** → Process server-side → Upload processed version to Supabase
3. **If Vectorization Needed** → Process server-side → Upload SVG to Supabase
4. **Serve Optimized Versions** → Use Supabase transformations for different sizes/formats

### Benefits

- **Reduced Server Load**: Only process advanced features when needed
- **Reduced Storage**: Store one high-res, generate variants on-demand
- **Reduced Egress**: Optimized formats and sizes
- **Better Performance**: CDN caching, format optimization
- **Better UX**: Responsive images, faster loading

## Configuration

### Next.js Config

The custom loader is configured in `next.config.ts`:

```typescript
images: {
  loader: 'custom',
  loaderFile: './lib/supabase-image-loader.ts',
  // ... other config
}
```

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL

## Limitations

- Supabase Image Transformations **cannot** perform background removal or vectorization
- These features require server-side processing with specialized libraries
- Transformations are limited to: resizing, quality control, format conversion

## Future Enhancements

- Automatic responsive image generation for all uploaded images
- Format optimization based on browser capabilities
- Quality optimization based on use case (thumbnail vs. full-size)
- CDN caching strategies for different image types

