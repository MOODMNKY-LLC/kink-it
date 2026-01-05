"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bullet } from "@/components/ui/bullet"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NotionSetupStepProps {
  onNext: (data: Record<string, any>) => void
  onBack: () => void
  initialData?: Record<string, any>
}

export default function NotionSetupStep({ onNext, onBack, initialData }: NotionSetupStepProps) {
  const [parentPageId, setParentPageId] = useState(initialData?.notion_parent_page_id || "")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null)

  const handleSyncTemplate = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncSuccess(null)

    try {
      const response = await fetch("/api/onboarding/notion/sync-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sync failed")
      }

      // Auto-populate parent page ID
      setParentPageId(data.parentPageId)
      setSyncSuccess(data.message || `Found template with ${data.databases?.length || 0} databases`)

      // Automatically proceed to verification
      setTimeout(() => {
        handleVerify(data.parentPageId, data.databases)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync template")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleVerify = async (prefilledPageId?: string, prefilledDatabases?: any[]) => {
    const pageIdToVerify = prefilledPageId || parentPageId.trim()
    
    if (!pageIdToVerify) {
      setError("Please enter your Notion parent page ID or sync with Notion first")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // If we already have databases from sync, use them
      if (prefilledDatabases && prefilledDatabases.length > 0) {
        onNext({
          notion_parent_page_id: pageIdToVerify,
          notion_databases: prefilledDatabases,
        })
        return
      }

      // Otherwise, verify via API
      const response = await fetch("/api/onboarding/notion/verify-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPageId: pageIdToVerify }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      // Store parent page ID and proceed
      onNext({
        notion_parent_page_id: pageIdToVerify,
        notion_databases: data.databases || [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify template")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Set Up Notion Integration</h2>
        <p className="text-muted-foreground">
          KINK IT integrates with Notion to help you manage your dynamic. If you duplicated the template during Notion authentication, we can automatically find and connect it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Step 1: Sync with Notion
          </CardTitle>
          <CardDescription>
            Search your Notion workspace for the duplicated template and automatically connect it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSyncTemplate}
            disabled={isSyncing || isVerifying}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Searching for template..." : "Sync with Notion"}
          </Button>

          {syncSuccess && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Template found!</p>
                <p className="text-muted-foreground mt-1">{syncSuccess}</p>
              </div>
            </div>
          )}

          {error && !isSyncing && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Sync failed</p>
                <p className="text-muted-foreground mt-1">{error}</p>
                {error.includes("not found") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Make sure you duplicated the template during Notion authentication. You can also enter the parent page ID manually below.
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            This will search your Notion workspace for the KINK IT template you duplicated during authentication.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Step 2: Manual Entry (Optional)
          </CardTitle>
          <CardDescription>
            If automatic sync didn't work, you can manually enter the parent page ID from your Notion URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-page-id">Parent Page ID</Label>
            <Input
              id="parent-page-id"
              placeholder="e.g., 2decd2a6-5422-8132-9d96-d98bb4404316"
              value={parentPageId}
              onChange={(e) => setParentPageId(e.target.value)}
              disabled={isVerifying || isSyncing}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Notion URL: notion.so/workspace/KINK-IT-<strong>2decd2a6-5422-8132-9d96-d98bb4404316</strong>
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1" disabled={isVerifying || isSyncing}>
              Back
            </Button>
            <Button
              onClick={() => handleVerify()}
              disabled={!parentPageId.trim() || isVerifying || isSyncing}
              className="flex-1"
            >
              {isVerifying ? "Verifying..." : "Verify & Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


