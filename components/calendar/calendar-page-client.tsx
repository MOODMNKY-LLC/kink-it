"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar as CalendarIcon, ExternalLink, RefreshCw, Loader2, Clock } from "lucide-react"
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
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([])
  const supabase = createClient()
  const { status: notionSyncStatus, isSynced: isNotionSynced } = useNotionSyncStatus()

  useEffect(() => {
    loadEvents()
    loadUserGoogleEmail()
  }, [bondId])

  useEffect(() => {
    if (selectedDate) {
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start_date)
        return isSameDay(eventDate, selectedDate)
      })
      setSelectedEvents(dayEvents)
    } else {
      setSelectedEvents([])
    }
  }, [selectedDate, events])

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
    if (!userGoogleEmail) {
      setShowGoogleEmailDialog(true)
      return
    }

    if (!event.ical_uid) {
      toast.error("Event is missing calendar identifier. Please refresh and try again.")
      return
    }

    try {
      const startDate = new Date(event.start_date)
      const endDate = event.end_date
        ? new Date(event.end_date)
        : new Date(startDate.getTime() + 60 * 60 * 1000)

      const url = generateNotionCalendarUrl({
        accountEmail: userGoogleEmail,
        iCalUID: event.ical_uid,
        startDate: startDate,
        endDate: endDate,
        title: event.title,
        ref: "kink-it",
      })

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
      const startOfMonthDate = selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date())
      const endOfMonthDate = endOfMonth(startOfMonthDate)
      params.append("start_date", startOfMonthDate.toISOString())
      params.append("end_date", endOfMonthDate.toISOString())

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
        
        if (isNotionSynced && newEvent) {
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

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date)
      return isSameDay(eventDate, date)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-foreground/70">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Create Calendar Event
              </DialogTitle>
              <DialogDescription className="text-foreground/70">
                Add a new event to your calendar
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Event Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type" className="text-foreground">Event Type</Label>
                <Select name="event_type" defaultValue="other">
                  <SelectTrigger className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/20">
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-foreground">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-foreground">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    defaultValue={selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                    className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time" className="text-foreground">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-foreground">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time" className="text-foreground">End Time</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    className="bg-muted/50 border-border text-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
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
                <Label htmlFor="all_day" className="text-foreground">All Day Event</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder_minutes" className="text-foreground">Reminder (minutes before)</Label>
                <Input
                  id="reminder_minutes"
                  name="reminder_minutes"
                  type="number"
                  placeholder="60"
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-border text-foreground hover:bg-muted/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
          <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
          
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Calendar
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Select a date to view events
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm w-full"
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-6",
                caption: "flex justify-center pt-2 pb-4 relative items-center mb-2",
                caption_label: "text-lg font-semibold text-foreground",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-10 w-10 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 bg-transparent p-0 opacity-70 hover:opacity-100 text-foreground hover:bg-primary/10 border border-primary/20 rounded-md transition-all hover:scale-105 touch-target-small"
                ),
                nav_button_previous: "absolute left-2",
                nav_button_next: "absolute right-2",
                table: "w-full border-collapse",
                head_row: "flex mb-2",
                head_cell: "text-foreground/60 rounded-md w-12 font-medium text-sm flex-1",
                row: "flex w-full mb-1",
                cell: "h-10 w-10 sm:h-12 sm:w-12 text-center text-sm p-0 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/30 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-10 w-10 sm:h-12 sm:w-12 p-0 font-medium text-foreground aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200 touch-target-small",
                  "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-md data-[selected]:shadow-primary/30",
                  "data-[today]:bg-primary/20 data-[today]:text-primary data-[today]:font-bold data-[today]:border-2 data-[today]:border-primary/50"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md shadow-primary/30",
                day_today: "bg-primary/20 text-primary font-bold border-2 border-primary/50",
                day_outside: "day-outside text-foreground/30 opacity-50 aria-selected:bg-accent/30 aria-selected:text-foreground/50 aria-selected:opacity-30",
                day_disabled: "text-foreground/20 opacity-30 cursor-not-allowed",
                day_range_middle: "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                DayButton: ({ day, modifiers, className, ...props }) => {
                  const dateEvents = getEventsForDate(day.date)
                  const hasEvents = dateEvents.length > 0
                  
                  return (
                    <button
                      {...props}
                      className={cn(
                        className,
                        "text-foreground",
                        hasEvents && "relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary"
                      )}
                    >
                      {day.date.getDate()}
                    </button>
                  )
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          <Card className="relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
            <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}
              </CardTitle>
              <CardDescription className="text-foreground/70">
                {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3 max-h-[600px] overflow-y-auto">
              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-foreground/60 mb-4" />
                  <p className="text-sm text-foreground/70">
                    No events scheduled for this date
                  </p>
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base text-foreground mb-1">{event.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getTypeColor(event.event_type)}>
                              {EVENT_TYPES.find((t) => t.value === event.event_type)?.label}
                            </Badge>
                            {!event.all_day && (
                              <div className="flex items-center gap-1 text-xs text-foreground/70">
                                <Clock className="h-3 w-3" />
                                {formatEventTime(event.start_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {event.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-foreground/80">{event.description}</p>
                      </CardContent>
                    )}
                    <CardContent className="pt-0 flex justify-end gap-2">
                      {isNotionSynced && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncToNotion(event)}
                          disabled={syncingEventId === event.id}
                          className="bg-secondary/5 hover:bg-secondary/10 border-secondary/20 text-foreground"
                        >
                          {syncingEventId === event.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenInNotionCalendar(event)}
                        className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Google Account Email Setup Dialog */}
      <Dialog open={showGoogleEmailDialog} onOpenChange={setShowGoogleEmailDialog}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Set Google Account Email
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              Enter your Google account email to enable Notion Calendar integration.
              This email should match the Google account connected to your Notion Calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google_email" className="text-foreground">Google Account Email</Label>
              <Input
                id="google_email"
                type="email"
                placeholder="[email protected]"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm"
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
                className="border-border text-foreground hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSetGoogleEmail}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
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
