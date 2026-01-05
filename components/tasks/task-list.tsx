"use client"

import { TaskCard } from "./task-card"
import type { Task } from "@/types/task"
import type { DynamicRole } from "@/types/profile"

interface TaskListProps {
  tasks: Task[]
  userRole: DynamicRole
  onTaskAction: (action: string, taskId: string) => void
  isLoading?: boolean
}

export function TaskList({ tasks, userRole, onTaskAction, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-sidebar rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground">
          {userRole === "dominant"
            ? "No tasks assigned yet. Create your first task to get started."
            : "No tasks assigned. Your Dominant will assign tasks when ready."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} userRole={userRole} onAction={onTaskAction} />
      ))}
    </div>
  )
}



