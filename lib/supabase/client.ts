import { createBrowserClient } from "@supabase/ssr"

// Store original fetch to prevent infinite loops
let originalFetch: typeof window.fetch | null = null
let fetchInterceptorInstalled = false

// Track if we've already shown certificate instructions (avoid spam)
let certificateWarningShown = false

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Supabase Client] Missing environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })
    throw new Error("Supabase environment variables not configured")
  }

  // Note: Certificate error detection is handled by CertificateCheck component
  // This client no longer shows hardcoded warnings - only shows if there's an actual error
  // The CertificateCheck component will detect and display certificate issues if they occur

  // createBrowserClient from @supabase/ssr with cookie-based storage for PKCE
  // According to Supabase docs: PKCE code verifier must be stored in cookies
  // accessible to both client and server (not localStorage)
  const client = createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        // Check if we're in the browser (document exists)
        if (typeof document === 'undefined') {
          // Server-side: return empty array
          return []
        }
        // Get all cookies from document.cookie
        const cookies = document.cookie.split(';').map(cookie => {
          const [name, ...rest] = cookie.trim().split('=')
          return {
            name: name.trim(),
            value: decodeURIComponent(rest.join('=')),
          }
        }).filter(c => c.name) // Filter out empty entries
        
        // Log PKCE cookies for debugging
        if (process.env.NODE_ENV === "development") {
          const pkceCookies = cookies.filter(c => c.name.includes("code-verifier") || c.name.includes("pkce"))
          if (pkceCookies.length > 0) {
            console.log("[Supabase Client] Reading PKCE cookies:", pkceCookies.map(c => c.name))
          }
        }
        
        return cookies
      },
      setAll(cookiesToSet) {
        // Check if we're in the browser (document exists)
        if (typeof document === 'undefined') {
          // Server-side: cookies are handled by the server client
          return
        }
        // Set cookies with proper options for PKCE storage
        cookiesToSet.forEach(({ name, value, options }) => {
          // Log PKCE code verifier cookies for debugging
          if (process.env.NODE_ENV === "development" && (name.includes("code-verifier") || name.includes("pkce"))) {
            console.log("[Supabase Client] Setting PKCE cookie:", {
              name,
              hasValue: !!value,
              valueLength: value?.length || 0,
              options: options ? JSON.stringify(options) : 'none',
            })
          }
          
          // Build cookie string with options
          // CRITICAL: Don't set domain for localhost/127.0.0.1 (allows both to work)
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          if (options) {
            // Don't set domain for local development (allows 127.0.0.1 and localhost)
            // Only set domain if explicitly provided and not localhost/127.0.0.1
            if (options.domain && !options.domain.includes('localhost') && !options.domain.includes('127.0.0.1')) {
              cookieString += `; Domain=${options.domain}`
            }
            
            if (options.path) {
              cookieString += `; Path=${options.path}`
            } else {
              // Default path to root for PKCE cookies (CRITICAL for OAuth redirect)
              cookieString += `; Path=/`
            }
            
            if (options.sameSite) {
              cookieString += `; SameSite=${options.sameSite}`
            } else {
              // Default to Lax for PKCE cookies (allows OAuth redirect)
              cookieString += `; SameSite=Lax`
            }
            
            // CRITICAL: For HTTPS (127.0.0.1:3000), Secure flag is required
            // But browsers may reject Secure cookies on localhost/127.0.0.1
            // So we only set Secure if explicitly requested OR if we're on HTTPS
            const isSecure = options.secure !== undefined 
              ? options.secure 
              : (typeof window !== 'undefined' && window.location.protocol === 'https:')
            
            if (isSecure) {
              cookieString += `; Secure`
            }
            
            if (options.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`
            } else if (options.expires) {
              cookieString += `; Expires=${options.expires.toUTCString()}`
            }
            
            // Note: httpOnly cookies can't be set from client-side JavaScript
            // They are handled by the server
          } else {
            // Default options if none provided - CRITICAL for PKCE cookies
            // For HTTPS, we need Secure flag, but browsers may reject it on localhost
            const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
            cookieString += `; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
          }
          
          // Set cookie
          document.cookie = cookieString
          
          // Verify cookie was set (for debugging)
          if (process.env.NODE_ENV === "development" && (name.includes("code-verifier") || name.includes("pkce"))) {
            const cookieWasSet = document.cookie.includes(name)
            console.log("[Supabase Client] PKCE cookie verification:", cookieWasSet ? "✅" : "❌", name)
            if (!cookieWasSet) {
              console.warn("[Supabase Client] ⚠️ PKCE cookie not found after setting:", name)
              console.warn("[Supabase Client] Current cookies:", document.cookie)
            }
          }
        })
      },
    },
    auth: {
      // Explicitly set flowType to pkce
      // createBrowserClient from @supabase/ssr automatically handles PKCE code verifier
      // storage in cookies when cookies configuration is provided
      flowType: 'pkce',
      detectSessionInUrl: true,
    },
  })

  return client
}

/**
 * Test Supabase connectivity from client-side
 * Call this function in browser console to diagnose connection issues
 */
export async function testSupabaseConnection(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase environment variables not configured")
    return
  }

  console.log("🧪 Testing Supabase connection...")
  console.log("URL:", supabaseUrl)

  try {
    // Test 1: Basic REST endpoint
    console.log("\n1️⃣ Testing REST endpoint...")
    const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
    console.log("   Status:", restResponse.status, restResponse.statusText)
    if (restResponse.status === 0) {
      console.error("   ❌ Network error - certificate likely not accepted")
    } else {
      console.log("   ✅ REST endpoint accessible")
    }

    // Test 2: Auth endpoint
    console.log("\n2️⃣ Testing Auth endpoint...")
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: supabaseKey,
      },
    })
    console.log("   Status:", authResponse.status, authResponse.statusText)
    if (authResponse.status === 0) {
      console.error("   ❌ Network error - certificate likely not accepted")
    } else {
      console.log("   ✅ Auth endpoint accessible")
    }

    console.log("\n✅ Connection test complete!")
    console.log("\n💡 If tests failed:")
    console.log("   1. Open:", supabaseUrl)
    console.log("   2. Accept certificate")
    console.log("   3. Refresh this page")
  } catch (error: any) {
    console.error("\n❌ Connection test failed:", error.message)
    if (error.message === "Failed to fetch") {
      console.error("\n🔒 Certificate Issue Detected!")
      console.error("   Fix:")
      console.error("   1. Open:", supabaseUrl)
      console.error("   2. Accept certificate (Advanced → Proceed)")
      console.error("   3. Refresh this page")
    }
  }
}

// Make test function available globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  ;(window as any).testSupabaseConnection = testSupabaseConnection
  console.log(
    "💡 Tip: Run testSupabaseConnection() in console to test connectivity"
  )
}
