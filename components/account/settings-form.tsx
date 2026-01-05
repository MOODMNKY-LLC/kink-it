"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"
import { Loader2, Save, Bell, Moon } from "lucide-react"

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    notifications_enabled: profile.notifications_enabled,
    theme_preference: profile.theme_preference,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notifications_enabled: settings.notifications_enabled,
          theme_preference: settings.theme_preference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Settings updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update settings"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Control how you receive notifications
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="space-y-0.5">
            <Label htmlFor="notifications" className="text-base">
              Enable Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications about important updates and activities
            </p>
          </div>
          <Switch
            id="notifications"
            checked={settings.notifications_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, notifications_enabled: checked })
            }
          />
        </div>
      </div>

      {/* Theme Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Customize your app theme
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <Label className="text-base">Theme Preference</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Currently set to: <span className="font-medium capitalize">{settings.theme_preference}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Theme customization coming soon. The app currently uses dark mode by default.
          </p>
        </div>
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

