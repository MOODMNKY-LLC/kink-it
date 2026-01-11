# Fix: "400 Bad Request - The plain HTTP request was sent to HTTPS port"

## 🔴 Error Message

\`\`\`
400 Bad Request
The plain HTTP request was sent to HTTPS port
\`\`\`

## 🎯 What This Means

Docker Desktop is expecting a **TLS/HTTPS** connection on port 2375, but you're trying to connect using **plain HTTP** (non-TLS). This happens when:

1. Docker Desktop has TLS enabled for that port
2. There's a conflicting configuration
3. Docker Desktop version requires GUI checkbox instead of JSON

## ✅ Solutions (Try in Order)

### Solution 1: Use Docker Desktop GUI Checkbox ⭐ **RECOMMENDED**

**This is often the easiest method** - Docker Desktop may have a GUI option:

1. **Open Docker Desktop**
   - Right-click Docker icon → **Settings**

2. **Go to General Tab**
   - Click **General** in the left sidebar (NOT Docker Engine)

3. **Find the Checkbox**
   - Look for: **"Expose daemon on tcp://localhost:2375 without TLS"**
   - Or: **"Expose daemon on tcp://localhost:2375"** (with TLS option)

4. **Enable It**
   - ✅ Check the box for **"without TLS"** option
   - Make sure it says **"without TLS"** or **"no TLS"**

5. **Apply Changes**
   - Click **Apply & Restart**
   - Wait for Docker to restart

6. **Remove JSON hosts Array**
   - Go to **Docker Engine** tab
   - Remove the `hosts` array from JSON (let the checkbox handle it)
   - Or keep only: `"hosts": ["npipe://"]`
   - Click **Apply & Restart** again

### Solution 2: Verify JSON Configuration

If you're using JSON configuration, ensure it's correct:

**✅ Correct Configuration:**
\`\`\`json
{
  "hosts": [
    "npipe://",
    "tcp://localhost:2375"
  ]
}
\`\`\`

**❌ Common Mistakes:**

1. **Using wrong port** (2376 is TLS):
   \`\`\`json
   "tcp://localhost:2376"  // ❌ Wrong - this is TLS port
   \`\`\`

2. **Using 0.0.0.0 instead of localhost**:
   \`\`\`json
   "tcp://0.0.0.0:2375"  // ❌ Wrong - exposes to network
   \`\`\`

3. **Having TLS settings enabled**:
   \`\`\`json
   {
     "hosts": ["tcp://localhost:2375"],
     "tls": true,  // ❌ Wrong - forces HTTPS
     "tlsverify": true  // ❌ Wrong - forces HTTPS
   }
   \`\`\`

### Solution 3: Clean Configuration

Start with a minimal configuration:

1. **Open Docker Desktop → Settings → Docker Engine**

2. **Replace with minimal config:**
   \`\`\`json
   {
     "hosts": [
       "npipe://",
       "tcp://localhost:2375"
     ]
   }
   \`\`\`

3. **Remove ALL other settings temporarily** (you can add them back later)

4. **Apply & Restart**

5. **Test:**
   \`\`\`powershell
   docker -H tcp://localhost:2375 ps
   \`\`\`

6. **If it works**, add your other settings back one by one

### Solution 4: Use Different Port

If port 2375 is problematic, use a different port:

1. **Change to port 2377** (or any available port):
   \`\`\`json
   {
     "hosts": [
       "npipe://",
       "tcp://localhost:2377"
     ]
   }
   \`\`\`

2. **Test the new port:**
   \`\`\`powershell
   docker -H tcp://localhost:2377 ps
   \`\`\`

3. **Note**: Supabase Analytics may need to be configured to use this port, or you may need to disable Analytics

### Solution 5: Check Docker Desktop Version

Some older versions handle TCP sockets differently:

1. **Check version:**
   \`\`\`powershell
   docker --version
   docker-compose --version
   \`\`\`

2. **Update Docker Desktop** if it's older than 4.0

3. **After updating**, try Solution 1 (GUI checkbox) first

### Solution 6: Disable Analytics (If Not Needed)

If you don't need Supabase Analytics, disable it:

1. **Edit `supabase/config.toml`:**
   \`\`\`toml
   [analytics]
   enabled = false
   port = 55327
   backend = "postgres"
   \`\`\`

2. **Restart Supabase:**
   \`\`\`powershell
   supabase stop
   supabase start
   \`\`\`

3. **Remove the TCP socket from Docker config** (no longer needed)

## 🔍 Diagnostic Steps

### Step 1: Check Current Configuration

\`\`\`powershell
# Check if Docker is running
docker ps

# Check what's listening on port 2375
netstat -ano | findstr :2375

# Try connecting with verbose output
docker -H tcp://localhost:2375 --debug ps
\`\`\`

### Step 2: Check Docker Desktop Settings

1. Open Docker Desktop → Settings → Docker Engine
2. Copy your current JSON configuration
3. Look for any TLS-related settings
4. Verify the `hosts` array format

### Step 3: Check Docker Logs

1. Open Docker Desktop
2. Click on the **Troubleshoot** icon (bug icon)
3. Check **Logs** for any errors related to TCP or TLS

## 📋 Complete Working Configuration

Here's a complete, tested configuration that should work:

\`\`\`json
{
  "hosts": [
    "npipe://",
    "tcp://localhost:2375"
  ],
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5,
  "experimental": false
}
\`\`\`

**Important**: Make sure there are NO TLS-related options in your config!

## ⚠️ Common Issues

### Issue: "Cannot connect to Docker daemon"

**Cause**: Docker Desktop isn't running or the TCP socket isn't enabled

**Fix**: 
1. Ensure Docker Desktop is running
2. Check the GUI checkbox (Solution 1)
3. Verify JSON configuration

### Issue: "Port already in use"

**Cause**: Another service is using port 2375

**Fix**:
\`\`\`powershell
# Find what's using the port
netstat -ano | findstr :2375

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
\`\`\`

### Issue: "Docker Desktop won't start after config change"

**Cause**: Invalid JSON or conflicting settings

**Fix**:
1. Reset Docker Desktop to defaults
2. Start with minimal config (just hosts array)
3. Add settings one by one

## 🎯 Quick Checklist

- [ ] Docker Desktop is running
- [ ] Checked GUI checkbox for "Expose daemon without TLS" (if available)
- [ ] JSON config uses `tcp://localhost:2375` (not 2376)
- [ ] No TLS settings in JSON config
- [ ] `npipe://` is still in hosts array
- [ ] Applied changes and restarted Docker Desktop
- [ ] Tested with `docker -H tcp://localhost:2375 ps`

## 📚 References

- [Docker Desktop Settings](https://docs.docker.com/desktop/settings/)
- [Docker Daemon Configuration](https://docs.docker.com/engine/daemon/)
- [Supabase CLI Windows Setup](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=windows)
