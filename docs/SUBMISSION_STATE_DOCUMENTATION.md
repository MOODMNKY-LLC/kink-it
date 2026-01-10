# Submission State Management - Documentation

**Last Updated**: February 3, 2026  
**Status**: Complete Implementation

---

## Overview

The Submission State system allows submissives to declare their current capacity level, which affects task assignment, app behavior, and D/s expectations. This feature ensures that the app respects the submissive's boundaries and current state.

---

## Valid States

### 1. **Active** (`active`)
- **Description**: Full availability for routine, tasks, and play
- **Behavior**: 
  - All tasks are visible and assignable
  - Full app functionality available
  - Normal D/s expectations apply
- **Use Case**: Default state when submissive is ready for full engagement

### 2. **Low Energy** (`low_energy`)
- **Description**: Reduced capacity, fewer tasks preferred
- **Behavior**:
  - All tasks remain visible
  - Dominant should consider reducing task load
  - App functionality remains available
  - Reduced expectations but not paused
- **Use Case**: When submissive needs a lighter load but still wants to engage

### 3. **Paused** (`paused`)
- **Description**: Temporary suspension of D/s expectations
- **Behavior**:
  - **Tasks are hidden** from submissive view
  - **Task assignment is blocked** (API enforcement)
  - **Task creation is blocked** for tasks assigned to paused submissive
  - App functionality limited to essential features only
  - D/s expectations suspended
- **Use Case**: When submissive needs a complete break from D/s dynamics

---

## State Transition Rules

### Who Can Change State
- **Only submissives** can change their own submission state
- Dominants can view but not modify their partner's state
- System admins cannot override (respects autonomy)

### Valid Transitions
All state transitions are allowed:
- `active` → `low_energy` ✅
- `active` → `paused` ✅
- `low_energy` → `active` ✅
- `low_energy` → `paused` ✅
- `paused` → `active` ✅
- `paused` → `low_energy` ✅

### Confirmation Requirements
- **Paused State**: Requires explicit confirmation dialog
  - Warns about task hiding and assignment blocking
  - Explains that D/s expectations will be suspended
  - Confirms user understands the implications

---

## Enforcement Logic

### Task Management
When submission state is `paused`:

1. **Task List API** (`GET /api/tasks`):
   - Filters out tasks assigned to paused submissive
   - Only shows completed/approved tasks
   - Returns empty list for pending/in_progress tasks

2. **Task Creation API** (`POST /api/tasks`):
   - Checks if `assigned_to` user has `paused` state
   - Returns `403 Forbidden` if attempting to assign to paused submissive
   - Error message: "Cannot assign tasks to a paused submissive"

3. **Task Widgets**:
   - Today's Tasks Widget hides when paused
   - Shows "Tasks are paused" message instead
   - Prompts user to change state to see tasks

### UI Behavior
- **Dashboard**: Submission state prominently displayed
- **Task Pages**: Respect state filtering
- **Widgets**: Conditionally render based on state
- **Realtime Updates**: State changes sync immediately across clients

---

## Audit Logging

### Log Table: `submission_state_logs`
All state changes are logged with:
- `user_id`: Who changed the state
- `workspace_id`: Workspace context (currently user_id)
- `previous_state`: Previous state value
- `new_state`: New state value
- `reason`: Optional reason provided by user
- `created_at`: Timestamp of change

### Logging Behavior
- Logging happens automatically on state change
- Logging failures don't block state updates (non-critical)
- Logs are preserved for audit trail
- Can be queried for state change history

---

## Realtime Synchronization

### Implementation
- Uses Supabase Realtime broadcast channels
- Topic pattern: `profile:{user_id}:submission_state`
- Event: `submission_state_changed`
- Updates propagate immediately to all connected clients

### Subscription Behavior
- **Submissive**: Subscribes to own state changes
- **Dominant**: Subscribes to partner's state changes
- **Switch**: Subscribes to both own and partner's state changes
- Automatic reconnection on network issues
- Cleanup on component unmount

---

## API Endpoints

### GET `/api/submission-state`
**Purpose**: Fetch current submission state

**Response**:
```json
{
  "state": "active" | "low_energy" | "paused",
  "updated_at": "2026-02-03T12:00:00Z",
  "can_change": true | false
}
```

**Authorization**: Authenticated users only

---

### PATCH `/api/submission-state`
**Purpose**: Update submission state

**Request Body**:
```json
{
  "state": "active" | "low_energy" | "paused",
  "reason": "Optional reason for state change"
}
```

**Response**:
```json
{
  "success": true,
  "previous_state": "active",
  "new_state": "paused",
  "updated_at": "2026-02-03T12:00:00Z"
}
```

**Authorization**: 
- Only submissives can update their own state
- Returns `403 Forbidden` if user is not submissive

**Validation**:
- State must be one of: `active`, `low_energy`, `paused`
- Reason is optional (text)

---

## Best Practices

### For Submissives
1. **Be Honest**: Declare your true capacity level
2. **Update Promptly**: Change state when your capacity changes
3. **Use Reason Field**: Provide context when changing to paused
4. **Communicate**: Let your Dominant know about state changes
5. **Respect the System**: Don't abuse paused state to avoid tasks

### For Dominants
1. **Respect State**: Honor your submissive's declared state
2. **Monitor Changes**: Watch for state change notifications
3. **Adjust Expectations**: Reduce task load during low_energy
4. **No Override**: Never attempt to force state changes
5. **Check-in**: Ask about state changes if concerned

### For Developers
1. **Always Check State**: Verify state before task operations
2. **Enforce Consistently**: Apply state checks in all relevant APIs
3. **Log Changes**: Ensure audit logging is working
4. **Test Transitions**: Verify all state transitions work
5. **Handle Edge Cases**: Account for state changes during operations

---

## Technical Implementation

### Database Schema
```sql
-- Profile column
ALTER TABLE profiles ADD COLUMN submission_state submission_state;

-- Audit log table
CREATE TABLE submission_state_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  workspace_id uuid NOT NULL,
  previous_state submission_state,
  new_state submission_state NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### TypeScript Types
```typescript
type SubmissionState = "active" | "low_energy" | "paused"
```

### React Hook
```typescript
const { state, updatedAt, isLoading, error } = useSubmissionState({
  userId: string,
  partnerId?: string | null
})
```

---

## Testing Checklist

### State Transitions
- [ ] Test all 6 possible state transitions
- [ ] Verify confirmation dialog for paused state
- [ ] Verify no confirmation for other transitions
- [ ] Test rapid state changes
- [ ] Test state change during active operations

### Enforcement
- [ ] Verify tasks are hidden when paused
- [ ] Verify task assignment is blocked when paused
- [ ] Verify task creation is blocked for paused submissive
- [ ] Verify tasks reappear when state changes back
- [ ] Test edge cases (state change during task completion)

### Realtime
- [ ] Test state change syncs across multiple clients
- [ ] Test subscription cleanup on unmount
- [ ] Test reconnection after network issues
- [ ] Test partner state visibility for dominants

### Audit Logging
- [ ] Verify all state changes are logged
- [ ] Verify log entries contain correct data
- [ ] Verify reason field is stored when provided
- [ ] Test logging doesn't block state updates

### UI/UX
- [ ] Verify loading states during state changes
- [ ] Verify toast notifications appear
- [ ] Verify visual feedback is clear
- [ ] Verify error handling is graceful
- [ ] Test on mobile devices

---

## Troubleshooting

### State Changes Not Syncing
- Check Realtime subscription status
- Verify channel is subscribed
- Check network connectivity
- Verify RLS policies allow access

### Tasks Still Visible When Paused
- Verify API is checking state correctly
- Check task query filters
- Verify state was actually updated
- Check for caching issues

### Audit Logs Missing
- Check database connection
- Verify `submission_state_logs` table exists
- Check for silent logging failures
- Review API error logs

---

## Future Enhancements

### Potential Additions
- State change history UI
- Scheduled state changes
- State-based notifications
- State analytics/reporting
- State templates/presets

### Considerations
- Maintain simplicity
- Preserve user autonomy
- Keep enforcement consistent
- Document all changes

---

**Documentation Version**: 1.0  
**Last Reviewed**: February 3, 2026  
**Maintained By**: Development Team
