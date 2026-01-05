# Discord MCP Immediate Fix

**Issue**: Discord MCP login failing with "TokenInvalid" error  
**Cause**: Docker container not receiving DISCORD_TOKEN environment variable

---

## 🚨 Quick Fix (Do This Now)

### Step 1: Export DISCORD_TOKEN

**Open PowerShell** and run:

```powershell
# Load DISCORD_BOT_TOKEN from .env.local (if not already loaded)
$envContent = Get-Content ".env.local" | Where-Object { $_ -match "^DISCORD_BOT_TOKEN=" }
if ($envContent) {
    $token = $envContent.Split("=")[1].Trim()
    $env:DISCORD_BOT_TOKEN = $token
}

# Set DISCORD_TOKEN for Docker
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN

# Verify it's set
Write-Host "DISCORD_TOKEN length: $($env:DISCORD_TOKEN.Length)" -ForegroundColor Green
```

### Step 2: Restart Cursor IDE

1. **Close Cursor completely** (all windows)
2. **Reopen Cursor IDE**
3. The MCP server will restart and pick up the environment variable

### Step 3: Test Again

After restarting, try:
```
Login to Discord with bot token using random string "test"
```

Then:
```
Send a test message to Discord channel 1457594125590462548: "Test message"
```

---

## 🔍 Alternative: Check Current Environment

**Check if DISCORD_BOT_TOKEN is set**:
```powershell
$env:DISCORD_BOT_TOKEN
```

**If it's not set**, you need to load it from `.env.local`:
```powershell
# Get token from .env.local
$envContent = Get-Content ".env.local"
$tokenLine = $envContent | Where-Object { $_ -match "^DISCORD_BOT_TOKEN=" }
if ($tokenLine) {
    $token = $tokenLine.Split("=")[1].Trim()
    $env:DISCORD_BOT_TOKEN = $token
    $env:DISCORD_TOKEN = $token
    Write-Host "✅ Token loaded and DISCORD_TOKEN set" -ForegroundColor Green
} else {
    Write-Host "❌ DISCORD_BOT_TOKEN not found in .env.local" -ForegroundColor Red
}
```

---

## 📝 Permanent Fix

To make this persistent, add to your PowerShell profile:

**Find your profile**:
```powershell
$PROFILE
```

**Edit it**:
```powershell
notepad $PROFILE
```

**Add this**:
```powershell
# Discord MCP Token Setup
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $tokenLine = $envContent | Where-Object { $_ -match "^DISCORD_BOT_TOKEN=" }
    if ($tokenLine) {
        $token = $tokenLine.Split("=")[1].Trim()
        if ($token -and $token -ne "YOUR_DISCORD_BOT_TOKEN_HERE") {
            $env:DISCORD_BOT_TOKEN = $token
            $env:DISCORD_TOKEN = $token
        }
    }
}
```

**Then restart PowerShell** or run:
```powershell
. $PROFILE
```

---

## ✅ Verification

After setting the environment variable and restarting Cursor:

1. **Check MCP server status** in Cursor settings
2. **Try Discord login** - should succeed
3. **Send test message** - should work

---

**Last Updated**: 2026-01-27  
**Status**: Ready for Testing


