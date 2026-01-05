# MVP Feature: Task Management (Protocol Engine)

**Status**: Ready for Implementation  
**Priority**: Critical (P0)  
**Estimated Effort**: 5-7 days  
**Dependencies**: Submission State Management

---

## Overview

Task Management is the core "Protocol Engine" of KINK IT, enabling Dominants to assign tasks and submissives to complete them. Tasks respect submission state, support proof requirements, and integrate with the rewards system.

## Core Requirements

### Task Types

1. **Routine Tasks**: Daily/weekly recurring (morning routine, bedtime ritual)
2. **One-Time Tasks**: Specific assignments
3. **Protocol Tasks**: Linked to rules/protocols
4. **Temporary Tasks**: For low-energy days or special circumstances

### Task Lifecycle

1. **Created** (by Dominant)
2. **Assigned** (to Submissive)
3. **In Progress** (Submissive starts working)
4. **Completed** (Submissive marks complete, optionally with proof)
5. **Approved** (Dominant reviews and approves)
6. **Cancelled** (by Dominant, or auto-cancelled if paused)

### Key Principles

1. **Respect Submission State**: No task assignment when paused, reduced load when low-energy
2. **Proof Requirements**: Tasks can require photo, video, or text proof
3. **Point Values**: Tasks can have point values for rewards system
4. **Dominant Authority**: Only Dominant can create/assign tasks
5. **Submissive Agency**: Submissive can request extensions, add completion notes

---

## Database Schema

### Tasks Table

```sql
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL, -- For future multi-partner support
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'cancelled')),
  due_date timestamptz,
  point_value integer DEFAULT 0,
  proof_required boolean DEFAULT false,
  proof_type text CHECK (proof_type IN ('photo', 'video', 'text', null)),
  template_id uuid REFERENCES public.task_templates(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.rules(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to uuid NOT NULL REFERENCES public.profiles(id),
  completed_at timestamptz,
  approved_at timestamptz,
  completion_notes text,
  extension_requested boolean DEFAULT false,
  extension_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_workspace_id ON public.tasks(workspace_id);
```

### Task Proof Table

```sql
CREATE TABLE public.task_proof (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  proof_type text NOT NULL CHECK (proof_type IN ('photo', 'video', 'text')),
  proof_url text, -- Supabase Storage URL for photos/videos
  proof_text text, -- For text proof
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id)
);

CREATE INDEX idx_task_proof_task_id ON public.task_proof(task_id);
```

### Task Templates Table

```sql
CREATE TABLE public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  default_priority text DEFAULT 'medium',
  default_point_value integer DEFAULT 0,
  proof_required boolean DEFAULT false,
  proof_type text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_templates_workspace_id ON public.task_templates(workspace_id);
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Tasks: Assigned to/from can read, only assigner can update
CREATE POLICY "tasks_select_assigned"
ON public.tasks FOR SELECT
USING (
  auth.uid() = assigned_to
  OR auth.uid() = assigned_by
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);

CREATE POLICY "tasks_insert_dominant"
ON public.tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND dynamic_role = 'dominant'
  )
);

CREATE POLICY "tasks_update_assigned"
ON public.tasks FOR UPDATE
USING (
  auth.uid() = assigned_by -- Dominant can update
  OR (auth.uid() = assigned_to AND status IN ('pending', 'in_progress')) -- Submissive can update status
);

-- Task proof: Same as tasks
CREATE POLICY "task_proof_select_assigned"
ON public.task_proof FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_proof.task_id
    AND (tasks.assigned_to = auth.uid() OR tasks.assigned_by = auth.uid())
  )
);

CREATE POLICY "task_proof_insert_assigned"
ON public.task_proof FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_proof.task_id
    AND tasks.assigned_to = auth.uid()
  )
);
```

---

## API Endpoints

### Create Task

**Endpoint**: `POST /api/tasks`

**Request** (Dominant only):
```typescript
{
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string (ISO 8601)
  point_value?: number
  proof_required?: boolean
  proof_type?: 'photo' | 'video' | 'text'
  assigned_to: string (user ID)
  template_id?: string
  rule_id?: string
}
```

**Validation**:
- User must be authenticated and have dynamic_role = 'dominant'
- Assigned_to must be submissive and partner
- Cannot assign if submissive's submission_state = 'paused'
- Show warning if submissive's submission_state = 'low_energy'

### Update Task Status

**Endpoint**: `PATCH /api/tasks/[id]`

**Request**:
```typescript
{
  status?: 'in_progress' | 'completed' | 'cancelled'
  completion_notes?: string
  proof?: {
    type: 'photo' | 'video' | 'text'
    url?: string
    text?: string
  }
  extension_requested?: boolean
  extension_reason?: string
}
```

**Authorization**:
- Submissive can update: status to 'in_progress' or 'completed', add proof
- Dominant can update: any field, approve completion

### Get Tasks

**Endpoint**: `GET /api/tasks`

**Query Parameters**:
- `status`: Filter by status
- `assigned_to`: Filter by assignee
- `assigned_by`: Filter by assigner
- `due_date`: Filter by due date range

**Response**: Array of tasks with proof and metadata

---

## UI Components

### Task List (Submissive View)

**Location**: `/tasks` page

**Features**:
- Filter by status (pending, in_progress, completed)
- Sort by due date, priority
- Show submission state warning if paused
- One-click "Start" and "Complete" actions
- Proof upload interface
- Extension request form

### Task List (Dominant View)

**Location**: `/tasks` page

**Features**:
- Filter by status, assignee
- Create new task button
- Bulk actions (approve multiple, cancel)
- Review proof modal
- Approve/reject completion
- Task statistics

### Create Task Form (Dominant)

**Location**: Modal or `/tasks/new` page

**Features**:
- Title, description inputs
- Priority selector
- Due date picker
- Point value input
- Proof requirements toggle
- Assign to selector (shows partner's submission state)
- Template selector
- Link to rule/protocol

### Task Card Component

**Reusable component for displaying tasks**

**Features**:
- Status badge
- Priority indicator
- Due date display
- Proof indicator
- Action buttons (context-aware)

---

## Enforcement Logic

### Submission State Enforcement

```typescript
// Before creating/assigning task
const { data: submissiveProfile } = await supabase
  .from("profiles")
  .select("submission_state")
  .eq("id", assignedToId)
  .single()

if (submissiveProfile?.submission_state === 'paused') {
  return NextResponse.json(
    { error: "Cannot assign tasks when submission is paused" },
    { status: 403 }
  )
}

if (submissiveProfile?.submission_state === 'low_energy') {
  // Show warning to Dominant but allow
  // Suggest fewer tasks or simpler tasks
}
```

### Task Filtering by State

```typescript
// When submissive views tasks
const { data: profile } = await supabase
  .from("profiles")
  .select("submission_state")
  .eq("id", userId)
  .single()

let query = supabase
  .from("tasks")
  .select("*")
  .eq("assigned_to", userId)

if (profile?.submission_state === 'paused') {
  // Hide all pending tasks, show only completed/approved
  query = query.in("status", ["completed", "approved"])
} else if (profile?.submission_state === 'low_energy') {
  // Show all but prioritize simpler tasks
  query = query.order("priority", { ascending: false })
}
```

---

## Acceptance Criteria

- [ ] Tasks table created with all required fields
- [ ] Task proof table created with RLS
- [ ] Task templates table created
- [ ] RLS policies enforce authorization
- [ ] Task creation API works (Dominant only)
- [ ] Task assignment blocked when submissive is paused
- [ ] Task assignment shows warning when submissive is low-energy
- [ ] Submissive can view assigned tasks
- [ ] Submissive can mark tasks as complete
- [ ] Submissive can upload proof (photo/video/text)
- [ ] Dominant can approve/reject completions
- [ ] Task list filters and sorts correctly
- [ ] Task cards display all relevant information
- [ ] Proof uploads work reliably
- [ ] Extension requests can be submitted
- [ ] Tasks respect submission state

---

## Testing Checklist

### Unit Tests
- [ ] Task creation validation
- [ ] Submission state enforcement
- [ ] Proof upload handling
- [ ] Status transition logic

### Integration Tests
- [ ] Task creation flow (UI → API → Database)
- [ ] Task completion flow
- [ ] Proof upload flow
- [ ] Approval flow
- [ ] State enforcement integration

### Manual Testing
- [ ] Dominant can create and assign tasks
- [ ] Submissive cannot create tasks
- [ ] Tasks blocked when paused
- [ ] Tasks visible when active/low-energy
- [ ] Proof uploads work (photo/video/text)
- [ ] Completion approval works
- [ ] Task list updates in real-time

---

## Future Enhancements

1. **Bulk Task Creation**: Create multiple tasks at once
2. **Task Templates**: Save and reuse task templates
3. **Recurring Tasks**: Automatic task creation for routines
4. **Task Dependencies**: Tasks that depend on other tasks
5. **Task Comments**: Discussion thread on tasks
6. **Task Analytics**: Completion rates, time tracking

---

## Related Documentation

- [PRD - Task Management](../PRD.md#module-2-task-management-protocol-engine)
- [Submission State Management](./mvp-submission-state.md)
- [Design Principles - Authority and Consent](../../docs/design/authority-and-consent.md)

---

**Last Updated**: 2026-01-05  
**Author**: Development Team  
**Status**: Ready for Implementation



