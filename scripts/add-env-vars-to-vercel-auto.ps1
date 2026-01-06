# Auto-add environment variables to Vercel production from .env.local
# Non-interactive version for automated deployment

param(
    [switch]$SkipConfirmation = $false
)

Write-Host "`n🚀 Auto-Adding Environment Variables to Vercel Production" -ForegroundColor Cyan
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

# Required environment variables
$varsToAdd = @(
    @{Name='NOTION_API_KEY'; Desc='Notion API Key'; Required=$true},
    @{Name='NOTION_API_KEY_ENCRYPTION_KEY'; Desc='Notion API Key Encryption Key'; Required=$true},
    @{Name='NOTION_APP_IDEAS_DATABASE_ID'; Desc='Notion App Ideas Database ID'; Required=$true; Default='cc491ef5f0a64eac8e05a6ea10dfb735'},
    @{Name='NEXT_PUBLIC_NOTION_TEMPLATE_URL'; Desc='Notion Template URL'; Required=$true; Default='https://www.notion.so/mood-mnky/KINK-IT-User-Template-2dfcd2a6542281bcba14ffa2099160d8'},
    @{Name='SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID'; Desc='Notion OAuth Client ID'; Required=$true},
    @{Name='SUPABASE_AUTH_EXTERNAL_NOTION_SECRET'; Desc='Notion OAuth Client Secret'; Required=$true},
    @{Name='AI_GATEWAY_API_KEY'; Desc='Vercel AI Gateway API Key'; Required=$true},
    @{Name='OPENAI_API_KEY'; Desc='OpenAI API Key'; Required=$true},
    @{Name='NEXT_PUBLIC_VAPID_PUBLIC_KEY'; Desc='VAPID Public Key'; Required=$false},
    @{Name='VAPID_PRIVATE_KEY'; Desc='VAPID Private Key'; Required=$false},
    @{Name='V0_API_KEY'; Desc='v0 API Key'; Required=$false},
    @{Name='VERCEL_TOKEN'; Desc='Vercel API Token'; Required=$false}
)

Write-Host "Reading values from .env.local...`n" -ForegroundColor Yellow

$varsToSync = @()
foreach ($var in $varsToAdd) {
    $value = if ($var.Default) { $var.Default } else { Get-EnvValue -VarName $var.Name }
    
    if ($value -and $value -notmatch 'YOUR_.*_HERE' -and ($value.Length -ge 5 -or -not $var.Required)) {
        $varsToSync += @{
            Name = $var.Name
            Value = $value
            Required = $var.Required
            Desc = $var.Desc
        }
        Write-Host "✅ Found: $($var.Name)" -ForegroundColor Green
    } elseif ($var.Required) {
        Write-Host "⚠️  Missing required: $($var.Name)" -ForegroundColor Yellow
    }
}

if ($varsToSync.Count -eq 0) {
    Write-Host "`n❌ No valid environment variables found to sync`n" -ForegroundColor Red
    exit 1
}

Write-Host "`nFound $($varsToSync.Count) variable(s) to sync`n" -ForegroundColor Cyan

if (-not $SkipConfirmation) {
    Write-Host "This will add the above variables to Vercel production." -ForegroundColor Yellow
    Write-Host "Continue? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "Cancelled.`n" -ForegroundColor Gray
        exit 0
    }
}

$added = 0
$failed = 0

foreach ($var in $varsToSync) {
    Write-Host "Adding $($var.Name)..." -ForegroundColor Cyan -NoNewline
    
    try {
        # Create a temporary file with the value
        $tempFile = [System.IO.Path]::GetTempFileName()
        $var.Value | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
        
        # Use Get-Content to pipe to vercel env add
        Get-Content $tempFile | & vercel env add $var.Name production 2>&1 | Out-Null
        
        # Clean up temp file
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $added++
        } else {
            Write-Host " ❌ (Exit code: $LASTEXITCODE)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Added: $added" -ForegroundColor Green
Write-Host "   ❌ Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Gray' })
Write-Host "`n" -ForegroundColor Gray

if ($added -gt 0) {
    Write-Host "✅ Environment variables synced!`n" -ForegroundColor Green
}

if ($failed -gt 0) {
    Write-Host "⚠️  Some variables failed to add. Check output above.`n" -ForegroundColor Yellow
    exit 1
}
