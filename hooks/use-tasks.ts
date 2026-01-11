"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task } from "@/types/task"

interface UseTasksOptions {
  userId: string
  filters?: {
    status?: string
    assignedTo?: string
    assignedBy?: string
  }
}

/**
 * Hook for managing tasks with Realtime updates
 * Uses Supabase Realtime broadcast (not postgres_changes) for scalability
 * 
 * Topic patterns:
 * - `task:{workspace_id}:changes` - Workspace-wide task updates
 * - `task:user:{user_id}:changes` - User-specific task updates
 * Event: `INSERT`, `UPDATE`, `DELETE`
 */
export function useTasks({ userId, filters }: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<ReturnType<typeof createClient>["channel"] | null>(null)
  const supabase = createClient()

  // Fetch initial tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const params = new URLSearchParams()
        if (filters?.status) params.append("status", filters.status)
        if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo)
        if (filters?.assignedBy) params.append("assigned_by", filters.assignedBy)

        const response = await fetch(`/api/tasks?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch tasks")

        const responseText = await response.text()
        const data = responseText ? JSON.parse(responseText) : { tasks: [] }
        setTasks(data.tasks || [])
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch tasks"))
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [userId, filters])

  // Set up Realtime subscription using postgres_changes
  // This works in both local dev and production
  useEffect(() => {
    // Check if already subscribed
    if (channelRef.current) {
      const channel = channelRef.current
      if (channel.state === "SUBSCRIBED") {
        return
      }
    }

    // Use postgres_changes for reliable Realtime updates
    const channel = supabase
      .channel("tasks-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${userId}`,
        },
        (payload) => {
          console.log("[Tasks] INSERT received (assigned_to):", payload)
          const newTask = payload.new as Task
          if (newTask) {
            setTasks((prev) => {
              // Avoid duplicates
              if (prev.some((t) => t.id === newTask.id)) return prev
              return [newTask, ...prev]
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `assigned_by=eq.${userId}`,
        },
        (payload) => {
          console.log("[Tasks] INSERT received (assigned_by):", payload)
          const newTask = payload.new as Task
          if (newTask) {
            setTasks((prev) => {
              // Avoid duplicates
              if (prev.some((t) => t.id === newTask.id)) return prev
              return [newTask, ...prev]
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${userId}`,
        },
        (payload) => {
          console.log("[Tasks] UPDATE received (assigned_to):", payload)
          const updatedTask = payload.new as Task
          if (updatedTask) {
            setTasks((prev) =>
              prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
            )
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `assigned_by=eq.${userId}`,
        },
        (payload) => {
          console.log("[Tasks] UPDATE received (assigned_by):", payload)
          const updatedTask = payload.new as Task
          if (updatedTask) {
            setTasks((prev) =>
              prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
            )
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${userId}`,
        },
        (payload) => {
          console.log("[Tasks] DELETE received (assigned_to):", payload)
          const deletedTask = payload.old as Task
          if (deletedTask) {
            setTasks((prev) => prev.filter((task) => task.id !== deletedTask.id))
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `assigned_by=eq.${userId}`,
        },
        (payload) => {
          console.log("[Tasks] DELETE received (assigned_by):", payload)
          const deletedTask = payload.old as Task
          if (deletedTask) {
            setTasks((prev) => prev.filter((task) => task.id !== deletedTask.id))
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Tasks] Successfully subscribed to task updates")
          setError(null) // Clear any previous errors
        } else if (status === "CHANNEL_ERROR") {
          // Only log error if err is provided (connection retries pass undefined)
          // Realtime will automatically retry connection errors
          if (err) {
            const errorMessage = err?.message || err || "Failed to subscribe to task updates"
            console.warn("[Tasks] Channel error (will retry):", errorMessage)
            // Don't set error state for connection issues - Realtime handles retries automatically
            // Only set error for actual subscription rejections (e.g., RLS blocking)
            if (errorMessage.includes("permission") || errorMessage.includes("policy") || errorMessage.includes("RLS")) {
              setError(err instanceof Error ? err : new Error(errorMessage))
            }
          } else {
            // Connection retry - Realtime handles this automatically
            console.log("[Tasks] Connection retry in progress...")
          }
        } else if (status === "TIMED_OUT") {
          console.warn("[Tasks] Subscription timed out - Realtime will retry automatically")
          // Don't set error - Realtime handles retries
        } else if (status === "CLOSED") {
          console.log("[Tasks] Channel closed - will reconnect on next mount")
        }
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log("[Tasks] Unsubscribing from task updates")
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, supabase])

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to update task"
        try {
          const error = errorText ? JSON.parse(errorText) : {}
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const responseText = await response.text()
      const data = responseText ? JSON.parse(responseText) : {}
      // Update will come via Realtime, but update optimistically
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, ...data.task } : task))
      )
      return data.task
    } catch (err) {
      throw err
    }
  }

  const createTask = async (taskData: Partial<Task>) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to create task"
        try {
          const error = errorText ? JSON.parse(errorText) : {}
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const responseText = await response.text()
      const data = responseText ? JSON.parse(responseText) : {}
      // Task will come via Realtime, but add optimistically
      setTasks((prev) => [data.task, ...prev])
      return data.task
    } catch (err) {
      throw err
    }
  }

  return {
    tasks,
    isLoading,
    error,
    updateTask,
    createTask,
    refetch: async () => {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo)
      if (filters?.assignedBy) params.append("assigned_by", filters.assignedBy)

      const response = await fetch(`/api/tasks?${params.toString()}`)
      const data = await response.json()
      setTasks(data.tasks || [])
      setIsLoading(false)
    },
  }
}
