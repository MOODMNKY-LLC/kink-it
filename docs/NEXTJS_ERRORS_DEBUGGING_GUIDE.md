# Next.js Errors Debugging Guide

**Date**: 2026-01-08  
**Issue**: 9 Next.js errors visible in browser  
**Status**: Investigating

---

## 🔍 Error Capture Methods

Since Chrome DevTools MCP uses a separate browser instance, we need to capture errors from your actual browser. Here are several methods:

### Method 1: Browser Console Script

**Run this in your browser console** (where you see the errors):

\`\`\`javascript
// Capture all Next.js errors
(function() {
  const errors = [];
  
  // Capture console errors
  const originalError = console.error;
  console.error = function(...args) {
    errors.push({
      type: 'console.error',
      message: args.join(' '),
      stack: new Error().stack,
      timestamp: new Date().toISOString()
    });
    originalError.apply(console, args);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', (e) => {
    errors.push({
      type: 'unhandled',
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    errors.push({
      type: 'unhandledrejection',
      message: e.reason?.message || String(e.reason),
      stack: e.reason?.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  // Check Next.js error overlay
  setTimeout(() => {
    const portal = document.querySelector('nextjs-portal');
    if (portal) {
      try {
        const shadowRoot = portal.shadowRoot;
        if (shadowRoot) {
          const errorText = shadowRoot.textContent;
          if (errorText) {
            errors.push({
              type: 'nextjs-overlay',
              content: errorText.substring(0, 2000)
            });
          }
        }
      } catch (e) {
        errors.push({
          type: 'nextjs-overlay-access-error',
          message: e.message
        });
      }
    }
    
    // After 3 seconds, log all errors
    setTimeout(() => {
      console.log('=== CAPTURED ERRORS ===');
      console.log(JSON.stringify(errors, null, 2));
      console.log(`Total errors: ${errors.length}`);
      
      // Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(errors, null, 2))
        .then(() => console.log('✅ Errors copied to clipboard!'))
        .catch(() => console.log('❌ Could not copy to clipboard'));
    }, 3000);
  }, 1000);
  
  // Return function to get errors
  window.__CAPTURED_NEXTJS_ERRORS__ = () => errors;
  
  console.log('✅ Error capture script loaded. Errors will be logged in 4 seconds.');
})();
\`\`\`

**After running**, wait 4 seconds and check console for `=== CAPTURED ERRORS ===`

### Method 2: Direct Error Overlay Access

**Run this in your browser console**:

\`\`\`javascript
// Get Next.js error overlay content
const portal = document.querySelector('nextjs-portal');
if (portal && portal.shadowRoot) {
  const content = portal.shadowRoot.textContent;
  console.log('Next.js Error Overlay Content:');
  console.log(content);
  
  // Also try to get structured error data
  const errorElements = portal.shadowRoot.querySelectorAll('[class*="error"], [data-error]');
  console.log(`Found ${errorElements.length} error elements`);
  errorElements.forEach((el, idx) => {
    console.log(`Error ${idx + 1}:`, el.textContent.substring(0, 200));
  });
} else {
  console.log('No Next.js error overlay found');
}
\`\`\`

### Method 3: Network Tab Errors

**Check browser DevTools → Network tab**:
1. Filter by "Failed" or "Error"
2. Look for:
   - Failed script loads
   - Failed API calls
   - 404/500 errors
   - CORS errors

---

## 🔍 Common Next.js 15 Error Patterns

### Pattern 1: searchParams Not Awaited

**Error**: `searchParams` is a Promise and must be awaited

**Check**:
\`\`\`bash
grep -r "searchParams\." app/ --include="*.tsx" --include="*.ts"
\`\`\`

**Fix**: Change `searchParams.step` to `(await searchParams).step`

### Pattern 2: Server/Client Component Boundary

**Error**: Cannot pass functions from Server Components to Client Components

**Check**:
\`\`\`bash
grep -r "use client" app/ | grep -v "use client"
# Find Server Components passing functions to Client Components
\`\`\`

**Fix**: Add `"use client"` to Server Components that pass functions

### Pattern 3: Hydration Mismatches

**Error**: Hydration failed because the initial UI does not match

**Check**: Look for:
- Browser extensions modifying DOM
- Date/time rendering differences
- Random values in server/client

**Fix**: Add `suppressHydrationWarning` to affected elements

### Pattern 4: Missing Type Definitions

**Error**: Property does not exist on type

**Check**: TypeScript errors in IDE

**Fix**: Add proper types or fix type definitions

### Pattern 5: Import Errors

**Error**: Cannot find module or its type definitions

**Check**: Missing imports or incorrect paths

**Fix**: Fix import paths or install missing packages

---

## 🧪 Systematic Error Check

### Step 1: Check TypeScript Errors

\`\`\`bash
cd /Users/moodmnky/GitHub/kink-it
npx tsc --noEmit 2>&1 | head -50
\`\`\`

### Step 2: Check for Common Patterns

**Check searchParams usage**:
\`\`\`bash
grep -rn "searchParams\." app/ --include="*.tsx" --include="*.ts" | grep -v "await"
\`\`\`

**Check Server/Client boundaries**:
\`\`\`bash
# Find files without "use client" that might need it
find app/ -name "*.tsx" -exec grep -L "use client" {} \; | head -20
\`\`\`

### Step 3: Check Build Output

**Check terminal where `pnpm dev` is running** for:
- Compilation errors
- Type errors
- Module resolution errors
- Import errors

---

## 📋 Quick Diagnostic Checklist

- [ ] Run error capture script in browser console
- [ ] Check browser DevTools → Console tab for errors
- [ ] Check browser DevTools → Network tab for failed requests
- [ ] Check terminal output (where `pnpm dev` is running)
- [ ] Check TypeScript errors: `npx tsc --noEmit`
- [ ] Check for hydration warnings in console
- [ ] Check Next.js Dev Tools (bottom right corner)

---

## 💡 Next Steps

1. **Run the error capture script** above in your browser console
2. **Share the error output** so I can analyze it
3. **Or describe the errors** you're seeing (error messages, file names, line numbers)

Once I have the actual error details, I can provide specific fixes!

---

**Status**: ⏳ Waiting for error details  
**Next Action**: Run error capture script or share error messages
