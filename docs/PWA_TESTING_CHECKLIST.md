# PWA Testing Checklist

Complete testing checklist for verifying PWA implementation and mobile optimization.

---

## 📋 Pre-Testing Setup

### Required Steps:
- [ ] Dependencies installed (`pnpm install`)
- [ ] PWA icons generated (`pnpm run generate:pwa-icons`)
- [ ] Database migration applied (`supabase migration up`)
- [ ] VAPID keys generated and added to `.env.local`
- [ ] App built in production mode (`pnpm run build`)
- [ ] Production server running (`pnpm start`)

### Verification:
\`\`\`bash
# Run verification script
pnpm run setup:pwa

# Or manually verify
node scripts/verify-pwa-setup.js
\`\`\`

---

## 🧪 Phase 1: PWA Foundation Testing

### Manifest Testing:
- [ ] Manifest accessible at `/manifest.json`
- [ ] Manifest contains all required fields:
  - [ ] `name` and `short_name`
  - [ ] `start_url`
  - [ ] `display: standalone`
  - [ ] `theme_color` and `background_color`
  - [ ] Icons array with all sizes
- [ ] Manifest validates in Chrome DevTools → Application → Manifest

### Service Worker Testing:
- [ ] Service worker file exists at `/sw.js`
- [ ] Service worker registers on page load
- [ ] Service worker shows as "activated" in DevTools
- [ ] Service worker scope is `/`
- [ ] Service worker handles fetch events
- [ ] Service worker caches static assets
- [ ] Service worker updates correctly on new version

### Offline Page Testing:
- [ ] Offline page accessible at `/offline`
- [ ] Offline page displays when network fails
- [ ] Offline page has proper styling and messaging
- [ ] Offline page includes retry functionality

---

## 📱 Phase 2: Mobile Design Testing

### Touch Targets:
- [ ] All buttons meet 48px minimum (WCAG 2.1 AAA)
- [ ] All interactive elements are easily tappable
- [ ] No accidental taps due to spacing issues
- [ ] Form inputs are properly sized for mobile

### Safe Area Insets:
- [ ] Header respects safe area on notched devices
- [ ] Footer respects safe area on devices with home indicator
- [ ] Content doesn't overlap with system UI
- [ ] Test on iPhone X+ (notched devices)

### Typography:
- [ ] Base font size is 16px (prevents iOS zoom)
- [ ] Line height is 1.5x for readability
- [ ] Text scales appropriately on different screen sizes
- [ ] No horizontal scrolling on mobile

### Responsive Layout:
- [ ] Mobile header displays correctly
- [ ] Sidebar collapses/hides on mobile
- [ ] Content stacks vertically on mobile
- [ ] Images scale appropriately

---

## ⚡ Phase 3: Performance Testing

### Core Web Vitals:
- [ ] **LCP (Largest Contentful Paint)** < 2.5 seconds
- [ ] **INP (Interaction to Next Paint)** < 200ms
- [ ] **CLS (Cumulative Layout Shift)** < 0.1

### Image Optimization:
- [ ] Images load in modern formats (AVIF/WebP)
- [ ] Images have proper `width` and `height` attributes
- [ ] Above-fold images use `priority` prop
- [ ] Below-fold images use `loading="lazy"`
- [ ] No layout shift when images load

### Font Optimization:
- [ ] Fonts load with `display: swap`
- [ ] No FOIT (Flash of Invisible Text)
- [ ] Fonts are preloaded
- [ ] Font loading doesn't block rendering

### Bundle Size:
- [ ] Run bundle analyzer: `pnpm run analyze`
- [ ] Initial bundle size is reasonable (< 200KB gzipped)
- [ ] Code splitting is working
- [ ] Large dependencies are lazy-loaded

---

## 💾 Phase 4: Offline Functionality Testing

### IndexedDB:
- [ ] Database opens successfully
- [ ] Tasks store works correctly
- [ ] Rules store works correctly
- [ ] Rewards store works correctly
- [ ] Sync queue store works correctly
- [ ] Data persists across page reloads

### Offline Data Access:
- [ ] Tasks load from IndexedDB when offline
- [ ] Rules load from IndexedDB when offline
- [ ] Rewards load from IndexedDB when offline
- [ ] Data is readable when network is disabled

### Background Sync:
- [ ] Sync queue stores offline mutations
- [ ] Sync queue processes when online
- [ ] Failed syncs retry (max 3 attempts)
- [ ] Sync queue clears after successful sync
- [ ] Background sync event fires correctly

### Conflict Resolution:
- [ ] Offline changes sync correctly
- [ ] No data loss during sync
- [ ] Conflicts are handled appropriately
- [ ] Last write wins or merge strategy works

---

## 📲 Phase 5: Mobile Features Testing

### Install Prompt:
- [ ] Install prompt appears on Android Chrome
- [ ] Install prompt appears on desktop Chrome
- [ ] Install prompt can be dismissed
- [ ] Dismissal is remembered (7-day cooldown)
- [ ] App installs successfully
- [ ] Installed app opens in standalone mode

### Push Notifications:
- [ ] Permission request works
- [ ] Subscription creates successfully
- [ ] Subscription saved to database
- [ ] Push notifications received
- [ ] Notification click opens app
- [ ] Unsubscribe works correctly

### Camera Access:
- [ ] Camera permission requested
- [ ] Camera opens on mobile devices
- [ ] Photo capture works
- [ ] Photo preview displays
- [ ] Photo uploads successfully
- [ ] File size validation works (max 5MB)

### Share API:
- [ ] Share dialog appears on mobile
- [ ] Share content is correct
- [ ] Share URL works
- [ ] Fallback to clipboard works (desktop)
- [ ] Share achievements works
- [ ] Share tasks/rules works

---

## 🌐 Browser Testing

### Chrome (Desktop & Android):
- [ ] PWA installs correctly
- [ ] Service worker works
- [ ] Offline functionality works
- [ ] Push notifications work
- [ ] All features functional

### Safari (iOS):
- [ ] App adds to home screen
- [ ] Standalone mode works
- [ ] Safe areas respected
- [ ] Push notifications work (iOS 16.4+)
- [ ] All features functional

### Firefox:
- [ ] Service worker works
- [ ] Offline functionality works
- [ ] All features functional

### Edge:
- [ ] PWA installs correctly
- [ ] Service worker works
- [ ] All features functional

---

## 🔍 DevTools Testing

### Application Tab:
- [ ] **Manifest**: Validates correctly
- [ ] **Service Workers**: Shows as activated
- [ ] **Storage → IndexedDB**: Database exists with correct schema
- [ ] **Storage → Cache Storage**: Caches exist
- [ ] **Storage → Local Storage**: No errors

### Network Tab:
- [ ] Static assets cached
- [ ] API calls work offline (from cache)
- [ ] Service worker intercepts requests
- [ ] Cache strategies work correctly

### Lighthouse:
- [ ] **PWA Score**: 90+ (or all checks pass)
- [ ] **Performance Score**: 90+
- [ ] **Accessibility Score**: 90+
- [ ] **Best Practices Score**: 90+
- [ ] **SEO Score**: 90+

### Performance Tab:
- [ ] No long tasks (> 50ms)
- [ ] No layout shifts
- [ ] Fast page load
- [ ] Smooth interactions

---

## 🐛 Common Issues & Solutions

### Service Worker Not Registering:
- **Solution**: Ensure running in production mode (`pnpm run build && pnpm start`)
- **Solution**: Check browser console for errors
- **Solution**: Verify `/sw.js` is accessible

### Icons Not Showing:
- **Solution**: Regenerate icons (`pnpm run generate:pwa-icons`)
- **Solution**: Clear browser cache
- **Solution**: Verify manifest references correct paths

### Push Notifications Not Working:
- **Solution**: Verify VAPID keys are set in `.env.local`
- **Solution**: Check notification permission
- **Solution**: Verify service worker is active
- **Solution**: Check browser support (iOS 16.4+)

### Offline Not Working:
- **Solution**: Verify service worker is registered
- **Solution**: Check IndexedDB in DevTools
- **Solution**: Verify sync queue in database
- **Solution**: Check network tab for cached resources

### Performance Issues:
- **Solution**: Run bundle analyzer (`pnpm run analyze`)
- **Solution**: Optimize images
- **Solution**: Check for large dependencies
- **Solution**: Verify code splitting

---

## ✅ Final Verification

### Checklist:
- [ ] All Phase 1 tests pass
- [ ] All Phase 2 tests pass
- [ ] All Phase 3 tests pass
- [ ] All Phase 4 tests pass
- [ ] All Phase 5 tests pass
- [ ] All browser tests pass
- [ ] Lighthouse scores are acceptable
- [ ] No console errors
- [ ] No network errors
- [ ] User experience is smooth

### Documentation:
- [ ] README_PWA_SETUP.md reviewed
- [ ] docs/PWA_IMPLEMENTATION_COMPLETE.md reviewed
- [ ] All scripts tested
- [ ] Environment variables configured

---

## 📊 Test Results Template

\`\`\`
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Phase 1 (PWA Foundation): ___/___ tests passed
Phase 2 (Mobile Design): ___/___ tests passed
Phase 3 (Performance): ___/___ tests passed
Phase 4 (Offline): ___/___ tests passed
Phase 5 (Mobile Features): ___/___ tests passed

Lighthouse Scores:
- PWA: ___
- Performance: ___
- Accessibility: ___
- Best Practices: ___
- SEO: ___

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
\`\`\`

---

**Last Updated**: January 2025
**Status**: Ready for Testing
