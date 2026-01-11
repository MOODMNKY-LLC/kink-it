# Switch Infinite Loop Fix - Comprehensive Solution

## Problem

Radix UI Switch component was causing "Maximum update depth exceeded" errors. The Switch was triggering `onCheckedChange` repeatedly, creating an infinite update loop.

## Root Cause Analysis

1. **Radix Switch Behavior**: Radix UI Switch calls `onCheckedChange` during initialization to sync internal state with the `checked` prop
2. **State Update Cycle**: Callback updates state → Component re-renders → Radix detects prop change → Calls callback again → Loop
3. **Missing Guards**: Previous guards weren't sufficient to prevent Radix's initialization calls

## Solution: Triple-Layer Protection

### 1. Mount Tracking
Use `useRef` to track if component is mounted. Only process callbacks after mount:

\`\`\`typescript
const isMountedRef = useRef(false)

useEffect(() => {
  isMountedRef.current = true
}, [])
\`\`\`

### 2. Update-In-Progress Flag
Prevent recursive calls with a flag:

\`\`\`typescript
const isUpdatingAgentModeRef = useRef(false)

onCheckedChange={(checked) => {
  if (!isUpdatingAgentModeRef.current) {
    isUpdatingAgentModeRef.current = true
    try {
      onAgentModeChange(checked)
    } finally {
      setTimeout(() => {
        isUpdatingAgentModeRef.current = false
      }, 0)
    }
  }
}}
\`\`\`

### 3. Value Change Check
Only update if value actually changed:

\`\`\`typescript
const agentModeRef = useRef(agentMode)

onCheckedChange={(checked) => {
  if (checked !== agentModeRef.current) {
    // Update
  }
}}
\`\`\`

### 4. Combined Guard
All three checks together:

\`\`\`typescript
onCheckedChange={(checked) => {
  if (
    isMountedRef.current &&           // 1. After mount
    !isUpdatingAgentModeRef.current && // 2. Not updating
    checked !== agentModeRef.current   // 3. Value changed
  ) {
    isUpdatingAgentModeRef.current = true
    try {
      onAgentModeChange(checked)
      agentModeRef.current = checked
    } finally {
      setTimeout(() => {
        isUpdatingAgentModeRef.current = false
      }, 0)
    }
  }
}}
\`\`\`

## Implementation

**File**: `components/chat/enhanced-chat-input.tsx`

### Refs Added:
- `isMountedRef` - Tracks if component is mounted
- `isUpdatingAgentModeRef` - Prevents recursive agent mode updates
- `isUpdatingRealtimeModeRef` - Prevents recursive realtime mode updates
- `agentModeRef` - Stores current agent mode value
- `realtimeModeRef` - Stores current realtime mode value

### Effects Added:
- Mount effect: Sets `isMountedRef.current = true` after first render
- Sync effects: Keep refs in sync with props (without triggering callbacks)

## Why This Works

1. **Mount Check**: Prevents Radix's initialization calls from triggering updates
2. **Update Flag**: Prevents recursive calls if Radix calls callback multiple times
3. **Value Check**: Only updates when value actually changes
4. **Ref Storage**: Uses refs to track values without causing re-renders

## Testing

After this fix:
- ✅ Switch toggles work without infinite loops
- ✅ No "Maximum update depth exceeded" errors
- ✅ State updates only occur on actual user interaction
- ✅ Radix initialization doesn't trigger state updates

## Alternative Approaches Considered

1. **Uncontrolled Mode**: Using `defaultChecked` instead of `checked`
   - ❌ Rejected: Need controlled mode for state management

2. **Debouncing**: Adding delay to callbacks
   - ❌ Rejected: Would delay user feedback

3. **Key Prop**: Force remount on prop change
   - ❌ Rejected: Would lose focus and cause flicker

4. **Event Prevention**: Stop propagation
   - ❌ Rejected: Doesn't prevent Radix's internal calls

## Best Practice

For Radix UI controlled components:
1. Always track mount status with `useRef`
2. Use update flags to prevent recursion
3. Store prop values in refs for comparison
4. Only process callbacks after mount and when not updating
