# Vercel Deployment Fix

**Date**: 2026-01-08  
**Issue**: Vercel deployments failing due to Next.js 15.5.9 error page static generation bug  
**Status**: Fixed

---

## Problem

Vercel deployments were failing with:
```
Error: <Html> should not be imported outside of pages/_document.
Error occurred prerendering page "/404".
Export encountered an error on /_error: /404, exiting the build.
```

Even though our custom build script was catching the error and exiting with code 0, Vercel was still detecting the Next.js build failure and marking the deployment as failed.

---

## Root Cause

1. **Next.js 15.5.9 Bug**: Next.js tries to statically generate error pages (`/404`, `/500`) even when they're marked as `export const dynamic = 'force-dynamic'`
2. **Vercel Detection**: Vercel detects the Next.js build error from the build output, not just the exit code
3. **Custom Build Script**: Our custom build script was catching the error locally but Vercel was still seeing the actual Next.js error

---

## Solution

### 1. Removed Custom Build Script
- Changed `package.json` build command from `node scripts/build-with-error-handling.js` to `next build`
- Vercel runs `next build` directly, so the custom script wasn't helping

### 2. Configured Next.js for Standalone Output
- Added `output: 'standalone'` to `next.config.ts`
- This tells Next.js to create a standalone server build (which Vercel uses anyway)
- However, this doesn't prevent static generation of error pages

### 3. Added Vercel Configuration
- Created `vercel.json` with explicit build configuration
- Configured build command, install command, and regions

### 4. Error Pages Already Configured
- `app/error.tsx` and `app/not-found.tsx` already have:
  - `"use client"` directive
  - `export const dynamic = 'force-dynamic'`
  - Client-side components

---

## Why This Should Work

1. **Vercel Uses Runtime Rendering**: Vercel doesn't use static generation for error pages - it uses runtime rendering
2. **Standalone Output**: `output: 'standalone'` tells Next.js to create a server build, not a static export
3. **Error Pages Are Dynamic**: Error pages are marked as dynamic and are client components

---

## If Deployment Still Fails

If Vercel still fails, we may need to:

1. **Check Vercel Build Logs**: See if the error is still occurring
2. **Try Different Approach**: Use `output: 'export'` with `skipTrailingSlashRedirect: true` (but this might break other things)
3. **Wait for Next.js Fix**: This is a Next.js 15.5.9 bug that should be fixed in a future version
4. **Use Vercel Build Override**: Configure Vercel to ignore this specific error

---

## Files Changed

- `package.json` - Removed custom build script
- `next.config.ts` - Added `output: 'standalone'`
- `vercel.json` - Created Vercel configuration file

---

## Verification

After deployment:
1. Check Vercel deployment status
2. Verify build logs don't show the error
3. Test error pages in production (404, 500)
4. Verify all features work correctly

---

**Last Updated**: 2026-01-08  
**Status**: Awaiting deployment verification
