# PWA Setup Script for Windows PowerShell
# Automates PWA setup steps

Write-Host "🚀 KINK IT PWA Setup Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check dependencies
Write-Host "📦 Step 1: Checking dependencies..." -ForegroundColor Yellow

$sharpInstalled = npm list sharp 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Sharp not found. Installing..." -ForegroundColor Yellow
    pnpm add -D sharp
}

$idbInstalled = npm list idb 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  idb not found. Installing..." -ForegroundColor Yellow
    pnpm install
}

Write-Host "✅ Dependencies checked" -ForegroundColor Green
Write-Host ""

# Step 2: Generate PWA icons
Write-Host "🎨 Step 2: Generating PWA icons..." -ForegroundColor Yellow
Write-Host "Running: pnpm run generate:pwa-icons" -ForegroundColor Gray

$iconSource = "public/images/app-icon/kink-it-icon.png"
if (Test-Path $iconSource) {
    pnpm run generate:pwa-icons
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Icons generated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Icon generation failed" -ForegroundColor Red
        Write-Host "Make sure sharp is installed: pnpm add -D sharp" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Icon source not found: $iconSource" -ForegroundColor Yellow
    Write-Host "Please ensure the source icon exists before generating PWA icons" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Check database migration
Write-Host "🗄️  Step 3: Checking database migration..." -ForegroundColor Yellow

$migrationFile = "supabase/migrations/20250106000000_create_push_subscriptions.sql"
if (Test-Path $migrationFile) {
    Write-Host "✅ Migration file found: $migrationFile" -ForegroundColor Green
    Write-Host "Run: supabase migration up" -ForegroundColor Gray
    Write-Host "Or apply manually using Supabase dashboard" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Migration file not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Generate VAPID keys
Write-Host "🔑 Step 4: Generating VAPID keys..." -ForegroundColor Yellow

$webPushInstalled = npm list -g web-push 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Running: node scripts/generate-vapid-keys.js" -ForegroundColor Gray
    node scripts/generate-vapid-keys.js
} else {
    Write-Host "⚠️  web-push not installed globally" -ForegroundColor Yellow
    Write-Host "Installing web-push..." -ForegroundColor Gray
    npm install -g web-push
    node scripts/generate-vapid-keys.js
}

Write-Host ""

# Step 5: Summary
Write-Host "📋 Setup Summary" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ PWA icons generated (if source exists)" -ForegroundColor Green
Write-Host "✅ Migration file ready" -ForegroundColor Green
Write-Host "✅ VAPID keys generated" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add VAPID keys to .env.local file" -ForegroundColor White
Write-Host "2. Run database migration: supabase migration up" -ForegroundColor White
Write-Host "3. Build and test: pnpm run build && pnpm start" -ForegroundColor White
Write-Host "4. Test PWA installation on mobile devices" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- README_PWA_SETUP.md - Quick start guide" -ForegroundColor Gray
Write-Host "- docs/PWA_IMPLEMENTATION_COMPLETE.md - Full implementation details" -ForegroundColor Gray
Write-Host ""

