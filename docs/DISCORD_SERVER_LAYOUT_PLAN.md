# KINK IT Discord Server Layout Plan

## Executive Summary

This document outlines a comprehensive Discord server structure for the KINK IT application, designed to support all 12 core modules while maintaining authority preservation, consent-first principles, and role-appropriate access. The structure follows Discord best practices and D/s community patterns while serving as a notification and communication hub for the application.

## Research Foundation

### Discord Community Best Practices
- **Category Organization**: Separate channels by topic, organize into categories for easy navigation
- **Essential Channels**: Rules, Introductions, Announcements, Suggestions
- **Hierarchy Matters**: Important channels at top, main chat in middle, off-topic at bottom
- **Role-Based Access**: Simple core roles (Admin/Mod/Member), then access roles for specific features
- **Start Small**: Begin with fewer channels to avoid confusion

### D/s Community Patterns
- **Role-Specific Channels**: Separate spaces for Dominants, Submissives, Switches
- **Verification Systems**: Age/ID verification for safety
- **Educational Channels**: BDSM education, advice channels
- **Private Spaces**: Role-specific private chats
- **Task/Protocol Channels**: Weekly tasks, protocols, assignments
- **Event Channels**: Scheduled events, activities

### Notification System Patterns
- **Dedicated Alert Channels**: Separate channels for different notification types
- **Role-Based Mentions**: Use @mentions for specific roles
- **Threaded Discussions**: Keep alert discussions in threads
- **Webhook Integration**: Use webhooks for automated notifications
- **Channel Organization**: Categories for different notification types

## Server Structure

### Category 1: 📋 INFORMATION
**Purpose**: Essential server information and onboarding

#### Channels:
1. **#rules** (Read-only for members)
   - Server rules and guidelines
   - Code of conduct
   - Privacy policy
   - NSFW content warnings

2. **#introductions** (Write access for all)
   - New member introductions
   - Community welcome messages
   - Getting started guide

3. **#announcements** (Read-only for members, Write for Admins/Bot)
   - **EXISTING CHANNEL** - Already created
   - App updates and changes
   - Important server announcements
   - System maintenance notices
   - Webhook: `https://discord.com/api/webhooks/1457594153109164134/s6eRp1w03Gw-clh0QF_-uL70LAS7hdE8jgpz16-18kBmmCbEJ08PMBX4RXB4TqOlPknj`

4. **#server-info** (Read-only for members)
   - Server structure explanation
   - Channel purposes
   - How to use Discord with KINK IT
   - FAQ

### Category 2: 🔔 NOTIFICATIONS
**Purpose**: All app-generated notifications organized by module

#### Subcategory: Tasks
5. **#task-assignments** (Read-only, Bot posts only)
   - New task assignments
   - Task modifications
   - Task priority changes
   - Format: "Simeon has assigned you: [Task Name]"

6. **#task-completions** (Read-only, Bot posts only)
   - Task completion notifications
   - Task approval notifications
   - Points awarded notifications
   - Format: "Kevin has completed: [Task Name] - Points awarded!"

7. **#task-reminders** (Read-only, Bot posts only)
   - Daily task reminders
   - Overdue task alerts
   - Weekly task summaries

#### Subcategory: Rewards
8. **#rewards-available** (Read-only, Bot posts only)
   - New rewards created
   - Reward availability updates
   - Format: "New reward available: [Reward Name] - [Points] points"

9. **#rewards-redeemed** (Read-only, Bot posts only)
   - Reward redemption notifications
   - Points balance updates
   - Format: "Kevin has redeemed: [Reward Name]"

#### Subcategory: Relationship Management
10. **#submission-state** (Read-only, Bot posts only)
    - Submission state changes
    - Pause play notifications
    - Low energy alerts
    - Format: "Kevin has updated submission state to: [State]"

11. **#rules-protocols** (Read-only, Bot posts only)
    - New rules created
    - Protocol updates
    - Rule acknowledgments
    - Format: "Simeon has created a new rule: [Rule Name]"

12. **#boundaries-consent** (Read-only, Bot posts only)
    - Boundary updates
    - Consent changes
    - Limit modifications
    - Format: "Boundaries have been updated - please review"

13. **#contract-updates** (Read-only, Bot posts only)
    - Contract renewals
    - Contract modifications
    - Consent agreement updates
    - Format: "Contract renewal reminder - expires in [X] days"

#### Subcategory: Scheduling & Events
14. **#schedule-reminders** (Read-only, Bot posts only)
    - Calendar event reminders
    - Scheduled check-ins
    - Important dates approaching
    - Format: "Reminder: [Event Name] in [Time]"

15. **#weekly-summaries** (Read-only, Bot posts only)
    - Weekly progress reports
    - Task completion summaries
    - Points and streak updates
    - Format: "Your weekly summary: [Stats]"

#### Subcategory: System
16. **#system-alerts** (Read-only, Bot posts only)
    - App errors or issues
    - Maintenance notifications
    - Integration status updates
    - Format: "System Alert: [Message]"

### Category 3: 💬 COMMUNICATION
**Purpose**: Direct communication channels (optional, can be disabled if using app's Communication Hub)

17. **#general** (Write access for all)
    - General discussion
    - Casual conversation
    - Community chat

18. **#dominant-only** (Write access for @Dominant role only)
    - Private space for Dominants
    - Strategy discussion
    - Support and advice

19. **#submissive-only** (Write access for @Submissive role only)
    - Private space for Submissives
    - Support and advice
    - Peer discussion

20. **#check-ins** (Write access for all)
    - Scheduled check-ins
    - Emotional check-ins
    - Relationship discussions

### Category 4: 📚 RESOURCES
**Purpose**: Educational content and external resources

21. **#resources** (Read-only, Write for Admins)
    - Educational articles
    - External links
    - Resource library updates
    - Format: "New resource added: [Resource Name]"

22. **#guides** (Read-only, Write for Admins)
    - How-to guides
    - Tutorials
    - Documentation links

23. **#app-ideas** (Write access for all)
    - Feature suggestions
    - Improvement ideas
    - Feedback
    - Format: "New idea submitted: [Idea Title]"

### Category 5: 📦 ARCHIVE
**Purpose**: Historical data and logs

24. **#notification-archive** (Read-only, Bot posts only)
    - Older notifications (auto-archived after 30 days)
    - Historical logs
    - Searchable history

25. **#logs** (Read-only, Admins only)
    - System logs
    - Error logs
    - Debug information

## Role Structure

### Core Roles
1. **@Admin**
   - Full server management
   - All channel access
   - Bot configuration

2. **@Dominant**
   - Full read access to all channels
   - Write access to communication channels
   - Access to dominant-only channels
   - Receives all notifications

3. **@Submissive**
   - Read access to notifications relevant to them
   - Write access to communication channels
   - Access to submissive-only channels
   - Receives personal notifications only

4. **@Switch**
   - Variable access based on current role
   - Can switch between Dominant and Submissive permissions

5. **@KINK IT Bot**
   - Automated posting permissions
   - Read-only in notification channels
   - No user interaction permissions

### Permission Model

#### Notification Channels (Read-Only)
- **View Channel**: All roles
- **Send Messages**: @KINK IT Bot only
- **Manage Messages**: @Admin only
- **Read Message History**: All roles

#### Communication Channels (Interactive)
- **View Channel**: Role-based
- **Send Messages**: Role-based
- **Manage Messages**: @Admin only
- **Read Message History**: Role-based

#### Private Channels
- **View Channel**: Specific roles only
- **Send Messages**: Specific roles only
- **Read Message History**: Specific roles only

## Channel Descriptions & Topics

### #announcements
**Topic**: "Official KINK IT announcements, updates, and important information"
**Description**: "Stay informed about app updates, new features, and important changes. This channel receives automated notifications from the KINK IT application."

### #task-assignments
**Topic**: "Notifications when new tasks are assigned"
**Description**: "Automated notifications when your Dominant assigns you a new task. All messages are read-only and posted by the KINK IT bot."

### #task-completions
**Topic**: "Notifications when tasks are completed or approved"
**Description**: "Automated notifications when tasks are completed, approved, or points are awarded. This channel helps track your progress and achievements."

### #submission-state
**Topic**: "Notifications about submission state changes"
**Description**: "Automated notifications when submission states change (Active, Low Energy, Paused). Important for maintaining communication and consent."

## Message Formatting Guidelines

### Following LANGUAGE_GUIDE.md Principles

#### Authority Preservation
- ✅ "Simeon has assigned you: [Task Name]"
- ✅ "Your Dominant wants you to review: [Rule Name]"
- ❌ "A task has been assigned to you"
- ❌ "The system requires you to complete this"

#### Agency Affirmation
- ✅ "You have chosen to pause your submission"
- ✅ "Your submission state is currently: Active"
- ❌ "Submission paused"
- ❌ "You must complete this task"

#### Consent-First Messaging
- ✅ "You may pause at any time, for any reason"
- ✅ "Your boundaries are always respected"
- ❌ "Are you sure you want to pause?"
- ❌ "Pausing will affect your progress"

### Message Templates

#### Task Assignment
```
🎯 **NEW TASK ASSIGNED**
Simeon has assigned you: **[Task Name]**
Priority: [Priority Level]
Due: [Due Date]
Points: [Point Value]
```

#### Task Completion
```
✅ **TASK COMPLETED**
Kevin has completed: **[Task Name]**
Completed at: [Timestamp]
Points awarded: [Points]
Current balance: [Balance]
```

#### Submission State Change
```
🔄 **SUBMISSION STATE UPDATE**
Kevin has updated submission state to: **[State]**
Updated at: [Timestamp]
Note: [Optional message]
```

#### Reward Available
```
🎁 **NEW REWARD AVAILABLE**
Reward: **[Reward Name]**
Cost: [Points] points
Description: [Description]
```

## Implementation Steps

### Phase 1: Initial Setup (Week 1)
1. ✅ Create #announcements channel (already exists)
2. Create INFORMATION category and channels
3. Set up basic roles (@Admin, @Dominant, @Submissive, @Switch)
4. Configure webhook for #announcements
5. Test webhook connectivity

### Phase 2: Notification Channels (Week 2)
1. Create NOTIFICATIONS category
2. Create all notification channels
3. Configure permissions for each channel
4. Set up bot permissions
5. Test notification flow

### Phase 3: Communication & Resources (Week 3)
1. Create COMMUNICATION category and channels
2. Create RESOURCES category and channels
3. Configure role-based access
4. Set up channel descriptions and topics

### Phase 4: Archive & Polish (Week 4)
1. Create ARCHIVE category
2. Set up auto-archiving (if using bot)
3. Create welcome message
4. Write channel descriptions
5. Final testing and documentation

## Webhook Configuration

### Current Webhook
- **URL**: `https://discord.com/api/webhooks/1457594153109164134/s6eRp1w03Gw-clh0QF_-uL70LAS7hdE8jgpz16-18kBmmCbEJ08PMBX4RXB4TqOlPknj`
- **Channel**: #announcements
- **Status**: ✅ Tested and working

### Additional Webhooks Needed
- Create separate webhooks for each notification channel type (optional, can use one webhook with channel ID parameter)
- Or use Discord MCP `discord_send` function with channel IDs

## Security Considerations

1. **Webhook URL Protection**: Store webhook URLs in environment variables, never commit to git
2. **Role-Based Access**: Enforce strict role-based permissions
3. **Private Channels**: Use private channels for sensitive content
4. **Bot Permissions**: Limit bot to necessary permissions only
5. **Rate Limiting**: Implement rate limiting to prevent spam
6. **Message Validation**: Validate all messages before sending

## Integration with KINK IT App

### API Routes Needed
- `/api/discord/send` - Send message to Discord channel
- `/api/discord/notify` - Send notification based on event type
- `/api/discord/webhook` - Webhook endpoint for external services

### Database Schema Additions
```sql
-- Add Discord preferences to profiles
ALTER TABLE profiles ADD COLUMN discord_notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN discord_channel_preferences JSONB DEFAULT '{}'::jsonb;

-- Store Discord channel IDs
CREATE TABLE discord_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name TEXT NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Event Triggers
- Task assigned → Send to #task-assignments
- Task completed → Send to #task-completions
- Reward created → Send to #rewards-available
- Submission state changed → Send to #submission-state
- Contract renewal → Send to #contract-updates
- Weekly summary → Send to #weekly-summaries

## Next Steps

1. ✅ Test webhook connectivity (completed)
2. ⏳ Create Discord server structure
3. ⏳ Set up roles and permissions
4. ⏳ Configure channel descriptions
5. ⏳ Implement Discord integration in app
6. ⏳ Test end-to-end notification flow
7. ⏳ Document user-facing setup instructions

## Conclusion

This Discord server structure provides a comprehensive notification and communication hub for KINK IT while maintaining the app's core principles of authority preservation, consent-first design, and role-appropriate access. The structure is scalable, organized, and follows Discord best practices while serving the unique needs of D/s relationship management.




