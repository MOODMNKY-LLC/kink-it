"use client"

import { format, isToday, isTomorrow, parseISO } from "date-fns"
import { CheckCircle2, Clock, AlertCircle, Camera, Video, FileText, Play, X, Loader2, ExternalLink, User } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Task, TaskStatus, TaskPriority } from "@/types/task"
import type { DynamicRole } from "@/types/profile"
import { useNotionSyncStatus } from "@/components/playground/shared/use-notion-sync-status"
import { AddToNotionButtonGeneric } from "@/components/playground/shared/add-to-notion-button-generic"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface TaskCardProps {
  task: Task
  userRole: DynamicRole
  onAction: (action: string, taskId: string) => void
  bondId?: string | null
  onReassign?: () => void
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

export function TaskCard({ task, userRole, onAction, bondId, onReassign }: TaskCardProps) {
  const [bondMembers, setBondMembers] = useState<BondMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (userRole === "dominant") {
      if (bondId) {
        loadBondMembers()
      } else {
        // No bond - load current user as the only option
        loadCurrentUser()
      }
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

  const handleReassign = async (newUserId: string) => {
    if (newUserId === task.assigned_to) return

    setReassigning(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: newUserId }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to reassign task"
        try {
          const errorText = await response.text()
          if (errorText) {
            const error = JSON.parse(errorText)
            errorMessage = error.error || errorMessage
          }
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      toast.success("Task reassigned successfully")
      // Trigger refresh if callback provided
      if (onReassign) {
        onReassign()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reassign task")
    } finally {
      setReassigning(false)
    }
  }

  const getMemberDisplayName = (member: BondMember) => {
    return member.user.display_name || member.user.full_name || member.user.email || "Unknown"
  }

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      const date = parseISO(dateString)
      if (isToday(date)) return "Today"
      if (isTomorrow(date)) return "Tomorrow"
      return format(date, "MMM dd, yyyy")
    } catch {
      return dateString
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-500 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-500 border-green-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-500 border-green-500/30"
      case "completed":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30"
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      case "cancelled":
        return "bg-gray-500/20 text-gray-500 border-gray-500/30"
      case "pending":
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-3 w-3" />
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />
      case "in_progress":
        return <Clock className="h-3 w-3" />
      case "cancelled":
        return <X className="h-3 w-3" />
      case "pending":
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const getProofIcon = (proofType: string | null) => {
    switch (proofType) {
      case "photo":
        return <Camera className="h-3 w-3" />
      case "video":
        return <Video className="h-3 w-3" />
      case "text":
        return <FileText className="h-3 w-3" />
      default:
        return null
    }
  }

  const dueDateFormatted = formatDueDate(task.due_date)

  return (
    <MagicCard className="relative overflow-hidden">
      <BorderBeam className="z-10" />
      <div className="relative z-20 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-display font-semibold text-primary">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace("_", " ")}</span>
            </Badge>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {dueDateFormatted && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{dueDateFormatted}</span>
            </div>
          )}
          {task.point_value > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-accent font-semibold">{task.point_value}</span>
              <span>points</span>
            </div>
          )}
          {task.proof_required && task.proof_type && (
            <div className="flex items-center gap-1">
              {getProofIcon(task.proof_type)}
              <span className="capitalize">Proof: {task.proof_type}</span>
            </div>
          )}
        </div>

        {/* Assign To Dropdown - Only for Dominants */}
        {userRole === "dominant" && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground shrink-0">Assign to:</span>
              {loadingMembers ? (
                <span className="text-sm text-muted-foreground">Loading members...</span>
              ) : bondMembers.length > 0 ? (
                <>
                  <Select
                    value={task.assigned_to}
                    onValueChange={handleReassign}
                    disabled={reassigning}
                  >
                    <SelectTrigger className="flex-1 min-w-0 bg-background">
                      <SelectValue>
                        {bondMembers.find(m => m.user_id === task.assigned_to) 
                          ? getMemberDisplayName(bondMembers.find(m => m.user_id === task.assigned_to)!)
                          : "Select member"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
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
                  {reassigning && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No members available
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <AddToNotionButtonGeneric
            tableName="tasks"
            itemId={task.id}
            syncEndpoint="/api/notion/sync-task"
            variant="ghost"
            size="sm"
            className="ml-auto"
          />
          {userRole === "submissive" && (
            <>
              {task.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => onAction("start", task.id)}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button
                  size="sm"
                  onClick={() => onAction("complete", task.id)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
              )}
              {task.status === "completed" && (
                <span className="text-sm text-muted-foreground">Awaiting approval</span>
              )}
              {task.status === "approved" && (
                <Badge variant="outline-success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </Badge>
              )}
            </>
          )}

          {userRole === "dominant" && (
            <>
              {task.status === "completed" && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAction("approve", task.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction("review", task.id)}
                  >
                    Review
                  </Button>
                </>
              )}
              {(task.status === "pending" || task.status === "in_progress") && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction("edit", task.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onAction("cancel", task.id)}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {task.status === "approved" && (
                <Badge variant="outline-success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </Badge>
              )}
            </>
          )}
        </div>
      </div>
    </MagicCard>
  )
}

