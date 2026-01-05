# KINK IT - Product Requirements Document (Full Vision)

**Version**: 1.0  
**Date**: 2026-01-05  
**Status**: Comprehensive Vision Document  
**Last Updated**: 2026-01-05

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [App Overview & Objectives](#app-overview--objectives)
3. [Target Audience](#target-audience)
4. [Core Features & Functionality](#core-features--functionality)
5. [Technical Stack & Architecture](#technical-stack--architecture)
6. [Data Model](#data-model)
7. [UI/UX Design Principles](#uiux-design-principles)
8. [Security & Consent Mechanisms](#security--consent-mechanisms)
9. [Development Phases & Milestones](#development-phases--milestones)
10. [Integration Points](#integration-points)
11. [Potential Challenges & Solutions](#potential-challenges--solutions)
12. [Future Expansion Possibilities](#future-expansion-possibilities)
13. [Success Metrics](#success-metrics)
14. [Non-Negotiable Design Principles](#non-negotiable-design-principles)

---

## Executive Summary

**KINK IT** is a comprehensive relationship management application designed specifically for Dominant/submissive (D/s) partnerships. The app supports structure, routine, consent management, and communication while preserving human authority and never replacing the Dominant's decision-making power.

**Core Value Proposition**: A tool that helps Dominants lead intentionally and submissives serve consistently, with built-in safety mechanisms, consent boundaries, and relationship growth tools—all while maintaining that software supports relationships, never replaces them.

**Key Differentiators**:
- Consent-first design with explicit safety mechanisms
- Authority-preserving architecture (app never acts instead of Dominant)
- Self-declared submission states with automatic boundary enforcement
- Comprehensive relationship tools (12 integrated modules)
- Real-time synchronization for both partners
- Privacy-focused with full transparency to Dominant by default

---

## App Overview & Objectives

### Primary Objectives

1. **Support Structure & Routine**: Enable predictable, consistent routines that reduce anxiety and increase focus for submissives, while allowing Dominants to manage expectations clearly.

2. **Preserve Human Authority**: The app remembers, surfaces, structures, and reflects—but the Dominant decides, commands, rewards, and disciplines. Software never replaces human authority.

3. **Ensure Safety & Consent**: Built-in pause play mechanisms, boundary enforcement, consent tracking, and emotional check-ins protect both partners.

4. **Facilitate Communication**: Reduce friction in D/s communication while maintaining appropriate hierarchy and tone.

5. **Support Relationship Growth**: Tools for exploring boundaries, tracking progress, documenting scenes, and reflecting on the dynamic.

6. **Enable Intentional Dominance**: Provide Dominants with tools to explore and lean into their controlling energy intentionally and consciously.

### Success Criteria

**For Submissives (Kevin's Perspective)**:
- App feels supportive, not controlling
- Easier to use than not using it
- Never feels like being put on autopilot and forgotten
- Obvious that they're obeying their Dominant, not software
- Quick idea capture without disrupting the dynamic

**For Dominants (Simeon's Perspective)**:
- Makes their work easier
- Provides tools, memory, structure, and ideas
- Allows exploration of Dominant/controlling energy
- Never replaces their authority or decision-making
- Clear visibility into submissive's state and needs

**For the Relationship**:
- Supports devotion without pressure
- Maintains trust and intentional authority
- Preserves consent and safety
- Evolves with the relationship, not ahead of it

---

## Target Audience

### Primary Users

#### 1. Dominant Partner (Simeon - Primary User)
**Role**: Architect, decision-maker, primary interface user

**Needs**:
- Expressive, reflective interface
- Place to practice dominance intentionally
- Dashboard with full visibility
- Task assignment and management
- Feedback authoring (with AI drafting support)
- Idea curation and roadmap management
- Tools to explore Dominant/controlling energy

**Interface Characteristics**:
- Feature-rich, comprehensive
- Supports complex workflows
- Allows exploration and experimentation
- Provides suggestions but never auto-acts

#### 2. Submissive Partner (Kevin - Secondary User)
**Role**: Lived-experience expert, co-designer, secondary interface user

**Needs**:
- Simpler, quieter, deferential interface
- Quick idea capture (before forgetting)
- State declaration (Active/Low-Energy/Paused)
- Task completion (without excessive prompting)
- Clear instructions when in low-energy mode
- Transparency to Dominant (no hidden thoughts)

**Interface Characteristics**:
- Minimal cognitive load
- Clear, direct instructions
- No nudging or confirmation loops
- Respectful of the power dynamic

### Future Users

#### 3. Multi-Partner Dynamics (Future)
- Polyamorous D/s relationships
- Multiple submissives per Dominant
- Separate profiles, contracts, task lists, analytics per relationship
- Cross-relationship insights (optional)

---

## Core Features & Functionality

### Module 1: Dashboard

**Purpose**: Central hub providing at-a-glance overview of relationship status, active tasks, points balance, mood tracker, upcoming scenes, activity feed, quick actions, and relationship stats.

**Core Functionality**:

**For Dominant**:
- Overview of submissive's current submission state (Active/Low-Energy/Paused)
- Active tasks requiring attention or review
- Pending check-ins or communications
- Recent activity feed (task completions, state changes, journal entries)
- Quick actions (create task, send message, schedule scene)
- Relationship metrics (completion rates, consistency trends)
- Points balance and reward history
- Upcoming scenes and important dates

**For Submissive**:
- Current submission state display with quick change option
- Today's tasks (filtered by state)
- Points balance
- Recent acknowledgments or feedback
- Quick actions (complete task, log idea, request check-in)
- Upcoming scenes or important dates

**Data Requirements**:
- Real-time aggregation from tasks, check-ins, journal entries, calendar
- Cached metrics for performance
- Realtime subscriptions for live updates

**Acceptance Criteria**:
- [ ] Role-based views render correctly (Dominant vs Submissive)
- [ ] Submission state is prominently displayed and updatable (submissive only)
- [ ] All widgets load within 2 seconds
- [ ] Real-time updates appear without page refresh
- [ ] Quick actions are accessible within 1 click
- [ ] Metrics are accurate and up-to-date

**Technical Considerations**:
- Use Supabase Realtime for live updates
- Implement server-side aggregation for metrics
- Cache frequently accessed data
- Optimize queries with proper indexes
- Consider pagination for activity feeds

---

### Module 2: Task Management (Protocol Engine)

**Purpose**: Comprehensive task system supporting routine tasks, one-time assignments, proof requirements, templates, and submissive-side completion flows.

**Core Functionality**:

**Task Creation (Dominant)**:
- Create tasks with title, description, priority, due date/time
- Set acceptance criteria
- Assign point values
- Require proof (photo, video, text note)
- Create from templates
- Bulk creation for recurring tasks
- Set reminders and notifications
- Link to rules/protocols

**Task Completion (Submissive)**:
- View assigned tasks (filtered by submission state)
- Mark as complete with optional notes
- Submit proof (photo/video upload)
- Request extensions (with reason)
- View completion history

**Task Management (Dominant)**:
- Review completions and proof
- Approve or request revisions
- Acknowledge completion (with feedback)
- Adjust due dates
- Reassign or cancel tasks
- View completion statistics

**Task Types**:
- **Routine Tasks**: Daily/weekly recurring (morning routine, bedtime ritual)
- **One-Time Tasks**: Specific assignments
- **Protocol Tasks**: Linked to rules/protocols
- **Temporary Tasks**: For low-energy days or special circumstances

**Data Requirements**:
- `tasks` table: id, workspace_id, title, description, priority, status, due_date, point_value, proof_required, proof_type, template_id, rule_id, assigned_by, assigned_to, completed_at, approved_at, created_at, updated_at
- `task_proof` table: id, task_id, proof_type, proof_url, proof_text, submitted_at
- `task_templates` table: id, title, description, default_priority, default_point_value, proof_required, created_by, created_at
- `task_completion_notes` table: id, task_id, note_text, created_by, created_at

**Acceptance Criteria**:
- [ ] Tasks respect submission state (no assignments when paused)
- [ ] Dominant can create tasks with all required fields
- [ ] Submissive can view and complete assigned tasks
- [ ] Proof uploads work reliably (photo/video/text)
- [ ] Completion acknowledgments maintain D/s framing
- [ ] Templates can be created and reused
- [ ] Bulk creation works for recurring tasks
- [ ] Reminders are sent at correct times
- [ ] Task history is preserved and searchable

**Technical Considerations**:
- Use Supabase Storage for proof files (photos/videos)
- Implement file size limits and type validation
- Use Realtime for instant task updates
- Consider task queues for bulk operations
- Implement soft deletes for task history
- Use database triggers for status updates

---

### Module 3: Rewards & Recognition

**Purpose**: Meaning-first positive reinforcement system with points as secondary tracking layer, structured around love languages and meaningful acknowledgment.

**Core Functionality**:

**Reward Types**:
- **Verbal Acknowledgment**: Thoughtful feedback that reinforces hierarchy
- **Points**: Secondary tracking layer (not primary motivator)
- **Relational Rewards**: Symbolic expressions of submission (e.g., kissing feet, drinking piss)
- **Achievements**: Milestones and consistency streaks
- **Punishment Alternatives**: Structured consequences that aren't punitive

**Reward Assignment (Dominant)**:
- Assign points for task completion
- Create custom rewards
- Acknowledge effort (not just success)
- Structure rewards around love languages
- View reward history and trends

**Reward Viewing (Submissive)**:
- View points balance
- See recent acknowledgments
- Track achievements
- View reward history

**Love Languages Integration**:
- Map rewards to partner's love languages
- Suggest reward types based on preferences
- Track which reward types are most meaningful

**Data Requirements**:
- `rewards` table: id, workspace_id, reward_type, title, description, point_value, love_language, assigned_by, assigned_to, task_id (optional), created_at
- `points_ledger` table: id, workspace_id, user_id, points, reason, source_type, source_id, created_at
- `achievements` table: id, workspace_id, user_id, achievement_type, title, description, unlocked_at
- `reward_templates` table: id, title, description, reward_type, love_language, point_value, created_by

**Acceptance Criteria**:
- [ ] Points are tracked accurately
- [ ] Rewards can be assigned manually by Dominant
- [ ] Acknowledgment feedback maintains D/s framing
- [ ] Love languages are integrated into reward suggestions
- [ ] Achievements unlock automatically based on criteria
- [ ] Reward history is searchable and filterable
- [ ] Points balance updates in real-time

**Technical Considerations**:
- Use database transactions for points ledger
- Implement achievement triggers based on task completion patterns
- Consider caching points balance for performance
- Use Realtime for instant reward notifications
- Implement reward templates for common acknowledgments

---

### Module 4: Rules & Protocols Management

**Purpose**: Manage standing rules, situational protocols, temporary expectations, and protocol templates (morning routine, bedtime, greetings, etc.).

**Core Functionality**:

**Rule Types**:
- **Standing Rules**: Always-active expectations
- **Situational Rules**: Context-specific (e.g., "when guests are present")
- **Temporary Rules**: Time-limited expectations
- **Optional Rules**: Can be activated/deactivated

**Rule Components**:
- Title and description
- Context (when/where it applies)
- Consequence (what happens if violated)
- Linked tasks or protocols
- Version history
- Active/inactive status

**Protocol Templates**:
- Morning routine
- Bedtime ritual
- Greeting protocols
- Scene preparation
- Aftercare protocols
- Custom templates

**Rule Management (Dominant)**:
- Create, edit, deactivate rules
- Create protocol templates
- Link rules to tasks
- View violation history
- Review and update rules periodically

**Rule Viewing (Submissive)**:
- View active rules
- Filter by type or context
- See linked tasks
- View rule history

**Violation Tracking**:
- Log rule violations
- Record context and circumstances
- Link to discipline or correction
- Track patterns over time

**Data Requirements**:
- `rules` table: id, workspace_id, title, description, rule_type, context, consequence, active, linked_task_id, created_by, created_at, updated_at, deactivated_at
- `rule_versions` table: id, rule_id, version_number, title, description, rule_type, context, consequence, created_at
- `protocol_templates` table: id, workspace_id, title, description, template_type, steps (jsonb), created_by, created_at
- `rule_violations` table: id, rule_id, workspace_id, user_id, context, notes, discipline_id (optional), created_at
- `rule_acknowledgments` table: id, rule_id, user_id, acknowledged_at

**Acceptance Criteria**:
- [ ] Rules can be created with all required fields
- [ ] Protocol templates can be created and reused
- [ ] Rules respect submission state (no enforcement when paused)
- [ ] Violations can be logged and tracked
- [ ] Rule version history is preserved
- [ ] Rules can be linked to tasks
- [ ] Submissive can view active rules
- [ ] Rule updates require acknowledgment

**Technical Considerations**:
- Use JSONB for protocol template steps
- Implement soft deletes for rule history
- Use database triggers for version tracking
- Consider rule inheritance for protocol templates
- Implement rule activation/deactivation scheduling

---

### Module 5: Kink Exploration & Boundaries

**Purpose**: Comprehensive activity list with Yes/No/Maybe ratings, experience levels, mutual visibility, and compatibility discovery.

**Core Functionality**:

**Activity Management**:
- Comprehensive kink/activity list
- Categorization (BDSM activities, roleplay scenarios, etc.)
- Personal ratings: Yes / Maybe / No / Hard No
- Experience level tracking
- Last discussed date
- Notes and context

**Boundary Discovery**:
- Mutual visibility (see partner's ratings)
- Compatibility overlap identification
- "Curious together" activities
- Hard limits enforcement (never suggested)
- Soft limits (discuss before)

**Boundary Updates**:
- Update ratings over time
- Add notes or context
- Request discussion on specific activities
- Track boundary evolution

**Data Requirements**:
- `activities` table: id, name, category, description, created_at
- `user_activity_ratings` table: id, user_id, activity_id, rating, experience_level, notes, last_discussed, created_at, updated_at
- `activity_categories` table: id, name, description, parent_category_id
- `boundary_discussions` table: id, workspace_id, activity_id, initiated_by, discussion_notes, outcome, created_at

**Acceptance Criteria**:
- [ ] Activities can be rated with Yes/Maybe/No/Hard No
- [ ] Partner's ratings are visible (mutual visibility)
- [ ] Compatibility overlap is calculated and displayed
- [ ] Hard limits are never suggested in task/rule creation
- [ ] Soft limits trigger discussion prompts
- [ ] Boundary updates are tracked over time
- [ ] Activity list is comprehensive and searchable

**Technical Considerations**:
- Use enum types for ratings
- Implement efficient compatibility calculation
- Cache activity list for performance
- Use Realtime for boundary update notifications
- Consider activity suggestions based on compatibility

---

### Module 6: Contract & Consent Management

**Purpose**: Version-controlled relationship contracts (Covenants) with signatures, renewal reminders, amendment proposals, consent history, and safety tools.

**Core Functionality**:

**Contract Creation & Management**:
- Create relationship contracts (Covenants)
- Version control with history
- Digital signatures
- Renewal reminders
- Amendment proposals
- Approval workflow

**Consent Tracking**:
- Consent history/audit trail
- Pre-scene negotiation checklists
- Safewords/signals reference cards
- Aftercare agreements
- Consent withdrawal tracking

**Safety Tools**:
- Safeword registry
- Signal reference cards
- Emergency contact information
- Scene negotiation templates
- Aftercare checklists

**Data Requirements**:
- `contracts` table: id, workspace_id, title, content (text), version_number, status, created_by, created_at, signed_at, expires_at
- `contract_signatures` table: id, contract_id, user_id, signature_data, signed_at
- `contract_amendments` table: id, contract_id, proposed_by, amendment_text, status, approved_at, created_at
- `consent_records` table: id, workspace_id, activity_id, consented_by, consent_type, context, withdrawn_at, created_at
- `safewords` table: id, workspace_id, word, signal_type, description, created_by, created_at
- `scene_negotiations` table: id, workspace_id, scene_id, negotiation_checklist (jsonb), agreed_by, created_at

**Acceptance Criteria**:
- [ ] Contracts can be created and versioned
- [ ] Digital signatures are captured and stored
- [ ] Renewal reminders are sent before expiration
- [ ] Amendment proposals require approval workflow
- [ ] Consent records are tracked and searchable
- [ ] Safewords are easily accessible
- [ ] Scene negotiation checklists can be completed
- [ ] Consent withdrawal is immediately logged

**Technical Considerations**:
- Use version control pattern for contracts
- Implement digital signature validation
- Use scheduled jobs for renewal reminders
- Store consent records immutably
- Consider encryption for sensitive consent data
- Use Realtime for contract update notifications

---

### Module 7: Communication Hub

**Purpose**: Private messaging, daily check-ins (Green/Yellow/Red), prompted conversations, and scene debrief forms.

**Core Functionality**:

**Private Messaging**:
- Direct messages between partners
- Message threading
- Read receipts
- Message search
- Attachment support

**Daily Check-Ins**:
- Green/Yellow/Red status system
- Optional notes
- Check-in history
- Pattern tracking
- Alerts for consecutive Yellow/Red days

**Prompted Conversations**:
- Pre-written conversation starters
- Scheduled check-in prompts
- Reflection prompts
- Relationship growth questions

**Scene Debrief Forms**:
- Structured debrief after scenes
- What went well / what didn't
- Emotional state tracking
- Aftercare needs
- Future adjustments

**Data Requirements**:
- `messages` table: id, workspace_id, from_user_id, to_user_id, content, read_at, created_at
- `message_attachments` table: id, message_id, attachment_type, attachment_url, created_at
- `check_ins` table: id, workspace_id, user_id, status, notes, created_at
- `conversation_prompts` table: id, prompt_text, prompt_type, category, created_by, created_at
- `scene_debriefs` table: id, workspace_id, scene_id, debrief_form (jsonb), submitted_by, created_at

**Acceptance Criteria**:
- [ ] Messages are delivered in real-time
- [ ] Check-ins can be submitted with Green/Yellow/Red status
- [ ] Check-in patterns are tracked and displayed
- [ ] Conversation prompts are available and relevant
- [ ] Scene debrief forms can be completed
- [ ] All communication respects submission state
- [ ] Messages are searchable and filterable

**Technical Considerations**:
- Use Supabase Realtime for instant messaging
- Implement message encryption for privacy
- Use scheduled jobs for check-in reminders
- Cache conversation prompts for performance
- Consider message rate limiting
- Use Realtime for check-in notifications

---

### Module 8: Journal & Reflection

**Purpose**: Personal and shared journal entries, tags, prompted entries, gratitude logs, and scene logs with structured metadata.

**Core Functionality**:

**Journal Types**:
- **Personal Journal**: Private to writer (but visible to Dominant by default)
- **Shared Journal**: Visible to both partners
- **Gratitude Log**: Daily gratitude entries
- **Scene Logs**: Structured scene documentation

**Journal Features**:
- Rich text editing
- Tags and categorization
- Search and filtering
- Entry templates
- Prompted entries
- Entry sharing (personal → shared)

**Scene Logs**:
- Date, time, duration
- Participants
- Activities performed
- Consent details
- Aftercare provided
- Emotional state
- What went well / improvements
- Photos (optional, with consent)

**Data Requirements**:
- `journal_entries` table: id, workspace_id, user_id, entry_type, title, content, tags, is_shared, created_at, updated_at
- `journal_tags` table: id, name, color, created_by
- `gratitude_entries` table: id, workspace_id, user_id, gratitude_text, created_at
- `scene_logs` table: id, workspace_id, scene_date, duration_minutes, activities (jsonb), consent_details, aftercare_provided, emotional_state, notes, photos (jsonb), created_by, created_at

**Acceptance Criteria**:
- [ ] Journal entries can be created with rich text
- [ ] Tags can be created and applied
- [ ] Personal entries are visible to Dominant by default
- [ ] Entries can be shared or kept private
- [ ] Scene logs capture all required metadata
- [ ] Gratitude entries can be logged daily
- [ ] Journal entries are searchable and filterable
- [ ] Entry templates can be created and reused

**Technical Considerations**:
- Use rich text editor (e.g., TipTap, Slate)
- Implement efficient tag search
- Use Supabase Storage for scene photos
- Consider entry encryption for sensitive content
- Use Realtime for shared entry notifications
- Implement entry versioning for edits

---

### Module 9: Calendar & Scheduling

**Purpose**: Scenes calendar, task timeline, important dates, ritual reminders, and optional personal calendar integration.

**Core Functionality**:

**Scene Scheduling**:
- Create scene events
- Set date, time, duration
- Link to scene negotiation
- Set reminders
- Mark as completed
- Link to scene log

**Task Timeline**:
- Visual timeline of tasks
- Due date tracking
- Completion tracking
- Overdue alerts

**Important Dates**:
- Relationship milestones
- Contract renewal dates
- Scheduled check-ins
- Custom important dates
- Reminders

**Ritual Reminders**:
- Daily ritual reminders
- Weekly ritual reminders
- Custom ritual schedules
- Reminder notifications

**Calendar Integration** (Optional):
- Google Calendar sync
- iCal export
- Outlook integration

**Data Requirements**:
- `calendar_events` table: id, workspace_id, event_type, title, description, start_date, end_date, all_day, reminder_minutes, completed, created_by, created_at
- `important_dates` table: id, workspace_id, date, title, description, recurring, reminder_days_before, created_by, created_at
- `ritual_schedules` table: id, workspace_id, ritual_name, schedule_type, schedule_config (jsonb), reminder_minutes, active, created_by, created_at

**Acceptance Criteria**:
- [ ] Scene events can be created and scheduled
- [ ] Task timeline displays tasks with due dates
- [ ] Important dates are tracked and reminders sent
- [ ] Ritual reminders are sent at correct times
- [ ] Calendar events respect submission state
- [ ] Calendar integration works (if enabled)
- [ ] Events can be edited and deleted
- [ ] Reminders are sent reliably

**Technical Considerations**:
- Use scheduled jobs for reminders
- Implement calendar sync with external providers
- Use Realtime for calendar update notifications
- Consider timezone handling
- Implement event conflict detection
- Cache calendar data for performance

---

### Module 10: Progress & Analytics

**Purpose**: Completion rates, point trends, mood trends, heatmaps, relationship metrics, and reports.

**Core Functionality**:

**Task Analytics**:
- Completion rate (overall, by category, by time period)
- On-time completion rate
- Average completion time
- Task completion heatmap
- Streak tracking

**Points Analytics**:
- Points earned over time
- Points by category
- Reward frequency
- Achievement unlocks

**Mood & Check-In Analytics**:
- Check-in status trends
- Green/Yellow/Red patterns
- Mood correlation with tasks
- Emotional state over time

**Relationship Metrics**:
- Communication frequency
- Scene frequency
- Boundary exploration rate
- Contract adherence
- Overall relationship health score

**Reports**:
- Weekly summary reports
- Monthly relationship reports
- Custom date range reports
- Exportable reports (PDF, CSV)

**Data Requirements**:
- `analytics_cache` table: id, workspace_id, metric_type, metric_name, metric_value, date, created_at
- `reports` table: id, workspace_id, report_type, date_range_start, date_range_end, report_data (jsonb), generated_by, created_at

**Acceptance Criteria**:
- [ ] Analytics are calculated accurately
- [ ] Charts and graphs render correctly
- [ ] Reports can be generated on-demand
- [ ] Reports can be exported (PDF, CSV)
- [ ] Analytics respect privacy settings
- [ ] Historical data is preserved
- [ ] Analytics update in real-time (where applicable)

**Technical Considerations**:
- Use materialized views for complex analytics
- Implement caching for expensive calculations
- Use charting library (e.g., Recharts, Chart.js)
- Consider data aggregation jobs
- Implement report generation queue
- Use Realtime for live metric updates

---

### Module 11: Resource Library

**Purpose**: Educational content, bookmarked resources, how-to guides, community links, and curated content.

**Core Functionality**:

**Resource Types**:
- Articles and blog posts
- How-to guides
- Video tutorials
- Community forums
- Book recommendations
- Podcast episodes
- External links

**Resource Management**:
- Add resources (Dominant)
- Categorize resources
- Tag resources
- Bookmark favorites
- Share resources with partner
- Rate resources
- Add notes

**Resource Discovery**:
- Browse by category
- Search resources
- Filter by type
- Sort by rating or date
- Recommended resources

**Data Requirements**:
- `resources` table: id, workspace_id, title, description, resource_type, url, category, tags, rating, added_by, created_at
- `resource_bookmarks` table: id, user_id, resource_id, notes, created_at
- `resource_categories` table: id, name, description, parent_category_id
- `resource_ratings` table: id, user_id, resource_id, rating, review_text, created_at

**Acceptance Criteria**:
- [ ] Resources can be added with all required fields
- [ ] Resources can be categorized and tagged
- [ ] Resources can be bookmarked
- [ ] Resources can be searched and filtered
- [ ] Resources can be rated and reviewed
- [ ] Resource library is accessible to both partners
- [ ] External links open securely

**Technical Considerations**:
- Implement link preview generation
- Use full-text search for resource content
- Consider resource recommendation algorithm
- Implement resource moderation (if needed)
- Cache resource metadata for performance
- Use Realtime for new resource notifications

---

### Module 12: Multi-Partner Support

**Purpose**: Future-facing module for polyamorous D/s relationships, multiple submissives per Dominant, separate profiles, contracts, task lists, and analytics per relationship.

**Core Functionality**:

**Multi-Relationship Management**:
- Create multiple relationship profiles
- Separate contracts per relationship
- Separate task lists per relationship
- Separate analytics per relationship
- Cross-relationship insights (optional)

**Relationship Switching**:
- Switch between active relationships
- View relationship-specific data
- Maintain relationship boundaries
- Privacy controls per relationship

**Data Requirements**:
- `relationships` table: id, workspace_id, name, description, partner_1_id, partner_2_id, active, created_at
- Relationship-specific tables (tasks, contracts, etc.) linked via `relationship_id`

**Acceptance Criteria**:
- [ ] Multiple relationships can be created
- [ ] Each relationship has separate data
- [ ] Relationship switching works seamlessly
- [ ] Cross-relationship insights are optional
- [ ] Privacy controls work per relationship
- [ ] Data is properly isolated between relationships

**Technical Considerations**:
- Implement relationship data isolation
- Use relationship_id foreign keys
- Consider relationship switching UX
- Implement relationship-specific RLS policies
- Consider performance implications of multi-relationship queries

---

## Technical Stack & Architecture

### Frontend

**Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **UI Components**: Magic UI (BorderBeam, MagicCard, ShineBorder)
- **State Management**: React Server Components + Supabase Realtime
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner (toast notifications)

### Backend

**Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Notion OAuth)
- **Realtime**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for photos/videos)
- **Edge Functions**: Deno-based Supabase Edge Functions
- **API**: Next.js API Routes + Supabase REST API

### Integrations

**Orchestration**: n8n
- Workflow automation
- Scheduled jobs
- Webhook handling
- Cross-service integration

**External Services**:
- **Notion**: Roadmap representation, template storage
- **Discord**: Delivery channel, notifications
- **OpenAI**: Drafting support (never automatic rule creation)

### Architecture Patterns

**Data Flow**:
```
Client (Next.js) 
  → Next.js API Routes 
    → Supabase (Source of Truth)
      → Supabase Realtime (Live Updates)
      → Edge Functions (Notion Sync, etc.)
      → n8n (Orchestration)
        → Discord, Notion, etc.
```

**Key Principles**:
- Supabase = Source of truth
- Notion = Roadmap representation
- n8n = Orchestration layer
- Discord = Delivery channel
- OpenAI = Drafting only (never auto-actions)

---

## Data Model

### Core Entities

#### Users & Profiles
```
profiles
  - id (uuid, PK, FK → auth.users)
  - email (text)
  - full_name (text)
  - display_name (text)
  - avatar_url (text)
  - system_role (enum: admin, user)
  - dynamic_role (enum: dominant, submissive, switch)
  - partner_id (uuid, FK → profiles)
  - submission_state (enum: active, low_energy, paused)
  - love_languages (text[])
  - hard_limits (text[])
  - soft_limits (text[])
  - notifications_enabled (boolean)
  - theme_preference (text)
  - created_at, updated_at
```

#### Tasks
```
tasks
  - id (uuid, PK)
  - workspace_id (uuid, FK)
  - title (text)
  - description (text)
  - priority (enum: low, medium, high, urgent)
  - status (enum: pending, in_progress, completed, approved, cancelled)
  - due_date (timestamptz)
  - point_value (integer)
  - proof_required (boolean)
  - proof_type (enum: photo, video, text)
  - template_id (uuid, FK → task_templates)
  - rule_id (uuid, FK → rules)
  - assigned_by (uuid, FK → profiles)
  - assigned_to (uuid, FK → profiles)
  - completed_at (timestamptz)
  - approved_at (timestamptz)
  - created_at, updated_at
```

#### Rules & Protocols
```
rules
  - id (uuid, PK)
  - workspace_id (uuid, FK)
  - title (text)
  - description (text)
  - rule_type (enum: standing, situational, temporary, optional)
  - context (text)
  - consequence (text)
  - active (boolean)
  - linked_task_id (uuid, FK → tasks)
  - created_by (uuid, FK → profiles)
  - created_at, updated_at, deactivated_at
```

#### Contracts & Consent
```
contracts
  - id (uuid, PK)
  - workspace_id (uuid, FK)
  - title (text)
  - content (text)
  - version_number (integer)
  - status (enum: draft, active, expired, superseded)
  - created_by (uuid, FK → profiles)
  - created_at, signed_at, expires_at
```

#### Rewards & Points
```
rewards
  - id (uuid, PK)
  - workspace_id (uuid, FK)
  - reward_type (enum: verbal, points, relational, achievement)
  - title (text)
  - description (text)
  - point_value (integer)
  - love_language (text)
  - assigned_by (uuid, FK → profiles)
  - assigned_to (uuid, FK → profiles)
  - task_id (uuid, FK → tasks, nullable)
  - created_at

points_ledger
  - id (uuid, PK)
  - workspace_id (uuid, FK)
  - user_id (uuid, FK → profiles)
  - points (integer)
  - reason (text)
  - source_type (enum: task, reward, manual)
  - source_id (uuid)
  - created_at
```

### Relationships

- **profiles** ↔ **profiles** (partner_id) - One-to-one relationship
- **profiles** → **tasks** (assigned_by, assigned_to) - One-to-many
- **tasks** → **rules** (rule_id) - Many-to-one
- **tasks** → **task_templates** (template_id) - Many-to-one
- **contracts** → **contract_signatures** - One-to-many
- **profiles** → **rewards** (assigned_by, assigned_to) - One-to-many
- **tasks** → **rewards** (task_id) - One-to-many

### Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Dynamic roles
CREATE TYPE dynamic_role AS ENUM ('dominant', 'submissive', 'switch');

-- Submission states
CREATE TYPE submission_state AS ENUM ('active', 'low_energy', 'paused');

-- Task statuses
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'cancelled');

-- Rule types
CREATE TYPE rule_type AS ENUM ('standing', 'situational', 'temporary', 'optional');

-- Reward types
CREATE TYPE reward_type AS ENUM ('verbal', 'points', 'relational', 'achievement');

-- Boundary ratings
CREATE TYPE boundary_rating AS ENUM ('yes', 'maybe', 'no', 'hard_no');
```

---

## UI/UX Design Principles

### Role-Based Interfaces

#### Dominant Interface (Simeon)
**Characteristics**:
- Expressive, comprehensive, feature-rich
- Supports complex workflows
- Allows exploration and experimentation
- Provides suggestions but never auto-acts
- Dashboard with full visibility
- Task assignment and management
- Feedback authoring (with AI drafting support)
- Idea curation and roadmap management

**Design Elements**:
- Rich data visualizations
- Comprehensive forms and inputs
- Advanced filtering and sorting
- Bulk operations support
- Analytics and reporting tools

#### Submissive Interface (Kevin)
**Characteristics**:
- Simpler, quieter, deferential
- Minimal cognitive load
- Clear, direct instructions
- No nudging or confirmation loops
- Respectful of power dynamic
- Quick idea capture
- State declaration
- Task completion

**Design Elements**:
- Clean, focused layouts
- Large, clear action buttons
- Minimal distractions
- Prominent state indicator
- Simple forms
- Quick actions

### Design System

**Colors** (from `app/globals.css`):
- Primary: Deep, authoritative colors
- Accent: Vibrant orange-red (from auth page)
- Background: Dark theme optimized
- Foreground: High contrast for readability

**Typography**:
- Display font: Rebel Grotesk (for headings)
- Body font: Roboto Mono (for content)
- Clear hierarchy

**Components**:
- Magic UI: BorderBeam, MagicCard, ShineBorder for visual flair
- Shadcn/ui: Standard UI components (Button, Input, Card, etc.)
- Custom: Role-specific components

### Accessibility

- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support
- High contrast mode
- Responsive design (mobile, tablet, desktop)

---

## Security & Consent Mechanisms

### Row Level Security (RLS)

**Principles**:
- Users can only access their own data and partner's data
- Admins can access all data
- Submission state enforcement at database level
- No data leakage between workspaces

**Key Policies**:
- `profiles`: Select own or partner, update own or admin
- `tasks`: Select assigned to or assigned by, update by assigner or assignee
- `rules`: Select workspace members, update by creator or admin
- `contracts`: Select workspace members, update by creator or admin
- `messages`: Select workspace members, update by sender or recipient

### Consent Mechanisms

**Pause Play Signal**:
- Visible, one-click state change
- Immediately disables task assignment, discipline, sexualized tone
- Enables honest, non-play communication
- Logged and auditable

**Boundary Enforcement**:
- Hard limits never suggested
- Soft limits trigger discussion prompts
- Boundary updates require acknowledgment
- Consent records are immutable

**Consent Tracking**:
- All consent decisions logged
- Consent withdrawal immediately recorded
- Consent history searchable
- Audit trail for compliance

### Data Privacy

**Encryption**:
- Data at rest: Supabase encryption
- Data in transit: HTTPS/TLS
- Sensitive fields: Additional encryption (consent records, messages)

**Access Control**:
- Authentication required for all routes
- Session management via Supabase Auth
- Token expiration and refresh
- Role-based access control (RBAC)

**Audit Logging**:
- All state changes logged
- Consent decisions tracked
- Rule violations recorded
- Task completions audited

---

## Development Phases & Milestones

### Phase 1: MVP Core (Protocol & Covenant Spine)

**Duration**: 8-12 weeks

**Features**:
1. User authentication (Notion OAuth)
2. Profile management (basic)
3. Submission state management (Active/Low-Energy/Paused)
4. Basic task management (create, assign, complete, approve)
5. Basic communication (messages, check-ins)
6. Dashboard (role-based views)
7. App Ideas system (already implemented)

**Success Criteria**:
- Both partners can authenticate
- Submission state can be declared and enforced
- Tasks can be created, assigned, and completed
- Basic communication works
- Dashboard displays relevant information

**Deliverables**:
- Working MVP deployed
- Core database schema
- Basic UI for both roles
- Documentation

---

### Phase 2: Foundation Expansion

**Duration**: 6-8 weeks

**Features**:
1. Rules & Protocols management
2. Rewards & Recognition system
3. Contract & Consent management (basic)
4. Enhanced task management (templates, bulk creation, proof requirements)
5. Enhanced communication (prompted conversations, scene debriefs)

**Success Criteria**:
- Rules can be created and managed
- Rewards can be assigned and tracked
- Contracts can be created and signed
- Task templates work
- Communication features are enhanced

**Deliverables**:
- Expanded feature set
- Enhanced UI
- Integration with Notion (rules templates)
- Documentation updates

---

### Phase 3: Relationship Tools

**Duration**: 8-10 weeks

**Features**:
1. Kink exploration & boundaries
2. Journal & Reflection
3. Calendar & Scheduling
4. Enhanced scene logging
5. Aftercare tracking

**Success Criteria**:
- Boundaries can be explored and tracked
- Journal entries can be created and shared
- Calendar events can be scheduled
- Scene logs capture all required data
- Aftercare is tracked

**Deliverables**:
- Complete relationship tools
- Rich text editor integration
- Calendar UI
- Scene log forms
- Documentation

---

### Phase 4: Analytics & Growth

**Duration**: 6-8 weeks

**Features**:
1. Progress & Analytics dashboard
2. Report generation
3. Resource Library
4. Achievement system
5. Enhanced analytics

**Success Criteria**:
- Analytics are calculated accurately
- Reports can be generated and exported
- Resource library is functional
- Achievements unlock correctly
- Analytics provide insights

**Deliverables**:
- Analytics dashboard
- Report generation system
- Resource library
- Achievement system
- Documentation

---

### Phase 5: Multi-Partner Support

**Duration**: 8-10 weeks

**Features**:
1. Multi-relationship management
2. Relationship switching
3. Cross-relationship insights (optional)
4. Enhanced privacy controls
5. Relationship-specific data isolation

**Success Criteria**:
- Multiple relationships can be created
- Relationship switching works seamlessly
- Data is properly isolated
- Privacy controls work correctly
- Cross-relationship insights are optional

**Deliverables**:
- Multi-partner support
- Enhanced privacy controls
- Relationship management UI
- Documentation

---

## Integration Points

### Notion Integration

**Purpose**: Roadmap representation, template storage

**Implementation**:
- Supabase Edge Function: `sync-idea-to-notion`
- Sync app ideas to Notion database
- Store rule templates in Notion
- Read protocol templates from Notion

**API**: Notion API v1
**Authentication**: Notion API Key (stored as Edge Function secret)

### Discord Integration

**Purpose**: Delivery channel, notifications

**Implementation**:
- n8n workflows for Discord notifications
- "New app idea" notifications
- Task reminder notifications
- Check-in reminders
- Scene scheduling notifications

**API**: Discord API
**Authentication**: Discord Bot Token

### n8n Integration

**Purpose**: Orchestration layer

**Workflows**:
1. App idea logged → Notion sync → Discord notification
2. Task reminder → Discord notification
3. Check-in reminder → Discord notification
4. Contract renewal reminder → Email/Discord
5. Weekly summary report → Email/Discord

**Authentication**: n8n API key

### OpenAI Integration

**Purpose**: Drafting support (never automatic rule creation)

**Use Cases**:
- Draft feedback messages (Dominant edits before sending)
- Draft reflection prompts
- Draft weekly summaries (Dominant reviews before sending)
- Draft conversation starters

**Constraints**:
- Never auto-creates rules
- Never auto-assigns tasks
- Never auto-sends messages
- Always requires Dominant approval

**API**: OpenAI API
**Authentication**: OpenAI API Key

---

## Potential Challenges & Solutions

### Challenge 1: Authority Preservation

**Problem**: Ensuring the app never replaces Dominant's authority

**Solution**:
- All actions require explicit Dominant approval
- No automated task assignment
- No automated discipline
- Clear UI indicators showing "Simeon assigned this" vs "System suggested this"
- Code reviews check against authority principles

### Challenge 2: Submission State Enforcement

**Problem**: Ensuring submission state is respected across all features

**Solution**:
- Database-level enforcement via RLS policies
- Application-level checks before task assignment
- Automatic disabling of features when paused
- Clear UI indicators of current state
- State change logging for audit

### Challenge 3: Real-Time Synchronization

**Problem**: Keeping both partners in sync without performance issues

**Solution**:
- Supabase Realtime subscriptions
- Efficient database queries with indexes
- Caching for frequently accessed data
- Optimistic UI updates
- Conflict resolution strategies

### Challenge 4: Privacy & Security

**Problem**: Protecting sensitive relationship data

**Solution**:
- End-to-end encryption for messages
- RLS policies for data isolation
- Secure storage for proof files
- Audit logging for compliance
- Regular security audits

### Challenge 5: Scalability

**Problem**: Supporting multiple relationships and future growth

**Solution**:
- Efficient database schema design
- Proper indexing strategies
- Caching layers
- Database connection pooling
- Horizontal scaling capabilities

### Challenge 6: Integration Complexity

**Problem**: Managing multiple external service integrations

**Solution**:
- n8n as orchestration layer
- Edge Functions for secure API calls
- Retry mechanisms for failed syncs
- Error logging and monitoring
- Fallback strategies

---

## Future Expansion Possibilities

### Short-Term (6-12 months)

1. **Mobile Apps**: Native iOS and Android apps
2. **Voice Integration**: Voice commands for task completion
3. **Wearable Integration**: Apple Watch, Fitbit integration
4. **Enhanced AI**: More sophisticated drafting and suggestions
5. **Community Features**: Optional community forum integration

### Medium-Term (12-24 months)

1. **Therapist Integration**: Optional therapist access to relationship data
2. **Educational Content**: Built-in educational modules
3. **Scene Planning Tools**: Advanced scene planning and negotiation
4. **Equipment Tracking**: Track BDSM equipment and maintenance
5. **Event Integration**: Integration with kink events and munches

### Long-Term (24+ months)

1. **AI Relationship Coach**: AI-powered relationship insights (with consent)
2. **Multi-Language Support**: Internationalization
3. **Enterprise Features**: For professional Dominants with multiple clients
4. **Research Mode**: Optional anonymized data contribution to research
5. **Legacy Planning**: Relationship data inheritance and legacy planning

---

## Success Metrics

### User Engagement

- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Task completion rate
- Check-in submission rate
- Message frequency
- Journal entry frequency

### Relationship Health

- Consistency metrics (task completion streaks)
- Communication frequency
- Boundary exploration rate
- Contract adherence rate
- Overall relationship health score

### Product Health

- Feature adoption rates
- User retention (30-day, 90-day)
- Time to value (first task completion)
- Support ticket volume
- Bug report frequency

### Business Metrics (Future)

- User acquisition cost
- Lifetime value
- Churn rate
- Revenue (if monetized)
- Net Promoter Score (NPS)

---

## Non-Negotiable Design Principles

These principles must be checked against every feature and PR:

### 1. Authority Model
**Rule**: Kevin obeys Simeon, not software.

**Check**: Does this feature make it unclear whether Kevin is responding to Simeon or software? If yes, the feature is invalid.

### 2. Submission States
**Rule**: Submission state is self-declared by Kevin, not inferred or set by Simeon.

**Check**: Does this feature respect Kevin's declared submission state? Does it ever infer or override state? If it overrides, the feature is invalid.

### 3. Transparency
**Rule**: Simeon sees everything by default.

**Check**: Does this feature hide information from Simeon without explicit opt-in? If yes, the feature violates transparency.

### 4. Support vs Control
**Rule**: The app supports, never controls.

**Check**: Does this feature act instead of Simeon? Does it auto-assign, auto-discipline, or auto-decide? If yes, the feature is invalid.

### 5. Safety & Consent
**Rule**: Pause play mechanism and boundary enforcement are non-negotiable.

**Check**: Does this feature respect pause play state? Does it enforce boundaries? If no, the feature is invalid.

### 6. No Inference
**Rule**: The app never infers readiness, mood, or energy.

**Check**: Does this feature use behavioral inference or mood prediction? If yes, the feature is invalid.

---

## Appendix

### A. References

- [ChatGPT Group Chat Analysis](./docs/analysis/chatgpt-group-chat-analysis.md)
- [Authority and Consent Design Doc](./docs/design/authority-and-consent.md) (to be created)
- [Notion KINK IT Master Page](https://notion.so/kink-it) (internal)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### B. Glossary

- **Covenant**: Relationship contract/agreement between partners
- **Protocol**: Structured routine or ritual
- **Submission State**: Self-declared state (Active/Low-Energy/Paused)
- **Pause Play**: Mechanism to temporarily suspend D/s dynamic
- **Hard Limit**: Absolute boundary, never to be crossed
- **Soft Limit**: Boundary that requires discussion before crossing
- **Scene**: Structured BDSM play session
- **Aftercare**: Post-scene care and emotional support

### C. Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-05 | Initial comprehensive PRD | AI Assistant |

---

**Document Status**: Living Document  
**Next Review**: After Phase 1 MVP completion  
**Maintained By**: Development Team + Product Owners (Simeon & Kevin)

