# Update/Add missing environment variables to Vercel production
# Handles both new additions and updates to existing variables

param(
    [switch]$ForceUpdate = $false
)

Write-Host "`n🚀 Updating Vercel Production Environment Variables" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

$envLocalPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envLocalPath)) {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    exit 1
}

function Get-EnvValue {
    param([string]$VarName)
    $line = Get-Content $envLocalPath | Select-String -Pattern "^$VarName=" | Select-Object -First 1
    if ($line) {
        $value = ($line.Line -split '=', 2)[1].Trim()
        $value = $value -replace '^["'']|["'']$', ''
        return $value
    }
    return $null
}

# Get existing Vercel env vars
Write-Host "Checking existing Vercel production variables...`n" -ForegroundColor Yellow
$vercelEnvOutput = vercel env ls production 2>&1 | Out-String
$existingVars = @{}
if ($LASTEXITCODE -eq 0) {
    $vercelEnvOutput -split "`n" | ForEach-Object {
        if ($_ -match '^\s+([A-Z_]+)\s+') {
            $existingVars[$matches[1]] = $true
        }
    }
}

# Required variables
$requiredVars = @(
    'NOTION_API_KEY',
    'NOTION_API_KEY_ENCRYPTION_KEY',
    'NOTION_APP_IDEAS_DATABASE_ID',
    'NEXT_PUBLIC_NOTION_TEMPLATE_URL',
    'SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID',
    'SUPABASE_AUTH_EXTERNAL_NOTION_SECRET',
    'AI_GATEWAY_API_KEY',
    'OPENAI_API_KEY'
)

# Optional variables
$optionalVars = @(
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'V0_API_KEY',
    'VERCEL_TOKEN'
)

$allVars = $requiredVars + $optionalVars
$varsToAdd = @()
$varsToUpdate = @()

foreach ($varName in $allVars) {
    $value = Get-EnvValue -VarName $varName
    
    # Use defaults for known values
    if (-not $value) {
        switch ($varName) {
            'NOTION_APP_IDEAS_DATABASE_ID' { $value = 'cc491ef5f0a64eac8e05a6ea10dfb735' }
            'NEXT_PUBLIC_NOTION_TEMPLATE_URL' { $value = 'https://www.notion.so/mood-mnky/KINK-IT-User-Template-2dfcd2a6542281bcba14ffa2099160d8' }
        }
    }
    
    if ($value -and $value -notmatch 'YOUR_.*_HERE' -and $value.Length -ge 5) {
        if ($existingVars.ContainsKey($varName)) {
            if ($ForceUpdate) {
                $varsToUpdate += @{ Name = $varName; Value = $value }
            } else {
                Write-Host "✅ $varName already exists (use -ForceUpdate to update)" -ForegroundColor Green
            }
        } else {
            $varsToAdd += @{ Name = $varName; Value = $value }
        }
    } elseif ($requiredVars -contains $varName) {
        Write-Host "⚠️  Missing required: $varName" -ForegroundColor Yellow
    }
}

Write-Host "`nVariables to add: $($varsToAdd.Count)" -ForegroundColor Cyan
Write-Host "Variables to update: $($varsToUpdate.Count)`n" -ForegroundColor Cyan

if ($varsToAdd.Count -eq 0 -and $varsToUpdate.Count -eq 0) {
    Write-Host "✅ All variables are already set!`n" -ForegroundColor Green
    exit 0
}

$added = 0
$updated = 0
$failed = 0

# Add new variables
foreach ($var in $varsToAdd) {
    Write-Host "Adding $($var.Name)..." -ForegroundColor Cyan -NoNewline
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        $var.Value | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
        Get-Content $tempFile | & vercel env add $var.Name production 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $added++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
        $failed++
    } finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
}

# Update existing variables (requires removal and re-add)
foreach ($var in $varsToUpdate) {
    Write-Host "Updating $($var.Name)..." -ForegroundColor Cyan -NoNewline
    
    try {
        # Remove existing
        vercel env rm $var.Name production --yes 2>&1 | Out-Null
        
        # Add new value
        $tempFile = [System.IO.Path]::GetTempFileName()
        $var.Value | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
        Get-Content $tempFile | & vercel env add $var.Name production 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $updated++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $failed++
        }
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Added: $added" -ForegroundColor Green
Write-Host "   🔄 Updated: $updated" -ForegroundColor Cyan
Write-Host "   ❌ Failed: $failed`n" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Gray' })

if ($added -gt 0 -or $updated -gt 0) {
    Write-Host "✅ Environment variables updated!`n" -ForegroundColor Green
    Write-Host "🚀 Ready to redeploy!`n" -ForegroundColor Cyan
}

