# KINK IT MVP Sprint Plan

**Sprint Duration**: 8-12 weeks  
**Start Date**: 2026-01-05  
**Target Completion**: 2026-03-05

---

## Sprint Overview

This sprint plan covers Phase 1 MVP implementation, focusing on the foundational "Protocol & Covenant Spine" features that enable the core D/s relationship management functionality.

### Sprint Goals

1. ✅ User authentication (Notion OAuth) - **COMPLETE**
2. ✅ Profile management (basic) - **COMPLETE**
3. ⏳ Submission state management - **IN PROGRESS**
4. ⏳ Basic task management - **PENDING**
5. ⏳ Basic communication - **PENDING**
6. ⏳ Enhanced dashboard - **PENDING**
7. ✅ App Ideas system - **COMPLETE**

---

## Sprint 1: Submission State Management (Week 1)

**Duration**: 5 days  
**Goal**: Implement foundational submission state feature

### Tasks

- [x] Create technical specification document
- [ ] Create database migration for submission_state
- [ ] Add submission_state to Profile type
- [ ] Create API endpoint for state updates
- [ ] Create SubmissionStateSelector component (submissive)
- [ ] Create SubmissionStateDisplay component (dominant)
- [ ] Add state selector to dashboard
- [ ] Add state display to dashboard (dominant view)
- [ ] Implement Realtime subscription for state changes
- [ ] Add state change logging
- [ ] Write tests for state management
- [ ] Update documentation

### Definition of Done

- Submissive can declare their state (one-click)
- Dominant can see partner's state (read-only)
- State changes are logged
- State changes appear in real-time
- State is displayed prominently on dashboard

---

## Sprint 2: Task Management Foundation (Weeks 2-3)

**Duration**: 10 days  
**Goal**: Implement core task management functionality

### Tasks

- [ ] Create technical specification document
- [ ] Create database migration for tasks table
- [ ] Create database migration for task_proof table
- [ ] Create database migration for task_templates table
- [ ] Add RLS policies for tasks
- [ ] Create API endpoint for task creation (POST /api/tasks)
- [ ] Create API endpoint for task updates (PATCH /api/tasks/[id])
- [ ] Create API endpoint for task list (GET /api/tasks)
- [ ] Implement submission state enforcement in task APIs
- [ ] Create TaskCard component
- [ ] Create TaskList component (submissive view)
- [ ] Create TaskList component (dominant view)
- [ ] Create CreateTaskForm component
- [ ] Create ProofUpload component
- [ ] Update /tasks page with real data
- [ ] Implement Realtime subscriptions for tasks
- [ ] Write tests for task management
- [ ] Update documentation

### Definition of Done

- Dominant can create and assign tasks
- Submissive can view assigned tasks
- Submissive can mark tasks complete
- Submissive can upload proof
- Dominant can approve/reject completions
- Tasks respect submission state
- Task list updates in real-time

---

## Sprint 3: Basic Communication (Week 4)

**Duration**: 5 days  
**Goal**: Implement basic messaging and check-ins

### Tasks

- [ ] Create technical specification document
- [ ] Create database migration for messages table
- [ ] Create database migration for check_ins table
- [ ] Add RLS policies for messages and check-ins
- [ ] Create API endpoint for messages (POST /api/messages)
- [ ] Create API endpoint for check-ins (POST /api/check-ins)
- [ ] Create MessageList component
- [ ] Create MessageComposer component
- [ ] Create CheckInForm component (Green/Yellow/Red)
- [ ] Create /communication page
- [ ] Implement Realtime subscriptions for messages
- [ ] Add check-in history view
- [ ] Write tests for communication features
- [ ] Update documentation

### Definition of Done

- Partners can send messages to each other
- Messages appear in real-time
- Submissive can submit check-ins (Green/Yellow/Red)
- Check-in history is viewable
- Communication respects submission state

---

## Sprint 4: Enhanced Dashboard (Week 5)

**Duration**: 5 days  
**Goal**: Replace mock data with real data, add role-based views

### Tasks

- [ ] Create technical specification document
- [ ] Create API endpoint for dashboard data aggregation
- [ ] Create DashboardStats component (real data)
- [ ] Create ActivityFeed component
- [ ] Create QuickActions component
- [ ] Update dashboard to show submission state prominently
- [ ] Add task summary widget
- [ ] Add points balance widget
- [ ] Add recent messages widget
- [ ] Implement role-based dashboard views
- [ ] Add Realtime subscriptions for dashboard updates
- [ ] Optimize dashboard queries (caching, aggregation)
- [ ] Write tests for dashboard
- [ ] Update documentation

### Definition of Done

- Dashboard shows real data (no mock data)
- Role-based views work correctly
- Submission state is prominently displayed
- Quick actions are functional
- Dashboard updates in real-time
- All widgets load within 2 seconds

---

## Sprint 5: Polish & Testing (Weeks 6-8)

**Duration**: 15 days  
**Goal**: Polish features, fix bugs, comprehensive testing

### Tasks

- [ ] End-to-end testing of all features
- [ ] Performance optimization
- [ ] Accessibility audit and fixes
- [ ] Mobile responsiveness testing
- [ ] Security audit
- [ ] Bug fixes
- [ ] UI/UX polish
- [ ] Documentation completion
- [ ] User acceptance testing preparation
- [ ] Deployment preparation

### Definition of Done

- All features work end-to-end
- Performance meets requirements
- Accessibility standards met
- Mobile responsive
- Security audit passed
- Documentation complete
- Ready for user acceptance testing

---

## Risk Management

### High-Risk Items

1. **Submission State Enforcement**: Critical for safety, must work correctly
   - **Mitigation**: Extensive testing, code reviews, manual testing with both users

2. **Realtime Synchronization**: Complex, performance-sensitive
   - **Mitigation**: Incremental implementation, performance testing, fallback strategies

3. **File Uploads (Proof)**: Storage, security, performance concerns
   - **Mitigation**: Use Supabase Storage, implement file validation, size limits

### Dependencies

- Supabase Realtime must be working
- Supabase Storage must be configured
- Notion OAuth must be working (already done)

---

## Success Metrics

### Technical Metrics

- All acceptance criteria met
- Test coverage > 80%
- Page load times < 2 seconds
- Zero critical security vulnerabilities
- Zero data loss incidents

### User Metrics

- Both users can authenticate
- Submission state can be declared and enforced
- Tasks can be created, assigned, and completed
- Basic communication works
- Dashboard displays relevant information

---

## Next Steps After MVP

1. **Phase 2**: Rules & Protocols Management
2. **Phase 3**: Rewards & Recognition System
3. **Phase 4**: Contract & Consent Management
4. **Phase 5**: Kink Exploration & Boundaries

---

**Last Updated**: 2026-01-05  
**Status**: Active  
**Next Review**: End of Sprint 1
