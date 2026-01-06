"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Profile, DynamicRole } from "@/types/profile"
import { Loader2, Save, User, Mail, Shield, Users, Search, X } from "lucide-react"
import { BondManagement } from "./bond-management"

interface ProfileFormProps {
  profile: Profile
}

interface PartnerInfo {
  id: string
  email: string
  display_name?: string | null
  full_name?: string | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isLinkingPartner, setIsLinkingPartner] = useState(false)
  const [partnerEmail, setPartnerEmail] = useState("")
  const [currentPartner, setCurrentPartner] = useState<PartnerInfo | null>(null)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    display_name: profile.display_name || "",
    dynamic_role: profile.dynamic_role,
    tagline: profile.tagline || "",
  })

  // Fetch current partner info
  useEffect(() => {
    const fetchPartner = async () => {
      if (profile.partner_id) {
        const { data } = await supabase
          .from("profiles")
          .select("id, email, display_name, full_name")
          .eq("id", profile.partner_id)
          .single()

        if (data) {
          setCurrentPartner(data as PartnerInfo)
        }
      } else {
        setCurrentPartner(null)
      }
    }
    fetchPartner()
  }, [profile.partner_id, supabase])

  const handleLinkPartner = async () => {
    if (!partnerEmail.trim()) {
      toast.error("Please enter a partner email address")
      return
    }

    setIsLinkingPartner(true)
    try {
      const response = await fetch("/api/partners/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: partnerEmail.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to link partner")
      }

      toast.success("Partner linked successfully")
      setCurrentPartner(data.partner)
      setPartnerEmail("")
      router.refresh()
    } catch (error) {
      console.error("Error linking partner:", error)
      toast.error(error instanceof Error ? error.message : "Failed to link partner")
    } finally {
      setIsLinkingPartner(false)
    }
  }

  const handleUnlinkPartner = async () => {
    if (!confirm("Are you sure you want to unlink your partner? This will affect task assignments and other features.")) {
      return
    }

    setIsLinkingPartner(true)
    try {
      const response = await fetch("/api/partners/unlink", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to unlink partner")
      }

      toast.success("Partner unlinked successfully")
      setCurrentPartner(null)
      router.refresh()
    } catch (error) {
      console.error("Error unlinking partner:", error)
      toast.error(error instanceof Error ? error.message : "Failed to unlink partner")
    } finally {
      setIsLinkingPartner(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          display_name: formData.display_name || null,
          dynamic_role: formData.dynamic_role,
          tagline: formData.tagline || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Profile updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your personal details
            </p>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="grid gap-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="bg-muted/50 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. It&apos;s linked to your Notion account.
          </p>
        </div>

        {/* Full Name */}
        <div className="grid gap-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            className="bg-muted/50 border-border focus:border-primary focus:ring-primary/20"
          />
        </div>

        {/* Display Name */}
        <div className="grid gap-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            type="text"
            placeholder="How you want to be displayed"
            value={formData.display_name}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            className="bg-muted/50 border-border focus:border-primary focus:ring-primary/20"
          />
        </div>

        {/* Tagline */}
        <div className="grid gap-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            type="text"
            placeholder="A short tagline displayed in your terminal widget"
            value={formData.tagline}
            onChange={(e) =>
              setFormData({ ...formData, tagline: e.target.value })
            }
            maxLength={200}
            className="bg-muted/50 border-border focus:border-primary focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            This tagline appears in the scrolling banner of your terminal widget. Keep it short and personal.
          </p>
        </div>

        {/* Dynamic Role */}
        <div className="grid gap-2">
          <Label htmlFor="dynamic_role" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Dynamic Role
          </Label>
          <Select
            value={formData.dynamic_role}
            onValueChange={(value: DynamicRole) =>
              setFormData({ ...formData, dynamic_role: value })
            }
          >
            <SelectTrigger className="bg-muted/50 border-border focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dominant">Dominant</SelectItem>
              <SelectItem value="submissive">Submissive</SelectItem>
              <SelectItem value="switch">Switch</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your role preference in dynamic relationships
          </p>
        </div>
      </div>

      {/* Bond Management Section */}
      <div className="space-y-4">
        <BondManagement profile={profile} />
      </div>

      {/* Partner Linking Section (Legacy - for backward compatibility) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Partner Connection (Legacy)</h2>
            <p className="text-sm text-muted-foreground">
              Legacy partner linking. Consider using Bonds instead for better multi-member support.
            </p>
          </div>
        </div>

        {currentPartner ? (
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {currentPartner.display_name || currentPartner.full_name || "Partner"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Linked
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentPartner.email}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUnlinkPartner}
                disabled={isLinkingPartner}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isLinkingPartner ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Unlink
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="partner_email">Partner Email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="partner_email"
                    type="email"
                    placeholder="Enter your partner's email address"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="bg-muted/50 border-border focus:border-primary focus:ring-primary/20 pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleLinkPartner()
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleLinkPartner}
                  disabled={isLinkingPartner || !partnerEmail.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLinkingPartner ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Link Partner
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your partner&apos;s email address to link accounts. They must have a KINK IT account.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* System Role Badge (read-only) */}
      {profile.system_role === "admin" && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Admin Account</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You have administrative privileges
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}



