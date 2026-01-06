import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function RulesPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Rules & Protocols",
        description: "Manage standing rules, situational protocols, and expectations",
        icon: FileText,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rules & Protocols Management</CardTitle>
            <CardDescription>
              Create and manage standing rules, situational protocols, temporary expectations, and protocol templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This module allows you to manage the rules and protocols that govern your D/s dynamic. Create standing
                rules that are always active, situational rules for specific contexts, temporary expectations for
                time-limited periods, and reusable protocol templates.
              </p>

              {profile.dynamic_role === "dominant" && (
                <div className="space-y-2">
                  <h3 className="font-semibold">For Dominants</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Create, edit, and deactivate rules</li>
                    <li>Create protocol templates (morning routine, bedtime ritual, etc.)</li>
                    <li>Link rules to tasks</li>
                    <li>View violation history</li>
                    <li>Review and update rules periodically</li>
                  </ul>
                </div>
              )}

              {profile.dynamic_role === "submissive" && (
                <div className="space-y-2">
                  <h3 className="font-semibold">For Submissives</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>View active rules</li>
                    <li>Filter by type or context</li>
                    <li>See linked tasks</li>
                    <li>View rule history</li>
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  This module is currently under development. Full functionality will be available in Phase 2 of
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




