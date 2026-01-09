"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LinkIcon, ChevronDown, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profile"

interface Bond {
  id: string
  name: string
  bond_type: string
  bond_status: string
  member_count?: number
  role_in_bond?: string
}

interface ContextSwitcherProps {
  profile: Profile | null
}

export function ContextSwitcher({ profile }: ContextSwitcherProps) {
  const router = useRouter()
  const supabase = createClient()
  const [bonds, setBonds] = React.useState<Bond[]>([])
  const [currentBondId, setCurrentBondId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)

  // Load current context from localStorage or profile
  React.useEffect(() => {
    if (profile?.bond_id) {
      const stored = localStorage.getItem("current_bond_id")
      setCurrentBondId(stored || profile.bond_id)
    }
  }, [profile?.bond_id])

  // Fetch user's bonds
  React.useEffect(() => {
    const fetchBonds = async () => {
      if (!profile?.id) {
        setLoading(false)
        return
      }

      try {
        // Step 1: Fetch bond memberships for the user
        const { data: memberships, error: membershipsError } = await supabase
          .from("bond_members")
          .select("bond_id, role_in_bond")
          .eq("user_id", profile.id)
          .eq("is_active", true)

        if (membershipsError) {
          // Get error message - handle various error formats
          const errorMessage = 
            membershipsError.message || 
            (membershipsError as any)?.error_description ||
            (membershipsError as any)?.msg ||
            String(membershipsError) ||
            "Unknown error"
          
          // Check if this is a network/certificate error
          const isNetworkError = 
            errorMessage.includes("Failed to fetch") ||
            errorMessage.includes("NetworkError") ||
            errorMessage.includes("Network request failed") ||
            errorMessage.includes("TypeError") ||
            (membershipsError as any).status === 0 ||
            errorMessage === "Unknown error" // Empty error often means network issue

          if (isNetworkError) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://127.0.0.1:55321"
            console.warn("🔒 Possible Certificate/Network Error")
            console.warn("Error fetching bond memberships - this may be a certificate issue")
            console.warn("\n📋 To fix this:")
            console.warn("1. Navigate to:", supabaseUrl)
            console.warn("2. Click 'Advanced' → 'Proceed to 127.0.0.1 (unsafe)'")
            console.warn("3. Accept the certificate")
            console.warn("4. Refresh this page")
          } else {
            // Log more details for debugging
            console.error("Error fetching bond memberships:", {
              message: errorMessage,
              code: (membershipsError as any)?.code,
              details: (membershipsError as any)?.details,
              hint: (membershipsError as any)?.hint,
              status: (membershipsError as any)?.status,
            })
          }
          
          // Don't block the UI - just show empty bonds
          setBonds([])
          setLoading(false)
          return
        }

        if (!memberships || memberships.length === 0) {
          setBonds([])
          setLoading(false)
          return
        }

        // Step 2: Extract bond IDs
        const bondIds = memberships.map((m) => m.bond_id)

        // Step 3: Fetch bonds data
        const { data: bondsData, error: bondsError } = await supabase
          .from("bonds")
          .select("id, name, bond_type, bond_status")
          .in("id", bondIds)

        if (bondsError) {
          console.error("Error fetching bonds:", bondsError)
          setLoading(false)
          return
        }

        if (!bondsData || bondsData.length === 0) {
          setBonds([])
          setLoading(false)
          return
        }

        // Step 4: Get member counts for each bond and combine data
        const bondsWithCounts = await Promise.all(
          bondsData.map(async (bond) => {
            // Get member count
            const { count, error: countError } = await supabase
              .from("bond_members")
              .select("*", { count: "exact", head: true })
              .eq("bond_id", bond.id)
              .eq("is_active", true)

            if (countError) {
              // Only log non-network errors to avoid spam
              const errorMessage = countError.message || String(countError)
              if (!errorMessage.includes("Failed to fetch")) {
                console.error(`Error getting count for bond ${bond.id}:`, countError)
              }
            }

            // Find the user's role in this bond
            const membership = memberships.find((m) => m.bond_id === bond.id)

            return {
              id: bond.id,
              name: bond.name,
              bond_type: bond.bond_type,
              bond_status: bond.bond_status,
              role_in_bond: membership?.role_in_bond || null,
              member_count: count || 0,
            }
          })
        )

        setBonds(bondsWithCounts)
      } catch (error: any) {
        const errorMessage = error?.message || String(error)
        const isNetworkError = 
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Network request failed")

        if (isNetworkError) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://127.0.0.1:55321"
          console.error("🔒 Network error in fetchBonds. Certificate may not be accepted.")
          console.error("Fix: Navigate to", supabaseUrl, "and accept the certificate")
        } else {
          console.error("Error in fetchBonds:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBonds()
  }, [profile?.id, supabase])

  const currentBond = bonds.find((b) => b.id === currentBondId)

  const handleSwitchContext = async (bondId: string | null) => {
    setCurrentBondId(bondId)
    localStorage.setItem("current_bond_id", bondId || "")
    setOpen(false)

    // Navigate to bond page if switching to a bond
    if (bondId) {
      router.push(`/bonds/${bondId}`)
    } else {
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="px-2 py-2">
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Don't show switcher if user has no bonds
  if (bonds.length === 0 && !profile?.bond_id) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-2 h-auto py-2 hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {currentBond ? (
                <>
                  <div className="flex items-center justify-center size-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                    <LinkIcon className="size-4" />
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium truncate w-full">
                      {currentBond.name}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 truncate w-full">
                      {currentBond.bond_type} • {currentBond.member_count} {currentBond.member_count === 1 ? "member" : "members"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center size-8 rounded-md bg-sidebar-accent shrink-0">
                    <LinkIcon className="size-4" />
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium">Personal</span>
                    <span className="text-xs text-sidebar-foreground/60">No active bond</span>
                  </div>
                </>
              )}
            </div>
            <ChevronDown className="size-4 shrink-0 text-sidebar-foreground/50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" side="right" align="start" sideOffset={8}>
        <div className="p-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
            Switch Context
          </div>
          
          {/* Personal/No Bond Option */}
          <button
            onClick={() => handleSwitchContext(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
              "hover:bg-sidebar-accent",
              !currentBondId && "bg-sidebar-accent"
            )}
          >
            <div className="flex items-center justify-center size-8 rounded-md bg-sidebar-accent shrink-0">
              <LinkIcon className="size-4" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium">Personal</span>
              <span className="text-xs text-sidebar-foreground/60">No active bond</span>
            </div>
            {!currentBondId && (
              <Check className="size-4 shrink-0 text-sidebar-primary" />
            )}
          </button>

          {/* Bonds List */}
          {bonds.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mt-2">
                Your Bonds
              </div>
              {bonds.map((bond) => (
                <button
                  key={bond.id}
                  onClick={() => handleSwitchContext(bond.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-sidebar-accent",
                    currentBondId === bond.id && "bg-sidebar-accent"
                  )}
                >
                  <div className="flex items-center justify-center size-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                    <LinkIcon className="size-4" />
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-sm font-medium truncate">{bond.name}</span>
                      {bond.role_in_bond && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                          {bond.role_in_bond}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-sidebar-foreground/60 truncate w-full">
                      {bond.bond_type} • {bond.member_count} {bond.member_count === 1 ? "member" : "members"}
                    </span>
                  </div>
                  {currentBondId === bond.id && (
                    <Check className="size-4 shrink-0 text-sidebar-primary" />
                  )}
                </button>
              ))}
            </>
          )}

          {/* Create New Bond Option */}
          <div className="border-t border-sidebar-border mt-2 pt-2">
            <button
              onClick={() => {
                setOpen(false)
                router.push("/bonds/create")
              }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-sidebar-accent shrink-0">
                <Plus className="size-4" />
              </div>
              <span className="text-sm font-medium">Create New Bond</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

