#!/usr/bin/env node

/**
 * PWA Splash Screen Generation Script
 * Generates Apple splash screens from banner image
 * 
 * Usage: node scripts/generate-splash-screens.js
 * 
 * Requirements:
 * - Sharp: npm install sharp --save-dev
 * - Source banner at: public/images/kink-it-banner.png
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sourceBanner = path.join(process.cwd(), 'public/images/kink-it-banner.png')
const outputDir = path.join(process.cwd(), 'public/icons')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Apple splash screen sizes (for iOS devices)
const splashScreens = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // iPad Air
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone XS Max
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X/XS
  { width: 828, height: 1792, name: 'apple-splash-828-1792.png' },   // iPhone XR
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png' },   // iPhone 8
  { width: 640, height: 1136, name: 'apple-splash-640-1136.png' },  // iPhone SE
]

async function generateSplashScreens() {
  console.log('🎨 Generating Apple splash screens...\n')

  if (!fs.existsSync(sourceBanner)) {
    console.error(`❌ Source banner not found: ${sourceBanner}`)
    console.error('Please ensure the banner image exists at: public/images/kink-it-banner.png')
    process.exit(1)
  }

  try {
    // Get source image dimensions
    const metadata = await sharp(sourceBanner).metadata()
    console.log(`📐 Source banner: ${metadata.width}x${metadata.height}\n`)

    // Generate splash screens
    console.log('Generating splash screens...')
    for (const { width, height, name } of splashScreens) {
      const outputPath = path.join(outputDir, name)
      await sharp(sourceBanner)
        .resize(width, height, {
          fit: 'cover', // Cover the entire area
          position: 'center', // Center the image
        })
        .png()
        .toFile(outputPath)
      console.log(`  ✅ ${name} (${width}x${height})`)
    }

    console.log('\n✨ All splash screens generated successfully!')
    console.log(`📁 Splash screens saved to: ${outputDir}`)
    console.log('\nNext steps:')
    console.log('1. Verify splash screens in public/icons/')
    console.log('2. Test PWA installation on iOS devices')
    console.log('3. Check manifest.json references')
  } catch (error) {
    console.error('❌ Error generating splash screens:', error)
    process.exit(1)
  }
}

// Check if sharp is installed
try {
  require.resolve('sharp')
  generateSplashScreens()
} catch (error) {
  console.error('❌ Sharp is not installed.')
  console.error('Please install it with: npm install sharp --save-dev')
  console.error('Or: pnpm add -D sharp')
  process.exit(1)
}



