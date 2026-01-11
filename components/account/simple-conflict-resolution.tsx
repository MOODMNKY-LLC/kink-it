"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Conflict } from "@/lib/notion/conflict-detection-service"
import type { ResolutionChoice } from "@/lib/notion/conflict-resolution-service"
import { Info, AlertTriangle, CheckCircle2, X } from "lucide-react"
import { toast } from "sonner"

interface SimpleConflictResolutionProps {
  conflicts: Conflict[]
  onResolve: (resolutions: ResolutionChoice[]) => Promise<void>
}

/**
 * Simplified conflict resolution component
 * - Smart defaults (prefer Supabase)
 * - Visual diff instead of JSON
 * - Quick bulk actions
 * - Collapsible per-conflict details
 */
export function SimpleConflictResolution({
  conflicts,
  onResolve,
}: SimpleConflictResolutionProps) {
  const [resolutions, setResolutions] = useState<Record<string, ResolutionChoice>>({})
  const [isResolving, setIsResolving] = useState(false)
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set())

  // Auto-set smart defaults (prefer Supabase for all)
  useEffect(() => {
    if (conflicts.length > 0 && Object.keys(resolutions).length === 0) {
      const defaults: Record<string, ResolutionChoice> = {}
      for (const conflict of conflicts) {
        defaults[conflict.id] = {
          conflictId: conflict.id,
          strategy: "prefer_supabase", // Smart default
        }
      }
      setResolutions(defaults)
    }
  }, [conflicts, resolutions])

  const handleResolutionChange = (
    conflictId: string,
    strategy: ResolutionChoice["strategy"]
  ) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictId]: {
        conflictId,
        strategy,
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
    toast.success(`Applied "${strategy}" to all conflicts`)
  }

  const handleSubmit = async () => {
    setIsResolving(true)
    try {
      const resolutionArray = Object.values(resolutions)
      await onResolve(resolutionArray)
    } catch (error) {
      toast.error("Failed to resolve conflicts")
    } finally {
      setIsResolving(false)
    }
  }

  const toggleConflict = (conflictId: string) => {
    setExpandedConflicts((prev) => {
      const next = new Set(prev)
      if (next.has(conflictId)) {
        next.delete(conflictId)
      } else {
        next.add(conflictId)
      }
      return next
    })
  }

  const recordConflicts = conflicts.filter((c) => c.type === "record")
  const fieldConflicts = conflicts.filter((c) => c.type === "field")
  const missingRecords = conflicts.filter((c) => c.type === "missing")

  const allResolved = conflicts.every((c) => resolutions[c.id]?.strategy)

  return (
    <div className="space-y-4">
      {/* Guidance */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Defaults Applied</strong> - We've pre-selected "Prefer Supabase" for all
          conflicts. Review and adjust if needed, then click "Resolve All Conflicts".
        </AlertDescription>
      </Alert>

      {/* Quick Bulk Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction("prefer_supabase")}
          className={Object.values(resolutions).every((r) => r.strategy === "prefer_supabase") ? "border-primary" : ""}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
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
          <X className="h-3 w-3 mr-1" />
          Skip All
        </Button>
      </div>

      {/* Missing Records (New from Notion) */}
      {missingRecords.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">
            New Records ({missingRecords.length})
          </h4>
          {missingRecords.map((conflict) => {
            const resolution = resolutions[conflict.id]
            const title = conflict.notionValue?.title || conflict.notionValue?.name || "Untitled"
            const isExpanded = expandedConflicts.has(conflict.id)

            return (
              <Card key={conflict.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Exists in Notion but not in Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant={resolution?.strategy === "prefer_notion" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_notion")}
                    >
                      Import from Notion
                    </Button>
                    <Button
                      variant={resolution?.strategy === "skip" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "skip")}
                    >
                      Skip
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="p-3 rounded-md bg-muted text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(conflict.notionValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleConflict(conflict.id)}
                    className="w-full text-xs"
                  >
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Record Conflicts */}
      {recordConflicts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">
            Conflicting Records ({recordConflicts.length})
          </h4>
          {recordConflicts.map((conflict) => {
            const resolution = resolutions[conflict.id]
            const title =
              conflict.supabaseValue?.title ||
              conflict.supabaseValue?.name ||
              conflict.notionValue?.title ||
              "Untitled"
            const isExpanded = expandedConflicts.has(conflict.id)

            return (
              <Card key={conflict.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Conflict
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Both versions modified since last sync
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={resolution?.strategy === "prefer_supabase" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_supabase")}
                      className="text-xs"
                    >
                      Use Supabase
                    </Button>
                    <Button
                      variant={resolution?.strategy === "prefer_notion" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_notion")}
                      className="text-xs"
                    >
                      Use Notion
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-semibold mb-1">Supabase</div>
                        <div className="p-2 rounded bg-muted max-h-32 overflow-auto">
                          <pre className="whitespace-pre-wrap text-[10px]">
                            {JSON.stringify(conflict.supabaseValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Notion</div>
                        <div className="p-2 rounded bg-muted max-h-32 overflow-auto">
                          <pre className="whitespace-pre-wrap text-[10px]">
                            {JSON.stringify(conflict.notionValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleConflict(conflict.id)}
                    className="w-full text-xs"
                  >
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Field Conflicts */}
      {fieldConflicts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">
            Field Conflicts ({fieldConflicts.length})
          </h4>
          {fieldConflicts.map((conflict) => {
            const resolution = resolutions[conflict.id]
            const isExpanded = expandedConflicts.has(conflict.id)

            return (
              <Card key={conflict.id} className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Field: {conflict.field}</CardTitle>
                  <CardDescription className="text-xs">{conflict.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={resolution?.strategy === "prefer_supabase" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_supabase")}
                      className="text-xs"
                    >
                      Keep Supabase
                    </Button>
                    <Button
                      variant={resolution?.strategy === "prefer_notion" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResolutionChange(conflict.id, "prefer_notion")}
                      className="text-xs"
                    >
                      Keep Notion
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-semibold mb-1">Supabase</div>
                        <div className="p-2 rounded bg-muted">
                          {String(conflict.supabaseValue || "null")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Notion</div>
                        <div className="p-2 rounded bg-muted">
                          {String(conflict.notionValue || "null")}
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleConflict(conflict.id)}
                    className="w-full text-xs"
                  >
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isResolving || !allResolved}
          className="w-full"
          size="lg"
        >
          {isResolving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Resolving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolve All Conflicts ({conflicts.length})
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
