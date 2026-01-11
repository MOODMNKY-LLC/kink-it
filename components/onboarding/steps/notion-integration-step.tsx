"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bullet } from "@/components/ui/bullet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  HelpCircle, 
  Database,
  RefreshCw,
  Check,
  XCircle,
  Link as LinkIcon
} from "lucide-react"
import { NotionIcon } from "@/components/icons/notion"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NotionIntegrationStepProps {
  onNext: (data: Record<string, any>) => void
  onBack: () => void
  initialData?: Record<string, any>
}

type ValidationStatus = "idle" | "validating" | "valid" | "invalid"
type SyncStatus = "idle" | "syncing" | "success" | "error"

export default function NotionIntegrationStep({ onNext, onBack, initialData }: NotionIntegrationStepProps) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [keyName, setKeyName] = useState(initialData?.notion_api_key_name || "KINK IT Integration")
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle")
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [validatedApiKeyId, setValidatedApiKeyId] = useState<string | null>(initialData?.notion_api_key_id || null)
  const [databases, setDatabases] = useState<any[]>(initialData?.notion_databases || [])
  const [error, setError] = useState<string | null>(null)
  const [parentPageId, setParentPageId] = useState<string | null>(initialData?.notion_parent_page_id || null)
  const [manualPageId, setManualPageId] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [hasOAuthTokens, setHasOAuthTokens] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [useOAuth, setUseOAuth] = useState(true) // Default to OAuth

  // Check if user has OAuth tokens on mount
  useEffect(() => {
    const checkOAuthTokens = async () => {
      try {
        const response = await fetch("/api/notion/check-oauth")
        if (response.ok) {
          const data = await response.json()
          setHasOAuthTokens(data.hasTokens || false)
          if (data.hasTokens && data.hasDuplicatedTemplateId) {
            // User has OAuth tokens with duplicated_template_id - use OAuth flow
            setUseOAuth(true)
          }
        }
      } catch (error) {
        console.error("Error checking OAuth tokens:", error)
      }
    }
    checkOAuthTokens()
  }, [])

  const handleNotionOAuth = async () => {
    setIsOAuthLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const origin = window.location.origin
      const normalizedOrigin = origin.replace(/localhost/i, "127.0.0.1")
      const redirectTo = `${normalizedOrigin}/api/auth/notion/callback?redirect_to=${encodeURIComponent(window.location.pathname)}`

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "notion",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (oauthError) {
        throw oauthError
      }

      if (data?.url) {
        // Redirect to Notion OAuth
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error("Error initiating Notion OAuth:", error)
      setError(error.message || "Failed to initiate Notion OAuth")
      setIsOAuthLoading(false)
      toast.error(error.message || "Failed to initiate Notion OAuth")
    }
  }

  const handleValidateKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your Notion API key")
      return
    }

    // Basic format validation
    if (!apiKey.trim().startsWith("secret_") && !apiKey.trim().startsWith("ntn_")) {
      toast.error("Invalid API key format. Notion API keys start with 'secret_' or 'ntn_'")
      return
    }

    setValidationStatus("validating")
    setError(null)

    try {
      // Validate and store the API key
      const response = await fetch("/api/notion/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: keyName.trim() || "KINK IT Integration",
          api_key: apiKey.trim(),
        }),
      })

      let data: any = {}
      try {
        data = await response.json()
      } catch (parseError) {
        const text = await response.text().catch(() => "Unknown error")
        throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`)
      }

      if (!response.ok) {
        // Use the detailed error message from the API if available
        const errorMessage = data.error || data.details?.message || data.details?.raw || `Failed to validate API key (${response.status})`
        
        console.error("[Notion Integration] API key validation failed:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          notionStatus: data.status,
          notionStatusText: data.statusText,
          errorCode: data.details?.code,
          errorMessage: data.details?.message,
        })
        
        // Show more helpful error message
        throw new Error(errorMessage)
      }

      // The API returns key_id, not id
      const apiKeyId = data.key_id || data.id
      if (!apiKeyId) {
        console.error("[Notion Integration] No key_id in response:", data)
        throw new Error("API key was validated but no key ID was returned. Please try again.")
      }

      setValidatedApiKeyId(apiKeyId)
      setValidationStatus("valid")
      toast.success("API key validated successfully!")
      // Clear the API key input for security
      setApiKey("")
    } catch (error: any) {
      console.error("[Notion Integration] Error validating API key:", error)
      setValidationStatus("invalid")
      const errorMessage = error.message || "Failed to validate API key. Please check your key and try again."
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleSyncDatabases = async () => {
    if (!validatedApiKeyId) {
      toast.error("Please validate your API key first")
      return
    }

    setSyncStatus("syncing")
    setError(null)

    try {
      const requestBody: any = {
        api_key_id: validatedApiKeyId,
      }

      // If user provided manual page ID, use it
      if (manualPageId.trim()) {
        requestBody.parent_page_id = manualPageId.trim()
      }

      const response = await fetch("/api/onboarding/notion/sync-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        // If error suggests template not found, show manual input option
        const errorMessage = data.error || data.suggestion || "Failed to sync databases"
        if (errorMessage.includes("Template not found") || 
            errorMessage.includes("No databases found") ||
            errorMessage.includes("expected ~15 databases") ||
            errorMessage.includes("Found") && errorMessage.includes("pages")) {
          setShowManualInput(true)
        }
        throw new Error(errorMessage)
      }

      setDatabases(data.databases || [])
      setParentPageId(data.parentPageId)
      setSyncStatus("success")
      setShowManualInput(false) // Hide manual input on success
      toast.success(`Successfully synced ${data.databases_count || 0} database(s)!`)
    } catch (error: any) {
      console.error("Error syncing databases:", error)
      setSyncStatus("error")
      const errorMessage = error.message || "Failed to sync databases"
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleContinue = () => {
    if (!validatedApiKeyId) {
      toast.error("Please validate your API key first")
      return
    }

    if (databases.length === 0) {
      toast.error("Please sync your databases first")
      return
    }

    onNext({
      notion_api_key_id: validatedApiKeyId,
      notion_api_key_name: keyName,
      notion_api_key_added: true,
      notion_parent_page_id: parentPageId,
      notion_databases: databases,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Connect Your Notion Workspace</h2>
        <p className="text-muted-foreground">
          Set up your Notion integration to sync your KINK IT data with your workspace. Follow the steps below to get started.
        </p>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bullet />
            Setup Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to create your Notion integration and connect it to your duplicated template page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Create a Custom Integration</p>
                <p className="text-sm text-muted-foreground">
                  Visit{" "}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Notion Integrations
                    <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  and click "New integration". Give it a name like "KINK IT - My Workspace" and select your workspace.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Duplicate the Template Page</p>
                <p className="text-sm text-muted-foreground">
                  If you haven't already, duplicate the KINK IT template page in your Notion workspace. This creates all the databases you'll need.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Connect Integration to Template Page</p>
                <p className="text-sm text-muted-foreground">
                  Open your duplicated template page, click the "..." menu in the top-right, select "Add connections", and add your integration. This gives the integration access to your databases.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">Copy Your API Key</p>
                <p className="text-sm text-muted-foreground">
                  Go back to your integration settings, copy the "Internal Integration Token" (it starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">secret_</code> or <code className="bg-muted px-1 py-0.5 rounded text-xs">ntn_</code>), and paste it below.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Entry Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bullet />
            Enter Your API Key
          </CardTitle>
          <CardDescription>
            Paste your Notion Internal Integration Token below. We'll validate it and then sync your databases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Integration Name (Optional)</Label>
            <Input
              id="key-name"
              placeholder="e.g., KINK IT - My Workspace"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              disabled={validationStatus === "validating" || validationStatus === "valid"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">Notion API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                placeholder="secret_... or ntn_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={validationStatus === "validating" || validationStatus === "valid"}
                className="flex-1"
              />
              <Button
                onClick={handleValidateKey}
                disabled={!apiKey.trim() || validationStatus === "validating" || validationStatus === "valid"}
              >
                {validationStatus === "validating" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : validationStatus === "valid" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Validated
                  </>
                ) : (
                  <>
                    <NotionIcon className="w-4 h-4 mr-2" variant="brand" />
                    Validate
                  </>
                )}
              </Button>
            </div>
            {validationStatus === "valid" && (
              <Alert className="border-green-500/20 bg-green-500/5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  API key validated successfully! You can now sync your databases.
                </AlertDescription>
              </Alert>
            )}
            {validationStatus === "invalid" && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  <div className="text-xs mt-2 space-y-1">
                    <p className="font-medium">Common issues:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Make sure you copied the entire "Internal Integration Token"</li>
                      <li>Verify the integration is created in the correct workspace</li>
                      <li>Ensure you've shared at least one page with your integration</li>
                      <li>Check that the token starts with "secret_" or "ntn_"</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Databases Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bullet />
            Sync Your Databases
          </CardTitle>
          <CardDescription>
            Once your API key is validated, sync your Notion databases to connect them with KINK IT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showManualInput && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>We couldn't automatically find your template page. Please enter your duplicated template page ID manually.</p>
                <div className="space-y-2">
                  <Label htmlFor="manual-page-id">Template Page ID</Label>
                  <Input
                    id="manual-page-id"
                    placeholder="Enter your Notion page ID (32-character UUID)"
                    value={manualPageId}
                    onChange={(e) => setManualPageId(e.target.value)}
                    disabled={syncStatus === "syncing"}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find this in your Notion page URL: <code className="bg-muted px-1 py-0.5 rounded text-xs">notion.so/Your-Page-Name-{`{page-id}`}</code>
                    <br />
                    The page ID is the 32-character string after the last dash in the URL.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSyncDatabases}
            disabled={validationStatus !== "valid" || syncStatus === "syncing"}
            className="w-full"
          >
            {syncStatus === "syncing" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : syncStatus === "success" ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Again
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Sync Databases
              </>
            )}
          </Button>

          {syncStatus === "success" && databases.length > 0 && (
            <div className="space-y-2">
              <Alert className="border-green-500/20 bg-green-500/5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Successfully synced {databases.length} database(s)!
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <p className="text-sm font-medium">Synced Databases:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {databases.map((db) => (
                    <div
                      key={db.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{db.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {db.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {syncStatus === "error" && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={validationStatus !== "valid" || databases.length === 0}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
