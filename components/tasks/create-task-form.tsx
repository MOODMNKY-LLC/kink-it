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
  all_day: z.boolean().default(false),
  reminder_minutes: z.number().optional(),
  recurring: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  point_value: z.number().min(0).default(0),
  proof_required: z.boolean().default(false),
  proof_type: z.enum(["photo", "video", "text"]).optional(),
  assigned_to: z.string().uuid("Invalid user ID").optional(),
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
      all_day: false,
      recurring: "none",
      assigned_to: partnerId || undefined,
    },
  })

  const proofRequired = watch("proof_required")

  const onFormSubmit = async (data: CreateTaskFormData) => {
    setIsSubmitting(true)
    try {
      // Convert empty strings to null for optional fields
      // For recurring tasks, handle time-only input
      let processedDueDate = data.due_date && data.due_date.trim() !== "" ? data.due_date : undefined
      
      // If recurring and due_date is time-only, keep it as-is (API will handle combining with date)
      if (data.recurring !== "none" && processedDueDate && processedDueDate.match(/^\d{2}:\d{2}$/)) {
        // Time format is fine for recurring tasks
      } else if (data.recurring === "none" && !processedDueDate) {
        // One-time tasks can have no due date
        processedDueDate = undefined
      }
      
      const cleanedData = {
        ...data,
        due_date: processedDueDate,
        description: data.description && data.description.trim() !== "" ? data.description : undefined,
        proof_type: data.proof_type || undefined,
        assigned_to: data.assigned_to || undefined,
        recurring: data.recurring || "none",
      }
      await onSubmit(cleanedData)
      toast.success("Task created successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task")
    } finally {
      setIsSubmitting(false)
    }
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recurring">Recurrence</Label>
              <Select
                defaultValue="none"
                onValueChange={(value) => setValue("recurring", value as "none" | "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time task</SelectItem>
                  <SelectItem value="daily">Everyday (Daily)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {watch("recurring") !== "none" && (
                <p className="text-xs text-muted-foreground">
                  Task will automatically regenerate based on the selected frequency
                </p>
              )}
            </div>

            {watch("recurring") === "none" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type={watch("all_day") ? "date" : "datetime-local"}
                    {...register("due_date")}
                    className="bg-background"
                  />
                </div>
                
                {watch("due_date") && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="all_day">All Day Event</Label>
                        <p className="text-xs text-muted-foreground">
                          Task due date without specific time
                        </p>
                      </div>
                      <Switch
                        id="all_day"
                        checked={watch("all_day")}
                        onCheckedChange={(checked) => {
                          setValue("all_day", checked)
                          // Clear due_date when switching to allow re-entry
                          if (checked) {
                            const currentDate = watch("due_date")
                            if (currentDate) {
                              // Extract date part only
                              const dateOnly = currentDate.split("T")[0]
                              setValue("due_date", dateOnly)
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminder_minutes">Reminder</Label>
                      <Select
                        onValueChange={(value) => 
                          setValue("reminder_minutes", value === "none" ? undefined : parseInt(value))
                        }
                        defaultValue="none"
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="No reminder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No reminder</SelectItem>
                          <SelectItem value="5">5 minutes before</SelectItem>
                          <SelectItem value="15">15 minutes before</SelectItem>
                          <SelectItem value="30">30 minutes before</SelectItem>
                          <SelectItem value="60">1 hour before</SelectItem>
                          <SelectItem value="120">2 hours before</SelectItem>
                          <SelectItem value="1440">1 day before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}

            {watch("recurring") !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="recurring_time">Time (for recurring tasks)</Label>
                <Input
                  id="recurring_time"
                  type="time"
                  {...register("due_date")}
                  className="bg-background"
                  placeholder="HH:MM"
                />
                <p className="text-xs text-muted-foreground">
                  Time when this task should be due each day/week/month
                </p>
              </div>
            )}
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
            {partnerId ? (
              <div className="p-3 bg-sidebar border border-border rounded-md">
                <p className="text-sm font-medium">{partnerName || "Partner"}</p>
                <p className="text-xs text-muted-foreground">Task will be assigned to your partner</p>
              </div>
            ) : (
              <div className="p-3 bg-sidebar border border-border rounded-md">
                <p className="text-sm font-medium">Unassigned</p>
                <p className="text-xs text-muted-foreground">
                  Task will be assigned to yourself. Link a partner in{" "}
                  <a href="/account/profile" className="text-primary hover:underline">
                    Profile Settings
                  </a>{" "}
                  to assign tasks to them.
                </p>
              </div>
            )}
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



