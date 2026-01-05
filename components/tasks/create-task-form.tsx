"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, X } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { TaskPriority, ProofType } from "@/types/task"

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
  point_value: z.number().min(0).default(0),
  proof_required: z.boolean().default(false),
  proof_type: z.enum(["photo", "video", "text"]).optional(),
  assigned_to: z.string().uuid("Invalid user ID"),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

interface CreateTaskFormProps {
  partnerId: string | null
  partnerName?: string
  onSubmit: (data: CreateTaskFormData) => Promise<void>
  onCancel: () => void
}

export function CreateTaskForm({
  partnerId,
  partnerName,
  onSubmit,
  onCancel,
}: CreateTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "medium",
      point_value: 0,
      proof_required: false,
      assigned_to: partnerId || "",
    },
  })

  const proofRequired = watch("proof_required")

  const onFormSubmit = async (data: CreateTaskFormData) => {
    if (!partnerId) {
      toast.error("No partner assigned")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success("Task created successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!partnerId) {
    return (
      <div className="p-6 bg-sidebar border border-border rounded-lg space-y-3">
        <p className="text-muted-foreground">
          No partner assigned. Please link your partner to create tasks.
        </p>
        <a
          href="/account/profile"
          className="inline-flex items-center text-primary hover:underline text-sm font-medium"
        >
          Go to Profile Settings →
        </a>
      </div>
    )
  }

  return (
    <MagicCard className="relative overflow-hidden">
      <BorderBeam className="z-10" />
      <div className="relative z-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-primary">Create New Task</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Task title"
              className="bg-background"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Task description"
              className="bg-background min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                defaultValue="medium"
                onValueChange={(value) => setValue("priority", value as TaskPriority)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="point_value">Points</Label>
              <Input
                id="point_value"
                type="number"
                min="0"
                {...register("point_value", { valueAsNumber: true })}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              {...register("due_date")}
              className="bg-background"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="proof_required">Proof Required</Label>
                <p className="text-xs text-muted-foreground">
                  Require photo, video, or text proof of completion
                </p>
              </div>
              <Switch
                id="proof_required"
                checked={proofRequired}
                onCheckedChange={(checked) => setValue("proof_required", checked)}
              />
            </div>

            {proofRequired && (
              <div className="space-y-2">
                <Label htmlFor="proof_type">Proof Type</Label>
                <Select
                  onValueChange={(value) => setValue("proof_type", value as ProofType)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <div className="p-3 bg-sidebar border border-border rounded-md">
              <p className="text-sm font-medium">{partnerName || "Partner"}</p>
              <p className="text-xs text-muted-foreground">Task will be assigned to your partner</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MagicCard>
  )
}



