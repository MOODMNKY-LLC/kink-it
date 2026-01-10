"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, FileText, Loader2, ExternalLink, User } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { DynamicRole } from "@/types/profile"
import { AddToNotionButtonGeneric } from "@/components/playground/shared/add-to-notion-button-generic"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Rule {
  id: string
  title: string
  description: string | null
  category: "standing" | "situational" | "temporary" | "protocol"
  status: "active" | "inactive" | "archived"
  priority: number
  assigned_to: string | null
  created_at: string
  effective_from: string | null
  effective_until: string | null
}

interface BondMember {
  user_id: string
  user: {
    id: string
    display_name: string | null
    full_name: string | null
    email: string
    avatar_url: string | null
    dynamic_role: string
  }
}

interface RulesPageClientProps {
  userId: string
  userRole: DynamicRole
  bondId: string | null
}

export function RulesPageClient({ userId, userRole, bondId }: RulesPageClientProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [bondMembers, setBondMembers] = useState<BondMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    loadRules()
  }, [bondId])

  useEffect(() => {
    if (userRole === "dominant" && bondId) {
      loadBondMembers()
    } else if (userRole === "dominant" && !bondId) {
      // No bond - load current user as the only option
      loadCurrentUser()
    }
  }, [bondId, userRole])

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, full_name, email, avatar_url, dynamic_role")
          .eq("id", user.id)
          .single()
        
        if (profile) {
          setBondMembers([{
            user_id: profile.id,
            user: {
              id: profile.id,
              display_name: profile.display_name,
              full_name: profile.full_name,
              email: profile.email || "",
              avatar_url: profile.avatar_url,
              dynamic_role: profile.dynamic_role || "",
            }
          }])
        }
      }
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  const loadBondMembers = async () => {
    if (!bondId) return
    
    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/bonds/${bondId}/members`)
      if (response.ok) {
        const responseText = await response.text()
        const data = responseText ? JSON.parse(responseText) : { members: [] }
        setBondMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error loading bond members:", error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const getMemberDisplayName = (member: BondMember) => {
    return member.user.display_name || member.user.full_name || member.user.email.split("@")[0] || "Unknown"
  }

  const loadRules = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (bondId) params.append("bond_id", bondId)
      params.append("status", "active")

      const response = await fetch(`/api/rules?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setRules(data.rules || [])
      } else {
        toast.error(data.error || "Failed to load rules")
      }
    } catch (error) {
      toast.error("Failed to load rules")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRule = async (formData: FormData) => {
    try {
      const assignedTo = selectedMemberId && selectedMemberId.trim() !== "" ? selectedMemberId : null
      
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          category: formData.get("category"),
          status: formData.get("status"),
          priority: parseInt(formData.get("priority") as string) || 0,
          bond_id: bondId,
          assigned_to: assignedTo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Rule created successfully")
        setShowCreateDialog(false)
        setSelectedMemberId("") // Reset selection
        loadRules()
      } else {
        toast.error(data.error || "Failed to create rule")
      }
    } catch (error) {
      toast.error("Failed to create rule")
      console.error(error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return

    try {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Rule deleted successfully")
        loadRules()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete rule")
      }
    } catch (error) {
      toast.error("Failed to delete rule")
      console.error(error)
    }
  }


  const getCategoryColor = (category: string) => {
    switch (category) {
      case "standing":
        return "bg-primary/20 text-primary border-primary/40"
      case "situational":
        return "bg-accent/20 text-accent border-accent/40"
      case "temporary":
        return "bg-warning/20 text-warning border-warning/40"
      case "protocol":
        return "bg-secondary/20 text-secondary-foreground border-secondary/40"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading rules...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {userRole === "dominant" && (
        <div className="flex justify-end">
          <Dialog 
            open={showCreateDialog} 
            onOpenChange={(open) => {
              setShowCreateDialog(open)
              if (!open) {
                // Reset form state when dialog closes
                setSelectedMemberId("")
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20">
              <DialogHeader>
                <DialogTitle>Create New Rule</DialogTitle>
                <DialogDescription>
                  Add a new rule or protocol for your dynamic
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateRule} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue="standing">
                      <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standing">Standing</SelectItem>
                        <SelectItem value="situational">Situational</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="protocol">Protocol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      name="priority"
                      type="number"
                      defaultValue="0"
                      className="bg-muted/50 border-border backdrop-blur-sm"
                    />
                  </div>
                </div>
                
                {/* Bond Member Assignment */}
                {bondId && (
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Assign To (Optional)</span>
                      </div>
                    </Label>
                    {loadingMembers ? (
                      <div className="p-3 bg-muted/50 border border-border rounded-md text-sm text-muted-foreground">
                        Loading members...
                      </div>
                    ) : bondMembers.length > 0 ? (
                      <Select
                        value={selectedMemberId}
                        onValueChange={setSelectedMemberId}
                      >
                        <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                          <SelectValue placeholder="All bond members (default)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All bond members</SelectItem>
                          {bondMembers.map((member) => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                              <div className="flex items-center gap-2">
                                <span>{getMemberDisplayName(member)}</span>
                                {member.user.dynamic_role && (
                                  <Badge variant="outline" className="text-xs">
                                    {member.user.dynamic_role}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted/50 border border-border rounded-md text-sm text-muted-foreground">
                        No bond members found. Rule will apply to all members.
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave unselected to apply this rule to all bond members, or select a specific member.
                    </p>
                  </div>
                )}
                
                <input type="hidden" name="status" value="active" />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                  >
                    Create Rule
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {rules.length === 0 ? (
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {userRole === "dominant"
                ? "No rules created yet. Create your first rule to get started."
                : "No active rules at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className="border-primary/20 bg-card/90 backdrop-blur-xl hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{rule.title}</CardTitle>
                      <Badge className={getCategoryColor(rule.category)}>
                        {rule.category}
                      </Badge>
                    </div>
                    {rule.description && (
                      <CardDescription className="mt-2">
                        {rule.description}
                      </CardDescription>
                    )}
                  </div>
                  {userRole === "dominant" && (
                    <div className="flex gap-2">
                      <AddToNotionButtonGeneric
                        tableName="rules"
                        itemId={rule.id}
                        syncEndpoint="/api/notion/sync-rule"
                        variant="ghost"
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

