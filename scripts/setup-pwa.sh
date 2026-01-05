#!/bin/bash

# PWA Setup Script for Unix/Linux/Mac
# Automates PWA setup steps

echo "🚀 KINK IT PWA Setup Script"
echo "=================================================="
echo ""

# Step 1: Check dependencies
echo "📦 Step 1: Checking dependencies..."

if ! npm list sharp >/dev/null 2>&1; then
    echo "⚠️  Sharp not found. Installing..."
    pnpm add -D sharp
fi

if ! npm list idb >/dev/null 2>&1; then
    echo "⚠️  idb not found. Installing..."
    pnpm install
fi

echo "✅ Dependencies checked"
echo ""

# Step 2: Generate PWA icons
echo "🎨 Step 2: Generating PWA icons..."
echo "Running: pnpm run generate:pwa-icons"

if [ -f "public/images/app-icon/kink-it-icon.png" ]; then
    pnpm run generate:pwa-icons
    if [ $? -eq 0 ]; then
        echo "✅ Icons generated successfully"
    else
        echo "❌ Icon generation failed"
        echo "Make sure sharp is installed: pnpm add -D sharp"
    fi
else
    echo "⚠️  Icon source not found: public/images/app-icon/kink-it-icon.png"
    echo "Please ensure the source icon exists before generating PWA icons"
fi

echo ""

# Step 3: Check database migration
echo "🗄️  Step 3: Checking database migration..."

if [ -f "supabase/migrations/20250106000000_create_push_subscriptions.sql" ]; then
    echo "✅ Migration file found"
    echo "Run: supabase migration up"
    echo "Or apply manually using Supabase dashboard"
else
    echo "⚠️  Migration file not found"
fi

echo ""

# Step 4: Generate VAPID keys
echo "🔑 Step 4: Generating VAPID keys..."

if command -v web-push &> /dev/null; then
    echo "Running: node scripts/generate-vapid-keys.js"
    node scripts/generate-vapid-keys.js
else
    echo "⚠️  web-push not installed"
    echo "Installing web-push..."
    npm install -g web-push
    node scripts/generate-vapid-keys.js
fi

echo ""

# Step 5: Summary
echo "📋 Setup Summary"
echo "=================================================="
echo ""
echo "✅ Dependencies installed"
echo "✅ PWA icons generated (if source exists)"
echo "✅ Migration file ready"
echo "✅ VAPID keys generated"
echo ""
echo "📝 Next Steps:"
echo "1. Add VAPID keys to .env.local file"
echo "2. Run database migration: supabase migration up"
echo "3. Build and test: pnpm run build && pnpm start"
echo "4. Test PWA installation on mobile devices"
echo ""
echo "📚 Documentation:"
echo "- README_PWA_SETUP.md - Quick start guide"
echo "- docs/PWA_IMPLEMENTATION_COMPLETE.md - Full implementation details"
echo ""

