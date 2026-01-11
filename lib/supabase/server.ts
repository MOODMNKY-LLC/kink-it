import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Log cookies in development for debugging (only on auth pages or when cookies exist)
  // Don't log warnings on public pages like login - it's expected to have no auth cookies
  if (process.env.NODE_ENV === "development") {
    const authCookies = allCookies.filter(c => 
      c.name.includes("supabase") || 
      c.name.includes("auth") ||
      c.name.includes("sb-")
    )
    if (authCookies.length > 0) {
      console.log("[Supabase Server] Found auth cookies:", authCookies.map(c => c.name))
    }
    // Removed warning - it's expected to have no auth cookies on login/public pages
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
