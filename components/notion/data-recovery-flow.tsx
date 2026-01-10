"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConflictResolution } from "./conflict-resolution"
import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"
import type { Conflict } from "@/lib/notion/conflict-detection-service"
import type { ResolutionChoice } from "@/lib/notion/conflict-resolution-service"
import type { DatabaseType } from "@/lib/notion/data-transformation"
import { toast } from "sonner"
import { CheckCircle2 as CheckCircleIcon, AlertCircle, Loader2 as LoaderIcon } from "lucide-react"

interface DataRecoveryFlowProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialDatabaseType?: DatabaseType
}

type RecoveryStep = "select" | "retrieving" | "resolving" | "complete"

export function DataRecoveryFlow({
  open,
  onOpenChange,
  initialDatabaseType,
}: DataRecoveryFlowProps) {
  const { scenario, isLoading: detecting, checkRecovery } = useNotionRecoveryDetection()
  const [step, setStep] = useState<RecoveryStep>("select")
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(
    initialDatabaseType || null
  )
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [retrieveError, setRetrieveError] = useState<string | null>(null)
  const [retrieveResult, setRetrieveResult] = useState<any>(null)

  // Auto-open if recovery is needed
  useEffect(() => {
    if (scenario?.needsRecovery && !open && onOpenChange) {
      onOpenChange(true)
    }
  }, [scenario, open, onOpenChange])

  const handleStartRecovery = async (databaseType: DatabaseType) => {
    setSelectedDatabase(databaseType)
    setStep("retrieving")
    setIsRetrieving(true)
    setRetrieveError(null)
    setProgress({ current: 0, total: 0 })

    try {
      // Use AbortController for cancellation if needed
      const controller = new AbortController()

      const response = await fetch("/api/notion/retrieve-from-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType,
          conflictResolution: "manual",
          autoResolve: false,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to retrieve data from Notion")
      }

      const data = await response.json()
      setRetrieveResult(data)

      // Update progress to 100%
      setProgress({ current: data.retrieved, total: data.retrieved })

      if (data.hasConflicts && data.conflicts.length > 0) {
        setConflicts(data.conflicts)
        setStep("resolving")
        toast.info(`${data.conflicts.length} conflicts detected. Please resolve them.`)
      } else {
        // No conflicts - recovery complete
        setStep("complete")
        toast.success(
          `Successfully recovered ${data.retrieved} records from Notion. ${data.matched} matched existing records, ${data.newRecords} new records imported.`
        )
      }
    } catch (error) {
      console.error("[Recovery] Error:", error)
      if (error instanceof Error && error.name === "AbortError") {
        setRetrieveError("Recovery cancelled")
      } else {
        setRetrieveError(error instanceof Error ? error.message : "Unknown error")
        toast.error("Failed to retrieve data from Notion")
      }
    } finally {
      setIsRetrieving(false)
    }
  }

  const handleResolveConflicts = async (resolutions: ResolutionChoice[]) => {
    if (!selectedDatabase) return

    try {
      const response = await fetch("/api/notion/resolve-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType: selectedDatabase,
          resolutions,
          conflicts, // Pass conflicts from retrieve result
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to resolve conflicts")
      }

      setStep("complete")
      toast.success("Conflicts resolved successfully")
    } catch (error) {
      console.error("[Recovery] Error resolving conflicts:", error)
      toast.error("Failed to resolve conflicts")
    }
  }

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
    // Reset state
    setStep("select")
    setSelectedDatabase(null)
    setConflicts([])
    setRetrieveError(null)
    setRetrieveResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange || handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recover Data from Notion</DialogTitle>
          <DialogDescription>
            {step === "select" &&
              "Lost your data? No worries! We can recover it from your Notion workspace."}
            {step === "retrieving" && "Retrieving data from Notion..."}
            {step === "resolving" && "Resolve conflicts between Notion and Supabase data"}
            {step === "complete" && "Recovery complete!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step: Select Database */}
          {step === "select" && (
            <div className="space-y-4">
              {detecting ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Checking recovery status...</span>
                </div>
              ) : scenario?.needsRecovery ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{scenario.reason}</AlertDescription>
                  </Alert>

                  <div className="grid gap-4">
                    <h3 className="font-semibold">Available Databases</h3>
                    {scenario.availableDatabases.map((db) => (
                      <Card key={db.databaseType}>
                        <CardHeader>
                          <CardTitle>{db.databaseName}</CardTitle>
                          <CardDescription>
                            {db.supabaseRecordCount === 0
                              ? "No records in Supabase - ready to recover"
                              : `${db.supabaseRecordCount} records in Supabase`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => handleStartRecovery(db.databaseType as DatabaseType)}
                            disabled={isRetrieving}
                          >
                            Recover from Notion
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    All your databases appear to be synced. No recovery needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step: Retrieving */}
          {step === "retrieving" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Retrieving pages from Notion...</span>
                  <span>
                    {progress.current > 0
                      ? `${progress.current}${progress.total > 0 ? ` / ${progress.total}` : ""} pages`
                      : "Starting..."}
                  </span>
                </div>
                <Progress
                  value={
                    progress.total > 0
                      ? (progress.current / progress.total) * 100
                      : progress.current > 0
                        ? 50
                        : 0
                  }
                />
                {progress.current > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    This may take a moment for large databases...
                  </p>
                )}
              </div>

              {retrieveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{retrieveError}</AlertDescription>
                </Alert>
              )}

              {isRetrieving && !retrieveError && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center space-y-1">
                    <p className="font-medium">Retrieving data from Notion</p>
                    <p className="text-sm text-muted-foreground">
                      Matching records and detecting conflicts...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Resolving Conflicts */}
          {step === "resolving" && (
            <div className="space-y-4">
              {retrieveResult && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {retrieveResult.retrieved} pages in Notion.{" "}
                    {retrieveResult.matched} matched existing records.{" "}
                    {retrieveResult.conflicts.length} conflicts need resolution.
                  </AlertDescription>
                </Alert>
              )}

              <ConflictResolution conflicts={conflicts} onResolve={handleResolveConflicts} />
            </div>
          )}

          {/* Step: Complete */}
          {step === "complete" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  Recovery complete! Your data has been restored from Notion.
                </AlertDescription>
              </Alert>

              {retrieveResult && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{retrieveResult.retrieved}</div>
                    <div className="text-sm text-muted-foreground">Pages Retrieved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{retrieveResult.matched}</div>
                    <div className="text-sm text-muted-foreground">Records Matched</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{retrieveResult.newRecords}</div>
                    <div className="text-sm text-muted-foreground">New Records</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "complete" ? (
            <Button onClick={handleClose}>Close</Button>
          ) : step === "resolving" ? null : (
            <Button variant="outline" onClick={handleClose} disabled={isRetrieving}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
