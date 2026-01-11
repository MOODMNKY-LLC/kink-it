# Setup mkcert Certificates for Supabase
# This script generates trusted mkcert certificates for Supabase local development
# These certificates will be automatically trusted by browsers (no warnings)

Write-Host "🔒 Supabase mkcert Certificate Setup" -ForegroundColor Cyan
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

# Step 2: Check if mkcert root CA is installed
Write-Host "🔍 Step 2: Checking mkcert root CA..." -ForegroundColor Yellow

$caroot = mkcert -CAROOT 2>&1
if ($LASTEXITCODE -ne 0 -or -not $caroot) {
    Write-Host "❌ mkcert root CA not found" -ForegroundColor Red
    Write-Host "Please run: mkcert -install" -ForegroundColor Yellow
    exit 1
}

$rootCAPath = Join-Path $caroot "rootCA.pem"
if (-not (Test-Path $rootCAPath)) {
    Write-Host "❌ Root CA certificate not found at: $rootCAPath" -ForegroundColor Red
    Write-Host "Please run: mkcert -install" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Root CA found: $rootCAPath" -ForegroundColor Green
Write-Host ""

# Step 3: Check if root CA is in Windows certificate store
Write-Host "🔍 Step 3: Checking Windows certificate store..." -ForegroundColor Yellow

$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($rootCAPath)
$thumbprint = $cert.Thumbprint

$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$store.Open("ReadOnly")
$existingCert = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $thumbprint, $false)
$store.Close()

if ($existingCert.Count -eq 0) {
    Write-Host "⚠️  Root CA not in Windows certificate store" -ForegroundColor Yellow
    Write-Host "   Browsers may still show warnings" -ForegroundColor Gray
    Write-Host "   Run: .\scripts\setup-certificates.ps1 (as Administrator)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ Root CA is in Windows certificate store" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Ensure supabase/certs directory exists
Write-Host "📁 Step 4: Checking supabase/certs directory..." -ForegroundColor Yellow

$certsDir = Join-Path $PSScriptRoot "..\supabase\certs"
if (-not (Test-Path $certsDir)) {
    Write-Host "Creating supabase/certs directory..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
}

Write-Host "✅ Certificates directory: $certsDir" -ForegroundColor Green
Write-Host ""

# Step 5: Check if certificates already exist
Write-Host "🔍 Step 5: Checking for existing certificates..." -ForegroundColor Yellow

$certPath = Join-Path $certsDir "cert.pem"
$keyPath = Join-Path $certsDir "key.pem"

if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    Write-Host "⚠️  Certificates already exist" -ForegroundColor Yellow
    Write-Host "   Cert: $certPath" -ForegroundColor Gray
    Write-Host "   Key:  $keyPath" -ForegroundColor Gray
    Write-Host ""
    $overwrite = Read-Host "   Overwrite existing certificates? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "   Skipping certificate generation" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "   Generating new certificates..." -ForegroundColor Gray
        Remove-Item $certPath, $keyPath -Force -ErrorAction SilentlyContinue
    }
}

# Step 6: Generate certificates
if (-not ((Test-Path $certPath) -and (Test-Path $keyPath))) {
    Write-Host "🔐 Step 6: Generating mkcert certificates..." -ForegroundColor Yellow
    Write-Host "   This will create trusted certificates for:" -ForegroundColor Gray
    Write-Host "   - 127.0.0.1" -ForegroundColor Gray
    Write-Host "   - localhost" -ForegroundColor Gray
    Write-Host ""

    Push-Location $certsDir
    try {
        mkcert -key-file key.pem -cert-file cert.pem 127.0.0.1 localhost
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to generate certificates" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Certificates generated successfully" -ForegroundColor Green
        Write-Host "   Cert: $certPath" -ForegroundColor Gray
        Write-Host "   Key:  $keyPath" -ForegroundColor Gray
        Write-Host ""
    } finally {
        Pop-Location
    }
} else {
    Write-Host "✅ Using existing certificates" -ForegroundColor Green
    Write-Host ""
}

# Step 7: Verify certificates
Write-Host "✅ Step 7: Verifying certificates..." -ForegroundColor Yellow

if (-not (Test-Path $certPath)) {
    Write-Host "❌ Certificate file not found: $certPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $keyPath)) {
    Write-Host "❌ Key file not found: $keyPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Certificates verified" -ForegroundColor Green
Write-Host ""

# Step 8: Check Supabase config.toml
Write-Host "📋 Step 8: Checking Supabase configuration..." -ForegroundColor Yellow

$configPath = Join-Path $PSScriptRoot "..\supabase\config.toml"
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    
    # Check if TLS is enabled
    if ($configContent -match '\[api\.tls\]' -and $configContent -match 'enabled\s*=\s*true') {
        Write-Host "✅ TLS is enabled in config.toml" -ForegroundColor Green
        
        # Check if cert paths are configured
        if ($configContent -match 'cert_path\s*=\s*"\./certs/cert\.pem"' -and 
            $configContent -match 'key_path\s*=\s*"\./certs/key\.pem"') {
            Write-Host "✅ Certificate paths are correctly configured" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Certificate paths may need to be configured" -ForegroundColor Yellow
            Write-Host "   Expected in config.toml:" -ForegroundColor Gray
            Write-Host "   [api.tls]" -ForegroundColor Gray
            Write-Host "   enabled = true" -ForegroundColor Gray
            Write-Host "   cert_path = `"./certs/cert.pem`"" -ForegroundColor Gray
            Write-Host "   key_path = `"./certs/key.pem`"" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  TLS may not be enabled in config.toml" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  config.toml not found: $configPath" -ForegroundColor Yellow
}

Write-Host ""

# Step 9: Summary and next steps
Write-Host "🎉 Certificate Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart Supabase:" -ForegroundColor White
Write-Host "   supabase stop" -ForegroundColor Cyan
Write-Host "   supabase start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Verify browser trust:" -ForegroundColor White
Write-Host "   Navigate to: https://127.0.0.1:55321" -ForegroundColor Cyan
Write-Host "   You should NOT see certificate warnings!" -ForegroundColor Gray
Write-Host ""
Write-Host "3. If you still see warnings:" -ForegroundColor White
Write-Host "   - Restart your browser completely" -ForegroundColor Gray
Write-Host "   - Run: .\scripts\setup-certificates.ps1 (as Administrator)" -ForegroundColor Gray
Write-Host "   - Clear browser SSL state" -ForegroundColor Gray
Write-Host ""
Write-Host '💡 Tip: These certificates are automatically trusted by browsers' -ForegroundColor Green
Write-Host '   because they are signed by mkcert local CA.' -ForegroundColor Gray
Write-Host ""
