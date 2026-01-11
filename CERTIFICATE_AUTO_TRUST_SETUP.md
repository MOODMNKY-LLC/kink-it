# Automatic Certificate Trust Setup

## Problem

Browsers (Chrome/Edge) are showing certificate warnings even though mkcert certificates are generated. This happens because browsers need the mkcert root CA certificate imported into the Windows certificate store.

## Solution: Import mkcert Root CA

### Quick Method (Recommended)

1. **Open PowerShell as Administrator**:
   - Right-click PowerShell → "Run as Administrator"

2. **Run the import script**:
   ```powershell
   cd C:\DEV-MNKY\MOOD_MNKY\kink-it
   .\scripts\import-mkcert-certificate.ps1
   ```

3. **Or use certutil directly**:
   ```powershell
   $caroot = mkcert -CAROOT
   certutil -addstore -f "ROOT" "$caroot\rootCA.pem"
   ```

### Verify Import

After importing, verify it worked:

```powershell
$caroot = mkcert -CAROOT
$rootCA = Join-Path $caroot "rootCA.pem"
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($rootCA)
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$store.Open("ReadOnly")
$found = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $cert.Thumbprint, $false)
$store.Close()
if ($found.Count -gt 0) {
    Write-Host "✅ Certificate is imported" -ForegroundColor Green
} else {
    Write-Host "❌ Certificate not found" -ForegroundColor Red
}
```

### After Import

1. **Restart your browser** (Chrome/Edge)
2. **Clear browser cache** (optional but recommended)
3. **Navigate to**: `https://127.0.0.1:55321`
4. **You should NOT see certificate warnings!**

## Why This Works

- mkcert creates certificates signed by a local root CA
- The root CA certificate needs to be in Windows Trusted Root Certification Authorities store
- Chrome/Edge on Windows use the Windows certificate store
- Once imported, browsers automatically trust all certificates signed by mkcert

## Troubleshooting

### Still Seeing Warnings?

1. **Make sure you restarted the browser completely** (close all windows)
2. **Check certificate is imported** (use verify command above)
3. **Try accessing in incognito/private mode** to test
4. **Clear browser SSL state**:
   - Chrome: Settings → Privacy → Clear browsing data → Advanced → "Hosted app data"
   - Edge: Settings → Privacy → Clear browsing data → Advanced

### Certificate Not Importing?

- Make sure you're running PowerShell **as Administrator**
- Check the root CA file exists: `mkcert -CAROOT` should show the path
- Try the manual method below

### Manual Import Method

If the script doesn't work, import manually:

1. **Find the root CA certificate**:
   ```powershell
   mkcert -CAROOT
   ```
   This shows the path (usually `C:\Users\<YourName>\AppData\Local\mkcert`)

2. **Open the certificate file**:
   - Navigate to the folder shown above
   - Double-click `rootCA.pem`

3. **Install the certificate**:
   - Click "Install Certificate..."
   - Select "Local Machine" → Next
   - Select "Place all certificates in the following store"
   - Click "Browse" → Select "Trusted Root Certification Authorities" → OK
   - Click Next → Finish
   - Click "Yes" on the security warning

4. **Restart browser**

## Expected Result

After setup:
- ✅ No certificate warnings in browser
- ✅ Automatic trust for `https://127.0.0.1:55321` (Supabase)
- ✅ Automatic trust for `https://127.0.0.1:3000` (Next.js)
- ✅ All mkcert certificates trusted automatically

## One-Time Setup

This is a **one-time setup**. Once the root CA is imported:
- All future mkcert certificates will be automatically trusted
- No need to accept certificates manually
- Works for all projects using mkcert

---

**Status**: Ready to import | **Next**: Run the import script as Administrator
