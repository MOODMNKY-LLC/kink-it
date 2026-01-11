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

      // Check if response exists
      if (!response) {
        throw new Error("No response received from server")
      }

      // Try to parse JSON, but handle non-JSON responses
      // Clone response first so we can read it multiple times if needed
      const responseClone = response.clone()
      let data: any = {}
      const contentType = response.headers.get("content-type")
      
      try {
        // Try to parse as JSON first
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError)
            console.error("Response text:", text.substring(0, 500))
            throw new Error(`Server returned invalid JSON: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`)
          }
        } else {
          console.warn("Empty response body received")
          data = {}
        }
      } catch (parseError) {
        // If text reading fails, try clone
        try {
          const text = await responseClone.text()
          console.error("Response text (from clone):", text.substring(0, 500))
          if (text) {
            try {
              data = JSON.parse(text)
            } catch {
              throw new Error(`Server error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`)
            }
          }
        } catch (textError) {
          console.error("Failed to read response:", textError)
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }
      
      // If data is empty object and status is not ok, log warning
      if (!response.ok && Object.keys(data).length === 0) {
        console.warn("Empty error response received:", {
          status: response.status,
          statusText: response.statusText,
          contentType,
        })
      }

      if (!response.ok) {
        // Log detailed error for debugging - ensure we have actual data
        const errorInfo: any = {
          status: response.status || 'unknown',
          statusText: response.statusText || 'unknown',
          contentType: contentType || 'unknown',
          hasData: !!data,
          dataType: typeof data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
        }
        
        // Only add properties if they exist
        if (data && typeof data === 'object' && data !== null) {
          if (data.error) errorInfo.error = data.error
          if (data.details) errorInfo.details = data.details
          if (data.suggestion) errorInfo.suggestion = data.suggestion
          if (data.debug) errorInfo.debug = data.debug
          if (Object.keys(data).length > 0) {
            errorInfo.fullData = data
            errorInfo.dataStringified = JSON.stringify(data, null, 2)
          }
        } else {
          errorInfo.dataValue = String(data)
        }
        
        // Always log, even if errorInfo seems empty
        console.error("Template sync error:", JSON.stringify(errorInfo, null, 2))
        console.error("Template sync error (raw):", errorInfo)
        
        // Create error message with suggestion
        const errorMessage = data.error || `Sync failed (${response.status})`
        const errorWithSuggestion = data.suggestion 
          ? `${errorMessage}\n\n${data.suggestion}`
          : errorMessage
        
        const error = new Error(errorWithSuggestion)
        // Attach debug info for UI to use
        ;(error as any).debug = data.debug
        ;(error as any).suggestion = data.suggestion
        ;(error as any).status = response.status
        throw error
      }

      // Auto-populate parent page ID
      setParentPageId(data.parentPageId)
      setSyncSuccess(data.message || `Found template with ${data.databases?.length || 0} databases`)

      // Automatically proceed to verification
      setTimeout(() => {
        handleVerify(data.parentPageId, data.databases)
      }, 1000)
    } catch (err) {
      // Better error handling with detailed logging
      console.error("Template sync catch block error:", err)
      
      let errorMessage = "Failed to sync template"
      
      if (err instanceof Error) {
        errorMessage = err.message
        // Log additional error properties if they exist
        if ((err as any).status) {
          console.error("Error status:", (err as any).status)
        }
        if ((err as any).suggestion) {
          console.error("Error suggestion:", (err as any).suggestion)
        }
        if ((err as any).debug) {
          console.error("Error debug info:", (err as any).debug)
        }
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        // Try to extract error message from object
        const errObj = err as any
        errorMessage = errObj.error || errObj.message || errObj.toString() || "Failed to sync template"
        
        // Log the full error object for debugging
        console.error("Error object details:", {
          keys: Object.keys(errObj),
          error: errObj.error,
          message: errObj.message,
          details: errObj.details,
          suggestion: errObj.suggestion,
          full: errObj,
        })
      }
      
      setError(errorMessage)
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
        <h2 className="text-2xl font-bold mb-2">Connect Your Notion Workspace</h2>
        <p className="text-muted-foreground">
          KINK IT syncs with Notion to keep your tasks, rules, and relationship data organized. We'll automatically find your template page, even if you've renamed it or nested databases in a child page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Step 1: Sync with Notion
          </CardTitle>
          <CardDescription>
            We'll search your Notion workspace for your template page. If you renamed it to your bond name, we'll find it automatically. This works even if your databases are nested in a child page.
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
                {error.includes("authentication required") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Please make sure you authenticated with Notion OAuth when signing in. If you signed in with email, please sign out and sign in with Notion instead.
                  </p>
                )}
                {error.includes("not found") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Make sure you duplicated the template during Notion authentication. You can also enter the parent page ID manually below.
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> If you renamed your template to your bond name, we'll find it automatically. The search also works with nested database structures (databases inside child pages).
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
