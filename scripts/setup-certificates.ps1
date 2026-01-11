# Certificate Setup Script for Windows PowerShell
# Automatically imports mkcert root CA into Windows certificate store
# This makes browsers (Chrome/Edge) automatically trust mkcert certificates

Write-Host "🔒 Certificate Setup Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if mkcert is installed
Write-Host "📦 Step 1: Checking mkcert installation..." -ForegroundColor Yellow

$mkcertPath = Get-Command mkcert -ErrorAction SilentlyContinue
if (-not $mkcertPath) {
    Write-Host "❌ mkcert not found in PATH" -ForegroundColor Red
    Write-Host "Please install mkcert:" -ForegroundColor Yellow
    Write-Host "  choco install mkcert" -ForegroundColor Gray
    Write-Host "  OR" -ForegroundColor Gray
    Write-Host "  scoop install mkcert" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ mkcert found: $($mkcertPath.Source)" -ForegroundColor Green
Write-Host ""

# Step 2: Get mkcert CAROOT directory
Write-Host "📁 Step 2: Finding mkcert root CA..." -ForegroundColor Yellow

$caroot = mkcert -CAROOT 2>&1
if ($LASTEXITCODE -ne 0 -or -not $caroot) {
    Write-Host "❌ Failed to get mkcert CAROOT" -ForegroundColor Red
    Write-Host "Try running: mkcert -install" -ForegroundColor Yellow
    exit 1
}

$rootCAPath = Join-Path $caroot "rootCA.pem"
if (-not (Test-Path $rootCAPath)) {
    Write-Host "❌ Root CA certificate not found at: $rootCAPath" -ForegroundColor Red
    Write-Host "Try running: mkcert -install" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Root CA found: $rootCAPath" -ForegroundColor Green
Write-Host ""

# Step 3: Check if root CA is already in Windows certificate store
Write-Host "🔍 Step 3: Checking Windows certificate store..." -ForegroundColor Yellow

# Read the certificate to get its thumbprint
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($rootCAPath)
$thumbprint = $cert.Thumbprint

# Check if certificate exists in Trusted Root Certification Authorities store
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$store.Open("ReadOnly")
$existingCert = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $thumbprint, $false)
$store.Close()

if ($existingCert.Count -gt 0) {
    Write-Host "✅ Root CA already imported into Windows certificate store" -ForegroundColor Green
    Write-Host "   Thumbprint: $thumbprint" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Certificate trust is already configured!" -ForegroundColor Green
    Write-Host "   Browsers should automatically trust mkcert certificates." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "⚠️  Root CA not found in Windows certificate store" -ForegroundColor Yellow
Write-Host ""

# Step 4: Import root CA into Windows certificate store
Write-Host "📥 Step 4: Importing root CA into Windows certificate store..." -ForegroundColor Yellow
Write-Host "   This requires administrator privileges." -ForegroundColor Gray
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Not running as administrator" -ForegroundColor Yellow
    Write-Host "   Attempting to elevate privileges..." -ForegroundColor Gray
    Write-Host ""
    
    # Create a script block to import the certificate
    $scriptBlock = @"
        `$rootCAPath = '$rootCAPath'
        `$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
        `$store.Open("ReadWrite")
        `$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(`$rootCAPath)
        `$store.Add(`$cert)
        `$store.Close()
        Write-Host "✅ Certificate imported successfully" -ForegroundColor Green
"@
    
    # Try to run with elevated privileges
    try {
        Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $scriptBlock -Wait
        Write-Host "✅ Certificate import completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to elevate privileges" -ForegroundColor Red
        Write-Host ""
        Write-Host "📋 Manual Import Instructions:" -ForegroundColor Yellow
        Write-Host "1. Open PowerShell as Administrator" -ForegroundColor White
        Write-Host "2. Run this command:" -ForegroundColor White
        Write-Host ('   certutil -addstore -f "ROOT" "' + $rootCAPath + '"') -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   OR" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Double-click: $rootCAPath" -ForegroundColor White
        Write-Host "4. Click 'Install Certificate...'" -ForegroundColor White
        Write-Host "5. Select 'Local Machine' → Next" -ForegroundColor White
        Write-Host "6. Select 'Place all certificates in the following store'" -ForegroundColor White
        Write-Host "7. Browse → Select 'Trusted Root Certification Authorities' → OK" -ForegroundColor White
        Write-Host "8. Click Next → Finish" -ForegroundColor White
        Write-Host ""
        exit 1
    }
} else {
    # Running as admin, import directly
    try {
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
        $store.Open("ReadWrite")
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($rootCAPath)
        $store.Add($cert)
        $store.Close()
        Write-Host "✅ Certificate imported successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to import certificate: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 5: Verify import
Write-Host "✅ Step 5: Verifying certificate import..." -ForegroundColor Yellow

$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$store.Open("ReadOnly")
$importedCert = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $thumbprint, $false)
$store.Close()

if ($importedCert.Count -gt 0) {
    Write-Host "✅ Certificate successfully imported!" -ForegroundColor Green
    Write-Host "   Thumbprint: $thumbprint" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Certificate trust configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your browser (Chrome/Edge)" -ForegroundColor White
    Write-Host "2. Navigate to: https://127.0.0.1:55321" -ForegroundColor White
    Write-Host "3. You should NOT see certificate warnings!" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 If you still see warnings:" -ForegroundColor Yellow
    Write-Host "   - Clear browser cache" -ForegroundColor White
    Write-Host "   - Restart browser completely" -ForegroundColor White
    Write-Host "   - Try accessing https://127.0.0.1:3000" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Certificate import verification failed" -ForegroundColor Red
    Write-Host "   Please try manual import (see instructions above)" -ForegroundColor Yellow
    exit 1
}
