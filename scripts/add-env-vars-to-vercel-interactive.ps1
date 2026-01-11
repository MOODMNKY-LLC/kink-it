# Interactive script to add missing environment variables to Vercel production
# This script reads values from .env.local and adds them to Vercel

Write-Host "`n🚀 Adding Missing Environment Variables to Vercel Production" -ForegroundColor Cyan
Write-Host "==========================================================`n" -ForegroundColor Cyan

$envLocalPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envLocalPath)) {
    Write-Host "❌ .env.local not found at: $envLocalPath" -ForegroundColor Red
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

# Variables to add (name, description, required, defaultValue)
$varsToAdd = @(
    @{Name='SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID'; Desc='Notion OAuth Client ID'; Required=$true; Default=$null},
    @{Name='SUPABASE_AUTH_EXTERNAL_NOTION_SECRET'; Desc='Notion OAuth Secret'; Required=$true; Default=$null},
    @{Name='NEXT_PUBLIC_NOTION_TEMPLATE_URL'; Desc='Notion Template URL'; Required=$true; Default='https://www.notion.so/mood-mnky/KINK-IT-User-Template-2dfcd2a6542281bcba14ffa2099160d8'},
    @{Name='DISCORD_CLIENT_ID'; Desc='Discord Client ID'; Required=$true; Default=$null},
    @{Name='DISCORD_CLIENT_SECRET'; Desc='Discord Client Secret'; Required=$true; Default=$null},
    @{Name='DISCORD_WEBHOOK_URL'; Desc='Discord Webhook URL'; Required=$true; Default=$null},
    @{Name='NEXT_PUBLIC_VAPID_PUBLIC_KEY'; Desc='VAPID Public Key (PWA)'; Required=$false; Default=$null},
    @{Name='VAPID_PRIVATE_KEY'; Desc='VAPID Private Key (PWA)'; Required=$false; Default=$null}
)

Write-Host "Checking which variables need to be added...`n" -ForegroundColor Yellow

# Check existing variables
$vercelEnvOutput = vercel env ls production 2>&1 | Out-String
$existingVars = @()
if ($LASTEXITCODE -eq 0) {
    $vercelEnvOutput -split "`n" | ForEach-Object {
        if ($_ -match '^\s+([A-Z_]+)\s+') {
            $existingVars += $matches[1]
        }
    }
}

$missingVars = @()
foreach ($var in $varsToAdd) {
    if ($var.Name -notin $existingVars) {
        $missingVars += $var
    }
}

if ($missingVars.Count -eq 0) {
    Write-Host "✅ All environment variables are already in Vercel production!`n" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($missingVars.Count) missing variable(s):`n" -ForegroundColor Yellow

# Process each missing variable
$added = 0
$skipped = 0

foreach ($var in $missingVars) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Variable: $($var.Name)" -ForegroundColor Cyan
    Write-Host "Description: $($var.Desc)" -ForegroundColor Gray
    Write-Host "Required: $(if ($var.Required) { 'Yes' } else { 'Optional' })" -ForegroundColor $(if ($var.Required) { 'Yellow' } else { 'Gray' })
    
    # Get value from .env.local or use default
    $value = if ($var.Default) { $var.Default } else { Get-EnvValue -VarName $var.Name }
    
    if (-not $value -or $value -match 'YOUR_.*_HERE' -or $value.Length -lt 5) {
        if ($var.Required) {
            Write-Host "⚠️  Value not found in .env.local and no default available" -ForegroundColor Yellow
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
    $value | vercel env add $var.Name production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully added $($var.Name)`n" -ForegroundColor Green
        $added++
    } else {
        Write-Host "❌ Failed to add $($var.Name)`n" -ForegroundColor Red
        $skipped++
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Added: $added" -ForegroundColor Green
Write-Host "   ⏭️  Skipped: $skipped" -ForegroundColor Yellow
Write-Host "   📋 Total: $($missingVars.Count)`n" -ForegroundColor Gray

if ($added -gt 0) {
    Write-Host "✅ Environment variable sync complete!`n" -ForegroundColor Green
    Write-Host "Verify with: vercel env ls production`n" -ForegroundColor Gray
}
