# Sync Environment Variables to Vercel Production

This document lists all environment variables from `.env.local` that need to be added to Vercel production.

## ✅ Already in Production

These variables are already configured in Vercel production:
- `NOTION_API_KEY` ✅
- `NOTION_APP_IDEAS_DATABASE_ID` ✅
- `DISCORD_BOT_TOKEN` ✅
- `OPENAI_API_KEY` ✅
- `OPENAI_ORG_ID` ✅

## ⚠️ Missing from Production

These variables need to be added to Vercel production:

### Required for Notion OAuth Authentication
```bash
SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID=<value from .env.local>
SUPABASE_AUTH_EXTERNAL_NOTION_SECRET=<value from .env.local>
```

### Required for Onboarding
```bash
NEXT_PUBLIC_NOTION_TEMPLATE_URL=https://www.notion.so/mood-mnky/KINK-IT-User-Template-2dfcd2a6542281bcba14ffa2099160d8
```

### Required for Discord OAuth Integration
```bash
DISCORD_CLIENT_ID=<value from .env.local>
DISCORD_CLIENT_SECRET=<value from .env.local>
```

### Required for Discord Webhooks
```bash
DISCORD_WEBHOOK_URL=<value from .env.local>
```

### Optional: PWA Push Notifications
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<value from .env.local>
VAPID_PRIVATE_KEY=<value from .env.local>
```

## 🚀 How to Add to Vercel Production

### Option 1: Vercel CLI (Recommended)

Run these commands one by one, and paste the values from your `.env.local` file when prompted:

```bash
# Notion OAuth (REQUIRED)
vercel env add SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID production
vercel env add SUPABASE_AUTH_EXTERNAL_NOTION_SECRET production

# Notion Template URL (REQUIRED)
vercel env add NEXT_PUBLIC_NOTION_TEMPLATE_URL production
# Value: https://www.notion.so/mood-mnky/KINK-IT-User-Template-2dfcd2a6542281bcba14ffa2099160d8

# Discord OAuth (REQUIRED)
vercel env add DISCORD_CLIENT_ID production
vercel env add DISCORD_CLIENT_SECRET production

# Discord Webhook (REQUIRED)
vercel env add DISCORD_WEBHOOK_URL production

# PWA Push Notifications (OPTIONAL)
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
```

### Option 2: Vercel Dashboard

1. Go to: https://vercel.com/mood-mnkys-projects/kink-it/settings/environment-variables
2. Click **"Add New"** for each variable
3. Copy the values from your `.env.local` file
4. Select **Production** environment (and optionally Preview/Development)
5. Click **"Save"**

## 📋 Quick Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID` | ✅ Yes | Notion OAuth authentication |
| `SUPABASE_AUTH_EXTERNAL_NOTION_SECRET` | ✅ Yes | Notion OAuth authentication |
| `NEXT_PUBLIC_NOTION_TEMPLATE_URL` | ✅ Yes | Onboarding template URL |
| `DISCORD_CLIENT_ID` | ✅ Yes | Discord OAuth integration |
| `DISCORD_CLIENT_SECRET` | ✅ Yes | Discord OAuth integration |
| `DISCORD_WEBHOOK_URL` | ✅ Yes | Discord webhook notifications |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⚠️ Optional | PWA push notifications |
| `VAPID_PRIVATE_KEY` | ⚠️ Optional | PWA push notifications |

## 🔒 Security Notes

- ✅ All values will be encrypted in Vercel
- ⚠️ Never commit these values to git
- ⚠️ Never expose secrets in client-side code
- ✅ Use `NEXT_PUBLIC_*` prefix only for values that need to be public

## 🧪 Verification

After adding variables, verify they're set:

```bash
vercel env ls production
```

You should see all the variables listed above in the output.

