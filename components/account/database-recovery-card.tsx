"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SimpleConflictResolution } from "./simple-conflict-resolution"
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Database,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Conflict } from "@/lib/notion/conflict-detection-service"
import type { ResolutionChoice } from "@/lib/notion/conflict-resolution-service"

interface DatabaseRecoveryCardProps {
  database: {
    databaseType: string
    databaseName: string
    databaseId: string
    supabaseRecordCount: number
  }
  recoveryState?: {
    status: "idle" | "recovering" | "resolving" | "complete" | "error"
    progress?: number
    error?: string
    conflicts?: number
    retrieved?: number
    matched?: number
    newRecords?: number
  }
  onRecover: () => void
  onResolveConflicts: (resolutions: ResolutionChoice[]) => Promise<void>
}

export function DatabaseRecoveryCard({
  database,
  recoveryState,
  onRecover,
  onResolveConflicts,
}: DatabaseRecoveryCardProps) {
  const [conflictsOpen, setConflictsOpen] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [isLoadingConflicts, setIsLoadingConflicts] = useState(false)

  const loadConflicts = async () => {
    if (conflicts.length > 0) return // Already loaded

    setIsLoadingConflicts(true)
    try {
      const response = await fetch("/api/notion/retrieve-from-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType: database.databaseType,
          conflictResolution: "manual",
          autoResolve: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.conflicts) {
          setConflicts(data.conflicts)
        }
      }
    } catch (error) {
      console.error("[Recovery] Error loading conflicts:", error)
    } finally {
      setIsLoadingConflicts(false)
    }
  }

  const getStatusBadge = () => {
    if (!recoveryState) {
      return (
        <Badge variant="outline" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Needs Recovery
        </Badge>
      )
    }

    switch (recoveryState.status) {
      case "recovering":
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Recovering...
          </Badge>
        )
      case "resolving":
        return (
          <Badge variant="default" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {recoveryState.conflicts} Conflicts
          </Badge>
        )
      case "complete":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return null
    }
  }

  const isRecovering = recoveryState?.status === "recovering"
  const hasConflicts = recoveryState?.status === "resolving" && recoveryState.conflicts
  const isComplete = recoveryState?.status === "complete"
  const hasError = recoveryState?.status === "error"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">{database.databaseName}</CardTitle>
              <CardDescription>
                {database.supabaseRecordCount === 0
                  ? "No records in KINK IT - ready to recover"
                  : `${database.supabaseRecordCount} records in KINK IT`}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recovery Progress */}
        {isRecovering && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Retrieving data from Notion...</span>
              <span>{recoveryState.progress || 0}%</span>
            </div>
            <Progress value={recoveryState.progress || 0} />
          </div>
        )}

        {/* Success Summary */}
        {isComplete && recoveryState.retrieved !== undefined && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {recoveryState.retrieved}
              </div>
              <div className="text-xs text-muted-foreground">Retrieved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {recoveryState.matched || 0}
              </div>
              <div className="text-xs text-muted-foreground">Matched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {recoveryState.newRecords || 0}
              </div>
              <div className="text-xs text-muted-foreground">New Records</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {hasError && recoveryState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{recoveryState.error}</AlertDescription>
          </Alert>
        )}

        {/* Conflicts Section */}
        {hasConflicts && (
          <Collapsible open={conflictsOpen} onOpenChange={setConflictsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" onClick={loadConflicts}>
                <span>
                  Review {recoveryState.conflicts} Conflict{recoveryState.conflicts !== 1 ? "s" : ""}
                </span>
                {conflictsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {isLoadingConflicts ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading conflicts...</span>
                </div>
              ) : conflicts.length > 0 ? (
                <SimpleConflictResolution
                  conflicts={conflicts}
                  onResolve={onResolveConflicts}
                />
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No conflicts found. Recovery should complete automatically.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Button */}
        {!isRecovering && !isComplete && (
          <Button
            onClick={onRecover}
            disabled={hasError}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {hasError ? "Retry Recovery" : "Recover from Notion"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
