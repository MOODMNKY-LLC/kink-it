"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Crown, 
  Heart, 
  Scale, 
  User,
  Edit,
  UserX,
  Shield,
  UserPlus,
  Mail
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { Profile } from "@/types/profile"

interface BondMembersProps {
  bondId: string
  profile: Profile | null
}

interface BondMember {
  id: string
  user_id: string
  role_in_bond: string
  joined_at: string
  is_active: boolean
  can_invite: boolean
  can_manage: boolean
  nickname: string | null
  bio: string | null
  last_active_at: string | null
  user: {
    display_name: string | null
    full_name: string | null
    email: string
    avatar_url: string | null
    dynamic_role: string
  }
}

export function BondMembers({ bondId, profile }: BondMembersProps) {
  const [members, setMembers] = useState<BondMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<BondMember | null>(null)
  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    fetchMembers()
    checkPermissions()
  }, [bondId, profile])

  const fetchMembers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bond_members")
      .select(`
        *,
        user:profiles!bond_members_user_id_fkey(
          display_name,
          full_name,
          email,
          avatar_url,
          dynamic_role
        )
      `)
      .eq("bond_id", bondId)
      .eq("is_active", true)
      .order("joined_at", { ascending: false })

    if (error) {
      console.error("Error fetching members:", error)
      toast.error("Failed to load members")
      return
    }

    setMembers(data || [])
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

    setIsManager(data?.can_manage === true || data?.role_in_bond === "founder")
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("bond_members")
      .update({ role_in_bond: newRole })
      .eq("id", memberId)

    if (error) {
      toast.error("Failed to update role")
      return
    }

    toast.success("Role updated successfully")
    fetchMembers()
  }

  const handleUpdatePermissions = async (
    memberId: string,
    canInvite: boolean,
    canManage: boolean
  ) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("bond_members")
      .update({
        can_invite: canInvite,
        can_manage: canManage,
      })
      .eq("id", memberId)

    if (error) {
      toast.error("Failed to update permissions")
      return
    }

    toast.success("Permissions updated successfully")
    fetchMembers()
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the bond?")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("bond_members")
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq("id", memberId)

    if (error) {
      toast.error("Failed to remove member")
      return
    }

    // If this was the user's primary bond, clear it
    await supabase
      .from("profiles")
      .update({ bond_id: null })
      .eq("id", userId)

    toast.success("Member removed successfully")
    fetchMembers()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "founder":
        return Crown
      case "dominant":
        return Shield
      case "submissive":
        return Heart
      case "switch":
        return Scale
      default:
        return User
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "founder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "dominant":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "submissive":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "switch":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading members...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bond Members ({members.length})
              </CardTitle>
              <CardDescription className="mt-1">
                Manage members, roles, and permissions
              </CardDescription>
            </div>
            {isManager && (
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No members found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Permissions</TableHead>
                    {isManager && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const RoleIcon = getRoleIcon(member.role_in_bond)
                    const isCurrentUser = member.user_id === profile?.id

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.user.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.user.display_name?.[0] || member.user.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {member.nickname || member.user.display_name || member.user.full_name || member.user.email.split("@")[0]}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(member.role_in_bond)}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {member.role_in_bond}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.last_active_at
                            ? formatDistanceToNow(new Date(member.last_active_at), { addSuffix: true })
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {member.can_invite && (
                              <Badge variant="outline" className="text-xs w-fit">
                                Can Invite
                              </Badge>
                            )}
                            {member.can_manage && (
                              <Badge variant="outline" className="text-xs w-fit">
                                Can Manage
                              </Badge>
                            )}
                            {!member.can_invite && !member.can_manage && (
                              <span className="text-xs text-muted-foreground">Member</span>
                            )}
                          </div>
                        </TableCell>
                        {isManager && (
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedMember(member)}
                                  disabled={isCurrentUser && member.role_in_bond === "founder"}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage Member</DialogTitle>
                                  <DialogDescription>
                                    Update role and permissions for this member
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedMember && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Role in Bond</Label>
                                      <Select
                                        value={selectedMember.role_in_bond}
                                        onValueChange={(value) =>
                                          handleUpdateRole(selectedMember.id, value)
                                        }
                                        disabled={selectedMember.role_in_bond === "founder"}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="founder">Founder</SelectItem>
                                          <SelectItem value="dominant">Dominant</SelectItem>
                                          <SelectItem value="submissive">Submissive</SelectItem>
                                          <SelectItem value="switch">Switch</SelectItem>
                                          <SelectItem value="member">Member</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Permissions</Label>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm">Can Invite Members</span>
                                        <Switch
                                          checked={selectedMember.can_invite}
                                          onCheckedChange={(checked) =>
                                            handleUpdatePermissions(
                                              selectedMember.id,
                                              checked,
                                              selectedMember.can_manage
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm">Can Manage Bond</span>
                                        <Switch
                                          checked={selectedMember.can_manage}
                                          onCheckedChange={(checked) =>
                                            handleUpdatePermissions(
                                              selectedMember.id,
                                              selectedMember.can_invite,
                                              checked
                                            )
                                          }
                                        />
                                      </div>
                                    </div>

                                    {!isCurrentUser && selectedMember.role_in_bond !== "founder" && (
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleRemoveMember(selectedMember.id, selectedMember.user_id)
                                        }
                                        className="w-full"
                                      >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Remove from Bond
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

