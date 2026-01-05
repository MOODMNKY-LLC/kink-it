import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Scale } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ContractPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Contract & Consent Management",
        description: "Version-controlled relationship contracts with signatures and consent tracking",
        icon: Scale,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Relationship Contracts (Covenants)</CardTitle>
            <CardDescription>
              Create, version, sign, and manage relationship contracts with comprehensive consent tracking and safety
              tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This module provides tools for creating relationship contracts, tracking consent history, managing
                safewords, and maintaining an audit trail of all consent decisions. Contracts can be versioned,
                digitally signed, and renewed with amendment proposals.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Contract Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Create relationship contracts (Covenants)</li>
                    <li>Version control with history</li>
                    <li>Digital signatures</li>
                    <li>Renewal reminders</li>
                    <li>Amendment proposals</li>
                    <li>Approval workflow</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Consent & Safety</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Consent history/audit trail</li>
                    <li>Pre-scene negotiation checklists</li>
                    <li>Safewords/signals reference cards</li>
                    <li>Aftercare agreements</li>
                    <li>Consent withdrawal tracking</li>
                    <li>Emergency contact information</li>
                  </ul>
                </div>
              </div>

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


