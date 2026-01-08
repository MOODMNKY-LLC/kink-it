# Vercel Environment Variables Setup Complete ✅

## Status

✅ **NEXT_PUBLIC_SUPABASE_URL** - Updated to production URL:
- Value: `https://rbloeqwxivfzxmfropek.supabase.co`
- Environments: Production, Preview, Development

⏳ **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Needs verification/update:
- Currently exists in Vercel
- May need to be updated with production anon key
- Get from: https://supabase.com/dashboard/project/rbloeqwxivfzxmfropek/settings/api

## What Was Done

1. ✅ Connected to Vercel API using `VERCEL_ACCESS_TOKEN` from `.env.local`
2. ✅ Updated `NEXT_PUBLIC_SUPABASE_URL` to production URL via API
3. ✅ Verified environment variables exist in Vercel
4. ✅ Created helper script: `scripts/set-vercel-env-vars.sh`

## Next Steps

### Option 1: Update via API (Recommended)

Get the production anon key from Supabase Dashboard, then run:

```bash
source .env.local

# Get the env ID
ANON_KEY_ENV_ID=$(curl -s -X GET "https://api.vercel.com/v9/projects/prj_j1cfDo37sJwQctAX6JwG6gErupez/env?teamId=team_4VdnVxvnFkQg6uxXYa1mNpsN" \
  -H "Authorization: Bearer ${VERCEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | python3 -c "import sys, json; data = json.load(sys.stdin); env = next((e for e in data.get('envs', []) if e.get('key') == 'NEXT_PUBLIC_SUPABASE_ANON_KEY'), None); print(env['id'] if env else '')")

# Update it
curl -X PATCH "https://api.vercel.com/v9/projects/prj_j1cfDo37sJwQctAX6JwG6gErupez/env/${ANON_KEY_ENV_ID}?teamId=team_4VdnVxvnFkQg6uxXYa1mNpsN" \
  -H "Authorization: Bearer ${VERCEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "YOUR_PRODUCTION_ANON_KEY_HERE",
    "target": ["production", "preview", "development"]
  }'
```

### Option 2: Use Helper Script

```bash
# Set the production anon key
export PRODUCTION_SUPABASE_ANON_KEY='your-production-anon-key-here'

# Run the script
./scripts/set-vercel-env-vars.sh
```

### Option 3: Vercel Dashboard

1. Go to: https://vercel.com/mood-mnkys-projects/kink-it/settings/environment-variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Update value with production anon key
4. Ensure it's set for Production, Preview, and Development
5. Save

## After Updating

1. **Redeploy** your application:
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger deployment

2. **Verify** the Edge Function connection works:
   - Open your production app
   - Try using the chat feature
   - Check browser console for connection success

## Verification

After redeploying, check browser console for:
```
🔗 Connecting to Edge Function: https://rbloeqwxivfzxmfropek.supabase.co/functions/v1/chat-stream
✅ SSE connection opened successfully
```

## Project Details

- **Project ID**: `prj_j1cfDo37sJwQctAX6JwG6gErupez`
- **Team ID**: `team_4VdnVxvnFkQg6uxXYa1mNpsN`
- **Production URL**: `https://rbloeqwxivfzxmfropek.supabase.co`
- **Vercel API**: `https://api.vercel.com/v9/projects/{projectId}/env`

---

**Date**: 2026-01-08
**Status**: NEXT_PUBLIC_SUPABASE_URL updated ✅ | NEXT_PUBLIC_SUPABASE_ANON_KEY needs verification ⏳
