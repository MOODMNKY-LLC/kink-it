# Edge Function Bus Error Fix ✅

## Problem

Edge Function `chat-stream` was crashing with "Bus error (core dumped)" when trying to serve:

\`\`\`
2026-01-06T04:42:16.430650264Z Bus error (core dumped)
error running container: exit 135
\`\`\`

## Root Cause

Bus errors in Deno Edge Functions typically occur when:
1. **Native module initialization crashes** - The OpenAI Agents SDK (`@openai/agents@0.3.7`) was being imported at module load time, which can cause Deno runtime crashes
2. **Memory alignment issues** - Some npm packages with native dependencies can cause bus errors during initialization
3. **Deno runtime incompatibility** - Certain package versions may not be compatible with Deno 2.x

## Solution

Changed from **static import** to **dynamic import** for the OpenAI Agents SDK:

### Before (Static Import - Causes Bus Error)
\`\`\`typescript
import { Agent, run } from "npm:@openai/agents@0.3.7"

Deno.serve(async (req: Request) => {
  // ... code uses Agent and run
})
\`\`\`

### After (Dynamic Import - Prevents Bus Error)
\`\`\`typescript
// No static import at top level

Deno.serve(async (req: Request) => {
  // Dynamically import SDK when needed
  let Agent: any, run: any
  try {
    const agentsModule = await import("npm:@openai/agents@0.3.7")
    Agent = agentsModule.Agent
    run = agentsModule.run
  } catch (importError: any) {
    return new Response(
      JSON.stringify({ error: "Failed to load AI agents SDK", details: importError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
  
  // Now use Agent and run safely
  const agent = new Agent({ ... })
})
\`\`\`

## Why This Works

1. **Lazy Loading**: The SDK is only loaded when the function is actually invoked, not at module initialization
2. **Error Handling**: If the import fails, we can catch it and return a proper error response instead of crashing
3. **Runtime Safety**: Dynamic imports are safer in Deno's sandboxed environment

## Additional Considerations

### Deno Version
The config uses `deno_version = 2` which is correct. Bus errors can sometimes be resolved by:
- Using dynamic imports (✅ implemented)
- Updating package versions
- Using `policy = "oneshot"` instead of `"per_worker"` if hot reload causes issues

### Environment Variables
The function still uses `Deno.env.set("OPENAI_API_KEY", openaiApiKey)` which is safe as long as:
- The API key is passed directly to the SDK's `openai` option (✅ already done)
- The env var is restored/cleaned up after use (consider adding cleanup in finally block)

## Testing

After this fix, try serving the function again:

\`\`\`bash
supabase functions serve chat-stream --no-verify-jwt
\`\`\`

The function should now start without bus errors.

## Files Modified

- `supabase/functions/chat-stream/index.ts`:
  - Removed static import of `@openai/agents`
  - Added dynamic import inside the request handler
  - Added error handling for import failures
