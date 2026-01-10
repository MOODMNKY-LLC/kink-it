# End-to-End Testing Guide - Dashboard & Submission State

**Date**: February 3, 2026  
**Purpose**: Comprehensive testing checklist for newly implemented features  
**Status**: Ready for Execution

---

## 🎯 Testing Overview

This guide covers testing for:
1. Dashboard Activity Feed
2. Pending Tasks Widget (Dominant)
3. Today's Tasks Widget (Submissive)
4. Submission State Management (Enhanced)
5. Integration between all components

---

## 📋 Pre-Testing Setup

### Prerequisites
- [ ] Two user accounts: one Dominant, one Submissive
- [ ] Users are linked as partners
- [ ] Some test data exists:
  - [ ] At least 3-5 tasks (some completed, some pending)
  - [ ] At least 1-2 check-ins
  - [ ] At least 1 reward (if available)
  - [ ] At least 1 submission state change log

### Browser Setup
- [ ] Open app in two browser windows/tabs
- [ ] Login as Dominant in Window 1
- [ ] Login as Submissive in Window 2
- [ ] Open browser DevTools (Console tab)

---

## 🧪 Test Suite 1: Dashboard Activity Feed

### Test 1.1: Activity Feed Display
**Steps**:
1. Navigate to dashboard as Dominant
2. Locate Activity Feed widget (right column, below Rebels Ranking)
3. Verify activities are displayed

**Expected Results**:
- ✅ Activity Feed card is visible
- ✅ Shows "Recent Activity" title
- ✅ Shows description: "Your and your partner's recent activities"
- ✅ Activities are listed with:
  - User avatar
  - User name
  - Activity description
  - Activity type badge
  - Relative timestamp ("2 hours ago", etc.)
- ✅ Activities are sorted by most recent first
- ✅ Icons and colors match activity types

**Test Data Needed**: 
- Completed tasks
- Check-ins
- Rewards (if any)
- State changes

---

### Test 1.2: Activity Feed Realtime Updates
**Steps**:
1. Keep both browser windows open (Dominant and Submissive)
2. As Submissive, complete a task
3. Watch Dominant's Activity Feed

**Expected Results**:
- ✅ New activity appears in Activity Feed within 1-2 seconds
- ✅ Activity shows correct information
- ✅ No page refresh required
- ✅ Console shows no errors

---

### Test 1.3: Activity Feed Empty State
**Steps**:
1. Create a new test user with no activities
2. Navigate to dashboard
3. Check Activity Feed

**Expected Results**:
- ✅ Shows empty state message
- ✅ Message: "No recent activity. Complete tasks, submit check-ins, or earn rewards to see activity here."
- ✅ No errors in console

---

### Test 1.4: Activity Feed Role-Based Filtering
**Steps**:
1. As Submissive, check Activity Feed
2. As Dominant, check Activity Feed

**Expected Results**:
- ✅ Submissive sees only their own activities
- ✅ Dominant sees both their own and partner's activities
- ✅ Description text matches role

---

## 🧪 Test Suite 2: Pending Tasks Widget (Dominant)

### Test 2.1: Widget Display
**Steps**:
1. Login as Dominant
2. Navigate to dashboard
3. Locate Pending Tasks Widget

**Expected Results**:
- ✅ Widget is visible (left column, above Activity Feed)
- ✅ Shows "Pending Tasks" title
- ✅ Shows description: "Tasks assigned to your partner that need attention"
- ✅ Lists tasks assigned to partner
- ✅ Tasks show:
  - Title
  - Priority badge (with color)
  - Due date status (overdue, due today, or relative time)
  - Point value (if available)
  - Quick action button (arrow)
- ✅ Tasks sorted by urgency (due date, then priority)

---

### Test 2.2: Widget Realtime Updates
**Steps**:
1. As Dominant, view Pending Tasks Widget
2. As Submissive (in other window), create a new task assigned to them
3. Watch Dominant's widget

**Expected Results**:
- ✅ New task appears in widget within 1-2 seconds
- ✅ Task shows correct information
- ✅ No page refresh required

---

### Test 2.3: Widget Empty State
**Steps**:
1. As Dominant with no pending tasks for partner
2. Check widget

**Expected Results**:
- ✅ Shows empty state with checkmark icon
- ✅ Message: "No pending tasks"
- ✅ Sub-message: "All tasks are completed or approved"

---

### Test 2.4: Widget Quick Actions
**Steps**:
1. Click arrow button on a task
2. Click "View All Tasks" link

**Expected Results**:
- ✅ Arrow button navigates to task detail page
- ✅ "View All Tasks" navigates to tasks page with pending filter
- ✅ Navigation works correctly

---

## 🧪 Test Suite 3: Today's Tasks Widget (Submissive)

### Test 3.1: Widget Display (Active State)
**Steps**:
1. Login as Submissive
2. Ensure submission state is "active"
3. Navigate to dashboard
4. Locate Today's Tasks Widget

**Expected Results**:
- ✅ Widget is visible
- ✅ Shows "Today's Tasks" title
- ✅ Shows description with task count
- ✅ Lists tasks due today or overdue
- ✅ Tasks show:
  - Title
  - Priority badge
  - Due date status (with overdue indicator if applicable)
  - Point value
  - Quick action button
- ✅ Overdue tasks have red background highlight

---

### Test 3.2: Widget Paused State
**Steps**:
1. As Submissive, change submission state to "paused"
2. Check Today's Tasks Widget

**Expected Results**:
- ✅ Widget shows paused state message
- ✅ Pause icon displayed
- ✅ Message: "Tasks are paused"
- ✅ Guidance: "Change your submission state to 'Active' or 'Low Energy' to see tasks"
- ✅ No tasks displayed

---

### Test 3.3: Widget Realtime Updates
**Steps**:
1. As Submissive, view Today's Tasks Widget
2. As Dominant, assign a new task due today
3. Watch Submissive's widget

**Expected Results**:
- ✅ New task appears within 1-2 seconds
- ✅ Task shows correct information
- ✅ No page refresh required

---

### Test 3.4: Widget Submission State Respect
**Steps**:
1. As Submissive, ensure state is "active"
2. Note tasks in widget
3. Change state to "paused"
4. Check widget again

**Expected Results**:
- ✅ Tasks disappear when paused
- ✅ Paused message appears
- ✅ Change back to "active"
- ✅ Tasks reappear

---

## 🧪 Test Suite 4: Submission State Management

### Test 4.1: State Change Dialog
**Steps**:
1. As Submissive, click on a different state button
2. Observe dialog

**Expected Results**:
- ✅ Dialog appears
- ✅ Shows state name in title
- ✅ Shows appropriate description
- ✅ For paused: Shows warning list
- ✅ Reason input field is visible
- ✅ Cancel and Confirm buttons present

---

### Test 4.2: State Change with Reason
**Steps**:
1. As Submissive, click to change state
2. Enter reason in dialog: "Testing state change"
3. Click "Confirm Change"

**Expected Results**:
- ✅ Loading toast appears: "Updating submission state..."
- ✅ Dialog closes
- ✅ Success toast appears with state transition
- ✅ Toast shows reason if provided
- ✅ State updates in UI
- ✅ Reason is saved to database

---

### Test 4.3: State Change Realtime Sync
**Steps**:
1. Keep both windows open (Dominant and Submissive)
2. As Submissive, change state
3. Watch Dominant's dashboard

**Expected Results**:
- ✅ Dominant sees state change within 1-2 seconds
- ✅ Submission State Display updates automatically
- ✅ No page refresh required
- ✅ Console shows no errors

---

### Test 4.4: State Enforcement - Task Hiding
**Steps**:
1. As Submissive, ensure some pending tasks exist
2. Change state to "paused"
3. Navigate to Tasks page

**Expected Results**:
- ✅ Pending tasks are hidden
- ✅ Only completed/approved tasks visible
- ✅ Today's Tasks Widget shows paused message
- ✅ Change back to "active"
- ✅ Tasks reappear

---

### Test 4.5: State Enforcement - Task Assignment Blocking
**Steps**:
1. As Submissive, change state to "paused"
2. As Dominant, try to create a task assigned to Submissive
3. Observe result

**Expected Results**:
- ✅ Task creation fails
- ✅ Error message: "Cannot assign tasks when submission is paused"
- ✅ Task is not created
- ✅ Console shows 403 error

---

### Test 4.6: Audit Logging
**Steps**:
1. As Submissive, change state (with reason)
2. Query database: `SELECT * FROM submission_state_logs WHERE user_id = '<submissive_id>' ORDER BY created_at DESC LIMIT 1`

**Expected Results**:
- ✅ Log entry exists
- ✅ Contains correct user_id
- ✅ Contains previous_state
- ✅ Contains new_state
- ✅ Contains reason (if provided)
- ✅ Contains created_at timestamp

---

## 🧪 Test Suite 5: Integration Testing

### Test 5.1: Dashboard Load Performance
**Steps**:
1. Open dashboard
2. Measure load time
3. Check browser DevTools Network tab

**Expected Results**:
- ✅ Dashboard loads in < 2 seconds
- ✅ All widgets load within 3 seconds
- ✅ No blocking requests
- ✅ Realtime subscriptions connect quickly

---

### Test 5.2: Multiple Realtime Subscriptions
**Steps**:
1. Open dashboard
2. Check browser DevTools Console
3. Verify Realtime connections

**Expected Results**:
- ✅ Multiple Realtime channels subscribed
- ✅ No subscription errors
- ✅ Channels clean up on navigation
- ✅ No memory leaks (check over time)

---

### Test 5.3: Role-Based Dashboard Rendering
**Steps**:
1. Login as Dominant, check dashboard
2. Login as Submissive, check dashboard
3. Login as Switch, check dashboard

**Expected Results**:
- ✅ Dominant sees: Pending Tasks Widget, Activity Feed
- ✅ Submissive sees: Today's Tasks Widget, Activity Feed
- ✅ Switch sees: Both widgets (if partner exists), Activity Feed
- ✅ No widgets show for wrong role
- ✅ Layout is correct for each role

---

### Test 5.4: Mobile Responsiveness
**Steps**:
1. Open dashboard on mobile device (or resize browser)
2. Check layout

**Expected Results**:
- ✅ Widgets stack vertically on small screens
- ✅ Text is readable
- ✅ Buttons are tappable
- ✅ No horizontal scrolling
- ✅ Activity Feed is scrollable

---

## 🐛 Common Issues & Solutions

### Issue: Activities Not Appearing
**Possible Causes**:
- Realtime subscription not connected
- Database query failing
- No activities exist

**Solutions**:
- Check browser console for errors
- Verify Realtime connection status
- Check database for activities
- Verify user IDs match

---

### Issue: Widgets Not Updating
**Possible Causes**:
- Realtime subscription failed
- Filter syntax incorrect
- User ID mismatch

**Solutions**:
- Check Realtime channel status
- Verify filter syntax in code
- Check user IDs in queries

---

### Issue: State Changes Not Syncing
**Possible Causes**:
- Realtime broadcast not working
- Channel not subscribed
- Network issues

**Solutions**:
- Check Realtime connection
- Verify channel subscription
- Check network connectivity
- Review browser console

---

## ✅ Success Criteria

### All Tests Pass When:
- ✅ All widgets display correctly
- ✅ Realtime updates work for all components
- ✅ State enforcement works correctly
- ✅ No console errors
- ✅ Performance is acceptable
- ✅ Mobile responsive
- ✅ Role-based rendering works

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________

Dashboard Activity Feed:
- Test 1.1: [ ] Pass [ ] Fail - Notes: ___________
- Test 1.2: [ ] Pass [ ] Fail - Notes: ___________
- Test 1.3: [ ] Pass [ ] Fail - Notes: ___________
- Test 1.4: [ ] Pass [ ] Fail - Notes: ___________

Pending Tasks Widget:
- Test 2.1: [ ] Pass [ ] Fail - Notes: ___________
- Test 2.2: [ ] Pass [ ] Fail - Notes: ___________
- Test 2.3: [ ] Pass [ ] Fail - Notes: ___________
- Test 2.4: [ ] Pass [ ] Fail - Notes: ___________

Today's Tasks Widget:
- Test 3.1: [ ] Pass [ ] Fail - Notes: ___________
- Test 3.2: [ ] Pass [ ] Fail - Notes: ___________
- Test 3.3: [ ] Pass [ ] Fail - Notes: ___________
- Test 3.4: [ ] Pass [ ] Fail - Notes: ___________

Submission State:
- Test 4.1: [ ] Pass [ ] Fail - Notes: ___________
- Test 4.2: [ ] Pass [ ] Fail - Notes: ___________
- Test 4.3: [ ] Pass [ ] Fail - Notes: ___________
- Test 4.4: [ ] Pass [ ] Fail - Notes: ___________
- Test 4.5: [ ] Pass [ ] Fail - Notes: ___________
- Test 4.6: [ ] Pass [ ] Fail - Notes: ___________

Integration:
- Test 5.1: [ ] Pass [ ] Fail - Notes: ___________
- Test 5.2: [ ] Pass [ ] Fail - Notes: ___________
- Test 5.3: [ ] Pass [ ] Fail - Notes: ___________
- Test 5.4: [ ] Pass [ ] Fail - Notes: ___________

Overall Status: [ ] Ready for Production [ ] Needs Fixes

Issues Found:
1. ___________
2. ___________
3. ___________
```

---

**Testing Guide Version**: 1.0  
**Created**: February 3, 2026  
**Status**: Ready for Execution
