"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"
import { Loader2, Save, Heart, Shield, Zap } from "lucide-react"
import { BDSMRoleIcon } from "@/components/icons/bdsm-role-icons"

interface KinkIdentityFormProps {
  profile: Profile
}

// Kink subtypes based on research
const SUBMISSIVE_SUBTYPES = [
  { value: "brat", label: "Brat", description: "Playfully resistant submissive" },
  { value: "little", label: "Little/Middle", description: "Age play: little/middle" },
  { value: "pet", label: "Pet", description: "Pet play (pup/kitten/pony)" },
  { value: "slave", label: "Slave", description: "Service-oriented, high protocol" },
  { value: "masochist", label: "Masochist", description: "Enjoys receiving pain/sensation" },
  { value: "service_sub", label: "Service Sub", description: "Service-oriented submission" },
  { value: "primal_prey", label: "Primal Prey", description: "Primal play: prey role" },
  { value: "rope_bunny", label: "Rope Bunny", description: "Enjoys rope bondage" },
  { value: "exhibitionist", label: "Exhibitionist", description: "Enjoys being seen" },
  { value: "degradation_sub", label: "Degradation Sub", description: "Enjoys degradation/humiliation" },
]

const DOMINANT_SUBTYPES = [
  { value: "daddy", label: "Daddy", description: "Caregiver dominant (DD/lg)" },
  { value: "mommy", label: "Mommy", description: "Caregiver dominant (MD/lb)" },
  { value: "master", label: "Master", description: "High protocol, structured control" },
  { value: "mistress", label: "Mistress", description: "Female-identifying master" },
  { value: "sadist", label: "Sadist", description: "Enjoys giving pain/sensation" },
  { value: "rigger", label: "Rigger", description: "Rope bondage specialist" },
  { value: "primal_predator", label: "Primal Predator", description: "Primal play: predator role" },
  { value: "owner", label: "Owner", description: "Ownership-focused dominant" },
  { value: "handler", label: "Handler", description: "Pet play handler/trainer" },
  { value: "degradation_dom", label: "Degradation Dom", description: "Enjoys degradation/humiliation" },
]

const SWITCH_SUBTYPES = [
  { value: "switch", label: "Switch", description: "Enjoys both roles" },
  { value: "versatile", label: "Versatile", description: "Flexible in roles" },
]

const DYNAMIC_INTENSITIES = [
  { value: "casual", label: "Casual", description: "Occasional scenes/play" },
  { value: "part_time", label: "Part-Time", description: "Regular but not constant" },
  { value: "lifestyle", label: "Lifestyle", description: "Integrated into daily life" },
  { value: "24_7", label: "24/7", description: "Full-time power exchange" },
  { value: "tpe", label: "TPE", description: "Total Power Exchange" },
]

const DYNAMIC_STRUCTURES = [
  { value: "d_s", label: "D/s", description: "Dominant/submissive" },
  { value: "m_s", label: "M/s", description: "Master/slave" },
  { value: "owner_pet", label: "Owner/Pet", description: "Owner/pet dynamic" },
  { value: "caregiver_little", label: "CG/l", description: "Caregiver/little dynamic" },
  { value: "primal", label: "Primal", description: "Primal play dynamic" },
  { value: "rope_partnership", label: "Rope Partnership", description: "Rope-focused dynamic" },
  { value: "mentor_protege", label: "Mentor/Protégé", description: "Educational/mentorship" },
  { value: "casual_play", label: "Casual Play", description: "Scene-based, no relationship" },
  { value: "other", label: "Other", description: "Other structure" },
]

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
]

export function KinkIdentityForm({ profile }: KinkIdentityFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    kink_subtypes: (profile as any).kink_subtypes || [],
    dynamic_intensity: (profile as any).dynamic_intensity || null,
    dynamic_structure: (profile as any).dynamic_structure || [],
    kink_interests: (profile as any).kink_interests || [],
    experience_level: (profile as any).experience_level || null,
    scene_preferences: (profile as any).scene_preferences || [],
    kink_identity_public: (profile as any).kink_identity_public || false,
  })

  // Get available subtypes based on dynamic role
  const getAvailableSubtypes = () => {
    switch (profile.dynamic_role) {
      case "dominant":
        return DOMINANT_SUBTYPES
      case "submissive":
        return SUBMISSIVE_SUBTYPES
      case "switch":
        return [...DOMINANT_SUBTYPES, ...SUBMISSIVE_SUBTYPES, ...SWITCH_SUBTYPES]
      default:
        return []
    }
  }

  const toggleSubtype = (subtype: string) => {
    setFormData((prev) => ({
      ...prev,
      kink_subtypes: prev.kink_subtypes.includes(subtype)
        ? prev.kink_subtypes.filter((s) => s !== subtype)
        : [...prev.kink_subtypes, subtype],
    }))
  }

  const toggleStructure = (structure: string) => {
    setFormData((prev) => ({
      ...prev,
      dynamic_structure: prev.dynamic_structure.includes(structure)
        ? prev.dynamic_structure.filter((s) => s !== structure)
        : [...prev.dynamic_structure, structure],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          kink_subtypes: formData.kink_subtypes.length > 0 ? formData.kink_subtypes : null,
          dynamic_intensity: formData.dynamic_intensity || null,
          dynamic_structure: formData.dynamic_structure.length > 0 ? formData.dynamic_structure : null,
          kink_interests: formData.kink_interests.length > 0 ? formData.kink_interests : null,
          experience_level: formData.experience_level || null,
          scene_preferences: formData.scene_preferences.length > 0 ? formData.scene_preferences : null,
          kink_identity_public: formData.kink_identity_public,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Kink identity updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating kink identity:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update kink identity"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const availableSubtypes = getAvailableSubtypes()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Display */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10">
          <BDSMRoleIcon role={profile.dynamic_role} size={24} variant="filled" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold capitalize">Your Role: {profile.dynamic_role}</h2>
          <p className="text-sm text-muted-foreground">
            Express your kink identity and dynamic preferences
          </p>
        </div>
      </div>

      {/* Kink Subtypes */}
      <div className="space-y-4">
        <div>
          <Label className="text-base mb-2 block">Kink Subtypes</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select subtypes that describe your kink identity. You can choose multiple.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableSubtypes.map((subtype) => (
              <button
                key={subtype.value}
                type="button"
                onClick={() => toggleSubtype(subtype.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.kink_subtypes.includes(subtype.value)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{subtype.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {subtype.description}
                </div>
              </button>
            ))}
          </div>
          {formData.kink_subtypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.kink_subtypes.map((subtype) => (
                <Badge key={subtype} variant="secondary">
                  {availableSubtypes.find((s) => s.value === subtype)?.label || subtype}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Intensity */}
      <div className="space-y-2">
        <Label htmlFor="dynamic_intensity">Dynamic Intensity</Label>
        <Select
          value={formData.dynamic_intensity || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, dynamic_intensity: value as any })
          }
        >
          <SelectTrigger id="dynamic_intensity">
            <SelectValue placeholder="Select intensity level" />
          </SelectTrigger>
          <SelectContent>
            {DYNAMIC_INTENSITIES.map((intensity) => (
              <SelectItem key={intensity.value} value={intensity.value}>
                {intensity.label} - {intensity.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic Structures */}
      <div className="space-y-4">
        <div>
          <Label className="text-base mb-2 block">Dynamic Structures</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Types of relationship structures you engage in
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DYNAMIC_STRUCTURES.map((structure) => (
              <button
                key={structure.value}
                type="button"
                onClick={() => toggleStructure(structure.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.dynamic_structure.includes(structure.value)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{structure.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {structure.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <Label htmlFor="experience_level">Experience Level</Label>
        <Select
          value={formData.experience_level || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, experience_level: value })
          }
        >
          <SelectTrigger id="experience_level">
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Privacy Setting */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
        <div className="space-y-0.5">
          <Label htmlFor="kink_public" className="text-base">
            Make Kink Identity Public
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow others in your bond to see your kink subtypes and preferences
          </p>
        </div>
        <Switch
          id="kink_public"
          checked={formData.kink_identity_public}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, kink_identity_public: checked })
          }
        />
      </div>

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



