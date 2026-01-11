"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataRecoveryFlow } from "@/components/notion/data-recovery-flow"
import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"
import { AlertCircle, CheckCircle2, Database } from "lucide-react"

interface NotionRecoveryStepProps {
  onNext: (data?: Record<string, any>) => void
  onBack?: () => void
  initialData?: Record<string, any>
}

export default function NotionRecoveryStep({
  onNext,
  onBack,
  initialData,
}: NotionRecoveryStepProps) {
  const { scenario, isLoading, checkRecovery } = useNotionRecoveryDetection()
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false)
  const [recoveryCompleted, setRecoveryCompleted] = useState(false)

  // Refresh recovery check when flow closes
  useEffect(() => {
    if (!showRecoveryFlow && recoveryCompleted) {
      checkRecovery()
    }
  }, [showRecoveryFlow, recoveryCompleted, checkRecovery])

  // If no recovery needed, skip this step
  useEffect(() => {
    if (!isLoading && scenario && !scenario.needsRecovery) {
      // Auto-advance if no recovery needed
      setTimeout(() => {
        onNext({ recovery_checked: true, recovery_needed: false })
      }, 1000)
    }
  }, [isLoading, scenario, onNext])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Checking for recoverable data...</p>
        </div>
      </div>
    )
  }

  if (!scenario?.needsRecovery) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              All Set!
            </CardTitle>
            <CardDescription>
              Your data is synced. No recovery needed.
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="flex justify-end">
          <Button onClick={() => onNext({ recovery_checked: true, recovery_needed: false })}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Recover Your Data</h2>
        <p className="text-muted-foreground">
          We found data in your Notion workspace that can be recovered to KINK IT.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Returning user?</strong> Lost your data? No worries—we've got you covered! We can
          recover your data from your existing Notion template or sync your Supabase data back to
          Notion.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Available Databases
          </CardTitle>
          <CardDescription>{scenario.reason}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {scenario.availableDatabases.map((db) => (
              <div
                key={db.databaseId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{db.databaseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {db.supabaseRecordCount === 0
                      ? "No records in KINK IT - ready to recover"
                      : `${db.supabaseRecordCount} records in KINK IT`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>How it works:</strong> We'll retrieve your data from Notion, match it with
              existing records, and help you resolve any conflicts. Supabase is your source of truth,
              but you can choose to keep Notion data if you prefer.
            </p>
          </div>

          <Button
            onClick={() => setShowRecoveryFlow(true)}
            className="w-full"
            size="lg"
          >
            Start Recovery
          </Button>

          <Button
            onClick={() => onNext({ recovery_checked: true, recovery_skipped: true })}
            variant="outline"
            className="w-full"
          >
            Skip for Now
          </Button>
        </CardContent>
      </Card>

      <DataRecoveryFlow
        open={showRecoveryFlow}
        onOpenChange={(open) => {
          setShowRecoveryFlow(open)
          if (!open) {
            // Check if recovery completed
            checkRecovery().then(() => {
              // If recovery completed, scenario should update
              // User can proceed or recovery flow will show again if still needed
            })
          }
        }}
      />

      {onBack && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
