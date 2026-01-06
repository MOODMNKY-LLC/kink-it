# PWA Testing Script for Windows PowerShell
# Helps verify PWA implementation

Write-Host "🧪 KINK IT PWA Testing Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Check if running in production mode
Write-Host "📋 Pre-flight Checks..." -ForegroundColor Yellow
Write-Host ""

# Check manifest
$manifestExists = Test-Path "app/manifest.ts"
if ($manifestExists) {
    Write-Host "✅ Manifest file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Manifest file not found" -ForegroundColor Red
}

# Check service worker
$swExists = Test-Path "public/sw.js"
if ($swExists) {
    Write-Host "✅ Service worker exists" -ForegroundColor Green
} else {
    Write-Host "❌ Service worker not found" -ForegroundColor Red
}

# Check icons
$iconDir = "public/icons"
if (Test-Path $iconDir) {
    $iconCount = (Get-ChildItem "$iconDir/*.png" -ErrorAction SilentlyContinue).Count
    if ($iconCount -ge 8) {
        Write-Host "✅ Icons directory exists with $iconCount icons" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Icons directory exists but only $iconCount icons found (need 8+)" -ForegroundColor Yellow
        Write-Host "   Run: pnpm run generate:pwa-icons" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Icons directory not found" -ForegroundColor Yellow
    Write-Host "   Run: pnpm run generate:pwa-icons" -ForegroundColor Gray
}

# Check offline page
$offlineExists = Test-Path "app/offline/page.tsx"
if ($offlineExists) {
    Write-Host "✅ Offline page exists" -ForegroundColor Green
} else {
    Write-Host "❌ Offline page not found" -ForegroundColor Red
}

# Check IndexedDB setup
$dbExists = Test-Path "lib/offline/db.ts"
if ($dbExists) {
    Write-Host "✅ IndexedDB setup exists" -ForegroundColor Green
} else {
    Write-Host "❌ IndexedDB setup not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Testing Instructions" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Build in production mode:" -ForegroundColor Yellow
Write-Host "   pnpm run build" -ForegroundColor White
Write-Host "   pnpm start" -ForegroundColor White
Write-Host ""
Write-Host "2. Open Chrome DevTools:" -ForegroundColor Yellow
Write-Host "   - Application → Manifest (check manifest)" -ForegroundColor White
Write-Host "   - Application → Service Workers (check registration)" -ForegroundColor White
Write-Host "   - Application → Storage → IndexedDB (check database)" -ForegroundColor White
Write-Host "   - Lighthouse → Run PWA audit" -ForegroundColor White
Write-Host ""
Write-Host "3. Test offline:" -ForegroundColor Yellow
Write-Host "   - Network tab → Offline" -ForegroundColor White
Write-Host "   - Navigate to /offline" -ForegroundColor White
Write-Host "   - Verify cached content loads" -ForegroundColor White
Write-Host ""
Write-Host "4. Test installation:" -ForegroundColor Yellow
Write-Host "   - Android: Look for install prompt" -ForegroundColor White
Write-Host "   - iOS: Share → Add to Home Screen" -ForegroundColor White
Write-Host ""
Write-Host "5. Test mobile features:" -ForegroundColor Yellow
Write-Host "   - Push notifications (requires VAPID keys)" -ForegroundColor White
Write-Host "   - Camera access (proof upload)" -ForegroundColor White
Write-Host "   - Share API" -ForegroundColor White
Write-Host ""



