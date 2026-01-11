"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NotionIcon } from "@/components/icons/notion"
import { GamerProfileCard } from "@/components/auth/gamer-profile-card"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const router = useRouter()

  const handleNotionLogin = async () => {
    setIsOAuthLoading(true)
    setError(null)

    try {
      // Use Supabase's built-in OAuth handler for proper session establishment
      // This fixes the redirect loop issue
      // Note: We'll try to capture refresh tokens in the callback
      const supabase = createClient()
      
      // Normalize redirect URL to use 127.0.0.1 instead of localhost in development
      // This ensures consistency with Next.js server and Supabase config
      const origin = window.location.origin
      const normalizedOrigin = origin.replace(/localhost/i, "127.0.0.1")
      const redirectTo = `${normalizedOrigin}/auth/callback`
      
      console.log("[Notion OAuth] Initiating OAuth flow:", {
        origin,
        normalizedOrigin,
        redirectTo,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })
      
      // Log cookies before OAuth initiation to verify PKCE setup
      if (process.env.NODE_ENV === "development") {
        const allCookies = document.cookie.split(';').map(c => c.trim())
        const pkceCookies = allCookies.filter(c => c.includes("code-verifier") || c.includes("pkce"))
        console.log("[Notion OAuth] Cookies before OAuth:", {
          allCookies: allCookies.length,
          pkceCookies: pkceCookies.length,
          pkceCookieNames: pkceCookies.map(c => c.split('=')[0]),
        })
      }
      
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "notion",
        options: {
          redirectTo,
          // Request offline access to get refresh token
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      
      // Log cookies after OAuth initiation to verify PKCE cookie was set
      if (process.env.NODE_ENV === "development") {
        setTimeout(() => {
          const allCookies = document.cookie.split(';').map(c => c.trim())
          const pkceCookies = allCookies.filter(c => c.includes("code-verifier") || c.includes("pkce"))
          console.log("[Notion OAuth] Cookies after OAuth initiation:", {
            allCookies: allCookies.length,
            pkceCookies: pkceCookies.length,
            pkceCookieNames: pkceCookies.map(c => c.split('=')[0]),
          })
        }, 100)
      }

      if (oauthError) {
        console.error("[Notion OAuth] OAuth error:", oauthError)
        throw oauthError
      }
      
      if (data?.url) {
        console.log("[Notion OAuth] Redirecting to:", data.url)
        // signInWithOAuth should redirect automatically, but log the URL for debugging
      }
      
      // signInWithOAuth redirects automatically, so we don't need to do anything else
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)
      setIsOAuthLoading(false)
      
      console.error("[Notion OAuth] Error:", errorMessage)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-3 sm:p-4 md:p-6 lg:p-10 bg-background relative overflow-hidden safe-area-insets">
      {/* Character-based backgrounds - dark mode first */}
      <CharacterBackground variant="hero" opacity={0.12} />
      <GradientMesh intensity="medium" />
      <BokehEffect count={20} />
      
      {/* Theme Switcher - Top Right */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20">
        <ThemeSwitcher />
      </div>
      
      <div className="w-full max-w-md relative z-10 px-1">
        <GamerProfileCard
          title="Welcome Back"
          subtitle="Sign in to access your KINK IT dashboard"
          avatarSize={140}
          level={1}
          showStats={true}
          xp={45}
          maxXp={100}
          rank="Returning Player"
          className="shadow-2xl shadow-primary/20"
        >
              {/* Notion OAuth - Primary */}
              <Button
                onClick={handleNotionLogin}
                disabled={isOAuthLoading || isLoading}
                className="w-full h-12 sm:h-14 bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold text-sm sm:text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02] group"
              >
                {isOAuthLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-base">Connecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-4">
                    <NotionIcon variant="official" size={32} className="w-8 h-8 drop-shadow-lg" />
                    <span className="text-base">Continue with Notion</span>
                  </span>
                )}
              </Button>

              {/* Compact Email Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="border-b border-dashed border-muted-foreground/30 group-hover:border-foreground/50 transition-colors">
                    {showEmailPassword ? "Hide" : "Sign in with"} email
                  </span>
                  {showEmailPassword ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {/* Email/Password Form - Collapsible */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showEmailPassword ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
                  }`}
                  suppressHydrationWarning
                >
                  <form onSubmit={handleLogin} className="space-y-3" suppressHydrationWarning>
                    <div className="grid gap-1.5" suppressHydrationWarning>
                      <Label htmlFor="email" className="text-xs text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 sm:h-11 text-sm bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm w-full"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="password" className="text-xs text-foreground">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 sm:h-11 text-sm bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm w-full"
                      />
                    </div>
                    {error && (
                      <div className="text-xs text-destructive-foreground bg-destructive/20 border border-destructive/50 rounded-md p-2 backdrop-blur-sm space-y-2">
                        <div>{error}</div>
                        {error.includes("Redirect URI") && (
                          <div className="mt-2 pt-2 border-t border-destructive/30">
                            <div className="font-semibold mb-1">Quick Fix:</div>
                            <ol className="list-decimal list-inside space-y-1 text-[10px]">
                              <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline">notion.so/my-integrations</a></li>
                              <li>Select your KINK IT integration</li>
                              <li>Add the redirect URI shown above</li>
                              <li>Save and try again</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full h-10 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </div>
              </div>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors"
            >
              Sign up
            </Link>
          </div>
        </GamerProfileCard>
      </div>
    </div>
  )
}
