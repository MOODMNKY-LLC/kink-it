# Docker Engine Configuration Guide

## 📋 Copy-Paste Ready Configuration

Here's your complete Docker Engine JSON configuration ready to paste into Docker Desktop Settings → Docker Engine:

```json
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
```

## 🔧 Configuration Options Explained

### Required for Supabase Analytics

#### `hosts` (Array)
**Purpose**: Defines how Docker daemon accepts connections

- `"npipe://"` - Windows named pipe (required for Docker Desktop UI)
- `"tcp://localhost:2375"` - TCP socket on localhost (required for Supabase Analytics)

**Why both?** Docker Desktop needs `npipe://` for its UI, and Supabase needs `tcp://localhost:2375` for Analytics.

### Your Existing Settings

#### `builder.gc` (Object)
**Purpose**: Controls BuildKit garbage collection

- `defaultKeepStorage`: "20GB" - Maximum storage for build cache
- `enabled`: true - Enables automatic cleanup of old build cache

**Benefit**: Prevents Docker from consuming excessive disk space from build artifacts.

### Recommended Additions

#### `log-driver` (String)
**Purpose**: Sets the default logging driver for all containers

- `"json-file"` - Standard JSON file logging (default, but explicit is better)

**Benefit**: Ensures consistent, readable logs stored in files.

#### `log-opts` (Object)
**Purpose**: Configures log rotation to prevent disk space issues

- `max-size`: "10m" - Maximum size per log file before rotation
- `max-file`: "3" - Number of rotated log files to keep

**Benefit**: Prevents container logs from filling up your disk.

#### `max-concurrent-downloads` (Number)
**Purpose**: Limits parallel image layer downloads

- `3` - Downloads 3 layers simultaneously (default is 3, but explicit is clearer)

**Benefit**: Prevents overwhelming your network during large image pulls.

#### `max-concurrent-uploads` (Number)
**Purpose**: Limits parallel image layer uploads

- `5` - Uploads 5 layers simultaneously

**Benefit**: Better control over upload bandwidth.

#### `experimental` (Boolean)
**Purpose**: Enables/disables experimental Docker features

- `false` - Disabled (recommended for stability)

**Benefit**: Keeps Docker stable by avoiding experimental features that may break.

## 📚 Additional Available Options

### Network Configuration

```json
{
  "dns": ["8.8.8.8", "8.8.4.4"],
  "dns-opts": ["timeout:2"],
  "dns-search": ["example.com"]
}
```

**Purpose**: Custom DNS servers and search domains
**When to use**: If you have DNS resolution issues or need custom DNS

### Storage & Performance

```json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.size=20G"
  ]
}
```

**Purpose**: Configure storage driver and options
**When to use**: Usually not needed on Windows (Docker Desktop handles this)

### Registry Configuration

```json
{
  "insecure-registries": ["registry.example.com:5000"],
  "registry-mirrors": ["https://mirror.example.com"]
}
```

**Purpose**: Configure private registries or mirrors
**When to use**: If using private Docker registries or mirrors

### Security

```json
{
  "tls": true,
  "tlsverify": true,
  "tlscacert": "/path/to/ca.pem",
  "tlscert": "/path/to/cert.pem",
  "tlskey": "/path/to/key.pem"
}
```

**Purpose**: Enable TLS for Docker daemon
**When to use**: For remote access or production (not needed for localhost)

### Resource Limits

```json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
```

**Purpose**: Set default resource limits for containers
**When to use**: If you need to adjust file descriptor limits

### IPv6 Configuration

```json
{
  "ipv6": true,
  "fixed-cidr-v6": "2001:db8:1::/64"
}
```

**Purpose**: Enable IPv6 support
**When to use**: If your application requires IPv6

### Debugging

```json
{
  "debug": true,
  "log-level": "debug"
}
```

**Purpose**: Enable verbose logging
**When to use**: When troubleshooting Docker issues (disable after debugging)

## 🚀 Quick Setup Steps

1. **Open Docker Desktop**
   - Right-click Docker icon → Settings

2. **Navigate to Docker Engine**
   - Click "Docker Engine" in left sidebar

3. **Replace Configuration**
   - Select all existing JSON (Ctrl+A)
   - Delete it
   - Paste the configuration above

4. **Apply & Restart**
   - Click "Apply & Restart"
   - Wait for Docker to restart (~30-60 seconds)

5. **Verify**
   ```powershell
   docker -H tcp://localhost:2375 ps
   ```

6. **Restart Supabase**
   ```powershell
   supabase stop
   supabase start
   ```

## ⚠️ Important Notes

### Security
- `tcp://localhost:2375` is **unencrypted** but safe for localhost-only access
- Never use `tcp://0.0.0.0:2375` (exposes to network)
- For remote access, use TLS (`tcp://0.0.0.0:2376` with certificates)

### Windows-Specific
- Always keep `"npipe://"` in hosts array (required for Docker Desktop)
- Docker Desktop manages most storage/network settings automatically
- Some options may not apply on Windows (like storage-driver)

### Validation
- Docker Desktop validates JSON before applying
- Invalid JSON will show an error message
- Always test with `docker ps` after changes

## 🔍 Troubleshooting

### JSON Validation Error
- Check for trailing commas
- Ensure all strings are quoted
- Verify array/object brackets match

### Docker Won't Start
- Remove the `hosts` array temporarily
- Start Docker Desktop
- Re-add configuration carefully

### Port 2375 Already in Use
```powershell
netstat -ano | findstr :2375
```
- Kill the process using the port
- Or change to a different port (e.g., `tcp://localhost:2376`)

## 📖 References

- [Docker Daemon Configuration](https://docs.docker.com/engine/daemon/)
- [Docker Desktop Settings](https://docs.docker.com/desktop/settings/)
- [Docker Logging Drivers](https://docs.docker.com/config/containers/logging/configure/)
- [BuildKit Garbage Collection](https://docs.docker.com/build/building/cache/garbage-collection/)




