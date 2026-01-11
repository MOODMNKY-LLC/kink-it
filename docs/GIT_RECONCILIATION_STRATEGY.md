# Git Reconciliation Strategy - Local vs Remote Changes

**Date**: 2026-01-11  
**Situation**: Local changes not pushed, remote has 4 new commits

---

## Current State Analysis

### Remote Changes (4 commits ahead)
- `2c36048` - feat: add multi-database sync and new Notion fields
- `2dd94e4` - feat: add multi-database sync and new fields  
- `0578931` - feat: add Notion sync fields and migration
- `405e966` - feat: add Notion sync fields and multi-database sync system

### Local Changes (Not Committed)

**Modified Files** (~100+ files):
- Chat components (kinky-chat-interface, enhanced-chat-input-bar, command-window)
- YouTube transcript integration
- Chat settings panel and help dialog
- Various migrations
- Documentation files

**Untracked Files** (New):
- `components/chat/chat-settings-panel.tsx`
- `components/chat/chat-help-dialog.tsx`
- `components/chat/kinky-chat-interface.tsx`
- `app/api/youtube/transcript/route.ts`
- `lib/youtube/youtube-transcript.ts`
- `supabase/migrations/20260111000001_create_user_chat_settings.sql`
- Multiple documentation files

**Deleted Files**:
- Several migration files (likely renamed/reorganized)

---

## Recommended Strategy: Stash → Pull → Reapply

### Step 1: Stash Local Changes
```bash
# Stash all changes (including untracked files)
git stash push -u -m "Local chat UI improvements and YouTube transcript integration"
```

**Why**: Preserves all local work without committing, allows clean pull

### Step 2: Pull Remote Changes
```bash
# Pull remote changes
git pull origin main
```

**Why**: Gets the 4 commits from remote (multi-database sync features)

### Step 3: Reapply Local Changes
```bash
# Reapply stashed changes
git stash pop
```

**Why**: Brings back local changes on top of remote changes

### Step 4: Resolve Conflicts (if any)
```bash
# Check for conflicts
git status

# If conflicts exist, resolve them manually
# Then stage resolved files
git add <resolved-files>
```

**Why**: Ensures both sets of changes work together

### Step 5: Test & Commit
```bash
# Test the application
pnpm dev

# If everything works, commit
git add .
git commit -m "feat: add chat UI improvements, YouTube transcript integration, and settings panel"
```

---

## Alternative Strategy: Commit → Pull → Merge

If you prefer to preserve commit history:

### Step 1: Commit Local Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: chat UI improvements, YouTube transcript, settings panel

- Redesigned chat message bubbles with auth page color palette
- Added chat settings panel with user preferences
- Added help dialog explaining tool usage
- Implemented YouTube transcript integration
- Added tool attachment logic (one-shot vs agent mode)
- Improved command window with attachment indicators
- Created user_chat_settings migration"
```

### Step 2: Pull with Merge
```bash
# Pull and merge remote changes
git pull origin main --no-rebase
```

**Why**: Creates a merge commit preserving both histories

### Step 3: Resolve Conflicts
```bash
# If conflicts occur, resolve them
git status
# Edit conflicted files
git add <resolved-files>
git commit -m "merge: reconcile local and remote changes"
```

---

## Conflict Prediction & Prevention

### Potential Conflict Areas

1. **Migrations** ⚠️ HIGH RISK
   - Local: `20260111000001_create_user_chat_settings.sql`
   - Remote: May have migration conflicts
   - **Solution**: Check migration timestamps, may need to rename

2. **Notion Integration** ⚠️ MEDIUM RISK
   - Remote: Multi-database sync changes
   - Local: YouTube transcript tool in Edge Function
   - **Solution**: Both should coexist, but check Edge Function

3. **Chat Components** ⚠️ LOW RISK
   - Local: New components (settings panel, help dialog)
   - Remote: May have modified existing chat files
   - **Solution**: Most likely no conflicts, new files

4. **Package Dependencies** ⚠️ MEDIUM RISK
   - Local: Added `youtube-transcript`
   - Remote: May have added other packages
   - **Solution**: Merge package.json carefully

---

## Detailed Step-by-Step Execution

### Option A: Stash Method (Recommended for Safety)

```bash
# 1. Create backup branch (safety net)
git branch backup-local-changes-$(Get-Date -Format "yyyyMMdd-HHmmss")

# 2. Stash all changes
git stash push -u -m "Chat UI improvements and YouTube transcript integration"

# 3. Verify stash was created
git stash list

# 4. Pull remote changes
git pull origin main

# 5. Reapply stashed changes
git stash pop

# 6. Check for conflicts
git status

# 7. If conflicts, resolve them:
#    - Open conflicted files
#    - Look for <<<<<<< HEAD markers
#    - Resolve conflicts manually
#    - Stage resolved files: git add <file>

# 8. Test the application
pnpm install  # Ensure dependencies are synced
pnpm dev      # Test locally

# 9. Commit if everything works
git add .
git commit -m "feat: add chat UI improvements and YouTube transcript integration"
```

### Option B: Commit Method (Preserves History)

```bash
# 1. Stage all changes
git add .

# 2. Commit local changes
git commit -m "feat: chat UI improvements, YouTube transcript, settings panel

- Redesigned message bubbles with auth color palette
- Added chat settings panel (three-dot menu)
- Added help dialog (info button)
- Implemented YouTube transcript tool
- Added tool attachment logic
- Improved command window UX"

# 3. Pull with merge strategy
git pull origin main --no-rebase

# 4. Resolve conflicts if any
# (Same as Option A step 6-7)

# 5. Test and verify
pnpm install
pnpm dev

# 6. If merge commit needed
git commit -m "merge: reconcile local chat improvements with remote Notion sync"
```

---

## Conflict Resolution Guide

### If Conflicts Occur:

1. **Identify Conflicted Files**:
   ```bash
   git status
   # Look for "both modified" files
   ```

2. **Open Conflicted File**:
   ```typescript
   // Look for conflict markers:
   <<<<<<< HEAD
   // Your local changes
   =======
   // Remote changes
   >>>>>>> origin/main
   ```

3. **Resolve Conflict**:
   - Keep both changes if compatible
   - Choose one version if incompatible
   - Merge manually if needed

4. **Stage Resolved File**:
   ```bash
   git add <resolved-file>
   ```

5. **Complete Merge**:
   ```bash
   git commit -m "resolve: merge conflicts between local and remote"
   ```

---

## Specific File Conflict Scenarios

### Scenario 1: Migration Conflicts

**Problem**: Both local and remote have migrations

**Solution**:
```bash
# Check migration timestamps
ls -la supabase/migrations/

# If timestamps conflict, rename local migration:
# Example: 20260111000001 -> 20260204000001 (use future date)
mv supabase/migrations/20260111000001_create_user_chat_settings.sql \
   supabase/migrations/20260204000001_create_user_chat_settings.sql
```

### Scenario 2: Edge Function Conflicts

**Problem**: Both modified `supabase/functions/chat-stream/index.ts`

**Solution**:
- Local: Added YouTube transcript tool
- Remote: May have Notion sync changes
- **Action**: Merge both tool additions carefully

### Scenario 3: Package.json Conflicts

**Problem**: Both added dependencies

**Solution**:
```bash
# After resolving conflicts, regenerate lockfile
pnpm install
```

---

## Verification Checklist

After reconciliation:

- [ ] All files staged/committed
- [ ] No merge conflicts remaining
- [ ] `pnpm install` completes successfully
- [ ] `pnpm dev` starts without errors
- [ ] Chat interface loads correctly
- [ ] Settings panel opens (three-dot menu)
- [ ] Help dialog opens (info button)
- [ ] YouTube transcript tool works
- [ ] Command window shows attached tools
- [ ] No console errors

---

## Rollback Plan (If Things Go Wrong)

### If Reconciliation Fails:

```bash
# 1. Abort merge
git merge --abort

# 2. Or reset to before pull
git reset --hard HEAD@{1}

# 3. Restore from backup branch
git checkout backup-local-changes-*
git checkout main
git merge backup-local-changes-*
```

---

## Recommended Approach

**Use Option A (Stash Method)** because:
- ✅ Safer (can abort easily)
- ✅ Preserves work in stash
- ✅ Cleaner history
- ✅ Easier to test before committing
- ✅ Backup branch provides safety net

---

## Next Steps After Reconciliation

1. **Test Thoroughly**:
   - Chat functionality
   - Settings panel
   - YouTube transcript
   - Tool attachments

2. **Run Migrations**:
   ```bash
   supabase migration up
   ```

3. **Push Changes**:
   ```bash
   git push origin main
   ```

4. **Update Documentation**:
   - Update any docs that reference the changes
   - Note the reconciliation in changelog

---

## Summary

**Current State**:
- Local: ~100+ modified files, ~30+ new files
- Remote: 4 commits ahead (Notion sync features)

**Best Strategy**: Stash → Pull → Reapply → Test → Commit

**Risk Level**: Medium (migration conflicts possible)

**Estimated Time**: 15-30 minutes (depending on conflicts)
