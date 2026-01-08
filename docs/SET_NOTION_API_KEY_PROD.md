# Setting NOTION_API_KEY_PROD Secret

## Quick Setup

To set the `NOTION_API_KEY_PROD` secret for the `setup-notion-fdw` Edge Function:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/rbloeqwxivfzxmfropek/settings/functions
2. Click the **"Secrets"** tab
3. Click **"Add new secret"**
4. Enter:
   - **Name**: `NOTION_API_KEY_PROD`
   - **Value**: Your Notion API key (starts with `secret_` or `ntn_`)
5. Click **"Save"**

### Option 2: Via Supabase CLI

```bash
supabase secrets set NOTION_API_KEY_PROD='your-notion-api-key-here' --project-ref rbloeqwxivfzxmfropek
```

Replace `your-notion-api-key-here` with your actual Notion API key.

## Finding Your Notion API Key

Your Notion API key can be found in:
- `.env.local` file (look for `NOTION_API_KEY`)
- Vercel Dashboard → Project Settings → Environment Variables
- Notion Credentials database (if you store it there)

## Verification

After setting the secret, verify it's configured:

```bash
supabase secrets list --project-ref rbloeqwxivfzxmfropek
```

You should see `NOTION_API_KEY_PROD` in the list.

## What This Secret Is Used For

The `NOTION_API_KEY_PROD` secret is used by the `setup-notion-fdw` Edge Function to:
- Set up the Notion Foreign Data Wrapper (FDW)
- Store the API key securely in Supabase Vault
- Enable database-level access to Notion data

## Security Note

- Never commit API keys to git
- Use Supabase Secrets for Edge Functions (not environment variables)
- Rotate keys periodically
- Use different keys for development and production when possible
