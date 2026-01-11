# Seed Data Quick Reference Guide

**Date**: 2026-02-15  
**Quick guide to where seed data appears in the KINK IT app**

---

## Navigation Map

### Sidebar → Module → Seed Data Display

**Dashboard** (`/`)
- Stats cards (tasks, points, rules, boundaries)
- Activity feed (recent completions, check-ins, achievements)
- Task widgets (pending/today's tasks)

**Tasks** (`/tasks`)
- 8 example tasks (various statuses, priorities, proof types)
- Task cards with edit/delete buttons (Dominant)
- Proof examples (text and photo)

**Rewards** (`/rewards`)
- 5 example rewards (verbal, points, relational, achievement)
- Points balance card (220 points from seed data)
- Available rewards list

**Achievements** (`/achievements`)
- 4 unlocked achievements (task completions, streaks, points)
- Achievement gallery with progress tracking

**Bonds** (`/bonds` → `/bonds/[id]`)
- 1 example bond ("Simeon & Kevin's Dynamic")
- Bond overview with mission, members, statistics
- Tabs: Overview, Members, Activity, Settings, Analytics

**Rules & Protocols** (`/rules`)
- 8 example rules (standing, situational, temporary, protocol)
- Filter by category, assigned member
- Edit/delete buttons (Dominant only)

**Boundaries** (`/boundaries`)
- 15 example activities (impact, rope, sensation, power_exchange, roleplay)
- Rating badges (Yes/Maybe/No/Hard No)
- Compatibility view

**Contract & Consent** (`/contract`)
- 1 example covenant (Version 1.0)
- Full contract text with signatures
- Sign contract button

**Communication** (`/communication`)
- Messages tab: 3 example messages
- Check-ins tab: 4 example check-ins (Green/Yellow pattern)
- Conversation prompts (in database, used in chat)
- Scene debriefs (in database, accessed via forms)

**Journal** (`/journal`)
- 5 example entries (personal, shared, gratitude, scene_log)
- Filter by entry type
- Transparency default (personal visible to Dominant)

**Calendar** (`/calendar`)
- 5 example events (scene, ritual, task_deadline, check_in, milestone)
- Month view with event markers
- Selected date shows event list

**Analytics** (`/analytics`)
- Calculated stats from seed data:
  - Task completion rates
  - Points totals
  - Active rules count
  - Boundary exploration stats

**Library** (`/resources`)
- 7 example resources (articles, books, videos, guides, forums)
- Filter by category and type
- Rating stars and tags

---

## User Interactions

**View**: All seed data appears automatically in module pages

**Edit**: 
- Dominant: Can edit rules, tasks, rewards, contracts, calendar events
- Submissive: Can edit journal entries, boundaries, resources

**Delete**: Users can delete any seed data (becomes their own data)

**Create**: Users can add new items alongside seed data

---

## Role-Based Access

**Dominant Sees**:
- Partner's tasks (pending/completed)
- Partner's check-ins
- Partner's journal entries (transparency default)
- Partner's boundaries
- Partner's achievements
- Bond analytics

**Submissive Sees**:
- Assigned tasks
- Available rewards
- Their achievements
- Points balance
- Rules (read-only)
- Contracts (can sign)

---

## Cross-Module Connections

- **Tasks** → Rules (protocol-linked), Rewards (points), Achievements (unlocks), Calendar (deadlines)
- **Rules** → Contracts (referenced), Tasks (linked tasks)
- **Boundaries** → Contracts (limits section), Analytics (exploration stats)
- **Calendar** → Tasks (deadlines), Journal (scene logs), Contracts (review dates)
- **Journal** → Calendar (scene events), Communication (check-ins)
- **Rewards** → Tasks (completion rewards), Points ledger, Achievements
- **Analytics** → Aggregates all modules

---

## Quick Access

**From Dashboard**:
- Click module name in sidebar
- Or use Quick Actions buttons
- Or click module cards/widgets

**From Any Page**:
- Sidebar navigation always visible
- Click module name to navigate
- Breadcrumbs show current location

---

**Full Guide**: See `SEED_DATA_APP_USAGE_GUIDE.md` for detailed explanations
