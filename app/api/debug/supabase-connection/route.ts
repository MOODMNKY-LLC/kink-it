/**
 * Debug endpoint to test Supabase connectivity
 * Helps diagnose certificate and connection issues
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    // Test 1: Check environment variables
    const envCheck = {
      hasUrl: !!supabaseUrl,
      url: supabaseUrl,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlMatches: supabaseUrl?.includes("127.0.0.1") || false,
    }

    // Test 2: Try to get user (tests auth endpoint)
    let authTest = { success: false, error: null as any }
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      authTest = {
        success: !error && !!user,
        error: error ? { message: error.message, status: (error as any).status } : null,
      }
    } catch (err: any) {
      authTest.error = { message: err.message, type: err.constructor.name }
    }

    // Test 3: Try a simple query (tests REST endpoint)
    let queryTest = { success: false, error: null as any }
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1)
      queryTest = {
        success: !error,
        error: error ? { message: error.message, code: error.code } : null,
      }
    } catch (err: any) {
      queryTest.error = { message: err.message, type: err.constructor.name }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      authTest,
      queryTest,
      recommendations: getRecommendations(envCheck, authTest, queryTest),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to run diagnostics",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

function getRecommendations(
  envCheck: any,
  authTest: any,
  queryTest: any
): string[] {
  const recommendations: string[] = []

  if (!envCheck.hasUrl) {
    recommendations.push("❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local")
  }

  if (envCheck.url && !envCheck.urlMatches) {
    recommendations.push(
      "⚠️ Supabase URL should use 127.0.0.1 (not localhost) for local development"
    )
  }

  if (authTest.error || queryTest.error) {
    recommendations.push(
      "🔒 Browser may be blocking requests - accept certificate for https://127.0.0.1:55321"
    )
    recommendations.push(
      "🌐 Make sure you're accessing the app via https://127.0.0.1:3000 (not localhost)"
    )
    recommendations.push("🔄 Try clearing browser cache and restarting dev server")
  }

  if (authTest.success && queryTest.success) {
    recommendations.push("✅ All tests passed! Supabase connection is working.")
  }

  return recommendations
}
