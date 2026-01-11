# Chrome DevTools MCP Wrapper Script
# This script ensures chrome-devtools-mcp runs with a compatible Node version
# chrome-devtools-mcp requires: ^20.19.0 || ^22.12.0 || >=23

# Get the script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Try to detect nvm root (common locations)
$nvmRoots = @(
    "$env:USERPROFILE\scoop\persist\nvm\nodejs",
    "$env:APPDATA\nvm\nodejs",
    "$env:PROGRAMFILES\nvm\nodejs",
    "$env:LOCALAPPDATA\nvm\nodejs"
)

# Find nvm root
$nvmRoot = $null
foreach ($root in $nvmRoots) {
    if (Test-Path $root) {
        $nvmRoot = $root
        break
    }
}

# Try to use Node 24.12.0 first (satisfies >=23 requirement), then 20.19.0
$node24Path = if ($nvmRoot) { Join-Path $nvmRoot "v24.12.0\node.exe" } else { $null }
$node20Path = if ($nvmRoot) { Join-Path $nvmRoot "v20.19.0\node.exe" } else { $null }

# Determine which Node version to use
$nodePath = $null
if (Test-Path $node24Path) {
    $nodePath = $node24Path
    Write-Host "Using Node 24.12.0" -ForegroundColor Green
} elseif (Test-Path $node20Path) {
    $nodePath = $node20Path
    Write-Host "Using Node 20.19.0" -ForegroundColor Green
} else {
    # Fallback to system Node (may not work if version is incompatible)
    $nodePath = "node"
    Write-Host "Warning: Using system Node (may be incompatible)" -ForegroundColor Yellow
}

# Change to project root directory
Set-Location $projectRoot

# Get the path to chrome-devtools-mcp executable
$chromeDevToolsMcpPath = Join-Path $projectRoot "node_modules\chrome-devtools-mcp\build\src\index.js"

if (-not (Test-Path $chromeDevToolsMcpPath)) {
    Write-Host "Error: chrome-devtools-mcp not found at $chromeDevToolsMcpPath" -ForegroundColor Red
    exit 1
}

# Run chrome-devtools-mcp with the compatible Node version
& $nodePath $chromeDevToolsMcpPath $args
