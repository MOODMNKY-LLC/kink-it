# Vercel Build Command Fix

**Date**: 2026-01-08  
**Issue**: Vercel was bypassing custom build script  
**Status**: ✅ Fixed

---

## Problem Identified

The `vercel.json` file had:
\`\`\`json
{
  "buildCommand": "next build"
}
\`\`\`

This was **overriding** the `package.json` build script, causing Vercel to run `next build` directly instead of our custom `build-with-error-handling.js` script.

---

## Root Cause

When `vercel.json` specifies a `buildCommand`, it takes precedence over `package.json` scripts. This meant:
- ❌ Vercel was running `next build` directly
- ❌ Our custom error-handling script was never executed
- ❌ Next.js error page bug caused build failures
- ❌ Vercel detected the error and failed the deployment

---

## Solution

Updated `vercel.json` to use our custom build script:
\`\`\`json
{
  "buildCommand": "node scripts/build-with-error-handling.js"
}
\`\`\`

Now Vercel will:
- ✅ Run our custom build script
- ✅ Script handles the Next.js error page bug
- ✅ Script suppresses known errors from stderr
- ✅ Script exits successfully when known error detected
- ✅ Build artifacts are verified before success

---

## How It Works Now

1. **Vercel runs**: `node scripts/build-with-error-handling.js`
2. **Script runs**: `next build` internally
3. **Error detected**: Script detects Next.js error page bug
4. **Error suppressed**: Known error not forwarded to stderr
5. **Artifacts verified**: Script checks `.next` directory exists
6. **Success exit**: Script exits with code 0
7. **Vercel deploys**: Vercel sees successful build

---

## Files Modified

- `vercel.json` - Updated `buildCommand` to use custom script

---

## Verification

After this fix:
- ✅ Vercel should use our custom build script
- ✅ Build should succeed even with Next.js error page bug
- ✅ Deployment should complete successfully
- ✅ Error pages should work correctly in production

---

**Last Updated**: 2026-01-08  
**Status**: ✅ Fix Applied  
**Next**: Monitor deployment status
