"use client"

import { useState } from "react"
import { TaskList } from "./task-list"
import { CreateTaskForm } from "./create-task-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { toast } from "sonner"
import type { DynamicRole } from "@/types/profile"
import type { Task } from "@/types/task"

interface TasksPageClientProps {
  userId: string
  userRole: DynamicRole
  partnerId: string | null
  bondId?: string | null
}

export function TasksPageClient({ userId, userRole, partnerId, bondId }: TasksPageClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { tasks, isLoading, updateTask, createTask, refetch } = useTasks({
    userId,
  })

  const handleTaskAction = async (action: string, taskId: string) => {
    try {
      switch (action) {
        case "start":
          await updateTask(taskId, { status: "in_progress" })
          toast.success("Task started")
          break
        case "complete":
          await updateTask(taskId, { status: "completed" })
          toast.success("Task marked as complete")
          break
        case "approve":
          await updateTask(taskId, { status: "approved" })
          toast.success("Task approved")
          break
        case "review":
          // TODO: Open review modal
          toast.info("Review feature coming soon")
          break
        case "edit":
          // TODO: Open edit modal
          toast.info("Edit feature coming soon")
          break
        case "cancel":
          await updateTask(taskId, { status: "cancelled" })
          toast.success("Task cancelled")
          break
        case "delete":
          // Delete handled by SeedDataActionsMenu component
          await refetch()
          break
        case "refresh":
          // Refresh task list - handled by useTasks hook automatically
          await refetch()
          break
        default:
          console.warn("Unknown action:", action)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to perform action")
    }
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      await createTask({
        ...taskData,
        // assigned_to is optional - if not provided, API will default to self-assignment
        assigned_to: taskData.assigned_to || partnerId || undefined,
      })
      setShowCreateForm(false)
      toast.success("Task created successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task")
      throw error
    }
  }

  if (showCreateForm && userRole === "dominant") {
    return (
      <CreateTaskForm
        partnerId={partnerId}
        onSubmit={handleCreateTask}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }

  return (
    <>
      {userRole === "dominant" && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      )}

      <TaskList
        tasks={tasks}
        userRole={userRole}
        onTaskAction={handleTaskAction}
        isLoading={isLoading}
        onCreateTask={() => setShowCreateForm(true)}
        bondId={bondId}
        onReassign={refetch}
      />
    </>
  )
}
