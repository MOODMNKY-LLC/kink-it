# Notion Calendar Integration - Setup Checklist

**Date:** February 2, 2025  
**Status:** ✅ Code Complete | ⏳ Deployment Pending

## ✅ What We Have Implemented

### 1. Database Schema ✅
- **Migration File:** `supabase/migrations/20260202000002_add_notion_calendar_integration.sql`
- **Changes:**
  - ✅ `profiles.google_account_email` column (optional, user-provided)
  - ✅ `calendar_events.ical_uid` column (auto-generated)
  - ✅ `generate_ical_uid()` function (RFC5545 compliant)
  - ✅ Trigger to auto-generate `ical_uid` on event creation
  - ✅ Backfill script for existing events

### 2. Utility Library ✅
- **File:** `lib/notion-calendar.ts`
- **Functions:**
  - ✅ `generateNotionCalendarUrl()` - Creates `cron://` URLs
  - ✅ `openInNotionCalendar()` - Opens URLs in browser
  - ✅ `isNotionCalendarInstalled()` - Detection helper
  - ✅ `isValidGoogleEmail()` - Email validation

### 3. API Routes ✅
- **File:** `app/api/profile/google-email/route.ts`
  - ✅ `GET` - Retrieve user's Google account email
  - ✅ `PUT` - Update user's Google account email
- **File:** `app/api/calendar/route.ts` (Updated)
  - ✅ Returns `ical_uid` in event responses

### 4. UI Components ✅
- **File:** `components/calendar/calendar-page-client.tsx`
  - ✅ "Open in Notion Calendar" button on each event
  - ✅ Dialog for setting Google account email (one-time setup)
  - ✅ Error handling and user feedback
  - ✅ Automatic `ical_uid` handling

### 5. Documentation ✅
- ✅ `docs/NOTION_CALENDAR_INTEGRATION.md` - Complete guide
- ✅ `docs/NOTION_CALENDAR_INTEGRATION_SUMMARY.md` - Quick reference
- ✅ `docs/NOTION_CALENDAR_SETUP_CHECKLIST.md` - This checklist

---

## ❌ What We DON'T Need

### No Environment Variables Required ✅
- **No API keys needed** - Uses client-side `cron://` URL scheme
- **No OAuth credentials** - Users manually enter Google email
- **No webhooks** - One-way integration (opens events, doesn't sync)
- **No server-side secrets** - Everything works client-side

### No External Services Required ✅
- **No Google Calendar API** - Not used (future enhancement)
- **No Notion API** - Uses `cron://` URL scheme, not Notion API
- **No webhook endpoints** - Not needed for this integration type

---

## ⏳ What's Still Needed

### 1. Database Migration ⏳
**Status:** Migration file created, needs to be applied

**Action Required:**
```bash
# Apply migration to production database
# Via Supabase Dashboard:
# 1. Go to Database > Migrations
# 2. Upload/apply migration: 20260202000002_add_notion_calendar_integration.sql

# OR via Supabase CLI:
supabase db push
```

**What it does:**
- Adds `google_account_email` column to `profiles` table
- Adds `ical_uid` column to `calendar_events` table
- Creates trigger to auto-generate `ical_uid` for new events
- Backfills existing events with `ical_uid`

**Verification:**
```sql
-- Check columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'calendar_events' AND column_name = 'ical_uid';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'google_account_email';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'calendar_events' 
AND trigger_name = 'trigger_set_calendar_event_ical_uid';
```

### 2. User Requirements ⏳
**Status:** Users need to complete setup

**What Users Need:**
1. **Install Notion Calendar Desktop App**
   - Download: https://www.notion.so/calendar
   - macOS or Windows only (web/mobile not supported)
   - Must be installed for `cron://` URLs to work

2. **Connect Google Account to Notion Calendar**
   - Open Notion Calendar app
   - Connect Google account (Settings > Calendar accounts)
   - This allows Notion Calendar to read Google Calendar events

3. **Set Google Account Email in KINK IT** (One-time)
   - Go to Calendar page in KINK IT
   - Click "Open in Notion Calendar" on any event
   - Enter Google account email when prompted
   - Email stored in user profile

---

## 🧪 Testing Checklist

### Pre-Deployment Testing (Local)
- [ ] Migration applies successfully
- [ ] `ical_uid` auto-generates for new events
- [ ] Existing events get `ical_uid` backfilled
- [ ] Google email API routes work (`GET` and `PUT`)
- [ ] Calendar UI shows "Open in Notion Calendar" button
- [ ] Dialog appears when Google email not set
- [ ] `cron://` URL generates correctly

### Post-Deployment Testing (Production)
- [ ] Create new calendar event
- [ ] Verify `ical_uid` is generated automatically
- [ ] Click "Open in Notion Calendar" button
- [ ] Enter Google account email in dialog
- [ ] Verify email saves to database
- [ ] Click "Open in Notion Calendar" again
- [ ] Verify Notion Calendar opens (if installed)
- [ ] Verify event appears in Notion Calendar

### Edge Cases to Test
- [ ] Events without end dates (defaults to 1 hour)
- [ ] All-day events
- [ ] Events with special characters in title
- [ ] Multiple events with same Google account
- [ ] User changes Google email
- [ ] Browser doesn't support `cron://` URLs

---

## 📋 Deployment Steps

### Step 1: Apply Database Migration
```bash
# Option A: Via Supabase Dashboard
1. Go to Supabase Dashboard > Database > Migrations
2. Click "New Migration"
3. Copy contents of: supabase/migrations/20260202000002_add_notion_calendar_integration.sql
4. Paste and apply

# Option B: Via Supabase CLI
cd /path/to/kink-it
supabase db push
```

### Step 2: Verify Migration
```sql
-- Run in Supabase SQL Editor
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'calendar_events')
AND column_name IN ('google_account_email', 'ical_uid');
```

### Step 3: Deploy Code Changes
```bash
# Code changes are already in place:
# - lib/notion-calendar.ts ✅
# - app/api/profile/google-email/route.ts ✅
# - components/calendar/calendar-page-client.tsx ✅
# - app/api/calendar/route.ts ✅

# Just push to production:
git push origin main
# Vercel will auto-deploy
```

### Step 4: Test in Production
1. Create a test calendar event
2. Click "Open in Notion Calendar"
3. Set Google account email
4. Verify Notion Calendar opens

---

## 🔍 What This Integration Does

### Current Capabilities ✅
- **Opens events in Notion Calendar** - Uses `cron://` URL scheme
- **One-way integration** - KINK IT → Notion Calendar (open only)
- **Client-side only** - No server-side API calls needed
- **No authentication required** - Users manually enter Google email

### Limitations ⚠️
- **Desktop app only** - Requires Notion Calendar desktop app
- **No bidirectional sync** - Cannot sync events from Notion Calendar
- **No event creation** - Only opens existing events
- **Manual setup** - Users must enter Google email manually

---

## 🚀 Future Enhancements (Not Implemented)

### Google Calendar API Integration
**Would Enable:**
- Full two-way sync
- Automatic event creation in Google Calendar
- Events appear in Notion Calendar automatically
- OAuth authentication (no manual email entry)

**Would Require:**
- Google OAuth credentials
- Google Calendar API access
- Server-side API routes
- Webhook endpoints for sync

**Status:** Not implemented (future enhancement)

---

## 📝 Summary

### ✅ Ready to Deploy
- All code is complete
- No environment variables needed
- No webhooks needed
- No external API keys needed

### ⏳ Action Required
1. **Apply database migration** to production
2. **Deploy code** (already in repo, just push)
3. **Test** in production environment
4. **Users install** Notion Calendar desktop app
5. **Users set** Google account email (one-time)

### 🎯 Success Criteria
- ✅ Migration applied successfully
- ✅ New events get `ical_uid` automatically
- ✅ "Open in Notion Calendar" button works
- ✅ Users can set Google account email
- ✅ `cron://` URLs open Notion Calendar
- ✅ Events appear in Notion Calendar

---

## 🔗 Related Documentation

- [Notion Calendar Integrations](https://www.notion.com/help/notion-calendar-integrations) - Official docs
- [RFC5545 iCalendar Specification](https://datatracker.ietf.org/doc/html/rfc5545) - iCalendar UID format
- [KINK IT Calendar Module](../PRD.md#module-9-calendar--scheduling) - Feature docs

---

## ❓ FAQ

**Q: Do we need any API keys or secrets?**  
A: No. This integration uses client-side `cron://` URLs. No server-side API calls or authentication needed.

**Q: Do we need webhooks?**  
A: No. This is a one-way integration (opens events, doesn't sync). No webhooks needed.

**Q: What if users don't have Notion Calendar installed?**  
A: The `cron://` URL will fail silently or prompt to install. We show an error message to guide users.

**Q: Can we sync events from Notion Calendar to KINK IT?**  
A: Not with current implementation. Would require Google Calendar API integration (future enhancement).

**Q: Do users need to authenticate with Google?**  
A: No. Users manually enter their Google account email. No OAuth required.

