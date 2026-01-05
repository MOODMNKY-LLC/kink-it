# Discord MCP Server Setup

## Configuration Added

The Discord MCP server has been added to `.cursor/mcp.json` with the following configuration:

```json
"mcp-discord": {
  "command": "docker",
  "args": [
    "run",
    "-i",
    "--rm",
    "-e",
    "DISCORD_TOKEN",
    "mcp/mcp-discord"
  ],
  "env": {
    "DISCORD_TOKEN": ""
  }
}
```

## Bot Token Setup

**First**: Complete the Discord bot setup following `docs/DISCORD_BOT_SETUP_GUIDE.md` to obtain your bot token.

**Then**: Configure the token for Discord MCP:

### Option 1: Export DISCORD_TOKEN (Recommended)

Add this to your shell profile (`.bashrc`, `.zshrc`, or PowerShell profile):

```bash
# Windows PowerShell
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN

# Linux/Mac
export DISCORD_TOKEN=$DISCORD_BOT_TOKEN
```

### Option 2: Set DISCORD_TOKEN in .env.local

Add this line to your `.env.local` file:

```
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
```

Then export it in your shell:

```bash
# Windows PowerShell
$env:DISCORD_TOKEN = (Get-Content .env.local | Select-String "DISCORD_BOT_TOKEN").ToString().Split("=")[1]

# Linux/Mac
export $(grep DISCORD_BOT_TOKEN .env.local | xargs)
```

## Environment Variable Setup

The Docker container expects `DISCORD_TOKEN` to be available in your host environment. Since your project uses `DISCORD_BOT_TOKEN`, you have two options:

### Option 1: Export DISCORD_TOKEN (Recommended)

Add this to your shell profile (`.bashrc`, `.zshrc`, or PowerShell profile):

```bash
# Windows PowerShell
$env:DISCORD_TOKEN = $env:DISCORD_BOT_TOKEN

# Linux/Mac
export DISCORD_TOKEN=$DISCORD_BOT_TOKEN
```

### Option 2: Set DISCORD_TOKEN in .env.local

Add this line to your `.env.local` file:

```
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
```

Then export it in your shell:

```bash
# Windows PowerShell
$env:DISCORD_TOKEN = (Get-Content .env.local | Select-String "DISCORD_TOKEN").ToString().Split("=")[1]

# Linux/Mac
export $(grep DISCORD_TOKEN .env.local | xargs)
```

### Option 3: Update Docker Args (Alternative)

If you prefer to use `DISCORD_BOT_TOKEN` directly, you can modify the Docker args in `.cursor/mcp.json`:

```json
"args": [
  "run",
  "-i",
  "--rm",
  "-e",
  "DISCORD_BOT_TOKEN",
  "mcp/mcp-discord"
]
```

**Note**: This only works if the `mcp/mcp-discord` container accepts `DISCORD_BOT_TOKEN` as the environment variable name. Most Discord MCP containers expect `DISCORD_TOKEN`.

## Verification

To verify the Discord MCP server is working:

1. Ensure Docker is running
2. Ensure `DISCORD_TOKEN` is set in your environment
3. Restart Cursor IDE
4. Check MCP server status in Cursor's settings

## Troubleshooting

- **Container not starting**: Check that Docker is running and `DISCORD_TOKEN` is set
- **Authentication errors**: Verify your Discord bot token is valid
- **Connection issues**: Ensure the `mcp/mcp-discord` Docker image is available (may need to pull it first)

