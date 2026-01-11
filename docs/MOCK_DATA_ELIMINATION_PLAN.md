# Mock Data Elimination Plan - Comprehensive Implementation Strategy

**Date**: 2026-01-05  
**Protocol**: Deep Thinking Analysis  
**Status**: Planning Phase  
**Goal**: Eliminate all mock data and replace with dynamic, database-driven functionality

---

## Executive Summary

This document provides a comprehensive analysis of all mock data usage in the KINK IT application and a detailed, phased plan to replace every instance with real, database-driven functionality. The analysis identified **8 major areas** using mock data across **15+ components**, requiring **3 database tables** to be created and **multiple API routes** to be implemented.

**Key Findings**:
- **8 Components** currently use mock data from `mock.json`
- **1 Component** (Rewards Page) uses hardcoded data
- **4 Chat Components** use mock chat data
- **3 Database Tables** need to be created (points_ledger, rewards, notifications)
- **6 API Routes** need to be created or enhanced
- **Phased Approach**: Quick wins first, then infrastructure, then enhanced features

---

## Complete Inventory of Mock Data Usage

### 1. Dashboard Stats (`app/page.tsx`)

**Current Implementation**:
- Uses `mockData.dashboardStats` array
- Displays 3 stat cards: Tasks Completed, Current Points, Rewards Earned

**Mock Data Structure**:
\`\`\`typescript
{
  label: "TASKS COMPLETED",
  value: "24/28",
  description: "THIS WEEK",
  intent: "positive",
  icon: "gear",
  direction: "up"
}
\`\`\`

**Real Data Sources**:
- **Tasks Completed**: Query `tasks` table (exists ✅)
- **Current Points**: Query `points_ledger` table (doesn't exist ❌)
- **Rewards Earned**: Query `rewards` table (doesn't exist ❌)

**Components Affected**:
- `app/page.tsx` (line 86-97)
- `components/dashboard/stat/index.tsx` (receives props, no changes needed)

---

### 2. Dashboard Chart (`components/dashboard/chart/index.tsx`)

**Current Implementation**:
- Uses `mockData.chartData` with week/month/year data
- Shows "spendings", "sales", "coffee" metrics (not relevant to app)

**Mock Data Structure**:
\`\`\`typescript
{
  week: [{ date: "06/07", spendings: 45, sales: 75, coffee: 30 }],
  month: [...],
  year: [...]
}
\`\`\`

**Real Data Sources**:
- Should show task completion trends, points earned, or submission state changes
- Query `tasks` table for completion trends (exists ✅)
- Query `points_ledger` for points trends (doesn't exist ❌)
- Query `submission_state_logs` for state changes (exists ✅)

**Components Affected**:
- `components/dashboard/chart/index.tsx` (lines 13, 17, 203-209)

---

### 3. Rebels Ranking (`app/page.tsx` → `components/dashboard/rebels-ranking/index.tsx`)

**Current Implementation**:
- Uses `mockData.rebelsRanking` array
- Shows partner profiles with points and streaks

**Mock Data Structure**:
\`\`\`typescript
{
  id: 1,
  name: "KEVIN WIESNER",
  handle: "@KevinW",
  streak: "7 DAY STREAK 🔥",
  points: 385,
  avatar: "/avatars/kevin_wiesner.jpg",
  featured: true,
  subtitle: "Submissive • Exceptional Service"
}
\`\`\`

**Real Data Sources**:
- Query `profiles` table for partner info (exists ✅)
- Calculate points from `points_ledger` (doesn't exist ❌) or `tasks` (temporary)
- Calculate streak from `tasks` table (exists ✅)

**Components Affected**:
- `app/page.tsx` (line 106)
- `components/dashboard/rebels-ranking/index.tsx` (receives props, no changes needed)

---

### 4. Security Status (`app/page.tsx` → `components/dashboard/security-status/index.tsx`)

**Current Implementation**:
- Uses `mockData.securityStatus` array
- Shows: Active Contract, Boundaries Set, Check-Ins

**Mock Data Structure**:
\`\`\`typescript
{
  title: "ACTIVE CONTRACT",
  value: "v2.1",
  status: "[CURRENT]",
  variant: "success"
}
\`\`\`

**Real Data Sources**:
- **Active Contract**: Query `contracts` table (doesn't exist ❌) - Module 6
- **Boundaries Set**: Query `user_activity_ratings` table (doesn't exist ❌) - Module 5
- **Check-Ins**: Query `check_ins` table (doesn't exist ❌) - Module 7

**Components Affected**:
- `app/page.tsx` (line 107)
- `components/dashboard/security-status/index.tsx` (receives props, no changes needed)

**Note**: These are future features from PRD. Can show "Coming Soon" or placeholder until modules are built.

---

### 5. Widget (`app/layout.tsx` → `components/dashboard/widget/index.tsx`)

**Current Implementation**:
- Uses `mockData.widgetData` for location, temperature, timezone
- Date/time already dynamic ✅

**Mock Data Structure**:
\`\`\`typescript
{
  location: "San Francisco, CA",
  timezone: "UTC-7",
  temperature: "22°C",
  weather: "Sunny",
  date: "Saturday, July 13th, 2024",
  dynamicGreeting: "Good morning, Kevin",
  moodStatus: "Green"
}
\`\`\`

**Real Data Sources**:
- **Date/Time**: Already dynamic ✅
- **Location**: User profile preference or external API (optional)
- **Temperature/Weather**: External API (optional) or remove
- **Timezone**: User profile preference
- **Greeting**: Generate from current time + user name
- **Mood Status**: Query `check_ins` table (doesn't exist ❌) or remove

**Components Affected**:
- `app/layout.tsx` (line 101)
- `components/dashboard/widget/index.tsx` (lines 62-66)

---

### 6. Notifications (`app/layout.tsx` → `components/dashboard/notifications/index.tsx`)

**Current Implementation**:
- Uses `mockData.notifications` array
- Also used in `components/dashboard/mobile-header/index.tsx`

**Mock Data Structure**:
\`\`\`typescript
{
  id: "notif-1",
  title: "NEW TASK ASSIGNED",
  message: "Simeon assigned you: 'Morning Check-in'",
  timestamp: "2024-07-13T07:00:00Z",
  type: "info",
  read: false,
  priority: "high"
}
\`\`\`

**Real Data Sources**:
- **Option 1**: Create `notifications` table
- **Option 2**: Generate from events (task assignments, completions, rewards)
- Query `tasks` for task-related notifications (exists ✅)
- Query `rewards` for reward notifications (doesn't exist ❌)

**Components Affected**:
- `app/layout.tsx` (line 102)
- `components/dashboard/mobile-header/index.tsx` (lines 16, 53)
- `components/dashboard/notifications/index.tsx` (receives props, manages state)

---

### 7. Chat Components (Multiple Files)

**Current Implementation**:
- Uses `mockChatData` from `data/chat-mock.ts`
- Multiple components: `chat-preview.tsx`, `chat-expanded.tsx`, `chat-header.tsx`, `use-chat-state.ts`

**Mock Data Structure**:
\`\`\`typescript
{
  currentUser: { id, name, username, avatar, isOnline },
  conversations: [{ id, participants, unreadCount, lastMessage, messages }]
}
\`\`\`

**Real Data Sources**:
- Query `messages` table (doesn't exist ❌) - Module 7: Communication Hub
- Query `profiles` for user info (exists ✅)

**Components Affected**:
- `components/chat/use-chat-state.ts` (line 3)
- `components/chat/chat-preview.tsx` (line 4)
- `components/chat/chat-expanded.tsx` (line 4)
- `components/chat/chat-header.tsx` (line 9)
- `components/chat/index.tsx` (uses hook)

**Note**: This is Module 7 from PRD. Can be disabled or show "Coming Soon" until module is built.

---

### 8. Rewards Page (`app/rewards/page.tsx`)

**Current Implementation**:
- Hardcoded `rewards` array (not from mock.json)
- Hardcoded `currentPoints = 385`
- Hardcoded `currentStreak = 7`

**Hardcoded Data**:
\`\`\`typescript
const rewards = [{ id: 1, name: "Extended Cuddle Session", ... }]
const currentPoints = 385
\`\`\`

**Real Data Sources**:
- Query `rewards` table (doesn't exist ❌)
- Query `points_ledger` for balance (doesn't exist ❌)
- Calculate streak from `tasks` table (exists ✅)

**Components Affected**:
- `app/rewards/page.tsx` (lines 8-47, 47, 83)

---

## Phased Implementation Plan

### Phase 1: Quick Wins (Use Existing Data) ⚡

**Goal**: Replace mock data with calculations from existing `tasks` table

**Components**:
1. **Dashboard Stats - Tasks Completed**
   - Calculate from `tasks` table
   - Count completed vs total for current week
   - No new tables needed ✅

2. **Dashboard Chart - Task Completion Trends**
   - Replace "spendings/sales/coffee" with task completion data
   - Group by date, count completions
   - No new tables needed ✅

3. **Rebels Ranking - Temporary Points Calculation**
   - Calculate points from `tasks.point_value` where `status = 'approved'`
   - Calculate streak from consecutive task completions
   - Use `profiles` for partner info
   - Temporary until `points_ledger` exists

4. **Widget - Dynamic Greeting**
   - Generate greeting from current time + user profile name
   - Remove temperature/weather or make optional
   - Use timezone from user profile or browser

**Estimated Time**: 4-6 hours  
**Dependencies**: None  
**Risk**: Low

---

### Phase 2: Core Infrastructure (Build Missing Tables) 🏗️

**Goal**: Create essential database tables for points, rewards, and notifications

#### 2.1 Create Points Ledger Table

**Migration**: `supabase/migrations/YYYYMMDDHHMMSS_create_points_ledger.sql`

**Schema**:
\`\`\`sql
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL, -- Currently user_id, future multi-partner
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL, -- Can be positive (earned) or negative (spent)
  reason text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('task', 'reward', 'manual', 'redemption')),
  source_id uuid, -- References task_id, reward_id, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX idx_points_ledger_workspace_id ON public.points_ledger(workspace_id);
CREATE INDEX idx_points_ledger_created_at ON public.points_ledger(created_at DESC);
CREATE INDEX idx_points_ledger_source ON public.points_ledger(source_type, source_id);

-- RLS Policies
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points_ledger_select_own_or_partner"
ON public.points_ledger FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT partner_id FROM public.profiles WHERE id = user_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "points_ledger_insert_dominant"
ON public.points_ledger FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
);
\`\`\`

**Functions Needed**:
- `get_points_balance(user_id)` - Calculate current balance
- `get_points_streak(user_id)` - Calculate current streak
- `award_points_for_task(task_id)` - Trigger when task approved

**API Routes**:
- `GET /api/points/balance?user_id=...` - Get current balance
- `GET /api/points/history?user_id=...` - Get points history
- `GET /api/points/streak?user_id=...` - Get current streak

---

#### 2.2 Create Rewards Table

**Migration**: `supabase/migrations/YYYYMMDDHHMMSS_create_rewards.sql`

**Schema**:
\`\`\`sql
CREATE TYPE reward_type AS ENUM ('verbal', 'points', 'relational', 'achievement');

CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  reward_type reward_type NOT NULL,
  title text NOT NULL,
  description text,
  point_value integer DEFAULT 0, -- Points earned (if reward_type = 'points')
  point_cost integer DEFAULT 0, -- Points required to redeem (if applicable)
  love_language text, -- Maps to partner's love languages
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to uuid NOT NULL REFERENCES public.profiles(id),
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'completed', 'in_progress')),
  redeemed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_assigned_to ON public.rewards(assigned_to);
CREATE INDEX idx_rewards_assigned_by ON public.rewards(assigned_by);
CREATE INDEX idx_rewards_status ON public.rewards(status);
CREATE INDEX idx_rewards_workspace_id ON public.rewards(workspace_id);

-- RLS Policies
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_select_own_or_partner"
ON public.rewards FOR SELECT
USING (
  auth.uid() = assigned_to
  OR auth.uid() = assigned_by
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "rewards_insert_dominant"
ON public.rewards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
);
\`\`\`

**API Routes**:
- `GET /api/rewards?user_id=...&status=...` - Get rewards
- `POST /api/rewards` - Create reward (dominant only)
- `PATCH /api/rewards/:id/redeem` - Redeem reward (submissive)
- `PATCH /api/rewards/:id/complete` - Mark reward complete (dominant)

---

#### 2.3 Create Notifications Table (Optional - Event-Based Alternative)

**Option A: Database Table**

**Migration**: `supabase/migrations/YYYYMMDDHHMMSS_create_notifications.sql`

**Schema**:
\`\`\`sql
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  priority notification_priority NOT NULL DEFAULT 'medium',
  read boolean DEFAULT false,
  read_at timestamptz,
  related_type text, -- 'task', 'reward', 'message', etc.
  related_id uuid, -- References related entity
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system"
ON public.notifications FOR INSERT
WITH CHECK (true); -- System-generated notifications
\`\`\`

**Option B: Event-Based (Recommended)**

Generate notifications on-the-fly from events:
- Task assigned → Generate notification
- Task completed → Generate notification
- Reward assigned → Generate notification
- Points earned → Generate notification

**API Routes**:
- `GET /api/notifications?user_id=...&unread_only=true` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/clear-all` - Clear all notifications

**Estimated Time**: 8-12 hours  
**Dependencies**: None  
**Risk**: Medium (requires careful RLS policy design)

---

### Phase 3: Update Components to Use Real Data 🔄

**Goal**: Replace all mock data references with API calls and database queries

#### 3.1 Dashboard Stats Component

**File**: `app/page.tsx`

**Changes**:
\`\`\`typescript
// Remove mock data import
// import mockDataJson from "@/mock.json"

// Add server-side data fetching
const supabase = await createClient()
const { data: tasks } = await supabase
  .from("tasks")
  .select("*")
  .eq("assigned_to", profile.id)
  .gte("created_at", startOfWeek(new Date()).toISOString())

// Calculate stats
const completedTasks = tasks?.filter(t => t.status === 'completed' || t.status === 'approved').length || 0
const totalTasks = tasks?.length || 0

// Fetch points balance
const { data: pointsBalance } = await fetch(`/api/points/balance?user_id=${profile.id}`)

// Fetch rewards count
const { data: rewards } = await supabase
  .from("rewards")
  .select("id")
  .eq("assigned_to", profile.id)
  .eq("status", "completed")

const dashboardStats = [
  {
    label: "TASKS COMPLETED",
    value: `${completedTasks}/${totalTasks}`,
    description: "THIS WEEK",
    intent: "positive" as const,
    icon: GearIcon,
    direction: "up" as const
  },
  {
    label: "CURRENT POINTS",
    value: pointsBalance?.balance.toString() || "0",
    description: "RECOGNITION BALANCE",
    intent: "positive" as const,
    icon: ProcessorIcon,
    tag: pointsBalance?.streak ? `${pointsBalance.streak} DAY STREAK 🔥` : undefined
  },
  {
    label: "REWARDS EARNED",
    value: rewards?.length.toString() || "0",
    description: "MEANINGFUL RECOGNITION",
    intent: "positive" as const,
    icon: BoomIcon,
    direction: "up" as const
  }
]
\`\`\`

**New API Route**: `app/api/points/balance/route.ts`

---

#### 3.2 Dashboard Chart Component

**File**: `components/dashboard/chart/index.tsx`

**Changes**:
- Remove mock data import
- Accept `chartData` as prop from server component
- Server component fetches task completion data grouped by date
- Transform data to chart format

**New Server Component**: `app/api/analytics/task-completion/route.ts`

**Data Transformation**:
\`\`\`typescript
// Group tasks by date, count completions
const weekData = tasks
  .filter(t => isWithinInterval(new Date(t.completed_at), { start: weekStart, end: weekEnd }))
  .reduce((acc, task) => {
    const date = format(new Date(task.completed_at), 'MM/dd')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

// Transform to chart format
const chartData = {
  week: Object.entries(weekData).map(([date, completions]) => ({
    date,
    completions: completions as number,
    points: // Calculate points earned
  }))
}
\`\`\`

---

#### 3.3 Rebels Ranking Component

**File**: `app/page.tsx`

**Changes**:
- Fetch partner profile
- Calculate points from `points_ledger` (or tasks temporarily)
- Calculate streak from task completions
- Transform to `RebelRanking[]` format

**New Helper Function**: `lib/analytics/calculate-streak.ts`

---

#### 3.4 Security Status Component

**File**: `app/page.tsx`

**Changes**:
- **Option 1**: Show "Coming Soon" placeholders until modules are built
- **Option 2**: Query placeholder data (contracts table doesn't exist yet)

**Recommendation**: Show "Coming Soon" with links to future features

---

#### 3.5 Widget Component

**File**: `components/dashboard/widget/index.tsx`

**Changes**:
- Remove `widgetData` prop dependency
- Generate greeting from current time + user name
- Make location/temperature optional or remove
- Use timezone from user profile or browser

---

#### 3.6 Notifications Component

**File**: `app/layout.tsx` and `components/dashboard/notifications/index.tsx`

**Changes**:
- Fetch notifications from API or generate from events
- Use Realtime subscription for new notifications
- Update read status via API

**New Hook**: `hooks/use-notifications.ts`

---

#### 3.7 Rewards Page

**File**: `app/rewards/page.tsx`

**Changes**:
- Convert to Server Component
- Fetch rewards from database
- Fetch points balance from API
- Calculate streak from tasks
- Make rewards interactive (redeem functionality)

**Estimated Time**: 12-16 hours  
**Dependencies**: Phase 2 complete  
**Risk**: Low-Medium

---

### Phase 4: Enhanced Features & Future Modules 🚀

**Goal**: Build remaining PRD modules that components depend on

#### 4.1 Chat System (Module 7: Communication Hub)

**Tables Needed**:
- `messages` table
- `conversations` table (or derive from messages)

**Components**:
- Replace all `mockChatData` references
- Build real-time messaging with Supabase Realtime
- Implement read receipts, typing indicators

**Estimated Time**: 16-20 hours  
**Dependencies**: None  
**Risk**: Medium

---

#### 4.2 Contracts & Consent (Module 6)

**Tables Needed**:
- `contracts` table
- `contract_signatures` table
- `contract_amendments` table

**Components**:
- Update Security Status component
- Build contract management UI

**Estimated Time**: 12-16 hours  
**Dependencies**: None  
**Risk**: Low

---

#### 4.3 Boundaries & Activities (Module 5)

**Tables Needed**:
- `activities` table
- `user_activity_ratings` table
- `activity_categories` table

**Components**:
- Update Security Status component
- Build boundaries exploration UI

**Estimated Time**: 12-16 hours  
**Dependencies**: None  
**Risk**: Low

---

#### 4.4 Check-Ins (Module 7)

**Tables Needed**:
- `check_ins` table

**Components**:
- Update Widget component (mood status)
- Update Security Status component
- Build check-in UI

**Estimated Time**: 8-12 hours  
**Dependencies**: None  
**Risk**: Low

---

## Detailed Component-by-Component Breakdown

### Component 1: Dashboard Stats

**Current File**: `app/page.tsx` (lines 86-97)

**Current Code**:
\`\`\`typescript
{mockData.dashboardStats.map((stat, index) => (
  <DashboardStat
    key={index}
    label={stat.label}
    value={stat.value}
    description={stat.description}
    icon={iconMap[stat.icon as keyof typeof iconMap]}
    tag={stat.tag}
    intent={stat.intent}
    direction={stat.direction}
  />
))}
\`\`\`

**New Implementation**:
\`\`\`typescript
// Server Component - fetch data
const stats = await getDashboardStats(profile.id, profile.partner_id)

// Render
{stats.map((stat, index) => (
  <DashboardStat
    key={index}
    label={stat.label}
    value={stat.value}
    description={stat.description}
    icon={stat.icon}
    tag={stat.tag}
    intent={stat.intent}
    direction={stat.direction}
  />
))}
\`\`\`

**New Function**: `lib/analytics/get-dashboard-stats.ts`

**Database Queries**:
1. Tasks completed this week: `SELECT COUNT(*) FROM tasks WHERE assigned_to = $1 AND status IN ('completed', 'approved') AND created_at >= start_of_week`
2. Points balance: `SELECT SUM(points) FROM points_ledger WHERE user_id = $1`
3. Rewards earned: `SELECT COUNT(*) FROM rewards WHERE assigned_to = $1 AND status = 'completed'`

**API Route**: `app/api/analytics/dashboard-stats/route.ts`

---

### Component 2: Dashboard Chart

**Current File**: `components/dashboard/chart/index.tsx`

**Current Code**:
\`\`\`typescript
import mockDataJson from "@/mock.json";
const mockData = mockDataJson as MockData;
// Uses mockData.chartData.week/month/year
\`\`\`

**New Implementation**:
\`\`\`typescript
interface DashboardChartProps {
  chartData: {
    week: ChartDataPoint[]
    month: ChartDataPoint[]
    year: ChartDataPoint[]
  }
}

export default function DashboardChart({ chartData }: DashboardChartProps) {
  // Component logic stays the same, just receives real data
}
\`\`\`

**New Server Component**: `app/api/analytics/task-completion-trends/route.ts`

**Data Aggregation**:
\`\`\`sql
-- Week data
SELECT 
  DATE(completed_at) as date,
  COUNT(*) as completions,
  SUM(point_value) as points_earned
FROM tasks
WHERE assigned_to = $1 
  AND status IN ('completed', 'approved')
  AND completed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(completed_at)
ORDER BY date ASC;

-- Month data (group by week)
-- Year data (group by month)
\`\`\`

---

### Component 3: Rebels Ranking

**Current File**: `app/page.tsx` (line 106) → `components/dashboard/rebels-ranking/index.tsx`

**New Implementation**:
\`\`\`typescript
// Server Component
const partnerRanking = await getPartnerRanking(profile.id, profile.partner_id)

// Render
<RebelsRanking rebels={partnerRanking} />
\`\`\`

**New Function**: `lib/analytics/get-partner-ranking.ts`

**Database Queries**:
1. Get partner profile: `SELECT * FROM profiles WHERE id = $1`
2. Calculate points: `SELECT SUM(points) FROM points_ledger WHERE user_id = $1`
3. Calculate streak: Query tasks for consecutive completion days

---

### Component 4: Security Status

**Current File**: `app/page.tsx` (line 107) → `components/dashboard/security-status/index.tsx`

**New Implementation** (Temporary - Until Modules Built):
\`\`\`typescript
const securityStatus: SecurityStatus[] = [
  {
    title: "ACTIVE CONTRACT",
    value: "Coming Soon",
    status: "[MODULE 6]",
    variant: "warning"
  },
  {
    title: "BOUNDARIES SET",
    value: "Coming Soon",
    status: "[MODULE 5]",
    variant: "warning"
  },
  {
    title: "CHECK-INS",
    value: "Coming Soon",
    status: "[MODULE 7]",
    variant: "warning"
  }
]
\`\`\`

**Future Implementation** (When Modules Built):
\`\`\`typescript
// Query contracts table
const activeContract = await getActiveContract(profile.id)
// Query boundaries
const boundariesSet = await getBoundariesCount(profile.id)
// Query check-ins
const checkInsStatus = await getCheckInsStatus(profile.id)
\`\`\`

---

### Component 5: Widget

**Current File**: `components/dashboard/widget/index.tsx`

**New Implementation**:
\`\`\`typescript
interface WidgetProps {
  userName: string
  timezone?: string
  location?: string
}

export default function Widget({ userName, timezone, location }: WidgetProps) {
  const currentTime = new Date()
  const greeting = getGreeting(currentTime, userName)
  
  return (
    <Card>
      {/* Date/time already dynamic */}
      <div>{formatDate(currentTime)}</div>
      <div>{formatTime(currentTime)}</div>
      
      {/* Optional location */}
      {location && <span>{location}</span>}
      {timezone && <Badge>{timezone}</Badge>}
      
      {/* Dynamic greeting */}
      <div>{greeting}</div>
    </Card>
  )
}

function getGreeting(date: Date, name: string): string {
  const hour = date.getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}
\`\`\`

**Changes**:
- Remove `widgetData` prop
- Accept `userName` directly
- Make location/timezone optional
- Generate greeting dynamically

---

### Component 6: Notifications

**Current File**: `components/dashboard/notifications/index.tsx`

**New Implementation**:
\`\`\`typescript
// Server Component fetches initial notifications
const initialNotifications = await getNotifications(userId)

// Client Component with Realtime
export default function Notifications({ initialNotifications }: Props) {
  const { notifications, markAsRead, deleteNotification } = useNotifications({
    initialNotifications,
    userId
  })
  
  // Component logic stays the same
}
\`\`\`

**New Hook**: `hooks/use-notifications.ts`

**Realtime Subscription**:
\`\`\`typescript
const channel = supabase.channel(`notifications:${userId}`)
  .on('broadcast', { event: 'new_notification' }, (payload) => {
    // Add new notification
  })
  .subscribe()
\`\`\`

**New API Route**: `app/api/notifications/route.ts`

---

### Component 7: Chat Components

**Current Files**: Multiple chat components using `mockChatData`

**New Implementation** (When Module 7 Built):
\`\`\`typescript
// Replace mockChatData with real data
const { conversations } = useChatConversations(userId, partnerId)

// Hook implementation
export function useChatConversations(userId: string, partnerId: string | null) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  
  useEffect(() => {
    // Fetch conversations from API
    fetchConversations(userId, partnerId).then(setConversations)
    
    // Subscribe to new messages
    const channel = supabase.channel(`messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_user_id=eq.${userId}`
      }, (payload) => {
        // Update conversations
      })
      .subscribe()
  }, [userId, partnerId])
  
  return { conversations }
}
\`\`\`

**Temporary Solution** (Until Module 7 Built):
- Disable chat component or show "Coming Soon"
- Remove from layout temporarily

---

### Component 8: Rewards Page

**Current File**: `app/rewards/page.tsx`

**New Implementation**:
\`\`\`typescript
export default async function RewardsPage() {
  await requireAuth()
  const profile = await getUserProfile()
  
  // Fetch real data
  const [rewards, pointsBalance, streak] = await Promise.all([
    getAvailableRewards(profile.id),
    getPointsBalance(profile.id),
    getCurrentStreak(profile.id)
  ])
  
  return (
    <DashboardPageLayout>
      <PointsBalanceCard balance={pointsBalance} streak={streak} />
      <RewardsList rewards={rewards} currentPoints={pointsBalance} />
    </DashboardPageLayout>
  )
}
\`\`\`

**New Functions**:
- `lib/rewards/get-available-rewards.ts`
- `lib/analytics/get-points-balance.ts`
- `lib/analytics/get-current-streak.ts`

**New API Routes**:
- `GET /api/rewards?user_id=...&status=available`
- `POST /api/rewards/:id/redeem` - Redeem reward

---

## Database Schema Requirements

### New Tables to Create

#### 1. points_ledger

**Purpose**: Track all point transactions (earned and spent)

**Schema**: See Phase 2.1 above

**Key Features**:
- Supports positive (earned) and negative (spent) points
- Links to source (task, reward, manual entry)
- Audit trail for all point movements
- RLS policies for partner visibility

---

#### 2. rewards

**Purpose**: Store rewards that can be assigned or redeemed

**Schema**: See Phase 2.2 above

**Key Features**:
- Multiple reward types (verbal, points, relational, achievement)
- Point costs for redemption
- Love language mapping
- Status tracking (available, redeemed, completed)

---

#### 3. notifications (Optional)

**Purpose**: Store user notifications

**Schema**: See Phase 2.3 above

**Alternative**: Generate notifications on-the-fly from events (recommended)

---

### Database Functions Needed

#### 1. `get_points_balance(user_id uuid)`

\`\`\`sql
CREATE OR REPLACE FUNCTION get_points_balance(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance integer;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO balance
  FROM public.points_ledger
  WHERE user_id = p_user_id;
  
  RETURN balance;
END;
$$;
\`\`\`

#### 2. `get_current_streak(user_id uuid)`

\`\`\`sql
CREATE OR REPLACE FUNCTION get_current_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_days integer := 0;
  current_date date := CURRENT_DATE;
BEGIN
  -- Count consecutive days with at least one completed task
  WHILE EXISTS (
    SELECT 1 FROM public.tasks
    WHERE assigned_to = p_user_id
      AND status IN ('completed', 'approved')
      AND DATE(completed_at) = current_date
  ) LOOP
    streak_days := streak_days + 1;
    current_date := current_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN streak_days;
END;
$$;
\`\`\`

#### 3. `award_points_for_task(task_id uuid)` (Trigger Function)

\`\`\`sql
CREATE OR REPLACE FUNCTION award_points_for_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When task is approved, award points
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.points_ledger (
      workspace_id,
      user_id,
      points,
      reason,
      source_type,
      source_id
    ) VALUES (
      NEW.workspace_id,
      NEW.assigned_to,
      NEW.point_value,
      'Task completed: ' || NEW.title,
      'task',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_award_points_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION award_points_for_task();
\`\`\`

---

## API Routes Needed

### Phase 2 Routes

#### 1. Points API

**File**: `app/api/points/balance/route.ts`
\`\`\`typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  
  // Query points_ledger
  const balance = await getPointsBalance(userId)
  const streak = await getCurrentStreak(userId)
  
  return NextResponse.json({ balance, streak })
}
\`\`\`

**File**: `app/api/points/history/route.ts`
\`\`\`typescript
export async function GET(req: Request) {
  // Return paginated points history
}
\`\`\`

#### 2. Rewards API

**File**: `app/api/rewards/route.ts`
\`\`\`typescript
export async function GET(req: Request) {
  // Get rewards for user
}

export async function POST(req: Request) {
  // Create reward (dominant only)
}
\`\`\`

**File**: `app/api/rewards/[id]/redeem/route.ts`
\`\`\`typescript
export async function PATCH(req: Request) {
  // Redeem reward (submissive)
  // Deduct points, update reward status
}
\`\`\`

#### 3. Notifications API

**File**: `app/api/notifications/route.ts`
\`\`\`typescript
export async function GET(req: Request) {
  // Get notifications (or generate from events)
}

export async function PATCH(req: Request) {
  // Mark as read
}

export async function DELETE(req: Request) {
  // Delete notification
}
\`\`\`

### Phase 3 Routes

#### 4. Analytics API

**File**: `app/api/analytics/dashboard-stats/route.ts`
\`\`\`typescript
export async function GET(req: Request) {
  // Aggregate dashboard stats
  // Tasks completed, points balance, rewards earned
}
\`\`\`

**File**: `app/api/analytics/task-completion-trends/route.ts`
\`\`\`typescript
export async function GET(req: Request) {
  // Return task completion data for charts
  // Grouped by week/month/year
}
\`\`\`

---

## Testing Strategy

### Unit Tests

**Files to Test**:
- `lib/analytics/get-dashboard-stats.ts`
- `lib/analytics/get-partner-ranking.ts`
- `lib/analytics/calculate-streak.ts`
- `lib/rewards/get-available-rewards.ts`

**Test Cases**:
- Empty data scenarios
- Edge cases (no partner, no tasks, etc.)
- Calculation accuracy
- Date range filtering

### Integration Tests

**API Routes**:
- Test authentication/authorization
- Test RLS policies
- Test data aggregation accuracy
- Test error handling

### E2E Tests

**User Flows**:
- Dominant creates task → Points awarded → Stats update
- Submissive completes task → Notification created → Stats update
- Dominant assigns reward → Points deducted → Balance updates
- Real-time updates work correctly

---

## Migration Path

### Step 1: Prepare Database (Phase 2)

1. Create migrations for new tables
2. Run migrations: `supabase migration up`
3. Verify tables created correctly
4. Test RLS policies

### Step 2: Build API Routes (Phase 2)

1. Create API routes for points, rewards, notifications
2. Test each route independently
3. Verify authentication/authorization
4. Test error handling

### Step 3: Update Components (Phase 3)

1. Start with Dashboard Stats (easiest)
2. Update Chart component
3. Update Rebels Ranking
4. Update Widget
5. Update Notifications
6. Update Rewards Page
7. Handle Chat (disable or build Module 7)

### Step 4: Remove Mock Data

1. Remove `mock.json` imports
2. Delete `mock.json` file
3. Delete `data/chat-mock.ts` file
4. Update TypeScript types
5. Remove unused types from `types/dashboard.ts`

### Step 5: Testing & Validation

1. Test all components with real data
2. Verify calculations are correct
3. Test real-time updates
4. Test empty states
5. Performance testing

---

## Risk Assessment & Mitigation

### Risks

1. **Performance**: Aggregating data on every page load
   - **Mitigation**: Cache aggregated data, use database functions

2. **Data Accuracy**: Calculations might be incorrect
   - **Mitigation**: Comprehensive testing, use database functions for calculations

3. **Breaking Changes**: Removing mock data might break UI
   - **Mitigation**: Gradual migration, feature flags, fallback to empty states

4. **Missing Features**: Some components depend on future modules
   - **Mitigation**: Show "Coming Soon" placeholders, disable features gracefully

5. **RLS Policy Issues**: Complex policies might have bugs
   - **Mitigation**: Thorough testing, review policies carefully

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Dashboard Stats show real task completion data
- ✅ Chart shows real task completion trends
- ✅ Rebels Ranking shows real partner data with calculated points
- ✅ Widget generates dynamic greeting
- ✅ No mock.json imports in these components

### Phase 2 Complete When:
- ✅ `points_ledger` table created and tested
- ✅ `rewards` table created and tested
- ✅ Notifications system working (table or event-based)
- ✅ All API routes functional
- ✅ RLS policies tested and working

### Phase 3 Complete When:
- ✅ All components use real data
- ✅ Real-time updates working
- ✅ Empty states handled gracefully
- ✅ Performance acceptable
- ✅ `mock.json` file deleted

### Phase 4 Complete When:
- ✅ Chat system built (Module 7)
- ✅ Contracts system built (Module 6)
- ✅ Boundaries system built (Module 5)
- ✅ Check-ins system built (Module 7)
- ✅ Security Status shows real data

---

## Timeline Estimate

### Phase 1: Quick Wins
**Duration**: 1-2 days  
**Effort**: 4-6 hours

### Phase 2: Core Infrastructure
**Duration**: 3-5 days  
**Effort**: 16-24 hours

### Phase 3: Component Updates
**Duration**: 3-4 days  
**Effort**: 12-16 hours

### Phase 4: Future Modules
**Duration**: 2-3 weeks per module  
**Effort**: 12-20 hours per module

**Total Estimated Time**: 2-3 weeks for Phases 1-3, then ongoing for Phase 4

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Prioritize phases** based on business needs
3. **Create GitHub issues** for each phase/component
4. **Start with Phase 1** (quick wins)
5. **Build Phase 2 infrastructure** (foundation)
6. **Migrate components** in Phase 3
7. **Plan Phase 4** modules based on PRD roadmap

---

## Appendix: File Changes Summary

### Files to Modify

1. `app/page.tsx` - Remove mock data, add data fetching
2. `app/layout.tsx` - Remove mock data, update widget/notifications
3. `components/dashboard/chart/index.tsx` - Accept props instead of mock data
4. `components/dashboard/widget/index.tsx` - Remove widgetData prop
5. `components/dashboard/notifications/index.tsx` - Fetch from API
6. `components/dashboard/mobile-header/index.tsx` - Fetch notifications
7. `app/rewards/page.tsx` - Convert to Server Component, fetch real data
8. `components/chat/*` - Disable or build Module 7

### Files to Create

1. `supabase/migrations/YYYYMMDDHHMMSS_create_points_ledger.sql`
2. `supabase/migrations/YYYYMMDDHHMMSS_create_rewards.sql`
3. `supabase/migrations/YYYYMMDDHHMMSS_create_notifications.sql` (optional)
4. `app/api/points/balance/route.ts`
5. `app/api/points/history/route.ts`
6. `app/api/rewards/route.ts`
7. `app/api/rewards/[id]/redeem/route.ts`
8. `app/api/notifications/route.ts`
9. `app/api/analytics/dashboard-stats/route.ts`
10. `app/api/analytics/task-completion-trends/route.ts`
11. `lib/analytics/get-dashboard-stats.ts`
12. `lib/analytics/get-partner-ranking.ts`
13. `lib/analytics/calculate-streak.ts`
14. `lib/analytics/get-points-balance.ts`
15. `lib/rewards/get-available-rewards.ts`
16. `hooks/use-notifications.ts`

### Files to Delete

1. `mock.json` (after migration complete)
2. `data/chat-mock.ts` (after Module 7 built or disabled)

---

**Document Status**: Comprehensive Plan Complete  
**Last Updated**: 2026-01-05  
**Next Review**: After Phase 1 completion
