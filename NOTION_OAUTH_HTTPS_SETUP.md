# Notion OAuth HTTPS Setup for Local Development

## 🔒 Why HTTPS is Required

Notion OAuth **requires HTTPS** for redirect URIs, even during local development. This is a security requirement that cannot be bypassed.

## ✅ Solution: Enable TLS in Supabase

We've enabled TLS in your Supabase `config.toml`. Supabase will automatically generate self-signed certificates when you restart.

## 🚀 Setup Steps

### Step 1: Restart Supabase

After enabling TLS, restart Supabase to generate certificates:

\`\`\`bash
supabase stop
supabase start
\`\`\`

### Step 2: Accept Self-Signed Certificate

When you first access Supabase over HTTPS, your browser will show a security warning because the certificate is self-signed. This is normal for local development.

**To accept the certificate:**

1. Navigate to: `https://127.0.0.1:55321` (or `https://127.0.0.1:55323` for Studio)
2. Click "Advanced" or "Show Details"
3. Click "Proceed to 127.0.0.1 (unsafe)" or "Accept the Risk and Continue"
4. The certificate will be trusted for this session

### Step 3: Update Environment Variables

Update your `.env.local` to use HTTPS URLs:

\`\`\`bash
# Use HTTPS instead of HTTP
NEXT_PUBLIC_SUPABASE_URL=https://127.0.0.1:55321
\`\`\`

**Important:** Keep the HTTP URLs commented or remove them, but ensure HTTPS is primary.

### Step 4: Configure Notion OAuth Redirect URI

In your Notion OAuth app settings, add this redirect URI:

\`\`\`
https://127.0.0.1:55321/auth/v1/callback
\`\`\`

**Where to configure:**
1. Go to https://www.notion.so/my-integrations
2. Select your KINK IT integration
3. Add to **Redirect URIs**:
   - `https://127.0.0.1:55321/auth/v1/callback` (Local HTTPS)
   - `https://rbloeqwxivfzxmfropek.supabase.co/auth/v1/callback` (Production)

### Step 5: Update Next.js to Use HTTPS (Optional but Recommended)

For a fully HTTPS local development environment, you can configure Next.js to use HTTPS:

**Option A: Use Next.js HTTPS (Recommended)**

Create `next.config.ts` with HTTPS support, or use a tool like `mkcert` to generate trusted local certificates.

**Option B: Use HTTP for Next.js, HTTPS for Supabase**

This is the simpler approach:
- Next.js runs on `http://localhost:3000` (HTTP is fine)
- Supabase runs on `https://127.0.0.1:55321` (HTTPS required)
- Notion redirects to Supabase HTTPS → Supabase redirects to Next.js HTTP

This works because the critical OAuth callback (Notion → Supabase) uses HTTPS.

## 🔍 Verify TLS is Working

After restarting Supabase, check:

\`\`\`bash
supabase status
\`\`\`

You should see HTTPS URLs:
- API: `https://127.0.0.1:55321`
- Studio: `https://127.0.0.1:55323`

## 📝 Updated Callback URLs

### For Notion OAuth Configuration:

**Local Development:**
\`\`\`
https://127.0.0.1:55321/auth/v1/callback
\`\`\`

**Production:**
\`\`\`
https://rbloeqwxivfzxmfropek.supabase.co/auth/v1/callback
\`\`\`

### Flow Explanation:

1. **User clicks "Continue with Notion"** → Redirects to Notion OAuth
2. **Notion authenticates** → Redirects to Supabase HTTPS: `https://127.0.0.1:55321/auth/v1/callback`
3. **Supabase processes OAuth** → Redirects to your app: `http://localhost:3000/auth/callback`
4. **Your app handles session** → User is logged in

## ⚠️ Important Notes

1. **Self-Signed Certificate Warning**: You'll see browser warnings about the certificate. This is expected and safe for local development.

2. **Certificate Trust**: The certificate is only trusted in your browser. Other tools (like curl) may need `--insecure` flag.

3. **Port Consistency**: Make sure you use `127.0.0.1` (not `localhost`) for consistency with Supabase.

4. **Environment Variables**: Update all references from `http://127.0.0.1:55321` to `https://127.0.0.1:55321` in your `.env.local`.

## 🐛 Troubleshooting

### Certificate Errors

If you see certificate errors:
1. Make sure Supabase restarted after enabling TLS
2. Accept the certificate in your browser
3. Check that `[api.tls] enabled = true` in `supabase/config.toml`

### OAuth Still Failing

1. Verify the redirect URI in Notion matches exactly: `https://127.0.0.1:55321/auth/v1/callback`
2. Check that Supabase is accessible at `https://127.0.0.1:55321`
3. Check browser console for any CORS or certificate errors

### Next.js Connection Issues

If Next.js can't connect to Supabase:
1. Make sure you've accepted the certificate in your browser first
2. Update `NEXT_PUBLIC_SUPABASE_URL` to use HTTPS
3. Restart your Next.js dev server

## ✅ Verification Checklist

- [ ] TLS enabled in `supabase/config.toml` (`[api.tls] enabled = true`)
- [ ] Supabase restarted (`supabase stop && supabase start`)
- [ ] Certificate accepted in browser
- [ ] `.env.local` updated with HTTPS URLs
- [ ] Notion OAuth redirect URI configured: `https://127.0.0.1:55321/auth/v1/callback`
- [ ] Next.js dev server restarted
- [ ] OAuth flow tested successfully

---

**Status**: ✅ TLS Configuration Complete  
**Next**: Restart Supabase and configure Notion redirect URI
