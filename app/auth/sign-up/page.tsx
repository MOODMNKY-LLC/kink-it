"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotionIcon } from "@/components/icons/notion"
import { GamerProfileCard } from "@/components/auth/gamer-profile-card"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [dynamicRole, setDynamicRole] = useState<"dominant" | "submissive" | "switch">("submissive")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const router = useRouter()

  const handleNotionSignUp = async () => {
    const supabase = createClient()
    setIsOAuthLoading(true)
    setError(null)

    try {
      // Normalize redirect URL to use 127.0.0.1 instead of localhost in development
      // This ensures consistency with Next.js server and Supabase config
      const origin = window.location.origin
      const normalizedOrigin = origin.replace(/localhost/i, "127.0.0.1")
      const redirectTo = `${normalizedOrigin}/auth/callback`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "notion",
        options: {
          redirectTo,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsOAuthLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
          data: {
            full_name: fullName,
            dynamic_role: dynamicRole,
          },
        },
      })
      if (error) throw error
      router.push("/auth/verify-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
      {/* Character-based backgrounds - dark mode first */}
      <CharacterBackground variant="hero" opacity={0.12} />
      <GradientMesh intensity="medium" />
      <BokehEffect count={20} />
      
      <div className="w-full max-w-md relative z-10">
        <GamerProfileCard
          title="Join KINK IT"
          subtitle="Create your account to get started"
          avatarSize={140}
          level={1}
          showStats={true}
          xp={0}
          maxXp={100}
          rank="New Player"
          className="shadow-2xl shadow-primary/20"
        >
              {/* Notion OAuth - Primary */}
              <Button
                onClick={handleNotionSignUp}
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
                    <span className="text-base">Sign up with Notion</span>
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
                    {showEmailPassword ? "Hide" : "Sign up with"} email
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
                    showEmailPassword ? "max-h-[800px] opacity-100 mt-4" : "max-h-0 opacity-0"
                  }`}
                  suppressHydrationWarning
                >
                  <form onSubmit={handleSignUp} className="space-y-3" suppressHydrationWarning>
                    <div className="grid gap-1.5" suppressHydrationWarning>
                      <Label htmlFor="fullName" className="text-xs text-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-9 text-sm bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
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
                      <Label htmlFor="role" className="text-xs text-foreground">
                        Your Dynamic Role
                      </Label>
                      <Select
                        value={dynamicRole}
                        onValueChange={(value: "dominant" | "submissive" | "switch") => setDynamicRole(value)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card backdrop-blur-xl border-border">
                          <SelectItem value="dominant" className="text-foreground">
                            Dominant
                          </SelectItem>
                          <SelectItem value="submissive" className="text-foreground">
                            Submissive
                          </SelectItem>
                          <SelectItem value="switch" className="text-foreground">
                            Switch
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This defines your role in D/s dynamics. Choose Switch if you enjoy both roles.
                      </p>
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
                    <div className="grid gap-1.5">
                      <Label htmlFor="repeat-password" className="text-xs text-foreground">
                        Confirm Password
                      </Label>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
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
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </div>
              </div>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </GamerProfileCard>
      </div>
    </div>
  )
}
