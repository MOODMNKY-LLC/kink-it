"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, AlertCircle, CheckCircle2, ArrowRight, Pause } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow, isPast, isToday, startOfDay, endOfDay } from "date-fns"
import Link from "next/link"
import type { Task } from "@/types/task"
import type { SubmissionState } from "@/types/profile"

interface TodaysTasksWidgetProps {
  userId: string
  limit?: number
}

export function TodaysTasksWidget({ userId, limit = 10 }: TodaysTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [submissionState, setSubmissionState] = useState<SubmissionState | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSubmissionState()
    fetchTodaysTasks()

    // Set up Realtime subscription for task updates
    const tasksChannel = supabase
      .channel("dashboard_todays_tasks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          fetchTodaysTasks()
        }
      )
      .subscribe()

    // Set up Realtime subscription for submission state
    const stateChannel = supabase
      .channel("dashboard_submission_state")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          fetchSubmissionState()
          fetchTodaysTasks() // Re-fetch tasks when state changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(stateChannel)
    }
  }, [userId])

  const fetchSubmissionState = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("submission_state")
        .eq("id", userId)
        .single()

      if (error) throw error
      setSubmissionState(data?.submission_state || null)
    } catch (error) {
      console.error("[TodaysTasksWidget] Error fetching submission state:", error)
    }
  }

  const fetchTodaysTasks = async () => {
    try {
      // Don't fetch tasks if paused
      if (submissionState === "paused") {
        setTasks([])
        setLoading(false)
        return
      }

      const todayStart = startOfDay(new Date())
      const todayEnd = endOfDay(new Date())

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", userId)
        .in("status", ["pending", "in_progress"])
        .or(`due_date.is.null,due_date.lte.${todayEnd.toISOString()}`)
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(limit)

      if (error) throw error

      // Filter to only show tasks due today or overdue
      const filteredTasks = (data || []).filter((task) => {
        if (!task.due_date) return true // Show tasks without due dates
        const due = new Date(task.due_date)
        return isPast(due) || isToday(due)
      })

      setTasks(filteredTasks)
      setLoading(false)
    } catch (error) {
      console.error("[TodaysTasksWidget] Error fetching tasks:", error)
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
      return { label: "Overdue", color: "text-red-600 dark:text-red-400", urgent: true }
    }
    if (isToday(due)) {
      return { label: "Due today", color: "text-orange-600 dark:text-orange-400", urgent: true }
    }
    return {
      label: formatDistanceToNow(due, { addSuffix: true }),
      color: "text-muted-foreground",
      urgent: false,
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Today's Tasks
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  // Show paused state message
  if (submissionState === "paused") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5" />
            Today's Tasks
          </CardTitle>
          <CardDescription>Submission state: Paused</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Pause className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tasks are paused</p>
            <p className="text-xs mt-1">
              Change your submission state to "Active" or "Low Energy" to see tasks
            </p>
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
          Today's Tasks
        </CardTitle>
        <CardDescription>
          Tasks due today or overdue ({tasks.length} {tasks.length === 1 ? "task" : "tasks"})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tasks due today</p>
            <p className="text-xs mt-1">Great job staying on top of things!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueDateStatus = getDueDateStatus(task.due_date)

              return (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    dueDateStatus?.urgent
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : "bg-card hover:bg-accent/50"
                  }`}
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
                    <div className="flex items-center gap-3 text-xs">
                      {dueDateStatus && (
                        <span
                          className={`flex items-center gap-1 font-medium ${dueDateStatus.color}`}
                        >
                          {dueDateStatus.urgent && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {!dueDateStatus.urgent && <Clock className="h-3 w-3" />}
                          {dueDateStatus.label}
                        </span>
                      )}
                      {task.point_value && (
                        <span className="text-muted-foreground">
                          • {task.point_value} pts
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
              <Link href="/tasks">
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
