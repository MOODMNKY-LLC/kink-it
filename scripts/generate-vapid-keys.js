#!/usr/bin/env node

/**
 * VAPID Key Generation Script
 * Generates VAPID keys for Web Push notifications
 * 
 * Usage: node scripts/generate-vapid-keys.js
 * 
 * Requirements:
 * - web-push: npm install -g web-push (or npm install web-push --save-dev)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔑 Generating VAPID keys for Web Push notifications...\n')

// Check if web-push is installed, if not, try to install it
let webpush
try {
  webpush = require('web-push')
} catch (error) {
  console.log('⚠️  web-push not found. Installing...\n')
  try {
    execSync('npm install web-push --save-dev', { stdio: 'inherit' })
    webpush = require('web-push')
    console.log('✅ web-push installed successfully\n')
  } catch (installError) {
    console.error('❌ Failed to install web-push automatically.')
    console.error('\n💡 Please install it manually:')
    console.error('   npm install web-push --save-dev')
    console.error('   or')
    console.error('   npm install -g web-push')
    console.error('\nThen run this script again.')
    process.exit(1)
  }
}

try {
  const vapidKeys = webpush.generateVAPIDKeys()

  console.log('✅ VAPID keys generated successfully!\n')
  console.log('📋 Add these to your .env.local file:\n')
  console.log('='.repeat(60))
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
  console.log('='.repeat(60))
  console.log('\n')

  // Optionally save to a temporary file (not committed to git)
  const envFile = path.join(process.cwd(), '.env.vapid.keys')
  const envContent = `# VAPID Keys for Web Push Notifications
# Generated: ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO GIT

NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`

  fs.writeFileSync(envFile, envContent)
  console.log(`💾 Keys also saved to: ${envFile}`)
  console.log('⚠️  Remember to add these to your .env.local file!')
  console.log('⚠️  The .env.vapid.keys file is for reference only.\n')

  console.log('📝 Next steps:')
  console.log('1. Copy the keys above to your .env.local file')
  console.log('2. Restart your development server')
  console.log('3. Test push notifications in your app')
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message)
  console.error('\n💡 Make sure web-push is installed:')
  console.error('   npm install -g web-push')
  console.error('   or')
  console.error('   npm install web-push --save-dev')
  process.exit(1)
}

