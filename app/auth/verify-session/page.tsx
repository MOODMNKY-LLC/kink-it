"use client"

/**
 * Verify Session Page
 * 
 * After Supabase magic link verification, this page verifies the session
 * is established and redirects to the appropriate page (onboarding or home).
 */

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function VerifySessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifySession = async () => {
      try {
        console.log("[Verify Session] Checking session...")
        
        const supabase = createClient()

        // Wait a moment for cookies to be set by Supabase
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if user is authenticated
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log("[Verify Session] User check:", {
          hasUser: !!user,
          userId: user?.id,
          email: user?.email,
          error: userError?.message,
        })

        if (userError || !user) {
          throw new Error(userError?.message || "User not authenticated")
        }

        // Check if user needs onboarding
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single()

        console.log("[Verify Session] Profile check:", {
          hasProfile: !!profile,
          onboardingCompleted: profile?.onboarding_completed,
          error: profileError?.message,
        })

        setStatus("success")

        // Redirect based on onboarding status
        if (!profile?.onboarding_completed) {
          console.log("[Verify Session] Redirecting to onboarding")
          router.push("/onboarding")
        } else {
          console.log("[Verify Session] Redirecting to home")
          router.push("/")
        }
        
        router.refresh()
      } catch (err) {
        console.error("[Verify Session] Error:", err)
        setError(err instanceof Error ? err.message : "Failed to verify session")
        setStatus("error")
        
        setTimeout(() => {
          router.push("/auth/login?error=" + encodeURIComponent(err instanceof Error ? err.message : "Session verification failed"))
        }, 2000)
      }
    }

    verifySession()
  }, [router])

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Session verified! Redirecting...</p>
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
