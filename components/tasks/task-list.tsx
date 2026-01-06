"use client"

import { TaskCard } from "./task-card"
import type { Task } from "@/types/task"
import type { DynamicRole } from "@/types/profile"
import { KinkyEmptyState } from "@/components/kinky/kinky-empty-state"

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
      <KinkyEmptyState
        title={userRole === "dominant" ? "No tasks assigned yet" : "No tasks assigned"}
        description={
          userRole === "dominant"
            ? "Create your first task to get started."
            : "Your Dominant will assign tasks when ready."
        }
        actionLabel={userRole === "dominant" ? "Create Task" : undefined}
        onAction={userRole === "dominant" ? () => window.location.href = "/tasks/create" : undefined}
        size="md"
      />
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



