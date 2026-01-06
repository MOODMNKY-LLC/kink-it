# Edge Function Secrets Setup ✅

## Problem

Edge Function was reporting "OpenAI API key not configured" even though the environment variable exists.

## Root Cause

Supabase Edge Functions require secrets to be explicitly configured in `supabase/config.toml` under the `[edge_runtime.secrets]` section. Simply having an environment variable in your shell isn't enough - Supabase needs to be told to pass it to the Edge Function runtime.

## Solution

### 1. Configure Secrets in `supabase/config.toml` ✅

Added the `[edge_runtime.secrets]` section:

```toml
[edge_runtime.secrets]
# OpenAI API key for image generation (DALL-E 3)
openai_api_key = "env(OPENAI_API_KEY)"
```

### 2. Updated Project ID ✅

Changed `project_id` from `"kink-it"` to `"KINK-IT"` in `supabase/config.toml`.

## How It Works

- `env(OPENAI_API_KEY)` tells Supabase to read the `OPENAI_API_KEY` environment variable from your system
- Supabase then makes this available to Edge Functions via `Deno.env.get("OPENAI_API_KEY")`
- The secret name (`openai_api_key`) doesn't need to match the environment variable name - it's just a label

## Required Environment Variables

Before running `supabase start`, ensure these are set:

```bash
export OPENAI_API_KEY="sk-..."
```

Or in your `.env.local` file (if using a script to load it):

```bash
OPENAI_API_KEY=sk-...
```

## Auto-Provided Secrets

Supabase automatically provides these to Edge Functions (no configuration needed):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## After Making Changes

**Important**: After updating `supabase/config.toml`, you must restart your Supabase local instance:

```bash
supabase stop
supabase start
```

This ensures the secrets are loaded and available to Edge Functions.

## Verification

To verify secrets are loaded, check the Edge Function logs. You should see:
- "OpenAI API key found" (instead of "OpenAI API key not configured")

## Files Modified

- `supabase/config.toml`:
  - Changed `project_id` from `"kink-it"` to `"KINK-IT"`
  - Added `[edge_runtime.secrets]` section with `openai_api_key` configuration



