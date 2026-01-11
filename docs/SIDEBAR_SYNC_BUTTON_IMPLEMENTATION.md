# Sidebar Sync Button Implementation

## ✅ Implementation Complete

Added sync button with status badge to the sidebar sync component with color-coded status indicators.

---

## 🎨 Status Colors

- **Red (Disconnected)**: No Notion API key found
- **Blue (Syncing)**: Sync in progress
- **Yellow (Incomplete)**: Connected but databases not synced or missing critical databases
- **Green (Complete)**: All databases synced successfully

---

## 🔧 Changes Made

### 1. Enhanced Hook (`use-notion-sync-status.tsx`) ✅
- Changed from API-based status check to direct Supabase queries
- Added `SyncStatus` type with states: `synced`, `not_synced`, `checking`, `error`, `syncing`, `disconnected`
- Added `syncNow()` function to trigger sync
- Checks for critical database types (`image_generations`, `kinkster_profiles`)
- Returns `syncedDatabasesCount` for display

### 2. Enhanced Badge Component (`notion-sync-status-badge.tsx`) ✅
- Added sync button with refresh icon
- Color-coded badge based on status
- Tooltips for better UX
- Shows database count when synced
- Button disabled during sync/checking
- Only shows sync button when sync is needed

### 3. Updated Sidebar Integration ✅
- Updated props: `showAction` → `showButton` and `showBadge`
- Component now displays in sidebar footer

### 4. Fixed Dependencies ✅
- Updated `add-to-notion-button.tsx` to use new hook API

---

## 📋 Component Features

### Badge Display
- **Icon**: Changes based on status (CheckCircle2, AlertCircle, Loader2, XCircle)
- **Color**: Background and border colors match status
- **Text**: Status label ("Synced", "Not Synced", "Syncing", etc.)
- **Count**: Shows synced database count when available

### Sync Button
- **Icon**: RefreshCw (spins when syncing)
- **State**: Disabled during sync/checking or when already synced
- **Action**: Calls `syncNow()` function
- **Tooltip**: Explains current state and action

---

## 🎯 Status Logic

1. **Disconnected** (Red):
   - No active Notion API key found
   - User needs to add API key

2. **Not Synced** (Yellow):
   - Has API key but no databases synced
   - OR has databases but missing critical types
   - Sync button enabled

3. **Syncing** (Blue):
   - Sync in progress
   - Button shows spinner
   - Badge shows "Syncing"

4. **Synced** (Green):
   - All databases synced
   - Critical database types present
   - Shows database count
   - Sync button disabled (only refresh available)

5. **Error** (Red):
   - Error occurred during check or sync
   - Shows error message in tooltip

---

## 📝 Usage

\`\`\`tsx
<NotionSyncStatusBadge 
  showButton={true}  // Show sync button
  showBadge={true}  // Show status badge
  className="..."    // Optional custom styling
/>
\`\`\`

---

## 🔄 Sync Flow

1. User clicks sync button
2. `syncNow()` called
3. Status changes to "syncing" (blue)
4. POST to `/api/onboarding/notion/sync-template`
5. On success: toast notification + refresh status
6. On error: error toast + status changes to "error"
7. Status automatically updates after sync completes

---

## ✅ Testing Checklist

- [ ] Badge shows correct color for each status
- [ ] Sync button appears when needed
- [ ] Sync button disabled during sync
- [ ] Sync works correctly
- [ ] Status updates after sync
- [ ] Tooltips show correct information
- [ ] Database count displays correctly
- [ ] Error handling works

---

## 🎨 Visual Design

- **Badge**: Small, compact, fits in sidebar
- **Button**: Ghost variant, small size, icon-only
- **Colors**: Subtle backgrounds with matching borders
- **Icons**: Lucide icons, animated when appropriate
- **Tooltips**: Provide context and help text

---

## 📍 Location

Component is displayed in:
- `components/dashboard/sidebar/index.tsx` (SidebarFooter)
- Used in sidebar footer section
- Visible when user profile exists
