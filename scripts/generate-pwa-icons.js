#!/usr/bin/env node

/**
 * PWA Icon Generation Script
 * Generates all required PWA icons from source image
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * Requirements:
 * - Sharp: npm install sharp --save-dev
 * - Source image at: public/images/app-icon/kink-it-icon.png
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sourceImage = path.join(process.cwd(), 'public/images/app-icon/kink-it-icon.png')
const outputDir = path.join(process.cwd(), 'public/icons')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Icon sizes and configurations
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
]

// Maskable icon sizes (with safe zone)
const maskableSizes = [
  { size: 192, name: 'icon-maskable-192x192.png' },
  { size: 512, name: 'icon-maskable-512x512.png' },
]

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n')

  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`)
    console.error('Please ensure the source image exists at: public/images/app-icon/kink-it-icon.png')
    process.exit(1)
  }

  try {
    // Generate standard icons
    console.log('Generating standard icons...')
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(outputDir, name)
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }, // Black background
        })
        .png()
        .toFile(outputPath)
      console.log(`  ✅ ${name} (${size}x${size})`)
    }

    // Generate maskable icons (with safe zone - 80% of canvas)
    console.log('\nGenerating maskable icons (with safe zone)...')
    for (const { size, name } of maskableSizes) {
      const outputPath = path.join(outputDir, name)
      const safeZone = Math.floor(size * 0.8) // 80% safe zone
      const offset = Math.floor((size - safeZone) / 2)

      await sharp(sourceImage)
        .resize(safeZone, safeZone, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .extend({
          top: offset,
          bottom: offset,
          left: offset,
          right: offset,
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .png()
        .toFile(outputPath)
      console.log(`  ✅ ${name} (${size}x${size} with safe zone)`)
    }

    console.log('\n✨ All PWA icons generated successfully!')
    console.log(`📁 Icons saved to: ${outputDir}`)
    console.log('\nNext steps:')
    console.log('1. Verify icons in public/icons/')
    console.log('2. Test PWA installation')
    console.log('3. Check manifest.json references')
  } catch (error) {
    console.error('❌ Error generating icons:', error)
    process.exit(1)
  }
}

// Check if sharp is installed
try {
  require.resolve('sharp')
  generateIcons()
} catch (error) {
  console.error('❌ Sharp is not installed.')
  console.error('Please install it with: npm install sharp --save-dev')
  console.error('Or: pnpm add -D sharp')
  process.exit(1)
}
