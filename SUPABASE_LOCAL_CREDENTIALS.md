# Supabase Local Development Credentials

✅ **Supabase is running successfully on custom ports (55xxx range to avoid Windows conflicts)**

## Copy These Values to Your `.env.local`

Open your `.env.local` file and update it with these values:

\`\`\`bash
# ============================================
# SUPABASE CONFIGURATION (LOCAL DEVELOPMENT)
# ============================================

# Supabase Project URL (Local) - USE HTTPS (TLS enabled for Notion OAuth)
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321

# Supabase Anonymous Key (Public - safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Supabase Service Role Key (KEEP SECRET - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# JWT Secret (for token verification)
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# ============================================
# NOTION INTEGRATION (OPTIONAL)
# ============================================

NOTION_API_KEY=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
NOTION_APP_IDEAS_DATABASE_ID=cc491ef5f0a64eac8e05a6ea10dfb735

# ============================================
# DEVELOPMENT (OPTIONAL)
# ============================================

NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# ============================================
# POSTGRESQL CONNECTION (OPTIONAL)
# ============================================

POSTGRES_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres
\`\`\`

## 🔧 Supabase Development Tools

- **Studio (Database UI)**: https://127.0.0.1:55323 (HTTPS - accept self-signed certificate)
- **Mailpit (Email Testing)**: http://127.0.0.1:55324 (HTTP - no TLS needed)
- **REST API**: https://127.0.0.1:55321/rest/v1 (HTTPS)
- **GraphQL API**: https://127.0.0.1:55321/graphql/v1 (HTTPS)

**⚠️ Important**: When accessing HTTPS URLs for the first time, your browser will show a security warning because the certificate is self-signed. Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)" to accept it. This is safe for local development.

## 📝 Important Notes

1. **HTTPS Required**: Supabase is configured with TLS enabled (`api.tls.enabled = true`) for Notion OAuth support. Always use `https://` URLs, not `http://`.

2. **Self-Signed Certificate**: The first time you access Supabase over HTTPS, accept the self-signed certificate warning in your browser. This is normal and safe for local development.

3. **Port Configuration**: All Supabase ports have been moved to the 55xxx range to avoid Windows reserved port conflicts (54308-54407).

4. **Local Development Only**: These credentials are for local development only. They are NOT your production Supabase credentials.

3. **Database Migrations**: You have a `supabase/migrations/` directory. Run migrations with:
   \`\`\`bash
   supabase db push
   \`\`\`

4. **Stopping Supabase**: When you're done developing:
   \`\`\`bash
   supabase stop
   \`\`\`

5. **Restarting Supabase**: Next time you develop:
   \`\`\`bash
   supabase start
   \`\`\`

## ⚠️ Port Changes Made

The following ports were changed from defaults to avoid Windows conflicts:

| Service | Default Port | New Port |
|---------|-------------|----------|
| API | 54321 | 55321 |
| Database | 54322 | 55432 |
| Studio | 54323 | 55323 |
| Inbucket/Mailpit | 54324 | 55324 |
| Analytics | 54327 | 55327 |
| Pooler | 54329 | 55329 |
| Shadow DB | 54320 | 55430 |

## 🚀 Next Steps

1. Copy the environment variables above to your `.env.local`
2. Save the file
3. Run `pnpm dev` to start your Next.js app
4. Your app will connect to the local Supabase instance

---

**Status**: ✅ Supabase Local Development Environment Ready
