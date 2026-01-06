# Notion Calendar Integration

**Date:** February 2, 2025  
**Status:** ✅ Implemented

## Overview

KINK IT now integrates with Notion Calendar, allowing users to open calendar events directly in Notion Calendar using the `cron://` URL scheme. This provides a seamless way to view and manage KINK IT events alongside other calendar events.

## Integration Type

**One-Way Integration (Open Events)**
- Opens KINK IT events in Notion Calendar
- Does not sync events bidirectionally
- Does not create events in Notion Calendar
- Requires Notion Calendar desktop app (macOS/Windows)

## How It Works

### Architecture

1. **Database Schema:**
   - `profiles.google_account_email` - User's Google account email (optional)
   - `calendar_events.ical_uid` - RFC5545 iCalendar UID (auto-generated)

2. **URL Generation:**
   - Uses Notion Calendar's `cron://` URL scheme
   - Format: `cron://accountEmail&iCalUID&startDate=ISO&endDate=ISO&title=Title&ref=kink-it`

3. **User Flow:**
   - User creates calendar event in KINK IT
   - Event gets `ical_uid` generated automatically
   - User clicks "Open in Notion Calendar" button
   - If Google email not set, prompt to enter it
   - Generate `cron://` URL and open it
   - Notion Calendar opens (if installed)

## Implementation Details

### Database Migration

**File:** `supabase/migrations/20260202000002_add_notion_calendar_integration.sql`

**Changes:**
- Adds `google_account_email` column to `profiles` table
- Adds `ical_uid` column to `calendar_events` table
- Creates `generate_ical_uid()` function
- Creates trigger to auto-generate `ical_uid` on event creation
- Backfills existing events with `ical_uid`

### Utility Library

**File:** `lib/notion-calendar.ts`

**Functions:**
- `generateNotionCalendarUrl()` - Generates `cron://` URLs
- `openInNotionCalendar()` - Opens URL in Notion Calendar
- `isNotionCalendarInstalled()` - Checks if app might be installed
- `isValidGoogleEmail()` - Validates email format

### API Routes

**File:** `app/api/profile/google-email/route.ts`
- `GET` - Get user's Google account email
- `PUT` - Update user's Google account email

### UI Components

**File:** `components/calendar/calendar-page-client.tsx`

**Features:**
- "Open in Notion Calendar" button on each event
- Dialog for setting Google account email (if not set)
- Automatic `ical_uid` generation for new events

## Usage

### For Users

1. **Set Up Google Account Email:**
   - Go to Calendar page
   - Click "Open in Notion Calendar" on any event
   - Enter your Google account email when prompted
   - This is a one-time setup

2. **Open Events in Notion Calendar:**
   - Click "Open in Notion Calendar" button on any event
   - Notion Calendar will open (if installed)
   - Event will be displayed in Notion Calendar

### For Developers

**Generate Notion Calendar URL:**
```typescript
import { generateNotionCalendarUrl } from '@/lib/notion-calendar'

const url = generateNotionCalendarUrl({
  accountEmail: '[email protected]',
  iCalUID: '123e4567-e89b-12d3-a456-426614174000@kink-it.app',
  startDate: '2025-02-05T20:30:00.000Z',
  endDate: '2025-02-05T21:00:00.000Z',
  title: 'Scene Planning',
  ref: 'kink-it'
})
```

**Open in Notion Calendar:**
```typescript
import { openInNotionCalendar } from '@/lib/notion-calendar'

await openInNotionCalendar(url)
```

## Requirements

### User Requirements

1. **Notion Calendar Desktop App:**
   - Must be installed on macOS or Windows
   - Available at: https://www.notion.so/calendar

2. **Google Account:**
   - Google account connected to Notion Calendar
   - Email address matching the one set in KINK IT

3. **Browser Support:**
   - Modern browser that supports custom URL schemes
   - Chrome, Firefox, Safari, Edge (all supported)

### Technical Requirements

1. **Database:**
   - Migration `20260202000002_add_notion_calendar_integration.sql` applied
   - `ical_uid` column populated for all events

2. **Environment:**
   - No additional environment variables required
   - Works entirely client-side

## Limitations

### Current Limitations

1. **One-Way Only:**
   - Can only open events in Notion Calendar
   - Cannot sync events from Notion Calendar to KINK IT
   - Cannot create events in Notion Calendar

2. **Desktop Only:**
   - Requires Notion Calendar desktop app
   - Does not work with web version
   - Mobile Notion Calendar not supported

3. **Manual Setup:**
   - Users must manually enter Google account email
   - No OAuth integration for automatic setup

4. **Event Matching:**
   - Events opened via `cron://` may not match existing events in Notion Calendar
   - Notion Calendar may create duplicate events

### Future Enhancements

1. **Google Calendar API Integration:**
   - Full two-way sync with Google Calendar
   - Automatic event creation in Google Calendar
   - Events appear in Notion Calendar automatically

2. **OAuth Integration:**
   - Automatic Google account detection
   - No manual email entry required

3. **Event Deduplication:**
   - Detect existing events in Notion Calendar
   - Update instead of creating duplicates

4. **Web Support:**
   - Support for Notion Calendar web version
   - Alternative integration method for web

## Troubleshooting

### "Open in Notion Calendar" Button Doesn't Work

**Possible Causes:**
1. Notion Calendar not installed
2. Google account email not set
3. Invalid `ical_uid` on event

**Solutions:**
1. Install Notion Calendar desktop app
2. Set Google account email in dialog
3. Refresh page to regenerate `ical_uid`

### Events Don't Appear in Notion Calendar

**Possible Causes:**
1. Wrong Google account email
2. Notion Calendar not connected to Google account
3. Event dates in the past

**Solutions:**
1. Verify Google account email matches Notion Calendar
2. Connect Notion Calendar to Google account
3. Try with future-dated events

### "Failed to open in Notion Calendar" Error

**Possible Causes:**
1. Browser blocking custom URL scheme
2. Notion Calendar not installed
3. Invalid URL format

**Solutions:**
1. Allow browser to open `cron://` URLs
2. Install Notion Calendar
3. Check browser console for errors

## API Reference

### Notion Calendar URL Format

```
cron://accountEmail&iCalUID&startDate=ISO&endDate=ISO&title=Title&ref=app
```

**Parameters:**
- `accountEmail` (required) - Google account email
- `iCalUID` (required) - RFC5545 iCalendar UID
- `startDate` (required) - ISO 8601 date/time
- `endDate` (required) - ISO 8601 date/time
- `title` (optional) - Event title
- `ref` (optional) - App referrer identifier

**Example:**
```
cron://[email protected]&123e4567-e89b-12d3-a456-426614174000@kink-it.app&startDate=2025-02-05T20:30:00.000Z&endDate=2025-02-05T21:00:00.000Z&title=Scene%20Planning&ref=kink-it
```

## Related Documentation

- [Notion Calendar Integrations](https://www.notion.com/help/notion-calendar-integrations) - Official Notion documentation
- [RFC5545 iCalendar Specification](https://datatracker.ietf.org/doc/html/rfc5545) - iCalendar UID format
- [KINK IT Calendar Module](../PRD.md#module-9-calendar--scheduling) - Calendar feature documentation

## Files Modified/Created

- ✅ `supabase/migrations/20260202000002_add_notion_calendar_integration.sql` - Database migration
- ✅ `lib/notion-calendar.ts` - Utility functions
- ✅ `app/api/profile/google-email/route.ts` - API route for Google email
- ✅ `components/calendar/calendar-page-client.tsx` - UI integration
- ✅ `app/api/calendar/route.ts` - Updated to return `ical_uid`
- ✅ `docs/NOTION_CALENDAR_INTEGRATION.md` - This documentation

## Testing

### Manual Testing Steps

1. **Create Calendar Event:**
   - Go to Calendar page
   - Click "Create Event"
   - Fill in event details
   - Submit

2. **Set Google Account Email:**
   - Click "Open in Notion Calendar" on event
   - Enter Google account email in dialog
   - Click "Save"

3. **Open Event:**
   - Click "Open in Notion Calendar" button
   - Verify Notion Calendar opens
   - Verify event appears in Notion Calendar

### Expected Behavior

- ✅ Events get `ical_uid` automatically on creation
- ✅ "Open in Notion Calendar" button appears on events
- ✅ Dialog prompts for Google email if not set
- ✅ `cron://` URL opens Notion Calendar
- ✅ Event appears in Notion Calendar

## Security Considerations

1. **Email Privacy:**
   - Google account email stored in database
   - Only accessible by authenticated user
   - RLS policies prevent unauthorized access

2. **URL Generation:**
   - URLs generated client-side
   - No sensitive data in URLs
   - `ical_uid` is public identifier

3. **Validation:**
   - Email format validation
   - Required fields validation
   - Error handling for invalid inputs

## Next Steps

1. ✅ Migration created and applied
2. ✅ Utility functions implemented
3. ✅ UI integration complete
4. ⏳ Test in production environment
5. ⏳ Gather user feedback
6. ⏳ Consider Google Calendar API for full sync

