# Seed Data App Usage Guide

**Date**: 2026-02-15  
**Purpose**: Comprehensive guide explaining how seed data is displayed and used throughout the KINK IT application  
**Methodology**: Deep Thinking Protocol - Systematic Analysis

---

## Overview

This guide explains how the comprehensive seed data we created appears and functions throughout the KINK IT application. Seed data serves as **real-world examples** that help users understand how to use each module, providing editable templates they can modify or delete as needed.

---

## Navigation Structure

### Sidebar Navigation

The KINK IT app organizes modules into logical groups in the sidebar:

#### **Dashboard Section**
- **Overview** (`/`) - Dashboard with stats, charts, and activity feed
- **KINKY Chat** (`/chat`) - AI chat interface
- **Tasks** (`/tasks`) - Task management
- **Rewards** (`/rewards`) - Rewards and points
- **Achievements** (`/achievements`) - Achievement gallery

#### **Relationship Section**
- **Bonds** (`/bonds`) - Bond management and discovery
- **Rules & Protocols** (`/rules`) - Rules and protocol management
- **Boundaries** (`/boundaries`) - Activity boundaries and compatibility
- **Contract & Consent** (`/contract`) - Relationship contracts
- **Communication** (`/communication`) - Messages and check-ins

#### **Personal Section**
- **Journal** (`/journal`) - Journal entries and reflections
- **Calendar** (`/calendar`) - Calendar events and scheduling
- **Analytics** (`/analytics`) - Progress and statistics

#### **Resources Section**
- **Library** (`/resources`) - Educational resources and bookmarks
- **Guides** (`/guides`) - App documentation
- **Ideas** (`/ideas`) - App ideas and suggestions

---

## How Seed Data Appears in Each Module

### Module 1: Bonds (`/bonds`)

**Page**: `/app/bonds/page.tsx` → `/app/bonds/[id]/page.tsx`

**Seed Data Displayed**:
- **1 Example Bond**: "Simeon & Kevin's Dynamic"
  - Shows bond name, description, type (dyad), status (active)
  - Displays mission statement, symbols, honorifics in metadata
- **2 Bond Members**: Simeon (Dominant) and Kevin (Submissive)
  - Shows roles, permissions, join dates

**How It Appears**:
1. **Bond List View** (`/bonds`):
   - Card showing bond name, type, status badges
   - Member count and role information
   - "View Bond" button linking to bond detail page

2. **Bond Detail Page** (`/bonds/[id]`):
   - **Overview Tab**: Bond details, mission, statistics
   - **Members Tab**: List of bond members with roles
   - **Activity Tab**: Activity feed
   - **Settings Tab**: Bond configuration
   - **Analytics Tab**: Bond statistics

**User Interactions**:
- **View**: All users can view bonds they're members of
- **Edit**: Bond creators/managers can edit bond details
- **Delete**: Bond creators can delete bonds
- **Create**: Users can create new bonds or join existing ones

**Role-Based Differences**:
- **Dominant**: Can manage bond settings, invite members, view all activity
- **Submissive**: Can view bond details, see activity, but limited management access

**Cross-Module References**:
- Bond ID is used throughout other modules (`bond_id` field)
- Rules, boundaries, contracts, journal entries, calendar events all reference the bond

---

### Module 2: Rules & Protocols (`/rules`)

**Page**: `/app/rules/page.tsx` → `components/rules/rules-page-client.tsx`

**Seed Data Displayed**:
- **8 Example Rules**:
  - Morning Greeting Protocol (protocol)
  - Coffee Service Ritual (protocol)
  - Evening Kneeling Ritual (protocol)
  - Permission for Personal Activities (situational)
  - Meal Reporting (situational)
  - Honorific Usage (standing)
  - Transparency Default (standing)
  - Weekly Reflection Task (temporary)

**How It Appears**:
1. **Rules List View**:
   - Cards showing rule title, category badge, description
   - Priority indicators
   - Status badges (active/inactive/archived)
   - Effective dates for temporary rules

2. **Filtering Options**:
   - Filter by category (standing, situational, temporary, protocol)
   - Filter by assigned member (Dominant only)
   - Tabs: Rules, Protocols, Expectations

**User Interactions**:
- **View**: All users can view active rules
- **Edit**: Dominant can edit rules (Edit button on each card)
- **Delete**: Dominant can delete rules (Delete button on each card)
- **Create**: Dominant can create new rules ("Create Rule" button)
- **Notion Sync**: "Add to Notion" button for each rule

**Role-Based Differences**:
- **Dominant**: Full CRUD access, can assign rules to specific members
- **Submissive**: View-only access, sees rules assigned to them

**Cross-Module References**:
- Tasks can reference rules (protocol-linked tasks)
- Rules metadata can include linked task IDs
- Rules appear in Analytics module

**Empty State**:
- Shows helpful message: "No rules created yet. Create your first rule to get started." (Dominant)
- "No active rules at this time." (Submissive)

---

### Module 3: Boundaries (`/boundaries`)

**Page**: `/app/boundaries/page.tsx` → `components/boundaries/boundaries-page-client.tsx`

**Seed Data Displayed**:
- **15 Example Activities** across categories:
  - Impact Play: Hand Spanking (yes), Flogging (maybe), Caning (no)
  - Rope: Basic Rope Bondage (yes), Shibari (yes), Suspension Bondage (hard_no)
  - Sensation: Wax Play (maybe), Ice Play (yes), Blindfolding (yes)
  - Power Exchange: Orgasm Control (yes), Chastity Device (maybe), Forced Orgasms (yes)
  - Roleplay: Pet Play (maybe), Age Play (hard_no), Service Roleplay (yes)

**How It Appears**:
1. **Activity List View**:
   - Cards showing activity name, category badge
   - User rating badge (Yes/Maybe/No/Hard No) with color coding
   - Partner rating badge
   - Experience levels
   - Notes explaining ratings
   - Mutual indicator (if both partners rated same)

2. **Filtering Options**:
   - Filter by category (impact, rope, sensation, power_exchange, roleplay, other)
   - Filter by rating (yes, maybe, no, hard_no)
   - View compatibility (activities both partners rated "yes")

**User Interactions**:
- **View**: All users can view boundaries
- **Edit**: Users can edit their own ratings and notes
- **Delete**: Users can delete boundary entries
- **Create**: Users can add new activities

**Role-Based Differences**:
- **Both Roles**: Can set their own ratings independently
- **Compatibility View**: Shows where both partners have "yes" ratings
- **Mutual Hard Limits**: Clearly marked when both partners have "hard_no"

**Cross-Module References**:
- Boundaries appear in Analytics module (boundary exploration stats)
- Contracts reference boundaries in limits section
- Scene planning can reference compatible activities

**Empty State**:
- Shows message: "No boundaries set yet. Add activities to explore compatibility."

---

### Module 4: Contract & Consent (`/contract`)

**Page**: `/app/contract/page.tsx` → `components/contract/contract-page-client.tsx`

**Seed Data Displayed**:
- **1 Example Covenant**: "Simeon & Kevin's Covenant - Version 1.0"
  - Full covenant text with all sections
  - Safewords (Green/Yellow/Red/Blue)
  - Non-verbal signals
  - Review cadence (Quarterly)
- **2 Signatures**: Both partners signed

**How It Appears**:
1. **Contract List View**:
   - Cards showing contract title, version, status
   - Effective date
   - Signature status for each partner
   - "View Contract" button

2. **Contract Detail View**:
   - Full contract content displayed in formatted text
   - Signature section showing who has signed
   - "Sign Contract" button (if not signed)
   - Version history (if multiple versions exist)

**User Interactions**:
- **View**: All users can view contracts in their bond
- **Create**: Dominant can create new contracts
- **Sign**: Both partners can sign contracts
- **Version**: Create new versions of existing contracts
- **Edit**: Dominant can edit contract content (creates new version)

**Role-Based Differences**:
- **Dominant**: Can create and edit contracts
- **Submissive**: Can view and sign contracts
- **Both**: Signature required for contract to be active

**Cross-Module References**:
- Contracts reference rules, boundaries, safewords
- Contracts appear in Calendar (review dates)
- Contracts can be linked to bond metadata

**Empty State**:
- Shows message: "No contracts created yet. Create your first covenant to establish your dynamic."

---

### Module 5: Communication (`/communication`)

**Page**: `/app/communication/page.tsx` → `components/communication/communication-page-client.tsx`

**Seed Data Displayed**:
- **3 Example Messages**:
  - Praise message from Dominant to Submissive
  - Check-in message from Submissive to Dominant
  - Alignment message from Dominant
- **4 Example Check-Ins**:
  - Recent check-ins showing Green/Yellow pattern
  - Notes explaining status
  - Dates showing frequency
- **7 Conversation Prompts** (in database, may be used in chat):
  - Check-in prompts (emotional, needs)
  - Reflection prompts (growth, protocols)
  - Growth prompts (evolution)
  - Scene debrief prompts (feedback, aftercare)
- **1 Scene Debrief** (in database, may be accessed via forms):
  - Complete debrief form with scene details
  - Activities, duration, emotional state
  - Aftercare received and needed

**How It Appears**:
1. **Messages Tab**:
   - Chat-style interface with message bubbles
   - Grouped by date (Today, Yesterday, specific dates)
   - Read/unread indicators
   - Message input at bottom
   - Shows sender name and timestamp

2. **Check-Ins Tab**:
   - Check-in form at top (Green/Yellow/Red buttons)
   - Check-in history below
   - Color-coded status indicators
   - Notes displayed with each check-in
   - Date stamps

**User Interactions**:
- **View**: All users can view messages and check-ins
- **Send**: Users can send messages to partner
- **Check-In**: Users can submit daily check-ins
- **Mark Read**: Users can mark messages as read
- **Delete**: Users can delete their own messages

**Role-Based Differences**:
- **Both Roles**: Equal access to messaging
- **Check-Ins**: Typically Submissive submits, Dominant views
- **Messages**: Both can initiate conversations

**Cross-Module References**:
- Check-ins appear in Activity Feed on dashboard
- Check-ins can trigger task adjustments (Low-Energy mode)
- Messages can reference tasks, rules, or other modules
- Scene debriefs link to calendar events

**Empty State**:
- Messages: "No messages yet. Start a conversation with your partner."
- Check-Ins: Shows check-in form, no history message if empty

**Note**: Conversation prompts and scene debriefs exist in seed data but may be accessed through:
- Chat interface (prompts as suggestions)
- Scene debrief forms (when implemented)
- Check-in forms (prompts as guidance)

---

### Module 6: Tasks (`/tasks`)

**Page**: `/app/tasks/page.tsx` → `components/tasks/tasks-page-client.tsx`

**Seed Data Displayed**:
- **8 Example Tasks**:
  - Morning Greeting (completed, routine)
  - Coffee Service (completed, routine)
  - Weekly Reflection (pending, one-time)
  - Evening Kneeling Ritual (completed, protocol-linked)
  - Basic Self-Care Check-In (completed, low-energy mode)
  - Exercise Routine (completed, with proof)
  - Read Assigned Chapter (in_progress)
  - Meal Planning (pending)
- **3 Task Proof Examples**:
  - Text proof for morning greeting
  - Text proof for coffee service
  - Photo proof for exercise routine

**How It Appears**:
1. **Task List View**:
   - Cards showing task title, description, priority badge
   - Status indicators (pending, in_progress, completed, approved)
   - Due date with urgency indicators
   - Point value displayed
   - Proof requirement indicator
   - Action buttons based on status and role

2. **Task Card Details**:
   - Full task description
   - Assigned by/to information
   - Completion and approval timestamps
   - Proof submission (if required)
   - Reassign option (Dominant only)

**User Interactions**:
- **View**: All users can view tasks assigned to them
- **Start**: Submissive can start pending tasks
- **Complete**: Submissive can mark tasks complete
- **Submit Proof**: Submissive can upload proof (photo/text)
- **Approve**: Dominant can approve completed tasks
- **Create**: Dominant can create new tasks
- **Edit**: Dominant can edit tasks
- **Delete/Cancel**: Dominant can cancel tasks
- **Reassign**: Dominant can reassign tasks to different members

**Role-Based Differences**:
- **Dominant**: 
  - Sees tasks assigned to partner (pending tasks widget on dashboard)
  - Can create, edit, approve, cancel tasks
  - Can reassign tasks
- **Submissive**:
  - Sees tasks assigned to them (today's tasks widget on dashboard)
  - Can start, complete, submit proof
  - Cannot create or approve tasks

**Cross-Module References**:
- Tasks reference rules (protocol-linked tasks)
- Tasks appear in Calendar (task deadlines)
- Tasks generate points (appear in Rewards)
- Tasks unlock achievements
- Tasks appear in Analytics (completion rates)
- Tasks appear in Activity Feed

**Empty State**:
- Dominant: "No tasks assigned yet. Create your first task to get started."
- Submissive: "No tasks assigned. Your Dominant will assign tasks when ready."

**Dashboard Integration**:
- **Pending Tasks Widget** (Dominant): Shows partner's pending/in_progress tasks
- **Today's Tasks Widget** (Submissive): Shows tasks due today or overdue
- **Activity Feed**: Shows completed tasks and approvals

---

### Module 7: Rewards (`/rewards`)

**Page**: `/app/rewards/page.tsx` → `components/rewards/rewards-page-client.tsx`

**Seed Data Displayed**:
- **5 Example Rewards**:
  - Excellent Service Recognition (verbal, completed)
  - Task Completion Bonus (points, completed)
  - Extended Quality Time (relational, available)
  - Permission for Special Activity (relational, available)
  - Consistency Milestone (achievement, completed)
- **6 Points Ledger Entries**:
  - Points from task completions
  - Points from rewards
  - Manual points from Dominant

**How It Appears**:
1. **Points Balance Card**:
   - Large display of current points
   - Streak indicator (if active)
   - "POINTS" label

2. **Available Rewards List**:
   - Cards showing reward title, description
   - Reward type badge (verbal, points, relational, achievement)
   - Point cost (if applicable)
   - Love language indicator
   - "Redeem" button (if point-based)
   - Status indicators (available, completed, redeemed)

**User Interactions**:
- **View**: All users can view available rewards
- **Redeem**: Submissive can redeem point-based rewards
- **Create**: Dominant can create new rewards
- **Complete**: Dominant can mark relational rewards as completed
- **View History**: Users can view completed/redeemed rewards

**Role-Based Differences**:
- **Dominant**: 
  - Can create all reward types
  - Can assign verbal and relational rewards
  - Can mark rewards as completed
  - Sees reward history
- **Submissive**:
  - Can view available rewards
  - Can redeem point-based rewards
  - Sees points balance and streak
  - Cannot create rewards

**Cross-Module References**:
- Rewards link to tasks (task completion rewards)
- Rewards generate points ledger entries
- Rewards appear in Analytics (points trends)
- Rewards appear in Activity Feed
- Rewards can unlock achievements

**Empty State**:
- "No rewards available. Your Dominant will create rewards when ready."

**Dashboard Integration**:
- Points balance appears in dashboard stats
- Rewards appear in Activity Feed
- Points trends appear in Analytics

---

### Module 8: Achievements (`/achievements`)

**Page**: `/app/achievements/page.tsx` → `components/achievements/achievements-page-client.tsx`

**Seed Data Displayed**:
- **4 User Achievement Unlocks**:
  - Tasks Completed: 1 (unlocked)
  - Tasks Completed: 10 (unlocked)
  - Task Streak: 7 days (unlocked)
  - Points: 100 (unlocked)

**How It Appears**:
1. **Achievement Gallery**:
   - Grid of achievement cards
   - Unlocked achievements: Full color, checkmark icon
   - Locked achievements: Grayed out, progress indicator
   - Category badges (tasks, points, streaks, etc.)
   - Rarity indicators (common, rare, epic, legendary)

2. **Achievement Card Details**:
   - Achievement icon/emoji
   - Title and description
   - Progress bar (for locked achievements)
   - Unlock date (for unlocked achievements)
   - Category and rarity badges

3. **Filtering Options**:
   - Filter by category
   - Filter by rarity
   - View mode: All, Unlocked, Locked

**User Interactions**:
- **View**: All users can view achievement gallery
- **Click**: Users can click unlocked achievements to see details
- **Refresh**: Users can manually check for new unlocks
- **Filter**: Users can filter by category, rarity, or view mode

**Role-Based Differences**:
- **Submissive**: 
  - Sees their own achievements
  - Can unlock achievements through task completion
  - Achievement progress tracked automatically
- **Dominant**:
  - Can view partner's achievements
  - Achievements celebrate partner's progress
  - Can see achievement statistics

**Cross-Module References**:
- Achievements unlock from task completion
- Achievements unlock from point milestones
- Achievements unlock from streaks
- Achievements appear in Analytics
- Achievements can be linked to rewards

**Empty State**:
- "No achievements unlocked yet. Keep going!"

**Dashboard Integration**:
- Achievement unlocks appear in Activity Feed
- Achievement statistics appear in Analytics
- Recent unlocks highlighted on dashboard

---

### Module 9: Calendar (`/calendar`)

**Page**: `/app/calendar/page.tsx` → `components/calendar/calendar-page-client.tsx`

**Seed Data Displayed**:
- **5 Example Events**:
  - Evening Scene (scene, Friday 8 PM)
  - Weekly Review (ritual, Sunday 7 PM)
  - Weekly Reflection Due (task_deadline, Sunday 9 PM)
  - After-Scene Check-In (check_in, Friday 10 PM)
  - Bond Anniversary (milestone, all-day event)

**How It Appears**:
1. **Calendar View**:
   - Month calendar grid
   - Events marked on dates with color-coded dots
   - Selected date shows events for that day
   - Event type badges (scene, ritual, task_deadline, check_in, milestone)

2. **Event List** (for selected date):
   - Cards showing event title, description
   - Event type badge with color coding
   - Time display (if not all-day)
   - Reminder information
   - Notion sync button (if configured)

3. **Event Creation Dialog**:
   - Form to create new events
   - Event type selector
   - Date/time picker
   - Reminder settings
   - Description field

**User Interactions**:
- **View**: All users can view calendar events
- **Create**: Users can create new events
- **Edit**: Users can edit events they created
- **Delete**: Users can delete events
- **Notion Sync**: Users can sync events to Notion calendar
- **Google Calendar**: Users can export to Google Calendar

**Role-Based Differences**:
- **Both Roles**: Can create and view events
- **Event Types**: Different types serve different purposes
  - Scenes: Planned play sessions
  - Rituals: Regular check-ins or ceremonies
  - Task Deadlines: Task due dates
  - Check-Ins: Scheduled check-in times
  - Milestones: Important dates (anniversaries, etc.)

**Cross-Module References**:
- Calendar events reference tasks (task_deadline type)
- Calendar events reference bonds (all events are bond-scoped)
- Calendar events appear in Analytics (event frequency)
- Calendar events can trigger reminders
- Calendar events link to journal entries (scene logs)

**Empty State**:
- "No events scheduled for this date"

**Dashboard Integration**:
- Upcoming events appear in Activity Feed
- Calendar widget shows today's events
- Event reminders trigger notifications

**KINKY Terminal Integration**:
- Calendar view available in KINKY Terminal popup
- Shows events for current month
- Quick access to event details

---

### Module 10: Journal (`/journal`)

**Page**: `/app/journal/page.tsx` → `components/journal/journal-page-client.tsx`

**Seed Data Displayed**:
- **5 Example Journal Entries**:
  - Reflection on Submission (personal, by Submissive)
  - Weekly Check-In Thoughts (shared, by Submissive)
  - Gratitude: Structure and Care (gratitude, by Submissive)
  - Scene Log: Rope and Impact (scene_log, by Submissive)
  - Thoughts on Leadership (personal, by Dominant)

**How It Appears**:
1. **Journal Entry List**:
   - Cards showing entry title, type badge
   - Creation date
   - Tags displayed as badges
   - Preview of content (truncated)
   - Notion sync button

2. **Entry Type Filtering**:
   - Filter by type: All, Personal, Shared, Gratitude, Scene Log
   - Each type has color-coded badge

3. **Entry Creation Dialog**:
   - Form to create new entries
   - Entry type selector
   - Title and content fields
   - Tag input
   - Privacy settings (for personal entries)

**User Interactions**:
- **View**: All users can view journal entries
- **Create**: Users can create new entries
- **Edit**: Users can edit their own entries
- **Delete**: Users can delete their own entries
- **Filter**: Users can filter by entry type
- **Notion Sync**: Users can sync entries to Notion

**Role-Based Differences**:
- **Transparency Default**: Personal entries are visible to Dominant by default
- **Privacy**: Personal entries can be marked private (requires discussion)
- **Shared Entries**: Explicitly shared with partner
- **Gratitude Entries**: Appreciation and thankfulness
- **Scene Logs**: Post-scene reflections and processing

**Cross-Module References**:
- Journal entries reference bonds (all entries are bond-scoped)
- Scene logs reference calendar events
- Journal entries appear in Analytics (entry frequency, mood trends)
- Journal entries can be linked to check-ins
- Journal entries appear in Activity Feed

**Empty State**:
- "No entries yet. Create your first journal entry to get started."

**Dashboard Integration**:
- Recent journal entries appear in Activity Feed
- Journal statistics appear in Analytics
- Entry frequency tracked

---

### Module 11: Analytics (`/analytics`)

**Page**: `/app/analytics/page.tsx` → `components/analytics/analytics-page-client.tsx`

**Seed Data Displayed**:
- **Calculated from Seed Data** (not direct seed data):
  - Task completion rates (from tasks seed data)
  - Points totals (from points ledger seed data)
  - Active rules count (from rules seed data)
  - Boundary exploration stats (from boundaries seed data)
  - Achievement progress (from user achievements seed data)

**How It Appears**:
1. **Statistics Cards**:
   - Task Completion: Percentage and count
   - Total Points: Points earned
   - Active Rules: Number of active rules
   - Boundaries: Total activities, Yes/Maybe counts

2. **Charts and Trends**:
   - Task completion trends over time
   - Points earned over time
   - Boundary exploration breakdown
   - Achievement progress

3. **Bond Analytics** (if in bond):
   - Bond-level statistics
   - Member activity
   - Dynamic health metrics

**User Interactions**:
- **View**: All users can view analytics
- **Filter**: Users can filter by time period
- **Export**: Users can export analytics data (if implemented)

**Role-Based Differences**:
- **Both Roles**: See their own analytics
- **Dominant**: Can see partner's analytics (if permissions allow)
- **Bond Analytics**: Shows aggregate statistics for bond

**Cross-Module References**:
- Analytics aggregates data from:
  - Tasks (completion rates)
  - Rewards (points earned)
  - Rules (active rules count)
  - Boundaries (exploration stats)
  - Achievements (unlocks)
  - Journal (entry frequency)
  - Calendar (event frequency)
  - Communication (check-in patterns)

**Empty State**:
- Shows "0" values when no data exists
- Encourages users to start using modules to generate analytics

**Dashboard Integration**:
- Key stats appear on dashboard overview
- Charts show trends
- Analytics feed into dashboard widgets

---

### Module 12: Library & Guides (`/resources`)

**Page**: `/app/resources/page.tsx` → `components/resources/resources-page-client.tsx`

**Seed Data Displayed**:
- **7 Example Resources**:
  - How to Build BDSM Protocols (article, education)
  - BDSM Rules, Rituals & Protocols Guide (article, education)
  - BDSM Safety Practices (guide, safety)
  - The New Bottoming Book (book, education)
  - The New Topping Book (book, education)
  - Rope Bondage Safety Basics (video, safety)
  - FetLife Community Forums (forum, community)

**How It Appears**:
1. **Resource List View**:
   - Cards showing resource title, description
   - Resource type badge (article, book, video, guide, forum)
   - Category badge (education, safety, community)
   - Rating stars (1-5)
   - Tags displayed as badges
   - External link button
   - Notes section

2. **Filtering Options**:
   - Filter by category (all, education, safety, community, technique, legal)
   - Filter by type (all, article, book, video, guide, forum)
   - Search by title or description

**User Interactions**:
- **View**: All users can view resources
- **Create**: Users can add new resources
- **Edit**: Users can edit resources they added
- **Delete**: Users can delete resources
- **Rate**: Users can rate resources (1-5 stars)
- **Add Notes**: Users can add personal notes
- **External Link**: Click to open resource URL

**Role-Based Differences**:
- **Both Roles**: Can add and manage resources
- **Dominant**: Often adds resources for Submissive to read
- **Submissive**: Can bookmark resources for reference
- **Shared**: Resources are bond-scoped, visible to all bond members

**Cross-Module References**:
- Resources can be assigned as reading tasks
- Resources appear in Analytics (resource usage)
- Resources can be linked to rules (educational resources)
- Resources can be referenced in journal entries

**Empty State**:
- "No resources added yet. Add your first resource to start building your library."

**Dashboard Integration**:
- Recent resources appear in Activity Feed
- Resource statistics appear in Analytics
- Resources can be featured in dashboard widgets

---

## Data Flow: How Seed Data Reaches the UI

### 1. Database → API → Component Flow

```
Database (Supabase)
    ↓
API Route (/api/[module])
    ↓
Client Component (useEffect + fetch)
    ↓
State Management (useState)
    ↓
UI Rendering (Cards, Lists, Forms)
```

### 2. Real-Time Updates

Many modules use **Supabase Realtime** subscriptions:
- **Tasks**: Real-time updates when tasks are created/completed
- **Messages**: Real-time message delivery
- **Check-Ins**: Real-time check-in submissions
- **Rewards**: Real-time reward creation/redemption

### 3. Role-Based Filtering

**RLS (Row Level Security) Policies** ensure:
- Users only see data they have permission to view
- Dominants see partner data, Submissives see their own data
- Bond members see bond-scoped data
- Cross-module references respect permissions

---

## User Interactions with Seed Data

### Viewing Seed Data

**Automatic Display**:
- Seed data appears automatically when users visit module pages
- No special "seed data mode" - it's just regular data
- Users see seed data mixed with their own data (if any)

**Empty States**:
- If no data exists, modules show helpful empty state messages
- Seed data provides examples so users rarely see empty states initially
- Empty states guide users on how to create their first items

### Editing Seed Data

**Edit Capabilities**:
- **Dominant**: Can edit most seed data (rules, tasks, rewards, contracts)
- **Submissive**: Can edit their own data (boundaries, journal entries, check-ins)
- **Both**: Can edit resources they added

**Edit Process**:
1. Click "Edit" button on card
2. Dialog/form opens with current values
3. Modify fields
4. Save changes
5. UI updates in real-time

**Seed Data as Templates**:
- Users can edit seed data examples to match their dynamic
- Seed data serves as starting points, not fixed examples
- Users encouraged to personalize seed data

### Deleting Seed Data

**Delete Capabilities**:
- **Dominant**: Can delete most seed data
- **Submissive**: Can delete their own entries
- **Both**: Can delete resources they added

**Delete Process**:
1. Click "Delete" button on card
2. Confirmation dialog appears
3. Confirm deletion
4. Item removed from database
5. UI updates immediately

**Safe Deletion**:
- All seed data uses `ON CONFLICT DO NOTHING` in SQL
- Safe to delete - won't break app functionality
- Users can always add new data

### Creating New Data

**Create Capabilities**:
- **Dominant**: Can create rules, tasks, rewards, contracts, calendar events
- **Submissive**: Can create journal entries, check-ins, boundaries, resources
- **Both**: Can create messages, calendar events, resources

**Create Process**:
1. Click "Create" button (usually top-right)
2. Dialog/form opens
3. Fill in required fields
4. Submit form
5. New item appears in list immediately

**Seed Data as Inspiration**:
- Seed data examples show structure and format
- Users can copy patterns from seed data
- Seed data demonstrates best practices

---

## Cross-Module Connections

### How Modules Reference Each Other

**1. Tasks → Rules**:
- Tasks can be linked to rules (protocol-linked tasks)
- Rule metadata can include linked task IDs
- Completing protocol tasks fulfills rule requirements

**2. Tasks → Rewards**:
- Task completion generates points
- Points can be redeemed for rewards
- Rewards can be linked to specific tasks

**3. Tasks → Achievements**:
- Task completion unlocks achievements
- Achievement progress tracked from tasks
- Achievements celebrate task milestones

**4. Calendar → Tasks**:
- Task deadlines appear as calendar events
- Calendar shows task due dates
- Calendar reminders for task deadlines

**5. Calendar → Journal**:
- Scene events link to scene log entries
- Calendar milestones can trigger journal entries
- Journal entries reference calendar dates

**6. Rules → Boundaries**:
- Rules reference boundaries in limits
- Boundaries inform rule creation
- Compatibility affects rule applicability

**7. Contracts → Rules**:
- Contracts reference rules and protocols
- Rules support contract terms
- Contract reviews update rules

**8. Communication → Tasks**:
- Check-ins can trigger task adjustments
- Messages can reference tasks
- Low-energy check-ins reduce task expectations

**9. Analytics → All Modules**:
- Analytics aggregates data from all modules
- Cross-module statistics
- Comprehensive progress tracking

**10. Bonds → All Modules**:
- All modules reference bond_id
- Bond context affects data visibility
- Bond settings influence module behavior

---

## Role-Based Differences Summary

### Dominant View

**Can Create**:
- Rules & Protocols
- Tasks
- Rewards
- Contracts
- Calendar Events
- Resources

**Can Edit**:
- Rules
- Tasks
- Rewards
- Contracts
- Calendar Events
- Resources they added

**Can View**:
- Partner's tasks (pending/completed)
- Partner's check-ins
- Partner's journal entries (transparency default)
- Partner's boundaries
- Partner's achievements
- Bond analytics

**Dashboard Widgets**:
- Pending Tasks Widget (partner's tasks)
- Activity Feed (partner + own activities)
- Bond Analytics

### Submissive View

**Can Create**:
- Journal Entries
- Check-Ins
- Boundaries
- Messages
- Resources

**Can Edit**:
- Their own journal entries
- Their own boundaries
- Their own resources

**Can View**:
- Assigned tasks
- Available rewards
- Their achievements
- Their points balance
- Rules (read-only)
- Contracts (can sign)

**Dashboard Widgets**:
- Today's Tasks Widget (their tasks)
- Activity Feed (their activities)
- Points Balance
- Achievement Progress

---

## Dashboard Overview Integration

### How Seed Data Appears on Dashboard (`/`)

**Dashboard Stats**:
- Task completion rates (from tasks seed data)
- Points earned (from points ledger seed data)
- Active rules count (from rules seed data)
- Rewards available (from rewards seed data)

**Activity Feed**:
- Recent task completions
- Check-ins submitted
- Rewards earned
- Achievement unlocks
- Journal entries created
- Messages sent

**Task Widgets**:
- **Pending Tasks** (Dominant): Shows partner's pending tasks from seed data
- **Today's Tasks** (Submissive): Shows tasks due today from seed data

**Charts**:
- Task completion trends (calculated from tasks seed data)
- Points earned over time (from points ledger seed data)

**Rebels Ranking**:
- Points comparison (from points ledger seed data)
- Streak information (calculated from tasks seed data)

---

## Empty States vs Populated States

### Empty States (No Seed Data)

**What Users See**:
- Helpful message explaining the module
- "Create" button (if user has permission)
- Guidance on how to get started
- Example descriptions

**Example Messages**:
- "No rules created yet. Create your first rule to get started." (Dominant)
- "No active rules at this time." (Submissive)
- "No tasks assigned. Your Dominant will assign tasks when ready." (Submissive)

### Populated States (With Seed Data)

**What Users See**:
- List of example items (cards)
- Filtering options
- Action buttons (Edit, Delete, etc.)
- Real-world examples to learn from

**Benefits**:
- Users immediately understand module purpose
- Examples show structure and format
- Users can edit examples to match their dynamic
- Reduces learning curve

---

## Seed Data as Learning Tools

### How Seed Data Helps Users

**1. Understanding Structure**:
- Seed data shows what each module contains
- Examples demonstrate data format
- Users learn by example

**2. Best Practices**:
- Seed data follows app best practices
- Examples show proper usage
- Users can copy successful patterns

**3. Real-World Context**:
- Seed data based on real D/s dynamics
- Examples reflect actual use cases
- Users see how modules work together

**4. Template Functionality**:
- Users can edit seed data to match their dynamic
- Seed data serves as starting points
- Users don't start from scratch

**5. Exploration**:
- Seed data encourages exploration
- Users can experiment without creating data
- Examples spark ideas

---

## Practical Usage Examples

### Example 1: New User Exploring Rules

**User Journey**:
1. User logs in → Sees dashboard
2. Clicks "Rules & Protocols" in sidebar → Goes to `/rules`
3. Sees 8 example rules displayed as cards
4. Reads "Morning Greeting Protocol" example
5. Understands rule structure and format
6. Clicks "Create Rule" → Creates their own rule based on example
7. Edits example rule to match their dynamic

**Seed Data Value**:
- Shows what rules look like
- Demonstrates different rule categories
- Provides template to copy

### Example 2: Submissive Viewing Tasks

**User Journey**:
1. Submissive logs in → Sees dashboard
2. Sees "Today's Tasks Widget" with example tasks
3. Clicks "Tasks" in sidebar → Goes to `/tasks`
4. Sees 8 example tasks in various states
5. Understands task structure (title, description, priority, proof)
6. Sees completed tasks with proof examples
7. Knows what to expect when assigned tasks

**Seed Data Value**:
- Shows task variety (routine, one-time, protocol-linked)
- Demonstrates proof requirements
- Shows different task statuses
- Provides examples of completed tasks

### Example 3: Dominant Creating Rewards

**User Journey**:
1. Dominant logs in → Sees dashboard
2. Clicks "Rewards" in sidebar → Goes to `/rewards`
3. Sees 5 example rewards (verbal, points, relational, achievement)
4. Understands different reward types
5. Sees points balance from seed data (220 points)
6. Clicks "Create Reward" → Creates reward based on examples
7. Understands love languages from examples

**Seed Data Value**:
- Shows reward variety
- Demonstrates love languages
- Shows point costs
- Provides templates for each reward type

---

## Technical Implementation Details

### API Routes

Each module has corresponding API routes:
- `/api/bonds` - Bond CRUD operations
- `/api/rules` - Rules CRUD operations
- `/api/boundaries` - Boundaries CRUD operations
- `/api/contracts` - Contracts CRUD operations
- `/api/messages` - Messages CRUD operations
- `/api/check-ins` - Check-ins CRUD operations
- `/api/tasks` - Tasks CRUD operations
- `/api/rewards` - Rewards CRUD operations
- `/api/achievements` - Achievements read operations
- `/api/calendar` - Calendar events CRUD operations
- `/api/journal` - Journal entries CRUD operations
- `/api/resources` - Resources CRUD operations

### Client Components

Each module has a client component that:
- Fetches data from API routes
- Manages local state
- Handles user interactions
- Updates UI in real-time
- Respects role-based permissions

### Real-Time Subscriptions

Modules using Supabase Realtime:
- **Tasks**: `postgres_changes` on `tasks` table
- **Messages**: `postgres_changes` on `partner_messages` table
- **Check-Ins**: `postgres_changes` on `check_ins` table
- **Rewards**: `postgres_changes` on `rewards` table

---

## Seed Data Management

### Editing Seed Data

**In-App Editing**:
- Users can edit seed data through UI
- Changes persist to database
- Seed data becomes user's own data

**Database Editing**:
- Seed data stored in `supabase/seed.sql`
- Can be modified and re-seeded
- Uses `ON CONFLICT DO NOTHING` for safety

### Deleting Seed Data

**In-App Deletion**:
- Users can delete seed data through UI
- Deletion is permanent
- No special "seed data" protection

**Re-Seeding**:
- Running `supabase db reset` re-seeds all data
- Users' custom data is lost (development only)
- Seed data restored to original state

### Adding New Seed Data

**Process**:
1. Add new INSERT statements to `supabase/seed.sql`
2. Use unique UUIDs (following UUID range conventions)
3. Ensure foreign key references are valid
4. Run `supabase db reset` to test
5. Verify data appears in UI

---

## Best Practices for Using Seed Data

### For New Users

1. **Explore First**: Browse seed data examples before creating
2. **Learn Structure**: Understand how data is organized
3. **Edit Examples**: Modify seed data to match your dynamic
4. **Delete Unneeded**: Remove examples that don't apply
5. **Create Your Own**: Add new items based on examples

### For Developers

1. **Keep Examples Realistic**: Seed data should reflect real use cases
2. **Show Variety**: Include different types, statuses, categories
3. **Demonstrate Features**: Show all module capabilities
4. **Maintain Consistency**: Follow UUID ranges and naming conventions
5. **Update Regularly**: Keep seed data current with app features

---

## Summary: Seed Data Flow

```
Database (seed.sql)
    ↓
Supabase Migration/Seed Process
    ↓
PostgreSQL Database
    ↓
RLS Policies (filter by role/bond)
    ↓
API Routes (/api/[module])
    ↓
Client Components (fetch + state)
    ↓
UI Display (Cards, Lists, Forms)
    ↓
User Interactions (View, Edit, Delete, Create)
    ↓
Database Updates (via API)
    ↓
Real-Time UI Updates (via Supabase Realtime)
```

---

## Key Takeaways

1. **Seed Data is Regular Data**: No special "seed data mode" - it's just data in the database
2. **Automatic Display**: Seed data appears automatically when users visit module pages
3. **Editable & Deletable**: Users can modify or remove seed data examples
4. **Role-Based Views**: Different users see different data based on their role
5. **Cross-Module Integration**: Modules reference each other, creating a cohesive experience
6. **Learning Tool**: Seed data helps users understand app structure and best practices
7. **Real-World Examples**: Seed data reflects actual D/s dynamic usage patterns

---

**This guide provides a comprehensive understanding of how seed data is displayed and used throughout the KINK IT application, helping both users and developers understand the app's structure and functionality.**
