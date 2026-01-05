import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Profile } from "@/types/profile"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

export async function getUserProfile(): Promise<Profile | null> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error || !profile) {
    console.error("[v0] Error fetching profile:", error)
    return null
  }

  return profile as Profile
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.system_role === "admin"
}

export async function requireAdmin() {
  const profile = await getUserProfile()

  if (!profile || profile.system_role !== "admin") {
    redirect("/")
  }

  return profile
}
