# Notion OAuth Client ID Setup

**Date**: 2026-01-08  
**Status**: ✅ Ready to Configure

---

## Quick Setup

Add this line to your `.env.local` file:

\`\`\`bash
NEXT_PUBLIC_NOTION_CLIENT_ID=2dfd872b-594c-803e-a575-0037d97447ad
\`\`\`

**That's it!** Restart your development server after adding this.

---

## Why This Is Needed

The Notion OAuth flow requires the client ID to be accessible in client-side code to construct the OAuth authorization URL. The client ID is public by design (it appears in the OAuth URL), so it's safe to expose.

---

## Complete Notion OAuth Configuration

Your `.env.local` should have these Notion OAuth variables:

\`\`\`bash
# Server-side (for Supabase Auth and token exchange)
SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID=2dfd872b-594c-803e-a575-0037d97447ad
SUPABASE_AUTH_EXTERNAL_NOTION_SECRET=<your-secret-here>

# Client-side (for OAuth URL construction)
NEXT_PUBLIC_NOTION_CLIENT_ID=2dfd872b-594c-803e-a575-0037d97447ad
\`\`\`

**Note**: Both client IDs should have the same value. The `NEXT_PUBLIC_` prefix makes it accessible in client-side code.

---

## Vercel Production Setup

Add to Vercel production environment:

\`\`\`bash
vercel env add NEXT_PUBLIC_NOTION_CLIENT_ID production
# Enter: 2dfd872b-594c-803e-a575-0037d97447ad
\`\`\`

Or use the Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_NOTION_CLIENT_ID` with value `2dfd872b-594c-803e-a575-0037d97447ad`
3. Select "Production" (and "Preview" if desired)
4. Save

---

## Verification

After adding the environment variable and restarting your dev server:

1. Open `app/auth/login/page.tsx` in your browser
2. Click "Continue with Notion"
3. You should be redirected to Notion's OAuth consent screen
4. After authorization, you should be redirected back to your app

If you see an error about "Notion OAuth client ID not configured", the environment variable isn't being read. Check:
- ✅ Variable name is exactly `NEXT_PUBLIC_NOTION_CLIENT_ID`
- ✅ No extra spaces or quotes around the value
- ✅ Development server was restarted after adding the variable
- ✅ `.env.local` is in the project root (same directory as `package.json`)

---

## Related Documentation

- `docs/NOTION_AUTH_SESSION_PERSISTENCE_FIX.md` - Complete fix implementation
- `docs/NOTION_AUTH_SESSION_PERSISTENCE_ANALYSIS.md` - Detailed analysis
