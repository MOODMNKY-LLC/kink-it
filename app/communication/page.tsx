import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CommunicationPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Communication Hub",
        description: "Private messaging, daily check-ins, and scene debriefs",
        icon: MessageSquare,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Communication Tools</CardTitle>
            <CardDescription>
              Private messaging, daily check-ins (Green/Yellow/Red), prompted conversations, and scene debrief forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This module provides comprehensive communication tools designed specifically for D/s relationships,
                including private messaging, structured check-ins, conversation prompts, and scene debrief forms.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Messaging & Check-Ins</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Direct messages between partners</li>
                    <li>Message threading</li>
                    <li>Read receipts</li>
                    <li>Daily check-ins (Green/Yellow/Red)</li>
                    <li>Check-in history and patterns</li>
                    <li>Alerts for consecutive Yellow/Red days</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Conversations & Debriefs</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Pre-written conversation starters</li>
                    <li>Scheduled check-in prompts</li>
                    <li>Reflection prompts</li>
                    <li>Relationship growth questions</li>
                    <li>Structured scene debrief forms</li>
                    <li>Aftercare needs tracking</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  This module is currently under development. Full functionality will be available in Phase 2 of
                  development. Chat components are temporarily disabled until this module is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  )
}


