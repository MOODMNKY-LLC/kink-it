console.log('🚀 Starting HTTPS dev server...')

const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')
const os = require('os')

// Ensure process.platform is available for Next.js/Turbopack
// Fixes "Cannot read properties of undefined (reading 'os')" error
// This is a safeguard for Turbopack's lockfile patching mechanism
if (!process.platform) {
  process.platform = os.platform()
}

// Allow self-signed certificates for local development (Supabase TLS)
// This is safe for local development only - NEVER use in production
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.log('⚠️  Self-signed certificates enabled for local development')
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = '127.0.0.1'
const port = 3000

// Certificate paths - using mkcert generated certificates
const certPath = path.join(__dirname, 'certs', 'localhost+1.pem')
const keyPath = path.join(__dirname, 'certs', 'localhost+1-key.pem')

// Check if certificates exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('\n❌ Certificate files not found!')
  console.error('\n📋 To generate certificates, run:')
  console.error('   1. Install mkcert: choco install mkcert (Windows) or brew install mkcert (Mac)')
  console.error('   2. Create local CA: mkcert -install')
  console.error('   3. Generate certs: mkcert localhost 127.0.0.1')
  console.error('   4. Move certs to ./certs/ directory')
  console.error('\n   Or use HTTP dev server: pnpm run dev:http\n')
  process.exit(1)
}

console.log('🔐 Certificates found, initializing Next.js...')
console.log(`📦 Mode: ${dev ? 'development' : 'production'}`)
console.log(`🌐 Hostname: ${hostname}, Port: ${port}`)

// Enable Turbopack if TURBOPACK env var is set
// Note: Turbopack support in custom servers may vary by Next.js version
const turboEnabled = process.env.TURBOPACK === '1' || process.env.TURBOPACK === 'true'
if (turboEnabled) {
  console.log('⚡ Turbopack enabled (faster builds)')
}
const nextOptions = { 
  dev, 
  hostname, 
  port
}

// Add Turbopack option if enabled (Next.js 15+)
if (turboEnabled && dev) {
  nextOptions.turbo = true
}

const app = next(nextOptions)
const handle = app.getRequestHandler()

console.log('⏳ Preparing Next.js app (this may take a moment)...')

// Add timeout to detect if prepare() hangs
const prepareTimeout = setTimeout(() => {
  console.error('\n⚠️  Next.js prepare() is taking longer than expected...')
  console.error('   This might indicate:')
  console.error('   - TypeScript compilation errors')
  console.error('   - Missing dependencies')
  console.error('   - Large codebase compilation')
  console.error('\n   Try: pnpm run dev:http (HTTP mode) to see detailed errors\n')
}, 30000) // 30 second timeout

app.prepare()
  .then(() => {
    clearTimeout(prepareTimeout)
    console.log('📦 Next.js prepared successfully')
    
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }

    const server = createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('❌ Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    server.listen(port, (err) => {
      if (err) {
        console.error('❌ Failed to start server:', err)
        process.exit(1)
      }
      console.log(`\n✅ Ready on https://${hostname}:${port}\n`)
    })

    // Handle server errors
    server.on('error', (err) => {
      console.error('❌ Server error:', err)
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Port ${port} is already in use.`)
        console.error('   Try: pnpm run dev:http (HTTP mode)')
        console.error('   Or: Kill the process using port 3000\n')
      }
      process.exit(1)
    })
  })
  .catch((err) => {
    clearTimeout(prepareTimeout)
    console.error('❌ Failed to prepare Next.js app:', err)
    console.error('\n💡 This might be due to:')
    console.error('   - Compilation errors in your code')
    console.error('   - Missing dependencies (run: pnpm install)')
    console.error('   - TypeScript errors')
    console.error('\n   Try running: pnpm run dev:http (HTTP mode)\n')
    if (err.stack) {
      console.error('Full error:', err.stack)
    }
    process.exit(1)
  })

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message)
  if (err.code === 'EPERM') {
    console.error('\n⚠️  Permission error detected!')
    console.error('   This usually means:')
    console.error('   - Another dev server is running')
    console.error('   - .next directory is locked by another process')
    console.error('   - Antivirus is blocking file access')
    console.error('\n💡 Solutions:')
    console.error('   1. Stop all Node processes: Get-Process node | Stop-Process -Force')
    console.error('   2. Delete .next folder: Remove-Item -Recurse -Force .next')
    console.error('   3. Try HTTP mode: pnpm run dev:http')
    console.error('   4. Restart your terminal/IDE\n')
  } else {
    console.error('Full error:', err.stack || err)
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

