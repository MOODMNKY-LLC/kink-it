"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Conflict } from "@/lib/notion/conflict-detection-service"
import type { ResolutionChoice } from "@/lib/notion/conflict-resolution-service"
import { Info, AlertTriangle } from "lucide-react"

interface ConflictResolutionProps {
  conflicts: Conflict[]
  onResolve: (resolutions: ResolutionChoice[]) => Promise<void>
  onCancel?: () => void
}

export function ConflictResolution({
  conflicts,
  onResolve,
  onCancel,
}: ConflictResolutionProps) {
  const [resolutions, setResolutions] = useState<Record<string, ResolutionChoice>>({})
  const [isResolving, setIsResolving] = useState(false)

  const handleResolutionChange = (
    conflictId: string,
    strategy: ResolutionChoice["strategy"],
    fieldChoices?: Record<string, "notion" | "supabase">
  ) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictId]: {
        conflictId,
        strategy,
        fieldChoices,
      },
    }))
  }

  const handleBulkAction = (strategy: ResolutionChoice["strategy"]) => {
    const newResolutions: Record<string, ResolutionChoice> = {}
    for (const conflict of conflicts) {
      newResolutions[conflict.id] = {
        conflictId: conflict.id,
        strategy,
      }
    }
    setResolutions(newResolutions)
  }

  const handleSubmit = async () => {
    setIsResolving(true)
    try {
      const resolutionArray = Object.values(resolutions)
      await onResolve(resolutionArray)
    } finally {
      setIsResolving(false)
    }
  }

  const recordConflicts = conflicts.filter((c) => c.type === "record")
  const fieldConflicts = conflicts.filter((c) => c.type === "field")
  const missingRecords = conflicts.filter((c) => c.type === "missing")

  return (
    <div className="space-y-6">
      {/* Guidance */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Supabase is your source of truth.</strong> We recommend keeping Supabase data
          unless you've made intentional changes in Notion that you want to preserve. You can
          choose per-conflict or use bulk actions below.
        </AlertDescription>
      </Alert>

      {/* Bulk Actions */}
      {conflicts.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("prefer_supabase")}
          >
            Prefer All Supabase
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("prefer_notion")}
          >
            Prefer All Notion
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("skip")}
          >
            Skip All
          </Button>
        </div>
      )}

      {/* Missing Records */}
      {missingRecords.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            New Records from Notion ({missingRecords.length})
          </h3>
          {missingRecords.map((conflict) => (
            <Card key={conflict.id}>
              <CardHeader>
                <CardTitle>
                  {conflict.notionValue?.title || conflict.notionValue?.name || "Untitled"}
                </CardTitle>
                <CardDescription>
                  This record exists in Notion but not in Supabase. Choose to import it or skip.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={
                      resolutions[conflict.id]?.strategy === "prefer_notion"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleResolutionChange(conflict.id, "prefer_notion")}
                  >
                    Import from Notion
                  </Button>
                  <Button
                    variant={
                      resolutions[conflict.id]?.strategy === "skip" ? "default" : "outline"
                    }
                    onClick={() => handleResolutionChange(conflict.id, "skip")}
                  >
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Record-Level Conflicts */}
      {recordConflicts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Conflicting Records ({recordConflicts.length})
          </h3>
          {recordConflicts.map((conflict) => (
            <Card key={conflict.id}>
              <CardHeader>
                <CardTitle>
                  {conflict.supabaseValue?.title ||
                    conflict.supabaseValue?.name ||
                    conflict.notionValue?.title ||
                    "Untitled"}
                </CardTitle>
                <CardDescription>
                  Both versions modified since last sync. Choose which to keep.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Supabase Version */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>Supabase (Preferred)</strong>
                      <span className="text-xs text-muted-foreground">
                        Updated: {new Date(conflict.supabaseTimestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-md bg-muted text-sm">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(conflict.supabaseValue, null, 2)}
                      </pre>
                    </div>
                    <Button
                      variant={
                        resolutions[conflict.id]?.strategy === "prefer_supabase"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_supabase")}
                    >
                      Use This
                    </Button>
                  </div>

                  {/* Notion Version */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>Notion</strong>
                      <span className="text-xs text-muted-foreground">
                        Updated: {new Date(conflict.notionTimestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-md bg-muted text-sm">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(conflict.notionValue, null, 2)}
                      </pre>
                    </div>
                    <Button
                      variant={
                        resolutions[conflict.id]?.strategy === "prefer_notion"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_notion")}
                    >
                      Use This
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Field-Level Conflicts */}
      {fieldConflicts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Field Conflicts ({fieldConflicts.length})</h3>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Individual fields differ. You can merge these by choosing which fields to keep from
              each source.
            </AlertDescription>
          </Alert>
          {fieldConflicts.map((conflict) => (
            <Card key={conflict.id}>
              <CardHeader>
                <CardTitle>Field: {conflict.field}</CardTitle>
                <CardDescription>{conflict.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Supabase:</strong>
                    <div className="p-2 rounded bg-muted text-sm mt-1">
                      {String(conflict.supabaseValue || "null")}
                    </div>
                  </div>
                  <div>
                    <strong>Notion:</strong>
                    <div className="p-2 rounded bg-muted text-sm mt-1">
                      {String(conflict.notionValue || "null")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={
                      resolutions[conflict.id]?.strategy === "prefer_supabase"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleResolutionChange(conflict.id, "prefer_supabase")}
                  >
                    Keep Supabase
                  </Button>
                  <Button
                    variant={
                      resolutions[conflict.id]?.strategy === "prefer_notion"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleResolutionChange(conflict.id, "prefer_notion")}
                  >
                    Keep Notion
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isResolving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isResolving || conflicts.length === 0}>
          {isResolving ? "Resolving..." : `Resolve ${conflicts.length} Conflict(s)`}
        </Button>
      </div>
    </div>
  )
}
