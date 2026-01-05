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

        const data = await response.json()
        setTasks(data.tasks || [])
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch tasks"))
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [userId, filters])

  // Set up Realtime subscription
  useEffect(() => {
    // Check if already subscribed
    if (channelRef.current) {
      const channel = channelRef.current
      if (channel.state === "SUBSCRIBED") {
        return
      }
    }

    // Create channels for both workspace and user-specific updates
    const workspaceTopic = `task:${userId}:changes`
    const userTopic = `task:user:${userId}:changes`

    const channel = supabase.channel("tasks-updates", {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    channelRef.current = channel

    // Set auth before subscribing
    supabase.realtime.setAuth()

    // Subscribe to workspace broadcasts
    channel
      .on("broadcast", { event: "INSERT" }, (payload) => {
        console.log("[Tasks] INSERT received:", payload)
        const newTask = payload.payload.new as Task
        if (newTask) {
          setTasks((prev) => [newTask, ...prev])
        }
      })
      .on("broadcast", { event: "UPDATE" }, (payload) => {
        console.log("[Tasks] UPDATE received:", payload)
        const updatedTask = payload.payload.new as Task
        if (updatedTask) {
          setTasks((prev) =>
            prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
          )
        }
      })
      .on("broadcast", { event: "DELETE" }, (payload) => {
        console.log("[Tasks] DELETE received:", payload)
        const deletedTask = payload.payload.old as Task
        if (deletedTask) {
          setTasks((prev) => prev.filter((task) => task.id !== deletedTask.id))
        }
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Tasks] Successfully subscribed to task updates")
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Tasks] Channel error:", err)
          setError(err || new Error("Failed to subscribe to task updates"))
        }
      })

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
        const error = await response.json()
        throw new Error(error.error || "Failed to update task")
      }

      const data = await response.json()
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
        const error = await response.json()
        throw new Error(error.error || "Failed to create task")
      }

      const data = await response.json()
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



