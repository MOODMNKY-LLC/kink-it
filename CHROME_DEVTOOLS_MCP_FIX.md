# Chrome DevTools MCP Fix

## Problem

The Chrome DevTools MCP server was failing with npm errors:
```
npm warn Unknown project config "node-linker"
npm warn Unknown project config "strict-peer-dependencies"
npm error Cannot read properties of null (reading 'package')
```

## Root Cause

The MCP server was configured to use `npx` (npm), but:
1. The project uses **pnpm** (not npm)
2. The `.npmrc` file contains pnpm-specific configuration options
3. npm doesn't understand pnpm-specific options and fails

## Solution

### ✅ Fixed Configuration

1. **Installed chrome-devtools-mcp locally**:
   ```bash
   pnpm add -D chrome-devtools-mcp
   ```

2. **Updated `.cursor/mcp.json`** to use pnpm instead of npx:
   ```json
   "chrome-devtools": {
     "command": "pnpm",
     "args": [
       "exec",
       "chrome-devtools-mcp"
     ]
   }
   ```

### Why This Works

- `pnpm exec` runs the locally installed package
- Avoids npm/npx conflicts with pnpm configuration
- Uses the project's package manager consistently
- No need for global installations

## Additional Issue: Node.js Version

Chrome DevTools MCP requires **Node.js 20.19.0+**, but current version is **20.18.0**.

### Upgrade Node.js

**Option 1: Using nvm-windows** (if installed):
```powershell
nvm install 20.19.0
nvm use 20.19.0
# Note: nvm-windows doesn't support 'alias' command
# Use 'nvm use 20.19.0' each time, or set it in your shell profile
```

**Option 2: Using nvm (if installed via other method)**:
```bash
nvm install 20.19.0
nvm use 20.19.0
nvm alias default 20.19.0
```

**Option 3: Download from nodejs.org**:
1. Visit: https://nodejs.org/
2. Download Node.js 20.19.0 LTS or newer
3. Install and restart terminal

**Option 4: Using Chocolatey** (if installed):
```powershell
choco upgrade nodejs-lts --version=20.19.0
```

### Verify Upgrade

After upgrading:
```powershell
node --version
# Should show: v20.19.0 or higher
```

## ✅ Status

- ✅ Node.js upgraded to v20.19.0
- ✅ chrome-devtools-mcp installed locally (v0.12.1)
- ✅ MCP config updated to use pnpm
- ✅ chrome-devtools-mcp verified working

## Next Steps

1. **Restart Cursor IDE** to reload MCP servers with new Node version
   - The MCP server will use Node 20.19.0 automatically
   - Make sure to use `nvm use 20.19.0` in your terminal if needed

2. **Test the connection** with:
   ```
   "Navigate to https://127.0.0.1:3000 using Chrome DevTools MCP"
   ```

## Note About Node Version

If you need to switch Node versions in your terminal:
```powershell
nvm use 20.19.0  # Use Node 20.19.0 for this session
```

For Cursor IDE, it should automatically use Node 20.19.0 if it's the active version when Cursor starts.

## Verification

After restarting Cursor, the Chrome DevTools MCP server should:
- ✅ Start without npm errors
- ✅ Connect to Chrome browser
- ✅ Allow browser debugging from Cursor

---

**Status**: ✅ Fixed | **Action**: Restart Cursor IDE
