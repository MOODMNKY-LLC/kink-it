# Non-interactive script to add missing environment variables to Vercel production
# This script reads values from .env.local and adds them automatically

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

Write-Host "Found $($missingVars.Count) missing variable(s). Adding them now...`n" -ForegroundColor Yellow

# Process each missing variable
$added = 0
$skipped = 0
$failed = 0

foreach ($var in $missingVars) {
    Write-Host "Processing: $($var.Name)..." -ForegroundColor Cyan
    
    # Get value from .env.local or use default
    $value = if ($var.Default) { $var.Default } else { Get-EnvValue -VarName $var.Name }
    
    if (-not $value -or $value -match 'YOUR_.*_HERE' -or $value.Length -lt 5) {
        if ($var.Required) {
            Write-Host "  ⚠️  Value not found - skipping (required but missing)" -ForegroundColor Yellow
            $skipped++
            continue
        } else {
            Write-Host "  ℹ️  Optional variable - skipping (not found)" -ForegroundColor Gray
            $skipped++
            continue
        }
    }
    
    # Add variable using vercel env add
    # Note: vercel env add reads from stdin, so we pipe the value
    $value | vercel env add $var.Name production 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Successfully added" -ForegroundColor Green
        $added++
    } else {
        Write-Host "  ❌ Failed to add" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Added: $added" -ForegroundColor Green
Write-Host "   ⏭️  Skipped: $skipped" -ForegroundColor Yellow
Write-Host "   ❌ Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Gray' })
Write-Host "   📋 Total: $($missingVars.Count)`n" -ForegroundColor Gray

if ($added -gt 0) {
    Write-Host "✅ Environment variable sync complete!`n" -ForegroundColor Green
    Write-Host "Verify with: vercel env ls production`n" -ForegroundColor Gray
} elseif ($failed -gt 0) {
    Write-Host "⚠️  Some variables failed to add. You may need to add them manually.`n" -ForegroundColor Yellow
}

