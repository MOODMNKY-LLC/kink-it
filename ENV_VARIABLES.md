# KINK IT Environment Variables

This document lists all environment variables required for KINK IT to function properly.

## Already Configured in v0

The following environment variables are already set up through the Supabase integration:

### Supabase Database & Auth
- `SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL for client-side
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)
- `SUPABASE_JWT_SECRET` - JWT secret for token verification

### PostgreSQL Connection
- `POSTGRES_URL` - Full PostgreSQL connection string (pooled)
- `POSTGRES_URL_NON_POOLING` - Direct PostgreSQL connection (non-pooled)
- `POSTGRES_PRISMA_URL` - Prisma-specific connection string
- `POSTGRES_HOST` - Database host
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

## Additional Variables to Configure

### Notion Integration
Add these to your v0 Vars section:

\`\`\`bash
# Notion API Key for CODE MNKY workspace
NOTION_API_KEY=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

# App Ideas Database ID (already created in Notion under KINK IT page)
NOTION_APP_IDEAS_DATABASE_ID=cc491ef5f0a64eac8e05a6ea10dfb735
\`\`\`

### Supabase MCP (Management API) - Optional
For advanced Supabase management features:

\`\`\`bash
# Supabase Personal Access Token
SUPABASE_ACCESS_TOKEN=sbp_ccd894cb49cd5faf2f80a4d479b3749f999e8a4a
\`\`\`

### Development Redirect URL
For local development with Supabase Auth email verification:

\`\`\`bash
# Development redirect URL for email confirmation
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

## Environment Variables Usage

### In Server Components and API Routes
\`\`\`typescript
// Access server-side environment variables
const supabaseUrl = process.env.SUPABASE_URL
const apiKey = process.env.NOTION_API_KEY
\`\`\`

### In Client Components
\`\`\`typescript
// Access public environment variables (must be prefixed with NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
\`\`\`

## Security Notes

1. **Never commit `.env` files** - These contain sensitive credentials
2. **Public keys are safe** - `NEXT_PUBLIC_*` variables are exposed to the browser
3. **Service role key is powerful** - Only use server-side with proper access controls
4. **Notion API key** - Keep server-side only, never expose to client

## Current Status

✅ Supabase integration fully configured with all required environment variables
✅ Database schema deployed with `app_ideas` and `profiles` tables
✅ Row Level Security (RLS) policies active on all public tables
✅ Notion App Ideas database created in your workspace

### Still Need to Configure

⚠️ Add `NOTION_API_KEY` to v0 Vars section to enable Notion sync
⚠️ (Optional) Add `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` for local development

## How to Add Variables in v0

1. Open the in-chat sidebar on the left
2. Click on **Vars** section
3. Click **Add Variable**
4. Enter the variable name and value
5. Click **Save**

The variables will be immediately available to your application without needing to redeploy.
