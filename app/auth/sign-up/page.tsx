"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [dynamicRole, setDynamicRole] = useState<"dominant" | "submissive" | "switch">("submissive")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-900">
      <div className="w-full max-w-sm">
        <Card className="border-cyan-800/50 bg-blue-950/80 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
              Join KINK IT
            </CardTitle>
            <CardDescription className="text-blue-200">Create your account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="text-blue-100">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-blue-950/50 border-cyan-700/50 text-blue-50 placeholder:text-blue-300/50 focus:border-cyan-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-blue-100">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-blue-950/50 border-cyan-700/50 text-blue-50 placeholder:text-blue-300/50 focus:border-cyan-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-blue-100">
                    Your Dynamic Role
                  </Label>
                  <Select
                    value={dynamicRole}
                    onValueChange={(value: "dominant" | "submissive" | "switch") => setDynamicRole(value)}
                  >
                    <SelectTrigger className="bg-blue-950/50 border-cyan-700/50 text-blue-50 focus:border-cyan-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-950 border-cyan-800">
                      <SelectItem value="dominant" className="text-blue-50">
                        Dominant
                      </SelectItem>
                      <SelectItem value="submissive" className="text-blue-50">
                        Submissive
                      </SelectItem>
                      <SelectItem value="switch" className="text-blue-50">
                        Switch
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-300/70 mt-1">
                    This defines your role in D/s dynamics. Choose Switch if you enjoy both roles.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-blue-100">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-blue-950/50 border-cyan-700/50 text-blue-50 focus:border-cyan-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-blue-100">
                    Confirm Password
                  </Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-blue-950/50 border-cyan-700/50 text-blue-50 focus:border-cyan-500"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-100 bg-red-950/50 border border-red-800/50 rounded-md p-3">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-blue-200">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
