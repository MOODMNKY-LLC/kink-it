# Docker Windows Configuration for Supabase Analytics

## ⚠️ Warning

This configuration exposes the Docker daemon on `tcp://localhost:2375` **without TLS encryption**. This is **only safe for local development** on your personal machine. **Never use this configuration on a shared network or production environment.**

## Problem

Supabase Analytics requires access to the Docker daemon socket on Windows. You're seeing this warning:

\`\`\`
WARNING: Analytics on Windows requires Docker daemon exposed on tcp://localhost:2375.
\`\`\`

## Solution: Configure Docker Desktop for Windows

### Step 1: Open Docker Desktop Settings

1. Right-click the Docker Desktop icon in your system tray
2. Click **Settings** (or **Preferences**)

### Step 2: Enable Docker Engine API

1. In the left sidebar, click **Docker Engine**
2. You'll see a JSON configuration editor

### Step 3: Add TCP Socket Configuration

**Option A: Complete Configuration (Recommended)**

Copy the complete configuration from [`DOCKER_ENGINE_CONFIG.json`](./DOCKER_ENGINE_CONFIG.json) which includes:
- Your existing `builder.gc` settings
- Required `hosts` array with TCP socket
- Recommended logging and performance options

**Option B: Minimal Configuration**

If you only want to add the TCP socket, find the `hosts` array in your JSON configuration and change it from:

\`\`\`json
{
  "hosts": [
    "npipe://"
  ]
}
\`\`\`

To:

\`\`\`json
{
  "hosts": [
    "npipe://",
    "tcp://localhost:2375"
  ]
}
\`\`\`

**Important Notes:**
- Keep `"npipe://"` in the array (needed for Docker Desktop UI)
- Add `"tcp://localhost:2375"` as a second entry
- Use `localhost` (not `0.0.0.0`) to restrict access to localhost only
- Port `2375` is the standard Docker daemon port (non-TLS)

**See [`DOCKER_ENGINE_CONFIG_EXPLAINED.md`](./DOCKER_ENGINE_CONFIG_EXPLAINED.md) for detailed explanations of all configuration options.**

### Step 4: Apply and Restart

1. Click **Apply & Restart** button at the bottom
2. Wait for Docker Desktop to restart (this may take 30-60 seconds)

### Step 5: Verify Configuration

After Docker restarts, verify the daemon is accessible:

\`\`\`powershell
# Test Docker daemon connection
docker -H tcp://localhost:2375 ps
\`\`\`

If this command works without errors, the configuration is successful.

### Step 6: Restart Supabase

Now restart your Supabase local development stack:

\`\`\`powershell
# Stop Supabase
supabase stop

# Start Supabase (warning should be gone)
supabase start
\`\`\`

## Alternative: Disable Analytics (If Not Needed)

If you don't need Analytics functionality, you can disable it in `supabase/config.toml`:

\`\`\`toml
[analytics]
enabled = false
port = 55327
backend = "postgres"
\`\`\`

Then restart Supabase:

\`\`\`powershell
supabase stop
supabase start
\`\`\`

## Security Considerations

### ✅ Safe for Local Development
- Only exposes Docker daemon to `localhost` (127.0.0.1)
- No TLS encryption needed for localhost-only access
- Standard configuration for local development tools

### ❌ Never Use This For:
- Production environments
- Shared networks
- Remote access
- Public networks

### 🔒 For Production/Remote Access
If you ever need remote Docker access, use:
- TLS-encrypted connection (`tcp://0.0.0.0:2376` with certificates)
- VPN or SSH tunneling
- Docker Context with proper authentication

## Troubleshooting

### Port Already in Use

If port 2375 is already in use:

\`\`\`powershell
# Check what's using port 2375
netstat -ano | findstr :2375

# Or use a different port (e.g., 2376)
# Update config to: "tcp://localhost:2376"
\`\`\`

### Docker Desktop Won't Start

If Docker Desktop fails to start after this change:

1. Open Docker Desktop settings manually
2. Remove the `"tcp://localhost:2375"` entry
3. Restart Docker Desktop
4. Try again with the correct JSON syntax

### Still Seeing Warning

If you still see the warning after configuration:

1. Verify Docker is running: `docker ps`
2. Test daemon access: `docker -H tcp://localhost:2375 ps`
3. Check Supabase config: Ensure `[analytics]` section has `enabled = true`
4. Restart Supabase: `supabase stop && supabase start`

### "400 Bad Request - The plain HTTP request was sent to HTTPS port"

This error means Docker Desktop is expecting TLS/HTTPS on port 2375, but you're trying to connect without TLS.

**Solution 1: Use Docker Desktop GUI Checkbox (Easiest)**

Some versions of Docker Desktop have a GUI option that's easier than editing JSON:

1. Open Docker Desktop → Settings
2. Go to **General** tab (not Docker Engine)
3. Look for checkbox: **"Expose daemon on tcp://localhost:2375 without TLS"**
4. ✅ Check this box
5. Click **Apply & Restart**
6. Remove the `hosts` array from Docker Engine JSON (let the checkbox handle it)

**Solution 2: Verify JSON Configuration**

If using JSON configuration, ensure:
- The `hosts` array uses `tcp://localhost:2375` (NOT `tcp://0.0.0.0:2375`)
- Port is `2375` (non-TLS), not `2376` (TLS)
- No TLS-related options are set

**Solution 3: Check for Conflicting Settings**

1. Open Docker Desktop → Settings → Docker Engine
2. Look for any TLS-related settings like:
   \`\`\`json
   "tls": true,
   "tlsverify": true
   \`\`\`
3. Remove these if present (they force HTTPS)
4. Ensure your config only has:
   \`\`\`json
   {
     "hosts": ["npipe://", "tcp://localhost:2375"]
   }
   \`\`\`

**Solution 4: Use Different Port**

If port 2375 is causing issues, try a different port:

1. Change config to use port `2377` (or another available port):
   \`\`\`json
   {
     "hosts": [
       "npipe://",
       "tcp://localhost:2377"
     ]
   }
   \`\`\`
2. Update Supabase to use the new port (if configurable)
3. Or disable Analytics if not needed (see Alternative section below)

**Solution 5: Check Docker Desktop Version**

Older versions of Docker Desktop may handle TCP sockets differently:

1. Check your Docker Desktop version: `docker --version`
2. Update to the latest version if possible
3. Some older versions require the GUI checkbox instead of JSON config

## References

- [Supabase CLI Windows Setup](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=windows#running-supabase-locally)
- [Docker Desktop Settings Documentation](https://docs.docker.com/desktop/settings/docker-engine/)
- [Docker Daemon Socket Configuration](https://docs.docker.com/config/daemon/remote-access/)
