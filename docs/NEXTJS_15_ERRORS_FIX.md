# Next.js 15 Errors Fix ✅

## Problems

1. **Event handlers cannot be passed to Client Component props**
   - Server Components (`app/not-found.tsx`, `app/offline/page.tsx`) were passing `onAction` function props to Client Components (`KinkyErrorState`)
   - Next.js 15 doesn't allow passing functions from Server Components to Client Components

2. **`searchParams` should be awaited**
   - `app/onboarding/page.tsx` was accessing `searchParams.step` directly
   - In Next.js 15, `searchParams` is now a Promise and must be awaited before accessing properties

## Solutions

### 1. Fixed Event Handler Error ✅

**Problem**: Server Components passing functions to Client Components

**Solution**: Converted Server Components to Client Components by adding `"use client"` directive:

**Files Fixed:**
- `app/not-found.tsx` - Added `"use client"` at the top
- `app/offline/page.tsx` - Added `"use client"` at the top

**Before:**
\`\`\`typescript
// Server Component (no "use client")
export default function NotFound() {
  return (
    <KinkyErrorState
      onAction={() => window.location.href = "/"} // ❌ Error: Can't pass function
    />
  )
}
\`\`\`

**After:**
\`\`\`typescript
"use client" // ✅ Now a Client Component

export default function NotFound() {
  return (
    <KinkyErrorState
      onAction={() => window.location.href = "/"} // ✅ Works: Client Component can receive functions
    />
  )
}
\`\`\`

### 2. Fixed searchParams Async Error ✅

**Problem**: Accessing `searchParams.step` directly without awaiting

**Solution**: Updated `searchParams` type to `Promise` and awaited it before accessing properties:

**File Fixed:**
- `app/onboarding/page.tsx`

**Before:**
\`\`\`typescript
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { step?: string } // ❌ Wrong type
}) {
  const urlStep = searchParams?.step ? parseInt(searchParams.step, 10) : null // ❌ Error: Must await
}
\`\`\`

**After:**
\`\`\`typescript
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }> // ✅ Correct type: Promise
}) {
  const params = await searchParams // ✅ Await before accessing
  const urlStep = params?.step ? parseInt(params.step, 10) : null
}
\`\`\`

## Next.js 15 Changes

### searchParams is Now Async
In Next.js 15, `searchParams` is a Promise that must be awaited:

\`\`\`typescript
// ❌ Old way (Next.js 14)
const step = searchParams.step

// ✅ New way (Next.js 15)
const params = await searchParams
const step = params.step
\`\`\`

### Function Props in Server Components
Server Components cannot pass functions to Client Components:

\`\`\`typescript
// ❌ Server Component passing function
export default function ServerPage() {
  return <ClientComponent onAction={() => {}} />
}

// ✅ Solution 1: Make page a Client Component
"use client"
export default function ClientPage() {
  return <ClientComponent onAction={() => {}} />
}

// ✅ Solution 2: Use URL-based navigation instead
export default function ServerPage() {
  return <ClientComponent href="/action" /> // Pass URL instead
}
\`\`\`

## Files Modified

- `app/onboarding/page.tsx`:
  - Changed `searchParams` type from object to `Promise<object>`
  - Added `await searchParams` before accessing properties
  - Updated `urlParams` prop to use awaited `params`

- `app/not-found.tsx`:
  - Added `"use client"` directive at the top

- `app/offline/page.tsx`:
  - Added `"use client"` directive at the top

## Testing

After these fixes, the errors should be resolved:
- ✅ No more "Event handlers cannot be passed to Client Component props" error
- ✅ No more "searchParams should be awaited" error
