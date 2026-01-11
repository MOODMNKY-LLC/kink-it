# Chrome DevTools MCP Setup & Testing

**Date**: 2026-01-08  
**Status**: ✅ Configuration Added | ⚠️ Node Version Requirement

---

## ✅ Configuration Added

Chrome DevTools MCP server has been successfully added to `.cursor/mcp.json`:

\`\`\`json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
\`\`\`

---

## ✅ Node.js Version Upgraded

**Previous Version**: Node.js **20.18.0**  
**Current Version**: Node.js **20.19.0** ✅  
**Status**: ✅ Upgraded and set as default

**Upgrade Completed**: Using nvm
\`\`\`bash
nvm install 20.19.0
nvm use 20.19.0
nvm alias default 20.19.0
\`\`\`

---

## ✅ Chrome Verified

Chrome is installed and accessible:
- **Version**: Google Chrome 143.0.7499.193
- **Location**: `/Applications/Google Chrome.app`
- **Status**: ✅ Ready for Chrome DevTools MCP

---

## 🧪 Testing Steps

### Step 1: Upgrade Node.js (Required)

Upgrade to Node.js 20.19.0+ using one of the methods above.

### Step 2: Verify Node Version

\`\`\`bash
node --version
# Should show: v20.19.0 or higher
\`\`\`

### Step 3: Restart Cursor IDE

After upgrading Node.js:
1. **Quit Cursor completely** (Cmd+Q on macOS)
2. **Restart Cursor IDE**
3. MCP servers will reload automatically

### Step 4: Test Chrome DevTools MCP

Once Cursor restarts, test with these prompts:

**Test 1: Basic Connection**
\`\`\`
"Navigate to https://127.0.0.1:3000 using Chrome DevTools MCP"
\`\`\`

**Test 2: Check Console Errors**
\`\`\`
"Use Chrome DevTools MCP to navigate to my app and list all console errors"
\`\`\`

**Test 3: Take Snapshot**
\`\`\`
"Take a snapshot of the dashboard page using Chrome DevTools MCP"
\`\`\`

**Test 4: Network Monitoring**
\`\`\`
"Check network requests on the dashboard page and identify any failed API calls"
\`\`\`

---

## 🔍 Verification Checklist

- [x] Chrome DevTools MCP added to `.cursor/mcp.json`
- [x] JSON configuration is valid
- [x] Chrome browser installed (v143.0.7499.193)
- [x] Node.js upgraded to 20.19.0 ✅
- [x] Node.js set as default version ✅
- [x] Chrome DevTools MCP package verified (help command works)
- [ ] Cursor IDE restarted (required for MCP to load)
- [ ] MCP server connection tested (after restart)

---

## 🐛 Troubleshooting

### Issue: "Unsupported engine" Error

**Symptom**: 
\`\`\`
ERROR: `chrome-devtools-mcp` does not support Node v20.18.0
\`\`\`

**Solution**: Upgrade Node.js to 20.19.0+ (see Upgrade Options above)

### Issue: MCP Server Not Appearing

**Symptom**: Chrome DevTools MCP not available in Cursor

**Solutions**:
1. Verify Node.js version: `node --version`
2. Restart Cursor IDE completely
3. Check `.cursor/mcp.json` syntax is valid
4. Check Cursor MCP logs for errors

### Issue: Chrome Not Found

**Symptom**: Chrome DevTools MCP can't find Chrome

**Solution**: 
- Chrome is installed at `/Applications/Google Chrome.app`
- Chrome DevTools MCP should auto-detect it
- If not, you can specify path in MCP config (advanced)

---

## 📋 Next Steps

1. ✅ **Node.js upgraded** to 20.19.0 (completed)
2. ⏳ **Restart Cursor IDE** (required for MCP to load)
3. ⏳ **Test MCP connection** with prompts below
4. ⏳ **Start debugging** with Chrome DevTools MCP!

**Important**: After restarting Cursor, the MCP server will automatically connect. You can verify it's working by asking Cursor to use Chrome DevTools MCP.

---

## 🧪 Test Commands (After Restarting Cursor)

Once Cursor restarts, try these prompts to test Chrome DevTools MCP:

**Test 1: Basic Navigation**
\`\`\`
"Use Chrome DevTools MCP to navigate to https://127.0.0.1:3000"
\`\`\`

**Test 2: Console Error Check**
\`\`\`
"Navigate to my app using Chrome DevTools MCP and list all console errors"
\`\`\`

**Test 3: Network Monitoring**
\`\`\`
"Check network requests on the dashboard page and show any failed API calls"
\`\`\`

**Test 4: Page Snapshot**
\`\`\`
"Take a snapshot of the dashboard page using Chrome DevTools MCP"
\`\`\`

---

## 💡 Usage Examples

Once working, you can use Chrome DevTools MCP for:

- **Error Debugging**: "Check console errors on localhost:3000"
- **Network Debugging**: "Monitor API calls on the dashboard"
- **Performance**: "Record a performance trace of the tasks page"
- **Verification**: "After I fix this bug, verify there are no console errors"
- **Screenshots**: "Take a screenshot of the error state"

---

**Configuration Date**: 2026-01-08  
**Status**: ✅ Ready - Restart Cursor IDE  
**Next Action**: Restart Cursor IDE to load MCP server
