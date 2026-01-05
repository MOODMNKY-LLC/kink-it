# KINK IT - Onboarding Quick Start Guide

**For**: Developers & Testers  
**Status**: Ready for Testing

---

## 🚀 Quick Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Required
NOTION_API_KEY=your_notion_api_key
NEXT_PUBLIC_NOTION_TEMPLATE_URL=https://www.notion.so/2dfcd2a6542281bcba14ffa2099160d8

# Optional (for Discord)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 2. Database Migration

```bash
supabase migration up
```

### 3. Test Onboarding

1. Sign out (if logged in)
2. Sign in with Notion OAuth
3. You'll be redirected to `/onboarding`
4. Complete the 5-step wizard
5. Verify redirect to dashboard

---

## 📋 Template Information

**Template URL**: https://www.notion.so/2dfcd2a6542281bcba14ffa2099160d8  
**Page ID**: `2dfcd2a6-5422-81bc-ba14-ffa2099160d8`

**To Test Template Duplication**:
1. Open template URL
2. Click "Duplicate" in top right
3. Copy the page ID from the duplicated page URL
4. Use that ID in onboarding Step 2

---

## 🔍 Verification Checklist

- [ ] Migration applied successfully
- [ ] Environment variables set
- [ ] Can access `/onboarding` route
- [ ] Role selection works
- [ ] Template verification works
- [ ] Database discovery works
- [ ] Discord install works (if configured)
- [ ] Welcome splash displays
- [ ] Dashboard redirect works

---

## 🐛 Troubleshooting

**Template not found**:
- Check `NOTION_API_KEY` is set correctly
- Verify template URL is accessible
- Check Notion integration has access

**Database discovery fails**:
- Verify parent page ID is correct
- Check databases are nested under parent page
- Verify Notion API permissions

**Discord bot not visible**:
- Check bot was added to server
- Verify server member list
- Check bot permissions

---

**Last Updated**: 2026-01-27


