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
  const [dismissed, setDismissed] = useState(false)

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
        // Filter out empty error objects from args before processing
        const filteredArgs = args.filter(arg => {
          // Keep strings, Errors, and non-empty objects
          if (typeof arg === 'string') return true
          if (arg instanceof Error) return true
          if (arg === null || arg === undefined) return false
          // Skip empty objects (but keep objects with properties)
          if (typeof arg === 'object' && Object.keys(arg).length === 0) return false
          return true
        })
        
        // If all args were filtered out (all empty/null/undefined), just pass through
        if (filteredArgs.length === 0) {
          originalError.apply(console, args)
          return
        }
        
        const message = filteredArgs.map(arg => {
          // Skip undefined/null arguments to avoid "undefined" string errors
          if (arg === undefined || arg === null) return ""
          if (typeof arg === 'string') return arg
          if (arg instanceof Error) return arg.message
          if (typeof arg === 'object') return arg.message || (Object.keys(arg).length > 0 ? JSON.stringify(arg) : "")
          return String(arg)
        }).filter(msg => msg.trim() !== "").join(" ")
        const stack = filteredArgs.find(arg => typeof arg === 'object' && arg?.stack)?.stack || ""
        
        // Only show certificate warning for actual certificate/network errors, not all Supabase errors
        // CRITICAL: Skip empty error objects completely - they're handled by components using console.warn
        // Skip database schema errors (PGRST205, table not found, etc.) - these are not certificate issues
        // Skip generic backend save errors - these are not certificate issues
        // Only trigger on explicit certificate/network error messages
        const isDatabaseSchemaError = (
          message.includes("PGRST204") ||
          message.includes("PGRST205") ||
          message.includes("Could not find the table") ||
          message.includes("Could not find the") && message.includes("column") ||
          message.includes("table") && message.includes("schema cache") ||
          message.includes("relation") && message.includes("does not exist") ||
          message.includes("column") && message.includes("schema cache")
        )
        
        const isGenericBackendError = (
          message.includes("Failed to save progress to backend") ||
          message.includes("Failed to save") ||
          message.includes("Error saving progress")
        )
        
        const isEdgeFunctionError = (
          message.includes("Cannot connect to Edge Function") ||
          message.includes("Edge Function not found") ||
          message.includes("functions:serve") ||
          message.includes("supabase functions serve") ||
          message.includes("SSE connection error") ||
          message.includes("SSE error details")
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
          // CRITICAL: Never trigger on database schema errors, generic backend errors, or Edge Function errors
          !isDatabaseSchemaError &&
          !isGenericBackendError &&
          !isEdgeFunctionError &&
          // Must have actual error message content (not just empty objects)
          message.trim().length > 0
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
    // Only show warning if we get explicit certificate errors
    const testConnection = async () => {
      try {
        // Try to fetch the Supabase REST API root endpoint
        // This endpoint exists and will return 200 even without auth
        // Certificate errors will cause this to fail
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        // Use the REST API endpoint which is more reliable than /auth/v1/health
        // Construct proper URL - ensure we have a valid endpoint
        let apiUrl = url.replace(/\/auth\/v1.*$/, '/rest/v1/')
        // If URL doesn't end with /, add it
        if (!apiUrl.endsWith('/')) {
          apiUrl = apiUrl + '/'
        }
        
        // Suppress CORS errors in console - they're expected and don't indicate certificate issues
        // CORS errors happen AFTER certificate acceptance, so they're actually a good sign
        let response: Response | null = null
        try {
          // Use 'no-cors' mode to prevent CORS errors from appearing in console
          // This still allows us to test connectivity (certificate errors will still fail)
          // CORS errors are expected and don't indicate certificate issues
          response = await fetch(apiUrl, {
            method: "GET",
            signal: controller.signal,
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            },
            // Use 'no-cors' to prevent CORS errors from appearing in console
            // Certificate errors will still be caught (they prevent connection entirely)
            mode: 'no-cors',
          }).catch(() => null) // Silently catch any errors
        } catch (fetchError) {
          // Silently catch all fetch errors - we'll analyze them below
          response = null
        }

        clearTimeout(timeoutId)
        
        // With 'no-cors' mode, response.status will be 0 (opaque response)
        // But if we get a response object (not null), it means connection succeeded
        // Certificate errors prevent any connection at all
        if (response !== null) {
          // Response exists = connection succeeded = certificate is working
          // Note: With 'no-cors', we can't read status, but connection success is enough
          setShowWarning(false)
          return
        }
      } catch (error: any) {
        // Check if it's specifically a certificate error
        const errorMessage = error.message || error.toString() || ""
        const errorName = error.name || ""
        const errorStack = error.stack || ""
        
        // CRITICAL INSIGHT: CORS errors happen AFTER certificate acceptance
        // If we get a CORS error, the TLS handshake succeeded = certificate was accepted
        // Certificate errors prevent connection entirely - CORS happens AFTER connection
        
        // Check for CORS errors FIRST (these indicate certificates ARE working)
        const isCorsError = (
          errorMessage.includes("CORS") ||
          errorMessage.includes("Access-Control-Allow-Origin") ||
          errorMessage.includes("blocked by CORS policy") ||
          errorStack.includes("CORS") ||
          errorStack.includes("Access-Control")
        )
        
        // If it's a CORS error, certificates are working - hide warning
        if (isCorsError) {
          setShowWarning(false)
          return
        }
        
        // Certificate-specific errors - be VERY strict about detection
        // Only trigger on explicit certificate error messages
        const isCertError = (
          errorMessage.includes("ERR_CERT_AUTHORITY_INVALID") ||
          errorMessage.includes("ERR_CERT_INVALID") ||
          errorMessage.includes("ERR_CERT_REVOKED") ||
          errorMessage.includes("ERR_SSL_PROTOCOL_ERROR") ||
          errorMessage.includes("ERR_CERT") ||
          errorMessage.includes("CERT_AUTHORITY") ||
          errorMessage.includes("certificate") && errorMessage.includes("authority") ||
          errorMessage.includes("certificate") && errorMessage.includes("invalid")
        )
        
        // Network errors that aren't certificate errors (timeout, abort, etc.)
        const isNonCertError = (
          errorName === "AbortError" ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("aborted") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Network request failed")
        )
        
        // Only show warning for EXPLICIT certificate errors
        // Default to hiding warning if error is ambiguous
        if (isCertError && !isNonCertError) {
          setShowWarning(true)
        } else {
          // If it's not a clear certificate error, assume connection is working
          // "Failed to fetch" without certificate-specific details is ambiguous
          setShowWarning(false)
        }
      }
    }

    // Test after page loads (give browser time to initialize)
    // Test multiple times to catch certificate issues that might be intermittent
    const timer1 = setTimeout(testConnection, 1000)
    const timer2 = setTimeout(testConnection, 3000)
    const timer3 = setTimeout(testConnection, 5000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
      console.error = originalError
    }
  }, [])

  // Check if user has dismissed the warning (stored in sessionStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissedValue = sessionStorage.getItem('certificate-warning-dismissed')
      if (dismissedValue === 'true') {
        setDismissed(true)
        setShowWarning(false)
      }
    }
  }, [])

  if (!showWarning || !supabaseUrl || dismissed) return null

  return (
    <Alert className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl mx-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 shadow-lg">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
        <span>Certificate Not Accepted</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowWarning(false)
              setDismissed(true)
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('certificate-warning-dismissed', 'true')
              }
            }}
            className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
            title="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs border border-blue-200 dark:border-blue-800">
          <strong>💡 Already imported certificate?</strong>
          <p className="mt-1">
            If you've already imported the mkcert root CA into Windows certificate store, 
            try restarting your browser completely (close all windows). 
            The certificate should be trusted automatically.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
