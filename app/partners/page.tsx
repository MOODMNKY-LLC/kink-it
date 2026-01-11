import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function PartnersPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Multi-Partner Support",
        description: "Manage multiple relationships and partners",
        icon: Users,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Partner Support</CardTitle>
            <CardDescription>
              Future-facing module for polyamorous D/s relationships, multiple submissives per Dominant, separate
              profiles, contracts, task lists, and analytics per relationship.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-2">
                Coming in Phase 5
              </Badge>

              <p className="text-muted-foreground">
                This module will support polyamorous D/s relationships and dynamics with multiple partners. Each
                relationship will have separate contracts, task lists, analytics, and data isolation while maintaining
                privacy controls.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Multi-Relationship Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Create multiple relationship profiles</li>
                    <li>Separate contracts per relationship</li>
                    <li>Separate task lists per relationship</li>
                    <li>Separate analytics per relationship</li>
                    <li>Cross-relationship insights (optional)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Relationship Switching</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Switch between active relationships</li>
                    <li>View relationship-specific data</li>
                    <li>Maintain relationship boundaries</li>
                    <li>Privacy controls per relationship</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  This module is planned for Phase 5 of development. It will enable support for polyamorous D/s
                  relationships and multiple partner dynamics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  )
}
