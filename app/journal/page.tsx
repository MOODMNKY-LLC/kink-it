import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function JournalPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Journal & Reflection",
        description: "Personal and shared journal entries, scene logs, and gratitude",
        icon: BookOpen,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal & Reflection Tools</CardTitle>
            <CardDescription>
              Personal and shared journal entries, tags, prompted entries, gratitude logs, and scene logs with structured
              metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This module provides comprehensive journaling tools for personal reflection, shared entries, gratitude
                tracking, and detailed scene documentation. Personal entries are visible to your Dominant by default,
                maintaining transparency while allowing private reflection.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Journal Types</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Personal Journal (visible to Dominant by default)</li>
                    <li>Shared Journal (visible to both partners)</li>
                    <li>Gratitude Log (daily gratitude entries)</li>
                    <li>Scene Logs (structured scene documentation)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Rich text editing</li>
                    <li>Tags and categorization</li>
                    <li>Search and filtering</li>
                    <li>Entry templates</li>
                    <li>Prompted entries</li>
                    <li>Entry sharing (personal → shared)</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Scene Logs Include</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Date, time, duration</li>
                  <li>Participants</li>
                  <li>Activities performed</li>
                  <li>Consent details</li>
                  <li>Aftercare provided</li>
                  <li>Emotional state</li>
                  <li>What went well / improvements</li>
                  <li>Photos (optional, with consent)</li>
                </ul>
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


