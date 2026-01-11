# Terminal Widget Implementation

**Date**: 2026-01-31  
**Status**: Implementation Complete ✅

---

## Overview

Transformed the top-right Widget component (clock component) into a comprehensive Terminal-based UI with:
- **Kinky Kincade SVG Avatar** as the terminal AI assistant
- **Online Status Indicator** with illuminating ring that pulses when online
- **Comprehensive Profile Information** display
- **Context-Aware Content** based on user's dynamic role and bond status
- **Terminal UI** with typing animations

---

## Components Created

### 1. AvatarRing Component

**File**: `components/ui/avatar-ring.tsx`

**Features**:
- Illuminating ring that pulses when user is online
- Customizable colors (ring color, glow color)
- Online indicator dot
- Smooth animations using Framer Motion
- Responsive sizing

**Props**:
- `children`: Avatar content (Image, SVG, etc.)
- `isOnline`: Boolean for online status
- `size`: Avatar size in pixels (default: 48)
- `ringColor`: Ring color (default: green-500)
- `glowColor`: Glow color with opacity (default: green-500/50)
- `className`: Additional CSS classes

**Usage**:
\`\`\`tsx
<AvatarRing isOnline={true} size={48}>
  <Image src="/images/kinky/kinky-avatar.svg" />
</AvatarRing>
\`\`\`

### 2. useOnlineStatus Hook

**File**: `hooks/use-online-status.ts`

**Features**:
- Tracks online status using Supabase Realtime Presence
- Automatically sets presence when hook is active
- Cleans up presence on unmount
- Uses dedicated presence channel: `user:{userId}:presence`

**Returns**:
- `isOnline`: Boolean indicating online status
- `isLoading`: Boolean indicating if status is being fetched

**Usage**:
\`\`\`tsx
const { isOnline, isLoading } = useOnlineStatus({ userId: profile.id })
\`\`\`

### 3. TerminalWidget Component

**File**: `components/dashboard/widget/terminal-widget.tsx`

**Features**:
- Terminal-based UI using Magic UI Terminal component
- Kinky Kincade SVG avatar with online status ring
- Comprehensive profile information display:
  - User name
  - Dynamic role (dominant/submissive/switch) with color-coded badges
  - Bond status
  - Partner information (if in bond)
  - Submission state
- Time and date display with live updates
- Timezone and location display
- Context-aware greeting based on user role
- Customizable banner text (from profile)
- Terminal-style formatting with typing animations

**Profile Information Displayed**:
- User name (display_name or full_name)
- Dynamic role (with color-coded badge)
- Bond status (ACTIVE badge if in bond)
- Partner name (if partner exists)
- Submission state (active/low_energy/paused)
- Time and date (live updates)
- Timezone
- Location (if provided)
- Banner text (if set in profile)

**Context-Aware Features**:
- Role-specific greetings (dominant/submissive/switch)
- Role-appropriate terminology
- Color-coded role badges:
  - Dominant: destructive (red)
  - Submissive: default (blue)
  - Switch: secondary (purple)

---

## Integration

### Layout Update

**File**: `app/layout.tsx`

**Changes**:
- Replaced `Widget` import with `TerminalWidget`
- Updated component usage to `TerminalWidget`
- All existing props maintained (userName, timezone, profile)

---

## Online Status Implementation

### Realtime Presence Channel

**Channel Pattern**: `user:{userId}:presence`

**Configuration**:
- Private channel (requires authentication)
- Presence tracking enabled
- Key: User ID

**Presence Data**:
\`\`\`typescript
{
  online: true,
  last_seen: ISO8601 timestamp
}
\`\`\`

**Lifecycle**:
1. On mount: Subscribe to presence channel and set initial presence
2. On presence sync: Update online status based on presence state
3. On unmount: Untrack presence and unsubscribe

---

## Visual Design

### Terminal UI
- macOS-style window controls (red, yellow, green dots)
- Terminal-style formatting
- Monospace font for all text
- Typing animations for dynamic content
- Sequential display of information

### Avatar Ring
- Pulsing glow effect when online
- Green ring color for online status
- Gray ring when offline
- Online indicator dot (bottom-right)
- Smooth animations

### Color Scheme
- **Dominant**: Red badges (destructive variant)
- **Submissive**: Blue badges (default variant)
- **Switch**: Purple badges (secondary variant)
- **Online**: Green indicators
- **Offline**: Gray indicators

---

## Profile Information Display

### Always Shown
- Date and time (live updates)
- User name
- Greeting (context-aware)

### Conditional Display
- **Dynamic Role**: Only if user has a role set
- **Bond Status**: Only if user is in an active bond
- **Partner Info**: Only if partner exists and bond is active
- **Submission State**: Only if user has submission state set
- **Timezone**: Only if provided
- **Location**: Only if provided
- **Banner Text**: Only if set in profile (`banner_text` or `widget_banner_text`)

---

## Usage Example

\`\`\`tsx
import TerminalWidget from "@/components/dashboard/widget/terminal-widget"

<TerminalWidget
  userName="John Doe"
  timezone="America/New_York"
  location="New York, NY"
  profile={profile}
/>
\`\`\`

---

## Technical Details

### Dependencies
- `@/components/ui/terminal` - Terminal UI component
- `@/components/ui/avatar-ring` - Avatar with status ring
- `@/components/ui/marquee` - Scrolling banner text
- `@/hooks/use-online-status` - Online status tracking
- `@/lib/chat/context-aware-helpers` - Context-aware utilities
- `framer-motion` - Animations
- `next/image` - Image optimization

### Performance
- Presence tracking only active when component is mounted
- Automatic cleanup on unmount
- Efficient Realtime subscription management
- Live time updates with 1-second interval

---

## Future Enhancements (Optional)

1. **Click Actions**: Make avatar clickable to open chat with Kinky Kincade
2. **Status Messages**: Allow users to set custom status messages
3. **Activity Indicators**: Show recent activity (last task completed, etc.)
4. **Quick Actions**: Terminal commands for quick actions
5. **Theme Customization**: Allow users to customize terminal colors
6. **Partner Status**: Show partner's online status if in bond

---

## Notes

- Terminal Widget maintains all existing functionality
- Backward compatible with existing props
- Uses Realtime Presence for accurate online status
- Context-aware content adapts to user's role and relationship status
- Kinky Kincade avatar serves as the "terminal AI" persona
