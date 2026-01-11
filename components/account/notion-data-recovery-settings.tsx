"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"
import { DatabaseRecoveryCard } from "./database-recovery-card"
import { AlertCircle, CheckCircle2, Database, RefreshCw, Download } from "lucide-react"
import type { Profile } from "@/types/profile"
import type { DatabaseType } from "@/lib/notion/data-transformation"
import { toast } from "sonner"

interface NotionDataRecoverySettingsProps {
  profile: Profile
}

type DatabaseRecoveryState = {
  [key: string]: {
    status: "idle" | "recovering" | "resolving" | "complete" | "error"
    progress?: number
    error?: string
    conflicts?: number
    conflictsData?: any[] // Store actual conflicts for resolution
    retrieved?: number
    matched?: number
    newRecords?: number
  }
}

/**
 * Notion Data Recovery Settings Component
 * 
 * Redesigned for better UX:
 * - Inline recovery (no dialogs)
 * - Per-database recovery buttons
 * - Batch recovery option
 * - Smart conflict resolution
 * - Clear progress indicators
 */
export function NotionDataRecoverySettings({ profile }: NotionDataRecoverySettingsProps) {
  const { scenario, isLoading, checkRecovery } = useNotionRecoveryDetection()
  const [recoveryStates, setRecoveryStates] = useState<DatabaseRecoveryState>({})
  const [isRecoveringAll, setIsRecoveringAll] = useState(false)

  // Note: checkRecovery() is already called on mount by useNotionRecoveryDetection hook
  // We only need to call it explicitly after recovery operations complete

  const handleRecoverDatabase = async (databaseType: DatabaseType, databaseId: string) => {
    setRecoveryStates((prev) => ({
      ...prev,
      [databaseId]: { status: "recovering", progress: 0 },
    }))

    try {
      const response = await fetch("/api/notion/retrieve-from-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType,
          databaseId, // Pass the specific database_id from notion_databases
          conflictResolution: "prefer_supabase", // Smart default
          autoResolve: true, // Auto-resolve non-conflicts
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Failed to retrieve data from Notion"
        
        // Handle 404 (database not synced or database_id missing) gracefully - don't throw, just mark as skipped
        if (response.status === 404) {
          // Use the API's error message directly - it's more accurate
          setRecoveryStates((prev) => ({
            ...prev,
            [databaseId]: {
              status: "error",
              error: errorMessage, // Use API's error message which is more accurate
            },
          }))
          // Don't show toast error for 404s - they're handled gracefully
          // Return early instead of throwing - allows batch recovery to continue
          return
        }
        
        // For other errors, throw to be caught by batch recovery handler
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.hasConflicts && data.conflicts.length > 0) {
        // Has conflicts - need resolution
        setRecoveryStates((prev) => ({
          ...prev,
          [databaseId]: {
            status: "resolving",
            conflicts: data.conflicts.length,
            conflictsData: data.conflicts, // Store conflicts for resolution
            retrieved: data.retrieved,
            matched: data.matched,
            newRecords: data.newRecords,
          },
        }))
        toast.info(`${data.conflicts.length} conflicts detected for ${databaseType}. Review below.`)
      } else {
        // No conflicts - recovery complete
        setRecoveryStates((prev) => ({
          ...prev,
          [databaseId]: {
            status: "complete",
            retrieved: data.retrieved,
            matched: data.matched,
            newRecords: data.newRecords,
          },
        }))
        toast.success(
          `Recovered ${data.retrieved} records from ${databaseType}. ${data.newRecords} new records imported.`
        )
        // Refresh status
        setTimeout(() => checkRecovery(), 1000)
      }
    } catch (error) {
      console.error("[Recovery] Error:", error)
      setRecoveryStates((prev) => ({
        ...prev,
        [databaseId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
      toast.error(`Failed to recover ${databaseType}`)
    }
  }

  const handleRecoverAll = async () => {
    if (!scenario?.availableDatabases.length) return

    setIsRecoveringAll(true)
    const databases = scenario.availableDatabases
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const db of databases) {
      try {
        await handleRecoverDatabase(db.databaseType as DatabaseType, db.databaseId)
        // Check if recovery was skipped (404 handled gracefully)
        const currentState = recoveryStates[db.databaseId]
        if (currentState?.status === "error" && currentState.error?.includes("not synced")) {
          // Database not synced - don't count as success or failure, just note it
          results.errors.push(`${db.databaseName}: Not synced (skipped)`)
        } else if (currentState?.status !== "error") {
          // Only count as success if not in error state
          results.success++
        }
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${db.databaseName}: ${errorMessage}`)
        // Continue with next database instead of stopping
        console.warn(`Failed to recover ${db.databaseName}:`, error)
      }
      // Small delay between databases to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsRecoveringAll(false)

    // Show appropriate toast message
    const skippedCount = results.errors.filter((e) => e.includes("Not synced")).length
    const actualFailed = results.failed
    
    if (actualFailed === 0 && skippedCount === 0) {
      toast.success(`Successfully recovered ${results.success} database(s)!`)
    } else if (results.success === 0 && skippedCount > 0 && actualFailed === 0) {
      toast.warning(`${skippedCount} database(s) not synced. Please sync your Notion template first.`)
    } else if (results.success === 0) {
      toast.error(`Failed to recover ${actualFailed} database(s). Check console for details.`)
    } else {
      const parts = [`Recovered ${results.success} database(s)`]
      if (actualFailed > 0) parts.push(`${actualFailed} failed`)
      if (skippedCount > 0) parts.push(`${skippedCount} not synced`)
      toast.warning(parts.join(", ") + ".")
    }

    setTimeout(() => checkRecovery(), 1000)
  }

  const handleResolveConflicts = async (
    databaseType: DatabaseType,
    databaseId: string,
    resolutions: any[]
  ) => {
    // Get conflicts from recovery state
    const currentState = recoveryStates[databaseId]
    const conflicts = currentState?.conflictsData || []

    // If no conflicts, treat as success (they may have been auto-resolved)
    if (!conflicts || conflicts.length === 0) {
      setRecoveryStates((prev) => ({
        ...prev,
        [databaseId]: { ...prev[databaseId], status: "complete" },
      }))
      toast.success("No conflicts to resolve - recovery complete!")
      setTimeout(() => checkRecovery(), 1000)
      return
    }

    setRecoveryStates((prev) => ({
      ...prev,
      [databaseId]: { ...prev[databaseId], status: "recovering" },
    }))

    try {
      const response = await fetch("/api/notion/resolve-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType,
          resolutions,
          conflicts, // Pass conflicts to API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Handle "no conflicts" as success (conflicts may have been resolved between detection and resolution)
        if (errorData.error?.includes("No conflicts to resolve")) {
          setRecoveryStates((prev) => ({
            ...prev,
            [databaseId]: { ...prev[databaseId], status: "complete" },
          }))
          toast.success("Conflicts already resolved - recovery complete!")
          setTimeout(() => checkRecovery(), 1000)
          return
        }
        throw new Error(errorData.error || "Failed to resolve conflicts")
      }

      setRecoveryStates((prev) => ({
        ...prev,
        [databaseId]: { ...prev[databaseId], status: "complete" },
      }))
      toast.success("Conflicts resolved successfully")
      setTimeout(() => checkRecovery(), 1000)
    } catch (error) {
      console.error("[Recovery] Error resolving conflicts:", error)
      setRecoveryStates((prev) => ({
        ...prev,
        [databaseId]: {
          ...prev[databaseId],
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
      toast.error("Failed to resolve conflicts")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Recovery</h2>
          <p className="text-muted-foreground">
            Recover your data from Notion if you've lost sync or need to restore from backup.
          </p>
        </div>
        {scenario?.needsRecovery && scenario.availableDatabases.length > 1 && (
          <Button
            onClick={handleRecoverAll}
            disabled={isRecoveringAll}
            size="lg"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isRecoveringAll ? "Recovering All..." : "Recover All"}
          </Button>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Recovery</strong> - We'll automatically resolve non-conflicting records and
          only ask you about conflicts. Supabase is your source of truth by default.
        </AlertDescription>
      </Alert>

      {/* Recovery Status */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Checking recovery status...</span>
            </div>
          </CardContent>
        </Card>
      ) : !scenario?.needsRecovery ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              All Data Synced
            </CardTitle>
            <CardDescription>
              Your data appears to be in sync. No recovery needed at this time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => checkRecovery()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-check Status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Databases Needing Recovery ({scenario.availableDatabases.length})
            </h3>
            <Badge variant="outline" className="text-sm">
              {scenario.reason}
            </Badge>
          </div>

          {scenario.availableDatabases.map((db) => (
            <DatabaseRecoveryCard
              key={db.databaseId}
              database={db}
              recoveryState={recoveryStates[db.databaseId]}
              onRecover={() => handleRecoverDatabase(db.databaseType as DatabaseType, db.databaseId)}
              onResolveConflicts={(resolutions) =>
                handleResolveConflicts(db.databaseType as DatabaseType, db.databaseId, resolutions)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
