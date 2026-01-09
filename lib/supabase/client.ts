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

  // Show certificate instructions only once per session
  if (process.env.NODE_ENV === "development" && !certificateWarningShown) {
    certificateWarningShown = true
    
    // Warn if using localhost instead of 127.0.0.1 (certificate mismatch)
    if (supabaseUrl.includes("localhost")) {
      console.warn(
        "⚠️ [Supabase] Using 'localhost' in URL may cause certificate issues. Use '127.0.0.1' instead."
      )
    }
    
    // Show certificate acceptance instructions for local dev
    if (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
      console.info(
        "🔒 [Supabase] If you see connection errors, accept the certificate at:",
        supabaseUrl
      )
    }
  }

  const client = createBrowserClient(supabaseUrl, supabaseKey)

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
