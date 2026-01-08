# Next.js 15.5.9 Error Page Static Generation Bug Analysis

## Executive Summary

**This is a confirmed BUG/REGRESSION in Next.js 15.5.9**, not expected behavior. The framework attempts to statically generate error pages (`/404`, `/500`) even when using App Router with `app/not-found.tsx` and `app/error.tsx`, causing `Error: <Html> should not be imported outside of pages/_document` errors during build.

## Evidence This Is A Bug

### 1. GitHub Issues Confirm Bug Status

- **Issue #65290** (May 2024): Labeled as "bug" - Reports exact same error pattern:
  ```
  Error: <Html> should not be imported outside of pages/_document
  Error occurred prerendering page "/404"
  Error occurred prerendering page "/500"
  ```

- **Issue #55804** (September 2023): Older issue showing similar error pattern, suggesting this is a recurring problem

### 2. Community Reports

- **Reddit Thread**: Multiple users report this exact issue after upgrading to Next.js 15.5.9
  - User states: "This appears to be a Next.js 15.5.9 change where it attempts to generate static error pages"
  - Cannot downgrade due to security fixes in 15.5.9
  - No official workarounds provided

### 3. Release Notes Analysis

- **Next.js 15.5 Release Notes**: No mention of intentional changes to error page static generation
- **Next.js 15.5.9 Security Update**: Released December 11, 2025 specifically for security fixes (CVE-2025-55184, CVE-2025-55183)
- **No Documentation**: Next.js documentation for `error.js` and `not-found.js` doesn't mention this behavior or how to prevent it

### 4. Behavior Analysis

**Expected Behavior (App Router):**
- Error pages (`app/not-found.tsx`, `app/error.tsx`) should be dynamically rendered
- Should respect `export const dynamic = 'force-dynamic'`
- Should respect `export const runtime = 'edge'`
- Should NOT attempt static generation

**Actual Behavior (Next.js 15.5.9):**
- Next.js attempts static generation of `/404` and `/500` routes during build
- This triggers internal code paths that import `Html` from `next/document`
- Causes build failures even though production runtime works fine
- Vercel's post-build validation detects this error and fails deployment

## Root Cause

The bug appears to be in Next.js's static page generation logic, which attempts to prerender error pages even when:
1. Using App Router (not Pages Router)
2. Error pages are marked as client components (`"use client"`)
3. Route segment config explicitly sets `dynamic = 'force-dynamic'`
4. Route segment config sets `runtime = 'edge'`

During this attempted static generation, Next.js internally imports `Html` from `next/document`, which is only allowed in `pages/_document.js` (Pages Router), causing the error.

## Impact

- **Build Failures**: `next build` fails with Html import error
- **Vercel Deployment Failures**: Even when build script succeeds, Vercel's post-build validation detects the error
- **Cannot Downgrade**: Next.js 15.5.9 contains critical security fixes (CVE-2025-55184, CVE-2025-55183)
- **Production Works**: Despite build failures, production runtime works correctly (Vercel uses runtime rendering)

## Workarounds Attempted

### 1. Route Segment Config
- `export const dynamic = 'force-dynamic'` - **Doesn't work**
- `export const revalidate = 0` - **Doesn't work**
- `export const runtime = 'edge'` - **Doesn't work**

### 2. Client Components
- Converting `app/not-found.tsx` to client component (`"use client"`) - **Doesn't prevent static generation attempt**

### 3. Build Script Filtering
- Custom build script to suppress error output - **Build succeeds but Vercel still detects error**

### 4. Output Configuration
- `output: 'standalone'` in `next.config.ts` - **Doesn't prevent Vercel's post-build validation**

## Current Status

- **Bug Status**: Confirmed bug (GitHub issue #65290 labeled as "bug")
- **Next.js Version**: 15.5.9 (latest stable with security fixes)
- **Fix Available**: No official fix found in newer versions
- **Workaround**: Build script can suppress errors, but Vercel's validation still fails

## Recommendations

1. **Monitor GitHub Issue #65290** for official fixes
2. **Report to Vercel Support** - This may require Vercel-side changes to handle this Next.js bug
3. **Consider Upgrading to Next.js 16.x** - May have fixes, but requires testing
4. **Continue Using Build Script Workaround** - Until official fix is available

## References

- GitHub Issue #65290: https://github.com/vercel/next.js/issues/65290
- GitHub Issue #55804: https://github.com/vercel/next.js/issues/55804
- Reddit Discussion: https://www.reddit.com/r/nextjs/comments/1pm7kjv/help_nextjs_1559_upgrade_breaks_build_stuck/
- Next.js 15.5.9 Security Update: https://nextjs.org/blog/security-update-2025-12-11
- Next.js Error Page Docs: https://nextjs.org/docs/app/api-reference/file-conventions/error
- Next.js Not Found Docs: https://nextjs.org/docs/app/api-reference/file-conventions/not-found

## Conclusion

This is definitively a **BUG** in Next.js 15.5.9, not expected behavior. The framework incorrectly attempts static generation of error pages in App Router, causing build failures. While workarounds exist, there's no official fix yet. The issue is compounded by Vercel's post-build validation detecting the error even after build scripts succeed.
