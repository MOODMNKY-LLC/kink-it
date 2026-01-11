# MVP Feature: Submission State Management

**Status**: Ready for Implementation  
**Priority**: Critical (P0)  
**Estimated Effort**: 3-5 days  
**Dependencies**: None (foundational feature)

---

## Overview

Submission state management is a **non-negotiable foundational feature** that enables submissives to self-declare their current capacity level. This state affects all other features in the app, ensuring that boundaries are respected and the app never pressures a submissive when they're not ready.

## Core Requirements

### Submission States

Three distinct states that can be self-declared by the submissive:

1. **Active Submission** (Default)
   - Full availability for routine, tasks, correction, and play
   - All features enabled
   - Normal task load and expectations

2. **Low-Energy Submission**
   - Still submissive, but reduced capacity
   - Prefers fewer tasks, clearer instructions, less cognitive load
   - Does not imply disengagement
   - Features adapt to reduced capacity

3. **Paused Submission / Paused Play**
   - Temporary suspension of play and D/s expectations
   - Signals need for honest, non-play communication
   - Automatically disables:
     - Task assignment
     - Discipline
     - Sexualized tone
     - Automated reminders

### Key Principles

1. **Self-Declared**: Only the submissive can set their state (never inferred or set by Dominant)
2. **Respected**: The app reflects state; it never overrides it
3. **Enforced**: Features automatically adapt based on state
4. **Auditable**: All state changes are logged with timestamp and context

---

## Database Schema

### Enum Type

\`\`\`sql
CREATE TYPE submission_state AS ENUM ('active', 'low_energy', 'paused');
\`\`\`

### Profile Table Update

Add column to `profiles` table:

\`\`\`sql
ALTER TABLE public.profiles
ADD COLUMN submission_state submission_state DEFAULT 'active' NOT NULL;
\`\`\`

### State Change Log Table

\`\`\`sql
CREATE TABLE public.submission_state_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL, -- For future multi-partner support
  previous_state submission_state,
  new_state submission_state NOT NULL,
  reason text, -- Optional context for state change
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_submission_state_logs_user_id ON public.submission_state_logs(user_id);
CREATE INDEX idx_submission_state_logs_created_at ON public.submission_state_logs(created_at DESC);
\`\`\`

### RLS Policies

\`\`\`sql
-- State logs: users can read their own, partners can read partner's
CREATE POLICY "submission_state_logs_select_own_or_partner"
ON public.submission_state_logs FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT partner_id FROM public.profiles WHERE id = user_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  )
);
\`\`\`

---

## API Endpoints

### Update Submission State

**Endpoint**: `PATCH /api/submission-state`

**Request**:
\`\`\`typescript
{
  state: 'active' | 'low_energy' | 'paused',
  reason?: string // Optional context
}
\`\`\`

**Response**:
\`\`\`typescript
{
  success: boolean,
  previous_state: string,
  new_state: string,
  updated_at: string
}
\`\`\`

**Validation**:
- User must be authenticated
- User must be submissive (dynamic_role = 'submissive')
- State must be valid enum value
- Reason is optional but recommended for 'paused' state

**Implementation**:
\`\`\`typescript
// app/api/submission-state/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user is submissive
  const { data: profile } = await supabase
    .from("profiles")
    .select("dynamic_role, submission_state")
    .eq("id", user.id)
    .single()

  if (profile?.dynamic_role !== "submissive") {
    return NextResponse.json(
      { error: "Only submissives can update submission state" },
      { status: 403 }
    )
  }

  const { state, reason } = await req.json()

  if (!["active", "low_energy", "paused"].includes(state)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  const previous_state = profile.submission_state

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      submission_state: state,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log state change
  await supabase.from("submission_state_logs").insert({
    user_id: user.id,
    workspace_id: user.id, // TODO: Update when workspaces are implemented
    previous_state,
    new_state: state,
    reason
  })

  return NextResponse.json({
    success: true,
    previous_state,
    new_state: state,
    updated_at: new Date().toISOString()
  })
}
\`\`\`

### Get Current Submission State

**Endpoint**: `GET /api/submission-state`

**Response**:
\`\`\`typescript
{
  state: 'active' | 'low_energy' | 'paused',
  updated_at: string,
  can_change: boolean // true if user is submissive
}
\`\`\`

---

## UI Components

### Submission State Selector (Submissive Only)

**Location**: Dashboard, Profile page, Settings page

**Component**: `components/submission/submission-state-selector.tsx`

**Features**:
- Large, clear buttons for each state
- Current state highlighted
- One-click state change
- Optional reason field for 'paused' state
- Confirmation for 'paused' state (safety measure)
- Visual indicators (colors, icons)

**Design**:
- **Active**: Green, checkmark icon
- **Low-Energy**: Yellow, battery-low icon
- **Paused**: Red, pause icon

**Implementation**:
\`\`\`typescript
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, BatteryLow, PauseCircle } from "lucide-react"
import { toast } from "sonner"

type SubmissionState = 'active' | 'low_energy' | 'paused'

export function SubmissionStateSelector({ 
  currentState,
  onStateChange 
}: { 
  currentState: SubmissionState
  onStateChange: (state: SubmissionState) => void 
}) {
  const [isChanging, setIsChanging] = useState(false)

  const handleStateChange = async (newState: SubmissionState) => {
    if (newState === currentState) return

    // Confirmation for paused state
    if (newState === 'paused') {
      const confirmed = window.confirm(
        "Are you sure you want to pause play? This will disable task assignment and discipline."
      )
      if (!confirmed) return
    }

    setIsChanging(true)
    try {
      const response = await fetch('/api/submission-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      })

      if (!response.ok) {
        throw new Error('Failed to update state')
      }

      const data = await response.json()
      onStateChange(newState)
      toast.success(`State updated to ${newState}`)
    } catch (error) {
      toast.error('Failed to update submission state')
    } finally {
      setIsChanging(false)
    }
  }

  const states: Array<{
    value: SubmissionState
    label: string
    icon: React.ReactNode
    color: string
  }> = [
    {
      value: 'active',
      label: 'Active Submission',
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      value: 'low_energy',
      label: 'Low Energy',
      icon: <BatteryLow className="h-5 w-5" />,
      color: 'bg-yellow-500'
    },
    {
      value: 'paused',
      label: 'Paused Play',
      icon: <PauseCircle className="h-5 w-5" />,
      color: 'bg-red-500'
    }
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submission State</h3>
      <div className="grid grid-cols-3 gap-4">
        {states.map((state) => (
          <Button
            key={state.value}
            variant={currentState === state.value ? "default" : "outline"}
            onClick={() => handleStateChange(state.value)}
            disabled={isChanging || currentState === state.value}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <div className={`${state.color} rounded-full p-2`}>
              {state.icon}
            </div>
            <span className="text-sm">{state.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  )
}
\`\`\`

### Submission State Display (Dominant View)

**Location**: Dashboard (prominent), Task assignment page

**Component**: `components/submission/submission-state-display.tsx`

**Features**:
- Read-only display of partner's current state
- Visual indicator (color-coded badge)
- Last updated timestamp
- Link to state change history (future)

**Implementation**:
\`\`\`typescript
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, BatteryLow, PauseCircle } from "lucide-react"

type SubmissionState = 'active' | 'low_energy' | 'paused'

export function SubmissionStateDisplay({ 
  state,
  updatedAt 
}: { 
  state: SubmissionState
  updatedAt: string 
}) {
  const config = {
    active: {
      label: 'Active Submission',
      icon: CheckCircle2,
      variant: 'default' as const,
      className: 'bg-green-500'
    },
    low_energy: {
      label: 'Low Energy',
      icon: BatteryLow,
      variant: 'secondary' as const,
      className: 'bg-yellow-500'
    },
    paused: {
      label: 'Paused Play',
      icon: PauseCircle,
      variant: 'destructive' as const,
      className: 'bg-red-500'
    }
  }[state]

  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Updated {new Date(updatedAt).toLocaleString()}
      </span>
    </div>
  )
}
\`\`\`

---

## Enforcement Logic

### Task Assignment Enforcement

**Location**: Task creation/assignment API

**Logic**:
\`\`\`typescript
// Before assigning task to submissive
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
  // Allow but log that it's low-energy mode
  // Could show warning to Dominant
}
\`\`\`

### UI Enforcement

**Location**: All task-related UI components

**Logic**:
- Hide "Assign Task" button when submissive is paused
- Show warning banner when submissive is low-energy
- Disable task completion UI when paused
- Show clear message: "Submission is paused. Tasks are disabled."

---

## Realtime Updates

### Supabase Realtime Subscription

**Purpose**: Both partners see state changes instantly

**Implementation**:
\`\`\`typescript
// hooks/useSubmissionState.ts
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useSubmissionState(userId: string) {
  const [state, setState] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    supabase
      .from("profiles")
      .select("submission_state")
      .eq("id", userId)
      .single()
      .then(({ data }) => setState(data?.submission_state))

    // Realtime subscription
    const channel = supabase
      .channel(`submission-state-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`
        },
        (payload) => {
          setState(payload.new.submission_state)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return state
}
\`\`\`

---

## Acceptance Criteria

- [ ] Submission state enum exists in database
- [ ] Profile table has submission_state column (default: 'active')
- [ ] State change log table exists with RLS policies
- [ ] API endpoint allows submissive to update state
- [ ] API endpoint prevents non-submissives from updating state
- [ ] UI component allows submissive to change state (one-click)
- [ ] UI component shows confirmation for 'paused' state
- [ ] Dominant can see partner's current state (read-only)
- [ ] State changes are logged with timestamp and reason
- [ ] Task assignment is blocked when state is 'paused'
- [ ] Task assignment shows warning when state is 'low_energy'
- [ ] Realtime updates work (both partners see changes instantly)
- [ ] State is displayed prominently on dashboard
- [ ] State history can be viewed (future: separate page)

---

## Testing Checklist

### Unit Tests
- [ ] State enum validation
- [ ] API endpoint authorization (submissive only)
- [ ] State change logging
- [ ] Enforcement logic (task assignment blocking)

### Integration Tests
- [ ] State update flow (UI → API → Database)
- [ ] Realtime subscription updates
- [ ] Task assignment enforcement
- [ ] State change history logging

### Manual Testing
- [ ] Submissive can change state
- [ ] Dominant cannot change submissive's state
- [ ] Task assignment blocked when paused
- [ ] State changes appear in real-time for both partners
- [ ] State persists across page refreshes
- [ ] Confirmation dialog appears for paused state

---

## Future Enhancements

1. **State Change History Page**: View all state changes over time
2. **State-Based Task Filtering**: Automatically filter tasks based on state
3. **State Reminders**: Optional reminder to update state if unchanged for X days
4. **State Analytics**: Track patterns in state changes
5. **Scheduled State Changes**: Schedule state changes (e.g., "pause at 9 PM")

---

## Related Documentation

- [PRD - Submission States](../PRD.md#module-1-dashboard)
- [Design Principles - Authority and Consent](../../docs/design/authority-and-consent.md)
- [ChatGPT Group Chat Analysis](../../docs/analysis/chatgpt-group-chat-analysis.md)

---

**Last Updated**: 2026-01-05  
**Author**: Development Team  
**Status**: Ready for Implementation
