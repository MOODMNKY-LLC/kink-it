# Kinky Terminal & Sidebar Components Implementation Plan

**Date**: 2026-01-31  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: High

---

## 🎯 Overview

Transform the dashboard terminal into a unified "Kinky Terminal" component featuring the Kinky Kincade mascot, calendar integration, animated gradient text, and comprehensive Supabase Realtime integration. Additionally, create MVP implementations for all sidebar navigation components.

---

## 📋 Part 1: Unified Kinky Terminal Component

### Component Structure

**New Component**: `components/kinky/kinky-terminal.tsx`

**Features**:
- Unified terminal combining widget and notifications
- Kinky Kincade avatar prominently displayed
- Tabbed interface: Status | Notifications | Calendar
- Animated gradient text (orange-blue-green-teal)
- Supabase Realtime integration
- Terminal-style UI with macOS window controls

### Implementation Steps

#### Step 1: Create Base Terminal Component
- Merge `terminal-widget.tsx` and `terminal-notifications-realtime.tsx`
- Create tab system using shadcn Tabs component
- Integrate Kinky avatar from `/images/kinky/kinky-avatar.svg`
- Add terminal window controls (red/yellow/green dots)

#### Step 2: Add Calendar Tab
- Install shadcn calendar component (`calendar-22` or `calendar-24` for date/time)
- Create calendar view within terminal
- Integrate with existing date/time display
- Prepare for Notion calendar sync (future)

#### Step 3: Gradient Text Implementation
- Use Magic UI `animated-gradient-text` component
- Colors: 
  - From: `oklch(0.70 0.20 30)` (orange-red accent)
  - Via: `oklch(0.70 0.20 220)` (cyan-blue primary)
  - To: `oklch(0.7 0.18 155)` (green-teal success)
- Apply to terminal text output
- Contextual animation (flowing for status, pulsing for notifications)

#### Step 4: Supabase Realtime Integration
- Enhance existing Realtime subscription
- Add real-time calendar updates (future)
- Real-time status updates
- Connection status indicator

#### Step 5: Styling & Theming
- Apply gradient theme throughout terminal
- Terminal-style monospace font
- macOS window aesthetic
- Responsive design

---

## 📅 Part 2: Calendar Component

### Separate Calendar Component

**New Component**: `components/calendar/kinky-calendar.tsx`

**Features**:
- Full calendar view (separate from terminal)
- Notion calendar sync preparation
- Event management
- Date selection
- Integration with terminal calendar tab

**Implementation**:
- Use shadcn calendar component
- Create event management interface
- Prepare database schema for calendar events
- Design Notion sync architecture

---

## 🎨 Part 3: Gradient Text System

### Gradient Color Palette

```css
/* Terminal Gradient Colors */
--gradient-from: oklch(0.70 0.20 30);   /* Orange-red accent */
--gradient-via: oklch(0.70 0.20 220);   /* Cyan-blue primary */
--gradient-to: oklch(0.7 0.18 155);     /* Green-teal success */
```

### Implementation Strategy

1. **Status Text**: Flowing gradient animation
2. **Notification Text**: Pulsing gradient animation
3. **Command Prompts**: Static gradient with subtle shimmer
4. **Terminal Output**: Contextual gradient based on content type

### Components to Use

- Magic UI `animated-gradient-text` for flowing animations
- Magic UI `aurora-text` for pulsing effects
- Custom CSS gradients for static text

---

## 📱 Part 4: Sidebar Component MVPs

### Component Analysis & MVP Plans

#### 1. Rules & Protocols (`/rules`)
**Current**: Placeholder with feature descriptions  
**MVP Requirements**:
- Rules list view
- Create/edit/delete rules
- Rule categories (standing, situational, temporary)
- Link to tasks
- Basic filtering

**Database Schema Needed**:
- `rules` table with: id, user_id, bond_id, title, description, type, category, status, created_at, updated_at

#### 2. Boundaries (`/boundaries`)
**Current**: Placeholder with feature descriptions  
**MVP Requirements**:
- Activity list with categories
- Yes/No/Maybe/Hard No ratings
- Experience level tracking
- Compatibility view (if in bond)
- Basic search/filter

**Database Schema Needed**:
- `boundaries` table with: id, user_id, activity_id, rating, experience_level, notes, created_at
- `activities` reference table (or use existing kink_interests)

#### 3. Contract & Consent (`/contract`)
**Current**: Placeholder with feature descriptions  
**MVP Requirements**:
- Contract creation form
- Version history view
- Digital signature interface
- Consent log entries
- Safewords reference

**Database Schema Needed**:
- `contracts` table with: id, bond_id, version, content, status, created_at, signed_at
- `contract_signatures` table
- `consent_log` table

#### 4. Communication (`/communication`)
**Current**: Placeholder  
**MVP Requirements**:
- Communication log
- Message templates
- Scheduled messages
- Communication preferences

**Database Schema Needed**:
- `communications` table with: id, bond_id, sender_id, recipient_id, type, content, scheduled_at, sent_at

#### 5. Journal (`/journal`)
**Current**: Placeholder  
**MVP Requirements**:
- Journal entry creation
- Entry list with dates
- Basic rich text editor
- Tags/categories
- Search functionality

**Database Schema Needed**:
- `journal_entries` table with: id, user_id, title, content, tags, mood, created_at, updated_at

#### 6. Analytics (`/analytics`)
**Current**: Has some lib functions, placeholder page  
**MVP Requirements**:
- Dashboard stats display
- Task completion trends
- Partner ranking (if in bond)
- Basic charts/graphs

**Enhancement**: Use existing `lib/analytics/` functions

#### 7. Library/Resources (`/resources`)
**Current**: Placeholder  
**MVP Requirements**:
- Resource list view
- Categories (articles, guides, videos, etc.)
- Bookmarking
- Search functionality

**Database Schema Needed**:
- `resources` table with: id, title, type, url, description, category, tags

#### 8. Guides (`/guides`)
**Current**: Placeholder  
**MVP Requirements**:
- Guide list view
- Categories
- Reading progress tracking
- Favorites

**Database Schema Needed**:
- `guides` table with: id, title, content, category, difficulty_level, estimated_time

---

## 🗄️ Database Migrations Required

### Priority 1 (Terminal & Calendar)
- None (using existing tables)

### Priority 2 (Sidebar MVPs)
1. `rules` table migration
2. `boundaries` table migration
3. `contracts` and related tables migration
4. `communications` table migration
5. `journal_entries` table migration
6. `resources` table migration
7. `guides` table migration

---

## 📦 Dependencies to Install

```bash
# shadcn components
npx shadcn@latest add calendar
npx shadcn@latest add tabs

# Magic UI components (if not already installed)
npx shadcn@latest add "https://magicui.design/r/animated-gradient-text.json"
npx shadcn@latest add "https://magicui.design/r/aurora-text.json"
```

---

## 🎯 Implementation Priority

### Phase 1: Terminal Component (Week 1)
1. ✅ Create unified kinky-terminal component
2. ✅ Add tab system
3. ✅ Integrate Kinky avatar
4. ✅ Add calendar tab
5. ✅ Implement gradient text
6. ✅ Enhance Realtime integration

### Phase 2: Calendar Component (Week 1-2)
1. ✅ Create separate calendar component
2. ✅ Design database schema
3. ✅ Build event management UI
4. ⏳ Prepare Notion sync architecture

### Phase 3: Sidebar MVPs (Week 2-4)
1. Rules & Protocols MVP
2. Boundaries MVP
3. Contract & Consent MVP
4. Communication MVP
5. Journal MVP
6. Analytics enhancement
7. Library/Resources MVP
8. Guides MVP

---

## 🎨 Design Specifications

### Terminal Window
- macOS-style window controls (red/yellow/green)
- Terminal monospace font
- Dark background with subtle gradient overlay
- Kinky avatar in header (48x72px)
- Tab navigation at top
- Scrollable content area
- Terminal prompt styling

### Gradient Text
- Flowing animation for status updates
- Pulsing animation for notifications
- Static gradient for prompts
- Contextual colors based on content type

### Calendar Integration
- Month view in terminal tab
- Full calendar view in separate component
- Date selection integration
- Event indicators

---

## 🔗 Related Files

### Components to Create
- `components/kinky/kinky-terminal.tsx`
- `components/calendar/kinky-calendar.tsx`
- `components/calendar/calendar-tab.tsx`
- `components/ui/gradient-text.tsx` (wrapper component)

### Components to Update
- `components/dashboard/sidebar/sidebar-notifications.tsx` (use new terminal)
- `components/dashboard/widget/terminal-widget.tsx` (deprecate, merge into kinky-terminal)

### Pages to Enhance
- `app/rules/page.tsx`
- `app/boundaries/page.tsx`
- `app/contract/page.tsx`
- `app/communication/page.tsx`
- `app/journal/page.tsx`
- `app/analytics/page.tsx`
- `app/resources/page.tsx`
- `app/guides/page.tsx`

---

## 📝 Notes

- Terminal should feel like Kinky Kincade is actively engaging with the user
- Gradient animations should be subtle and not distracting
- Calendar sync with Notion is future work but architecture should support it
- All sidebar MVPs should be extensible for future enhancements
- Maintain backward compatibility during transition

---

## ✅ Success Criteria

- [ ] Unified terminal component replaces both existing terminals
- [ ] Calendar tab functional in terminal
- [ ] Separate calendar component created
- [ ] Gradient text applied throughout terminal
- [ ] Supabase Realtime fully integrated
- [ ] All 8 sidebar components have MVP implementations
- [ ] Database migrations created for sidebar components
- [ ] All components responsive and accessible
- [ ] Gradient theme consistent across app

