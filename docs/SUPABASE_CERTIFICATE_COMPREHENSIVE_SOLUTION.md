# Comprehensive Solution: Supabase Certificate Trust Issues

**Date**: 2026-01-10  
**Status**: Multiple Solutions Available  
**Priority**: High - Blocks local development

---

## Problem Analysis

### Current Situation

1. **Supabase TLS Enabled**: `supabase/config.toml` has `[api.tls] enabled = true`
2. **Auto-Generated Certificates**: Supabase generates self-signed certificates automatically
3. **Browser Trust Issue**: Browsers don't trust self-signed certificates by default
4. **Node.js Handled**: `server.js` sets `NODE_TLS_REJECT_UNAUTHORIZED='0'` for Node.js
5. **Browser Still Fails**: Browser certificate validation still blocks requests

### Root Cause

- Supabase's auto-generated certificates are **self-signed** (not trusted by browsers)
- Browsers require certificates signed by a **trusted Certificate Authority (CA)**
- Manual certificate acceptance is required each time, which is not sustainable

---

## Solution Options (Ranked by Effectiveness)

### ✅ Option A: Use mkcert Certificates for Supabase (RECOMMENDED)

**Best for**: Permanent, automatic browser trust

**How it works**: Generate mkcert certificates (which browsers trust automatically) and configure Supabase to use them.

#### Steps:

1. **Generate mkcert certificates for Supabase**:
   ```powershell
   cd supabase/certs
   mkcert -key-file key.pem -cert-file cert.pem 127.0.0.1 localhost
   ```

2. **Verify certificates were created**:
   ```powershell
   Get-ChildItem supabase/certs
   # Should show: cert.pem and key.pem
   ```

3. **Restart Supabase**:
   ```powershell
   supabase stop
   supabase start
   ```

4. **Verify browser trust**:
   - Navigate to `https://127.0.0.1:55321`
   - Should **NOT** show certificate warnings
   - Certificate is automatically trusted (thanks to mkcert root CA)

#### Why This Works:

- mkcert certificates are signed by a **local CA** that browsers trust
- Once mkcert root CA is installed (via `mkcert -install`), all mkcert certificates are automatically trusted
- No manual certificate acceptance needed
- Works for all browsers (Chrome, Edge, Firefox)

#### Prerequisites:

- ✅ mkcert installed (`choco install mkcert` or `brew install mkcert`)
- ✅ mkcert root CA installed (`mkcert -install`)
- ✅ `supabase/certs/` directory exists

---

### ✅ Option B: Import mkcert Root CA (Already Configured)

**Best for**: Trusting all mkcert certificates system-wide

**Status**: Scripts already exist in the codebase

#### Steps:

1. **Run the import script** (as Administrator):
   ```powershell
   .\scripts\setup-certificates.ps1
   ```

2. **Or import manually**:
   ```powershell
   $caroot = mkcert -CAROOT
   certutil -addstore -f "ROOT" "$caroot\rootCA.pem"
   ```

3. **Restart browser** completely

#### Why This Works:

- Windows certificate store is used by Chrome/Edge
- Once root CA is imported, all certificates signed by mkcert are trusted
- Works for all projects using mkcert

#### Note:

- This is a **one-time setup** per machine
- Already documented in `CERTIFICATE_AUTO_TRUST_SETUP.md`

---

### ✅ Option C: Configure Node.js to Trust mkcert CA

**Best for**: Node.js server-side requests to Supabase

**How it works**: Set `NODE_EXTRA_CA_CERTS` environment variable to point to mkcert root CA.

#### Steps:

1. **Set environment variable** (PowerShell):
   ```powershell
   $caroot = mkcert -CAROOT
   $env:NODE_EXTRA_CA_CERTS = "$caroot\rootCA.pem"
   ```

2. **Or add to `.env.local`**:
   ```bash
   NODE_EXTRA_CA_CERTS=C:\Users\Simeon\AppData\Local\mkcert\rootCA.pem
   ```

3. **Update `server.js`** to remove `NODE_TLS_REJECT_UNAUTHORIZED='0'`:
   ```javascript
   // Remove this line (or make it conditional):
   // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
   
   // Instead, rely on NODE_EXTRA_CA_CERTS
   ```

#### Why This Works:

- Node.js doesn't use system certificate store by default
- `NODE_EXTRA_CA_CERTS` tells Node.js to trust additional CAs
- More secure than disabling certificate validation entirely

#### Note:

- Only affects **Node.js** (server-side)
- Browser still needs Option A or B

---

### ⚠️ Option D: Proxy/Middleware Approach

**Best for**: Temporary workaround or complex setups

**How it works**: Create a Next.js API route that proxies requests to Supabase, handling certificate issues server-side.

#### Implementation:

Create `app/api/supabase-proxy/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Proxy request to Supabase
  const response = await fetch(`${supabaseUrl}/rest/v1/${body.endpoint}`, {
    method: body.method || 'POST',
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...body.headers,
    },
    body: JSON.stringify(body.data),
  })
  
  const data = await response.json()
  return NextResponse.json(data)
}
```

#### Why This Works:

- Server-side requests bypass browser certificate validation
- Node.js can be configured to trust certificates (Option C)
- Client never directly connects to Supabase

#### Drawbacks:

- Adds complexity
- May break Supabase real-time subscriptions
- Not recommended for production

---

### ⚠️ Option E: Application-Level Certificate Handling

**Best for**: User experience improvements (already implemented)

**Status**: Already implemented in `components/supabase/certificate-check.tsx`

#### Current Implementation:

- Detects certificate errors
- Shows user-friendly instructions
- Provides one-click certificate acceptance link

#### Enhancement Options:

1. **Auto-redirect on certificate error**:
   ```typescript
   // In certificate-check.tsx
   useEffect(() => {
     if (showWarning && !dismissed) {
       // Auto-redirect after 3 seconds
       setTimeout(() => {
         window.location.href = supabaseUrl
       }, 3000)
     }
   }, [showWarning, dismissed, supabaseUrl])
   ```

2. **Service Worker for certificate handling**:
   - Intercept fetch requests
   - Handle certificate errors gracefully
   - Retry with user confirmation

#### Note:

- This is a **user experience** improvement, not a technical fix
- Still requires manual certificate acceptance
- Best combined with Option A or B

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Option A)

1. Generate mkcert certificates for Supabase
2. Update `supabase/config.toml` (if needed - should auto-detect)
3. Restart Supabase
4. Verify browser trust

### Phase 2: Node.js Configuration (Option C)

1. Set `NODE_EXTRA_CA_CERTS` environment variable
2. Remove `NODE_TLS_REJECT_UNAUTHORIZED='0'` from `server.js`
3. Test server-side Supabase requests

### Phase 3: Documentation & Automation

1. Create automated setup script
2. Update documentation
3. Add verification checks

---

## Verification Checklist

After implementing a solution:

- [ ] Navigate to `https://127.0.0.1:55321` - no certificate warnings
- [ ] Navigate to `https://127.0.0.1:3000` - app loads without errors
- [ ] Check browser console - no certificate errors
- [ ] Test Supabase auth - login works
- [ ] Test Supabase queries - data loads correctly
- [ ] Test Supabase real-time - subscriptions work
- [ ] Restart browser - certificate still trusted

---

## Troubleshooting

### Still Seeing Certificate Warnings?

1. **Check mkcert root CA is installed**:
   ```powershell
   mkcert -CAROOT
   # Should show: C:\Users\Simeon\AppData\Local\mkcert
   ```

2. **Verify root CA is in Windows certificate store**:
   ```powershell
   $caroot = mkcert -CAROOT
   $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("$caroot\rootCA.pem")
   $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
   $store.Open("ReadOnly")
   $found = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $cert.Thumbprint, $false)
   $store.Close()
   if ($found.Count -gt 0) { Write-Host "✅ Root CA is imported" } else { Write-Host "❌ Root CA not found" }
   ```

3. **Restart browser completely** (close all windows)

4. **Clear browser SSL state**:
   - Chrome: Settings → Privacy → Clear browsing data → Advanced → "Hosted app data"
   - Edge: Settings → Privacy → Clear browsing data → Advanced

5. **Check certificate paths in config.toml**:
   ```toml
   [api.tls]
   enabled = true
   cert_path = "./certs/cert.pem"  # Should exist
   key_path = "./certs/key.pem"     # Should exist
   ```

### Node.js Still Rejecting Certificates?

1. **Check NODE_EXTRA_CA_CERTS is set**:
   ```powershell
   $env:NODE_EXTRA_CA_CERTS
   # Should show path to rootCA.pem
   ```

2. **Verify path exists**:
   ```powershell
   Test-Path $env:NODE_EXTRA_CA_CERTS
   # Should return: True
   ```

3. **Restart Node.js process** after setting environment variable

---

## Additional Resources

- **mkcert Documentation**: https://github.com/FiloSottile/mkcert
- **Supabase TLS Configuration**: https://supabase.com/docs/guides/cli/local-development#enabling-https
- **Node.js Certificate Trust**: https://nodejs.org/api/cli.html#node_extra_ca_certsfile
- **Windows Certificate Store**: https://docs.microsoft.com/en-us/windows/win32/seccrypto/certificate-stores

---

## Summary

**Best Solution**: **Option A** (Use mkcert certificates for Supabase)

**Why**: 
- Automatic browser trust
- No manual certificate acceptance
- Works for all browsers
- One-time setup
- Most secure approach

**Implementation Time**: ~5 minutes

**Long-term Maintenance**: None (certificates persist)

---

**Status**: Ready to implement | **Next**: Generate mkcert certificates for Supabase
