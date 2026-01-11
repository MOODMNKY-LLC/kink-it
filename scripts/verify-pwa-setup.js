#!/usr/bin/env node

/**
 * PWA Setup Verification Script
 * Verifies all PWA components are properly configured
 */

const fs = require('fs')
const path = require('path')

const checks = {
  manifest: false,
  serviceWorker: false,
  offlinePage: false,
  icons: false,
  installPrompt: false,
  pushNotifications: false,
  offlineDb: false,
  syncQueue: false,
  cameraComponent: false,
  shareApi: false,
  imageOptimization: false,
  bundleAnalyzer: false,
}

console.log('🔍 Verifying PWA Setup...\n')

// Check manifest
const manifestPath = path.join(process.cwd(), 'app/manifest.ts')
if (fs.existsSync(manifestPath)) {
  checks.manifest = true
  console.log('✅ Manifest file exists')
} else {
  console.log('❌ Manifest file not found')
}

// Check service worker
const swPath = path.join(process.cwd(), 'public/sw.js')
if (fs.existsSync(swPath)) {
  checks.serviceWorker = true
  console.log('✅ Service worker exists')
} else {
  console.log('❌ Service worker not found')
}

// Check offline page
const offlinePath = path.join(process.cwd(), 'app/offline/page.tsx')
if (fs.existsSync(offlinePath)) {
  checks.offlinePage = true
  console.log('✅ Offline page exists')
} else {
  console.log('❌ Offline page not found')
}

// Check icons
const iconsDir = path.join(process.cwd(), 'public/icons')
if (fs.existsSync(iconsDir)) {
  const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'))
  if (iconFiles.length >= 8) {
    checks.icons = true
    console.log(`✅ Icons directory exists with ${iconFiles.length} icons`)
  } else {
    console.log(`⚠️  Icons directory exists but only ${iconFiles.length} icons found (need 8+)`)
    console.log('   Run: pnpm run generate:pwa-icons')
  }
} else {
  console.log('⚠️  Icons directory not found')
  console.log('   Run: pnpm run generate:pwa-icons')
}

// Check banner image
const bannerPath = path.join(process.cwd(), 'public/images/kink-it-banner.png')
if (fs.existsSync(bannerPath)) {
  console.log('✅ Banner image exists (for splash screens and Open Graph)')
} else {
  console.log('⚠️  Banner image not found: public/images/kink-it-banner.png')
}

// Check source icon
const sourceIconPath = path.join(process.cwd(), 'public/images/app-icon/kink-it-icon.png')
if (fs.existsSync(sourceIconPath)) {
  console.log('✅ Source icon exists')
} else {
  console.log('⚠️  Source icon not found: public/images/app-icon/kink-it-icon.png')
  console.log('   This is needed to generate PWA icons')
}

// Check install prompt
const installPromptPath = path.join(process.cwd(), 'components/pwa/install-prompt.tsx')
if (fs.existsSync(installPromptPath)) {
  checks.installPrompt = true
  console.log('✅ Install prompt component exists')
} else {
  console.log('❌ Install prompt component not found')
}

// Check push notifications
const pushNotificationsPath = path.join(process.cwd(), 'lib/push/notifications.ts')
if (fs.existsSync(pushNotificationsPath)) {
  checks.pushNotifications = true
  console.log('✅ Push notifications utilities exist')
} else {
  console.log('❌ Push notifications utilities not found')
}

// Check offline DB
const offlineDbPath = path.join(process.cwd(), 'lib/offline/db.ts')
if (fs.existsSync(offlineDbPath)) {
  checks.offlineDb = true
  console.log('✅ IndexedDB setup exists')
} else {
  console.log('❌ IndexedDB setup not found')
}

// Check sync queue
const syncPath = path.join(process.cwd(), 'lib/offline/sync.ts')
if (fs.existsSync(syncPath)) {
  checks.syncQueue = true
  console.log('✅ Sync queue implementation exists')
} else {
  console.log('❌ Sync queue implementation not found')
}

// Check camera component
const cameraPath = path.join(process.cwd(), 'components/tasks/proof-upload.tsx')
if (fs.existsSync(cameraPath)) {
  checks.cameraComponent = true
  console.log('✅ Camera component exists')
} else {
  console.log('❌ Camera component not found')
}

// Check share API
const sharePath = path.join(process.cwd(), 'lib/share.ts')
if (fs.existsSync(sharePath)) {
  checks.shareApi = true
  console.log('✅ Share API utilities exist')
} else {
  console.log('❌ Share API utilities not found')
}

// Check image optimization in next.config.ts
const nextConfigPath = path.join(process.cwd(), 'next.config.ts')
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')
  if (nextConfigContent.includes('formats:') && nextConfigContent.includes('image/avif')) {
    checks.imageOptimization = true
    console.log('✅ Image optimization configured')
  } else {
    console.log('⚠️  Image optimization may not be fully configured')
  }
} else {
  console.log('❌ next.config.ts not found')
}

// Check bundle analyzer
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')
  if (nextConfigContent.includes('bundle-analyzer') || nextConfigContent.includes('ANALYZE')) {
    checks.bundleAnalyzer = true
    console.log('✅ Bundle analyzer configured')
  } else {
    console.log('⚠️  Bundle analyzer not configured')
  }
}

// Summary
console.log('\n' + '='.repeat(50))
console.log('📊 Verification Summary')
console.log('='.repeat(50))

const totalChecks = Object.keys(checks).length
const passedChecks = Object.values(checks).filter(Boolean).length
const percentage = Math.round((passedChecks / totalChecks) * 100)

console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} (${percentage}%)`)

if (percentage === 100) {
  console.log('\n🎉 All PWA components are properly configured!')
  console.log('\n📝 Next Steps:')
  console.log('1. Generate icons: pnpm run generate:pwa-icons')
  console.log('2. Run migration: supabase migration up')
  console.log('3. Generate VAPID keys: node scripts/generate-vapid-keys.js')
  console.log('4. Build and test: pnpm run build && pnpm start')
} else {
  console.log('\n⚠️  Some components are missing or need configuration')
  console.log('\nMissing components:')
  Object.entries(checks).forEach(([key, value]) => {
    if (!value) {
      console.log(`  - ${key}`)
    }
  })
}

console.log('')
