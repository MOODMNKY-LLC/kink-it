# Theme and User Management System Overhaul

## 🎨 Theme Overhaul

### Fixed Accent Color Bug
- **Issue**: Dark theme accent color was incorrectly set to blue (`oklch(0.30 0.08 240)`)
- **Fix**: Changed to orange-red (`oklch(0.70 0.20 30)`) to match light theme and auth page aesthetic
- **File**: `app/globals.css` (line 156)

### Added Magic UI Components
Created three new components matching the tactical/military aesthetic:

1. **BorderBeam** (`components/ui/border-beam.tsx`)
   - Animated beam of light traveling along card borders
   - Uses primary and accent colors from theme
   - Perfect for highlighting interactive cards

2. **MagicCard** (`components/ui/magic-card.tsx`)
   - Spotlight effect that follows mouse cursor
   - Highlights borders on hover
   - Uses theme colors for gradients

3. **ShineBorder** (`components/ui/shine-border.tsx`)
   - Animated background border effect
   - Configurable colors and duration
   - Uses theme primary color by default

### Updated Components
- **UserNav** (`components/auth/user-nav.tsx`)
  - Updated colors to use theme variables instead of hardcoded zinc colors
  - Links to `/account/profile` and `/account/settings`
  - Avatar fallback uses primary color

- **Layout** (`app/layout.tsx`)
  - Added Sonner Toaster for toast notifications
  - Positioned top-right with rich colors

## 👤 User Management System

### Enhanced Profile Trigger
**File**: `scripts/003_enhance_profile_trigger.sql`

Enhanced the `handle_new_user()` function to better extract Notion OAuth metadata:

- Extracts `name`, `full_name`, `display_name` from Notion metadata
- Extracts `avatar_url` or `picture` for profile images
- Better fallback logic for display names
- Handles Notion-specific metadata fields

**To apply**: Run this migration against your Supabase database:
```bash
supabase db reset  # Or apply migration manually
```

### Profile Page
**Route**: `/account/profile`

**Features**:
- Edit full name, display name, and dynamic role
- Email display (read-only, linked to Notion)
- Admin badge display
- Uses MagicCard and BorderBeam for visual effects
- Real-time updates with toast notifications

**Components**:
- `app/account/profile/page.tsx` - Page component
- `components/account/profile-form.tsx` - Form component

### Settings Page
**Route**: `/account/settings`

**Features**:
- Toggle notifications on/off
- Theme preference display (read-only for now)
- Uses MagicCard and BorderBeam for visual effects
- Real-time updates with toast notifications

**Components**:
- `app/account/settings/page.tsx` - Page component
- `components/account/settings-form.tsx` - Form component

### New UI Components
- **Switch** (`components/ui/switch.tsx`)
  - Radix UI Switch component styled with theme colors
  - Used in settings form for toggles

## 🎯 Color Scheme

The app now uses a consistent color scheme matching the auth page:

- **Primary**: Cyan-blue (`oklch(0.70 0.20 220)`) - Sparkling bokeh effect
- **Accent**: Orange-red (`oklch(0.70 0.20 30)`) - Tactical/military aesthetic
- **Background**: Deep navy/black (`oklch(0.12 0.02 240)`)
- **Cards**: Dark blue (`oklch(0.15 0.03 240)`) with backdrop blur

## 📋 Next Steps

### Remaining Tasks
1. **Theme Consistency** (`theme-2`, `theme-4`)
   - Update all dashboard components to use new theme colors
   - Ensure consistent use of primary/accent colors throughout

2. **Partner Linking** (`user-5`)
   - Add UI for linking partner profiles
   - Partner search/selection interface

3. **Preferences Management** (`user-6`)
   - Love languages management UI
   - Hard/soft limits management UI
   - Array input components

### Migration Required
To apply the enhanced profile trigger, run:
```bash
supabase db reset
# Or manually apply scripts/003_enhance_profile_trigger.sql
```

## 🔗 Related Files

### Theme Files
- `app/globals.css` - Color variables and theme definitions
- `components/ui/border-beam.tsx` - Border beam component
- `components/ui/magic-card.tsx` - Magic card component
- `components/ui/shine-border.tsx` - Shine border component

### User Management Files
- `scripts/003_enhance_profile_trigger.sql` - Enhanced profile trigger
- `app/account/profile/page.tsx` - Profile page
- `components/account/profile-form.tsx` - Profile form
- `app/account/settings/page.tsx` - Settings page
- `components/account/settings-form.tsx` - Settings form
- `components/ui/switch.tsx` - Switch component
- `components/auth/user-nav.tsx` - Updated user navigation

## 🎨 Design Philosophy

The theme overhaul maintains the tactical/military aesthetic seen in the auth page:
- Dark backgrounds with glowing accents
- Cyan-blue primary for tech/tactical feel
- Orange-red accent for warmth and contrast
- Glassmorphism effects (backdrop blur)
- Animated borders and hover effects
- Consistent use of theme variables throughout



