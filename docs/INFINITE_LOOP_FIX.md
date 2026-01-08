# Infinite Loop Fix - Switch Component

## Problem

"Maximum update depth exceeded" error occurring at the Switch component in `enhanced-chat-input.tsx`. The error indicates that `setState` is being called repeatedly, causing infinite re-renders.

## Root Causes Identified

1. **Unnecessary State Updates**: Callbacks were updating state even when the value hadn't changed
2. **Radix Switch Behavior**: Radix UI Switch may call `onCheckedChange` during render/initialization
3. **Missing Value Guards**: No checks to prevent updates when value is unchanged
4. **Realtime Subscription Order**: Presence tracking attempted before channel subscription completes

## Fixes Applied

### 1. Added Guards in Callbacks

**File**: `components/chat/enhanced-ai-chat-interface.tsx`

```typescript
const handleAgentModeChange = useCallback((enabled: boolean) => {
  // Guard: Only update if value actually changed
  setConfig((prev) => {
    if (prev.agentMode === enabled) {
      return prev // No change, return same object to prevent re-render
    }
    return { ...prev, agentMode: enabled }
  })
}, [])

const handleRealtimeModeChange = useCallback((enabled: boolean) => {
  // Guard: Only update if value actually changed
  setRealtimeMode((prev) => {
    if (prev === enabled) {
      return prev // No change
    }
    return enabled
  })
}, [])
```

### 2. Added Guards in Switch Handlers

**File**: `components/chat/enhanced-chat-input.tsx`

```typescript
<Switch
  id="agent-mode"
  checked={agentMode}
  onCheckedChange={(checked) => {
    // Only call if value actually changed (prevent loops)
    if (checked !== agentMode) {
      onAgentModeChange(checked)
    }
  }}
  disabled={disabled || isStreaming}
/>
```

### 3. Enhanced Realtime Subscription Handling

**File**: `hooks/use-chat-stream.ts`

```typescript
.subscribe(async (status) => {
  if (status === "SUBSCRIBED") {
    console.log("✅ Realtime subscription active for conversation:", conversationId)
    // Channel is now subscribed, safe to use
  } else if (status === "CHANNEL_ERROR") {
    console.error("❌ Realtime channel error")
    onError?.("Realtime connection error")
  } else if (status === "TIMED_OUT") {
    console.warn("⚠️ Realtime subscription timed out")
  } else if (status === "CLOSED") {
    console.log("🔌 Realtime channel closed")
  }
})
```

### 4. Memoized Computed Values

**File**: `components/chat/enhanced-chat-input.tsx`

```typescript
// Memoize availableTools to prevent recreation on every render
const availableTools = useMemo(
  () => getAvailableTools(profile, hasNotionKey),
  [profile, hasNotionKey]
)

const enabledToolsCount = useMemo(() => {
  return selectedTools.filter((id) => {
    const tool = availableTools.find((t) => t.id === id)
    return tool && (tool.requiresNotionKey ? hasNotionKey : true)
  }).length
}, [selectedTools, availableTools, hasNotionKey])
```

## How the Guards Work

1. **Callback Guards**: Check if the new value is different from the current value before updating state
2. **Switch Handler Guards**: Check if the checked value differs from the prop before calling the callback
3. **State Update Guards**: Return the same object reference if no change occurred (prevents React from detecting a change)

## Realtime Presence Error

The error "tried to push 'presence' before joining" suggests that somewhere in the codebase, `channel.track()` is being called before `channel.subscribe()` completes. 

**Solution**: Ensure all presence tracking happens inside the `subscribe()` callback after `status === "SUBSCRIBED"`.

## Testing

After these fixes:
1. ✅ Switch toggles should work without infinite loops
2. ✅ State updates only occur when values actually change
3. ✅ Realtime subscriptions handle all status states properly
4. ✅ No unnecessary re-renders

## Prevention

To prevent similar issues in the future:
- Always add value guards in callbacks that update state
- Use `useCallback` for all event handlers passed to child components
- Use `useMemo` for computed values that are used as props
- Check if values have changed before updating state
- Ensure Realtime operations happen after subscription completes

