# Comprehensive Testing Guide

**Date**: 2026-01-05  
**Purpose**: Complete testing guide for KINK IT MVP features

---

## ✅ Completed Setup

### Database
- ✅ All migrations applied successfully
- ✅ Seed data created (2 users, 6 tasks, 3 templates)
- ✅ RLS policies configured
- ✅ Indexes created for performance

### Seed Data
- ✅ **Simeon** (Dominant/Admin): `simeon@kinkit.app` / `password123`
- ✅ **Kevin** (Submissive): `kevin@kinkit.app` / `password123`
- ✅ 6 sample tasks with various statuses
- ✅ 3 task templates
- ✅ 2 task proof submissions

### Scripts Created
- ✅ `pnpm seed` - Run seed script
- ✅ `pnpm seed:reset` - Reset database and seed
- ✅ `pnpm test:api` - Test API endpoints

---

## 🧪 Testing Workflow

### Phase 1: API Endpoint Testing

**Prerequisites**: Dev server must be running

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run API tests
pnpm test:api
```

**What Gets Tested**:
- ✅ Authentication (both users)
- ✅ GET /api/submission-state
- ✅ PATCH /api/submission-state
- ✅ GET /api/tasks
- ✅ GET /api/tasks/[id]
- ✅ PATCH /api/tasks/[id]
- ✅ POST /api/tasks (Dominant only)
- ✅ DELETE /api/tasks/[id]

**Expected Results**: All endpoints should return 200 OK with correct data

---

### Phase 2: UI Component Testing

#### Test 1: Login as Kevin (Submissive)

1. Navigate to: `http://127.0.0.1:3000/auth/login`
2. Login: `kevin@kinkit.app` / `password123`

**Dashboard Tests**:
- [ ] Submission state selector is visible
- [ ] Current state shows as "Active"
- [ ] Can change state to "Low Energy"
- [ ] Can change state to "Paused"
- [ ] State persists after page refresh

**Tasks Page Tests**:
- [ ] All 6 tasks are visible
- [ ] Tasks show correct status badges
- [ ] Can update task status (pending → in_progress → completed)
- [ ] Cannot create new tasks (only dominants can)
- [ ] Cannot delete tasks (only dominants can)

**Submission State Enforcement**:
- [ ] Change state to "Paused"
- [ ] Verify no new tasks can be assigned (test via API or UI)

---

#### Test 2: Login as Simeon (Dominant)

1. Navigate to: `http://127.0.0.1:3000/auth/login`
2. Login: `simeon@kinkit.app` / `password123`

**Dashboard Tests**:
- [ ] Kevin's submission state is displayed (read-only)
- [ ] State updates when Kevin changes it (if Realtime enabled)
- [ ] Admin badge is visible

**Tasks Page Tests**:
- [ ] All 6 tasks are visible
- [ ] Can create new tasks for Kevin
- [ ] Can approve completed tasks
- [ ] Can delete tasks
- [ ] Cannot assign tasks when Kevin is paused

**Task Creation Tests**:
- [ ] Create task form is visible
- [ ] Can select Kevin as assignee
- [ ] Can set priority, due date, point value
- [ ] Can require proof (photo/video/text)
- [ ] Task appears in list after creation

**Task Approval Tests**:
- [ ] Find a "completed" task
- [ ] Click "Approve Task" button
- [ ] Task status changes to "approved"
- [ ] Approved badge appears

---

### Phase 3: End-to-End User Flows

#### Flow 1: Complete Task Cycle

1. **Simeon creates task**
   - Login as Simeon
   - Create new task: "Test Task"
   - Assign to Kevin
   - Set due date: Tomorrow
   - Set priority: High

2. **Kevin receives task**
   - Login as Kevin
   - Verify task appears in list
   - Click "Start Task"
   - Verify status changes to "in_progress"

3. **Kevin completes task**
   - Add completion notes
   - Click "Mark Complete"
   - Verify status changes to "completed"

4. **Simeon approves task**
   - Login as Simeon
   - Find completed task
   - Click "Approve Task"
   - Verify status changes to "approved"

**Expected**: Complete cycle works without errors

---

#### Flow 2: Submission State Change

1. **Kevin changes state**
   - Login as Kevin
   - Change submission state to "Low Energy"
   - Verify state updates in database

2. **Simeon sees change**
   - Login as Simeon
   - Verify dashboard shows "Low Energy"
   - Verify can still create tasks (low_energy allows tasks)

3. **Kevin pauses**
   - Login as Kevin
   - Change state to "Paused"
   - Verify state updates

4. **Simeon cannot assign**
   - Login as Simeon
   - Attempt to create task for Kevin
   - **Expected**: Error message - "Cannot assign tasks to a paused submissive"

---

### Phase 4: Error Handling Tests

#### Test Error Scenarios

1. **Unauthorized Access**
   - [ ] Kevin cannot create tasks
   - [ ] Kevin cannot delete tasks
   - [ ] Kevin cannot approve tasks
   - [ ] Simeon cannot change submission state

2. **Invalid Data**
   - [ ] Create task without title → Error
   - [ ] Create task without assignee → Error
   - [ ] Update task with invalid status → Error

3. **Submission State Enforcement**
   - [ ] Attempt to assign task to paused submissive → Error
   - [ ] Verify error message is clear

---

## 📊 Test Results Tracking

### API Endpoints
- [ ] GET /api/submission-state - ✅ / ❌
- [ ] PATCH /api/submission-state - ✅ / ❌
- [ ] GET /api/tasks - ✅ / ❌
- [ ] GET /api/tasks/[id] - ✅ / ❌
- [ ] PATCH /api/tasks/[id] - ✅ / ❌
- [ ] POST /api/tasks - ✅ / ❌
- [ ] DELETE /api/tasks/[id] - ✅ / ❌

### UI Components
- [ ] Login (Kevin) - ✅ / ❌
- [ ] Login (Simeon) - ✅ / ❌
- [ ] Dashboard (Kevin) - ✅ / ❌
- [ ] Dashboard (Simeon) - ✅ / ❌
- [ ] Tasks Page (Kevin) - ✅ / ❌
- [ ] Tasks Page (Simeon) - ✅ / ❌
- [ ] Submission State Selector - ✅ / ❌
- [ ] Submission State Display - ✅ / ❌
- [ ] Task Cards - ✅ / ❌
- [ ] Create Task Form - ✅ / ❌

### User Flows
- [ ] Complete Task Cycle - ✅ / ❌
- [ ] Submission State Change - ✅ / ❌
- [ ] Task Enforcement - ✅ / ❌

---

## 🐛 Known Issues

### Realtime
- ⚠️ Realtime triggers are commented out for local development
- ⚠️ State changes won't update in real-time until production
- ✅ Workaround: Page refresh shows updated state

### Seed Data
- ✅ Seed script works correctly
- ✅ Data persists after reset
- ✅ Can re-run seed script safely (idempotent)

---

## 🚀 Next Steps After Testing

1. **Fix Any Bugs Found**
   - Document issues
   - Create fixes
   - Re-test

2. **Production Deployment**
   - Uncomment Realtime triggers
   - Push migrations to production
   - Test in production environment

3. **Future Features**
   - Communication features (messages, check-ins)
   - Dashboard real data (replace mock data)
   - Task filtering UI
   - Proof upload (Supabase Storage)

---

## 📝 Test Checklist Summary

**Quick Test** (5 minutes):
- [ ] Login as Kevin → See tasks
- [ ] Login as Simeon → See all tasks
- [ ] Create task as Simeon
- [ ] Complete task as Kevin
- [ ] Approve task as Simeon

**Full Test** (30 minutes):
- [ ] Run all API endpoint tests
- [ ] Test all UI components
- [ ] Test all user flows
- [ ] Test error scenarios
- [ ] Verify submission state enforcement

---

**Status**: Ready for comprehensive testing



