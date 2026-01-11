"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bullet } from "@/components/ui/bullet"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface NotionVerificationStepProps {
  onNext: (data: Record<string, any>) => void
  onBack: () => void
  initialData?: Record<string, any>
}

export default function NotionVerificationStep({
  onNext,
  onBack,
  initialData,
}: NotionVerificationStepProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean
    databases: Array<{ id: string; name: string; type: string }>
    error?: string
  } | null>(null)

  const parentPageId = initialData?.notion_parent_page_id

  useEffect(() => {
    if (parentPageId && !verificationStatus) {
      verifyTemplate()
    }
  }, [parentPageId])

  const verifyTemplate = async () => {
    if (!parentPageId) {
      setVerificationStatus({
        verified: false,
        databases: [],
        error: "No parent page ID provided",
      })
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch("/api/onboarding/notion/verify-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPageId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setVerificationStatus({
        verified: true,
        databases: data.databases || [],
      })
    } catch (err) {
      setVerificationStatus({
        verified: false,
        databases: [],
        error: err instanceof Error ? err.message : "Failed to verify template",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleNext = () => {
    if (verificationStatus?.verified) {
      onNext({
        notion_verified: true,
        notion_databases: verificationStatus.databases,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Verifying Your Template</h2>
        <p className="text-muted-foreground">
          We're checking that your Notion template is set up correctly and finding all the databases (Tasks, Rules, Calendar, etc.) that KINK IT will sync with.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerifying && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying template and discovering databases...</span>
            </div>
          )}

          {verificationStatus && (
            <>
              <div className="flex items-center gap-2">
                {verificationStatus.verified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-500">Template verified successfully!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-destructive" />
                    <span className="font-medium text-destructive">Verification failed</span>
                  </>
                )}
              </div>

              {verificationStatus.error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {verificationStatus.error}
                </div>
              )}

              {verificationStatus.verified && verificationStatus.databases.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Discovered Databases:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {verificationStatus.databases.map((db) => (
                      <li key={db.id}>
                        <span className="font-medium">{db.name}</span>
                        {db.type && <span className="text-xs ml-2">({db.type})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationStatus.verified && verificationStatus.databases.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No databases found. Make sure you've copied the template correctly.
                </p>
              )}
            </>
          )}

          {!isVerifying && !verificationStatus && (
            <Button onClick={verifyTemplate} variant="outline">
              Start Verification
            </Button>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!verificationStatus?.verified}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
