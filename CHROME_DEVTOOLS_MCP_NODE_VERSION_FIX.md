# Chrome DevTools MCP Node Version Fix

## Problem

The Chrome DevTools MCP server is failing with:
```
ERROR: `chrome-devtools-mcp` does not support Node v22.11.0. Please upgrade to Node 22.12.0 LTS or a newer LTS.
```

## Root Cause Analysis

1. **Cursor IDE uses Node v22.11.0** internally when executing MCP servers
2. **chrome-devtools-mcp v0.12.1** requires: `^20.19.0 || ^22.12.0 || >=23`
3. Node v22.11.0 doesn't match any of these ranges (22.11.0 < 22.12.0)
4. The terminal has Node v20.19.0 (compatible), but Cursor uses its own Node version

## Solution

Created a wrapper script that explicitly uses a compatible Node version (24.12.0 or 20.19.0) from nvm, bypassing Cursor's Node version.

### ✅ Created Wrapper Script

**File**: `scripts/chrome-devtools-mcp-wrapper.ps1`

This script:
- Uses Node 24.12.0 (or falls back to 20.19.0) from nvm
- Runs chrome-devtools-mcp directly with the compatible Node version
- Bypasses Cursor's internal Node version

### ✅ Updated MCP Configuration

Update `.cursor/mcp.json` to use the wrapper script:

**Before**:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "pnpm",
      "args": ["exec", "chrome-devtools-mcp"]
    }
  }
}
```

**After**:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "powershell",
      "args": [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "scripts/chrome-devtools-mcp-wrapper.ps1"
      ]
    }
  }
}
```

**Note**: Use an absolute path if Cursor doesn't resolve relative paths correctly:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "powershell",
      "args": [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "C:\\DEV-MNKY\\MOOD_MNKY\\kink-it\\scripts\\chrome-devtools-mcp-wrapper.ps1"
      ]
    }
  }
}
```

## Verification

Test the wrapper script:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts\chrome-devtools-mcp-wrapper.ps1" --version
# Should output: 0.12.1
```

## Next Steps

1. **Update `.cursor/mcp.json`** with the new configuration above
2. **Restart Cursor IDE** completely to reload MCP servers
3. **Verify** the Chrome DevTools MCP server starts without errors

## Technical Details

### Node Version Requirements
- chrome-devtools-mcp requires: `^20.19.0 || ^22.12.0 || >=23`
- Cursor IDE uses: Node v22.11.0 (incompatible)
- Wrapper uses: Node v24.12.0 (satisfies `>=23`)

### Wrapper Script Logic
1. Checks for Node 24.12.0 in nvm directory
2. Falls back to Node 20.19.0 if 24.12.0 not found
3. Runs chrome-devtools-mcp directly with compatible Node
4. Passes all arguments through to chrome-devtools-mcp

## Status

- ✅ Wrapper script created and tested
- ⏳ MCP configuration needs to be updated manually (file is filtered)
- ⏳ Cursor IDE restart required after config update

---

**Status**: ✅ Ready | **Action**: Update `.cursor/mcp.json` and restart Cursor IDE
