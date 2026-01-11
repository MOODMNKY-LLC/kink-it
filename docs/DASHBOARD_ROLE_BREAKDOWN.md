# Comprehensive Dashboard Role Breakdown

**Date**: 2026-02-15  
**Purpose**: Detailed explanation of what submissive users see vs dominant/admin users in the KINK IT dashboard

---

## Executive Summary

**Key Finding**: Submissive users do NOT see administrator or dominant dashboard content. They see a **personalized, role-filtered dashboard** that shows only their own data, tasks, progress, and activities. The dashboard is **completely personalized** based on the user's `dynamic_role`.

---

## 1. Sidebar Navigation (`components/dashboard/sidebar/index.tsx`)

### All Regular Users See the Same Navigation

**Navigation Structure** (from `navigation-config.ts`):

#### Dashboard Group
- Overview (`/`)
- KINKY Chat (`/chat`)
- Tasks (`/tasks`)
- Rewards (`/rewards`)
- Achievements (`/achievements`)

#### Relationship Group
- Bonds (`/bonds`)
- Rules & Protocols (`/rules`)
- Boundaries (`/boundaries`)
- Contract & Consent (`/contract`)
- Communication (`/communication`)

#### Personal Group
- Journal (`/journal`)
- Calendar (`/calendar`)
- Analytics (`/analytics`)

#### Resources Group
- Library (`/resources`)
- Guides (`/guides`)
- Ideas (`/ideas`)

#### Kinky's Playground Group
- Creative Studio (`/playground/creative-studio`)
- Discovery Hub (`/playground`)

**Admin Users Get Additional Section**:
- Admin Dashboard (`/admin/dashboard`)
- Bond Management (`/admin/bonds`)
- User Management (`/admin/users`) - locked
- System Analytics (`/admin/analytics`) - locked

**Note**: The sidebar navigation is **identical** for all regular users regardless of role. Role-based filtering happens at the **page content level**, not the navigation level.

---

## 2. Main Dashboard Page (`app/page.tsx`) - Role-Based Content

### 2.1 Role-Specific Hero Sections

#### Dominant Users See:
- **Component**: `RoleDashboardDominant`
- **Hero Card**: Purple-to-pink gradient (`#9E7AFF` to `#FE8BBB`)
- **Title**: "Dominant Dashboard"
- **Message**: "Welcome back, {userName}. Managing {partnerName}" or "Ready to lead?"
- **Quick Actions**:
  - Create Task → `/tasks/create`
  - Manage Rules → `/rules`
  - View Progress → `/analytics`
- **Key Metrics Cards**:
  - Task Management: Shows tasks assigned to partner (pending review, completed today)
  - Submissive Status: Shows partner's active status

#### Submissive Users See:
- **Component**: `RoleDashboardSubmissive`
- **Hero Card**: Pink-to-blue gradient (`#FE8BBB` to `#4FACFE`)
- **Title**: "Submissive Dashboard"
- **Message**: "Welcome back, {userName}. Ready to serve?"
- **Quick Actions**:
  - My Tasks → `/tasks`
  - Rewards → `/rewards`
  - Rules → `/rules` (read-only)
- **Key Metrics Cards**:
  - My Progress: Shows THEIR assigned tasks and completion status
  - Submission State: Shows THEIR current submission state

**Key Difference**: Submissive sees **their own** tasks and progress, NOT partner's data.

---

### 2.2 Role-Based Welcome Messages (`RoleBasedWelcome`)

#### Dominant:
- **Title**: "Overview of your dynamic"
- **Description**: "{partnerName}'s current state and recent activity" or "Monitor your submissive's progress and manage tasks"

#### Submissive:
- **Title**: "Your current state and tasks"
- **Description**: "{partnerName} has assigned you tasks to complete" or "View your assigned tasks and track your progress"

**Key Difference**: Language is personalized - submissive sees "your" (their own), dominant sees "your dynamic" (partner-focused).

---

### 2.3 Submission State Section (`SubmissionStateSection`)

#### Submissive Users:
- **Component**: `SubmissionStateSelector` (interactive)
- **Can Change**: Their own submission state (Active, Low Energy, Paused, etc.)
- **Shows**: Current state with ability to update
- **Real-time**: Updates via Realtime subscription

#### Dominant Users:
- **Component**: `SubmissionStateDisplay` (read-only)
- **Can View**: Partner's submission state
- **Cannot Change**: Partner's state (only partner can change)
- **Shows**: Partner's current state, last updated timestamp, partner name
- **Message**: "Only your partner can change their submission state. This affects task assignment and app behavior. Updates appear in real-time."

**Key Difference**: Submissive controls their own state, dominant views partner's state (read-only).

---

### 2.4 Quick Actions (`QuickActions`)

#### Dominant Quick Actions:
1. **Assign Task** → `/tasks?action=create`
2. **Create Rule** → `/rules?action=create`
3. **Review Completions** → `/tasks?status=completed`

#### Submissive Quick Actions:
1. **View Tasks** → `/tasks?status=pending`
2. **Available Rewards** → `/rewards`

**Key Difference**: Dominant actions are management-focused (create, assign, review), submissive actions are task-focused (view, complete).

---

### 2.5 Role-Based Task Widgets

#### Dominant Users See:
- **Widget**: `PendingTasksWidget`
- **Shows**: Tasks assigned to **partner** (not themselves)
- **Filter**: `assigned_to = partner_id` AND `status IN ['pending', 'in_progress']`
- **Sorted By**: Due date (urgent first), then priority
- **Description**: "Tasks assigned to your partner that need attention"
- **Real-time**: Subscribes to partner's task updates
- **Empty State**: "No pending tasks" or "Link a partner to see their pending tasks"

#### Submissive Users See:
- **Widget**: `TodaysTasksWidget`
- **Shows**: Tasks assigned to **themselves** (not partner)
- **Filter**: `assigned_to = user_id` AND `status IN ['pending', 'in_progress']` AND `due_date <= today OR due_date IS NULL`
- **Sorted By**: Priority, then due date
- **Description**: "Tasks due today or overdue ({count} tasks)"
- **Real-time**: Subscribes to their own task updates AND submission state changes
- **Special Behavior**: Hides tasks when submission state is "paused"
- **Empty State**: "No tasks due today" or "Tasks are paused" (if paused)

**Key Difference**: 
- Dominant sees **partner's** pending tasks (to monitor/review)
- Submissive sees **their own** tasks due today (to complete)

---

### 2.6 Dashboard Statistics (`getDashboardStats`)

#### How Stats Are Calculated:

**For Submissive Users**:
- **Target User**: `userId` (themselves)
- **Tasks Counted**: Tasks where `assigned_to = userId`
- **Points Balance**: Their own points balance
- **Streak**: Their own completion streak
- **Stats Show**: Their personal progress and achievements

**For Dominant Users**:
- **Target User**: `partnerId || userId` (partner if exists, otherwise themselves)
- **Tasks Counted**: Tasks where `assigned_to = partnerId` (partner's tasks)
- **Points Balance**: Partner's points balance
- **Streak**: Partner's completion streak
- **Stats Show**: Partner's progress (to monitor)

**Key Difference**: 
- Submissive stats = **their own** data
- Dominant stats = **partner's** data (for monitoring)

---

### 2.7 Activity Feed (`ActivityFeed`)

#### Submissive Users See:
- **User IDs Filtered**: `[userId]` (only themselves)
- **Activities Shown**:
  - Their own completed tasks
  - Their own check-ins
  - Their own rewards earned
  - Their own submission state changes
  - Messages they sent/received
- **Real-time**: Subscribes to their own activity updates

#### Dominant Users See:
- **User IDs Filtered**: `[userId, partnerId]` (themselves + partner)
- **Activities Shown**:
  - Partner's completed tasks
  - Partner's check-ins
  - Partner's rewards earned
  - Partner's submission state changes
  - Their own management actions (task assignments, rule creation)
  - Messages between them and partner
- **Real-time**: Subscribes to both their own and partner's activity updates

**Key Difference**:
- Submissive sees **only their own** activities
- Dominant sees **combined** activities (partner + their own management actions)

---

### 2.8 Dashboard Charts (`DashboardChart`)

#### Task Completion Trends:

**For Submissive**:
- **Data Source**: Tasks where `assigned_to = userId`
- **Shows**: Their own task completion trends over time
- **Purpose**: Track personal progress

**For Dominant**:
- **Data Source**: Tasks where `assigned_to = partnerId`
- **Shows**: Partner's task completion trends over time
- **Purpose**: Monitor partner's progress

**Key Difference**: Charts show different user's data based on role.

---

### 2.9 Rebels Ranking (`RebelsRanking`)

**For Submissive**:
- **Shows**: Their own ranking vs partner (if partner exists)
- **Data**: Their points, streak, completion rate

**For Dominant**:
- **Shows**: Partner's ranking vs themselves
- **Data**: Partner's points, streak, completion rate

**Key Difference**: Ranking perspective is flipped based on role.

---

## 3. Page-Level Role Filtering

### 3.1 Tasks Page (`/tasks`)

#### Submissive Users See:
- **Tasks Filtered**: `assigned_to = userId` (only tasks assigned to them)
- **Can Do**:
  - View assigned tasks
  - Start tasks (`status: pending → in_progress`)
  - Complete tasks (`status: in_progress → completed`)
  - Upload proof (if required)
  - View task details
- **Cannot Do**:
  - Create tasks
  - Edit tasks
  - Delete tasks
  - Assign tasks to others
  - Approve tasks

#### Dominant Users See:
- **Tasks Filtered**: `assigned_to = partnerId` OR `assigned_by = userId` (tasks they assigned or partner's tasks)
- **Can Do**:
  - View all tasks in bond
  - Create tasks
  - Edit tasks
  - Delete tasks
  - Assign tasks to partner
  - Approve completed tasks
  - Review task completions
- **Cannot Do**:
  - Complete tasks assigned to them (if any)
  - Change task status to completed (only approve)

**Key Difference**: Submissive sees **their assigned tasks**, dominant sees **tasks they manage**.

---

### 3.2 Rules Page (`/rules`)

#### Submissive Users See:
- **View**: All rules in bond (read-only)
- **Cannot**: Create, edit, or delete rules
- **Purpose**: Reference and understand expectations

#### Dominant Users See:
- **View**: All rules in bond
- **Can**: Create, edit, delete rules
- **Purpose**: Manage bond rules and protocols

**Key Difference**: Submissive = read-only, Dominant = full management.

---

### 3.3 Rewards Page (`/rewards`)

#### Submissive Users See:
- **Rewards Filtered**: `assigned_to = userId` OR `assigned_to IS NULL` (their rewards + available rewards)
- **Can Do**:
  - View available rewards
  - Redeem rewards (if they have enough points)
  - View their reward history
- **Cannot Do**:
  - Create rewards
  - Edit rewards
  - Delete rewards

#### Dominant Users See:
- **Rewards Filtered**: All rewards in bond
- **Can Do**:
  - View all rewards
  - Create rewards
  - Edit rewards
  - Delete rewards
  - Assign rewards to partner
  - View partner's reward redemptions

**Key Difference**: Submissive sees **available rewards to redeem**, dominant sees **all rewards to manage**.

---

### 3.4 Journal Page (`/journal`)

#### Submissive Users See:
- **Entries Filtered**: `created_by = userId` (their own entries)
- **Can Do**:
  - Create journal entries
  - Edit their own entries
  - Delete their own entries
  - View their own entries
- **Sharing**: Can choose to share with partner (if journal sharing enabled in bond settings)

#### Dominant Users See:
- **Entries Filtered**: 
  - Their own entries (`created_by = userId`)
  - Partner's shared entries (if journal sharing enabled)
- **Can Do**:
  - Create journal entries
  - Edit their own entries
  - Delete their own entries
  - View partner's shared entries (read-only)
- **Cannot Do**:
  - Edit partner's entries
  - Delete partner's entries

**Key Difference**: Submissive sees **only their own** entries, dominant sees **their own + partner's shared** entries.

---

### 3.5 Calendar Page (`/calendar`)

#### Submissive Users See:
- **Events Filtered**: 
  - Events they created (`created_by = userId`)
  - Events assigned to them (`assigned_to = userId`)
- **Can Do**:
  - Create events
  - Edit their own events
  - Delete their own events
  - View assigned events

#### Dominant Users See:
- **Events Filtered**: All events in bond
- **Can Do**:
  - Create events
  - Edit any event
  - Delete any event
  - Assign events to partner
  - View all bond events

**Key Difference**: Submissive sees **their own/assigned** events, dominant sees **all bond** events.

---

### 3.6 Analytics Page (`/analytics`)

#### Submissive Users See:
- **Analytics Calculated From**: Their own data
  - Their task completion rates
  - Their points earned
  - Their streak information
  - Their reward redemptions
  - Their check-in history
- **Purpose**: Track personal progress and growth

#### Dominant Users See:
- **Analytics Calculated From**: Partner's data (to monitor)
  - Partner's task completion rates
  - Partner's points earned
  - Partner's streak information
  - Partner's reward redemptions
  - Partner's check-in history
- **Purpose**: Monitor partner's progress and dynamic health

**Key Difference**: Analytics show different user's data based on role.

---

### 3.7 Communication Page (`/communication`)

#### Both Roles See:
- **Messages Filtered**: Messages between `userId` and `partnerId` (conversation thread)
- **Can Do**:
  - Send messages
  - View message history
  - Mark messages as read
- **Real-time**: Both see messages in real-time

**Key Difference**: Both see the **same conversation thread** - no role-based filtering here.

---

### 3.8 Boundaries Page (`/boundaries`)

#### Submissive Users See:
- **Boundaries Filtered**: All boundaries in bond (read-only)
- **Can Do**:
  - View boundaries
  - Reference boundaries
- **Cannot Do**:
  - Create boundaries
  - Edit boundaries
  - Delete boundaries

#### Dominant Users See:
- **Boundaries Filtered**: All boundaries in bond
- **Can Do**:
  - Create boundaries
  - Edit boundaries
  - Delete boundaries
  - View all boundaries

**Key Difference**: Submissive = read-only reference, Dominant = full management.

---

### 3.9 Contract & Consent Page (`/contract`)

#### Submissive Users See:
- **Contracts Filtered**: All contracts in bond
- **Can Do**:
  - View contracts
  - Sign contracts (if not already signed)
  - View contract history
- **Cannot Do**:
  - Create contracts
  - Edit contracts
  - Delete contracts

#### Dominant Users See:
- **Contracts Filtered**: All contracts in bond
- **Can Do**:
  - Create contracts
  - Edit contracts (if draft)
  - Delete contracts
  - View contract signatures
  - Send contracts for signing

**Key Difference**: Submissive can **sign**, dominant can **create/manage**.

---

## 4. Data Filtering Logic

### 4.1 Task Filtering (`app/api/tasks/route.ts`)

```typescript
// For submissive users
if (userRole === "submissive") {
  query = query.eq("assigned_to", userId) // Only tasks assigned to them
}

// For dominant users
if (userRole === "dominant") {
  query = query.or(`assigned_to.eq.${partnerId},assigned_by.eq.${userId}`)
  // Tasks assigned to partner OR tasks they created
}
```

### 4.2 Stats Calculation (`lib/analytics/get-dashboard-stats.ts`)

```typescript
// Determine which user's tasks to count
const targetUserId = userRole === "submissive" 
  ? userId           // Submissive: their own data
  : partnerId || userId  // Dominant: partner's data (or own if no partner)
```

### 4.3 Activity Feed Filtering (`components/dashboard/activity-feed.tsx`)

```typescript
// Determine which users' activities to show
const targetUserIds = userRole === "dominant" && partnerId 
  ? [userId, partnerId]  // Dominant: both users
  : [userId]             // Submissive: only themselves
```

---

## 5. Real-Time Updates

### Submissive Users Receive Real-Time Updates For:
- Their own tasks (status changes, assignments)
- Their own check-ins
- Their own rewards
- Their own submission state changes
- Messages sent/received
- Their own journal entries
- Their own calendar events

### Dominant Users Receive Real-Time Updates For:
- Partner's tasks (status changes, completions)
- Partner's check-ins
- Partner's rewards
- Partner's submission state changes
- Messages sent/received
- Partner's shared journal entries
- All bond calendar events
- Their own management actions

**Key Difference**: Real-time subscriptions are filtered by role - submissive only gets updates for their own data.

---

## 6. Permissions Summary

### Submissive User Permissions:

**Can Create**:
- Journal entries
- Check-ins
- Boundaries (their own)
- Messages
- Resources
- Calendar events (their own)

**Can Edit**:
- Their own journal entries
- Their own boundaries
- Their own resources
- Their own calendar events
- Their submission state

**Can View** (Read-Only):
- Assigned tasks
- Available rewards
- Their achievements
- Their points balance
- Rules (all bond rules)
- Contracts (can sign)
- Boundaries (all bond boundaries)
- Partner's shared journal entries (if sharing enabled)
- Partner's shared calendar events (if sharing enabled)

**Cannot**:
- Create/edit/delete tasks
- Create/edit/delete rules
- Create/edit/delete rewards (except redeem)
- Approve tasks
- Create/edit/delete contracts
- Access admin features

---

### Dominant User Permissions:

**Can Create**:
- Tasks
- Rules
- Rewards
- Contracts
- Boundaries
- Calendar events
- Journal entries
- Resources

**Can Edit**:
- Any task in bond
- Any rule in bond
- Any reward in bond
- Any contract in bond (if draft)
- Any boundary in bond
- Any calendar event in bond
- Their own journal entries
- Their own resources

**Can View**:
- All tasks in bond
- All rules in bond
- All rewards in bond
- All contracts in bond
- All boundaries in bond
- All calendar events in bond
- Partner's shared journal entries
- Partner's submission state
- Partner's check-ins
- Partner's achievements
- Partner's points balance
- Bond analytics

**Cannot**:
- Change partner's submission state (read-only)
- Edit partner's journal entries (if not shared)
- Complete tasks assigned to partner (only approve)

---

## 7. Visual Differences

### Dashboard Hero Cards:
- **Dominant**: Purple-to-pink gradient (`#9E7AFF` → `#FE8BBB`) with Crown icon
- **Submissive**: Pink-to-blue gradient (`#FE8BBB` → `#4FACFE`) with Heart icon

### Widget Colors:
- **Pending Tasks Widget** (Dominant): Standard card styling
- **Today's Tasks Widget** (Submissive): Red background for overdue tasks, standard for others

### Icons:
- **Dominant**: Crown icon, management-focused icons
- **Submissive**: Heart icon, task-focused icons

---

## 8. Key Takeaways

### ✅ Submissive Users DO NOT See:
- Administrator dashboard content
- Dominant management interfaces
- Partner's private data (unless shared)
- Tasks assigned to others
- Management actions they didn't perform

### ✅ Submissive Users DO See:
- Their own personalized dashboard
- Their own tasks and progress
- Their own submission state (with ability to change)
- Their own activity feed
- Their own statistics and analytics
- Rules and boundaries (read-only reference)
- Available rewards to redeem
- Their own journal entries
- Their own calendar events

### ✅ The Dashboard Is:
- **Role-filtered**: Content changes based on `dynamic_role`
- **Data-scoped**: Shows only relevant data for that role
- **Permission-based**: Actions available match role permissions
- **Real-time**: Updates filtered by role
- **Personalized**: Each user sees their own perspective

---

## 9. Technical Implementation

### Role Detection:
```typescript
profile.dynamic_role // "dominant" | "submissive" | "switch"
```

### Conditional Rendering:
```typescript
{profile.dynamic_role === "dominant" && <DominantComponent />}
{profile.dynamic_role === "submissive" && <SubmissiveComponent />}
```

### Data Filtering:
```typescript
// All queries filter by role
if (userRole === "submissive") {
  query = query.eq("assigned_to", userId)
} else {
  query = query.eq("assigned_to", partnerId)
}
```

---

## 10. Conclusion

**Submissive users see a completely personalized dashboard that shows:**
- Their own tasks, progress, and achievements
- Their own submission state (with control)
- Their own activity feed
- Their own statistics
- Read-only access to rules, boundaries, and contracts
- Ability to complete tasks, redeem rewards, and manage their own personal content

**They do NOT see:**
- Administrator features
- Dominant management interfaces
- Partner's private data (unless explicitly shared)
- Tasks assigned to others
- Management actions

**The dashboard is role-aware and data-scoped**, ensuring each user sees only what's relevant to their role and permissions.
