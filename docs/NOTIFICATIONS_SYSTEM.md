# Notifications System

## Overview

The KINK IT application uses a notification system to alert users about important events and updates. Notifications are stored in the `notifications` table in Supabase and can be accessed through the terminal interface.

## Where Notifications Come From

Notifications are created automatically by the system when certain events occur:

### 1. **Bond Join Requests**
- **Approval**: When a bond join request is approved, a success notification is created
  - Title: "Bond Join Request Approved"
  - Type: `success`
  - Priority: `high`
- **Rejection**: When a bond join request is rejected, an error notification is created
  - Title: "Bond Join Request Rejected"
  - Type: `error`
  - Priority: `medium`

### 2. **Task Events** (Backward Compatibility)
- Notifications can also be generated from task events for backward compatibility
- These are created dynamically when viewing notifications

### 3. **Database Storage**
- All notifications are stored in the `notifications` table
- Each notification has:
  - `id`: Unique identifier
  - `user_id`: Owner of the notification
  - `title`: Notification title
  - `message`: Notification message
  - `type`: `info`, `warning`, `success`, or `error`
  - `priority`: `low`, `medium`, or `high`
  - `read`: Boolean indicating if notification has been read
  - `read_at`: Timestamp when notification was marked as read
  - `created_at`: Timestamp when notification was created
  - `related_type`: Optional type of related entity (e.g., 'task', 'bond')
  - `related_id`: Optional ID of related entity

## Viewing Notifications

Notifications can be viewed in the **Kinky Terminal**:

1. **Open Terminal**: Click the avatar/terminal icon in the bottom-right corner
2. **Navigate to Notifications**: Click the bell icon (🔔) in the dock
3. **View Details**: Notifications are displayed in a terminal-style format with:
   - Unread count badge on the bell icon
   - List of notifications with type icons
   - Timestamps
   - Action buttons (mark-read, delete)

## Clearing Notifications

### From the Terminal

The terminal provides multiple ways to manage notifications:

#### 1. **Mark Individual as Read**
- Click the `mark-read` button next to an unread notification
- This marks the notification as read but keeps it in the list

#### 2. **Delete Individual Notification**
- Click the `rm` button next to any notification
- This permanently deletes the notification

#### 3. **Mark All as Read**
- Click the `$ mark-all-read` button (shown when there are unread notifications)
- This marks all notifications as read but keeps them in the list
- Useful for clearing the unread count without deleting notifications

#### 4. **Clear All (Delete All)**
- Click the `$ clear-all` button
- This **permanently deletes all notifications**
- ⚠️ **Warning**: This action cannot be undone

### API Endpoints

The following API endpoints are available:

- `GET /api/notifications` - Get all notifications for the current user
- `POST /api/notifications/[id]/read` - Mark a notification as read
- `DELETE /api/notifications/[id]` - Delete a specific notification
- `POST /api/notifications/read-all` - Mark all notifications as read
- `POST /api/notifications/delete-all` - Delete all notifications

## Realtime Updates

The terminal subscribes to realtime updates for notifications:
- Channel: `user:{user_id}:notifications`
- Updates automatically when notifications are created, updated, or deleted
- Unread count badge updates in real-time

## Troubleshooting

### Notifications Not Clearing

If notifications aren't clearing properly:

1. **Check Database**: Verify notifications exist in the `notifications` table
2. **Check Permissions**: Ensure RLS policies allow the user to update/delete their notifications
3. **Refresh**: The terminal automatically refreshes after clearing, but you can manually refresh by switching views
4. **Check Console**: Look for errors in the browser console

### Unread Count Not Updating

If the unread count badge isn't updating:

1. **Realtime Connection**: Check if the realtime subscription is active (green indicator)
2. **Manual Refresh**: Switch to another view and back to notifications
3. **Check State**: The count is calculated from local state, ensure notifications are being updated

## Future Enhancements

Potential improvements:
- Notification preferences (email, push, etc.)
- Notification filtering by type/priority
- Notification grouping
- Notification history/archive
- Bulk operations (mark multiple as read, delete multiple)
