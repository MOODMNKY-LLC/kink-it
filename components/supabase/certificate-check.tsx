"use client"

/**
 * Certificate Check Component
 * 
 * Detects Supabase certificate issues and shows clear instructions to fix them.
 * Only runs in development mode.
 * 
 * Listens for "Failed to fetch" errors from Supabase and shows instructions.
 */

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CertificateCheck() {
  const [showWarning, setShowWarning] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null)

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== "development") return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || (!url.includes("127.0.0.1") && !url.includes("localhost"))) {
      return // Not local development
    }

    setSupabaseUrl(url)

    // Listen for unhandled fetch errors (which include certificate errors)
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes("Failed to fetch") ||
        event.error?.message?.includes("Failed to fetch")
      ) {
        // Check if it's a Supabase-related error
        const stack = event.error?.stack || ""
        const message = event.message || event.error?.message || ""
        if (
          stack.includes("supabase") || 
          stack.includes("auth") ||
          stack.includes("@supabase") ||
          message.includes("supabase") ||
          message.includes("auth")
        ) {
          setShowWarning(true)
        }
      }
    }

    // Listen for console errors
    const originalError = console.error
    console.error = (...args: any[]) => {
      try {
        const message = args.map(arg => 
          typeof arg === 'string' ? arg : 
          typeof arg === 'object' && arg !== null ? (arg.message || JSON.stringify(arg)) : 
          String(arg)
        ).join(" ")
        const stack = args.find(arg => typeof arg === 'object' && arg?.stack)?.stack || ""
        
        // Check if error object is empty (common with network/certificate issues)
        const hasEmptyErrorObject = args.some(arg => 
          typeof arg === 'object' && 
          arg !== null && 
          Object.keys(arg).length === 0 &&
          JSON.stringify(arg) === '{}'
        )
        
        // Only show certificate warning for actual certificate/network errors, not all Supabase errors
        // CRITICAL: Skip empty error objects completely - they're handled by components using console.warn
        // Skip database schema errors (PGRST205, table not found, etc.) - these are not certificate issues
        // Skip generic backend save errors - these are not certificate issues
        // Only trigger on explicit certificate/network error messages
        const isDatabaseSchemaError = (
          message.includes("PGRST205") ||
          message.includes("Could not find the table") ||
          message.includes("table") && message.includes("schema cache") ||
          message.includes("relation") && message.includes("does not exist")
        )
        
        const isGenericBackendError = (
          message.includes("Failed to save progress to backend") ||
          message.includes("Failed to save") ||
          message.includes("Error saving progress")
        )
        
        const isCertificateError = (
          // Must have explicit certificate/network error message
          (message.includes("Failed to fetch") || 
           message.includes("NetworkError") ||
           message.includes("ERR_CERT_AUTHORITY_INVALID") ||
           message.includes("certificate") ||
           message.includes("Network request failed") ||
           message.includes("ERR_CERT") ||
           message.includes("CERT_AUTHORITY")) &&
          // Must be related to Supabase/auth
          (message.includes("supabase") || 
           message.includes("auth") || 
           message.includes("@supabase") ||
           stack.includes("supabase") ||
           stack.includes("auth")) &&
          // CRITICAL: Never trigger on empty error objects, database schema errors, or generic backend errors
          !hasEmptyErrorObject &&
          !isDatabaseSchemaError &&
          !isGenericBackendError
        )
        
        if (isCertificateError) {
          setShowWarning(true)
        }
        
        // Always call original console.error, but wrap in try-catch to prevent errors in the override itself
        originalError.apply(console, args)
      } catch (error) {
        // If our override fails, at least try to log the original error
        try {
          originalError.apply(console, args)
        } catch {
          // If even that fails, use a fallback
          console.log("Error in console.error override:", error)
        }
      }
    }
    
    // Also listen for unhandled promise rejections (common for fetch errors)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message || String(reason) || ""
      const stack = reason?.stack || ""
      
      if (
        (message.includes("Failed to fetch") || message.includes("NetworkError")) &&
        (message.includes("supabase") || 
         message.includes("auth") || 
         message.includes("@supabase") ||
         stack.includes("supabase") ||
         stack.includes("auth"))
      ) {
        setShowWarning(true)
      }
    }
    
    window.addEventListener("unhandledrejection", handleRejection)

    window.addEventListener("error", handleError)

    // Test connectivity after a short delay
    const testConnection = async () => {
      try {
        // Try to fetch the Supabase health endpoint
        // Use a simple GET request that will fail if certificate isn't accepted
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch(`${url}/auth/v1/health`, {
          method: "GET",
          signal: controller.signal,
        })

        // If we get a response (even error), certificate is accepted
        if (response.status !== 0 && response.status !== undefined) {
          setShowWarning(false)
          clearTimeout(timeoutId)
          return
        }
      } catch (error: any) {
        // Network errors (including certificate errors) will throw
        // ERR_CERT_AUTHORITY_INVALID is the specific Chrome error
        if (
          error.name === "AbortError" ||
          error.message === "Failed to fetch" ||
          error.message?.includes("network") ||
          error.message?.includes("certificate") ||
          error.message?.includes("ERR_CERT_AUTHORITY_INVALID")
        ) {
          // Likely a certificate issue - show warning
          setShowWarning(true)
        }
      }
    }

    // Test immediately and after page loads
    testConnection()
    const timer = setTimeout(testConnection, 2000)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
      console.error = originalError
    }
  }, [])

  if (!showWarning || !supabaseUrl) return null

  return (
    <Alert className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl mx-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 shadow-lg">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
        <span>Certificate Not Accepted</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowWarning(false)}
          className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2 text-yellow-700 dark:text-yellow-300">
        <p>
          Your browser hasn't accepted the self-signed certificate for Supabase.
          This is required for local development.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Open in same window to trigger certificate acceptance flow
              window.location.href = supabaseUrl
            }}
            className="w-fit border-yellow-600 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Accept Certificate
          </Button>
          <span className="text-sm">
            Click above, then click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"
          </span>
        </div>
        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
          <strong>Step-by-step:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Click "Accept Certificate" button above</li>
            <li>You'll see a security warning page</li>
            <li>Click "Advanced" or "Show Details"</li>
            <li>Click "Proceed to 127.0.0.1 (unsafe)" or "Accept the Risk and Continue"</li>
            <li>Come back to this page and refresh (F5 or Cmd+R)</li>
          </ol>
        </div>
        <p className="text-xs mt-2 opacity-75 font-mono">
          {supabaseUrl}
        </p>
      </AlertDescription>
    </Alert>
  )
}
