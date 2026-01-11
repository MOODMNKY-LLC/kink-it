# Simple script to import mkcert root CA into Windows certificate store
# Run this script as Administrator

$caroot = mkcert -CAROOT
$rootCAPath = Join-Path $caroot "rootCA.pem"

if (-not (Test-Path $rootCAPath)) {
    Write-Host "Error: Root CA not found. Run: mkcert -install" -ForegroundColor Red
    exit 1
}

Write-Host "Importing mkcert root CA..." -ForegroundColor Yellow
Write-Host "Path: $rootCAPath" -ForegroundColor Gray

try {
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $store.Open("ReadWrite")
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($rootCAPath)
    $store.Add($cert)
    $store.Close()
    Write-Host "Success: Certificate imported!" -ForegroundColor Green
    Write-Host "Restart your browser to apply changes." -ForegroundColor Yellow
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure you're running as Administrator" -ForegroundColor Yellow
    exit 1
}
