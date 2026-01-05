import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CalendarPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Calendar & Scheduling",
        description: "Scenes calendar, task timeline, important dates, and ritual reminders",
        icon: Calendar,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar & Scheduling Tools</CardTitle>
            <CardDescription>
              Scenes calendar, task timeline, important dates, ritual reminders, and optional personal calendar
              integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This module provides comprehensive calendar and scheduling tools for scenes, tasks, important dates, and
                rituals. Visual timelines help track due dates, completion patterns, and upcoming events.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Scene Scheduling</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Create scene events</li>
                    <li>Set date, time, duration</li>
                    <li>Link to scene negotiation</li>
                    <li>Set reminders</li>
                    <li>Mark as completed</li>
                    <li>Link to scene log</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Task Timeline</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Visual timeline of tasks</li>
                    <li>Due date tracking</li>
                    <li>Completion tracking</li>
                    <li>Overdue alerts</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Important Dates</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Relationship milestones</li>
                    <li>Contract renewal dates</li>
                    <li>Scheduled check-ins</li>
                    <li>Custom important dates</li>
                    <li>Reminders</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Ritual Reminders</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Daily ritual reminders</li>
                    <li>Weekly ritual reminders</li>
                    <li>Custom ritual schedules</li>
                    <li>Reminder notifications</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  This module is currently under development. Full functionality will be available in Phase 3 of
                  development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  )
}


