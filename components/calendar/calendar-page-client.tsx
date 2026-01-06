"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar as CalendarIcon, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { generateNotionCalendarUrl, openInNotionCalendar, isValidGoogleEmail } from "@/lib/notion-calendar"
import { useNotionSyncStatus } from "@/components/playground/shared/use-notion-sync-status"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_type: "scene" | "task_deadline" | "check_in" | "ritual" | "milestone" | "other"
  start_date: string
  end_date: string | null
  all_day: boolean
  reminder_minutes: number | null
  ical_uid: string | null
}

interface CalendarPageClientProps {
  userId: string
  bondId: string | null
}

const EVENT_TYPES = [
  { value: "scene", label: "Scene", color: "bg-primary/20 text-primary border-primary/40" },
  { value: "task_deadline", label: "Task Deadline", color: "bg-warning/20 text-warning border-warning/40" },
  { value: "check_in", label: "Check-In", color: "bg-accent/20 text-accent border-accent/40" },
  { value: "ritual", label: "Ritual", color: "bg-secondary/20 text-secondary-foreground border-secondary/40" },
  { value: "milestone", label: "Milestone", color: "bg-success/20 text-success border-success/40" },
  { value: "other", label: "Other", color: "bg-muted text-muted-foreground" },
]

export function CalendarPageClient({ userId, bondId }: CalendarPageClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showGoogleEmailDialog, setShowGoogleEmailDialog] = useState(false)
  const [googleEmail, setGoogleEmail] = useState<string>("")
  const [userGoogleEmail, setUserGoogleEmail] = useState<string | null>(null)
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const supabase = createClient()
  const { status: notionSyncStatus, isSynced: isNotionSynced } = useNotionSyncStatus()

  useEffect(() => {
    loadEvents()
    loadUserGoogleEmail()
  }, [bondId])

  const loadUserGoogleEmail = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("google_account_email")
        .eq("id", userId)
        .single()

      if (profile?.google_account_email) {
        setUserGoogleEmail(profile.google_account_email)
      }
    } catch (error) {
      console.error("Error loading Google account email:", error)
    }
  }

  const handleSetGoogleEmail = async () => {
    if (!isValidGoogleEmail(googleEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ google_account_email: googleEmail })
        .eq("id", userId)

      if (error) throw error

      setUserGoogleEmail(googleEmail)
      setShowGoogleEmailDialog(false)
      setGoogleEmail("")
      toast.success("Google account email saved")
    } catch (error) {
      console.error("Error saving Google account email:", error)
      toast.error("Failed to save Google account email")
    }
  }

  const handleOpenInNotionCalendar = async (event: CalendarEvent) => {
    // Check if user has Google account email set
    if (!userGoogleEmail) {
      setShowGoogleEmailDialog(true)
      return
    }

    // Check if event has iCalUID
    if (!event.ical_uid) {
      toast.error("Event is missing calendar identifier. Please refresh and try again.")
      return
    }

    try {
      // Calculate end date (use end_date or default to 1 hour after start)
      const startDate = new Date(event.start_date)
      const endDate = event.end_date 
        ? new Date(event.end_date)
        : new Date(startDate.getTime() + 60 * 60 * 1000) // Default: 1 hour

      // Generate Notion Calendar URL
      const url = generateNotionCalendarUrl({
        accountEmail: userGoogleEmail,
        iCalUID: event.ical_uid,
        startDate: startDate,
        endDate: endDate,
        title: event.title,
        ref: "kink-it",
      })

      // Open in Notion Calendar
      await openInNotionCalendar(url)
      toast.success("Opening in Notion Calendar...")
    } catch (error) {
      console.error("Error opening in Notion Calendar:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to open in Notion Calendar"
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: "Download",
          onClick: () => window.open("https://www.notion.so/calendar", "_blank"),
        },
      })
    }
  }

  const handleSyncToNotion = async (event: CalendarEvent) => {
    if (!isNotionSynced) {
      toast.error("Notion database not synced", {
        description: "Please sync your Notion template in Account Settings to enable calendar syncing.",
        duration: 5000,
      })
      return
    }

    setSyncingEventId(event.id)
    try {
      const response = await fetch("/api/notion/sync-calendar-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync to Notion")
      }

      toast.success("Event synced to Notion successfully!", {
        description: "The event is now available in your Notion Calendar Events database.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Failed to sync event to Notion:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to sync to Notion",
        {
          description: "Make sure your Notion template is synced and you have a Calendar Events database.",
          duration: 5000,
        }
      )
    } finally {
      setSyncingEventId(null)
    }
  }

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (bondId) params.append("bond_id", bondId)
      // Load events for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)
      params.append("start_date", startOfMonth.toISOString())
      params.append("end_date", endOfMonth.toISOString())

      const response = await fetch(`/api/calendar?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setEvents(data.events || [])
      } else {
        toast.error(data.error || "Failed to load events")
      }
    } catch (error) {
      toast.error("Failed to load events")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEvent = async (formData: FormData) => {
    try {
      const startDate = formData.get("start_date") as string
      const startTime = formData.get("start_time") as string
      const allDay = formData.get("all_day") === "on"

      let startDateTime = startDate
      if (!allDay && startTime) {
        startDateTime = `${startDate}T${startTime}:00`
      }

      const endDate = formData.get("end_date") as string
      const endTime = formData.get("end_time") as string
      let endDateTime = endDate || null
      if (endDate && !allDay && endTime) {
        endDateTime = `${endDate}T${endTime}:00`
      }

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          event_type: formData.get("event_type"),
          start_date: startDateTime,
          end_date: endDateTime,
          all_day: allDay,
          reminder_minutes: formData.get("reminder_minutes")
            ? parseInt(formData.get("reminder_minutes") as string)
            : null,
          bond_id: bondId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Event created successfully")
        setShowCreateDialog(false)
        const newEvent = data.event as CalendarEvent
        
        // Optionally auto-sync to Notion if template is synced
        if (isNotionSynced && newEvent) {
          // Auto-sync after a short delay
          setTimeout(() => {
            handleSyncToNotion(newEvent)
          }, 1000)
        }
        
        loadEvents()
      } else {
        toast.error(data.error || "Failed to create event")
      }
    } catch (error) {
      toast.error("Failed to create event")
      console.error(error)
    }
  }

  const getTypeColor = (type: string) => {
    const typeInfo = EVENT_TYPES.find((t) => t.value === type)
    return typeInfo?.color || "bg-muted text-muted-foreground"
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: dateString.includes("T") ? "numeric" : undefined,
      minute: dateString.includes("T") ? "2-digit" : undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20">
            <DialogHeader>
              <DialogTitle>Create Calendar Event</DialogTitle>
              <DialogDescription>
                Add a new event to your calendar
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <Select name="event_type" defaultValue="other">
                  <SelectTrigger className="bg-muted/50 border-border backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    defaultValue={selectedDate}
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all_day"
                  name="all_day"
                  className="rounded border-border"
                />
                <Label htmlFor="all_day">All Day Event</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder_minutes">Reminder (minutes before)</Label>
                <Input
                  id="reminder_minutes"
                  name="reminder_minutes"
                  type="number"
                  placeholder="60"
                  className="bg-muted/50 border-border backdrop-blur-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-foreground/60 mb-4" />
            <p className="text-foreground/70 text-center">
              No events scheduled. Create your first event to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="border-primary/20 bg-card/90 backdrop-blur-xl hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg text-foreground">{event.title}</CardTitle>
                      <Badge className={getTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    <CardDescription className="text-foreground/70">
                      {formatEventDate(event.start_date)}
                      {event.end_date && ` - ${formatEventDate(event.end_date)}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {event.description && (
                <CardContent>
                  <p className="text-sm text-foreground/80">{event.description}</p>
                </CardContent>
              )}
              <CardContent>
                <div className="flex justify-end gap-2">
                  {isNotionSynced && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncToNotion(event)}
                      disabled={syncingEventId === event.id}
                      className="bg-secondary/5 hover:bg-secondary/10 border-secondary/20"
                    >
                      {syncingEventId === event.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync to Notion
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenInNotionCalendar(event)}
                    className="bg-primary/5 hover:bg-primary/10 border-primary/20"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Notion Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Google Account Email Setup Dialog */}
      <Dialog open={showGoogleEmailDialog} onOpenChange={setShowGoogleEmailDialog}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle>Set Google Account Email</DialogTitle>
            <DialogDescription>
              Enter your Google account email to enable Notion Calendar integration.
              This email should match the Google account connected to your Notion Calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google_email">Google Account Email</Label>
              <Input
                id="google_email"
                type="email"
                placeholder="[email protected]"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="bg-muted/50 border-border backdrop-blur-sm"
              />
              <p className="text-xs text-foreground/70">
                This email is used to generate calendar links for Notion Calendar.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowGoogleEmailDialog(false)
                  setGoogleEmail("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSetGoogleEmail}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

