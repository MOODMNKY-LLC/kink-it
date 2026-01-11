# PWA Icon Generation Guide

## Required Icons

The PWA manifest requires the following icon sizes:

### Standard Icons (purpose: 'any')
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px (required)
- 384x384px
- 512x512px (required)

### Maskable Icons (purpose: 'maskable')
- 192x192px
- 512x512px

## Icon Generation Tools

### Online Tools
1. **PWA Asset Generator**: https://github.com/onderceylan/pwa-asset-generator
2. **RealFaviconGenerator**: https://realfavicongenerator.net/
3. **PWA Builder**: https://www.pwabuilder.com/imageGenerator

### Using PWA Asset Generator (Recommended)

\`\`\`bash
npm install -g pwa-asset-generator

# Generate all icons from source image
pwa-asset-generator images/app-icon/kink-it-icon.png public/icons \
  --icon-background-color "#000000" \
  --favicon \
  --opaque false \
  --padding "20%"
\`\`\`

### Manual Generation

1. Start with a high-resolution source image (at least 1024x1024px)
2. Use image editing software (Photoshop, GIMP, Figma) to create:
   - Square versions for standard icons
   - Maskable versions with safe zone (80% of canvas) for Android adaptive icons

### Maskable Icon Requirements

Maskable icons must have:
- Important content within the center 80% of the image (safe zone)
- Background color that extends to edges
- No important content near edges (will be cropped/masked)

## File Structure

Place all icons in `public/icons/`:

\`\`\`
public/icons/
  ├── icon-72x72.png
  ├── icon-96x96.png
  ├── icon-128x128.png
  ├── icon-144x144.png
  ├── icon-152x152.png
  ├── icon-192x192.png
  ├── icon-384x384.png
  ├── icon-512x512.png
  ├── icon-maskable-192x192.png
  └── icon-maskable-512x512.png
\`\`\`

## Testing

After generating icons:
1. Test manifest.json is accessible at `/manifest.json`
2. Verify icons load correctly
3. Test PWA installation on:
   - Android Chrome
   - iOS Safari (requires home screen install)
   - Desktop Chrome/Edge

## Current Status

⚠️ **Icons need to be generated** - The manifest references icon files that need to be created from the source image at `public/images/app-icon/kink-it-icon.png`.
