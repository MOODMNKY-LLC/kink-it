# PowerShell Script to Add Missing Environment Variables to Vercel Production
# This script helps sync environment variables from .env.local to Vercel production

Write-Host "`n🚀 Vercel Production Environment Variables Sync" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Check if .env.local exists
$envLocalPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envLocalPath)) {
    Write-Host "⚠️  .env.local file not found at: $envLocalPath" -ForegroundColor Yellow
    Write-Host "Please ensure .env.local exists in the project root.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env.local file`n" -ForegroundColor Green

# Read .env.local file
$envVars = @{}
Get-Content $envLocalPath | ForEach-Object {
    if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.+)$' -and -not $_.StartsWith('#')) {
        $key = $matches[1]
        $value = $matches[2].Trim()
        if ($value -and $value -ne 'YOUR_*_HERE' -and $value -notmatch '^YOUR_') {
            $envVars[$key] = $value
        }
    }
}

# Required variables that should be in production
$requiredVars = @(
    'SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID',
    'SUPABASE_AUTH_EXTERNAL_NOTION_SECRET',
    'NEXT_PUBLIC_NOTION_TEMPLATE_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_WEBHOOK_URL'
)

# Optional variables
$optionalVars = @(
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
)

Write-Host "📋 Checking which variables need to be added...`n" -ForegroundColor Yellow

# Check current Vercel production variables
Write-Host "Checking current Vercel production environment variables..." -ForegroundColor Gray
$vercelEnvOutput = vercel env ls production 2>&1
$existingVars = @()
if ($LASTEXITCODE -eq 0) {
    $vercelEnvOutput | ForEach-Object {
        if ($_ -match '^\s+([A-Z_]+)\s+') {
            $existingVars += $matches[1]
        }
    }
}

Write-Host "`n✅ Found $($existingVars.Count) existing variables in Vercel production`n" -ForegroundColor Green

# Find missing variables
$missingRequired = @()
$missingOptional = @()

foreach ($var in $requiredVars) {
    if ($var -notin $existingVars) {
        $missingRequired += $var
    }
}

foreach ($var in $optionalVars) {
    if ($var -notin $existingVars) {
        $missingOptional += $var
    }
}

# Display results
if ($missingRequired.Count -eq 0 -and $missingOptional.Count -eq 0) {
    Write-Host "✅ All environment variables are already in Vercel production!`n" -ForegroundColor Green
    exit 0
}

if ($missingRequired.Count -gt 0) {
    Write-Host "⚠️  Missing Required Variables ($($missingRequired.Count)):" -ForegroundColor Yellow
    foreach ($var in $missingRequired) {
        $hasValue = $envVars.ContainsKey($var)
        $status = if ($hasValue) { "✅" } else { "❌" }
        Write-Host "  $status $var" -ForegroundColor $(if ($hasValue) { "Green" } else { "Red" })
    }
    Write-Host ""
}

if ($missingOptional.Count -gt 0) {
    Write-Host "ℹ️  Missing Optional Variables ($($missingOptional.Count)):" -ForegroundColor Cyan
    foreach ($var in $missingOptional) {
        $hasValue = $envVars.ContainsKey($var)
        $status = if ($hasValue) { "✅" } else { "❌" }
        Write-Host "  $status $var" -ForegroundColor $(if ($hasValue) { "Green" } else { "Gray" })
    }
    Write-Host ""
}

# Prompt user to add variables
Write-Host "Would you like to add the missing variables to Vercel production? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -ne 'Y' -and $response -ne 'y') {
    Write-Host "`nCancelled. You can add variables manually using:" -ForegroundColor Yellow
    Write-Host "  vercel env add <VARIABLE_NAME> production`n" -ForegroundColor Gray
    exit 0
}

# Add missing required variables
foreach ($var in $missingRequired) {
    if ($envVars.ContainsKey($var)) {
        Write-Host "`nAdding $var..." -ForegroundColor Cyan
        $value = $envVars[$var]
        
        # Use echo to pipe value to vercel env add
        echo $value | vercel env add $var production
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully added $var" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to add $var" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Skipping $var - value not found in .env.local" -ForegroundColor Yellow
        Write-Host "   Please add this manually: vercel env add $var production" -ForegroundColor Gray
    }
}

# Ask about optional variables
if ($missingOptional.Count -gt 0) {
    Write-Host "`nWould you like to add optional variables? (Y/N)" -ForegroundColor Yellow
    $addOptional = Read-Host
    
    if ($addOptional -eq 'Y' -or $addOptional -eq 'y') {
        foreach ($var in $missingOptional) {
            if ($envVars.ContainsKey($var)) {
                Write-Host "`nAdding $var..." -ForegroundColor Cyan
                $value = $envVars[$var]
                echo $value | vercel env add $var production
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Successfully added $var" -ForegroundColor Green
                } else {
                    Write-Host "❌ Failed to add $var" -ForegroundColor Red
                }
            }
        }
    }
}

Write-Host "`n✅ Environment variable sync complete!`n" -ForegroundColor Green
Write-Host "Verify with: vercel env ls production`n" -ForegroundColor Gray
