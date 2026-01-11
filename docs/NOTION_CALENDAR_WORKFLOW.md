# Notion Calendar Integration - Complete User Workflow

**Date:** February 2, 2025  
**Status:** ✅ Complete Workflow Documentation

## Overview

This document explains the complete workflow for users to connect KINK IT calendar events with Notion Calendar, enabling them to view and manage events in both systems.

## Prerequisites

1. **Notion Calendar Desktop App** installed (macOS/Windows)
   - Download from: https://www.notion.so/calendar
   - Must be installed and running

2. **Notion Template Synced**
   - User must have duplicated the KINK IT Notion template
   - Template sync must detect the "Calendar Events" database
   - Database ID stored in `notion_databases` table

3. **Notion API Key Added**
   - User must add their Notion API key in Account Settings
   - Required for syncing events to Notion

4. **Google Account Email** (for cron:// URLs)
   - User must set their Google account email in calendar settings
   - This should match the Google account connected to Notion Calendar

## Complete Workflow

### Step 1: Initial Setup

1. **Duplicate Notion Template**
   - User duplicates the KINK IT Notion template
   - Template includes "Calendar Events" database (#10)

2. **Sync Template in KINK IT**
   - Go to Onboarding → Notion Setup
   - Click "Sync with Notion"
   - System detects Calendar Events database
   - Database ID stored in `notion_databases` table with `database_type = "calendar"`

3. **Add Notion API Key**
   - Go to Account Settings → Notion API Keys
   - Add your Notion API key
   - Key is encrypted and stored securely

4. **Set Google Account Email**
   - Go to Calendar page
   - Click "Open in Notion Calendar" on any event
   - Enter your Google account email when prompted
   - Email stored in `profiles.google_account_email`

### Step 2: Creating Calendar Events

1. **Create Event in KINK IT**
   - Go to Calendar page
   - Click "Create Event"
   - Fill in event details (title, date, type, description)
   - Event is saved to `calendar_events` table
   - `ical_uid` is auto-generated (RFC5545 format: `{event_id}@kink-it.app`)

2. **Sync Event to Notion** (Optional but Recommended)
   - Click "Sync to Notion" button on the event card
   - Event is synced to your Notion Calendar Events database
   - Event appears as a page in Notion with all properties

### Step 3: Connecting Notion Calendar App

According to [Notion Calendar documentation](https://www.notion.com/help/notion-calendar-integrations), Notion Calendar can display events from Notion databases:

1. **Add Calendar Events Database to Notion Calendar**
   - Open Notion Calendar app
   - Go to Settings
   - Under "Notion workspaces", select "Add Notion database"
   - Search for and select your "Calendar Events" database
   - Database events now appear in Notion Calendar

2. **View Events in Notion Calendar**
   - Events synced from KINK IT appear in Notion Calendar
   - Events are displayed alongside other calendar events
   - You can edit events in Notion, and they'll sync back (future enhancement)

### Step 4: Opening Events Directly

1. **Open Specific Event in Notion Calendar**
   - Click "Open in Notion Calendar" button on any event
   - System generates `cron://` URL with event details
   - Notion Calendar app opens to that specific event
   - Works even if event isn't synced to Notion database

## Data Flow Diagram

\`\`\`
┌─────────────────┐
│  KINK IT App    │
│  Calendar Page  │
└────────┬────────┘
         │
         │ User creates event
         ▼
┌─────────────────┐
│ calendar_events │
│   table (DB)    │
│  + ical_uid     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────────┐
│ Sync to Notion  │  │ cron:// URL      │
│   (API Call)    │  │   (Direct Open)  │
└────────┬────────┘  └────────┬──────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│ Notion Calendar │  │ Notion Calendar   │
│ Events Database │  │    Desktop App    │
│   (Notion DB)   │  │  (Opens directly) │
└────────┬────────┘  └──────────────────┘
         │
         │ User adds DB to Notion Calendar
         ▼
┌─────────────────┐
│ Notion Calendar │
│  App (Display)  │
│  Shows events   │
└─────────────────┘
\`\`\`

## Two Integration Methods

### Method 1: Database Sync (Recommended)

**How it works:**
- Events sync from KINK IT → Notion Calendar Events database
- Notion Calendar app reads from the database
- Events appear in Notion Calendar automatically
- Best for viewing all events together

**Steps:**
1. Create event in KINK IT
2. Click "Sync to Notion"
3. Add Calendar Events database to Notion Calendar
4. Events appear in Notion Calendar

**Benefits:**
- All events visible in Notion Calendar
- Can edit events in Notion
- Works with Notion Calendar's database views
- Events persist in Notion

### Method 2: Direct Open (cron:// URLs)

**How it works:**
- Generates `cron://` URL with event details
- Opens Notion Calendar app directly to that event
- Works even if event isn't in Notion database
- Best for quick access to specific events

**Steps:**
1. Create event in KINK IT
2. Click "Open in Notion Calendar"
3. Notion Calendar app opens to that event

**Benefits:**
- Instant access to specific events
- No database sync required
- Works immediately
- Good for one-off events

## Current Implementation Status

### ✅ Implemented

1. **Database Schema**
   - `calendar_events.ical_uid` - Auto-generated RFC5545 UIDs
   - `profiles.google_account_email` - User Google email storage

2. **API Routes**
   - `/api/calendar` - CRUD operations for events
   - `/api/notion/sync-calendar-event` - Sync events to Notion
   - `/api/profile/google-email` - Manage Google email

3. **UI Components**
   - Calendar page with event management
   - "Sync to Notion" button (NEW)
   - "Open in Notion Calendar" button
   - Google email setup dialog

4. **Template Detection**
   - Template sync detects Calendar Events database
   - Stores database ID for syncing

### ⏳ Future Enhancements

1. **Auto-Sync Option**
   - Automatically sync new events to Notion
   - User preference toggle

2. **Bidirectional Sync**
   - Sync changes from Notion back to KINK IT
   - Handle conflicts and updates

3. **Bulk Sync**
   - Sync all existing events at once
   - Background sync job

4. **Sync Status Indicators**
   - Show which events are synced
   - Visual indicators in UI

## Troubleshooting

### "Calendar Events database not found"

**Cause:** Template not synced or database not detected

**Solution:**
1. Go to Account Settings → Notion Integration Status
2. Click "Sync with Notion" to re-sync template
3. Verify Calendar Events database exists in your Notion workspace

### "Notion API key not found"

**Cause:** User hasn't added Notion API key

**Solution:**
1. Go to Account Settings → Notion API Keys
2. Add your Notion API key
3. Verify key is active

### "Failed to open in Notion Calendar"

**Cause:** Notion Calendar app not installed or Google email not set

**Solution:**
1. Install Notion Calendar from https://www.notion.so/calendar
2. Set your Google account email in calendar settings
3. Ensure Notion Calendar is running

### Events not appearing in Notion Calendar

**Cause:** Database not added to Notion Calendar

**Solution:**
1. Open Notion Calendar app
2. Go to Settings → Add Notion database
3. Select your "Calendar Events" database
4. Events should appear within a few seconds

## References

- [Notion Calendar Integrations Documentation](https://www.notion.com/help/notion-calendar-integrations)
- [Notion Calendar API (cron:// URLs)](https://www.notion.com/help/notion-calendar-integrations#notion-calendar-api)
- [Use Notion Calendar with Notion](https://www.notion.com/help/use-notion-calendar-with-notion)

---

**Last Updated:** February 2, 2025
