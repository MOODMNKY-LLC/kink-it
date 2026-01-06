# Fix: Generations Bucket Not Found

## Issue
The background removal and vectorization API routes were trying to upload to a `generations` bucket that didn't exist, causing a "Bucket not found" error.

## Solution

### 1. Created Migration
Created migration file: `supabase/migrations/20260131000007_create_generations_storage_bucket.sql`

This migration creates:
- Storage bucket: `generations`
- Public access enabled for CDN delivery
- 10MB file size limit
- Supports: PNG, JPEG, WebP, SVG (for vectorized images), GIF
- RLS policies for user-based access control

### 2. Apply Migration

**For Local Development:**
```bash
npx supabase migration up --local --include-all
```

**For Production:**
```bash
npx supabase db push
```

### 3. Sharp Import Fix

Updated `app/api/image/remove-background/route.ts` to:
- Only attempt Sharp conversion for unsupported formats
- Return clear error if format is not supported and Sharp fails
- Use original buffer if format is already supported

## Bucket Structure

```
generations/
  └── processed/
      └── {user_id}/
          ├── bg-removed-{timestamp}.png
          └── vectorized-{timestamp}.svg
```

## RLS Policies

- **Upload**: Users can upload to their own `processed/{user_id}/` folder
- **View**: Users can view their own files + public access for CDN
- **Update**: Users can update their own files
- **Delete**: Users can delete their own files

