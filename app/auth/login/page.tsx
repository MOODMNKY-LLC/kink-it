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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const router = useRouter()

  const handleNotionLogin = async () => {
    const supabase = createClient()
    setIsOAuthLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "notion",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsOAuthLoading(false)
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
    <div className="dark flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
      {/* Character-based backgrounds - dark mode first */}
      <CharacterBackground variant="hero" opacity={0.12} />
      <GradientMesh intensity="medium" />
      <BokehEffect count={20} />
      
      <div className="w-full max-w-md relative z-10">
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
                className="w-full h-14 bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02] group"
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
                        className="h-9 text-sm bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
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
                        className="h-9 text-sm bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                      />
                    </div>
                    {error && (
                      <div className="text-xs text-destructive-foreground bg-destructive/20 border border-destructive/50 rounded-md p-2 backdrop-blur-sm">
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
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
