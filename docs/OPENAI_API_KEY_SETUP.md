# OpenAI API Key Setup - CODE MNKY

**Date:** January 5, 2026  
**Status:** ✅ Local environment configured

---

## 📋 API Key Retrieved from Notion

Successfully retrieved OpenAI API key for CODE MNKY from Notion Credentials database:

- **API Key**: Retrieved from Notion (stored in .env.local)
- **Organization ID**: Retrieved from Notion (stored in .env.local)
- **Description**: MOOD_MNKY
- **Status**: Active

---

## ✅ Local Environment (.env.local)

The OpenAI API key has been added to `.env.local`:

```bash
# ============================================
# OPENAI INTEGRATION
# ============================================
# OpenAI API Key for CODE MNKY (retrieved from Notion Credentials database)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
OPENAI_ORG_ID=YOUR_OPENAI_ORG_ID_HERE
```

---

## 🚀 Production Environment (Vercel)

To add the OpenAI API key to Vercel production environment, run:

```bash
# Add OpenAI API Key
vercel env add OPENAI_API_KEY production

# When prompted, paste the API key from your .env.local file

# Add OpenAI Organization ID (optional but recommended)
vercel env add OPENAI_ORG_ID production

# When prompted, paste the org ID from your .env.local file
```

### Alternative: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/mood-mnkys-projects/kink-it/settings/environment-variables)
2. Click **"Add New"**
3. Add:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: (Get from your .env.local file)
   - **Environment**: Production (and optionally Preview/Development)
4. Click **"Save"**
5. Repeat for `OPENAI_ORG_ID` with value from your .env.local file

---

## 📝 Usage in Code

### Server-Side (API Routes, Server Components)

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Optional
})
```

### Client-Side (if needed)

```typescript
// Note: API keys should generally NOT be exposed to client-side
// Use API routes instead for security
const response = await fetch('/api/openai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: '...' }),
})
```

---

## 🔒 Security Notes

- ✅ API key stored in `.env.local` (gitignored)
- ✅ Will be encrypted in Vercel production
- ⚠️ Never commit API keys to git
- ⚠️ Never expose API keys in client-side code
- ⚠️ Use API routes as a proxy for client-side OpenAI calls

---

## 🧪 Testing

After adding to Vercel, verify it's working:

```bash
# Pull production env vars to verify
vercel env pull .env.production

# Check if OPENAI_API_KEY is present
grep OPENAI_API_KEY .env.production
```

---

## 📚 References

- [OpenAI Node.js SDK Documentation](https://github.com/openai/openai-node)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Notion Credentials Database](https://www.notion.so/95da498bdc724b4190fe67dcd61e23de)

---

**Last Updated:** January 5, 2026  
**Source:** Notion Credentials Database (CODE MNKY)

