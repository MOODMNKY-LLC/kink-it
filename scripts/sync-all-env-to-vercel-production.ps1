# Comprehensive script to sync ALL required environment variables to Vercel production
# Reads from .env.local and adds missing variables

Write-Host "`n🚀 Syncing Environment Variables to Vercel Production" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

$envLocalPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envLocalPath)) {
    Write-Host "❌ .env.local not found at: $envLocalPath" -ForegroundColor Red
    Write-Host "   Please ensure .env.local exists with all required values`n" -ForegroundColor Yellow
    exit 1
}

# Read .env.local and extract values
function Get-EnvValue {
    param([string]$VarName)
    $line = Get-Content $envLocalPath | Select-String -Pattern "^$VarName=" | Select-Object -First 1
    if ($line) {
        $value = ($line.Line -split '=', 2)[1].Trim()
        # Remove quotes if present
        $value = $value -replace '^["'']|["'']$', ''
        return $value
    }
    return $null
}

# All required environment variables
$varsToAdd = @(
    # Notion Integration
    @{Name='NOTION_API_KEY'; Desc='Notion API Key'; Required=$true; Default=$null},
    @{Name='NOTION_API_KEY_ENCRYPTION_KEY'; Desc='Notion API Key Encryption Key (for stored keys)'; Required=$true; Default=$null},
    @{Name='NOTION_APP_IDEAS_DATABASE_ID'; Desc='Notion App Ideas Database ID'; Required=$true; Default='cc491ef5f0a64eac8e05a6ea10dfb735'},
    @{Name='NEXT_PUBLIC_NOTION_TEMPLATE_URL'; Desc='Notion Template URL'; Required=$true; Default='https://www.notion.so/mood-mnky/KINK-IT-User-Template-2dfcd2a6542281bcba14ffa2099160d8'},
    
    # Notion OAuth (for Supabase Auth)
    @{Name='SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID'; Desc='Notion OAuth Client ID'; Required=$true; Default=$null},
    @{Name='SUPABASE_AUTH_EXTERNAL_NOTION_SECRET'; Desc='Notion OAuth Client Secret'; Required=$true; Default=$null},
    
    # AI & OpenAI
    @{Name='AI_GATEWAY_API_KEY'; Desc='Vercel AI Gateway API Key'; Required=$true; Default=$null},
    @{Name='OPENAI_API_KEY'; Desc='OpenAI API Key'; Required=$true; Default=$null},
    
    # VAPID Keys (PWA Push Notifications)
    @{Name='NEXT_PUBLIC_VAPID_PUBLIC_KEY'; Desc='VAPID Public Key'; Required=$false; Default=$null},
    @{Name='VAPID_PRIVATE_KEY'; Desc='VAPID Private Key'; Required=$false; Default=$null},
    
    # v0 API (if used)
    @{Name='V0_API_KEY'; Desc='v0 API Key'; Required=$false; Default=$null},
    
    # Vercel Token (usually auto-configured, but can be set)
    @{Name='VERCEL_TOKEN'; Desc='Vercel API Token'; Required=$false; Default=$null}
)

Write-Host "Checking existing Vercel production environment variables...`n" -ForegroundColor Yellow

# Check existing variables
$vercelEnvOutput = vercel env ls production 2>&1 | Out-String
$existingVars = @()
if ($LASTEXITCODE -eq 0) {
    $vercelEnvOutput -split "`n" | ForEach-Object {
        if ($_ -match '^\s+([A-Z_]+)\s+') {
            $existingVars += $matches[1]
        }
    }
} else {
    Write-Host "⚠️  Could not list existing variables. Continuing anyway...`n" -ForegroundColor Yellow
}

$missingVars = @()
foreach ($var in $varsToAdd) {
    if ($var.Name -notin $existingVars) {
        $missingVars += $var
    } else {
        Write-Host "✅ $($var.Name) already exists" -ForegroundColor Green
    }
}

if ($missingVars.Count -eq 0) {
    Write-Host "`n✅ All environment variables are already in Vercel production!`n" -ForegroundColor Green
    exit 0
}

Write-Host "`nFound $($missingVars.Count) missing variable(s):`n" -ForegroundColor Yellow

# Process each missing variable
$added = 0
$skipped = 0
$failed = 0

foreach ($var in $missingVars) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Variable: $($var.Name)" -ForegroundColor Cyan
    Write-Host "Description: $($var.Desc)" -ForegroundColor Gray
    Write-Host "Required: $(if ($var.Required) { 'Yes' } else { 'Optional' })" -ForegroundColor $(if ($var.Required) { 'Yellow' } else { 'Gray' })
    
    # Get value from .env.local or use default
    $value = if ($var.Default) { $var.Default } else { Get-EnvValue -VarName $var.Name }
    
    if (-not $value -or $value -match 'YOUR_.*_HERE' -or ($value.Length -lt 5 -and $var.Required)) {
        if ($var.Required) {
            Write-Host "❌ Value not found in .env.local and no default available" -ForegroundColor Red
            Write-Host "   Please add this manually: vercel env add $($var.Name) production" -ForegroundColor Gray
            $skipped++
            Write-Host ""
            continue
        } else {
            Write-Host "ℹ️  Optional variable - skipping (not found in .env.local)" -ForegroundColor Gray
            $skipped++
            Write-Host ""
            continue
        }
    }
    
    Write-Host "Value: [REDACTED - Length: $($value.Length) chars]" -ForegroundColor Green
    
    Write-Host "`nAdd this variable to Vercel production? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "⏭️  Skipped`n" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    Write-Host "`nAdding $($var.Name)..." -ForegroundColor Cyan
    
    # Use echo to pipe value to vercel env add
    try {
        $value | vercel env add $var.Name production 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully added $($var.Name)`n" -ForegroundColor Green
            $added++
        } else {
            Write-Host "❌ Failed to add $($var.Name)`n" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "❌ Error adding $($var.Name): $_`n" -ForegroundColor Red
        $failed++
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Added: $added" -ForegroundColor Green
Write-Host "   ⏭️  Skipped: $skipped" -ForegroundColor Yellow
Write-Host "   ❌ Failed: $failed" -ForegroundColor Red
Write-Host "   📋 Total: $($missingVars.Count)`n" -ForegroundColor Gray

if ($added -gt 0) {
    Write-Host "✅ Environment variable sync complete!`n" -ForegroundColor Green
    Write-Host "Verify with: vercel env ls production`n" -ForegroundColor Gray
    Write-Host "🚀 Ready to redeploy! Run: vercel --prod`n" -ForegroundColor Cyan
}

if ($failed -gt 0) {
    Write-Host "⚠️  Some variables failed to add. Please add them manually.`n" -ForegroundColor Yellow
    exit 1
}
