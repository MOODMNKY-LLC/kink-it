# Bond Discovery and Request-to-Join System

**Date**: 2026-02-03  
**Status**: ✅ Implementation Complete

---

## Overview

Implemented a comprehensive bond discovery and request-to-join system that works alongside the existing invite code method. Users can now browse public bonds, view bond details, request to join, and bond admins receive notifications and can approve/reject requests through the admin dashboard.

---

## Features

### User Features

1. **Bond Discovery**
   - Browse public bonds (bonds with `is_private = false`)
   - Search bonds by name or description
   - Filter by bond type (dyad, polycule, household, dynamic)
   - Filter by status (forming, active)
   - View bond details: name, description, member count, creator, creation date

2. **Request to Join**
   - Request to join any discoverable bond
   - Optional message to bond admins
   - View pending request status
   - See approval/rejection status

3. **Notifications**
   - Receive notification when request is approved
   - Receive notification when request is rejected (with optional notes)

### Admin Features

1. **Join Request Management**
   - View all join requests for bonds they manage
   - Filter by status (pending, approved, rejected)
   - Review request details (requester info, message, bond info)
   - Approve or reject requests with optional review notes
   - See request history

2. **Notifications**
   - Receive notification when new join request is created
   - Notification includes requester name and bond name
   - Direct link to review request in admin dashboard

---

## Database Schema

### `bond_join_requests` Table

```sql
CREATE TABLE public.bond_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id uuid NOT NULL REFERENCES public.bonds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Request details
  status join_request_status NOT NULL DEFAULT 'pending',
  message text,
  
  -- Review details
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index ensures one pending request per user per bond
CREATE UNIQUE INDEX idx_bond_join_requests_unique_pending 
ON public.bond_join_requests(bond_id, user_id) 
WHERE status = 'pending';
```

### `join_request_status` Enum

```sql
CREATE TYPE join_request_status AS ENUM (
  'pending',    -- Request submitted, awaiting review
  'approved',   -- Request approved, user can join
  'rejected'    -- Request rejected
);
```

---

## API Routes

### `GET /api/bonds/browse`

Browse discoverable bonds.

**Query Parameters:**
- `search` (optional): Search query for bond name/description
- `type` (optional): Filter by bond type
- `status` (optional): Filter by bond status

**Response:**
```json
{
  "success": true,
  "bonds": [
    {
      "id": "uuid",
      "name": "Bond Name",
      "description": "Description",
      "bond_type": "dyad",
      "bond_status": "active",
      "member_count": 2,
      "creator_name": "Creator Name",
      "has_pending_request": false,
      "request_status": null
    }
  ],
  "total": 10
}
```

### `POST /api/bonds/request`

Create a join request.

**Body:**
```json
{
  "bond_id": "uuid",
  "message": "Optional message"
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "uuid",
    "bond_id": "uuid",
    "status": "pending",
    "created_at": "2026-02-03T..."
  }
}
```

### `GET /api/bonds/requests`

Get join requests for bonds the user manages.

**Query Parameters:**
- `bond_id` (optional): Filter by bond ID
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "bond_id": "uuid",
      "user_id": "uuid",
      "status": "pending",
      "message": "Request message",
      "created_at": "2026-02-03T...",
      "bond": {
        "id": "uuid",
        "name": "Bond Name",
        "bond_type": "dyad",
        "bond_status": "active"
      },
      "requester": {
        "id": "uuid",
        "display_name": "Requester Name",
        "email": "requester@example.com",
        "dynamic_role": "submissive"
      }
    }
  ],
  "total": 5
}
```

### `POST /api/bonds/requests/[id]/approve`

Approve a join request.

**Body:**
```json
{
  "review_notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Join request approved successfully"
}
```

**Side Effects:**
- Adds user as member to bond
- Updates user's `bond_id` in profiles
- Updates bond status to "active" if it was "forming"
- Creates notification for requester

### `POST /api/bonds/requests/[id]/reject`

Reject a join request.

**Body:**
```json
{
  "review_notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Join request rejected successfully"
}
```

**Side Effects:**
- Creates notification for requester with rejection reason

---

## RLS Policies

### Bonds Table

**Policy: "Users can browse public bonds"**
- Allows authenticated users to `SELECT` bonds where `is_private = false` and `bond_status IN ('forming', 'active')`
- Enables discovery without exposing private bonds

### `bond_join_requests` Table

**Policy: "Users can view their own join requests"**
- Users can view their own requests

**Policy: "Bond admins can view join requests for their bonds"**
- Bond creators and managers can view requests for their bonds
- Admins can view all requests

**Policy: "Users can create join requests"**
- Users can create requests for bonds that are accepting members
- Prevents duplicate pending requests (enforced by unique index)
- Prevents requests if user is already a member

**Policy: "Bond admins can update join requests"**
- Bond creators and managers can approve/reject requests
- Admins can approve/reject any request
- Only allows status changes to 'approved' or 'rejected'

---

## UI Components

### `BondDiscovery` Component

**Location:** `components/bonds/bond-discovery.tsx`

**Features:**
- Search and filter bonds
- Grid layout with bond cards
- Request dialog with optional message
- Shows pending/approved/rejected status
- MagicCard styling for visual appeal

**Usage:**
```tsx
<BondDiscovery profile={profile} />
```

### Admin Dashboard Integration

**Location:** `components/admin/admin-bond-management.tsx`

**Features:**
- Tabs for "Bonds" and "Join Requests"
- Badge showing pending request count
- Filter by request status
- Table view of all requests
- Review dialog with approve/reject actions
- Review notes input

---

## Notifications

### When Request is Created

**Recipients:** Bond creators and managers

**Notification:**
```json
{
  "title": "New Bond Join Request",
  "message": "{Requester Name} has requested to join \"{Bond Name}\"",
  "type": "info",
  "priority": "medium",
  "related_type": "bond_join_request",
  "related_id": "{request_id}",
  "action_url": "/admin/bonds?tab=requests&request={request_id}",
  "action_label": "Review Request"
}
```

### When Request is Approved

**Recipients:** Requester

**Notification:**
```json
{
  "title": "Bond Join Request Approved",
  "message": "Your request to join \"{Bond Name}\" has been approved!",
  "type": "success",
  "priority": "high",
  "related_type": "bond",
  "related_id": "{bond_id}",
  "action_url": "/bonds/{bond_id}",
  "action_label": "View Bond"
}
```

### When Request is Rejected

**Recipients:** Requester

**Notification:**
```json
{
  "title": "Bond Join Request Rejected",
  "message": "Your request to join \"{Bond Name}\" has been rejected.{Review Notes}",
  "type": "error",
  "priority": "medium",
  "related_type": "bond_join_request",
  "related_id": "{request_id}"
}
```

---

## Migration Files

1. **`20260203000002_create_bond_join_requests.sql`**
   - Creates `bond_join_requests` table
   - Creates `join_request_status` enum
   - Sets up indexes and RLS policies

2. **`20260203000003_allow_browsing_public_bonds.sql`**
   - Adds RLS policy to allow browsing public bonds

---

## Integration Points

### Bonds Page

**Location:** `app/bonds/page.tsx`

- Shows `BondDiscovery` component when user has no bonds
- Tabs for "Discover Bonds" and "My Bonds"
- Redirects to bond detail page if user has bonds

### Admin Dashboard

**Location:** `app/admin/bonds/page.tsx`

- Shows `AdminBondManagement` component
- Includes join requests tab with pending count badge

---

## Workflow

### User Request Flow

1. User browses discoverable bonds on `/bonds` page
2. User clicks "Request to Join" on a bond card
3. User optionally adds a message
4. User submits request
5. Request is created with status "pending"
6. Bond admins receive notification
7. Admin reviews request in admin dashboard
8. Admin approves or rejects with optional notes
9. User receives notification of decision
10. If approved, user is added as member and bond status updated

### Admin Approval Flow

1. Admin receives notification of new request
2. Admin navigates to admin dashboard → Bonds → Join Requests tab
3. Admin clicks "Review" on pending request
4. Admin views requester info, message, and bond details
5. Admin optionally adds review notes
6. Admin clicks "Approve" or "Reject"
7. Request status updated
8. If approved:
   - User added to `bond_members`
   - User's `bond_id` updated
   - Bond status set to "active" if "forming"
9. Notification sent to requester

---

## Security Considerations

1. **RLS Policies**
   - Only public bonds are discoverable
   - Users can only create requests for bonds accepting members
   - Only bond admins can approve/reject requests
   - Users can only view their own requests

2. **Validation**
   - Prevents duplicate pending requests (unique index)
   - Prevents requests if user is already a member
   - Prevents requests for bonds not accepting members
   - Validates admin permissions before approval/rejection

3. **Notifications**
   - Only bond admins receive request notifications
   - Only requesters receive approval/rejection notifications

---

## Future Enhancements

1. **Bulk Actions**
   - Approve/reject multiple requests at once
   - Filter by bond, requester, date range

2. **Request History**
   - View all past requests (approved/rejected)
   - Search and filter request history

3. **Auto-Approval**
   - Option for bonds to auto-approve requests
   - Criteria-based auto-approval (e.g., matching dynamic roles)

4. **Request Templates**
   - Pre-filled messages for common scenarios
   - Customizable request questions

5. **Analytics**
   - Track request approval rates
   - Monitor bond discovery metrics

---

## Testing Checklist

- [ ] Browse public bonds
- [ ] Search and filter bonds
- [ ] Request to join a bond
- [ ] View pending request status
- [ ] Admin receives notification
- [ ] Admin views join requests
- [ ] Admin approves request
- [ ] User receives approval notification
- [ ] User is added as member
- [ ] Admin rejects request with notes
- [ ] User receives rejection notification
- [ ] Prevent duplicate pending requests
- [ ] Prevent request if already member
- [ ] RLS policies enforce access control
- [ ] Notifications work correctly

---

## Related Documentation

- `docs/BOND_INVITE_CODE_FIX.md` - Invite code joining method
- `docs/COMPREHENSIVE_CHAT_AND_NOTIFICATIONS_IMPLEMENTATION.md` - Notification system

---

## Notes

- This system works **alongside** the invite code method - both are available
- Private bonds (`is_private = true`) are not discoverable but can still be joined via invite code
- Public bonds can be joined via either method (discovery + request OR invite code)
- Bond admins can manage both invite codes and join requests through the admin dashboard
