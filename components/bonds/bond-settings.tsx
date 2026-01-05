"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Save, Shield } from "lucide-react"
import type { Profile } from "@/types/profile"

interface BondSettingsProps {
  bondId: string
  profile: Profile | null
}

interface BondSettingsData {
  max_members: number | null
  auto_approve_members: boolean
  require_approval_for_leaving: boolean
  invite_expires_after_days: number | null
  max_invites_per_member: number | null
  notify_on_member_join: boolean
  notify_on_member_leave: boolean
  notify_on_role_change: boolean
  notify_on_task_assigned: boolean
  notify_on_task_completed: boolean
  show_member_profiles: boolean
  show_activity_feed: boolean
  allow_external_invites: boolean
  enable_task_management: boolean
  enable_points_system: boolean
  enable_rewards_system: boolean
  enable_journal_sharing: boolean
  enable_calendar_sharing: boolean
}

export function BondSettings({ bondId, profile }: BondSettingsProps) {
  const [settings, setSettings] = useState<BondSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    fetchSettings()
    checkPermissions()
  }, [bondId, profile])

  const fetchSettings = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bond_settings")
      .select("*")
      .eq("bond_id", bondId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error)
      return
    }

    // Use defaults if no settings exist
    setSettings(
      data || {
        max_members: null,
        auto_approve_members: false,
        require_approval_for_leaving: false,
        invite_expires_after_days: null,
        max_invites_per_member: null,
        notify_on_member_join: true,
        notify_on_member_leave: true,
        notify_on_role_change: true,
        notify_on_task_assigned: true,
        notify_on_task_completed: true,
        show_member_profiles: true,
        show_activity_feed: true,
        allow_external_invites: true,
        enable_task_management: true,
        enable_points_system: true,
        enable_rewards_system: true,
        enable_journal_sharing: false,
        enable_calendar_sharing: false,
      }
    )
    setLoading(false)
  }

  const checkPermissions = async () => {
    if (!profile) return

    const supabase = createClient()
    const { data } = await supabase
      .from("bond_members")
      .select("can_manage, role_in_bond")
      .eq("bond_id", bondId)
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .single()

    setCanManage(data?.can_manage === true || data?.role_in_bond === "founder")
  }

  const handleSave = async () => {
    if (!settings || !canManage) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("bond_settings")
      .upsert({
        bond_id: bondId,
        ...settings,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      toast.error("Failed to save settings")
      setSaving(false)
      return
    }

    toast.success("Settings saved successfully")
    setSaving(false)
  }

  if (loading || !settings) {
    return <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
  }

  if (!canManage) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>You don't have permission to manage bond settings.</p>
          <p className="text-sm mt-2">Contact your bond founder or manager.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Membership Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Settings</CardTitle>
          <CardDescription>Control how members join and leave</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="max_members">Maximum Members</Label>
            <Input
              id="max_members"
              type="number"
              min="2"
              value={settings.max_members || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_members: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for unlimited members
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Approve Members</Label>
              <p className="text-xs text-muted-foreground">
                Automatically approve join requests
              </p>
            </div>
            <Switch
              checked={settings.auto_approve_members}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_approve_members: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Approval to Leave</Label>
              <p className="text-xs text-muted-foreground">
                Members need approval before leaving
              </p>
            </div>
            <Switch
              checked={settings.require_approval_for_leaving}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, require_approval_for_leaving: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Invite Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Settings</CardTitle>
          <CardDescription>Control invite code behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invite_expires">Invite Expires After (Days)</Label>
            <Input
              id="invite_expires"
              type="number"
              min="1"
              value={settings.invite_expires_after_days || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  invite_expires_after_days: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Never expires"
            />
          </div>

          <div>
            <Label htmlFor="max_invites">Max Invites Per Member</Label>
            <Input
              id="max_invites"
              type="number"
              min="1"
              value={settings.max_invites_per_member || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_invites_per_member: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Choose what notifications members receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Notify on Member Join</Label>
            <Switch
              checked={settings.notify_on_member_join}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_on_member_join: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notify on Member Leave</Label>
            <Switch
              checked={settings.notify_on_member_leave}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_on_member_leave: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notify on Role Change</Label>
            <Switch
              checked={settings.notify_on_role_change}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_on_role_change: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notify on Task Assigned</Label>
            <Switch
              checked={settings.notify_on_task_assigned}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_on_task_assigned: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notify on Task Completed</Label>
            <Switch
              checked={settings.notify_on_task_completed}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notify_on_task_completed: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control visibility and sharing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show Member Profiles</Label>
            <Switch
              checked={settings.show_member_profiles}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_member_profiles: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Activity Feed</Label>
            <Switch
              checked={settings.show_activity_feed}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_activity_feed: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Allow External Invites</Label>
            <Switch
              checked={settings.allow_external_invites}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allow_external_invites: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable bond features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Task Management</Label>
            <Switch
              checked={settings.enable_task_management}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enable_task_management: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Points System</Label>
            <Switch
              checked={settings.enable_points_system}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enable_points_system: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Rewards System</Label>
            <Switch
              checked={settings.enable_rewards_system}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enable_rewards_system: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Journal Sharing</Label>
            <Switch
              checked={settings.enable_journal_sharing}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enable_journal_sharing: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Calendar Sharing</Label>
            <Switch
              checked={settings.enable_calendar_sharing}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enable_calendar_sharing: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
}

