# UI Walkthrough & Testing Guide

**Date**: February 3, 2026  
**Purpose**: Step-by-step guide to find and test new features in the UI

---

## 🗺️ Navigation Overview

### Main Entry Points
1. **Dashboard** (`/`) - Main landing page after login
2. **Account Settings** (`/account/settings`) - Submission state management
3. **Tasks Page** (`/tasks`) - For testing task-related features

---

## 📍 Feature Locations in UI

### 1. Dashboard Activity Feed

**Where to Find**:
- Navigate to: **Dashboard** (home page `/`)
- Location: **Right column**, below "Rebels Ranking" widget
- Look for: Card titled **"Recent Activity"**

**Visual Indicators**:
- Card with border
- Title: "Recent Activity"
- Description: "Your and your partner's recent activities"
- List of activities with:
  - User avatars (circular images)
  - User names
  - Activity descriptions (e.g., "completed task", "submitted check-in")
  - Colored badges (green/yellow/red)
  - Timestamps ("2 hours ago", "yesterday")

**How to Test**:

#### Test 1: View Activity Feed
1. Login as **Dominant** user
2. Navigate to Dashboard (`/`)
3. Scroll down to find "Recent Activity" card in right column
4. ✅ **Expected**: See list of activities from you and your partner

#### Test 2: Test Realtime Updates
1. Open **two browser windows**:
   - Window 1: Login as **Submissive**
   - Window 2: Login as **Dominant**
2. In Window 2 (Dominant), navigate to Dashboard
3. In Window 1 (Submissive), complete a task or submit a check-in
4. Watch Window 2 (Dominant's Activity Feed)
5. ✅ **Expected**: New activity appears within 1-2 seconds without page refresh

#### Test 3: Role-Based Filtering
1. Login as **Submissive**
2. Check Activity Feed
3. ✅ **Expected**: Only see your own activities
4. Login as **Dominant**
5. Check Activity Feed
6. ✅ **Expected**: See both your activities AND partner's activities

---

### 2. Pending Tasks Widget (Dominant Only)

**Where to Find**:
- Navigate to: **Dashboard** (`/`)
- Location: **Left column**, in the 2-column grid section
- Look for: Card titled **"Pending Tasks"**
- **Note**: Only visible if you're logged in as **Dominant** or **Switch** (with partner)

**Visual Indicators**:
- Card with border
- Title: "Pending Tasks"
- Description: "Tasks assigned to your partner that need attention"
- List of tasks showing:
  - Task title
  - Priority badge (High/Medium/Low with colors)
  - Due date status:
    - Red background = Overdue
    - Yellow text = Due today
    - Normal = Future date
  - Point value (if available)
  - Arrow button (→) on the right

**How to Test**:

#### Test 1: View Pending Tasks
1. Login as **Dominant** user (must have a partner linked)
2. Navigate to Dashboard (`/`)
3. Look in left column for "Pending Tasks" widget
4. ✅ **Expected**: See list of tasks assigned to your partner that are pending or in progress

#### Test 2: Test Realtime Updates
1. Keep Dashboard open as **Dominant**
2. In another window, login as **Submissive** (partner)
3. As **Submissive**, create a new task assigned to yourself
4. Watch **Dominant's** Pending Tasks Widget
5. ✅ **Expected**: New task appears in widget within 1-2 seconds

#### Test 3: Test Empty State
1. As **Dominant**, if partner has no pending tasks
2. Check widget
3. ✅ **Expected**: See message "No pending tasks" with checkmark icon

#### Test 4: Test Quick Actions
1. Click the arrow button (→) on any task
2. ✅ **Expected**: Navigate to task detail page
3. Click "View All Tasks" link at bottom
4. ✅ **Expected**: Navigate to `/tasks` page with pending filter

---

### 3. Today's Tasks Widget (Submissive Only)

**Where to Find**:
- Navigate to: **Dashboard** (`/`)
- Location: **Left column**, in the 2-column grid section
- Look for: Card titled **"Today's Tasks"**
- **Note**: Only visible if you're logged in as **Submissive** or **Switch**

**Visual Indicators**:
- Card with border
- Title: "Today's Tasks"
- Description: Shows count (e.g., "3 tasks due today or overdue")
- List of tasks showing:
  - Task title
  - Priority badge
  - Due date status
  - Red background highlight for overdue tasks
  - Point value
  - Quick action buttons

**How to Test**:

#### Test 1: View Today's Tasks (Active State)
1. Login as **Submissive** user
2. Ensure your submission state is **"Active"** (check settings)
3. Navigate to Dashboard (`/`)
4. Look in left column for "Today's Tasks" widget
5. ✅ **Expected**: See list of tasks due today or overdue

#### Test 2: Test Paused State Behavior
1. As **Submissive**, navigate to Dashboard
2. Note which tasks are visible
3. Go to **Account Settings** (`/account/settings`)
4. Change submission state to **"Paused"**
5. Return to Dashboard
6. ✅ **Expected**: 
   - Widget shows paused message
   - Pause icon displayed
   - Message: "Tasks are paused"
   - No tasks listed
   - Guidance text about changing state

#### Test 3: Test State Change Recovery
1. As **Submissive**, with state set to **"Paused"**
2. Change state back to **"Active"** in settings
3. Return to Dashboard
4. ✅ **Expected**: Tasks reappear in widget

#### Test 4: Test Realtime Updates
1. Keep Dashboard open as **Submissive**
2. As **Dominant** (in another window), assign a task due today
3. Watch **Submissive's** Today's Tasks Widget
4. ✅ **Expected**: New task appears within 1-2 seconds

---

### 4. Submission State Management

**Where to Find**:
- Navigate to: **Dashboard** (`/`) - **Main location**
- Location: **Above the stats cards**, in the main content area
- Look for: Card titled **"Submission State"** (for Submissives) or **"Partner's Submission State"** (for Dominants)
- **Note**: Also visible on Dashboard page, not in Settings

**Visual Indicators**:
- Card with border
- Title: "Submission State"
- Description: "Declare your current capacity level..."
- Three large buttons:
  - **"Active Submission"** (green) - Full availability
  - **"Low Energy"** (yellow) - Reduced capacity
  - **"Paused Play"** (red) - Suspended expectations
- Current state button is highlighted/selected

**How to Test**:

#### Test 1: View Current State
1. Login as **Submissive** user
2. Navigate to **Dashboard** (`/`)
3. Scroll up to find "Submission State" section (above stats cards)
4. ✅ **Expected**: See three state buttons, current state is highlighted

#### Test 2: Change State (Simple)
1. As **Submissive**, click on a different state button (e.g., "Low Energy")
2. ✅ **Expected**: 
   - Dialog appears
   - Shows state name in title
   - Optional reason input field
   - Cancel and Confirm buttons

#### Test 3: Change State with Reason
1. Click on a state button
2. In dialog, enter reason: "Testing state change"
3. Click "Confirm Change"
4. ✅ **Expected**:
   - Loading toast: "Updating submission state..."
   - Dialog closes
   - Success toast: "Submission state updated: [old] → [new]"
   - Toast shows reason if provided
   - Button updates to show new state

#### Test 4: Paused State Confirmation
1. As **Submissive**, click "Paused Play" button
2. ✅ **Expected**:
   - Dialog shows warning
   - Lists consequences:
     - Disable task assignment
     - Hide pending tasks
     - Suspend D/s expectations
   - Optional reason input
   - Clear confirmation required

#### Test 5: Test Realtime Sync
1. Open **two browser windows**:
   - Window 1: Login as **Submissive**
   - Window 2: Login as **Dominant**
2. In Window 2 (Dominant), navigate to Dashboard
3. In Window 1 (Submissive), change submission state
4. Watch Window 2 (Dominant's Dashboard)
5. ✅ **Expected**: 
   - State change appears in Dominant's view within 1-2 seconds
   - Submission State Display component updates
   - No page refresh needed

#### Test 6: Test State Enforcement - Task Hiding
1. As **Submissive**, ensure you have some pending tasks
2. Navigate to **Tasks Page** (`/tasks`)
3. Note which tasks are visible
4. Return to **Dashboard** (`/`)
5. In Submission State section, change state to **"Paused"**
6. Return to Tasks Page (`/tasks`)
7. ✅ **Expected**: 
   - Pending tasks are hidden
   - Only completed/approved tasks visible
   - Dashboard widget shows paused message

#### Test 7: Test State Enforcement - Task Assignment Blocking
1. As **Submissive**, change state to **"Paused"**
2. As **Dominant**, try to create a new task
3. Assign task to Submissive partner
4. Click "Create Task" or "Save"
5. ✅ **Expected**:
   - Error message appears
   - Message: "Cannot assign tasks when submission is paused"
   - Task is NOT created
   - Check browser console for 403 error

---

## 🧪 Complete Testing Workflow

### Quick Test (5 minutes)
1. Login as **Submissive**
2. Go to Dashboard → Check Today's Tasks Widget
3. Go to Settings → Change submission state → Watch dialog
4. Return to Dashboard → Verify widget updates
5. ✅ All working = Basic functionality confirmed

### Full Test (15 minutes)
1. **Setup**: Create two test accounts (Dominant + Submissive), link as partners
2. **Dashboard Test**: 
   - Check Activity Feed
   - Check role-specific widgets
   - Verify realtime updates
3. **State Management Test**:
   - Change states with reasons
   - Test paused state enforcement
   - Verify realtime sync
4. **Integration Test**:
   - Create tasks as Dominant
   - Verify they appear in Submissive's widget
   - Change Submissive's state to paused
   - Verify tasks disappear
   - Try creating task for paused submissive (should fail)

---

## 🐛 Troubleshooting

### Activity Feed Not Showing
- **Check**: Are you logged in?
- **Check**: Do you have any activities? (Complete a task, submit check-in)
- **Check**: Browser console for errors
- **Fix**: Refresh page, check Realtime connection

### Widgets Not Visible
- **Check**: Are you the correct role? (Dominant sees Pending Tasks, Submissive sees Today's Tasks)
- **Check**: Do you have a partner linked? (Required for some widgets)
- **Check**: Are you on the Dashboard page (`/`)?

### State Changes Not Syncing
- **Check**: Are both windows logged in?
- **Check**: Browser console for Realtime errors
- **Check**: Network connection
- **Fix**: Refresh both windows, check Supabase Realtime status

### Tasks Not Hiding When Paused
- **Check**: Did state actually change? (Check settings page)
- **Check**: Refresh Dashboard page
- **Check**: Browser console for errors
- **Fix**: Manually change state again, verify in database

---

## 📸 Visual Guide

### Dashboard Layout (Dominant View)
\`\`\`
┌─────────────────────────────────────────────────┐
│  Dashboard Header                                │
├─────────────────────────────────────────────────┤
│  [Stats Cards Row]                               │
│  ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │Stat1│ │Stat2│ │Stat3│                        │
│  └─────┘ └─────┘ └─────┘                        │
├─────────────────────────────────────────────────┤
│  [2-Column Grid]                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Pending      │  │ Activity     │            │
│  │ Tasks        │  │ Feed         │            │
│  │ Widget       │  │              │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
\`\`\`

### Dashboard Layout (Submissive View)
\`\`\`
┌─────────────────────────────────────────────────┐
│  Dashboard Header                                │
├─────────────────────────────────────────────────┤
│  [Stats Cards Row]                               │
│  ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │Stat1│ │Stat2│ │Stat3│                        │
│  └─────┘ └─────┘ └─────┘                        │
├─────────────────────────────────────────────────┤
│  [2-Column Grid]                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Today's      │  │ Activity     │            │
│  │ Tasks        │  │ Feed         │            │
│  │ Widget       │  │              │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
\`\`\`

### Dashboard Page - Submission State Section (Submissive View)
\`\`\`
┌─────────────────────────────────────────────────┐
│  Dashboard                                      │
├─────────────────────────────────────────────────┤
│  Submission State                                │
│  Declare your current capacity level...          │
│                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │ ✓ Active     │ │ Low Energy   │ │ Paused   ││
│  │ Submission   │ │              │ │ Play      ││
│  │              │ │              │ │          ││
│  │ Full         │ │ Reduced      │ │ Suspended││
│  │ availability │ │ capacity     │ │          ││
│  └──────────────┘ └──────────────┘ └──────────┘│
├─────────────────────────────────────────────────┤
│  [Stats Cards]                                   │
│  [Widgets Below]                                 │
└─────────────────────────────────────────────────┘
\`\`\`

### Dashboard Page - Partner's Submission State (Dominant View)
\`\`\`
┌─────────────────────────────────────────────────┐
│  Dashboard                                      │
├─────────────────────────────────────────────────┤
│  Partner's Submission State                      │
│                                                  │
│  [Badge showing partner's current state]        │
│  Updated: 2 hours ago                            │
│                                                  │
│  Only your partner can change their state...     │
├─────────────────────────────────────────────────┤
│  [Stats Cards]                                   │
│  [Widgets Below]                                 │
└─────────────────────────────────────────────────┘
\`\`\`

---

## ✅ Success Checklist

After testing, verify:
- [ ] Activity Feed displays on Dashboard
- [ ] Activity Feed updates in real-time
- [ ] Pending Tasks Widget visible for Dominants
- [ ] Today's Tasks Widget visible for Submissives
- [ ] Widgets update in real-time
- [ ] Submission State selector works in Settings
- [ ] State change dialog appears
- [ ] Reason input saves correctly
- [ ] State changes sync in real-time
- [ ] Tasks hide when paused
- [ ] Task assignment blocked when paused
- [ ] No console errors
- [ ] Mobile responsive (test on phone/tablet)

---

**Guide Version**: 1.0  
**Created**: February 3, 2026  
**Status**: Ready for Use
