# KINK IT Discord Server Setup - Implementation Guide

## Quick Start

This guide provides step-by-step instructions for setting up your KINK IT Discord server structure.

## Prerequisites

- Discord server with admin access
- Webhook URL for #announcements channel (already configured)
- Basic understanding of Discord permissions

## Step 1: Create Categories

Create these categories in order (top to bottom):

1. **📋 INFORMATION**
2. **🔔 NOTIFICATIONS**
3. **💬 COMMUNICATION**
4. **📚 RESOURCES**
5. **📦 ARCHIVE**

## Step 2: Create Channels

### Category: 📋 INFORMATION

Create these channels:

1. **#rules**
   - Type: Text Channel
   - Permissions: Read-only for @everyone, Write for @Admin
   - Description: "Server rules, code of conduct, and guidelines"

2. **#introductions**
   - Type: Text Channel
   - Permissions: Read/Write for @everyone
   - Description: "Introduce yourself and get to know the community"

3. **#announcements** ✅ (Already exists)
   - Type: Text Channel
   - Permissions: Read-only for @everyone, Write for @Admin/@KINK IT Bot
   - Webhook: Already configured

4. **#server-info**
   - Type: Text Channel
   - Permissions: Read-only for @everyone, Write for @Admin
   - Description: "Server structure, channel purposes, and FAQ"

### Category: 🔔 NOTIFICATIONS

Create these channels (all read-only, bot posts only):

**Tasks:**
- #task-assignments
- #task-completions
- #task-reminders

**Rewards:**
- #rewards-available
- #rewards-redeemed

**Relationship Management:**
- #submission-state
- #rules-protocols
- #boundaries-consent
- #contract-updates

**Scheduling:**
- #schedule-reminders
- #weekly-summaries

**System:**
- #system-alerts

### Category: 💬 COMMUNICATION

Create these channels:

- #general (Read/Write for all)
- #dominant-only (Read/Write for @Dominant only)
- #submissive-only (Read/Write for @Submissive only)
- #check-ins (Read/Write for all)

### Category: 📚 RESOURCES

Create these channels:

- #resources (Read-only for members, Write for @Admin)
- #guides (Read-only for members, Write for @Admin)
- #app-ideas (Read/Write for all)

### Category: 📦 ARCHIVE

Create these channels:

- #notification-archive (Read-only, Bot posts only)
- #logs (Read-only for @Admin only)

## Step 3: Create Roles

Create these roles in order (highest to lowest):

1. **@Admin**
   - Color: Red
   - Permissions: All permissions
   - Hoist: Yes

2. **@Dominant**
   - Color: Purple
   - Permissions: See all channels, write in communication channels
   - Hoist: Yes

3. **@Submissive**
   - Color: Blue
   - Permissions: See relevant channels, write in communication channels
   - Hoist: Yes

4. **@Switch**
   - Color: Green
   - Permissions: Variable (can switch between Dominant/Submissive)
   - Hoist: Yes

5. **@KINK IT Bot**
   - Color: Gray
   - Permissions: Send messages in notification channels only
   - Hoist: No

## Step 4: Configure Channel Permissions

### Notification Channels (Read-Only)

For each notification channel (#task-assignments, #task-completions, etc.):

1. Right-click channel → Edit Channel → Permissions
2. Remove @everyone's "Send Messages" permission
3. Add @KINK IT Bot role with "Send Messages" permission
4. Keep @everyone's "View Channel" and "Read Message History" permissions

### Private Channels

For #dominant-only:
- Remove @everyone's "View Channel" permission
- Add @Dominant role with "View Channel" permission

For #submissive-only:
- Remove @everyone's "View Channel" permission
- Add @Submissive role with "View Channel" permission

## Step 5: Post Welcome Messages

### #announcements Welcome Message

Copy and paste this into #announcements:

```
🎉 **KINK IT Discord Server Setup Complete!**

Welcome to your KINK IT notification and communication hub. This server is designed to support your D/s dynamic with automated notifications and optional communication channels.

**Important Principles:**
- **Authority Preservation**: All notifications attribute actions to your Dominant partner by name, never to "the system"
- **Consent-First**: Language normalizes boundary setting and consent withdrawal
- **Role-Appropriate**: Messages are tailored to each role's perspective

**Next Steps:**
1. Review the server structure in #server-info
2. Configure your notification preferences
3. Assign roles to members (@Dominant, @Submissive, @Switch)

**Notification Channels:**
All notification channels are read-only and receive automated messages from the KINK IT application. You can customize which channels you receive notifications for in your app settings.

For detailed setup instructions, see: `docs/DISCORD_SERVER_LAYOUT_PLAN.md`
```

### #server-info Channel Description

Copy and paste this into #server-info:

```
# KINK IT Discord Server Structure

This server is organized into 5 main categories:

## 📋 INFORMATION
Essential server information and onboarding channels.

## 🔔 NOTIFICATIONS
Automated notifications from the KINK IT application, organized by module:
- **Tasks**: Assignments, completions, reminders
- **Rewards**: Available rewards, redemptions
- **Relationship**: Submission state, rules, boundaries, contracts
- **Scheduling**: Reminders, weekly summaries
- **System**: App alerts and maintenance

## 💬 COMMUNICATION
Optional communication channels for your dynamic.

## 📚 RESOURCES
Educational content, guides, and app ideas.

## 📦 ARCHIVE
Historical notifications and system logs.

**Note**: All notification channels are read-only. Messages are posted automatically by the KINK IT bot when events occur in the application.
```

### #rules Channel Content

Copy and paste this into #rules:

```
# KINK IT Discord Server Rules

## Core Principles

1. **Authority Preservation**: This server supports your D/s dynamic but never replaces human authority. You obey your Dominant partner, not software.

2. **Consent-First**: Consent can be withdrawn at any time, for any reason. This demonstrates trust, not failure.

3. **Privacy**: This server is private to your dynamic. Do not share content outside your relationship without explicit consent.

4. **Respect**: Maintain appropriate hierarchy and tone in all communications.

## Channel Guidelines

- **Notification Channels**: Read-only. Do not post manually.
- **Communication Channels**: Use for discussion, check-ins, and support.
- **Resource Channels**: Share educational content and ideas.

## NSFW Content

This server may contain NSFW content related to D/s dynamics. All members must be 18+ and consent to viewing such content.

## Support

For technical issues or questions, contact your server administrator or refer to the KINK IT app documentation.
```

## Step 6: Configure Webhooks (Optional)

For each notification channel, you can create a webhook:

1. Right-click channel → Edit Channel → Integrations → Webhooks
2. Create New Webhook
3. Name: "KINK IT Bot"
4. Copy webhook URL
5. Store in environment variables or app configuration

**Note**: You can use a single webhook with channel ID parameters, or create separate webhooks for each channel.

## Step 7: Test Setup

1. Assign roles to test users
2. Verify permissions work correctly
3. Test webhook connectivity
4. Send test notification messages

## Step 8: Integration with KINK IT App

Once the Discord server is set up:

1. Store Discord channel IDs in database
2. Configure notification preferences per user
3. Implement API routes for Discord notifications
4. Set up event triggers for automated notifications

See `docs/DISCORD_SERVER_LAYOUT_PLAN.md` for detailed integration instructions.

## Troubleshooting

### Webhook Not Working
- Verify webhook URL is correct
- Check bot has "Send Messages" permission
- Ensure channel is not archived or deleted

### Permissions Not Working
- Check role hierarchy (roles higher in list override lower roles)
- Verify channel-specific permissions aren't conflicting
- Ensure @everyone permissions are set correctly

### Messages Not Appearing
- Check channel permissions for bot role
- Verify webhook URL is active
- Check message content doesn't violate Discord limits (2000 characters)

## Next Steps

1. ✅ Complete server setup (this guide)
2. ⏳ Configure app-side integration
3. ⏳ Test notification flow
4. ⏳ Set up user preferences
5. ⏳ Deploy to production


