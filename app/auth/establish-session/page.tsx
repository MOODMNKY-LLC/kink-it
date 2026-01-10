"use client"

/**
 * Client-side session establishment page
 * 
 * This page receives a session token from the OAuth callback
 * and establishes a Supabase session on the client side.
 * This is necessary because setSession() only works client-side.
 */

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function EstablishSessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"establishing" | "success" | "error">("establishing")

  useEffect(() => {
    const establishSession = async () => {
      try {
        const token = searchParams.get("token")
        const email = searchParams.get("email")
        const type = searchParams.get("type")

        if (!token || !email) {
          throw new Error("Missing token or email")
        }

        console.log("[Establish Session] Setting session with token, type:", type)

        const supabase = createClient()

        // For magic link tokens, we need to verify them using verifyOtp
        if (type === "magiclink") {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "magiclink",
          })

          if (verifyError) {
            console.error("[Establish Session] Verification error:", verifyError)
            throw new Error(verifyError.message || "Failed to verify magic link token")
          }

          if (!data.session) {
            throw new Error("Session not created after verification")
          }

          console.log("[Establish Session] Session established via verifyOtp")
        } else {
          // For other token types, try setSession directly
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          })

          if (sessionError) {
            throw new Error(sessionError.message || "Failed to establish session")
          }

          console.log("[Establish Session] Session established via setSession")
        }

        // Verify the session was established
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error("Session established but user verification failed")
        }

        console.log("[Establish Session] Session verified, user:", user.email)
        setStatus("success")

        // Wait a moment for cookies to be set, then redirect
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 500)
      } catch (err) {
        console.error("[Establish Session] Error:", err)
        setError(err instanceof Error ? err.message : "Failed to establish session")
        setStatus("error")
        
        // Redirect to login after error
        setTimeout(() => {
          router.push("/auth/login?error=" + encodeURIComponent(err instanceof Error ? err.message : "Session establishment failed"))
        }, 2000)
      }
    }

    establishSession()
  }, [searchParams, router])

  if (status === "establishing") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Establishing session...</p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Session established! Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-destructive">Error: {error}</p>
        <p className="mt-2 text-xs text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  )
}
