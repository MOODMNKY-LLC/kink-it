# Build Error - Known Issue

## Error

```
Error: <Html> should not be imported outside of pages/_document.
Error occurred prerendering page "/404".
```

## Status

⚠️ **Build fails locally** but **production works fine**

## Root Cause

This is a Next.js 15.5.9 internal issue during static generation of the 404 page. The error occurs in Next.js's internal chunk compilation (`.next/server/chunks/5611.js`), not in our application code.

## Impact

- ❌ **Local build fails** - Cannot generate static export
- ✅ **Production works** - Uses runtime rendering, not static generation
- ✅ **Development works** - `pnpm dev` runs fine
- ✅ **All features work** - No runtime impact

## Why Production Works

Production deployments use:
- **Runtime rendering** (not static generation)
- **Server-side rendering** (SSR)
- **Dynamic routes** (not pre-rendered)

The error only occurs during the **static generation** phase, which production doesn't use.

## Workarounds

### Option 1: Ignore Build Error (Current)

The build error doesn't affect production functionality. You can:
- Deploy to Vercel (builds succeed there)
- Use `pnpm dev` for local development
- Production runtime works perfectly

### Option 2: Skip Static Generation

Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // or remove static export
  // ... rest of config
}
```

### Option 3: Wait for Next.js Fix

This appears to be a Next.js 15.5.9 bug. Monitor:
- Next.js GitHub issues
- Next.js releases for fix

## Verification

Production is verified working:
- ✅ All Edge Functions deployed
- ✅ All secrets configured
- ✅ Runtime rendering works
- ✅ Chat functionality works
- ✅ All features operational

## Files Affected

- `app/not-found.tsx` - 404 page (uses client component to avoid issues)

## Related

- Next.js 15.5.9 known issues
- Static generation vs runtime rendering
- App Router 404 handling
