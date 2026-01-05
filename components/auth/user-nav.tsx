"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User, Shield } from "lucide-react"
import type { Profile } from "@/types/profile"

interface UserNavProps {
  profile: Profile
}

export function UserNav({ profile }: UserNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || profile.email.charAt(0).toUpperCase()

  const dynamicRoleDisplay = {
    dominant: "Dominant",
    submissive: "Submissive",
    switch: "Switch",
  }[profile.dynamic_role]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.email} />
            <AvatarFallback className="bg-purple-600 text-white">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none text-zinc-100">
                {profile.full_name || profile.display_name || "User"}
              </p>
              {profile.system_role === "admin" && (
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-600/30 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-zinc-400">{profile.email}</p>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300 w-fit text-xs">
              {dynamicRoleDisplay}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-950/20" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
