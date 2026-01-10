# Notion Recovery Integration Example

This document shows how to integrate the data recovery flow into your application.

## Adding to Settings Page

```tsx
// app/account/settings/page.tsx or similar

"use client"

import { useState } from "react"
import { DataRecoveryFlow } from "@/components/notion/data-recovery-flow"
import { Button } from "@/components/ui/button"
import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"
import { AlertCircle } from "lucide-react"

export function SettingsPage() {
  const [showRecovery, setShowRecovery] = useState(false)
  const { scenario, isLoading } = useNotionRecoveryDetection()

  return (
    <div>
      {/* Existing settings content */}
      
      {/* Recovery Section */}
      <section>
        <h2>Data Recovery</h2>
        {scenario?.needsRecovery && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {scenario.reason}. You can recover your data from Notion.
            </AlertDescription>
          </Alert>
        )}
        
        <Button onClick={() => setShowRecovery(true)}>
          Recover Data from Notion
        </Button>
      </section>

      <DataRecoveryFlow 
        open={showRecovery} 
        onOpenChange={setShowRecovery} 
      />
    </div>
  )
}
```

## Adding to Onboarding Flow

```tsx
// components/onboarding/steps/notion-recovery-step.tsx

"use client"

import { DataRecoveryFlow } from "@/components/notion/data-recovery-flow"
import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"

export function NotionRecoveryStep({ onNext }: { onNext: () => void }) {
  const { scenario } = useNotionRecoveryDetection()
  const [showRecovery, setShowRecovery] = useState(false)

  if (!scenario?.needsRecovery) {
    // Skip this step if no recovery needed
    return null
  }

  return (
    <div>
      <h2>Recover Your Data</h2>
      <p>We found data in your Notion workspace that can be recovered.</p>
      
      <Button onClick={() => setShowRecovery(true)}>
        Start Recovery
      </Button>

      <DataRecoveryFlow 
        open={showRecovery} 
        onOpenChange={(open) => {
          setShowRecovery(open)
          if (!open && scenario.needsRecovery === false) {
            // Recovery completed, proceed to next step
            onNext()
          }
        }} 
      />
    </div>
  )
}
```

## Auto-Detection on Login

```tsx
// app/auth/callback/route.ts or middleware

import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"

// After successful authentication, check for recovery needs
export async function handleAuthCallback() {
  // ... existing auth logic ...
  
  // Check recovery after auth
  const { scenario } = useNotionRecoveryDetection()
  
  if (scenario?.needsRecovery) {
    // Store recovery flag in session/localStorage
    // Show recovery prompt on next page load
  }
}
```

## Manual Recovery Trigger

```tsx
// Anywhere in your app

import { DataRecoveryFlow } from "@/components/notion/data-recovery-flow"

function MyComponent() {
  const [showRecovery, setShowRecovery] = useState(false)

  return (
    <>
      <Button onClick={() => setShowRecovery(true)}>
        Recover from Notion
      </Button>
      
      <DataRecoveryFlow 
        open={showRecovery}
        onOpenChange={setShowRecovery}
        initialDatabaseType="tasks" // Optional: pre-select database
      />
    </>
  )
}
```

## Programmatic API Usage

```typescript
// Direct API usage without UI

async function recoverTasks() {
  // Step 1: Retrieve from Notion
  const retrieveResponse = await fetch("/api/notion/retrieve-from-database", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      databaseType: "tasks",
      conflictResolution: "prefer_supabase", // Auto-resolve preferring Supabase
      autoResolve: true,
    }),
  })

  const retrieveResult = await retrieveResponse.json()

  if (retrieveResult.hasConflicts && retrieveResult.conflicts.length > 0) {
    // Step 2: Resolve conflicts manually
    const resolveResponse = await fetch("/api/notion/resolve-conflicts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseType: "tasks",
        conflicts: retrieveResult.conflicts,
        resolutions: retrieveResult.conflicts.map((c: Conflict) => ({
          conflictId: c.id,
          strategy: "prefer_supabase", // Or user choice
        })),
      }),
    })

    const resolveResult = await resolveResponse.json()
    console.log("Resolved:", resolveResult)
  }
}
```

## Testing the Implementation

1. **Test Recovery Detection**:
   ```typescript
   // Create test scenario: Empty Supabase table but Notion database exists
   // Hook should detect needsRecovery = true
   ```

2. **Test Retrieval**:
   ```typescript
   // Call retrieve-from-database API
   // Verify pages are retrieved, matched, conflicts detected
   ```

3. **Test Conflict Resolution**:
   ```typescript
   // Create conflicts manually
   // Test each resolution strategy
   // Verify both Notion and Supabase are updated
   ```

4. **Test UI Flow**:
   ```typescript
   // Open recovery flow
   // Select database
   // Watch progress
   // Resolve conflicts
   // Verify completion
   ```

---

## Best Practices

1. **User Guidance**: Always show clear guidance about Supabase being the source of truth
2. **Progress Feedback**: Show progress during long operations
3. **Error Handling**: Display clear error messages with actionable steps
4. **Confirmation**: For bulk operations, ask for confirmation
5. **Testing**: Test with various database sizes and conflict scenarios

---

## Troubleshooting

### Recovery Not Detected
- Check that `notion_databases` table has entries for user
- Verify Supabase tables are actually empty
- Check sync status for failures

### Retrieval Fails
- Verify Notion API key is valid
- Check rate limits (may need to wait)
- Verify database ID is correct

### Conflicts Not Resolving
- Ensure conflicts are passed to resolve API
- Check that resolution strategies are valid
- Verify user has permissions for both systems
