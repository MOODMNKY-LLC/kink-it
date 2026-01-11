# Quick Start: Fix Supabase Certificate Errors

## 🚀 One-Command Solution

Run this PowerShell script (as Administrator recommended):

```powershell
.\scripts\setup-supabase-mkcert-certs.ps1
```

Then restart Supabase:

```powershell
supabase stop
supabase start
```

**Done!** Your browser should now trust Supabase certificates automatically.

---

## What This Does

1. ✅ Checks mkcert is installed
2. ✅ Verifies mkcert root CA is set up
3. ✅ Generates trusted certificates for Supabase (`supabase/certs/cert.pem` and `key.pem`)
4. ✅ Verifies Supabase config.toml is correct
5. ✅ Provides next steps

---

## Verification

After running the script and restarting Supabase:

1. **Open browser**: Navigate to `https://127.0.0.1:55321`
2. **No warnings**: You should NOT see certificate warnings
3. **Test your app**: Navigate to `https://127.0.0.1:3000`
4. **Check console**: No certificate errors

---

## Troubleshooting

### Still seeing warnings?

1. **Restart browser completely** (close all windows)
2. **Import root CA** (if not already done):
   ```powershell
   .\scripts\setup-certificates.ps1
   ```
3. **Clear browser SSL state**:
   - Chrome: Settings → Privacy → Clear browsing data → Advanced → "Hosted app data"
   - Edge: Settings → Privacy → Clear browsing data → Advanced

### Script fails?

- Make sure mkcert is installed: `choco install mkcert`
- Make sure mkcert root CA is installed: `mkcert -install`
- Run PowerShell as Administrator

---

## Why This Works

- **mkcert certificates** are signed by a local CA that browsers trust
- Once mkcert root CA is installed, **all mkcert certificates are automatically trusted**
- No manual certificate acceptance needed
- Works for all browsers (Chrome, Edge, Firefox)

---

## Full Documentation

For detailed information and alternative solutions, see:
- `docs/SUPABASE_CERTIFICATE_COMPREHENSIVE_SOLUTION.md`

---

**Status**: Ready to run | **Time**: ~2 minutes | **Result**: Automatic browser trust ✅
