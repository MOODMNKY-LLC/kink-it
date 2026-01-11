"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow, isPast, isToday } from "date-fns"
import Link from "next/link"
import type { Task } from "@/types/task"

interface PendingTasksWidgetProps {
  userId: string
  partnerId: string | null
  limit?: number
}

export function PendingTasksWidget({
  userId,
  partnerId,
  limit = 5,
}: PendingTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!partnerId) {
      setLoading(false)
      return
    }

    fetchPendingTasks()

    // Set up Realtime subscription for task updates
    const channel = supabase
      .channel("dashboard_pending_tasks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${partnerId}`,
        },
        () => {
          fetchPendingTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, partnerId])

  const fetchPendingTasks = async () => {
    if (!partnerId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(display_name, full_name, email)
        `
        )
        .eq("assigned_to", partnerId)
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: false })
        .limit(limit)

      if (error) throw error

      setTasks(data || [])
      setLoading(false)
    } catch (error) {
      console.error("[PendingTasksWidget] Error fetching tasks:", error)
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null

    const due = new Date(dueDate)
    if (isPast(due) && !isToday(due)) {
      return { label: "Overdue", color: "text-red-600 dark:text-red-400" }
    }
    if (isToday(due)) {
      return { label: "Due today", color: "text-orange-600 dark:text-orange-400" }
    }
    return {
      label: formatDistanceToNow(due, { addSuffix: true }),
      color: "text-muted-foreground",
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Tasks
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!partnerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Tasks
          </CardTitle>
          <CardDescription>No partner linked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Link a partner to see their pending tasks
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pending Tasks
        </CardTitle>
        <CardDescription>
          Tasks assigned to your partner that need attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No pending tasks</p>
            <p className="text-xs mt-1">All tasks are completed or approved</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueDateStatus = getDueDateStatus(task.due_date)
              const partnerName =
                task.assigned_to_profile?.display_name ||
                task.assigned_to_profile?.full_name ||
                task.assigned_to_profile?.email?.split("@")[0] ||
                "Partner"

              return (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium break-words break-all overflow-wrap-anywhere">{task.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                      {task.status === "in_progress" && (
                        <Badge variant="outline" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground break-words break-all overflow-wrap-anywhere line-clamp-1 mb-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {dueDateStatus && (
                        <span className={`flex items-center gap-1 ${dueDateStatus.color}`}>
                          <Clock className="h-3 w-3" />
                          {dueDateStatus.label}
                        </span>
                      )}
                      {!dueDateStatus && task.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                        </span>
                      )}
                      {task.point_value && (
                        <span className="flex items-center gap-1">
                          <span>•</span>
                          {task.point_value} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                  >
                    <Link href={`/tasks?id=${task.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )
            })}
            <Button asChild variant="outline" className="w-full mt-4" size="sm">
              <Link href="/tasks?status=pending">
                View All Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
